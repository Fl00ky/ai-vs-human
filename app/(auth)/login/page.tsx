"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MatrixRain } from "@/components/matrix/MatrixRain";
import { GlitchText } from "@/components/matrix/Terminal";
import { loginAction } from "../actions";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result && !result.ok) {
        setError(result.error);
      } else {
        router.push("/dashboard");
      }
    });
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <span className="scanline-sweep" aria-hidden />
      <MatrixRain side="neutral" intensity={0.6} />

      <div className="absolute top-4 left-4 z-10 text-xs text-matrix-green/60">
        ./login
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="terminal-box-static p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-matrix-green/30">
            <span className="text-xs uppercase tracking-[0.2em] text-matrix-green/70">
              [ access ]
            </span>
            <span className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-matrix-green/40" />
              <span className="w-2 h-2 rounded-full bg-matrix-green/60" />
              <span className="w-2 h-2 rounded-full bg-matrix-green/80" />
            </span>
          </div>

          <GlitchText
            text="Welcome back"
            as="h2"
            className="text-2xl sm:text-3xl mb-2 !text-matrix-green"
          />
          <p className="text-xs text-fg/60 mb-6 italic">
            Re-establish your connection to the grid.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="block text-[10px] uppercase tracking-[0.2em] text-matrix-green/60 mb-1">
                &gt; email
              </span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@matrix.net"
                className="input-matrix"
                style={{ color: "var(--matrix-green)", borderColor: "rgba(0,255,65,0.5)" }}
              />
            </label>

            <label className="block">
              <span className="block text-[10px] uppercase tracking-[0.2em] text-matrix-green/60 mb-1">
                &gt; passkey
              </span>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="input-matrix"
                style={{ color: "var(--matrix-green)", borderColor: "rgba(0,255,65,0.5)" }}
              />
            </label>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-ai-red border border-ai-red/50 bg-ai-red/10 p-2"
              >
                ! {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="btn-matrix w-full mt-4"
              style={{ color: "var(--matrix-green)", borderColor: "var(--matrix-green)" }}
            >
              {pending ? "Authenticating..." : "Connect"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-matrix-green/20 text-xs text-fg/50">
            New operative?{" "}
            <Link href="/" className="text-matrix-green underline hover:opacity-80">
              Choose your pill
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
