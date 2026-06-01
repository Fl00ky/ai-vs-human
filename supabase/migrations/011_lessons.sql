-- AI-literacy lessons. Content (steps, question, options) lives in code; the
-- AUTHORITY (reward + correct answer) lives here so the answer can't be read
-- from the client bundle and the reward can't be inflated.

create table if not exists lessons (
  id            text primary key,
  reward        int  not null,
  correct_index int  not null
);

create table if not exists user_lessons (
  user_id      uuid references profiles(id) on delete cascade,
  lesson_id    text references lessons(id) on delete cascade,
  completed_at timestamptz default now(),
  primary key (user_id, lesson_id)
);

alter table lessons      enable row level security;
alter table user_lessons enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='lessons' and policyname='Lessons readable') then
    -- only id is needed client-side; reward/correct_index are not selected by the app
    create policy "Lessons readable" on lessons for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='user_lessons' and policyname='User lessons readable') then
    create policy "User lessons readable" on user_lessons for select using (true);
  end if;
end $$;

-- Validate the answer server-side, award once.
create or replace function complete_lesson(p_id text, p_answer int)
returns json language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  les lessons%rowtype;
begin
  if uid is null then return json_build_object('error','not_authenticated'); end if;
  select * into les from lessons where id = p_id;
  if not found then return json_build_object('error','invalid_lesson'); end if;

  if exists (select 1 from user_lessons where user_id = uid and lesson_id = p_id) then
    return json_build_object('already', true, 'correct', true, 'reward', 0);
  end if;

  if p_answer <> les.correct_index then
    return json_build_object('correct', false);
  end if;

  insert into user_lessons (user_id, lesson_id) values (uid, p_id);
  update profiles
     set total_score  = total_score  + les.reward,
         season_score = season_score + les.reward
   where id = uid;

  return json_build_object('ok', true, 'correct', true, 'reward', les.reward);
end; $$;

grant execute on function complete_lesson(text, int) to authenticated;

-- Seed lesson metadata. correct_index matches the options order in lib/lessons.ts.
insert into lessons (id, reward, correct_index) values
  ('phishing',  300, 1),
  ('verify',    300, 2),
  ('deepfake',  400, 1),
  ('privacy',   300, 1),
  ('prompting', 300, 3),
  ('sources',   400, 1)
on conflict (id) do update set reward = excluded.reward, correct_index = excluded.correct_index;
