"use client";

import { useEffect, useRef } from "react";

type Side = "ai" | "human" | "neutral";

interface MatrixRainProps {
  side?: Side;
  intensity?: number;
  hoveredSide?: "ai" | "human" | null;
  className?: string;
}

const COLOR_MAP: Record<Side, { head: string; trail: string }> = {
  neutral: { head: "#a8ffb8", trail: "#00ff41" },
  ai:      { head: "#ffb8c4", trail: "#ff003c" },
  human:   { head: "#b8eaff", trail: "#00d4ff" },
};

const CHARS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+-=<>";

export function MatrixRain({
  side = "neutral",
  intensity = 1,
  hoveredSide = null,
  className = "",
}: MatrixRainProps) {
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const sideRef         = useRef<Side>(side);
  const intensityRef    = useRef(intensity);
  const hoveredSideRef  = useRef<"ai" | "human" | null>(hoveredSide);

  useEffect(() => { sideRef.current = side; }, [side]);
  useEffect(() => { intensityRef.current = intensity; }, [intensity]);
  useEffect(() => { hoveredSideRef.current = hoveredSide; }, [hoveredSide]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fontSize = 15;
    let width  = (canvas.width  = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let columns = Math.floor(width / fontSize);

    // Per-column speed multipliers for depth effect (0.6x … 2x)
    let colSpeeds = new Array(columns).fill(0).map(() =>
      0.6 + Math.random() * 1.4,
    );
    let drops: number[] = new Array(columns)
      .fill(0)
      .map(() => Math.random() * -120);

    let rafId = 0;
    let last = performance.now();

    const handleResize = () => {
      width  = canvas.width  = window.innerWidth;
      height = canvas.height = window.innerHeight;
      columns   = Math.floor(width / fontSize);
      colSpeeds = new Array(columns).fill(0).map(() => 0.6 + Math.random() * 1.4);
      drops     = new Array(columns).fill(0).map(() => Math.random() * -120);
    };
    window.addEventListener("resize", handleResize);

    const draw = (now: number) => {
      const delta = now - last;
      if (delta < 33) { rafId = requestAnimationFrame(draw); return; }
      last = now;

      const { head, trail } = COLOR_MAP[sideRef.current];
      const hovSide  = hoveredSideRef.current;
      const halfWidth = width / 2;

      // Fade overlay
      ctx.fillStyle = "rgba(0, 0, 0, 0.065)";
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px var(--font-mono), monospace`;

      for (let i = 0; i < columns; i++) {
        if (Math.random() > intensityRef.current && drops[i] < 0) continue;

        const x = i * fontSize;

        // Split-screen: focused side is bright, other side nearly invisible
        if (hovSide !== null) {
          const isLeft    = x < halfWidth;
          const isFocused =
            (hovSide === "ai" && isLeft) || (hovSide === "human" && !isLeft);
          ctx.globalAlpha = isFocused ? 1.0 : 0.1;
        } else {
          ctx.globalAlpha = 1.0;
        }

        const text = CHARS[Math.floor(Math.random() * CHARS.length)];
        const y    = Math.floor(drops[i]) * fontSize;

        // Head character
        ctx.fillStyle = head;
        ctx.fillText(text, x, y);

        // Trail just above
        if (drops[i] > 1) {
          ctx.fillStyle = trail;
          ctx.fillText(
            CHARS[Math.floor(Math.random() * CHARS.length)],
            x,
            y - fontSize,
          );
        }

        if (y > height && Math.random() > 0.975) drops[i] = 0;
        drops[i] += colSpeeds[i];
      }

      ctx.globalAlpha = 1.0;
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 0, opacity: 0.85 }}
      aria-hidden="true"
    />
  );
}
