import { createClient } from "@/lib/supabase/server";
import { BriefingUI, type Brief } from "@/components/briefing/BriefingUI";

export default async function BriefingPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const [{ data: briefs }, { data: profile }] = await Promise.all([
    supabase.from("daily_briefs").select("*").order("published_at", { ascending: false }).limit(30),
    supabase.from("profiles").select("last_brief_read").eq("id", session!.user.id).single(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const readToday = (profile as { last_brief_read: string | null } | null)?.last_brief_read === today;

  return <BriefingUI briefs={(briefs as Brief[] | null) ?? []} readToday={readToday} />;
}
