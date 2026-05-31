"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { formatScore } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import type { Quest } from "@/lib/types/database";

interface QuestDetailClientProps {
  quest: Quest;
  completed: boolean;
  userId: string;
}

export function QuestDetailClient({ quest, completed, userId }: QuestDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [done, setDone] = useState(completed);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const complete = () => {
    startTransition(async () => {
      const res = await fetch("/api/quests/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quest_id: quest.id }),
      });
      if (res.ok) {
        setDone(true);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.55 },
          colors: ["#00ff41", "#ff003c", "#00d4ff"],
        });
        toast(`Mission complete: +${formatScore(quest.reward)} pts`, "success");
        const data = (await res.json().catch(() => ({}))) as {
          unlocked?: { id: string; title: string; points: number }[];
        };
        (data.unlocked ?? []).forEach((ach, i) => {
          setTimeout(() => {
            toast(`★ Unlocked: ${ach.title} (+${ach.points})`, "success");
          }, 400 * (i + 1));
        });
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        const msg = data.error ?? "Failed to complete quest";
        setError(msg);
        toast(msg, "error");
      }
    });
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <button
        onClick={() => router.push("/quests")}
        className="text-xs text-fg/40 hover:text-side flex items-center gap-1"
      >
        <ArrowLeft size={12} /> back to missions
      </button>

      <div className="terminal-box p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="font-display text-3xl sm:text-4xl text-side uppercase tracking-wider">
            {quest.title}
          </h1>
          <span className="text-side font-display text-2xl tabular-nums flex-shrink-0">
            +{formatScore(quest.reward)}
          </span>
        </div>

        {quest.side && (
          <div className={`text-[10px] uppercase tracking-widest mb-4 ${quest.side === "ai" ? "text-ai-red" : "text-human-blue"}`}>
            {quest.side} faction only
          </div>
        )}

        <p className="text-fg/80 leading-relaxed mb-8">{quest.description}</p>

        {done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-matrix-green"
          >
            <CheckCircle size={20} />
            <span className="font-display uppercase tracking-widest">Mission complete</span>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-fg/50">
              Complete the objective, then mark it done to claim your reward.
            </p>
            {error && (
              <div className="text-xs text-ai-red border border-ai-red/50 bg-ai-red/10 p-2">
                ! {error}
              </div>
            )}
            <button
              onClick={complete}
              disabled={pending}
              className="btn-matrix"
            >
              {pending ? "Claiming..." : "Mark as complete"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
