"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PillSide = "ai" | "human";

interface PillChoiceProps {
  onHover: (side: PillSide | null) => void;
}

// Six sparks radiating at 60° intervals
const SPARK_ANGLES = [0, 60, 120, 180, 240, 300];
const SPARK_DIST   = 95;

// Simulated recruit counts — social proof with gentle drift
function useRecruitCounts() {
  const [counts, setCounts] = useState({ ai: 14847, human: 11263 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCounts({
      ai:    12000 + Math.floor(Math.random() * 4000),
      human:  8500 + Math.floor(Math.random() * 3000),
    });
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const schedule = () =>
      setTimeout(() => {
        setCounts((c) => ({
          ai:    c.ai    + (Math.random() < 0.65 ? 1 : 0),
          human: c.human + (Math.random() < 0.42 ? 1 : 0),
        }));
        schedule();
      }, 2800 + Math.random() * 2400);
    const id = schedule();
    return () => clearTimeout(id as unknown as number);
  }, [mounted]);

  return counts;
}

export function PillChoice({ onHover }: PillChoiceProps) {
  const router = useRouter();
  const [chosen, setChosen]           = useState<PillSide | null>(null);
  const [hoveredLocal, setHoveredLocal] = useState<PillSide | null>(null);
  const counts                         = useRecruitCounts();

  const choose = (side: PillSide) => {
    if (chosen) return;
    setChosen(side);
    if (typeof window !== "undefined") sessionStorage.setItem("chosen_side", side);
    setTimeout(() => router.push(`/signup?side=${side}`), 1200);
  };

  const handleHover = (side: PillSide | null) => {
    setHoveredLocal(side);
    onHover(side);
  };

  return (
    <>
      {/* ── Pills row ── */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-10 mt-14 relative z-10">
        {/* AI pill with float-a */}
        <div className="pill-float-a">
          <Pill
            side="ai"
            label="Red Pill"
            description="Join the Machines"
            count={counts.ai}
            onHover={handleHover}
            onClick={() => choose("ai")}
            disabled={!!chosen}
            taken={chosen === "ai"}
            dimmed={hoveredLocal !== null && hoveredLocal !== "ai" && !chosen}
            highlighted={hoveredLocal === "ai" && !chosen}
          />
        </div>

        {/* VS divider */}
        <VSSeparator active={hoveredLocal !== null && !chosen} hoveredSide={hoveredLocal} />

        {/* Human pill with float-b */}
        <div className="pill-float-b">
          <Pill
            side="human"
            label="Blue Pill"
            description="Stand with Humanity"
            count={counts.human}
            onHover={handleHover}
            onClick={() => choose("human")}
            disabled={!!chosen}
            taken={chosen === "human"}
            dimmed={hoveredLocal !== null && hoveredLocal !== "human" && !chosen}
            highlighted={hoveredLocal === "human" && !chosen}
          />
        </div>
      </div>

      {/* ── Exit transition ── */}
      <AnimatePresence>
        {chosen && (
          <>
            {/* Global glitch flash */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-40 pointer-events-none glitch-shake"
              style={{
                background: `radial-gradient(circle at center, ${
                  chosen === "ai"
                    ? "rgba(255,0,60,0.3)"
                    : "rgba(0,212,255,0.3)"
                }, transparent 55%)`,
              }}
            />

            {/* Confirmation terminal line */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.2 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-[140%] z-[60] pointer-events-none font-mono text-xs sm:text-sm uppercase tracking-[0.4em]"
              style={{
                color:      chosen === "ai" ? "#ff003c" : "#00d4ff",
                textShadow: `0 0 20px ${chosen === "ai" ? "#ff003c" : "#00d4ff"}, 0 0 50px ${chosen === "ai" ? "#ff003c" : "#00d4ff"}`,
              }}
            >
              &gt; allegiance_confirmed
              <span className="ml-1 animate-pulse inline-block">_</span>
            </motion.div>

            {/* Radial wipe */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 55 }}
              transition={{ duration: 1.0, delay: 0.22, ease: "easeIn" }}
              className="fixed rounded-full z-50 pointer-events-none"
              style={{
                background:      chosen === "ai" ? "var(--ai-red)" : "var(--human-blue)",
                transformOrigin: "center",
                left:            "50%",
                top:             "50%",
                width:           "10vmin",
                height:          "10vmin",
                marginLeft:      "-5vmin",
                marginTop:       "-5vmin",
                boxShadow:       `0 0 180px ${chosen === "ai" ? "#ff003c" : "#00d4ff"}`,
              }}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ── VS Separator ───────────────────────────────────────────────────
function VSSeparator({
  active,
  hoveredSide,
}: {
  active: boolean;
  hoveredSide: PillSide | null;
}) {
  const color =
    hoveredSide === "ai"    ? "#ff003c" :
    hoveredSide === "human" ? "#00d4ff" :
    "#00ff41";

  return (
    <div className="flex sm:flex-col items-center justify-center shrink-0 z-10">
      {/* Line top/left */}
      <motion.div
        className="sm:w-px sm:h-16 w-12 h-px rounded-full"
        style={{ background: `linear-gradient(180deg, transparent, ${color})` }}
        animate={{ opacity: active ? [0.5, 1, 0.5] : [0.2, 0.45, 0.2] }}
        transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* VS text */}
      <motion.span
        className="font-display text-2xl sm:text-3xl mx-4 sm:mx-0 sm:my-4 shrink-0 select-none"
        style={{ color }}
        animate={{
          textShadow: active
            ? [
                `0 0 10px ${color}`,
                `0 0 28px ${color}, 0 0 56px ${color}`,
                `0 0 10px ${color}`,
              ]
            : [
                `0 0 6px ${color}`,
                `0 0 14px ${color}`,
                `0 0 6px ${color}`,
              ],
          scale: active ? [1, 1.18, 1] : 1,
        }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        VS
      </motion.span>

      {/* Line bottom/right */}
      <motion.div
        className="sm:w-px sm:h-16 w-12 h-px rounded-full"
        style={{ background: `linear-gradient(180deg, ${color}, transparent)` }}
        animate={{ opacity: active ? [1, 0.5, 1] : [0.45, 0.2, 0.45] }}
        transition={{
          duration: 1.7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.85,
        }}
      />
    </div>
  );
}

// ── Spark particles ────────────────────────────────────────────────
function Sparks({ active, color }: { active: boolean; color: string }) {
  return (
    <>
      {SPARK_ANGLES.map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const tx  = Math.cos(rad) * SPARK_DIST;
        const ty  = Math.sin(rad) * SPARK_DIST;
        return (
          <motion.span
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
            style={{
              left:       "50%",
              top:        "50%",
              marginLeft: -3,
              marginTop:  -3,
              background: color,
              boxShadow:  `0 0 8px ${color}, 0 0 16px ${color}`,
            }}
            animate={
              active
                ? {
                    x:       [0, tx * 0.5, tx],
                    y:       [0, ty * 0.5, ty],
                    opacity: [0, 1, 0],
                    scale:   [0, 1.6, 0],
                  }
                : { x: 0, y: 0, opacity: 0, scale: 0 }
            }
            transition={
              active
                ? {
                    duration:    0.85,
                    delay:       i * 0.07,
                    ease:        "easeOut",
                    repeat:      Infinity,
                    repeatDelay: 0.55,
                  }
                : { duration: 0.15 }
            }
          />
        );
      })}
    </>
  );
}

// ── Pill ───────────────────────────────────────────────────────────
interface PillProps {
  side:        PillSide;
  label:       string;
  description: string;
  count:       number;
  onHover:     (side: PillSide | null) => void;
  onClick:     () => void;
  disabled:    boolean;
  taken:       boolean;
  dimmed:      boolean;
  highlighted: boolean;
}

function Pill({
  side,
  label,
  description,
  count,
  onHover,
  onClick,
  disabled,
  taken,
  dimmed,
  highlighted,
}: PillProps) {
  const color     = side === "ai" ? "#ff003c" : "#00d4ff";
  const colorDeep = side === "ai" ? "#4a0014" : "#003a4a";

  const wrapRef = useRef<HTMLDivElement>(null);
  const mx      = useMotionValue(0);
  const my      = useMotionValue(0);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), {
    stiffness: 260,
    damping:   18,
  });
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [14, -14]), {
    stiffness: 260,
    damping:   18,
  });

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width  - 0.5);
    my.set((e.clientY - rect.top)  / rect.height - 0.5);
  };

  const onPointerLeave = () => {
    mx.set(0);
    my.set(0);
    if (!disabled) onHover(null);
  };

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => !disabled && onHover(side)}
      onMouseLeave={onPointerLeave}
      onFocus={() => !disabled && onHover(side)}
      onBlur={() => !disabled && onHover(null)}
      onPointerMove={onPointerMove}
      whileTap={!disabled ? { scale: 0.92 } : {}}
      animate={
        taken
          ? { scale: [1, 1.4, 0.05], opacity: [1, 1, 0], rotateY: [0, 180, 360] }
          : dimmed
          ? {
              opacity: 0.1,
              scale:   0.78,
              filter:  "saturate(0.15) blur(6px)",
            }
          : { opacity: 1, scale: 1, filter: "saturate(1) blur(0px)" }
      }
      transition={
        taken
          ? { duration: 1.1 }
          : { type: "spring", stiffness: 200, damping: 18 }
      }
      className="group flex flex-col items-center gap-5 focus:outline-none disabled:cursor-not-allowed"
      aria-label={`${label} — ${description}`}
      style={{ perspective: 900 }}
    >
      {/* Pill sphere */}
      <motion.div
        ref={wrapRef}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        animate={
          !disabled
            ? {
                boxShadow: [
                  `0 0 40px ${color}70, 0 0 80px ${color}25, inset 0 0 30px ${colorDeep}`,
                  `0 0 90px ${color}cc, 0 0 140px ${color}50, inset 0 0 50px ${colorDeep}`,
                  `0 0 40px ${color}70, 0 0 80px ${color}25, inset 0 0 30px ${colorDeep}`,
                ],
              }
            : {}
        }
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-36 h-36 sm:w-52 sm:h-52 rounded-full flex items-center justify-center overflow-visible"
        whileHover={!disabled ? { scale: 1.12, y: -10 } : {}}
      >
        {/* Rotating outer ring — appears on hover */}
        <motion.div
          className="absolute rounded-full border pointer-events-none"
          style={{
            inset:       -12,
            borderColor: `${color}60`,
            borderWidth:  1,
          }}
          animate={
            highlighted
              ? { rotate: 360, opacity: [0.5, 0.9, 0.5] }
              : { rotate: 0, opacity: 0 }
          }
          transition={
            highlighted
              ? {
                  rotate:  { duration: 3, repeat: Infinity, ease: "linear" },
                  opacity: { duration: 1.5, repeat: Infinity },
                }
              : { duration: 0.3 }
          }
        />
        {/* Counter-rotating dashed ring */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset:        -24,
            border:       `1px dashed ${color}30`,
          }}
          animate={
            highlighted
              ? { rotate: -360, opacity: [0.25, 0.55, 0.25] }
              : { rotate: 0, opacity: 0 }
          }
          transition={
            highlighted
              ? {
                  rotate:  { duration: 5, repeat: Infinity, ease: "linear" },
                  opacity: { duration: 2, repeat: Infinity, delay: 0.5 },
                }
              : { duration: 0.3 }
          }
        />

        {/* Spark particles */}
        <Sparks active={highlighted} color={color} />

        {/* Sphere fill */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 33% 28%, ${color}cc, ${colorDeep}ee)`,
            border:      `2px solid ${color}`,
          }}
        />
        {/* Primary specular highlight */}
        <span
          className="absolute top-5 left-8 sm:top-7 sm:left-10 w-12 h-7 sm:w-16 sm:h-9 rounded-full opacity-55 blur-md pointer-events-none"
          style={{ background: "rgba(255,255,255,0.55)", transform: "translateZ(8px)" }}
        />
        {/* Secondary pinpoint highlight */}
        <span
          className="absolute top-3 left-5 sm:top-4 sm:left-7 w-5 h-3 sm:w-7 sm:h-4 rounded-full opacity-80 blur-sm pointer-events-none"
          style={{ background: "rgba(255,255,255,0.75)", transform: "translateZ(8px)" }}
        />

        {/* Label inside sphere */}
        <span
          className="font-display text-5xl sm:text-7xl text-white relative z-10 drop-shadow-[0_0_12px_rgba(0,0,0,0.9)]"
          style={{ textShadow: `0 0 30px ${color}`, transform: "translateZ(26px)" }}
        >
          {side === "ai" ? "AI" : "H"}
        </span>

        {/* Hover aura */}
        <motion.span
          className="absolute rounded-full pointer-events-none"
          style={{
            inset:      -16,
            background: `radial-gradient(circle, transparent 45%, ${color}18 100%)`,
            filter:     "blur(8px)",
          }}
          animate={highlighted ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.35 }}
        />
      </motion.div>

      {/* Text below pill */}
      <div className="text-center">
        <div
          className="font-display text-sm sm:text-base uppercase tracking-[0.35em]"
          style={{ color }}
        >
          {label}
        </div>
        <div className="text-xs text-fg/60 mt-1 max-w-[170px]">{description}</div>

        {/* Live recruit count */}
        <motion.div
          className="mt-2 text-[10px] font-mono uppercase tracking-[0.22em] tabular-nums"
          style={{ color: `${color}99` }}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          {count.toLocaleString()} {side === "ai" ? "machines" : "humans"}
        </motion.div>
      </div>
    </motion.button>
  );
}
