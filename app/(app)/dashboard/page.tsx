import Link from "next/link";
import { Gamepad2, ListTodo, Trophy, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LiveTeamProgress } from "@/components/leaderboard/LiveTeamProgress";
import { ActivityFeed, type FeedEvent } from "@/components/ActivityFeed";
import { MotionGrid, MotionGridItem } from "@/components/MotionGrid";
import { DashboardUI } from "@/components/dashboard/DashboardUI";
import type { SeasonState } from "@/components/dashboard/SeasonWar";
import { SIDE_META, formatScore, type Side } from "@/lib/utils";
import type { TeamScore } from "@/lib/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session!.user;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: teamScores } = await supabase.from("team_score_view").select("*");
  const { data: season } = await supabase.rpc("get_season_state");
  const { data: recentGames } = await supabase.from("game_scores").select("*").eq("user_id", user.id).order("played_at", { ascending: false }).limit(5);
  const { data: rankRow } = await supabase.from("leaderboard_view").select("rank").eq("id", user.id).maybeSingle();
  const { data: allMyGames } = await supabase.from("game_scores").select("game").eq("user_id", user.id);
  const distinctGames = new Set((allMyGames ?? []).map((g: { game: string }) => g.game)).size;

  const [recentScores, recentQuestsRaw, recentAchsRaw] = await Promise.all([
    supabase.from("game_scores").select("id, user_id, game, score, played_at").order("played_at", { ascending: false }).limit(15),
    supabase.from("user_quests").select("user_id, quest_id, completed_at").order("completed_at", { ascending: false }).limit(8),
    supabase.from("user_achievements").select("user_id, achievement_id, unlocked_at").order("unlocked_at", { ascending: false }).limit(8),
  ]);

  const allUserIds = new Set<string>([
    ...(recentScores.data ?? []).map(r => r.user_id),
    ...(recentQuestsRaw.data ?? []).map(r => r.user_id),
    ...(recentAchsRaw.data ?? []).map(r => r.user_id),
  ]);
  const questIds = new Set((recentQuestsRaw.data ?? []).map(r => r.quest_id));
  const achIds   = new Set((recentAchsRaw.data ?? []).map(r => r.achievement_id));

  const [profilesRes, questsRes, achsRes] = await Promise.all([
    allUserIds.size > 0 ? supabase.from("profiles").select("id, username, side").in("id", [...allUserIds]) : Promise.resolve({ data: [] as { id: string; username: string; side: Side }[] }),
    questIds.size > 0   ? supabase.from("quests").select("id, title, reward").in("id", [...questIds])      : Promise.resolve({ data: [] as { id: string; title: string; reward: number }[] }),
    achIds.size > 0     ? supabase.from("achievements").select("id, title, points").in("id", [...achIds])  : Promise.resolve({ data: [] as { id: string; title: string; points: number }[] }),
  ]);

  const profileMap = new Map((profilesRes.data ?? []).map(p => [p.id, p]));
  const questMap   = new Map((questsRes.data ?? []).map(q => [q.id, q]));
  const achMap     = new Map((achsRes.data ?? []).map(a => [a.id, a]));

  const feed: FeedEvent[] = [
    ...(recentScores.data ?? []).map((r): FeedEvent | null => {
      const p = profileMap.get(r.user_id); if (!p) return null;
      return { id: `score-${r.id}`, ts: r.played_at, kind: "score", username: p.username, side: p.side, message: `+${formatScore(r.score)} from ${r.game.replace("_", " ")}`, amount: r.score };
    }).filter((x): x is FeedEvent => x !== null),
    ...(recentQuestsRaw.data ?? []).map((r): FeedEvent | null => {
      const p = profileMap.get(r.user_id); const q = questMap.get(r.quest_id); if (!p || !q) return null;
      return { id: `quest-${r.user_id}-${r.quest_id}`, ts: r.completed_at, kind: "quest", username: p.username, side: p.side, message: `completed «${q.title}»`, amount: q.reward };
    }).filter((x): x is FeedEvent => x !== null),
    ...(recentAchsRaw.data ?? []).map((r): FeedEvent | null => {
      const p = profileMap.get(r.user_id); const a = achMap.get(r.achievement_id); if (!p || !a) return null;
      return { id: `ach-${r.user_id}-${r.achievement_id}`, ts: r.unlocked_at, kind: "achievement", username: p.username, side: p.side, message: `unlocked ★ ${a.title}`, amount: a.points };
    }).filter((x): x is FeedEvent => x !== null),
  ].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, 20);

  return (
    <DashboardUI
      profile={profile}
      teamScores={(teamScores as TeamScore[] | null) ?? []}
      recentGames={recentGames ?? []}
      feed={feed}
      season={season as SeasonState | null}
      globalRank={(rankRow as { rank: number } | null)?.rank ?? null}
      distinctGames={distinctGames}
    />
  );
}
