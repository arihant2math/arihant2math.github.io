/* ------------------------------------------------------------------ *
 *  Photographs, painted.
 *
 *  Each photograph is studied: its colours, which way its edges run,
 *  how busy it is where, and which part of it is sky.  The picture is
 *  then painted from it in dry brush strokes, broad where it is calm and
 *  fine where it is busy, over an underpainting of flat patches.
 *
 *  Every so often the next one is painted out of sight and brushed in
 *  over the one on show: broad strokes sweep across the picture, each
 *  laying down the new painting wherever it passes.
 * ------------------------------------------------------------------ */
(() => {
'use strict';

const qs = new URLSearchParams(location.search);
const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const css = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const SEED = qs.has('seed') ? +qs.get('seed') : 1;   // the same strokes on every visit
let R = rng(SEED);

// ---------- the photograph, studied once ----------
const SW = 800;                       // the grid it is studied on
let SH = 0;                           // and its height, for the photograph being studied

function blurred(img, px) {
  const c = document.createElement('canvas'); c.width = SW; c.height = SH;
  const x = c.getContext('2d');
  x.filter = `blur(${px}px)`;
  x.drawImage(img, -px * 2, -px * 2, SW + px * 4, SH + px * 4);   // overdraw so the edges do not fade
  const d = x.getImageData(0, 0, SW, SH).data, out = new Float32Array(SW * SH * 3);
  for (let i = 0, j = 0; i < d.length; i += 4, j += 3) { out[j] = d[i]; out[j + 1] = d[i + 1]; out[j + 2] = d[i + 2]; }
  return out;
}
function sobel(col) {
  const n = SW * SH, L = new Float32Array(n), gx = new Float32Array(n), gy = new Float32Array(n);
  for (let i = 0; i < n; i++) L[i] = .3 * col[i * 3] + .59 * col[i * 3 + 1] + .11 * col[i * 3 + 2];
  for (let y = 1; y < SH - 1; y++) for (let x = 1; x < SW - 1; x++) {
    const i = y * SW + x;
    gx[i] = (L[i - SW + 1] + 2 * L[i + 1] + L[i + SW + 1]) - (L[i - SW - 1] + 2 * L[i - 1] + L[i + SW - 1]);
    gy[i] = (L[i + SW - 1] + 2 * L[i + SW] + L[i + SW + 1]) - (L[i - SW - 1] + 2 * L[i - SW] + L[i - SW + 1]);
  }
  return [gx, gy];
}
function boxBlur(a, r) {                 // separable, in place
  const t = new Float32Array(a.length);
  for (let y = 0; y < SH; y++) {
    let s = 0;
    for (let x = -r; x <= r; x++) s += a[y * SW + clamp(x, 0, SW - 1)];
    for (let x = 0; x < SW; x++) {
      t[y * SW + x] = s / (2 * r + 1);
      s += a[y * SW + Math.min(SW - 1, x + r + 1)] - a[y * SW + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < SW; x++) {
    let s = 0;
    for (let y = -r; y <= r; y++) s += t[clamp(y, 0, SH - 1) * SW + x];
    for (let y = 0; y < SH; y++) {
      a[y * SW + x] = s / (2 * r + 1);
      s += t[Math.min(SH - 1, y + r + 1) * SW + x] - t[Math.max(0, y - r) * SW + x];
    }
  }
  return a;
}

// What a photograph is to the brush:
//   fine, coarse   its colours, lightly and heavily blurred, rgb interleaved
//   gfx, gfy, gcx, gcy   which way its edges run, finely and broadly
//   detail         how busy it is around a point, 0..1
//   skyDist        0 on land, else how far (in grid pixels) the sky there is from the nearest land
function study(img) {
  SH = Math.round(SW * img.height / img.width);
  const fine = blurred(img, .6), coarse = blurred(img, 3);
  const [gfx, gfy] = sobel(fine), [gcx, gcy] = sobel(coarse);
  const n = SW * SH;

  // busyness: edge strength, spread out, scaled so the busiest tenth is 1
  const detail = new Float32Array(n);
  for (let i = 0; i < n; i++) detail[i] = Math.hypot(gfx[i], gfy[i]);
  boxBlur(detail, 4);
  const sorted = Float32Array.from(detail).sort(), top = sorted[(n * .9) | 0] || 1;
  for (let i = 0; i < n; i++) detail[i] = clamp(detail[i] / top);

  // the sky: everything calm that can be reached from the top edge without crossing an edge
  const sky = new Uint8Array(n), stack = [];
  for (let x = 0; x < SW; x++) { sky[x] = 1; stack.push(x); }
  while (stack.length) {
    const i = stack.pop(), x = i % SW;
    for (const j of [i - SW, i + SW, x > 0 ? i - 1 : -1, x < SW - 1 ? i + 1 : -1]) {
      if (j < 0 || j >= n || sky[j]) continue;
      if (Math.hypot(gfx[j], gfy[j]) > 28 || j / SW > SH * .5) continue;
      sky[j] = 1; stack.push(j);
    }
  }
  // how far each bit of sky is from the land (chamfer distance), so a stroke of sky can keep off it
  const skyDist = new Float32Array(n);
  for (let i = 0; i < n; i++) skyDist[i] = sky[i] ? 1e4 : 0;
  const D = 1.4142;
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
    const i = y * SW + x; if (!skyDist[i]) continue;
    let d = skyDist[i];
    if (x > 0) d = Math.min(d, skyDist[i - 1] + 1);
    if (y > 0) { d = Math.min(d, skyDist[i - SW] + 1); if (x > 0) d = Math.min(d, skyDist[i - SW - 1] + D); if (x < SW - 1) d = Math.min(d, skyDist[i - SW + 1] + D); }
    skyDist[i] = d;
  }
  for (let y = SH - 1; y >= 0; y--) for (let x = SW - 1; x >= 0; x--) {
    const i = y * SW + x; if (!skyDist[i]) continue;
    let d = skyDist[i];
    if (x < SW - 1) d = Math.min(d, skyDist[i + 1] + 1);
    if (y < SH - 1) { d = Math.min(d, skyDist[i + SW] + 1); if (x < SW - 1) d = Math.min(d, skyDist[i + SW + 1] + D); if (x > 0) d = Math.min(d, skyDist[i + SW - 1] + D); }
    skyDist[i] = d;
  }
  return { SH, fine, coarse, gfx, gfy, gcx, gcy, detail, skyDist };
}

// the photograph's own colours, a little richer
const saturate = (c, s) => { const l = .3 * c[0] + .59 * c[1] + .11 * c[2]; return [lerp(l, c[0], s), lerp(l, c[1], s), lerp(l, c[2], s)]; };

// ---------- the brush ----------
// A dry brush: a bundle of ragged bristle lines.  Each is one straight segment: Firefox draws curves
// and joins of a shape it has not seen before on the CPU, and no two bristles are alike.
function brush(c, x1, y1, x2, y2, w, col, a = .8) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  const sp = 1.4, n = Math.max(1, Math.round(w / sp));
  const j = (R() - .5) * 16;
  for (let i = 0; i < n; i++) {
    const r1 = R(), r2 = R(), r3 = R(), r4 = R();
    if (n > 2 && r1 < .18) continue;
    const e = n > 1 ? i / (n - 1) - .5 : 0, off = e * w + (r2 - .5) * sp, tp = e * e * .6;
    const s0 = tp + r3 * r3 * .2, s1 = 1 - tp - r4 * r4 * .2;
    const ax = x1 + dx * s0 + nx * off, ay = y1 + dy * s0 + ny * off;
    const bx = x1 + dx * s1 + nx * off, by = y1 + dy * s1 + ny * off;
    const k = j + (r2 - .5) * 14;
    c.strokeStyle = `rgba(${(col[0] + k) | 0},${(col[1] + k) | 0},${(col[2] + k) | 0},${a * (.55 + r1 * .45)})`;
    c.lineWidth = sp * (.8 + r3 * .9);
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
  }
}
// ---------- painting a picture ----------
// Four sizes of brush, broad to fine, each laid all over the picture in turn.  A broad one goes anywhere,
// a fine one only where the picture is busy.  Strokes per million square pixels of the view.
const LAYERS = [
  { w: 24, l: 2.2, n: 2600, want: () => 1 },
  { w: 11, l: 2.4, n: 9000, want: d => .25 + d },
  { w: 5, l: 2.8, n: 30000, want: d => d * 1.2 },
  { w: 2.2, l: 3.4, n: 60000, want: d => d * d * 1.6 },
];

function paintPicture(c, W, H, p) {
  const { SH, fine, coarse, gfx, gfy, gcx, gcy, detail, skyDist } = p;
  R = rng(SEED);
  const k = Math.max(W / SW, H / SH), ox = (W - SW * k) / 2, oy = (H - SH * k) * .35;   // cover, losing more of the foreground than of the sky
  const U = clamp(Math.sqrt(W * H) / 1100, .7, 1.6), area = W * H / 1e6;
  c.lineCap = 'round';
  // an underpainting of flat patches, so that wherever the strokes leave a gap there is colour, not paper
  const cell = 10;
  for (let y = 0; y < H; y += cell) for (let x = 0; x < W; x += cell) {
    const gx = clamp((x + cell / 2 - ox) / k, 0, SW - 1) | 0, gy = clamp((y + cell / 2 - oy) / k, 0, SH - 1) | 0;
    const i = gy * SW + gx, col = [coarse[i * 3], coarse[i * 3 + 1], coarse[i * 3 + 2]];
    c.fillStyle = css(saturate(col, skyDist[i] ? 1.15 : 1.12), 1);
    c.fillRect(x, y, cell, cell);
  }

  LAYERS.forEach((layer, li) => {
    const big = li < 2, src = big ? coarse : fine;
    for (let n = Math.round(layer.n * area); n > 0; n--) {
      const x = R() * W, y = R() * H, gx = (x - ox) / k, gy = (y - oy) / k, want = R();
      if (gx < 0 || gy < 0 || gx >= SW - 1 || gy >= SH - 1) continue;
      const i = (gy | 0) * SW + (gx | 0), col = [src[i * 3], src[i * 3 + 1], src[i * 3 + 2]];
      let w = layer.w * U, len = w * layer.l;
      if (skyDist[i]) {                                  // sky: level strokes that keep off the land
        const room = skyDist[i] * k;
        len = Math.max(2, Math.min(len * 1.6, room * 2)); w = Math.max(1.4, Math.min(w, room * 1.2));
        const a = (R() - .5) * .08, ca = Math.cos(a) * len / 2, sa = Math.sin(a) * len / 2;
        brush(c, x - ca, y - sa, x + ca, y + sa, w, saturate(col, 1.15), .75);
        continue;
      }
      if (want > layer.want(detail[i])) continue;
      // land: along the edges where there are any (so towers get upright strokes), level where it is calm
      const ex = big ? gcx[i] : gfx[i], ey = big ? gcy[i] : gfy[i];
      const a = Math.hypot(ex, ey) > 14 ? Math.atan2(ey, ex) + Math.PI / 2 : (R() - .5) * .3;
      const ca = Math.cos(a) * len / 2, sa = Math.sin(a) * len / 2;
      brush(c, x - ca, y - sa, x + ca, y + sa, w, saturate(col, 1.12), big ? .7 : .85);
    }
  });
}

// ---------- the view ----------
// One canvas on show, never cleared; the next picture is painted on another, out of sight, and brushed in from there.
const PHOTOS = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `/painting/photos/${n}.jpg`);
const EVERY = parseFloat(qs.get('every') || '10'), SWEEP = 3.2;   // seconds a picture is shown, and brushed in
const canvas = document.querySelector('canvas'), ctx = canvas.getContext('2d');
const next = document.createElement('canvas'), nctx = next.getContext('2d');
let W = 0, H = 0, scale = 1, shown = null, at = (Math.random() * PHOTOS.length) | 0, busy = false, stale = false;

const load = src => new Promise((ok, fail) => { const img = new Image(); img.onload = () => ok(img); img.onerror = fail; img.src = src; });
function fit() {
  W = innerWidth; H = innerHeight; scale = Math.min(devicePixelRatio || 1, 2);
  for (const c of [canvas, next]) { c.width = W * scale; c.height = H * scale; }
  for (const c of [ctx, nctx]) c.setTransform(scale, 0, 0, scale, 0, 0);
}

// The sweep: a front runs across the picture on a slant, and close behind it broad dry strokes lay the new
// painting down, bristle by bristle, so the old one goes ragged before it is gone.  What is left gets a last coat.
function sweepIn(photo) {
  paintPicture(nctx, W, H, photo);
  nctx.getImageData(0, 0, 1, 1);                       // have it painted now, not on the sweep's first frame (Firefox defers it)
  const paint = ctx.createPattern(next, 'no-repeat');
  paint.setTransform(new DOMMatrix([1 / scale, 0, 0, 1 / scale, 0, 0]));
  const U = clamp(Math.sqrt(W * H) / 1100, .7, 1.6), slant = .45, band = 260 * U, end = W + slant * H + band;
  const r = rng((Math.random() * 2 ** 32) >>> 0);
  let t0 = null, done = 0;
  return new Promise(resolve => requestAnimationFrame(function frame(now) {
    if (t0 === null) { t0 = now; return requestAnimationFrame(frame); }   // the clock starts once the frames come steadily
    const t = clamp((now - t0) / 1000 / SWEEP), e = t * t * (3 - 2 * t);
    const front = -band + e * (end + band);
    ctx.save();
    ctx.strokeStyle = paint; ctx.lineCap = 'round';
    // as many strokes as it takes to go over the stretch the front has just crossed about five times
    const w = 30 * U, len = 110 * U;
    for (let n = Math.ceil((front - done) * H / (w * len) * 5); n > 0; n--) {
      const y = r() * H, s = front - band * Math.pow(r(), 1.6), x = s - slant * y;
      const a = -.35 + (r() - .5) * .7, ca = Math.cos(a) * len / 2, sa = Math.sin(a) * len / 2;
      const ww = w * (.6 + r() * .8), bristles = Math.max(2, Math.round(ww / 2.2));
      const dx = ca * 2, dy = sa * 2, nx = -sa / (len / 2), ny = ca / (len / 2);
      ctx.globalAlpha = .75 + r() * .25; ctx.lineWidth = 2.6;
      ctx.beginPath();                                   // one path a stroke: every bristle is a straight line
      for (let i = 0; i < bristles; i++) {
        if (r() < .15) continue;
        const o = (i / (bristles - 1) - .5) * ww, s0 = r() * r() * .25, s1 = 1 - r() * r() * .25;
        ctx.moveTo(x - ca + dx * s0 + nx * o, y - sa + dy * s0 + ny * o);
        ctx.lineTo(x - ca + dx * s1 + nx * o, y - sa + dy * s1 + ny * o);
      }
      ctx.stroke();
    }
    ctx.restore();
    done = front;
    if (t < 1) return requestAnimationFrame(frame);
    // the last coat: whatever of the old picture the strokes missed fades under, over about half a second
    let k = 0;
    requestAnimationFrame(function last() {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = ++k < 36 ? .08 : 1; ctx.drawImage(next, 0, 0);
      ctx.restore();
      if (k < 36) requestAnimationFrame(last); else resolve();
    });
  }));
}

async function advance() {
  if (busy) return;
  busy = true;
  try {
    const img = await load(PHOTOS[at]);
    at = (at + 1) % PHOTOS.length;
    shown = study(img);
    await sweepIn(shown);
  } finally { busy = false; }
  if (stale) refit();
}
// A new size: the picture on show is painted again to fit it (once it is no longer being brushed in).
function refit() {
  stale = busy;
  if (busy) return;
  fit();
  if (shown) paintPicture(ctx, W, H, shown);
}

// paper grain, laid over everything
{ const n = 256, g = document.createElement('canvas'); g.width = g.height = n;
  const x = g.getContext('2d'), id = x.createImageData(n, n), d = id.data, r = rng(42);
  for (let i = 0; i < d.length; i += 4) { const v = 128 + (r() - .5) * (r() < .25 ? 150 : 70); d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  x.putImageData(id, 0, 0);
  document.documentElement.style.setProperty('--grain', `url(${g.toDataURL()})`); }

fit();
ctx.fillStyle = '#e9e3d1'; ctx.fillRect(0, 0, W, H);
advance();                                                   // the first one is brushed in over bare paper
setInterval(advance, (EVERY + SWEEP) * 1000);
let timer = 0;
addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(refit, 200); });
})();
