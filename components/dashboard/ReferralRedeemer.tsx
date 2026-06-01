"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { useToast } from "@/components/Toast";

/**
 * Invisible. On first dashboard mount, if a referral code was captured on the
 * landing page (sessionStorage "ref_code"), redeem it once. Runs only when the
 * user has no referrer yet (server passes alreadyReferred).
 */
export function ReferralRedeemer({ alreadyReferred }: { alreadyReferred: boolean }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || alreadyReferred) return;
    const code = sessionStorage.getItem("ref_code");
    if (!code) return;
    fired.current = true;

    (async () => {
      const res = await fetch("/api/referral/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      sessionStorage.removeItem("ref_code");
      if (res.ok) {
        toast(t.dashboard.referralWelcome, "success");
        router.refresh();
      }
    })();
  }, [alreadyReferred, router, t]);

  return null;
}
