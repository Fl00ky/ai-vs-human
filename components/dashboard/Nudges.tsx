"use client";

import { motion } from "framer-motion";
import { Flame, Swords } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import type { SeasonState } from "@/components/dashboard/SeasonWar";
import type { Side } from "@/lib/utils";

interface NudgesProps {
  side: Side;
  lastCheckin: string | null;
  currentStreak: number;
  season: SeasonState | null;
}

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

export function Nudges({ side, lastCheckin, currentStreak, season }: NudgesProps) {
  const { t } = useLanguage();
  const nudges: { icon: React.ReactNode; text: string; color: string }[] = [];

  // Streak nudge — only if not yet claimed today.
  if (lastCheckin !== todayUTC()) {
    nudges.push({
      icon: <Flame size={16} />,
      text: currentStreak > 0 ? t.dashboard.nudgeStreakKeep : t.dashboard.nudgeStreakStart,
      color: "#ffaa00",
    });
  }

  // Season nudge — is the player's side behind?
  if (season) {
    const mine = side === "ai" ? season.ai_score : season.human_score;
    const them = side === "ai" ? season.human_score : season.ai_score;
    const enemyName = side === "ai" ? t.common.human : t.common.ai;
    if (them > mine) {
      nudges.push({
        icon: <Swords size={16} />,
        text: `${enemyName} ${t.dashboard.nudgeSeasonBehind}`,
        color: side === "ai" ? "#00d4ff" : "#ff003c",
      });
    } else if (mine > 0) {
      nudges.push({
        icon: <Swords size={16} />,
        text: t.dashboard.nudgeSeasonAhead,
        color: "var(--side-color)",
      });
    }
  }

  if (nudges.length === 0) return null;

  return (
    <div className="space-y-2">
      {nudges.map((n, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-black/60 border text-sm"
          style={{ borderColor: `${n.color}55` }}
        >
          <span style={{ color: n.color, filter: `drop-shadow(0 0 6px ${n.color})` }}>{n.icon}</span>
          <span className="text-fg/85 font-medium">{n.text}</span>
        </motion.div>
      ))}
    </div>
  );
}
