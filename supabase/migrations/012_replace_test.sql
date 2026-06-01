-- "Will AI replace you?" self-assessment. Stores the latest score; awards a
-- one-time completion bonus. Score is informational (not a competitive metric),
-- but storing it enables faction-average flavour later.

alter table profiles
  add column if not exists replace_score int;  -- 0..100, null = not taken

create or replace function save_replace_test(p_score int)
returns json language plpgsql security definer set search_path = public as $$
declare
  uid    uuid := auth.uid();
  first  boolean;
  bonus  int := 200;
begin
  if uid is null then return json_build_object('error','not_authenticated'); end if;
  if p_score < 0 or p_score > 100 then return json_build_object('error','bad_score'); end if;

  select replace_score is null into first from profiles where id = uid;

  if first then
    update profiles
       set replace_score = p_score,
           total_score   = total_score  + bonus,
           season_score  = season_score + bonus
     where id = uid;
    return json_build_object('ok', true, 'awarded', bonus);
  else
    update profiles set replace_score = p_score where id = uid;
    return json_build_object('ok', true, 'awarded', 0);
  end if;
end; $$;

grant execute on function save_replace_test(int) to authenticated;
