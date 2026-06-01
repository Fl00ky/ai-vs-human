"use client";

import { GlitchText } from "@/components/matrix/Terminal";
import { useLanguage } from "@/lib/i18n/context";

interface Props {
  unlockedCount: number;
  totalCount: number;
  earnedPoints: number;
  children: React.ReactNode;
}

export function AchievementsLabels({ unlockedCount, totalCount, earnedPoints, children }: Props) {
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      <section>
        <div className="text-xs text-side/60 uppercase tracking-[0.3em] mb-2">{t.achievements.path}</div>
        <GlitchText text={t.achievements.title} as="h1" className="text-3xl sm:text-5xl" />
        <p className="text-fg/60 mt-2">{t.achievements.subtitle}</p>
      </section>

      <section className="grid grid-cols-3 gap-4">
        <div className="terminal-box p-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-fg/50">{t.achievements.unlocked}</div>
          <div className="font-display text-xl sm:text-2xl text-side mt-1 tabular-nums">{unlockedCount} / {totalCount}</div>
        </div>
        <div className="terminal-box p-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-fg/50">{t.achievements.completion}</div>
          <div className="font-display text-xl sm:text-2xl text-side mt-1 tabular-nums">
            {totalCount > 0 ? `${Math.round((unlockedCount / totalCount) * 100)}%` : "0%"}
          </div>
        </div>
        <div className="terminal-box p-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-fg/50">{t.achievements.bonusPts}</div>
          <div className="font-display text-xl sm:text-2xl text-side mt-1 tabular-nums">+{earnedPoints.toLocaleString()}</div>
        </div>
      </section>

      {children}
    </div>
  );
}
