-- Daily AI Briefing: a curated feed of short, useful AI-age notes. Works out of
-- the box with an evergreen seed; the owner can add timely news by inserting
-- rows. A once-per-day "read" reward creates the daily-return incentive.

create table if not exists daily_briefs (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text not null,
  url          text,
  category     text not null default 'tip' check (category in ('tip','tool','risk','fact','news')),
  published_at timestamptz not null default now()
);

alter table daily_briefs enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='daily_briefs' and policyname='Briefs readable') then
    create policy "Briefs readable" on daily_briefs for select using (true);
  end if;
end $$;

alter table profiles
  add column if not exists last_brief_read date;

-- Once-per-day read reward.
create or replace function claim_brief_read()
returns json language plpgsql security definer set search_path = public as $$
declare
  uid   uuid := auth.uid();
  today date := (now() at time zone 'utc')::date;
  last  date;
  bonus int := 50;
begin
  if uid is null then return json_build_object('error','not_authenticated'); end if;
  select last_brief_read into last from profiles where id = uid;
  if last = today then return json_build_object('already', true, 'reward', 0); end if;
  update profiles
     set last_brief_read = today,
         total_score  = total_score  + bonus,
         season_score = season_score + bonus
   where id = uid;
  return json_build_object('ok', true, 'reward', bonus);
end; $$;

grant execute on function claim_brief_read() to authenticated;

-- Evergreen seed (staggered dates so there's a feed from day one).
insert into daily_briefs (title, body, category, published_at)
select * from (values
  ('Ground your prompts', 'Paste the source text and ask the AI to answer only from it. This drastically cuts made-up facts.', 'tip', now() - interval '0 days'),
  ('Voice-clone scams are here', 'Scammers can clone a relative''s voice from seconds of audio. Agree on a family safe word to verify real emergencies.', 'risk', now() - interval '1 days'),
  ('AI predicts, it does not know', 'LLMs generate the most likely next words, not verified truth. That is why they can sound confident while being wrong.', 'fact', now() - interval '2 days'),
  ('The 4-part prompt', 'Role + Context + Task + Format. This single habit improves almost every AI answer you get.', 'tip', now() - interval '3 days'),
  ('Never paste secrets', 'Anything typed into a public chatbot may be stored. Never paste passwords, client data, or ID numbers.', 'risk', now() - interval '4 days'),
  ('Hallucinated citations', 'AI can invent realistic-looking sources. Always open and verify references before trusting them.', 'fact', now() - interval '5 days'),
  ('AI as a tutor', 'Ask it to explain a topic at rising levels: "explain like I am 12", then "now go deeper". Great for learning fast.', 'tip', now() - interval '6 days'),
  ('Reverse-check images', 'Suspicious photo? Use a reverse image search to find its real origin and date before believing or sharing it.', 'tool', now() - interval '7 days'),
  ('Make AI critique itself', 'After an answer, ask "what could be wrong here?". Self-critique surfaces errors and weak assumptions.', 'tip', now() - interval '8 days'),
  ('Summarize, then decide', 'Let AI compress long docs and emails into bullets, then make the judgment call yourself. Speed without outsourcing thinking.', 'tool', now() - interval '9 days')
) as v(title, body, category, published_at)
where not exists (select 1 from daily_briefs);
