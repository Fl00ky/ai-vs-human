"use client";

import { useEffect } from "react";
import type { Side } from "@/lib/utils";

export function SideTheme({ side }: { side: Side }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-side", side);
    return () => {
      document.documentElement.removeAttribute("data-side");
    };
  }, [side]);
  return null;
}
