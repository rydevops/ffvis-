// Battle backgrounds: 384x160 painted scenes, horizon at 40%, ground in the lower half,
// built from master ramps with ordered dither. Each returns { far, mid, near } layers
// (mid/near drift slowly for parallax).
import { makeCanvas, bandGradient, ditherRect, Painter, bayer } from '../core/gfx.js';
import { R, OUTLINE } from '../data/palette.js';
import { hash } from '../data/tiles.js';

const BW = 384, BH = 160;

function layer() { return makeCanvas(BW * 2, BH); }

function ground(ctx, ramp, y0, rock) {
  for (let y = y0; y < BH; y++) {
    const t = (y - y0) / (BH - y0);
    const i = Math.min(4, Math.floor(1 + t * 3));
    ctx.fillStyle = ramp[i - 1 < 0 ? 0 : i - 1];
    ctx.fillRect(0, y, BW * 2, 1);
  }
  for (let i = 0; i < 160; i++) {
    const x = Math.floor(hash(i, 1, rock) * BW * 2), y = y0 + Math.floor(hash(i, 2, rock) * (BH - y0));
    ctx.fillStyle = ramp[Math.min(4, 2 + (i % 3))];
    ctx.fillRect(x, y, 2 + (i % 3), 1);
  }
}

const PAINT = {
  tunnel() {
    const far = layer(), mid = layer();
    const c = far.ctx;
    c.fillStyle = '#1E1610'; c.fillRect(0, 0, BW * 2, BH);
    bandGradient(c, 0, 0, BW * 2, 64, ['#2A2018', '#3A2418', '#44403A', '#4C4A3E']);
    ground(c, ['#8C5A34', '#734A2E', '#603C26', '#4A3020', '#3A2418'], 64, 3);
    // timber supports + lanterns on the far wall
    const m = mid.ctx;
    for (let x = 20; x < BW * 2; x += 120) {
      m.fillStyle = R.leather[3]; m.fillRect(x, 8, 8, 60); m.fillStyle = R.leather[2]; m.fillRect(x, 8, 3, 60);
      m.fillStyle = R.leather[2]; m.fillRect(x - 20, 6, 48, 6);
      m.fillStyle = '#FFC040'; m.fillRect(x + 30, 30, 4, 5); m.fillStyle = '#FFF8D0'; m.fillRect(x + 31, 31, 2, 2);
      ditherRect(m, x + 18, 18, 28, 28, '#F5D68A', 1);
    }
    return { far: far.canvas, mid: mid.canvas };
  },
  vault() {
    const far = layer(), mid = layer();
    const c = far.ctx;
    bandGradient(c, 0, 0, BW * 2, 64, ['#6E6858', '#9A927E', '#C4BCA6', '#E8E2D0']);
    ground(c, R.stone, 64, 5);
    // arcade of white arches with glass glyph strips
    const m = mid.ctx;
    for (let x = 0; x < BW * 2; x += 64) {
      m.fillStyle = R.stone[1]; m.fillRect(x, 0, 14, 66);
      m.fillStyle = R.stone[0]; m.fillRect(x, 0, 4, 66);
      m.fillStyle = R.stone[3]; m.fillRect(x + 12, 0, 2, 66);
      m.fillStyle = R.glass[2]; m.fillRect(x + 6, 20, 2, 30);
      m.fillStyle = R.glass[0]; m.fillRect(x + 6, 30, 2, 4);
      m.fillStyle = R.stone[2];
      for (let a = 0; a <= 50; a++) { const xx = x + 14 + a; const yy = Math.round(10 - Math.sin((a / 50) * Math.PI) * 8); m.fillRect(xx, yy, 1, 2); }
    }
    for (let x = 0; x < BW * 2; x += 2) if (bayer(x, 64, 2)) { m.fillStyle = R.stone[3]; m.fillRect(x, 64, 1, 2); }
    return { far: far.canvas, mid: mid.canvas };
  },
  ashen() {
    const far = layer(), mid = layer();
    const c = far.ctx;
    bandGradient(c, 0, 0, BW * 2, 64, [R.skyRuin[4], R.skyRuin[3], R.skyRuin[2], R.skyRuin[1], R.skyRuin[0]]);
    // ruined tower silhouette on the horizon
    c.fillStyle = R.skyRuin[3];
    for (let x = 0; x < BW * 2; x += 3) { const h = 6 + Math.abs(Math.sin(x * 0.05)) * 10 + (x > 300 && x < 360 ? 30 : 0); c.fillRect(x, 64 - h, 3, h); }
    ground(c, R.seaRuin, 64, 7);
    const m = mid.ctx; // dust bands
    for (let i = 0; i < 3; i++) ditherRect(m, 0, 70 + i * 26, BW * 2, 6, R.seaRuin[0], 1);
    return { far: far.canvas, mid: mid.canvas };
  },
  mobliz() {
    const far = layer(), mid = layer();
    const c = far.ctx;
    bandGradient(c, 0, 0, BW * 2, 64, [R.skyRuin[3], R.skyRuin[2], R.skyRuin[1], R.skyRuin[0]]);
    c.fillStyle = R.folRuin[3];
    for (let x = 0; x < BW * 2; x += 2) { const h = 8 + Math.sin(x * 0.02) * 5 + Math.sin(x * 0.07) * 2; c.fillRect(x, 64 - h, 2, h); }
    // cottages far off
    for (const x of [60, 240, 470, 640]) { c.fillStyle = R.cream[3]; c.fillRect(x, 46, 22, 14); c.fillStyle = R.tunicRed[3]; c.fillRect(x - 2, 40, 26, 7); }
    ground(c, R.folRuin, 64, 9);
    const m = mid.ctx;
    for (let i = 0; i < 6; i++) { m.fillStyle = R.skyRuin[0]; m.fillRect(i * 140, 12 + (i % 3) * 8, 40, 2); m.fillRect(i * 140 + 10, 10 + (i % 3) * 8, 22, 2); }
    return { far: far.canvas, mid: mid.canvas };
  },
  bloom() { // the impossible meadow: silent green, white flowers, a pale washed sky
    const far = layer(), mid = layer();
    const c = far.ctx;
    bandGradient(c, 0, 0, BW * 2, 64, [R.skyRuin[3], R.skyRuin[2], R.skyRuin[1], R.seaRuin[1]]);
    c.fillStyle = R.folSilent[4];
    for (let x = 0; x < BW * 2; x += 2) { const h = 4 + Math.sin(x * 0.03) * 3; c.fillRect(x, 64 - h, 2, h); }
    ground(c, [R.folSilent[2], R.folSilent[2], R.folSilent[3], R.folSilent[3], R.folSilent[4]], 64, 11);
    for (let i = 0; i < 260; i++) {
      const x = Math.floor(hash(i, 4) * BW * 2), y = 66 + Math.floor(hash(i, 5) * 94);
      c.fillStyle = R.stone[0]; c.fillRect(x, y, 1, 1); c.fillRect(x - 1, y + 1, 3, 1); c.fillRect(x, y + 2, 1, 1);
      c.fillStyle = i % 3 ? R.glass[1] : R.brass[0]; c.fillRect(x, y + 1, 1, 1);
    }
    const m = mid.ctx;
    for (let i = 0; i < 3; i++) ditherRect(m, i * 260, 50, 120, 8, R.folSilent[0], 1);
    return { far: far.canvas, mid: mid.canvas };
  },
  sparring() {
    const b = PAINT.mobliz();
    const m = b.mid.getContext('2d');
    // children's chalk ring
    for (let a = 0; a < 360; a += 3) { const r = a * Math.PI / 180; m.fillStyle = R.stone[1]; m.fillRect(192 + Math.cos(r) * 150, 112 + Math.sin(r) * 34, 2, 1); }
    return b;
  },
};

const cache = new Map();
export function battleBg(kind) {
  if (!cache.has(kind)) {
    const b = (PAINT[kind] || PAINT.vault)();
    const m = b.mid.getContext('2d');
    m.clearRect(BW, 0, BW, BH);
    m.drawImage(b.mid, 0, 0, BW, BH, BW, 0, BW, BH); // make the drifting layer seamless
    cache.set(kind, b);
  }
  return cache.get(kind);
}

export function drawBg(ctx, kind, frame) {
  const b = battleBg(kind);
  ctx.drawImage(b.far, 0, 0, BW, BH, 0, 0, BW, BH);
  const off = Math.floor(frame * 0.15) % BW; // slow ambient drift, whole pixels only
  ctx.drawImage(b.mid, off, 0, BW, BH, 0, 0, BW, BH);
}
