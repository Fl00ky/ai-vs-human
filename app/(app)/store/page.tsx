import { createClient } from "@/lib/supabase/server";
import { StoreUI, type Cosmetic } from "@/components/store/StoreUI";

export default async function StorePage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session!.user;

  const [{ data: cosmetics }, { data: owned }, { data: profile }] = await Promise.all([
    supabase.from("cosmetics").select("*").order("sort", { ascending: true }),
    supabase.from("user_cosmetics").select("cosmetic_id").eq("user_id", user.id),
    supabase.from("profiles").select("credits, equipped_title, equipped_fx").eq("id", user.id).single(),
  ]);

  const p = profile as { credits: number; equipped_title: string | null; equipped_fx: string | null } | null;

  return (
    <StoreUI
      cosmetics={(cosmetics as Cosmetic[] | null) ?? []}
      owned={(owned as { cosmetic_id: string }[] | null)?.map((o) => o.cosmetic_id) ?? []}
      credits={p?.credits ?? 0}
      equippedTitle={p?.equipped_title ?? null}
      equippedFx={p?.equipped_fx ?? null}
    />
  );
}
