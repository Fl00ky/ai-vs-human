"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { Play, RotateCcw, ArrowLeft } from "lucide-react";
import { formatScore } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { useSound } from "@/components/sound/SoundProvider";
import { BootSequence } from "@/components/matrix/Terminal";
import { useLanguage } from "@/lib/i18n/context";
import type { GameKind } from "@/lib/types/database";

interface GameShellProps {
  title: string;
  description: string;
  game: GameKind;
  render: (onFinish: (score: number, extras?: GameExtras) => void) => ReactNode;
  renderHud?: () => ReactNode;
}

interface GameExtras {
  detail?: number;
  firstTry?: boolean;
}

interface UnlockedAch {
  id: string; title: string; rarity: string; points: number;
}

type Phase = "idle" | "boot" | "ready" | "playing" | "finished" | "saving" | "saved";

export function GameShell({ title, description, game, render, renderHud }: GameShellProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { play } = useSound();
  const { t } = useLanguage();
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const start = () => {
    setScore(0); setError(null); setPhase("boot"); play("click");
  };

  const finish = async (final: number, extras: GameExtras = {}) => {
    setScore(final); setPhase("finished");
    play(final > 0 ? "win" : "lose");
    if (final > 0) {
      confetti({ particleCount: Math.min(200, Math.floor(final / 10)), spread: 70, origin: { y: 0.6 }, colors: ["#00ff41", "#ff003c", "#00d4ff"] });
    }
    setTimeout(async () => {
      setPhase("saving");
      try {
        const res = await fetch("/api/games/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ game, score: final, ...extras }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Could not save score");
        }
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; unlocked?: UnlockedAch[] };
        setPhase("saved");
        toast(`+${formatScore(final)} pts saved to your side`, "success");
        (data.unlocked ?? []).forEach((ach, i) => {
          setTimeout(() => { toast(`★ Unlocked: ${ach.title} (+${ach.points})`, "success"); play("unlock"); }, 400 * (i + 1));
        });
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Save failed";
        setError(msg); toast(`Save failed: ${msg}`, "error"); setPhase("finished");
      }
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={() => router.push("/games")}
            className="text-xs text-fg/40 hover:text-side flex items-center gap-1 mb-2">
            <ArrowLeft size={12} /> {t.gameShell.backToGames}
          </button>
          <h1 className="font-display text-3xl sm:text-4xl text-side uppercase tracking-wider">{title}</h1>
          <p className="text-sm text-fg/60 mt-1 max-w-xl">{description}</p>
        </div>
        {phase === "playing" && renderHud && <div className="text-right">{renderHud()}</div>}
      </div>

      <div className="terminal-box p-6 min-h-[420px] flex items-center justify-center relative">
        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
              <div className="text-[10px] uppercase tracking-[0.3em] text-side/60 mb-4">{t.gameShell.ready}</div>
              <button onClick={start} className="btn-matrix text-base px-8 py-3">
                <Play size={16} className="mr-2" /> {t.gameShell.startMission}
              </button>
            </motion.div>
          )}

          {phase === "boot" && (
            <motion.div key="boot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-3">
              <BootSequence
                lines={t.gameShell.bootLines}
                gap={200} speed={26} finalCursor={false}
                onDone={() => setPhase("ready")}
                className="text-xs sm:text-sm font-mono text-side/80 text-left inline-block"
              />
            </motion.div>
          )}

          {phase === "ready" && (
            <motion.div key="ready" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }} className="text-center">
              <motion.button onClick={() => setPhase("playing")} className="btn-matrix text-base px-8 py-3"
                animate={{ boxShadow: ["0 0 0 0 var(--side-color)", "0 0 20px 2px var(--side-color)", "0 0 0 0 var(--side-color)"] }}
                transition={{ duration: 1.8, repeat: Infinity }}>
                <Play size={16} className="mr-2" /> {t.gameShell.begin}
              </motion.button>
            </motion.div>
          )}

          {phase === "playing" && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
              {render(finish)}
            </motion.div>
          )}

          {(phase === "finished" || phase === "saving" || phase === "saved") && (
            <motion.div key="finished" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
              <div className="text-[10px] uppercase tracking-[0.3em] text-side/60 mb-2">{t.gameShell.missionComplete}</div>
              <div className="font-display text-6xl sm:text-7xl text-side tabular-nums mb-2 drop-shadow-[0_0_20px_var(--side-color)]">
                {formatScore(score)}
              </div>
              <div className="text-xs text-fg/50 mb-6">{t.gameShell.pointsForSide}</div>
              {phase === "saving" && <div className="text-xs text-side animate-pulse">{t.gameShell.uploading}</div>}
              {phase === "saved"  && <div className="text-xs text-matrix-green">{t.gameShell.recorded}</div>}
              {error && <div className="text-xs text-ai-red mb-3">! {error}</div>}
              <div className="flex gap-3 justify-center mt-4">
                <button onClick={start} className="btn-matrix">
                  <RotateCcw size={14} className="mr-1" /> {t.gameShell.playAgain}
                </button>
                <button onClick={() => router.push("/games")} className="btn-matrix">
                  {t.gameShell.moreGames}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
