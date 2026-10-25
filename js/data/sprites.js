// Builds character sprite sheets from the layered text art in chars.js, plus procedural
// sprites for the non-human cast (Mog, Umaro, Seven, Interceptor, vehicles).
import { BODY, HEADS, EXTRAS, KID_HEADS } from './chars.js';
import { R, OUTLINE } from './palette.js';
import { Painter, flipH } from '../core/gfx.js';

const P_ = (o) => o;
// Each character: body build, head, extras, and ramps for each layer key group.
export const CHAR_DEFS = {
  terra: { body: 'adult', head: 'terra', extras: ['terraCape'], warm: true,
    pal: { hair: R.hairGreen, skin: R.skinLight, top: R.tunicRed, bottom: R.tunicRed, trim: R.brass, cape: R.plum, boots: R.leather } },
  terraGlow: { body: 'adult', head: 'terra', extras: ['terraCape'], warm: true,
    pal: { hair: R.hairGreen, skin: R.spirit, top: R.tunicRed, bottom: R.tunicRed, trim: R.brass, cape: R.plum, boots: R.leather } },
  terraEsper: { body: 'adult', head: 'longhair', warm: true,
    pal: { hair: R.spirit, skin: R.palePink, top: R.spirit, bottom: R.plum, trim: R.stone, boots: R.plum } },
  ilse: { body: 'coat', head: 'ilse', extras: ['ilseBag', 'ilsePatch'],
    pal: { hair: R.ashBlonde, skin: R.skinLight, top: R.coatDrab, bottom: R.iron, trim: R.imperial, boots: R.leather, extra: R.leather } },
  duane: { body: 'adult', head: 'duane',
    pal: { hair: R.brownHair, skin: R.skinLight, top: R.farmBlue, bottom: R.leather, trim: R.leather, boots: R.iron } },
  katarin: { body: 'coat', head: 'katarin', extras: ['katarinBaby'],
    pal: { hair: R.brownHair, skin: R.skinLight, top: R.moss, bottom: R.leather, trim: R.cream, boots: R.leather, extra: R.cream } },
  hale: { body: 'adult', head: 'hale',
    pal: { hair: R.brownHair, skin: R.skinDeep, top: R.leather, bottom: R.iron, trim: R.iron, boots: R.leather, extra: R.brass, accent: R.glass } },
  crewA: { body: 'adult', head: 'crew',
    pal: { hair: R.brownHair, skin: R.skinLight, top: R.coatDrab, bottom: R.leather, trim: R.leather, boots: R.iron, extra: R.brass, accent: R.glass } },
  crewB: { body: 'coat', head: 'crew',
    pal: { hair: R.ashBlonde, skin: R.skinDeep, top: R.farmBlue, bottom: R.iron, trim: R.iron, boots: R.leather, extra: R.iron, accent: R.glass } },
  // ---- the returning heroes
  locke: { body: 'adult', head: 'locke',
    pal: { hair: R.brownHair, skin: R.skinLight, top: R.leather, bottom: R.farmBlue, trim: R.brass, boots: R.leather, extra: R.farmBlue } },
  celes: { body: 'coat', head: 'longhair',
    pal: { hair: R.blonde, skin: R.skinLight, top: R.cream, bottom: R.moss, trim: R.moss, boots: R.leather } },
  edgar: { body: 'adult', head: 'edgar', extras: ['terraCape'],
    pal: { hair: R.blonde, skin: R.skinLight, top: R.navy, bottom: R.navy, trim: R.brass, cape: R.navy, boots: R.leather } },
  sabin: { body: 'adult', head: 'sabin',
    pal: { hair: R.blonde, skin: R.skinDeep, top: R.skinDeep, bottom: R.cream, trim: R.farmBlue, boots: R.leather } },
  cyan: { body: 'coat', head: 'cyan',
    pal: { hair: R.black, skin: R.skinLight, top: R.navy, bottom: R.iron, trim: R.iron, boots: R.black } },
  setzer: { body: 'coat', head: 'longhair',
    pal: { hair: R.stone, skin: R.skinLight, top: R.black, bottom: R.black, trim: R.iron, boots: R.black } },
  shadow: { body: 'adult', head: 'hood',
    pal: { hair: R.black, skin: R.skinLight, top: R.black, bottom: R.black, trim: R.imperial, boots: R.black, extra: R.black } },
  relm: { kid: 'beret', warm: true,
    pal: { hair: R.blonde, skin: R.skinLight, top: R.cream, bottom: R.tunicRed, trim: R.tunicRed, boots: R.leather, extra: R.tunicRed } },
  strago: { body: 'robe', head: 'strago',
    pal: { hair: R.stone, skin: R.skinLight, top: R.leather, bottom: R.leather, trim: R.brass, boots: R.leather, extra: R.plum } },
  gau: { body: 'adult', head: 'gau', warm: true,
    pal: { hair: R.folRest, skin: R.skinLight, top: R.skinLight, bottom: R.leather, trim: R.leather, boots: R.skinLight } },
  maren: { body: 'adult', head: 'maren',
    pal: { hair: R.brownHair, skin: R.skinLight, top: R.imperial, bottom: R.iron, trim: R.iron, boots: R.iron, extra: R.iron, accent: R.tunicRed } },
  dalia: { body: 'adult', head: 'dalia', warm: true,
    pal: { hair: R.palePink, skin: R.skinLight, top: R.cream, bottom: R.leather, trim: R.moss, boots: R.leather, accent: R.spirit } },
  gogo: { body: 'robe', head: 'gogo',
    pal: { hair: R.patchA, skin: R.skinLight, top: R.patchA, bottom: R.plum, trim: R.farmBlue, boots: R.plum, extra: R.cream, accent: R.moss } },
  // ---- NPCs
  hush: { body: 'robe', head: 'hood',
    pal: { hair: R.iron, skin: R.skinLight, top: R.iron, bottom: R.iron, trim: R.seaRuin, boots: R.black, extra: R.iron } },
  hushB: { body: 'robe', head: 'hood',
    pal: { hair: R.iron, skin: R.skinDeep, top: R.seaRuin, bottom: R.iron, trim: R.stone, boots: R.black, extra: R.seaRuin } },
  ostrander: { body: 'robe', head: 'cowl',
    pal: { hair: R.stone, skin: R.skinLight, top: R.stone, bottom: R.stone, trim: R.brass, boots: R.leather, extra: R.stone } },
  soldier: { body: 'adult', head: 'soldier',
    pal: { hair: R.brownHair, skin: R.skinLight, top: R.imperial, bottom: R.iron, trim: R.brass, boots: R.black, extra: R.iron } },
  soldierB: { body: 'adult', head: 'soldier',
    pal: { hair: R.brownHair, skin: R.skinDeep, top: R.coatDrab, bottom: R.iron, trim: R.leather, boots: R.black, extra: R.iron } },
  oldman: { body: 'robe', head: 'oldman',
    pal: { hair: R.stone, skin: R.skinLight, top: R.leather, bottom: R.leather, trim: R.moss, boots: R.leather } },
  cid: { body: 'coat', head: 'oldman',
    pal: { hair: R.stone, skin: R.skinLight, top: R.cream, bottom: R.leather, trim: R.brass, boots: R.leather } },
  oldwoman: { body: 'robe', head: 'bun',
    pal: { hair: R.stone, skin: R.skinLight, top: R.plum, bottom: R.plum, trim: R.cream, boots: R.leather } },
  woman: { body: 'coat', head: 'katarin',
    pal: { hair: R.brownHair, skin: R.skinLight, top: R.plum, bottom: R.leather, trim: R.cream, boots: R.leather } },
  womanB: { body: 'coat', head: 'bun',
    pal: { hair: R.ashBlonde, skin: R.skinDeep, top: R.farmBlue, bottom: R.leather, trim: R.cream, boots: R.leather } },
  man: { body: 'adult', head: 'duane',
    pal: { hair: R.black, skin: R.skinDeep, top: R.moss, bottom: R.leather, trim: R.leather, boots: R.leather } },
  manB: { body: 'adult', head: 'ilse',
    pal: { hair: R.brownHair, skin: R.skinLight, top: R.coatDrab, bottom: R.farmBlue, trim: R.leather, boots: R.leather } },
  miner: { body: 'adult', head: 'crew',
    pal: { hair: R.black, skin: R.skinLight, top: R.farmBlue, bottom: R.iron, trim: R.leather, boots: R.iron, extra: R.iron, accent: R.brass } },
  valtheia: { body: 'robe', head: 'longhair', warm: true,
    pal: { hair: R.violet, skin: R.palePink, top: R.spirit, bottom: R.spirit, trim: R.stone, boots: R.plum } },
  rachel: { body: 'coat', head: 'longhair', warm: true,
    pal: { hair: R.blonde, skin: R.skinLight, top: R.farmBlue, bottom: R.cream, trim: R.cream, boots: R.leather } },
  elayne: { body: 'coat', head: 'bun', warm: true,
    pal: { hair: R.black, skin: R.skinLight, top: R.tunicRed, bottom: R.navy, trim: R.cream, boots: R.black } },
  darill: { body: 'coat', head: 'longhair', warm: true,
    pal: { hair: R.ashBlonde, skin: R.skinLight, top: R.leather, bottom: R.black, trim: R.brass, boots: R.black } },
  kefka: { body: 'robe', head: 'jester',
    pal: { hair: R.blonde, skin: R.stone, top: R.tunicRed, bottom: R.brass, trim: R.plum, boots: R.plum, extra: R.blonde, accent: R.tunicRed } },
  // children
  pip: { kid: 'pigtails', warm: true,
    pal: { hair: R.skyRuin, skin: R.skinLight, top: R.cream, bottom: R.cream, trim: R.tunicRed, boots: R.leather } },
  rowan: { kid: 'cap',
    pal: { hair: R.brownHair, skin: R.skinLight, top: R.farmBlue, bottom: R.leather, trim: R.leather, boots: R.leather, extra: R.tunicRed } },
  mina: { kid: 'bob', warm: true,
    pal: { hair: R.ashBlonde, skin: R.skinDeep, top: R.plum, bottom: R.plum, trim: R.cream, boots: R.leather } },
  tobin: { kid: 'bob',
    pal: { hair: R.brownHair, skin: R.skinLight, top: R.moss, bottom: R.leather, trim: R.leather, boots: R.leather } },
  owain: { kid: 'cap',
    pal: { hair: R.black, skin: R.skinLight, top: R.navy, bottom: R.iron, trim: R.iron, boots: R.black, extra: R.navy } },
  child: { kid: 'pigtails',
    pal: { hair: R.black, skin: R.skinDeep, top: R.moss, bottom: R.moss, trim: R.cream, boots: R.leather } },
};
void P_;

function keyMap(pal) {
  const m = { k: OUTLINE, w: '#FFFDF5' };
  const set = (keys, ramp) => {
    if (!ramp) return;
    const [l, b, s] = keys;
    if (l) m[l] = ramp[1];
    if (b) m[b] = ramp[2];
    if (s) m[s] = ramp[3];
  };
  set('Hhj', pal.hair);
  set('Ssz', pal.skin);
  set('Ttu', pal.top);
  set('Bbn', pal.bottom);
  set('Ccv', pal.cape);
  set('Ff', pal.boots);
  set('Xxy', pal.extra || pal.hair);
  if (pal.boots) m.f = pal.boots[2];
  if (pal.trim) { m.A = pal.accent ? pal.accent[1] : pal.trim[0]; m.a = pal.trim[2]; }
  if (pal.skin) m.m = pal.skin[3];
  return m;
}

function padTo24(rows) {
  const out = rows.slice(0, 24);
  while (out.length < 24) out.push('................');
  return out;
}

// Back of the head: every face pixel becomes hair (or hood), the neck keeps its shadow.
function backOf(rows) {
  const hood = rows.some((r) => /[Xx]/.test(r.slice(0, 16))) && !rows.some((r) => /h/.test(r));
  return rows.map((row, y) => row.replace(/[SszkwmA]/g, (c) => {
    if (y >= 10 && (c === 'z' || c === 'S' || c === 's')) return 'z';
    if (c === 'A' && y < 6) return 'A';
    return hood ? 'x' : (c === 'z' || c === 'm' ? 'j' : 'h');
  }));
}
function headRows(name, dir) {
  const h = HEADS[name];
  if (h[dir]) return h[dir];
  if (dir === 'up') return (h.up = backOf(h.down));
  return h.down;
}

const DIRS = ['down', 'up', 'left'];

function buildFrame(def, dir, fr) {
  const p = new Painter(16, 24);
  const map = keyMap(def.pal);
  const bob = fr === 0 ? 0 : 1;
  if (def.kid) {
    p.art(BODY.kid[dir][fr], 0, 0, map);
    p.art(padTo24(KID_HEADS[def.kid][dir] || backOf(KID_HEADS[def.kid].down)), 0, bob, map);
  } else {
    p.art(BODY[def.body][dir][fr], 0, 0, map);
    for (const ex of def.extras || []) {
      const layer = EXTRAS[ex][dir];
      if (layer) p.art(layer, 0, 0, map);
    }
    p.art(padTo24(headRows(def.head, dir)), 0, bob, map);
  }
  p.deepOutline();
  return p.toCanvas();
}

// ---------------------------------------------------------------- creatures (procedural)
const W_ = R.stone, PL = R.plum;
function moogle(dir, fr, pal = { fur: W_, wing: PL, pom: R.tunicRed }) {
  const p = new Painter(16, 18);
  const b = fr === 1 ? 1 : 0;
  // wings behind (visible from the front/back)
  if (dir !== 'left') { p.ellipse(3, 10 + b, 2, 3, pal.wing); p.ellipse(12, 10 + b, 2, 3, pal.wing, { offset: 1 }); }
  else p.ellipse(10, 10 + b, 2, 3, pal.wing);
  p.ellipse(8, 12 + b, 5, 4, pal.fur); // body
  p.ellipse(8, 7 + b, 5, 4.5, pal.fur); // head
  p.set(8, 1 + b, pal.fur[3]); p.set(8, 2 + b, pal.fur[3]); // antenna
  p.ellipse(8, 1 + b, 1.5, 1.5, pal.pom);
  if (dir === 'down') { p.rect(6, 7 + b, 1, 2, OUTLINE); p.rect(10, 7 + b, 1, 2, OUTLINE); p.set(8, 9 + b, R.spirit[1]); }
  if (dir === 'left') { p.rect(5, 7 + b, 1, 2, OUTLINE); p.set(4, 9 + b, R.spirit[1]); }
  const step = fr === 1 ? [0, 1] : fr === 2 ? [1, 0] : [0, 0];
  p.rect(5, 15 - step[0], 2, 2, pal.fur[2]); p.rect(9, 15 - step[1], 2, 2, pal.fur[2]);
  p.deepOutline();
  return p.toCanvas();
}
function sevenSprite(dir, fr, lens = 'amber') {
  const p = new Painter(16, 16);
  const B = R.brass, S = R.stone;
  const L = lens === 'blue' ? R.glass : ['#FFF4C0', '#F5D68A', '#E8A040', '#B86830', '#7C4028'];
  // three thin legs
  const legs = fr === 1 ? [[3, 15], [8, 14], [13, 15]] : fr === 2 ? [[4, 14], [8, 15], [12, 14]] : [[3, 15], [8, 15], [13, 15]];
  for (const [lx, ly] of legs) p.line(8, 10, lx, ly, B[2]);
  p.ellipse(8, 7, 6, 5, S); // dome shell
  p.ring(8, 7, 5, 6, [B[0], B[1], B[2], B[3]], 3);
  if (dir !== 'up') {
    const ex = dir === 'left' ? 5 : 8;
    p.ellipse(ex, 7, 2.5, 2.5, L);
    p.set(ex - 1, 6, '#FFFFFF');
    p.set(ex + 1, 5, S[3]); // the crack across the lens
  }
  p.outline(() => S[4]);
  return p.toCanvas();
}
function umaroSprite(dir, fr) {
  const p = new Painter(24, 32);
  const F = ['#FFFFFF', '#E4F0FC', '#B8D0F0', '#7C9CD0', '#4C64A0']; // white fur, blue-grey shadow
  const b = fr === 0 ? 0 : 1;
  p.ellipse(12, 20 + b, 10, 10, F);
  p.ellipse(12, 9 + b, 7, 7, F);
  // asymmetric arms: the right arm is bigger (cannot be mirrored in the guide; we still mirror for walking)
  p.ellipse(3, 19 + b, 3, 7, F, { offset: 1 });
  p.ellipse(21, 21 + b, 4, 8, F, { offset: 1 });
  if (dir === 'down') { p.rect(8, 8 + b, 2, 2, OUTLINE); p.rect(14, 8 + b, 2, 2, OUTLINE); p.rect(10, 12 + b, 4, 2, R.skyRuin[3]); }
  if (dir === 'left') { p.rect(6, 8 + b, 2, 2, OUTLINE); p.rect(5, 12 + b, 3, 2, R.skyRuin[3]); }
  const st = fr === 1 ? [1, 0] : fr === 2 ? [0, 1] : [0, 0];
  p.rect(6, 29 - st[0], 5, 3, F[3]); p.rect(14, 29 - st[1], 5, 3, F[3]);
  p.outline(() => F[4]);
  return p.toCanvas();
}
function dogSprite(dir, fr) {
  const p = new Painter(16, 12);
  const K = R.black;
  const lift = fr === 1 ? 1 : 0;
  if (dir === 'left') {
    p.ellipse(9, 6, 5, 3, K); p.ellipse(3, 4, 2.5, 2.5, K); p.set(1, 2, K[3]); p.set(2, 1, K[2]);
    p.rect(14, 3, 2, 1, K[2]);
    p.rect(5, 9 - lift, 1, 3, K[3]); p.rect(12, 9, 1, 3, K[3]); p.rect(7, 9, 1, 3 - lift, K[3]);
    p.rect(4, 6, 2, 1, R.imperial[2]); p.set(2, 4, R.imperial[1]);
  } else {
    p.ellipse(8, 7, 4, 4, K); p.ellipse(8, 3, 3, 2.5, K);
    p.set(6, 0, K[2]); p.set(10, 0, K[2]);
    if (dir === 'down') { p.set(7, 3, R.imperial[1]); p.set(9, 3, R.imperial[1]); }
    p.rect(6, 6, 4, 1, R.imperial[2]);
    p.rect(6, 10 - lift, 1, 2, K[3]); p.rect(9, 10, 1, 2, K[3]);
  }
  p.deepOutline();
  return p.toCanvas();
}
// vehicles for the world map
function falconSprite(dir, fr) {
  const p = new Painter(40, 32);
  const Wd = R.leather, Bk = R.black, Br = R.brass;
  const bob = fr % 2;
  p.ellipse(20, 18 + bob, 15, 6, Wd); // hull
  p.rect(6, 16 + bob, 28, 2, Wd[1]);
  p.ellipse(20, 8 + bob, 13, 4, R.stone); // balloon/wing
  p.rect(10, 8 + bob, 20, 1, R.stone[3]);
  for (const x of [8, 32]) { p.rect(x - 1, 10 + bob, 2, 6, Bk[2]); p.ellipse(x, 22 + bob, 3, 2, Br); }
  // propellers spin
  const ang = fr % 2 ? 0 : 1;
  p.rect(ang ? 2 : 4, 22 + bob, ang ? 6 : 2, 1, Bk[1]);
  p.rect(ang ? 32 : 34, 22 + bob, ang ? 6 : 2, 1, Bk[1]);
  p.rect(18, 4 + bob, 4, 3, R.imperial[2]); // pennant
  p.deepOutline();
  if (dir === 'left') return p;
  return p;
}
function skiffSprite(dir, fr) {
  const p = new Painter(24, 16);
  const Wd = R.leather;
  p.ellipse(12, 10, 10, 4, Wd);
  p.rect(4, 7, 16, 2, Wd[1]);
  p.rect(11, 0, 2, 8, Wd[3]);
  p.rect(13, 1, 6, 5, R.cream[1 + (fr % 2)]);
  p.deepOutline();
  return p;
}

const SPECIAL = {
  mog: (d, f) => moogle(d, f),
  moogle: (d, f) => moogle(d, f, { fur: W_, wing: R.farmBlue, pom: R.brass }),
  seven: (d, f) => sevenSprite(d, f),
  sevenBlue: (d, f) => sevenSprite(d, f, 'blue'),
  umaro: (d, f) => umaroSprite(d, f),
  interceptor: (d, f) => dogSprite(d, f),
  falcon: (d, f) => falconSprite(d, f).toCanvas(),
  skiff: (d, f) => skiffSprite(d, f).toCanvas(),
};

const sheetCache = new Map();
// Returns { down:[c,c,c], up:[...], left:[...], right:[...] }
export function fieldSheet(id) {
  if (sheetCache.has(id)) return sheetCache.get(id);
  const sheet = {};
  if (SPECIAL[id]) {
    for (const dir of DIRS) sheet[dir] = [0, 1, 2].map((fr) => SPECIAL[id](dir, fr));
  } else {
    const def = CHAR_DEFS[id];
    if (!def) throw new Error('unknown sprite ' + id);
    for (const dir of DIRS) sheet[dir] = [0, 1, 2].map((fr) => buildFrame(def, dir, fr));
  }
  sheet.right = sheet.left.map((c) => flipH(c));
  sheetCache.set(id, sheet);
  return sheet;
}
export function hasSprite(id) { return !!(SPECIAL[id] || CHAR_DEFS[id]); }

// Walk cycle: stand, step A, stand, step B (8 frames each).
export function walkFrame(sheet, dir, t, moving) {
  const frames = sheet[dir];
  if (!moving) return frames[0];
  const i = Math.floor(t / 8) % 4;
  return frames[[0, 1, 0, 2][i]];
}

// ---------------------------------------------------------------- battle sprites (32x40)
// A posable doll: head art from the character's left-facing field head (more body below it),
// procedural torso/limbs shaded from the upper-left, weapon on its own layer, then a selective
// outline. Faces left (party stands on the right). Shared foot baseline y = 38.
const BATTLE = {
  terra: { weapon: 'sword', cape: true },
  terraGlow: { weapon: 'sword', cape: true, glow: true },
  terraEsper: { weapon: 'none', robe: true, glow: true },
  ilse: { weapon: 'wrench', coat: true, bag: true },
  hale: { weapon: 'pick', bulky: true },
  duane: { weapon: 'none', bulky: true },
  locke: { weapon: 'knife' },
  celes: { weapon: 'sword', coat: true },
  edgar: { weapon: 'lance', cape: true },
  sabin: { weapon: 'claw', bulky: true },
  cyan: { weapon: 'katana', coat: true },
  setzer: { weapon: 'cards', coat: true },
  shadow: { weapon: 'knife' },
  relm: { weapon: 'brush', small: true, beret: true },
  strago: { weapon: 'rod', robe: true },
  gau: { weapon: 'none', crouch: true },
  maren: { weapon: 'lance', shield: true },
  dalia: { weapon: 'knife' },
  gogo: { weapon: 'none', robe: true },
  // humanoid enemies use the same doll, flipped to face right
  hush: { weapon: 'knife', robe: true },
  hushB: { weapon: 'rod', robe: true },
  ostrander: { weapon: 'rod', robe: true },
  soldier: { weapon: 'lance', shield: true },
  soldierB: { weapon: 'sword' },
  kefka: { weapon: 'none', robe: true },
};

// degrees: 0 = backward (right), 90 = down, 180 = forward (left, toward enemies), 270 = up
const POSES = {
  idle0: { lean: 0, crouch: 0, fa: 115, ba: 75, wa: 215, legs: 'stand' },
  idle1: { lean: 0, crouch: 1, fa: 118, ba: 78, wa: 212, legs: 'stand' },
  idle2: { lean: 0, crouch: 1, fa: 118, ba: 78, wa: 210, legs: 'stand' },
  idle3: { lean: 0, crouch: 0, fa: 115, ba: 75, wa: 213, legs: 'stand' },
  windup: { lean: 2, crouch: 1, fa: 300, ba: 60, wa: 315, legs: 'stand' },
  swing: { lean: -3, crouch: 2, fa: 165, ba: 40, wa: 160, legs: 'lunge' },
  cast: { lean: 0, crouch: 0, fa: 215, ba: 240, wa: 120, legs: 'stand' },
  hurt: { lean: 3, crouch: 1, fa: 50, ba: 20, wa: 80, legs: 'stand' },
  kneel: { lean: -1, crouch: 7, fa: 125, ba: 85, wa: 165, legs: 'kneel' },
  victory: { lean: 0, crouch: 0, fa: 255, ba: 80, wa: 268, legs: 'stand' },
  defend: { lean: -1, crouch: 1, fa: 175, ba: 150, wa: 262, legs: 'stand' },
  item: { lean: 0, crouch: 0, fa: 115, ba: 250, wa: 215, legs: 'stand', holdUp: true },
};

const rad = (d) => (d * Math.PI) / 180;

function drawWeapon(p, kind, hx, hy, ang) {
  const dx = Math.cos(rad(ang)), dy = Math.sin(rad(ang));
  const steel = R.iron, brass = R.brass, wood = R.leather;
  const along = (a, b, col) => { for (let i = a; i < b; i++) p.set(hx + dx * i, hy + dy * i, typeof col === 'function' ? col(i) : col); };
  if (kind === 'sword' || kind === 'katana') {
    const len = kind === 'katana' ? 17 : 15;
    along(2, len, (i) => (i < len - 2 ? steel[0] : steel[1]));
    for (let i = 2; i < len; i++) p.set(hx + dx * i, hy + dy * i + 1, steel[2]);
    if (kind === 'sword') { p.set(hx + dx * 2 - dy, hy + dy * 2 + dx, brass[1]); p.set(hx + dx * 2 + dy, hy + dy * 2 - dx, brass[1]); }
    else p.set(hx + dx * 2, hy + dy * 2 + 1, brass[0]);
    p.set(hx + dx * 2, hy + dy * 2, brass[0]);
    p.set(hx - dx, hy - dy, kind === 'katana' ? R.navy[2] : brass[2]);
  } else if (kind === 'knife') {
    along(1, 8, (i) => (i < 3 ? wood[2] : steel[0]));
    p.set(hx + dx * 7, hy + dy * 7 + 1, steel[2]);
  } else if (kind === 'lance') {
    along(-6, 16, (i) => (i < 12 ? wood[1] : steel[0]));
    p.set(hx + dx * 16, hy + dy * 16, steel[1]);
    p.set(hx + dx * 12 - dy, hy + dy * 12 + dx, steel[1]);
    p.set(hx + dx * 12 + dy, hy + dy * 12 - dx, steel[1]);
  } else if (kind === 'claw') {
    for (let i = 0; i < 3; i++) p.set(hx + dx * (2 + i), hy + dy * (2 + i) + (i - 1), steel[0]);
  } else if (kind === 'cards') {
    p.rect(Math.round(hx + dx * 2) - 1, Math.round(hy + dy * 2) - 2, 3, 4, '#FFFDF5');
    p.set(Math.round(hx + dx * 2), Math.round(hy + dy * 2) - 1, R.tunicRed[2]);
    p.rect(Math.round(hx + dx * 2) + 1, Math.round(hy + dy * 2) - 3, 3, 4, '#FFFDF5');
    p.set(Math.round(hx + dx * 2) + 2, Math.round(hy + dy * 2) - 2, OUTLINE);
  } else if (kind === 'brush') { // paintbrush larger than her arm
    along(1, 13, (i) => (i < 9 ? wood[1] : i < 10 ? brass[1] : R.tunicRed[i % 2 ? 1 : 2]));
    p.set(hx + dx * 12 + 1, hy + dy * 12, R.tunicRed[1]);
  } else if (kind === 'rod') {
    along(-4, 13, wood[2]);
    p.ellipse(hx + dx * 13, hy + dy * 13, 2, 2, R.glass);
  } else if (kind === 'wrench') {
    along(1, 10, (i) => (i < 3 ? wood[2] : steel[1]));
    const ex = hx + dx * 10, ey = hy + dy * 10;
    p.rect(Math.round(ex) - 1, Math.round(ey) - 1, 3, 3, steel[0]);
    p.set(Math.round(ex), Math.round(ey), steel[3]);
  } else if (kind === 'pick') {
    along(1, 12, wood[1]);
    const ex = hx + dx * 11, ey = hy + dy * 11;
    for (let i = -4; i <= 4; i++) p.set(ex - dy * i, ey + dx * i, Math.abs(i) > 2 ? steel[2] : steel[0]);
  }
}

function buildBattle(id, poseName) {
  const def = CHAR_DEFS[id];
  const bd = BATTLE[id];
  const pose = POSES[poseName] || POSES.idle0;
  const pal = def.pal;
  const p = new Painter(32, 40);
  const map = keyMap(pal);
  const small = bd.small ? 4 : 0;
  const crouch = pose.crouch + (bd.crouch ? 3 : 0);
  const hipX = 17 + Math.round(pose.lean / 2);
  const hipY = 27 + crouch + small;
  const tx = 17 + pose.lean + (bd.crouch ? -1 : 0);
  const tTop = hipY - 10 + (bd.small ? 2 : 0);
  const top = pal.top, bot = pal.bottom, skin = pal.skin;
  const bulk = bd.bulky ? 1 : 0;

  const arm = (ang, sx, sy, shade, len = 9) => {
    const hx = sx + Math.cos(rad(ang)) * len, hy = sy + Math.sin(rad(ang)) * len;
    const sleeve = bd.crouch ? skin : top;
    p.thickLine(sx, sy, sx + Math.cos(rad(ang)) * (len - 3), sy + Math.sin(rad(ang)) * (len - 3), sleeve[shade], 2 + bulk);
    p.rect(Math.round(hx) - 1, Math.round(hy) - 1, 2, 2, skin[shade]);
    return [Math.round(hx), Math.round(hy)];
  };
  const backHand = arm(pose.ba, tx + 3, tTop + 2, 3);
  if (bd.shield) { // round shield on the back arm
    p.ellipse(backHand[0] + 1, backHand[1], 4, 5, R.iron);
    p.set(backHand[0], backHand[1] - 1, R.brass[0]);
  }
  if (bd.cape) {
    const c = pal.cape;
    for (let y = 0; y < 13; y++) {
      const w = 3 + Math.floor(y / 3);
      for (let x = 0; x < w; x++) p.set(tx + 2 + x + Math.floor(pose.lean / 2), tTop + 1 + y, y > 9 ? c[3] : x > w - 2 ? c[3] : c[2]);
    }
  }
  const leg = (fx, fy, kx, ky, shade) => {
    p.thickLine(hipX + (shade === 3 ? 2 : -1), hipY, kx, ky, bot[shade], 3);
    p.thickLine(kx, ky, fx, fy - 2, bot[shade], 3);
    const b = pal.boots;
    p.rect(fx - 2, fy - 3, 4, 3, b[shade === 3 ? 3 : 2]);
    p.rect(fx - 3, fy - 1, 2, 1, b[shade === 3 ? 3 : 2]);
  };
  const legs = bd.crouch && pose.legs === 'stand' ? 'lunge' : pose.legs;
  if (legs === 'stand') { leg(hipX + 4, 38, hipX + 3, hipY + 5, 3); leg(hipX - 3, 38, hipX - 2, hipY + 5, 2); }
  else if (legs === 'lunge') { leg(hipX + 7, 38, hipX + 5, Math.min(36, hipY + 5), 3); leg(hipX - 7, 38, hipX - 5, Math.min(36, hipY + 4), 2); }
  else { leg(hipX + 6, 38, hipX + 2, 37, 3); leg(hipX - 6, 38, hipX - 5, hipY + 2, 2); }

  const tw = 8 + bulk * 2 - (bd.small ? 1 : 0);
  const th = bd.small ? 9 : 11;
  for (let y = 0; y < th; y++) {
    for (let x = 0; x < tw; x++) {
      const px = tx - Math.floor(tw / 2) + x;
      const lit = x < tw * 0.35 ? 1 : x < tw * 0.75 ? 2 : 3;
      let c = top[y === 0 && x < tw - 2 ? 1 : lit];
      if (y === th - 3 && pal.trim) c = x < 2 ? pal.trim[1] : pal.trim[2];
      p.set(px, tTop + y, c);
    }
  }
  if (bd.coat || bd.robe) { // coat tails / robe hem
    const end = bd.robe ? 38 - tTop : 17;
    for (let y = th; y < end; y++) {
      const spread = bd.robe ? Math.floor((y - th) / 3) : 0;
      for (let x = -1 - spread; x < tw + 1 + spread; x++) {
        const px = tx - Math.floor(tw / 2) + x + (y > 13 && !bd.robe ? 1 : 0);
        p.set(px, tTop + y, top[x < 2 - spread ? 2 : x > tw - 2 + spread ? 4 : 3]);
      }
    }
    if (id === 'ilse') p.set(tx - 2, tTop + 3, pal.trim[1]); // torn insignia patch
  }
  if (bd.bag) p.rect(tx + 2, tTop + 9, 4, 4, pal.extra[2]);

  // head: the left-facing field head (kid heads for small characters), nudged with the lean
  const head = def.kid ? KID_HEADS[def.kid].left.slice(4) : headRows(def.head, 'left');
  const hx = tx - 9 + Math.round(pose.lean * 0.7);
  const hy = tTop - (def.kid ? 9 : 11);
  for (let y = 0; y < head.length; y++) {
    for (let x = 0; x < 16; x++) {
      const ch = head[y][x];
      if (ch === '.') continue;
      const col = map[ch];
      if (col) p.set(hx + x, hy + y, col);
    }
  }

  const fh = arm(pose.fa, tx - 2, tTop + 2, 1);
  if (bd.weapon !== 'none') drawWeapon(p, bd.weapon, fh[0], fh[1], pose.wa);
  if (pose.holdUp) p.rect(backHand[0] - 2, backHand[1] - 4, 4, 4, '#F0FFFC');
  if (bd.glow) {
    p.set(fh[0] - 1, fh[1] - 2, R.spirit[1]);
    p.set(fh[0] + 1, fh[1] + 1, R.spirit[0]);
  }
  p.selectiveOutline();
  return p.toCanvas();
}

// Non-human battle sprites: poses are small variations of one painting.
function creatureBattle(id, pose) {
  const P = new Painter(40, 44);
  const lean = pose === 'swing' ? -3 : pose === 'hurt' ? 3 : pose === 'windup' ? 2 : 0;
  const sink = pose === 'kneel' ? 3 : pose.startsWith('idle') && (pose === 'idle1' || pose === 'idle2') ? 1 : 0;
  const lift = pose === 'victory' || pose === 'cast' ? -3 : 0;
  let src;
  if (id === 'mog') src = moogle('left', 0);
  else if (id === 'seven' || id === 'sevenBlue') src = sevenSprite('left', pose === 'swing' ? 1 : 0, id === 'sevenBlue' ? 'blue' : 'amber');
  else if (id === 'umaro') src = umaroSprite('left', pose === 'swing' ? 1 : 0);
  else src = dogSprite('left', 0);
  // re-stamp the canvas pixels into the painter at 1x (no scaling)
  const c = src.getContext('2d').getImageData(0, 0, src.width, src.height).data;
  const ox = Math.floor((40 - src.width) / 2) + lean, oy = 44 - 2 - src.height + sink + lift;
  for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) {
    const i = (y * src.width + x) * 4;
    if (c[i + 3] === 0) continue;
    P.set(ox + x, oy + y, '#' + ((1 << 24) | (c[i] << 16) | (c[i + 1] << 8) | c[i + 2]).toString(16).slice(1).toUpperCase());
  }
  if (id === 'mog' && (pose === 'swing' || pose === 'windup' || pose === 'idle0')) { // moogle spear
    const hx = ox + 3, hy = oy + 10;
    for (let i = 0; i < 12; i++) P.set(hx - (pose === 'swing' ? i : Math.round(i * 0.5)), hy - (pose === 'swing' ? 0 : i), i > 9 ? R.iron[0] : R.leather[1]);
  }
  return P.toCanvas();
}
const CREATURES = new Set(['mog', 'seven', 'sevenBlue', 'umaro', 'interceptor']);

const battleCache = new Map();
export function battleSprite(id, pose) {
  const key = id + ':' + pose;
  if (!battleCache.has(key)) battleCache.set(key, CREATURES.has(id) ? creatureBattle(id, pose) : buildBattle(id, pose));
  return battleCache.get(key);
}
export const BATTLE_POSES = Object.keys(POSES);
export function hasBattleSprite(id) { return !!BATTLE[id] || CREATURES.has(id); }
