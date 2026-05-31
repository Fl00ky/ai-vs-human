"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell } from "@/components/games/GameShell";
import { useSound } from "@/components/sound/SoundProvider";

const ROUNDS = 5;
const MIN_DELAY = 1000;
const MAX_DELAY = 4000;

export default function ReactionGame() {
  return (
    <GameShell
      game="reaction"
      title="Reaction"
      description={`${ROUNDS} rounds. Wait for the signal, then click as fast as you can. Score = 1000 − ms.`}
      render={(onFinish) => <ReactionPlay onFinish={onFinish} />}
    />
  );
}

type Phase = "waiting" | "ready" | "clicked" | "early";

function ReactionPlay({ onFinish }: { onFinish: (score: number, extras?: { detail?: number }) => void }) {
  const { play } = useSound();
  const [round, setRound] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [phase, setPhase] = useState<Phase>("waiting");
  const [ms, setMs] = useState<number | null>(null);
  const [bestMs, setBestMs] = useState<number>(Number.MAX_SAFE_INTEGER);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<number>(0);

  const scheduleSignal = useCallback(() => {
    setPhase("waiting");
    setMs(null);
    const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
    timerRef.current = setTimeout(() => {
      startRef.current = performance.now();
      setPhase("ready");
      play("warning");
    }, delay);
  }, []);

  useEffect(() => {
    scheduleSignal();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [round, scheduleSignal]);

  const handleClick = () => {
    if (phase === "waiting") {
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase("early");
      play("wrong");
      setTimeout(() => {
        if (round + 1 >= ROUNDS) {
          onFinish(totalScore, { detail: bestMs === Number.MAX_SAFE_INTEGER ? undefined : bestMs });
        } else {
          setRound((r) => r + 1);
        }
      }, 1200);
      return;
    }
    if (phase !== "ready") return;
    const elapsed = Math.round(performance.now() - startRef.current);
    const pts = Math.max(0, 1000 - elapsed);
    const newTotal = totalScore + pts;
    const newBest = Math.min(bestMs, elapsed);
    setMs(elapsed);
    setBestMs(newBest);
    setTotalScore(newTotal);
    setPhase("clicked");
    play("correct");
    setTimeout(() => {
      if (round + 1 >= ROUNDS) {
        onFinish(newTotal, { detail: newBest });
      } else {
        setRound((r) => r + 1);
      }
    }, 1000);
  };

  const bgColor =
    phase === "ready"
      ? "rgba(0,255,65,0.15)"
      : phase === "early"
      ? "rgba(255,0,60,0.15)"
      : "rgba(0,0,0,0.4)";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between text-xs">
        <span className="text-side/70 uppercase tracking-widest">
          Round {round + 1} / {ROUNDS}
        </span>
        <span className="text-side font-display text-lg tabular-nums">
          {totalScore}
        </span>
      </div>

      <motion.button
        onClick={handleClick}
        animate={{ background: bgColor }}
        transition={{ duration: 0.15 }}
        className="w-full min-h-[300px] border-2 border-side/40 flex flex-col items-center justify-center gap-4 cursor-pointer select-none focus:outline-none"
        aria-label="Click when signal appears"
      >
        <AnimatePresence mode="wait">
          {phase === "waiting" && (
            <motion.div
              key="wait"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="font-display text-4xl text-side/40 animate-pulse">
                . . .
              </div>
              <div className="text-xs text-fg/40 mt-2 uppercase tracking-widest">
                wait for it
              </div>
            </motion.div>
          )}
          {phase === "ready" && (
            <motion.div
              key="ready"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div
                className="font-display text-6xl sm:text-8xl"
                style={{
                  color: "var(--matrix-green)",
                  textShadow: "0 0 40px #00ff41",
                }}
              >
                NOW
              </div>
            </motion.div>
          )}
          {phase === "clicked" && (
            <motion.div
              key="clicked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="font-display text-5xl text-side tabular-nums">
                {ms}ms
              </div>
              <div className="text-xs text-fg/50 mt-1">
                +{Math.max(0, 1000 - (ms ?? 0))} pts
              </div>
            </motion.div>
          )}
          {phase === "early" && (
            <motion.div
              key="early"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="font-display text-4xl text-ai-red">TOO EARLY</div>
              <div className="text-xs text-fg/50 mt-1">0 pts this round</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
