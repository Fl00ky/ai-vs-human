"use client";

import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
  delay?: number;
}

export function Skeleton({ className = "", delay = 0 }: SkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
      className={`bg-side/10 ${className}`}
    />
  );
}

export function PageSkeleton({ title = "loading" }: { title?: string }) {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-3 w-24 mb-3" />
        <Skeleton className="h-12 w-72" />
      </div>
      <Skeleton className="h-32 w-full" delay={0.1} />
      <div className="grid sm:grid-cols-3 gap-4">
        <Skeleton className="h-24" delay={0.2} />
        <Skeleton className="h-24" delay={0.25} />
        <Skeleton className="h-24" delay={0.3} />
      </div>
      <div className="text-center text-xs text-side/40 uppercase tracking-[0.3em] animate-pulse">
        &gt; {title}...
      </div>
    </div>
  );
}
