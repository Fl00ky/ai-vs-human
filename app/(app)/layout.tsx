import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/nav/NavBar";
import { SideTheme } from "@/components/nav/SideTheme";
import { MatrixRain } from "@/components/matrix/MatrixRain";
import { PageTransition } from "@/components/PageTransition";
import type { Side } from "@/lib/utils";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  let { data: profile } = await supabase
    .from("profiles")
    .select("username, side, total_score")
    .eq("id", user.id)
    .single();

  // Profile missing — create it from auth metadata (handles interrupted signup)
  if (!profile) {
    const meta = user.user_metadata as { username?: string; side?: string };
    if (meta?.username && meta?.side) {
      await supabase.from("profiles").insert({
        id: user.id,
        username: meta.username,
        side: meta.side,
        total_score: 0,
      });
      const { data: fresh } = await supabase
        .from("profiles")
        .select("username, side, total_score")
        .eq("id", user.id)
        .single();
      profile = fresh;
    }
    if (!profile) redirect("/login");
  }

  const side = profile.side as Side;

  return (
    <>
      <SideTheme side={side} />
      <MatrixRain side={side} intensity={0.4} />
      <div className="relative z-10 min-h-screen flex flex-col">
        <NavBar username={profile.username} side={side} score={profile.total_score} />
        <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <PageTransition>{children}</PageTransition>
        </div>
        <footer className="border-t border-side/20 py-4 px-4 text-center text-[10px] text-fg/30 uppercase tracking-[0.3em]">
          [ end of transmission ]
        </footer>
      </div>
    </>
  );
}
