"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <>
      {/* Brief scanline sweep on every route change. CSS-driven; key resets it. */}
      <span key={`sweep-${pathname}`} className="scanline-sweep" aria-hidden />
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{
            opacity: 0,
            y: 16,
            filter: "blur(6px) saturate(0.5)",
          }}
          animate={{
            opacity: 1,
            y: 0,
            filter: "blur(0px) saturate(1)",
            transition: { duration: 0.35, ease: [0.2, 0.7, 0.2, 1], delay: 0.12 },
          }}
          exit={{
            opacity: 0,
            y: -8,
            filter: "blur(4px) saturate(0.4)",
            transition: { duration: 0.18 },
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
