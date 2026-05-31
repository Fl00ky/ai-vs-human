import Link from "next/link";
import { Zap, Brain, Code2, Grid3x3 } from "lucide-react";
import { GlitchText } from "@/components/matrix/Terminal";
import { MotionGrid, MotionGridItem } from "@/components/MotionGrid";

const GAMES = [
  {
    href: "/games/quiz",
    title: "AI or Human?",
    description:
      "We show you a fragment. You decide: machine or organic. Speed matters.",
    icon: Brain,
    difficulty: "easy",
  },
  {
    href: "/games/reaction",
    title: "Reaction",
    description:
      "Wait for the signal. The faster you strike, the more points your side scores.",
    icon: Zap,
    difficulty: "medium",
  },
  {
    href: "/games/code-breaker",
    title: "Code Breaker",
    description:
      "Find the hidden sequence in the falling code. Beat the timer.",
    icon: Code2,
    difficulty: "hard",
  },
  {
    href: "/games/pattern",
    title: "Pattern Memory",
    description:
      "Watch the matrix glow. Repeat the sequence. Survive each round.",
    icon: Grid3x3,
    difficulty: "medium",
  },
];

export default function GamesHub() {
  return (
    <div className="space-y-8">
      <section>
        <div className="text-xs text-side/60 uppercase tracking-[0.3em] mb-2">
          ./games
        </div>
        <GlitchText text="Skill Challenges" as="h1" className="text-3xl sm:text-5xl" />
        <p className="text-fg/60 mt-2 max-w-xl">
          Every point you earn here is added to your side&apos;s war effort.
          Choose your training.
        </p>
      </section>

      <MotionGrid className="grid sm:grid-cols-2 gap-4">
        {GAMES.map(({ href, title, description, icon: Icon, difficulty }) => (
          <MotionGridItem key={href}>
            <Link
              href={href}
              className="terminal-box card-shimmer p-6 group hover:border-side transition-all hover:-translate-y-1 block h-full"
            >
              <div className="flex items-start justify-between mb-3">
                <Icon size={32} className="text-side" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-fg/40">
                  {difficulty}
                </span>
              </div>
              <h2 className="font-display text-2xl text-side uppercase tracking-wider">
                {title}
              </h2>
              <p className="text-sm text-fg/60 mt-2">{description}</p>
              <div className="mt-4 text-xs text-side opacity-0 group-hover:opacity-100 transition-opacity">
                &gt; Launch
              </div>
            </Link>
          </MotionGridItem>
        ))}
      </MotionGrid>
    </div>
  );
}
