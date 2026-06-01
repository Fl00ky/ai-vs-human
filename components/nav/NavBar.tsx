"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { LogOut, Trophy, Gamepad2, ListTodo, User, Home, Award, Users, GraduationCap, Newspaper, Shield } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { type Side } from "@/lib/utils";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { SoundToggle } from "@/components/sound/SoundToggle";
import { LanguageSwitcher, useLanguage } from "@/lib/i18n/context";
import { getRank } from "@/lib/ranks";

interface NavBarProps {
  username: string;
  side: Side;
  score: number;
  isAdmin?: boolean;
}

export function NavBar({ username, side, score, isAdmin }: NavBarProps) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const { t } = useLanguage();
  const rank = getRank(score);

  const links = [
    { href: "/dashboard",    label: t.nav.home,         icon: Home },
    { href: "/games",        label: t.nav.games,        icon: Gamepad2 },
    { href: "/learn",        label: t.learn.nav,        icon: GraduationCap },
    { href: "/briefing",     label: t.briefing.nav,     icon: Newspaper },
    { href: "/quests",       label: t.nav.quests,       icon: ListTodo },
    { href: "/squads",       label: t.squads.nav,       icon: Users },
    { href: "/achievements", label: t.nav.badges,       icon: Award },
    { href: "/leaderboard",  label: t.nav.leaderboard,  icon: Trophy },
    { href: "/profile",      label: t.nav.profile,      icon: User },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-40 backdrop-blur-md bg-black/70 border-b border-side/30"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
        <Link href="/dashboard" className="font-display text-side text-lg tracking-[0.2em] hover:opacity-80">
          //aivshuman
        </Link>

        <ul className="hidden md:flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition-all ${
                    active
                      ? "text-side border border-side/50 bg-side/10"
                      : "text-fg/60 hover:text-side hover:bg-side/5 border border-transparent"
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <div className="hidden sm:flex flex-col items-end text-right ml-1">
            <span className="text-[10px] uppercase tracking-wider text-side/70 leading-none">
              {t.ranks[rank.key]}
            </span>
            <span className="text-side font-mono text-sm leading-tight">{username}</span>
            {/* Rank progress bar */}
            <span className="block w-20 h-0.5 mt-0.5 rounded-full bg-fg/15 overflow-hidden">
              <span
                className="block h-full bg-side"
                style={{ width: `${Math.round(rank.progress * 100)}%`, boxShadow: "0 0 6px var(--side-color)" }}
              />
            </span>
          </div>
          <div className="hidden sm:block text-side font-display text-lg tabular-nums">
            <AnimatedCounter value={score} />
          </div>
          <form
            action={() => {
              startTransition(() => { logoutAction(); });
            }}
          >
            <button
              type="submit"
              disabled={pending}
              aria-label={t.nav.signOut}
              className="text-fg/40 hover:text-ai-red transition-colors p-1.5"
            >
              <LogOut size={16} />
            </button>
          </form>
          <SoundToggle />
        </div>
      </div>

      {/* Mobile nav */}
      <ul className="md:hidden flex overflow-x-auto gap-1 px-4 pb-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider whitespace-nowrap ${
                  active ? "text-side" : "text-fg/50"
                }`}
              >
                <Icon size={12} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </motion.nav>
  );
}
