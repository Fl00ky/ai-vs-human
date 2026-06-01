import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";

const createSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(2).max(500),
  reward: z.number().int().min(1).max(100000),
  side: z.enum(["ai", "human"]).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const { title, description, reward, side } = parsed.data;
  const { error } = await admin.supabase.from("quests").insert({
    title, description, reward, side: side ?? null, active: true,
  } as never);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Toggle a quest's active flag.
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = z.object({ id: z.string().uuid(), active: z.boolean() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const { error } = await admin.supabase
    .from("quests")
    .update({ active: parsed.data.active } as never)
    .eq("id", parsed.data.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
