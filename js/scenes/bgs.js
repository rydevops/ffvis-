// Battle backgrounds: 384x160 painted scenes, horizon at 40%, ground in the lower half, built
// from master ramps with ordered dither. Each has a far layer and a slowly drifting mid layer.
// State-aware: ruined / restored / silent ground, and the sky clears after the Wellspring of Wind.
import { makeCanvas, bandGradient, ditherRect, bayer } from '../core/gfx.js';
import { R, EL, OUTLINE } from '../data/palette.js';
import { hash } from '../data/tiles.js';
import { game } from '../game.js';

const BW = 384, BH = 160, HZ = 64;
function layer() { return makeCanvas(BW * 2, BH); }

function ground(ctx, ramp, y0 = HZ, seed = 3) {
  for (let y = y0; y < BH; y++) {
    const t = (y - y0) / (BH - y0);
    ctx.fillStyle = ramp[Math.min(3, Math.floor(t * 4))];
    ctx.fillRect(0, y, BW * 2, 1);
  }
  for (let y = y0; y < BH; y += 6) { const t = (y - y0) / (BH - y0); ditherRect(ctx, 0, y - 2, BW * 2, 2, ramp[Math.min(3, Math.floor(t * 4)) + 1] || ramp[4], 1); }
  for (let i = 0; i < 180; i++) {
    const x = Math.floor(hash(i, 1, seed) * BW * 2), y = y0 + Math.floor(hash(i, 2, seed) * (BH - y0));
    ctx.fillStyle = ramp[Math.min(4, 2 + (i % 3))];
    ctx.fillRect(x, y, 2 + (i % 3), 1);
  }
}
function sky(ctx, rest, h = HZ) {
  const r = rest ? R.skyRest : R.skyRuin;
  bandGradient(ctx, 0, 0, BW * 2, h, rest ? [r[3], r[2], r[1], r[0]] : [r[4], r[3], r[2], r[1], r[0]]);
}
function silhouette(ctx, col, base, fn) { ctx.fillStyle = col; for (let x = 0; x < BW * 2; x += 2) { const h = fn(x); ctx.fillRect(x, base - h, 2, h); } }
function clouds(ctx, col, y = 12, n = 6) { for (let i = 0; i < n; i++) { const x = i * 140 + (i % 2) * 40, yy = y + (i % 3) * 9; ctx.fillStyle = col; ctx.fillRect(x, yy, 46, 3); ctx.fillRect(x + 8, yy - 2, 28, 2); ditherRect(ctx, x - 6, yy + 3, 58, 2, col, 2); } }
function trees(ctx, ramp, base, n, seed = 1) {
  for (let i = 0; i < n; i++) {
    const x = Math.floor(hash(i, seed, 9) * BW * 2), h = 18 + Math.floor(hash(i, seed, 8) * 16);
    ctx.fillStyle = R.leather[3]; ctx.fillRect(x + 5, base - 8, 3, 8);
    for (let r = 0; r < h; r++) { const half = Math.floor((r / h) * 8) + 1; ctx.fillStyle = r < 3 ? ramp[1] : r % 5 ? ramp[2] : ramp[3]; ctx.fillRect(x + 6 - half, base - 8 - h + r, half * 2, 1); }
  }
}

const S = R.stone, B = R.brass, G = R.glass;

const PAINT = {
  // ---------------- outdoors (state: ruin / rest / silent)
  plains(st, rest) {
    const far = layer(), mid = layer();
    sky(far.ctx, rest);
    const g = st === 'silent' ? R.folSilent : st === 'rest' ? R.folRest : R.folRuin;
    silhouette(far.ctx, g[3], HZ, (x) => 8 + Math.sin(x * 0.02) * 5 + Math.sin(x * 0.07) * 2);
    ground(far.ctx, g, HZ, 9);
    clouds(mid.ctx, rest ? R.skyRest[0] : R.skyRuin[0]);
    return { far: far.canvas, mid: mid.canvas };
  },
  snowfield(st, rest) {
    const far = layer(), mid = layer();
    sky(far.ctx, rest);
    const sn = st === 'rest' ? R.snowRest : R.snowRuin;
    silhouette(far.ctx, R.iron[2], HZ, (x) => 14 + Math.abs(Math.sin(x * 0.015)) * 26 + Math.sin(x * 0.09) * 3);
    silhouette(far.ctx, sn[1], HZ - 20, (x) => Math.max(0, Math.abs(Math.sin(x * 0.015)) * 26 - 18));
    ground(far.ctx, sn, HZ, 13);
    for (let i = 0; i < 60; i++) { mid.ctx.fillStyle = sn[0]; mid.ctx.fillRect(Math.floor(hash(i, 3) * BW * 2), Math.floor(hash(i, 4) * BH), 1, 1); }
    return { far: far.canvas, mid: mid.canvas };
  },
  forest(st, rest) {
    const far = layer(), mid = layer();
    sky(far.ctx, rest);
    const g = st === 'silent' ? R.folSilent : st === 'rest' ? R.folRest : R.folRuin;
    silhouette(far.ctx, g[4], HZ, (x) => 16 + Math.sin(x * 0.05) * 6 + (Math.floor(x / 10) % 3) * 3);
    ground(far.ctx, [g[2], g[3], g[3], g[4], g[4]], HZ, 15);
    trees(mid.ctx, g, HZ + 6, 10, 2);
    return { far: far.canvas, mid: mid.canvas };
  },
  desert(st, rest) {
    const far = layer(), mid = layer();
    sky(far.ctx, rest);
    silhouette(far.ctx, R.sand[3], HZ, (x) => 6 + Math.sin(x * 0.012) * 6);
    ground(far.ctx, R.sand, HZ, 17);
    for (let i = 0; i < 3; i++) ditherRect(mid.ctx, i * 260, 70 + i * 24, 140, 4, R.sand[0], 1);
    return { far: far.canvas, mid: mid.canvas };
  },
  wasteland(st, rest) {
    const far = layer(), mid = layer();
    sky(far.ctx, rest);
    const g = st === 'silent' ? R.folSilent : st === 'rest' ? R.folRest : R.seaRuin;
    silhouette(far.ctx, st === 'silent' ? R.stone[2] : R.skyRuin[3], HZ, (x) => 6 + Math.abs(Math.sin(x * 0.05)) * 10 + (x > 300 && x < 360 ? 30 : 0));
    ground(far.ctx, g, HZ, 7);
    if (st === 'silent') for (let i = 0; i < 160; i++) { far.ctx.fillStyle = S[0]; far.ctx.fillRect(Math.floor(hash(i, 4) * BW * 2), 66 + Math.floor(hash(i, 5) * 94), 1, 1); }
    for (let i = 0; i < 3; i++) ditherRect(mid.ctx, 0, 70 + i * 26, BW * 2, 6, R.seaRuin[0], 1);
    return { far: far.canvas, mid: mid.canvas };
  },
  beach(st, rest) {
    const far = layer(), mid = layer();
    sky(far.ctx, rest);
    const sea = st === 'rest' || game.state?.flags?.wsTides ? R.seaRest : R.seaRuin;
    bandGradient(far.ctx, 0, HZ - 14, BW * 2, 30, [sea[1], sea[2], sea[3]]);
    ground(far.ctx, R.sand, HZ + 16, 19);
    clouds(mid.ctx, rest ? R.skyRest[0] : R.skyRuin[0]);
    return { far: far.canvas, mid: mid.canvas };
  },
  dream() { // the World of Balance, remembered
    const b = PAINT.plains('rest', true);
    const c = b.far.getContext('2d');
    for (let i = 0; i < 200; i++) { const x = Math.floor(hash(i, 6) * BW * 2), y = 70 + Math.floor(hash(i, 7) * 90); c.fillStyle = i % 3 ? R.spirit[1] : R.brass[0]; c.fillRect(x, y, 1, 1); }
    return b;
  },
  // ---------------- interiors and set pieces
  mine(st) {
    const far = layer(), mid = layer();
    const c = far.ctx;
    c.fillStyle = '#1E1C1A'; c.fillRect(0, 0, BW * 2, BH);
    bandGradient(c, 0, 0, BW * 2, HZ, ['#221E1C', '#33302C', '#443E38', '#585048']);
    ground(c, ['#6E6458', '#585048', '#443E38', '#33302C', '#221E1C'], HZ, 21);
    const vein = st === 'rest' ? EL.fire : R.brass;
    for (let i = 0; i < 40; i++) { c.fillStyle = vein[i % 3]; c.fillRect(Math.floor(hash(i, 8) * BW * 2), 8 + Math.floor(hash(i, 9) * 50), 3, 2); }
    for (let x = 30; x < BW * 2; x += 140) { mid.ctx.fillStyle = R.leather[3]; mid.ctx.fillRect(x, 6, 8, 60); mid.ctx.fillRect(x - 22, 4, 52, 6); }
    return { far: far.canvas, mid: mid.canvas };
  },
  castle() {
    const far = layer(), mid = layer();
    const c = far.ctx;
    bandGradient(c, 0, 0, BW * 2, HZ, [R.sand[3], R.sand[2], R.sand[1]]);
    for (let y = 4; y < HZ; y += 8) { c.fillStyle = R.sand[3]; c.fillRect(0, y, BW * 2, 1); }
    ground(c, R.sand, HZ, 23);
    for (let x = 0; x < BW * 2; x += 90) { mid.ctx.fillStyle = B[2]; mid.ctx.fillRect(x, 0, 6, HZ); mid.ctx.fillStyle = B[1]; mid.ctx.fillRect(x, 0, 2, HZ); mid.ctx.fillStyle = R.navy[2]; mid.ctx.fillRect(x + 30, 6, 20, 36); }
    return { far: far.canvas, mid: mid.canvas };
  },
  town(st, rest) {
    const b = PAINT.plains(st === 'silent' ? 'ruin' : st, rest);
    const c = b.far.getContext('2d');
    for (const x of [30, 120, 250, 400, 520, 640]) { c.fillStyle = R.cream[3]; c.fillRect(x, 40, 34, 24); c.fillStyle = R.tunicRed[3]; c.fillRect(x - 3, 32, 40, 9); c.fillStyle = st === 'silent' ? R.night[3] : B[1]; c.fillRect(x + 12, 48, 6, 6); }
    return b;
  },
  mural(st, rest) {
    const far = layer(), mid = layer();
    const c = far.ctx;
    c.fillStyle = R.cream[1]; c.fillRect(0, 0, BW * 2, HZ);
    const cols = st === 'rest' ? [R.folRest[1], R.skyRest[1], R.spirit[1], B[0]] : [R.folRuin[1], R.seaRuin[1], R.plum[2], R.sand[2]];
    for (let x = 0; x < BW * 2; x += 48) { c.fillStyle = cols[(x / 48) % 4]; c.fillRect(x + 4, 10, 40, 40); c.fillStyle = cols[(x / 48 + 1) % 4]; c.fillRect(x + 12, 24, 22, 18); }
    ground(c, st === 'rest' ? R.folRest : R.folRuin, HZ, 25);
    return { far: far.canvas, mid: mid.canvas };
  },
  archive() {
    const far = layer(), mid = layer();
    const c = far.ctx;
    c.fillStyle = '#1E1418'; c.fillRect(0, 0, BW * 2, BH);
    const books = [R.tunicRed[3], R.farmBlue[3], R.moss[3], B[3], R.plum[3]];
    for (let y = 4; y < HZ; y += 14) { c.fillStyle = R.leather[3]; c.fillRect(0, y + 12, BW * 2, 2); for (let x = 0; x < BW * 2; x += 4) { c.fillStyle = books[(x / 4 + y) % 5]; c.fillRect(x, y + 2 + ((x / 4) % 3), 3, 10 - ((x / 4) % 3)); } }
    ground(c, R.leather, HZ, 27);
    for (let i = 0; i < 30; i++) { mid.ctx.fillStyle = R.seaRuin[0]; mid.ctx.fillRect(Math.floor(hash(i, 5) * BW * 2), Math.floor(hash(i, 6) * BH), 2, 1); }
    return { far: far.canvas, mid: mid.canvas };
  },
  spirit() {
    const far = layer(), mid = layer();
    const c = far.ctx;
    bandGradient(c, 0, 0, BW * 2, BH, [R.night[4], R.violet[4], R.violet[3], R.violet[4]]);
    for (let i = 0; i < 120; i++) { c.fillStyle = i % 4 ? R.spirit[1] : '#FFFFFF'; c.fillRect(Math.floor(hash(i, 7) * BW * 2), Math.floor(hash(i, 8) * BH), 1, 1); }
    ground(c, R.violet, HZ + 20, 29);
    for (let i = 0; i < 6; i++) { const x = i * 130 + 20, y = 20 + (i % 3) * 12; mid.ctx.fillStyle = R.violet[2]; mid.ctx.fillRect(x, y, 40, 8); mid.ctx.fillStyle = R.violet[1]; mid.ctx.fillRect(x, y, 40, 2); mid.ctx.fillStyle = R.spirit[1]; mid.ctx.fillRect(x + 18, y - 10, 3, 10); }
    return { far: far.canvas, mid: mid.canvas };
  },
  drowned(st) {
    const far = layer(), mid = layer();
    const c = far.ctx;
    const sea = st === 'rest' ? R.seaRest : R.seaRuin;
    bandGradient(c, 0, 0, BW * 2, BH, [sea[2], sea[3], sea[4], sea[4]]);
    for (let x = 0; x < BW * 2; x += 70) { c.fillStyle = S[3]; c.fillRect(x, 10, 10, HZ + 20); c.fillStyle = S[2]; c.fillRect(x, 10, 3, HZ + 20); }
    ground(c, R.sand, HZ + 20, 31);
    if (st === 'rest') for (let x = 20; x < BW * 2; x += 110) ditherRect(mid.ctx, x, 0, 18, BH, R.seaRest[0], 1); // light shafts
    for (let i = 0; i < 30; i++) { mid.ctx.fillStyle = sea[0]; mid.ctx.fillRect(Math.floor(hash(i, 2) * BW * 2), Math.floor(hash(i, 3) * BH), 2, 2); }
    return { far: far.canvas, mid: mid.canvas };
  },
  eastern(st, rest) {
    const b = PAINT.forest(st, rest);
    const c = b.far.getContext('2d');
    c.fillStyle = R.iron[2]; c.fillRect(0, 34, BW * 2, 30);
    for (let x = 0; x < BW * 2; x += 12) { c.fillStyle = R.iron[1]; c.fillRect(x, 34, 8, 4); }
    for (const x of [140, 520]) { c.fillStyle = R.iron[3]; for (let t = 0; t < 3; t++) c.fillRect(x - 30 + t * 8, 6 + t * 10, 60 - t * 16, 4); c.fillStyle = R.cream[3]; c.fillRect(x - 16, 18, 32, 16); }
    return b;
  },
  crypt(st) {
    const far = layer(), mid = layer();
    const c = far.ctx;
    c.fillStyle = '#141618'; c.fillRect(0, 0, BW * 2, BH);
    for (let y = 0; y < HZ; y += 8) for (let x = (y / 8) % 2 ? 8 : 0; x < BW * 2; x += 16) { c.fillStyle = R.iron[3]; c.fillRect(x, y, 15, 7); }
    const w = st === 'rest' ? R.seaRest : R.seaRuin;
    bandGradient(c, 0, HZ, BW * 2, BH - HZ, [w[2], w[3], w[4]]);
    for (let i = 0; i < 40; i++) { mid.ctx.fillStyle = w[1]; mid.ctx.fillRect(Math.floor(hash(i, 4) * BW * 2), HZ + Math.floor(hash(i, 5) * 90), 6, 1); }
    return { far: far.canvas, mid: mid.canvas };
  },
  deck(st, rest) {
    const far = layer(), mid = layer();
    const c = far.ctx;
    sky(c, rest, 100);
    clouds(c, rest ? R.skyRest[0] : R.skyRuin[0], 70, 8);
    for (let y = 100; y < BH; y++) { c.fillStyle = y % 6 ? R.leather[2] : R.leather[3]; c.fillRect(0, y, BW * 2, 1); }
    c.fillStyle = R.leather[1]; c.fillRect(0, 96, BW * 2, 4);
    for (let x = 0; x < BW * 2; x += 24) { c.fillStyle = R.leather[3]; c.fillRect(x, 84, 3, 14); }
    c.fillStyle = R.leather[2]; c.fillRect(0, 84, BW * 2, 3);
    clouds(mid.ctx, rest ? R.skyRest[1] : R.skyRuin[1], 20, 6);
    for (let x = 60; x < BW * 2; x += 200) { mid.ctx.fillStyle = R.leather[3]; mid.ctx.fillRect(x, 0, 4, 84); for (let i = 0; i < 8; i++) { mid.ctx.fillStyle = R.cream[3]; mid.ctx.fillRect(x - 30 + i * 8, 10 + i * 9, 1, 9); } }
    return { far: far.canvas, mid: mid.canvas };
  },
  sanctum() {
    const far = layer(), mid = layer();
    const c = far.ctx;
    c.fillStyle = '#140C14'; c.fillRect(0, 0, BW * 2, BH);
    for (let x = 0; x < BW * 2; x += 96) { c.fillStyle = R.iron[3]; c.fillRect(x, 0, 18, HZ + 10); c.fillStyle = R.iron[2]; c.fillRect(x, 0, 4, HZ + 10); }
    for (const x of [192, 576]) { for (let r = 22; r > 0; r -= 4) { c.fillStyle = [R.night[2], R.tunicRed[3], R.navy[2], R.brass[3], R.plum[2], R.night[1]][r / 4 | 0]; for (let a = 0; a < 60; a++) c.fillRect(Math.round(x + Math.cos(a / 60 * 6.28) * r), Math.round(28 + Math.sin(a / 60 * 6.28) * r), 2, 2); } }
    ground(c, R.black, HZ + 10, 33);
    for (let x = 20; x < BW * 2; x += 60) { mid.ctx.fillStyle = R.cream[2]; mid.ctx.fillRect(x, HZ + 4, 2, 6); mid.ctx.fillStyle = EL.fire[1]; mid.ctx.fillRect(x, HZ + 2, 2, 2); }
    return { far: far.canvas, mid: mid.canvas };
  },
  garden() {
    const far = layer(), mid = layer();
    const c = far.ctx;
    bandGradient(c, 0, 0, BW * 2, HZ, [S[3], S[2], S[1], R.folSilent[0]]);
    for (let x = 0; x < BW * 2; x += 64) { c.fillStyle = S[1]; c.fillRect(x, 0, 12, HZ); for (let a = 0; a < 52; a++) { c.fillStyle = S[2]; c.fillRect(x + 12 + a, Math.round(12 - Math.sin(a / 52 * Math.PI) * 10), 1, 3); } }
    ground(c, R.folSilent, HZ, 35);
    for (let i = 0; i < 160; i++) { const x = Math.floor(hash(i, 4) * BW * 2), y = 66 + Math.floor(hash(i, 5) * 94); c.fillStyle = S[0]; c.fillRect(x, y, 1, 1); c.fillStyle = i % 3 ? G[1] : B[0]; c.fillRect(x, y + 1, 1, 1); }
    for (let x = 0; x < BW * 2; x += 30) { for (let y = 0; y < HZ; y++) { mid.ctx.fillStyle = R.folSilent[2 + (y % 2)]; mid.ctx.fillRect(x + Math.round(Math.sin(y * 0.2 + x) * 3), y, 2, 1); } }
    return { far: far.canvas, mid: mid.canvas };
  },
  cathedral() { // SOLACE: the cathedral façade fills the sky; slow light sweeps across the stone
    const far = layer(), mid = layer();
    const c = far.ctx;
    c.fillStyle = R.skyRuin[4]; c.fillRect(0, 0, BW * 2, BH);
    for (let i = 0; i < 2; i++) {
      const ox = i * BW;
      for (let k = 0; k < 7; k++) { const x = ox + k * 56, top = k === 3 ? 0 : 16; c.fillStyle = k % 2 ? S[2] : S[1]; c.fillRect(x, top + 16, 44, BH - top); c.fillStyle = S[4]; c.fillRect(x + 12, top + 30, 20, BH); c.fillStyle = S[0]; c.fillRect(x, top + 16, 4, BH); }
      c.fillStyle = B[2]; for (let a = 180; a <= 360; a++) { const t = a * Math.PI / 180; c.fillRect(Math.round(ox + 192 + Math.cos(t) * 150), Math.round(110 + Math.sin(t) * 100), 3, 3); }
    }
    ground(c, S, 132, 37);
    return { far: far.canvas, mid: mid.canvas, sweep: true };
  },
  gardenBoss() {
    const b = PAINT.cathedral();
    const c = b.far.getContext('2d');
    for (let i = 0; i < 700; i++) { const x = Math.floor(hash(i, 8) * BW * 2), y = Math.floor(hash(i, 9) * BH); c.fillStyle = R.folSilent[1 + (i % 3)]; c.fillRect(x, y, 2, 2); if (i % 9 === 0) { c.fillStyle = S[0]; c.fillRect(x, y - 1, 2, 1); } }
    return b;
  },
  mercy() {
    const far = layer(), mid = layer();
    bandGradient(far.ctx, 0, 0, BW * 2, BH, [S[0], S[1], S[1], S[2]]);
    for (let i = 0; i < 40; i++) { mid.ctx.fillStyle = G[1]; mid.ctx.fillRect(Math.floor(hash(i, 2) * BW * 2), Math.floor(hash(i, 3) * BH), 1, 1); }
    return { far: far.canvas, mid: mid.canvas };
  },
  nightmare() {
    const far = layer(), mid = layer();
    const c = far.ctx;
    for (let x = 0; x < BW * 2; x += 24) { c.fillStyle = (x / 24) % 2 ? R.plum[4] : R.night[4]; c.fillRect(x, 0, 24, BH); }
    ground(c, [R.plum[3], R.plum[4], R.night[4], R.night[4], OUTLINE], HZ + 20, 39);
    for (let i = 0; i < 20; i++) { mid.ctx.fillStyle = i % 2 ? R.tunicRed[2] : R.blonde[1]; mid.ctx.fillRect(Math.floor(hash(i, 4) * BW * 2), Math.floor(hash(i, 5) * HZ), 3, 3); }
    return { far: far.canvas, mid: mid.canvas };
  },
  // ---------------- the original set
  tunnel() {
    const far = layer(), mid = layer();
    const c = far.ctx;
    c.fillStyle = '#1E1610'; c.fillRect(0, 0, BW * 2, BH);
    bandGradient(c, 0, 0, BW * 2, HZ, ['#2A2018', '#3A2418', '#44403A', '#4C4A3E']);
    ground(c, ['#8C5A34', '#734A2E', '#603C26', '#4A3020', '#3A2418'], HZ, 3);
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
    bandGradient(c, 0, 0, BW * 2, HZ, ['#6E6858', '#9A927E', '#C4BCA6', '#E8E2D0']);
    ground(c, R.stone, HZ, 5);
    const m = mid.ctx;
    for (let x = 0; x < BW * 2; x += 64) {
      m.fillStyle = S[1]; m.fillRect(x, 0, 14, 66); m.fillStyle = S[0]; m.fillRect(x, 0, 4, 66); m.fillStyle = S[3]; m.fillRect(x + 12, 0, 2, 66);
      m.fillStyle = G[2]; m.fillRect(x + 6, 20, 2, 30); m.fillStyle = G[0]; m.fillRect(x + 6, 30, 2, 4);
      m.fillStyle = S[2];
      for (let a = 0; a <= 50; a++) { const xx = x + 14 + a; const yy = Math.round(10 - Math.sin((a / 50) * Math.PI) * 8); m.fillRect(xx, yy, 1, 2); }
    }
    for (let x = 0; x < BW * 2; x += 2) if (bayer(x, 64, 2)) { m.fillStyle = S[3]; m.fillRect(x, 64, 1, 2); }
    return { far: far.canvas, mid: mid.canvas };
  },
  ashen(st, rest) { return PAINT.wasteland(st, rest); },
  mobliz(st, rest) { return PAINT.town(st, rest); },
  bloom() { // the impossible meadow: silent green, white flowers, a pale washed sky
    const far = layer(), mid = layer();
    const c = far.ctx;
    bandGradient(c, 0, 0, BW * 2, HZ, [R.skyRuin[3], R.skyRuin[2], R.skyRuin[1], R.seaRuin[1]]);
    c.fillStyle = R.folSilent[4];
    for (let x = 0; x < BW * 2; x += 2) { const h = 4 + Math.sin(x * 0.03) * 3; c.fillRect(x, HZ - h, 2, h); }
    ground(c, [R.folSilent[2], R.folSilent[2], R.folSilent[3], R.folSilent[3], R.folSilent[4]], HZ, 11);
    for (let i = 0; i < 260; i++) {
      const x = Math.floor(hash(i, 4) * BW * 2), y = 66 + Math.floor(hash(i, 5) * 94);
      c.fillStyle = S[0]; c.fillRect(x, y, 1, 1); c.fillRect(x - 1, y + 1, 3, 1); c.fillRect(x, y + 2, 1, 1);
      c.fillStyle = i % 3 ? G[1] : B[0]; c.fillRect(x, y + 1, 1, 1);
    }
    for (let i = 0; i < 3; i++) ditherRect(mid.ctx, i * 260, 50, 120, 8, R.folSilent[0], 1);
    return { far: far.canvas, mid: mid.canvas };
  },
  sparring(st, rest) {
    const b = PAINT.town(st, rest);
    const m = b.mid.getContext('2d');
    for (let a = 0; a < 360; a += 3) { const r = a * Math.PI / 180; m.fillStyle = S[1]; m.fillRect(192 + Math.cos(r) * 150, 112 + Math.sin(r) * 34, 2, 1); }
    return b;
  },
};
PAINT.snow = PAINT.snowfield;
PAINT.sea = PAINT.beach;
PAINT.port = PAINT.beach;

const cache = new Map();
export function battleBg(kind, state) {
  const rest = !!(game.state && game.state.flags && game.state.flags.wsWind);
  const key = kind + ':' + (state || 'ruin') + ':' + rest;
  if (!cache.has(key)) {
    const b = (PAINT[kind] || PAINT.vault)(state || 'ruin', rest);
    const m = b.mid.getContext('2d');
    m.clearRect(BW, 0, BW, BH);
    m.drawImage(b.mid, 0, 0, BW, BH, BW, 0, BW, BH); // seamless drift
    cache.set(key, b);
  }
  return cache.get(key);
}

export function drawBg(ctx, kind, frame, state) {
  const b = battleBg(kind, state);
  ctx.drawImage(b.far, 0, 0, BW, BH, 0, 0, BW, BH);
  const off = Math.floor(frame * 0.15) % BW; // slow ambient drift, whole pixels only
  ctx.drawImage(b.mid, off, 0, BW, BH, 0, 0, BW, BH);
  if (b.sweep) { // vertical light sweeps across stone every 180 frames
    const x = ((frame % 180) / 180) * (BW + 60) - 30;
    ditherRect(ctx, Math.round(x), 0, 18, BH, '#FFFDF5', 1);
  }
}
