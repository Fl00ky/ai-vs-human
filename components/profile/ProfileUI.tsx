"use client";

import Link from "next/link";
import { Share2 } from "lucide-react";
import { GlitchText } from "@/components/matrix/Terminal";
import { AchievementBadge } from "@/components/achievements/AchievementCard";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { MotionGrid, MotionGridItem } from "@/components/MotionGrid";
import { useLanguage } from "@/lib/i18n/context";
import { useToast } from "@/components/Toast";
import { getRank } from "@/lib/ranks";
import { SIDE_META, formatScore, type Side } from "@/lib/utils";
import type { Achievement, GameKind } from "@/lib/types/database";

const GAME_KEYS: Record<GameKind, "quiz" | "reaction" | "codeBreaker" | "pattern"> = {
  quiz: "quiz", reaction: "reaction", code_breaker: "codeBreaker", pattern: "pattern",
};

interface Props {
  profile: { username: string; side: string; total_score: number; created_at?: string } | null;
  userEmail: string;
  rank: number | null;
  scoresCount: number;
  questsCount: number;
  achievements: Achievement[];
  byGame: Record<string, { best: number; plays: number }>;
}

export function ProfileUI({ profile, userEmail, rank, scoresCount, questsCount, achievements, byGame }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const side = (profile?.side ?? "human") as Side;
  const meta = SIDE_META[side];
  const rankInfo = getRank(profile?.total_score ?? 0);

  const shareProfile = async () => {
    const url = `${window.location.origin}/u/${encodeURIComponent(profile?.username ?? "")}`;
    if (navigator.share) {
      try { await navigator.share({ title: "AI vs Human", url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast(t.dashboard.copied, "success");
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <div className="text-xs text-side/60 uppercase tracking-[0.3em] mb-2">{t.profile.path}</div>
        <div className="flex items-center gap-4 flex-wrap">
          <GlitchText text={profile?.username ?? "agent"} as="h1" className="text-3xl sm:text-5xl" />
          <span className={`px-3 py-1 text-xs uppercase tracking-widest ${side === "ai" ? "side-badge-ai" : "side-badge-human"}`}>
            {meta.name}
          </span>
          <button onClick={shareProfile}
            className="ml-auto btn-matrix text-xs flex items-center gap-1.5 px-3 py-1.5">
            <Share2 size={13} /> {t.dashboard.share}
          </button>
        </div>
      </section>

      {/* Rank ladder */}
      <section className="terminal-box p-5 sm:p-6">
        <div className="flex items-end justify-between mb-3 flex-wrap gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-fg/40">{t.ranks.rank}</div>
            <div className="font-display text-2xl sm:text-3xl text-side uppercase tracking-wider"
              style={{ textShadow: "0 0 14px var(--side-color)" }}>
              {t.ranks[rankInfo.key]}
            </div>
          </div>
          <div className="text-right text-xs text-fg/50">
            {rankInfo.next ? (
              <>
                <span className="text-side tabular-nums font-bold">{rankInfo.toNext.toLocaleString()}</span>{" "}
                {t.ranks.toNext} <span className="text-side">{t.ranks[rankInfo.next]}</span>
              </>
            ) : (
              t.ranks.maxRank
            )}
          </div>
        </div>
        <div className="h-2 rounded-full overflow-hidden bg-black/60 border border-fg/10">
          <div className="h-full rounded-full bg-side"
            style={{ width: `${Math.round(rankInfo.progress * 100)}%`, boxShadow: "0 0 10px var(--side-color)" }} />
        </div>
      </section>

      <MotionGrid className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MotionGridItem><Stat label={t.profile.totalScore}  value={profile?.total_score ?? 0} animated /></MotionGridItem>
        <MotionGridItem><Stat label={t.profile.rank}        value={rank ? `#${rank}` : "—"} /></MotionGridItem>
        <MotionGridItem><Stat label={t.profile.gamesPlayed} value={String(scoresCount)} /></MotionGridItem>
        <MotionGridItem><Stat label={t.profile.questsDone}  value={String(questsCount)} /></MotionGridItem>
      </MotionGrid>

      <section className="terminal-box p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-side/70 mb-4">{t.profile.gameRecords}</div>
        <MotionGrid className="grid sm:grid-cols-2 gap-3">
          {(Object.keys(GAME_KEYS) as GameKind[]).map(g => {
            const data = byGame[g];
            const titleKey = GAME_KEYS[g];
            return (
              <MotionGridItem key={g} className="flex items-center justify-between border border-side/20 px-4 py-3">
                <div>
                  <div className="text-side font-mono text-sm">{t.games[titleKey].title}</div>
                  <div className="text-[10px] text-fg/40 uppercase tracking-widest">
                    {data ? `${data.plays} ${t.profile.plays}` : t.profile.notPlayed}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-fg/40 uppercase">{t.profile.best}</div>
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
          <span className="text-xs uppercase tracking-[0.2em] text-side/70">{t.profile.badges}</span>
          <Link href="/achievements" className="text-xs text-side hover:underline">{t.profile.viewAll}</Link>
        </div>
        {achievements.length > 0 ? (
          <MotionGrid className="flex flex-wrap gap-2" stagger={0.06} delayChildren={0.15}>
            {achievements.map(a => (
              <MotionGridItem key={a.id}><AchievementBadge achievement={a} /></MotionGridItem>
            ))}
          </MotionGrid>
        ) : (
          <p className="text-fg/40 text-sm">{t.profile.noBadges}</p>
        )}
      </section>

      <section className="terminal-box p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-side/70 mb-3">{t.profile.identity}</div>
        <dl className="space-y-2 text-sm font-mono">
          <Row label={t.profile.agentId}    value={profile?.username ?? "—"} />
          <Row label={t.profile.email}      value={userEmail} />
          <Row label={t.profile.allegiance} value={meta.name} />
          <Row label={t.profile.enlisted}   value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"} />
        </dl>
      </section>
    </div>
  );
}

function Stat({ label, value, animated }: { label: string; value: string | number; animated?: boolean }) {
  return (
    <div className="terminal-box p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-fg/50">{label}</div>
      <div className="font-display text-xl sm:text-2xl text-side mt-1 tabular-nums">
        {animated && typeof value === "number"
          ? <AnimatedCounter value={value} duration={1400} />
          : typeof value === "number" ? formatScore(value) : value}
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
