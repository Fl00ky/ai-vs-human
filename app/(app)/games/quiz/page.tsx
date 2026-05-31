"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { GameShell } from "@/components/games/GameShell";
import { useSound } from "@/components/sound/SoundProvider";
import { pickRandomItems, type QuizItem } from "@/lib/games/quiz-data";

const ROUNDS = 8;
const ROUND_MS = 8000;
const MAX_PER_ROUND = 200;

export default function QuizGame() {
  return (
    <GameShell
      game="quiz"
      title="AI or Human?"
      description="Each round shows you a fragment. Pick the source. Faster = more points."
      render={(onFinish) => <QuizPlay onFinish={onFinish} />}
    />
  );
}

function QuizPlay({ onFinish }: { onFinish: (score: number) => void }) {
  const { play } = useSound();
  const items = useMemo(() => pickRandomItems(ROUNDS), []);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [reveal, setReveal] = useState<"correct" | "wrong" | null>(null);
  const [startedAt, setStartedAt] = useState(performance.now());
  const [timeLeft, setTimeLeft] = useState(ROUND_MS);

  const current: QuizItem | undefined = items[round];

  // Timer
  useEffect(() => {
    if (!current || reveal) return;
    setStartedAt(performance.now());
    setTimeLeft(ROUND_MS);
    const interval = setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const left = Math.max(0, ROUND_MS - elapsed);
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(interval);
        answer(null);
      }
    }, 50);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const answer = (choice: "ai" | "human" | null) => {
    if (!current) return;
    const elapsed = performance.now() - startedAt;
    const correct = choice === current.source;
    const points = correct
      ? Math.round(50 + Math.max(0, 1 - elapsed / ROUND_MS) * (MAX_PER_ROUND - 50))
      : 0;
    if (correct) setScore((s) => s + points);
    play(correct ? "correct" : "wrong");
    setReveal(correct ? "correct" : "wrong");
    setTimeout(() => {
      setReveal(null);
      if (round + 1 >= ROUNDS) {
        onFinish(score + points);
      } else {
        setRound((r) => r + 1);
      }
    }, 1100);
  };

  if (!current) return null;

  const progress = (timeLeft / ROUND_MS) * 100;

  return (
    <div className="flex flex-col gap-6">
      {/* HUD */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-side/70 uppercase tracking-widest">
          Round {round + 1} / {ROUNDS}
        </span>
        <span className="text-side font-display text-lg tabular-nums">
          {score}
        </span>
      </div>

      {/* Timer bar */}
      <div className="h-1 bg-side/20 overflow-hidden">
        <motion.div
          className="h-full bg-side"
          style={{ width: `${progress}%` }}
          transition={{ ease: "linear" }}
        />
      </div>

      {/* Quote card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={round}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="relative bg-black/40 border border-side/30 p-6 sm:p-8 min-h-[160px] flex items-center"
        >
          <span className="absolute top-2 left-3 text-[10px] text-side/40">
            &gt; fragment_{round + 1}.txt
          </span>
          <p className="text-base sm:text-lg leading-relaxed text-fg/90 font-mono">
            &ldquo;{current.text}&rdquo;
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Answer buttons */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <ChoiceButton
          color="ai"
          disabled={!!reveal}
          onClick={() => answer("ai")}
          highlight={reveal && current.source === "ai" ? "reveal" : null}
          chosen={reveal === "correct" && current.source === "ai"}
        >
          AI
        </ChoiceButton>
        <ChoiceButton
          color="human"
          disabled={!!reveal}
          onClick={() => answer("human")}
          highlight={reveal && current.source === "human" ? "reveal" : null}
          chosen={reveal === "correct" && current.source === "human"}
        >
          HUMAN
        </ChoiceButton>
      </div>

      {reveal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-center font-display uppercase tracking-[0.3em] ${
            reveal === "correct" ? "text-matrix-green" : "text-ai-red"
          }`}
        >
          {reveal === "correct" ? "✓ correct" : "✗ wrong"} &middot; source:{" "}
          {current.source}
        </motion.div>
      )}
    </div>
  );
}

function ChoiceButton({
  color,
  children,
  disabled,
  onClick,
  highlight,
  chosen,
}: {
  color: "ai" | "human";
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
  highlight: "reveal" | null;
  chosen: boolean;
}) {
  const c = color === "ai" ? "#ff003c" : "#00d4ff";
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.03 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      animate={highlight === "reveal" ? { borderColor: c, boxShadow: `0 0 30px ${c}` } : {}}
      className="font-display text-2xl sm:text-3xl py-6 sm:py-8 uppercase tracking-[0.3em] border-2 transition-all disabled:cursor-not-allowed"
      style={{
        color: c,
        borderColor: chosen ? c : `${c}66`,
        background: chosen ? `${c}22` : "rgba(0,0,0,0.4)",
      }}
    >
      {children}
    </motion.button>
  );
}
