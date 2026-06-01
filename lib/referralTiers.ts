// Referral milestone schedule. Must mirror award_referral_milestones() in
// migration 009. Counts QUALIFIED referrals (recruit played at least one game).

export interface RefTier {
  threshold: number;
  reward: number;
}

export const REFERRAL_TIERS: RefTier[] = [
  { threshold: 5,   reward: 1_000 },
  { threshold: 10,  reward: 2_500 },
  { threshold: 30,  reward: 10_000 },
  { threshold: 50,  reward: 20_000 },
  { threshold: 100, reward: 50_000 },
];

export interface RefProgress {
  count: number;
  next: RefTier | null;     // next unreached tier
  prevThreshold: number;    // last reached threshold (or 0)
  progress: number;         // 0..1 toward next tier
}

export function getReferralProgress(count: number): RefProgress {
  const next = REFERRAL_TIERS.find((tt) => count < tt.threshold) ?? null;
  const reachedIdx = REFERRAL_TIERS.filter((tt) => count >= tt.threshold).length - 1;
  const prevThreshold = reachedIdx >= 0 ? REFERRAL_TIERS[reachedIdx].threshold : 0;
  const progress = next
    ? Math.min(1, (count - prevThreshold) / (next.threshold - prevThreshold))
    : 1;
  return { count, next, prevThreshold, progress };
}
