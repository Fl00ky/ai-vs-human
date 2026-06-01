"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/context";

export interface SeasonState {
  number: number;
  started_at: string;
  ends_at: string;
  ai_score: number;
  human_score: number;
  my_wins: number;
  last: {
    number: number;
    winner: "ai" | "human" | null;
    ai_score: number;
    human_score: number;
  } | null;
}

function useCountdown(target: string) {
  const [ms, setMs] = useState(() => new Date(target).getTime() - Date.now());
  useEffect(() => {
    const id = setInterval(() => setMs(new Date(target).getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  const clamped = Math.max(0, ms);
  return {
    d: Math.floor(clamped / 86_400_000),
    h: Math.floor((clamped % 86_400_000) / 3_600_000),
    m: Math.floor((clamped % 3_600_000) / 60_000),
    s: Math.floor((clamped % 60_000) / 1000),
  };
}

export function SeasonWar({ season }: { season: SeasonState }) {
  const { t } = useLanguage();
  const { d, h, m, s } = useCountdown(season.ends_at);

  const ai = season.ai_score;
  const hu = season.human_score;
  const total = ai + hu;
  const aiPct = total > 0 ? Math.round((ai / total) * 100) : 50;

  // Winner banner for the most recently ended season (dismissible per number).
  const [showBanner, setShowBanner] = useState(false);
  useEffect(() => {
    if (!season.last) return;
    const key = `season_banner_dismissed_${season.last.number}`;
    if (localStorage.getItem(key) !== "1") setShowBanner(true);
  }, [season.last]);

  const dismissBanner = () => {
    if (season.last) localStorage.setItem(`season_banner_dismissed_${season.last.number}`, "1");
    setShowBanner(false);
  };

  const last = season.last;
  const winnerColor =
    last?.winner === "ai" ? "#ff003c" : last?.winner === "human" ? "#00d4ff" : "#00ff41";
  const winnerName = last?.winner === "ai" ? t.common.ai : last?.winner === "human" ? t.common.human : t.dashboard.draw;

  return (
    <section className="terminal-box p-5 sm:p-6 relative overflow-hidden">
      {/* Winner banner */}
      <AnimatePresence>
        {showBanner && last && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 rounded-lg border bg-black/70 flex items-center justify-between gap-3"
            style={{ borderColor: `${winnerColor}80`, boxShadow: `0 0 24px ${winnerColor}40` }}
          >
            <div className="text-sm">
              <span className="uppercase tracking-[0.2em] text-fg/50 text-[10px]">
                {t.dashboard.season} {last.number} · {t.dashboard.seasonOver}
              </span>
              <div className="font-display text-lg uppercase tracking-wider" style={{ color: winnerColor, textShadow: `0 0 12px ${winnerColor}` }}>
                {last.winner ? `${winnerName} ${t.dashboard.lastSeasonWon}` : t.dashboard.draw}
              </div>
            </div>
            <button onClick={dismissBanner} className="text-fg/40 hover:text-side text-lg leading-none px-2" aria-label="Dismiss">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header: season number + countdown */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-side/70">{t.dashboard.seasonWar}</span>
        <div className="flex items-center gap-2">
          <span className="font-display text-side uppercase tracking-widest text-sm">
            {t.dashboard.season} {season.number}
          </span>
          {season.my_wins > 0 && (
            <span className="text-[10px] text-side/60 border border-side/40 rounded px-1.5 py-0.5">
              ★ {season.my_wins} {t.dashboard.seasonWins}
            </span>
          )}
        </div>
      </div>

      {/* Countdown */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-5">
        <span className="text-[10px] uppercase tracking-[0.3em] text-fg/40 mr-1">{t.dashboard.endsIn}</span>
        {[
          { v: d, l: t.dashboard.days },
          { v: h, l: t.dashboard.hours },
          { v: m, l: t.dashboard.mins },
          { v: s, l: t.dashboard.secs },
        ].map((u, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="font-display text-2xl sm:text-3xl text-side tabular-nums leading-none"
              style={{ textShadow: "0 0 12px var(--side-color)" }}>
              {String(u.v).padStart(2, "0")}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-fg/40 mt-0.5">{u.l}</span>
          </div>
        ))}
      </div>

      {/* Faction score bar */}
      <div className="flex items-center justify-between text-xs font-mono mb-1.5 font-bold">
        <span style={{ color: "#ff3860", textShadow: "0 0 8px #ff003c" }}>
          {t.common.ai} {ai.toLocaleString()}
        </span>
        <span style={{ color: "#3ce0ff", textShadow: "0 0 8px #00d4ff" }}>
          {hu.toLocaleString()} {t.common.human}
        </span>
      </div>
      <div className="h-3 rounded-full overflow-hidden bg-black/60 border border-fg/10 flex">
        <motion.div
          className="h-full"
          style={{ background: "linear-gradient(90deg,#ff003c,#ff3860)", boxShadow: "0 0 12px #ff003c" }}
          animate={{ width: `${aiPct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <div className="h-full flex-1" style={{ background: "linear-gradient(90deg,#3ce0ff,#00d4ff)", boxShadow: "0 0 12px #00d4ff" }} />
      </div>
    </section>
  );
}
