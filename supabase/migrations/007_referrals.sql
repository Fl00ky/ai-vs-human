-- Referrals: recruit friends to your faction. Both sides get a one-time bonus
-- that also feeds season_score (helps the faction win the season).

alter table profiles
  add column if not exists referral_code text unique,
  add column if not exists referred_by   uuid references profiles(id);

-- Short random code generator.
create or replace function gen_ref_code()
returns text language sql as $$
  select upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
$$;

-- Backfill codes for existing profiles.
update profiles set referral_code = gen_ref_code() where referral_code is null;

-- New users get a code automatically (extends existing handle_new_user).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, side, total_score, referral_code)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    (new.raw_user_meta_data->>'side')::team_side,
    0,
    gen_ref_code()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Redeem a referral once. Awards both the recruit and the recruiter.
create or replace function redeem_referral(code text)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  uid       uuid := auth.uid();
  me        profiles%rowtype;
  recruiter profiles%rowtype;
  bonus     int := 500;
begin
  if uid is null then return json_build_object('error', 'not_authenticated'); end if;

  select * into me from profiles where id = uid for update;
  if not found then return json_build_object('error', 'no_profile'); end if;
  if me.referred_by is not null then return json_build_object('error', 'already_referred'); end if;

  select * into recruiter from profiles where referral_code = upper(code);
  if not found then return json_build_object('error', 'invalid_code'); end if;
  if recruiter.id = uid then return json_build_object('error', 'self_referral'); end if;

  update profiles set referred_by = recruiter.id where id = uid;

  update profiles
     set total_score = total_score + bonus, season_score = season_score + bonus
   where id in (uid, recruiter.id);

  return json_build_object('ok', true, 'bonus', bonus, 'recruiter', recruiter.username);
end;
$$;

grant execute on function redeem_referral(text) to authenticated;
