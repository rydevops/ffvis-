// The World of Ruin overworld: terrain, regions, locations, and how each region's palette
// state follows the Wellsprings (ruined -> restored; SOLACE's land goes silent).
import { Painter, bayer } from '../core/gfx.js';
import { R, OUTLINE } from './palette.js';
import { hash } from './tiles.js';

export const WW = 80, WH = 60;

// Terrain chars: '=' deep ocean, '~' ocean, ',' beach, '.' plains, 'g' grass, 'f' forest, 'h' hills,
// 'm' mountains, 'S' snowy peaks, 's' snowfield, 'd' desert, 'w' swamp, 'a' ash waste, 'x' silent growth
export const WORLD_KIND = { '=': 'deep', '~': 'ocean', ',': 'beach', '.': 'plains', g: 'grass', f: 'forest', h: 'hills', m: 'mountain', S: 'peak', s: 'snow', d: 'desert', w: 'swamp', a: 'ash', x: 'silent' };
export const WALK_BLOCK = new Set(['deep', 'ocean', 'mountain', 'peak']);
export const SAIL_OK = new Set(['ocean', 'deep']);

// Regions and the Wellspring that restores them.
export const REGIONS = {
  north: { name: 'The North', flag: 'wsStone', centre: [32, 8] },
  west: { name: 'The West', flag: 'wsWind', centre: [16, 38] },
  central: { name: 'The Heartland', flag: 'wsOrigin', centre: [46, 38] },
  east: { name: 'The East', flag: 'wsHeart', centre: [68, 30] },
  sea: { name: 'The Sea', flag: 'wsTides' },
  sky: { name: 'The Sky', flag: 'wsWind' },
};

export function regionState(region, flags) {
  if (!region) return 'ruin';
  if (flags.wsOrigin) return 'rest';
  const r = REGIONS[region];
  if (region === 'central' && flags.bloomSpread) return 'silent';
  return r && flags[r.flag] ? 'rest' : 'ruin';
}

// ---------------------------------------------------------------- generation
const BLOBS = [ // continents as unions of ellipses: [cx, cy, rx, ry]
  [14, 36, 11, 15], [22, 44, 9, 8], [10, 26, 7, 6], [24, 29, 4, 4], [14, 50, 7, 5], // west
  [32, 10, 15, 7], [42, 8, 8, 5], [24, 14, 6, 4], // north
  [47, 37, 10, 11], [44, 48, 8, 6], [53, 46, 6, 6], [39, 25, 4, 4], // central
  [67, 26, 10, 18], [72, 14, 7, 7], [64, 40, 8, 7], [74, 32, 5, 6], // east
  [73, 54, 4, 3], [9, 56, 3, 2], [53, 5, 2, 2], // islands: Thamasa, Solitary, Zone Eater
];
const RIDGES = [ // mountain ridges: line segments
  [[6, 30], [16, 22]], [[26, 8], [40, 12]], [[44, 4], [50, 8]], [[40, 30], [52, 26]], [[60, 12], [62, 30]], [[30, 40], [34, 48]],
];

function segDist(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export const LOCATIONS = [
  // id, name, x, y, icon, iconState, map, spawn [x, y, dir], show-flag (null = always)
  { id: 'mobliz', name: 'Mobliz', x: 8, y: 44, icon: 'iconTown', map: 'mobliz', spawn: [20, 25, 'up'] },
  { id: 'figaro', name: 'Figaro Castle', x: 19, y: 35, icon: 'iconCastle', map: 'figaro', spawn: [14, 24, 'up'], big: true },
  { id: 'southFigaro', name: 'South Figaro', x: 22, y: 46, icon: 'iconPort', map: 'southFigaro', spawn: [14, 21, 'up'] },
  { id: 'kohlingen', name: 'Kohlingen', x: 11, y: 25, icon: 'iconTown', iconState: 'grey', map: 'kohlingen', spawn: [12, 17, 'up'] },
  { id: 'hollowmere', name: 'Hollowmere', x: 16, y: 29, icon: 'iconTown', iconState: 'grey', map: 'hollowmere', spawn: [14, 21, 'up'] },
  { id: 'opera', name: 'Opera House', x: 26, y: 27, icon: 'iconOpera', map: 'opera', spawn: [10, 13, 'up'], flag: 'act2' },
  { id: 'jidoor', name: 'Jidoor', x: 13, y: 51, icon: 'iconTown', iconState: 'plum', map: 'jidoor', spawn: [12, 17, 'up'], flag: 'act2' },
  { id: 'solitary', name: 'Solitary Island', x: 9, y: 56, icon: 'iconTown', iconState: 'green', map: 'solitary', spawn: [8, 12, 'up'], flag: 'act2' },
  { id: 'narshe', name: 'Narshe', x: 30, y: 9, icon: 'iconTown', iconState: 'grey+snow', map: 'narshe', spawn: [14, 25, 'up'] },
  { id: 'dragonsNeck', name: "Dragon's Neck", x: 43, y: 6, icon: 'iconPeak', map: null, event: 'armadaApproach', flag: 'm7Done' },
  { id: 'zozo', name: 'Zozo', x: 37, y: 24, icon: 'iconRuin', map: 'zozo', spawn: [14, 22, 'up'], flag: 'zozoOpen' },
  { id: 'tower', name: "Kefka's Tower", x: 46, y: 31, icon: 'iconTower', map: null, event: 'towerRuins' },
  { id: 'ashen', name: 'Ashen Reach', x: 51, y: 37, icon: 'iconRuin', map: 'ashen', spawn: [28, 9, 'left'] },
  { id: 'albrook', name: 'Albrook', x: 40, y: 49, icon: 'iconPort', map: 'albrook', spawn: [15, 21, 'up'], flag: 'silentHour' },
  { id: 'tzen', name: 'Tzen', x: 55, y: 44, icon: 'iconTown', iconState: 'brick', map: 'tzen', spawn: [12, 17, 'up'], flag: 'act2' },
  { id: 'maranda', name: 'Maranda', x: 48, y: 52, icon: 'iconTown', iconState: 'brick', map: 'maranda', spawn: [14, 21, 'up'], flag: 'act2' },
  { id: 'veldt', name: 'The Veldt', x: 64, y: 41, icon: 'iconGlyph', map: 'veldt', spawn: [4, 12, 'right'] },
  { id: 'doma', name: 'Doma Castle', x: 66, y: 18, icon: 'iconCastle', iconState: 'eastern', map: 'doma', spawn: [15, 25, 'up'], big: true, flag: 'act2' },
  { id: 'nikeah', name: 'Nikeah', x: 74, y: 30, icon: 'iconPort', map: 'nikeah', spawn: [14, 21, 'up'], flag: 'act2' },
  { id: 'esperGate', name: 'Sealed Gate', x: 72, y: 10, icon: 'iconCave', iconState: 'spirit', map: 'esperRuins', spawn: [14, 38, 'up'], flag: 'm6Done' },
  { id: 'thamasa', name: 'Thamasa', x: 72, y: 53, icon: 'iconTown', iconState: 'green', map: 'thamasa', spawn: [15, 23, 'up'], flag: 'act2' },
  { id: 'zoneEater', name: 'Zone Eater', x: 53, y: 4, icon: 'iconCave', map: 'zoneEater', spawn: [10, 14, 'up'], flag: 'act3' },
  { id: 'trench', name: 'Serpent Trench', x: 32, y: 37, icon: 'iconSea', map: null, event: 'diveTrench', sea: true, flag: 'm7Done' },
];

let cached = null;
export function buildWorld() {
  if (cached) return cached;
  const rows = [];
  const region = [];
  for (let y = 0; y < WH; y++) {
    let row = '';
    const rrow = [];
    for (let x = 0; x < WW; x++) {
      let land = -1;
      for (const [cx, cy, rx, ry] of BLOBS) land = Math.max(land, 1 - Math.hypot((x - cx) / rx, (y - cy) / ry));
      land += (hash(x >> 1, y >> 1, 11) - 0.5) * 0.35 + (hash(x, y, 12) - 0.5) * 0.12;
      // which region?
      let best = 'west', bd = 1e9;
      for (const [k, r] of Object.entries(REGIONS)) {
        if (!r.centre) continue;
        const d = Math.hypot(x - r.centre[0], (y - r.centre[1]) * 1.2);
        if (d < bd) { bd = d; best = k; }
      }
      let ch;
      if (land <= 0) {
        // deep water far from land
        let near = false;
        for (let dy = -3; dy <= 3 && !near; dy++) for (let dx = -3; dx <= 3 && !near; dx++) {
          for (const [cx, cy, rx, ry] of BLOBS) if (1 - Math.hypot((x + dx - cx) / rx, (y + dy - cy) / ry) > 0.05) { near = true; break; }
        }
        ch = near ? '~' : '=';
        rrow.push('sea');
      } else {
        const ridge = Math.min(...RIDGES.map(([a, b]) => segDist(x, y, a, b)));
        const n = hash(x >> 2, y >> 2, 21);
        if (land < 0.08) ch = best === 'north' ? 's' : best === 'central' ? 'a' : ',';
        else if (ridge < 1.3) ch = best === 'north' ? 'S' : 'm';
        else if (ridge < 2.5) ch = best === 'north' ? 's' : 'h';
        else if (best === 'north') ch = n < 0.25 ? 'f' : 's';
        else if (best === 'west') ch = Math.hypot(x - 20, y - 36) < 6 ? 'd' : n < 0.3 ? 'f' : n < 0.4 ? 'w' : '.';
        else if (best === 'central') ch = n < 0.2 ? 'h' : 'a';
        else ch = y > 34 ? (n < 0.2 ? 'f' : 'g') : n < 0.55 ? 'f' : '.';
        rrow.push(best);
      }
      row += ch;
    }
    rows.push(row);
    region.push(rrow);
  }
  // clear the ground around every location so it is reachable
  const g = rows.map((r) => [...r]);
  for (const L of LOCATIONS) {
    if (L.sea) { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 2; dx++) g[L.y + dy][L.x + dx] = '~'; continue; }
    const s = L.big ? 3 : 2;
    for (let dy = -1; dy <= s; dy++) for (let dx = -1; dx <= s; dx++) {
      const yy = L.y + dy, xx = L.x + dx;
      if (yy < 0 || xx < 0 || yy >= WH || xx >= WW) continue;
      const k = WORLD_KIND[g[yy][xx]];
      if (k === 'mountain' || k === 'peak' || k === 'deep' || k === 'ocean') g[yy][xx] = region[yy][xx] === 'north' ? 's' : region[yy][xx] === 'central' ? 'a' : '.';
      if (region[yy][xx] === 'sea') region[yy][xx] = REGIONS.west.centre && 'west';
    }
  }
  // land bridges so the continents can be walked in Act I (west <-> north, west <-> central)
  const bridge = (x0, y0, x1, y1) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1]]) {
        if (WORLD_KIND[g[y + dy][x + dx]] === 'deep' || WORLD_KIND[g[y + dy][x + dx]] === 'ocean' || WORLD_KIND[g[y + dy][x + dx]] === 'mountain' || WORLD_KIND[g[y + dy][x + dx]] === 'peak') g[y + dy][x + dx] = ',';
        if (region[y + dy][x + dx] === 'sea') region[y + dy][x + dx] = 'west';
      }
    }
  };
  bridge(18, 22, 26, 14); // west -> Narshe
  bridge(24, 34, 36, 30); // west -> central
  bridge(54, 36, 60, 34); // central -> east (the Veldt)
  cached = { rows: g.map((r) => r.join('')), region };
  return cached;
}

// Encounter tables by region and act.
export const WORLD_ENC = {
  north: [[['snowWolf', 'snowWolf'], ['mineBat', 'mineBat', 'mineBat'], ['snowWolf', 'mineBat']], [['snowWolf', 'snowWolf', 'snowWolf'], ['crawler', 'snowWolf']], [['stalker', 'snowWolf'], ['bloomHound', 'snowWolf']]],
  west: [[['burrower', 'burrower'], ['hushAcolyte', 'hushAcolyte'], ['burrower', 'vaultMite']], [['hushZealot', 'hushAcolyte'], ['inkMoth', 'inkMoth'], ['burrower', 'burrower', 'burrower']], [['siegebreaker', 'hushZealot'], ['stalker', 'stalker']]],
  central: [[['vaultMite', 'vaultMite', 'vaultMite'], ['sentinel', 'vaultMite']], [['gunDrone', 'vaultMite'], ['sentinel', 'sentinel'], ['hushZealot', 'gunDrone']], [['gardener', 'bloomHound'], ['thornChoir', 'gardener'], ['bloomHound', 'bloomHound']]],
  east: [[['burrower', 'mineBat'], ['seedDrone', 'seedDrone']], [['crawler', 'crawler'], ['cryptMoss', 'inkMoth'], ['coralEel', 'lanternFish']], [['stalker', 'bloomHound'], ['gardener', 'cryptMoss']]],
};
export function actOf(flags) { return flags.act3 ? 2 : flags.act2 ? 1 : 0; }
export const WORLD_BG = { north: 'snowfield', west: 'plains', central: 'wasteland', east: 'forest' };

// ---------------------------------------------------------------- world tiles (miniature scale)
const tcache = new Map();
function ground(state, region) {
  if (state === 'silent') return R.folSilent;
  if (state === 'rest') return region === 'central' ? R.folRest : R.folRest;
  return region === 'central' ? R.seaRuin : R.folRuin;
}
export function worldTile(kind, state, region, x, y, frame = 0) {
  const v = Math.floor(hash(x, y, 31) * 4);
  const key = kind + state + region + v + (kind === 'ocean' || kind === 'deep' ? frame : 0) + ':' + ((x + y) % 2);
  let c = tcache.get(key);
  if (c) return c;
  const p = new Painter(16, 16);
  const G = ground(state, region);
  const sea = state === 'rest' ? R.seaRest : R.seaRuin;
  const snow = state === 'rest' ? R.snowRest : R.snowRuin;
  const tree = (cx, cy, g = G) => { p.rect(cx, cy + 3, 1, 2, R.leather[3]); p.ellipse(cx, cy + 1, 2.5, 2.5, g); };
  switch (kind) {
    case 'deep': case 'ocean': {
      const r = kind === 'deep' ? [sea[3], sea[3], sea[4], sea[4], sea[4]] : state === 'rest' ? sea : [sea[2], sea[2], sea[3], sea[4], sea[4]];
      p.rect(0, 0, 16, 16, r[2]);
      for (let yy = 0; yy < 16; yy++) for (let xx = 0; xx < 16; xx++) if (bayer(xx, yy, 1) && (xx + yy * 2 + frame * 2 + v * 3) % 11 === 0) p.set(xx, yy, kind === 'deep' ? r[3] : r[1]);
      break;
    }
    case 'beach': p.rect(0, 0, 16, 16, R.sand[1]); for (let i = 0; i < 5; i++) p.set((i * 7 + v * 3) % 16, (i * 5 + v) % 16, R.sand[2]); break;
    case 'plains': case 'grass': case 'ash': case 'silent': case 'swamp': {
      const gg = kind === 'ash' && state !== 'rest' && state !== 'silent' ? [R.seaRuin[0], R.seaRuin[0], R.seaRuin[1], R.seaRuin[2], R.seaRuin[3]] : kind === 'silent' ? R.folSilent : G;
      p.rect(0, 0, 16, 16, gg[kind === 'grass' ? 1 : 2]);
      for (let yy = 0; yy < 16; yy += 2) for (let xx = (yy / 2) % 2; xx < 16; xx += 3) if (hash(x * 16 + xx, y * 16 + yy, 7) < 0.3) p.set(xx, yy, gg[kind === 'grass' ? 2 : 3]);
      if (kind === 'swamp') { p.ellipse(5, 6, 3, 2, sea[2]); p.ellipse(11, 11, 3, 2, sea[2]); }
      if (kind === 'silent' || state === 'silent') for (let i = 0; i < 3; i++) p.set(3 + i * 5, 4 + (i * 7 + v) % 9, R.stone[0]);
      if (kind === 'ash' && state === 'ruin') p.line(2, 4 + v, 9, 9, R.seaRuin[3]);
      break;
    }
    case 'forest': p.rect(0, 0, 16, 16, G[3]); tree(4, 3); tree(11, 5); tree(6, 9); tree(13, 11); break;
    case 'hills': p.rect(0, 0, 16, 16, G[2]); p.ellipse(5, 10, 5, 4, G); p.ellipse(12, 8, 4, 3, G, { offset: 1 }); break;
    case 'mountain': case 'peak': {
      const rock = R.iron;
      p.rect(0, 0, 16, 16, kind === 'peak' ? snow[2] : G[3]);
      for (let yy = 1; yy < 16; yy++) { const half = Math.floor(yy * 0.55); for (let xx = 8 - half; xx <= 8 + half; xx++) p.set(xx, yy, xx < 8 ? rock[1] : rock[2]); }
      for (let yy = 1; yy < 5; yy++) for (let xx = 8 - yy; xx <= 8 + yy; xx++) p.set(xx, yy, kind === 'peak' || region === 'north' ? snow[1] : rock[0]);
      break;
    }
    case 'snow': p.rect(0, 0, 16, 16, snow[1]); for (let i = 0; i < 4; i++) p.set((i * 5 + v) % 16, (i * 3 + v * 2) % 16, snow[2]); break;
    case 'desert': p.rect(0, 0, 16, 16, R.sand[1]); for (let xx = 0; xx < 16; xx++) p.set(xx, 6 + Math.round(Math.sin(xx * 0.6 + v) * 1.5), R.sand[2]); break;
  }
  c = p.toCanvas();
  tcache.set(key, c);
  return c;
}
void OUTLINE;
