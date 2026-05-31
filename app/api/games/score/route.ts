import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { awardUnlocks, detectUnlocks } from "@/lib/achievements";

const bodySchema = z.object({
  game: z.enum(["quiz", "reaction", "code_breaker", "pattern"]),
  score: z.number().int().min(0).max(100_000),
  /** For reaction: best ms this play. For pattern: round reached. */
  detail: z.number().int().optional(),
  /** For code_breaker: cracked on first try. */
  firstTry: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { game, score, detail, firstTry } = parsed.data;

  const { error } = await supabase.from("game_scores").insert({
    user_id: user.id,
    game,
    score,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Detect & award achievements after the score landed
  const unlockIds = await detectUnlocks(supabase, {
    userId: user.id,
    game,
    score,
    detail,
    firstTry,
  });
  const unlocked = await awardUnlocks(supabase, user.id, unlockIds);

  return NextResponse.json({ ok: true, unlocked });
}
