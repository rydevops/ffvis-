// Low-level pixel helpers. Everything is drawn at 1x into a 384x216 canvas and only ever
// shown at integer scales; nothing here resamples pixels.
import { OUTLINE, DEEP_OF, SHADOW_OF, UI, hexToRgb, rgbToHex } from '../data/palette.js';

export const W = 384;
export const H = 216;

export function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

// ---------------------------------------------------------------- sprites from text
// rows: array of equal-length strings; map: { char: '#RRGGBB' }. '.' and ' ' are clear.
export function sprite(rows, map) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const { canvas, ctx } = makeCanvas(w, h);
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const hex = map[ch];
      if (!hex) continue;
      const [r, g, b] = hexToRgb(hex);
      const i = (y * w + x) * 4;
      img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

const flipCache = new WeakMap();
export function flipH(src) {
  let c = flipCache.get(src);
  if (c) return c;
  const out = makeCanvas(src.width, src.height);
  out.ctx.translate(src.width, 0);
  out.ctx.scale(-1, 1);
  out.ctx.drawImage(src, 0, 0);
  flipCache.set(src, out.canvas);
  return out.canvas;
}

// Rotate 90° clockwise (lossless; used for knocked-out poses).
export function rot90(src) {
  const out = makeCanvas(src.height, src.width);
  out.ctx.translate(src.height, 0);
  out.ctx.rotate(Math.PI / 2);
  out.ctx.drawImage(src, 0, 0);
  return out.canvas;
}

// Map every opaque pixel through fn([r,g,b]) -> [r,g,b] (palette swaps / status tints).
export function recolor(src, fn) {
  const out = makeCanvas(src.width, src.height);
  out.ctx.drawImage(src, 0, 0);
  const img = out.ctx.getImageData(0, 0, src.width, src.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const [r, g, b] = fn(d[i], d[i + 1], d[i + 2]);
    d[i] = r; d[i + 1] = g; d[i + 2] = b;
  }
  out.ctx.putImageData(img, 0, 0);
  return out.canvas;
}

// Exact colour substitution: { '#from': '#to' }.
export function swap(src, table) {
  const t = {};
  for (const [k, v] of Object.entries(table)) t[k.toUpperCase()] = hexToRgb(v);
  return recolor(src, (r, g, b) => t[rgbToHex(r, g, b)] || [r, g, b]);
}

const variantCache = new WeakMap();
function cachedVariant(src, key, make) {
  let m = variantCache.get(src);
  if (!m) { m = {}; variantCache.set(src, m); }
  if (!m[key]) m[key] = make();
  return m[key];
}

export function whiteOf(src) {
  return cachedVariant(src, 'white', () => recolor(src, () => [255, 253, 245]));
}
export function silhouetteOf(src, hex) {
  const c = hexToRgb(hex);
  return cachedVariant(src, 'sil' + hex, () => recolor(src, () => c));
}
export function greyOf(src) { // "stilled" / petrify style full desaturation
  return cachedVariant(src, 'grey', () => recolor(src, (r, g, b) => {
    const l = Math.round(0.3 * r + 0.55 * g + 0.15 * b);
    const q = [0x6E, 0x9A, 0xC4, 0xE8][Math.min(3, Math.floor(l / 64))];
    return [q, q - 4, q - 10];
  }));
}
export function stillOf(src) { // the Stilled: colour drains toward a cold blue-grey, outlines stay dark
  return cachedVariant(src, 'still', () => recolor(src, (r, g, b) => {
    const l = 0.3 * r + 0.55 * g + 0.15 * b;
    if (l < 48) return [0x2A, 0x26, 0x34];
    const k = 0.25; // keep a quarter of the original colour so faces stay readable
    const t = [l * 0.92 + 18, l * 0.96 + 20, l + 34];
    return [r * k + t[0] * (1 - k), g * k + t[1] * (1 - k), b * k + t[2] * (1 - k)].map((v) => Math.max(0, Math.min(255, Math.round(v))));
  }));
}
export function darkOf(src) { // knocked out: palette drops to shadow steps
  return cachedVariant(src, 'dark', () => recolor(src, (r, g, b) => {
    const s = SHADOW_OF[rgbToHex(r, g, b)];
    return s ? hexToRgb(s) : [r * 0.7 | 0, g * 0.65 | 0, b * 0.75 | 0];
  }));
}

// ---------------------------------------------------------------- dithering
// Bayer 2x2 ordered dither. level: 1 = 25%, 2 = 50% (checker), 3 = 75%.
const BAYER2 = [[0, 2], [3, 1]];
export function bayer(x, y, level) {
  return BAYER2[y & 1][x & 1] < level;
}

const patternCache = new Map();
export function ditherPattern(ctx, hex, level) {
  const key = hex + level;
  let p = patternCache.get(key);
  if (!p) {
    const { canvas, ctx: c } = makeCanvas(2, 2);
    c.fillStyle = hex;
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) if (bayer(x, y, level)) c.fillRect(x, y, 1, 1);
    p = ctx.createPattern(canvas, 'repeat');
    patternCache.set(key, p);
  }
  return p;
}

export function ditherRect(ctx, x, y, w, h, hex, level) {
  if (level <= 0) return;
  if (level >= 4) { ctx.fillStyle = hex; ctx.fillRect(x, y, w, h); return; }
  ctx.fillStyle = ditherPattern(ctx, hex, level);
  ctx.fillRect(x, y, w, h);
}

// Vertical band gradient made only of ramp colours + 2x2 dither between bands.
export function bandGradient(ctx, x, y, w, h, ramp) {
  const n = ramp.length;
  const bandH = h / n;
  for (let i = 0; i < n; i++) {
    const y0 = Math.round(y + i * bandH);
    const y1 = Math.round(y + (i + 1) * bandH);
    ctx.fillStyle = ramp[i];
    ctx.fillRect(x, y0, w, y1 - y0);
    if (i < n - 1) {
      const t = Math.max(2, Math.round(bandH / 4));
      ditherRect(ctx, x, y1 - t, w, t, ramp[i + 1], 1);
      ditherRect(ctx, x, y1, w, t, ramp[i], 2);
      ditherRect(ctx, x, y1 + t, w, t, ramp[i], 1);
    }
  }
}

// ---------------------------------------------------------------- procedural painter
// Indexed-colour painter used for machines, effects and tiles. Pixels hold hex strings.
export class Painter {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.px = new Array(w * h).fill(null);
  }
  get(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? null : this.px[y * this.w + x]; }
  set(x, y, c) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.px[y * this.w + x] = c;
  }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  thickLine(x0, y0, x1, y1, c, t) {
    const r = (t - 1) / 2;
    for (let oy = -Math.floor(r); oy <= Math.ceil(r); oy++)
      for (let ox = -Math.floor(r); ox <= Math.ceil(r); ox++) this.line(x0 + ox, y0 + oy, x1 + ox, y1 + oy, c);
  }
  // Filled ellipse shaded with a ramp by a light from the upper-left.
  // ramp: [hi, light, base, shadow, deep]; flat=true uses a single colour.
  ellipse(cx, cy, rx, ry, ramp, opts = {}) {
    const lx = -0.6, ly = -0.7, lz = 0.4;
    const bias = opts.bias ?? 0;
    const steps = opts.steps ?? ramp.length;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
        const d = nx * nx + ny * ny;
        if (d > 1) continue;
        if (typeof ramp === 'string') { this.set(x, y, ramp); continue; }
        const nz = Math.sqrt(Math.max(0, 1 - d));
        let lum = (nx * lx + ny * ly + nz * lz) * 0.5 + 0.5 + bias; // 0..1
        lum = Math.max(0, Math.min(0.999, lum));
        const f = (1 - lum) * (steps - 1);
        let i = Math.floor(f);
        const frac = f - i;
        if (frac > 0.5 && bayer(x, y, Math.round((frac - 0.5) * 6))) i++;
        this.set(x, y, ramp[Math.min(ramp.length - 1, i + (opts.offset || 0))]);
      }
    }
  }
  // Ring (annulus) shaded with a ramp, lit from upper-left.
  ring(cx, cy, r0, r1, ramp, ry = null) {
    const sy = ry ? ry / r1 : 1;
    for (let y = Math.floor(cy - r1 * sy) - 1; y <= cy + r1 * sy + 1; y++) {
      for (let x = Math.floor(cx - r1) - 1; x <= cx + r1 + 1; x++) {
        const dx = x + 0.5 - cx, dy = (y + 0.5 - cy) / sy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < r0 || d > r1) continue;
        const ang = Math.atan2(dy, dx); // light from upper-left = angle -135°
        const lum = Math.cos(ang + Math.PI * 0.75) * 0.5 + 0.5;
        const idx = lum > 0.75 ? 0 : lum > 0.5 ? 1 : lum > 0.25 ? 2 : 3;
        this.set(x, y, ramp[idx]);
      }
    }
  }
  // Flood region (x0..x1, y0..y1) with a vertical ramp gradient + dither.
  vgrad(x, y, w, h, ramp) {
    for (let j = 0; j < h; j++) {
      const f = (j / Math.max(1, h - 1)) * (ramp.length - 1);
      let i = Math.floor(f);
      if (f - i > 0.5 && bayer(x, y + j, 2)) i++;
      for (let k = 0; k < w; k++) {
        let ii = i;
        if (f - i > 0.25 && f - i <= 0.5 && bayer(x + k, y + j, 1)) ii++;
        this.set(x + k, y + j, ramp[Math.min(ramp.length - 1, ii)]);
      }
    }
  }
  // Full 1px outline around opaque pixels. colorFn(neighbourHex) -> outline hex.
  outline(colorFn = () => OUTLINE, diagonal = false) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      const n = this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1) ||
        (diagonal && (this.get(x - 1, y - 1) || this.get(x + 1, y - 1) || this.get(x - 1, y + 1) || this.get(x + 1, y + 1)));
      if (n) add.push([x, y, colorFn(n, x, y)]);
    }
    for (const [x, y, c] of add) this.set(x, y, c);
  }
  // Outline in the deep step of whichever ramp the neighbour belongs to.
  deepOutline() {
    this.outline((n) => DEEP_OF[n.toUpperCase()] || OUTLINE);
  }
  // Selective outline (battle sprites): lit edges (top/left) lighter, shadowed edges deep.
  selectiveOutline() {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      const r = this.get(x + 1, y), d = this.get(x, y + 1), l = this.get(x - 1, y), u = this.get(x, y - 1);
      const n = r || d || l || u;
      if (!n) continue;
      const key = n.toUpperCase();
      const lit = (r || d) && !(l || u);
      add.push([x, y, lit ? (SHADOW_OF[SHADOW_OF[key]] || DEEP_OF[key] || OUTLINE) : (DEEP_OF[key] || OUTLINE)]);
    }
    for (const [x, y, c] of add) this.set(x, y, c);
  }
  stamp(canvasOrPainter, ox, oy, map = null) {
    if (canvasOrPainter instanceof Painter) {
      const p = canvasOrPainter;
      for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
        const c = p.get(x, y);
        if (c) this.set(ox + x, oy + y, c);
      }
    }
    return this;
  }
  // Draw text-art rows onto the painter with a char->colour map.
  art(rows, ox, oy, map, flip = false) {
    for (let y = 0; y < rows.length; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ') continue;
        const c = map[ch];
        if (c) this.set(flip ? ox + row.length - 1 - x : ox + x, oy + y, c);
      }
    }
  }
  toCanvas() {
    const { canvas, ctx } = makeCanvas(this.w, this.h);
    const img = ctx.createImageData(this.w, this.h);
    for (let i = 0; i < this.px.length; i++) {
      const c = this.px[i];
      if (!c) continue;
      const [r, g, b] = hexToRgb(c);
      img.data[i * 4] = r; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
  }
}

// ---------------------------------------------------------------- UI windows
export function drawWindow(ctx, x, y, w, h, opts = {}) {
  x |= 0; y |= 0; w |= 0; h |= 0;
  // body: banded navy-violet with ordered dither between bands
  const top = opts.top || UI.winTop, bot = opts.bot || UI.winBot;
  ctx.fillStyle = bot;
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  const half = Math.floor((h - 4) / 2);
  ctx.fillStyle = top;
  ctx.fillRect(x + 2, y + 2, w - 4, Math.floor(half * 0.6));
  ditherRect(ctx, x + 2, y + 2 + Math.floor(half * 0.6), w - 4, Math.floor(half * 0.5), top, 2);
  ditherRect(ctx, x + 2, y + 2 + Math.floor(half * 1.1), w - 4, Math.floor(half * 0.5), top, 1);
  // frame: dark outer, light stone inner bevel lit from upper-left
  ctx.fillStyle = UI.frameDark;
  ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h);
  ctx.fillStyle = UI.frameLight;
  ctx.fillRect(x + 1, y + 1, w - 2, 1); ctx.fillRect(x + 1, y + 1, 1, h - 2);
  ctx.fillStyle = UI.frameMid;
  ctx.fillRect(x + 1, y + h - 2, w - 2, 1); ctx.fillRect(x + w - 2, y + 1, 1, h - 2);
  // corner rivets in brass
  ctx.fillStyle = '#D4A84E';
  ctx.fillRect(x + 1, y + 1, 1, 1); ctx.fillRect(x + w - 2, y + 1, 1, 1);
  ctx.fillRect(x + 1, y + h - 2, 1, 1); ctx.fillRect(x + w - 2, y + h - 2, 1, 1);
}

// Pointing-hand cursor (glove pointing right, 10x7).
let cursorCanvas = null;
export function cursorSprite() {
  if (!cursorCanvas) {
    cursorCanvas = sprite([
      '.kkkkk....',
      'kWWWWWkkkk',
      'kWWWWWWWWk',
      'kWwWWwkkkk',
      'kWwWWWk...',
      '.kwwwwk...',
      '..kkkk....',
    ], { k: OUTLINE, W: '#FFFDF5', w: '#C4BCA6' });
  }
  return cursorCanvas;
}

export function drawCursor(ctx, x, y, frame = 0) {
  const bob = Math.floor(frame / 10) % 2;
  ctx.drawImage(cursorSprite(), (x | 0) - bob, y | 0);
}
