-- Referral milestones + anti-abuse via activity qualification.
--
-- Abuse model: a referral only counts for the recruiter once the recruit shows
-- real activity (plays at least one game). The recruit gets a small instant
-- welcome bonus; the recruiter's reward + milestone credit are deferred until
-- qualification. This makes fake-account farming pointless (each fake would
-- have to actually play).

alter table profiles
  add column if not exists referral_count     int     not null default 0,  -- qualified referrals
  add column if not exists referral_qualified boolean not null default false;

-- Milestone payout ledger (dedup so a tier is paid once).
create table if not exists referral_milestones (
  user_id    uuid references profiles(id) on delete cascade,
  milestone  int not null,
  reward     int not null,
  claimed_at timestamptz default now(),
  primary key (user_id, milestone)
);
alter table referral_milestones enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='referral_milestones' and policyname='ref milestones readable') then
    create policy "ref milestones readable" on referral_milestones for select using (true);
  end if;
end $$;

-- Award any newly-reached milestones to a recruiter.
create or replace function award_referral_milestones(recruiter uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  cnt  int;
  tier record;
begin
  select referral_count into cnt from profiles where id = recruiter;
  for tier in
    select * from (values (5,1000),(10,2500),(30,10000),(50,20000),(100,50000))
      as m(threshold, reward)
  loop
    if cnt >= tier.threshold
       and not exists (select 1 from referral_milestones where user_id = recruiter and milestone = tier.threshold)
    then
      insert into referral_milestones (user_id, milestone, reward)
        values (recruiter, tier.threshold, tier.reward);
      update profiles
         set total_score  = total_score  + tier.reward,
             season_score = season_score + tier.reward
       where id = recruiter;
    end if;
  end loop;
end; $$;

-- Redeem: link recruit -> recruiter, give recruit a small instant bonus.
-- Recruiter is NOT paid here; that happens on qualification.
create or replace function redeem_referral(code text)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  uid       uuid := auth.uid();
  me        profiles%rowtype;
  recruiter profiles%rowtype;
  welcome   int := 200;
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
     set total_score = total_score + welcome, season_score = season_score + welcome
   where id = uid;

  return json_build_object('ok', true, 'bonus', welcome, 'recruiter', recruiter.username);
end;
$$;

-- Qualification: the recruit's first game credits the recruiter once.
create or replace function qualify_referral()
returns trigger
language plpgsql security definer set search_path = public as $$
declare rec profiles%rowtype;
begin
  select * into rec from profiles where id = new.user_id;
  if rec.referred_by is not null and not rec.referral_qualified then
    update profiles set referral_qualified = true where id = rec.id;
    update profiles
       set referral_count = referral_count + 1,
           total_score    = total_score  + 500,
           season_score   = season_score + 500
     where id = rec.referred_by;
    perform award_referral_milestones(rec.referred_by);
  end if;
  return new;
end; $$;

drop trigger if exists trg_qualify_referral on game_scores;
create trigger trg_qualify_referral
  after insert on game_scores
  for each row execute function qualify_referral();

grant execute on function redeem_referral(text) to authenticated;
