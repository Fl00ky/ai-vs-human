"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Cpu, ChevronUp, Swords } from "lucide-react";
import { GlitchText } from "@/components/matrix/Terminal";
import { useLanguage } from "@/lib/i18n/context";
import { useToast } from "@/components/Toast";
import type { Side } from "@/lib/utils";

interface AgentState {
  level: number;
  xp: number;
  xp_needed: number;
  shards: number;
  power: number;
  rate: number;
  war_contributed: number;
  overclock_ready_in: number;
}

const HEARTBEAT_MS = 45_000;

export function AgentGame({ side }: { side: Side }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [a, setA] = useState<AgentState | null>(null);
  const [displayShards, setDisplayShards] = useState(0);
  const [enemy, setEnemy] = useState(0);
  const [hp, setHp] = useState(100);
  const [busy, setBusy] = useState(false);
  const [ocReady, setOcReady] = useState(0);

  const enemies = side === "ai" ? t.agent.enemiesAi : t.agent.enemiesHuman;
  const color = side === "ai" ? "var(--ai-red)" : "var(--human-blue)";

  const call = useCallback(async (action: "tick" | "upgrade" | "overclock") => {
    const res = await fetch("/api/agent", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data as { error?: string; cost?: number; ready_in?: number };
    setA(data);
    setDisplayShards(data.shards);
    setOcReady(data.overclock_ready_in ?? 0);
    return data;
  }, []);

  // Initial tick + heartbeat while tab open.
  useEffect(() => {
    call("tick");
    const hb = setInterval(() => call("tick"), HEARTBEAT_MS);
    return () => clearInterval(hb);
  }, [call]);

  // Smooth client-side shard counter + combat animation between heartbeats.
  useEffect(() => {
    if (!a) return;
    const id = setInterval(() => {
      setDisplayShards((s) => s + a.rate);
      setOcReady((r) => Math.max(0, r - 1));
      // cosmetic combat: drain enemy HP at a steady pace, cycle on "kill"
      setHp((h) => {
        const next = h - Math.max(4, 100 / (6 + a.level * 0.2));
        if (next <= 0) { setEnemy((e) => e + 1); return 100; }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [a]);

  const upgrade = async () => {
    setBusy(true);
    const r = await call("upgrade");
    if (r?.error === "insufficient") toast(t.agent.insufficient, "error");
    setBusy(false);
  };

  const overclock = async () => {
    setBusy(true);
    const r = await call("overclock");
    if (r?.error === "cooldown") setOcReady(r.ready_in ?? 0);
    else if (!r?.error) toast("⚡ Overclock", "success");
    setBusy(false);
  };

  if (!a) {
    return <div className="text-fg/50 text-sm">{t.common.loading}</div>;
  }

  const upgradeCost = 50 * (a.power + 1) * (a.power + 1);
  const enemyName = enemies[enemy % enemies.length];
  const xpPct = Math.min(100, Math.round((a.xp / a.xp_needed) * 100));

  return (
    <div className="space-y-6">
      <section>
        <div className="text-xs text-side/60 uppercase tracking-[0.3em] mb-2">{t.agent.path}</div>
        <GlitchText text={t.agent.title} as="h1" className="text-3xl sm:text-5xl" />
        <p className="text-fg/60 mt-2">{t.agent.subtitle}</p>
      </section>

      {/* Combat arena */}
      <section className="terminal-box p-6 relative overflow-hidden" style={{ borderColor: color }}>
        <div className="flex items-center justify-between gap-4">
          {/* Agent */}
          <div className="text-center">
            <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
              <Cpu size={56} style={{ color, filter: `drop-shadow(0 0 12px ${color})` }} />
            </motion.div>
            <div className="text-xs mt-1 text-side font-display">LV {a.level}</div>
          </div>

          {/* VS / projectiles */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <Swords size={20} className="text-fg/30" />
            <motion.div className="h-0.5 w-full rounded" style={{ background: color }}
              animate={{ opacity: [0.3, 1, 0.3], scaleX: [0.6, 1, 0.6] }}
              transition={{ duration: 0.6, repeat: Infinity }} />
            <span className="text-[10px] text-fg/40 uppercase tracking-widest">{t.agent.defeating} {enemyName}</span>
          </div>

          {/* Enemy */}
          <div className="text-center w-28">
            <AnimatePresence mode="wait">
              <motion.div key={enemy}
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
                className="font-display text-2xl" style={{ color: side === "ai" ? "var(--human-blue)" : "var(--ai-red)" }}>
                ▣
              </motion.div>
            </AnimatePresence>
            <div className="h-1.5 mt-2 rounded-full overflow-hidden bg-black/60 border border-fg/10">
              <div className="h-full rounded-full" style={{ width: `${hp}%`, background: side === "ai" ? "var(--human-blue)" : "var(--ai-red)" }} />
            </div>
            <div className="text-[9px] mt-1 text-fg/40 tabular-nums">#{enemy + 1}</div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label={t.agent.shards} value={Math.floor(displayShards).toLocaleString()} accent={color} />
        <Stat label={`${a.rate}${t.agent.rate}`} value={`${t.agent.power} ${a.power}`} accent={color} />
        <Stat label={t.agent.level} value={`${a.level} · ${xpPct}%`} accent={color} />
        <Stat label={t.agent.warFed} value={a.war_contributed.toLocaleString()} accent={color} />
      </section>

      {/* Actions */}
      <section className="flex gap-3 flex-wrap">
        <button onClick={upgrade} disabled={busy || displayShards < upgradeCost}
          className="btn-matrix flex items-center gap-2">
          <ChevronUp size={15} /> {t.agent.upgrade} <span className="opacity-60">({upgradeCost.toLocaleString()})</span>
        </button>
        <button onClick={overclock} disabled={busy || ocReady > 0}
          className="btn-matrix flex items-center gap-2">
          <Zap size={15} /> {t.agent.overclock}
          {ocReady > 0 && <span className="opacity-60">{Math.floor(ocReady / 60)}:{String(ocReady % 60).padStart(2, "0")}</span>}
        </button>
      </section>

      <p className="text-xs text-fg/40 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-matrix-green animate-pulse" />
        {t.agent.keepOpen}
      </p>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="terminal-box p-3 text-center">
      <div className="font-display text-lg sm:text-xl tabular-nums" style={{ color: accent }}>{value}</div>
      <div className="text-[10px] uppercase tracking-[0.15em] text-fg/50 mt-0.5">{label}</div>
    </div>
  );
}
