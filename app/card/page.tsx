import type { Metadata } from "next";
import Link from "next/link";
import { MatrixRain } from "@/components/matrix/MatrixRain";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

function ogUrl(sp: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  if (sp.side) q.set("side", sp.side);
  if (sp.big) q.set("big", sp.big);
  if (sp.label) q.set("label", sp.label);
  if (sp.caption) q.set("caption", sp.caption);
  return `/api/og/result?${q.toString()}`;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const title = `${sp.caption ?? "Result"}: ${sp.big ?? ""} :: AI vs Human`;
  const description = sp.label ?? "Pick your side in the AI vs Human war.";
  const image = ogUrl(sp);
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function CardPage({ searchParams }: Props) {
  const sp = await searchParams;
  const side = sp.side === "ai" ? "ai" : "human";
  const color = side === "ai" ? "var(--ai-red)" : "var(--human-blue)";
  const joinHref = sp.ref ? `/?ref=${encodeURIComponent(sp.ref)}` : "/";

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      <MatrixRain side={side} intensity={0.7} />
      <div className="relative z-10 w-full max-w-md text-center">
        <div className="text-xs uppercase tracking-[0.5em] text-matrix-green/70 mb-6">AI vs HUMAN</div>
        <div className="terminal-box p-8" style={{ borderColor: color, boxShadow: `0 0 40px color-mix(in srgb, ${color} 40%, transparent)` }}>
          {sp.caption && (
            <div className="text-[10px] uppercase tracking-[0.3em] text-fg/50 mb-2">{sp.caption}</div>
          )}
          <div className="font-display text-7xl sm:text-8xl tabular-nums" style={{ color, textShadow: `0 0 30px ${color}` }}>
            {sp.big ?? "?"}
          </div>
          {sp.label && (
            <div className="font-display text-lg uppercase tracking-widest mt-2 mb-6" style={{ color }}>
              {sp.label}
            </div>
          )}
          <Link href={joinHref} className="btn-matrix w-full justify-center mt-4">
            Choose your side
          </Link>
        </div>
      </div>
    </main>
  );
}
