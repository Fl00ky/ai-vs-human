import { createClient } from "@/lib/supabase/server";
import { ProfileUI } from "@/components/profile/ProfileUI";
import { SIDE_META, type Side } from "@/lib/utils";
import type { Achievement, GameKind } from "@/lib/types/database";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session!.user;

  const { data: profile }   = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: rankRow }   = await supabase.from("leaderboard_view").select("rank").eq("id", user.id).single();
  const { data: scores }    = await supabase.from("game_scores").select("game, score").eq("user_id", user.id);
  const { data: completedQuests } = await supabase.from("user_quests").select("quest_id").eq("user_id", user.id);
  const { data: userAchs }  = await supabase.from("user_achievements").select("achievement_id").eq("user_id", user.id).order("unlocked_at", { ascending: false }).limit(12);

  const unlockedIds = (userAchs ?? []).map(u => u.achievement_id);
  const { data: achievements } = unlockedIds.length
    ? await supabase.from("achievements").select("*").in("id", unlockedIds)
    : { data: [] as Achievement[] };

  const byGame: Record<string, { best: number; plays: number }> = {};
  for (const s of scores ?? []) {
    const g = byGame[s.game] ?? { best: 0, plays: 0 };
    g.best = Math.max(g.best, s.score); g.plays += 1;
    byGame[s.game] = g;
  }

  return (
    <ProfileUI
      profile={profile}
      userEmail={user.email ?? ""}
      rank={rankRow?.rank ?? null}
      scoresCount={scores?.length ?? 0}
      questsCount={completedQuests?.length ?? 0}
      achievements={(achievements as Achievement[] | null) ?? []}
      byGame={byGame}
    />
  );
}
