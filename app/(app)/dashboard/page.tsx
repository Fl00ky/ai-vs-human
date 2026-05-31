import Link from "next/link";
import { Gamepad2, ListTodo, Trophy, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GlitchText } from "@/components/matrix/Terminal";
import { LiveTeamProgress } from "@/components/leaderboard/LiveTeamProgress";
import { ActivityFeed, type FeedEvent } from "@/components/ActivityFeed";
import { MotionGrid, MotionGridItem } from "@/components/MotionGrid";
import { SIDE_META, formatScore, type Side } from "@/lib/utils";
import type { TeamScore } from "@/lib/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const { data: teamScores } = await supabase
    .from("team_score_view")
    .select("*");

  const { data: recentGames } = await supabase
    .from("game_scores")
    .select("*")
    .eq("user_id", user!.id)
    .order("played_at", { ascending: false })
    .limit(5);

  // Initial global activity feed: recent scores, quests, achievements joined with profile/quest/ach data
  const [recentScores, recentQuestsRaw, recentAchsRaw] = await Promise.all([
    supabase
      .from("game_scores")
      .select("id, user_id, game, score, played_at")
      .order("played_at", { ascending: false })
      .limit(15),
    supabase
      .from("user_quests")
      .select("user_id, quest_id, completed_at")
      .order("completed_at", { ascending: false })
      .limit(8),
    supabase
      .from("user_achievements")
      .select("user_id, achievement_id, unlocked_at")
      .order("unlocked_at", { ascending: false })
      .limit(8),
  ]);

  const allUserIds = new Set<string>([
    ...(recentScores.data ?? []).map((r) => r.user_id),
    ...(recentQuestsRaw.data ?? []).map((r) => r.user_id),
    ...(recentAchsRaw.data ?? []).map((r) => r.user_id),
  ]);
  const questIds = new Set((recentQuestsRaw.data ?? []).map((r) => r.quest_id));
  const achIds = new Set((recentAchsRaw.data ?? []).map((r) => r.achievement_id));

  const [profilesRes, questsRes, achsRes] = await Promise.all([
    allUserIds.size > 0
      ? supabase.from("profiles").select("id, username, side").in("id", [...allUserIds])
      : Promise.resolve({ data: [] as { id: string; username: string; side: Side }[] }),
    questIds.size > 0
      ? supabase.from("quests").select("id, title, reward").in("id", [...questIds])
      : Promise.resolve({ data: [] as { id: string; title: string; reward: number }[] }),
    achIds.size > 0
      ? supabase.from("achievements").select("id, title, points").in("id", [...achIds])
      : Promise.resolve({ data: [] as { id: string; title: string; points: number }[] }),
  ]);

  const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
  const questMap = new Map((questsRes.data ?? []).map((q) => [q.id, q]));
  const achMap = new Map((achsRes.data ?? []).map((a) => [a.id, a]));

  const feed: FeedEvent[] = [
    ...(recentScores.data ?? []).map((r): FeedEvent | null => {
      const p = profileMap.get(r.user_id);
      if (!p) return null;
      return {
        id: `score-${r.id}`,
        ts: r.played_at,
        kind: "score",
        username: p.username,
        side: p.side,
        message: `+${formatScore(r.score)} from ${r.game.replace("_", " ")}`,
        amount: r.score,
      };
    }).filter((x): x is FeedEvent => x !== null),
    ...(recentQuestsRaw.data ?? []).map((r): FeedEvent | null => {
      const p = profileMap.get(r.user_id);
      const q = questMap.get(r.quest_id);
      if (!p || !q) return null;
      return {
        id: `quest-${r.user_id}-${r.quest_id}`,
        ts: r.completed_at,
        kind: "quest",
        username: p.username,
        side: p.side,
        message: `completed «${q.title}»`,
        amount: q.reward,
      };
    }).filter((x): x is FeedEvent => x !== null),
    ...(recentAchsRaw.data ?? []).map((r): FeedEvent | null => {
      const p = profileMap.get(r.user_id);
      const a = achMap.get(r.achievement_id);
      if (!p || !a) return null;
      return {
        id: `ach-${r.user_id}-${r.achievement_id}`,
        ts: r.unlocked_at,
        kind: "achievement",
        username: p.username,
        side: p.side,
        message: `unlocked ★ ${a.title}`,
        amount: a.points,
      };
    }).filter((x): x is FeedEvent => x !== null),
  ]
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 20);

  const side = (profile?.side ?? "human") as Side;
  const meta = SIDE_META[side];

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <section>
        <div className="text-xs text-side/60 uppercase tracking-[0.3em] mb-2">
          ./status
        </div>
        <GlitchText
          text={`${meta.greeting}, ${profile?.username ?? "agent"}`}
          as="h1"
          className="text-3xl sm:text-5xl"
        />
        <p className="text-fg/60 mt-2 italic">{meta.motto}</p>
      </section>

      {/* War room */}
      <section className="terminal-box p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-[0.2em] text-side/70">
            [ the war ]
          </span>
          <Link
            href="/leaderboard"
            className="text-xs text-side hover:underline flex items-center gap-1"
          >
            full board <ArrowRight size={12} />
          </Link>
        </div>
        <LiveTeamProgress initial={(teamScores as TeamScore[] | null) ?? []} />
      </section>

      {/* Quick stats + actions */}
      <MotionGrid className="grid sm:grid-cols-3 gap-4">
        <MotionGridItem>
          <StatCard label="Your score" value={formatScore(profile?.total_score ?? 0)} />
        </MotionGridItem>
        <MotionGridItem>
          <StatCard label="Side" value={meta.shortName} />
        </MotionGridItem>
        <MotionGridItem>
          <StatCard
            label="Games played"
            value={String(recentGames?.length ?? 0)}
          />
        </MotionGridItem>
      </MotionGrid>

      {/* Actions */}
      <MotionGrid className="grid sm:grid-cols-3 gap-4">
        <MotionGridItem>
          <ActionCard
            href="/games"
            title="Mini-Games"
            description="Earn points for your side through skill challenges."
            icon={Gamepad2}
          />
        </MotionGridItem>
        <MotionGridItem>
          <ActionCard
            href="/quests"
            title="Quests"
            description="Long-form missions with bigger rewards."
            icon={ListTodo}
          />
        </MotionGridItem>
        <MotionGridItem>
          <ActionCard
            href="/leaderboard"
            title="Leaderboard"
            description="See who's pushing the war effort hardest."
            icon={Trophy}
          />
        </MotionGridItem>
      </MotionGrid>

      {/* Live global activity */}
      <section className="terminal-box p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-[0.2em] text-side/70">
            [ live activity feed ]
          </span>
          <span className="text-[10px] text-side/40 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-matrix-green animate-pulse" />
            realtime
          </span>
        </div>
        <ActivityFeed initial={feed} />
      </section>

      {/* Personal recent */}
      {recentGames && recentGames.length > 0 && (
        <section className="terminal-box p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-side/70 mb-3">
            [ your recent runs ]
          </div>
          <ul className="space-y-1.5 text-sm font-mono">
            {recentGames.map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between border-b border-side/10 pb-1.5"
              >
                <span className="text-fg/70">
                  &gt; {g.game.replace("_", " ")}
                </span>
                <span className="text-side tabular-nums">
                  +{formatScore(g.score)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="terminal-box p-4">
      <div className="text-[10px] uppercase tracking-[0.25em] text-fg/50">
        {label}
      </div>
      <div className="font-display text-2xl text-side mt-1 tabular-nums">
        {value}
      </div>
    </div>
  );
}

function ActionCard({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="terminal-box card-shimmer p-5 group hover:border-side transition-all hover:-translate-y-1 block h-full"
    >
      <Icon size={24} className="text-side mb-3" />
      <div className="font-display text-lg text-side uppercase tracking-wider">
        {title}
      </div>
      <p className="text-sm text-fg/60 mt-1">{description}</p>
      <div className="mt-3 text-xs text-side opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        engage <ArrowRight size={12} />
      </div>
    </Link>
  );
}
