"use client";

import { useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Flame } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { useToast } from "@/components/Toast";

interface DailyRewardProps {
  currentStreak: number;
  longestStreak: number;
  lastCheckin: string | null; // ISO date "YYYY-MM-DD" or null
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayUTC(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function DailyReward({ currentStreak, longestStreak, lastCheckin }: DailyRewardProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Derive live state from props.
  const initialClaimed = lastCheckin === todayUTC();
  // If last check-in is neither today nor yesterday, the streak is broken: the
  // next claim will start at 1. Show that honestly.
  const streakIsLive = lastCheckin === todayUTC() || lastCheckin === yesterdayUTC();
  const shownStreak = streakIsLive ? currentStreak : 0;

  const [claimed, setClaimed] = useState(initialClaimed);
  const [streak, setStreak] = useState(shownStreak);
  const [longest, setLongest] = useState(longestStreak);

  // Next reward preview (matches SQL: 50 + (streak-1)*25, cap 300).
  const nextReward = useMemo(() => {
    const nextStreak = claimed ? streak : (streakIsLive ? currentStreak : 0) + 1;
    return Math.min(50 + (nextStreak - 1) * 25, 300);
  }, [claimed, streak, streakIsLive, currentStreak]);

  const claim = () => {
    if (claimed || pending) return;
    startTransition(async () => {
      const res = await fetch("/api/daily/claim", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error ?? "Failed", "error");
        return;
      }
      setClaimed(true);
      setStreak(data.streak);
      setLongest(data.longest);
      confetti({
        particleCount: 120,
        spread: 75,
        origin: { y: 0.4 },
        colors: ["#00ff41", "#ff003c", "#00d4ff"],
      });
      toast(`+${data.reward} ${t.dashboard.rewardAdded}`, "success");
      router.refresh();
    });
  };

  // Flame intensity scales with streak.
  const flameColor =
    streak >= 7 ? "#ff003c" : streak >= 3 ? "#ffaa00" : "var(--side-color)";

  return (
    <section className="terminal-box p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs uppercase tracking-[0.2em] text-side/70">{t.dashboard.daily}</span>
        <span className="text-[10px] uppercase tracking-widest text-fg/40">
          {t.dashboard.bestStreak}: <span className="text-side tabular-nums">{longest}</span>
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Streak display */}
        <div className="flex items-center gap-3">
          <motion.div
            animate={streak > 0 ? { scale: [1, 1.12, 1] } : {}}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <Flame size={42} style={{ color: flameColor, filter: `drop-shadow(0 0 10px ${flameColor})` }} />
          </motion.div>
          <div>
            <div className="font-display text-3xl sm:text-4xl text-side tabular-nums leading-none"
              style={{ textShadow: "0 0 14px var(--side-color)" }}>
              {streak}
            </div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-fg/50 mt-1">
              {t.dashboard.dayStreak}
            </div>
          </div>
        </div>

        {/* Claim button / claimed state */}
        <div className="flex flex-col items-end gap-1.5">
          <AnimatePresence mode="wait">
            {claimed ? (
              <motion.div
                key="claimed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-right"
              >
                <div className="text-matrix-green text-sm font-bold">✓</div>
                <div className="text-[11px] text-fg/60 uppercase tracking-widest">
                  {t.dashboard.claimedToday}
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="claim"
                onClick={claim}
                disabled={pending}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, boxShadow: [
                  "0 0 0 0 var(--side-color)",
                  "0 0 22px 2px var(--side-color)",
                  "0 0 0 0 var(--side-color)",
                ] }}
                transition={{ boxShadow: { duration: 1.8, repeat: Infinity } }}
                className="btn-matrix text-sm px-5 py-2.5 font-bold"
              >
                {pending ? t.dashboard.claiming : `${t.dashboard.claimReward} +${nextReward}`}
              </motion.button>
            )}
          </AnimatePresence>
          {!streakIsLive && currentStreak > 0 && !claimed && (
            <div className="text-[10px] text-ai-red/80 uppercase tracking-wider">
              {t.dashboard.streakLost}
            </div>
          )}
        </div>
      </div>

      {/* 7-day progress dots */}
      <div className="flex gap-1.5 mt-5">
        {Array.from({ length: 7 }, (_, i) => {
          const filled = i < ((streak - 1) % 7) + (streak > 0 ? 1 : 0);
          return (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full transition-colors"
              style={{
                background: filled ? "var(--side-color)" : "rgba(255,255,255,0.1)",
                boxShadow: filled ? "0 0 6px var(--side-color)" : "none",
              }}
            />
          );
        })}
      </div>
    </section>
  );
}
