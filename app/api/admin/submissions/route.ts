import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";

// Pending submissions with usernames.
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: subs } = await admin.supabase
    .from("social_submissions")
    .select("id, user_id, mission_id, url, note, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(100);

  const rows = (subs as { id: string; user_id: string; mission_id: string; url: string; note: string | null; created_at: string }[] | null) ?? [];
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const { data: profs } = ids.length
    ? await admin.supabase.from("profiles").select("id, username").in("id", ids)
    : { data: [] as { id: string; username: string }[] };
  const nameMap = new Map((profs ?? []).map((p) => [p.id, p.username]));

  return NextResponse.json({
    submissions: rows.map((r) => ({ ...r, username: nameMap.get(r.user_id) ?? "?" })),
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = z.object({ id: z.string().uuid(), approve: z.boolean() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const { data, error } = await admin.supabase.rpc("review_submission", {
    p_id: parsed.data.id, p_approve: parsed.data.approve,
  } as never);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const d = data as { error?: string } | null;
  if (d && d.error) return NextResponse.json({ error: d.error }, { status: 400 });
  return NextResponse.json(data);
}
