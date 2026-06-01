import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { QuestsLabels } from "@/components/quests/QuestsLabels";
import { formatScore, type Side } from "@/lib/utils";
import type { Quest } from "@/lib/types/database";

export default async function QuestsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const { data: profile } = await supabase.from("profiles").select("side").eq("id", session!.user.id).single();
  const side = (profile?.side ?? "human") as Side;

  const { data: quests } = await supabase.from("quests").select("*").eq("active", true)
    .or(`side.is.null,side.eq.${side}`).order("reward", { ascending: false });

  const { data: completed } = await supabase.from("user_quests").select("quest_id").eq("user_id", session!.user.id);
  const completedIds = new Set(completed?.map((c) => c.quest_id) ?? []);

  return (
    <QuestsLabels quests={(quests as Quest[] | null) ?? []} completedIds={completedIds} />
  );
}
