import { createClient } from "@/lib/supabase/server";
import { LearnUI } from "@/components/learn/LearnUI";

export default async function LearnPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const { data: done } = await supabase
    .from("user_lessons")
    .select("lesson_id")
    .eq("user_id", session!.user.id);

  const completed = (done as { lesson_id: string }[] | null)?.map((d) => d.lesson_id) ?? [];

  return <LearnUI completed={completed} />;
}
