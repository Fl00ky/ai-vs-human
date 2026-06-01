"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/context";
import { REFERRAL_TIERS, getReferralProgress } from "@/lib/referralTiers";

interface Props {
  referralCount: number; // qualified referrals
  pending: number;       // redeemed but not yet qualified
}

export function RecruitTiers({ referralCount, pending }: Props) {
  const { t } = useLanguage();
  const prog = getReferralProgress(referralCount);

  return (
    <div className="mt-5 pt-5 border-t border-side/15">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <span className="text-[11px] uppercase tracking-[0.2em] text-side/70">{t.dashboard.recruitTiers}</span>
        <span className="text-[11px] text-fg/50">
          <span className="text-side font-bold tabular-nums">{referralCount}</span> {t.dashboard.qualifiedRecruits}
          {pending > 0 && (
            <span className="text-fg/40"> · {pending} {t.dashboard.pending}</span>
          )}
        </span>
      </div>

      {/* Progress to next tier */}
      {prog.next && (
        <>
          <div className="flex items-center justify-between text-[10px] mb-1.5">
            <span className="text-fg/50">
              {t.dashboard.nextTierAt} {prog.next.threshold} {t.dashboard.recruits}
            </span>
            <span className="text-side/80 tabular-nums">
              +{prog.next.reward.toLocaleString()}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-black/60 border border-fg/10 mb-4">
            <motion.div
              className="h-full rounded-full bg-side"
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(prog.progress * 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ boxShadow: "0 0 8px var(--side-color)" }}
            />
          </div>
        </>
      )}

      {/* Tier chips */}
      <div className="flex flex-wrap gap-2">
        {REFERRAL_TIERS.map((tier) => {
          const reached = referralCount >= tier.threshold;
          return (
            <div
              key={tier.threshold}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono border tabular-nums"
              style={{
                borderColor: reached ? "var(--side-color)" : "rgba(255,255,255,0.12)",
                background: reached ? "color-mix(in srgb, var(--side-color) 12%, transparent)" : "transparent",
                color: reached ? "var(--side-color)" : "rgba(255,255,255,0.4)",
                boxShadow: reached ? "0 0 8px color-mix(in srgb, var(--side-color) 40%, transparent)" : "none",
              }}
            >
              {reached && <span>✓</span>}
              <span className="font-bold">{tier.threshold}</span>
              <span className="opacity-70">+{tier.reward.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
