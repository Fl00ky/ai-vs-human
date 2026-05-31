"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const parent: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const child: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: [0.2, 0.7, 0.2, 1] },
  },
};

interface MotionGridProps {
  children: ReactNode;
  className?: string;
  /** override stagger delay between children (s) */
  stagger?: number;
  /** override delay before first child animates (s) */
  delayChildren?: number;
  /** render as a non-motion section but still trigger children when in view */
  inView?: boolean;
}

/**
 * Parent wrapper that staggers MotionGridItem children on mount.
 * Use on any grid/list of cards that should cascade in.
 */
export function MotionGrid({
  children,
  className = "",
  stagger,
  delayChildren,
  inView = false,
}: MotionGridProps) {
  const variants: Variants =
    stagger !== undefined || delayChildren !== undefined
      ? {
          hidden: {},
          show: {
            transition: {
              staggerChildren: stagger ?? 0.08,
              delayChildren: delayChildren ?? 0.1,
            },
          },
        }
      : parent;

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      {...(inView
        ? { whileInView: "show", viewport: { once: true, amount: 0.2 } }
        : { animate: "show" })}
    >
      {children}
    </motion.div>
  );
}

interface MotionGridItemProps {
  children: ReactNode;
  className?: string;
  /** render as a different element — useful for <a>/<li> */
  as?: "div" | "li" | "section" | "article";
}

export function MotionGridItem({
  children,
  className = "",
  as = "div",
}: MotionGridItemProps) {
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp className={className} variants={child}>
      {children}
    </Comp>
  );
}
