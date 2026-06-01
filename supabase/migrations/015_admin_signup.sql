-- Ensure the owner account becomes admin even if it registers later.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, side, total_score, referral_code, is_admin)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    (new.raw_user_meta_data->>'side')::team_side,
    0,
    gen_ref_code(),
    (new.raw_user_meta_data->>'username') = 'Saimonyz'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
