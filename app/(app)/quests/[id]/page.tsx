import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuestDetailClient } from "./QuestDetailClient";
import type { Quest } from "@/lib/types/database";

export default async function QuestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session!.user.id;

  const [{ data: quest }, { data: userQuest }] = await Promise.all([
    supabase.from("quests").select("*").eq("id", id).single(),
    supabase.from("user_quests").select("quest_id").eq("user_id", userId).eq("quest_id", id).maybeSingle(),
  ]);

  if (!quest) notFound();

  return (
    <QuestDetailClient
      quest={quest as Quest}
      completed={!!userQuest}
      userId={userId}
    />
  );
}
