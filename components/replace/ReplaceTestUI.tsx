"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Activity, RotateCcw, Share2, Save } from "lucide-react";
import { GlitchText } from "@/components/matrix/Terminal";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { useLanguage } from "@/lib/i18n/context";
import { useToast } from "@/components/Toast";
import { RT_QUESTIONS, computeReplaceScore, getBand } from "@/lib/replaceTest";

type Phase = "intro" | "quiz" | "result";

export function ReplaceTestUI() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [phase, setPhase] = useState<Phase>("intro");
  const [q, setQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [saved, setSaved] = useState(false);

  const rt = t.replaceTest;
  const score = computeReplaceScore(answers);
  const band = getBand(score);
  const bandColor = band === "low" ? "#00ff41" : band === "mid" ? "#ffaa00" : "#ff003c";

  const pick = (optIndex: number) => {
    const next = [...answers, optIndex];
    setAnswers(next);
    if (q + 1 >= RT_QUESTIONS) setPhase("result");
    else setQ((n) => n + 1);
  };

  const restart = () => {
    setAnswers([]); setQ(0); setSaved(false); setPhase("intro");
  };

  const save = () => {
    if (saved || pending) return;
    startTransition(async () => {
      const res = await fetch("/api/replace-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast(data.error ?? "Failed", "error"); return; }
      setSaved(true);
      if (data.awarded > 0) {
        confetti({ particleCount: 120, spread: 75, origin: { y: 0.4 }, colors: ["#00ff41", "#ff003c", "#00d4ff"] });
        toast(rt.saved, "success");
      }
      router.refresh();
    });
  };

  const share = async () => {
    const text = rt.shareText.replace("{score}", String(score));
    const url = typeof window !== "undefined" ? window.location.origin : "";
    if (navigator.share) {
      try { await navigator.share({ title: t.replaceTest.title, text, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast(t.dashboard.copied, "success");
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <section>
        <div className="text-xs text-side/60 uppercase tracking-[0.3em] mb-2">{rt.path}</div>
        <GlitchText text={rt.title} as="h1" className="text-3xl sm:text-5xl" />
        <p className="text-fg/60 mt-2">{rt.subtitle}</p>
      </section>

      <AnimatePresence mode="wait">
        {/* INTRO */}
        {phase === "intro" && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="terminal-box p-8 text-center">
            <Activity size={40} className="text-side mx-auto mb-4" />
            <p className="text-fg/70 mb-6">{rt.intro}</p>
            <button onClick={() => setPhase("quiz")} className="btn-matrix text-base px-8 py-3">
              {rt.start}
            </button>
          </motion.div>
        )}

        {/* QUIZ */}
        {phase === "quiz" && (
          <motion.div key={`q${q}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="terminal-box p-6 sm:p-8">
            <div className="text-xs text-side/60 uppercase tracking-widest mb-4">
              {rt.question} {q + 1} {rt.of} {RT_QUESTIONS}
            </div>
            <div className="h-1 bg-side/20 mb-6 overflow-hidden">
              <div className="h-full bg-side" style={{ width: `${(q / RT_QUESTIONS) * 100}%` }} />
            </div>
            <h2 className="font-display text-xl sm:text-2xl text-side mb-6">{rt.questions[q]}</h2>
            <div className="space-y-2.5">
              {rt.options[q].map((opt, i) => (
                <button key={i} onClick={() => pick(i)}
                  className="w-full text-left px-4 py-3 border border-side/30 bg-black/30 text-fg/85 text-sm hover:border-side hover:bg-side/10 transition-all">
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* RESULT */}
        {phase === "result" && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="terminal-box p-8 text-center"
            style={{ borderColor: bandColor, boxShadow: `0 0 40px color-mix(in srgb, ${bandColor} 35%, transparent)` }}>
            <div className="text-[10px] uppercase tracking-[0.3em] text-fg/50 mb-2">{rt.yourScore}</div>
            <div className="font-display text-7xl sm:text-8xl tabular-nums" style={{ color: bandColor, textShadow: `0 0 30px ${bandColor}` }}>
              <AnimatedCounter value={score} duration={1200} />%
            </div>
            <div className="font-display text-xl uppercase tracking-widest mt-2 mb-4" style={{ color: bandColor }}>
              {rt.bands[band].label}
            </div>
            <p className="text-sm text-fg/80 leading-relaxed mb-3 max-w-md mx-auto">{rt.bands[band].advice}</p>
            <p className="text-xs text-matrix-green/80 mb-6">{rt.factionNudge}</p>

            <div className="flex gap-3 justify-center flex-wrap">
              {!saved && (
                <button onClick={save} disabled={pending} className="btn-matrix flex items-center gap-1.5">
                  <Save size={14} /> {rt.save}
                </button>
              )}
              <button onClick={share} className="btn-matrix flex items-center gap-1.5">
                <Share2 size={14} /> {rt.share}
              </button>
              <button onClick={restart} className="btn-matrix flex items-center gap-1.5">
                <RotateCcw size={14} /> {rt.retake}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
