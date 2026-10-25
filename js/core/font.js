// Hand-set bitmap font: 7px cap height, 2px descenders, 1px tracking, drop shadow.
import { makeCanvas } from './gfx.js';
import { UI } from '../data/palette.js';

const G = {
  A: '.##./#..#/#..#/####/#..#/#..#/#..#',
  B: '###./#..#/#..#/###./#..#/#..#/###.',
  C: '.##./#..#/#.../#.../#.../#..#/.##.',
  D: '###./#..#/#..#/#..#/#..#/#..#/###.',
  E: '####/#.../#.../###./#.../#.../####',
  F: '####/#.../#.../###./#.../#.../#...',
  G: '.##./#..#/#.../#.##/#..#/#..#/.###',
  H: '#..#/#..#/#..#/####/#..#/#..#/#..#',
  I: '###/.#./.#./.#./.#./.#./###',
  J: '..##/...#/...#/...#/#..#/#..#/.##.',
  K: '#..#/#..#/#.#./##../#.#./#..#/#..#',
  L: '#.../#.../#.../#.../#.../#.../####',
  M: '#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#',
  N: '#..#/##.#/##.#/#.##/#.##/#..#/#..#',
  O: '.##./#..#/#..#/#..#/#..#/#..#/.##.',
  P: '###./#..#/#..#/###./#.../#.../#...',
  Q: '.##./#..#/#..#/#..#/#..#/#.#./.#.#',
  R: '###./#..#/#..#/###./#.#./#..#/#..#',
  S: '.###/#.../#.../.##./...#/...#/###.',
  T: '#####/..#../..#../..#../..#../..#../..#..',
  U: '#..#/#..#/#..#/#..#/#..#/#..#/.##.',
  V: '#...#/#...#/#...#/#...#/.#.#./.#.#./..#..',
  W: '#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#',
  X: '#...#/#...#/.#.#./..#../.#.#./#...#/#...#',
  Y: '#...#/#...#/.#.#./..#../..#../..#../..#..',
  Z: '####/...#/..#./.#../#.../#.../####',
  a: '..../..../.##./...#/.###/#..#/.###',
  b: '#.../#.../###./#..#/#..#/#..#/###.',
  c: '.../.../.##/#../#../#../.##',
  d: '...#/...#/.###/#..#/#..#/#..#/.###',
  e: '..../..../.##./#..#/####/#.../.###',
  f: '.##/#../###/#../#../#../#..',
  g: '..../..../.###/#..#/#..#/#..#/.###/...#/.##.',
  h: '#.../#.../###./#..#/#..#/#..#/#..#',
  i: '#/./#/#/#/#/#',
  j: '..#/.../..#/..#/..#/..#/..#/..#/##.',
  k: '#.../#.../#..#/#.#./##../#.#./#..#',
  l: '#./#./#./#./#./#./.#',
  m: '...../...../##.#./#.#.#/#.#.#/#.#.#/#.#.#',
  n: '..../..../###./#..#/#..#/#..#/#..#',
  o: '..../..../.##./#..#/#..#/#..#/.##.',
  p: '..../..../###./#..#/#..#/#..#/###./#.../#...',
  q: '..../..../.###/#..#/#..#/#..#/.###/...#/...#',
  r: '.../.../#.#/##./#../#../#..',
  s: '..../..../.###/#.../.##./...#/###.',
  t: '#../#../###/#../#../#../.##',
  u: '..../..../#..#/#..#/#..#/#..#/.###',
  v: '...../...../#...#/#...#/.#.#./.#.#./..#..',
  w: '...../...../#...#/#...#/#.#.#/#.#.#/.#.#.',
  x: '..../..../#..#/#..#/.##./#..#/#..#',
  y: '..../..../#..#/#..#/#..#/#..#/.###/...#/.##.',
  z: '..../..../####/...#/.##./#.../####',
  0: '.##./#..#/#..#/#..#/#..#/#..#/.##.',
  1: '.#./##./.#./.#./.#./.#./###',
  2: '.##./#..#/...#/..#./.#../#.../####',
  3: '###./...#/...#/.##./...#/...#/###.',
  4: '#..#/#..#/#..#/####/...#/...#/...#',
  5: '####/#.../#.../###./...#/...#/###.',
  6: '.##./#.../#.../###./#..#/#..#/.##.',
  7: '####/...#/...#/..#./.#../.#../.#..',
  8: '.##./#..#/#..#/.##./#..#/#..#/.##.',
  9: '.##./#..#/#..#/.###/...#/...#/.##.',
  ' ': '../../../../../../..',
  '.': '././././././#',
  ',': '././././././#/#',
  '!': '#/#/#/#/#/./#',
  '?': '.##./#..#/...#/..#./.#../..../.#..',
  "'": '#/#',
  '"': '#.#/#.#',
  ':': '././#/./././#',
  ';': '././#/./././#/#',
  '-': '.../.../.../###',
  '+': '.../.../.#./###/.#.',
  '/': '..#/..#/.#./.#./.#./#../#..',
  '(': '.#/#./#./#./#./#./.#',
  ')': '#./.#/.#/.#/.#/.#/#.',
  '[': '##/#./#./#./#./#./##',
  ']': '##/.#/.#/.#/.#/.#/##',
  '%': '#..#/...#/..#./.#../#.../#..#',
  '&': '.#../#.#./.#../.#.#/#.#./#..#/.##.',
  '*': '...../#.#.#/.###./#.#.#',
  '=': '.../.../###/.../###',
  '<': '.../..#/.#./#../.#./..#',
  '>': '.../#../.#./..#/.#./#..',
  '_': '..../..../..../..../..../..../####',
  '#': '.#.#./#####/.#.#./#####/.#.#.',
  '~': '.#.#/#.#.',
  '—': '...../...../...../#####',
  '…': '...../...../...../...../...../...../#.#.#',
  '♪': '..##/..#./..#./..#./.##./###./.#..',
  '♥': '.#.#./#####/#####/.###./..#..',
  '×': '.../.../#.#/.#./#.#',
};

// normalise smart punctuation
const ALIAS = { '’': "'", '‘': "'", '“': '"', '”': '"', '–': '-' };

const glyphs = {};
for (const [ch, def] of Object.entries(G)) {
  const rows = def.split('/');
  const w = Math.max(...rows.map((r) => r.length));
  glyphs[ch] = { rows, w };
}

export const LINE_H = 11;

const atlasCache = new Map();
function glyphCanvas(ch, color) {
  const key = ch + color;
  let c = atlasCache.get(key);
  if (c) return c;
  const g = glyphs[ch] || glyphs['?'];
  const { canvas, ctx } = makeCanvas(g.w, 9);
  ctx.fillStyle = color;
  g.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === '#') ctx.fillRect(x, y, 1, 1);
  });
  atlasCache.set(key, canvas);
  return canvas;
}

function glyphOf(ch) {
  ch = ALIAS[ch] || ch;
  return glyphs[ch] ? ch : '?';
}

export function charWidth(ch) {
  return glyphs[glyphOf(ch)].w + 1;
}

export function textWidth(str) {
  let w = 0;
  for (const ch of str) w += charWidth(ch);
  return Math.max(0, w - 1);
}

// Draw text with a 1px drop shadow (down-right, as light comes from the upper-left).
export function drawText(ctx, str, x, y, color = UI.text, shadow = UI.textShadow) {
  x = Math.round(x); y = Math.round(y);
  let cx = x;
  for (const raw of str) {
    const ch = glyphOf(raw);
    if (shadow) ctx.drawImage(glyphCanvas(ch, shadow), cx + 1, y + 1);
    ctx.drawImage(glyphCanvas(ch, color), cx, y);
    cx += glyphs[ch].w + 1;
  }
  return cx - x;
}

export function drawTextCentered(ctx, str, cx, y, color, shadow) {
  drawText(ctx, str, cx - Math.floor(textWidth(str) / 2), y, color, shadow);
}

export function drawTextRight(ctx, str, rx, y, color, shadow) {
  drawText(ctx, str, rx - textWidth(str), y, color, shadow);
}

// Word-wrap into lines no wider than maxW pixels. Honours explicit '\n'.
export function wrap(str, maxW) {
  const out = [];
  for (const para of str.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const test = line ? line + ' ' + word : word;
      if (textWidth(test) > maxW && line) { out.push(line); line = word; } else line = test;
    }
    out.push(line);
  }
  return out;
}

// Big bitmap digits for damage numbers (8x10 per guide; 12x14 for criticals is drawn 1px bolder).
const DIG = {
  0: '.####./##..##/##..##/##..##/##..##/##..##/##..##/.####.',
  1: '..##../.###../..##../..##../..##../..##../..##../.####.',
  2: '.####./##..##/....##/...##./..##../.##.../##..../######',
  3: '.####./##..##/....##/..###./....##/....##/##..##/.####.',
  4: '...##./..###./.####./##.##./######/...##./...##./...##.',
  5: '######/##..../##..../#####./....##/....##/##..##/.####.',
  6: '.####./##..../##..../#####./##..##/##..##/##..##/.####.',
  7: '######/....##/...##./...##./..##../..##../..##../..##..',
  8: '.####./##..##/##..##/.####./##..##/##..##/##..##/.####.',
  9: '.####./##..##/##..##/.#####/....##/....##/....##/.####.',
  M: '##...##/###.###/#######/##.#.##/##...##/##...##/##...##/##...##',
  I: '####/.##./.##./.##./.##./.##./.##./####',
  S: '.####./##..##/##..../.####./....##/....##/##..##/.####.',
};
const digCache = new Map();
export function digitSprite(ch, color, outline = UI.textShadow) {
  const key = ch + color;
  let c = digCache.get(key);
  if (c) return c;
  const rows = DIG[ch].split('/');
  const w = rows[0].length + 2, h = rows.length + 2;
  const { canvas, ctx } = makeCanvas(w, h);
  ctx.fillStyle = outline;
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === '#') {
      ctx.fillRect(x, y, 3, 3);
    }
  });
  ctx.fillStyle = color;
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === '#') ctx.fillRect(x + 1, y + 1, 1, 1);
  });
  digCache.set(key, canvas);
  return canvas;
}

export function drawNumber(ctx, str, x, y, color) {
  let cx = x;
  for (const ch of String(str)) {
    const s = digitSprite(ch, color);
    ctx.drawImage(s, cx, y);
    cx += s.width - 1;
  }
}
export function numberWidth(str) {
  let w = 0;
  for (const ch of String(str)) w += digitSprite(ch, '#FFFFFF').width - 1;
  return w + 1;
}

export function glyphRows(ch) { return (glyphs[glyphOf(ch)] || glyphs['?']).rows; }
