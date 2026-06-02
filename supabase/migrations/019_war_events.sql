-- Live war events. Two types:
--   surge: a multiplier on points earned from games during the window.
--   raid:  a collective faction goal (target points) to hit before the deadline.
-- Admin-created. Surge bonus is applied server-side as a SEPARATE bonus so it
-- never inflates game_scores.score (keeps achievement thresholds honest).

create table if not exists war_events (
  id         uuid primary key default gen_random_uuid(),
  type       text not null check (type in ('surge','raid')),
  title      text not null,
  multiplier numeric(3,1) not null default 2.0,   -- surge
  target     int,                                  -- raid goal
  side       team_side,                            -- raid: which faction (null = combined)
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz not null,
  finalized  boolean not null default false,
  created_at timestamptz default now()
);

alter table war_events enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='war_events' and policyname='Events readable') then
    create policy "Events readable" on war_events for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='war_events' and policyname='admin manage events') then
    create policy "admin manage events" on war_events for all using (is_admin()) with check (is_admin());
  end if;
end $$;

-- Live points contributed during a raid window (real game performance).
create or replace function raid_progress(p_event uuid)
returns int language sql security definer set search_path = public stable as $$
  select coalesce(sum(g.score), 0)::int
  from game_scores g
  join war_events e on e.id = p_event
  left join profiles p on p.id = g.user_id
  where g.played_at >= e.starts_at and g.played_at <= e.ends_at
    and (e.side is null or p.side = e.side);
$$;

-- The currently active event (now within window), with raid progress.
create or replace function current_event()
returns json language plpgsql security definer set search_path = public stable as $$
declare e war_events%rowtype;
begin
  select * into e from war_events
   where now() >= starts_at and now() <= ends_at
   order by starts_at desc limit 1;
  if not found then return null; end if;
  return json_build_object(
    'id', e.id, 'type', e.type, 'title', e.title,
    'multiplier', e.multiplier, 'target', e.target, 'side', e.side,
    'starts_at', e.starts_at, 'ends_at', e.ends_at,
    'progress', case when e.type = 'raid' then raid_progress(e.id) else 0 end
  );
end; $$;
grant execute on function current_event() to authenticated, anon;

-- Current game-score multiplier from an active surge (1 if none).
create or replace function event_multiplier()
returns numeric language sql security definer set search_path = public stable as $$
  select coalesce((
    select multiplier from war_events
     where type = 'surge' and now() >= starts_at and now() <= ends_at
     order by starts_at desc limit 1
  ), 1.0);
$$;

-- Apply the surge bonus for the caller, given the real base score. Server-side
-- authoritative (uses event_multiplier, not a client value).
create or replace function apply_surge_bonus(p_base int)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); mult numeric; bonus int;
begin
  if uid is null then return json_build_object('bonus', 0); end if;
  mult := event_multiplier();
  if mult <= 1 or p_base <= 0 then return json_build_object('bonus', 0, 'multiplier', mult); end if;
  bonus := round(p_base * (mult - 1))::int;
  update profiles set total_score = total_score + bonus, season_score = season_score + bonus where id = uid;
  return json_build_object('bonus', bonus, 'multiplier', mult);
end; $$;
grant execute on function apply_surge_bonus(int) to authenticated;

-- Admin: pay out a completed raid once (flat bonus to each contributor).
create or replace function finalize_raid(p_event uuid)
returns json language plpgsql security definer set search_path = public as $$
declare e war_events%rowtype; prog int; payout int := 500; n int;
begin
  if not is_admin() then return json_build_object('error','forbidden'); end if;
  select * into e from war_events where id = p_event;
  if not found or e.type <> 'raid' then return json_build_object('error','not_raid'); end if;
  if e.finalized then return json_build_object('error','already'); end if;
  prog := raid_progress(p_event);
  if e.target is not null and prog < e.target then return json_build_object('error','not_reached','progress',prog); end if;

  with contributors as (
    select distinct g.user_id
    from game_scores g
    left join profiles p on p.id = g.user_id
    where g.played_at >= e.starts_at and g.played_at <= e.ends_at
      and (e.side is null or p.side = e.side)
  )
  update profiles pr
     set total_score = total_score + payout, season_score = season_score + payout
   from contributors c
   where pr.id = c.user_id;
  get diagnostics n = row_count;

  update war_events set finalized = true where id = p_event;
  return json_build_object('ok', true, 'paid', n, 'payout', payout);
end; $$;
grant execute on function finalize_raid(uuid) to authenticated;
