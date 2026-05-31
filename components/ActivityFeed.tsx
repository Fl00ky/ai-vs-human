"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Zap, ListTodo, Award } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatScore, type Side } from "@/lib/utils";

interface FeedEvent {
  id: string;
  ts: string;
  kind: "score" | "quest" | "achievement";
  username: string;
  side: Side;
  message: string;
  amount?: number;
}

interface ActivityFeedProps {
  initial: FeedEvent[];
}

export function ActivityFeed({ initial }: ActivityFeedProps) {
  const [events, setEvents] = useState<FeedEvent[]>(initial);

  useEffect(() => {
    const supabase = createClient();

    const onGameInsert = async (payload: { new: { user_id: string; game: string; score: number; played_at: string; id: string } }) => {
      const row = payload.new;
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, side")
        .eq("id", row.user_id)
        .single();
      if (!profile) return;
      setEvents((prev) =>
        [
          {
            id: `score-${row.id}`,
            ts: row.played_at,
            kind: "score" as const,
            username: profile.username,
            side: profile.side,
            message: `+${formatScore(row.score)} from ${row.game.replace("_", " ")}`,
            amount: row.score,
          },
          ...prev,
        ].slice(0, 30),
      );
    };

    const onQuestInsert = async (payload: { new: { user_id: string; quest_id: string; completed_at: string } }) => {
      const row = payload.new;
      const [{ data: profile }, { data: quest }] = await Promise.all([
        supabase.from("profiles").select("username, side").eq("id", row.user_id).single(),
        supabase.from("quests").select("title, reward").eq("id", row.quest_id).single(),
      ]);
      if (!profile || !quest) return;
      setEvents((prev) =>
        [
          {
            id: `quest-${row.user_id}-${row.quest_id}`,
            ts: row.completed_at,
            kind: "quest" as const,
            username: profile.username,
            side: profile.side,
            message: `completed «${quest.title}»`,
            amount: quest.reward,
          },
          ...prev,
        ].slice(0, 30),
      );
    };

    const onAchInsert = async (payload: { new: { user_id: string; achievement_id: string; unlocked_at: string } }) => {
      const row = payload.new;
      const [{ data: profile }, { data: ach }] = await Promise.all([
        supabase.from("profiles").select("username, side").eq("id", row.user_id).single(),
        supabase.from("achievements").select("title, points").eq("id", row.achievement_id).single(),
      ]);
      if (!profile || !ach) return;
      setEvents((prev) =>
        [
          {
            id: `ach-${row.user_id}-${row.achievement_id}`,
            ts: row.unlocked_at,
            kind: "achievement" as const,
            username: profile.username,
            side: profile.side,
            message: `unlocked ★ ${ach.title}`,
            amount: ach.points,
          },
          ...prev,
        ].slice(0, 30),
      );
    };

    const channel = supabase
      .channel("activity-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "game_scores" }, onGameInsert)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "user_quests" }, onQuestInsert)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "user_achievements" }, onAchInsert)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (events.length === 0) {
    return (
      <p className="text-fg/40 text-sm">No activity yet. Be the first to score.</p>
    );
  }

  return (
    <ul className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
      <AnimatePresence initial={false}>
        {events.map((e) => {
          const sideColor = e.side === "ai" ? "var(--ai-red)" : "var(--human-blue)";
          const Icon = e.kind === "quest" ? ListTodo : e.kind === "achievement" ? Award : Zap;
          return (
            <motion.li
              key={e.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-3 py-2 border border-fg/10 hover:border-fg/20 text-sm"
            >
              <Icon size={14} className="flex-shrink-0" style={{ color: sideColor }} />
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: sideColor }}
              />
              <span className="font-mono truncate" style={{ color: sideColor }}>
                {e.username}
              </span>
              <span className="text-fg/60 truncate flex-1">{e.message}</span>
              {e.amount !== undefined && (
                <span className="text-side text-xs tabular-nums flex-shrink-0">
                  +{formatScore(e.amount)}
                </span>
              )}
              <span className="text-[10px] text-fg/30 flex-shrink-0 tabular-nums">
                {formatTime(e.ts)}
              </span>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}

export type { FeedEvent };
