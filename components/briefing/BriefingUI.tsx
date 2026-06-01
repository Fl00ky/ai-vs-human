"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, ExternalLink, Newspaper } from "lucide-react";
import { GlitchText } from "@/components/matrix/Terminal";
import { MotionGrid, MotionGridItem } from "@/components/MotionGrid";
import { useLanguage } from "@/lib/i18n/context";
import { useToast } from "@/components/Toast";

export interface Brief {
  id: string;
  title: string;
  body: string;
  url: string | null;
  category: "tip" | "tool" | "risk" | "fact" | "news";
  published_at: string;
}

const CAT_COLOR: Record<Brief["category"], string> = {
  tip: "#00ff41", tool: "#00d4ff", risk: "#ff003c", fact: "#ffaa00", news: "#a855f7",
};

export function BriefingUI({ briefs, readToday }: { briefs: Brief[]; readToday: boolean }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [read, setRead] = useState(readToday);

  const markRead = () => {
    if (read || pending) return;
    startTransition(async () => {
      const res = await fetch("/api/briefing/read", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast(data.error ?? "Failed", "error"); return; }
      setRead(true);
      if (data.reward > 0) toast(t.briefing.readReward, "success");
      router.refresh();
    });
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  const top = briefs[0];
  const rest = briefs.slice(1);

  const catChip = (c: Brief["category"]) => (
    <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 border rounded"
      style={{ color: CAT_COLOR[c], borderColor: `${CAT_COLOR[c]}66` }}>
      {t.briefing.cat[c]}
    </span>
  );

  return (
    <div className="space-y-8">
      <section className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs text-side/60 uppercase tracking-[0.3em] mb-2">{t.briefing.path}</div>
          <GlitchText text={t.briefing.title} as="h1" className="text-3xl sm:text-5xl" />
          <p className="text-fg/60 mt-2 max-w-xl">{t.briefing.subtitle}</p>
        </div>
        {read ? (
          <span className="text-matrix-green text-xs flex items-center gap-1 shrink-0 mt-2">
            <Check size={14} /> {t.briefing.readToday}
          </span>
        ) : (
          <button onClick={markRead} disabled={pending} className="btn-matrix shrink-0 mt-2">
            {t.briefing.markRead}
          </button>
        )}
      </section>

      {/* Today's headline brief */}
      {top && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="terminal-box p-6 sm:p-8" style={{ borderColor: CAT_COLOR[top.category] }}>
          <div className="flex items-center gap-2 mb-3">
            <Newspaper size={16} style={{ color: CAT_COLOR[top.category] }} />
            <span className="text-[10px] uppercase tracking-[0.3em] text-side/60">{t.briefing.today}</span>
            {catChip(top.category)}
            <span className="text-[10px] text-fg/40 ml-auto">{fmtDate(top.published_at)}</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl text-side uppercase tracking-wider mb-2">{top.title}</h2>
          <p className="text-fg/85 leading-relaxed">{top.body}</p>
          {top.url && (
            <a href={top.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-side mt-3 hover:underline">
              {t.briefing.source} <ExternalLink size={12} />
            </a>
          )}
        </motion.div>
      )}

      {/* Archive feed */}
      <MotionGrid className="grid sm:grid-cols-2 gap-4">
        {rest.map((b) => (
          <MotionGridItem key={b.id}>
            <div className="terminal-box p-5 h-full">
              <div className="flex items-center gap-2 mb-2">
                {catChip(b.category)}
                <span className="text-[10px] text-fg/40 ml-auto">{fmtDate(b.published_at)}</span>
              </div>
              <div className="font-display text-lg text-side uppercase tracking-wide mb-1">{b.title}</div>
              <p className="text-sm text-fg/70 leading-relaxed">{b.body}</p>
              {b.url && (
                <a href={b.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-side mt-2 hover:underline">
                  {t.briefing.source} <ExternalLink size={11} />
                </a>
              )}
            </div>
          </MotionGridItem>
        ))}
      </MotionGrid>
    </div>
  );
}
