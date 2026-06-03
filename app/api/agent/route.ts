import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("tick") }),
  z.object({ action: z.literal("upgrade") }),
  z.object({ action: z.literal("overclock") }),
  z.object({ action: z.literal("open") }),
  z.object({ action: z.literal("equip"), id: z.string().uuid() }),
  z.object({ action: z.literal("salvage"), id: z.string().uuid() }),
]);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const b = parsed.data;

  let res;
  switch (b.action) {
    case "tick":      res = await supabase.rpc("agent_tick"); break;
    case "upgrade":   res = await supabase.rpc("agent_upgrade"); break;
    case "overclock": res = await supabase.rpc("agent_overclock"); break;
    case "open":      res = await supabase.rpc("open_chest"); break;
    case "equip":     res = await supabase.rpc("equip_item", { p_id: b.id } as never); break;
    case "salvage":   res = await supabase.rpc("salvage_item", { p_id: b.id } as never); break;
  }

  if (res!.error) return NextResponse.json({ error: res!.error.message }, { status: 500 });
  const d = res!.data as { error?: string } | null;
  if (d && d.error) return NextResponse.json(d, { status: 400 });
  return NextResponse.json(res!.data);
}
