-- Admin role. Authority is server-side: an is_admin flag + an is_admin() helper
-- used by RLS write policies and admin RPCs. UI hiding is cosmetic only.

alter table profiles
  add column if not exists is_admin boolean not null default false;

-- Grant admin to the owner account (by username).
update profiles set is_admin = true where username = 'Saimonyz';

-- Server-side admin check for the current caller.
create or replace function is_admin()
returns boolean
language sql security definer set search_path = public stable as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;
grant execute on function is_admin() to authenticated, anon;

-- Admin write access to curated tables (additive to existing read policies).
do $$ begin
  if not exists (select 1 from pg_policies where tablename='daily_briefs' and policyname='admin manage briefs') then
    create policy "admin manage briefs" on daily_briefs for all using (is_admin()) with check (is_admin());
  end if;
  if not exists (select 1 from pg_policies where tablename='quests' and policyname='admin manage quests') then
    create policy "admin manage quests" on quests for all using (is_admin()) with check (is_admin());
  end if;
end $$;

-- Admin: adjust a user's score (corrections, events). Guarded by is_admin().
create or replace function admin_adjust_score(p_target uuid, p_delta int)
returns json language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return json_build_object('error','forbidden'); end if;
  update profiles
     set total_score  = greatest(0, total_score  + p_delta),
         season_score = greatest(0, season_score + p_delta)
   where id = p_target;
  if not found then return json_build_object('error','no_user'); end if;
  return json_build_object('ok', true);
end; $$;
grant execute on function admin_adjust_score(uuid, int) to authenticated;

-- Admin stats in one call.
create or replace function admin_stats()
returns json language plpgsql security definer set search_path = public as $$
declare result json;
begin
  if not is_admin() then return json_build_object('error','forbidden'); end if;
  select json_build_object(
    'users',     (select count(*) from profiles),
    'ai',        (select count(*) from profiles where side = 'ai'),
    'human',     (select count(*) from profiles where side = 'human'),
    'squads',    (select count(*) from squads),
    'briefs',    (select count(*) from daily_briefs),
    'quests',    (select count(*) from quests)
  ) into result;
  return result;
end; $$;
grant execute on function admin_stats() to authenticated;
