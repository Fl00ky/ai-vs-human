// Rank ladder derived purely from lifetime total_score. No DB needed.
// Names are translated via t.ranks[key]; this module only computes tiers.

export type RankKey = "recruit" | "operative" | "veteran" | "elite" | "legend";

interface Tier {
  key: RankKey;
  min: number;
}

// Thresholds (lifetime total_score).
export const RANK_TIERS: Tier[] = [
  { key: "recruit",   min: 0 },
  { key: "operative", min: 1_000 },
  { key: "veteran",   min: 5_000 },
  { key: "elite",     min: 15_000 },
  { key: "legend",    min: 50_000 },
];

export interface RankInfo {
  key: RankKey;
  index: number;            // 0-based tier index
  floor: number;            // current tier threshold
  next: RankKey | null;     // next tier key, or null if maxed
  ceil: number | null;      // next tier threshold, or null
  toNext: number;           // points remaining to next tier (0 if maxed)
  progress: number;         // 0..1 within current tier
}

export function getRank(score: number): RankInfo {
  let idx = 0;
  for (let i = 0; i < RANK_TIERS.length; i++) {
    if (score >= RANK_TIERS[i].min) idx = i;
  }
  const tier = RANK_TIERS[idx];
  const nextTier = RANK_TIERS[idx + 1] ?? null;
  const floor = tier.min;
  const ceil = nextTier ? nextTier.min : null;
  const toNext = ceil !== null ? Math.max(0, ceil - score) : 0;
  const progress =
    ceil !== null ? Math.min(1, (score - floor) / (ceil - floor)) : 1;

  return {
    key: tier.key,
    index: idx,
    floor,
    next: nextTier ? nextTier.key : null,
    ceil,
    toNext,
    progress,
  };
}
