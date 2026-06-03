-- Looter-RPG layer for the Agent: gear with rarity, equipment slots, ATK/DEF/HP,
-- time-charged loot chests, boss milestone drops. Server-authoritative.

alter table agents
  add column if not exists stage          int not null default 1,
  add column if not exists chests         int not null default 0,
  add column if not exists last_chest_at  timestamptz not null default now(),
  add column if not exists boss_level      int not null default 0; -- last boss milestone paid

create table if not exists agent_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade,
  slot       text not null check (slot in ('weapon','armor','implant','core','boots','shield')),
  rarity     text not null check (rarity in ('common','rare','epic','legendary')),
  item_power int not null,
  equipped   boolean not null default false,
  created_at timestamptz default now()
);
create index if not exists agent_items_user_idx on agent_items(user_id);

alter table agent_items enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='agent_items' and policyname='Own items read') then
    create policy "Own items read" on agent_items for select using (auth.uid() = user_id);
  end if;
end $$;

-- Sum of equipped item power.
create or replace function agent_gear_power(p_uid uuid)
returns int language sql stable security definer set search_path = public as $$
  select coalesce(sum(item_power), 0)::int from agent_items where user_id = p_uid and equipped;
$$;

-- Weighted rarity roll; better odds at higher level.
create or replace function roll_rarity(p_level int)
returns text language plpgsql as $$
declare r numeric := random(); b numeric := least(p_level, 200) / 8.0; -- luck bonus
begin
  if r < 0.02 + b*0.0008 then return 'legendary';
  elsif r < 0.12 + b*0.002 then return 'epic';
  elsif r < 0.40 + b*0.003 then return 'rare';
  else return 'common'; end if;
end; $$;

-- Generate one item for a user (slot random, power scales with level + rarity).
create or replace function grant_item(p_uid uuid, p_level int, p_min_rarity text default null)
returns json language plpgsql security definer set search_path = public as $$
declare
  slots text[] := array['weapon','armor','implant','core','boots','shield'];
  slot  text := slots[1 + floor(random()*6)::int];
  rar   text := coalesce(p_min_rarity, roll_rarity(p_level));
  mult  int  := case rar when 'legendary' then 8 when 'epic' then 4 when 'rare' then 2 else 1 end;
  pwr   int  := (5 + p_level) * mult + floor(random()*p_level)::int;
begin
  insert into agent_items (user_id, slot, rarity, item_power) values (p_uid, slot, rar, pwr);
  return json_build_object('slot', slot, 'rarity', rar, 'item_power', pwr);
end; $$;

-- Full state for the client (stats + gear + inventory + chests).
create or replace function agent_full_state()
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); a agents%rowtype; gp int;
begin
  if uid is null then return json_build_object('error','not_authenticated'); end if;
  select * into a from agents where user_id = uid;
  if not found then return json_build_object('error','no_agent'); end if;
  gp := agent_gear_power(uid);
  return json_build_object(
    'level', a.level, 'xp', a.xp, 'xp_needed', 100 * a.level,
    'shards', a.shards, 'power', a.power, 'stage', a.stage, 'chests', a.chests,
    'rate', round(a.level * (1 + 0.5*a.power) * (1 + 0.04*gp), 1),
    'atk', (a.level*10 + gp*6 + a.power*8),
    'def', (a.level*3 + gp*2),
    'hp',  (a.level*50 + gp*20),
    'gear_power', gp,
    'war_contributed', a.war_contributed,
    'overclock_ready_in', greatest(0, 300 - extract(epoch from (now() - a.last_overclock))::int),
    'equipped', coalesce((select json_object_agg(slot, json_build_object('id', id, 'rarity', rarity, 'power', item_power))
                          from agent_items where user_id = uid and equipped), '{}'::json),
    'inventory', coalesce((select json_agg(json_build_object('id', id, 'slot', slot, 'rarity', rarity, 'power', item_power) order by item_power desc)
                          from agent_items where user_id = uid and not equipped), '[]'::json)
  );
end; $$;
grant execute on function agent_full_state() to authenticated;

-- Earnings + chest charging + boss drops, then full state. Replaces agent_apply rate.
create or replace function agent_tick()
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); a agents%rowtype; secs numeric; rate numeric; gained bigint; war bigint; gp int; charge int;
begin
  if uid is null then return json_build_object('error','not_authenticated'); end if;
  insert into agents (user_id) values (uid) on conflict (user_id) do nothing;
  select * into a from agents where user_id = uid for update;

  secs := least(extract(epoch from (now() - a.last_tick)), 120);
  if secs < 0 then secs := 0; end if;
  gp := agent_gear_power(uid);
  rate := a.level * (1 + 0.5*a.power) * (1 + 0.04*gp);
  gained := floor(rate * secs)::bigint;

  a.shards := a.shards + gained;
  a.xp := a.xp + gained::int;
  while a.xp >= 100 * a.level loop
    a.xp := a.xp - 100 * a.level; a.level := a.level + 1;
  end loop;
  a.stage := greatest(a.stage, ceil(a.level / 5.0)::int);
  war := floor(gained * 0.2)::bigint;
  a.war_contributed := a.war_contributed + war;

  -- charge free chests: 1 per 300s of farming, cap 5
  charge := floor(extract(epoch from (now() - a.last_chest_at)) / 300)::int;
  if charge > 0 and a.chests < 5 then
    a.chests := least(5, a.chests + charge);
    a.last_chest_at := now();
  end if;

  update agents set level=a.level, xp=a.xp, shards=a.shards, stage=a.stage,
                    war_contributed=a.war_contributed, chests=a.chests,
                    last_chest_at=a.last_chest_at, last_tick=now()
   where user_id = uid;
  if war > 0 then
    update profiles set season_score = season_score + war, total_score = total_score + war where id = uid;
  end if;

  -- boss milestone: every 10 levels, guaranteed epic item
  if a.level / 10 > a.boss_level then
    perform grant_item(uid, a.level, 'epic');
    update agents set boss_level = a.level / 10 where user_id = uid;
  end if;

  return agent_full_state();
end; $$;

-- Open a charged chest -> roll an item.
create or replace function open_chest()
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); a agents%rowtype; item json;
begin
  if uid is null then return json_build_object('error','not_authenticated'); end if;
  select * into a from agents where user_id = uid for update;
  if a.chests <= 0 then return json_build_object('error','no_chests'); end if;
  update agents set chests = chests - 1 where user_id = uid;
  item := grant_item(uid, a.level);
  return json_build_object('ok', true, 'item', item);
end; $$;
grant execute on function open_chest() to authenticated;

-- Equip an item (one per slot).
create or replace function equip_item(p_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); it agent_items%rowtype;
begin
  if uid is null then return json_build_object('error','not_authenticated'); end if;
  select * into it from agent_items where id = p_id and user_id = uid;
  if not found then return json_build_object('error','not_found'); end if;
  update agent_items set equipped = false where user_id = uid and slot = it.slot;
  update agent_items set equipped = true where id = p_id;
  return agent_full_state();
end; $$;
grant execute on function equip_item(uuid) to authenticated;

-- Salvage an item for shards.
create or replace function salvage_item(p_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); it agent_items%rowtype;
begin
  if uid is null then return json_build_object('error','not_authenticated'); end if;
  select * into it from agent_items where id = p_id and user_id = uid;
  if not found then return json_build_object('error','not_found'); end if;
  delete from agent_items where id = p_id;
  update agents set shards = shards + it.item_power * 10 where user_id = uid;
  return agent_full_state();
end; $$;
grant execute on function salvage_item(uuid) to authenticated;
