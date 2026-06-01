import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({ code: z.string().min(4).max(16) });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("redeem_referral", { code: parsed.data.code } as never);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (data && (data as { error?: string }).error) {
    return NextResponse.json({ error: (data as { error: string }).error }, { status: 400 });
  }
  return NextResponse.json(data);
}
