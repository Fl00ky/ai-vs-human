"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TeamProgress } from "./TeamProgress";
import type { TeamScore } from "@/lib/types/database";

interface LiveTeamProgressProps {
  initial: TeamScore[];
  compact?: boolean;
}

export function LiveTeamProgress({ initial, compact }: LiveTeamProgressProps) {
  const [scores, setScores] = useState<TeamScore[]>(initial);

  useEffect(() => {
    const supabase = createClient();

    const refetch = async () => {
      const { data } = await supabase.from("team_score_view").select("*");
      if (data) setScores(data);
    };

    const channel = supabase
      .channel("team-scores")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          refetch();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const ai = scores.find((s) => s.side === "ai");
  const human = scores.find((s) => s.side === "human");

  return (
    <TeamProgress
      aiScore={ai?.score ?? 0}
      humanScore={human?.score ?? 0}
      aiMembers={ai?.members}
      humanMembers={human?.members}
      compact={compact}
    />
  );
}
