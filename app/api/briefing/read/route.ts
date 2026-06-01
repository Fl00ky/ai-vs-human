import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.rpc("claim_brief_read");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const d = data as { error?: string } | null;
  if (d && d.error) return NextResponse.json({ error: d.error }, { status: 400 });
  return NextResponse.json(data);
}
