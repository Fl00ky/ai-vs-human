import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, GameKind } from "@/lib/types/database";

type SB = SupabaseClient<Database>;

interface UnlockContext {
  userId: string;
  /** The game that was just played (if applicable) */
  game?: GameKind;
  /** The score just achieved in that game (if applicable) */
  score?: number;
  /** Detail metric for some achievements: ms for reaction, round reached for pattern */
  detail?: number;
  /** Whether the game was solved on first try (code-breaker) */
  firstTry?: boolean;
}

/**
 * Detects newly unlocked achievements based on player history + this play.
 * Returns the IDs to insert into user_achievements.
 */
export async function detectUnlocks(
  supabase: SB,
  ctx: UnlockContext,
): Promise<string[]> {
  const { userId, game, score, detail, firstTry } = ctx;

  // Fetch what's already unlocked + profile + all scores + completed quests + rank
  const [profileRes, scoresRes, unlockedRes, questsRes, rankRes] = await Promise.all([
    supabase.from("profiles").select("total_score").eq("id", userId).single(),
    supabase.from("game_scores").select("game, score").eq("user_id", userId),
    supabase.from("user_achievements").select("achievement_id").eq("user_id", userId),
    supabase.from("user_quests").select("quest_id").eq("user_id", userId),
    supabase.from("leaderboard_view").select("rank").eq("id", userId).single(),
  ]);

  const totalScore = profileRes.data?.total_score ?? 0;
  const allScores = scoresRes.data ?? [];
  const unlocked = new Set(
    (unlockedRes.data ?? []).map((u) => u.achievement_id),
  );
  const questsDone = questsRes.data?.length ?? 0;
  const rank = rankRes.data?.rank ?? Infinity;
  const gamesPlayed = new Set(allScores.map((s) => s.game));

  const candidates: string[] = [];
  const check = (id: string, condition: boolean) => {
    if (condition && !unlocked.has(id)) candidates.push(id);
  };

  // Volume / progression
  check("first_blood", allScores.length > 0);
  check("score_1k", totalScore >= 1000);
  check("score_5k", totalScore >= 5000);
  check("score_10k", totalScore >= 10000);
  check("all_games", gamesPlayed.size >= 4);
  check("quest_5", questsDone >= 5);
  check("top_10", rank <= 10);

  // Game-specific (only checked if this play matches)
  if (game === "quiz" && score !== undefined) {
    check("quiz_novice", score >= 800);
    check("quiz_master", score >= 1200);
  }
  if (game === "reaction" && detail !== undefined) {
    // detail = best ms in this round; lower is better
    check("reflex_fast", detail <= 250);
    check("reflex_god", detail <= 180);
  }
  if (game === "code_breaker" && firstTry) {
    check("decoder_solo", true);
  }
  if (game === "pattern" && detail !== undefined) {
    check("pattern_5", detail >= 5);
    check("pattern_8", detail >= 8);
  }

  return candidates;
}

/**
 * Inserts newly unlocked achievements. Returns full Achievement rows for the unlocks.
 */
export async function awardUnlocks(
  supabase: SB,
  userId: string,
  achievementIds: string[],
) {
  if (achievementIds.length === 0) return [];

  const rows = achievementIds.map((id) => ({
    user_id: userId,
    achievement_id: id,
  }));

  // Insert, ignoring duplicates (in case of race)
  await supabase.from("user_achievements").upsert(rows, {
    onConflict: "user_id,achievement_id",
    ignoreDuplicates: true,
  });

  const { data } = await supabase
    .from("achievements")
    .select("*")
    .in("id", achievementIds);

  return data ?? [];
}
