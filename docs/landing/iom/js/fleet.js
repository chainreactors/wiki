/* Operations Control — simulated fleet. Every name, count and record here is
   demo data generated deterministically; the page labels it as simulated. */
(function () {
  'use strict';
  const OC = window.OC;
  const { hash } = OC.M;

  const PROJECTS = [
    { name: 'listener-https', pipe: 'https/tls · domain-front', code: 'mal-https', count: 96 },
    { name: 'listener-rem', pipe: 'rem/mux · peer-mesh', code: 'mal-rem', count: 72 },
    { name: 'listener-tcp', pipe: 'tcp/mtls · reverse', code: 'mal-tcp', count: 60 },
    { name: 'listener-bind', pipe: 'bind/p2p · session-link', code: 'mal-bind', count: 56 },
    { name: 'listener-http', pipe: 'http/custom-parser', code: 'mal-http', count: 44 },
    { name: 'pulse-stager', pipe: 'pulse/srdi · fileless', code: 'mal-pulse', count: 32 },
  ];
  const OS = ['WinServer 2022 · malefic', 'Windows 11 x64 · malefic', 'Ubuntu 22.04 · malefic', 'Debian 12 · malefic', 'macOS 14 arm64 · malefic'];
  const PROGRAMS = ['sysinfo', 'netstat', 'bof:recon', 'rem:pivot'];
  const OFFLINE = 29;

  const terminals = [];
  PROJECTS.forEach((p, pi) => {
    let num = 100 + Math.floor(hash(pi * 31 + 7) * 300);
    for (let j = 0; j < p.count; j++) {
      const i = terminals.length;
      num += 1 + Math.floor(hash(i * 5 + 11) * 9);
      terminals.push({
        i,
        project: pi,
        j,
        n: p.count,
        host: p.code + '-' + String(num).padStart(4, '0'),
        os: OS[Math.floor(hash(i * 3 + 2) * OS.length)],
        online: true,
        h1: hash(i * 4 + 101),
        h2: hash(i * 4 + 202),
        h3: hash(i * 4 + 303),
        h4: hash(i * 4 + 404),
        delay: hash(i * 9 + 55),
      });
    }
  });
  terminals
    .map((T) => [hash(T.i * 17 + 9), T])
    .sort((a, b) => a[0] - b[0])
    .slice(0, OFFLINE)
    .forEach((x) => { x[1].online = false; });

  const onlineIdx = terminals.filter((T) => T.online).map((T) => T.i);
  const offlineIdx = terminals.filter((T) => !T.online).map((T) => T.i);

  // the terminal used for the single-channel diagnostics scene
  let SEL = 41;
  while (!terminals[SEL].online) SEL++;

  /* ---- clock: simulated wall time shown in the HUD ---- */
  const CLOCK0 = 10 * 3600 + 26 * 60 + 5;
  function clock(sec) {
    sec = Math.floor(sec);
    sec = ((sec % 86400) + 86400) % 86400;
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  /* ---- inventory details, shown when a terminal is inspected ---- */
  const ACTORS = ['op.red', 'agent.mcp', 'admin', 'mal.auto'];
  const NOW = CLOCK0 + 3600;
  const REG0 = Date.UTC(2025, 5, 1);
  terminals.forEach((T) => {
    T.ip = '10.' + (20 + T.project * 4) + '.' + (1 + (T.j >> 4)) + '.' + (10 + ((T.j * 37) % 240));
    T.registered = new Date(REG0 + Math.floor(T.h4 * 470) * 86400000).toISOString().slice(0, 10);
  });
  // offline terminals: when their last heartbeat arrived (seconds into the simulated day)
  const lastSeenSec = (T) => CLOCK0 + 3000 - Math.floor(T.h2 * 5400);
  // the last three tasks against a terminal, newest first
  function history(T) {
    const out = [];
    let sec = (T.online ? NOW - 40 : lastSeenSec(T) - 60) - Math.floor(T.h1 * 900);
    for (let n = 0; n < 3; n++) {
      const a = hash(T.i * 101 + n * 7 + 1), b = hash(T.i * 101 + n * 7 + 2), c = hash(T.i * 101 + n * 7 + 3);
      const denied = b < 0.1;
      out.push({ time: clock(sec), actor: ACTORS[Math.floor(a * ACTORS.length)], prog: denied ? -1 : Math.floor(c * 4), ok: !denied });
      sec -= 240 + Math.floor(c * 3000);
    }
    return out;
  }

  /* ---- task ledger: record k is written at page time k * RECORD_DT ---- */
  const RECORD_DT = 0.55;
  const cache = new Map();
  function record(k) {
    let r = cache.get(k);
    if (r) return r;
    const h = hash(k * 7 + 3), h2 = hash(k * 11 + 5), h3 = hash(k * 13 + 1);
    const actor = h < 0.34 ? 'op.red' : h < 0.62 ? 'agent.mcp' : h < 0.82 ? 'admin' : 'mal.auto';
    const denied = h2 < 0.06;
    r = {
      k,
      id: 20480 + k,
      actor,
      prog: denied ? -1 : Math.floor(h3 * 4),
      ok: !denied,
      term: onlineIdx[Math.floor(hash(k * 19 + 7) * onlineIdx.length)],
      time: clock(CLOCK0 + 1800 + k * 17),
    };
    cache.set(k, r);
    if (cache.size > 600) {
      for (const key of cache.keys()) {
        if (key < k - 300) cache.delete(key);
      }
    }
    return r;
  }

  /* ---- whitelist gate script (looping); prog -1 = not on the list ---- */
  const GATE_PERIOD = 8.4;
  const GATE_EVENTS = [
    { t0: 0.25, actor: 'op.red', prog: 1 },
    { t0: 1.85, actor: 'agent.mcp', prog: 0 },
    { t0: 3.45, actor: 'admin', prog: -1 },
    { t0: 5.05, actor: 'admin', prog: 3 },
    { t0: 6.65, actor: 'mal.auto', prog: 2 },
  ];

  OC.fleet = {
    PROJECTS,
    PROGRAMS,
    terminals,
    onlineIdx,
    offlineIdx,
    SEL,
    CLOCK0,
    clock,
    lastSeenSec,
    history,
    RECORD_DT,
    record,
    GATE_PERIOD,
    GATE_EVENTS,
    counts: { total: terminals.length, online: onlineIdx.length, offline: offlineIdx.length },
  };
})();
