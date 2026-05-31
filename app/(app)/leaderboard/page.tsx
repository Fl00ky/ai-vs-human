import { createClient } from "@/lib/supabase/server";
import { GlitchText } from "@/components/matrix/Terminal";
import { LiveTeamProgress } from "@/components/leaderboard/LiveTeamProgress";
import { UserList } from "@/components/leaderboard/UserList";
import type { TeamScore, LeaderboardEntry } from "@/lib/types/database";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: teamScores }, { data: entries }] = await Promise.all([
    supabase.from("team_score_view").select("*"),
    supabase
      .from("leaderboard_view")
      .select("*")
      .order("rank", { ascending: true })
      .limit(50),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <div className="text-xs text-side/60 uppercase tracking-[0.3em] mb-2">./leaderboard</div>
        <GlitchText text="The War Board" as="h1" className="text-3xl sm:text-5xl" />
        <p className="text-fg/60 mt-2">Live standings. Updates in real time.</p>
      </section>

      <section className="terminal-box p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-side/70 mb-4">[ team war ]</div>
        <LiveTeamProgress initial={(teamScores as TeamScore[] | null) ?? []} />
      </section>

      <section className="terminal-box p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-side/70 mb-4">[ top operatives ]</div>

        {/* Ticker strip — top 5 scrolling marquee */}
        {entries && entries.length > 0 && (
          <div className="mb-4 overflow-hidden border-y border-side/20 py-2 bg-black/40">
            <div className="ticker-track">
              {/* Duplicate the top 5 twice for seamless loop */}
              {[...entries.slice(0, 5), ...entries.slice(0, 5)].map((e, i) => (
                <span
                  key={`${e.id}-${i}`}
                  className="inline-flex items-center gap-2 text-xs font-mono"
                >
                  <span className="text-fg/40">#{e.rank}</span>
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: e.side === "ai" ? "var(--ai-red)" : "var(--human-blue)",
                    }}
                  />
                  <span className="text-fg/80">{e.username}</span>
                  <span
                    className="text-side tabular-nums"
                    style={{
                      color: e.side === "ai" ? "var(--ai-red)" : "var(--human-blue)",
                    }}
                  >
                    {e.total_score.toLocaleString()}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        <UserList
          initial={(entries as LeaderboardEntry[] | null) ?? []}
          currentUserId={user?.id}
        />
      </section>
    </div>
  );
}
