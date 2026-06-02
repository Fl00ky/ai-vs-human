"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { formatScore, type Side } from "@/lib/utils";
import { nameFxClass, nameFxStyle } from "@/lib/cosmetics";
import type { LeaderboardEntry } from "@/lib/types/database";

interface UserListProps {
  initial: LeaderboardEntry[];
  currentUserId?: string;
}

export function UserList({ initial, currentUserId }: UserListProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initial);
  const [filter, setFilter] = useState<Side | "all">("all");

  useEffect(() => {
    const supabase = createClient();
    const refetch = async () => {
      const { data } = await supabase
        .from("leaderboard_view")
        .select("*")
        .order("rank", { ascending: true })
        .limit(50);
      if (data) setEntries(data);
    };

    const channel = supabase
      .channel("leaderboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => refetch(),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const visible = filter === "all" ? entries : entries.filter((e) => e.side === filter);

  return (
    <div>
      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(["all", "ai", "human"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs uppercase tracking-[0.2em] border transition-all ${
              filter === f
                ? f === "ai"
                  ? "border-ai-red text-ai-red bg-ai-red/10"
                  : f === "human"
                  ? "border-human-blue text-human-blue bg-human-blue/10"
                  : "border-side text-side bg-side/10"
                : "border-fg/20 text-fg/40 hover:border-fg/40"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <ul className="space-y-1">
        {visible.map((entry, i) => {
          const isMe = entry.id === currentUserId;
          const sideColor = entry.side === "ai" ? "var(--ai-red)" : "var(--human-blue)";
          return (
            <motion.li
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 200, damping: 20 }}
              className={`flex items-center gap-3 px-4 py-2.5 border transition-all ${
                isMe
                  ? "border-side bg-side/10"
                  : "border-fg/10 hover:border-fg/20"
              }`}
            >
              <span className="w-8 text-right text-xs text-fg/40 tabular-nums font-mono">
                #{entry.rank}
              </span>
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: sideColor }}
              />
              <span className="flex-1 font-mono text-sm truncate flex items-center gap-1.5 min-w-0">
                <span
                  className={`truncate ${nameFxClass(entry.equipped_fx)}`}
                  style={entry.equipped_fx ? nameFxStyle(entry.equipped_fx) : { color: isMe ? "var(--side-color)" : "var(--fg)" }}
                >
                  {entry.username}
                </span>
                {entry.squad_tag && (
                  <span className="text-[10px] text-fg/40 shrink-0">[{entry.squad_tag}]</span>
                )}
                {entry.equipped_title && (
                  <span className="text-[9px] uppercase tracking-widest shrink-0" style={{ color: sideColor }}>
                    {entry.equipped_title}
                  </span>
                )}
                {isMe && <span className="text-[10px] text-side/60 shrink-0">[you]</span>}
              </span>
              <span className="font-display text-base tabular-nums" style={{ color: sideColor }}>
                {formatScore(entry.total_score)}
              </span>
            </motion.li>
          );
        })}
        {visible.length === 0 && (
          <li className="text-center text-fg/40 text-sm py-8">
            No operatives yet.
          </li>
        )}
      </ul>
    </div>
  );
}
