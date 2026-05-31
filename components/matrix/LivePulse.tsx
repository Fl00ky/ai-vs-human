"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function LivePulse() {
  const [agents,   setAgents]   = useState(1247);
  const [aiPct,    setAiPct]    = useState(52);
  const [pulseKey, setPulseKey] = useState(0);
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => {
    setMounted(true);
    setAgents(1100 + Math.floor(Math.random() * 420));
    setAiPct(47   + Math.floor(Math.random() * 9));
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      setAgents((n) => Math.max(900, Math.min(1800, n + Math.floor(Math.random() * 7) - 3)));
      setAiPct((p)  => Math.max(42,  Math.min(58,   p + (Math.random() < 0.5 ? -1 : 1))));
      setPulseKey((k) => k + 1);
      schedule();
    };

    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(tick, 3800 + Math.random() * 2400);
    };
    schedule();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [mounted]);

  const humanPct = 100 - aiPct;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Status label */}
      <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.5em] text-fg/30 font-mono">
        [ live war status ]
      </div>

      {/* Agent count + faction percentages */}
      <motion.div
        key={pulseKey}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: [0.5, 1, 0.7] }}
        transition={{ duration: 1.0 }}
        className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs font-mono uppercase tracking-[0.22em]"
      >
        {/* Live dot + agents */}
        <span className="inline-flex items-center gap-1.5 text-fg/55">
          <span className="w-1.5 h-1.5 rounded-full bg-matrix-green animate-pulse" />
          <span className="text-matrix-green/80 tabular-nums">{agents.toLocaleString()}</span>
          <span>agents</span>
        </span>

        <span className="text-fg/20">·</span>

        {/* AI percentage */}
        <span className="tabular-nums font-bold" style={{ color: "#ff003c" }}>
          {aiPct}% AI
        </span>

        <span className="text-fg/20 normal-case tracking-normal text-[10px]">vs</span>

        {/* Human percentage */}
        <span className="tabular-nums font-bold" style={{ color: "#00d4ff" }}>
          {humanPct}% Human
        </span>
      </motion.div>

      {/* Battle progress bar */}
      <div className="w-48 sm:w-64 h-1 rounded-full overflow-hidden bg-fg/10">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, #ff003c ${aiPct}%, #00d4ff ${aiPct}%)`,
          }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
