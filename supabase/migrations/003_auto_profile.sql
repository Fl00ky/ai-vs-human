-- Auto-create profile row when a new auth user is created.
-- Reads username and side from raw_user_meta_data set during signUp.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, side, total_score)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    (new.raw_user_meta_data->>'side')::team_side,
    0
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
