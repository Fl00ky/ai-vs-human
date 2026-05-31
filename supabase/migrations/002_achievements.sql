-- Achievements / badges system
-- Apply after 001_initial.sql

create table achievements (
  id text primary key,
  title text not null,
  description text not null,
  icon text not null,
  points int not null default 100,
  rarity text not null default 'common' check (rarity in ('common', 'rare', 'epic', 'legendary'))
);

create table user_achievements (
  user_id uuid references profiles(id) on delete cascade,
  achievement_id text references achievements(id) on delete cascade,
  unlocked_at timestamptz default now(),
  primary key (user_id, achievement_id)
);

alter table achievements enable row level security;
alter table user_achievements enable row level security;

create policy "Anyone can read achievements"
  on achievements for select using (true);

create policy "Anyone can read unlocks"
  on user_achievements for select using (true);

create policy "Users unlock own achievements"
  on user_achievements for insert with check (auth.uid() = user_id);

-- Award bonus points when achievement unlocked
create or replace function add_achievement_bonus()
returns trigger as $$
declare
  bonus_pts int;
begin
  select points into bonus_pts from achievements where id = new.achievement_id;
  update profiles set total_score = total_score + bonus_pts where id = new.user_id;
  return new;
end;
$$ language plpgsql;

create trigger trg_achievement_bonus
  after insert on user_achievements
  for each row execute function add_achievement_bonus();

-- Seed achievements
insert into achievements (id, title, description, icon, points, rarity) values
  ('first_blood', 'First Blood', 'Play your first game.', 'zap', 50, 'common'),
  ('quiz_novice', 'Pattern Recognition', 'Score 800+ in Quiz.', 'brain', 100, 'common'),
  ('quiz_master', 'Mind Reader', 'Score 1200+ in Quiz.', 'eye', 300, 'rare'),
  ('reflex_fast', 'Lightning Fingers', 'React in under 250ms.', 'zap-fast', 200, 'rare'),
  ('reflex_god', 'Bullet Time', 'React in under 180ms.', 'star', 500, 'epic'),
  ('decoder_solo', 'Decoder', 'Crack a Code Breaker on first try.', 'code', 250, 'rare'),
  ('pattern_5', 'Photographic Memory', 'Reach round 5 in Pattern Memory.', 'grid', 200, 'rare'),
  ('pattern_8', 'Mainframe', 'Reach round 8 in Pattern Memory.', 'database', 500, 'epic'),
  ('all_games', 'Versatile Operative', 'Play all 4 mini-games.', 'gamepad', 300, 'rare'),
  ('score_1k', 'Rising Agent', 'Reach 1,000 total points.', 'trending-up', 100, 'common'),
  ('score_5k', 'Veteran', 'Reach 5,000 total points.', 'medal', 500, 'epic'),
  ('score_10k', 'Legend', 'Reach 10,000 total points.', 'trophy', 1000, 'legendary'),
  ('quest_5', 'Mission Specialist', 'Complete 5 quests.', 'check-circle', 250, 'rare'),
  ('top_10', 'Elite', 'Reach top 10 on the leaderboard.', 'crown', 1000, 'legendary');
