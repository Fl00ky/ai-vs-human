-- Squads: sub-faction groups. A squad belongs to ONE side (no mixed squads),
-- so it organizes the AI-vs-Human war instead of fragmenting it. Squad score
-- is the sum of members' season_score, so squads race per season like the war.

create table if not exists squads (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  tag        text not null unique,
  side       team_side not null,
  leader_id  uuid references profiles(id) on delete set null,
  member_cap int not null default 30,
  created_at timestamptz default now()
);

alter table profiles
  add column if not exists squad_id uuid references squads(id) on delete set null;

alter table squads enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='squads' and policyname='Squads readable') then
    create policy "Squads readable" on squads for select using (true);
  end if;
end $$;

-- Per-squad aggregate + overall rank by season_score.
create or replace view squad_score_view as
select
  s.id, s.name, s.tag, s.side, s.leader_id, s.member_cap,
  count(p.id)::int as members,
  coalesce(sum(p.season_score), 0)::int as score,
  rank() over (order by coalesce(sum(p.season_score), 0) desc) as rank
from squads s
left join profiles p on p.squad_id = s.id
group by s.id;

-- Add squad tag to the player leaderboard (additive column).
create or replace view leaderboard_view as
select
  p.id, p.username, p.side, p.total_score,
  rank() over (order by p.total_score desc) as rank,
  sq.tag as squad_tag
from profiles p
left join squads sq on sq.id = p.squad_id;

-- Create a squad. Founder's side defines the squad; founder becomes leader.
create or replace function create_squad(p_name text, p_tag text)
returns json language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  me  profiles%rowtype;
  norm_tag text := upper(regexp_replace(coalesce(p_tag,''), '[^a-zA-Z0-9]', '', 'g'));
  new_id uuid;
begin
  if uid is null then return json_build_object('error','not_authenticated'); end if;
  select * into me from profiles where id = uid for update;
  if not found then return json_build_object('error','no_profile'); end if;
  if me.squad_id is not null then return json_build_object('error','already_in_squad'); end if;
  if char_length(trim(coalesce(p_name,''))) < 3 or char_length(p_name) > 24 then
    return json_build_object('error','bad_name'); end if;
  if char_length(norm_tag) < 2 or char_length(norm_tag) > 5 then
    return json_build_object('error','bad_tag'); end if;
  if exists (select 1 from squads where tag = norm_tag) then
    return json_build_object('error','tag_taken'); end if;

  insert into squads (name, tag, side, leader_id)
  values (trim(p_name), norm_tag, me.side, uid)
  returning id into new_id;

  update profiles set squad_id = new_id where id = uid;
  return json_build_object('ok', true, 'id', new_id, 'tag', norm_tag);
end; $$;

-- Join a squad by tag. Must match faction and respect the member cap.
create or replace function join_squad(p_tag text)
returns json language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  me  profiles%rowtype;
  sq  squads%rowtype;
  cnt int;
begin
  if uid is null then return json_build_object('error','not_authenticated'); end if;
  select * into me from profiles where id = uid for update;
  if not found then return json_build_object('error','no_profile'); end if;
  if me.squad_id is not null then return json_build_object('error','already_in_squad'); end if;

  select * into sq from squads where tag = upper(p_tag);
  if not found then return json_build_object('error','not_found'); end if;
  if sq.side <> me.side then return json_build_object('error','wrong_faction'); end if;

  select count(*) into cnt from profiles where squad_id = sq.id;
  if cnt >= sq.member_cap then return json_build_object('error','squad_full'); end if;

  update profiles set squad_id = sq.id where id = uid;
  return json_build_object('ok', true, 'id', sq.id, 'tag', sq.tag);
end; $$;

-- Leave the squad. A departing leader passes leadership on, or disbands if alone.
create or replace function leave_squad()
returns json language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  me  profiles%rowtype;
  sq  squads%rowtype;
  heir uuid;
begin
  if uid is null then return json_build_object('error','not_authenticated'); end if;
  select * into me from profiles where id = uid for update;
  if not found or me.squad_id is null then return json_build_object('error','not_in_squad'); end if;

  select * into sq from squads where id = me.squad_id;
  update profiles set squad_id = null where id = uid;

  if sq.leader_id = uid then
    select id into heir from profiles where squad_id = sq.id and id <> uid limit 1;
    if heir is null then
      delete from squads where id = sq.id;          -- last member left
    else
      update squads set leader_id = heir where id = sq.id;
    end if;
  end if;
  return json_build_object('ok', true);
end; $$;

-- Leader kicks a member.
create or replace function kick_member(p_target uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  sq  squads%rowtype;
  tgt profiles%rowtype;
begin
  if uid is null then return json_build_object('error','not_authenticated'); end if;
  select * into tgt from profiles where id = p_target;
  if not found or tgt.squad_id is null then return json_build_object('error','not_in_squad'); end if;
  select * into sq from squads where id = tgt.squad_id;
  if sq.leader_id <> uid then return json_build_object('error','not_leader'); end if;
  if p_target = uid then return json_build_object('error','cannot_kick_self'); end if;

  update profiles set squad_id = null where id = p_target;
  return json_build_object('ok', true);
end; $$;

grant execute on function create_squad(text,text) to authenticated;
grant execute on function join_squad(text)         to authenticated;
grant execute on function leave_squad()            to authenticated;
grant execute on function kick_member(uuid)        to authenticated;
