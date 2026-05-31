import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GlitchText } from "@/components/matrix/Terminal";
import { MotionGrid, MotionGridItem } from "@/components/MotionGrid";
import { formatScore, type Side } from "@/lib/utils";
import type { Quest } from "@/lib/types/database";

export default async function QuestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("side")
    .eq("id", user!.id)
    .single();

  const side = (profile?.side ?? "human") as Side;

  const { data: quests } = await supabase
    .from("quests")
    .select("*")
    .eq("active", true)
    .or(`side.is.null,side.eq.${side}`)
    .order("reward", { ascending: false });

  const { data: completed } = await supabase
    .from("user_quests")
    .select("quest_id")
    .eq("user_id", user!.id);

  const completedIds = new Set(completed?.map((c) => c.quest_id) ?? []);

  return (
    <div className="space-y-8">
      <section>
        <div className="text-xs text-side/60 uppercase tracking-[0.3em] mb-2">./quests</div>
        <GlitchText text="Missions" as="h1" className="text-3xl sm:text-5xl" />
        <p className="text-fg/60 mt-2">Complete missions to earn bonus points for your side.</p>
      </section>

      <MotionGrid className="grid sm:grid-cols-2 gap-4">
        {(quests as Quest[] | null)?.map((q) => {
          const done = completedIds.has(q.id);
          return (
            <MotionGridItem key={q.id}>
              <Link
                href={`/quests/${q.id}`}
                className={`terminal-box card-shimmer p-5 group transition-all hover:-translate-y-1 block h-full ${done ? "opacity-50" : "hover:border-side"}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-display text-lg text-side uppercase tracking-wider">
                    {q.title}
                  </span>
                  <span className={`text-xs px-2 py-0.5 flex-shrink-0 ${done ? "text-fg/40 border border-fg/20" : "text-side border border-side/50"}`}>
                    {done ? "done" : `+${formatScore(q.reward)}`}
                  </span>
                </div>
                <p className="text-sm text-fg/60">{q.description}</p>
                {q.side && (
                  <div className={`mt-2 text-[10px] uppercase tracking-widest ${q.side === "ai" ? "text-ai-red" : "text-human-blue"}`}>
                    {q.side} only
                  </div>
                )}
              </Link>
            </MotionGridItem>
          );
        })}
      </MotionGrid>
    </div>
  );
}
