import { createClient } from "@/lib/supabase/server";
import { LiveTeamProgress } from "@/components/leaderboard/LiveTeamProgress";
import { UserList } from "@/components/leaderboard/UserList";
import { LeaderboardLabels } from "@/components/leaderboard/LeaderboardLabels";
import type { TeamScore, LeaderboardEntry } from "@/lib/types/database";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const [{ data: teamScores }, { data: entries }] = await Promise.all([
    supabase.from("team_score_view").select("*"),
    supabase.from("leaderboard_view").select("*").order("rank", { ascending: true }).limit(50),
  ]);

  return (
    <LeaderboardLabels
      teamScores={(teamScores as TeamScore[] | null) ?? []}
      entries={(entries as LeaderboardEntry[] | null) ?? []}
      currentUserId={session?.user?.id}
    />
  );
}
