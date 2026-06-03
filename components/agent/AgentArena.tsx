"use client";

import { useEffect, useRef } from "react";

// Self-contained neon auto-battler scene drawn on canvas. Cosmetic/visual only —
// the authoritative economy stays server-side. Pace scales with the agent's
// level/atk/rate so progression feels connected.

interface Props {
  sideColor: string;   // agent color
  enemyColor: string;  // enemy color
  level: number;
  atk: number;
  rate: number;
  enemyNames: string[];
}

interface Enemy { x: number; y: number; hp: number; max: number; boss: boolean; flash: number; name: string }
interface Proj { x: number; y: number; tx: number; ty: number; dmg: boolean }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; c: string }
interface DmgNum { x: number; y: number; v: number; life: number; val: number; crit: boolean }
interface Coin { x: number; y: number; t: number }

export function AgentArena({ sideColor, enemyColor, level, atk, rate, enemyNames }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // mutable game refs so we never re-render per frame
  const ref = useRef({ level, atk, rate, sideColor, enemyColor, enemyNames });
  ref.current = { level, atk, rate, sideColor, enemyColor, enemyNames };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = (canvas.width = canvas.clientWidth);
    let H = (canvas.height = 240);
    const onResize = () => { W = canvas.width = canvas.clientWidth; };
    window.addEventListener("resize", onResize);

    const enemies: Enemy[] = [];
    const projs: Proj[] = [];
    const parts: Particle[] = [];
    const dmgs: DmgNum[] = [];
    const coins: Coin[] = [];
    let kills = 0;
    let bossActive = false;
    let lastFire = 0;
    let last = performance.now();
    let raf = 0;

    const groundY = () => H - 46;
    const agentX = 64;

    const spawnEnemy = () => {
      const lvl = ref.current.level;
      const boss = !bossActive && kills > 0 && kills % 12 === 0 && !enemies.some((e) => e.boss);
      const max = boss ? 40 + lvl * 8 : 8 + lvl * 1.5;
      if (boss) bossActive = true;
      const names = ref.current.enemyNames;
      enemies.push({
        x: W + 30, y: groundY() - (boss ? 18 : 6 + Math.random() * 10),
        hp: max, max, boss, flash: 0,
        name: names[Math.floor(Math.random() * names.length)],
      });
    };

    const fire = () => {
      const target = enemies[0];
      if (!target) return;
      projs.push({ x: agentX + 22, y: groundY() - 14, tx: target.x, ty: target.y, dmg: false });
    };

    const draw = (now: number) => {
      const dt = Math.min(50, now - last); last = now;
      const { sideColor: AC, enemyColor: EC, atk: ATK, rate: RATE } = ref.current;

      // background
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, W, H);
      // faint vertical grid
      ctx.strokeStyle = "rgba(0,255,65,0.06)";
      ctx.lineWidth = 1;
      for (let x = (now / 40) % 40; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      // ground glow line
      ctx.strokeStyle = `${AC}55`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, groundY() + 18); ctx.lineTo(W, groundY() + 18); ctx.stroke();

      // spawn logic
      if (enemies.length < (bossActive ? 1 : 5) && Math.random() < 0.04) spawnEnemy();

      // fire logic — rate scales fire cadence
      const fireInterval = Math.max(180, 700 - ref.current.level * 4);
      if (now - lastFire > fireInterval && enemies.length) { fire(); lastFire = now; }

      // ---- agent (drawn humanoid) ----
      const bob = Math.sin(now / 300) * 2;
      ctx.save();
      ctx.shadowColor = AC; ctx.shadowBlur = 14;
      ctx.strokeStyle = AC; ctx.fillStyle = AC; ctx.lineWidth = 3;
      const ax = agentX, ay = groundY() + bob;
      // head
      ctx.beginPath(); ctx.arc(ax, ay - 30, 7, 0, Math.PI * 2); ctx.stroke();
      // body
      ctx.beginPath(); ctx.moveTo(ax, ay - 23); ctx.lineTo(ax, ay - 4); ctx.stroke();
      // legs
      ctx.beginPath(); ctx.moveTo(ax, ay - 4); ctx.lineTo(ax - 7, ay + 8); ctx.moveTo(ax, ay - 4); ctx.lineTo(ax + 7, ay + 8); ctx.stroke();
      // gun arm
      ctx.beginPath(); ctx.moveTo(ax, ay - 18); ctx.lineTo(ax + 24, ay - 14); ctx.stroke();
      // muzzle flash
      if (now - lastFire < 70) {
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(ax + 26, ay - 14, 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

      // ---- projectiles ----
      for (let i = projs.length - 1; i >= 0; i--) {
        const p = projs[i];
        const dx = p.tx - p.x, dy = p.ty - p.y;
        const d = Math.hypot(dx, dy) || 1;
        const sp = 0.9 * dt;
        p.x += (dx / d) * sp; p.y += (dy / d) * sp;
        ctx.save(); ctx.shadowColor = AC; ctx.shadowBlur = 10; ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        // hit
        const tgt = enemies[0];
        if (tgt && Math.hypot(tgt.x - p.x, tgt.y - p.y) < 16) {
          const crit = Math.random() < 0.15;
          const dmg = Math.max(1, Math.round((ATK / 12) * (crit ? 2 : 1) * (0.8 + Math.random() * 0.4)));
          tgt.hp -= dmg; tgt.flash = 1;
          dmgs.push({ x: tgt.x, y: tgt.y - 18, v: -0.04 * dt, life: 1, val: dmg, crit });
          projs.splice(i, 1);
          if (tgt.hp <= 0) {
            // death burst
            for (let k = 0; k < (tgt.boss ? 24 : 10); k++) {
              const ang = Math.random() * Math.PI * 2, s = 0.05 + Math.random() * 0.15;
              parts.push({ x: tgt.x, y: tgt.y, vx: Math.cos(ang) * s, vy: Math.sin(ang) * s, life: 1, c: EC });
            }
            coins.push({ x: tgt.x, y: tgt.y, t: 0 });
            if (tgt.boss) bossActive = false;
            enemies.shift();
            kills++;
          }
        } else if (p.x > W + 40 || p.x < -40) {
          projs.splice(i, 1);
        }
      }

      // ---- enemies ----
      const meleeX = agentX + 70;
      for (const e of enemies) {
        if (e.x > meleeX) e.x -= (e.boss ? 0.012 : 0.02) * dt;
        if (e.flash > 0) e.flash -= 0.06;
        ctx.save();
        ctx.shadowColor = EC; ctx.shadowBlur = e.boss ? 22 : 12;
        ctx.fillStyle = e.flash > 0 ? "#fff" : EC;
        const sz = e.boss ? 22 : 11;
        // diamond
        ctx.beginPath();
        ctx.moveTo(e.x, e.y - sz); ctx.lineTo(e.x + sz, e.y);
        ctx.lineTo(e.x, e.y + sz); ctx.lineTo(e.x - sz, e.y); ctx.closePath();
        ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
        ctx.restore();
        // hp bar
        const bw = e.boss ? 40 : 22;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(e.x - bw / 2, e.y - sz - 9, bw, 3);
        ctx.fillStyle = EC;
        ctx.fillRect(e.x - bw / 2, e.y - sz - 9, bw * Math.max(0, e.hp / e.max), 3);
      }

      // boss banner HP at top
      const boss = enemies.find((e) => e.boss);
      if (boss) {
        ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(W / 2 - 90, 10, 180, 8);
        ctx.fillStyle = EC; ctx.shadowColor = EC; ctx.shadowBlur = 8;
        ctx.fillRect(W / 2 - 90, 10, 180 * Math.max(0, boss.hp / boss.max), 8); ctx.shadowBlur = 0;
        ctx.fillStyle = EC; ctx.font = "700 9px monospace"; ctx.textAlign = "center";
        ctx.fillText(`BOSS · ${boss.name}`, W / 2, 30);
      }

      // ---- particles ----
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.0008 * dt; p.life -= 0.02 * dt * 0.06;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, 2.5, 2.5); ctx.globalAlpha = 1;
      }

      // ---- damage numbers ----
      ctx.textAlign = "center";
      for (let i = dmgs.length - 1; i >= 0; i--) {
        const d = dmgs[i];
        d.y += d.v * dt; d.life -= 0.02 * dt * 0.06;
        if (d.life <= 0) { dmgs.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, d.life);
        ctx.fillStyle = d.crit ? "#ffaa00" : "#fff";
        ctx.font = `700 ${d.crit ? 16 : 12}px monospace`;
        ctx.fillText(String(d.val), d.x, d.y); ctx.globalAlpha = 1;
      }

      // ---- coins flying to counter (top-left) ----
      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i]; c.t += 0.02 * dt * 0.06;
        if (c.t >= 1) { coins.splice(i, 1); continue; }
        const cx = c.x + (12 - c.x) * c.t, cy = c.y + (12 - c.y) * c.t;
        ctx.fillStyle = "#00ff41"; ctx.shadowColor = "#00ff41"; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded"
      style={{ height: 240, display: "block" }}
      aria-label="combat"
    />
  );
}
