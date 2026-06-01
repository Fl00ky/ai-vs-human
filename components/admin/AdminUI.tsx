"use client";

// Internal single-admin tool — labels are hardcoded (Russian), not i18n.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Shield, Trash2, Plus, Search } from "lucide-react";
import { GlitchText } from "@/components/matrix/Terminal";
import { useToast } from "@/components/Toast";

export interface AdminBrief { id: string; title: string; category: string; published_at: string }
export interface AdminQuest { id: string; title: string; reward: number; side: string | null; active: boolean }
interface AdminUser { id: string; username: string; side: string; total_score: number; season_score: number; is_admin: boolean }

type Tab = "stats" | "briefs" | "quests" | "users";

export function AdminUI({
  stats, briefs, quests,
}: {
  stats: Record<string, number>;
  briefs: AdminBrief[];
  quests: AdminQuest[];
}) {
  const [tab, setTab] = useState<Tab>("stats");

  const tabs: { id: Tab; label: string }[] = [
    { id: "stats", label: "Статистика" },
    { id: "briefs", label: "Брифинг" },
    { id: "quests", label: "Задания" },
    { id: "users", label: "Пользователи" },
  ];

  return (
    <div className="space-y-8">
      <section>
        <div className="text-xs text-side/60 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
          <Shield size={14} /> ./admin
        </div>
        <GlitchText text="Админ-панель" as="h1" className="text-3xl sm:text-5xl" />
      </section>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((tt) => (
          <button key={tt.id} onClick={() => setTab(tt.id)}
            className={`px-4 py-2 text-xs uppercase tracking-widest border transition-all ${
              tab === tt.id ? "text-side border-side bg-side/10" : "text-fg/50 border-transparent hover:text-side"
            }`}>
            {tt.label}
          </button>
        ))}
      </div>

      {tab === "stats" && <Stats stats={stats} />}
      {tab === "briefs" && <Briefs briefs={briefs} />}
      {tab === "quests" && <Quests quests={quests} />}
      {tab === "users" && <UsersPanel />}
    </div>
  );
}

function Stats({ stats }: { stats: Record<string, number> }) {
  const items = [
    { k: "users", l: "Всего игроков" },
    { k: "ai", l: "Сторона ИИ" },
    { k: "human", l: "Сторона людей" },
    { k: "squads", l: "Отрядов" },
    { k: "briefs", l: "Брифов" },
    { k: "quests", l: "Заданий" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {items.map((it) => (
        <div key={it.k} className="terminal-box p-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-fg/50">{it.l}</div>
          <div className="font-display text-2xl sm:text-3xl text-side mt-1 tabular-nums">{stats[it.k] ?? 0}</div>
        </div>
      ))}
    </div>
  );
}

function Briefs({ briefs }: { briefs: AdminBrief[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("tip");

  const create = () => start(async () => {
    const res = await fetch("/api/admin/briefs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, category, url }),
    });
    if (!res.ok) { toast("Ошибка", "error"); return; }
    setTitle(""); setBody(""); setUrl("");
    toast("Бриф добавлен", "success"); router.refresh();
  });

  const remove = (id: string) => start(async () => {
    const res = await fetch(`/api/admin/briefs?id=${id}`, { method: "DELETE" });
    if (!res.ok) { toast("Ошибка", "error"); return; }
    toast("Удалено", "success"); router.refresh();
  });

  return (
    <div className="space-y-6">
      <div className="terminal-box p-5 space-y-2">
        <div className="text-xs uppercase tracking-[0.2em] text-side/70 mb-2 flex items-center gap-2"><Plus size={14} /> Новый бриф</div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Заголовок" className="input-matrix" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Текст" rows={3} className="input-matrix" />
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Ссылка (необязательно)" className="input-matrix" />
        <div className="flex gap-2 flex-wrap items-center">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-matrix max-w-[160px]">
            <option value="tip">совет</option>
            <option value="tool">инструмент</option>
            <option value="risk">риск</option>
            <option value="fact">факт</option>
            <option value="news">новость</option>
          </select>
          <button onClick={create} disabled={pending || title.length < 2 || body.length < 2} className="btn-matrix">Добавить</button>
        </div>
      </div>

      <div className="space-y-1.5">
        {briefs.map((b) => (
          <div key={b.id} className="flex items-center justify-between border-b border-side/10 pb-1.5 text-sm">
            <span className="flex items-center gap-2">
              <span className="text-[10px] text-side/60 uppercase">{b.category}</span>
              <span className="text-fg/80">{b.title}</span>
            </span>
            <button onClick={() => remove(b.id)} disabled={pending} className="text-fg/30 hover:text-ai-red"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Quests({ quests }: { quests: AdminQuest[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState(200);
  const [side, setSide] = useState("");

  const create = () => start(async () => {
    const res = await fetch("/api/admin/quests", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, reward, side: side || null }),
    });
    if (!res.ok) { toast("Ошибка", "error"); return; }
    setTitle(""); setDescription("");
    toast("Задание добавлено", "success"); router.refresh();
  });

  const toggle = (id: string, active: boolean) => start(async () => {
    const res = await fetch("/api/admin/quests", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !active }),
    });
    if (!res.ok) { toast("Ошибка", "error"); return; }
    router.refresh();
  });

  return (
    <div className="space-y-6">
      <div className="terminal-box p-5 space-y-2">
        <div className="text-xs uppercase tracking-[0.2em] text-side/70 mb-2 flex items-center gap-2"><Plus size={14} /> Новое задание</div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название" className="input-matrix" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание" rows={2} className="input-matrix" />
        <div className="flex gap-2 flex-wrap items-center">
          <input type="number" value={reward} onChange={(e) => setReward(Number(e.target.value))} placeholder="Награда" className="input-matrix max-w-[120px]" />
          <select value={side} onChange={(e) => setSide(e.target.value)} className="input-matrix max-w-[160px]">
            <option value="">обе стороны</option>
            <option value="ai">только ИИ</option>
            <option value="human">только люди</option>
          </select>
          <button onClick={create} disabled={pending || title.length < 2} className="btn-matrix">Добавить</button>
        </div>
      </div>

      <div className="space-y-1.5">
        {quests.map((q) => (
          <div key={q.id} className="flex items-center justify-between border-b border-side/10 pb-1.5 text-sm">
            <span className="flex items-center gap-2">
              <span className="text-side/70 tabular-nums">+{q.reward}</span>
              <span className="text-fg/80">{q.title}</span>
              {q.side && <span className="text-[10px] text-fg/40 uppercase">{q.side}</span>}
            </span>
            <button onClick={() => toggle(q.id, q.active)} disabled={pending}
              className={`text-xs px-2 py-0.5 border ${q.active ? "text-matrix-green border-matrix-green/50" : "text-fg/40 border-fg/20"}`}>
              {q.active ? "активно" : "выкл"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersPanel() {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);

  const search = () => start(async () => {
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast("Ошибка", "error"); return; }
    setUsers(data.users ?? []);
  });

  const adjust = (target: string, delta: number) => start(async () => {
    const res = await fetch("/api/admin/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, delta }),
    });
    if (!res.ok) { toast("Ошибка", "error"); return; }
    toast("Очки изменены", "success");
    setUsers((us) => us.map((u) => u.id === target ? { ...u, total_score: Math.max(0, u.total_score + delta) } : u));
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Поиск по нику" className="input-matrix flex-1" />
        <button onClick={search} disabled={pending} className="btn-matrix px-4 flex items-center gap-1.5"><Search size={14} /> Найти</button>
      </div>

      <div className="space-y-1.5">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between border-b border-side/10 pb-1.5 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: u.side === "ai" ? "var(--ai-red)" : "var(--human-blue)" }} />
              <span className="text-fg/80">{u.username}</span>
              {u.is_admin && <span className="text-[10px] text-side uppercase">admin</span>}
              <span className="text-side/70 tabular-nums">{u.total_score.toLocaleString()}</span>
            </span>
            <span className="flex items-center gap-1">
              <button onClick={() => adjust(u.id, -100)} disabled={pending} className="text-xs px-2 py-0.5 border border-ai-red/40 text-ai-red">-100</button>
              <button onClick={() => adjust(u.id, 100)} disabled={pending} className="text-xs px-2 py-0.5 border border-matrix-green/40 text-matrix-green">+100</button>
              <button onClick={() => adjust(u.id, 1000)} disabled={pending} className="text-xs px-2 py-0.5 border border-matrix-green/40 text-matrix-green">+1k</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
