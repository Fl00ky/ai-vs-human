"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { GraduationCap, Check, ArrowLeft, ShieldCheck, Cpu, Users } from "lucide-react";
import { GlitchText } from "@/components/matrix/Terminal";
import { MotionGrid, MotionGridItem } from "@/components/MotionGrid";
import { useLanguage } from "@/lib/i18n/context";
import { useToast } from "@/components/Toast";
import { LESSONS, type Lesson, type LessonSide } from "@/lib/lessons";

export function LearnUI({ completed }: { completed: string[] }) {
  const { t } = useLanguage();
  const [done, setDone] = useState<string[]>(completed);
  const [active, setActive] = useState<Lesson | null>(null);

  if (active) {
    return (
      <LessonView
        lesson={active}
        alreadyDone={done.includes(active.id)}
        onClose={() => setActive(null)}
        onComplete={(id) => setDone((d) => (d.includes(id) ? d : [...d, id]))}
      />
    );
  }

  const sideLabel = (s: LessonSide) =>
    s === "human" ? t.learn.forHumans : s === "ai" ? t.learn.forAI : t.learn.forAll;
  const sideColor = (s: LessonSide) =>
    s === "human" ? "#00d4ff" : s === "ai" ? "#ff003c" : "#00ff41";
  const SideIcon = (s: LessonSide) => (s === "human" ? ShieldCheck : s === "ai" ? Cpu : Users);

  return (
    <div className="space-y-8">
      <section>
        <div className="text-xs text-side/60 uppercase tracking-[0.3em] mb-2">{t.learn.path}</div>
        <GlitchText text={t.learn.title} as="h1" className="text-3xl sm:text-5xl" />
        <p className="text-fg/60 mt-2 max-w-xl">{t.learn.subtitle}</p>
        <div className="text-xs text-side/60 mt-2">
          {done.length} / {LESSONS.length} {t.learn.completed}
        </div>
      </section>

      <MotionGrid className="grid sm:grid-cols-2 gap-4">
        {LESSONS.map((l) => {
          const isDone = done.includes(l.id);
          const Icon = SideIcon(l.side);
          const color = sideColor(l.side);
          return (
            <MotionGridItem key={l.id}>
              <button
                onClick={() => setActive(l)}
                className={`terminal-box card-shimmer p-5 text-left w-full h-full block transition-all hover:-translate-y-1 ${isDone ? "opacity-70" : "hover:border-side"}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <Icon size={26} style={{ color }} />
                  {isDone ? (
                    <span className="text-matrix-green text-xs flex items-center gap-1">
                      <Check size={13} /> {t.learn.done}
                    </span>
                  ) : (
                    <span className="text-xs text-side/70 tabular-nums">+{l.reward}</span>
                  )}
                </div>
                <div className="font-display text-lg text-side uppercase tracking-wider">{l.title}</div>
                <p className="text-sm text-fg/60 mt-1">{l.summary}</p>
                <div className="text-[10px] uppercase tracking-widest mt-3" style={{ color }}>
                  {sideLabel(l.side)}
                </div>
              </button>
            </MotionGridItem>
          );
        })}
      </MotionGrid>
    </div>
  );
}

function LessonView({
  lesson,
  alreadyDone,
  onClose,
  onComplete,
}: {
  lesson: Lesson;
  alreadyDone: boolean;
  onClose: () => void;
  onComplete: (id: string) => void;
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [choice, setChoice] = useState<number | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(alreadyDone ? "correct" : null);

  const submit = () => {
    if (choice === null || pending) return;
    startTransition(async () => {
      const res = await fetch("/api/lessons/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lesson.id, answer: choice }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast(data.error ?? "Failed", "error"); return; }
      if (data.correct) {
        setResult("correct");
        if (!data.already) {
          confetti({ particleCount: 130, spread: 75, origin: { y: 0.4 }, colors: ["#00ff41", "#ff003c", "#00d4ff"] });
          toast(`${t.learn.correct} +${data.reward}`, "success");
          onComplete(lesson.id);
          router.refresh();
        }
      } else {
        setResult("wrong");
        toast(t.learn.wrong, "error");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <button onClick={onClose} className="text-xs text-fg/40 hover:text-side flex items-center gap-1">
        <ArrowLeft size={12} /> {t.learn.back}
      </button>

      <div className="terminal-box p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap size={18} className="text-side" />
          <h1 className="font-display text-2xl sm:text-3xl text-side uppercase tracking-wider">{lesson.title}</h1>
        </div>
        <p className="text-sm text-fg/60 mb-6">{lesson.summary}</p>

        {/* Lesson steps */}
        <ol className="space-y-3 mb-8">
          {lesson.steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm text-fg/85 leading-relaxed">
              <span className="font-display text-side shrink-0 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>

        {/* Check */}
        <div className="border-t border-side/20 pt-5">
          <div className="text-xs uppercase tracking-[0.2em] text-side/70 mb-3">{t.learn.check}</div>
          <p className="text-fg/90 mb-4">{lesson.question}</p>

          <div className="space-y-2 mb-5">
            {lesson.options.map((opt, i) => {
              const selected = choice === i;
              const isCorrectDone = result === "correct" && (alreadyDone || selected);
              return (
                <button
                  key={i}
                  onClick={() => result !== "correct" && setChoice(i)}
                  disabled={result === "correct"}
                  className="w-full text-left px-4 py-3 border text-sm transition-all disabled:cursor-default"
                  style={{
                    borderColor: selected ? "var(--side-color)" : "rgba(255,255,255,0.12)",
                    background: selected ? "color-mix(in srgb, var(--side-color) 12%, transparent)" : "rgba(0,0,0,0.3)",
                    color: selected ? "var(--side-color)" : "rgba(255,255,255,0.8)",
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {result === "correct" ? (
              <motion.div key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-matrix-green font-display uppercase tracking-widest">
                <Check size={18} /> {t.learn.correct}
              </motion.div>
            ) : (
              <div className="space-y-2">
                {result === "wrong" && (
                  <div className="text-xs text-ai-red">{t.learn.wrong}</div>
                )}
                <button
                  onClick={submit}
                  disabled={choice === null || pending}
                  className="btn-matrix"
                >
                  {t.learn.submit}
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
