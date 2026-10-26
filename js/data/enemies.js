// Enemies: painted procedurally in the guide's three families.
//  * Ancient machines: white stone shells, aged brass, glass cores (always visible = weak
//    point), a halo/ring/arch in every silhouette, clean full outline in their deep step.
//  * Beasts: organic, asymmetric, region palette.
//  * Constructs (training dummy): human-made.
import { Painter, flipH, bayer } from '../core/gfx.js';
import { R, OUTLINE, EL } from './palette.js';
import { battleSprite } from './sprites.js';

const S = R.stone, B = R.brass, G = R.glass, SG = R.folSilent;

function machineOutline(p) { p.outline((n) => (B.includes(n) ? B[4] : G.includes(n) ? G[4] : SG.includes(n) ? SG[4] : S[4])); }

// glass core: 3-step glow + 1px step-1 specular upper-left. pulse 0..1 brightens.
function core(p, cx, cy, r, pulse) {
  const ramp = pulse > 0.5 ? [G[0], G[0], G[1], G[2], G[3]] : [G[0], G[1], G[2], G[3], G[4]];
  p.ellipse(cx, cy, r, r, ramp);
  p.set(Math.round(cx - r * 0.45), Math.round(cy - r * 0.45), G[0]);
}

function crack(p, x, y, len, dir = 1) {
  for (let i = 0; i < len; i++) p.set(x + i * dir, y + (i % 3 === 2 ? 1 : 0) + Math.floor(i / 3), S[3]);
}

// ---------------------------------------------------------------- painters
const PAINT = {
  vaultMite(f) { // swarm drone 24x24: stone orb inside a tilted brass ring, single lens
    const p = new Painter(24, 24);
    const ringP = new Painter(24, 24);
    ringP.ring(12, 12, 9, 11, [B[0], B[1], B[2], B[3]], 4);
    p.stamp(ringP, 0, 0);
    p.ellipse(12, 12, 7, 7, S);
    for (let y = 12; y < 24; y++) for (let x = 0; x < 24; x++) { const c = ringP.get(x, y); if (c) p.set(x, y, c); }
    crack(p, 14, 6, 3);
    core(p, 11, 10, 3, f);
    p.rect(11, 18, 2, 3, B[2]);
    p.set(11, 21, B[1]);
    machineOutline(p);
    return p;
  },
  seedDrone(f) { // 16x16 silver seed with petal fins, grown from the silent flowers
    const p = new Painter(16, 16);
    p.ellipse(8, 8, 4, 5, S);
    for (const [x, y] of [[3, 4], [12, 4], [3, 11], [12, 11]]) p.ellipse(x, y, 2, 1.5, [SG[0], SG[1], SG[2], SG[3], SG[4]]);
    core(p, 8, 8, 2, f);
    p.ring(8, 8, 5, 6, [B[0], B[1], B[2], B[3]], 2);
    machineOutline(p);
    return p;
  },
  sentinel(f) { // 32x40 lantern-warden with an arch halo
    const p = new Painter(32, 40);
    // arch halo
    for (let a = 180; a <= 360; a += 2) {
      const r = a * Math.PI / 180;
      for (let t = 12; t <= 14; t++) p.set(16 + Math.cos(r) * t, 16 + Math.sin(r) * t, t === 12 ? B[1] : B[2]);
    }
    p.ellipse(16, 18, 8, 10, S);
    p.rect(10, 25, 12, 4, S[2]);
    p.rect(10, 25, 12, 1, S[1]);
    for (let y = 29; y < 36; y++) p.rect(16 - (36 - y) / 2, y, 36 - y, 1, y < 31 ? B[1] : B[2]);
    // lens window
    p.rect(12, 13, 8, 9, S[3]);
    core(p, 16, 17, 4, f);
    crack(p, 9, 21, 3);
    machineOutline(p);
    return p;
  },
  warden(f, dmg = 0) { // tutorial boss ~ 80x88: stone guardian with a harp-like rib arch
    const p = new Painter(88, 92);
    const cx = 44;
    // halo ring behind head
    p.ring(cx, 18, 13, 16, [B[0], B[1], B[2], B[3]]);
    // legs/base
    p.rect(cx - 22, 70, 14, 18, S[2]); p.rect(cx - 22, 70, 3, 18, S[1]); p.rect(cx - 11, 70, 3, 18, S[3]);
    p.rect(cx + 8, 70, 14, 18, S[3]); p.rect(cx + 8, 70, 3, 18, S[2]);
    p.rect(cx - 26, 86, 20, 4, B[2]); p.rect(cx + 6, 86, 20, 4, B[3]);
    // shoulders
    p.ellipse(cx - 26, 32, 10, 9, S);
    p.ellipse(cx + 26, 32, 10, 9, S, { offset: 1 });
    // arms (stone with brass joints)
    p.rect(cx - 36, 36, 9, 26, S[2]); p.rect(cx - 36, 36, 2, 26, S[1]);
    p.rect(cx + 27, 36, 9, 26, S[3]); p.rect(cx + 34, 36, 2, 26, S[4]);
    p.ellipse(cx - 32, 48, 5, 4, B);
    p.ellipse(cx + 31, 48, 5, 4, B, { offset: 1 });
    p.ellipse(cx - 32, 66, 7, 6, S);
    p.ellipse(cx + 31, 66, 7, 6, S, { offset: 1 });
    // torso: open rib arch
    p.ellipse(cx, 48, 20, 26, S);
    p.ellipse(cx, 50, 13, 18, [S[4], S[4], S[4], S[4], S[4]]);
    for (let i = -3; i <= 3; i++) { // ribs, like harp strings
      const x = cx + i * 4;
      for (let y = 34; y < 66; y++) if (((x - cx) ** 2) / 169 + ((y - 50) ** 2) / 324 < 1) p.set(x, y, i < 0 ? S[1] : S[2]);
    }
    core(p, cx, 50, 7, f);
    // head: smooth helm with one slit lens
    p.ellipse(cx, 18, 9, 10, S);
    p.rect(cx - 6, 18, 12, 2, S[4]);
    p.rect(cx - 2, 18, 4, 2, f > 0.5 ? G[0] : G[1]);
    // hip plate
    p.rect(cx - 16, 66, 32, 6, B[2]); p.rect(cx - 16, 66, 32, 1, B[1]);
    crack(p, cx - 15, 40, 4); crack(p, cx + 10, 28, 3, -1);
    if (dmg > 0) { crack(p, cx - 8, 26, 6); crack(p, cx + 14, 56, 5, -1); }
    if (dmg > 1) { crack(p, cx - 30, 30, 5); crack(p, cx + 20, 74, 4); }
    // moss in silent green
    p.set(cx - 20, 72, SG[2]); p.set(cx - 19, 72, SG[1]); p.set(cx + 22, 30, SG[2]);
    machineOutline(p);
    return p;
  },
  bloom(f, dmg = 0) { // "Seedling Swarm" mother: a stone-and-brass flower machine, 72x72
    const p = new Painter(72, 76);
    const cx = 36, cy = 30;
    // stem
    for (let y = 40; y < 74; y++) p.rect(cx - 2 + Math.round(Math.sin(y / 6) * 2), y, 4, 1, y % 6 === 0 ? B[1] : B[2]);
    // leaves (silent green)
    p.ellipse(cx - 12, 58, 10, 4, SG);
    p.ellipse(cx + 12, 64, 10, 4, SG, { offset: 1 });
    // petals: 8 stone petals around a glass core
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + (f > 0.5 ? 0.05 : 0);
      p.ellipse(cx + Math.cos(a) * 17, cy + Math.sin(a) * 17, 9, 9, i % 2 ? S : [S[0], S[1], S[1], S[2], S[3]]);
    }
    p.ring(cx, cy, 11, 13, [B[0], B[1], B[2], B[3]]);
    p.ellipse(cx, cy, 11, 11, S[3]);
    core(p, cx, cy, 8, f);
    if (dmg > 0) { crack(p, cx - 24, 22, 5); crack(p, cx + 18, 38, 4); }
    machineOutline(p);
    return p;
  },
  burrower(f) { // ash burrower: mole-like beast of the ruined tunnels, 32x24 (organic)
    const p = new Painter(32, 26);
    const F = R.folRuin, L = R.leather;
    p.ellipse(17, 15, 12, 8, [L[1], L[2], L[2], L[3], L[4]]);
    p.ellipse(7, 14, 6, 5, [L[0], L[1], L[2], L[3], L[4]]);
    p.rect(1, 14, 3, 2, R.skinLight[2]); // snout
    p.set(6, 12, OUTLINE); // eye
    // claws
    for (const x of [6, 10, 22, 26]) { p.rect(x, 21, 3, 2, L[3]); p.set(x - 1, 23, F[0]); p.set(x + 1, 23, F[0]); }
    // ash on its back
    for (let i = 0; i < 6; i++) p.set(12 + i * 3, 8 + (i % 2), F[0]);
    p.deepOutline();
    return p;
  },
  dummy(f) { // straw knight the children built: 32x40
    const p = new Painter(32, 42);
    const L = R.leather, F = R.folRuin, I = R.iron;
    p.rect(15, 26, 2, 15, L[3]); // post
    p.ellipse(16, 22, 8, 10, [F[0], F[1], F[1], F[2], F[3]]); // straw body
    for (let y = 14; y < 31; y += 3) p.set(10 + (y % 5), y, F[0]);
    p.ellipse(16, 10, 6, 6, [F[0], F[1], F[2], F[3], F[4]]); // head
    p.rect(10, 3, 12, 5, I[1]); p.rect(10, 3, 12, 1, I[0]); // bucket helmet
    p.rect(9, 7, 14, 1, I[2]);
    p.set(14, 10, OUTLINE); p.set(18, 10, OUTLINE);
    p.thickLine(6, 20, 2, 8, L[1], 2); // wooden sword arm
    p.rect(0, 4, 4, 5, L[0]);
    p.rect(22, 18, 6, 2, R.tunicRed[2]); // ribbon
    p.deepOutline();
    return p;
  },
};

// ---------------------------------------------------------------- stats
// elements: weak (x2), resist (x0.5). family drives hit sparks (glass shards vs dust).
export const ENEMIES = {
  vaultMite: {
    name: 'Vault Mite', paint: 'vaultMite', family: 'machine', hp: 46, atk: 11, def: 6, spd: 18, exp: 12, parts: 1,
    weak: ['bolt'], hover: true,
    moves: [{ name: 'Needle', power: 1, w: 3, fx: 'needle' }, { name: 'Lens Flash', power: 0.8, w: 1, fx: 'beam', status: null }],
  },
  sentinel: {
    name: 'Sentinel Lamp', paint: 'sentinel', family: 'machine', hp: 96, atk: 15, def: 9, spd: 12, exp: 30, parts: 2,
    weak: ['bolt'], hover: true,
    moves: [{ name: 'Lamp Beam', power: 1.3, w: 3, fx: 'beam' }, { name: 'Glare', power: 0.7, w: 1, fx: 'beam', all: true }],
  },
  burrower: {
    name: 'Ash Burrower', paint: 'burrower', family: 'beast', hp: 58, atk: 12, def: 5, spd: 14, exp: 14, parts: 0, drops: 'tonic',
    weak: ['fire'],
    moves: [{ name: 'Claw', power: 1, w: 3, fx: 'claw' }, { name: 'Dig Rush', power: 1.4, w: 1, fx: 'claw' }],
  },
  warden: {
    name: 'Warden Construct', paint: 'warden', family: 'machine', hp: 700, atk: 16, def: 12, spd: 11, exp: 220, parts: 4,
    weak: ['bolt'], boss: true, big: true,
    moves: [
      { name: 'Stone Fist', power: 1.4, w: 3, fx: 'slam' },
      { name: 'Rib Chord', power: 0.8, w: 2, fx: 'chord', all: true },
      { name: 'Sealing Light', power: 1.1, w: 0, fx: 'seal', all: true },
    ],
  },
  seedDrone: {
    name: 'Seed Drone', paint: 'seedDrone', family: 'machine', hp: 40, atk: 12, def: 6, spd: 20, exp: 14, parts: 1,
    weak: ['bolt', 'spirit'], hover: true,
    moves: [{ name: 'Petal Dart', power: 1, w: 3, fx: 'needle' }, { name: 'Sip', power: 0.6, w: 1, fx: 'drain', drain: true }],
  },
  bloom: {
    name: 'Seedling Swarm', paint: 'bloom', family: 'machine', hp: 780, atk: 18, def: 11, spd: 12, exp: 260, parts: 5,
    weak: ['spirit', 'bolt'], boss: true, big: true,
    moves: [
      { name: 'Pollen Lull', power: 0.7, w: 2, fx: 'pollen', all: true },
      { name: 'Thorn Lash', power: 1.4, w: 3, fx: 'slam' },
      { name: 'Life Sip', power: 1.0, w: 2, fx: 'drain', drain: true },
      { name: 'Reseed', power: 0, w: 0, fx: 'reseed', summon: 'seedDrone' },
    ],
  },
  dummy: {
    name: 'Straw Knight', paint: 'dummy', family: 'beast', hp: 120, atk: 4, def: 2, spd: 8, exp: 0, parts: 0,
    moves: [{ name: 'Wobble', power: 0.4, w: 1, fx: 'claw' }],
  },
};

// ================================================================ the wider bestiary
const L = R.leather, I = R.iron, SP = R.spirit;
const ringRamp = [B[0], B[1], B[2], B[3]];

// stone arch / halo above a point
function arch(p, cx, cy, r, w = 2, ramp = ringRamp) {
  for (let a = 180; a <= 360; a += 1) {
    const t = a * Math.PI / 180;
    for (let k = 0; k < w; k++) p.set(cx + Math.cos(t) * (r + k), cy + Math.sin(t) * (r + k), ramp[Math.min(3, k + (a > 270 ? 1 : 0))]);
  }
}
// 50% dithered translucent edge (veils, memories): erase alternate edge pixels
function ditherEdge(p, depth = 2) {
  const kill = [];
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
    if (!p.get(x, y)) continue;
    let edge = false;
    for (let d = 1; d <= depth && !edge; d++) edge = !p.get(x - d, y) || !p.get(x + d, y) || !p.get(x, y - d) || !p.get(x, y + d);
    if (edge && bayer(x, y, 2)) kill.push([x, y]);
  }
  for (const [x, y] of kill) p.set(x, y, null);
}
// memory silhouette: only 3 spirit colours, scanline offset every 4th row on odd frames
function memory(p, f) {
  const map = (c) => {
    if (!c) return c;
    const n = parseInt(c.slice(1), 16), l = ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.55 + (n & 255) * 0.15;
    return l > 170 ? SP[0] : l > 100 ? SP[1] : SP[3];
  };
  for (let i = 0; i < p.px.length; i++) p.px[i] = map(p.px[i]);
  if (f > 0.5) for (let y = 0; y < p.h; y += 4) { const row = p.px.slice(y * p.w, (y + 1) * p.w); row.unshift(row.pop()); for (let x = 0; x < p.w; x++) p.px[y * p.w + x] = row[x]; }
  ditherEdge(p, 1);
}

Object.assign(PAINT, {
  skywatcher(f) { // winged scout drone, 48x32
    const p = new Painter(48, 34);
    const flap = f > 0.5 ? 2 : 0;
    p.ellipse(10, 14 - flap, 10, 4, S, { offset: 0 }); p.ellipse(38, 14 - flap, 10, 4, S, { offset: 1 });
    for (let x = 2; x < 18; x += 4) p.set(x, 15 - flap, S[3]);
    p.ellipse(24, 17, 9, 8, S);
    p.ring(24, 17, 8, 10, ringRamp, 4);
    core(p, 22, 16, 4, f);
    p.rect(22, 25, 4, 6, B[2]); p.set(23, 31, B[1]);
    machineOutline(p);
    return p;
  },
  retriever(f, dmg) { // four-legged hunter unit, 72x52
    const p = new Painter(72, 54);
    for (const [x, d] of [[16, 0], [26, 1], [46, 0], [56, 1]]) { p.thickLine(x, 30, x - 4 + d * 2, 51, d ? B[3] : B[2], 3); p.rect(x - 7 + d * 2, 50, 6, 3, B[3]); }
    p.ellipse(36, 26, 26, 12, S);
    arch(p, 36, 24, 18, 3);
    p.ellipse(10, 20, 9, 8, S, { offset: 0 });
    core(p, 7, 19, 4, f);
    p.rect(1, 23, 6, 2, B[2]);
    core(p, 40, 28, 5, f);
    crack(p, 30, 18, 4); if (dmg) crack(p, 50, 30, 5);
    machineOutline(p);
    return p;
  },
  hive(f, dmg) { // Hush brood hive: stacked stone rings full of glass cells, 60x60
    const p = new Painter(60, 62);
    for (let i = 0; i < 5; i++) { const y = 54 - i * 10, r = 26 - i * 4; p.ellipse(30, y, r, 6, S, { offset: i % 2 }); }
    for (let i = 0; i < 12; i++) { const a = i * 0.9, y = 16 + (i % 5) * 9; core(p, 30 + Math.cos(a) * (14 - (i % 5) * 2), y, 2, (f + i * 0.13) % 1); }
    arch(p, 30, 10, 9, 2);
    if (dmg) crack(p, 18, 40, 6);
    machineOutline(p);
    return p;
  },
  knight(f, dmg, o = {}) { // Psalm: towering white-brass knight with a harp ribcage, 112x96
    const p = new Painter(112, 98);
    const cx = 56;
    arch(p, cx, 22, 20, 3);
    p.ellipse(cx, 20, 10, 11, S); p.rect(cx - 7, 20, 14, 2, S[4]); p.rect(cx - 2, 20, 4, 2, f > 0.5 ? G[0] : G[1]);
    p.ellipse(cx - 30, 36, 12, 10, S); p.ellipse(cx + 30, 36, 12, 10, S, { offset: 1 });
    p.rect(cx - 44, 40, 10, 34, S[2]); p.rect(cx - 44, 40, 3, 34, S[1]);
    p.rect(cx + 34, 40, 10, 34, S[3]);
    p.ellipse(cx - 39, 76, 8, 7, S); p.ellipse(cx + 39, 76, 8, 7, S, { offset: 1 });
    // harp: an open ribcage strung with light
    p.ellipse(cx, 54, 24, 28, S);
    p.ellipse(cx, 56, 17, 21, [S[4], S[4], S[4], S[4], S[4]]);
    for (let i = -4; i <= 4; i++) for (let y = 36; y < 76; y++) {
      const x = cx + i * 4;
      if (((x - cx) ** 2) / 289 + ((y - 56) ** 2) / 441 < 1) p.set(x, y, (y + Math.round(f * 8)) % 9 === 0 ? G[0] : i < 0 ? S[1] : S[2]);
    }
    core(p, cx, 56, 8, f);
    p.rect(cx - 20, 78, 40, 7, B[2]); p.rect(cx - 20, 78, 40, 1, B[1]);
    p.rect(cx - 18, 85, 14, 12, S[2]); p.rect(cx + 4, 85, 14, 12, S[3]);
    crack(p, cx - 18, 44, 4);
    if (dmg > 0) { crack(p, cx + 8, 30, 6, -1); crack(p, cx - 40, 50, 5); }
    if (dmg > 1) { crack(p, cx + 14, 64, 6); crack(p, cx - 6, 14, 4); }
    if (o.moss !== false) { p.set(cx - 40, 74, SG[2]); p.set(cx + 20, 86, SG[1]); }
    machineOutline(p);
    return p;
  },
  archivist(f, dmg) { // Litany: many-armed archivist, arms ending in quills and lenses
    const p = new Painter(112, 96);
    const cx = 56, cy = 44;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + (f > 0.5 ? 0.06 : 0);
      const ex = cx + Math.cos(a) * 42, ey = cy + Math.sin(a) * 32;
      p.thickLine(cx, cy, ex, ey, i % 2 ? B[2] : B[1], 2);
      if (i % 2) core(p, ex, ey, 3, f); else { p.line(ex, ey, ex + Math.cos(a) * 6, ey + Math.sin(a) * 6, S[0]); p.set(ex, ey, S[2]); }
    }
    p.ellipse(cx, cy, 18, 22, S);
    arch(p, cx, cy - 6, 22, 2);
    p.rect(cx - 12, cy + 18, 24, 26, S[2]); p.rect(cx - 12, cy + 18, 3, 26, S[1]);
    for (let y = cy + 22; y < cy + 42; y += 4) p.rect(cx - 9, y, 18, 1, S[3]); // pages
    core(p, cx, cy - 2, 7, f);
    if (dmg) crack(p, cx - 10, cy + 8, 6);
    machineOutline(p);
    // paper-like light ribbons orbiting (3 ribbons offset)
    for (let r = 0; r < 3; r++) for (let k = 0; k < 14; k++) {
      const a = (r * 2.1 + k * 0.12 + f * 0.8);
      p.set(cx + Math.cos(a) * 50, cy + Math.sin(a) * 18 + r * 6 - 6, k % 3 ? S[0] : G[0]);
    }
    return p;
  },
  veiled(f, dmg) { // Dirge: a tall shape wrapped in a pale stone veil; no face
    const p = new Painter(84, 100);
    const cx = 42;
    for (let y = 6; y < 98; y++) {
      const half = Math.min(34, 8 + y * 0.42) + Math.sin(y * 0.18 + f * 3) * 2;
      for (let x = -half; x <= half; x++) {
        const t = (x + half) / (half * 2);
        const fold = Math.sin(x * 0.5 + y * 0.05) > 0.6;
        p.set(cx + x, y, t < 0.25 ? S[0] : t < 0.6 ? (fold ? S[2] : S[1]) : t < 0.85 ? S[2] : S[3]);
      }
    }
    p.ellipse(cx, 16, 10, 12, S);
    core(p, cx, 50, 5, f);
    arch(p, cx, 14, 14, 2);
    if (dmg) crack(p, cx - 12, 60, 6);
    machineOutline(p);
    ditherEdge(p, 2); // translucent veil edge
    return p;
  },
  prowLens(f, dmg) { // Vigil: a giant lens set into an airship prow
    const p = new Painter(128, 84);
    for (let y = 20; y < 84; y++) { const w = Math.max(0, 64 - (y - 20) * 0.9); p.rect(64 - w, y, w * 2, 1, y % 6 ? L[2] : L[3]); }
    for (let x = 6; x < 122; x += 12) p.rect(x, 22, 2, 30, L[3]);
    p.ellipse(64, 34, 30, 30, [B[0], B[1], B[2], B[3], B[4]]);
    p.ellipse(64, 34, 24, 24, G);
    p.ellipse(64, 34, 9, 9, f > 0.5 ? [OUTLINE, OUTLINE, G[4], G[4], G[4]] : [G[4], G[4], OUTLINE, OUTLINE, OUTLINE]);
    p.set(54, 24, G[0]); p.set(55, 25, G[0]);
    arch(p, 64, 30, 34, 3);
    if (dmg) crack(p, 70, 20, 7);
    machineOutline(p);
    return p;
  },
  tome(f, dmg) { // Archive Sentinel: a stone lectern-arch with a reading lens
    const p = new Painter(64, 68);
    p.rect(14, 30, 36, 34, S[1]); p.rect(14, 30, 4, 34, S[0]); p.rect(46, 30, 4, 34, S[3]);
    p.ellipse(32, 30, 18, 16, S);
    for (let y = 40; y < 60; y += 5) p.rect(20, y, 24, 1, S[3]);
    arch(p, 32, 28, 22, 3);
    core(p, 32, 26, 7, f);
    p.rect(8, 62, 48, 4, B[2]);
    if (dmg) crack(p, 20, 34, 6);
    machineOutline(p);
    return p;
  },
  fishDrone(f) { // Tide drone (drowned temple)
    const p = new Painter(44, 28);
    p.ellipse(22, 14, 16, 8, S);
    for (let i = 0; i < 4; i++) p.line(34 + i, 8 + i * 3, 42, 6 + i * 5, S[2]);
    p.ellipse(10, 12, 4, 4, G); p.set(9, 11, G[0]);
    p.ring(22, 14, 7, 8, ringRamp, 6);
    p.rect(18, 22 + (f > 0.5 ? 1 : 0), 6, 3, B[2]);
    machineOutline(p);
    return p;
  },
  gunDrone(f) { // armada gun drone
    const p = new Painter(40, 34);
    p.ellipse(20, 14, 12, 9, S);
    arch(p, 20, 12, 13, 2);
    p.rect(2, 16, 14, 3, I[1]); p.rect(2, 16, 14, 1, I[0]);
    core(p, 22, 13, 4, f);
    p.rect(14, 22, 2, 8, B[2]); p.rect(24, 22, 2, 8, B[2]);
    p.rect(10, 30, 20, 2, B[3]);
    machineOutline(p);
    return p;
  },
  gardener(f) { // Cradle gardener unit: brass branch legs, white flowers grow on its shell
    const p = new Painter(56, 44);
    for (let i = 0; i < 6; i++) { const x = 8 + i * 8; p.thickLine(28, 20, x, 42 - (i % 2) * 2, B[2 + (i % 2)], 2); }
    p.ellipse(28, 18, 16, 11, S);
    arch(p, 28, 16, 18, 2);
    core(p, 28, 18, 5, f);
    for (const [x, y] of [[16, 10], [38, 12], [24, 8]]) { p.set(x, y, S[0]); p.set(x - 1, y, S[1]); p.set(x + 1, y, S[1]); p.set(x, y - 1, S[0]); p.set(x, y, G[1]); }
    p.ellipse(10, 24, 4, 2, SG); p.ellipse(46, 26, 4, 2, SG);
    machineOutline(p);
    return p;
  },
  thorn(f) { // thorn choir: a column of vines around a singing lens
    const p = new Painter(40, 64);
    for (let y = 4; y < 62; y++) { const x = 20 + Math.round(Math.sin(y * 0.3 + f * 2) * 7); p.rect(x - 2, y, 4, 1, SG[2 + (y % 2)]); p.set(x + 4, y, y % 5 ? SG[3] : S[0]); }
    p.ellipse(20, 16, 8, 8, S);
    core(p, 20, 16, 4, f);
    arch(p, 20, 14, 11, 2);
    machineOutline(p);
    return p;
  },
  seraph(f, dmg, o = {}) { // unfinished prototype angels; o.el = element colour accents
    const p = new Painter(96, 88);
    const ac = EL[o.el || 'holy'];
    const acR = [ac[0], ac[1], ac[2], ac[3], ac[3]];
    const flap = f > 0.5 ? 3 : 0;
    for (let i = 0; i < 4; i++) { // stone feather-blades
      p.ellipse(22 - i * 4, 30 + i * 9 - flap, 18 - i * 2, 4, S, { offset: i % 2 });
      p.ellipse(74 + i * 4, 30 + i * 9 - flap, 18 - i * 2, 4, S, { offset: 1 });
    }
    p.ellipse(48, 46, 14, 26, S);
    p.ellipse(48, 18, 9, 10, S);
    arch(p, 48, 16, 14, 3, [acR[0], acR[1], acR[2], acR[3]]);
    p.ellipse(48, 44, 6, 6, acR); p.set(46, 42, ac[0]);
    p.rect(42, 70, 12, 14, S[2]);
    // unfinished: an exposed brass frame on one side
    for (let y = 30; y < 70; y += 4) p.line(56, y, 62, y + 2, B[2]);
    if (dmg) crack(p, 38, 36, 6);
    machineOutline(p);
    return p;
  },
  amen(f, dmg) { // Amen: the Choir rebuilt as one — knight's ribs, archivist's arms, veil, prow-lens crown
    const p = new Painter(128, 100);
    const cx = 64;
    for (let i = 0; i < 6; i++) { const a = Math.PI + (i / 5) * Math.PI; p.thickLine(cx, 44, cx + Math.cos(a) * 58, 44 + Math.sin(a) * 36, B[2], 2); core(p, cx + Math.cos(a) * 58, 44 + Math.sin(a) * 36, 3, f); }
    for (let y = 40; y < 100; y++) { const half = Math.min(40, 14 + (y - 40) * 0.6); for (let x = -half; x <= half; x++) p.set(cx + x, y, (x + half) / (half * 2) < 0.3 ? S[1] : S[2]); }
    p.ellipse(cx, 52, 22, 24, S);
    p.ellipse(cx, 54, 15, 17, [S[4], S[4], S[4], S[4], S[4]]);
    for (let i = -3; i <= 3; i++) for (let y = 40; y < 70; y++) if (((i * 4) ** 2) / 225 + ((y - 54) ** 2) / 289 < 1) p.set(cx + i * 4, y, S[1]);
    core(p, cx, 54, 7, f);
    p.ellipse(cx, 18, 16, 14, [B[0], B[1], B[2], B[3], B[4]]);
    p.ellipse(cx, 18, 11, 10, G);
    p.ellipse(cx, 18, 4, 4, OUTLINE);
    arch(p, cx, 16, 22, 3);
    if (dmg) { crack(p, cx - 30, 70, 7); crack(p, cx + 10, 30, 5); }
    machineOutline(p);
    ditherEdge(p, 1);
    return p;
  },
  cathedralCore(f, dmg) { // SOLACE: the cathedral's heart (the façade itself is the battle backdrop)
    const p = new Painter(72, 72);
    p.ellipse(36, 36, 30, 30, [B[0], B[1], B[2], B[3], B[4]]);
    p.ellipse(36, 36, 24, 24, S);
    p.ellipse(36, 36, 18, 14, G);
    p.ellipse(36, 36, 6, 10, f > 0.5 ? [OUTLINE, OUTLINE, G[4], G[4], G[4]] : [G[4], OUTLINE, OUTLINE, OUTLINE, OUTLINE]);
    p.set(26, 28, G[0]);
    for (let i = 0; i < dmg * 3; i++) crack(p, 14 + i * 9, 20 + (i % 3) * 14, 6);
    machineOutline(p);
    return p;
  },
  conduit(f, dmg) { // one of the four Wellspring conduit pillars
    const p = new Painter(28, 80);
    p.rect(6, 6, 16, 72, B[2]); p.rect(6, 6, 4, 72, B[1]); p.rect(19, 6, 3, 72, B[3]);
    for (let y = 10; y < 76; y += 8) { p.rect(4, y, 20, 2, S[1]); }
    const pulse = (Math.floor(f * 10) % 4);
    for (let y = 12; y < 74; y += 4) p.set(13 + (y % 8 ? 0 : 1), y, (y / 4 + pulse) % 4 === 0 ? G[0] : G[2]);
    p.ellipse(14, 6, 9, 6, G);
    if (dmg) crack(p, 8, 30, 6);
    machineOutline(p);
    return p;
  },
  gardenCore(f, dmg) { // SOLACE: Garden form heart — the same core, overgrown
    const p = PAINT.cathedralCore(f, dmg);
    for (let i = 0; i < 40; i++) {
      const a = i * 0.7, r = 24 + (i % 4) * 2;
      const x = Math.round(36 + Math.cos(a) * r), y = Math.round(36 + Math.sin(a) * r);
      p.set(x, y, SG[1 + (i % 3)]);
      if (i % 5 === 0) { p.set(x, y - 1, S[0]); p.set(x - 1, y, S[0]); p.set(x + 1, y, S[0]); p.set(x, y, f > 0.5 && i % 10 === 0 ? G[1] : B[0]); }
    }
    return p;
  },
  flowerPod(f) { // garden form healing pod: flowers open and close on a 96-frame loop
    const p = new Painter(32, 40);
    p.thickLine(16, 40, 16, 18, B[2], 2);
    const open = f > 0.5;
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; p.ellipse(16 + Math.cos(a) * (open ? 8 : 4), 14 + Math.sin(a) * (open ? 8 : 4), open ? 5 : 3, open ? 5 : 3, S, { offset: i % 2 }); }
    core(p, 16, 14, 3, f);
    p.ellipse(9, 30, 5, 2, SG); p.ellipse(23, 32, 5, 2, SG, { offset: 1 });
    machineOutline(p);
    return p;
  },
  mercy(f, dmg, o = {}) { // SOLACE: Mercy — a small calm humanoid of white stone; o.face = who it wears
    const p = new Painter(32, 50);
    p.ellipse(16, 30, 9, 15, S);
    p.rect(9, 40, 14, 9, S[2]);
    p.thickLine(8, 24, 3, 36, S[1], 2); p.thickLine(24, 24, 29, 36, S[2], 2);
    core(p, 16, 30, 3, f);
    // swap-face head (16x16): the loved one, drawn simply in their own colours
    const FACES = { rachel: R.blonde, elayne: R.black, darill: R.ashBlonde, maduin: R.violet, mother: R.ashBlonde, owain: R.black, valtheia: R.violet, none: S };
    const hair = FACES[o.face || 'none'];
    p.ellipse(16, 10, 7, 8, o.face && o.face !== 'none' ? [R.skinLight[0], R.skinLight[1], R.skinLight[2], R.skinLight[3], R.skinLight[4]] : S);
    if (o.face && o.face !== 'none') { p.rect(9, 3, 14, 4, hair[2]); p.rect(8, 5, 3, 8, hair[2]); p.rect(21, 5, 3, 8, hair[3]); p.set(13, 10, OUTLINE); p.set(19, 10, OUTLINE); p.rect(14, 14, 4, 1, R.skinLight[3]); }
    else { p.rect(11, 9, 10, 2, G[2]); }
    arch(p, 16, 9, 11, 1);
    if (dmg) crack(p, 10, 26, 5);
    machineOutline(p);
    return p;
  },
  finalCore(f, dmg) { // the core alone, an inner spirit figure visible through cracking glass
    const p = new Painter(96, 96);
    p.ellipse(48, 48, 44, 44, [B[0], B[1], B[2], B[3], B[4]]);
    p.ellipse(48, 48, 38, 38, G);
    // Valtheia within
    p.ellipse(48, 40, 6, 7, SP); p.ellipse(48, 58, 8, 14, SP, { offset: 1 });
    for (let y = 30; y < 72; y += 2) p.set(40 - (y % 6), y, SP[1]);
    for (let i = 0; i < dmg * 2 + 1; i++) { const a = i * 1.3; p.line(48, 48, 48 + Math.cos(a) * (14 + dmg * 6), 48 + Math.sin(a) * (14 + dmg * 6), G[0]); }
    machineOutline(p);
    return p;
  },
  // ---------------------------------------------------------------- beasts
  wolf(f, dmg, o = {}) { // snow wolf / silent hound (palette by region)
    const p = new Painter(44, 30);
    const F = o.fur || ['#FFFFFF', '#D8DCE8', '#A8B0C8', '#70789C', '#404868'];
    const g = f > 0.5 ? 1 : 0;
    p.ellipse(24, 15, 14, 7, F);
    p.ellipse(8, 11 + g, 7, 6, F);
    p.rect(1, 12 + g, 4, 3, F[2]); p.set(0, 13 + g, OUTLINE);
    p.set(6, 6 + g, F[3]); p.set(10, 5 + g, F[3]);
    p.set(6, 9 + g, OUTLINE);
    for (const x of [14, 18, 30, 34]) p.rect(x, 20, 3, 8, F[3]);
    p.thickLine(37, 12, 43, 6 - g, F[2], 3);
    p.deepOutline();
    return p;
  },
  bat(f) {
    const p = new Painter(36, 24);
    const up = f > 0.5;
    p.ellipse(18, 12, 5, 5, [L[2], L[2], L[3], L[3], L[4]]);
    for (const s of [-1, 1]) for (let i = 0; i < 12; i++) p.line(18 + s * 4, 10, 18 + s * (6 + i), up ? 2 + i % 3 : 14 + (i % 3), R.plum[2 + (i % 2)]);
    p.set(16, 11, R.tunicRed[1]); p.set(20, 11, R.tunicRed[1]);
    p.deepOutline();
    return p;
  },
  brushback(f) { // Veldt beast: armoured grazer
    const p = new Painter(56, 36);
    const F = R.folRuin;
    p.ellipse(30, 18, 20, 11, [L[1], L[2], L[2], L[3], L[4]]);
    for (let i = 0; i < 6; i++) p.ellipse(18 + i * 5, 10, 3, 3, F, { offset: i % 2 });
    p.ellipse(10, 20, 8, 7, [L[0], L[1], L[2], L[3], L[4]]);
    p.thickLine(4, 16, 0, 10, S[1], 2);
    p.set(8, 18, OUTLINE);
    for (const x of [18, 24, 36, 42]) p.rect(x, 26 + (f > 0.5 && x % 12 === 0 ? 1 : 0), 4, 8, L[3]);
    p.deepOutline();
    return p;
  },
  crawler(f) { // Esper ruins crystal crawler
    const p = new Painter(40, 28);
    for (let i = 0; i < 4; i++) { p.line(20, 16, 4 + i * 4, 26 - (f > 0.5 && i % 2 ? 2 : 0), R.violet[3]); p.line(20, 16, 36 - i * 4, 26, R.violet[3]); }
    p.ellipse(20, 14, 10, 7, R.violet);
    for (let i = 0; i < 4; i++) { p.line(14 + i * 4, 9, 13 + i * 4, 2, SP[1]); p.set(13 + i * 4, 2, SP[0]); }
    p.set(13, 14, SP[0]); p.set(16, 13, SP[0]);
    p.deepOutline();
    return p;
  },
  eel(f) {
    const p = new Painter(56, 28);
    const C_ = R.coral;
    for (let x = 4; x < 54; x++) { const y = 14 + Math.round(Math.sin(x * 0.2 + f * 3) * 5); p.rect(x, y - 3, 1, 6, x < 12 ? C_[1] : C_[2]); p.set(x, y - 3, C_[1]); }
    p.set(6, 12, OUTLINE); p.set(5, 15, R.stone[0]);
    p.deepOutline();
    return p;
  },
  lanternFish(f) {
    const p = new Painter(40, 32);
    p.ellipse(22, 18, 14, 10, R.seaRuin);
    p.line(14, 10, 8, 2, R.seaRuin[3]);
    p.ellipse(8, 3, 2, 2, f > 0.5 ? [EL.fire[0], EL.fire[0], EL.fire[1], EL.fire[2], EL.fire[3]] : EL.fire);
    for (let i = 0; i < 4; i++) p.line(12 + i * 2, 22, 13 + i * 2, 24, R.stone[0]);
    p.set(14, 15, OUTLINE);
    p.line(36, 18, 40, 12, R.seaRuin[2]); p.line(36, 18, 40, 24, R.seaRuin[2]);
    p.deepOutline();
    return p;
  },
  stalker(f) { // Ashen stalker: a lean ash-coloured raptor
    const p = new Painter(44, 44);
    const F = R.seaRuin;
    p.ellipse(24, 22, 10, 8, F);
    p.thickLine(18, 18, 8, 6, F[2], 3); p.ellipse(7, 5, 5, 4, F);
    p.rect(1, 5, 3, 2, R.brass[2]); p.set(6, 3, R.tunicRed[1]);
    p.thickLine(34, 22, 43, 18, F[3], 2);
    p.thickLine(22, 28, 18, 42, F[3], 2); p.thickLine(28, 28, 30, 42 - (f > 0.5 ? 1 : 0), F[3], 2);
    p.deepOutline();
    return p;
  },
  // ---------------------------------------------------------------- memories (Echo bosses)
  echoIfrit(f) {
    const p = new Painter(80, 92);
    const F = EL.fire;
    p.ellipse(40, 54, 22, 30, [F[0], F[1], F[2], F[3], F[3]]);
    p.ellipse(40, 20, 12, 12, [F[0], F[1], F[2], F[3], F[3]]);
    p.thickLine(30, 12, 18, 0, F[2], 3); p.thickLine(50, 12, 62, 0, F[2], 3); // horns
    p.thickLine(20, 40, 4, 66, F[2], 6); p.thickLine(60, 40, 76, 66, F[2], 6);
    p.rect(26, 80, 10, 12, F[3]); p.rect(44, 80, 10, 12, F[3]);
    memory(p, f);
    return p;
  },
  echoShiva(f) {
    const p = new Painter(64, 92);
    const F = EL.ice;
    p.ellipse(32, 20, 9, 11, [F[0], F[1], F[1], F[2], F[3]]);
    for (let y = 10; y < 60; y++) p.rect(34 + Math.round(Math.sin(y * 0.15 + f * 3) * 3), y, 12, 1, F[2]); // flowing hair
    p.ellipse(32, 52, 10, 22, [F[0], F[1], F[2], F[3], F[3]]);
    p.thickLine(24, 40, 10, 24, F[1], 3); p.thickLine(40, 40, 54, 30, F[2], 3);
    for (let y = 72; y < 92; y++) p.rect(32 - (y - 72) / 2, y, (y - 72) + 4, 1, F[2]);
    memory(p, f);
    return p;
  },
  jester(f, dmg) { // Nightmare Kefka: a memory of Terra's last fear (not a resurrection)
    const p = new Painter(72, 96);
    const Rr = R.tunicRed, Y = R.blonde, Pp = R.plum;
    for (let y = 40; y < 96; y++) { const half = 6 + (y - 40) * 0.5; for (let x = -half; x <= half; x++) p.set(36 + x, y, (Math.floor((x + 40) / 6) + Math.floor(y / 8)) % 2 ? Rr[2] : Y[2]); }
    p.ellipse(36, 26, 11, 13, ['#FFFFFF', '#FFFDF5', '#E8E2D0', '#C4BCA6', '#9A927E']); // painted face
    p.rect(28, 30, 16, 2, Rr[1]); p.set(27, 29, Rr[1]); p.set(44, 29, Rr[1]); // the grin
    p.rect(30, 22, 3, 3, OUTLINE); p.rect(40, 22, 3, 3, OUTLINE);
    p.set(31, 21, Pp[1]); p.set(41, 21, Pp[1]);
    for (let i = 0; i < 7; i++) p.thickLine(36, 14, 18 + i * 6, 0 + (i % 2) * 3, i % 2 ? Rr[1] : Pp[1], 2); // plume
    p.thickLine(26, 46, 6, 34 + (f > 0.5 ? -4 : 0), Y[1], 3); p.thickLine(46, 46, 66, 34 - (f > 0.5 ? -4 : 0), Y[1], 3);
    if (dmg) crack(p, 30, 60, 6);
    p.deepOutline();
    ditherEdge(p, 1);
    return p;
  },
});

// Human enemies use the party doll, flipped to face right.
function doll(id, frame) {
  return flipH(battleSprite(id, frame > 0.5 ? 'idle1' : 'idle0'));
}

// ---------------------------------------------------------------- stats, moves, rages
// move: { name, power, w (weight), fx, el, all, status, chance, drain, heal, summon, lore }
// rage: what Gau can learn from this beast; lore: the ABIL id Strago learns from the move.
const M = (name, power, w, fx, o = {}) => ({ name, power, w, fx, ...o });
Object.assign(ENEMIES, {
  // Act I
  skywatcher: { name: 'Skywatcher', paint: 'skywatcher', family: 'machine', hp: 520, atk: 18, def: 10, mdf: 8, spd: 18, exp: 180, gp: 300, parts: 3, weak: ['bolt'], hover: true, boss: true, big: true,
    moves: [M('Dive', 1.3, 3, 'slam'), M('Lens Flash', 0.7, 2, 'beam', { all: true, status: 'blind', chance: 0.3 }), M('Gale Wing', 0.9, 2, 'gust', { all: true, el: 'wind' })], steal: 'hiTonic' },
  hushAcolyte: { name: 'Hush Acolyte', paint: 'doll:hush', family: 'human', hp: 110, atk: 15, def: 8, mdf: 6, spd: 17, exp: 28, gp: 60, steal: 'tonic',
    moves: [M('Silent Blade', 1, 3, 'slash'), M('Grey Smoke', 0, 1, 'smoke', { status: 'blind', chance: 0.6 })] },
  hushZealot: { name: 'Hush Zealot', paint: 'doll:hushB', family: 'human', hp: 220, atk: 19, def: 11, mdf: 12, spd: 15, exp: 60, gp: 120, steal: 'remedy',
    moves: [M('Censer', 1.1, 3, 'slash'), M('Litany of Rest', 0.6, 1, 'rings', { all: true, status: 'sleep', chance: 0.25 })] },
  maren1: { name: 'Maren', paint: 'doll:soldier', family: 'human', hp: 900, atk: 22, def: 16, mdf: 10, spd: 17, exp: 260, gp: 500, boss: true, steal: 'guardRing',
    moves: [M('Spear Thrust', 1.4, 3, 'slash'), M('Shield Bash', 1.0, 2, 'slam', { status: 'stop', chance: 0.15 }), M('Rally the Hush', 0, 1, 'rally', { selfHeal: 0.1 })] },
  broodHive: { name: 'Brood Hive', paint: 'hive', family: 'machine', hp: 760, atk: 15, def: 14, mdf: 10, spd: 10, exp: 240, gp: 400, parts: 4, boss: true, big: true, weak: ['bolt', 'fire'],
    moves: [M('Swarm', 0.8, 3, 'needle', { all: true }), M('Hatch', 0, 2, 'reseed', { summon: 'vaultMite' }), M('Sting', 1.2, 2, 'needle', { status: 'poison', chance: 0.5 })] },
  retriever: { name: 'Retriever Unit', paint: 'retriever', family: 'machine', hp: 1100, atk: 22, def: 15, mdf: 10, spd: 16, exp: 320, gp: 600, parts: 5, boss: true, big: true, weak: ['bolt'],
    moves: [M('Pounce', 1.5, 3, 'slam'), M('Tether Line', 0.6, 2, 'drain', { drain: true }), M('Lens Sweep', 0.8, 2, 'beam', { all: true, lore: 'lampBeam' })], steal: 'swiftBoots' },
  brushback: { name: 'Brushback', paint: 'brushback', family: 'beast', hp: 170, atk: 18, def: 12, mdf: 6, spd: 15, exp: 38, gp: 40, weak: ['fire'], rage: 'goreCharge', steal: 'tonic',
    moves: [M('Gore', 1.1, 3, 'claw'), M('Stampede', 0.9, 1, 'slam', { all: true })] },
  snowWolf: { name: 'Snow Wolf', paint: 'wolf', family: 'beast', hp: 150, atk: 19, def: 9, mdf: 6, spd: 22, exp: 40, gp: 50, weak: ['fire'], rage: 'frostFang', steal: 'tonic',
    moves: [M('Bite', 1, 3, 'claw'), M('Frost Fang', 1.4, 1, 'ice', { el: 'ice', lore: 'frostFang' })] },
  mineBat: { name: 'Mine Bat', paint: 'bat', family: 'beast', hp: 90, atk: 15, def: 6, mdf: 6, spd: 26, exp: 26, gp: 30, weak: ['wind'], hover: true, rage: 'drainBite',
    moves: [M('Drain Bite', 0.8, 3, 'drain', { drain: true }), M('Screech', 0, 1, 'rings', { status: 'confuse', chance: 0.3 })] },
  psalm: { name: 'Psalm', paint: 'knight', family: 'machine', hp: 2600, atk: 26, def: 18, mdf: 14, spd: 12, exp: 900, gp: 1500, parts: 6, boss: true, big: true, weak: ['bolt', 'spirit'],
    moves: [M('Stone Psalm', 1.5, 3, 'slam'), M('Harp of Ribs', 1.0, 3, 'chord', { all: true, lore: 'ribChord' }), M('Gaze of Stone', 0, 1, 'rings', { status: 'petrify', chance: 0.2, lore: 'stoneGaze' })], steal: 'heroRing' },
  // Act II
  inkMoth: { name: 'Ash Moth', paint: 'bat', family: 'beast', hp: 220, atk: 22, def: 10, mdf: 14, spd: 24, exp: 70, gp: 90, weak: ['fire'], hover: true, rage: 'drainBite',
    moves: [M('Scale Dust', 0.7, 2, 'pollen', { all: true, status: 'blind', chance: 0.3 }), M('Wingcut', 1.1, 3, 'claw')] },
  archiveSentinel: { name: 'Archive Sentinel', paint: 'tome', family: 'machine', hp: 3200, atk: 28, def: 20, mdf: 20, spd: 12, exp: 1100, gp: 1800, parts: 6, boss: true, big: true, weak: ['bolt', 'fire'],
    moves: [M('Read Aloud', 1.0, 3, 'beam', { all: true }), M('Close the Book', 1.6, 2, 'slam'), M('Footnote', 0, 1, 'rings', { status: 'silence', chance: 0.5 })] },
  crawler: { name: 'Crystal Crawler', paint: 'crawler', family: 'beast', hp: 300, atk: 24, def: 18, mdf: 14, spd: 18, exp: 90, gp: 120, weak: ['earth'], rage: 'crystalSpine',
    moves: [M('Spine', 1.1, 3, 'needle'), M('Refract', 0.9, 1, 'beam', { el: 'spirit' })], steal: 'ether' },
  lostEcho: { name: 'Lost Echo', paint: 'echoShiva', family: 'echo', hp: 260, atk: 20, def: 10, mdf: 22, spd: 20, exp: 100, gp: 0, weak: ['spirit'], hover: true,
    moves: [M('Forgotten Cold', 1.2, 3, 'ice', { el: 'ice' }), M('Whisper', 0, 1, 'rings', { status: 'sleep', chance: 0.3 })] },
  echoIfrit: { name: 'Echo of Ifrit', paint: 'echoIfrit', family: 'echo', hp: 2400, atk: 30, def: 16, mdf: 18, spd: 14, exp: 800, gp: 0, boss: true, big: true, weak: ['ice', 'water'], absorb: ['fire'],
    moves: [M('Hellfire Memory', 1.4, 3, 'fire', { all: true, el: 'fire' }), M('Claw of Embers', 1.6, 2, 'claw', { el: 'fire' })] },
  echoShiva: { name: 'Echo of Shiva', paint: 'echoShiva', family: 'echo', hp: 2200, atk: 26, def: 14, mdf: 22, spd: 18, exp: 800, gp: 0, boss: true, big: true, weak: ['fire'], absorb: ['ice'],
    moves: [M('Diamond Memory', 1.3, 3, 'ice', { all: true, el: 'ice' }), M('Cold Touch', 1.0, 2, 'ice', { el: 'ice', status: 'slow', chance: 0.4 })] },
  tideDrone: { name: 'Tide Drone', paint: 'fishDrone', family: 'machine', hp: 320, atk: 25, def: 18, mdf: 12, spd: 22, exp: 110, gp: 140, parts: 2, weak: ['bolt'], hover: true,
    moves: [M('Pressure Jet', 1.1, 3, 'wave', { el: 'water' }), M('Tide Breath', 1.0, 1, 'wave', { all: true, el: 'water', lore: 'tideBreath' })] },
  coralEel: { name: 'Coral Eel', paint: 'eel', family: 'beast', hp: 380, atk: 27, def: 14, mdf: 12, spd: 20, exp: 120, gp: 150, weak: ['bolt'], rage: 'tideBreath',
    moves: [M('Coil', 1.2, 3, 'claw'), M('Shock Skin', 1.0, 1, 'bolt', { el: 'bolt' })] },
  lanternFish: { name: 'Lantern Fish', paint: 'lanternFish', family: 'beast', hp: 340, atk: 24, def: 12, mdf: 16, spd: 18, exp: 110, gp: 130, weak: ['bolt'], rage: 'lampBeam',
    moves: [M('Lure', 0, 1, 'rings', { status: 'confuse', chance: 0.4 }), M('Bite', 1.2, 3, 'claw')], steal: 'ether' },
  litany: { name: 'Litany', paint: 'archivist', family: 'machine', hp: 5200, atk: 32, def: 22, mdf: 24, spd: 14, exp: 2200, gp: 3000, parts: 8, boss: true, big: true, weak: ['bolt'],
    moves: [M('Replay', 1.2, 3, 'beam', { all: true }), M('Quill Volley', 1.6, 2, 'needle'), M('Record', 0, 1, 'rings', { status: 'stop', chance: 0.3 })], steal: 'silverPin' },
  cryptMoss: { name: 'Crypt Moss', paint: 'thorn', family: 'beast', hp: 400, atk: 26, def: 16, mdf: 14, spd: 14, exp: 130, gp: 160, weak: ['fire'], rage: 'pollenLull',
    moves: [M('Spore', 0.6, 2, 'pollen', { all: true, status: 'poison', chance: 0.4 }), M('Root Grip', 1.3, 3, 'claw')] },
  dirgeWisp: { name: 'Dirge Wisp', paint: 'veiled', family: 'machine', hp: 360, atk: 24, def: 14, mdf: 22, spd: 20, exp: 140, gp: 100, parts: 2, weak: ['holy', 'bolt'], hover: true,
    moves: [M('Mourning', 1.0, 3, 'void', { el: 'void' }), M('Lull', 0, 1, 'rings', { status: 'sleep', chance: 0.4 })] },
  dirge: { name: 'Dirge', paint: 'veiled', family: 'machine', hp: 6400, atk: 34, def: 24, mdf: 26, spd: 14, exp: 2600, gp: 3500, parts: 8, boss: true, big: true, weak: ['holy', 'spirit'],
    moves: [M('Their Voices', 1.3, 3, 'void', { all: true, el: 'void' }), M('Veil Embrace', 1.7, 2, 'drain', { drain: true }), M('Lay Down', 0, 1, 'rings', { status: 'sleep', chance: 0.4, all: true })] },
  gunDrone: { name: 'Gun Drone', paint: 'gunDrone', family: 'machine', hp: 420, atk: 30, def: 20, mdf: 12, spd: 22, exp: 150, gp: 200, parts: 2, weak: ['bolt'], hover: true,
    moves: [M('Volley', 0.8, 3, 'bolts', { all: true }), M('Aimed Shot', 1.6, 2, 'bolts')] },
  hushGunner: { name: 'Hush Gunner', paint: 'doll:soldierB', family: 'human', hp: 460, atk: 30, def: 18, mdf: 12, spd: 18, exp: 150, gp: 250, steal: 'xTonic',
    moves: [M('Musket', 1.4, 3, 'bolts'), M('Smoke', 0, 1, 'smoke', { status: 'blind', chance: 0.5, all: true })] },
  vigil: { name: 'Vigil', paint: 'prowLens', family: 'machine', hp: 4200, atk: 34, def: 22, mdf: 20, spd: 16, exp: 2800, gp: 4000, parts: 8, boss: true, big: true, weak: ['bolt', 'wind'],
    moves: [M('Broadside', 1.2, 3, 'bolts', { all: true }), M('Lens Burn', 1.8, 2, 'beam', { el: 'fire' }), M('Command: Sacrifice', 0, 1, 'reseed', { summon: 'hushGunner' })] },
  silentChoir: { name: 'Silent Choir', paint: 'doll:hush', family: 'human', hp: 520, atk: 28, def: 18, mdf: 22, spd: 18, exp: 170, gp: 220,
    moves: [M('Hush Hymn', 0.9, 3, 'rings', { all: true }), M('Mercy Knife', 1.4, 2, 'slash')] },
  ostrander: { name: 'Brother Ostrander', paint: 'doll:ostrander', family: 'human', hp: 5600, atk: 30, def: 20, mdf: 30, spd: 18, exp: 3000, gp: 5000, boss: true, steal: 'ribbon',
    moves: [M('Sermon of Rest', 1.0, 3, 'rings', { all: true, el: 'void' }), M('Anointing', 0, 1, 'heal', { heal: 0.08 }), M('The True God Listens', 1.6, 2, 'column', { el: 'holy' })] },
  choirVoice: { name: 'Choir Voice', paint: 'doll:hushB', family: 'human', hp: 1600, atk: 26, def: 18, mdf: 24, spd: 16, exp: 600, gp: 600, boss: true,
    moves: [M('Harmony', 0, 2, 'heal', { healAll: 0.06 }), M('Discord', 1.2, 3, 'rings', { el: 'void' })] },
  // Act III
  siegebreaker: { name: 'Hush Siegebreaker', paint: 'doll:soldier', family: 'human', hp: 900, atk: 36, def: 24, mdf: 16, spd: 16, exp: 300, gp: 400, steal: 'xTonic',
    moves: [M('Ram', 1.4, 3, 'slam'), M('War Cry', 0, 1, 'rally', { selfHeal: 0.1 })] },
  stalker: { name: 'Ashen Stalker', paint: 'stalker', family: 'beast', hp: 820, atk: 36, def: 20, mdf: 16, spd: 26, exp: 280, gp: 300, weak: ['water'], rage: 'ashClaw',
    moves: [M('Rake', 1.3, 3, 'claw'), M('Dust Kick', 0, 1, 'smoke', { status: 'blind', chance: 0.6 })] },
  bloomHound: { name: 'Bloom Hound', paint: 'wolf', family: 'machine', hp: 880, atk: 36, def: 22, mdf: 18, spd: 24, exp: 300, gp: 250, parts: 2, weak: ['bolt', 'spirit'], fur: R.folSilent,
    moves: [M('Petal Bite', 1.3, 3, 'claw'), M('Quiet Howl', 0.8, 1, 'void', { all: true, el: 'void', lore: 'quietingNote' })] },
  gardener: { name: 'Gardener Unit', paint: 'gardener', family: 'machine', hp: 1100, atk: 38, def: 26, mdf: 20, spd: 18, exp: 360, gp: 300, parts: 3, weak: ['bolt', 'fire'],
    moves: [M('Prune', 1.4, 3, 'slash'), M('Life Sip', 1.0, 2, 'drain', { drain: true }), M('Pollen Lull', 0.4, 1, 'pollen', { all: true, status: 'sleep', chance: 0.3, lore: 'pollenLull' })] },
  thornChoir: { name: 'Thorn Choir', paint: 'thorn', family: 'machine', hp: 900, atk: 36, def: 22, mdf: 24, spd: 18, exp: 340, gp: 260, parts: 2, weak: ['fire'],
    moves: [M('Thorn Hymn', 1.0, 3, 'rings', { all: true }), M('Lash', 1.5, 2, 'slam')] },
  kefka: { name: 'Nightmare Kefka', paint: 'jester', family: 'echo', hp: 8800, atk: 40, def: 24, mdf: 30, spd: 20, exp: 0, gp: 0, boss: true, big: true, weak: ['spirit', 'holy'],
    moves: [M('Havoc Wing', 1.3, 3, 'slash', { all: true }), M('Forsaken', 1.6, 2, 'void', { all: true, el: 'void' }), M('Hyperdrive', 2.0, 1, 'column', { el: 'void' }), M('Laughter', 0, 1, 'rings', { status: 'confuse', chance: 0.4, all: true })] },
  amen: { name: 'Amen', paint: 'amen', family: 'machine', hp: 14000, atk: 44, def: 28, mdf: 28, spd: 18, exp: 5000, gp: 0, parts: 10, boss: true, big: true, weak: ['bolt', 'spirit'],
    moves: [M('Psalm', 1.4, 3, 'chord', { all: true }), M('Litany', 1.2, 2, 'beam', { all: true }), M('Dirge', 0, 1, 'rings', { status: 'sleep', chance: 0.4, all: true }), M('Vigil', 1.9, 2, 'beam', { el: 'fire' })] },
  solaceCore: { name: 'SOLACE', paint: 'cathedralCore', family: 'machine', hp: 18000, atk: 46, def: 30, mdf: 32, spd: 16, exp: 0, gp: 0, boss: true, big: true, weak: ['spirit'], part: 'core',
    moves: [M('Light Sweep', 1.3, 3, 'column', { all: true, el: 'holy' }), M('Life Drain', 1.2, 2, 'drain', { drain: true }), M('Stilling Wave', 0.8, 1, 'void', { all: true, el: 'void', status: 'slow', chance: 0.4 })] },
  conduit: { name: 'Conduit', paint: 'conduit', family: 'machine', hp: 3000, atk: 34, def: 26, mdf: 26, spd: 12, exp: 0, gp: 0, boss: true, weak: ['bolt'], part: 'conduit',
    moves: [M('Wellspring Surge', 1.1, 3, 'beam', { el: 'spirit' }), M('Feed the Core', 0, 1, 'heal', { healCore: 600 })] },
  solaceGarden: { name: 'SOLACE', paint: 'gardenCore', family: 'machine', hp: 16000, atk: 46, def: 30, mdf: 32, spd: 16, exp: 0, gp: 0, boss: true, big: true, weak: ['spirit', 'fire'],
    moves: [M('Petal Rain', 1.2, 3, 'petals', { all: true }), M('Root Bind', 1.5, 2, 'slam', { status: 'stop', chance: 0.2 }), M('Bloom', 0, 1, 'heal', { heal: 0.05 })] },
  flowerPod: { name: 'Mercy Bloom', paint: 'flowerPod', family: 'machine', hp: 1800, atk: 20, def: 20, mdf: 20, spd: 14, exp: 0, gp: 0, boss: true, weak: ['fire', 'spirit'],
    moves: [M('Give Life', 0, 1, 'heal', { healCore: 900 })] },
  mercy: { name: 'SOLACE', paint: 'mercy', family: 'machine', hp: 12000, atk: 40, def: 30, mdf: 34, spd: 22, exp: 0, gp: 0, boss: true, weak: ['spirit'],
    moves: [M('Rest Now', 0, 3, 'rings', { status: 'rest', chance: 0.55 }), M('I Remember You', 0.9, 2, 'heal', { all: true, el: 'void' }), M('Lullaby', 0, 1, 'rings', { all: true, status: 'sleep', chance: 0.3 })] },
});
ENEMIES.gogoMirror = { name: 'Mirror Gogo', paint: 'doll:gogo', family: 'human', hp: 11000, atk: 40, def: 26, mdf: 26, spd: 24, exp: 4000, gp: 3000, boss: true,
  moves: [M('Mirrored Blade', 1.4, 3, 'slash'), M('Mirrored Bolt', 1.2, 2, 'bolt', { all: true, el: 'bolt' }), M('Mirrored Mend', 0, 1, 'heal', { heal: 0.06 })] };
// the heart laid bare after the last battle (story figure only)
ENEMIES.finalHeart = { name: 'SOLACE', paint: 'finalCore', family: 'machine', hp: 1, atk: 1, def: 1, spd: 1, exp: 0, gp: 0, moves: [M('...', 0, 1, 'rings')] };
// Eight Seraphs: unfinished prototypes, optional superbosses
const SERAPHS = [['Ash', 'fire'], ['Frost', 'ice'], ['Coral', 'water'], ['Thorns', 'bio'], ['Gales', 'wind'], ['Sand', 'earth'], ['Song', 'holy'], ['Silence', 'void']];
SERAPHS.forEach(([n, el], i) => {
  ENEMIES['seraph' + n] = {
    name: 'Seraph of ' + n, paint: 'seraph', paintOpts: { el }, family: 'machine', hp: 9000 + i * 2500, atk: 40 + i * 3, def: 26 + i, mdf: 26 + i, spd: 20, exp: 3000 + i * 800, gp: 4000, parts: 6,
    boss: true, big: true, weak: ['bolt', { fire: 'ice', ice: 'fire', water: 'bolt', bio: 'fire', wind: 'earth', earth: 'wind', holy: 'void', void: 'holy' }[el]], absorb: [el],
    moves: [M('Feather Blades', 1.3, 3, 'slash', { all: true }), M(n + ' Psalm', 1.8, 2, el === 'void' ? 'void' : el === 'holy' ? 'column' : el, { all: true, el }), M('Unfinished Hymn', 2.2, 1, 'chord', { el })],
    steal: ['elixir', 'ribbon', 'pinion', 'heroRing', 'hermesSandal', 'esperSilk', 'xTonic', 'elixir'][i],
  };
});
ENEMIES.dummy.steal = 'tonic';
ENEMIES.burrower.rage = 'digRush';
ENEMIES.seedDrone.moves[1].lore = 'pollenLull';
ENEMIES.bloom.moves[0].lore = 'pollenLull';
ENEMIES.warden.moves[1].lore = 'ribChord';
ENEMIES.sentinel.moves[0].lore = 'lampBeam';
for (const e of Object.values(ENEMIES)) { e.gp ??= Math.round(e.exp * 1.4); e.mdf ??= e.def; }

// Gau's rages: the beast's signature move, which Gau performs in its form.
export const RAGES = {
  digRush: { name: 'Burrower', move: M('Dig Rush', 1.6, 1, 'claw') },
  goreCharge: { name: 'Brushback', move: M('Gore Charge', 1.7, 1, 'slam') },
  frostFang: { name: 'Snow Wolf', move: M('Frost Fang', 1.8, 1, 'ice', { el: 'ice' }) },
  drainBite: { name: 'Mine Bat', move: M('Drain Bite', 1.2, 1, 'drain', { drain: true }) },
  crystalSpine: { name: 'Crystal Crawler', move: M('Crystal Spine', 1.9, 1, 'needle', { all: true }) },
  tideBreath: { name: 'Coral Eel', move: M('Tide Breath', 1.6, 1, 'wave', { all: true, el: 'water' }) },
  lampBeam: { name: 'Lantern Fish', move: M('Lure Light', 1.7, 1, 'beam', { el: 'holy' }) },
  pollenLull: { name: 'Crypt Moss', move: M('Spore Cloud', 0.9, 1, 'pollen', { all: true, status: 'poison', chance: 0.6 }) },
  ashClaw: { name: 'Ashen Stalker', move: M('Ash Claw', 2.4, 1, 'claw') },
  beastKing: { name: 'Beast King', move: M("Beast King's Roar", 3.2, 1, 'beasts', { all: true }) },
};

const cache = new Map();
// frame 0/1 = core dim/bright; dmg = 0..2 visible cracking; opts.face for Mercy
export function enemySprite(kind, frame = 0, dmg = 0, opts = null) {
  const e = ENEMIES[kind];
  const key = kind + frame + ':' + dmg + ':' + (opts ? JSON.stringify(opts) : '');
  if (!cache.has(key)) {
    if (e.paint.startsWith('doll:')) cache.set(key, doll(e.paint.slice(5), frame));
    else cache.set(key, PAINT[e.paint](frame, dmg, { ...(e.paintOpts || {}), ...(opts || {}), fur: e.fur }).toCanvas());
  }
  return cache.get(key);
}
