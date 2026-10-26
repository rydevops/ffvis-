// Title screen, game over, and the "to be continued" ending card.
import { drawBg } from './bgs.js';
import { game, setScene, pushOverlay, fadeOut, fadeIn, setFade, wait } from '../game.js';
import * as input from '../core/input.js';
import * as audio from '../core/audio.js';
import { W, H, makeCanvas, bandGradient, ditherRect, drawWindow, drawCursor, Painter } from '../core/gfx.js';
import { drawText, drawTextCentered, glyphRows } from '../core/font.js';
import { UI, R, OUTLINE } from '../data/palette.js';
import { hasSave, loadGame, saveSummary } from '../core/save.js';
import { newState } from '../data/party.js';
import { setReloadAllowed, BUILD } from '../core/update.js';
import { FieldScene } from './field.js';
import { SettingsMenu } from './menu.js';

// A logo hand-built from the bitmap font: each glyph pixel becomes a 2x2 carved block,
// lit from the upper-left, with a deep outline.
function buildLogo(text, ramp) {
  const cells = [];
  let x = 0;
  for (const ch of text) {
    const rows = glyphRows(ch);
    const w = Math.max(...rows.map((r) => r.length));
    rows.forEach((row, y) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') cells.push([x + i, y]); });
    x += (ch === ' ' ? 3 : w + 1);
  }
  const p = new Painter(x * 2 + 4, 7 * 2 + 4);
  for (const [cx, cy] of cells) {
    const px = 2 + cx * 2, py = 2 + cy * 2;
    p.set(px, py, ramp[0]); p.set(px + 1, py, ramp[1]); p.set(px, py + 1, ramp[1]); p.set(px + 1, py + 1, ramp[2]);
  }
  p.outline(() => ramp[4]);
  p.outline(() => OUTLINE);
  return p.toCanvas();
}

let titleArt = null;
export function art() {
  if (titleArt) return titleArt;
  const { canvas, ctx } = makeCanvas(W, H);
  bandGradient(ctx, 0, 0, W, 150, ['#140C14', R.skyRuin[4], R.skyRuin[3], R.skyRuin[2]]);
  // the ruined tower on the horizon
  ctx.fillStyle = '#2E1424';
  for (let x = 0; x < W; x += 2) {
    const d = Math.abs(x - 192);
    const h = 18 + Math.max(0, 70 - d * 0.9) + Math.abs(Math.sin(x * 0.13)) * 8;
    ctx.fillRect(x, 160 - h, 2, h);
  }
  ctx.fillStyle = '#140C14';
  ctx.fillRect(0, 158, W, H - 158);
  ditherRect(ctx, 0, 150, W, 10, '#140C14', 2);
  titleArt = {
    bg: canvas,
    logo: buildLogo('REQUIEM FOR RUIN', [R.stone[0], R.stone[1], R.stone[2], R.stone[3], R.stone[4]]),
  };
  return titleArt;
}

export function drawEye(ctx, cx, cy, open, t) {
  // SOLACE's eye: a white stone almond, glass iris, lid closing to a line
  const rx = 34, ry = 12 * open;
  for (let y = -13; y <= 13; y++) for (let x = -rx - 3; x <= rx + 3; x++) {
    const shell = (x * x) / ((rx + 3) * (rx + 3)) + (y * y) / (13 * 13) <= 1;
    if (!shell) continue;
    let c = y < -6 ? R.stone[1] : y < 4 ? R.stone[2] : R.stone[3];
    if (ry > 0.5 && (x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) {
      const d = Math.hypot(x, y * 1.6);
      c = d < 4 ? OUTLINE : d < 8 ? R.glass[0] : d < 11 ? R.glass[1] : d < 15 ? R.glass[2] : d < 20 ? R.glass[3] : R.glass[4];
      if (x === -5 && y === -3) c = '#FFFFFF';
    } else if (ry <= 0.5 && y === 0 && Math.abs(x) < rx) c = R.stone[4];
    ctx.fillStyle = c;
    ctx.fillRect(cx + x, cy + y, 1, 1);
  }
  // brass halo arch
  ctx.fillStyle = R.brass[2];
  for (let a = 200; a <= 340; a += 2) { const r = a * Math.PI / 180; ctx.fillRect(Math.round(cx + Math.cos(r) * 48), Math.round(cy + 6 + Math.sin(r) * 30), 2, 1); }
}

export class TitleScene {
  constructor() {
    this.t = 0;
    this.started = audio.audioReady();
    this.items = [];
    this.i = 0;
    this.ash = [];
    this.leaving = false;
  }
  enter() {
    game.busy = 0; // a script interrupted by a game over never releases its lock
    game.overlays.length = 0;
    setReloadAllowed(true);
    this.items = hasSave() ? ['Continue', 'New Game', 'Settings'] : ['New Game', 'Settings'];
    this.i = 0;
    setFade(4);
    fadeIn(40);
    if (this.started) audio.playMusic('title');
  }
  exit() { setReloadAllowed(false); }
  update(canControl) {
    this.t++;
    if (this.ash.length < 50 && Math.random() < 0.4) this.ash.push({ x: Math.random() * (W + 40), y: -2, vx: -0.3, vy: 0.3 + Math.random() * 0.3 });
    for (const a of this.ash) { a.x += a.vx; a.y += a.vy; }
    this.ash = this.ash.filter((a) => a.y < H);
    if (!canControl || this.leaving) return;
    if (!this.started) {
      if (input.pressed('a') || input.pressed('start')) { this.started = true; audio.unlock(); audio.playMusic('title'); audio.sfx('confirm'); }
      return;
    }
    const n = this.items.length;
    if (input.repeat('down')) { this.i = (this.i + 1) % n; audio.sfx('cursor'); }
    if (input.repeat('up')) { this.i = (this.i + n - 1) % n; audio.sfx('cursor'); }
    if (input.pressed('a')) {
      const it = this.items[this.i];
      audio.sfx('confirm');
      if (it === 'Settings') pushOverlay(new SettingsMenu());
      else if (it === 'New Game') this.start(newState());
      else if (it === 'Continue') { const s = loadGame(); if (s) this.start(s); }
    }
  }
  async start(state) {
    this.leaving = true;
    audio.stopMusic(1.2);
    await fadeOut(40);
    game.state = state;
    state.flags ||= {}; state.propState ||= {};
    const f = new FieldScene(state.map, state.x, state.y, state.dir);
    game.fieldScene = f;
    setScene(f);
    await fadeIn(30);
  }
  draw(ctx) {
    const a = art();
    ctx.drawImage(a.bg, 0, 0);
    // the eye opens slowly, blinks, half-closes again
    const cyc = (this.t % 600) / 600;
    const open = cyc < 0.4 ? 0.15 + cyc : cyc < 0.45 ? 0.55 - (cyc - 0.4) * 10 : cyc < 0.5 ? 0.05 + (cyc - 0.45) * 10 : 0.55 - (cyc - 0.5) * 0.8;
    drawEye(ctx, 192, 54, Math.max(0.02, Math.min(1, open)), this.t);
    for (const s of this.ash) { ctx.fillStyle = R.skyRuin[0]; ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1); }
    ctx.drawImage(a.logo, Math.floor((W - a.logo.width) / 2), 92);
    drawTextCentered(ctx, 'An unofficial fan sequel to Final Fantasy VI', W / 2, 116, R.skyRuin[0]);
    if (!this.started) {
      if (Math.floor(this.t / 30) % 2 === 0) drawTextCentered(ctx, 'Tap the screen or press A', W / 2, 150, UI.text);
    } else {
      this.items.forEach((it, i) => drawTextCentered(ctx, it, W / 2, 140 + i * 13, i === this.i ? UI.text : UI.textDim));
      const w = 70;
      drawCursor(ctx, W / 2 - w / 2 - 12, 140 + this.i * 13, this.t);
      if (this.items[0] === 'Continue' && this.i === 0) {
        const s = saveSummary();
        if (s) drawTextCentered(ctx, `${s.chapter} - ${s.map}`, W / 2, 184, UI.name);
      }
    }
    drawText(ctx, 'Fan project. Not affiliated with Square Enix.', 4, 205, '#5A2434', null);
    drawText(ctx, 'b' + (BUILD.startsWith('__') ? 'dev' : BUILD.slice(-7)), W - 44, 205, '#5A2434', null);
  }
}

export class GameOverScene {
  constructor() { this.t = 0; }
  enter() { game.busy = 0; game.overlays.length = 0; audio.playMusic('stillness'); setFade(4); fadeIn(60); }
  update(canControl) {
    this.t++;
    if (canControl && this.t > 90 && input.pressed('a')) {
      this.t = -9999;
      fadeOut(40).then(() => setScene(new TitleScene()));
    }
  }
  draw(ctx) {
    ctx.fillStyle = OUTLINE; ctx.fillRect(0, 0, W, H);
    drawTextCentered(ctx, 'Do not be afraid.', W / 2, 90, R.glass[1]);
    drawTextCentered(ctx, 'You have suffered enough. Let me give you rest.', W / 2, 106, R.glass[2]);
    if (this.t > 90 && Math.floor(this.t / 30) % 2 === 0) drawTextCentered(ctx, 'Press A', W / 2, 150, UI.textDim);
  }
}

// End of the demo slice.
export class EndCardScene {
  constructor(lines, opts = {}) { this.t = 0; this.lines = lines; this.opts = opts; }
  enter() { setFade(4); fadeIn(60); audio.playMusic(this.opts.music || 'title'); }
  update(canControl) {
    this.t++;
    if (canControl && this.t > 240 && input.pressed('a')) { this.t = -99999; fadeOut(60).then(() => setScene(new TitleScene())); }
  }
  draw(ctx) {
    if (this.opts.restored) { drawBg(ctx, 'plains', this.t, 'rest'); ditherRect(ctx, 24, 50, W - 48, this.lines.length * 14 + 12, OUTLINE, 3); }
    else { const a = art(); ctx.drawImage(a.bg, 0, 0); ditherRect(ctx, 0, 0, W, H, OUTLINE, 2); }
    this.lines.forEach((l, i) => drawTextCentered(ctx, l, W / 2, 60 + i * 14, i === 0 ? R.spirit[1] : UI.text));
    if (this.t > 240 && Math.floor(this.t / 30) % 2 === 0) drawTextCentered(ctx, 'Press A to return to the title', W / 2, 190, UI.textDim);
  }
}
