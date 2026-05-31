"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AnimatedCounter } from "@/components/AnimatedCounter";

interface TeamProgressProps {
  aiScore: number;
  humanScore: number;
  aiMembers?: number;
  humanMembers?: number;
  compact?: boolean;
}

export function TeamProgress({
  aiScore,
  humanScore,
  aiMembers,
  humanMembers,
  compact = false,
}: TeamProgressProps) {
  const total = aiScore + humanScore || 1;
  const aiPct = (aiScore / total) * 100;
  const humanPct = 100 - aiPct;
  const leader = aiScore === humanScore ? "tie" : aiScore > humanScore ? "ai" : "human";

  const prevLeaderRef = useRef<typeof leader>(leader);
  const [flash, setFlash] = useState(false);
  const [transmission, setTransmission] = useState<string | null>(null);

  useEffect(() => {
    const prev = prevLeaderRef.current;
    if (prev !== leader && leader !== "tie") {
      setFlash(true);
      setTransmission(
        `> LEAD ACQUIRED — ${leader === "ai" ? "AI" : "HUMAN"} takes the front`
      );
      const t1 = setTimeout(() => setFlash(false), 900);
      const t2 = setTimeout(() => setTransmission(null), 3200);
      prevLeaderRef.current = leader;
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    prevLeaderRef.current = leader;
  }, [leader]);

  return (
    <div className="w-full">
      {/* Leader-change transmission line */}
      <AnimatePresence>
        {transmission && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-xs font-mono uppercase tracking-[0.3em] mb-3 text-center"
            style={{
              color: leader === "ai" ? "var(--ai-red)" : "var(--human-blue)",
            }}
          >
            {transmission}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Labels */}
      <div className="flex items-center justify-between mb-2 text-xs sm:text-sm">
        <div className="flex flex-col">
          <span className="text-ai-red font-display uppercase tracking-[0.2em]">
            AI {leader === "ai" && "▲"}
          </span>
          <span className="text-ai-red/70 tabular-nums">
            <AnimatedCounter value={aiScore} />
          </span>
          {aiMembers !== undefined && (
            <span className="text-fg/40 text-[10px]">{aiMembers} architects</span>
          )}
        </div>
        <span className="text-fg/40 text-[10px] uppercase tracking-widest">vs</span>
        <div className="flex flex-col items-end">
          <span className="text-human-blue font-display uppercase tracking-[0.2em]">
            {leader === "human" && "▲"} HUMAN
          </span>
          <span className="text-human-blue/70 tabular-nums">
            <AnimatedCounter value={humanScore} />
          </span>
          {humanMembers !== undefined && (
            <span className="text-fg/40 text-[10px]">{humanMembers} fighters</span>
          )}
        </div>
      </div>

      {/* Bar */}
      <div
        className={`relative w-full ${compact ? "h-3" : "h-6"} bg-black border border-fg/20 overflow-hidden flex ${flash ? "leader-flash" : ""}`}
        style={{
          color: leader === "ai" ? "var(--ai-red)" : "var(--human-blue)",
        }}
        role="meter"
        aria-valuenow={Math.round(aiPct)}
        aria-label="AI versus Human score balance"
      >
        <motion.div
          className="h-full"
          style={{
            background: "linear-gradient(90deg, #4a0014, #ff003c)",
            boxShadow: "inset 0 0 10px rgba(255,0,60,0.6)",
          }}
          initial={{ width: "50%" }}
          animate={{ width: `${aiPct}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
        />
        <motion.div
          className="h-full flex-1"
          style={{
            background: "linear-gradient(90deg, #00d4ff, #003a4a)",
            boxShadow: "inset 0 0 10px rgba(0,212,255,0.6)",
          }}
          initial={{ width: "50%" }}
          animate={{ width: `${humanPct}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
        />
        {/* Center divider glow */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/80"
          style={{ left: `${aiPct}%`, transform: "translateX(-50%)", boxShadow: "0 0 10px #fff" }}
        />
      </div>

      {!compact && (
        <div className="flex justify-between mt-1 text-[10px] text-fg/40 tabular-nums">
          <span>{aiPct.toFixed(1)}%</span>
          <span>{humanPct.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}
