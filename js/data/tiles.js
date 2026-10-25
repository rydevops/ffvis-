// Tile and prop painters. 16x16 tiles in 3/4 oblique: floors top-down, walls show a
// 2-tile (32px) front face with a 2px highlight lip; light from the upper-left.
import { Painter, bayer, makeCanvas } from '../core/gfx.js';
import { R, OUTLINE, EL } from './palette.js';

// deterministic hash for variants
export function hash(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ---------------------------------------------------------------- themes & world states
// Every theme is authored in up to three palette states (ruin / rest / silent). Tiles are
// painted once per state from the same painters; only the ramps change.
const SNOWR = R.snowRuin, SNOW = R.snowRest;
export const THEMES = {
  tunnel: { floor: ['#8C5A34', '#734A2E', '#603C26', '#4A3020', '#3A2418'], path: R.iron, face: ['#8A8670', '#64604E', '#4C4A3E', '#44403A', '#2A2826'], top: '#2A2018', wall: 'rock' },
  vault: { floor: R.stone, path: R.stone, face: R.stone, top: '#9A927E', wall: 'stone', glyph: 'glass' },
  ashen: { floor: R.seaRuin, path: R.folRuin, face: R.iron, top: '#2A2826', wall: 'rock' },
  mobliz: { floor: R.folRuin, path: R.leather, face: R.iron, top: '#3A2418', wall: 'rock', flower: R.folSilent, water: R.seaRuin,
    rest: { floor: R.folRest, water: R.seaRest } },
  house: { floor: R.leather, path: R.plum, face: R.cream, top: '#3A2418', wall: 'plaster' },
  snow: { floor: SNOWR, path: R.iron, face: R.iron, top: '#2A2826', wall: 'rock', floorKind: 'snow',
    rest: { floor: SNOW } },
  mine: { floor: ['#6E6458', '#585048', '#443E38', '#33302C', '#221E1C'], path: R.iron, face: R.iron, top: '#1E1C1A', wall: 'rock', glyph: 'vein', vein: R.brass,
    rest: { vein: EL.fire } },
  desert: { floor: R.sand, path: R.leather, face: R.sand, top: '#584428', wall: 'brick', floorKind: 'sand' },
  castle: { floor: R.sand, path: R.tunicRed, face: R.sand, top: '#584428', wall: 'brick', floorKind: 'tile', glyph: 'pipe' },
  port: { floor: R.iron, path: R.leather, face: R.cream, top: '#3A2418', wall: 'plaster', floorKind: 'cobble', water: R.seaRuin,
    rest: { water: R.seaRest } },
  mural: { floor: R.folRuin, path: R.leather, face: R.cream, top: '#3A2418', wall: 'plaster', glyph: 'mural', mural: 'faded',
    rest: { floor: R.folRest, mural: 'bright' } },
  archive: { floor: R.leather, path: R.plum, face: R.leather, top: '#1E1418', wall: 'brick', floorKind: 'wood', glyph: 'shelf', water: R.night },
  eastern: { floor: R.iron, path: R.leather, face: R.iron, top: '#1E2024', wall: 'brick', floorKind: 'cobble', water: R.seaRuin,
    rest: { water: R.seaRest } },
  crypt: { floor: R.iron, path: R.seaRuin, face: R.iron, top: '#141618', wall: 'brick', floorKind: 'cobble', water: R.seaRuin, murk: R.seaRuin,
    rest: { water: R.seaRest, murk: R.seaRest } },
  zozo: { floor: R.black, path: R.iron, face: R.iron, top: '#140C14', wall: 'brick', floorKind: 'cobble', glyph: 'window', water: R.night },
  spirit: { floor: R.violet, path: R.spirit, face: R.violet, top: '#2C1C50', wall: 'crystal', floorKind: 'stone', water: R.night, glyph: 'glass' },
  drowned: { floor: R.seaRuin, path: R.coral, face: R.coral, top: '#2A2826', wall: 'rock', floorKind: 'sand', water: R.seaRuin,
    rest: { floor: R.seaRest, water: R.seaRest } },
  deck: { floor: R.leather, path: R.iron, face: R.leather, top: '#3A2418', wall: 'rail', floorKind: 'wood', water: R.skyRuin, void: R.skyRuin,
    rest: { water: R.skyRest, void: R.skyRest } },
  garden: { floor: R.stone, path: R.folSilent, face: R.stone, top: '#6E6858', wall: 'stone', floorKind: 'stone', flower: R.folSilent, glyph: 'glass', water: R.glass },
  dream: { floor: R.folRest, path: R.sand, face: R.stone, top: '#3A2418', wall: 'rock', flower: R.folRest, water: R.seaRest },
};

export function themeFor(name, state) {
  const t = THEMES[name] || THEMES.vault;
  const ov = state && t[state];
  return ov ? { ...t, ...ov } : t;
}

// ---------------------------------------------------------------- floor painters
const FLOOR = {
  dirt(p, v, seed, t) {
    const r = t.floor;
    p.rect(0, 0, 16, 16, r[2]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (hash(seed, x + y * 16, 7) < 0.12) p.set(x, y, bayer(x, y, 2) ? r[1] : r[3]);
    for (let i = 0; i < 1 + v; i++) { // up to 4 texture clusters (pebbles)
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
  stone(p, v, seed, t, x0, y0) { // big slabs, curved hairline seams every meta-tile
    const r = t.floor;
    p.rect(0, 0, 16, 16, r[1]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (bayer(x, y, 1) && hash(seed, x, y) < 0.18) p.set(x, y, r[2]);
    if (x0 % 2 === 0) for (let y = 0; y < 16; y++) p.set(0, y, r[2]);
    if (y0 % 2 === 0) for (let x = 0; x < 16; x++) p.set(x, 0, r[2]);
    if (v === 3) { p.set(5, 7, r[3]); p.set(6, 8, r[3]); p.set(7, 8, r[3]); }
    if (v === 4) { p.set(9, 9, R.folSilent[2]); p.set(10, 9, R.folSilent[1]); p.set(10, 10, R.folSilent[3]); }
  },
  rune(p, v, seed, t, x0, y0) {
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
    if (v === 4) { p.rect(6, 7, 3, 2, R.stone[2]); p.set(6, 7, R.stone[0]); }
  },
  snow(p, v, seed, t) {
    const r = t.floor;
    p.rect(0, 0, 16, 16, r[1]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const n = hash(seed, x >> 1, y >> 1);
      if (n < 0.15 && bayer(x, y, 2)) p.set(x, y, r[2]); else if (n > 0.92) p.set(x, y, r[0]);
    }
    if (v >= 3) { p.set(7, 8, r[3]); p.set(8, 8, r[2]); p.set(9, 9, r[3]); } // footprints
  },
  grass(p, v, seed, t) {
    const r = t.floor;
    p.rect(0, 0, 16, 16, r[2]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (bayer(x, y, 1) && hash(seed, x, y) < 0.35) p.set(x, y, r[3]);
    for (let i = 0; i < 3; i++) {
      const x = 1 + Math.floor(hash(seed, i, 8) * 13), y = 3 + Math.floor(hash(seed, i, 9) * 11);
      p.set(x, y, r[1]); p.set(x + 1, y - 1, r[0]); p.set(x + 2, y, r[1]); p.set(x + 1, y, r[1]);
    }
    if (v === 4) { p.set(8, 8, t.floor === R.folRest ? R.spirit[1] : R.tunicRed[1]); p.set(9, 8, R.leather[0]); }
  },
  brush(p, v, seed, t) { // tall grass / Veldt brush (walkable)
    FLOOR.grass(p, v, seed, t);
    const r = t.floor;
    for (let i = 0; i < 6; i++) { const x = 1 + ((i * 5 + seed) % 14); p.line(x, 15, x + (i % 2 ? 1 : -1), 6 + (i % 3), r[i % 2 ? 1 : 0]); }
  },
  path(p, v, seed, t) {
    const r = t.path;
    p.rect(0, 0, 16, 16, r[2]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (hash(seed, x, y) < 0.15) p.set(x, y, bayer(x, y, 2) ? r[1] : r[3]);
    p.set(4 + v, 6, r[0]); p.set(10, 11 - v, r[3]);
  },
  cobble(p, v, seed, t, x0, y0) {
    const r = t.floor;
    p.rect(0, 0, 16, 16, r[3]);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
      const ox = i * 4 + (j % 2 ? 2 : 0), oy = j * 4;
      p.rect(ox, oy, 3, 3, r[2]); p.set(ox, oy, r[1]); p.set(ox + 2, oy + 2, r[3]);
    }
    if (v === 4) p.set(6, 6, R.brass[1]);
  },
  tile(p, v, seed, t, x0, y0) { // castle sandstone tiles, a carpet runner uses 'path'
    const r = t.floor;
    p.rect(0, 0, 16, 16, r[1]);
    p.rect(0, 0, 16, 1, r[2]); p.rect(0, 0, 1, 16, r[2]); p.rect(8, 0, 1, 16, r[2]); p.rect(0, 8, 16, 1, r[2]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (bayer(x, y, 1) && hash(seed, x, y) < 0.15) p.set(x, y, r[0]);
  },
  runner(p, v, seed, t) { // carpet runner
    const r = t.path;
    p.rect(0, 0, 16, 16, r[2]);
    p.rect(1, 0, 1, 16, R.brass[1]); p.rect(14, 0, 1, 16, R.brass[1]);
    for (let y = 0; y < 16; y += 4) p.set(8, y + 1, r[1]);
  },
  flowers(p, v, seed, t) { // silent green with white glass-hearted flowers (they never move)
    const r = t.flower;
    p.rect(0, 0, 16, 16, r[2]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (bayer(x, y, 2) && hash(seed, x, y) < 0.4) p.set(x, y, r[3]);
    const dream = r === R.folRest;
    for (let i = 0; i < 4; i++) {
      const x = 2 + Math.floor(hash(seed, i, 11) * 11), y = 2 + Math.floor(hash(seed, i, 12) * 11);
      const pet = dream ? [R.spirit[0], R.spirit[1], R.spirit[2]] : [R.stone[0], R.stone[1], R.stone[2]];
      p.set(x, y, pet[0]); p.set(x - 1, y, pet[1]); p.set(x + 1, y, pet[1]); p.set(x, y - 1, pet[0]); p.set(x, y + 1, pet[2]);
      p.set(x, y, dream ? R.brass[0] : i % 2 ? R.glass[1] : R.brass[0]);
      p.set(x + 1, y + 2, r[1]);
    }
  },
  crop(p, v, seed, t, x0, y0, state) {
    const r = R.leather;
    p.rect(0, 0, 16, 16, r[3]);
    for (let y = 0; y < 16; y += 4) { p.rect(0, y, 16, 2, r[2]); p.rect(0, y, 16, 1, r[1]); }
    const plant = state === 'watered' || t.floor === R.folRest ? R.folRest : R.folRuin;
    for (let x = 2; x < 16; x += 5) for (let y = 1; y < 16; y += 4) { p.set(x, y - 1, plant[1]); p.set(x + 1, y - 2, plant[0]); p.set(x - 1, y - 1, plant[2]); }
    if (state === 'watered') for (let i = 0; i < 6; i++) p.set(Math.floor(hash(seed, i, 3) * 16), Math.floor(hash(seed, i, 4) * 16), R.seaRuin[3]);
  },
  wood(p, v, seed, t) {
    const r = t.floor;
    p.rect(0, 0, 16, 16, r[2]);
    for (let y = 0; y < 16; y += 4) { p.rect(0, y + 3, 16, 1, r[3]); p.rect(0, y, 16, 1, r[1]); }
    const off = (seed % 3) * 5;
    for (let y = 0; y < 16; y += 4) p.set((off + y * 3) % 16, y + 1, r[4]);
  },
  rug(p, v, seed, t) {
    const r = t.path;
    p.rect(0, 0, 16, 16, r[2]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((x + y) % 4 === 0) p.set(x, y, r[1]);
    p.rect(0, 0, 16, 1, R.brass[2]);
  },
  water(p, v, seed, t, x0, y0, state, frame = 0) { // calm water: highlights drift 1px diagonally per frame
    const r = t.water || R.seaRuin;
    const ruined = r === R.seaRuin;
    p.rect(0, 0, 16, 16, r[2]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      if (bayer(x, y, 1) && ((x + y + frame) % 8 === 0)) p.set(x, y, r[3]);
      if (!ruined && ((x - y + frame * 2 + seed) % 13 === 0) && y % 4 === 1) p.set(x, y, r[0]); // restored water gets highlights
    }
  },
  murk(p, v, seed, t, x0, y0, state, frame = 0) { // shallow water over stone (walkable)
    FLOOR.cobble(p, v, seed, t, x0, y0);
    const r = t.murk || R.seaRuin;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (bayer(x, y, 2)) p.set(x, y, r[2]);
    if ((frame + seed) % 4 === 0) p.set(5, 9, r[0]);
  },
  bridge(p, v, seed, t) {
    const r = R.leather;
    p.rect(0, 0, 16, 16, r[2]);
    for (let x = 0; x < 16; x += 4) { p.rect(x, 0, 1, 16, r[3]); }
    p.rect(0, 0, 16, 1, r[1]); p.rect(0, 15, 16, 1, r[4]);
  },
  void(p, v, seed, t, x0, y0) {
    const r = t.void || [OUTLINE, OUTLINE, OUTLINE, OUTLINE, OUTLINE];
    p.rect(0, 0, 16, 16, r === R.skyRuin || r === R.skyRest ? r[1] : OUTLINE);
    if (r !== R.skyRuin && r !== R.skyRest && hash(x0, y0, 5) < 0.2) p.set(Math.floor(hash(x0, y0, 6) * 16), Math.floor(hash(x0, y0, 7) * 16), R.spirit[1]); // stars in the void
    if (r === R.skyRuin || r === R.skyRest) { for (let x = 0; x < 16; x++) if (bayer(x, (y0 * 3) % 16, 1)) p.set(x, (y0 * 3) % 16, r[0]); }
  },
};

// ---------------------------------------------------------------- walls
// part: 'top' (cap), 'upper' (top half of the face, with lip), 'lower' (bottom half)
function paintWall(p, t, part, seed, x0, glyphFrame) {
  const f = t.face;
  const style = t.wall;
  if (part === 'top') {
    p.rect(0, 0, 16, 16, t.top);
    if (style === 'stone') { for (let x = 0; x < 16; x++) if (bayer(x, 0, 2)) p.set(x, 15, f[4]); }
    if (style === 'rock' || style === 'crystal') for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (hash(seed * 1000, x, y) < 0.08) p.set(x, y, f[4]);
    return;
  }
  if (style === 'rock' || style === 'crystal') {
    p.rect(0, 0, 16, 16, f[2]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const n = hash(seed * 1000, x >> 1, y >> 1);
      if (n < 0.25) p.set(x, y, f[1]); else if (n > 0.8) p.set(x, y, f[3]);
    }
    for (let x = 0; x < 16; x++) p.set(x, 5 + Math.round(Math.sin((x + seed * 9) * 0.6)), f[3]);
    if (style === 'crystal') for (let i = 0; i < 3; i++) { const cx = 2 + ((seed * 97 + i * 5) % 12) | 0; p.line(cx, 14, cx + 1, 6 + i, R.spirit[1]); p.set(cx + 1, 6 + i, R.spirit[0]); }
    if (part === 'upper') { p.rect(0, 0, 16, 2, f[0]); p.rect(0, 2, 16, 1, f[1]); }
    if (part === 'lower') { for (let x = 0; x < 16; x++) p.set(x, 15, f[4]); for (let x = 0; x < 16; x++) if (bayer(x, 14, 2)) p.set(x, 14, f[3]); }
  } else if (style === 'stone') { // smooth white stone, curved seams
    p.rect(0, 0, 16, 16, f[1]);
    for (let x = 0; x < 16; x++) if (bayer(x, 0, 1)) for (let y = 4; y < 16; y += 7) p.set(x, y, f[2]);
    p.rect(15, 0, 1, 16, f[2]);
    if (part === 'upper') { p.rect(0, 0, 16, 2, f[0]); p.rect(0, 2, 16, 1, f[2]); }
    if (part === 'lower') { p.rect(0, 13, 16, 3, f[2]); p.rect(0, 15, 16, 1, f[3]); }
  } else if (style === 'brick') {
    p.rect(0, 0, 16, 16, f[2]);
    for (let y = 0; y < 16; y += 4) { p.rect(0, y + 3, 16, 1, f[3]); for (let x = (y / 4) % 2 ? 4 : 0; x < 16; x += 8) p.rect(x, y, 1, 3, f[3]); p.rect(0, y, 16, 1, f[1]); }
    if (part === 'upper') { p.rect(0, 0, 16, 2, f[0]); p.rect(0, 2, 16, 1, f[1]); }
    if (part === 'lower') { p.rect(0, 14, 16, 2, f[3]); p.rect(0, 15, 16, 1, f[4]); }
  } else if (style === 'rail') { // airship deck railing over the sky
    const sky = t.void || R.skyRuin;
    p.rect(0, 0, 16, 16, sky[1]);
    if (part === 'lower') { p.rect(0, 8, 16, 2, f[1]); p.rect(0, 10, 16, 6, f[2]); for (let x = 1; x < 16; x += 5) p.rect(x, 2, 2, 8, f[2]); p.rect(0, 2, 16, 2, f[1]); }
  } else { // plaster with wooden beams
    p.rect(0, 0, 16, 16, f[1]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (bayer(x, y, 1) && hash(seed * 1000, x, y) < 0.3) p.set(x, y, f[2]);
    const w = R.leather;
    if (part === 'upper') { p.rect(0, 0, 16, 3, w[2]); p.rect(0, 0, 16, 1, w[1]); p.rect(0, 3, 16, 1, w[3]); }
    if (part === 'lower') { p.rect(0, 12, 16, 4, w[2]); p.rect(0, 12, 16, 1, w[1]); p.rect(0, 15, 16, 1, w[4]); }
    if ((x0 % 3) === 0) { p.rect(0, 0, 2, 16, w[2]); p.rect(0, 0, 1, 16, w[1]); }
  }
  if (glyphFrame != null) paintGlyph(p, t, part, seed, glyphFrame, x0);
}

// Animated wall detail. 'glass' glyph walls cycle like a slow heartbeat (6 frames x 10).
function paintGlyph(p, t, part, seed, frame, x0) {
  const pat = Math.floor(seed * 7) % 4;
  if (t.glyph === 'glass') {
    const lvl = [4, 3, 2, 1, 2, 3][frame % 6];
    const c = R.glass[lvl];
    const rows = part === 'upper' ? [6, 10] : [3, 7];
    for (const y of rows) for (let x = 2; x < 14; x++) if (((x + pat) % 5) !== 0) p.set(x, y, c);
    p.set(4 + pat, rows[0] + 1, c); p.set(9 - pat, rows[1] - 1, c);
  } else if (t.glyph === 'vein') { // glowing ore: palette cycle through 3 colours, 20 frames per step
    const v = t.vein || R.brass;
    const c = [v[0], v[1], v[2]][Math.floor(frame / 2) % 3];
    for (let i = 0; i < 6; i++) p.set(2 + ((pat * 3 + i * 2) % 12), 4 + ((i * 5 + pat) % 9), i % 2 ? c : v[2]);
  } else if (t.glyph === 'mural') { // Relm's murals: faded in the ruin, saturated when restored
    const bright = t.mural === 'bright';
    const cols = bright ? [R.folRest[1], R.skyRest[1], R.spirit[1], R.brass[0]] : [R.folRuin[1], R.seaRuin[1], R.plum[2], R.sand[2]];
    if (part === 'lower' || part === 'upper') {
      p.rect(1, part === 'upper' ? 4 : 0, 14, part === 'upper' ? 12 : 11, cols[(x0 + pat) % 4]);
      for (let i = 0; i < 5; i++) p.rect(2 + i * 3, part === 'upper' ? 8 + (i % 2) * 3 : 2 + (i % 3) * 2, 2, 3, cols[(i + pat + 1) % 4]);
      if (part === 'upper') p.rect(1, 4, 14, 1, R.leather[3]);
    }
  } else if (t.glyph === 'shelf') {
    const books = [R.tunicRed[2], R.farmBlue[2], R.moss[2], R.brass[2], R.plum[2]];
    for (let r = 0; r < 2; r++) { const y = r * 8 + 1; p.rect(0, y + 6, 16, 1, R.leather[3]); for (let i = 0; i < 5; i++) p.rect(1 + i * 3, y + 1 + (i % 2), 2, 5 - (i % 2), books[(i + pat + r) % 5]); }
  } else if (t.glyph === 'pipe') { // Figaro's engine pipes, steam pulsing
    p.rect(3, 0, 3, 16, R.brass[2]); p.rect(3, 0, 1, 16, R.brass[1]);
    p.rect(10, 0, 3, 16, R.iron[2]); p.rect(10, 0, 1, 16, R.iron[1]);
    if (frame % 3 === 0) { p.set(7, 4 + pat, R.stone[0]); p.set(8, 3 + pat, R.stone[1]); }
  } else if (t.glyph === 'window') { // lawless city windows: lit when people return
    p.rect(4, 4, 8, 7, R.night[3]); p.rect(4, 4, 8, 1, R.iron[1]); p.rect(7, 4, 1, 7, R.iron[1]);
    if ((pat + frame) % 5 < 2 && t.lit) p.rect(5, 6, 2, 3, R.brass[0]);
  }
}

// ---------------------------------------------------------------- tile entry point
export const TILE_KIND = {
  '#': 'wall', 'G': 'glyph', '.': 'floor', ',': 'path', '=': 'rail', '"': 'flowers', 'c': 'crop', 'w': 'water',
  ' ': 'void', 'o': 'rune', 'r': 'floor', 'x': 'runner', '_': 'floor', 'b': 'bridge', 'm': 'murk', 't': 'brush',
  'f': 'floor', 'g': 'grass', 'd': 'dirt',
};
export const SOLID = new Set(['wall', 'glyph', 'water', 'void']);

const FLOOR_FOR = {
  tunnel: { floor: 'dirt', path: 'dirt', rail: 'rail' },
  vault: { floor: 'stone', path: 'stone', rune: 'rune' },
  ashen: { floor: 'sand', path: 'path' },
  mobliz: { floor: 'grass', path: 'path' },
  house: { floor: 'wood', path: 'rug' },
  snow: { floor: 'snow', path: 'cobble' },
  mine: { floor: 'dirt', path: 'dirt', rail: 'rail' },
  desert: { floor: 'sand', path: 'path' },
  castle: { floor: 'tile', path: 'runner' },
  port: { floor: 'cobble', path: 'wood' },
  mural: { floor: 'grass', path: 'path' },
  archive: { floor: 'wood', path: 'rug' },
  eastern: { floor: 'cobble', path: 'path', grass: 'grass' },
  crypt: { floor: 'cobble', path: 'cobble' },
  zozo: { floor: 'cobble', path: 'cobble' },
  spirit: { floor: 'stone', path: 'stone', rune: 'rune' },
  drowned: { floor: 'sand', path: 'cobble' },
  deck: { floor: 'wood', path: 'wood' },
  garden: { floor: 'stone', path: 'flowers', rune: 'rune' },
  dream: { floor: 'grass', path: 'path' },
};

const tileCache = new Map();
export function tileCanvas(theme, kind, x, y, part, state, frame, wstate) {
  const t = themeFor(theme, wstate);
  const r = hash(x, y, 3);
  const v = r < 0.03 ? 4 : r < 0.05 ? 3 : Math.floor(hash(x, y, 9) * 3); // 4 variants + rare accents
  const wallish = kind === 'wall' || kind === 'glyph';
  const key = [theme, wstate, kind, part, state, frame, wallish ? (x % 3) + ':' + (Math.floor(hash(x, y) * 8)) : v, (x % 2) + (y % 2) * 2, kind === 'void' ? x + ':' + y : ''].join('|');
  let c = tileCache.get(key);
  if (c) return c;
  const p = new Painter(16, 16);
  const seed = Math.floor(hash(x, y, 1) * 1000);
  if (wallish) paintWall(p, t, part, hash(x, y), x, kind === 'glyph' && part !== 'top' ? frame : null);
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

// ================================================================ more props
const SN = R.snowRest, SR = R.snowRuin, SA = R.sand, NV = R.navy;
function roofRamp(s) {
  return { school: R.farmBlue, blue: R.farmBlue, green: R.moss, grey: R.iron, plum: R.plum, navy: NV, brick: R.imperial }[s] || R.tunicRed;
}
Object.assign(PROPS, {
  house: { w: 64, h: 64, foot: [0, 0, 4, 2], // generic cottage; state = roof colour, '+snow' adds snow
    paint(p, s = '') {
      const [roofName, snow] = String(s || '').split('+');
      const roof = roofRamp(roofName);
      p.rect(2, 30, 60, 34, C[1]); p.rect(2, 30, 3, 34, C[0]); p.rect(58, 30, 4, 34, C[2]);
      for (const x of [2, 30, 58]) p.rect(x, 30, 4, 34, L[2]);
      p.rect(2, 60, 60, 4, L[3]);
      p.rect(18, 44, 12, 20, L[3]); p.rect(19, 45, 10, 19, L[2]); p.set(27, 54, B[0]);
      p.rect(40, 42, 12, 10, R.night[3]); p.rect(40, 42, 12, 1, L[2]); p.rect(45, 42, 1, 10, L[2]); p.rect(40, 46, 12, 1, L[2]);
      for (let y = 0; y < 32; y++) { const inset = Math.max(0, 16 - y); p.rect(inset, y, 64 - inset * 2, 1, y < 4 ? roof[1] : y % 4 === 0 ? roof[3] : roof[2]); }
      p.rect(0, 30, 64, 2, roof[3]);
      if (snow) for (let y = 0; y < 30; y++) { const inset = Math.max(0, 16 - y); for (let x = inset; x < 64 - inset; x++) if ((y < 6 || (x + y) % 7 === 0) && bayer(x, y, 3)) p.set(x, y, (snow === 'rest' ? SN : SR)[1]); }
      p.rect(48, 2, 6, 12, I[2]); p.rect(48, 0, 6, 2, I[1]);
      p.deepOutline();
    } },
  timberHouse: { w: 48, h: 64, foot: [0, 0, 3, 2], // Narshe: tall timber-framed house, lantern by the door
    paint(p, s) {
      const snow = s === 'rest' ? SN : SR;
      p.rect(2, 20, 44, 44, C[2]);
      for (const x of [2, 22, 42]) p.rect(x, 20, 4, 44, L[3]);
      for (const y of [20, 40]) p.rect(2, y, 44, 3, L[3]);
      p.line(6, 23, 20, 39, L[3]); p.line(26, 39, 40, 23, L[3]);
      p.rect(18, 48, 12, 16, L[2]); p.rect(19, 49, 10, 15, L[1]);
      p.rect(8, 44, 8, 8, R.brass[s === 'rest' ? 0 : 2]); p.rect(32, 44, 8, 8, R.brass[s === 'rest' ? 0 : 2]);
      for (let y = 0; y < 22; y++) { const half = 6 + y * 1.2; p.rect(24 - half, y, half * 2, 1, y < 3 ? snow[0] : y % 3 ? R.iron[2] : snow[1]); }
      p.deepOutline();
    } },
  castle: { w: 160, h: 112, foot: [0, 0, 10, 2], // Figaro: sandstone façade, twin towers, engine stacks
    paint(p) {
      p.rect(16, 40, 128, 72, SA[1]); p.rect(16, 40, 128, 4, SA[0]);
      for (let y = 48; y < 112; y += 8) for (let x = 16 + ((y / 8) % 2) * 8; x < 144; x += 16) p.rect(x, y, 1, 7, SA[3]);
      for (let y = 47; y < 112; y += 8) p.rect(16, y, 128, 1, SA[2]);
      for (const tx of [0, 128]) { p.rect(tx, 16, 32, 96, SA[2]); p.rect(tx, 16, 6, 96, SA[1]); for (let x = tx; x < tx + 32; x += 8) p.rect(x, 10, 5, 7, SA[2]); p.rect(tx + 10, 40, 12, 18, R.night[3]); }
      for (let x = 16; x < 144; x += 10) p.rect(x, 34, 6, 6, SA[2]);
      p.rect(64, 70, 32, 42, L[3]); p.ellipse(80, 70, 16, 12, L[3]); p.rect(66, 72, 28, 40, L[2]); p.rect(79, 72, 2, 40, L[3]);
      for (const x of [52, 104]) { p.rect(x, 0, 8, 40, I[2]); p.rect(x, 0, 3, 40, I[1]); }
      p.rect(72, 50, 16, 10, NV[2]); p.rect(76, 52, 8, 6, B[1]); // the crest
      p.deepOutline();
    } },
  stall: { w: 32, h: 32, foot: [0, 0, 2, 1],
    paint(p, s) {
      const cl = roofRamp(s);
      p.rect(2, 16, 28, 14, L[2]); p.rect(2, 16, 28, 2, L[1]);
      p.rect(3, 4, 2, 14, L[3]); p.rect(27, 4, 2, 14, L[3]);
      for (let x = 0; x < 32; x++) p.rect(x, 0, 1, 7, Math.floor(x / 4) % 2 ? cl[1] : C[0]);
      p.rect(0, 6, 32, 1, cl[3]);
      p.rect(6, 12, 5, 4, R.tunicRed[1]); p.rect(13, 13, 6, 3, R.folRest[1]); p.rect(21, 12, 5, 4, B[0]);
      p.deepOutline();
    } },
  sign2: { w: 16, h: 24, foot: [0, 0, 1, 1], // inn / shop hanging sign: state = 'inn' | 'shop' | 'arms'
    paint(p, s) {
      p.rect(2, 0, 2, 24, L[3]); p.rect(2, 2, 12, 1, L[3]);
      p.rect(5, 4, 10, 9, L[1]); p.rect(5, 4, 10, 1, L[0]);
      if (s === 'inn') { p.rect(7, 8, 6, 3, C[0]); p.rect(7, 7, 2, 2, C[1]); }
      else if (s === 'arms') { p.line(7, 11, 12, 6, I[0]); p.set(8, 9, B[1]); }
      else { p.ellipse(10, 9, 3, 3, B); }
      p.deepOutline();
    } },
  pine: { w: 32, h: 48, foot: [0, 0, 1, 1], tx: 1,
    paint(p, s) {
      const g = s === 'rest' ? R.folRest : s === 'silent' ? R.folSilent : R.folRuin;
      p.rect(14, 36, 4, 12, L[3]);
      for (let i = 0; i < 4; i++) { const y = 4 + i * 9, half = 5 + i * 3; for (let r = 0; r < 12; r++) p.rect(16 - Math.min(half, r + 2), y + r, Math.min(half, r + 2) * 2, 1, r < 3 ? g[1] : r % 4 === 0 ? g[3] : g[2]); }
      if (s === 'snow') for (let i = 0; i < 4; i++) p.rect(12 - i * 2, 6 + i * 9, 8 + i * 4, 2, SN[1]);
      p.deepOutline();
    } },
  tree: { w: 32, h: 48, foot: [0, 0, 1, 1], tx: 1, anim: true,
    paint(p, s, f) { // tree canopy: 2 frames, edge shifts 1px
      const g = s === 'silent' ? R.folSilent : s === 'ruin' ? R.folRuin : R.folRest;
      p.rect(14, 28, 5, 20, L[3]); p.rect(14, 28, 2, 20, L[2]);
      p.ellipse(16 + (f % 2 ? 1 : 0), 18, 14, 14, g);
      p.ellipse(9, 24, 7, 6, g, { offset: 1 }); p.ellipse(24, 24, 7, 6, g, { offset: 1 });
      if (s === 'blossom') for (let i = 0; i < 8; i++) p.set(8 + (i * 7) % 18, 8 + (i * 5) % 16, R.spirit[1]);
      p.deepOutline();
    } },
  palm: { w: 32, h: 48, foot: [0, 0, 1, 1], tx: 1,
    paint(p) {
      for (let y = 14; y < 48; y++) p.rect(15 + Math.round(Math.sin(y * 0.1) * 2), y, 3, 1, y % 4 ? L[2] : L[3]);
      for (let i = 0; i < 5; i++) { const a = -2.6 + i * 0.6; for (let r = 0; r < 14; r++) p.set(16 + Math.cos(a) * r, 14 + Math.sin(a) * r + r * r * 0.03, R.folRest[r < 4 ? 1 : 2]); }
      p.deepOutline();
    } },
  bush: { w: 16, h: 16, foot: [0, 0, 1, 1],
    paint(p, s) { const g = s === 'rest' ? R.folRest : R.folRuin; p.ellipse(8, 10, 7, 5, g); p.ellipse(5, 7, 3, 3, g, { offset: 1 }); p.deepOutline(); } },
  statue: { w: 16, h: 40, foot: [0, 0, 1, 1],
    paint(p) { p.rect(2, 32, 12, 8, S[2]); p.rect(2, 32, 12, 1, S[1]); p.ellipse(8, 10, 4, 5, S); p.rect(4, 14, 8, 18, S[1]); p.rect(4, 14, 2, 18, S[0]); p.outline(() => S[4]); } },
  crystal: { w: 16, h: 24, foot: [0, 0, 1, 1], anim: true, light: 26,
    paint(p, s, f) {
      const c = [R.spirit, R.violet, R.glass][s === 'glass' ? 2 : s === 'violet' ? 1 : 0];
      for (const [x, h] of [[5, 18], [9, 22], [12, 14]]) { p.rect(x, 24 - h, 3, h, c[2]); p.rect(x, 24 - h, 1, h, c[(f % 4) < 2 ? 0 : 1]); }
      p.deepOutline();
    } },
  floatRock: { w: 32, h: 32, foot: [0, 0, 2, 1], anim: true,
    paint(p, s, f) {
      const b = f % 4 < 2 ? 0 : 1;
      p.ellipse(16, 10 + b, 14, 6, R.violet);
      for (let i = 0; i < 6; i++) p.line(6 + i * 4, 14 + b, 9 + i * 3, 22 + b - (i % 3) * 2, R.violet[3]);
      p.set(10, 26 + b, R.spirit[0]); p.set(20, 28 - b, R.spirit[1]);
      p.deepOutline();
    } },
  coral: { w: 16, h: 24, foot: [0, 0, 1, 1],
    paint(p, s) { const c = s === 'rest' ? R.coral : R.seaRuin; for (let i = 0; i < 4; i++) p.thickLine(8, 24, 2 + i * 4, 4 + (i % 2) * 6, c[1 + (i % 2)], 2); p.deepOutline(); } },
  column: { w: 16, h: 48, foot: [0, 0, 1, 1],
    paint(p, s) {
      const top = s === 'broken' ? 20 : 4;
      p.rect(3, top, 10, 48 - top, S[1]); p.rect(3, top, 3, 48 - top, S[0]); p.rect(11, top, 2, 48 - top, S[2]);
      for (let y = top; y < 48; y += 4) p.set(8, y, S[2]);
      if (s !== 'broken') { p.rect(0, 0, 16, 5, S[1]); p.rect(0, 0, 16, 1, S[0]); } else { p.set(4, top - 1, S[1]); p.set(9, top - 2, S[1]); }
      p.rect(0, 44, 16, 4, S[2]);
      if (s === 'mossy' || s === 'broken') { p.set(4, 30, R.folSilent[2]); p.set(5, 31, R.folSilent[1]); }
      p.outline(() => S[4]);
    } },
  banner: { w: 16, h: 40, foot: [0, 0, 1, 1], anim: true,
    paint(p, s, f) { // ripple travels left to right, 4 frames x 8
      const c = s === 'grey' ? R.iron : s === 'navy' ? NV : R.tunicRed;
      p.rect(1, 0, 2, 40, L[3]);
      for (let y = 2; y < 24; y++) for (let x = 3; x < 15; x++) { const off = Math.round(Math.sin((x + f * 3) * 0.6)); p.set(x, y + off, (x + y) % 9 ? c[2] : c[1]); }
      p.deepOutline();
    } },
  lamppost: { w: 16, h: 40, foot: [0, 0, 1, 1], light: 40, anim: true,
    paint(p, s, f) {
      p.rect(7, 10, 2, 30, I[2]); p.rect(4, 38, 8, 2, I[3]);
      p.rect(4, 2, 8, 9, I[2]); p.rect(5, 3, 6, 7, s === 'off' ? R.night[3] : [EL.fire[1], EL.fire[0], EL.fire[1], B[0]][f % 4]);
      p.deepOutline();
    } },
  boat: { w: 48, h: 24, foot: [0, 0, 3, 1],
    paint(p) { p.ellipse(24, 14, 22, 8, L); p.rect(4, 10, 40, 2, L[1]); p.rect(22, 0, 2, 12, L[3]); p.rect(24, 1, 12, 8, C[1]); p.deepOutline(); } },
  chest: { w: 16, h: 16, foot: [0, 0, 1, 1],
    paint(p, s) {
      p.rect(1, 6, 14, 9, L[2]); p.rect(1, 6, 14, 2, L[1]);
      if (s === 'open') { p.rect(1, 2, 14, 4, L[3]); p.rect(3, 7, 10, 3, OUTLINE); }
      else { p.rect(1, 3, 14, 4, L[1]); p.rect(1, 3, 14, 1, L[0]); p.rect(7, 6, 2, 3, B[0]); }
      p.rect(1, 10, 14, 1, B[2]);
      p.deepOutline();
    } },
  wellspring: { w: 48, h: 48, foot: [0, 0, 3, 2], anim: true, light: 64,
    paint(p, s, f) { // a cracked crystal heart over a pool; relit = it sings with light
      const lit = s === 'lit';
      const c = lit ? [EL.holy[0], EL.holy[1], EL.holy[2], B[1], B[2]] : [S[2], S[3], S[3], S[4], S[4]];
      p.ellipse(24, 40, 22, 7, lit ? R.seaRest : R.seaRuin);
      p.ellipse(24, 40, 18, 5, lit ? [R.seaRest[0], R.seaRest[0], R.seaRest[1], R.seaRest[2], R.seaRest[3]] : R.seaRuin);
      for (let y = 4; y < 38; y++) { const half = Math.max(1, 10 - Math.abs(y - 18) * 0.6); p.rect(24 - half, y, half * 2, 1, c[y < 10 ? 0 : y < 24 ? 1 : 2]); }
      if (!lit) { p.line(20, 8, 26, 30, OUTLINE); p.line(26, 30, 22, 36, OUTLINE); }
      else for (let i = 0; i < 4; i++) p.set(12 + ((i * 11 + f * 3) % 24), 2 + ((i * 7 + f * 2) % 12), '#FFFFFF');
      p.outline(() => lit ? B[3] : S[4]);
    } },
  engine: { w: 48, h: 40, foot: [0, 0, 3, 1], anim: true,
    paint(p, s, f) {
      p.rect(2, 12, 44, 28, I[2]); p.rect(2, 12, 44, 3, I[1]);
      p.ellipse(14, 24, 8, 8, B); p.ellipse(34, 26, 6, 6, B, { offset: 1 });
      for (let i = 0; i < 4; i++) { const a = f * 0.8 + i * Math.PI / 2; p.set(14 + Math.cos(a) * 6, 24 + Math.sin(a) * 6, I[0]); }
      p.rect(36, 0, 6, 12, I[2]); if (f % 2) { p.set(38, 0, S[0]); p.set(40, 1, S[1]); }
      p.rect(22, 18, 6, 6, s === 'on' ? R.glass[1] : R.night[3]);
      p.deepOutline();
    } },
  throne: { w: 32, h: 40, foot: [0, 0, 2, 1],
    paint(p) { p.rect(4, 0, 24, 30, NV[2]); p.rect(4, 0, 24, 3, B[1]); p.rect(8, 4, 16, 22, NV[1]); p.rect(2, 26, 28, 12, B[2]); p.rect(2, 26, 28, 2, B[1]); p.deepOutline(); } },
  grave: { w: 16, h: 20, foot: [0, 0, 1, 1],
    paint(p, s) { p.rect(3, 4, 10, 14, S[2]); p.ellipse(8, 5, 5, 4, S); p.rect(6, 8, 4, 1, S[3]); p.rect(7, 7, 2, 4, S[3]); if (s === 'flowers') { p.set(4, 18, R.spirit[1]); p.set(11, 18, R.brass[0]); p.set(6, 19, R.folRest[1]); } p.outline(() => S[4]); } },
  frameHouse: { w: 64, h: 56, foot: [0, 0, 4, 2], // Locke's half-built house; state 'done' when finished
    paint(p, s) {
      if (s === 'done') { PROPS.house.paint(p, 'blue'); return; }
      for (const x of [2, 20, 42, 60]) { p.rect(x, 14, 3, 42, L[2]); p.rect(x, 14, 1, 42, L[1]); }
      for (const y of [14, 34]) p.rect(2, y, 61, 3, L[2]);
      p.line(4, 14, 32, 0, L[2]); p.line(32, 0, 60, 14, L[2]); p.rect(31, 0, 3, 14, L[3]);
      p.rect(4, 44, 16, 12, C[2]); p.rect(44, 48, 14, 8, L[1]);
      p.deepOutline();
    } },
  torii: { w: 48, h: 48, foot: [0, 0, 3, 1], walkMid: true,
    paint(p) {
      p.rect(6, 10, 5, 38, R.tunicRed[2]); p.rect(37, 10, 5, 38, R.tunicRed[3]);
      p.rect(0, 2, 48, 5, R.tunicRed[2]); p.rect(0, 2, 48, 1, R.tunicRed[1]); p.rect(2, 0, 44, 2, OUTLINE);
      p.rect(4, 14, 40, 3, R.tunicRed[3]);
      p.deepOutline();
    } },
  pagoda: { w: 96, h: 96, foot: [0, 0, 6, 2],
    paint(p, s) {
      const wall = s === 'ruin' ? R.iron : R.cream;
      p.rect(12, 56, 72, 40, wall[1]); p.rect(12, 56, 4, 40, wall[0]);
      for (let x = 12; x < 84; x += 12) p.rect(x, 56, 2, 40, L[3]);
      p.rect(40, 70, 16, 26, L[3]);
      for (let tier = 0; tier < 3; tier++) {
        const y = 4 + tier * 18, half = 24 + tier * 12;
        for (let r = 0; r < 12; r++) p.rect(48 - half - (r < 3 ? 6 - r * 2 : 0), y + r, (half + (r < 3 ? 6 - r * 2 : 0)) * 2, 1, r < 2 ? R.iron[1] : R.iron[2 + (r % 4 === 0 ? 1 : 0)]);
        if (tier < 2) p.rect(48 - half + 10, y + 12, half * 2 - 20, 6, wall[2]);
      }
      if (s === 'ruin') { p.rect(70, 40, 14, 20, OUTLINE); p.line(60, 60, 84, 96, OUTLINE); }
      p.deepOutline();
    } },
  cathedral: { w: 96, h: 112, foot: [0, 0, 6, 2],
    paint(p) {
      const K = R.iron;
      p.rect(8, 40, 80, 72, K[2]); p.rect(8, 40, 4, 72, K[1]);
      for (const tx of [0, 72]) { p.rect(tx, 12, 24, 100, K[2]); for (let y = 0; y < 12; y++) p.rect(tx + 12 - y, y, y * 2, 1, K[1]); }
      p.ellipse(48, 56, 14, 14, R.night); p.rect(46, 42, 4, 28, K[3]); p.rect(34, 55, 28, 2, K[3]); // rose window
      p.rect(36, 80, 24, 32, OUTLINE); p.ellipse(48, 80, 12, 10, OUTLINE);
      for (let y = 46; y < 110; y += 12) for (const x of [16, 76]) p.rect(x, y, 4, 8, R.brass[3]);
      p.deepOutline();
    } },
  seraphCircle: { w: 48, h: 24, foot: [0, 0, 0, 0], anim: true,
    paint(p, s, f) {
      if (s === 'done') { p.ellipse(24, 12, 22, 10, [S[3], S[3], S[3], S[4], S[4]]); return; }
      for (let a = 0; a < 360; a += 4) { const t = a * Math.PI / 180; p.set(24 + Math.cos(t) * 22, 12 + Math.sin(t) * 10, G[(Math.floor(a / 30) + f) % 3]); }
      for (let i = 0; i < 8; i++) { const t = i * Math.PI / 4 + f * 0.05; p.set(24 + Math.cos(t) * 14, 12 + Math.sin(t) * 6, B[0]); }
    } },
  echoPoint: { w: 16, h: 24, foot: [0, 0, 0, 0], anim: true, light: 30,
    paint(p, s, f) {
      if (s === 'spent') { p.set(8, 22, R.spirit[3]); return; }
      for (let i = 0; i < 6; i++) { const y = 22 - ((f * 3 + i * 4) % 22); p.set(4 + (i * 5) % 9, y, R.spirit[i % 3]); }
      p.ellipse(8, 22, 6, 2, [R.spirit[1], R.spirit[2], R.spirit[2], R.spirit[3], R.spirit[3]]);
    } },
  hiveProp: { w: 32, h: 40, foot: [0, 0, 2, 1], anim: true,
    paint(p, s, f) {
      if (s === 'dead') { p.ellipse(16, 34, 14, 5, [S[3], S[3], S[4], S[4], S[4]]); return; }
      for (let i = 0; i < 4; i++) p.ellipse(16, 34 - i * 8, 14 - i * 3, 5, S, { offset: i % 2 });
      for (let i = 0; i < 5; i++) p.set(8 + i * 4, 28 - (i % 3) * 7, (f + i) % 3 ? G[2] : G[0]);
      p.outline(() => S[4]);
    } },
  airship: { w: 40, h: 32, foot: [0, 0, 0, 0], anim: true,
    paint(p, s, f) {
      p.ellipse(20, 18, 15, 6, L); p.rect(6, 16, 28, 2, L[1]);
      p.ellipse(20, 8, 13, 4, S); p.rect(10, 8, 20, 1, S[3]);
      for (const x of [8, 32]) { p.rect(x - 1, 10, 2, 6, R.black[2]); p.ellipse(x, 22, 3, 2, B); }
      p.rect(18, 4, 4, 3, R.imperial[2]);
      p.deepOutline();
    } },
  skiffProp: { w: 24, h: 16, foot: [0, 0, 0, 0],
    paint(p) { p.ellipse(12, 10, 10, 4, L); p.rect(4, 7, 16, 2, L[1]); p.rect(11, 0, 2, 8, L[3]); p.rect(13, 1, 6, 5, C[1]); p.deepOutline(); } },
  // ---- world-map location icons ("miniature" scale: towns 2x2, castles 3x3)
  iconTown: { w: 32, h: 32, foot: [0, 0, 0, 0],
    paint(p, s) {
      const roof = roofRamp(s || 'red');
      for (const [x, y] of [[4, 12], [16, 6], [18, 18]]) { p.rect(x, y + 5, 10, 8, C[1]); p.rect(x - 1, y, 12, 5, roof[2]); p.rect(x - 1, y, 12, 1, roof[1]); p.set(x + 4, y + 9, L[3]); }
      p.deepOutline();
    } },
  iconCastle: { w: 48, h: 48, foot: [0, 0, 0, 0],
    paint(p, s) {
      const wall = s === 'stone' ? R.iron : s === 'eastern' ? R.cream : SA;
      p.rect(6, 18, 36, 26, wall[1]); p.rect(6, 18, 3, 26, wall[0]);
      for (const x of [2, 38]) { p.rect(x, 8, 9, 36, wall[2]); p.rect(x, 4, 9, 4, s === 'eastern' ? R.iron[2] : wall[1]); }
      p.rect(20, 30, 8, 14, L[3]);
      for (let x = 8; x < 40; x += 6) p.rect(x, 14, 3, 4, wall[2]);
      if (s === 'eastern') p.rect(14, 8, 20, 6, R.iron[2]);
      p.deepOutline();
    } },
  iconPort: { w: 32, h: 32, foot: [0, 0, 0, 0],
    paint(p) {
      PROPS.iconTown.paint(p, 'blue');
      p.rect(2, 26, 28, 3, L[2]); p.rect(22, 18, 2, 10, L[3]); p.rect(24, 19, 6, 5, C[0]);
      p.deepOutline();
    } },
  iconRuin: { w: 32, h: 32, foot: [0, 0, 0, 0],
    paint(p) { for (const [x, h] of [[4, 14], [10, 22], [18, 10], [24, 18]]) { p.rect(x, 30 - h, 5, h, R.iron[2]); p.rect(x, 30 - h, 2, h, R.iron[1]); } p.rect(2, 28, 28, 3, R.iron[3]); p.deepOutline(); } },
  iconCave: { w: 32, h: 32, foot: [0, 0, 0, 0],
    paint(p, s) { const c = s === 'spirit' ? R.violet : R.iron; p.ellipse(16, 20, 15, 12, c); p.ellipse(16, 24, 7, 7, OUTLINE); if (s === 'spirit') p.set(16, 22, R.spirit[0]); p.deepOutline(); } },
  iconTower: { w: 32, h: 56, foot: [0, 0, 0, 0], anim: true,
    paint(p, s, f) {
      if (s === 'cradle') { // the Cradle: a spiral of machine and garden rising into the clouds
        for (let y = 0; y < 56; y++) { const half = 2 + y * 0.22; p.rect(16 - half, y, half * 2, 1, y % 6 < 3 ? S[1] : R.folSilent[2]); }
        for (let y = 4; y < 52; y += 6) p.set(16 + Math.round(Math.sin(y * 0.4 + f) * (2 + y * 0.2)), y, G[0]);
      } else {
        for (let y = 8; y < 56; y++) { const half = 3 + y * 0.18 + Math.sin(y * 0.7) * 2; p.rect(16 - half, y, half * 2, 1, y % 5 ? R.iron[2] : R.iron[3]); }
        p.rect(14, 0, 4, 10, R.iron[2]);
      }
      p.deepOutline();
    } },
  iconOpera: { w: 32, h: 32, foot: [0, 0, 0, 0],
    paint(p) { p.rect(4, 12, 24, 18, C[1]); p.ellipse(16, 12, 12, 8, R.plum); for (let x = 6; x < 28; x += 5) p.rect(x, 18, 2, 12, C[0]); p.deepOutline(); } },
  iconPeak: { w: 32, h: 32, foot: [0, 0, 0, 0],
    paint(p, s) { for (let y = 4; y < 32; y++) { const half = (y - 4) * 0.55; p.rect(16 - half, y, half * 2, 1, y < 10 ? SN[1] : R.iron[y % 3 ? 2 : 3]); } p.deepOutline(); } },
  iconGlyph: { w: 32, h: 16, foot: [0, 0, 0, 0], anim: true,
    paint(p, s, f) { for (let a = 0; a < 360; a += 6) { const t = a * Math.PI / 180; p.set(16 + Math.cos(t) * 14, 8 + Math.sin(t) * 6, G[(Math.floor(a / 40) + f) % 3]); } } },
  iconSea: { w: 32, h: 16, foot: [0, 0, 0, 0], anim: true,
    paint(p, s, f) { for (let i = 0; i < 3; i++) { const r = 4 + ((f * 2 + i * 4) % 12); for (let a = 0; a < 360; a += 12) { const t = a * Math.PI / 180; p.set(16 + Math.cos(t) * r, 8 + Math.sin(t) * r * 0.4, R.seaRest[1 + i % 2]); } } } },
});
