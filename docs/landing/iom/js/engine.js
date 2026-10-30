/* Operations Control — engine: math helpers, WebGL2 plumbing, bloom + composite.
   Hand-written, no third-party code. Exposes window.OC.M / OC.mat4 / OC.GLU. */
(function () {
  'use strict';
  const OC = (window.OC = window.OC || {});

  /* ------------------------------------------------------------------ math */
  const TAU = Math.PI * 2;
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const fract = (x) => x - Math.floor(x);
  const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const easeInOut = (t) => {
    t = clamp(t, 0, 1);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  const easeOutBack = (t) => {
    t = clamp(t, 0, 1);
    const c = 1.70158;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  };
  // integer hash -> [0,1)
  function hash(n) {
    let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
    x ^= x >>> 13;
    x = Math.imul(x, 0xc2b2ae35);
    x ^= x >>> 16;
    return (x >>> 0) / 4294967296;
  }
  // mulberry32
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  OC.M = { TAU, clamp, lerp, smooth, fract, damp, easeOut, easeInOut, easeOutBack, hash, rng };

  /* ------------------------------------------------------------------ mat4 (column-major) */
  const mat4 = {
    create() {
      const m = new Float32Array(16);
      m[0] = m[5] = m[10] = m[15] = 1;
      return m;
    },
    // off-axis perspective: offX/offY shift the image in NDC units (+x = right, +y = up)
    perspective(out, fovy, aspect, near, far, offX, offY) {
      const f = 1 / Math.tan(fovy / 2);
      const nf = 1 / (near - far);
      out.fill(0);
      out[0] = f / aspect;
      out[5] = f;
      out[8] = -(offX || 0);
      out[9] = -(offY || 0);
      out[10] = (far + near) * nf;
      out[11] = -1;
      out[14] = 2 * far * near * nf;
      return out;
    },
    lookAt(out, e, c, up) {
      let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2];
      let l = Math.hypot(zx, zy, zz) || 1;
      zx /= l; zy /= l; zz /= l;
      let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
      l = Math.hypot(xx, xy, xz) || 1;
      xx /= l; xy /= l; xz /= l;
      const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
      out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
      out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
      out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
      out[12] = -(xx * e[0] + xy * e[1] + xz * e[2]);
      out[13] = -(yx * e[0] + yy * e[1] + yz * e[2]);
      out[14] = -(zx * e[0] + zy * e[1] + zz * e[2]);
      out[15] = 1;
      return out;
    },
    multiply(out, a, b) {
      const r = mat4._tmp;
      for (let c = 0; c < 4; c++) {
        const b0 = b[c * 4], b1 = b[c * 4 + 1], b2 = b[c * 4 + 2], b3 = b[c * 4 + 3];
        r[c * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
        r[c * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
        r[c * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
        r[c * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
      }
      out.set(r);
      return out;
    },
    // T * Ry(ay) * Rx(ax) * Rz(az) * S
    compose(out, ax, ay, az, s, tx, ty, tz) {
      const cx = Math.cos(ax), sx = Math.sin(ax);
      const cy = Math.cos(ay), sy = Math.sin(ay);
      const cz = Math.cos(az), sz = Math.sin(az);
      // R = Ry * Rx * Rz
      const m00 = cy * cz + sy * sx * sz, m01 = -cy * sz + sy * sx * cz, m02 = sy * cx;
      const m10 = cx * sz, m11 = cx * cz, m12 = -sx;
      const m20 = -sy * cz + cy * sx * sz, m21 = sy * sz + cy * sx * cz, m22 = cy * cx;
      out[0] = m00 * s; out[1] = m10 * s; out[2] = m20 * s; out[3] = 0;
      out[4] = m01 * s; out[5] = m11 * s; out[6] = m21 * s; out[7] = 0;
      out[8] = m02 * s; out[9] = m12 * s; out[10] = m22 * s; out[11] = 0;
      out[12] = tx; out[13] = ty; out[14] = tz; out[15] = 1;
      return out;
    },
    _tmp: new Float32Array(16),
  };
  OC.mat4 = mat4;

  /* ------------------------------------------------------------------ GL helpers */
  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error('shader: ' + log);
    }
    return s;
  }

  function program(gl, vs, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      u[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, info.name);
    }
    return { p, u };
  }

  /* An instanced batch: a static per-vertex buffer at location 0 plus one
     interleaved per-instance buffer (locations 1..n, divisor 1). */
  function Batch(gl, vertexData, vertexSize, layout, max) {
    this.gl = gl;
    this.stride = layout.reduce((a, b) => a + b, 0);
    this.max = max;
    this.count = 0;
    this.data = new Float32Array(max * this.stride);
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    const vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, vertexSize, gl.FLOAT, false, 0, 0);
    this.ib = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.ib);
    gl.bufferData(gl.ARRAY_BUFFER, this.data.byteLength, gl.DYNAMIC_DRAW);
    let off = 0;
    layout.forEach((size, i) => {
      const loc = i + 1;
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, this.stride * 4, off * 4);
      gl.vertexAttribDivisor(loc, 1);
      off += size;
    });
    gl.bindVertexArray(null);
  }
  Batch.prototype.upload = function () {
    const gl = this.gl;
    if (!this.count) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.ib);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data, 0, this.count * this.stride);
  };

  /* ------------------------------------------------------------------ post-processing */
  const FS_VS = `#version 300 es
layout(location=0) in vec2 aPos;
out vec2 vUV;
void main(){ vUV = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

  // 13-tap downsample (Jimenez 2014); first pass applies Karis average + soft threshold
  const DOWN_FS = `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
uniform sampler2D uSrc;
uniform vec2 uTexel;
uniform float uPrefilter, uThreshold, uKnee;
vec3 S(vec2 d){ return texture(uSrc, vUV + d * uTexel).rgb; }
float kw(vec3 c){ return 1.0 / (1.0 + max(c.r, max(c.g, c.b))); }
vec3 kavg(vec3 a, vec3 b, vec3 c, vec3 d){
  float wa = kw(a), wb = kw(b), wc = kw(c), wd = kw(d);
  return (a * wa + b * wb + c * wc + d * wd) / (wa + wb + wc + wd);
}
void main(){
  vec3 A = S(vec2(-2.0, 2.0)), B = S(vec2(0.0, 2.0)), C = S(vec2(2.0, 2.0));
  vec3 D = S(vec2(-2.0, 0.0)), E = S(vec2(0.0, 0.0)), F = S(vec2(2.0, 0.0));
  vec3 G = S(vec2(-2.0, -2.0)), H = S(vec2(0.0, -2.0)), I = S(vec2(2.0, -2.0));
  vec3 J = S(vec2(-1.0, 1.0)), K = S(vec2(1.0, 1.0)), L = S(vec2(-1.0, -1.0)), M = S(vec2(1.0, -1.0));
  vec3 col;
  if (uPrefilter > 0.5) {
    col = kavg(J, K, L, M) * 0.5 + (kavg(A, B, D, E) + kavg(B, C, E, F) + kavg(D, E, G, H) + kavg(E, F, H, I)) * 0.125;
    float br = max(col.r, max(col.g, col.b));
    float rq = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee);
    rq = rq * rq / (4.0 * uKnee + 1e-4);
    col *= max(rq, br - uThreshold) / max(br, 1e-4);
  } else {
    col = E * 0.125 + (A + C + G + I) * 0.03125 + (B + D + F + H) * 0.0625 + (J + K + L + M) * 0.125;
  }
  o = vec4(col, 1.0);
}`;

  // 9-tap tent upsample, blended additively onto the next larger level
  const UP_FS = `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
uniform sampler2D uSrc;
uniform vec2 uTexel;
uniform float uRadius;
void main(){
  vec2 d = uTexel * uRadius;
  vec3 c = texture(uSrc, vUV + vec2(-d.x, d.y)).rgb + texture(uSrc, vUV + vec2(0.0, d.y)).rgb * 2.0 + texture(uSrc, vUV + vec2(d.x, d.y)).rgb
         + texture(uSrc, vUV + vec2(-d.x, 0.0)).rgb * 2.0 + texture(uSrc, vUV).rgb * 4.0 + texture(uSrc, vUV + vec2(d.x, 0.0)).rgb * 2.0
         + texture(uSrc, vUV + vec2(-d.x, -d.y)).rgb + texture(uSrc, vUV + vec2(0.0, -d.y)).rgb * 2.0 + texture(uSrc, vUV + vec2(d.x, -d.y)).rgb;
  o = vec4(c * (1.0 / 16.0), 1.0);
}`;

  const COMP_FS = `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o;
uniform sampler2D uScene, uBloom;
uniform float uBloomK, uExposure, uTime, uGrain;
uniform vec2 uRes;
uniform vec3 uBg;
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec3 shoulder(vec3 x){ vec3 k = vec3(0.8); vec3 over = max(x - k, 0.0); return min(x, k) + (1.0 - k) * (1.0 - exp(-over / (1.0 - k))); }
void main(){
  vec2 uv = vUV;
  vec2 c = uv - 0.5;
  float r2 = dot(c, c);
  vec2 ca = c * r2 * 0.012;
  vec3 col = vec3(texture(uScene, uv - ca).r, texture(uScene, uv).g, texture(uScene, uv + ca).b);
  col += texture(uBloom, uv).rgb * uBloomK;
  col *= uExposure;
  col.gb += max(col.r - 1.15, 0.0) * vec2(0.17, 0.15);
  col = shoulder(col);
  float vig = 1.0 - smoothstep(0.3, 1.0, length(c * vec2(1.0, 0.92)) * 1.3);
  col *= mix(0.55, 1.0, vig);
  col += uBg;
  col += (hash12(uv * uRes + fract(uTime * 7.31) * 417.0) - 0.5) * uGrain;
  o = vec4(col, 1.0);
}`;

  function Post(gl) {
    this.gl = gl;
    this.float = !!gl.getExtension('EXT_color_buffer_float');
    this.ifmt = this.float ? gl.RGBA16F : gl.RGBA8;
    this.type = this.float ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;
    this.maxSamples = Math.min(4, gl.getParameter(gl.MAX_SAMPLES) | 0);
    this.samples = this.maxSamples;
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    this.pDown = program(gl, FS_VS, DOWN_FS);
    this.pUp = program(gl, FS_VS, UP_FS);
    this.pComp = program(gl, FS_VS, COMP_FS);
    this.levels = [];
    this.scene = null;
    this.ok = false;
    this.w = this.h = 0;
  }

  Post.prototype._target = function (w, h) {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, this.ifmt, w, h, 0, gl.RGBA, this.type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    return { t, fb, w, h, complete };
  };

  Post.prototype._free = function () {
    const gl = this.gl;
    const kill = (x) => { if (x) { gl.deleteTexture(x.t); gl.deleteFramebuffer(x.fb); } };
    kill(this.scene);
    this.levels.forEach(kill);
    if (this.msfb) gl.deleteFramebuffer(this.msfb);
    if (this.rb) gl.deleteRenderbuffer(this.rb);
    this.scene = null; this.levels = []; this.msfb = null; this.rb = null;
  };

  Post.prototype.resize = function (w, h, cw, ch) {
    const gl = this.gl;
    this._free();
    this.w = w; this.h = h; this.cw = cw; this.ch = ch;
    this.scene = this._target(w, h);
    this.ok = this.scene.complete;
    if (this.ok && this.samples > 1) {
      this.rb = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.rb);
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.samples, this.ifmt, w, h);
      this.msfb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.msfb);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, this.rb);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        gl.deleteFramebuffer(this.msfb); gl.deleteRenderbuffer(this.rb);
        this.msfb = null; this.rb = null;
      }
    }
    let lw = w >> 1, lh = h >> 1;
    for (let i = 0; i < 6 && lw >= 4 && lh >= 4; i++) {
      const lv = this._target(lw, lh);
      if (!lv.complete) { this.ok = false; break; }
      this.levels.push(lv);
      lw >>= 1; lh >>= 1;
    }
    if (!this.levels.length) this.ok = false;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  Post.prototype.begin = function (bg) {
    const gl = this.gl;
    if (this.ok) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.msfb || this.scene.fb);
      gl.viewport(0, 0, this.w, this.h);
      gl.clearColor(0, 0, 0, 0);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.cw, this.ch);
      gl.clearColor(bg[0], bg[1], bg[2], 1);
    }
    gl.clear(gl.COLOR_BUFFER_BIT);
  };

  Post.prototype.end = function (o) {
    if (!this.ok) return;
    const gl = this.gl;
    gl.disable(gl.BLEND);
    if (this.msfb) {
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.msfb);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.scene.fb);
      gl.blitFramebuffer(0, 0, this.w, this.h, 0, 0, this.w, this.h, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    }
    gl.bindVertexArray(this.vao);
    gl.activeTexture(gl.TEXTURE0);

    const D = this.pDown;
    gl.useProgram(D.p);
    gl.uniform1i(D.u.uSrc, 0);
    gl.uniform1f(D.u.uThreshold, o.threshold);
    gl.uniform1f(D.u.uKnee, o.knee);
    let src = this.scene;
    for (let i = 0; i < this.levels.length; i++) {
      const dst = this.levels[i];
      gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
      gl.viewport(0, 0, dst.w, dst.h);
      gl.bindTexture(gl.TEXTURE_2D, src.t);
      gl.uniform2f(D.u.uTexel, 1 / src.w, 1 / src.h);
      gl.uniform1f(D.u.uPrefilter, i === 0 ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      src = dst;
    }

    const U = this.pUp;
    gl.useProgram(U.p);
    gl.uniform1i(U.u.uSrc, 0);
    gl.uniform1f(U.u.uRadius, 1.0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    for (let i = this.levels.length - 1; i > 0; i--) {
      const s = this.levels[i], d = this.levels[i - 1];
      gl.bindFramebuffer(gl.FRAMEBUFFER, d.fb);
      gl.viewport(0, 0, d.w, d.h);
      gl.bindTexture(gl.TEXTURE_2D, s.t);
      gl.uniform2f(U.u.uTexel, 1 / s.w, 1 / s.h);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    gl.disable(gl.BLEND);

    const C = this.pComp;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.cw, this.ch);
    gl.useProgram(C.p);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.scene.t);
    gl.uniform1i(C.u.uScene, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.levels[0].t);
    gl.uniform1i(C.u.uBloom, 1);
    gl.uniform1f(C.u.uBloomK, o.bloom);
    gl.uniform1f(C.u.uExposure, o.exposure);
    gl.uniform1f(C.u.uTime, o.time);
    gl.uniform1f(C.u.uGrain, o.grain);
    gl.uniform2f(C.u.uRes, this.cw, this.ch);
    gl.uniform3f(C.u.uBg, o.bg[0], o.bg[1], o.bg[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindVertexArray(null);
  };

  OC.GLU = { program, Batch, Post };
})();
