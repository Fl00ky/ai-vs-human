"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { GameShell } from "@/components/games/GameShell";
import { useSound } from "@/components/sound/SoundProvider";

const GRID = 9; // 3x3
const SHOW_MS = 600;
const GAP_MS = 200;

export default function PatternGame() {
  return (
    <GameShell
      game="pattern"
      title="Pattern Memory"
      description="Watch the matrix glow. Repeat the sequence. Each round adds one more cell."
      render={(onFinish) => <PatternPlay onFinish={onFinish} />}
    />
  );
}

type Phase = "showing" | "input" | "wrong" | "correct";

const MATRIX_CHARS = "アイウエオカキクケコ";

function PatternPlay({ onFinish }: { onFinish: (score: number, extras?: { detail?: number }) => void }) {
  const { play } = useSound();
  const [sequence, setSequence] = useState<number[]>([]);
  const [showing, setShowing] = useState<number | null>(null);
  const [userSeq, setUserSeq] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>("showing");
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [cellChars] = useState(() =>
    Array.from({ length: GRID }, () =>
      MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)],
    ),
  );

  const playSequence = useCallback((seq: number[]) => {
    setPhase("showing");
    setUserSeq([]);
    let i = 0;
    const next = () => {
      if (i >= seq.length) {
        setShowing(null);
        setTimeout(() => setPhase("input"), GAP_MS);
        return;
      }
      setShowing(seq[i]);
      play("tick");
      i++;
      setTimeout(() => {
        setShowing(null);
        setTimeout(next, GAP_MS);
      }, SHOW_MS);
    };
    setTimeout(next, 400);
  }, [play]);

  // Start first round
  useEffect(() => {
    const first = [Math.floor(Math.random() * GRID)];
    setSequence(first);
    playSequence(first);
  }, [playSequence]);

  const handleCell = (idx: number) => {
    if (phase !== "input") return;
    const next = [...userSeq, idx];
    setUserSeq(next);
    play("click");

    if (next[next.length - 1] !== sequence[next.length - 1]) {
      setPhase("wrong");
      play("wrong");
      // Show "wrong" state for 1.5s before finishing
      setTimeout(() => onFinish(score, { detail: round }), 1500);
      return;
    }

    if (next.length === sequence.length) {
      const pts = round * 100;
      const newScore = score + pts;
      setScore(newScore);
      setPhase("correct");
      play("correct");
      setTimeout(() => {
        const newSeq = [...sequence, Math.floor(Math.random() * GRID)];
        setSequence(newSeq);
        setRound((r) => r + 1);
        playSequence(newSeq);
      }, 700);
    }
  };

  return (
    <div className="flex flex-col gap-6 items-center">
      <div className="flex items-center justify-between w-full text-xs">
        <span className="text-side/70 uppercase tracking-widest">
          Round {round} &middot; seq length {sequence.length}
        </span>
        <span className="text-side font-display text-lg tabular-nums">{score}</span>
      </div>

      <div className="text-xs uppercase tracking-[0.3em] text-fg/50 h-4">
        {phase === "showing" && "watch..."}
        {phase === "input" && "your turn"}
        {phase === "correct" && (
          <span className="text-matrix-green">✓ correct</span>
        )}
        {phase === "wrong" && (
          <span className="text-ai-red">✗ wrong — game over</span>
        )}
      </div>

      {/* 3×3 grid */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: GRID }, (_, i) => {
          const isShowing = showing === i;
          const isUserLast =
            phase === "input" && userSeq[userSeq.length - 1] === i;
          return (
            <motion.button
              key={i}
              onClick={() => handleCell(i)}
              disabled={phase !== "input"}
              animate={
                isShowing
                  ? {
                      scale: 1.1,
                      boxShadow: "0 0 30px var(--side-color)",
                      background: "var(--side-color)",
                    }
                  : isUserLast
                  ? { scale: 1.05, background: "rgba(0,255,65,0.3)" }
                  : { scale: 1, background: "rgba(0,0,0,0.5)" }
              }
              transition={{ duration: 0.15 }}
              className="w-20 h-20 sm:w-24 sm:h-24 border border-side/40 flex items-center justify-center font-display text-2xl sm:text-3xl disabled:cursor-default focus:outline-none"
              style={{ color: isShowing ? "#000" : "var(--side-color)" }}
              aria-label={`Cell ${i + 1}`}
            >
              {cellChars[i]}
            </motion.button>
          );
        })}
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {sequence.map((_, i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              background:
                i < userSeq.length ? "var(--side-color)" : "rgba(255,255,255,0.15)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
