-- Social promotion missions with proof submission + admin moderation.
-- Rewards can be large because each is human-verified (anti-abuse by review).

create table if not exists social_missions (
  id     text primary key,
  reward int  not null,
  active boolean not null default true
);

create table if not exists social_submissions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  mission_id  text references social_missions(id) on delete cascade,
  url         text not null,
  note        text,
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at  timestamptz default now(),
  reviewed_at timestamptz
);
create index if not exists social_sub_status_idx on social_submissions(status, created_at);
create index if not exists social_sub_user_idx on social_submissions(user_id);

alter table profiles
  add column if not exists social_approved int     not null default 0,
  add column if not exists is_ambassador   boolean not null default false;

alter table social_missions    enable row level security;
alter table social_submissions enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='social_missions' and policyname='Missions readable') then
    create policy "Missions readable" on social_missions for select using (true);
  end if;
  -- Users see their own submissions; admins see all.
  if not exists (select 1 from pg_policies where tablename='social_submissions' and policyname='Own or admin read') then
    create policy "Own or admin read" on social_submissions for select using (auth.uid() = user_id or is_admin());
  end if;
  if not exists (select 1 from pg_policies where tablename='social_submissions' and policyname='Insert own submission') then
    create policy "Insert own submission" on social_submissions for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- Seed mission catalog.
insert into social_missions (id, reward) values
  ('post_card',   200),
  ('share_story', 300),
  ('review',      400),
  ('video',      1500)
on conflict (id) do update set reward = excluded.reward;

-- User submits proof for a mission (one pending / one approved per mission).
create or replace function submit_social(p_mission text, p_url text, p_note text)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return json_build_object('error','not_authenticated'); end if;
  if not exists (select 1 from social_missions where id = p_mission and active) then
    return json_build_object('error','invalid_mission'); end if;
  if char_length(coalesce(p_url,'')) < 8 then return json_build_object('error','bad_url'); end if;
  if exists (select 1 from social_submissions where user_id = uid and mission_id = p_mission and status = 'approved') then
    return json_build_object('error','already_approved'); end if;
  if exists (select 1 from social_submissions where user_id = uid and mission_id = p_mission and status = 'pending') then
    return json_build_object('error','already_pending'); end if;

  insert into social_submissions (user_id, mission_id, url, note)
  values (uid, p_mission, p_url, nullif(p_note,''));
  return json_build_object('ok', true);
end; $$;
grant execute on function submit_social(text,text,text) to authenticated;

-- Admin approves/rejects. Approval awards once, updates ambassador status.
create or replace function review_submission(p_id uuid, p_approve boolean)
returns json language plpgsql security definer set search_path = public as $$
declare
  sub      social_submissions%rowtype;
  rew      int;
  approved int;
  amb_bonus int := 2000;
  amb_threshold int := 3;
begin
  if not is_admin() then return json_build_object('error','forbidden'); end if;
  select * into sub from social_submissions where id = p_id for update;
  if not found then return json_build_object('error','not_found'); end if;
  if sub.status <> 'pending' then return json_build_object('error','already_reviewed'); end if;

  if not p_approve then
    update social_submissions set status = 'rejected', reviewed_at = now() where id = p_id;
    return json_build_object('ok', true, 'status', 'rejected');
  end if;

  select reward into rew from social_missions where id = sub.mission_id;
  update social_submissions set status = 'approved', reviewed_at = now() where id = p_id;
  update profiles
     set total_score    = total_score    + rew,
         season_score   = season_score   + rew,
         social_approved = social_approved + 1
   where id = sub.user_id
  returning social_approved into approved;

  -- Ambassador promotion (one-time bonus).
  if approved >= amb_threshold then
    update profiles
       set is_ambassador = true,
           total_score  = case when is_ambassador then total_score  else total_score  + amb_bonus end,
           season_score = case when is_ambassador then season_score else season_score + amb_bonus end
     where id = sub.user_id;
  end if;

  return json_build_object('ok', true, 'status', 'approved', 'reward', rew);
end; $$;
grant execute on function review_submission(uuid, boolean) to authenticated;
