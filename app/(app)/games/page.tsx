"use client";

import Link from "next/link";
import { Zap, Brain, Code2, Grid3x3 } from "lucide-react";
import { GlitchText } from "@/components/matrix/Terminal";
import { MotionGrid, MotionGridItem } from "@/components/MotionGrid";
import { useLanguage } from "@/lib/i18n/context";

export default function GamesHub() {
  const { t } = useLanguage();

  const GAMES = [
    { href: "/games/quiz",         title: t.games.quiz.title,        description: t.games.quiz.desc,        icon: Brain,    difficulty: t.games.easy  },
    { href: "/games/reaction",     title: t.games.reaction.title,    description: t.games.reaction.desc,    icon: Zap,      difficulty: t.games.medium },
    { href: "/games/code-breaker", title: t.games.codeBreaker.title, description: t.games.codeBreaker.desc, icon: Code2,    difficulty: t.games.hard  },
    { href: "/games/pattern",      title: t.games.pattern.title,     description: t.games.pattern.desc,     icon: Grid3x3,  difficulty: t.games.medium },
  ];

  return (
    <div className="space-y-8">
      <section>
        <div className="text-xs text-side/60 uppercase tracking-[0.3em] mb-2">{t.games.path}</div>
        <GlitchText text={t.games.title} as="h1" className="text-3xl sm:text-5xl" />
        <p className="text-fg/60 mt-2 max-w-xl">{t.games.subtitle}</p>
      </section>

      <MotionGrid className="grid sm:grid-cols-2 gap-4">
        {GAMES.map(({ href, title, description, icon: Icon, difficulty }) => (
          <MotionGridItem key={href}>
            <Link href={href} className="terminal-box card-shimmer p-6 group hover:border-side transition-all hover:-translate-y-1 block h-full">
              <div className="flex items-start justify-between mb-3">
                <Icon size={32} className="text-side" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-fg/40">{difficulty}</span>
              </div>
              <h2 className="font-display text-2xl text-side uppercase tracking-wider">{title}</h2>
              <p className="text-sm text-fg/60 mt-2">{description}</p>
              <div className="mt-4 text-xs text-side opacity-0 group-hover:opacity-100 transition-opacity">
                {t.games.launch}
              </div>
            </Link>
          </MotionGridItem>
        ))}
      </MotionGrid>
    </div>
  );
}
