// Builds character sprite sheets from the layered text art in chars.js.
import { BODY, HEADS, EXTRAS, KID_HEADS } from './chars.js';
import { R, OUTLINE } from './palette.js';
import { Painter, flipH } from '../core/gfx.js';

// Each character: body build, head, extras, and ramps for each layer key group.
export const CHAR_DEFS = {
  terra: { body: 'adult', head: 'terra', extras: ['terraCape'], warm: true,
    pal: { hair: R.hairGreen, skin: R.skinLight, top: R.tunicRed, bottom: R.tunicRed, trim: R.brass, cape: R.plum, boots: R.leather } },
  terraGlow: { body: 'adult', head: 'terra', extras: ['terraCape'], warm: true,
    pal: { hair: R.hairGreen, skin: R.spirit, top: R.tunicRed, bottom: R.tunicRed, trim: R.brass, cape: R.plum, boots: R.leather } },
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
  pip: { kid: 'pigtails', warm: true,
    pal: { hair: R.skyRuin, skin: R.skinLight, top: R.cream, bottom: R.cream, trim: R.tunicRed, boots: R.leather } },
  rowan: { kid: 'cap',
    pal: { hair: R.brownHair, skin: R.skinLight, top: R.farmBlue, bottom: R.leather, trim: R.leather, boots: R.leather, extra: R.tunicRed } },
  mina: { kid: 'bob', warm: true,
    pal: { hair: R.ashBlonde, skin: R.skinDeep, top: R.plum, bottom: R.plum, trim: R.cream, boots: R.leather } },
  tobin: { kid: 'bob',
    pal: { hair: R.brownHair, skin: R.skinLight, top: R.moss, bottom: R.leather, trim: R.leather, boots: R.leather } },
};

function keyMap(pal) {
  const m = {
    k: OUTLINE, w: '#FFFDF5',
  };
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
  set('Xxy', pal.extra);
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

const DIRS = ['down', 'up', 'left'];

function buildFrame(def, dir, fr) {
  const p = new Painter(16, 24);
  const map = keyMap(def.pal);
  const bob = fr === 0 ? 0 : 1;
  if (def.kid) {
    p.art(BODY.kid[dir][fr], 0, 0, map);
    p.art(padTo24(KID_HEADS[def.kid][dir]), 0, bob, map);
  } else {
    p.art(BODY[def.body][dir][fr], 0, 0, map);
    for (const ex of def.extras || []) {
      const layer = EXTRAS[ex][dir];
      if (layer && dir !== 'up') p.art(layer, 0, bob ? 0 : 0, map);
      if (layer && dir === 'up') p.art(layer, 0, 0, map);
    }
    p.art(padTo24(HEADS[def.head][dir]), 0, bob, map);
  }
  p.deepOutline();
  return p.toCanvas();
}

const sheetCache = new Map();
// Returns { down:[c,c,c], up:[...], left:[...], right:[...] }
export function fieldSheet(id) {
  if (sheetCache.has(id)) return sheetCache.get(id);
  const def = CHAR_DEFS[id];
  if (!def) throw new Error('unknown sprite ' + id);
  const sheet = {};
  for (const dir of DIRS) sheet[dir] = [0, 1, 2].map((fr) => buildFrame(def, dir, fr));
  sheet.right = sheet.left.map((c) => flipH(c));
  sheetCache.set(id, sheet);
  return sheet;
}

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
  ilse: { weapon: 'wrench', coat: true, bag: true },
  hale: { weapon: 'pick', bulky: true },
  duane: { weapon: 'none', bulky: true },
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

function drawWeapon(p, kind, hx, hy, ang, pal) {
  const dx = Math.cos(rad(ang)), dy = Math.sin(rad(ang));
  const steel = R.iron, brass = R.brass, wood = R.leather;
  if (kind === 'sword') {
    for (let i = 2; i < 15; i++) {
      p.set(hx + dx * i, hy + dy * i, i < 13 ? steel[0] : steel[1]);
      p.set(hx + dx * i + (dy > 0 ? 0 : 1) * Math.sign(-dy || 1) * 0, hy + dy * i + 1, steel[2]);
    }
    // guard (perpendicular) and pommel
    p.set(hx + dx * 2 - dy, hy + dy * 2 + dx, brass[1]);
    p.set(hx + dx * 2 + dy, hy + dy * 2 - dx, brass[1]);
    p.set(hx + dx * 2, hy + dy * 2, brass[0]);
    p.set(hx - dx, hy - dy, brass[2]);
  } else if (kind === 'wrench') {
    for (let i = 1; i < 10; i++) p.set(hx + dx * i, hy + dy * i, i < 3 ? wood[2] : steel[1]);
    const ex = hx + dx * 10, ey = hy + dy * 10;
    p.rect(Math.round(ex) - 1, Math.round(ey) - 1, 3, 3, steel[0]);
    p.set(Math.round(ex), Math.round(ey), steel[3]);
  } else if (kind === 'pick') {
    for (let i = 1; i < 12; i++) p.set(hx + dx * i, hy + dy * i, wood[1]);
    const ex = hx + dx * 11, ey = hy + dy * 11;
    for (let i = -4; i <= 4; i++) p.set(ex - dy * i, ey + dx * i, Math.abs(i) > 2 ? steel[2] : steel[0]);
  }
}

function buildBattle(id, poseName) {
  const def = CHAR_DEFS[id];
  const bd = BATTLE[id];
  const pose = POSES[poseName];
  const pal = def.pal;
  const p = new Painter(32, 40);
  const map = keyMap(pal);
  const hipX = 17 + Math.round(pose.lean / 2);
  const hipY = 27 + pose.crouch;
  const tx = 17 + pose.lean; // torso centre x
  const tTop = hipY - 10;
  const top = pal.top, bot = pal.bottom, skin = pal.skin;
  const bulk = bd.bulky ? 1 : 0;

  // back arm (shadowed)
  const arm = (ang, sx, sy, shade, len = 9) => {
    const hx = sx + Math.cos(rad(ang)) * len, hy = sy + Math.sin(rad(ang)) * len;
    p.thickLine(sx, sy, sx + Math.cos(rad(ang)) * (len - 3), sy + Math.sin(rad(ang)) * (len - 3), top[shade], 2 + bulk);
    p.rect(Math.round(hx) - 1, Math.round(hy) - 1, 2, 2, skin[shade]);
    return [Math.round(hx), Math.round(hy)];
  };
  const backHand = arm(pose.ba, tx + 3, tTop + 2, 3);

  // cape (behind torso)
  if (bd.cape) {
    const c = pal.cape;
    for (let y = 0; y < 13; y++) {
      const w = 3 + Math.floor(y / 3);
      for (let x = 0; x < w; x++) p.set(tx + 2 + x + Math.floor(pose.lean / 2), tTop + 1 + y, y > 9 ? c[3] : x > w - 2 ? c[3] : c[2]);
    }
  }

  // legs
  const leg = (fx, fy, kx, ky, shade) => {
    p.thickLine(hipX + (shade === 3 ? 2 : -1), hipY, kx, ky, bot[shade], 3);
    p.thickLine(kx, ky, fx, fy - 2, bot[shade], 3);
    const b = pal.boots;
    p.rect(fx - 2, fy - 3, 4, 3, b[shade === 3 ? 3 : 2]);
    p.rect(fx - 3, fy - 1, 2, 1, b[shade === 3 ? 3 : 2]);
  };
  if (pose.legs === 'stand') {
    leg(hipX + 4, 38, hipX + 3, hipY + 5, 3);
    leg(hipX - 3, 38, hipX - 2, hipY + 5, 2);
  } else if (pose.legs === 'lunge') {
    leg(hipX + 7, 38, hipX + 5, hipY + 5, 3);
    leg(hipX - 7, 38, hipX - 5, hipY + 4, 2);
  } else { // kneel
    leg(hipX + 6, 38, hipX + 2, 37, 3);
    leg(hipX - 6, 38, hipX - 5, hipY + 2, 2);
  }

  // torso: lit on the left (toward the key light), shadow on the right
  const tw = 8 + bulk * 2;
  for (let y = 0; y < 11; y++) {
    for (let x = 0; x < tw; x++) {
      const px = tx - Math.floor(tw / 2) + x;
      const lit = x < tw * 0.35 ? 1 : x < tw * 0.75 ? 2 : 3;
      let c = top[y === 0 && x < tw - 2 ? 1 : lit];
      if (y === 8 && pal.trim) c = x < 2 ? pal.trim[1] : pal.trim[2];
      p.set(px, tTop + y, c);
    }
  }
  if (bd.coat) { // coat tails over the thighs
    for (let y = 11; y < 17; y++) for (let x = -1; x < tw + 1; x++) {
      const px = tx - Math.floor(tw / 2) + x + (y > 13 ? 1 : 0);
      p.set(px, tTop + y, top[x < 2 ? 2 : x > tw - 2 ? 4 : 3]);
    }
    p.set(tx - 2, tTop + 3, pal.trim[1]); // torn insignia patch
  }
  if (bd.bag) p.rect(tx + 2, tTop + 9, 4, 4, pal.extra[2]);

  // head: the left-facing field head, nudged forward with the lean
  const head = HEADS[def.head].left;
  const hx = tx - 9 + Math.round(pose.lean * 0.7);
  const hy = tTop - 11;
  for (let y = 0; y < head.length; y++) {
    for (let x = 0; x < 16; x++) {
      const ch = head[y][x];
      if (ch === '.') continue;
      const col = map[ch];
      if (col) p.set(hx + x, hy + y, col);
    }
  }

  // front arm + weapon
  const fh = arm(pose.fa, tx - 2, tTop + 2, 1);
  if (bd.weapon !== 'none') drawWeapon(p, bd.weapon, fh[0], fh[1], pose.wa, pal);
  if (pose.holdUp) p.rect(backHand[0] - 2, backHand[1] - 4, 4, 4, '#F0FFFC');
  if (bd.glow) { // faint pink glow pixels on the hands
    p.set(fh[0] - 1, fh[1] - 2, R.spirit[1]);
    p.set(fh[0] + 1, fh[1] + 1, R.spirit[0]);
  }
  p.selectiveOutline();
  return p.toCanvas();
}

const battleCache = new Map();
export function battleSprite(id, pose) {
  const key = id + ':' + pose;
  if (!battleCache.has(key)) battleCache.set(key, buildBattle(id, pose));
  return battleCache.get(key);
}
export const BATTLE_POSES = Object.keys(POSES);
export function hasBattleSprite(id) { return !!BATTLE[id]; }
