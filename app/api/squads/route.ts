import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// One endpoint handles create / join / leave / kick via { action }.
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), name: z.string().min(3).max(24), tag: z.string().min(2).max(5) }),
  z.object({ action: z.literal("join"), tag: z.string().min(2).max(5) }),
  z.object({ action: z.literal("leave") }),
  z.object({ action: z.literal("kick"), target: z.string().uuid() }),
]);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const body = parsed.data;
  let res;
  if (body.action === "create") {
    res = await supabase.rpc("create_squad", { p_name: body.name, p_tag: body.tag } as never);
  } else if (body.action === "join") {
    res = await supabase.rpc("join_squad", { p_tag: body.tag } as never);
  } else if (body.action === "leave") {
    res = await supabase.rpc("leave_squad");
  } else {
    res = await supabase.rpc("kick_member", { p_target: body.target } as never);
  }

  if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 });
  const data = res.data as { error?: string } | null;
  if (data && data.error) return NextResponse.json({ error: data.error }, { status: 400 });
  return NextResponse.json(data);
}
