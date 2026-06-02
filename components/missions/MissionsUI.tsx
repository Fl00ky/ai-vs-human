"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Image, MessageSquare, Video, Megaphone, Star, Clock, Check, X } from "lucide-react";
import { GlitchText } from "@/components/matrix/Terminal";
import { MotionGrid, MotionGridItem } from "@/components/MotionGrid";
import { useLanguage } from "@/lib/i18n/context";
import { useToast } from "@/components/Toast";
import { MISSIONS, localizeMission } from "@/lib/missions";

export interface Submission { mission_id: string; status: "pending" | "approved" | "rejected" }

const ICON = { card: Image, story: Share2, review: MessageSquare, video: Video } as const;

export function MissionsUI({
  submissions, approvedCount, isAmbassador,
}: {
  submissions: Submission[];
  approvedCount: number;
  isAmbassador: boolean;
}) {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");

  const m = t.missions;
  const statusOf = (id: string) => submissions.find((s) => s.mission_id === id)?.status;

  const submit = (missionId: string) => start(async () => {
    const res = await fetch("/api/social/submit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mission: missionId, url, note }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast((m.errors as Record<string, string>)[data.error] ?? data.error ?? "Error", "error"); return; }
    toast(m.sent, "success");
    setOpen(null); setUrl(""); setNote("");
    router.refresh();
  });

  return (
    <div className="space-y-8">
      <section className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs text-side/60 uppercase tracking-[0.3em] mb-2">{m.path}</div>
          <GlitchText text={m.title} as="h1" className="text-3xl sm:text-5xl" />
          <p className="text-fg/60 mt-2 max-w-xl">{m.subtitle}</p>
        </div>
        {isAmbassador ? (
          <span className="flex items-center gap-1.5 px-3 py-1.5 border border-side text-side text-xs uppercase tracking-widest shrink-0"
            style={{ boxShadow: "0 0 16px var(--side-color)" }}>
            <Star size={13} /> {m.ambassador}
          </span>
        ) : (
          <span className="text-[11px] text-fg/50 max-w-[200px] text-right shrink-0 flex items-center gap-1.5">
            <Megaphone size={13} className="text-side shrink-0" /> {m.ambassadorHint} ({approvedCount}/3)
          </span>
        )}
      </section>

      <MotionGrid className="grid sm:grid-cols-2 gap-4">
        {MISSIONS.map((mission) => {
          const loc = localizeMission(lang, mission.id);
          const status = statusOf(mission.id);
          const Icon = ICON[mission.icon];
          const locked = status === "approved" || status === "pending";
          return (
            <MotionGridItem key={mission.id}>
              <div className="terminal-box p-5 h-full flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <Icon size={26} className="text-side" />
                  <span className="text-xs text-side/70 tabular-nums">+{mission.reward}</span>
                </div>
                <div className="font-display text-lg text-side uppercase tracking-wide">{loc.title}</div>
                <p className="text-sm text-fg/60 mt-1 flex-1">{loc.desc}</p>

                <div className="mt-3">
                  {status === "approved" && (
                    <span className="text-xs text-matrix-green flex items-center gap-1"><Check size={13} /> {m.approved}</span>
                  )}
                  {status === "pending" && (
                    <span className="text-xs text-fg/50 flex items-center gap-1"><Clock size={13} /> {m.pending}</span>
                  )}
                  {(status === "rejected" || !status) && (
                    open === mission.id ? (
                      <div className="space-y-2">
                        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={m.urlPlaceholder} className="input-matrix text-xs" />
                        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={m.notePlaceholder} className="input-matrix text-xs" />
                        <div className="flex gap-2">
                          <button onClick={() => submit(mission.id)} disabled={pending || url.length < 8} className="btn-matrix text-xs flex-1 justify-center">{m.send}</button>
                          <button onClick={() => setOpen(null)} className="text-fg/40 hover:text-ai-red px-2"><X size={16} /></button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setOpen(mission.id); setUrl(""); setNote(""); }} className="btn-matrix text-xs w-full justify-center">
                        {status === "rejected" ? m.rejected : m.submit}
                      </button>
                    )
                  )}
                </div>
              </div>
            </MotionGridItem>
          );
        })}
      </MotionGrid>
    </div>
  );
}
