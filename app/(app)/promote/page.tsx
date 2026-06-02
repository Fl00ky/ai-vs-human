import { createClient } from "@/lib/supabase/server";
import { MissionsUI, type Submission } from "@/components/missions/MissionsUI";

export default async function PromotePage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session!.user;

  const [{ data: subs }, { data: profile }] = await Promise.all([
    supabase.from("social_submissions").select("mission_id, status").eq("user_id", user.id),
    supabase.from("profiles").select("social_approved, is_ambassador").eq("id", user.id).single(),
  ]);

  const p = profile as { social_approved: number; is_ambassador: boolean } | null;

  return (
    <MissionsUI
      submissions={(subs as Submission[] | null) ?? []}
      approvedCount={p?.social_approved ?? 0}
      isAmbassador={!!p?.is_ambassador}
    />
  );
}
