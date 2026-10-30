/* Operations Control — page glue: scroll position -> stage, rail, text reveal,
   render loop, resize (repaints synchronously so the canvas is never blank). */
(function () {
  'use strict';
  const OC = window.OC;
  const { clamp, smooth, damp } = OC.M;
  const root = document.documentElement;
  const sections = Array.from(document.querySelectorAll('section[data-stage]'));
  const rail = Array.from(document.querySelectorAll('.rail a[data-k]'));
  const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  let world = null;
  try {
    world = OC.createWorld(document.getElementById('gl'), { reduced });
  } catch (e) {
    console.warn('[oc] 3D disabled:', e && e.message);
  }
  if (!world) root.classList.add('no-gl');
  const hud = new OC.HUD(document.getElementById('hud'), world);
  const F = OC.fleet;

  /* ---- inventory detail card: click a terminal on the wall (stage 1) ---- */
  const card = document.getElementById('inspect');
  const field = {};
  card.querySelectorAll('[data-f]').forEach((el) => { field[el.dataset.f] = el; });
  let beatShown = '';

  function cell(tag, text, cls) {
    const el = document.createElement(tag);
    el.textContent = text;
    if (cls) el.className = cls;
    return el;
  }

  function openCard(i) {
    if (!world) return;
    const T = F.terminals[i];
    world.select(i);
    field.host.textContent = T.host;
    field.state.textContent = T.online ? 'ALIVE' : 'DORMANT';
    field.project.textContent = F.PROJECTS[T.project].name;
    field.os.textContent = T.os;
    field.ip.textContent = T.ip;
    field.reg.textContent = T.registered;
    field.chan.textContent = T.online ? F.PROJECTS[T.project].pipe : '待回连 · beacon';
    field.tasks.textContent = '';
    for (const r of F.history(T)) {
      const li = document.createElement('li');
      li.append(
        cell('time', r.time),
        cell('span', r.actor),
        cell('code', r.ok ? F.PROGRAMS[r.prog] : '越界动作', r.ok ? '' : 'na'),
        cell('b', r.ok ? '已回传' : '已熔断', r.ok ? '' : 'no'),
      );
      field.tasks.append(li);
    }
    beatShown = '';
    updateBeat(world.time);
    card.classList.toggle('off', !T.online);
    card.classList.remove('swap');
    void card.offsetWidth; // restart the scan-in animation
    card.classList.add('swap', 'show');
    card.setAttribute('aria-hidden', 'false');
    root.classList.add('inspecting');
  }

  function closeCard() {
    if (!world || world.sel < 0) return;
    world.clearSelection();
    card.classList.remove('show');
    card.setAttribute('aria-hidden', 'true');
    root.classList.remove('inspecting');
  }

  // online terminals report every few seconds; offline ones show when they were last heard from
  function updateBeat(t) {
    const i = world.sel;
    if (i < 0) return;
    const T = F.terminals[i];
    const txt = T.online ? (1 + ((Math.floor(t) + i) % 5)) + '\u2009秒前' : F.clock(F.lastSeenSec(T));
    if (txt !== beatShown) {
      beatShown = txt;
      field.beat.textContent = txt;
    }
  }

  // where the HUD leader line meets the card (side on desktop, top edge on phones)
  function cardAnchor() {
    if (!world || world.selShown < 0) { hud.anchor = null; return; }
    const r = card.getBoundingClientRect();
    if (!r.width) { hud.anchor = null; return; }
    const sx = world.scr[world.selShown * 3];
    hud.anchor = window.innerWidth > 820
      ? { on: true, side: 'left', x: r.right, y: r.top + 30 }
      : { on: true, side: 'top', x: clamp(sx, r.left + 24, r.right - 24), y: r.top };
  }

  const ptr = { x: -1e4, y: -1e4, nx: 0, ny: 0, in: false };
  const perf = { acc: 0, n: 0, slow: 0 };
  let anchors = [];
  let s = 0, active = -1, last = -1;

  function measure() {
    const y = window.scrollY;
    anchors = sections
      .filter((el) => el.offsetHeight > 0)
      .map((el) => ({ el, st: +el.dataset.stage, top: el.getBoundingClientRect().top + y }));
  }

  // continuous stage index; flat near each section so formations settle
  function stageTarget() {
    if (!anchors.length) return 0;
    const y = window.scrollY;
    for (let i = 0; i < anchors.length - 1; i++) {
      const a = anchors[i], b = anchors[i + 1];
      if (y < b.top) {
        const f = clamp((y - a.top) / Math.max(1, b.top - a.top), 0, 1);
        return a.st + (b.st - a.st) * smooth(0.2, 0.8, f);
      }
    }
    return anchors[anchors.length - 1].st;
  }

  function setActive(k) {
    active = k;
    for (const a of anchors) a.el.classList.toggle('on', a.st === k);
    for (const r of rail) r.classList.toggle('on', +r.dataset.k === k);
  }

  function paint() {
    if (world) world.render();
    cardAnchor();
    hud.draw();
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (world) world.resize(w, h, dpr);
    hud.resize(w, h, dpr);
    measure();
    paint();
  }

  // step the render scale down if frames stay slow
  function adapt(dt) {
    perf.acc += dt;
    if (++perf.n < 45) return;
    const avg = perf.acc / perf.n;
    perf.acc = 0;
    perf.n = 0;
    perf.slow = avg > 1 / 36 ? perf.slow + 1 : 0;
    if (perf.slow >= 2 && world.scale > 0.6) {
      perf.slow = 0;
      world.setScale(world.scale > 0.8 ? 0.75 : 0.6);
    }
  }

  function frame(ms) {
    const t = ms / 1000;
    const dt = last < 0 ? 1 / 60 : Math.min(Math.max(t - last, 0), 0.1);
    last = t;
    const target = stageTarget();
    s = damp(s, target, 3.4, dt);
    if (Math.abs(s - target) < 5e-4) s = target;
    const k = Math.round(target);
    if (k !== active) setActive(k);
    if (world) {
      world.update(t, dt, s, ptr);
      adapt(dt);
      if (world.sel >= 0) {
        if (Math.abs(target - 1) > 0.45) closeCard();
        else updateBeat(world.time);
      }
      root.classList.toggle('pick', world.W[1] > 0.6 && world.hover >= 0);
    }
    paint();
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (e) => {
    ptr.x = e.clientX;
    ptr.y = e.clientY;
    ptr.nx = (e.clientX / window.innerWidth) * 2 - 1;
    ptr.ny = (e.clientY / window.innerHeight) * 2 - 1;
    ptr.in = e.pointerType === 'mouse';
  }, { passive: true });
  window.addEventListener('mouseout', (e) => { if (!e.relatedTarget) ptr.in = false; });

  let lastPointer = 'mouse';
  window.addEventListener('pointerdown', (e) => { lastPointer = e.pointerType; }, { passive: true });
  window.addEventListener('click', (e) => {
    if (!world || world.W[1] < 0.6) return;
    if (e.target.closest && e.target.closest('a, button, .inspect, .copy')) return;
    const i = world.pickAt(e.clientX, e.clientY, lastPointer === 'touch' ? 26 : 16);
    if (i >= 0) openCard(i);
    else closeCard();
  });
  card.querySelector('.ins-close').addEventListener('click', closeCard);
  window.addEventListener('keydown', (e) => {
    if (!world || world.sel < 0) return;
    if (e.key === 'Escape') { closeCard(); return; }
    const K = OC.World.consts;
    let col = Math.floor(world.sel / K.WALL_ROWS), row = world.sel % K.WALL_ROWS;
    if (e.key === 'ArrowLeft') col--;
    else if (e.key === 'ArrowRight') col++;
    else if (e.key === 'ArrowUp') row--;
    else if (e.key === 'ArrowDown') row++;
    else return;
    e.preventDefault();
    col = (col + K.WALL_COLS) % K.WALL_COLS;
    row = (row + K.WALL_ROWS) % K.WALL_ROWS;
    openCard(col * K.WALL_ROWS + row);
  });
  window.addEventListener('blur', () => { ptr.in = false; });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  resize();
  s = stageTarget();
  setActive(Math.round(s));
  root.classList.add('ready');
  requestAnimationFrame(frame);

  OC.app = { world, hud, openCard, closeCard }; // handy from the console
})();
