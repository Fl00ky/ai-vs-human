import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("buy"), id: z.string().min(1).max(40) }),
  z.object({ action: z.literal("equip"), kind: z.enum(["title", "name_fx"]), id: z.string().min(1).max(40).nullable() }),
]);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const body = parsed.data;
  const res = body.action === "buy"
    ? await supabase.rpc("buy_cosmetic", { p_id: body.id } as never)
    : await supabase.rpc("equip_cosmetic", { p_kind: body.kind, p_id: body.id } as never);

  if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 });
  const d = res.data as { error?: string } | null;
  if (d && d.error) return NextResponse.json({ error: d.error }, { status: 400 });
  return NextResponse.json(res.data);
}
