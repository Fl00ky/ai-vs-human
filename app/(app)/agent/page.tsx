import { createClient } from "@/lib/supabase/server";
import { AgentGame } from "@/components/agent/AgentGame";
import type { Side } from "@/lib/utils";

export default async function AgentPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const { data: profile } = await supabase
    .from("profiles")
    .select("side")
    .eq("id", session!.user.id)
    .single();

  return <AgentGame side={((profile as { side: Side } | null)?.side ?? "human")} />;
}
