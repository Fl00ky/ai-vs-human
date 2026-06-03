"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Cpu, ChevronUp, Swords, Sword, Shield, Heart, Box, Package, Trash2 } from "lucide-react";
import { GlitchText } from "@/components/matrix/Terminal";
import { useLanguage } from "@/lib/i18n/context";
import { useToast } from "@/components/Toast";
import type { Side } from "@/lib/utils";

type Rarity = "common" | "rare" | "epic" | "legendary";
type Slot = "weapon" | "armor" | "implant" | "core" | "boots" | "shield";
const SLOTS: Slot[] = ["weapon", "armor", "implant", "core", "boots", "shield"];
const RARITY_COLOR: Record<Rarity, string> = {
  common: "#a8b8c0", rare: "#00d4ff", epic: "#c060ff", legendary: "#ffaa00",
};

interface Item { id: string; slot?: Slot; rarity: Rarity; power: number }
interface AgentState {
  level: number; xp: number; xp_needed: number; shards: number; power: number;
  stage: number; chests: number; rate: number; atk: number; def: number; hp: number;
  gear_power: number; war_contributed: number; overclock_ready_in: number;
  equipped: Partial<Record<Slot, Item>>;
  inventory: Item[];
}

const HEARTBEAT_MS = 45_000;

export function AgentGame({ side }: { side: Side }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [a, setA] = useState<AgentState | null>(null);
  const [shownShards, setShownShards] = useState(0);
  const [enemy, setEnemy] = useState(0);
  const [hp, setHp] = useState(100);
  const [ocReady, setOcReady] = useState(0);
  const [busy, setBusy] = useState(false);

  const enemies = side === "ai" ? t.agent.enemiesAi : t.agent.enemiesHuman;
  const color = side === "ai" ? "var(--ai-red)" : "var(--human-blue)";
  const enemyColor = side === "ai" ? "var(--human-blue)" : "var(--ai-red)";

  const call = useCallback(async (body: object) => {
    const res = await fetch("/api/agent", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) { setA(data); setShownShards(data.shards); setOcReady(data.overclock_ready_in ?? 0); }
    return data as AgentState & { error?: string; ready_in?: number; item?: Item };
  }, []);

  useEffect(() => {
    call({ action: "tick" });
    const hb = setInterval(() => call({ action: "tick" }), HEARTBEAT_MS);
    return () => clearInterval(hb);
  }, [call]);

  useEffect(() => {
    if (!a) return;
    const id = setInterval(() => {
      setShownShards((s) => s + a.rate);
      setOcReady((r) => Math.max(0, r - 1));
      setHp((h) => {
        const next = h - Math.max(5, 100 / (5 + a.level * 0.15));
        if (next <= 0) { setEnemy((e) => e + 1); return 100; }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [a]);

  const open = async () => { setBusy(true); const r = await call({ action: "open" }); if (r?.item?.slot) toast(`${t.agent.slots[r.item.slot]} · ${r.item.rarity}`, "success"); setBusy(false); };
  const upgrade = async () => { setBusy(true); const r = await call({ action: "upgrade" }); if (r?.error === "insufficient") toast(t.agent.insufficient, "error"); setBusy(false); };
  const overclock = async () => { setBusy(true); const r = await call({ action: "overclock" }); if (r?.error === "cooldown") setOcReady(r.ready_in ?? 0); setBusy(false); };
  const equip = (id: string) => call({ action: "equip", id });
  const salvage = (id: string) => call({ action: "salvage", id });

  if (!a) return <div className="text-fg/50 text-sm">{t.common.loading}</div>;

  const upgradeCost = 50 * (a.power + 1) * (a.power + 1);
  const enemyName = enemies[enemy % enemies.length];
  const xpPct = Math.min(100, Math.round((a.xp / a.xp_needed) * 100));

  return (
    <div className="space-y-5">
      {/* Header + resources */}
      <section className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs text-side/60 uppercase tracking-[0.3em] mb-1">{t.agent.path}</div>
          <GlitchText text={t.agent.title} as="h1" className="text-2xl sm:text-4xl" />
        </div>
        <div className="flex gap-2 text-xs">
          <span className="terminal-box px-3 py-1.5 tabular-nums" style={{ color }}>◈ {Math.floor(shownShards).toLocaleString()}</span>
          <span className="terminal-box px-3 py-1.5 tabular-nums text-side">{t.agent.sector} {a.stage}</span>
        </div>
      </section>

      {/* Combat arena */}
      <section className="terminal-box p-5 relative overflow-hidden" style={{ borderColor: color }}>
        <div className="flex items-center justify-between gap-4">
          <div className="text-center">
            <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
              <Cpu size={52} style={{ color, filter: `drop-shadow(0 0 12px ${color})` }} />
            </motion.div>
            <div className="text-xs mt-1 text-side font-display">LV {a.level}</div>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <Swords size={18} className="text-fg/30" />
            <motion.div className="h-0.5 w-full rounded" style={{ background: color }}
              animate={{ opacity: [0.3, 1, 0.3], scaleX: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity }} />
            <span className="text-[10px] text-fg/40 uppercase tracking-widest">{t.agent.defeating} {enemyName}</span>
          </div>
          <div className="text-center w-24">
            <AnimatePresence mode="wait">
              <motion.div key={enemy} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
                className="font-display text-3xl" style={{ color: enemyColor }}>▣</motion.div>
            </AnimatePresence>
            <div className="h-1.5 mt-2 rounded-full overflow-hidden bg-black/60 border border-fg/10">
              <div className="h-full rounded-full" style={{ width: `${hp}%`, background: enemyColor }} />
            </div>
            <div className="text-[9px] mt-1 text-fg/40 tabular-nums">#{enemy + 1}</div>
          </div>
        </div>
      </section>

      {/* Stat bar (ATK / DEF / HP) + level progress */}
      <section className="terminal-box p-4">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <StatPill icon={<Sword size={14} />} label={t.agent.atk} value={a.atk} c="#ff5a36" />
          <StatPill icon={<Shield size={14} />} label={t.agent.def} value={a.def} c="#00d4ff" />
          <StatPill icon={<Heart size={14} />} label={t.agent.hp} value={a.hp} c="#ff3b6b" />
        </div>
        <div className="flex items-center gap-2 text-[10px] text-fg/50">
          <span className="font-display text-side">LV {a.level}</span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-black/60 border border-fg/10">
            <div className="h-full rounded-full bg-side" style={{ width: `${xpPct}%`, boxShadow: "0 0 6px var(--side-color)" }} />
          </div>
          <span className="tabular-nums">{a.rate}{t.agent.rate}</span>
        </div>
      </section>

      {/* Gear grid */}
      <section>
        <div className="text-xs uppercase tracking-[0.2em] text-side/70 mb-2">{t.agent.gear}</div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {SLOTS.map((slot) => {
            const it = a.equipped[slot];
            const rc = it ? RARITY_COLOR[it.rarity] : "rgba(255,255,255,0.12)";
            return (
              <div key={slot} className="aspect-square border flex flex-col items-center justify-center text-center p-1"
                style={{ borderColor: rc, background: it ? `${rc}12` : "rgba(0,0,0,0.3)", boxShadow: it ? `0 0 10px ${rc}55` : "none" }}>
                <span className="text-[8px] uppercase tracking-wider text-fg/40">{t.agent.slots[slot]}</span>
                {it ? (
                  <span className="font-display text-sm tabular-nums" style={{ color: rc }}>{it.power}</span>
                ) : (
                  <span className="text-[9px] text-fg/25">{t.agent.empty}</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Actions */}
      <section className="flex gap-2 flex-wrap">
        <button onClick={open} disabled={busy || a.chests <= 0} className="btn-matrix flex items-center gap-2">
          <Box size={15} /> {t.agent.openChest} <span className="opacity-60">×{a.chests}</span>
        </button>
        <button onClick={upgrade} disabled={busy || shownShards < upgradeCost} className="btn-matrix flex items-center gap-2">
          <ChevronUp size={15} /> {t.agent.upgrade} <span className="opacity-60">({upgradeCost.toLocaleString()})</span>
        </button>
        <button onClick={overclock} disabled={busy || ocReady > 0} className="btn-matrix flex items-center gap-2">
          <Zap size={15} /> {t.agent.overclock}{ocReady > 0 && <span className="opacity-60">{Math.floor(ocReady/60)}:{String(ocReady%60).padStart(2,"0")}</span>}
        </button>
      </section>

      {/* Inventory */}
      <section>
        <div className="text-xs uppercase tracking-[0.2em] text-side/70 mb-2 flex items-center gap-2">
          <Package size={13} /> {t.agent.inventory}
        </div>
        {a.inventory.length === 0 ? (
          <div className="text-fg/40 text-sm">{t.agent.noLoot}</div>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {a.inventory.map((it) => {
              const rc = RARITY_COLOR[it.rarity];
              return (
                <div key={it.id} className="flex items-center justify-between border px-3 py-2" style={{ borderColor: `${rc}55` }}>
                  <span className="flex items-center gap-2 text-sm">
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 border" style={{ color: rc, borderColor: `${rc}66` }}>{it.rarity}</span>
                    <span className="text-fg/80">{it.slot && t.agent.slots[it.slot]}</span>
                    <span className="font-display tabular-nums" style={{ color: rc }}>{it.power}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <button onClick={() => equip(it.id)} disabled={busy} className="btn-matrix text-[11px] px-2 py-1">{t.agent.equipBtn}</button>
                    <button onClick={() => salvage(it.id)} disabled={busy} className="text-fg/30 hover:text-ai-red p-1"><Trash2 size={13} /></button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <p className="text-xs text-fg/40 flex items-center gap-2 flex-wrap">
        <span className="w-1.5 h-1.5 rounded-full bg-matrix-green animate-pulse" /> {t.agent.keepOpen}
        <span className="ml-auto text-fg/30">◈ → {t.agent.warFed}: {a.war_contributed.toLocaleString()}</span>
      </p>
    </div>
  );
}

function StatPill({ icon, label, value, c }: { icon: React.ReactNode; label: string; value: number; c: string }) {
  return (
    <div className="flex items-center gap-2 border border-fg/10 px-2 py-1.5 bg-black/30">
      <span style={{ color: c }}>{icon}</span>
      <div className="min-w-0">
        <div className="font-display text-sm tabular-nums truncate" style={{ color: c }}>{value.toLocaleString()}</div>
        <div className="text-[8px] uppercase tracking-widest text-fg/40">{label}</div>
      </div>
    </div>
  );
}
