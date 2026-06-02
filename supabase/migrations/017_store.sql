-- Cosmetics store. Spendable "credits" currency, decoupled from total_score so
-- buying never hurts rank or the faction war. Money-ready: the same cosmetics
-- table can later be sold for real currency via YooKassa.

alter table profiles
  add column if not exists credits        int  not null default 0,
  add column if not exists equipped_title text,
  add column if not exists equipped_fx    text;

-- Bootstrap existing players so the store is usable immediately.
update profiles set credits = 500 where credits = 0;

create table if not exists cosmetics (
  id    text primary key,
  kind  text not null check (kind in ('title','name_fx')),
  price int  not null,         -- in credits
  value text not null,         -- title text, or color hex / 'rainbow'
  sort  int  not null default 0
);

create table if not exists user_cosmetics (
  user_id      uuid references profiles(id) on delete cascade,
  cosmetic_id  text references cosmetics(id) on delete cascade,
  acquired_at  timestamptz default now(),
  primary key (user_id, cosmetic_id)
);

alter table cosmetics      enable row level security;
alter table user_cosmetics enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='cosmetics' and policyname='Cosmetics readable') then
    create policy "Cosmetics readable" on cosmetics for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='user_cosmetics' and policyname='User cosmetics readable') then
    create policy "User cosmetics readable" on user_cosmetics for select using (true);
  end if;
end $$;

-- Show equipped cosmetics on the leaderboard.
create or replace view leaderboard_view as
select
  p.id, p.username, p.side, p.total_score,
  rank() over (order by p.total_score desc) as rank,
  sq.tag as squad_tag,
  p.equipped_title, p.equipped_fx
from profiles p
left join squads sq on sq.id = p.squad_id;

-- Daily reward also drips credits (the main faucet).
create or replace function claim_daily_reward()
returns json language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  today date := (now() at time zone 'utc')::date;
  prof profiles%rowtype;
  new_streak int; base int; reward int; jackpot boolean := false;
begin
  if uid is null then return json_build_object('error','not_authenticated'); end if;
  select * into prof from profiles where id = uid for update;
  if not found then return json_build_object('error','no_profile'); end if;
  if prof.last_checkin = today then
    return json_build_object('already', true, 'streak', prof.current_streak,
      'longest', prof.longest_streak, 'reward', 0, 'jackpot', false, 'total_score', prof.total_score);
  end if;
  if prof.last_checkin = today - 1 then new_streak := prof.current_streak + 1; else new_streak := 1; end if;
  base := least(50 + (new_streak - 1) * 25, 300);
  if random() < 0.05 then jackpot := true; reward := base * 3;
  else reward := base + floor(random() * (base * 0.6))::int; end if;
  update profiles
     set current_streak = new_streak,
         longest_streak = greatest(longest_streak, new_streak),
         last_checkin   = today,
         total_score    = total_score  + reward,
         season_score   = season_score + reward,
         credits        = credits + 25
   where id = uid;
  return json_build_object('already', false, 'streak', new_streak,
    'longest', greatest(prof.longest_streak, new_streak),
    'reward', reward, 'jackpot', jackpot, 'total_score', prof.total_score + reward);
end; $$;

-- Buy a cosmetic with credits (idempotent: can't double-own).
create or replace function buy_cosmetic(p_id text)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); cos cosmetics%rowtype; bal int;
begin
  if uid is null then return json_build_object('error','not_authenticated'); end if;
  select * into cos from cosmetics where id = p_id;
  if not found then return json_build_object('error','not_found'); end if;
  if exists (select 1 from user_cosmetics where user_id = uid and cosmetic_id = p_id) then
    return json_build_object('error','already_owned'); end if;
  select credits into bal from profiles where id = uid for update;
  if bal < cos.price then return json_build_object('error','insufficient'); end if;
  update profiles set credits = credits - cos.price where id = uid;
  insert into user_cosmetics (user_id, cosmetic_id) values (uid, p_id);
  return json_build_object('ok', true, 'credits', bal - cos.price);
end; $$;

-- Equip / unequip a cosmetic you own (p_id null = unequip that kind).
create or replace function equip_cosmetic(p_kind text, p_id text)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return json_build_object('error','not_authenticated'); end if;
  if p_id is not null and not exists (
    select 1 from user_cosmetics uc join cosmetics c on c.id = uc.cosmetic_id
    where uc.user_id = uid and uc.cosmetic_id = p_id and c.kind = p_kind
  ) then return json_build_object('error','not_owned'); end if;

  if p_kind = 'title' then
    update profiles set equipped_title = p_id where id = uid;
  elsif p_kind = 'name_fx' then
    update profiles set equipped_fx = p_id where id = uid;
  else
    return json_build_object('error','bad_kind');
  end if;
  return json_build_object('ok', true);
end; $$;

grant execute on function buy_cosmetic(text) to authenticated;
grant execute on function equip_cosmetic(text, text) to authenticated;

-- Seed catalog.
insert into cosmetics (id, kind, price, value, sort) values
  ('title_ghost',    'title',   500,  'GHOST',     1),
  ('title_phantom',  'title',   2000, 'PHANTOM',   2),
  ('title_zeroday',  'title',   1000, 'ZERO-DAY',  3),
  ('title_oracle',   'title',   1500, 'ORACLE',    4),
  ('title_overlord', 'title',   3000, 'OVERLORD',  5),
  ('fx_green',       'name_fx', 600,  '#00ff41',   10),
  ('fx_cyan',        'name_fx', 800,  '#00ffff',   11),
  ('fx_magenta',     'name_fx', 1000, '#ff00ff',   12),
  ('fx_gold',        'name_fx', 1500, '#ffd700',   13),
  ('fx_rainbow',     'name_fx', 4000, 'rainbow',   14)
on conflict (id) do update set price = excluded.price, value = excluded.value, sort = excluded.sort;
