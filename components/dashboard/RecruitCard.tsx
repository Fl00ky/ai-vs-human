"use client";

import { useState } from "react";
import { Copy, Check, Share2, UserPlus } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import { useToast } from "@/components/Toast";
import { RecruitTiers } from "@/components/dashboard/RecruitTiers";

export function RecruitCard({
  referralCode,
  username,
  referralCount,
  pending,
}: {
  referralCode: string | null;
  username: string;
  referralCount: number;
  pending: number;
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!referralCode) return null;

  // Share the public profile card (rich OG preview). Its CTA carries the
  // owner's referral code, so a signup from it credits the recruiter.
  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/u/${encodeURIComponent(username)}`
      : `/u/${encodeURIComponent(username)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast(t.dashboard.copied, "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Copy failed", "error");
    }
  };

  const share = async () => {
    const text = `${t.dashboard.shareText} ${link}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "AI vs Human", text: t.dashboard.shareText, url: link });
      } catch {
        /* user cancelled */
      }
    } else {
      copy();
    }
  };

  return (
    <section className="terminal-box p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-2">
        <UserPlus size={16} className="text-side" />
        <span className="text-xs uppercase tracking-[0.2em] text-side/70">{t.dashboard.recruit}</span>
      </div>
      <p className="text-sm text-fg/70 mb-4">{t.dashboard.recruitDesc}</p>

      <div className="text-[10px] uppercase tracking-[0.25em] text-fg/40 mb-1.5">
        {t.dashboard.inviteLink}
      </div>
      <div className="flex gap-2 flex-wrap">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="input-matrix flex-1 min-w-[180px] text-xs sm:text-sm"
          style={{ color: "var(--side-color)", borderColor: "color-mix(in srgb, var(--side-color) 50%, transparent)" }}
        />
        <button onClick={copy} className="btn-matrix px-4 flex items-center gap-1.5 shrink-0">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? t.dashboard.copied : t.dashboard.copy}
        </button>
        <button onClick={share} className="btn-matrix px-4 flex items-center gap-1.5 shrink-0">
          <Share2 size={14} /> {t.dashboard.share}
        </button>
      </div>

      <RecruitTiers referralCount={referralCount} pending={pending} />
    </section>
  );
}
