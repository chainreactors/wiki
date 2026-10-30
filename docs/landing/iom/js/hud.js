/* Operations Control — HUD: a 2D canvas over the WebGL scene for labels,
   readouts and small panels. All content is simulated demo data. */
(function () {
  'use strict';
  const OC = window.OC;
  const { clamp, smooth, fract, hash } = OC.M;
  const F = OC.fleet;
  const MONO = '"JetBrains Mono","SF Mono","SFMono-Regular","Cascadia Mono",Menlo,Consolas,"Liberation Mono","Noto Sans Mono CJK SC",monospace';
  const SANS = '"PingFang SC","HarmonyOS Sans SC","Noto Sans CJK SC","Source Han Sans SC","Microsoft YaHei",system-ui,sans-serif';
  const RED = '255,42,42';
  const PROGS = F.PROGRAMS;

  function HUD(canvas, world) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.world = world;
    this.w = 1; this.h = 1; this.dpr = 1;
    this.p = [0, 0, 0, 0];
    this.q = [0, 0, 0, 0];
    this.heroCycle = -1;
    this.heroPick = -1;
    this.hasLS = 'letterSpacing' in this.ctx;
    this.anchor = null; // where the detail card's leader line lands (set by the page)
  }

  HUD.prototype.resize = function (w, h, dpr) {
    this.w = w; this.h = h; this.dpr = dpr;
    this.c.width = Math.max(1, Math.round(w * dpr));
    this.c.height = Math.max(1, Math.round(h * dpr));
  };

  /* ------------------------------------------------------------------ primitives */
  HUD.prototype.font = function (size, weight, fam, spacing) {
    this.ctx.font = (weight || 400) + ' ' + size + 'px ' + (fam || MONO);
    if (this.hasLS) this.ctx.letterSpacing = spacing || '0px';
  };
  HUD.prototype.text = function (s, x, y, rgba, align) {
    const c = this.ctx;
    c.textAlign = align || 'left';
    c.fillStyle = rgba;
    c.fillText(s, x, y);
  };
  HUD.prototype.brackets = function (x, y, r, a) {
    const c = this.ctx, k = r * 0.5;
    c.strokeStyle = `rgba(${RED},${a})`;
    c.beginPath();
    c.moveTo(x - r, y - r + k); c.lineTo(x - r, y - r); c.lineTo(x - r + k, y - r);
    c.moveTo(x + r - k, y - r); c.lineTo(x + r, y - r); c.lineTo(x + r, y - r + k);
    c.moveTo(x + r, y + r - k); c.lineTo(x + r, y + r); c.lineTo(x + r - k, y + r);
    c.moveTo(x - r + k, y + r); c.lineTo(x - r, y + r); c.lineTo(x - r, y + r - k);
    c.stroke();
  };
  // leader-line label anchored at (x, y)
  HUD.prototype.tag = function (x, y, title, sub, a, dir, rise) {
    const c = this.ctx;
    dir = dir || 1;
    rise = rise == null ? 30 : rise;
    this.brackets(x, y, 7, a);
    this.font(12, 500);
    const tw = c.measureText(title).width;
    this.font(11, 400);
    const sw = sub ? c.measureText(sub).width : 0;
    const len = Math.max(tw, sw) + 18;
    if (dir > 0 && x + 26 + len > this.w - 8) dir = -1;
    else if (dir < 0 && x - 26 - len < 8) dir = 1;
    const ex = x + dir * 26, ey = y - rise;
    c.strokeStyle = `rgba(${RED},${0.75 * a})`;
    c.beginPath();
    c.moveTo(x + dir * 7, y - 7);
    c.lineTo(ex, ey);
    c.lineTo(ex + dir * len, ey);
    c.stroke();
    const tx = dir > 0 ? ex + 8 : ex - len + 8;
    c.fillStyle = `rgba(3,3,3,${0.6 * a})`;
    c.fillRect(tx - 6, ey - 20, len - 4, sub ? 40 : 22);
    this.font(12, 500);
    this.text(title, tx, ey - 6, `rgba(242,242,242,${a})`);
    if (sub) {
      this.font(11, 400);
      this.text(sub, tx, ey + 15, `rgba(150,150,150,${a})`);
    }
  };
  HUD.prototype.panel = function (x, y, w, h, title, a) {
    const c = this.ctx;
    c.fillStyle = `rgba(5,5,5,${0.74 * a})`;
    c.fillRect(x, y, w, h);
    c.strokeStyle = `rgba(255,255,255,${0.09 * a})`;
    c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    c.strokeStyle = `rgba(${RED},${0.95 * a})`;
    c.beginPath();
    c.moveTo(x + 0.5, y + 14); c.lineTo(x + 0.5, y + 0.5); c.lineTo(x + 14, y + 0.5);
    c.moveTo(x + w - 14, y + h - 0.5); c.lineTo(x + w - 0.5, y + h - 0.5); c.lineTo(x + w - 0.5, y + h - 14);
    c.stroke();
    this.font(10, 500, MONO, '0.2em');
    this.text(title, x + 16, y + 24, `rgba(${RED},${a})`);
    c.fillStyle = `rgba(255,255,255,${0.07 * a})`;
    c.fillRect(x + 16, y + 34, w - 32, 1);
  };
  HUD.prototype.stat = function (x, y, label, value, a, valueRGBA, align) {
    this.font(11, 400, SANS, '0.12em');
    this.text(label, x, y, `rgba(140,140,140,${a})`, align);
    this.font(30, 300, MONO, '0.02em');
    this.text(value, x, y + 36, valueRGBA || `rgba(245,245,245,${a})`, align);
  };
  HUD.prototype.check = function (x, y, a) {
    const c = this.ctx;
    c.strokeStyle = `rgba(${RED},${a})`;
    c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(x, y - 4); c.lineTo(x + 3.5, y); c.lineTo(x + 10, y - 8); c.stroke();
    c.lineWidth = 1;
  };
  HUD.prototype.cross = function (x, y, a) {
    const c = this.ctx;
    c.strokeStyle = `rgba(240,240,240,${a})`;
    c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(x, y - 8); c.lineTo(x + 8, y); c.moveTo(x + 8, y - 8); c.lineTo(x, y); c.stroke();
    c.lineWidth = 1;
  };
  HUD.prototype.chip = function (s, x, y, a, on) {
    const c = this.ctx;
    this.font(11.5, 500);
    const w = c.measureText(s).width + 14;
    if (on) {
      c.fillStyle = `rgba(${RED},${0.92 * a})`;
      c.fillRect(x, y - 13, w, 19);
      this.text(s, x + 7, y + 1, `rgba(10,10,10,${a})`);
    } else {
      c.strokeStyle = `rgba(255,255,255,${0.16 * a})`;
      c.strokeRect(x + 0.5, y - 12.5, w - 1, 18);
      this.text(s, x + 7, y + 1, `rgba(220,220,220,${a})`);
    }
    return w;
  };
  HUD.prototype.proj = function (x, y, z, out) {
    return this.world.project(x, y, z, out || this.p);
  };
  HUD.prototype.onScreen = function (x, y, m) {
    m = m || 40;
    return x > m && x < this.w - m && y > 90 && y < this.h - 60;
  };

  /* ------------------------------------------------------------------ frame */
  HUD.prototype.draw = function () {
    const c = this.ctx, W = this.world;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.c.width, this.c.height);
    if (!W) return;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.lineWidth = 1;
    c.textBaseline = 'alphabetic';
    const wt = W.W, wide = this.w >= 900;
    const ia = smooth(0.55, 1, W.intro);
    const A = (x) => smooth(0.35, 1, x);
    if (wt[0] + wt[8] > 0.01) this.fleet(A(Math.min(1, wt[0] + wt[8])) * ia, wide);
    if (wt[1] > 0.01) this.inventory(A(wt[1]), wide);
    if (wt[2] > 0.01) this.online(A(wt[2]), wide);
    if (wt[3] > 0.01) this.projects(A(wt[3]), wide);
    if (wt[4] > 0.01) this.channels(A(wt[4]), wide);
    if (wt[5] > 0.01) this.gate(A(wt[5]), wide);
    if (wt[6] > 0.01) this.ledger(A(wt[6]), wide);
    if (wt[7] > 0.01) this.audit(A(wt[7]), wide);
    this.tooltip();
  };

  HUD.prototype.statsRight = function (items, a) {
    // top-right readouts, right-aligned columns
    let x = this.w - Math.max(96, this.w * 0.075);
    const y = 128;
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      this.stat(x, y, it[0], it[1], a, it[2], 'right');
      this.font(30, 300, MONO, '0.02em');
      x -= Math.max(this.ctx.measureText(it[1]).width, 60) + 44;
    }
  };

  /* 0 / 8 — overview */
  HUD.prototype.fleet = function (a, wide) {
    const W = this.world, S = W.scr, t = W.time, cnt = F.counts;
    if (wide) {
      const y = this.h - 26;
      let x = this.w - Math.max(96, this.w * 0.075);
      const items = [['Pipelines', String(cnt.online)], ['Alive', String(cnt.online)], ['Sessions', String(cnt.total)]];
      for (const it of items) {
        this.font(13, 500, MONO, '0.04em');
        this.text(it[1], x, y, `rgba(235,235,235,${a})`, 'right');
        const vw = this.ctx.measureText(it[1]).width;
        this.font(11, 400, SANS, '0.12em');
        this.text(it[0], x - vw - 8, y, `rgba(130,130,130,${a})`, 'right');
        x -= vw + this.ctx.measureText(it[0]).width + 34;
      }
    }
    // one floating tag that hops between visible online terminals
    const cyc = Math.floor(t / 3.4), loc = fract(t / 3.4);
    if (cyc !== this.heroCycle) {
      this.heroCycle = cyc;
      this.heroPick = -1;
      const ids = F.onlineIdx;
      for (let n = 0; n < 40; n++) {
        const i = ids[Math.floor(hash(cyc * 97 + n) * ids.length)];
        const x = S[i * 3], y = S[i * 3 + 1];
        if (S[i * 3 + 2] && x > this.w * (wide ? 0.56 : 0.2) && x < this.w * 0.8 && y > this.h * 0.25 && y < this.h * 0.72) {
          this.heroPick = i;
          break;
        }
      }
    }
    const i = this.heroPick;
    if (i >= 0 && S[i * 3 + 2]) {
      const fa = smooth(0.05, 0.18, loc) * (1 - smooth(0.82, 0.96, loc)) * a;
      const T = F.terminals[i];
      this.tag(S[i * 3], S[i * 3 + 1], T.host, F.PROJECTS[T.project].name + ' · ALIVE', fa, S[i * 3] > this.w * 0.68 ? -1 : 1);
    }
  };

  /* 1 — inventory wall */
  HUD.prototype.inventory = function (a, wide) {
    const W = this.world, K = OC.World.consts, p = this.p, q = this.q;
    const yTop = K.WALL_Y + ((K.WALL_ROWS - 1) / 2) * K.WALL_DY + 0.56;
    let start = 0;
    this.font(11, 400, SANS, '0.1em');
    for (let pi = 0; pi < F.PROJECTS.length; pi++) {
      const pr = F.PROJECTS[pi];
      const c0 = Math.floor(start / K.WALL_ROWS), c1 = Math.floor((start + pr.count - 1) / K.WALL_ROWS);
      start += pr.count;
      const a0 = K.wallAngle(c0 - 0.35), a1 = K.wallAngle(c1 + 0.35);
      this.proj(Math.sin(a0) * K.WALL_R, yTop, Math.cos(a0) * K.WALL_R, p);
      this.proj(Math.sin(a1) * K.WALL_R, yTop, Math.cos(a1) * K.WALL_R, q);
      if (!p[2] || !q[2]) continue;
      const c = this.ctx;
      c.strokeStyle = `rgba(${RED},${0.55 * a})`;
      c.beginPath();
      c.moveTo(p[0], p[1] + 5); c.lineTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.lineTo(q[0], q[1] + 5);
      c.stroke();
      if (wide || pi % 2 === 0) {
        this.font(11, 400, SANS, '0.08em');
        this.text(pr.name, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2 - 8, `rgba(175,175,175,${a})`, 'center');
      }
    }
    const S = W.scr;
    const ta = a * (1 - W.selAmt);
    const picks = wide ? [40, 175, 301] : [175];
    for (let n = 0; ta > 0.01 && n < picks.length; n++) {
      const i = picks[n];
      if (!S[i * 3 + 2]) continue;
      const T = F.terminals[i];
      const dir = S[i * 3] > this.w * 0.78 ? -1 : 1;
      this.tag(S[i * 3], S[i * 3 + 1], T.host, T.os + ' · ' + (T.online ? 'ALIVE' : 'DORMANT'), ta, dir, 34 + n * 6);
    }
    if (wide) this.statsRight([['Sessions', String(F.counts.total)]], a);
    this.selection(a);
  };

  // the card picked on the wall: brackets, click ripple, and a leader to the detail card
  HUD.prototype.selection = function (a) {
    const W = this.world, i = W.selShown, S = W.scr;
    if (i < 0 || !S[i * 3 + 2]) return;
    const c = this.ctx, x = S[i * 3], y = S[i * 3 + 1];
    const sa = W.selAmt * a, age = W.time - W.selT;
    const r = 15 + 12 * Math.exp(-age * 9);
    c.lineWidth = 1.5;
    this.brackets(x, y, r, sa);
    c.lineWidth = 1;
    if (W.sel === i && age < 0.75) {
      for (let k = 0; k < 2; k++) {
        const q = clamp((age - k * 0.14) / 0.55, 0, 1);
        if (q <= 0 || q >= 1) continue;
        c.strokeStyle = `rgba(${RED},${(1 - q) * 0.9 * a})`;
        c.beginPath();
        c.arc(x, y, 8 + q * 46, 0, Math.PI * 2);
        c.stroke();
      }
    }
    const an = this.anchor;
    if (!an || !an.on) return;
    // orthogonal "circuit" path from the card to the panel
    const pts = an.side === 'top'
      ? [[x, y + r + 3], [x, (y + an.y) / 2], [an.x, (y + an.y) / 2], [an.x, an.y]]
      : [[x - r - 3, y], [an.x + 34, y], [an.x + 34, an.y], [an.x, an.y]];
    c.save();
    c.strokeStyle = `rgba(${RED},${0.6 * sa})`;
    c.setLineDash([4, 5]);
    c.lineDashOffset = -W.time * 24;
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let k = 1; k < pts.length; k++) c.lineTo(pts[k][0], pts[k][1]);
    c.stroke();
    c.restore();
    // right after a pick, a spark runs down the leader into the panel
    if (W.sel === i && age < 0.9) {
      let total = 0;
      const seg = [];
      for (let k = 1; k < pts.length; k++) {
        const l = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
        seg.push(l);
        total += l;
      }
      let d = total * (1 - Math.pow(1 - clamp(age / 0.6, 0, 1), 3));
      for (let k = 0; k < seg.length; k++) {
        if (d <= seg[k] || k === seg.length - 1) {
          const f = seg[k] ? clamp(d / seg[k], 0, 1) : 1;
          const px = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, py = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f;
          c.fillStyle = `rgba(255,120,110,${(1 - smooth(0.6, 0.9, age)) * a})`;
          c.shadowColor = 'rgba(255,42,42,0.9)';
          c.shadowBlur = 10;
          c.beginPath();
          c.arc(px, py, 2.6, 0, Math.PI * 2);
          c.fill();
          c.shadowBlur = 0;
          break;
        }
        d -= seg[k];
      }
    }
  };

  /* 2 — online status */
  HUD.prototype.online = function (a, wide) {
    const W = this.world, S = W.scr, cnt = F.counts;
    if (wide) this.statsRight([['Alive', String(cnt.online), `rgba(${RED},${a})`], ['Dormant', String(cnt.offline)]], a);
    // label the offline terminals that sit nearest the viewer
    const cand = [];
    for (const i of F.offlineIdx) {
      if (!S[i * 3 + 2]) continue;
      const x = S[i * 3], y = S[i * 3 + 1];
      if (x < this.w * (wide ? 0.55 : 0.12) || x > this.w * 0.8 || y < (wide ? 240 : 130) || y > this.h - 120) continue;
      const pz = W.pos[i * 3] * W.eye[0] + W.pos[i * 3 + 2] * W.eye[2];
      cand.push([pz, i]);
    }
    cand.sort((m, n) => n[0] - m[0]);
    const want = wide ? 2 : 1;
    for (let n = 0; n < Math.min(want, cand.length); n++) {
      const i = cand[n][1], T = F.terminals[i];
      const last = F.clock(F.lastSeenSec(T));
      this.tag(S[i * 3], S[i * 3 + 1], T.host, '休眠 · 最后 Checkin ' + last, a, S[i * 3] > this.w * 0.74 ? -1 : 1, 30 + n * 10);
    }
  };

  /* 3 — projects */
  HUD.prototype.projects = function (a, wide) {
    const W = this.world, K = OC.World.consts, p = this.p, c = this.ctx;
    const ctr = [0, 0, 0];
    for (let pi = 0; pi < F.PROJECTS.length; pi++) {
      K.clusterCenter(pi, W.time, ctr);
      const rad = K.clusterRadius(pi);
      this.proj(ctr[0], ctr[1] + rad + 0.42, ctr[2], p);
      if (!p[2]) continue;
      const hl = W.clusterHL[pi], pr = F.PROJECTS[pi];
      const x = p[0], y = p[1];
      c.strokeStyle = `rgba(${RED},${(0.35 + hl * 0.6) * a})`;
      c.beginPath(); c.moveTo(x, y + 4); c.lineTo(x, y + 16); c.stroke();
      this.font(12, hl > 0.5 ? 500 : 400, SANS, '0.08em');
      this.text(pr.name, x, y - 14, `rgba(${Math.round(190 + 60 * hl)},${Math.round(190 + 60 * hl)},${Math.round(190 + 60 * hl)},${a})`, 'center');
      this.font(10.5, 400, MONO, '0.06em');
      let on = 0;
      for (const T of F.terminals) if (T.project === pi && T.online) on++;
      const sub = hl > 0.3 ? 'Alive ' + on + ' / ' + pr.count : pr.count + ' sessions';
      this.text(sub, x, y, hl > 0.3 ? `rgba(${RED},${a})` : `rgba(130,130,130,${a})`, 'center');
    }
  };

  /* 4 — channels */
  HUD.prototype.channels = function (a, wide) {
    const W = this.world, S = W.scr;
    if (wide) this.statsRight([['Pipelines', String(F.counts.online)]], a);
    let best = -1, bx = -1;
    for (let n = 0; n < 60; n++) {
      const i = F.onlineIdx[(n * 37) % F.onlineIdx.length];
      if (!S[i * 3 + 2]) continue;
      const x = S[i * 3], y = S[i * 3 + 1];
      if (y < this.h * 0.5 || y > this.h - 110 || x < this.w * 0.58 || x > this.w * 0.82) continue;
      if (x > bx) { bx = x; best = i; }
    }
    if (best >= 0) {
      const T = F.terminals[best];
      this.tag(S[best * 3], S[best * 3 + 1], T.host, F.PROJECTS[T.project].pipe + ' · SpiteStream', a, -1, 40);
    }
  };

  /* 5 — whitelist gate */
  HUD.prototype.gate = function (a, wide) {
    const W = this.world, gi = W.info.gate, p = this.p, q = this.q, c = this.ctx;
    this.proj(gi.center[0], gi.center[1], gi.center[2], q);
    const cx = q[0], cy = q[1];
    for (let k = 0; k < 4; k++) {
      const s = gi.slots[k];
      this.proj(s[0], s[1], s[2], p);
      if (!p[2]) continue;
      let dx = p[0] - cx, dy = p[1] - cy;
      const l = Math.hypot(dx, dy) || 1;
      dx /= l; dy /= l;
      const on = gi.active === k && gi.activeAmt > 0.3;
      this.font(11.5, 500);
      const tw = c.measureText(PROGS[k]).width + 14;
      const lx = p[0] + dx * 22 - (dx < 0 ? tw : 0), ly = p[1] + dy * 16 + 4;
      c.strokeStyle = `rgba(${RED},${0.5 * a})`;
      c.beginPath(); c.moveTo(p[0] + dx * 9, p[1] + dy * 9); c.lineTo(p[0] + dx * 20, p[1] + dy * 14); c.stroke();
      this.chip(PROGS[k], lx, ly, a, on);
    }
    if (gi.reject > 0.02 && q[2]) {
      // inside the ring when it is large on screen, otherwise just below it
      const s0 = gi.slots[0];
      this.proj(s0[0], s0[1], s0[2], p);
      const ringPx = Math.hypot(p[0] - cx, p[1] - cy);
      const ly = ringPx > 150 ? cy - ringPx * 0.36 : cy + ringPx * 1.25 + 18;
      const ra = gi.reject * a;
      this.cross(cx - 50, ly, ra);
      this.font(12, 500, SANS, '0.06em');
      this.text('护栏未通过 · 熔断拒绝', cx - 36, ly, `rgba(240,240,240,${ra})`);
    }
    if (!wide) return;
    const T = F.terminals[F.SEL];
    this.proj(gi.term[0], gi.term[1], gi.term[2], p);
    if (p[2]) this.tag(p[0], p[1], T.host, T.os, a, p[0] > this.w * 0.72 ? -1 : 1, 46);
    // bottom-left, under the stage copy, so the gate itself stays unobstructed
    const pw = 404, ph = 172;
    const px = clamp(this.w * 0.066, 22, 112), py = this.h - ph - 64;
    this.panel(px, py, pw, ph, 'GUARDRAIL & OPSEC CHECK', a);
    const log = gi.log;
    for (let n = 0; n < log.length; n++) {
      const L = log[n], y = py + 62 + n * 27;
      const fresh = n === 0 ? Math.exp(-L.age * 2) : 0;
      if (fresh > 0.02) {
        c.fillStyle = `rgba(${RED},${0.12 * fresh * a})`;
        c.fillRect(px + 10, y - 17, pw - 20, 25);
      }
      const ra = a * (1 - n * 0.16);
      this.font(11.5, 400);
      this.text(L.time, px + 16, y, `rgba(120,120,120,${ra})`);
      this.text(L.actor, px + 98, y, `rgba(225,225,225,${ra})`);
      if (L.ok) {
        this.text(PROGS[L.prog], px + 184, y, `rgba(225,225,225,${ra})`);
        this.check(px + 304, y - 1, ra);
        this.font(12, 500, SANS);
        this.text('放行', px + 322, y, `rgba(${RED},${ra})`);
      } else {
        this.font(11.5, 400, SANS);
        this.text('越界动作', px + 184, y, `rgba(150,150,150,${ra})`);
        this.cross(px + 305, y - 1, ra);
        this.font(12, 500, SANS);
        this.text('拦截', px + 322, y, `rgba(240,240,240,${ra})`);
      }
    }
  };

  /* 6 — task ledger */
  HUD.prototype.ledger = function (a, wide) {
    const W = this.world, info = W.info, p = this.p, c = this.ctx;
    if (!info.ledger.length) return;
    if (!wide) {
      const L = info.ledger[0];
      this.proj(L.x, L.y, L.z, p);
      if (p[2]) this.tag(p[0], p[1], '#' + L.r.id + ' · ' + (L.r.ok ? PROGS[L.r.prog] : '越界动作'), L.r.actor + ' · ' + L.r.time, a, 1, 30);
      return;
    }
    const pw = 376, rows = info.ledger.length, ph = 54 + rows * 26;
    const px = this.w - Math.max(96, this.w * 0.075) - pw, py = 112;
    this.panel(px, py, pw, ph, 'TASK / SPITE STREAM', a);
    for (let n = 0; n < rows; n++) {
      const L = info.ledger[n], r = L.r, y = py + 60 + n * 26;
      const ra = a * (1 - n * 0.12) * smooth(0, 0.25, L.ageS);
      if (n === 0) {
        c.fillStyle = `rgba(${RED},${0.1 * Math.exp(-L.ageS * 1.5) * a})`;
        c.fillRect(px + 10, y - 16, pw - 20, 24);
      }
      this.font(11.5, 400);
      this.text('#' + r.id, px + 16, y, `rgba(${RED},${ra})`);
      this.text(r.actor, px + 80, y, `rgba(225,225,225,${ra})`);
      if (r.ok) this.text(PROGS[r.prog], px + 156, y, `rgba(225,225,225,${ra})`);
      else { this.font(11.5, 400, SANS); this.text('越界动作', px + 156, y, `rgba(150,150,150,${ra})`); this.font(11.5, 400); }
      this.text(F.terminals[r.term].host, px + 240, y, `rgba(150,150,150,${ra})`);
      if (r.ok) this.check(px + pw - 30, y - 1, ra);
      else this.cross(px + pw - 29, y - 1, ra);
    }
    const L = info.ledger[0];
    this.proj(L.x, L.y, L.z, p);
    if (p[2]) {
      this.brackets(p[0], p[1], 7, a);
      c.strokeStyle = `rgba(${RED},${0.45 * a})`;
      c.setLineDash([3, 4]);
      c.beginPath();
      c.moveTo(p[0] + 8, p[1] - 8);
      c.lineTo(px - 18, py + 56);
      c.lineTo(px, py + 56);
      c.stroke();
      c.setLineDash([]);
    }
  };

  /* 7 — audit query */
  HUD.prototype.audit = function (a, wide) {
    const W = this.world, info = W.info, p = this.p, c = this.ctx;
    const m = info.matched;
    let denied = 0;
    for (const x of m) if (!x.r.ok) denied++;
    const pw = 360, ph = 162;
    const px = this.w - Math.max(96, this.w * 0.075) - pw, py = 112;
    if (wide) {
      this.panel(px, py, pw, ph, 'OPERATOR & AGENT AUDIT', a);
      this.font(11, 400, SANS, '0.08em');
      this.text('主体', px + 16, py + 64, `rgba(130,130,130,${a})`);
      this.chip('admin', px + 72, py + 64, a, true);
      this.font(11, 400, SANS, '0.08em');
      this.text('范围', px + 168, py + 64, `rgba(130,130,130,${a})`);
      this.font(11.5, 500, SANS);
      const w2 = c.measureText('近 7 天').width + 14;
      c.strokeStyle = `rgba(255,255,255,${0.16 * a})`;
      c.strokeRect(px + 210.5, py + 51.5, w2 - 1, 18);
      this.text('近 7 天', px + 217, py + 65, `rgba(220,220,220,${a})`);
      c.fillStyle = `rgba(255,255,255,${0.07 * a})`;
      c.fillRect(px + 16, py + 86, pw - 32, 1);
      this.font(11, 400, SANS, '0.1em');
      this.text('命中', px + 16, py + 126, `rgba(130,130,130,${a})`);
      this.font(30, 300, MONO);
      this.text(String(m.length), px + 56, py + 128, `rgba(245,245,245,${a})`);
      const nw = c.measureText(String(m.length)).width;
      this.font(11, 400, SANS);
      this.text('条', px + 62 + nw, py + 126, `rgba(130,130,130,${a})`);
      this.text('其中护栏拦截 ' + denied + ' 条', px + pw - 16, py + 126, `rgba(150,150,150,${a})`, 'right');
    }
    // tag the matched records closest to the viewer
    const cand = [];
    for (const x of m) {
      this.proj(x.x, x.y, x.z, p);
      if (!p[2] || !this.onScreen(p[0], p[1], 60)) continue;
      if (wide && (p[0] < this.w * 0.5 || (p[0] > px - 260 && p[1] < py + ph + 60))) continue;
      cand.push([p[3], p[0], p[1], x.r]);
    }
    cand.sort((u, v) => u[0] - v[0]);
    const picked = [];
    for (const cnd of cand) {
      if (picked.length >= (wide ? 3 : 1)) break;
      if (picked.some((o) => Math.abs(o[2] - cnd[2]) < 64)) continue;
      picked.push(cnd);
    }
    for (const [, x, y, r] of picked) {
      const title = r.actor + ' · ' + (r.ok ? PROGS[r.prog] : '越界动作');
      this.tag(x, y, title, F.terminals[r.term].host + ' · ' + r.time, a, x > this.w * 0.7 ? -1 : 1, 24);
    }
  };

  /* hover tooltip on any terminal */
  HUD.prototype.tooltip = function () {
    const W = this.world, i = W.hover;
    if (i < 0 || i === W.selShown) return;
    const S = W.scr;
    if (!S[i * 3 + 2]) return;
    const T = F.terminals[i];
    const sub = F.PROJECTS[T.project].name + ' · ' + (T.online ? 'ALIVE' : 'DORMANT') + (W.W[1] > 0.6 ? ' · 点击查看' : '');
    this.tag(S[i * 3], S[i * 3 + 1], T.host, sub, 1, S[i * 3] > this.w * 0.8 ? -1 : 1, 28);
  };

  OC.HUD = HUD;
})();
