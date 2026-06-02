import { createClient } from "@/lib/supabase/server";
import { ReplaceTestUI } from "@/components/replace/ReplaceTestUI";
import type { Side } from "@/lib/utils";

export default async function ReplaceTestPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_code, side")
    .eq("id", session!.user.id)
    .single();

  const p = profile as { referral_code: string | null; side: Side } | null;

  return <ReplaceTestUI refCode={p?.referral_code ?? null} side={(p?.side ?? "human") as Side} />;
}
