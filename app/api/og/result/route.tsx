import { ImageResponse } from "next/og";

export const runtime = "edge";

// Generic shareable result card. Driven entirely by query params (no DB), so it
// works for the replace-test, rank-ups, season wins, etc.
//   ?side=ai|human  &big=73%25  &label=Highly%20exposed  &caption=AI-replaceability
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const side = p.get("side") === "ai" ? "ai" : "human";
  const big = (p.get("big") ?? "").slice(0, 16) || "?";
  const label = (p.get("label") ?? "").slice(0, 40);
  const caption = (p.get("caption") ?? "").slice(0, 40);

  const color = side === "ai" ? "#ff003c" : "#00d4ff";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", background: "#000",
          border: `12px solid ${color}`, fontFamily: "monospace", color: "#fff",
        }}
      >
        <div style={{ fontSize: 30, letterSpacing: 10, color: "#00ff41", marginBottom: 4 }}>
          AI vs HUMAN
        </div>
        {caption && (
          <div style={{ fontSize: 28, color: "#888", letterSpacing: 4, marginBottom: 18 }}>
            {caption.toUpperCase()}
          </div>
        )}
        <div style={{ fontSize: 200, fontWeight: 700, color, textShadow: `0 0 50px ${color}`, lineHeight: 1 }}>
          {big}
        </div>
        {label && (
          <div style={{ fontSize: 48, letterSpacing: 4, color, marginTop: 14 }}>
            {label.toUpperCase()}
          </div>
        )}
        <div style={{ fontSize: 24, letterSpacing: 6, color: "#00ff41", marginTop: 50, opacity: 0.8 }}>
          choose your side &middot; aivshuman
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
