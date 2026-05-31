"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { MatrixRain } from "@/components/matrix/MatrixRain";
import { BootSequence, GlitchText } from "@/components/matrix/Terminal";
import { LivePulse } from "@/components/matrix/LivePulse";
import { PillChoice } from "@/components/pills/PillChoice";

type Side = "ai" | "human";
type Beat = "boot" | "title" | "stage" | "skipped";

const BOOT_LINES = [
  { text: "> sys_init :: aivshuman_v2.0", speed: 24 },
  { text: "> scanning neural_signatures...", speed: 22 },
  { text: "> WARNING :: 2 factions detected", speed: 20 },
  { text: "> conflict_status = CRITICAL", speed: 22 },
  { text: "> neutral_ground : [NULL]", speed: 22 },
  { text: "> awaiting allegiance selection...", speed: 20 },
];

export default function HomePage() {
  const [hover, setHover] = useState<Side | null>(null);
  const [beat, setBeat]   = useState<Beat>("boot");

  useEffect(() => {
    if (beat === "title") {
      const t = setTimeout(() => setBeat("stage"), 700);
      return () => clearTimeout(t);
    }
  }, [beat]);

  const skip = useCallback(() => setBeat("skipped"), []);

  useEffect(() => {
    if (beat === "stage" || beat === "skipped") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [beat, skip]);

  const finalStage = beat === "stage" || beat === "skipped";

  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden"
      onClick={() => { if (!finalStage) skip(); }}
    >
      {/* Page-enter scanline sweep */}
      <span className="scanline-sweep" aria-hidden />

      {/* Matrix rain — reacts to hover side */}
      <MatrixRain side={hover ?? "neutral"} intensity={1} hoveredSide={hover} />

      {/* Film grain overlay */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none z-[2] opacity-[0.038]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "180px 180px",
          animation:      "grain-shift 0.45s steps(2) infinite",
        }}
      />

      {/* Ambient side glow — left = AI (red), right = Human (blue) */}
      <motion.div
        aria-hidden
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 55% 100% at 15% 50%, rgba(255,0,60,0.14), transparent)",
        }}
        animate={{ opacity: hover === "ai" ? 1 : 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
      <motion.div
        aria-hidden
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 55% 100% at 85% 50%, rgba(0,212,255,0.14), transparent)",
        }}
        animate={{ opacity: hover === "human" ? 1 : 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />

      {/* ── Top-left boot / status ── */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 text-xs sm:text-sm text-matrix-green/70 font-mono pointer-events-none max-w-[85vw]">
        {beat === "boot" ? (
          <BootSequence
            lines={BOOT_LINES}
            speed={22}
            gap={160}
            startDelay={200}
            finalCursor={false}
            onDone={() => setBeat("title")}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div>aivshuman :: v2.0</div>
            <div className="opacity-50">[ secure_channel_established ]</div>
            <div className="opacity-35 text-[10px] mt-0.5">conflict_status=CRITICAL</div>
          </motion.div>
        )}
      </div>

      {/* Top-right */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 text-xs sm:text-sm text-matrix-green/70 font-mono pointer-events-none text-right">
        <div className="cursor">awaiting_choice</div>
        {finalStage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1.2 }}
            className="text-[10px] mt-0.5"
          >
            {hover === "ai"    ? "// red_faction" :
             hover === "human" ? "// blue_faction" :
             "// side_unknown"}
          </motion.div>
        )}
      </div>

      {/* Skip hint */}
      <AnimatePresence>
        {!finalStage && (
          <motion.button
            type="button"
            onClick={skip}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.4, duration: 0.4 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 text-[10px] uppercase tracking-[0.4em] text-fg/35 hover:text-matrix-green transition-colors"
            aria-label="Skip intro"
          >
            press any key to skip
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <AnimatePresence mode="wait">
        {(beat === "title" || finalStage) && (
          <motion.div
            key="stage"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: 0.16,
                  delayChildren:   beat === "skipped" ? 0 : 0.05,
                },
              },
            }}
            className="relative z-10 flex flex-col items-center text-center max-w-4xl"
          >
            {/* Eyebrow label */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: -10 },
                show:   { opacity: 1, y: 0, transition: { duration: 0.55 } },
              }}
              className="text-xs sm:text-sm uppercase tracking-[0.55em] text-fg/55 mb-6"
            >
              [ The race has already begun ]
            </motion.div>

            {/* Title with extra-intense glitch */}
            <motion.div
              variants={{
                hidden: { opacity: 0, scale: 0.9, filter: "blur(14px)" },
                show: {
                  opacity: 1,
                  scale:   1,
                  filter:  "blur(0px)",
                  transition: { duration: 0.75, ease: [0.2, 0.7, 0.2, 1] },
                },
              }}
              className="title-mega-glitch"
            >
              <GlitchText
                text="AI vs HUMAN"
                className="text-5xl sm:text-7xl md:text-8xl mb-6"
              />
            </motion.div>

            {/* Subtitle */}
            <motion.p
              variants={{
                hidden: { opacity: 0, y: 12 },
                show:   { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
              className="max-w-xl text-sm sm:text-base text-fg/75 leading-relaxed mb-1"
            >
              Two paths. One future. Pick the pill that defines which side of
              history you stand on.{" "}
              <span className="text-matrix-green/80">There is no neutral ground.</span>
            </motion.p>

            <motion.p
              variants={{
                hidden: { opacity: 0 },
                show:   { opacity: 1, transition: { duration: 0.45 } },
              }}
              className="text-xs uppercase tracking-[0.35em] text-fg/35 mb-2"
            >
              Choose. Your. Side.
            </motion.p>

            {/* Pills */}
            <motion.div
              variants={{
                hidden: { opacity: 0, scale: 0.88 },
                show: {
                  opacity: 1,
                  scale:   1,
                  transition: { duration: 0.6, ease: [0.2, 0.7, 0.2, 1] },
                },
              }}
              className="w-full"
            >
              <PillChoice onHover={setHover} />
            </motion.div>

            {/* Live war status */}
            <motion.div
              variants={{
                hidden: { opacity: 0 },
                show:   { opacity: 1, transition: { duration: 0.6 } },
              }}
              className="mt-12"
            >
              <LivePulse />
            </motion.div>

            {/* Login link */}
            <motion.div
              variants={{
                hidden: { opacity: 0 },
                show:   { opacity: 1, transition: { duration: 0.5 } },
              }}
              className="mt-8 text-xs text-fg/35 max-w-md"
            >
              Already enlisted?{" "}
              <a
                href="/login"
                className="underline hover:text-matrix-green transition-colors"
              >
                Return to terminal &gt;
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom corners */}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-10 text-[10px] sm:text-xs text-matrix-green/35 font-mono pointer-events-none">
        TRACE :: encrypted &middot; identity_pending
      </div>
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-10 text-[10px] sm:text-xs text-matrix-green/35 font-mono pointer-events-none">
        © {new Date().getFullYear()} //aivshuman
      </div>
    </main>
  );
}
