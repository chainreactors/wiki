/* Operations Control — the 3D world.
   One control core, 360 simulated terminals, and nine scroll stages:
   0 overview · 1 inventory wall · 2 online sphere · 3 project clusters · 4 channels
   5 whitelist gate · 6 task ledger · 7 audit scan · 8 finale.
   Everything is additive light, so draw order does not matter. */
(function () {
  'use strict';
  const OC = window.OC;
  const { M, mat4, GLU } = OC;
  const { TAU, clamp, lerp, smooth, fract, easeOut, easeInOut, easeOutBack } = M;
  const F = OC.fleet;
  const TERMS = F.terminals;
  const N = TERMS.length;

  const FLOOR_Y = -1.6;
  const MAXSEG = 128;
  const DUST_N = 2200;
  const NUC_N = 320;
  const LEDGER_N = 140;
  const LEDGER_STEP = 0.36;   // radians between consecutive records
  const LEDGER_PITCH = 0.028; // rise per record
  const BG = [3 / 255, 3 / 255, 3 / 255];
  const UP = [0, 1, 0];
  const GOLD = Math.PI * (1 + Math.sqrt(5));

  // colours are linear-ish HDR multipliers; > 1 feeds the bloom
  const COL = {
    red: [1.0, 0.165, 0.165],
    hot: [1.9, 0.5, 0.42],
    white: [2.3, 1.85, 1.75],
    gray: [0.4, 0.4, 0.43],
  };

  /* ------------------------------------------------------------------ shaders */
  const POINT_VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner;
layout(location=1) in vec3 aPos;
layout(location=2) in vec4 aColor;
layout(location=3) in vec4 aParam;   // size, shape, aspect, min px
uniform mat4 uProj, uView, uModel;
uniform float uViewH, uDpr, uSize;
out vec2 vUV; out vec4 vColor; out float vPx; out float vAsp; flat out int vShape;
void main(){
  vec4 vp = uView * (uModel * vec4(aPos, 1.0));
  float depth = max(-vp.z, 0.05);
  float size = aParam.x * uSize;
  float px = size * uProj[1][1] * 0.5 * uViewH / depth;
  float minPx = aParam.w * uDpr;
  float k = 1.0, fade = 1.0;
  if (px < minPx) { k = minPx / max(px, 1e-4); fade = clamp(px / minPx, 0.0, 1.0); fade = max(fade * fade, 0.06); }
  vp.xy += aCorner * vec2(aParam.z, 1.0) * size * k;
  gl_Position = uProj * vp;
  if (vp.z > -0.05) gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
  vUV = aCorner;
  vColor = vec4(aColor.rgb, aColor.a * fade);
  vPx = px * k;
  vAsp = aParam.z;
  vShape = int(aParam.y + 0.5);
}`;

  const POINT_FS = `#version 300 es
precision highp float;
in vec2 vUV; in vec4 vColor; in float vPx; in float vAsp; flat in int vShape;
uniform float uAlpha;
out vec4 o;
float box(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main(){
  float px = 1.0 / max(vPx, 0.75);
  vec2 uv = vUV;
  float r = length(uv);
  float a;
  if (vShape == 0) {                         // soft glow
    a = exp(-r * r * 4.5) * (1.0 - smoothstep(0.7, 1.0, r));
  } else if (vShape <= 2) {                  // terminal glyph: 1 online, 2 offline
    float d = box(uv, vec2(0.62), 0.18);
    float w = max(0.07, px * 0.85);
    float stroke = 1.0 - smoothstep(w, w + px * 1.25, abs(d));
    float core = vShape == 1 ? 1.0 - smoothstep(0.25, 0.25 + px * 1.25, max(abs(uv.x), abs(uv.y))) : 0.0;
    float halo = exp(-max(d, 0.0) * 6.0) * (vShape == 1 ? 0.2 : 0.05);
    a = mix(exp(-r * r * 5.0), max(stroke * (vShape == 1 ? 0.85 : 0.75), core) + halo, smoothstep(2.5, 6.0, vPx));
  } else if (vShape == 3) {                  // ring
    float w = max(0.04, px * 0.8);
    a = 1.0 - smoothstep(w, w + px * 1.25, abs(r - 0.8));
    a += exp(-r * r * 3.0) * 0.1;
  } else if (vShape == 4 || vShape == 6) {   // inventory card: 4 online, 6 offline
    vec2 p = vec2(uv.x * vAsp, uv.y);
    float d = box(p, vec2(vAsp * 0.86, 0.72), 0.1);
    float w = max(0.045, px * 0.8);
    float stroke = 1.0 - smoothstep(w, w + px * 1.25, abs(d));
    float inner = 1.0 - smoothstep(0.0, px * 1.25, d);
    float bar = 1.0 - smoothstep(0.0, px * 1.25, box(p - vec2(-vAsp * 0.22, 0.0), vec2(vAsp * 0.38, 0.1), 0.02));
    float led = 1.0 - smoothstep(0.0, px * 1.25, length(p - vec2(vAsp * 0.55, 0.0)) - 0.13);
    a = vShape == 4 ? max(max(stroke, bar * 0.8), led) + inner * 0.12 : stroke * 0.8 + inner * 0.03;
    a = mix(exp(-r * r * 4.0), a, smoothstep(3.0, 7.0, vPx));
  } else {                                   // 5 flare
    float core = exp(-r * r * 10.0);
    float streak = exp(-abs(uv.y) * 28.0) * exp(-abs(uv.x) * 2.4) + exp(-abs(uv.x) * 28.0) * exp(-abs(uv.y) * 2.4);
    a = core + streak * 0.5;
  }
  o = vec4(vColor.rgb * (vColor.a * a * uAlpha), 0.0);
}`;

  const CURVE_VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 aVert;    // segment index, side
layout(location=1) in vec3 aP0;
layout(location=2) in vec3 aP1;
layout(location=3) in vec3 aP2;
layout(location=4) in vec4 aColor;
layout(location=5) in vec4 aStyle;   // type, width px, dash count, dash speed
layout(location=6) in vec4 aFlow;    // head out, head in, tail, gain
layout(location=7) in vec4 aExtra;   // arc start, arc span
uniform mat4 uVP;
uniform vec2 uViewport;
uniform float uSegs, uDpr;
out float vT; out float vEdge; out float vHalf; out float vFin; out vec4 vColor; out vec4 vStyle; out vec4 vFlow; out vec3 vWorld;
vec3 curve(float t, out vec3 tg){
  int type = int(aStyle.x + 0.5);
  if (type == 1) {
    float a = aExtra.x + t * aExtra.y;
    tg = (-sin(a) * aP1 + cos(a) * aP2) * aExtra.y;
    return aP0 + cos(a) * aP1 + sin(a) * aP2;
  }
  if (type == 2) { tg = aP2 - aP0; return mix(aP0, aP2, t); }
  float it = 1.0 - t;
  tg = 2.0 * it * (aP1 - aP0) + 2.0 * t * (aP2 - aP1);
  return it * it * aP0 + 2.0 * it * t * aP1 + t * t * aP2;
}
void main(){
  float t = aVert.x / uSegs;
  vec3 tg;
  vec3 p = curve(t, tg);
  vec4 c0 = uVP * vec4(p, 1.0);
  float tl = length(tg);
  vec4 c1 = uVP * vec4(p + (tl > 1e-6 ? tg / tl : vec3(1.0, 0.0, 0.0)) * 0.01, 1.0);
  vec2 h = uViewport * 0.5;
  vec2 d = c1.xy / c1.w * h - c0.xy / c0.w * h;
  float dl = length(d);
  vec2 dir = dl > 1e-6 ? d / dl : vec2(1.0, 0.0);
  vec2 n = vec2(-dir.y, dir.x);
  float hw = aStyle.y * uDpr * 0.5;
  float ext = max(hw, 0.5) + 1.0;
  c0.xy += n * (aVert.y * ext) / h * c0.w;
  gl_Position = c0.w < 0.05 ? vec4(0.0, 0.0, 2.0, 1.0) : c0;
  vT = t; vEdge = aVert.y * ext; vHalf = hw; vFin = aExtra.z;
  vColor = aColor; vStyle = aStyle; vFlow = aFlow; vWorld = p;
}`;

  const CURVE_FS = `#version 300 es
precision highp float;
in float vT; in float vEdge; in float vHalf; in float vFin; in vec4 vColor; in vec4 vStyle; in vec4 vFlow; in vec3 vWorld;
uniform float uTime, uAlpha, uFade;
out vec4 o;
void main(){
  float hw = max(vHalf, 0.5);
  float cover = (1.0 - smoothstep(hw - 0.5, hw + 0.75, abs(vEdge))) * min(vHalf / 0.5, 1.0);
  float base = vColor.a;
  if (vStyle.z > 0.5) {
    float x = fract((vT - uTime * vStyle.w) * vStyle.z);
    base *= smoothstep(0.0, 0.12, x) * (1.0 - smoothstep(0.42, 0.56, x));
  }
  float glow = 0.0;
  if (vFlow.x >= 0.0) { float d = vFlow.x - vT; glow += d >= 0.0 ? exp(-d / vFlow.z) : exp(d * 90.0); }
  if (vFlow.y >= 0.0) { float d = vT - vFlow.y; glow += (d >= 0.0 ? exp(-d / vFlow.z) : exp(d * 90.0)) * 0.75; }
  float k = base + glow * vFlow.w;
  if (vFin > 0.0) k *= smoothstep(0.0, vFin, vT);
  if (uFade > 0.0) k *= 1.0 - smoothstep(uFade * 0.5, uFade, length(vWorld.xz));
  o = vec4(vColor.rgb * (k * cover * uAlpha), 0.0);
}`;

  const BAR_VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner;
layout(location=1) in vec3 aCenter;
layout(location=2) in vec3 aAxis;
layout(location=3) in vec3 aUpv;
layout(location=4) in vec4 aColor;
layout(location=5) in vec4 aStyle;   // fill, edge
uniform mat4 uVP;
out vec2 vUV; out vec4 vColor; out vec4 vStyle;
void main(){
  gl_Position = uVP * vec4(aCenter + aAxis * aCorner.x + aUpv * aCorner.y, 1.0);
  vUV = aCorner; vColor = aColor; vStyle = aStyle;
}`;

  const BAR_FS = `#version 300 es
precision highp float;
in vec2 vUV; in vec4 vColor; in vec4 vStyle;
uniform float uAlpha;
out vec4 o;
void main(){
  vec2 fw = max(fwidth(vUV), vec2(1e-4));
  vec2 e = (1.0 - abs(vUV)) / fw;
  float m = min(e.x, e.y);
  float inside = clamp(m + 0.5, 0.0, 1.0);
  float border = 1.0 - smoothstep(0.6, 1.8, m);
  o = vec4(vColor.rgb * (vColor.a * (vStyle.x + border * vStyle.y) * inside * uAlpha), 0.0);
}`;

  /* ------------------------------------------------------------------ choreography */
  // camera per stage: target, yaw/pitch (rad), distance, fov (deg), image offset (NDC)
  const CAMS = [
    { t: [0, -0.15, 0], yaw: -0.2, pitch: 0.3, dist: 13.4, fov: 36, ox: 0.36, oy: 0.0 },
    { t: [0, 0.3, 0], yaw: 0.35, pitch: 0.1, dist: 11.8, fov: 36, ox: 0.23, oy: 0.0 },
    { t: [0, 0, 0], yaw: 0.85, pitch: 0.3, dist: 13.2, fov: 36, ox: 0.31, oy: 0.0 },
    { t: [0, -0.3, 0], yaw: 1.35, pitch: 0.62, dist: 15.4, fov: 36, ox: 0.25, oy: 0.0 },
    { t: [0, -0.8, 0], yaw: 1.85, pitch: 0.46, dist: 14.6, fov: 36, ox: 0.28, oy: 0.0 },
    { t: null, yaw: 2.45, pitch: 0.14, dist: 7.9, fov: 36, ox: 0.3, oy: 0.08 },
    { t: [0, 1.15, 0], yaw: 3.0, pitch: 0.12, dist: 10.6, fov: 36, ox: 0.08, oy: 0.0 },
    { t: [0, 1.0, 0], yaw: 3.55, pitch: 0.32, dist: 9.8, fov: 36, ox: 0.08, oy: 0.0 },
    { t: [0, 0, 0], yaw: 4.25, pitch: 0.42, dist: 17.0, fov: 36, ox: 0.0, oy: -0.34 },
  ];
  const CORE_SCALE = [1.0, 0.7, 0.8, 0.7, 0.74, 0.55, 0.46, 0.46, 1.0];
  const CORE_Y = [0, 0, 0, 0, 0, 0, -1.08, -1.08, 0];
  const FLOOR_A = [0.45, 0.28, 0.32, 0.55, 0.9, 0.3, 0.6, 0.6, 0.55];
  const BLOOM_K = [0.85, 0.8, 0.85, 0.82, 0.9, 0.9, 0.85, 0.9, 0.9];

  // the whitelist gate sits on a line that runs left-to-right and into depth for camera 5
  const GATE = (function () {
    const y = CAMS[5].yaw, a = 0.8;
    const gx = Math.cos(y) * Math.cos(a) - Math.sin(y) * Math.sin(a);
    const gz = -Math.sin(y) * Math.cos(a) - Math.cos(y) * Math.sin(a);
    const l = Math.hypot(gx, gz);
    const g = [gx / l, 0, gz / l];
    return {
      g,
      v: [-g[2], 0, g[0]],
      center: [g[0] * 2.3, 0, g[2] * 2.3],
      term: [g[0] * 4.7, 0, g[2] * 4.7],
      uGate: 2.3 / 4.7,
      R: 1.3,
    };
  })();
  CAMS[5].t = GATE.center;

  const WALL_COLS = 30, WALL_ROWS = 12, WALL_R = 5.4, WALL_SPAN = 1.5;
  const WALL_Y = 0.35, WALL_DY = 0.3;
  const CL_R = 3.9;
  const HB_PERIOD = 2.8;
  const FLIGHT = 0.9;
  const HERO_ARCS = F.onlineIdx.filter((_, j) => j % 8 === 3);

  // gate script timing (seconds after an event starts)
  const G_OUT = 0.7, G_CHECK = 0.34, G_IN = 0.7, G_HOLD = 0.3, G_BACK = 1.05;
  const G_DECIDE = G_OUT + 0.2;

  const ICO = (function () {
    const p = (1 + Math.sqrt(5)) / 2;
    const v = [[-1, p, 0], [1, p, 0], [-1, -p, 0], [1, -p, 0], [0, -1, p], [0, 1, p], [0, -1, -p], [0, 1, -p], [p, 0, -1], [p, 0, 1], [-p, 0, -1], [-p, 0, 1]];
    const edges = [];
    for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) {
      if (Math.abs(Math.hypot(v[i][0] - v[j][0], v[i][1] - v[j][1], v[i][2] - v[j][2]) - 2) < 1e-6) edges.push(i, j);
    }
    const l = Math.hypot(1, p);
    return { v: v.map((a) => a.map((c) => c / l)), edges };
  })();

  /* ------------------------------------------------------------------ instance writers */
  function point(b, x, y, z, r, g, bl, a, size, shape, asp, minPx) {
    if (b.count >= b.max) return;
    const d = b.data, o = b.count++ * 11;
    d[o] = x; d[o + 1] = y; d[o + 2] = z;
    d[o + 3] = r; d[o + 4] = g; d[o + 5] = bl; d[o + 6] = a;
    d[o + 7] = size; d[o + 8] = shape; d[o + 9] = asp; d[o + 10] = minPx;
  }
  // fin: fade the first `fin` of the curve in (keeps converging arcs from saturating at the source)
  function curve(b, type, x0, y0, z0, x1, y1, z1, x2, y2, z2, col, inten, width, dashN, dashV, hA, hB, tail, gain, a0, span, fin) {
    if (b.count >= b.max) return;
    const d = b.data, o = b.count++ * 25;
    d[o] = x0; d[o + 1] = y0; d[o + 2] = z0;
    d[o + 3] = x1; d[o + 4] = y1; d[o + 5] = z1;
    d[o + 6] = x2; d[o + 7] = y2; d[o + 8] = z2;
    d[o + 9] = col[0]; d[o + 10] = col[1]; d[o + 11] = col[2]; d[o + 12] = inten;
    d[o + 13] = type; d[o + 14] = width; d[o + 15] = dashN; d[o + 16] = dashV;
    d[o + 17] = hA; d[o + 18] = hB; d[o + 19] = tail; d[o + 20] = gain;
    d[o + 21] = a0; d[o + 22] = span; d[o + 23] = fin || 0; d[o + 24] = 0;
  }
  function bezier(b, x0, y0, z0, x1, y1, z1, x2, y2, z2, col, inten, width, hA, hB, tail, gain, fin) {
    curve(b, 0, x0, y0, z0, x1, y1, z1, x2, y2, z2, col, inten, width, 0, 0, hA, hB, tail, gain, 0, 1, fin);
  }
  // circle: centre + two radius-scaled axes; angle a0..a0+span
  function circle(b, cx, cy, cz, ux, uy, uz, vx, vy, vz, col, inten, width, dashN, dashV, a0, span) {
    curve(b, 1, cx, cy, cz, ux, uy, uz, vx, vy, vz, col, inten, width, dashN, dashV, -1, -1, 0.1, 0, a0, span);
  }
  function segment(b, x0, y0, z0, x1, y1, z1, col, inten, width, dashN, dashV, hA, hB, tail, gain) {
    curve(b, 2, x0, y0, z0, 0, 0, 0, x1, y1, z1, col, inten, width, dashN, dashV, hA, hB, tail, gain, 0, 1);
  }
  // ring tilted by `incl` around x, then precessed by `node` around y
  function ring(b, cx, cy, cz, r, incl, node, col, inten, width, dashN, dashV) {
    const cn = Math.cos(node), sn = Math.sin(node), ci = Math.cos(incl), si = Math.sin(incl);
    circle(b, cx, cy, cz, cn * r, 0, -sn * r, ci * sn * r, -si * r, ci * cn * r, col, inten, width, dashN, dashV, 0, TAU);
  }
  function bar(b, x, y, z, ax, ay, az, ux, uy, uz, col, inten, fill, edge) {
    if (b.count >= b.max) return;
    const d = b.data, o = b.count++ * 17;
    d[o] = x; d[o + 1] = y; d[o + 2] = z;
    d[o + 3] = ax; d[o + 4] = ay; d[o + 5] = az;
    d[o + 6] = ux; d[o + 7] = uy; d[o + 8] = uz;
    d[o + 9] = col[0]; d[o + 10] = col[1]; d[o + 11] = col[2]; d[o + 12] = inten;
    d[o + 13] = fill; d[o + 14] = edge; d[o + 15] = 0; d[o + 16] = 0;
  }
  function bezAt(t, x0, y0, z0, x1, y1, z1, x2, y2, z2, o) {
    const it = 1 - t, a = it * it, b = 2 * it * t, c = t * t;
    o[0] = a * x0 + b * x1 + c * x2;
    o[1] = a * y0 + b * y1 + c * y2;
    o[2] = a * z0 + b * z1 + c * z2;
    return o;
  }
  function mix3(a, b, t, o) {
    o[0] = lerp(a[0], b[0], t); o[1] = lerp(a[1], b[1], t); o[2] = lerp(a[2], b[2], t);
    return o;
  }
  function stageLerp(arr, s) {
    const k = Math.min(Math.floor(s), arr.length - 2);
    return lerp(arr[k], arr[k + 1], smooth(0, 1, clamp(s - k, 0, 1)));
  }

  /* ------------------------------------------------------------------ formations */
  function formDisc(T, t, o, sc) {
    const r0 = 1.95, r1 = 4.25;
    const r = Math.sqrt(r0 * r0 + (r1 * r1 - r0 * r0) * T.h1);
    const arm = (T.i & 1) * Math.PI;
    const th0 = T.h4 < 0.6 ? arm + (r - r0) * 1.05 + (T.h2 - 0.5) * 0.9 : T.h2 * TAU;
    const th = th0 + 0.11 * Math.pow(r0 / r, 1.3) * t;
    const y = (T.h3 - 0.5) * 0.16 * (r / 3);
    const x = Math.cos(th) * r, z = Math.sin(th) * r;
    const c = Math.cos(0.16), s = Math.sin(0.16);
    o[0] = x * sc; o[1] = (y * c - z * s) * sc; o[2] = (y * s + z * c) * sc;
  }
  // column 0 sits on the viewer's left for camera 1
  function wallAngle(col) {
    return CAMS[1].yaw + Math.PI - (col / (WALL_COLS - 1) - 0.5) * WALL_SPAN;
  }
  function formWall(T, o) {
    const col = Math.floor(T.i / WALL_ROWS), row = T.i % WALL_ROWS;
    const a = wallAngle(col);
    o[0] = Math.sin(a) * WALL_R;
    o[1] = WALL_Y + ((WALL_ROWS - 1) / 2 - row) * WALL_DY;
    o[2] = Math.cos(a) * WALL_R;
  }
  const sphereR = (T) => 2.45 + T.h1 * 0.7;
  function formSphere(T, t, o) {
    const k = T.i + 0.5;
    const phi = Math.acos(1 - (2 * k) / N), th = GOLD * k + t * 0.08;
    const r = sphereR(T);
    o[0] = Math.sin(phi) * Math.cos(th) * r;
    o[1] = Math.cos(phi) * r;
    o[2] = Math.sin(phi) * Math.sin(th) * r;
  }
  function clusterCenter(p, t, o) {
    const a = (p / 6) * TAU + 0.4 + t * 0.03;
    o[0] = Math.cos(a) * CL_R;
    o[1] = p % 2 ? 0.3 : -0.3;
    o[2] = Math.sin(a) * CL_R;
    return o;
  }
  const clusterRadius = (p) => 0.2 + 0.062 * Math.sqrt(F.PROJECTS[p].count);
  function formCluster(T, t, o) {
    clusterCenter(T.project, t, o);
    const k = T.j + 0.5, phi = Math.acos(1 - (2 * k) / T.n), th = GOLD * k + t * 0.3;
    const r = clusterRadius(T.project) * (0.82 + 0.18 * T.h1);
    o[0] += Math.sin(phi) * Math.cos(th) * r;
    o[1] += Math.cos(phi) * r;
    o[2] += Math.sin(phi) * Math.sin(th) * r;
  }
  function formField(T, t, o) {
    const sec = TAU / 6;
    const a = T.project * sec + 0.4 + (T.h2 - 0.5) * sec * 0.8 + t * 0.018;
    const r = 2.5 + Math.sqrt(T.h1) * 3.6;
    o[0] = Math.cos(a) * r;
    o[1] = FLOOR_Y + 0.04;
    o[2] = Math.sin(a) * r;
  }
  function formGate(T, t, o) {
    if (T.i === F.SEL) {
      o[0] = GATE.term[0]; o[1] = GATE.term[1]; o[2] = GATE.term[2];
      return;
    }
    const a = CAMS[5].yaw + Math.PI + (T.h2 - 0.5) * 2.4 + t * 0.01;
    const R = 10 + T.h1 * 4;
    o[0] = GATE.center[0] + Math.sin(a) * R;
    o[1] = -1.4 + T.h3 * 4.2;
    o[2] = GATE.center[2] + Math.cos(a) * R;
  }
  function formRing(T, t, o) {
    const a = (T.i / N) * TAU + t * 0.035;
    const r = 3.5 + T.h1 * 1.0;
    o[0] = Math.cos(a) * r;
    o[1] = FLOOR_Y + 0.04;
    o[2] = Math.sin(a) * r;
  }
  // interpolate around the y axis so nodes swirl into their new places
  function blendCyl(a, b, e, o, lift) {
    const ra = Math.hypot(a[0], a[2]), rb = Math.hypot(b[0], b[2]);
    const ta = Math.atan2(a[2], a[0]), tb = Math.atan2(b[2], b[0]);
    let d = tb - ta;
    d = ((((d + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
    const r = lerp(ra, rb, e), th = ta + d * e;
    o[0] = Math.cos(th) * r;
    o[1] = lerp(a[1], b[1], e) + Math.sin(e * Math.PI) * lift;
    o[2] = Math.sin(th) * r;
  }

  const heroCycle = (T, t) => {
    const per = 3.6 + T.h2 * 2.4;
    return fract(t / per + T.h3) * per;
  };
  const chanPhase = (T, t) => fract(t * 0.3 + T.h4) * 1.4;
  const scanU = (t) => fract(t / 4.4) * 1.36 - 0.18;

  /* ------------------------------------------------------------------ world */
  function World(canvas, opts) {
    const gl = canvas.getContext('webgl2', {
      antialias: false, alpha: false, depth: false, stencil: false,
      premultipliedAlpha: false, powerPreference: 'default',
    });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;
    this.canvas = canvas;
    this.reduced = !!(opts && opts.reduced);
    this.post = new GLU.Post(gl);
    this.pPoint = GLU.program(gl, POINT_VS, POINT_FS);
    this.pCurve = GLU.program(gl, CURVE_VS, CURVE_FS);
    this.pBar = GLU.program(gl, BAR_VS, BAR_FS);

    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const strip = new Float32Array((MAXSEG + 1) * 4);
    for (let i = 0; i <= MAXSEG; i++) strip.set([i, -1, i, 1], i * 4);
    const PT = [3, 4, 4], CV = [3, 3, 3, 4, 4, 4, 4], BR = [3, 3, 3, 4, 4];
    this.bPts = new GLU.Batch(gl, quad, 2, PT, 2400);
    this.bDust = new GLU.Batch(gl, quad, 2, PT, DUST_N);
    this.bNuc = [0, 1, 2].map(() => new GLU.Batch(gl, quad, 2, PT, NUC_N));
    this.bArc = new GLU.Batch(gl, strip, 2, CV, 900);
    this.bRing = new GLU.Batch(gl, strip, 2, CV, 200);
    this.bLine = new GLU.Batch(gl, strip, 2, CV, 300);
    this.bGrid = new GLU.Batch(gl, strip, 2, CV, 16);
    this.bSpoke = new GLU.Batch(gl, strip, 2, CV, 32);
    this.bBar = new GLU.Batch(gl, quad, 2, BR, LEDGER_N + 8);

    this.view = mat4.create();
    this.proj = mat4.create();
    this.vp = mat4.create();
    this.model = mat4.create();
    this.ident = mat4.create();
    this.eye = [0, 0, 10];
    this.target = [0, 0, 0];
    this.right = [1, 0, 0];
    this.up = [0, 1, 0];
    this.W = new Float32Array(9);
    this.pos = new Float32Array(N * 3);
    this.scr = new Float32Array(N * 3);
    this.vis = new Float32Array(N);
    this.flash = new Float32Array(N);
    this.far = new Float32Array(N * 3);
    this.clusterHL = new Float32Array(F.PROJECTS.length);
    this._A = [0, 0, 0]; this._B = [0, 0, 0]; this._P = [0, 0, 0];
    this._v = [0, 0, 0]; this._w = [0, 0, 0]; this._c = [0, 0, 0];
    this._SA = new Float32Array(8); this._SB = new Float32Array(8);
    this.time = 0; this.t0 = -1; this.s = 0; this.k = 0; this.f = 0; this.intro = 1;
    this.coreScale = 1; this.coreY = 0;
    this.ptr = { sx: 0, sy: 0, x: 0, y: 0, in: false };
    this.hover = -1;
    // terminal picked on the inventory wall; selShown lingers while the highlight fades out
    this.sel = -1; this.selShown = -1; this.selAmt = 0; this.selT = -10;
    this.selCol = -1; this.selRow = -1;
    this.w = 1; this.h = 1; this.dpr = 1; this.scale = 1;
    this.gateEv = [];
    this.info = {
      scanU: 0,
      gate: { slots: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], active: -1, activeAmt: 0, reject: 0, log: [], center: GATE.center, term: GATE.term },
      ledger: [],
      matched: [],
      ledgerTop: 0,
    };
    this.buildStatic();
  }

  World.prototype.buildStatic = function () {
    const R = M.rng(20261025);
    const d = this.bDust;
    for (let i = 0; i < DUST_N; i++) {
      const u = R() * 2 - 1, a = R() * TAU, s = Math.sqrt(1 - u * u);
      const r = 7 + Math.pow(R(), 0.8) * 24;
      const br = 0.05 + R() * 0.17;
      const red = R() < 0.25;
      point(d, s * Math.cos(a) * r, u * r * 0.6, s * Math.sin(a) * r,
        red ? br * 1.5 : br, red ? br * 0.22 : br, red ? br * 0.22 : br * 1.05, 1,
        0.025 + R() * 0.05, 0, 1, 1.1);
    }
    d.upload();
    for (let l = 0; l < 3; l++) {
      const b = this.bNuc[l];
      for (let i = 0; i < NUC_N; i++) {
        const k = i + 0.5, phi = Math.acos(1 - (2 * k) / NUC_N), th = GOLD * k + l;
        const rr = 0.78 + R() * 0.22 + l * 0.04;
        const br = 0.3 + Math.pow(R(), 2) * 0.7;
        point(b, Math.sin(phi) * Math.cos(th) * rr, Math.cos(phi) * rr, Math.sin(phi) * Math.sin(th) * rr,
          0.9 * br, 0.14 * br, 0.12 * br, 1, 0.022 + R() * 0.02, 0, 1, 1.0);
      }
      b.upload();
    }
    const g = this.bGrid;
    for (let i = 0; i < 9; i++) {
      const r = 1.5 + i;
      circle(g, 0, FLOOR_Y, 0, 0, 0, r, r, 0, 0, COL.red, i % 2 ? 0.12 : 0.2, 1.0, i % 2 ? 160 : 0, 0, 0, TAU);
    }
    g.upload();
    const sp = this.bSpoke;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TAU, c = Math.cos(a), s = Math.sin(a);
      segment(sp, c * 1.2, FLOOR_Y, s * 1.2, c * 9.5, FLOOR_Y, s * 9.5, COL.gray, 0.07, 1.0, 0, 0, -1, -1, 0.1, 0);
    }
    sp.upload();
    for (let i = 0; i < N; i++) {
      const T = TERMS[i];
      const u = T.h1 * 2 - 1, a = T.h2 * TAU, s = Math.sqrt(1 - u * u), r = 15 + T.h3 * 10;
      this.far[i * 3] = s * Math.cos(a) * r;
      this.far[i * 3 + 1] = u * r * 0.5;
      this.far[i * 3 + 2] = s * Math.sin(a) * r;
    }
  };

  // 3D renders at most 1.5x; every primitive has analytic AA, so MSAA is only worth it near 1x
  World.prototype.resize = function (w, h, dpr) {
    dpr = Math.min(dpr, 1.5);
    this.w = w; this.h = h; this.dpr = dpr;
    this.post.samples = this.scale === 1 && dpr <= 1.25 ? this.post.maxSamples : 0;
    const cw = Math.max(1, Math.round(w * dpr * this.scale));
    const ch = Math.max(1, Math.round(h * dpr * this.scale));
    this.canvas.width = cw;
    this.canvas.height = ch;
    this.post.resize(cw, ch, cw, ch);
    this.updateCamera(this.time);
    this.projectTerminals();
  };

  World.prototype.setScale = function (s) {
    if (s === this.scale) return;
    this.scale = s;
    this.resize(this.w, this.h, this.dpr);
  };

  /* ------------------------------------------------------------------ per-frame update */
  World.prototype.update = function (now, dt, s, ptr) {
    if (this.t0 < 0) this.t0 = now;
    const t = (this.time = (now - this.t0) * (this.reduced ? 0.4 : 1));
    this.s = s;
    this.k = Math.min(Math.floor(s), 7);
    this.f = clamp(s - this.k, 0, 1);
    for (let j = 0; j < 9; j++) {
      const d = Math.abs(s - j);
      this.W[j] = d >= 1 ? 0 : smooth(0, 1, 1 - d);
    }
    this.intro = this.reduced ? 1 : clamp(t / 2.6, 0, 1);
    this.selAmt = M.damp(this.selAmt, this.sel >= 0 ? 1 : 0, 8, dt);
    if (this.sel >= 0) this.selShown = this.sel;
    else if (this.selAmt < 0.01) this.selShown = -1;
    if (this.selShown >= 0) {
      this.selCol = Math.floor(this.selShown / WALL_ROWS);
      this.selRow = this.selShown % WALL_ROWS;
    }
    const p = this.ptr;
    p.in = ptr.in; p.x = ptr.x; p.y = ptr.y;
    p.sx = M.damp(p.sx, ptr.in ? ptr.nx : 0, 2.2, dt);
    p.sy = M.damp(p.sy, ptr.in ? ptr.ny : 0, 2.2, dt);

    this.updateCamera(t);
    const ci = this.reduced ? 1 : easeOutBack(clamp((t - 0.1) / 1.0, 0, 1));
    this.coreScale = stageLerp(CORE_SCALE, s) * ci;
    this.coreY = stageLerp(CORE_Y, s);

    this.bPts.count = this.bArc.count = this.bRing.count = this.bLine.count = this.bBar.count = 0;
    this.gateState(t);
    this.computeFlashes(t);
    this.updateTerminals(t);
    this.updateCore(t);
    this.updateHeroArcs(t);
    this.updateWall(t);
    this.updateOnline(t);
    this.updateProjects(t);
    this.updateChannels(t);
    this.updateGate(t);
    this.updateLedger(t);
    this.projectTerminals();
  };

  World.prototype.updateCamera = function (t) {
    const k = this.k, e = smooth(0, 1, this.f);
    const A = CAMS[k], B = CAMS[k + 1];
    const T = this.target;
    for (let i = 0; i < 3; i++) T[i] = lerp(A.t[i], B.t[i], e);
    let yaw = lerp(A.yaw, B.yaw, e), pitch = lerp(A.pitch, B.pitch, e), dist = lerp(A.dist, B.dist, e);
    let fov = lerp(A.fov, B.fov, e), ox = lerp(A.ox, B.ox, e), oy = lerp(A.oy, B.oy, e);
    if (!this.reduced) {
      yaw += Math.sin(t * 0.13) * 0.035;
      pitch += Math.sin(t * 0.17 + 1.3) * 0.016;
    }
    yaw += this.ptr.sx * 0.07;
    pitch += this.ptr.sy * 0.04;
    dist *= 1 + (1 - easeOut(this.intro)) * 0.4;
    const asp = this.w / this.h;
    if (asp < 0.9) {
      ox = 0;
      oy = 0.24;
      fov = 46;
      // the diagnostics line is wide, so portrait screens step back further for it
      dist *= (1 + (0.9 - asp) * 1.1) * (1 + this.W[5] * 0.3);
    } else if (asp < 1.3) {
      ox *= 0.55;
      dist *= 1.1;
    }
    const cp = Math.cos(pitch);
    this.eye[0] = T[0] + dist * cp * Math.sin(yaw);
    this.eye[1] = T[1] + dist * Math.sin(pitch);
    this.eye[2] = T[2] + dist * cp * Math.cos(yaw);
    mat4.lookAt(this.view, this.eye, T, UP);
    mat4.perspective(this.proj, (fov * Math.PI) / 180, asp, 0.1, 200, ox, oy);
    mat4.multiply(this.vp, this.proj, this.view);
    const v = this.view;
    this.right[0] = v[0]; this.right[1] = v[4]; this.right[2] = v[8];
    this.up[0] = v[1]; this.up[1] = v[5]; this.up[2] = v[9];
  };

  // evaluate the looping whitelist script once per frame (positions, flashes, log)
  World.prototype.gateState = function (t) {
    const per = F.GATE_PERIOD, loop = Math.floor(t / per), lt = t - loop * per;
    const evs = this.gateEv;
    evs.length = 0;
    const log = this.info.gate.log;
    log.length = 0;
    for (let L = 0; L <= 2; L++) {
      for (let j = 0; j < F.GATE_EVENTS.length; j++) {
        const ev = F.GATE_EVENTS[j];
        const tau = lt - ev.t0 + L * per;
        const abs = (loop - L) * per + ev.t0;
        if (tau >= G_DECIDE) {
          log.push({ at: abs + G_DECIDE, age: tau - G_DECIDE, actor: ev.actor, prog: ev.prog, ok: ev.prog >= 0, time: F.clock(F.CLOCK0 + 3600 + abs + G_DECIDE) });
        }
        if (tau >= 0 && tau <= G_OUT + G_CHECK + G_IN + G_HOLD + G_BACK + 0.2) evs.push({ ev, tau });
      }
    }
    log.sort((a, b) => b.at - a.at);
    log.length = Math.min(log.length, 4);
  };

  World.prototype.computeFlashes = function (t) {
    const fl = this.flash, W = this.W;
    fl.fill(0);
    const wh = Math.min(1, W[0] + W[8]);
    if (wh > 0) {
      for (let j = 0; j < HERO_ARCS.length; j++) {
        const i = HERO_ARCS[j];
        const u = heroCycle(TERMS[i], t);
        if (u >= 0.9 && u < 2.0) fl[i] += Math.exp(-(u - 0.9) * 4.5) * wh;
      }
    }
    if (W[4] > 0) {
      const ids = F.onlineIdx;
      for (let j = 0; j < ids.length; j++) {
        const ph = chanPhase(TERMS[ids[j]], t);
        if (ph >= 1) fl[ids[j]] += Math.exp(-(ph - 1) * 10) * W[4] * 0.9;
      }
    }
    if (W[5] > 0) {
      for (const g of this.gateEv) {
        const land = G_OUT + G_CHECK + G_IN;
        if (g.ev.prog >= 0 && g.tau >= land) fl[F.SEL] += Math.exp(-(g.tau - land) * 3.5) * W[5] * 1.4;
      }
    }
    const wl = Math.min(1, W[6] + W[7]);
    if (wl > 0) {
      const DT = F.RECORD_DT, k0 = Math.floor(t / DT);
      for (let k = k0 + 1; k <= k0 + 3; k++) {
        const u = t - (k * DT - FLIGHT);
        if (u >= 0 && u < FLIGHT) fl[F.record(k).term] += Math.exp(-u * 4) * wl * 1.2;
      }
    }
    if (this.sel >= 0 && W[1] > 0) fl[this.sel] += Math.exp(-(t - this.selT) * 5) * 1.4 * W[1];
  };

  World.prototype.form = function (k, T, t, o) {
    switch (k) {
      case 0: return formDisc(T, t, o, 1);
      case 1: return formWall(T, o);
      case 2: return formSphere(T, t, o);
      case 3: return formCluster(T, t, o);
      case 4: return formField(T, t, o);
      case 5: return formGate(T, t, o);
      case 6:
      case 7: return formRing(T, t, o);
      default: return formDisc(T, t, o, 1.18);
    }
  };

  // style -> S = [r, g, b, alpha, size, shape, aspect, brightness]
  World.prototype.styleOf = function (k, T, t, S) {
    const on = T.online;
    let base = on ? COL.red : COL.gray, inten = 1, size = 0.037, shape = on ? 1 : 2, asp = 1;
    switch (k) {
      case 1: {
        size = 0.074; asp = 1.3; shape = on ? 4 : 6;
        const col = Math.floor(T.i / WALL_ROWS) / (WALL_COLS - 1);
        const d = (col - scanU(t)) * 10;
        const sc = Math.exp(-d * d);
        inten = (on ? 0.5 : 0.42) + sc * 1.1;
        if (this.selShown >= 0) {
          // picked card glows; its row and column stay lit, the rest of the wall steps back
          const sa = this.selAmt;
          if (T.i === this.selShown) {
            if (on) base = COL.white;
            inten = lerp(inten, on ? 0.95 : 1.5, sa);
            size *= 1 + 0.75 * sa;
          } else {
            const line = Math.floor(T.i / WALL_ROWS) === this.selCol || T.i % WALL_ROWS === this.selRow;
            inten *= 1 - 0.55 * sa + (line ? 0.5 * sa : 0);
          }
        }
        break;
      }
      case 2: {
        if (on) {
          const ping = Math.exp(-fract(t * 0.42 + T.h4) * 9);
          inten = 0.42 + ping * 0.9 + this.waveAt(T, t) * 1.2;
        } else {
          inten = 0.38 + 0.1 * Math.sin(t * 3 + T.h1 * 6);
        }
        break;
      }
      case 3: {
        const hl = this.clusterHL[T.project];
        inten = on ? 0.45 + hl * 0.8 : 0.38;
        size = 0.037 + hl * 0.008;
        break;
      }
      case 4:
        size = 0.034;
        inten = on ? 0.45 : 0.28;
        break;
      case 5:
        if (T.i === F.SEL) { base = COL.white; inten = 0.7; size = 0.11; shape = 1; }
        else { inten = 0.16; size = 0.04; }
        break;
      case 6:
      case 7:
        inten = on ? 0.24 : 0.18;
        size = 0.032;
        break;
      default: {
        const tw = 0.82 + 0.18 * Math.sin(t * 1.6 + T.h4 * TAU);
        inten = on ? 0.72 * tw : 0.42;
      }
    }
    S[0] = base[0] * inten; S[1] = base[1] * inten; S[2] = base[2] * inten;
    S[3] = 1; S[4] = size; S[5] = shape; S[6] = asp; S[7] = inten;
  };

  World.prototype.waveAt = function (T, t) {
    const r = sphereR(T);
    let v = 0;
    for (let j = 0; j < 2; j++) {
      const ph = fract(t / HB_PERIOD + j * 0.5);
      const R = 0.6 + ph * 4.4;
      const d = (r - R) / 0.3;
      v = Math.max(v, Math.exp(-d * d) * (1 - ph));
    }
    return v;
  };

  World.prototype.updateTerminals = function (t) {
    const k = this.k, f = this.f, A = this._A, B = this._B, P = this._P, SA = this._SA, SB = this._SB;
    const intro = this.intro, fl = this.flash, b = this.bPts, W = COL.white;
    const lift = k === 3 || k === 4 ? 1.1 : 0.7;
    for (let i = 0; i < N; i++) {
      const T = TERMS[i];
      this.form(k, T, t, A);
      this.form(k + 1, T, t, B);
      const e = smooth(0, 1, (f - T.delay * 0.42) / 0.58);
      blendCyl(A, B, e, P, lift * (T.h3 - 0.35));
      let a = 1;
      if (intro < 1) {
        const ie = easeOut(clamp(intro * 1.55 - T.delay * 0.55, 0, 1));
        P[0] = lerp(this.far[i * 3], P[0], ie);
        P[1] = lerp(this.far[i * 3 + 1], P[1], ie);
        P[2] = lerp(this.far[i * 3 + 2], P[2], ie);
        a = clamp(intro * 3 - T.delay, 0, 1);
      }
      if (i === this.selShown && this.selAmt > 0.001) {
        // the picked card slides out of the wall towards the viewer
        const pull = 0.6 * this.selAmt * this.W[1];
        const ex = this.eye[0] - P[0], ey = this.eye[1] - P[1], ez = this.eye[2] - P[2];
        const l = Math.hypot(ex, ey, ez) || 1;
        P[0] += (ex / l) * pull; P[1] += (ey / l) * pull; P[2] += (ez / l) * pull;
      }
      this.pos[i * 3] = P[0]; this.pos[i * 3 + 1] = P[1]; this.pos[i * 3 + 2] = P[2];
      this.styleOf(k, T, t, SA);
      this.styleOf(k + 1, T, t, SB);
      const pick = e < 0.5 ? SA : SB;
      const fla = fl[i], hov = i === this.hover ? 1 : 0;
      const r = lerp(SA[0], SB[0], e) + W[0] * (fla * 0.55 + hov * 0.35);
      const g = lerp(SA[1], SB[1], e) + W[1] * (fla * 0.55 + hov * 0.35);
      const bl = lerp(SA[2], SB[2], e) + W[2] * (fla * 0.55 + hov * 0.35);
      const size = lerp(SA[4], SB[4], e) * (1 + hov * 0.6 + fla * 0.25);
      this.vis[i] = a * Math.min(1, lerp(SA[7], SB[7], e) * 1.2);
      point(b, P[0], P[1], P[2], r, g, bl, a, size, pick[5], pick[6], 2.0);
    }
  };

  World.prototype.updateCore = function (t) {
    const cs = this.coreScale, cy = this.coreY;
    if (cs <= 0.002) return;
    const b = this.bPts, R = COL.red;
    const beat = 0.86 + 0.14 * Math.sin(t * 2.2);
    point(b, 0, cy, 0, R[0], R[1], R[2], 0.06, 3.4 * cs, 0, 1, 0);
    point(b, 0, cy, 0, 1.2, 0.2, 0.17, 0.32 * beat, 1.0 * cs, 0, 1, 0);
    point(b, 0, cy, 0, 2.2, 1.3, 1.15, 0.42, 0.14 * cs, 0, 1, 0);

    const ay = t * 0.21, ax = 0.45 + t * 0.12;
    const cyy = Math.cos(ay), syy = Math.sin(ay), cxx = Math.cos(ax), sxx = Math.sin(ax);
    const r = 0.84 * cs, v = ICO.v, E = ICO.edges, tmp = this._ico || (this._ico = new Float32Array(36));
    for (let i = 0; i < 12; i++) {
      const x = v[i][0], y = v[i][1], z = v[i][2];
      const y1 = y * cxx - z * sxx, z1 = y * sxx + z * cxx;
      tmp[i * 3] = (x * cyy + z1 * syy) * r;
      tmp[i * 3 + 1] = y1 * r + cy;
      tmp[i * 3 + 2] = (-x * syy + z1 * cyy) * r;
    }
    for (let j = 0; j < E.length; j += 2) {
      const p = E[j] * 3, q = E[j + 1] * 3;
      segment(this.bLine, tmp[p], tmp[p + 1], tmp[p + 2], tmp[q], tmp[q + 1], tmp[q + 2], R, 0.5, 1.0, 0, 0, -1, -1, 0.1, 0);
    }
    for (let i = 0; i < 12; i++) point(b, tmp[i * 3], tmp[i * 3 + 1], tmp[i * 3 + 2], 1.5, 0.35, 0.3, 0.6, 0.03 * cs, 0, 1, 1.5);

    ring(this.bRing, 0, cy, 0, 1.12 * cs, 0.0, t * 0.05, R, 0.7, 1.2, 96, 0.012);
    ring(this.bRing, 0, cy, 0, 1.42 * cs, 1.15, t * 0.09 + 0.6, R, 0.32, 0.9, 0, 0);
    ring(this.bRing, 0, cy, 0, 1.72 * cs, -0.95, -t * 0.06 + 2.0, R, 0.42, 1.0, 14, -0.01);
  };

  World.prototype.updateHeroArcs = function (t) {
    const w = Math.min(1, this.W[0] + this.W[8]) * this.intro;
    if (w <= 0.001) return;
    const cy = this.coreY, P = this.pos, o = this._v;
    for (let j = 0; j < HERO_ARCS.length; j++) {
      const i = HERO_ARCS[j], T = TERMS[i];
      const u = heroCycle(T, t);
      if (u > 2.4) continue;
      const vis = smooth(0, 0.2, u) * (1 - smooth(1.9, 2.4, u)) * w;
      const hA = u < 0.9 ? easeInOut(u / 0.9) : -1;
      const hB = u > 1.2 && u < 2.2 ? 1 - easeInOut((u - 1.2) / 1.0) : -1;
      const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
      const d = Math.hypot(x, y - cy, z);
      const mx = x * 0.5, my = (y + cy) * 0.5 + 0.35 * d, mz = z * 0.5;
      bezier(this.bArc, 0, cy, 0, mx, my, mz, x, y, z, COL.red, 0.2 * vis, 1.1, hA, hB, 0.09, 2.4 * vis, 0.12);
      if (hA >= 0) {
        bezAt(hA, 0, cy, 0, mx, my, mz, x, y, z, o);
        point(this.bPts, o[0], o[1], o[2], COL.hot[0], COL.hot[1], COL.hot[2], 0.9 * vis, 0.06, 0, 1, 1.5);
      }
    }
  };

  World.prototype.updateWall = function (t) {
    const w = this.W[1];
    const u = (this.info.scanU = scanU(t));
    if (w <= 0.001) return;
    const R = WALL_R, e0 = wallAngle(0), e1 = wallAngle(WALL_COLS - 1);
    const a0 = Math.min(e0, e1) - 0.05, a1 = Math.max(e0, e1) + 0.05, dir = Math.sign(e1 - e0);
    const top = WALL_Y + ((WALL_ROWS - 1) / 2) * WALL_DY + 0.24, bot = WALL_Y - ((WALL_ROWS - 1) / 2) * WALL_DY - 0.24;
    circle(this.bRing, 0, top, 0, 0, 0, R, R, 0, 0, COL.red, 0.4 * w, 1.0, 0, 0, a0, a1 - a0);
    circle(this.bRing, 0, bot, 0, 0, 0, R, R, 0, 0, COL.red, 0.4 * w, 1.0, 0, 0, a0, a1 - a0);
    circle(this.bRing, 0, top + 0.1, 0, 0, 0, R, R, 0, 0, COL.red, 0.28 * w, 1.0, 140, 0, a0, a1 - a0);
    if (u > -0.06 && u < 1.06) {
      const a = wallAngle(clamp(u, 0, 1) * (WALL_COLS - 1));
      const fade = smooth(-0.06, 0.02, u) * (1 - smooth(0.98, 1.06, u)) * w;
      for (let j = 0; j < 4; j++) {
        const aj = a - dir * j * 0.014, rr = R + 0.06;
        const sx = Math.sin(aj) * rr, sz = Math.cos(aj) * rr;
        segment(this.bLine, sx, bot, sz, sx, top, sz, j ? COL.red : COL.hot, (j ? 0.35 / j : 1.0) * fade, j ? 1.0 : 1.6, 0, 0, -1, -1, 0.1, 0);
      }
      const sx = Math.sin(a) * (R + 0.06), sz = Math.cos(a) * (R + 0.06);
      point(this.bPts, sx, top, sz, COL.hot[0], COL.hot[1], COL.hot[2], 0.9 * fade, 0.12, 5, 1, 2);
      point(this.bPts, sx, bot, sz, COL.hot[0], COL.hot[1], COL.hot[2], 0.9 * fade, 0.12, 5, 1, 2);
    }

    const si = this.selShown, sa = this.selAmt * w;
    if (si >= 0 && sa > 0.002) {
      const P = this.pos, cy = this.coreY, rr = R + 0.03;
      const ya = WALL_Y + ((WALL_ROWS - 1) / 2 - this.selRow) * WALL_DY, ac = wallAngle(this.selCol);
      // crosshair along the picked card's row and column
      circle(this.bRing, 0, ya, 0, 0, 0, rr, rr, 0, 0, COL.red, 0.4 * sa, 1.0, 110, 0.02, a0, a1 - a0);
      segment(this.bLine, Math.sin(ac) * rr, bot, Math.cos(ac) * rr, Math.sin(ac) * rr, top, Math.cos(ac) * rr, COL.red, 0.4 * sa, 1.0, 36, 0.03, -1, -1, 0.1, 0);
      // its channel back to the core: live pulses when online, a broken line when not
      const x = P[si * 3], y = P[si * 3 + 1], z = P[si * 3 + 2];
      const d = Math.hypot(x, y - cy, z);
      const mx = x * 0.5, my = (y + cy) * 0.5 + 0.3 * d, mz = z * 0.5;
      if (TERMS[si].online) {
        bezier(this.bArc, 0, cy, 0, mx, my, mz, x, y, z, COL.red, 0.28 * sa, 1.4, fract(t * 0.55), 1 - fract(t * 0.55 + 0.5), 0.08, 2.2 * sa, 0.15);
      } else {
        curve(this.bArc, 0, 0, cy, 0, mx, my, mz, x, y, z, COL.gray, 0.4 * sa, 1.0, 28, 0, -1, -1, 0.1, 0, 0, 1, 0.15);
      }
      point(this.bPts, x, y, z, COL.red[0], COL.red[1], COL.red[2], 0.5 * sa, 0.32, 0, 1, 0);
    }
  };

  World.prototype.updateOnline = function (t) {
    const w = this.W[2];
    if (w <= 0.001) return;
    const cy = this.coreY, rt = this.right, up = this.up;
    for (let j = 0; j < 2; j++) {
      const ph = fract(t / HB_PERIOD + j * 0.5);
      const r = 0.6 + ph * 4.4;
      const a = Math.pow(1 - ph, 1.4) * smooth(0, 0.06, ph) * w;
      circle(this.bRing, 0, cy, 0, rt[0] * r, rt[1] * r, rt[2] * r, up[0] * r, up[1] * r, up[2] * r, COL.red, 0.8 * a, 1.6, 0, 0, 0, TAU);
      circle(this.bRing, 0, cy, 0, rt[0] * r * 0.97, rt[1] * r * 0.97, rt[2] * r * 0.97, up[0] * r * 0.97, up[1] * r * 0.97, up[2] * r * 0.97, COL.red, 0.3 * a, 1.0, 120, 0, 0, TAU);
    }
    ring(this.bRing, 0, cy, 0, 2.85, 0, t * 0.04, COL.red, 0.16 * w, 1.0, 150, 0.004);
    ring(this.bRing, 0, cy, 0, 2.85, Math.PI / 2, t * 0.05, COL.red, 0.1 * w, 1.0, 150, -0.004);
    ring(this.bRing, 0, cy, 0, 2.85, Math.PI / 2, t * 0.05 + Math.PI / 2, COL.red, 0.08 * w, 1.0, 150, 0.004);
  };

  World.prototype.updateProjects = function (t) {
    const w = this.W[3];
    const ph = t / 2.4, cur = Math.floor(ph) % 6, loc = fract(ph);
    for (let p = 0; p < 6; p++) this.clusterHL[p] = p === cur ? smooth(0, 0.18, loc) * (1 - smooth(0.82, 1, loc)) : 0;
    if (w <= 0.001) return;
    const cy = this.coreY, c = this._v;
    for (let p = 0; p < 6; p++) {
      clusterCenter(p, t, c);
      const hl = this.clusterHL[p], rad = clusterRadius(p), rr = rad + 0.24;
      const mx = c[0] * 0.5, my = (c[1] + cy) * 0.5 + 1.0, mz = c[2] * 0.5;
      bezier(this.bArc, 0, cy, 0, mx, my, mz, c[0], c[1], c[2], COL.red, (0.26 + hl * 0.4) * w, 1.3, fract(t * 0.45 + p / 6), -1, 0.12, (1.6 + hl) * w, 0.1);
      circle(this.bRing, c[0], c[1], c[2], 0, 0, rr, rr, 0, 0, COL.red, (0.35 + hl * 0.8) * w, 1.2, 48, 0.02, 0, TAU);
      circle(this.bRing, c[0], c[1], c[2], 0, 0, rr + 0.1, rr + 0.1, 0, 0, COL.red, (0.1 + hl * 0.5) * w, 1.0, 0, 0, 0, TAU);
      segment(this.bLine, c[0], c[1] - rad - 0.05, c[2], c[0], FLOOR_Y, c[2], COL.red, 0.14 * w, 1.0, 22, 0.02, -1, -1, 0.1, 0);
    }
    circle(this.bRing, 0, 0, 0, 0, 0, CL_R, CL_R, 0, 0, COL.red, 0.12 * w, 1.0, 200, 0.002, 0, TAU);
  };

  World.prototype.updateChannels = function (t) {
    const w = this.W[4];
    if (w <= 0.001) return;
    const cy = this.coreY - 0.12 * this.coreScale, P = this.pos, ids = F.onlineIdx, o = this._v;
    for (let j = 0; j < ids.length; j++) {
      const i = ids[j], T = TERMS[i];
      const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
      const d = Math.hypot(x, z);
      const mx = x * 0.5, my = (y + cy) * 0.5 + 0.55 * d + 0.4, mz = z * 0.5;
      const ph = chanPhase(T, t), hA = ph < 1 ? easeInOut(ph) : -1;
      const ph2 = fract(t * 0.3 + T.h4 + 0.52) * 1.4, hB = ph2 < 1 ? 1 - easeInOut(ph2) : -1;
      bezier(this.bArc, 0, cy, 0, mx, my, mz, x, y, z, COL.red, 0.07 * w, 1.0, hA, hB, 0.07, 1.35 * w, 0.22);
      if (hA >= 0 && j % 2 === 0) {
        bezAt(hA, 0, cy, 0, mx, my, mz, x, y, z, o);
        point(this.bPts, o[0], o[1], o[2], COL.hot[0], COL.hot[1], COL.hot[2], 0.55 * w, 0.04, 0, 1, 1.2);
      }
    }
  };

  World.prototype.updateGate = function (t) {
    const w = this.W[5];
    const gi = this.info.gate;
    gi.active = -1; gi.activeAmt = 0; gi.reject = 0;
    const G = GATE, C = G.center, g = G.g, v = G.v, R = G.R, T1 = G.term;
    const slots = gi.slots;
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + (k * Math.PI) / 2;
      slots[k][0] = C[0] + v[0] * Math.cos(a) * R;
      slots[k][1] = C[1] + Math.sin(a) * R;
      slots[k][2] = C[2] + v[2] * Math.cos(a) * R;
    }
    if (w <= 0.001) return;
    const b = this.bPts, o = this._v;
    let hot = 0;
    // the core sits at the origin, so a point on the channel is just T1 * u
    const onLine = (u, out) => { out[0] = T1[0] * u; out[1] = T1[1] * u; out[2] = T1[2] * u; return out; };

    segment(this.bLine, 0, 0, 0, T1[0], T1[1], T1[2], COL.red, 0.3 * w, 1.4, 0, 0, -1, -1, 0.1, 0);
    segment(this.bLine, 0, 0, 0, T1[0], T1[1], T1[2], COL.red, 0.25 * w, 1.0, 70, 0.05, -1, -1, 0.1, 0);

    for (const ge of this.gateEv) {
      const ev = ge.ev, tau = ge.tau, ok = ev.prog >= 0;
      let u = -1;
      if (tau < G_OUT) u = easeInOut(tau / G_OUT) * G.uGate;
      else if (tau < G_OUT + G_CHECK) u = G.uGate;
      else if (ok && tau < G_OUT + G_CHECK + G_IN) u = G.uGate + easeInOut((tau - G_OUT - G_CHECK) / G_IN) * (1 - G.uGate);
      if (u >= 0 && (ok || tau < G_DECIDE)) {
        segment(this.bLine, 0, 0, 0, T1[0], T1[1], T1[2], COL.red, 0, 1.6, 0, 0, u, -1, 0.06, 2.6 * w);
        onLine(u, o);
        point(b, o[0], o[1], o[2], COL.hot[0], COL.hot[1], COL.hot[2], 1.0 * w, 0.1, 0, 1, 2);
        point(b, o[0], o[1], o[2], COL.white[0], COL.white[1], COL.white[2], 0.6 * w, 0.035, 0, 1, 1.5);
      }
      // lookup: the pulse queries every slot, the matching one answers
      if (tau >= G_OUT && tau < G_OUT + G_CHECK + 0.25) {
        const lk = smooth(G_OUT, G_OUT + 0.08, tau) * (1 - smooth(G_OUT + G_CHECK, G_OUT + G_CHECK + 0.25, tau));
        for (let k = 0; k < 4; k++) {
          const m = ok && k === ev.prog;
          const s = slots[k];
          segment(this.bLine, C[0], C[1], C[2], s[0], s[1], s[2], m ? COL.hot : COL.red, (m ? 0.9 : 0.18) * lk * w, m ? 1.4 : 1.0, m ? 0 : 16, 0.2, -1, -1, 0.1, 0);
        }
        if (ok) { gi.active = ev.prog; gi.activeAmt = Math.max(gi.activeAmt, lk); }
      }
      if (!ok && tau >= G_DECIDE) {
        const age = tau - G_DECIDE;
        hot = Math.max(hot, Math.exp(-age * 3.2));
        gi.reject = Math.max(gi.reject, Math.exp(-age * 1.2));
        if (age < 1.6) {
          for (let s = 0; s < 40; s++) {
            const h1 = M.hash(s * 3 + 1), h2 = M.hash(s * 3 + 2), h3 = M.hash(s * 3 + 3);
            const th = h1 * TAU, ph = Math.acos(h2 * 2 - 1);
            let dx = Math.sin(ph) * Math.cos(th), dy = Math.cos(ph), dz = Math.sin(ph) * Math.sin(th);
            dx -= g[0] * 0.9; dz -= g[2] * 0.9;
            const sp = 0.9 + h3 * 1.8;
            const x = C[0] + dx * sp * age, y = C[1] + dy * sp * age - 0.9 * age * age, z = C[2] + dz * sp * age;
            const fa = Math.exp(-age * 2.4) * w;
            point(b, x, y, z, COL.hot[0], COL.hot[1], COL.hot[2], fa, 0.04, 0, 1, 1.4);
          }
        }
      }
      // answer travels back over the same channel
      const back0 = G_OUT + G_CHECK + G_IN + G_HOLD;
      if (ok && tau >= back0 && tau < back0 + G_BACK) {
        const hb = 1 - easeInOut((tau - back0) / G_BACK);
        segment(this.bLine, 0, 0, 0, T1[0], T1[1], T1[2], COL.red, 0, 1.4, 0, 0, -1, hb, 0.08, 1.8 * w);
        onLine(hb, o);
        point(b, o[0], o[1], o[2], COL.red[0] * 1.4, COL.red[1] * 1.4, COL.red[2] * 1.4, 0.9 * w, 0.07, 0, 1, 1.5);
      }
      // landing ripple at the terminal
      const land = G_OUT + G_CHECK + G_IN;
      if (ok && tau >= land && tau < land + 0.9) {
        const q = (tau - land) / 0.9, rr = 0.15 + q * 0.6, rt = this.right, up = this.up;
        circle(this.bRing, T1[0], T1[1], T1[2], rt[0] * rr, rt[1] * rr, rt[2] * rr, up[0] * rr, up[1] * rr, up[2] * rr, COL.hot, (1 - q) * 0.9 * w, 1.4, 0, 0, 0, TAU);
      }
    }

    const ringCol = mix3(COL.red, COL.white, hot * 0.7, this._w);
    circle(this.bRing, C[0], C[1], C[2], v[0] * R, 0, v[2] * R, 0, R, 0, ringCol, (0.85 + hot * 1.4) * w, 1.8, 0, 0, 0, TAU);
    const R2 = R * 0.84;
    circle(this.bRing, C[0], C[1], C[2], v[0] * R2, 0, v[2] * R2, 0, R2, 0, COL.red, 0.45 * w, 1.0, 64, 0.02, 0, TAU);
    const R3 = R * 1.15;
    circle(this.bRing, C[0], C[1], C[2], v[0] * R3, 0, v[2] * R3, 0, R3, 0, COL.red, 0.25 * w, 1.0, 160, -0.006, 0, TAU);
    for (let m = 1; m <= 5; m++) {
      const rm = (R * 0.78 * m) / 5.4;
      circle(this.bRing, C[0], C[1], C[2], v[0] * rm, 0, v[2] * rm, 0, rm, 0, ringCol, (0.05 + hot * 0.4) * w, 1.0, 0, 0, 0, TAU);
    }
    point(b, C[0], C[1], C[2], COL.red[0], COL.red[1], COL.red[2], (0.12 + hot * 0.6) * w, 1.3, 0, 1, 0);
    for (let k = 0; k < 4; k++) {
      const s = slots[k], act = gi.active === k ? gi.activeAmt : 0, rs = 0.12;
      circle(this.bRing, s[0], s[1], s[2], v[0] * rs, 0, v[2] * rs, 0, rs, 0, act > 0 ? COL.hot : COL.red, (0.6 + act * 1.4) * w, 1.4, 0, 0, 0, TAU);
      point(b, s[0], s[1], s[2], COL.red[0], COL.red[1], COL.red[2], (0.55 + act * 1.6) * w, 0.06 + act * 0.05, 0, 1, 2);
    }
  };

  World.prototype.updateLedger = function (t) {
    const w6 = this.W[6], w7 = this.W[7], w = Math.min(1, w6 + w7);
    const info = this.info;
    info.ledger.length = 0;
    info.matched.length = 0;
    if (w <= 0.001) return;
    const DT = F.RECORD_DT, c = t / DT, kNew = Math.floor(c);
    const cy = this.coreY, y0 = cy + 0.5, pitch = LEDGER_PITCH, rad = 1.0;
    const span = LEDGER_N * pitch;
    const scanY = y0 + (1 - fract(t / 3.6)) * span;
    info.ledgerTop = y0 + span;
    info.scanY = scanY;
    for (let k = kNew; k > kNew - LEDGER_N; k--) {
      const r = F.record(k);
      const age = c - k, ageS = age * DT;
      const th = k * LEDGER_STEP + t * 0.12;
      const match = r.actor === 'admin';
      const rr = rad + (match ? 0.24 * w7 : 0);
      const e = easeInOut(clamp(w * 1.3 - (age / LEDGER_N) * 0.3, 0, 1));
      const x = lerp(0, Math.cos(th) * rr, e), y = lerp(cy, y0 + age * pitch, e), z = lerp(0, Math.sin(th) * rr, e);
      const arrive = easeOut(clamp(ageS / 0.35, 0, 1));
      const fadeTop = 1 - smooth(LEDGER_N * 0.78, LEDGER_N, age);
      const len = 0.16 * arrive * e, hh = 0.03 * e;
      const fresh = Math.exp(-ageS * 2.2);
      let inten = (r.ok ? 0.75 : 0.9) * fadeTop;
      if (w7 > 0) inten *= lerp(1, match ? 1.45 : 0.2, w7);
      const dy = (y - scanY) / 0.14;
      const scanHit = match ? Math.exp(-dy * dy) * w7 : 0;
      bar(this.bBar, x, y, z, -Math.sin(th) * len, 0, Math.cos(th) * len, 0, hh, 0,
        r.ok ? COL.red : COL.white, inten * (r.ok ? 1 : 0.5) * (1 + fresh * 1.6 + scanHit * 1.4) * w, 0.32, 1.0);
      if (kNew - k < 6) info.ledger.push({ r, x, y, z, ageS });
      if (match && fadeTop > 0.5) info.matched.push({ r, x, y, z });
    }
    segment(this.bLine, 0, y0, 0, 0, y0 + span, 0, COL.red, 0.12 * w, 1.0, 60, 0.01, -1, -1, 0.1, 0);
    circle(this.bRing, 0, y0 - 0.06, 0, 0, 0, rad + 0.3, rad + 0.3, 0, 0, COL.red, 0.35 * w, 1.0, 0, 0, 0, TAU);

    const P = this.pos;
    for (let k = kNew + 1; k <= kNew + 3; k++) {
      const u = (t - (k * DT - FLIGHT)) / FLIGHT;
      if (u < 0 || u > 1) continue;
      const r = F.record(k), i = r.term;
      const th = k * LEDGER_STEP + t * 0.12;
      const bx = Math.cos(th) * rad, by = y0, bz = Math.sin(th) * rad;
      const sx = P[i * 3], sy = P[i * 3 + 1], sz = P[i * 3 + 2];
      const mx = (sx + bx) / 2, my = Math.max(sy, by) + 1.1, mz = (sz + bz) / 2;
      const hA = easeInOut(u);
      bezier(this.bArc, sx, sy, sz, mx, my, mz, bx, by, bz, COL.red, 0.12 * w * (1 - u * 0.5), 1.1, hA, -1, 0.12, 2.0 * w);
      const o = bezAt(hA, sx, sy, sz, mx, my, mz, bx, by, bz, this._v);
      point(this.bPts, o[0], o[1], o[2], COL.hot[0], COL.hot[1], COL.hot[2], 0.8 * w, 0.05, 0, 1, 1.5);
    }

    if (w7 > 0.001) {
      const rr = 1.75;
      circle(this.bRing, 0, scanY, 0, 0, 0, rr, rr, 0, 0, COL.hot, 0.85 * w7, 1.6, 0, 0, 0, TAU);
      circle(this.bRing, 0, scanY, 0, 0, 0, rr + 0.14, rr + 0.14, 0, 0, COL.red, 0.35 * w7, 1.0, 90, 0.01, 0, TAU);
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * TAU + t * 0.05;
        segment(this.bLine, Math.cos(a) * rr, y0, Math.sin(a) * rr, Math.cos(a) * rr, y0 + span, Math.sin(a) * rr, COL.red, 0.09 * w7, 1.0, 70, 0, -1, -1, 0.1, 0);
      }
    }
  };

  /* ------------------------------------------------------------------ inventory selection */
  World.prototype.select = function (i) {
    if (i === this.sel) return;
    this.sel = i;
    this.selT = this.time;
  };

  World.prototype.clearSelection = function () {
    this.sel = -1;
  };

  // nearest visible terminal within r CSS px of (x, y), or -1
  World.prototype.pickAt = function (x, y, r) {
    const S = this.scr;
    let best = -1, bd = r * r;
    for (let i = 0; i < N; i++) {
      if (!S[i * 3 + 2] || this.vis[i] < 0.3) continue;
      const dx = S[i * 3] - x, dy = S[i * 3 + 1] - y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  };

  World.prototype.projectTerminals = function () {
    const m = this.vp, P = this.pos, S = this.scr, W = this.w, H = this.h;
    const px = this.ptr.x, py = this.ptr.y, pin = this.ptr.in;
    let best = -1, bd = 15 * 15;
    for (let i = 0; i < N; i++) {
      const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
      const cw = m[3] * x + m[7] * y + m[11] * z + m[15];
      if (cw <= 0.05) { S[i * 3 + 2] = 0; continue; }
      const sx = ((m[0] * x + m[4] * y + m[8] * z + m[12]) / cw * 0.5 + 0.5) * W;
      const sy = (0.5 - ((m[1] * x + m[5] * y + m[9] * z + m[13]) / cw) * 0.5) * H;
      S[i * 3] = sx; S[i * 3 + 1] = sy; S[i * 3 + 2] = 1;
      if (pin && this.vis[i] > 0.3) {
        const dx = sx - px, dy = sy - py, d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = i; }
      }
    }
    this.hover = best;
  };

  // world -> CSS px; out[2] = 1 when in front of the camera
  World.prototype.project = function (x, y, z, out) {
    const m = this.vp;
    const cw = m[3] * x + m[7] * y + m[11] * z + m[15];
    if (cw <= 0.05) { out[2] = 0; return out; }
    out[0] = ((m[0] * x + m[4] * y + m[8] * z + m[12]) / cw * 0.5 + 0.5) * this.w;
    out[1] = (0.5 - ((m[1] * x + m[5] * y + m[9] * z + m[13]) / cw) * 0.5) * this.h;
    out[2] = 1;
    out[3] = cw;
    return out;
  };

  /* ------------------------------------------------------------------ draw */
  World.prototype.drawPoints = function (b, model, size, alpha) {
    if (!b.count || alpha <= 0) return;
    const gl = this.gl, u = this.pPoint.u;
    gl.uniformMatrix4fv(u.uModel, false, model);
    gl.uniform1f(u.uSize, size);
    gl.uniform1f(u.uAlpha, alpha);
    gl.bindVertexArray(b.vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, b.count);
  };

  World.prototype.drawCurves = function (b, segs, alpha, fade) {
    if (!b.count || alpha <= 0) return;
    const gl = this.gl, u = this.pCurve.u;
    gl.uniform1f(u.uSegs, segs);
    gl.uniform1f(u.uAlpha, alpha);
    gl.uniform1f(u.uFade, fade);
    gl.bindVertexArray(b.vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, (segs + 1) * 2, b.count);
  };

  World.prototype.render = function () {
    const gl = this.gl, post = this.post, t = this.time, s = this.s;
    [this.bPts, this.bArc, this.bRing, this.bLine, this.bBar].forEach((b) => b.upload());
    post.begin(BG);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    const vw = post.ok ? post.w : this.canvas.width, vh = post.ok ? post.h : this.canvas.height;
    const dpr = this.dpr * this.scale;

    const P = this.pPoint;
    gl.useProgram(P.p);
    gl.uniformMatrix4fv(P.u.uProj, false, this.proj);
    gl.uniformMatrix4fv(P.u.uView, false, this.view);
    gl.uniform1f(P.u.uViewH, vh);
    gl.uniform1f(P.u.uDpr, dpr);
    mat4.compose(this.model, 0, t * 0.01, 0, 1, 0, 0, 0);
    this.drawPoints(this.bDust, this.model, 1, 0.9 * smooth(0, 1, this.intro * 1.5));
    const cs = this.coreScale;
    if (cs > 0.002) {
      const r = 0.5 * cs, cy = this.coreY;
      mat4.compose(this.model, 0.4, t * 0.5, 0.2, r, 0, cy, 0);
      this.drawPoints(this.bNuc[0], this.model, cs, 1);
      mat4.compose(this.model, -t * 0.33, 1.2, t * 0.21, r * 0.92, 0, cy, 0);
      this.drawPoints(this.bNuc[1], this.model, cs, 0.9);
      mat4.compose(this.model, t * 0.27, -t * 0.4, 0.9, r * 1.08, 0, cy, 0);
      this.drawPoints(this.bNuc[2], this.model, cs, 0.8);
    }

    const C = this.pCurve;
    gl.useProgram(C.p);
    gl.uniformMatrix4fv(C.u.uVP, false, this.vp);
    gl.uniform2f(C.u.uViewport, vw, vh);
    gl.uniform1f(C.u.uDpr, dpr);
    gl.uniform1f(C.u.uTime, t);
    const fa = stageLerp(FLOOR_A, s) * this.intro;
    this.drawCurves(this.bGrid, 128, fa, 9.5);
    this.drawCurves(this.bSpoke, 1, fa, 9.5);
    this.drawCurves(this.bRing, 96, 1, 0);
    this.drawCurves(this.bArc, 40, 1, 0);
    this.drawCurves(this.bLine, 1, 1, 0);

    if (this.bBar.count) {
      const B = this.pBar;
      gl.useProgram(B.p);
      gl.uniformMatrix4fv(B.u.uVP, false, this.vp);
      gl.uniform1f(B.u.uAlpha, 1);
      gl.bindVertexArray(this.bBar.vao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.bBar.count);
    }

    gl.useProgram(P.p);
    this.drawPoints(this.bPts, this.ident, 1, 1);
    gl.bindVertexArray(null);

    const flashIn = this.reduced ? 0 : Math.exp(-Math.pow((t - 0.45) / 0.25, 2)) * 0.8;
    post.end({
      threshold: 0.42,
      knee: 0.5,
      bloom: stageLerp(BLOOM_K, s) * (1 + flashIn),
      exposure: 1.0,
      time: t,
      grain: 0.022,
      bg: BG,
    });
  };

  World.consts = { WALL_COLS, WALL_ROWS, WALL_R, WALL_Y, WALL_DY, FLOOR_Y, wallAngle, clusterCenter, clusterRadius };

  OC.World = World;
  OC.createWorld = function (canvas, opts) {
    return new World(canvas, opts);
  };
})();
