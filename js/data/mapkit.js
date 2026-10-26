// Helpers for authoring maps compactly.
import { hash } from './tiles.js';

export class Grid {
  constructor(w, h, fill = '.') { this.w = w; this.h = h; this.g = Array.from({ length: h }, () => Array(w).fill(fill)); }
  set(x, y, ch) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y][x] = ch; return this; }
  rect(x0, y0, x1, y1, ch) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, ch); return this; }
  border(ch = '#', t = 1) { for (let i = 0; i < t; i++) { this.rect(0, i, this.w - 1, i, ch); this.rect(0, this.h - 1 - i, this.w - 1, this.h - 1 - i, ch); this.rect(i, 0, i, this.h - 1, ch); this.rect(this.w - 1 - i, 0, this.w - 1 - i, this.h - 1, ch); } return this; }
  top(rows = 2, ch = '#') { return this.rect(0, 0, this.w - 1, rows - 1, ch); }
  path(pts, ch = ',', width = 1) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) for (let k = 0; k < width; k++) this.set(x, y0 + k, ch);
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let k = 0; k < width; k++) this.set(x1 + k, y, ch);
    }
    return this;
  }
  scatter(ch, chance, seed = 1, only = '.') { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.g[y][x] === only && hash(x, y, seed) < chance) this.g[y][x] = ch; return this; }
  rows() { return this.g.map((r) => r.join('')); }
}

// Carve floor rectangles out of a solid block (dungeons).
export function carve(w, h, rects, glyphChance = 0) {
  const G = new Grid(w, h, '#');
  for (const [x0, y0, x1, y1, ch = '.'] of rects) G.rect(x0, y0, x1, y1, ch);
  if (glyphChance) {
    const g = G.g;
    for (let y = 1; y < h; y++) for (let x = 0; x < w; x++) {
      if (g[y][x] !== '#') continue;
      const below = g[y + 1] && g[y + 1][x];
      const below2 = g[y + 2] && g[y + 2][x];
      const face = (below && below !== '#' && below !== 'G') || (below === '#' && below2 && below2 !== '#' && below2 !== 'G');
      if (face && hash(x >> 1, y, 77) < glyphChance) g[y][x] = 'G';
    }
  }
  return G;
}

// A small interior room: walls round the edge, a door gap at the bottom centre.
export function room(w, h, floor = '.') {
  const G = new Grid(w, h, floor);
  G.top(2).rect(0, 0, 1, h - 1, '#').rect(w - 2, 0, w - 1, h - 1, '#').rect(0, h - 2, w - 1, h - 1, '#');
  const dx = Math.floor(w / 2) - 1;
  G.rect(dx, h - 2, dx + 1, h - 1, floor);
  return G;
}

// Exit events along an open edge of a map back to the world (or any target story event).
export function edgeExits(w, h, edges = ['bottom'], run = 'toWorld') {
  const ev = [];
  for (const e of edges) {
    if (e === 'bottom') ev.push({ id: 'exitB', on: 'step', x: 0, y: h - 1, w, run });
    if (e === 'top') ev.push({ id: 'exitT', on: 'step', x: 0, y: 0, w, run });
    if (e === 'left') ev.push({ id: 'exitL', on: 'step', x: 0, y: 0, h, run });
    if (e === 'right') ev.push({ id: 'exitR', on: 'step', x: w - 1, y: 0, h, run });
  }
  return ev;
}

// NPC that runs a shop / inn when talked to.
export const shopkeeper = (id, x, y, shop, sprite = 'manB', dir = 'down') => ({ id, name: 'Shopkeeper', sprite, x, y, dir, talk: 'shop', shop });
export const innkeeper = (id, x, y, price = 50, sprite = 'woman', dir = 'down') => ({ id, name: 'Innkeeper', sprite, x, y, dir, talk: 'inn', price });
export const npc = (id, sprite, x, y, talk, o = {}) => ({ id, name: o.name || id, sprite, x, y, dir: o.dir || 'down', talk, ...o });
export const sayNpc = (id, sprite, x, y, lines, o = {}) => ({ id, name: o.name || id, sprite, x, y, dir: o.dir || 'down', talk: 'lines', lines, ...o });
