"use client";

import Link from "next/link";
import { Gamepad2, ListTodo, Trophy, ArrowRight, Newspaper, type LucideIcon } from "lucide-react";
import { GlitchText } from "@/components/matrix/Terminal";
import { LiveTeamProgress } from "@/components/leaderboard/LiveTeamProgress";
import { ActivityFeed, type FeedEvent } from "@/components/ActivityFeed";
import { MotionGrid, MotionGridItem } from "@/components/MotionGrid";
import { DailyReward } from "@/components/dashboard/DailyReward";
import { SeasonWar, type SeasonState } from "@/components/dashboard/SeasonWar";
import { RecruitCard } from "@/components/dashboard/RecruitCard";
import { ReferralRedeemer } from "@/components/dashboard/ReferralRedeemer";
import { Nudges } from "@/components/dashboard/Nudges";
import { Milestones } from "@/components/dashboard/Milestones";
import { WarEvent, type WarEventState } from "@/components/dashboard/WarEvent";
import { useLanguage } from "@/lib/i18n/context";
import { SIDE_META, formatScore, type Side } from "@/lib/utils";
import type { TeamScore } from "@/lib/types/database";

interface Props {
  profile: {
    username: string;
    side: string;
    total_score: number;
    current_streak?: number;
    longest_streak?: number;
    last_checkin?: string | null;
    referral_code?: string | null;
    referred_by?: string | null;
    referral_count?: number;
  } | null;
  teamScores: TeamScore[];
  recentGames: { id: string; game: string; score: number }[];
  feed: FeedEvent[];
  season: SeasonState | null;
  globalRank: number | null;
  distinctGames: number;
  pendingReferrals: number;
  topBrief: { title: string; category: string } | null;
  warEvent: WarEventState | null;
}

export function DashboardUI({ profile, teamScores, recentGames, feed, season, globalRank, distinctGames, pendingReferrals, topBrief, warEvent }: Props) {
  const { t } = useLanguage();
  const side = (profile?.side ?? "human") as Side;
  const meta = SIDE_META[side];

  return (
    <div className="space-y-8">
      <section>
        <div className="text-xs text-side/60 uppercase tracking-[0.3em] mb-2">{t.dashboard.path}</div>
        <GlitchText text={`${meta.greeting}, ${profile?.username ?? "agent"}`} as="h1" className="text-3xl sm:text-5xl" />
        <p className="text-fg/60 mt-2 italic">{meta.motto}</p>
      </section>

      <ReferralRedeemer alreadyReferred={!!profile?.referred_by} />

      {warEvent && <WarEvent event={warEvent} />}

      <Nudges
        side={side}
        lastCheckin={profile?.last_checkin ?? null}
        currentStreak={profile?.current_streak ?? 0}
        season={season}
      />

      {topBrief && (
        <Link href="/briefing"
          className="flex items-center gap-3 px-4 py-3 rounded-lg bg-black/60 border border-side/25 hover:border-side transition-all">
          <Newspaper size={16} className="text-side shrink-0" />
          <span className="text-[10px] uppercase tracking-[0.25em] text-side/60 shrink-0">{t.briefing.today}</span>
          <span className="text-sm text-fg/85 truncate flex-1">{topBrief.title}</span>
          <ArrowRight size={14} className="text-side/60 shrink-0" />
        </Link>
      )}

      <DailyReward
        currentStreak={profile?.current_streak ?? 0}
        longestStreak={profile?.longest_streak ?? 0}
        lastCheckin={profile?.last_checkin ?? null}
      />

      {season && <SeasonWar season={season} />}

      <Milestones
        totalScore={profile?.total_score ?? 0}
        globalRank={globalRank}
        distinctGames={distinctGames}
      />

      <RecruitCard
        referralCode={profile?.referral_code ?? null}
        username={profile?.username ?? ""}
        referralCount={profile?.referral_count ?? 0}
        pending={pendingReferrals}
      />

      <section className="terminal-box p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-[0.2em] text-side/70">{t.dashboard.theWar}</span>
          <Link href="/leaderboard" className="text-xs text-side hover:underline flex items-center gap-1">
            {t.dashboard.fullBoard} <ArrowRight size={12} />
          </Link>
        </div>
        <LiveTeamProgress initial={teamScores} />
      </section>

      <MotionGrid className="grid sm:grid-cols-3 gap-4">
        <MotionGridItem>
          <StatCard label={t.dashboard.yourScore} value={formatScore(profile?.total_score ?? 0)} />
        </MotionGridItem>
        <MotionGridItem>
          <StatCard label={t.dashboard.side} value={meta.shortName} />
        </MotionGridItem>
        <MotionGridItem>
          <StatCard label={t.dashboard.gamesPlayed} value={String(recentGames.length)} />
        </MotionGridItem>
      </MotionGrid>

      <MotionGrid className="grid sm:grid-cols-3 gap-4">
        <MotionGridItem>
          <ActionCard href="/games" title={t.dashboard.playGames} description={t.dashboard.playGamesDesc} icon={Gamepad2} />
        </MotionGridItem>
        <MotionGridItem>
          <ActionCard href="/quests" title={t.dashboard.viewQuests} description={t.dashboard.viewQuestsDesc} icon={ListTodo} />
        </MotionGridItem>
        <MotionGridItem>
          <ActionCard href="/leaderboard" title={t.dashboard.viewLeaderboard} description={t.dashboard.viewLeaderboardDesc} icon={Trophy} />
        </MotionGridItem>
      </MotionGrid>

      <section className="terminal-box p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-[0.2em] text-side/70">{t.dashboard.liveActivity}</span>
          <span className="text-[10px] text-side/40 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-matrix-green animate-pulse" />
            {t.dashboard.realtime}
          </span>
        </div>
        <ActivityFeed initial={feed} />
      </section>

      {recentGames.length > 0 && (
        <section className="terminal-box p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-side/70 mb-3">{t.dashboard.yourRecentRuns}</div>
          <ul className="space-y-1.5 text-sm font-mono">
            {recentGames.map((g) => (
              <li key={g.id} className="flex items-center justify-between border-b border-side/10 pb-1.5">
                <span className="text-fg/70">&gt; {g.game.replace("_", " ")}</span>
                <span className="text-side tabular-nums">+{formatScore(g.score)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="terminal-box p-4">
      <div className="text-[10px] uppercase tracking-[0.25em] text-fg/50">{label}</div>
      <div className="font-display text-2xl text-side mt-1 tabular-nums">{value}</div>
    </div>
  );
}

function ActionCard({ href, title, description, icon: Icon }: {
  href: string; title: string; description: string;
  icon: LucideIcon;
}) {
  return (
    <Link href={href} className="terminal-box card-shimmer p-5 group hover:border-side transition-all hover:-translate-y-1 block h-full">
      <Icon size={28} className="text-side mb-3" />
      <div className="font-display text-lg text-side uppercase tracking-wider">{title}</div>
      <p className="text-xs text-fg/60 mt-1">{description}</p>
    </Link>
  );
}
