-- Idle RPG "Agent". Server-authoritative: all gains are computed from the
-- agent's server-stored stats x real elapsed time, capped per tick. Closing the
-- tab stops heartbeats -> no progress (enforces "keep the tab open") and makes
-- client-side cheating impossible (can't fast-forward wall-clock).
--
-- Economy: a share of farmed shards also flows to season_score + total_score,
-- so idle farming continuously feeds the player's faction in the war.

create table if not exists agents (
  user_id        uuid primary key references profiles(id) on delete cascade,
  level          int  not null default 1,
  xp             int  not null default 0,
  shards         bigint not null default 0,
  power          int  not null default 0,
  war_contributed bigint not null default 0,
  last_tick      timestamptz not null default now(),
  last_overclock timestamptz not null default (now() - interval '1 hour')
);

alter table agents enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='agents' and policyname='Own agent read') then
    create policy "Own agent read" on agents for select using (auth.uid() = user_id);
  end if;
end $$;

-- Constants: CAP 120s/tick, war share 20%, rate = level * (1 + 0.5*power) shards/s.
-- xp to next level = 100 * level.

create or replace function agent_state_json(a agents)
returns json language sql stable as $$
  select json_build_object(
    'level', a.level, 'xp', a.xp, 'xp_needed', 100 * a.level,
    'shards', a.shards, 'power', a.power,
    'rate', (a.level * (1 + 0.5 * a.power)),
    'war_contributed', a.war_contributed,
    'overclock_ready_in', greatest(0, 300 - extract(epoch from (now() - a.last_overclock))::int)
  );
$$;

-- Apply earnings to an agent record (mutates via the caller's UPDATE). Returns
-- the gained shards. Shared by tick and overclock.
create or replace function agent_apply(p_uid uuid, p_seconds numeric)
returns json language plpgsql security definer set search_path = public as $$
declare a agents%rowtype; rate numeric; gained bigint; war bigint;
begin
  select * into a from agents where user_id = p_uid for update;
  rate := a.level * (1 + 0.5 * a.power);
  gained := floor(rate * p_seconds)::bigint;
  if gained < 0 then gained := 0; end if;

  a.shards := a.shards + gained;
  a.xp := a.xp + gained::int;
  -- auto-level (passive progression)
  while a.xp >= 100 * a.level loop
    a.xp := a.xp - 100 * a.level;
    a.level := a.level + 1;
  end loop;

  war := floor(gained * 0.2)::bigint;
  a.war_contributed := a.war_contributed + war;

  update agents set level = a.level, xp = a.xp, shards = a.shards,
                    war_contributed = a.war_contributed
   where user_id = p_uid;
  if war > 0 then
    update profiles set season_score = season_score + war, total_score = total_score + war
     where id = p_uid;
  end if;
  return json_build_object('gained', gained, 'war', war);
end; $$;

-- Heartbeat: credit elapsed time (capped), then return state.
create or replace function agent_tick()
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); a agents%rowtype; secs numeric; applied json;
begin
  if uid is null then return json_build_object('error','not_authenticated'); end if;
  insert into agents (user_id) values (uid) on conflict (user_id) do nothing;
  select * into a from agents where user_id = uid;
  secs := least(extract(epoch from (now() - a.last_tick)), 120);
  if secs < 0 then secs := 0; end if;
  applied := agent_apply(uid, secs);
  update agents set last_tick = now() where user_id = uid;
  select * into a from agents where user_id = uid;
  return (select agent_state_json(a)::jsonb || jsonb_build_object('gained', (applied->>'gained')::bigint))::json;
end; $$;
grant execute on function agent_tick() to authenticated;

-- Spend shards to raise power (higher farm rate). cost = 50*(power+1)^2.
create or replace function agent_upgrade()
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); a agents%rowtype; cost bigint;
begin
  if uid is null then return json_build_object('error','not_authenticated'); end if;
  select * into a from agents where user_id = uid for update;
  if not found then return json_build_object('error','no_agent'); end if;
  cost := 50 * (a.power + 1) * (a.power + 1);
  if a.shards < cost then return json_build_object('error','insufficient','cost',cost); end if;
  update agents set shards = shards - cost, power = power + 1 where user_id = uid;
  select * into a from agents where user_id = uid;
  return agent_state_json(a);
end; $$;
grant execute on function agent_upgrade() to authenticated;

-- Overclock: instant burst = 60s of farming. 5-minute cooldown.
create or replace function agent_overclock()
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); a agents%rowtype;
begin
  if uid is null then return json_build_object('error','not_authenticated'); end if;
  select * into a from agents where user_id = uid for update;
  if not found then return json_build_object('error','no_agent'); end if;
  if extract(epoch from (now() - a.last_overclock)) < 300 then
    return json_build_object('error','cooldown',
      'ready_in', (300 - extract(epoch from (now() - a.last_overclock))::int));
  end if;
  perform agent_apply(uid, 60);
  update agents set last_overclock = now() where user_id = uid;
  select * into a from agents where user_id = uid;
  return agent_state_json(a);
end; $$;
grant execute on function agent_overclock() to authenticated;

-- Cost preview for the client (matches agent_upgrade).
create or replace function agent_upgrade_cost()
returns json language sql security definer set search_path = public stable as $$
  select json_build_object('cost', 50 * (coalesce((select power from agents where user_id = auth.uid()),0) + 1) *
    (coalesce((select power from agents where user_id = auth.uid()),0) + 1));
$$;
grant execute on function agent_upgrade_cost() to authenticated;
