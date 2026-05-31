import { createClient } from "@/lib/supabase/server";
import { GlitchText } from "@/components/matrix/Terminal";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { MotionGrid, MotionGridItem } from "@/components/MotionGrid";
import type { Achievement, Rarity } from "@/lib/types/database";

const RARITY_ORDER: Record<Rarity, number> = {
  legendary: 0,
  epic: 1,
  rare: 2,
  common: 3,
};

export default async function AchievementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: all }, { data: mine }] = await Promise.all([
    supabase.from("achievements").select("*"),
    supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", user!.id),
  ]);

  const unlockedMap = new Map(
    (mine ?? []).map((u) => [u.achievement_id, u.unlocked_at]),
  );

  const sorted = ((all as Achievement[] | null) ?? []).sort((a, b) => {
    const aUnlocked = unlockedMap.has(a.id);
    const bUnlocked = unlockedMap.has(b.id);
    if (aUnlocked !== bUnlocked) return aUnlocked ? -1 : 1;
    return RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
  });

  const unlockedCount = unlockedMap.size;
  const totalCount = all?.length ?? 0;
  const earnedPoints = (all ?? [])
    .filter((a) => unlockedMap.has(a.id))
    .reduce((s, a) => s + a.points, 0);

  return (
    <div className="space-y-8">
      <section>
        <div className="text-xs text-side/60 uppercase tracking-[0.3em] mb-2">
          ./achievements
        </div>
        <GlitchText text="Achievements" as="h1" className="text-3xl sm:text-5xl" />
        <p className="text-fg/60 mt-2">
          Unlock badges by mastering the games. Each grants bonus points to your side.
        </p>
      </section>

      <section className="grid grid-cols-3 gap-4">
        <Stat label="Unlocked" value={`${unlockedCount} / ${totalCount}`} />
        <Stat
          label="Completion"
          value={
            totalCount > 0
              ? `${Math.round((unlockedCount / totalCount) * 100)}%`
              : "0%"
          }
        />
        <Stat label="Bonus pts" value={`+${earnedPoints.toLocaleString()}`} />
      </section>

      <MotionGrid className="grid sm:grid-cols-2 gap-3">
        {sorted.map((a) => (
          <MotionGridItem key={a.id}>
            <AchievementCard
              achievement={a}
              unlocked={unlockedMap.has(a.id)}
              unlockedAt={unlockedMap.get(a.id)}
            />
          </MotionGridItem>
        ))}
      </MotionGrid>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="terminal-box p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-fg/50">
        {label}
      </div>
      <div className="font-display text-xl sm:text-2xl text-side mt-1 tabular-nums">
        {value}
      </div>
    </div>
  );
}
