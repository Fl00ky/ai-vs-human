-- Store the cosmetic VALUE (title text / color) in equipped_* so profile and
-- leaderboard can render directly. Ownership still verified by id + kind.

create or replace function equip_cosmetic(p_kind text, p_id text)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); val text;
begin
  if uid is null then return json_build_object('error','not_authenticated'); end if;

  if p_id is not null then
    select c.value into val
      from user_cosmetics uc join cosmetics c on c.id = uc.cosmetic_id
     where uc.user_id = uid and uc.cosmetic_id = p_id and c.kind = p_kind;
    if val is null then return json_build_object('error','not_owned'); end if;
  end if;

  if p_kind = 'title' then
    update profiles set equipped_title = val where id = uid;
  elsif p_kind = 'name_fx' then
    update profiles set equipped_fx = val where id = uid;
  else
    return json_build_object('error','bad_kind');
  end if;
  return json_build_object('ok', true, 'value', val);
end; $$;
