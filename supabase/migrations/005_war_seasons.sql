-- War Seasons: time-boxed faction race with a winner and a reset.
-- total_score stays lifetime (personal rank, score achievements). season_score
-- is the per-season battle metric, reset at each rollover. Rollover is lazy:
-- triggered on read via get_season_state(), so no scheduler is needed.

-- 1. Per-season battle score, mirrors total_score increments.
alter table profiles
  add column if not exists season_score int not null default 0;

-- 2. Seasons table.
create table if not exists seasons (
  id         uuid primary key default gen_random_uuid(),
  number     int  not null,
  started_at timestamptz not null default now(),
  ends_at    timestamptz not null,
  status     text not null default 'active' check (status in ('active', 'ended')),
  winner     team_side,
  ai_score   int  not null default 0,
  human_score int not null default 0
);

-- 3. Record of which users were on a winning side (for season badges).
create table if not exists season_wins (
  user_id   uuid references profiles(id) on delete cascade,
  season_id uuid references seasons(id) on delete cascade,
  side      team_side not null,
  won_at    timestamptz default now(),
  primary key (user_id, season_id)
);

alter table seasons     enable row level security;
alter table season_wins enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='seasons' and policyname='Seasons readable') then
    create policy "Seasons readable" on seasons for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='season_wins' and policyname='Season wins readable') then
    create policy "Season wins readable" on season_wins for select using (true);
  end if;
end $$;

-- 4. Seed season #1 (7-day) if no season exists.
insert into seasons (number, started_at, ends_at, status)
select 1, now(), now() + interval '7 days', 'active'
where not exists (select 1 from seasons);

-- 5. Mirror every point grant into season_score.
create or replace function add_score_to_profile()
returns trigger as $$
begin
  update profiles
     set total_score  = total_score  + new.score,
         season_score = season_score + new.score
   where id = new.user_id;
  return new;
end;
$$ language plpgsql;

create or replace function add_quest_reward()
returns trigger as $$
declare reward_pts int;
begin
  select reward into reward_pts from quests where id = new.quest_id;
  update profiles
     set total_score  = total_score  + reward_pts,
         season_score = season_score + reward_pts
   where id = new.user_id;
  return new;
end;
$$ language plpgsql;

create or replace function add_achievement_bonus()
returns trigger as $$
declare bonus_pts int;
begin
  select points into bonus_pts from achievements where id = new.achievement_id;
  update profiles
     set total_score  = total_score  + bonus_pts,
         season_score = season_score + bonus_pts
   where id = new.user_id;
  return new;
end;
$$ language plpgsql;

-- 6. Daily reward also feeds season_score.
create or replace function claim_daily_reward()
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  uid        uuid := auth.uid();
  today      date := (now() at time zone 'utc')::date;
  prof       profiles%rowtype;
  new_streak int;
  reward     int;
begin
  if uid is null then return json_build_object('error', 'not_authenticated'); end if;

  select * into prof from profiles where id = uid for update;
  if not found then return json_build_object('error', 'no_profile'); end if;

  if prof.last_checkin = today then
    return json_build_object('already', true, 'streak', prof.current_streak,
      'longest', prof.longest_streak, 'reward', 0, 'total_score', prof.total_score);
  end if;

  if prof.last_checkin = today - 1 then
    new_streak := prof.current_streak + 1;
  else
    new_streak := 1;
  end if;

  reward := least(50 + (new_streak - 1) * 25, 300);

  update profiles
     set current_streak = new_streak,
         longest_streak = greatest(longest_streak, new_streak),
         last_checkin   = today,
         total_score    = total_score  + reward,
         season_score   = season_score + reward
   where id = uid;

  return json_build_object('already', false, 'streak', new_streak,
    'longest', greatest(prof.longest_streak, new_streak),
    'reward', reward, 'total_score', prof.total_score + reward);
end;
$$;

-- 7. Lazy rollover + state. Ends an expired season (snapshot, winner, badges,
-- reset season_score, open next season) then returns the current state.
create or replace function get_season_state()
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  uid          uuid := auth.uid();
  s            seasons%rowtype;
  ai_total     int;
  human_total  int;
  win          team_side;
  last_row     seasons%rowtype;
  my_wins      int := 0;
begin
  -- Serialize rollover across concurrent callers.
  perform pg_advisory_xact_lock(948271);

  select * into s from seasons where status = 'active' order by number desc limit 1;

  -- No active season? open one.
  if not found then
    insert into seasons (number, started_at, ends_at, status)
    values (coalesce((select max(number) from seasons), 0) + 1, now(), now() + interval '7 days', 'active')
    returning * into s;
  end if;

  -- Expired -> roll over.
  if s.ends_at <= now() then
    select coalesce(sum(season_score) filter (where side = 'ai'), 0),
           coalesce(sum(season_score) filter (where side = 'human'), 0)
      into ai_total, human_total
      from profiles;

    win := case
             when ai_total > human_total then 'ai'::team_side
             when human_total > ai_total then 'human'::team_side
             else null
           end;

    update seasons
       set status = 'ended', winner = win, ai_score = ai_total, human_score = human_total
     where id = s.id;

    if win is not null then
      insert into season_wins (user_id, season_id, side)
        select id, s.id, win from profiles where side = win and season_score > 0
        on conflict do nothing;
    end if;

    update profiles set season_score = 0;

    insert into seasons (number, started_at, ends_at, status)
    values (s.number + 1, now(), now() + interval '7 days', 'active')
    returning * into s;
  end if;

  -- Current live season totals.
  select coalesce(sum(season_score) filter (where side = 'ai'), 0),
         coalesce(sum(season_score) filter (where side = 'human'), 0)
    into ai_total, human_total
    from profiles;

  -- Most recent ended season (for the winner banner).
  select * into last_row from seasons where status = 'ended' order by number desc limit 1;

  if uid is not null then
    select count(*) into my_wins from season_wins where user_id = uid;
  end if;

  return json_build_object(
    'number',      s.number,
    'started_at',  s.started_at,
    'ends_at',     s.ends_at,
    'ai_score',    ai_total,
    'human_score', human_total,
    'my_wins',     my_wins,
    'last', case when last_row.id is null then null else json_build_object(
      'number',      last_row.number,
      'winner',      last_row.winner,
      'ai_score',    last_row.ai_score,
      'human_score', last_row.human_score
    ) end
  );
end;
$$;

grant execute on function get_season_state() to authenticated, anon;
