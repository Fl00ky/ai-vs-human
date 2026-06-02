import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";

const createSchema = z.object({
  type: z.enum(["surge", "raid"]),
  title: z.string().min(2).max(60),
  multiplier: z.number().min(1).max(10).optional(),
  target: z.number().int().min(1).max(10_000_000).nullable().optional(),
  side: z.enum(["ai", "human"]).nullable().optional(),
  hours: z.number().min(1).max(720), // duration in hours
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data } = await admin.supabase
    .from("war_events")
    .select("id, type, title, multiplier, target, side, starts_at, ends_at, finalized")
    .order("starts_at", { ascending: false })
    .limit(30);
  return NextResponse.json({ events: data ?? [] });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const b = parsed.data;

  const ends = new Date(Date.now() + b.hours * 3_600_000).toISOString();
  const { error } = await admin.supabase.from("war_events").insert({
    type: b.type,
    title: b.title,
    multiplier: b.multiplier ?? 2,
    target: b.type === "raid" ? (b.target ?? 10000) : null,
    side: b.side ?? null,
    ends_at: ends,
  } as never);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Finalize a raid (pay contributors) or delete an event.
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = z.object({ id: z.string().uuid() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const { data, error } = await admin.supabase.rpc("finalize_raid", { p_event: parsed.data.id } as never);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const d = data as { error?: string } | null;
  if (d && d.error) return NextResponse.json({ error: d.error }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { error } = await admin.supabase.from("war_events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
