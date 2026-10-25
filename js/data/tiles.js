// Tile and prop painters. 16x16 tiles in 3/4 oblique: floors top-down, walls show a
// 2-tile (32px) front face with a 2px highlight lip; light from the upper-left.
import { Painter, bayer, makeCanvas } from '../core/gfx.js';
import { R, OUTLINE } from './palette.js';

// deterministic hash for variants
export function hash(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ---------------------------------------------------------------- theme palettes
export const THEMES = {
  tunnel: {
    floor: ['#8C5A34', '#734A2E', '#603C26', '#4A3020', '#3A2418'],
    path: ['#9AA0A8', '#6E747E', '#4C5058', '#33363C', '#1E2024'],
    face: ['#8A8670', '#64604E', '#4C4A3E', '#44403A', '#2A2826'],
    top: '#2A2018', shadow: '#3A2418',
  },
  vault: {
    floor: R.stone, path: R.stone,
    face: R.stone, top: '#6E6858', shadow: '#9A927E', glyph: R.glass,
  },
  ashen: {
    floor: R.seaRuin, path: R.folRuin, face: R.iron, top: '#2A2826', shadow: '#44403A',
  },
  mobliz: {
    floor: R.folRuin, path: R.leather, face: R.cream, top: '#3A2418', shadow: '#453E26', flower: R.folSilent,
  },
  house: {
    floor: R.leather, path: R.plum, face: R.cream, top: '#3A2418', shadow: '#603C26',
  },
};

// ---------------------------------------------------------------- floor painters
function speckle(p, x0, y0, ramp, seed, density, step) {
  for (let i = 0; i < density; i++) {
    const x = Math.floor(hash(seed, i, 1) * 16), y = Math.floor(hash(seed, i, 2) * 16);
    p.set(x0 + x, y0 + y, ramp[step + (hash(seed, i, 3) > 0.5 ? 1 : 0)]);
  }
}

const FLOOR = {
  dirt(p, v, seed, t) {
    const r = t.floor;
    p.rect(0, 0, 16, 16, r[2]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (hash(seed, x + y * 16, 7) < 0.12) p.set(x, y, bayer(x, y, 2) ? r[1] : r[3]);
    // up to 4 texture clusters (pebbles)
    for (let i = 0; i < 1 + v; i++) {
      const x = 2 + Math.floor(hash(seed, i, 4) * 11), y = 2 + Math.floor(hash(seed, i, 5) * 11);
      p.set(x, y, r[1]); p.set(x + 1, y, r[0]); p.set(x, y + 1, r[3]); p.set(x + 1, y + 1, r[3]);
    }
  },
  rail(p, v, seed, t) {
    FLOOR.dirt(p, v, seed, t);
    const w = R.leather;
    for (let x = 1; x < 16; x += 5) { p.rect(x, 2, 3, 12, w[3]); p.rect(x, 2, 3, 1, w[2]); }
    p.rect(0, 4, 16, 1, R.iron[0]); p.rect(0, 5, 16, 1, R.iron[2]);
    p.rect(0, 11, 16, 1, R.iron[0]); p.rect(0, 12, 16, 1, R.iron[2]);
  },
  stone(p, v, seed, t, x0, y0) { // vault floor: big slabs, curved hairline seams
    const r = t.floor;
    p.rect(0, 0, 16, 16, r[1]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      if (bayer(x, y, 1) && hash(seed, x, y) < 0.18) p.set(x, y, r[2]);
    }
    // slab seams every 32px (meta-tile), so seams don't grid every tile
    if (x0 % 2 === 0) for (let y = 0; y < 16; y++) p.set(0, y, r[2]);
    if (y0 % 2 === 0) for (let x = 0; x < 16; x++) p.set(x, 0, r[2]);
    if (v === 3) { p.set(5, 7, r[3]); p.set(6, 8, r[3]); p.set(7, 8, r[3]); } // hairline crack
    if (v === 4) { p.set(9, 9, R.folSilent[2]); p.set(10, 9, R.folSilent[1]); p.set(10, 10, R.folSilent[3]); } // moss
  },
  rune(p, v, seed, t, x0, y0) { // vault floor inlay
    FLOOR.stone(p, v, seed, t, x0, y0);
    const g = R.brass;
    for (let i = 3; i < 13; i++) { p.set(i, 3, g[2]); p.set(i, 12, g[2]); p.set(3, i, g[2]); p.set(12, i, g[2]); }
    p.rect(7, 7, 2, 2, R.glass[2]);
  },
  sand(p, v, seed, t) {
    const r = t.floor;
    p.rect(0, 0, 16, 16, r[1]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const n = Math.sin((x + seed * 3) * 0.5 + y * 0.9);
      if (n > 0.7 && bayer(x, y, 2)) p.set(x, y, r[2]);
      else if (n < -0.85 && bayer(x, y, 1)) p.set(x, y, r[0]);
    }
    if (v === 4) { p.rect(6, 7, 3, 2, R.stone[2]); p.set(6, 7, R.stone[0]); } // a bone
  },
  grass(p, v, seed, t) { // ruined grass: dry tufts
    const r = t.floor;
    p.rect(0, 0, 16, 16, r[2]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (bayer(x, y, 1) && hash(seed, x, y) < 0.35) p.set(x, y, r[3]);
    for (let i = 0; i < 3; i++) {
      const x = 1 + Math.floor(hash(seed, i, 8) * 13), y = 3 + Math.floor(hash(seed, i, 9) * 11);
      p.set(x, y, r[1]); p.set(x + 1, y - 1, r[0]); p.set(x + 2, y, r[1]); p.set(x + 1, y, r[1]);
    }
    if (v === 4) { p.set(8, 8, R.tunicRed[1]); p.set(9, 8, R.leather[0]); } // a lost button
  },
  path(p, v, seed, t) {
    const r = t.path;
    p.rect(0, 0, 16, 16, r[2]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (hash(seed, x, y) < 0.15) p.set(x, y, bayer(x, y, 2) ? r[1] : r[3]);
    p.set(4 + v, 6, r[0]); p.set(10, 11 - v, r[3]);
  },
  flowers(p, v, seed, t) { // the impossible overnight bloom: silent green, white flowers that never move
    const r = t.flower;
    p.rect(0, 0, 16, 16, r[2]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (bayer(x, y, 2) && hash(seed, x, y) < 0.4) p.set(x, y, r[3]);
    for (let i = 0; i < 4; i++) {
      const x = 2 + Math.floor(hash(seed, i, 11) * 11), y = 2 + Math.floor(hash(seed, i, 12) * 11);
      p.set(x, y, R.stone[0]); p.set(x - 1, y, R.stone[1]); p.set(x + 1, y, R.stone[1]); p.set(x, y - 1, R.stone[0]); p.set(x, y + 1, R.stone[2]);
      p.set(x, y, i % 2 ? R.glass[1] : R.brass[0]);
      p.set(x + 1, y + 2, r[1]);
    }
  },
  crop(p, v, seed, t, x0, y0, state) { // furrows with dead or sprouting crops
    const r = R.leather;
    p.rect(0, 0, 16, 16, r[3]);
    for (let y = 0; y < 16; y += 4) { p.rect(0, y, 16, 2, r[2]); p.rect(0, y, 16, 1, r[1]); }
    const plant = state === 'watered' ? R.folRest : R.folRuin;
    for (let x = 2; x < 16; x += 5) for (let y = 1; y < 16; y += 4) {
      p.set(x, y - 1, plant[1]); p.set(x + 1, y - 2, plant[0]); p.set(x - 1, y - 1, plant[2]);
    }
    if (state === 'watered') for (let i = 0; i < 6; i++) p.set(Math.floor(hash(seed, i, 3) * 16), Math.floor(hash(seed, i, 4) * 16), R.seaRuin[3]);
  },
  wood(p, v, seed, t) {
    const r = t.floor;
    p.rect(0, 0, 16, 16, r[2]);
    for (let y = 0; y < 16; y += 4) { p.rect(0, y + 3, 16, 1, r[3]); p.rect(0, y, 16, 1, r[1]); }
    const off = (seed % 3) * 5;
    for (let y = 0; y < 16; y += 4) p.set((off + y * 3) % 16, y + 1, r[4]);
  },
  rug(p, v, seed, t, x0, y0) {
    const r = t.path;
    p.rect(0, 0, 16, 16, r[2]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((x + y) % 4 === 0) p.set(x, y, r[1]);
    p.rect(0, 0, 16, 1, R.brass[2]);
  },
  water(p, v, seed, t, x0, y0, state, frame = 0) {
    const r = R.seaRuin;
    p.rect(0, 0, 16, 16, r[2]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (bayer(x, y, 1) && ((x + y + frame) % 8 === 0)) p.set(x, y, r[3]);
  },
  void(p) { p.rect(0, 0, 16, 16, OUTLINE); },
};

// ---------------------------------------------------------------- walls
// part: 'top' (cap), 'upper' (top half of the face, with lip), 'lower' (bottom half)
function paintWall(p, theme, t, part, seed, x0, glyphFrame) {
  const f = t.face;
  if (part === 'top') {
    p.rect(0, 0, 16, 16, t.top);
    if (theme === 'vault') { p.rect(0, 0, 16, 16, R.stone[3]); for (let x = 0; x < 16; x++) if (bayer(x, 0, 2)) p.set(x, 15, R.stone[4]); }
    if (theme === 'tunnel' || theme === 'ashen') {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (hash(seed, x, y) < 0.08) p.set(x, y, f[4]);
    }
    return;
  }
  if (theme === 'tunnel' || theme === 'ashen') { // rough rock with strata
    p.rect(0, 0, 16, 16, f[2]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const n = hash(seed, x >> 1, y >> 1);
      if (n < 0.25) p.set(x, y, f[1]); else if (n > 0.8) p.set(x, y, f[3]);
    }
    for (let x = 0; x < 16; x++) p.set(x, 5 + Math.round(Math.sin((x + seed) * 0.6)), f[3]);
    if (part === 'upper') { p.rect(0, 0, 16, 2, f[0]); p.rect(0, 2, 16, 1, f[1]); }
    if (part === 'lower') { for (let x = 0; x < 16; x++) p.set(x, 15, f[4]); for (let x = 0; x < 16; x++) if (bayer(x, 14, 2)) p.set(x, 14, f[3]); }
    return;
  }
  if (theme === 'vault') { // smooth white stone, curved seams, glyph bands
    p.rect(0, 0, 16, 16, f[1]);
    for (let x = 0; x < 16; x++) if (bayer(x, 0, 1)) for (let y = 4; y < 16; y += 7) p.set(x, y, f[2]);
    p.rect(15, 0, 1, 16, f[2]);
    if (part === 'upper') { p.rect(0, 0, 16, 2, f[0]); p.rect(0, 2, 16, 1, f[2]); }
    if (part === 'lower') { p.rect(0, 13, 16, 3, f[2]); p.rect(0, 15, 16, 1, f[3]); }
    if (glyphFrame != null) {
      const g = R.glass;
      const lvl = [4, 3, 2, 1, 2, 3][glyphFrame % 6];
      const c = g[lvl];
      const rows = part === 'upper' ? [6, 10] : [3, 7];
      const pat = Math.floor(seed * 7) % 4;
      for (const y of rows) for (let x = 2; x < 14; x++) if (((x + pat) % 5) !== 0) p.set(x, y, c);
      p.set(4 + pat, rows[0] + 1, c); p.set(9 - pat, rows[1] - 1, c);
    }
    return;
  }
  // plaster with wooden beams (houses / Mobliz)
  p.rect(0, 0, 16, 16, f[1]);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (bayer(x, y, 1) && hash(seed, x, y) < 0.3) p.set(x, y, f[2]);
  const w = R.leather;
  if (part === 'upper') { p.rect(0, 0, 16, 3, w[2]); p.rect(0, 0, 16, 1, w[1]); p.rect(0, 3, 16, 1, w[3]); }
  if (part === 'lower') { p.rect(0, 12, 16, 4, w[2]); p.rect(0, 12, 16, 1, w[1]); p.rect(0, 15, 16, 1, w[4]); }
  if ((x0 % 3) === 0) { p.rect(0, 0, 2, 16, w[2]); p.rect(0, 0, 1, 16, w[1]); }
}

// ---------------------------------------------------------------- tile entry point
// Map chars -> tile kinds. Walls are '#' (or 'G' glyph wall in the vault).
export const TILE_KIND = {
  '#': 'wall', 'G': 'glyph', '.': 'floor', ',': 'path', '=': 'rail', '"': 'flowers', 'c': 'crop', 'w': 'water',
  ' ': 'void', 'o': 'rune', 'r': 'floor', 'x': 'floor', '_': 'floor',
};
export const SOLID = new Set(['wall', 'glyph', 'water', 'void']);

const FLOOR_FOR = {
  tunnel: { floor: 'dirt', path: 'dirt', rail: 'rail' },
  vault: { floor: 'stone', path: 'stone', rune: 'rune' },
  ashen: { floor: 'sand', path: 'path' },
  mobliz: { floor: 'grass', path: 'path', flowers: 'flowers', crop: 'crop', water: 'water' },
  house: { floor: 'wood', path: 'rug' },
};

const tileCache = new Map();
export function tileCanvas(theme, kind, x, y, part, state, frame) {
  const t = THEMES[theme];
  const r = hash(x, y, 3);
  const v = r < 0.03 ? 4 : r < 0.05 ? 3 : Math.floor(hash(x, y, 9) * 3); // 4 variants + rare accents
  const key = [theme, kind, part, state, frame, kind === 'wall' || kind === 'glyph' ? (x % 3) + ':' + (Math.floor(hash(x, y) * 8)) : v, (x % 2) + (y % 2) * 2].join('|');
  let c = tileCache.get(key);
  if (c) return c;
  const p = new Painter(16, 16);
  const seed = Math.floor(hash(x, y, 1) * 1000);
  if (kind === 'wall' || kind === 'glyph') paintWall(p, theme, t, part, hash(x, y), x, kind === 'glyph' && part !== 'top' ? frame : null);
  else {
    const name = (FLOOR_FOR[theme] && FLOOR_FOR[theme][kind]) || kind;
    const fn = FLOOR[name] || FLOOR.dirt;
    fn(p, v, seed, t, x, y, state, frame);
  }
  c = p.toCanvas();
  tileCache.set(key, c);
  return c;
}

// ---------------------------------------------------------------- props
// Each prop: { w, h (px), foot: [dx, dy, tw, th] collision in tiles from the prop's tile
// origin (bottom-left anchored), paint(p, state, frame) }
const L = R.leather, I = R.iron, S = R.stone, B = R.brass, G = R.glass, C = R.cream;

export const PROPS = {
  lantern: { w: 16, h: 32, foot: [0, 0, 1, 1], light: 52, anim: true,
    paint(p, s, f) {
      p.rect(7, 12, 2, 20, L[3]); p.rect(7, 12, 1, 20, L[2]);
      p.rect(4, 4, 8, 9, I[2]); p.rect(5, 5, 6, 7, OUTLINE);
      const fl = [[R.brass[0], '#FFC040', '#F06020'], ['#FFF8D0', '#FFC040', '#F06020'], ['#FFC040', '#F06020', '#8A2018'], ['#FFF8D0', '#F5D68A', '#F06020']][f % 4];
      p.rect(6, 7, 4, 4, fl[1]); p.rect(7, 6 + (f % 2), 2, 3, fl[0]); p.set(6, 10, fl[2]); p.set(9, 10, fl[2]);
      p.rect(3, 3, 10, 1, I[1]); p.rect(6, 1, 4, 2, I[2]);
      p.deepOutline();
    } },
  crate: { w: 16, h: 18, foot: [0, 0, 1, 1],
    paint(p) {
      p.rect(1, 2, 14, 15, L[2]); p.rect(1, 2, 14, 4, L[1]); p.rect(1, 2, 14, 1, L[0]);
      p.line(2, 7, 13, 15, L[3]); p.line(2, 15, 13, 7, L[3]); p.rect(1, 6, 14, 1, L[3]);
      p.deepOutline();
    } },
  beam: { w: 16, h: 40, foot: [0, 0, 1, 1],
    paint(p) {
      p.rect(4, 4, 8, 36, L[2]); p.rect(4, 4, 2, 36, L[1]); p.rect(10, 4, 2, 36, L[3]);
      p.rect(0, 0, 16, 5, L[2]); p.rect(0, 0, 16, 1, L[1]); p.rect(6, 14, 4, 2, I[1]);
      p.deepOutline();
    } },
  cart: { w: 32, h: 24, foot: [0, 0, 2, 1],
    paint(p) {
      p.rect(2, 4, 28, 13, I[2]); p.rect(2, 4, 28, 2, I[1]); p.rect(2, 4, 28, 1, I[0]);
      for (let x = 4; x < 30; x += 6) p.set(x, 9, I[0]);
      p.rect(4, 1, 24, 4, R.seaRuin[2]); p.set(10, 1, S[1]); p.set(20, 2, B[1]);
      p.ellipse(8, 19, 3, 3, I); p.ellipse(24, 19, 3, 3, I);
      p.deepOutline();
    } },
  tent: { w: 48, h: 36, foot: [0, 0, 3, 1],
    paint(p) {
      for (let y = 4; y < 34; y++) { const half = Math.floor((y - 2) * 0.75); p.rect(24 - half, y, half * 2, 1, y < 12 ? R.coatDrab[1] : R.coatDrab[2]); }
      for (let y = 14; y < 34; y++) { const half = Math.floor((y - 14) * 0.35); p.rect(24 - half, y, half * 2, 1, OUTLINE); }
      p.rect(23, 0, 2, 6, L[3]);
      p.deepOutline();
    } },
  rubble: { w: 32, h: 24, foot: [0, 0, 2, 1],
    paint(p) {
      p.ellipse(10, 15, 9, 7, R.seaRuin); p.ellipse(22, 16, 8, 6, R.seaRuin, { offset: 1 });
      p.ellipse(16, 10, 7, 6, I); p.rect(5, 18, 4, 3, S[2]);
      p.deepOutline();
    } },
  whiteDoor: { w: 64, h: 64, foot: [0, 0, 4, 1],
    paint(p, s, f) { // the sealed vault door, carved with warnings in a dead language
      const open = s === 'open';
      p.rect(0, 0, 64, 64, S[3]);
      p.ellipse(32, 30, 30, 30, S);
      p.rect(2, 30, 60, 34, S[1]); p.rect(2, 30, 2, 34, S[0]); p.rect(60, 30, 2, 34, S[3]);
      // arch
      for (let a = 180; a <= 360; a += 1) { const r = a * Math.PI / 180; for (const rr of [24, 25]) p.set(32 + Math.cos(r) * rr, 34 + Math.sin(r) * rr, rr === 24 ? B[1] : B[2]); }
      if (open) {
        p.rect(10, 34, 44, 30, OUTLINE);
        p.ellipse(32, 34, 22, 22, OUTLINE);
        for (let y = 20; y < 64; y++) for (let x = 10; x < 54; x++) if (p.get(x, y) === OUTLINE && bayer(x, y, 1) && y > 50) p.set(x, y, G[4]);
      } else {
        p.rect(10, 34, 44, 30, S[2]); p.rect(31, 34, 2, 30, S[4]);
        for (let i = 0; i < 6; i++) {
          const lit = f > i;
          const gx = 14 + i * 7;
          p.rect(gx, 40, 4, 4, lit ? G[1] : S[3]); p.set(gx + 1, 41, lit ? G[0] : S[4]);
        }
        for (let y = 48; y < 62; y += 4) for (let x = 13; x < 52; x++) if ((x * 7 + y) % 9 < 5) p.set(x, y, S[3]);
        p.ellipse(32, 22, 4, 4, [G[1], G[2], G[3], G[4], G[4]]);
      }
      p.outline(() => S[4]);
    } },
  pillar: { w: 16, h: 48, foot: [0, 0, 1, 1], light: 0,
    paint(p, s) {
      p.rect(2, 6, 12, 40, S[1]); p.rect(2, 6, 3, 40, S[0]); p.rect(11, 6, 3, 40, S[2]);
      p.rect(0, 0, 16, 7, S[1]); p.rect(0, 0, 16, 2, S[0]); p.rect(0, 42, 16, 6, S[2]);
      const on = s === 'lit';
      p.ellipse(8, 18, 3, 4, on ? [G[0], G[0], G[1], G[2], G[3]] : [S[3], S[3], S[4], S[4], S[4]]);
      p.ring(8, 18, 4, 5, [B[0], B[1], B[2], B[3]]);
      p.outline(() => S[4]);
    } },
  sealedDoor: { w: 32, h: 32, foot: [0, 0, 2, 1],
    paint(p, s, f) {
      if (s === 'open') return;
      p.rect(0, 0, 32, 32, S[2]); p.rect(0, 0, 32, 2, S[0]); p.rect(15, 2, 2, 30, S[4]);
      p.ellipse(16, 14, 5, 5, f % 60 < 30 ? [G[0], G[1], G[2], G[3], G[4]] : [S[2], S[3], S[3], S[4], S[4]]);
      p.outline(() => S[4]);
    } },
  sparkle: { w: 16, h: 16, foot: [0, 0, 0, 0], anim: true,
    paint(p, s, f) {
      if (s === 'taken') return;
      const k = f % 4;
      const c = [G[0], G[1], R.brass[0], G[1]][k];
      p.set(8, 8, '#FFFDF5'); p.set(8, 8 - 1 - (k % 2), c); p.set(8, 9 + (k % 2), c); p.set(7 - (k % 2), 8, c); p.set(9 + (k % 2), 8, c);
    } },
  core: { w: 160, h: 112, foot: [0, 0, 10, 2],
    paint(p, s, f) { // SOLACE asleep: a colossal cathedral face of white stone, eye shut
      const w = 160, h = 112;
      // arches
      for (let i = 0; i < 5; i++) {
        const cx = 16 + i * 32, top = i === 2 ? 4 : 20;
        p.rect(cx - 12, top + 14, 24, h - top - 14, i % 2 ? S[2] : S[1]);
        p.ellipse(cx, top + 14, 12, 12, S);
        p.rect(cx - 6, top + 22, 12, h - top - 30, S[4]);
        p.ellipse(cx, top + 22, 6, 6, S[4]);
      }
      // crown arch
      for (let a = 180; a <= 360; a++) { const r = a * Math.PI / 180; for (const rr of [44, 45, 46]) p.set(80 + Math.cos(r) * rr, 60 + Math.sin(r) * rr, rr === 44 ? B[0] : B[2]); }
      // the eye (shut, or opening)
      const open = s === 'open' ? 1 : s === 'half' ? 0.5 : 0;
      p.ellipse(80, 60, 22, 14, S);
      p.ellipse(80, 60, 18, Math.max(1, 10 * open), open ? [G[0], G[1], G[2], G[3], G[4]] : S[3]);
      if (open) p.ellipse(80, 60, 5, Math.max(1, 6 * open), [OUTLINE, OUTLINE, G[4], G[4], G[4]]);
      if (!open) p.rect(60, 60, 40, 1, S[4]);
      // conduits
      for (const x of [8, 152]) { p.rect(x - 3, 30, 6, 82, B[2]); p.rect(x - 3, 30, 2, 82, B[1]); }
      for (let i = 0; i < 6; i++) p.set(20 + i * 23, 100 - i * 3, R.folSilent[2]);
      p.outline(() => S[4]);
    } },
  cottage: { w: 64, h: 64, foot: [0, 0, 4, 2], door: [1, 0],
    paint(p, s) { // patched roof, plaster, a door on the second tile
      const roof = s === 'school' ? R.farmBlue : R.tunicRed;
      // walls
      p.rect(2, 30, 60, 34, C[1]); p.rect(2, 30, 3, 34, C[0]); p.rect(58, 30, 4, 34, C[2]);
      for (const x of [2, 30, 58]) p.rect(x, 30, 4, 34, L[2]);
      p.rect(2, 60, 60, 4, L[3]);
      // door (2nd tile) + window
      p.rect(18, 44, 12, 20, L[3]); p.rect(19, 45, 10, 19, L[2]); p.set(27, 54, B[0]);
      p.rect(40, 42, 12, 10, R.night[3]); p.rect(40, 42, 12, 1, L[2]); p.rect(45, 42, 1, 10, L[2]); p.rect(40, 46, 12, 1, L[2]);
      // roof slope
      for (let y = 0; y < 32; y++) {
        const inset = Math.max(0, 16 - y);
        p.rect(inset, y, 64 - inset * 2, 1, y < 4 ? roof[1] : y % 4 === 0 ? roof[3] : roof[2]);
      }
      p.rect(0, 30, 64, 2, roof[3]);
      // patches (ruined)
      p.rect(36, 14, 8, 6, L[2]); p.rect(36, 14, 8, 1, L[1]); p.set(37, 16, I[1]); p.set(42, 18, I[1]);
      p.rect(48, 2, 6, 12, I[2]); p.rect(48, 0, 6, 2, I[1]); // chimney
      p.deepOutline();
    } },
  deadTree: { w: 32, h: 48, foot: [0, 0, 1, 1], tx: 1,
    paint(p) {
      const w = R.leather;
      p.rect(14, 20, 5, 28, w[3]); p.rect(14, 20, 2, 28, w[2]);
      p.thickLine(16, 24, 5, 10, w[3], 2); p.thickLine(17, 20, 26, 6, w[3], 2); p.thickLine(16, 14, 14, 0, w[3], 2);
      p.thickLine(8, 13, 3, 12, w[2], 1); p.thickLine(24, 9, 29, 10, w[2], 1);
      p.ellipse(16, 46, 6, 2, w[4]);
      p.deepOutline();
    } },
  well: { w: 32, h: 32, foot: [0, 0, 2, 1],
    paint(p) {
      p.ellipse(16, 22, 13, 8, R.seaRuin); p.ellipse(16, 21, 9, 5, OUTLINE);
      p.rect(3, 0, 3, 22, L[2]); p.rect(26, 0, 3, 22, L[3]); p.rect(2, 0, 28, 3, L[1]);
      p.rect(15, 3, 2, 10, I[2]); p.rect(13, 12, 6, 4, L[2]);
      p.deepOutline();
    } },
  fence: { w: 16, h: 16, foot: [0, 0, 1, 1],
    paint(p) {
      p.rect(1, 2, 3, 14, L[2]); p.rect(12, 2, 3, 14, L[3]);
      p.rect(0, 5, 16, 2, L[1]); p.rect(0, 10, 16, 2, L[2]);
      p.deepOutline();
    } },
  sign: { w: 16, h: 24, foot: [0, 0, 1, 1],
    paint(p) { p.rect(7, 10, 2, 14, L[3]); p.rect(1, 2, 14, 9, L[1]); p.rect(1, 2, 14, 1, L[0]); p.rect(3, 5, 10, 1, L[3]); p.rect(3, 7, 7, 1, L[3]); p.deepOutline(); } },
  bed: { w: 16, h: 32, foot: [0, 0, 1, 2], tall: 2,
    paint(p, s) {
      p.rect(1, 2, 14, 28, L[2]); p.rect(1, 2, 14, 3, L[1]);
      p.rect(2, 5, 12, 6, C[0]);
      p.rect(2, 11, 12, 18, s === 'empty' ? C[2] : R.farmBlue[2]); p.rect(2, 11, 12, 2, s === 'empty' ? C[1] : R.farmBlue[1]);
      if (s && s !== 'empty') { const hair = { pip: R.skyRuin, rowan: R.brownHair, mina: R.ashBlonde, tobin: R.brownHair }[s] || R.brownHair; p.ellipse(8, 9, 4, 3, [R.skinLight[1], R.skinLight[1], R.skinLight[2], R.skinLight[3], R.skinLight[3]]); p.rect(4, 5, 8, 3, hair[2]); }
      p.deepOutline();
    } },
  table: { w: 32, h: 24, foot: [0, 0, 2, 1],
    paint(p) {
      p.rect(1, 2, 30, 10, L[1]); p.rect(1, 2, 30, 2, L[0]); p.rect(1, 12, 30, 3, L[3]);
      p.rect(3, 15, 3, 8, L[3]); p.rect(26, 15, 3, 8, L[3]);
      p.rect(8, 4, 5, 3, C[0]); p.rect(19, 4, 6, 4, S[1]); p.rect(20, 5, 4, 2, R.leather[2]);
      p.deepOutline();
    } },
  shelf: { w: 32, h: 32, foot: [0, 0, 2, 1],
    paint(p) {
      p.rect(1, 1, 30, 30, L[3]); p.rect(1, 1, 30, 2, L[1]);
      for (const y of [10, 20]) p.rect(2, y, 28, 2, L[2]);
      const books = [R.tunicRed[2], R.farmBlue[2], R.moss[2], R.brass[2], R.plum[2]];
      for (let i = 0; i < 12; i++) p.rect(3 + (i % 6) * 4, i < 6 ? 4 : 14, 3, 6, books[i % 5]);
      p.rect(4, 23, 8, 6, C[1]); p.rect(18, 24, 10, 5, S[2]);
      p.deepOutline();
    } },
  stove: { w: 16, h: 24, foot: [0, 0, 1, 1], light: 30, anim: true,
    paint(p, s, f) { p.rect(1, 4, 14, 20, I[2]); p.rect(1, 4, 14, 2, I[1]); p.rect(4, 12, 8, 6, OUTLINE); p.rect(5, 15, 6, 3, f % 2 ? '#F06020' : '#FFC040'); p.rect(6, 0, 4, 4, I[3]); p.deepOutline(); } },
  barrel: { w: 16, h: 18, foot: [0, 0, 1, 1],
    paint(p) { p.ellipse(8, 10, 6, 7, L); p.rect(2, 5, 12, 1, I[1]); p.rect(2, 14, 12, 1, I[1]); p.ellipse(8, 4, 5, 2, L[3]); p.deepOutline(); } },
  bones: { w: 16, h: 12, foot: [0, 0, 0, 0],
    paint(p) { p.rect(2, 6, 10, 2, S[1]); p.ellipse(13, 6, 2, 2, S); p.rect(4, 9, 6, 1, S[2]); p.outline(() => S[4]); } },
  rock: { w: 16, h: 16, foot: [0, 0, 1, 1],
    paint(p) { p.ellipse(8, 9, 7, 6, R.iron); p.deepOutline(); } },
  bigRock: { w: 32, h: 28, foot: [0, 0, 2, 1],
    paint(p) { p.ellipse(16, 16, 15, 11, R.iron); p.ellipse(10, 20, 8, 6, R.seaRuin, { offset: 1 }); p.deepOutline(); } },
  ruinWall: { w: 48, h: 40, foot: [0, 0, 3, 1],
    paint(p) { // a broken wall of the old Empire
      for (let x = 0; x < 48; x++) { const top = 10 + Math.round(Math.abs(Math.sin(x * 0.3)) * 10) + (x > 30 ? 8 : 0); p.rect(x, top, 1, 40 - top, x < 4 ? R.iron[1] : R.iron[2]); }
      for (let y = 18; y < 40; y += 6) for (let x = 0; x < 48; x++) if (p.get(x, y)) p.set(x, y, R.iron[3]);
      p.rect(10, 26, 6, 4, R.imperial[3]);
      p.deepOutline();
    } },
};

const propCache = new Map();
export function propCanvas(type, state, frame) {
  const P = PROPS[type];
  const key = type + '|' + state + '|' + (P.anim || type === 'whiteDoor' || type === 'sealedDoor' || type === 'core' ? frame : 0);
  let c = propCache.get(key);
  if (!c) {
    const p = new Painter(P.w, P.h);
    P.paint(p, state, frame);
    c = p.toCanvas();
    propCache.set(key, c);
  }
  return c;
}

// 3-ring dithered light pool (night / caves)
export function lightPool(r) {
  const { canvas, ctx } = makeCanvas(r * 2, r * 2);
  return { canvas, ctx };
}
