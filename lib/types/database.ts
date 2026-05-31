export type Side = "ai" | "human";
export type GameKind = "quiz" | "reaction" | "code_breaker" | "pattern";

export interface Profile {
  id: string;
  username: string;
  side: Side;
  total_score: number;
  created_at: string;
}

export interface GameScore {
  id: string;
  user_id: string;
  game: GameKind;
  score: number;
  played_at: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  reward: number;
  side: Side | null;
  active: boolean;
  created_at: string;
}

export interface UserQuest {
  user_id: string;
  quest_id: string;
  completed_at: string;
}

export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  rarity: Rarity;
}

export interface UserAchievement {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  side: Side;
  total_score: number;
  rank: number;
}

export interface TeamScore {
  side: Side;
  score: number;
  members: number;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at"> & { created_at?: string };
        Update: Partial<Omit<Profile, "id">>;
      };
      game_scores: {
        Row: GameScore;
        Insert: Omit<GameScore, "id" | "played_at"> & {
          id?: string;
          played_at?: string;
        };
        Update: Partial<Omit<GameScore, "id" | "user_id">>;
      };
      quests: {
        Row: Quest;
        Insert: Omit<Quest, "id" | "created_at" | "active"> & {
          id?: string;
          created_at?: string;
          active?: boolean;
        };
        Update: Partial<Omit<Quest, "id">>;
      };
      user_quests: {
        Row: UserQuest;
        Insert: Omit<UserQuest, "completed_at"> & { completed_at?: string };
        Update: never;
      };
      achievements: {
        Row: Achievement;
        Insert: Achievement;
        Update: Partial<Omit<Achievement, "id">>;
      };
      user_achievements: {
        Row: UserAchievement;
        Insert: Omit<UserAchievement, "unlocked_at"> & { unlocked_at?: string };
        Update: never;
      };
    };
    Views: {
      leaderboard_view: { Row: LeaderboardEntry };
      team_score_view: { Row: TeamScore };
    };
    Enums: {
      team_side: Side;
      game_kind: GameKind;
    };
  };
}
