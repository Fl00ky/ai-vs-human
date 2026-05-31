"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { LogOut, Trophy, Gamepad2, ListTodo, User, Home, Award } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { SIDE_META, type Side } from "@/lib/utils";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { SoundToggle } from "@/components/sound/SoundToggle";

interface NavBarProps {
  username: string;
  side: Side;
  score: number;
}

export function NavBar({ username, side, score }: NavBarProps) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const meta = SIDE_META[side];

  const links = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/games", label: "Games", icon: Gamepad2 },
    { href: "/quests", label: "Quests", icon: ListTodo },
    { href: "/achievements", label: "Badges", icon: Award },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/profile", label: "Profile", icon: User },
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

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-xs text-fg/50 leading-none">{meta.shortName}</span>
            <span className="text-side font-mono text-sm leading-tight">
              {username}
            </span>
          </div>
          <div className="hidden sm:block text-side font-display text-lg tabular-nums">
            <AnimatedCounter value={score} />
          </div>
          <form
            action={() => {
              startTransition(() => {
                logoutAction();
              });
            }}
          >
            <button
              type="submit"
              disabled={pending}
              aria-label="Sign out"
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
