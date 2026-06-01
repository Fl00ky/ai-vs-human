import { createClient } from "@/lib/supabase/server";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { AchievementsLabels } from "@/components/achievements/AchievementsLabels";
import { MotionGrid, MotionGridItem } from "@/components/MotionGrid";
import type { Achievement, Rarity } from "@/lib/types/database";

const RARITY_ORDER: Record<Rarity, number> = { legendary: 0, epic: 1, rare: 2, common: 3 };

export default async function AchievementsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const [{ data: all }, { data: mine }] = await Promise.all([
    supabase.from("achievements").select("*"),
    supabase.from("user_achievements").select("achievement_id, unlocked_at").eq("user_id", session!.user.id),
  ]);

  const unlockedMap = new Map((mine ?? []).map((u) => [u.achievement_id, u.unlocked_at]));
  const sorted = ((all as Achievement[] | null) ?? []).sort((a, b) => {
    const aU = unlockedMap.has(a.id), bU = unlockedMap.has(b.id);
    if (aU !== bU) return aU ? -1 : 1;
    return RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
  });

  const unlockedCount = unlockedMap.size;
  const totalCount    = all?.length ?? 0;
  const earnedPoints  = (all ?? []).filter(a => unlockedMap.has(a.id)).reduce((s, a) => s + a.points, 0);

  return (
    <AchievementsLabels
      unlockedCount={unlockedCount}
      totalCount={totalCount}
      earnedPoints={earnedPoints}
    >
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
    </AchievementsLabels>
  );
}
