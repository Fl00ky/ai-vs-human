import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MatrixRain } from "@/components/matrix/MatrixRain";
import { GlitchText } from "@/components/matrix/Terminal";

interface Props {
  params: Promise<{ username: string }>;
}

interface Row {
  username: string;
  side: "ai" | "human";
  total_score: number;
  rank: number | null;
}

async function getProfile(username: string): Promise<{ row: Row | null; refCode: string | null }> {
  const supabase = await createClient();
  const [{ data: row }, { data: prof }] = await Promise.all([
    supabase
      .from("leaderboard_view")
      .select("username, side, total_score, rank")
      .eq("username", username)
      .maybeSingle(),
    supabase.from("profiles").select("referral_code").eq("username", username).maybeSingle(),
  ]);
  return {
    row: (row as Row | null) ?? null,
    refCode: (prof as { referral_code: string | null } | null)?.referral_code ?? null,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const title = `${username} :: AI vs Human`;
  const description = `${username} is fighting in the AI vs Human war. Pick your side.`;
  const ogImage = `/api/og/${encodeURIComponent(username)}`;
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: ogImage, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

export default async function PublicProfile({ params }: Props) {
  const { username } = await params;
  const { row, refCode } = await getProfile(username);

  const side = row?.side ?? "human";
  const color = side === "ai" ? "var(--ai-red)" : "var(--human-blue)";
  const sideName = side === "ai" ? "Team AI" : "Team Human";
  const joinHref = refCode ? `/?ref=${refCode}` : "/";

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      <MatrixRain side={side} intensity={0.7} />

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="text-xs uppercase tracking-[0.5em] text-matrix-green/70 mb-6">AI vs HUMAN</div>

        <div
          className="terminal-box p-8"
          style={{ borderColor: color, boxShadow: `0 0 40px color-mix(in srgb, ${color} 40%, transparent)` }}
        >
          {row ? (
            <>
              <GlitchText text={row.username} as="h1" className="text-4xl sm:text-5xl mb-3" />
              <div
                className="inline-block px-3 py-1 text-xs uppercase tracking-widest mb-6"
                style={{ color, border: `1px solid ${color}` }}
              >
                {sideName}
              </div>
              <div className="flex justify-center gap-10 mb-6">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-fg/40">Score</div>
                  <div className="font-display text-3xl tabular-nums" style={{ color }}>
                    {row.total_score.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-fg/40">Rank</div>
                  <div className="font-display text-3xl tabular-nums" style={{ color }}>
                    {row.rank ? `#${row.rank}` : "--"}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-fg/70 mb-6">Agent not found.</div>
          )}

          <Link href={joinHref} className="btn-matrix w-full justify-center">
            Choose your side
          </Link>
        </div>

        <div className="mt-6 text-xs text-fg/40">
          <Link href="/login" className="underline hover:text-matrix-green">
            Already enlisted? Return to terminal
          </Link>
        </div>
      </div>
    </main>
  );
}
