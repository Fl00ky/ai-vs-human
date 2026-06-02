"use client";

import { motion } from "framer-motion";
import {
  Zap, Brain, Eye, Code, Grid3x3, Database, Gamepad2,
  TrendingUp, Medal, Trophy, CheckCircle, Crown, Star, ZapOff,
  type LucideIcon,
} from "lucide-react";
import type { Achievement, Rarity } from "@/lib/types/database";
import { formatScore } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";
import { localizeAchievement } from "@/lib/achievementsContent";

const ICON_MAP: Record<string, LucideIcon> = {
  zap: Zap,
  brain: Brain,
  eye: Eye,
  "zap-fast": Zap,
  star: Star,
  code: Code,
  grid: Grid3x3,
  database: Database,
  gamepad: Gamepad2,
  "trending-up": TrendingUp,
  medal: Medal,
  trophy: Trophy,
  "check-circle": CheckCircle,
  crown: Crown,
};

const RARITY_STYLE: Record<Rarity, { color: string; label: string; glow: string }> = {
  common: { color: "#a8b8c0", label: "common", glow: "rgba(168,184,192,0.4)" },
  rare: { color: "#00d4ff", label: "rare", glow: "rgba(0,212,255,0.6)" },
  epic: { color: "#c060ff", label: "epic", glow: "rgba(192,96,255,0.7)" },
  legendary: { color: "#ffaa00", label: "legendary", glow: "rgba(255,170,0,0.8)" },
};

interface AchievementCardProps {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt?: string;
  compact?: boolean;
}

export function AchievementCard({
  achievement,
  unlocked,
  unlockedAt,
  compact = false,
}: AchievementCardProps) {
  const { t, lang } = useLanguage();
  const Icon = ICON_MAP[achievement.icon] ?? ZapOff;
  const rarity = RARITY_STYLE[achievement.rarity];
  const loc = localizeAchievement(lang, achievement.id, achievement);
  const rarityLabel = t.achievements.rarity[achievement.rarity];

  return (
    <motion.div
      whileHover={unlocked ? { y: -2 } : {}}
      className={`relative flex items-center gap-3 p-3 border transition-all ${
        unlocked
          ? "bg-black/60"
          : "bg-black/30 opacity-50"
      } ${compact ? "" : "sm:p-4"}`}
      style={{
        borderColor: unlocked ? rarity.color : "rgba(255,255,255,0.1)",
        boxShadow: unlocked ? `0 0 12px ${rarity.glow}` : "none",
      }}
    >
      <div
        className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border"
        style={{
          borderColor: unlocked ? rarity.color : "rgba(255,255,255,0.15)",
          color: unlocked ? rarity.color : "rgba(255,255,255,0.3)",
          background: unlocked ? `${rarity.color}15` : "transparent",
        }}
      >
        <Icon size={compact ? 18 : 22} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="font-display text-sm sm:text-base uppercase tracking-wider truncate"
            style={{ color: unlocked ? rarity.color : "rgba(255,255,255,0.5)" }}
          >
            {loc.title}
          </span>
          <span
            className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 border flex-shrink-0"
            style={{
              color: rarity.color,
              borderColor: `${rarity.color}55`,
            }}
          >
            {rarityLabel}
          </span>
        </div>
        <p className="text-xs text-fg/60 mt-0.5">{loc.description}</p>
        {unlocked && unlockedAt && (
          <div className="text-[10px] text-fg/40 mt-0.5">
            {new Date(unlockedAt).toLocaleDateString()}
          </div>
        )}
      </div>
      <div
        className="text-right flex-shrink-0 font-display"
        style={{ color: unlocked ? rarity.color : "rgba(255,255,255,0.3)" }}
      >
        <div className="text-xs">+{formatScore(achievement.points)}</div>
      </div>
    </motion.div>
  );
}

/** Compact pill version for profile / leaderboard */
export function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const { lang } = useLanguage();
  const Icon = ICON_MAP[achievement.icon] ?? ZapOff;
  const rarity = RARITY_STYLE[achievement.rarity];
  const loc = localizeAchievement(lang, achievement.id, achievement);
  return (
    <div
      className="flex items-center justify-center w-8 h-8 border"
      style={{
        borderColor: rarity.color,
        color: rarity.color,
        background: `${rarity.color}15`,
        boxShadow: `0 0 8px ${rarity.glow}`,
      }}
      title={`${loc.title} — ${loc.description}`}
    >
      <Icon size={14} />
    </div>
  );
}
