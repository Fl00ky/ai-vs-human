import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { awardUnlocks, detectUnlocks } from "@/lib/achievements";

const bodySchema = z.object({ quest_id: z.string().uuid() });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { error } = await supabase.from("user_quests").insert({
    user_id: user.id,
    quest_id: parsed.data.quest_id,
  });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Already completed" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const unlockIds = await detectUnlocks(supabase, { userId: user.id });
  const unlocked = await awardUnlocks(supabase, user.id, unlockIds);

  return NextResponse.json({ ok: true, unlocked });
}
