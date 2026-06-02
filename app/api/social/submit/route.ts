import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  mission: z.string().min(1).max(40),
  url: z.string().url().max(500),
  note: z.string().max(300).optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_url" }, { status: 400 });

  const { data, error } = await supabase.rpc("submit_social", {
    p_mission: parsed.data.mission,
    p_url: parsed.data.url,
    p_note: parsed.data.note ?? "",
  } as never);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const d = data as { error?: string } | null;
  if (d && d.error) return NextResponse.json({ error: d.error }, { status: 400 });
  return NextResponse.json(data);
}
