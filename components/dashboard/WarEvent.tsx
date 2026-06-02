"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Swords } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

export interface WarEventState {
  id: string;
  type: "surge" | "raid";
  title: string;
  multiplier: number;
  target: number | null;
  side: "ai" | "human" | null;
  starts_at: string;
  ends_at: string;
  progress: number;
}

function useCountdown(target: string) {
  const [ms, setMs] = useState(() => new Date(target).getTime() - Date.now());
  useEffect(() => {
    const id = setInterval(() => setMs(new Date(target).getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  const c = Math.max(0, ms);
  return {
    h: Math.floor(c / 3_600_000),
    m: Math.floor((c % 3_600_000) / 60_000),
    s: Math.floor((c % 60_000) / 1000),
  };
}

export function WarEvent({ event }: { event: WarEventState }) {
  const { t } = useLanguage();
  const { h, m, s } = useCountdown(event.ends_at);
  const isSurge = event.type === "surge";
  const accent = isSurge ? "#ffaa00" : "var(--side-color)";

  const pct = event.target && event.target > 0
    ? Math.min(100, Math.round((event.progress / event.target) * 100))
    : 0;
  const reached = event.target != null && event.progress >= event.target;

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="terminal-box p-5 relative overflow-hidden"
      style={{ borderColor: accent, boxShadow: `0 0 26px color-mix(in srgb, ${accent} 35%, transparent)` }}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <motion.span
            animate={{ scale: [1, 1.18, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            style={{ color: accent, filter: `drop-shadow(0 0 8px ${accent})` }}
          >
            {isSurge ? <Zap size={26} /> : <Swords size={26} />}
          </motion.span>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-fg/50">{t.events.live}</div>
            <div className="font-display text-lg uppercase tracking-wider" style={{ color: accent, textShadow: `0 0 12px ${accent}` }}>
              {event.title}
            </div>
          </div>
        </div>

        <div className="text-right">
          {isSurge && (
            <div className="font-display text-xl" style={{ color: accent }}>
              {event.multiplier}{t.events.multiplier}
            </div>
          )}
          <div className="text-xs text-fg/60 tabular-nums">
            {t.events.endsIn} {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
          </div>
        </div>
      </div>

      {/* Raid progress */}
      {event.type === "raid" && event.target != null && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-fg/60 uppercase tracking-widest">{t.events.raidGoal}</span>
            <span className="tabular-nums" style={{ color: accent }}>
              {reached ? t.events.goalReached : `${event.progress.toLocaleString()} / ${event.target.toLocaleString()}`}
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden bg-black/60 border border-fg/10">
            <motion.div
              className="h-full rounded-full"
              style={{ background: accent, boxShadow: `0 0 10px ${accent}` }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      )}
    </motion.section>
  );
}
