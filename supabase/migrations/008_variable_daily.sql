-- Variable daily reward: streak sets the base, randomness adds the dopamine.
-- ~5% chance of a 3x jackpot, otherwise 100%-160% of base.

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
  base       int;
  reward     int;
  jackpot    boolean := false;
begin
  if uid is null then return json_build_object('error', 'not_authenticated'); end if;

  select * into prof from profiles where id = uid for update;
  if not found then return json_build_object('error', 'no_profile'); end if;

  if prof.last_checkin = today then
    return json_build_object('already', true, 'streak', prof.current_streak,
      'longest', prof.longest_streak, 'reward', 0, 'jackpot', false,
      'total_score', prof.total_score);
  end if;

  if prof.last_checkin = today - 1 then
    new_streak := prof.current_streak + 1;
  else
    new_streak := 1;
  end if;

  base := least(50 + (new_streak - 1) * 25, 300);

  if random() < 0.05 then
    jackpot := true;
    reward  := base * 3;
  else
    -- 100%..160% of base
    reward := base + floor(random() * (base * 0.6))::int;
  end if;

  update profiles
     set current_streak = new_streak,
         longest_streak = greatest(longest_streak, new_streak),
         last_checkin   = today,
         total_score    = total_score  + reward,
         season_score   = season_score + reward
   where id = uid;

  return json_build_object('already', false, 'streak', new_streak,
    'longest', greatest(prof.longest_streak, new_streak),
    'reward', reward, 'jackpot', jackpot,
    'total_score', prof.total_score + reward);
end;
$$;
