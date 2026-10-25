// Dialogue box, choice menu and notices. Each returns a promise via the helpers at the bottom.
import { game, pushOverlay, removeOverlay } from '../game.js';
import * as input from '../core/input.js';
import { sfx } from '../core/audio.js';
import { drawWindow, drawCursor, ditherRect, W, H } from '../core/gfx.js';
import { drawText, drawTextCentered, wrap, textWidth, LINE_H } from '../core/font.js';
import { UI, R } from '../data/palette.js';

const STYLES = {
  normal: {},
  solace: { top: '#0E3A3A', bot: '#071C1E' }, // the machine speaks: cold glass-green, no warmth
  memory: { top: '#3A2440', bot: '#1C1024' },
};

export class TextBox {
  constructor(name, text, opts = {}) {
    this.name = name;
    this.style = opts.style || (name === 'SOLACE' || name === '???' && opts.machine ? 'solace' : 'normal');
    this.pos = opts.pos || 'bottom';
    this.w = 372;
    this.h = 58;
    this.x = 6;
    this.y = this.pos === 'top' ? 6 : H - this.h - 6;
    const lines = wrap(text, this.w - 20);
    this.pages = [];
    const per = name ? 3 : 4;
    for (let i = 0; i < lines.length; i += per) this.pages.push(lines.slice(i, i + per));
    this.page = 0;
    this.shown = 0;
    this.done = false;
    this.auto = opts.auto || 0; // frames to wait then close automatically
    this.timer = 0;
    this.promise = new Promise((res) => { this.resolve = res; });
  }
  pageLen() { return this.pages[this.page].join('').length; }
  update() {
    const speed = [0, 0.5, 1, 2.5][game.settings.textSpeed] || 1;
    const total = this.pageLen();
    if (this.shown < total) {
      const before = Math.floor(this.shown);
      this.shown = Math.min(total, this.shown + speed);
      if (Math.floor(this.shown) !== before && before % 3 === 0) sfx('text');
      if (input.pressed('a') || input.pressed('b')) this.shown = total;
      return;
    }
    this.timer++;
    if ((this.auto && this.timer > this.auto) || input.pressed('a') || input.pressed('b')) {
      if (this.page < this.pages.length - 1) { this.page++; this.shown = 0; this.timer = 0; return; }
      removeOverlay(this);
      this.resolve();
    }
  }
  draw(ctx) {
    const st = STYLES[this.style] || {};
    drawWindow(ctx, this.x, this.y, this.w, this.h, st);
    if (this.style === 'solace') { // machine broadcast scanlines
      for (let y = this.y + 3; y < this.y + this.h - 3; y += 3) ditherRect(ctx, this.x + 2, y, this.w - 4, 1, R.glass[3], 1);
    }
    let ty = this.y + 7;
    if (this.name) {
      drawText(ctx, this.name, this.x + 10, ty, this.style === 'solace' ? R.glass[1] : UI.name);
      ty += LINE_H + 1;
    }
    let budget = Math.floor(this.shown);
    const col = this.style === 'solace' ? R.glass[0] : UI.text;
    for (const line of this.pages[this.page]) {
      if (budget <= 0) break;
      drawText(ctx, line.slice(0, budget), this.x + 10, ty, col);
      budget -= line.length;
      ty += LINE_H;
    }
    if (this.shown >= this.pageLen() && !this.auto && Math.floor(game.frame / 16) % 2 === 0) {
      const ax = this.x + this.w - 14, ay = this.y + this.h - 10;
      ctx.fillStyle = UI.gold;
      ctx.fillRect(ax, ay, 5, 1); ctx.fillRect(ax + 1, ay + 1, 3, 1); ctx.fillRect(ax + 2, ay + 2, 1, 1);
    }
  }
}

export class Choice {
  constructor(options, opts = {}) {
    this.options = options;
    this.i = 0;
    this.cancel = opts.cancel ?? -1;
    this.w = Math.max(...options.map((o) => textWidth(o))) + 32;
    this.h = options.length * 13 + 10;
    this.x = opts.x ?? W - this.w - 10;
    this.y = opts.y ?? H - 64 - this.h - 4;
    this.promise = new Promise((res) => { this.resolve = res; });
  }
  update() {
    if (input.repeat('down')) { this.i = (this.i + 1) % this.options.length; sfx('cursor'); }
    if (input.repeat('up')) { this.i = (this.i + this.options.length - 1) % this.options.length; sfx('cursor'); }
    if (input.pressed('a')) { sfx('confirm'); removeOverlay(this); this.resolve(this.i); }
    else if (input.pressed('b') && this.cancel >= 0) { sfx('cancel'); removeOverlay(this); this.resolve(this.cancel); }
  }
  draw(ctx) {
    drawWindow(ctx, this.x, this.y, this.w, this.h);
    this.options.forEach((o, i) => drawText(ctx, o, this.x + 22, this.y + 7 + i * 13, UI.text));
    drawCursor(ctx, this.x + 6, this.y + 7 + this.i * 13, game.frame);
  }
}

export class Notice {
  constructor(text, opts = {}) {
    this.text = text;
    this.frames = opts.frames || 0;
    this.t = 0;
    this.w = textWidth(text) + 24;
    this.h = 22;
    this.y = opts.y ?? 40;
    this.promise = new Promise((res) => { this.resolve = res; });
  }
  update() {
    this.t++;
    if ((this.frames && this.t > this.frames) || (this.t > 10 && (input.pressed('a') || input.pressed('b')))) {
      removeOverlay(this);
      this.resolve();
    }
  }
  draw(ctx) {
    const x = Math.floor((W - this.w) / 2);
    drawWindow(ctx, x, this.y, this.w, this.h);
    drawTextCentered(ctx, this.text, W / 2, this.y + 7, UI.text);
  }
}

// Centered story caption with no window (chapter titles, narration).
export class Caption {
  constructor(lines, opts = {}) {
    this.lines = Array.isArray(lines) ? lines : [lines];
    this.frames = opts.frames || 180;
    this.color = opts.color || UI.text;
    this.sub = opts.sub || null;
    this.t = 0;
    this.promise = new Promise((res) => { this.resolve = res; });
  }
  update() {
    this.t++;
    if (this.t > this.frames || (this.t > 30 && input.pressed('a'))) { removeOverlay(this); this.resolve(); }
  }
  draw(ctx) {
    const fadeIn = Math.min(4, Math.floor(this.t / 6));
    const fadeOut = Math.min(4, Math.floor((this.frames - this.t) / 6));
    const lvl = Math.max(0, Math.min(fadeIn, fadeOut));
    if (lvl <= 0) return;
    const y0 = Math.floor(H / 2 - (this.lines.length * 14) / 2);
    this.lines.forEach((l, i) => {
      const c = lvl >= 3 ? this.color : lvl === 2 ? UI.textDim : R.stone[4];
      drawTextCentered(ctx, l, W / 2, y0 + i * 14, c);
    });
  }
}

export function say(name, text, opts) { return pushOverlay(new TextBox(name, text, opts)).promise; }
export function choose(options, opts) { return pushOverlay(new Choice(options, opts)).promise; }
export function notice(text, opts) { return pushOverlay(new Notice(text, opts)).promise; }
export function caption(lines, opts) { return pushOverlay(new Caption(lines, opts)).promise; }
