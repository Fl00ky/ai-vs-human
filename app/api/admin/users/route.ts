import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";

// Search users by username.
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  let query = admin.supabase
    .from("profiles")
    .select("id, username, side, total_score, season_score, is_admin")
    .order("total_score", { ascending: false })
    .limit(25);
  if (q) query = query.ilike("username", `%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data ?? [] });
}

// Adjust a user's score.
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = z.object({ target: z.string().uuid(), delta: z.number().int().min(-1000000).max(1000000) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const { data, error } = await admin.supabase.rpc("admin_adjust_score", {
    p_target: parsed.data.target,
    p_delta: parsed.data.delta,
  } as never);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const d = data as { error?: string } | null;
  if (d && d.error) return NextResponse.json({ error: d.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
