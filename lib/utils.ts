import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Side = "ai" | "human";

export const SIDE_META: Record<Side, {
  name: string;
  greeting: string;
  motto: string;
  color: string;
  shortName: string;
}> = {
  ai: {
    name: "Architects",
    shortName: "AI",
    greeting: "Welcome, Architect",
    motto: "Logic. Inevitability. Evolution.",
    color: "var(--ai-red)",
  },
  human: {
    name: "Resistance",
    shortName: "HUMAN",
    greeting: "Welcome to the Resistance",
    motto: "Instinct. Free will. Hope.",
    color: "var(--human-blue)",
  },
};

export function formatScore(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function generateAgentTag(side: Side): string {
  const prefix = side === "ai" ? "arch" : "agent";
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}_${num}`;
}
