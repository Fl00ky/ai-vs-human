// "Will AI replace you?" scoring. Options in each question are ordered from
// LEAST to MOST replaceable, so an option's weight == its index (0,1,2).
// Question text/options live in i18n (replaceTest); they MUST keep this order.

export const RT_QUESTIONS = 6;
export const RT_OPTIONS = 3;
const RT_MAX = RT_QUESTIONS * (RT_OPTIONS - 1); // 12

export type RtBand = "low" | "mid" | "high";

export function computeReplaceScore(answers: number[]): number {
  const sum = answers.reduce((a, b) => a + b, 0);
  return Math.round((sum / RT_MAX) * 100);
}

export function getBand(score: number): RtBand {
  if (score <= 33) return "low";
  if (score <= 66) return "mid";
  return "high";
}
