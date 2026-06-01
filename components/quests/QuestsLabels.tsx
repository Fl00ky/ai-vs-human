"use client";

import Link from "next/link";
import { GlitchText } from "@/components/matrix/Terminal";
import { MotionGrid, MotionGridItem } from "@/components/MotionGrid";
import { useLanguage } from "@/lib/i18n/context";
import { formatScore } from "@/lib/utils";
import type { Quest } from "@/lib/types/database";

interface Props {
  quests: Quest[];
  completedIds: Set<string>;
}

export function QuestsLabels({ quests, completedIds }: Props) {
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      <section>
        <div className="text-xs text-side/60 uppercase tracking-[0.3em] mb-2">{t.quests.path}</div>
        <GlitchText text={t.quests.title} as="h1" className="text-3xl sm:text-5xl" />
        <p className="text-fg/60 mt-2">{t.quests.subtitle}</p>
      </section>

      <MotionGrid className="grid sm:grid-cols-2 gap-4">
        {quests.map((q) => {
          const done = completedIds.has(q.id);
          return (
            <MotionGridItem key={q.id}>
              <Link
                href={`/quests/${q.id}`}
                className={`terminal-box card-shimmer p-5 group transition-all hover:-translate-y-1 block h-full ${done ? "opacity-50" : "hover:border-side"}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-display text-lg text-side uppercase tracking-wider">{q.title}</span>
                  <span className={`text-xs px-2 py-0.5 flex-shrink-0 ${done ? "text-fg/40 border border-fg/20" : "text-side border border-side/50"}`}>
                    {done ? t.quests.done : `+${formatScore(q.reward)}`}
                  </span>
                </div>
                <p className="text-sm text-fg/60">{q.description}</p>
                {q.side && (
                  <div className={`mt-2 text-[10px] uppercase tracking-widest ${q.side === "ai" ? "text-ai-red" : "text-human-blue"}`}>
                    {q.side} {t.quests.only}
                  </div>
                )}
              </Link>
            </MotionGridItem>
          );
        })}
      </MotionGrid>
    </div>
  );
}
