// Render helpers for equipped name effects. equipped_fx holds either a hex
// color (e.g. "#ffd700") or the keyword "rainbow".

export function nameFxClass(fx: string | null | undefined): string {
  return fx === "rainbow" ? "name-rainbow" : "";
}

export function nameFxStyle(fx: string | null | undefined): React.CSSProperties {
  if (!fx || fx === "rainbow") return {};
  return { color: fx, textShadow: `0 0 10px ${fx}` };
}
