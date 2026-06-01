-- Daily check-in streak + reward.
-- Reward grows with the streak and is added to total_score, which feeds the
-- faction war via team_score_view. Idempotent per day (UTC).

alter table profiles
  add column if not exists current_streak int  not null default 0,
  add column if not exists longest_streak int  not null default 0,
  add column if not exists last_checkin   date;

-- Atomic claim. Uses auth.uid() so it can't be spoofed; security definer to
-- bypass RLS on the score update. Returns JSON describing the result.
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
  if uid is null then
    return json_build_object('error', 'not_authenticated');
  end if;

  select * into prof from profiles where id = uid for update;
  if not found then
    return json_build_object('error', 'no_profile');
  end if;

  -- Already claimed today -> no-op, report current state.
  if prof.last_checkin = today then
    return json_build_object(
      'already',     true,
      'streak',      prof.current_streak,
      'longest',     prof.longest_streak,
      'reward',      0,
      'total_score', prof.total_score
    );
  end if;

  -- Consecutive day extends the streak; any gap resets to 1.
  if prof.last_checkin = today - 1 then
    new_streak := prof.current_streak + 1;
  else
    new_streak := 1;
  end if;

  -- Base 50, +25 per streak day, capped at 300.
  reward := least(50 + (new_streak - 1) * 25, 300);

  update profiles
     set current_streak = new_streak,
         longest_streak = greatest(longest_streak, new_streak),
         last_checkin   = today,
         total_score    = total_score + reward
   where id = uid;

  return json_build_object(
    'already',     false,
    'streak',      new_streak,
    'longest',     greatest(prof.longest_streak, new_streak),
    'reward',      reward,
    'total_score', prof.total_score + reward
  );
end;
$$;

grant execute on function claim_daily_reward() to authenticated;
