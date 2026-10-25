// Playable characters, abilities, Echo shards, statuses, items and equipment.

// ---------------------------------------------------------------- characters
// growth per level: [hp, atk, def, mag, mdf, sp]
const C = (o) => ({ exp: 0, sp: 0, maxsp: 0, gear: { weapon: null, armor: null, relic: null }, echo: null, ...o });
export const CHARS = {
  ilse: C({ id: 'ilse', name: 'Ilse', title: 'Researcher', lv: 4, maxhp: 132, atk: 13, def: 10, mag: 10, mdf: 9, spd: 22, maxsp: 20,
    weapon: 'wrench', field: 'ilse', battle: 'ilse', cmds: ['fight', 'salvage', 'echo', 'item'], grow: [14, 1, 1, 2, 1, 2] }),
  hale: C({ id: 'hale', name: 'Hale', title: 'Dig Foreman', lv: 6, maxhp: 168, atk: 16, def: 12, mag: 4, mdf: 6, spd: 16,
    weapon: 'pick', field: 'hale', battle: 'hale', cmds: ['fight', 'blast', 'item', 'defend'], grow: [18, 2, 1, 0, 1, 0] }),
  terra: C({ id: 'terra', name: 'Terra', title: 'Half-Esper', lv: 9, maxhp: 210, atk: 18, def: 12, mag: 16, mdf: 14, spd: 24,
    weapon: 'sword', field: 'terra', battle: 'terra', cmds: ['fight', 'item', 'defend'], grow: [20, 2, 1, 2, 2, 3] }),
  duane: C({ id: 'duane', name: 'Duane', title: 'Farmer', lv: 8, maxhp: 240, atk: 17, def: 14, mag: 3, mdf: 7, spd: 15,
    weapon: 'none', field: 'duane', battle: 'duane', cmds: ['fight', 'heave', 'brace', 'item'], grow: [22, 2, 2, 0, 1, 0] }),
  setzer: C({ id: 'setzer', name: 'Setzer', title: 'Gambler', lv: 10, maxhp: 220, atk: 18, def: 12, mag: 10, mdf: 10, spd: 23, maxsp: 18,
    weapon: 'cards', field: 'setzer', battle: 'setzer', cmds: ['fight', 'slots', 'echo', 'item'], grow: [19, 2, 1, 1, 1, 2] }),
  edgar: C({ id: 'edgar', name: 'Edgar', title: 'Engineer-King', lv: 11, maxhp: 240, atk: 20, def: 15, mag: 11, mdf: 11, spd: 20, maxsp: 18,
    weapon: 'lance', field: 'edgar', battle: 'edgar', cmds: ['fight', 'tools', 'echo', 'item'], grow: [21, 2, 2, 1, 1, 2] }),
  sabin: C({ id: 'sabin', name: 'Sabin', title: 'Monk', lv: 11, maxhp: 280, atk: 23, def: 15, mag: 9, mdf: 9, spd: 21, maxsp: 18,
    weapon: 'claw', field: 'sabin', battle: 'sabin', cmds: ['fight', 'blitz', 'echo', 'item'], grow: [25, 3, 2, 1, 1, 2] }),
  locke: C({ id: 'locke', name: 'Locke', title: 'Treasure Hunter', lv: 11, maxhp: 230, atk: 19, def: 13, mag: 10, mdf: 10, spd: 27, maxsp: 18,
    weapon: 'knife', field: 'locke', battle: 'locke', cmds: ['fight', 'steal', 'echo', 'item'], grow: [19, 2, 1, 1, 1, 2] }),
  celes: C({ id: 'celes', name: 'Celes', title: 'Rune Knight', lv: 11, maxhp: 235, atk: 20, def: 14, mag: 17, mdf: 15, spd: 22, maxsp: 26,
    weapon: 'sword', field: 'celes', battle: 'celes', cmds: ['fight', 'runic', 'echo', 'item'], grow: [20, 2, 1, 2, 2, 3] }),
  cyan: C({ id: 'cyan', name: 'Cyan', title: 'Samurai', lv: 14, maxhp: 290, atk: 25, def: 17, mag: 8, mdf: 10, spd: 17, maxsp: 14,
    weapon: 'katana', field: 'cyan', battle: 'cyan', cmds: ['fight', 'bushido', 'echo', 'item'], grow: [23, 3, 2, 1, 1, 1] }),
  relm: C({ id: 'relm', name: 'Relm', title: 'Young Painter', lv: 14, maxhp: 210, atk: 12, def: 10, mag: 22, mdf: 18, spd: 22, maxsp: 34,
    weapon: 'brush', field: 'relm', battle: 'relm', cmds: ['fight', 'sketch', 'echo', 'item'], grow: [16, 1, 1, 3, 2, 4] }),
  strago: C({ id: 'strago', name: 'Strago', title: 'Lore-Keeper', lv: 15, maxhp: 220, atk: 13, def: 11, mag: 23, mdf: 20, spd: 16, maxsp: 36,
    weapon: 'rod', field: 'strago', battle: 'strago', cmds: ['fight', 'lore', 'echo', 'item'], grow: [16, 1, 1, 3, 2, 4] }),
  gau: C({ id: 'gau', name: 'Gau', title: 'Feral Boy', lv: 11, maxhp: 250, atk: 21, def: 13, mag: 12, mdf: 12, spd: 25,
    weapon: 'none', field: 'gau', battle: 'gau', cmds: ['rage', 'item'], grow: [22, 2, 1, 1, 1, 0] }),
  mog: C({ id: 'mog', name: 'Mog', title: 'Moogle', lv: 12, maxhp: 240, atk: 19, def: 14, mag: 16, mdf: 16, spd: 21, maxsp: 20,
    weapon: 'lance', field: 'mog', battle: 'mog', cmds: ['fight', 'dance', 'echo', 'item'], grow: [20, 2, 2, 2, 2, 2] }),
  umaro: C({ id: 'umaro', name: 'Umaro', title: 'Yeti', lv: 12, maxhp: 360, atk: 28, def: 16, mag: 4, mdf: 8, spd: 14,
    weapon: 'club', field: 'umaro', battle: 'umaro', cmds: [], grow: [30, 3, 2, 0, 1, 0] }),
  seven: C({ id: 'seven', name: 'Seven', title: 'Scout Machine', lv: 10, maxhp: 190, atk: 15, def: 16, mag: 16, mdf: 16, spd: 26, maxsp: 20,
    weapon: 'none', field: 'seven', battle: 'seven', cmds: ['fight', 'learn', 'item'], grow: [17, 1, 2, 2, 2, 2] }),
  maren: C({ id: 'maren', name: 'Maren', title: 'Spear Soldier', lv: 16, maxhp: 320, atk: 26, def: 21, mag: 9, mdf: 13, spd: 18, maxsp: 18,
    weapon: 'lance', field: 'maren', battle: 'maren', cmds: ['fight', 'bulwark', 'echo', 'item'], grow: [26, 2, 3, 1, 1, 1] }),
  dalia: C({ id: 'dalia', name: 'Dalia', title: 'Esper-Blooded', lv: 15, maxhp: 245, atk: 21, def: 13, mag: 19, mdf: 17, spd: 28, maxsp: 28,
    weapon: 'knife', field: 'dalia', battle: 'dalia', cmds: ['fight', 'call', 'echo', 'item'], grow: [19, 2, 1, 2, 2, 3] }),
  shadow: C({ id: 'shadow', name: 'Shadow', title: 'Assassin', lv: 24, maxhp: 400, atk: 32, def: 20, mag: 14, mdf: 16, spd: 30, maxsp: 20,
    weapon: 'knife', field: 'shadow', battle: 'shadow', cmds: ['fight', 'throw', 'echo', 'item'], grow: [24, 3, 2, 1, 1, 1] }),
  gogo: C({ id: 'gogo', name: 'Gogo', title: 'Mimic', lv: 20, maxhp: 330, atk: 22, def: 18, mag: 20, mdf: 20, spd: 22, maxsp: 30,
    weapon: 'none', field: 'gogo', battle: 'gogo', cmds: ['mimic', 'echo', 'item'], grow: [22, 2, 2, 2, 2, 2] }),
};
for (const c of Object.values(CHARS)) c.hp = c.maxhp, c.sp = c.maxsp;

// Build a character at a given level (deterministic growth so story balance holds).
export function makeChar(id, lv) {
  const c = structuredClone(CHARS[id]);
  while (c.lv < (lv || c.lv)) levelUp(c);
  c.exp = expForLevel(c.lv);
  c.hp = c.maxhp; c.sp = c.maxsp;
  c.gear.weapon = starterWeapon(c);
  c.gear.armor = c.lv >= 20 ? 'brassPlate' : c.lv >= 14 ? 'mythrilVest' : c.lv >= 9 ? 'ironMail' : 'leatherVest';
  return c;
}

export function expForLevel(lv) { return Math.floor(12 * lv * lv * 1.1); }

export function levelUp(c) {
  c.lv++;
  const g = c.grow || [15, 1, 1, 1, 1, 1];
  c.maxhp += g[0] + (c.lv % 3);
  c.atk += g[1] - (c.lv % 2 && g[1] > 1 ? 1 : 0);
  c.def += c.lv % 2 ? g[2] : Math.max(0, g[2] - 1);
  c.mag += c.lv % 2 ? g[3] : Math.max(0, g[3] - 1);
  c.mdf += c.lv % 2 ? g[4] : Math.max(0, g[4] - 1);
  if (c.lv % 3 === 0) c.spd += 1;
  if (c.maxsp || g[5]) c.maxsp += g[5];
  c.hp = c.maxhp;
  c.sp = c.maxsp;
}

export const CMD_NAMES = {
  fight: 'Fight', salvage: 'Salvage', spirit: 'Spirit', heave: 'Heave', brace: 'Brace', blast: 'Blast',
  item: 'Item', defend: 'Defend', echo: 'Echo', steal: 'Steal', runic: 'Runic', tools: 'Tools', blitz: 'Blitz',
  bushido: 'Bushido', slots: 'Slots', throw: 'Throw', sketch: 'Sketch', lore: 'Lore', rage: 'Rage', dance: 'Dance',
  mimic: 'Mimic', learn: 'Learn', bulwark: 'Bulwark', call: 'Call',
};

// ---------------------------------------------------------------- abilities
// kind: phys | magic | heal | revive | buff | status | special
// target: enemy | allEnemies | ally | allAllies | self | none | koAlly
const A = (o) => ({ cost: {}, power: 1, hits: 1, ...o });
export const ABIL = {
  // Terra — Spirit (her returning Esper half)
  petal: A({ name: 'Petal Flicker', kind: 'magic', el: 'spirit', target: 'allEnemies', power: 1.0, cost: { sp: 6 }, fx: 'petals', desc: 'Faint spirit petals strike all foes.' }),
  mend: A({ name: 'Mend', kind: 'heal', target: 'ally', power: 1.2, cost: { sp: 4 }, fx: 'heal', desc: 'A soft light closes wounds.' }),
  bloomLance: A({ name: 'Bloom Lance', kind: 'magic', el: 'spirit', target: 'enemy', power: 2.4, cost: { sp: 10 }, fx: 'petals', req: { flag: 'act2' }, desc: 'A spear of spirit light.' }),
  trance: A({ name: 'Trance', kind: 'special', target: 'self', cost: { sp: 0 }, fx: 'aura', req: { flag: 'trance' }, desc: 'Become the Esper. Stats rise.' }),
  morningStar: A({ name: 'Morning Star', kind: 'magic', el: 'holy', target: 'allEnemies', power: 4.2, cost: { sp: 30 }, fx: 'column', tier: 3, req: { flag: 'ult_terra' }, desc: 'Dawn falls on every foe.' }),
  // Ilse — Salvage
  shock: A({ name: 'Shock Trap', kind: 'magic', el: 'bolt', target: 'enemy', power: 1.5, cost: { parts: 1 }, fx: 'bolt', desc: 'Lightning trap. Machines short out.' }),
  turret: A({ name: 'Turret', kind: 'special', target: 'none', cost: { parts: 2 }, desc: 'Deploys a turret that fires 3 times.' }),
  decoy: A({ name: 'Flash Decoy', kind: 'special', target: 'none', cost: { parts: 1 }, desc: 'Draws the next 2 attacks.' }),
  patch: A({ name: 'Patch Kit', kind: 'heal', target: 'ally', power: 1.6, cost: { parts: 1 }, fx: 'heal', desc: 'Restores about 80 HP.' }),
  overclock: A({ name: 'Overclock', kind: 'buff', buff: 'haste', target: 'allAllies', cost: { parts: 3 }, fx: 'rings', atbFill: true, req: { flag: 'ult_ilse' }, desc: 'Party hastes and acts at once.' }),
  // Hale / Duane
  blast: A({ name: 'Blast Charge', kind: 'magic', el: 'fire', target: 'allEnemies', power: 1.4, fx: 'flame', once: true, desc: 'Once per battle.' }),
  heave: A({ name: 'Heave', kind: 'phys', target: 'enemy', power: 1.7, atbAfter: -40, desc: 'A huge, slow blow.' }),
  brace: A({ name: 'Brace', kind: 'special', target: 'ally', desc: 'Cover an ally.' }),
  // Locke
  steal: A({ name: 'Steal', kind: 'special', target: 'enemy', desc: 'Lift an item from a foe.' }),
  mug: A({ name: 'Mug', kind: 'special', target: 'enemy', req: { lv: 16 }, desc: 'Strike and steal at once.' }),
  secondChance: A({ name: 'Second Chance', kind: 'revive', target: 'allAllies', power: 0.6, once: true, fx: 'heal', req: { flag: 'ult_locke' }, desc: 'Everyone gets back up. Once.' }),
  // Celes
  runic: A({ name: 'Runic', kind: 'special', target: 'self', desc: 'Absorb the next spell aimed at the party.' }),
  iceBlade: A({ name: 'Frost Edge', kind: 'phys', el: 'ice', target: 'enemy', power: 1.6, cost: { sp: 5 }, fx: 'ice', desc: 'An ice-rimed cut.' }),
  runicBlade: A({ name: 'Runic Blade', kind: 'phys', el: 'holy', target: 'allEnemies', power: 2.6, cost: { sp: 16 }, fx: 'column', req: { flag: 'ult_celes' }, desc: 'Every rune she ever drank, released.' }),
  // Edgar — Tools
  autoCrossbow: A({ name: 'Auto Crossbow', kind: 'phys', target: 'allEnemies', power: 0.95, fx: 'bolts', desc: 'Bolts rake every foe.' }),
  drill: A({ name: 'Drill', kind: 'phys', target: 'enemy', power: 2.1, pierce: true, fx: 'drill', desc: 'Ignores defence.' }),
  flash: A({ name: 'Flash', kind: 'status', status: 'blind', chance: 0.8, target: 'allEnemies', fx: 'flashbang', desc: 'Blinds all foes.' }),
  bioBlaster: A({ name: 'Bio Blaster', kind: 'magic', el: 'bio', target: 'allEnemies', power: 1.1, status: 'poison', chance: 0.5, fx: 'bio', req: { lv: 15 }, desc: 'Poison mist.' }),
  chainsaw: A({ name: 'Chainsaw', kind: 'phys', target: 'enemy', power: 2.6, instant: 0.2, fx: 'drill', req: { lv: 20 }, desc: 'Sometimes ends it outright.' }),
  royalTempest: A({ name: 'Royal Tempest', kind: 'phys', el: 'wind', target: 'allEnemies', power: 3.4, cost: { sp: 14 }, fx: 'tornado', duo: ['edgar', 'sabin'], req: { flag: 'ult_figaro' }, desc: 'The brothers, together.' }),
  // Sabin — Blitz (enter the motion to unleash)
  pummel: A({ name: 'Pummel', kind: 'phys', target: 'enemy', power: 0.75, hits: 4, input: 'LRL', fx: 'fists', desc: 'Input: ← → ←' }),
  auraBolt: A({ name: 'Aura Bolt', kind: 'magic', el: 'holy', target: 'enemy', power: 2.4, input: 'DLU', fx: 'chi', desc: 'Input: ↓ ← ↑' }),
  suplex: A({ name: 'Suplex', kind: 'phys', target: 'enemy', power: 2.8, input: 'UDLR', noBoss: true, fx: 'slam', desc: 'Input: ↑ ↓ ← →' }),
  fireDance: A({ name: 'Fire Dance', kind: 'magic', el: 'fire', target: 'allEnemies', power: 1.6, input: 'LDRUL', fx: 'flame', req: { lv: 15 }, desc: 'Input: ← ↓ → ↑ ←' }),
  mantra: A({ name: 'Mantra', kind: 'heal', target: 'allAllies', power: 1.4, input: 'RLRLA', fx: 'heal', req: { lv: 18 }, desc: 'Input: → ← → ← A' }),
  // Cyan — Bushido levels (charge while choosing)
  fang: A({ name: 'Fang', kind: 'phys', target: 'enemy', power: 1.6, fx: 'cut', desc: 'Level 1' }),
  sky: A({ name: 'Sky', kind: 'special', target: 'self', desc: 'Level 2: counter stance' }),
  tiger: A({ name: 'Tiger', kind: 'phys', target: 'allEnemies', power: 1.3, fx: 'cut', desc: 'Level 3' }),
  dawnblade: A({ name: 'Dawnblade', kind: 'phys', el: 'holy', target: 'allEnemies', power: 3.2, fx: 'screencut', req: { flag: 'ult_cyan' }, desc: 'Level 4' }),
  // Setzer
  slots: A({ name: 'Slots', kind: 'special', target: 'none', desc: 'Stop the reels.' }),
  // Shadow
  throwStar: A({ name: 'Shuriken', kind: 'phys', target: 'enemy', power: 2.2, pierce: true, cost: { item: 'shuriken' }, fx: 'star', desc: 'Throws a shuriken.' }),
  throwKnife: A({ name: 'Throw Knife', kind: 'phys', target: 'enemy', power: 1.3, fx: 'star', desc: 'A spare blade.' }),
  shadowfang: A({ name: 'Shadowfang', kind: 'phys', el: 'void', target: 'enemy', power: 3.0, cost: { sp: 12 }, fx: 'void', desc: 'Interceptor strikes from the dark.' }),
  // Relm
  sketch: A({ name: 'Sketch', kind: 'special', target: 'enemy', desc: 'Paint a foe; the painting attacks.' }),
  paintSplat: A({ name: 'Paint Splat', kind: 'magic', el: 'weakest', target: 'enemy', power: 1.8, cost: { sp: 5 }, fx: 'paint', desc: 'Strikes a foe\'s weakness.' }),
  livingCanvas: A({ name: 'Living Canvas', kind: 'heal', target: 'allAllies', power: 2.6, cost: { sp: 18 }, fx: 'heal', cure: true, req: { flag: 'ult_relm' }, desc: 'Paints the party whole.' }),
  // Strago — Lore (learned by seeing enemies use them)
  tideBreath: A({ name: 'Tide Breath', kind: 'magic', el: 'water', target: 'allEnemies', power: 1.5, cost: { sp: 8 }, fx: 'wave', lore: true, desc: 'A breath of deep water.' }),
  stoneGaze: A({ name: 'Stone Gaze', kind: 'status', status: 'petrify', chance: 0.35, target: 'enemy', cost: { sp: 6 }, fx: 'rings', lore: true, desc: 'Petrifies. Not bosses.' }),
  pollenLull: A({ name: 'Pollen Lull', kind: 'status', status: 'sleep', chance: 0.6, target: 'allEnemies', cost: { sp: 6 }, fx: 'pollen', lore: true, desc: 'Silent flowers bring sleep.' }),
  ribChord: A({ name: 'Rib Chord', kind: 'magic', el: 'holy', target: 'allEnemies', power: 1.3, cost: { sp: 9 }, fx: 'rings', lore: true, desc: 'A warden\'s chord.' }),
  lampBeam: A({ name: 'Lamp Beam', kind: 'magic', el: 'holy', target: 'enemy', power: 2.0, cost: { sp: 5 }, fx: 'beam', lore: true, desc: 'Sentinel light.' }),
  frostFang: A({ name: 'Frost Fang', kind: 'magic', el: 'ice', target: 'enemy', power: 2.0, cost: { sp: 6 }, fx: 'ice', lore: true, desc: 'A wolf\'s bite of cold.' }),
  quietingNote: A({ name: 'Quieting Note', kind: 'magic', el: 'void', target: 'allEnemies', power: 2.2, cost: { sp: 16 }, fx: 'void', lore: true, desc: 'SOLACE\'s own hush, turned back.' }),
  atonement: A({ name: 'Atonement', kind: 'magic', el: 'holy', target: 'allEnemies', power: 3.0, cost: { sp: 24 }, healParty: 0.3, fx: 'column', req: { flag: 'ult_strago' }, desc: 'A confession that heals.' }),
  // Mog — Dance
  windSong: A({ name: 'Wind Song', kind: 'special', target: 'none', dance: ['gust', 'haste', 'blindAll'], desc: 'Wind, haste, or dust.' }),
  earthBlues: A({ name: 'Earth Blues', kind: 'special', target: 'none', dance: ['quake', 'protect', 'stoneGaze'], desc: 'Stone and shelter.' }),
  moogleWaltz: A({ name: 'Moogle Waltz', kind: 'special', target: 'none', dance: ['healAll', 'healAll', 'regen'], desc: 'Kupo! Healing steps.' }),
  snowfallDance: A({ name: 'Snowfall Dance', kind: 'special', target: 'none', dance: ['blizzardAll', 'healAll', 'sleepAll'], req: { flag: 'ult_mog' }, desc: 'Narshe\'s clean snow.' }),
  // Umaro
  bigHug: A({ name: 'Big Hug', kind: 'heal', target: 'allAllies', power: 1.8, fx: 'heal', desc: 'A crushing, loving hug.' }),
  // Maren — Bulwark
  shieldWall: A({ name: 'Shield Wall', kind: 'buff', buff: 'protect', target: 'allAllies', cost: { sp: 6 }, fx: 'hex', desc: 'Protect the whole party.' }),
  counterStance: A({ name: 'Counter', kind: 'special', target: 'self', desc: 'Strike back at the next 3 hits.' }),
  rally: A({ name: 'Rally', kind: 'heal', target: 'allAllies', power: 0.7, cost: { sp: 5 }, atbBoost: 30, fx: 'rally', desc: 'Heal and hurry the party.' }),
  unbrokenLine: A({ name: 'Unbroken Line', kind: 'buff', buff: 'aegis', target: 'allAllies', cost: { sp: 14 }, fx: 'hex', req: { flag: 'ult_maren' }, desc: 'Each ally shrugs off one hit.' }),
  // Dalia — Call
  flurry: A({ name: 'Knife Flurry', kind: 'phys', target: 'enemy', power: 0.6, hits: 3, fx: 'cut', desc: 'Three quick cuts.' }),
  wolfRush: A({ name: 'Wolf Rush', kind: 'phys', target: 'enemy', power: 2.2, cost: { sp: 5 }, fx: 'beasts', desc: 'A wolf answers.' }),
  raptorWings: A({ name: 'Raptor Wings', kind: 'magic', el: 'wind', target: 'allEnemies', power: 1.5, cost: { sp: 8 }, fx: 'beasts', desc: 'Birds of prey sweep the field.' }),
  bearGuard: A({ name: 'Bear Guard', kind: 'buff', buff: 'protect', target: 'allAllies', cost: { sp: 6 }, fx: 'beasts', desc: 'A bear stands over you.' }),
  esperBloom: A({ name: 'Esper Bloom', kind: 'magic', el: 'spirit', target: 'allEnemies', power: 3.6, cost: { sp: 26 }, fx: 'petals', tier: 3, req: { flag: 'ult_dalia' }, desc: 'Her mother\'s song, blooming.' }),
  // Seven
  learn: A({ name: 'Learn', kind: 'special', target: 'enemy', desc: 'Copy the last technique a foe used.' }),
  // Gau — rages are enemy moves; Gogo mimics
  mimic: A({ name: 'Mimic', kind: 'special', target: 'none', desc: 'Repeat the last ally\'s action.' }),
};

// Echo spells. tier sets how dense the effect is drawn (tier 1 faint, 3 full-screen).
const E = (o) => A({ kind: 'magic', cost: { sp: 4 }, ...o });
Object.assign(ABIL, {
  ember: E({ name: 'Ember', el: 'fire', target: 'enemy', power: 1.6, fx: 'fire', desc: 'Fire.' }),
  blaze: E({ name: 'Blaze', el: 'fire', target: 'allEnemies', power: 1.6, cost: { sp: 10 }, fx: 'fire', desc: 'Fire on all foes.' }),
  hellfire: E({ name: 'Hellfire', el: 'fire', target: 'allEnemies', power: 3.2, cost: { sp: 22 }, fx: 'fire', desc: 'A pillar of fire.' }),
  frost: E({ name: 'Frost', el: 'ice', target: 'enemy', power: 1.6, fx: 'ice', desc: 'Ice.' }),
  blizzard: E({ name: 'Blizzard', el: 'ice', target: 'allEnemies', power: 1.6, cost: { sp: 10 }, fx: 'ice', desc: 'Ice on all foes.' }),
  diamondDust: E({ name: 'Diamond Dust', el: 'ice', target: 'allEnemies', power: 3.2, cost: { sp: 22 }, fx: 'ice', desc: 'Encased, then shattered.' }),
  spark: E({ name: 'Spark', el: 'bolt', target: 'enemy', power: 1.6, fx: 'bolt', desc: 'Lightning.' }),
  thunder: E({ name: 'Thunder', el: 'bolt', target: 'allEnemies', power: 1.6, cost: { sp: 10 }, fx: 'bolt', desc: 'Lightning on all foes.' }),
  judgment: E({ name: 'Judgment Bolt', el: 'bolt', target: 'allEnemies', power: 3.2, cost: { sp: 22 }, fx: 'bolt', desc: 'Three branching bolts.' }),
  cure: E({ name: 'Cure', kind: 'heal', target: 'ally', power: 1.4, fx: 'heal', desc: 'Heal one.' }),
  cureAll: E({ name: 'Cure All', kind: 'heal', target: 'allAllies', power: 1.2, cost: { sp: 12 }, fx: 'heal', desc: 'Heal everyone.' }),
  esuna: E({ name: 'Esuna', kind: 'heal', target: 'ally', power: 0.2, cure: true, cost: { sp: 6 }, fx: 'heal', desc: 'Cures ailments, even rest.' }),
  raise: E({ name: 'Raise', kind: 'revive', target: 'koAlly', power: 0.4, cost: { sp: 12 }, fx: 'feather', desc: 'A falling feather. A rising light.' }),
  rebirth: E({ name: 'Rebirth', kind: 'revive', target: 'allAllies', power: 0.8, cost: { sp: 30 }, fx: 'feather', desc: 'Everyone, again.' }),
  protect: E({ name: 'Protect', kind: 'buff', buff: 'protect', target: 'ally', fx: 'hex', desc: 'Physical shield.' }),
  shell: E({ name: 'Shell', kind: 'buff', buff: 'shell', target: 'ally', fx: 'hex', desc: 'Magic shield.' }),
  rubyLight: E({ name: 'Ruby Light', kind: 'buff', buff: 'protect', buff2: 'shell', target: 'allAllies', cost: { sp: 16 }, fx: 'hex', desc: 'Protect and Shell for all.' }),
  lull: E({ name: 'Lull', kind: 'status', status: 'sleep', chance: 0.7, target: 'enemy', fx: 'pollen', desc: 'Sleep.' }),
  hush: E({ name: 'Hush', kind: 'status', status: 'silence', chance: 0.7, target: 'enemy', fx: 'rings', desc: 'Silence.' }),
  sirenSong: E({ name: 'Siren Song', el: 'water', target: 'allEnemies', power: 2.0, status: 'sleep', chance: 0.4, cost: { sp: 18 }, fx: 'wave', desc: 'A song from the sea.' }),
  splash: E({ name: 'Splash', el: 'water', target: 'enemy', power: 1.7, fx: 'wave', desc: 'Water.' }),
  tidal: E({ name: 'Tidal', el: 'water', target: 'allEnemies', power: 1.7, cost: { sp: 11 }, fx: 'wave', desc: 'A wave over all foes.' }),
  leviathan: E({ name: 'Deep Tide', el: 'water', target: 'allEnemies', power: 3.3, cost: { sp: 22 }, fx: 'wave', desc: 'The sea remembers.' }),
  haste: E({ name: 'Haste', kind: 'buff', buff: 'haste', target: 'ally', cost: { sp: 6 }, fx: 'clock', desc: 'Faster.' }),
  holy: E({ name: 'Holy', el: 'holy', target: 'enemy', power: 2.6, cost: { sp: 14 }, fx: 'column', desc: 'Light.' }),
  maduinWrath: E({ name: 'Maduin\'s Wrath', el: 'spirit', target: 'allEnemies', power: 3.4, cost: { sp: 24 }, fx: 'petals', desc: 'A father\'s anger.' }),
  edge: E({ name: 'Edge', kind: 'phys', target: 'enemy', power: 1.9, fx: 'cut', desc: 'A remembered blade.' }),
  gungnir: E({ name: 'Gungnir', kind: 'phys', el: 'holy', target: 'enemy', power: 2.8, cost: { sp: 12 }, fx: 'column', desc: 'The spear that never misses.' }),
  zantetsu: E({ name: 'Zantetsu', kind: 'phys', target: 'allEnemies', power: 2.0, instant: 0.25, cost: { sp: 24 }, fx: 'screencut', desc: 'Cuts the lesser foe in two.' }),
  requiem: E({ name: 'Requiem', el: 'spirit', target: 'allEnemies', power: 4.4, cost: { sp: 30 }, fx: 'petals', desc: 'Valtheia\'s song.' }),
});

// Echo shards: memories of Espers, equipped one per character. Each relit Wellspring
// strengthens them: tier = 1 + floor(relit / 2) (1 at the start, 3 near the end).
export const ECHOES = {
  ifrit: { name: 'Ifrit\'s Ember', esper: 'Ifrit', spells: [[1, 'ember'], [2, 'blaze'], [3, 'hellfire']], bonus: { atk: 2 } },
  shiva: { name: 'Shiva\'s Frost', esper: 'Shiva', spells: [[1, 'frost'], [2, 'blizzard'], [3, 'diamondDust']], bonus: { mag: 2 } },
  ramuh: { name: 'Ramuh\'s Spark', esper: 'Ramuh', spells: [[1, 'spark'], [2, 'thunder'], [3, 'judgment']], bonus: { mag: 2 } },
  unicorn: { name: 'Unicorn Horn', esper: 'Unicorn', spells: [[1, 'cure'], [2, 'cureAll'], [2, 'esuna']], bonus: { mdf: 2 } },
  phoenix: { name: 'Phoenix Feather', esper: 'Phoenix', spells: [[1, 'raise'], [3, 'rebirth']], bonus: { maxhp: 30 } },
  carbuncle: { name: 'Carbuncle Gem', esper: 'Carbuncle', spells: [[1, 'protect'], [1, 'shell'], [3, 'rubyLight']], bonus: { def: 2 } },
  siren: { name: 'Siren Shell', esper: 'Siren', spells: [[1, 'lull'], [1, 'hush'], [2, 'sirenSong']], bonus: { mag: 1, spd: 1 } },
  bismarck: { name: 'Bismarck Scale', esper: 'Bismarck', spells: [[1, 'splash'], [2, 'tidal'], [3, 'leviathan']], bonus: { maxhp: 20 } },
  maduin: { name: 'Maduin\'s Heart', esper: 'Maduin', spells: [[1, 'haste'], [2, 'holy'], [3, 'maduinWrath']], bonus: { mag: 3 } },
  odin: { name: 'Odin\'s Blade', esper: 'Odin', spells: [[1, 'edge'], [2, 'gungnir'], [3, 'zantetsu']], bonus: { atk: 3 } },
  valtheia: { name: 'Valtheia\'s Song', esper: 'Valtheia', spells: [[1, 'requiem'], [1, 'rebirth'], [1, 'cureAll']], bonus: { mag: 6, mdf: 6 } },
};

export function echoTier(state) {
  const relit = ['wsStone', 'wsTides', 'wsHeart', 'wsWind', 'wsOrigin'].filter((k) => state.flags[k]).length;
  return Math.min(3, 1 + Math.floor(relit / 2));
}

// Ability lists per command. Requirements: { flag } or { lv }.
const CMD_LISTS = {
  spirit: ['petal', 'mend', 'bloomLance', 'trance', 'morningStar'],
  salvage: ['shock', 'turret', 'decoy', 'patch', 'overclock'],
  steal: ['steal', 'mug', 'secondChance'],
  runic: ['runic', 'iceBlade', 'runicBlade'],
  tools: ['autoCrossbow', 'drill', 'flash', 'bioBlaster', 'chainsaw', 'royalTempest'],
  blitz: ['pummel', 'auraBolt', 'suplex', 'fireDance', 'mantra', 'royalTempest'],
  throw: ['throwStar', 'throwKnife', 'shadowfang'],
  sketch: ['sketch', 'paintSplat', 'livingCanvas'],
  dance: ['windSong', 'earthBlues', 'moogleWaltz', 'snowfallDance'],
  bulwark: ['shieldWall', 'counterStance', 'rally', 'unbrokenLine'],
  call: ['flurry', 'wolfRush', 'raptorWings', 'bearGuard', 'esperBloom'],
};

export function meetsReq(ab, c, state) {
  const r = ab.req;
  if (!r) return true;
  if (r.flag && !state.flags[r.flag]) return false;
  if (r.lv && c.lv < r.lv) return false;
  return true;
}

export function abilitiesFor(c, cmd, state) {
  if (cmd === 'echo') {
    if (!c.echo) return [];
    const tier = echoTier(state);
    return ECHOES[c.echo].spells.filter(([t]) => t <= tier).map(([, id]) => id);
  }
  if (cmd === 'lore') return Object.keys(state.lores || {}).filter((id) => ABIL[id]).concat(state.flags.ult_strago ? ['atonement'] : []);
  const list = CMD_LISTS[cmd] || [];
  return list.filter((id) => meetsReq(ABIL[id], c, state));
}

// ---------------------------------------------------------------- statuses
export const STATUS = {
  poison: { name: 'Poison', icon: 'poison', bad: true },
  sleep: { name: 'Sleep', icon: 'z', bad: true },
  blind: { name: 'Blind', icon: 'cloud', bad: true },
  silence: { name: 'Silence', icon: 'mute', bad: true },
  slow: { name: 'Slow', icon: 'slow', bad: true },
  stop: { name: 'Stop', icon: 'clock', bad: true },
  petrify: { name: 'Petrify', icon: null, bad: true },
  berserk: { name: 'Berserk', icon: 'vein', bad: true },
  confuse: { name: 'Confuse', icon: 'stars', bad: true },
  rest: { name: 'Rest', icon: null, bad: true }, // SOLACE's mercy: permanent sleep
  haste: { name: 'Haste', icon: 'fast' },
  protect: { name: 'Protect', icon: null },
  shell: { name: 'Shell', icon: null },
  regen: { name: 'Regen', icon: null },
  aegis: { name: 'Aegis', icon: null },
  trance: { name: 'Trance', icon: null },
};

// ---------------------------------------------------------------- items
export const ITEMS = {
  tonic: { name: 'Tonic', desc: 'Restores 60 HP.', target: 'ally', heal: 60, price: 40 },
  hiTonic: { name: 'Hi-Tonic', desc: 'Restores 220 HP.', target: 'ally', heal: 220, price: 180 },
  xTonic: { name: 'X-Tonic', desc: 'Restores 700 HP.', target: 'ally', heal: 700, price: 600 },
  ether: { name: 'Ether', desc: 'Restores 30 SP.', target: 'ally', sp: 30, price: 300 },
  elixir: { name: 'Elixir', desc: 'Fully restores HP and SP.', target: 'ally', heal: 99999, sp: 999, price: 3000 },
  salts: { name: 'Smelling Salts', desc: 'Revives a fallen ally.', target: 'koAlly', revive: 0.3, price: 120 },
  pinion: { name: 'Phoenix Pinion', desc: 'Revives with full HP.', target: 'koAlly', revive: 1, price: 900 },
  remedy: { name: 'Remedy', desc: 'Cures all ailments, even Rest.', target: 'ally', cure: true, price: 200 },
  smoke: { name: 'Smoke Pot', desc: 'Escape from most battles.', target: 'none', flee: true, price: 80 },
  shuriken: { name: 'Shuriken', desc: 'For Shadow to throw.', target: 'none', price: 60 },
  tent: { name: 'Tent', desc: 'Rest on the world map: full recovery.', target: 'none', field: true, price: 250 },
  // key items
  lens: { name: 'Cracked Lens', desc: 'A glass eye from the vault. Still faintly warm.', key: true },
  letter: { name: "Edgar's Letter", desc: 'Sealed with the Figaro crest.', key: true },
  verdance: { name: 'Verdance Igniter', desc: "Edgar's device. It relights a Wellspring.", key: true },
  diveSuit: { name: 'Dive Suit', desc: 'Brass helmet, rubber seams, hope.', key: true },
  pigmentRed: { name: 'Ember Pigment', desc: 'Red earth from Narshe\'s glowing veins.', key: true },
  pigmentBlue: { name: 'Tide Pigment', desc: 'Blue from the restored sea.', key: true },
  pigmentGreen: { name: 'Leaf Pigment', desc: 'Green from Doma\'s regrown forest.', key: true },
  darillLog: { name: "Darill's Flight Log", desc: 'Her handwriting, fast and laughing.', key: true },
  sevenBackup: { name: "Seven's Memory", desc: 'A backup of Seven, safe in Ilse\'s kit.', key: true },
  rachelLetters: { name: "Rachel's Letters", desc: 'Tied with faded ribbon.', key: true },
  elevenNames: { name: 'Eleven Names', desc: 'Ilse\'s list. Some names are crossed through with care.', key: true },
  domaLetters: { name: 'Soldiers\' Letters', desc: 'Final letters from Doma\'s fallen.', key: true },
  pamphlet: { name: 'Hush Pamphlet', desc: '"THE QUIETING IS MERCY. Lie down. Be still. Be loved."', key: true },
  festivalBell: { name: 'Festival Bell', desc: 'The moogles want it rung.', key: true },
};

// ---------------------------------------------------------------- equipment
const TIER_ATK = [8, 16, 26, 38, 52, 68];
const WEAPON_NAMES = {
  sword: ['Rusted Blade', 'Iron Sword', 'Mythril Sword', 'Runeblade', 'Lumina Blade', 'Ultima Edge'],
  knife: ['Dirk', 'Mythril Knife', 'Swift Kris', 'Kunai Edge', 'Valiant Knife', 'Last Fang'],
  lance: ['Pike', 'Mythril Lance', 'Partisan', 'Holy Lance', 'Dawn Spear', 'Longinus'],
  claw: ['Knuckle Wrap', 'Metal Knuckle', 'Mythril Claw', 'Tiger Fang', 'Dragon Claw', 'Monk\'s Fist'],
  katana: ['Ashigaru Blade', 'Kotetsu', 'Murasame', 'Ame-no-Kiri', 'Dawn Katana', 'Doma Heart'],
  cards: ['Worn Deck', 'Silver Deck', 'Gilt Deck', 'Fate Deck', 'Royal Flush', 'Falcon Deck'],
  brush: ['Hair Brush', 'Ink Brush', 'Mythril Brush', 'Aurora Brush', 'Rainbow Brush', 'Living Brush'],
  rod: ['Oak Rod', 'Mythril Rod', 'Sage Rod', 'Rune Staff', 'Magus Rod', 'Thamasa Rod'],
  wrench: ['Iron Wrench', 'Torque Bar', 'Mythril Spanner', 'Overdrive Key', 'Brass Heart', 'Vault Key'],
  club: ['Bone Club', 'Iron Bone', 'Yeti Femur', 'Glacier Club', 'Avalanche', 'Snowfall'],
  pick: ['Old Pick', 'Steel Pick', 'Mythril Pick', 'Deep Pick', 'Vein Pick', 'Heart Pick'],
};
export const GEAR = {};
for (const [cls, names] of Object.entries(WEAPON_NAMES)) {
  names.forEach((n, i) => {
    GEAR[cls + i] = { name: n, slot: 'weapon', cls, atk: TIER_ATK[i] + (cls === 'rod' || cls === 'brush' ? -4 : 0), mag: cls === 'rod' || cls === 'brush' ? 4 + i * 4 : 0, price: [100, 400, 1200, 3200, 7000, 0][i] };
  });
}
Object.assign(GEAR, {
  leatherVest: { name: 'Leather Vest', slot: 'armor', def: 6, mdf: 3, price: 120 },
  ironMail: { name: 'Iron Mail', slot: 'armor', def: 13, mdf: 5, price: 500 },
  mythrilVest: { name: 'Mythril Vest', slot: 'armor', def: 21, mdf: 12, price: 1400 },
  brassPlate: { name: 'Brass Plate', slot: 'armor', def: 31, mdf: 16, price: 3600 },
  esperSilk: { name: 'Esper Silk', slot: 'armor', def: 40, mdf: 34, price: 8000 },
  solaceShell: { name: 'Solace Shell', slot: 'armor', def: 52, mdf: 40, price: 0 },
  swiftBoots: { name: 'Swift Boots', slot: 'relic', spd: 5, price: 1500 },
  guardRing: { name: 'Guard Ring', slot: 'relic', startStatus: 'protect', price: 1800 },
  silverPin: { name: 'Silver Pin', slot: 'relic', spHalf: true, price: 2500 },
  ribbon: { name: 'Ribbon', slot: 'relic', immune: true, price: 0 },
  heroRing: { name: 'Hero Ring', slot: 'relic', atk: 8, mag: 8, price: 4000 },
  ashCharm: { name: 'Ash Charm', slot: 'relic', noEncounters: true, price: 3000 },
  blackBelt: { name: 'Black Belt', slot: 'relic', counter: 0.3, price: 2200 },
  lensCharm: { name: 'Amber Lens', slot: 'relic', mag: 6, mdf: 6, price: 0 },
  hermesSandal: { name: 'Wind Sandals', slot: 'relic', startStatus: 'haste', price: 5000 },
});

export function starterWeapon(c) {
  const cls = c.weapon;
  if (!cls || cls === 'none') return null;
  const t = c.lv >= 24 ? 3 : c.lv >= 16 ? 2 : c.lv >= 10 ? 1 : 0;
  return GEAR[cls + t] ? cls + t : null;
}

// Effective stats with gear and echo bonuses.
export function stats(c) {
  const s = { atk: c.atk, def: c.def, mag: c.mag, mdf: c.mdf, spd: c.spd, maxhp: c.maxhp };
  for (const slot of ['weapon', 'armor', 'relic']) {
    const g = c.gear && c.gear[slot] && GEAR[c.gear[slot]];
    if (!g) continue;
    for (const k of ['atk', 'def', 'mag', 'mdf', 'spd']) if (g[k]) s[k] += g[k];
  }
  if (c.echo && ECHOES[c.echo]) for (const [k, v] of Object.entries(ECHOES[c.echo].bonus)) s[k] = (s[k] || 0) + v;
  if (c.id === 'umaro' || c.id === 'gau') s.atk += 8 + c.lv; // no weapons, natural strength
  return s;
}
export function relic(c) { return c.gear && c.gear.relic ? GEAR[c.gear.relic] : null; }

// Shops: stock by name.
export const SHOPS = {
  figaro: { name: 'Figaro Quartermaster', stock: ['tonic', 'hiTonic', 'salts', 'smoke', 'tent', 'sword1', 'lance1', 'knife1', 'claw1', 'cards1', 'wrench1', 'ironMail', 'swiftBoots'] },
  narshe: { name: 'Narshe Outfitter', stock: ['tonic', 'hiTonic', 'salts', 'ether', 'remedy', 'tent', 'sword2', 'knife2', 'lance2', 'claw2', 'cards2', 'wrench2', 'club1', 'mythrilVest', 'guardRing'] },
  thamasa: { name: 'Thamasa Curios', stock: ['hiTonic', 'ether', 'remedy', 'salts', 'pinion', 'brush1', 'brush2', 'rod1', 'rod2', 'katana2', 'mythrilVest', 'silverPin'] },
  nikeah: { name: 'Nikeah Docks Market', stock: ['hiTonic', 'xTonic', 'ether', 'remedy', 'pinion', 'shuriken', 'tent', 'sword3', 'knife3', 'lance3', 'claw3', 'katana3', 'cards3', 'wrench3', 'brush3', 'rod3', 'club2', 'brassPlate', 'blackBelt', 'ashCharm'] },
  jidoor: { name: 'Jidoor Auction Salvage', stock: ['xTonic', 'ether', 'elixir', 'pinion', 'remedy', 'shuriken', 'sword4', 'knife4', 'lance4', 'claw4', 'katana4', 'cards4', 'wrench4', 'brush4', 'rod4', 'club3', 'esperSilk', 'heroRing', 'hermesSandal'] },
};

export function newState() {
  return {
    party: ['ilse', 'hale'],
    roster: ['ilse', 'hale'],
    chars: { ilse: makeChar('ilse'), hale: makeChar('hale') },
    items: { tonic: 4, salts: 1 },
    gear: {},
    shards: [],
    lores: {},
    rages: {},
    gp: 300,
    parts: 2,
    flags: {},
    propState: {},
    playtime: 0,
    chapterName: 'Prologue',
    leaderSprite: 'ilse',
    map: 'dig', x: 13, y: 16, dir: 'up',
    stilled: 0,
  };
}
