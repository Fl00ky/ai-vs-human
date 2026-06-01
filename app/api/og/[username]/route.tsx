import { ImageResponse } from "next/og";

export const runtime = "edge";

interface Row {
  username: string;
  side: "ai" | "human";
  total_score: number;
  rank: number | null;
}

async function fetchProfile(username: string): Promise<Row | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(
      `${url}/rest/v1/leaderboard_view?username=eq.${encodeURIComponent(username)}&select=username,side,total_score,rank&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    const rows = (await res.json()) as Row[];
    return rows?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const row = await fetchProfile(username);

  const side = row?.side ?? "human";
  const color = side === "ai" ? "#ff003c" : "#00d4ff";
  const sideName = side === "ai" ? "TEAM AI" : "TEAM HUMAN";
  const score = (row?.total_score ?? 0).toLocaleString();
  const rank = row?.rank ? `#${row.rank}` : "--";
  const name = row?.username ?? username;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          border: `12px solid ${color}`,
          fontFamily: "monospace",
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 34, letterSpacing: 10, color: "#00ff41", marginBottom: 10 }}>
          AI vs HUMAN
        </div>
        <div style={{ fontSize: 110, fontWeight: 700, color, textShadow: `0 0 40px ${color}` }}>
          {name}
        </div>
        <div style={{ fontSize: 40, letterSpacing: 8, color, marginTop: 6 }}>{sideName}</div>
        <div style={{ display: "flex", gap: 70, marginTop: 50, fontSize: 44 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: 26, color: "#888", letterSpacing: 4 }}>SCORE</span>
            <span style={{ color: "#fff", fontWeight: 700 }}>{score}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: 26, color: "#888", letterSpacing: 4 }}>RANK</span>
            <span style={{ color: "#fff", fontWeight: 700 }}>{rank}</span>
          </div>
        </div>
        <div style={{ fontSize: 24, letterSpacing: 6, color: "#00ff41", marginTop: 56, opacity: 0.8 }}>
          choose your side &middot; aivshuman
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
