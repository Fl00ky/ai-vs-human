"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Coins, Check, Lock } from "lucide-react";
import { GlitchText } from "@/components/matrix/Terminal";
import { MotionGrid, MotionGridItem } from "@/components/MotionGrid";
import { useLanguage } from "@/lib/i18n/context";
import { useToast } from "@/components/Toast";
import { nameFxClass, nameFxStyle } from "@/lib/cosmetics";

export interface Cosmetic { id: string; kind: "title" | "name_fx"; price: number; value: string }

interface Props {
  cosmetics: Cosmetic[];
  owned: string[];
  credits: number;
  equippedTitle: string | null; // value
  equippedFx: string | null;    // value
}

export function StoreUI({ cosmetics, owned, credits, equippedTitle, equippedFx }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [bal, setBal] = useState(credits);
  const [ownedSet, setOwnedSet] = useState<Set<string>>(new Set(owned));
  const [eqTitle, setEqTitle] = useState(equippedTitle);
  const [eqFx, setEqFx] = useState(equippedFx);

  const s = t.store;

  const buy = (c: Cosmetic) => start(async () => {
    const res = await fetch("/api/store", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "buy", id: c.id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast(data.error === "insufficient" ? s.insufficient : (data.error ?? "Error"), "error"); return; }
    setBal(data.credits ?? bal - c.price);
    setOwnedSet((o) => new Set(o).add(c.id));
    toast(s.bought, "success");
    router.refresh();
  });

  const equip = (c: Cosmetic, on: boolean) => start(async () => {
    const res = await fetch("/api/store", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "equip", kind: c.kind, id: on ? c.id : null }),
    });
    if (!res.ok) { toast("Error", "error"); return; }
    if (c.kind === "title") setEqTitle(on ? c.value : null);
    else setEqFx(on ? c.value : null);
    router.refresh();
  });

  const isEquipped = (c: Cosmetic) =>
    c.kind === "title" ? eqTitle === c.value : eqFx === c.value;

  const section = (kind: "title" | "name_fx", label: string) => (
    <section className="space-y-3">
      <div className="text-xs uppercase tracking-[0.2em] text-side/70">{label}</div>
      <MotionGrid className="grid sm:grid-cols-2 gap-3">
        {cosmetics.filter((c) => c.kind === kind).map((c) => {
          const own = ownedSet.has(c.id);
          const eq = isEquipped(c);
          return (
            <MotionGridItem key={c.id}>
              <div className="terminal-box p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  {/* Preview */}
                  {c.kind === "title" ? (
                    <span className="font-display text-lg text-side uppercase tracking-wider">{c.value}</span>
                  ) : (
                    <span className={`font-display text-lg uppercase tracking-wider ${nameFxClass(c.value)}`} style={nameFxStyle(c.value)}>
                      AGENT
                    </span>
                  )}
                  <div className="text-[11px] text-fg/50 mt-1 flex items-center gap-1">
                    <Coins size={11} /> {c.price.toLocaleString()}
                  </div>
                </div>
                <div className="shrink-0">
                  {!own ? (
                    <button onClick={() => buy(c)} disabled={pending || bal < c.price}
                      className="btn-matrix text-xs px-3 py-1.5 flex items-center gap-1">
                      {bal < c.price ? <Lock size={12} /> : null} {s.buy}
                    </button>
                  ) : eq ? (
                    <button onClick={() => equip(c, false)} disabled={pending}
                      className="text-xs px-3 py-1.5 border border-matrix-green/50 text-matrix-green flex items-center gap-1">
                      <Check size={12} /> {s.equipped}
                    </button>
                  ) : (
                    <button onClick={() => equip(c, true)} disabled={pending} className="btn-matrix text-xs px-3 py-1.5">
                      {s.equip}
                    </button>
                  )}
                </div>
              </div>
            </MotionGridItem>
          );
        })}
      </MotionGrid>
    </section>
  );

  return (
    <div className="space-y-8">
      <section className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs text-side/60 uppercase tracking-[0.3em] mb-2">{s.path}</div>
          <GlitchText text={s.title} as="h1" className="text-3xl sm:text-5xl" />
          <p className="text-fg/60 mt-2 max-w-xl">{s.subtitle}</p>
        </div>
        <div className="terminal-box px-4 py-2 flex items-center gap-2 shrink-0">
          <Coins size={16} className="text-side" />
          <span className="font-display text-xl text-side tabular-nums">{bal.toLocaleString()}</span>
          <span className="text-[10px] uppercase tracking-widest text-fg/50">{s.credits}</span>
        </div>
      </section>

      {section("title", s.titles)}
      {section("name_fx", s.effects)}
    </div>
  );
}
