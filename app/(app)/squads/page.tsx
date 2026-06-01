import { createClient } from "@/lib/supabase/server";
import { SquadsUI, type SquadRow, type Member } from "@/components/squads/SquadsUI";
import type { Side } from "@/lib/utils";

export default async function SquadsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session!.user;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, side, squad_id")
    .eq("id", user.id)
    .single();

  const p = profile as { id: string; username: string; side: Side; squad_id: string | null } | null;

  let mySquad: SquadRow | null = null;
  let members: Member[] = [];

  if (p?.squad_id) {
    const [{ data: sv }, { data: mem }] = await Promise.all([
      supabase.from("squad_score_view").select("*").eq("id", p.squad_id).maybeSingle(),
      supabase
        .from("profiles")
        .select("id, username, side, season_score")
        .eq("squad_id", p.squad_id)
        .order("season_score", { ascending: false }),
    ]);
    mySquad = (sv as SquadRow | null) ?? null;
    members = (mem as Member[] | null) ?? [];
  }

  const { data: board } = await supabase
    .from("squad_score_view")
    .select("*")
    .order("rank", { ascending: true })
    .limit(50);

  return (
    <SquadsUI
      myId={user.id}
      mySide={(p?.side ?? "human") as Side}
      mySquad={mySquad}
      members={members}
      board={(board as SquadRow[] | null) ?? []}
    />
  );
}
