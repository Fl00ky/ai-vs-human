import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GlitchText } from "@/components/matrix/Terminal";
import { AchievementBadge } from "@/components/achievements/AchievementCard";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { MotionGrid, MotionGridItem } from "@/components/MotionGrid";
import { SIDE_META, formatScore, type Side } from "@/lib/utils";
import type { Achievement, GameKind } from "@/lib/types/database";

const GAME_LABELS: Record<GameKind, string> = {
  quiz: "Quiz",
  reaction: "Reaction",
  code_breaker: "Code Breaker",
  pattern: "Pattern Memory",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const { data: rankRow } = await supabase
    .from("leaderboard_view")
    .select("rank")
    .eq("id", user!.id)
    .single();

  const { data: scores } = await supabase
    .from("game_scores")
    .select("game, score")
    .eq("user_id", user!.id);

  const { data: completedQuests } = await supabase
    .from("user_quests")
    .select("quest_id")
    .eq("user_id", user!.id);

  const { data: userAchs } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", user!.id)
    .order("unlocked_at", { ascending: false })
    .limit(12);

  const unlockedIds = (userAchs ?? []).map((u) => u.achievement_id);
  const { data: achievements } = unlockedIds.length
    ? await supabase.from("achievements").select("*").in("id", unlockedIds)
    : { data: [] as Achievement[] };

  const side = (profile?.side ?? "human") as Side;
  const meta = SIDE_META[side];

  // Aggregate per-game best
  const byGame: Record<string, { best: number; plays: number }> = {};
  for (const s of scores ?? []) {
    const g = byGame[s.game] ?? { best: 0, plays: 0 };
    g.best = Math.max(g.best, s.score);
    g.plays += 1;
    byGame[s.game] = g;
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="text-xs text-side/60 uppercase tracking-[0.3em] mb-2">
          ./profile
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <GlitchText
            text={profile?.username ?? "agent"}
            as="h1"
            className="text-3xl sm:text-5xl"
          />
          <span
            className={`px-3 py-1 text-xs uppercase tracking-widest ${
              side === "ai" ? "side-badge-ai" : "side-badge-human"
            }`}
          >
            {meta.name}
          </span>
        </div>
      </section>

      <MotionGrid className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MotionGridItem>
          <Stat label="Total score" value={profile?.total_score ?? 0} animated />
        </MotionGridItem>
        <MotionGridItem>
          <Stat label="Global rank" value={rankRow?.rank ? `#${rankRow.rank}` : "—"} />
        </MotionGridItem>
        <MotionGridItem>
          <Stat label="Games played" value={String(scores?.length ?? 0)} />
        </MotionGridItem>
        <MotionGridItem>
          <Stat label="Quests done" value={String(completedQuests?.length ?? 0)} />
        </MotionGridItem>
      </MotionGrid>

      <section className="terminal-box p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-side/70 mb-4">
          [ game records ]
        </div>
        <MotionGrid className="grid sm:grid-cols-2 gap-3">
          {(Object.keys(GAME_LABELS) as GameKind[]).map((g) => {
            const data = byGame[g];
            return (
              <MotionGridItem
                key={g}
                className="flex items-center justify-between border border-side/20 px-4 py-3"
              >
                <div>
                  <div className="text-side font-mono text-sm">
                    {GAME_LABELS[g]}
                  </div>
                  <div className="text-[10px] text-fg/40 uppercase tracking-widest">
                    {data ? `${data.plays} plays` : "not played"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-fg/40 uppercase">best</div>
                  <div className="font-display text-xl text-side tabular-nums">
                    {data ? <AnimatedCounter value={data.best} duration={1000} /> : "—"}
                  </div>
                </div>
              </MotionGridItem>
            );
          })}
        </MotionGrid>
      </section>

      <section className="terminal-box p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-[0.2em] text-side/70">
            [ badges ]
          </span>
          <Link
            href="/achievements"
            className="text-xs text-side hover:underline"
          >
            view all →
          </Link>
        </div>
        {achievements && achievements.length > 0 ? (
          <MotionGrid className="flex flex-wrap gap-2" stagger={0.06} delayChildren={0.15}>
            {(achievements as Achievement[]).map((a) => (
              <MotionGridItem key={a.id}>
                <AchievementBadge achievement={a} />
              </MotionGridItem>
            ))}
          </MotionGrid>
        ) : (
          <p className="text-fg/40 text-sm">No badges yet — play games and complete quests to earn them.</p>
        )}
      </section>

      <section className="terminal-box p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-side/70 mb-3">
          [ identity ]
        </div>
        <dl className="space-y-2 text-sm font-mono">
          <Row label="agent_id" value={profile?.username ?? "—"} />
          <Row label="email" value={user?.email ?? "—"} />
          <Row label="allegiance" value={meta.name} />
          <Row
            label="enlisted"
            value={
              profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString()
                : "—"
            }
          />
        </dl>
      </section>
    </div>
  );
}

function Stat({ label, value, animated }: { label: string; value: string | number; animated?: boolean }) {
  return (
    <div className="terminal-box p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-fg/50">
        {label}
      </div>
      <div className="font-display text-xl sm:text-2xl text-side mt-1 tabular-nums">
        {animated && typeof value === "number" ? (
          <AnimatedCounter value={value} duration={1400} />
        ) : typeof value === "number" ? (
          formatScore(value)
        ) : (
          value
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-side/10 pb-1.5">
      <span className="text-fg/50">&gt; {label}</span>
      <span className="text-side">{value}</span>
    </div>
  );
}
