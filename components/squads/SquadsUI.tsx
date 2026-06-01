"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Crown, LogOut, Plus, Copy, Check, UserMinus } from "lucide-react";
import { GlitchText } from "@/components/matrix/Terminal";
import { useLanguage } from "@/lib/i18n/context";
import { useToast } from "@/components/Toast";
import type { Side } from "@/lib/utils";

export interface SquadRow {
  id: string;
  name: string;
  tag: string;
  side: Side;
  leader_id: string | null;
  member_cap: number;
  members: number;
  score: number;
  rank: number;
}
export interface Member {
  id: string;
  username: string;
  side: Side;
  season_score: number;
}

interface Props {
  myId: string;
  mySide: Side;
  mySquad: SquadRow | null;
  members: Member[];
  board: SquadRow[];
}

export function SquadsUI({ myId, mySide, mySquad, members, board }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [joinTag, setJoinTag] = useState("");
  const [copied, setCopied] = useState(false);

  // Prefill the join tag from an invite link (?join=TAG).
  useEffect(() => {
    if (mySquad) return;
    const tag = new URLSearchParams(window.location.search).get("join");
    if (tag) setJoinTag(tag.toUpperCase().slice(0, 5));
  }, [mySquad]);

  const errMsg = (code: string) =>
    (t.squads.errors as Record<string, string>)[code] ?? code;

  const call = (body: object, ok: string) =>
    startTransition(async () => {
      const res = await fetch("/api/squads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast(errMsg(data.error), "error"); return; }
      toast(ok, "success");
      router.refresh();
    });

  const sideColor = (s: Side) => (s === "ai" ? "#ff003c" : "#00d4ff");

  const inviteLink =
    typeof window !== "undefined" && mySquad
      ? `${window.location.origin}/squads?join=${mySquad.tag}`
      : "";

  const copyInvite = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast(t.squads.copied, "success");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <section>
        <div className="text-xs text-side/60 uppercase tracking-[0.3em] mb-2">{t.squads.path}</div>
        <GlitchText text={t.squads.title} as="h1" className="text-3xl sm:text-5xl" />
        <p className="text-fg/60 mt-2">{t.squads.subtitle}</p>
      </section>

      {/* My squad OR create/join */}
      {mySquad ? (
        <section className="terminal-box p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-side/70">{t.squads.yourSquad}</span>
            <button
              onClick={() => call({ action: "leave" }, t.squads.left)}
              disabled={pending}
              className="text-xs text-fg/40 hover:text-ai-red flex items-center gap-1"
            >
              <LogOut size={12} /> {t.squads.leave}
            </button>
          </div>

          <div className="flex items-center gap-4 flex-wrap mb-5">
            <div
              className="font-display text-2xl px-3 py-1 border tabular-nums"
              style={{ color: sideColor(mySquad.side), borderColor: sideColor(mySquad.side) }}
            >
              [{mySquad.tag}]
            </div>
            <div className="font-display text-2xl text-side uppercase tracking-wider">{mySquad.name}</div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-5">
            <Stat label={t.squads.rank} value={`#${mySquad.rank}`} />
            <Stat label={t.squads.score} value={mySquad.score.toLocaleString()} />
            <Stat label={t.squads.members} value={`${mySquad.members}/${mySquad.member_cap ?? 30}`} />
          </div>

          {/* Invite */}
          <div className="flex gap-2 mb-5 flex-wrap">
            <input readOnly value={inviteLink} onFocus={(e) => e.currentTarget.select()}
              className="input-matrix flex-1 min-w-[180px] text-xs" />
            <button onClick={copyInvite} className="btn-matrix px-4 flex items-center gap-1.5 shrink-0">
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? t.squads.copied : t.squads.copy}
            </button>
          </div>

          {/* Roster */}
          <div className="space-y-1.5">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between border-b border-side/10 pb-1.5 text-sm font-mono">
                <span className="flex items-center gap-2 text-fg/80">
                  {mySquad.leader_id === m.id && <Crown size={13} className="text-side" />}
                  {m.username}
                  {m.id === myId && <span className="text-[10px] text-fg/40">(you)</span>}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-side tabular-nums">{m.season_score.toLocaleString()}</span>
                  {mySquad.leader_id === myId && m.id !== myId && (
                    <button
                      onClick={() => call({ action: "kick", target: m.id }, t.squads.kick)}
                      className="text-fg/30 hover:text-ai-red"
                      aria-label={t.squads.kick}
                    >
                      <UserMinus size={13} />
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="grid sm:grid-cols-2 gap-4">
          {/* Create */}
          <div className="terminal-box p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-side/70 mb-4 flex items-center gap-2">
              <Plus size={14} /> {t.squads.create}
            </div>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24}
              placeholder={t.squads.namePlaceholder} className="input-matrix mb-2" />
            <input value={tag} onChange={(e) => setTag(e.target.value.toUpperCase().slice(0, 5))} maxLength={5}
              placeholder={t.squads.tagPlaceholder} className="input-matrix mb-1 uppercase tracking-[0.3em]" />
            <div className="text-[10px] text-fg/40 mb-3">{t.squads.tagHint}</div>
            <button
              onClick={() => call({ action: "create", name, tag }, t.squads.created)}
              disabled={pending || name.length < 3 || tag.length < 2}
              className="btn-matrix w-full justify-center"
            >
              {t.squads.create_}
            </button>
          </div>

          {/* Join */}
          <div className="terminal-box p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-side/70 mb-4 flex items-center gap-2">
              <Users size={14} /> {t.squads.joinByTag}
            </div>
            <input value={joinTag} onChange={(e) => setJoinTag(e.target.value.toUpperCase().slice(0, 5))} maxLength={5}
              placeholder={t.squads.tagPlaceholder} className="input-matrix mb-3 uppercase tracking-[0.3em]" />
            <button
              onClick={() => call({ action: "join", tag: joinTag }, t.squads.joined)}
              disabled={pending || joinTag.length < 2}
              className="btn-matrix w-full justify-center"
            >
              {t.squads.join}
            </button>
          </div>
        </section>
      )}

      {/* Squad leaderboard */}
      <section className="terminal-box p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-side/70 mb-4">{t.squads.leaderboard}</div>
        <div className="space-y-1.5">
          {board.map((s) => (
            <div
              key={s.id}
              className={`flex items-center justify-between px-3 py-2 text-sm font-mono border-b border-side/10 ${
                mySquad?.id === s.id ? "bg-side/10" : ""
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="text-fg/40 tabular-nums w-8">#{s.rank}</span>
                <span className="font-bold tabular-nums" style={{ color: sideColor(s.side) }}>[{s.tag}]</span>
                <span className="text-fg/80">{s.name}</span>
                <span className="text-[10px] text-fg/40">{s.members} {t.squads.members}</span>
              </span>
              <span className="tabular-nums" style={{ color: sideColor(s.side) }}>{s.score.toLocaleString()}</span>
            </div>
          ))}
          {board.length === 0 && <div className="text-fg/40 text-sm">{t.squads.noSquad}</div>}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="terminal-box p-4 text-center">
      <div className="text-[10px] uppercase tracking-[0.2em] text-fg/50">{label}</div>
      <div className="font-display text-xl sm:text-2xl text-side mt-1 tabular-nums">{value}</div>
    </div>
  );
}
