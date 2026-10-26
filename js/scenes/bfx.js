// Battle VFX. Every effect is drawn in whole pixels from ramp colours; magic uses dithered
// rings instead of soft alpha. tier: 1 faint & flickering (2 frames in 8 dropped), 2 solid,
// 3 dense and screen-filling.
import { ditherPattern, bayer, W } from '../core/gfx.js';
import { R, EL, OUTLINE } from '../data/palette.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const ease = (t) => 0.5 - Math.cos(Math.PI * Math.min(1, Math.max(0, t))) / 2;

export function line(ctx, x0, y0, x1, y1, color) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  ctx.fillStyle = color;
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (let n = 0; n < 800; n++) {
    ctx.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
function ring(ctx, x, y, r, col, sy = 1, step = 1) {
  const n = Math.max(12, Math.round(r * 3));
  ctx.fillStyle = col;
  for (let i = 0; i < n; i += step) { const a = (i / n) * Math.PI * 2; ctx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r * sy), 1, 1); }
}
function dot(ctx, x, y, s, col) { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), s, s); }
function dith(ctx, x, y, w, h, col, lvl) { ctx.fillStyle = ditherPattern(ctx, col, lvl); ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }

const ELEMENT_FX = { fire: 'fire', ice: 'ice', bolt: 'bolt', water: 'wave', wind: 'gust', earth: 'quake', holy: 'column', void: 'void', bio: 'bio', spirit: 'petals' };
export function fxForElement(el) { return ELEMENT_FX[el] || 'spark'; }

export class Effects {
  constructor() { this.list = []; }
  add(kind, x, y, o = {}) { const f = { kind, x, y, t: -(o.delay || 0), dur: o.dur || 16, tier: 1, ...o }; this.list.push(f); return f; }
  update() {
    for (const f of this.list) { f.t++; if (f.kind === 'timer' && f.t >= f.dur && !f.fired) { f.fired = true; f.done(); } }
    this.list = this.list.filter((f) => f.t <= f.dur);
  }
  shards(x, y, n = 4) { for (let i = 0; i < n; i++) this.add('shard', x, y, { vx: rnd(-1.5, 1.5), vy: rnd(-2.5, -0.5), dur: 16 }); }
  // Generic attack effect at a target by key; returns frames until impact.
  play(kind, x, y, o = {}) {
    const tier = o.tier || 1;
    const dur = { fire: 30 + tier * 14, ice: 30 + tier * 14, bolt: 20 + tier * 10, wave: 34 + tier * 12, gust: 30 + tier * 12, quake: 30 + tier * 10, column: 34 + tier * 12, void: 34 + tier * 12, bio: 32 + tier * 10, petals: 36 + tier * 12, heal: 40, feather: 50, hex: 24, clock: 30, rings: 30, chi: 28, fists: 22, cut: 10, screencut: 16, bolts: 20, drill: 22, flashbang: 16, star: 16, paint: 22, beasts: 30, rally: 30, pollen: 44, drain: 50, smoke: 30, slam: 14, needle: 12, beam: 14, claw: 10, slash: 10, tornado: 50 }[kind] || 16;
    this.add(kind, x, y, { ...o, dur: o.dur || dur, tier });
    return Math.round((o.dur || dur) * 0.55);
  }

  draw(ctx) {
    for (const f of this.list) {
      if (f.t < 0 || f.kind === 'timer') continue;
      const t = f.t, k = t / f.dur, tier = f.tier;
      if (tier === 1 && MAGIC.has(f.kind) && t % 8 >= 6) continue; // fragile early magic flickers
      const fn = DRAW[f.kind];
      if (fn) fn(ctx, f, t, k, tier);
    }
  }
}
const MAGIC = new Set(['fire', 'ice', 'wave', 'gust', 'column', 'void', 'bio', 'petals', 'tornado', 'quake']);

const DRAW = {
  smear(ctx, f, t) { // crescent: white core, steel mid, dark trailing edge
    for (let a = -60; a <= 70; a += 3) {
      const r = (a * Math.PI) / 180;
      for (let w = 0; w < f.w; w++) {
        const rr = 18 - w;
        const c = w < 2 ? '#FFFDF5' : w < f.w - 1 ? '#9AA0A8' : '#4C5058';
        const x = Math.round(f.x - Math.cos(r) * rr), y = Math.round(f.y + Math.sin(r) * rr);
        if (t === 0 || bayer(x, y, 2)) dot(ctx, x, y, 1, c);
      }
    }
  },
  spark(ctx, f, t) {
    const s = Math.min(t, 4);
    const pal = f.color || ['#FFFDF5', '#FFF4C0', '#F5D68A', '#9AA0A8', '#6E747E'];
    ctx.fillStyle = pal[Math.min(pal.length - 1, s)];
    if (f.style === 'ring') { ring(ctx, f.x, f.y, 4 + t * 2, ctx.fillStyle); return; }
    const len = [6, 11, 12, 10, 6][s];
    ctx.fillRect(f.x - len, f.y, len * 2 + 1, 1);
    ctx.fillRect(f.x, f.y - len, 1, len * 2 + 1);
    const d = Math.floor(len * 0.5);
    for (let i = -d; i <= d; i++) { ctx.fillRect(f.x + i, f.y + i, 1, 1); ctx.fillRect(f.x + i, f.y - i, 1, 1); }
    if (s < 2) dot(ctx, f.x - 2, f.y - 2, 5, '#FFFDF5');
  },
  claw(ctx, f, t) { // round impact ring + 4 radiating dashes (fists/claws)
    const r = 4 + t * 2;
    ring(ctx, f.x, f.y, r, t < 3 ? '#FFFDF5' : EL.fire[1]);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.6; line(ctx, f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, f.x + Math.cos(a) * (r + 4), f.y + Math.sin(a) * (r + 4), R.leather[0]); }
  },
  slash(ctx, f, t) { DRAW.spark(ctx, f, t); },
  cut(ctx, f, t) { // diagonal flick
    for (let i = 0; i < 2; i++) line(ctx, f.x - 10 + i * 4, f.y - 10, f.x + 10 + i * 4, f.y + 10, t < 3 ? '#FFFDF5' : R.iron[0]);
  },
  screencut(ctx, f, t) { // full-screen horizontal cut line held 6 frames
    if (t > 8) return;
    dot(ctx, 0, 0, 0, '#000');
    ctx.fillStyle = '#FFFDF5'; ctx.fillRect(0, f.y, W, 2);
    ctx.fillStyle = R.glass[1]; ctx.fillRect(0, f.y + 2, W, 1);
  },
  shard(ctx, f, t) { f.x += f.vx; f.vy += 0.25; f.y += f.vy; dot(ctx, f.x, f.y, 2, t % 4 < 2 ? R.glass[0] : R.glass[2]); },
  dust(ctx, f, t) { const r = 3 + t; dith(ctx, f.x - r, f.y - r / 2, r * 2, r, f.color || R.folRuin[0], t < 8 ? 2 : 1); },
  slam(ctx, f, t) { ring(ctx, f.x, f.y + 10, 6 + t * 3, t < 6 ? '#FFFDF5' : R.brass[1], 0.4); DRAW.dust(ctx, f, t); },
  beam(ctx, f, t) {
    const c = t < 4 ? R.glass[0] : R.glass[2];
    line(ctx, f.sx ?? f.x - 80, f.sy ?? f.y, f.x, f.y, c);
    line(ctx, f.sx ?? f.x - 80, (f.sy ?? f.y) + 1, f.x, f.y + 1, R.glass[3]);
  },
  boltline(ctx, f, t) { line(ctx, f.sx, f.sy, f.x, f.y, t % 2 ? EL.bolt[1] : '#FFFFFF'); },
  needle(ctx, f, t, k) {
    const x = (f.sx ?? f.x) + (f.x - (f.sx ?? f.x)) * Math.min(1, k * 1.4), y = (f.sy ?? f.y) + (f.y - (f.sy ?? f.y)) * Math.min(1, k * 1.4);
    dot(ctx, x - 2, y, 1, R.glass[1]); ctx.fillStyle = R.stone[0]; ctx.fillRect(Math.round(x) - 1, Math.round(y), 5, 1);
  },
  bolt(ctx, f, t, k, tier) { // jagged 1-2px bolts, redrawn every frame; tier 3: full white flash then 3 bolts
    if (t % 2) return;
    const n = tier === 3 ? 3 : tier === 2 ? 2 : 1;
    for (let b = 0; b < n; b++) {
      let x = f.x + rnd(-8, 8), y = f.y - 70;
      const col = b % 2 ? EL.bolt[2] : '#FFFFFF';
      while (y < f.y) { const nx = x + rnd(-5, 5), ny = y + rnd(4, 9); line(ctx, x, y, nx, ny, col); if (tier > 1 && Math.random() < 0.2) line(ctx, nx, ny, nx + rnd(-8, 8), ny + 6, EL.bolt[2]); x = nx; y = ny; }
    }
    dith(ctx, f.x - 10, f.y - 6, 20, 12, EL.bolt[1], 2);
  },
  fire(ctx, f, t, k, tier) { // teardrop flames rising; tier 3: a pillar erupts with ember rain
    const P = EL.fire;
    const n = 3 + tier * 2;
    for (let i = 0; i < n; i++) {
      const h = (8 + tier * 4) + ((t + i * 3) % 8) * 2;
      const x = f.x - n * 3 + i * 6, y = f.y + 12 - h;
      dith(ctx, x - 2, y, 6, h, P[2], tier > 1 ? 4 : 2);
      dith(ctx, x - 1, y + 3, 4, h - 4, P[1], tier > 1 ? 4 : 2);
      dot(ctx, x, y + h - 5, 2, P[0]);
    }
    if (tier === 3) {
      const hh = Math.min(140, t * 6);
      dith(ctx, f.x - 12, f.y + 14 - hh, 24, hh, P[2], 2);
      dith(ctx, f.x - 6, f.y + 14 - hh, 12, hh, P[1], 4);
      for (let i = 0; i < 12; i++) dot(ctx, f.x - 40 + ((i * 37 + t * 2) % 80), f.y - 40 + ((i * 19 + t * 3) % 60), 1, P[0]);
    }
  },
  ice(ctx, f, t, k, tier) { // hexagonal crystals grow in 3 stages, then shatter
    const P = EL.ice;
    const stage = Math.min(3, Math.floor(k * 4));
    const size = (4 + tier * 3) * (stage + 1) / 3;
    if (k < 0.8) {
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        line(ctx, f.x, f.y, f.x + Math.cos(a) * size, f.y + Math.sin(a) * size, i % 2 ? P[1] : P[0]);
      }
      if (tier >= 2) dith(ctx, f.x - size / 2, f.y - size / 2, size, size, P[2], tier === 3 ? 4 : 2);
      if (tier === 3) { ctx.fillStyle = P[1]; ctx.fillRect(f.x - size * 0.8, f.y - size * 1.4, size * 1.6, size * 2.4); dith(ctx, f.x - size * 0.8, f.y - size * 1.4, size * 1.6, size * 2.4, P[3], 1); }
    } else {
      for (let i = 0; i < 6 + tier * 3; i++) dot(ctx, f.x + Math.cos(i) * (t - f.dur * 0.8) * 3, f.y + Math.sin(i * 1.3) * (t - f.dur * 0.8) * 2, 2, P[i % 2]);
    }
  },
  wave(ctx, f, t, k, tier) { // round droplets / curling wave left to right; tier 3 tidal wave across
    const P = EL.water;
    if (tier === 3) {
      const x = -40 + k * (W + 80);
      dith(ctx, x - 40, 40, 50, 120, P[2], 4); dith(ctx, x - 50, 30, 20, 130, P[1], 2);
      for (let i = 0; i < 10; i++) dot(ctx, x + rnd(-10, 10), 30 + i * 12, 2, P[0]);
      return;
    }
    const w = 18 + tier * 10;
    for (let i = 0; i < w; i++) {
      const x = f.x - w / 2 + i, y = f.y + Math.sin(i * 0.35 + t * 0.4) * (3 + tier * 2);
      dot(ctx, x, y, 1, i % 3 ? P[1] : P[0]); dot(ctx, x, y + 2, 1, P[2]);
    }
    for (let i = 0; i < 3 + tier * 2; i++) dot(ctx, f.x - 10 + i * 5, f.y - 8 - ((t + i * 5) % 14), 2, P[0]);
  },
  gust(ctx, f, t, k, tier) { // thin crescent lines spiralling
    const P = EL.wind;
    for (let i = 0; i < 3 + tier * 2; i++) {
      const a = t * 0.3 + i * 1.3, r = 6 + i * 3;
      for (let j = 0; j < 8; j++) dot(ctx, f.x + Math.cos(a + j * 0.12) * r, f.y + Math.sin(a + j * 0.12) * r * 0.6, 1, P[i % 3]);
    }
  },
  tornado(ctx, f, t, k, tier) { // tornado column (8-frame loop) lifting the targets
    const P = EL.wind;
    for (let y = 0; y < 90; y += 3) {
      const r = 6 + y * 0.25, a = (t % 8) * 0.8 + y * 0.2;
      dot(ctx, f.x + Math.cos(a) * r, f.y + 20 - y, 2, P[(y / 3) % 3 | 0]);
      dot(ctx, f.x - Math.cos(a) * r, f.y + 20 - y, 1, P[1]);
    }
  },
  quake(ctx, f, t, k, tier) { // rocks rise, slam down; tier 3 the ground cracks open
    const P = EL.earth;
    for (let i = 0; i < 2 + tier * 2; i++) {
      const up = k < 0.5 ? ease(k * 2) : 1 - ease((k - 0.5) * 2);
      const x = f.x - 16 + i * 8, y = f.y + 14 - up * 24;
      ctx.fillStyle = P[1]; ctx.fillRect(x, y, 6, 5); ctx.fillStyle = P[2]; ctx.fillRect(x, y + 4, 6, 1);
    }
    if (tier === 3 && k > 0.4) line(ctx, 0, f.y + 18, W, f.y + 14, OUTLINE);
  },
  column(ctx, f, t, k, tier) { // rays, rings; a column of light descending with feathers
    const P = EL.holy;
    const h = Math.min(90, t * (4 + tier * 2));
    const w = 8 + tier * 4;
    dith(ctx, f.x - w, f.y + 20 - h, w * 2, h, P[1], tier > 1 ? 2 : 1);
    ctx.fillStyle = P[0]; ctx.fillRect(f.x - 2, f.y + 20 - h, 4, h);
    ring(ctx, f.x, f.y + 18, 6 + (t % 12), P[2], 0.35);
    if (tier === 3) for (let i = 0; i < 6; i++) dot(ctx, f.x - 20 + i * 8, f.y - 40 + ((t * 2 + i * 13) % 60), 2, '#FFFFFF');
  },
  void(ctx, f, t, k, tier) { // inky blobs, inward spirals; dithered edges eat the background
    const P = EL.void;
    const r = (20 + tier * 8) * (1 - k * 0.6);
    for (let i = 0; i < 14; i++) { const a = i * 0.45 - t * 0.15; dot(ctx, f.x + Math.cos(a) * r * (1 - (i % 3) * 0.2), f.y + Math.sin(a) * r * 0.7, 2, P[i % 3]); }
    dith(ctx, f.x - r / 2, f.y - r / 3, r, r * 0.7, P[3], tier > 1 ? 3 : 2);
  },
  bio(ctx, f, t) { // bubbles rise and pop
    const P = EL.bio;
    for (let i = 0; i < 8; i++) { const y = f.y + 10 - ((t + i * 6) % 30); const s = ((t + i) % 9) < 6 ? 2 : 1; dot(ctx, f.x - 14 + i * 4, y, s, P[i % 3]); }
    dith(ctx, f.x - 16, f.y - 8, 32, 20, P[2], 1);
  },
  petals(ctx, f, t, k, tier) { // spirit petals spiral in; tier 3 a storm with ribbons
    const n = 8 + tier * 4;
    for (let i = 0; i < n; i++) {
      const a = i * 0.63 + t * 0.12, r = (26 + tier * 6) * (1 - k) + 4;
      const x = Math.round(f.x + Math.cos(a) * r), y = Math.round(f.y + Math.sin(a) * r * 0.7);
      if (tier === 1) dith(ctx, x - 1, y - 1, 3, 2, R.spirit[i % 2 ? 1 : 2], 2);
      else { ctx.fillStyle = R.spirit[i % 2 ? 1 : 2]; ctx.fillRect(x - 1, y - 1, 3, 2); }
      if (i % 3 === 0) dot(ctx, x, y, 1, R.spirit[0]);
    }
    if (tier === 3) for (let r = 0; r < 3; r++) for (let j = 0; j < 20; j++) { const a = j * 0.3 + t * 0.1 + r * 2; dot(ctx, f.x + Math.cos(a) * (40 - j), f.y + Math.sin(a) * (24 - j * 0.6), 1, R.spirit[1]); }
  },
  aura(ctx, f, t) {
    for (let i = 0; i < 3; i++) {
      const r = ((t + i * 4) % 12) + 6;
      const n = 20;
      ctx.fillStyle = f.color[i + 1];
      for (let a = 0; a < n; a++) { if ((a + t) % 2) continue; const ang = (a / n) * Math.PI * 2; ctx.fillRect(Math.round(f.x + Math.cos(ang) * r), Math.round(f.y + 10 + Math.sin(ang) * r * 0.4), 1, 1); }
    }
  },
  heal(ctx, f, t) {
    for (let i = 0; i < 8; i++) {
      const y = f.y + 16 - ((t * 1.2 + i * 7) % 34), x = f.x - 12 + i * 3 + (i % 2) * 2;
      ctx.fillStyle = i % 2 ? '#FFFDF5' : R.folRest[0];
      ctx.fillRect(Math.round(x), Math.round(y), 1, 3);
    }
    dith(ctx, f.x - 14, f.y + 16, 28, 3, R.folRest[1], 1);
  },
  feather(ctx, f, t, k) { // a single feather falls, then a light column rises
    if (k < 0.5) { const y = f.y - 40 + k * 2 * 40, x = f.x + Math.sin(t * 0.2) * 6; dot(ctx, x, y, 2, '#FFFFFF'); dot(ctx, x + 2, y + 1, 1, R.stone[1]); }
    else DRAW.column(ctx, { ...f, x: f.x, y: f.y }, Math.round((k - 0.5) * 2 * 20), k, 1);
  },
  hex(ctx, f, t) { // hexagonal barrier sweeps over the target in 6 frames
    const col = f.color || R.iron[0];
    const r = 14;
    const s = Math.min(6, t);
    for (let i = 0; i < 6; i++) { if (i > s) break; const a = i * Math.PI / 3, b = a + Math.PI / 3; line(ctx, f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, f.x + Math.cos(b) * r, f.y + Math.sin(b) * r, col); }
    if (t > 6) dith(ctx, f.x - 10, f.y - 10, 20, 20, col, 1);
  },
  clock(ctx, f, t) {
    ring(ctx, f.x, f.y - 20, 6, f.color || EL.holy[2]);
    const a = (f.reverse ? -1 : 1) * t * 0.3;
    line(ctx, f.x, f.y - 20, f.x + Math.cos(a) * 5, f.y - 20 + Math.sin(a) * 5, f.color || EL.holy[1]);
  },
  rings(ctx, f, t) {
    const r = 8 + t * 3, col = f.color || R.glass;
    ring(ctx, f.x, f.y, r, t < f.dur / 2 ? col[0] : col[2], 0.5, t > 10 ? 2 : 1);
  },
  chord(ctx, f, t) { for (let i = 0; i < 3; i++) if (t > i * 6) DRAW.rings(ctx, f, t - i * 6); },
  chi(ctx, f, t, k) { // blue chi aura rings expand 3 times, then a burst
    for (let i = 0; i < 3; i++) if (t > i * 5) ring(ctx, f.sx ?? f.x, f.sy ?? f.y, (t - i * 5) * 2, R.farmBlue[i]);
    if (k > 0.5) DRAW.spark(ctx, { ...f, color: [R.farmBlue[0], R.farmBlue[1], EL.holy[1], EL.holy[2], EL.holy[3]] }, t - Math.round(f.dur / 2));
  },
  fists(ctx, f, t) { // 3 afterimages at 50% dither + impact rings
    for (let i = 0; i < 3; i++) dith(ctx, f.x - 8 - i * 6 + (t % 4), f.y - 2 + (i - 1) * 6, 6, 5, R.skinDeep[1], 2);
    if (t % 5 < 2) DRAW.claw(ctx, f, t % 5);
  },
  bolts(ctx, f, t) { // crossbow bolts: thin line projectiles + tiny bursts
    for (let i = 0; i < 3; i++) { const x = (f.sx ?? f.x + 80) + (f.x - (f.sx ?? f.x + 80)) * Math.min(1, (t - i * 2) / 8); if (t - i * 2 < 0) continue; line(ctx, x, f.y - 6 + i * 6, x + 12, f.y - 6 + i * 6, R.iron[0]); }
    if (t > 8) DRAW.spark(ctx, { ...f }, t - 8);
  },
  drill(ctx, f, t) { // mechanical spin loop + brass sparks
    const a = (t % 4) * Math.PI / 2;
    for (let i = 0; i < 4; i++) line(ctx, f.x, f.y, f.x + Math.cos(a + i * Math.PI / 2) * 8, f.y + Math.sin(a + i * Math.PI / 2) * 8, R.iron[i % 2]);
    for (let i = 0; i < 4; i++) dot(ctx, f.x + rnd(-10, 10), f.y + rnd(-10, 10), 1, R.brass[0]);
  },
  flashbang(ctx, f, t) { if (t < 3) { dith(ctx, 0, 0, W, 160, '#FFFDF5', 4 - t); } },
  star(ctx, f, t, k) { // spinning shuriken (4 rotation frames) then spark
    const x = (f.sx ?? f.x + 100) + (f.x - (f.sx ?? f.x + 100)) * Math.min(1, k * 1.6), y = f.y;
    const r = t % 4;
    ctx.fillStyle = R.iron[0];
    if (r % 2) { ctx.fillRect(x - 3, y, 7, 1); ctx.fillRect(x, y - 3, 1, 7); } else { for (let i = -2; i <= 2; i++) { ctx.fillRect(x + i, y + i, 1, 1); ctx.fillRect(x + i, y - i, 1, 1); } }
  },
  paint(ctx, f, t) { // paint splat in the target's weak colour
    const col = f.color || EL.fire;
    const r = Math.min(10, t);
    for (let i = 0; i < 10; i++) { const a = i * 0.63; dot(ctx, f.x + Math.cos(a) * r * (1 + (i % 3) * 0.3), f.y + Math.sin(a) * r * 0.8, 2, col[i % 3]); }
    if (t < 8) { ctx.fillStyle = col[1]; ctx.fillRect(f.x - 4, f.y - 3, 8, 6); }
  },
  beasts(ctx, f, t, k) { // animal silhouettes rush across the screen in solid colour, 8 frames
    const x = W - k * (W + 120);
    ctx.fillStyle = f.color || R.leather[3];
    for (let i = 0; i < 3; i++) {
      const bx = x + i * 40, by = 70 + i * 26 + Math.sin(t * 0.8 + i) * 3;
      ctx.fillRect(bx, by, 26, 9); ctx.fillRect(bx - 6, by - 4, 9, 7); ctx.fillRect(bx + 2, by + 8, 3, 5); ctx.fillRect(bx + 18, by + 8, 3, 5); ctx.fillRect(bx + 24, by - 2, 7, 2);
    }
  },
  rally(ctx, f, t) { for (let i = 0; i < 6; i++) { const y = f.y + 18 - ((t * 2 + i * 9) % 40); ctx.fillStyle = i % 2 ? R.brass[0] : '#FFFDF5'; ctx.fillRect(f.x - 12 + i * 5, y, 1, 5); } },
  pollen(ctx, f, t) {
    for (let i = 0; i < 14; i++) dot(ctx, f.x - 16 + ((i * 7 + t) % 32), f.y - 10 + ((i * 11 + t * 0.5) % 28), 1, i % 2 ? R.folSilent[0] : R.stone[0]);
    dith(ctx, f.x - 18, f.y - 12, 36, 30, R.folSilent[1], 1);
  },
  smoke(ctx, f, t) { for (let i = 0; i < 4; i++) dith(ctx, f.x - 12 + i * 6, f.y - 6 - (t % 12) + i * 2, 10, 10, i % 2 ? R.iron[3] : OUTLINE, t < 15 ? 2 : 1); },
  drain(ctx, f, t) { // thin glass ribbons from target to machine, warm motes travel along
    for (let r = 0; r < 3; r++) {
      const pts = [];
      for (let i = 0; i <= 20; i++) { const u = i / 20; pts.push([f.x + (f.sx - f.x) * u, f.y + (f.sy - f.y) * u + Math.sin(u * Math.PI * 2 + t * 0.2 + r * 2) * 6]); }
      for (let i = 0; i < pts.length - 1; i++) line(ctx, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], R.glass[r === 0 ? 1 : 2]);
      const m = Math.floor(((t * 0.6 + r * 7) % 20));
      dot(ctx, pts[m][0], pts[m][1] - 1, 2, R.skinLight[0]);
    }
  },
  ember(ctx, f, t) { dot(ctx, f.x, f.y, 3, t % 2 ? EL.fire[1] : EL.fire[0]); },
  flame(ctx, f, t, k) { DRAW.fire(ctx, f, t, k, 1); },
  part(ctx, f, t, k) { const x = f.x + (f.tx - f.x) * ease(k), y = f.y + (f.ty - f.y) * ease(k); dot(ctx, x, y, 2, t % 4 < 2 ? R.brass[1] : R.stone[1]); },
  reseed(ctx, f, t) { DRAW.pollen(ctx, f, t); },
  gustAll(ctx, f, t, k, tier) { DRAW.gust(ctx, f, t, k, tier); },
};
