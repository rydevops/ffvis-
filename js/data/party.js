// Playable characters, abilities and items.

// cmds: fight | salvage | spirit | heave | brace | blast | item | defend
export const CHARS = {
  ilse: {
    id: 'ilse', name: 'Ilse', title: 'Researcher', lv: 4, exp: 0, hp: 132, maxhp: 132, sp: 0, maxsp: 0,
    atk: 13, def: 10, mag: 10, mdf: 9, spd: 22, weapon: 'wrench', field: 'ilse', battle: 'ilse',
    cmds: ['fight', 'salvage', 'item', 'defend'],
  },
  hale: {
    id: 'hale', name: 'Hale', title: 'Dig Foreman', lv: 6, exp: 0, hp: 168, maxhp: 168, sp: 0, maxsp: 0,
    atk: 16, def: 12, mag: 4, mdf: 6, spd: 16, weapon: 'pick', field: 'hale', battle: 'hale',
    cmds: ['fight', 'blast', 'item', 'defend'],
  },
  terra: {
    id: 'terra', name: 'Terra', title: 'Half-Esper', lv: 9, exp: 0, hp: 210, maxhp: 210, sp: 0, maxsp: 0,
    atk: 18, def: 12, mag: 16, mdf: 14, spd: 24, weapon: 'sword', field: 'terra', battle: 'terra',
    cmds: ['fight', 'item', 'defend'],
  },
  duane: {
    id: 'duane', name: 'Duane', title: 'Farmer', lv: 8, exp: 0, hp: 240, maxhp: 240, sp: 0, maxsp: 0,
    atk: 17, def: 14, mag: 3, mdf: 7, spd: 15, weapon: 'none', field: 'duane', battle: 'duane',
    cmds: ['fight', 'heave', 'brace', 'item'],
  },
};

export const CMD_NAMES = {
  fight: 'Fight', salvage: 'Salvage', spirit: 'Spirit', heave: 'Heave', brace: 'Brace', blast: 'Blast',
  item: 'Item', defend: 'Defend',
};

// Ilse's Salvage: devices built from machine parts mid-battle.
export const SALVAGE = [
  { id: 'shock', name: 'Shock Trap', cost: 1, target: 'enemy', desc: 'Lightning trap. Machines short out.' },
  { id: 'turret', name: 'Turret', cost: 2, target: 'none', desc: 'Deploys a turret that fires 3 times.' },
  { id: 'decoy', name: 'Flash Decoy', cost: 1, target: 'none', desc: 'Draws the next 2 attacks.' },
  { id: 'patch', name: 'Patch Kit', cost: 1, target: 'ally', desc: 'Restores about 80 HP.' },
];

// Terra's returning power (tier-1 magic: faint, translucent, flickering).
export const SPIRIT = [
  { id: 'petal', name: 'Petal Flicker', cost: 6, target: 'allEnemies', desc: 'Faint spirit petals strike all foes.' },
  { id: 'mend', name: 'Mend', cost: 4, target: 'ally', desc: 'A soft light closes wounds.' },
];

export const ITEMS = {
  tonic: { name: 'Tonic', desc: 'Restores 60 HP.', target: 'ally', heal: 60 },
  hiTonic: { name: 'Hi-Tonic', desc: 'Restores 160 HP.', target: 'ally', heal: 160 },
  salts: { name: 'Smelling Salts', desc: 'Revives a fallen ally.', target: 'ally', revive: 0.3 },
  smoke: { name: 'Smoke Pot', desc: 'Escape from most battles.', target: 'none', flee: true },
  lens: { name: 'Cracked Lens', desc: 'A glass eye from the vault. Still faintly warm.', key: true },
  letter: { name: "Edgar's Letter", desc: 'Sealed with the Figaro crest.', key: true },
};

export function expForLevel(lv) { return Math.floor(12 * lv * lv * 1.1); }

export function levelUp(c) {
  c.lv++;
  const g = { ilse: [14, 1, 1, 1], hale: [18, 2, 1, 0], terra: [20, 2, 1, 1], duane: [22, 2, 2, 0] }[c.id] || [15, 1, 1, 1];
  c.maxhp += g[0] + Math.floor(Math.random() * 4);
  c.atk += g[1];
  c.def += g[2];
  c.spd += g[3] && c.lv % 2 ? 1 : 0;
  c.mag += 1;
  if (c.maxsp) { c.maxsp += 2; }
  c.hp = c.maxhp;
  c.sp = c.maxsp;
}

export function newState() {
  return {
    party: ['ilse', 'hale'],
    chars: { ilse: structuredClone(CHARS.ilse), hale: structuredClone(CHARS.hale) },
    items: { tonic: 4, salts: 1 },
    parts: 2,
    flags: {},
    propState: {},
    playtime: 0,
    chapterName: 'Prologue',
    leaderSprite: 'ilse',
    map: 'dig', x: 13, y: 16, dir: 'up',
  };
}
