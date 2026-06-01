"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/context";

export function LivePulse() {
  const [agents,   setAgents]   = useState(1247);
  const [aiPct,    setAiPct]    = useState(52);
  const [pulseKey, setPulseKey] = useState(0);
  const [mounted,  setMounted]  = useState(false);
  const { t } = useLanguage();

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
      setAgents(n => Math.max(900, Math.min(1800, n + Math.floor(Math.random() * 7) - 3)));
      setAiPct(p  => Math.max(42,  Math.min(58,   p + (Math.random() < 0.5 ? -1 : 1))));
      setPulseKey(k => k + 1);
      schedule();
    };
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => { timer = setTimeout(tick, 3800 + Math.random() * 2400); };
    schedule();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [mounted]);

  const humanPct = 100 - aiPct;

  return (
    <div className="flex flex-col items-center gap-3 px-5 py-4 rounded-xl bg-black/55 backdrop-blur-sm border border-matrix-green/25">
      <div
        className="text-[10px] sm:text-[11px] uppercase tracking-[0.5em] text-matrix-green/70 font-mono font-bold"
        style={{ textShadow: "0 0 8px rgba(0,255,65,0.6)" }}
      >
        {t.landing.liveStatus}
      </div>

      <motion.div key={pulseKey} initial={{ opacity: 0.6 }} animate={{ opacity: [0.6, 1, 0.85] }} transition={{ duration: 1.0 }}
        className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-mono uppercase tracking-[0.22em] font-bold"
      >
        <span className="inline-flex items-center gap-1.5 text-white/90">
          <span className="w-2 h-2 rounded-full bg-matrix-green animate-pulse" style={{ boxShadow: "0 0 8px #00ff41" }} />
          <span className="text-matrix-green tabular-nums" style={{ textShadow: "0 0 8px #00ff41" }}>{agents.toLocaleString()}</span>
          <span className="text-white/70">{t.landing.agents}</span>
        </span>
        <span className="text-fg/30">·</span>
        <span className="tabular-nums" style={{ color: "#ff3860", textShadow: "0 0 10px #ff003c" }}>{aiPct}% {t.common.ai}</span>
        <span className="text-fg/40 normal-case tracking-normal text-[10px]">vs</span>
        <span className="tabular-nums" style={{ color: "#3ce0ff", textShadow: "0 0 10px #00d4ff" }}>{humanPct}% {t.common.human}</span>
      </motion.div>

      <div className="w-48 sm:w-64 h-1.5 rounded-full overflow-hidden bg-black/60 border border-fg/10">
        <motion.div className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, #ff003c ${aiPct}%, #00d4ff ${aiPct}%)`, boxShadow: "0 0 12px rgba(0,212,255,0.5)" }}
          animate={{ width: "100%" }} transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
