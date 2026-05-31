"use client";

import { motion } from "framer-motion";
import { ReactNode, useEffect, useRef, useState } from "react";

interface GlitchTextProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "span";
}

export function GlitchText({ text, className = "", as = "h1" }: GlitchTextProps) {
  const Comp = motion[as] as typeof motion.h1;
  return (
    <Comp
      initial={{ opacity: 0, filter: "blur(8px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`glitch-text font-display ${className}`}
      data-text={text}
    >
      {text}
    </Comp>
  );
}

interface TerminalProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function Terminal({ children, className = "", title }: TerminalProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`terminal-box p-6 ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-side/30">
          <span className="text-xs uppercase tracking-[0.2em] text-side/70">
            [ {title} ]
          </span>
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-side/40" />
            <span className="w-2 h-2 rounded-full bg-side/60" />
            <span className="w-2 h-2 rounded-full bg-side/80" />
          </div>
        </div>
      )}
      {children}
    </motion.div>
  );
}

interface TypewriterProps {
  text: string;
  /** delay in ms before typing starts */
  delay?: number;
  /** ms per character */
  speed?: number;
  className?: string;
  /** show a blinking cursor at the end while typing (and optionally after) */
  cursor?: boolean;
  /** keep cursor blinking after finished typing */
  cursorAfter?: boolean;
  onDone?: () => void;
}

/**
 * Real char-by-char typewriter. Reveals one character at a time using a JS
 * interval — previous implementation animated `width` which doesn't actually
 * mask characters and only shrank a span.
 */
export function Typewriter({
  text,
  delay = 0,
  speed = 35,
  className = "",
  cursor = true,
  cursorAfter = false,
  onDone,
}: TypewriterProps) {
  const [visible, setVisible] = useState("");
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    setVisible("");
    setDone(false);
    const interval = setInterval(() => {
      i++;
      setVisible(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
        onDoneRef.current?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [started, text, speed]);

  return (
    <span className={className}>
      <span>{visible}</span>
      {cursor && started && (!done || cursorAfter) && (
        <span className="typewriter-caret">_</span>
      )}
    </span>
  );
}

interface BootLine {
  text: string;
  /** ms per character override */
  speed?: number;
  className?: string;
}

interface BootSequenceProps {
  lines: BootLine[];
  /** ms between the end of one line and start of the next */
  gap?: number;
  /** ms before the first line begins */
  startDelay?: number;
  /** default chars-per-second speed if a line doesn't override */
  speed?: number;
  className?: string;
  /** keep cursor blinking on the final line after the sequence completes */
  finalCursor?: boolean;
  onDone?: () => void;
}

/**
 * Sequenced terminal-style boot lines that type one after another. Each line
 * renders as a Typewriter; the next line mounts only after the previous
 * finishes, plus an optional gap.
 */
export function BootSequence({
  lines,
  gap = 180,
  startDelay = 0,
  speed = 30,
  className = "",
  finalCursor = true,
  onDone,
}: BootSequenceProps) {
  const [shown, setShown] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Kick off first line after startDelay
  useEffect(() => {
    if (startDelay <= 0) {
      setShown(1);
      return;
    }
    const t = setTimeout(() => setShown(1), startDelay);
    return () => clearTimeout(t);
  }, [startDelay]);

  const advance = () => {
    setShown((n) => {
      const next = n + 1;
      if (next > lines.length) {
        onDoneRef.current?.();
        return n;
      }
      return next;
    });
  };

  return (
    <div className={className}>
      {lines.slice(0, shown).map((line, idx) => {
        const isLast = idx === lines.length - 1;
        const isCurrent = idx === shown - 1;
        return (
          <div key={idx} className={line.className}>
            <Typewriter
              text={line.text}
              speed={line.speed ?? speed}
              cursor={isCurrent}
              cursorAfter={isLast && finalCursor}
              onDone={
                isCurrent
                  ? () => {
                      if (isLast) {
                        onDoneRef.current?.();
                      } else {
                        setTimeout(advance, gap);
                      }
                    }
                  : undefined
              }
            />
          </div>
        );
      })}
    </div>
  );
}
