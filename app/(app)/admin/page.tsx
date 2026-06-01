import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { AdminUI, type AdminBrief, type AdminQuest } from "@/components/admin/AdminUI";

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/dashboard");

  const [{ data: stats }, { data: briefs }, { data: quests }] = await Promise.all([
    admin.supabase.rpc("admin_stats"),
    admin.supabase.from("daily_briefs").select("id, title, category, published_at").order("published_at", { ascending: false }).limit(50),
    admin.supabase.from("quests").select("id, title, reward, side, active").order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <AdminUI
      stats={(stats as Record<string, number> | null) ?? {}}
      briefs={(briefs as AdminBrief[] | null) ?? []}
      quests={(quests as AdminQuest[] | null) ?? []}
    />
  );
}
