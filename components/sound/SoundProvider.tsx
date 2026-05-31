"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";

type SoundKey =
  | "correct"
  | "wrong"
  | "click"
  | "tick"
  | "win"
  | "lose"
  | "unlock"
  | "warning";

interface SoundContextValue {
  play: (key: SoundKey) => void;
  muted: boolean;
  toggleMuted: () => void;
}

const SoundContext = createContext<SoundContextValue>({
  play: () => {},
  muted: true,
  toggleMuted: () => {},
});

const STORAGE_KEY = "aivshuman.muted";

/** Synthesized retro beeps via Web Audio API. */
function playTone(
  ctx: AudioContext,
  freq: number,
  durationMs: number,
  type: OscillatorType = "square",
  volume = 0.08,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + durationMs / 1000);
}

function playSequence(ctx: AudioContext, notes: Array<[number, number, OscillatorType?, number?]>) {
  let delay = 0;
  for (const [freq, dur, type, vol] of notes) {
    setTimeout(() => playTone(ctx, freq, dur, type, vol), delay);
    delay += dur * 0.9;
  }
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(true);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setMuted(stored === "true");
  }, []);

  const getCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ctxRef.current = new AC();
      } catch {
        return null;
      }
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }, []);

  const play = useCallback(
    (key: SoundKey) => {
      if (muted) return;
      const ctx = getCtx();
      if (!ctx) return;
      switch (key) {
        case "correct":
          playSequence(ctx, [
            [660, 80, "square"],
            [880, 120, "square"],
          ]);
          break;
        case "wrong":
          playSequence(ctx, [
            [220, 100, "sawtooth"],
            [160, 150, "sawtooth"],
          ]);
          break;
        case "click":
          playTone(ctx, 800, 30, "square", 0.05);
          break;
        case "tick":
          playTone(ctx, 1200, 20, "square", 0.04);
          break;
        case "win":
          playSequence(ctx, [
            [523, 100, "square"],
            [659, 100, "square"],
            [784, 100, "square"],
            [1047, 200, "square"],
          ]);
          break;
        case "lose":
          playSequence(ctx, [
            [330, 150, "sawtooth"],
            [262, 200, "sawtooth"],
            [196, 300, "sawtooth"],
          ]);
          break;
        case "unlock":
          playSequence(ctx, [
            [784, 80, "triangle", 0.1],
            [988, 80, "triangle", 0.1],
            [1319, 200, "triangle", 0.1],
          ]);
          break;
        case "warning":
          playTone(ctx, 440, 80, "square", 0.06);
          break;
      }
    },
    [muted, getCtx],
  );

  const toggleMuted = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, String(next));
      }
      // Play unmute confirmation
      if (!next) {
        const ctx = getCtx();
        if (ctx) playTone(ctx, 880, 80, "square", 0.06);
      }
      return next;
    });
  }, [getCtx]);

  return (
    <SoundContext.Provider value={{ play, muted, toggleMuted }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  return useContext(SoundContext);
}
