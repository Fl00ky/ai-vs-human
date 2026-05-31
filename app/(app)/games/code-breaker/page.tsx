"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { GameShell } from "@/components/games/GameShell";

const CHARS = "アイウエオカキクケコ0123456789ABCDEF#$%&";
const CODE_LEN = 4;
const GAME_SECS = 30;

export default function CodeBreakerGame() {
  return (
    <GameShell
      game="code_breaker"
      title="Code Breaker"
      description={`Find the hidden ${CODE_LEN}-char sequence in the falling code. Type it before time runs out.`}
      render={(onFinish) => <CodeBreakerPlay onFinish={onFinish} />}
    />
  );
}

function randomCode() {
  return Array.from({ length: CODE_LEN }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)],
  ).join("");
}

function CodeBreakerPlay({ onFinish }: { onFinish: (score: number, extras?: { firstTry?: boolean }) => void }) {
  const code = useMemo(() => randomCode(), []);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(GAME_SECS);
  const [solved, setSolved] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const startRef = useRef(performance.now());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const interval = setInterval(() => {
      const elapsed = (performance.now() - startRef.current) / 1000;
      const left = Math.max(0, GAME_SECS - elapsed);
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(interval);
        onFinish(0);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [onFinish]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    if (input.toUpperCase() === code.toUpperCase()) {
      setSolved(true);
      const timeBonus = Math.round((timeLeft / GAME_SECS) * 700);
      const attemptsBonus = Math.max(0, 300 - (newAttempts - 1) * 50);
      onFinish(timeBonus + attemptsBonus, { firstTry: newAttempts === 1 });
    } else {
      setWrong(true);
      setInput("");
      setTimeout(() => setWrong(false), 600);
    }
  };

  const timerPct = (timeLeft / GAME_SECS) * 100;
  const timerColor =
    timerPct > 50 ? "var(--matrix-green)" : timerPct > 25 ? "#ffaa00" : "#ff003c";

  return (
    <div className="flex flex-col gap-6">
      {/* Timer */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-side/70 uppercase tracking-widest">
          {Math.ceil(timeLeft)}s remaining
        </span>
        <span className="text-side font-display text-lg tabular-nums">
          {attempts} attempts
        </span>
      </div>
      <div className="h-1 bg-side/20 overflow-hidden">
        <motion.div
          className="h-full"
          style={{ width: `${timerPct}%`, background: timerColor }}
          transition={{ ease: "linear" }}
        />
      </div>

      {/* Falling code display */}
      <FallingCode code={code} solved={solved} />

      {/* Input */}
      <AnimatePresence>
        {!solved && (
          <motion.form
            onSubmit={submit}
            className="flex gap-2"
            animate={wrong ? { x: [-6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.3 }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, CODE_LEN))}
              maxLength={CODE_LEN}
              className="input-matrix flex-1 text-center text-2xl tracking-[0.5em] uppercase"
              placeholder="_ _ _ _"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" className="btn-matrix px-6">
              Crack
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {wrong && (
        <div className="text-center text-xs text-ai-red animate-pulse">
          ! sequence mismatch — try again
        </div>
      )}
    </div>
  );
}

function FallingCode({ code, solved }: { code: string; solved: boolean }) {
  const [grid, setGrid] = useState<string[][]>(() =>
    Array.from({ length: 8 }, () =>
      Array.from({ length: 20 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]),
    ),
  );
  // Inject the code at a random position in the grid
  const [codePos] = useState(() => ({
    row: Math.floor(Math.random() * 8),
    col: Math.floor(Math.random() * (20 - CODE_LEN)),
  }));

  useEffect(() => {
    if (solved) return;
    const interval = setInterval(() => {
      setGrid((prev) =>
        prev.map((row, ri) =>
          row.map((_, ci) => {
            // Keep code chars stable
            if (ri === codePos.row && ci >= codePos.col && ci < codePos.col + CODE_LEN) {
              return code[ci - codePos.col];
            }
            return Math.random() > 0.85
              ? CHARS[Math.floor(Math.random() * CHARS.length)]
              : prev[ri][ci];
          }),
        ),
      );
    }, 120);
    return () => clearInterval(interval);
  }, [code, codePos, solved]);

  return (
    <div className="font-mono text-xs sm:text-sm leading-relaxed overflow-hidden select-none">
      {grid.map((row, ri) => (
        <div key={ri} className="flex gap-1 sm:gap-2">
          {row.map((ch, ci) => {
            const isCode =
              ri === codePos.row &&
              ci >= codePos.col &&
              ci < codePos.col + CODE_LEN;
            return (
              <span
                key={ci}
                className="w-4 text-center"
                style={{
                  color: isCode
                    ? solved
                      ? "var(--matrix-green)"
                      : "var(--side-color)"
                    : "rgba(0,255,65,0.3)",
                  textShadow: isCode ? "0 0 8px var(--side-color)" : "none",
                  fontWeight: isCode ? "bold" : "normal",
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
