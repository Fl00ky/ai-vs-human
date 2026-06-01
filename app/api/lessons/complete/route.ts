import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ id: z.string().min(1).max(40), answer: z.number().int().min(0).max(10) });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { data, error } = await supabase.rpc("complete_lesson", {
    p_id: parsed.data.id,
    p_answer: parsed.data.answer,
  } as never);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const d = data as { error?: string } | null;
  if (d && d.error) return NextResponse.json({ error: d.error }, { status: 400 });
  return NextResponse.json(data);
}
