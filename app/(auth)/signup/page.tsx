"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Gamepad2, Trophy, Award, type LucideIcon } from "lucide-react";
import { MatrixRain } from "@/components/matrix/MatrixRain";
import { GlitchText, Typewriter } from "@/components/matrix/Terminal";
import { signupAction } from "../actions";
import { SIDE_META, type Side } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";

export default function SignupPage() {
  const router = useRouter();
  const params = useSearchParams();
  const sideParam = params.get("side") as Side | null;
  const [side, setSide] = useState<Side | null>(sideParam);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { t } = useLanguage();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!side) {
      const stored = sessionStorage.getItem("chosen_side") as Side | null;
      if (stored === "ai" || stored === "human") setSide(stored);
    }
    if (side) document.documentElement.setAttribute("data-side", side);
    return () => { document.documentElement.removeAttribute("data-side"); };
  }, [side]);

  if (!side) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <MatrixRain side="neutral" />
        <div className="relative z-10 text-center">
          <p className="text-matrix-green mb-4">{t.signup.noSideSelected}</p>
          <Link href="/" className="btn-matrix">{t.signup.choosePill}</Link>
        </div>
      </main>
    );
  }

  const meta = SIDE_META[side];
  const intro = side === "ai" ? t.auth.signup.introAi : t.auth.signup.introHuman;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("side", side);
    startTransition(async () => {
      const result = await signupAction(formData);
      if (result && !result.ok) setError(result.error);
      else router.push("/dashboard");
    });
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <span className="scanline-sweep" aria-hidden />
      <MatrixRain side={side} intensity={0.7} />

      <div className="absolute top-4 left-4 z-10 text-xs text-side/60 font-mono">
        {t.auth.signup.path} --side={side}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="terminal-box p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-side/30">
            <span className="text-xs uppercase tracking-[0.2em] text-side/70">{t.signup.enlistTag}</span>
            <span className={`px-2 py-0.5 text-xs uppercase tracking-widest ${side === "ai" ? "side-badge-ai" : "side-badge-human"}`}>
              {meta.shortName}
            </span>
          </div>

          <div className="text-xs sm:text-sm font-mono text-side/80 mb-4 min-h-[1.5em]">
            <Typewriter text={intro} delay={200} speed={28} cursorAfter />
          </div>

          <GlitchText text={meta.greeting} as="h2" className="text-2xl sm:text-3xl mb-2" />
          <p className="text-xs text-fg/60 mb-6 italic">{meta.motto}</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field label={t.signup.agentId} name="username" type="text" placeholder="your_handle"
              autoComplete="username" required minLength={3} maxLength={20} pattern="[a-zA-Z0-9_-]+" />
            <Field label={t.signup.email} name="email" type="email"
              placeholder="you@matrix.net" autoComplete="email" required />
            <Field label={t.signup.passkey} name="password" type="password"
              placeholder="••••••••" autoComplete="new-password" required minLength={8} />

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-xs text-ai-red border border-ai-red/50 bg-ai-red/10 p-2">
                ! {error}
              </motion.div>
            )}

            <button type="submit" disabled={pending} className="btn-matrix w-full mt-4">
              {pending ? t.signup.submitting : t.signup.submit}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-side/20 text-xs text-fg/50">
            {t.signup.haveAccount}{" "}
            <Link href="/login" className="text-side underline hover:opacity-80">{t.signup.signIn}</Link>
            <span className="mx-2 opacity-30">|</span>
            <Link href="/" className="underline hover:opacity-80">{t.signup.changeSide}</Link>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }} className="mt-4 grid grid-cols-3 gap-2">
          <Benefit icon={Gamepad2} label={t.signup.benefitGames} />
          <Benefit icon={Trophy} label={t.signup.benefitWarBoard} />
          <Benefit icon={Award} label={t.signup.benefitBadges} />
        </motion.div>
      </motion.div>
    </main>
  );
}

function Benefit({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 border border-side/20 bg-black/40 backdrop-blur-sm py-2.5 px-1">
      <Icon size={16} className="text-side" />
      <span className="text-[9px] uppercase tracking-[0.2em] text-fg/60 text-center">{label}</span>
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-[0.2em] text-side/60 mb-1">&gt; {label}</span>
      <input className="input-matrix" {...rest} />
    </label>
  );
}
