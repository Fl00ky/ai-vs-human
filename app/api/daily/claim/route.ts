import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Atomic, idempotent-per-day claim handled entirely in Postgres.
  const { data, error } = await supabase.rpc("claim_daily_reward");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (data && (data as { error?: string }).error) {
    return NextResponse.json({ error: (data as { error: string }).error }, { status: 400 });
  }

  return NextResponse.json(data);
}
