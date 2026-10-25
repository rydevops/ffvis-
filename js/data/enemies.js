// Enemies: painted procedurally in the guide's three families.
//  * Ancient machines: white stone shells, aged brass, glass cores (always visible = weak
//    point), a halo/ring/arch in every silhouette, clean full outline in their deep step.
//  * Beasts: organic, asymmetric, region palette.
//  * Constructs (training dummy): human-made.
import { Painter } from '../core/gfx.js';
import { R, OUTLINE } from './palette.js';

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

const cache = new Map();
// frame 0/1 = core dim/bright; dmg = 0..2 visible cracking
export function enemySprite(kind, frame = 0, dmg = 0) {
  const key = kind + frame + ':' + dmg;
  if (!cache.has(key)) cache.set(key, PAINT[ENEMIES[kind].paint](frame, dmg).toCanvas());
  return cache.get(key);
}
