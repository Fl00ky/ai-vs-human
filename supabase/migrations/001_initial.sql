-- aivshuman initial schema
-- Apply via Supabase SQL Editor or `supabase db push`

-- Enums
create type team_side as enum ('ai', 'human');
create type game_kind as enum ('quiz', 'reaction', 'code_breaker', 'pattern');

-- Profiles (1-to-1 with auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  side team_side not null,
  total_score int not null default 0,
  created_at timestamptz default now()
);

-- Game scores
create table game_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  game game_kind not null,
  score int not null check (score >= 0),
  played_at timestamptz default now()
);

create index game_scores_user_idx on game_scores(user_id);
create index game_scores_game_idx on game_scores(game);
create index game_scores_played_at_idx on game_scores(played_at desc);

-- Quests
create table quests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  reward int not null check (reward > 0),
  side team_side,
  active boolean default true,
  created_at timestamptz default now()
);

-- User quest completions
create table user_quests (
  user_id uuid references profiles(id) on delete cascade,
  quest_id uuid references quests(id) on delete cascade,
  completed_at timestamptz default now(),
  primary key (user_id, quest_id)
);

-- View: leaderboard
create or replace view leaderboard_view as
select
  p.id,
  p.username,
  p.side,
  p.total_score,
  rank() over (order by p.total_score desc) as rank
from profiles p;

-- View: team scores
create or replace view team_score_view as
select
  side,
  coalesce(sum(total_score), 0)::int as score,
  count(*)::int as members
from profiles
group by side;

-- Trigger: auto-update total_score
create or replace function add_score_to_profile()
returns trigger as $$
begin
  update profiles set total_score = total_score + new.score where id = new.user_id;
  return new;
end;
$$ language plpgsql;

create trigger trg_game_score_total
  after insert on game_scores
  for each row execute function add_score_to_profile();

-- Trigger: quest reward
create or replace function add_quest_reward()
returns trigger as $$
declare
  reward_pts int;
begin
  select reward into reward_pts from quests where id = new.quest_id;
  update profiles set total_score = total_score + reward_pts where id = new.user_id;
  return new;
end;
$$ language plpgsql;

create trigger trg_quest_reward
  after insert on user_quests
  for each row execute function add_quest_reward();

-- RLS
alter table profiles enable row level security;
alter table game_scores enable row level security;
alter table quests enable row level security;
alter table user_quests enable row level security;

-- Profile policies
create policy "Profiles viewable by everyone"
  on profiles for select using (true);

create policy "Users insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users update own profile"
  on profiles for update using (auth.uid() = id);

-- Score policies
create policy "Anyone can read scores"
  on game_scores for select using (true);

create policy "Users insert own scores"
  on game_scores for insert with check (auth.uid() = user_id);

-- Quest policies
create policy "Quests viewable by everyone"
  on quests for select using (active = true);

-- User quest policies
create policy "Anyone can read quest progress"
  on user_quests for select using (true);

create policy "Users complete quests for self"
  on user_quests for insert with check (auth.uid() = user_id);

-- Seed quests
insert into quests (title, description, reward, side) values
  ('First Contact', 'Complete any mini-game and score above 0.', 100, null),
  ('Quiz Master', 'Score at least 500 points in a single Quiz round.', 250, null),
  ('Lightning Fingers', 'React under 300ms in the Reaction game.', 200, null),
  ('Pattern Sage', 'Reach round 5 in Pattern Memory.', 300, null),
  ('Decoder', 'Solve a Code Breaker challenge.', 200, null),
  ('Architect Initiate', 'For Architects: accumulate 1000 total points.', 500, 'ai'),
  ('Resistance Fighter', 'For the Resistance: accumulate 1000 total points.', 500, 'human'),
  ('Triple Threat', 'Play 3 different mini-games.', 400, null);
