"use client";

import { motion } from "framer-motion";
import { TrendingUp, Trophy, Gamepad2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import { getRank } from "@/lib/ranks";

interface MilestonesProps {
  totalScore: number;
  globalRank: number | null;
  distinctGames: number; // 0..4
}

interface Goal {
  icon: React.ReactNode;
  label: string;
  current: number;
  target: number;
  suffix?: string;
}

export function Milestones({ totalScore, globalRank, distinctGames }: MilestonesProps) {
  const { t } = useLanguage();
  const rank = getRank(totalScore);
  const goals: Goal[] = [];

  // 1. Progress to next rank.
  if (rank.next && rank.ceil !== null) {
    goals.push({
      icon: <TrendingUp size={15} />,
      label: `${t.milestones.toRank} ${t.ranks[rank.next]}`,
      current: totalScore - rank.floor,
      target: rank.ceil - rank.floor,
      suffix: t.common.points,
    });
  }

  // 2. Break into top 10.
  if (globalRank !== null && globalRank > 10) {
    // Progress shrinks as you approach #10 (visual only).
    goals.push({
      icon: <Trophy size={15} />,
      label: `${t.milestones.reachTop10} (${t.milestones.currentlyAt} #${globalRank})`,
      current: Math.max(0, 100 - Math.min(100, (globalRank - 10))),
      target: 100,
    });
  }

  // 3. Play every mini-game.
  if (distinctGames < 4) {
    goals.push({
      icon: <Gamepad2 size={15} />,
      label: t.milestones.playAllGames,
      current: distinctGames,
      target: 4,
    });
  }

  if (goals.length === 0) return null;

  return (
    <section className="terminal-box p-5 sm:p-6">
      <div className="text-xs uppercase tracking-[0.2em] text-side/70 mb-4">{t.milestones.title}</div>
      <div className="space-y-4">
        {goals.map((g, i) => {
          const pct = Math.min(100, Math.round((g.current / g.target) * 100));
          return (
            <div key={i}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="flex items-center gap-2 text-fg/80">
                  <span className="text-side">{g.icon}</span>
                  {g.label}
                </span>
                {g.suffix ? (
                  <span className="text-side/70 tabular-nums">
                    {g.current.toLocaleString()} / {g.target.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-side/70 tabular-nums">
                    {g.target === 4 ? `${g.current}/${g.target}` : `${pct}%`}
                  </span>
                )}
              </div>
              <div className="h-1.5 rounded-full overflow-hidden bg-black/60 border border-fg/10">
                <motion.div
                  className="h-full rounded-full bg-side"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{ boxShadow: "0 0 8px var(--side-color)" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
