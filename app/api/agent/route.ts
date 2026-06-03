import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ action: z.enum(["tick", "upgrade", "overclock"]) });

const RPC: Record<string, string> = {
  tick: "agent_tick",
  upgrade: "agent_upgrade",
  overclock: "agent_overclock",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const { data, error } = await supabase.rpc(RPC[parsed.data.action]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const d = data as { error?: string } | null;
  if (d && d.error) return NextResponse.json(d, { status: 400 });
  return NextResponse.json(data);
}
