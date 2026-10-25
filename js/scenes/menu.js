// Field menu (party, items, settings, save) and the shared settings panel.
import { game, removeOverlay, pushOverlay } from '../game.js';
import * as input from '../core/input.js';
import * as audio from '../core/audio.js';
import { drawWindow, drawCursor, W, H } from '../core/gfx.js';
import { drawText, drawTextRight, drawTextCentered } from '../core/font.js';
import { UI, R } from '../data/palette.js';
import { ITEMS, expForLevel } from '../data/party.js';
import { saveGame, saveSettings } from '../core/save.js';
import { fieldSheet } from '../data/sprites.js';

function fmtTime(frames) {
  const s = Math.floor(frames / 60);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

export class FieldMenu {
  constructor(field) {
    this.field = field;
    this.opts = ['Items', 'Settings', 'Save', 'Close'];
    this.i = 0;
    this.mode = 'main';
    this.msg = null;
    audio.sfx('confirm');
  }
  close() { removeOverlay(this); input.clearAll(); }
  update() {
    if (this.msg) { this.msg.t--; if (this.msg.t <= 0 || input.pressed('a')) this.msg = null; return; }
    if (this.mode === 'main') {
      if (input.repeat('down')) { this.i = (this.i + 1) % this.opts.length; audio.sfx('cursor'); }
      if (input.repeat('up')) { this.i = (this.i + this.opts.length - 1) % this.opts.length; audio.sfx('cursor'); }
      if (input.pressed('b') || input.pressed('start')) { audio.sfx('cancel'); this.close(); return; }
      if (input.pressed('a')) {
        const o = this.opts[this.i];
        audio.sfx('confirm');
        if (o === 'Close') this.close();
        else if (o === 'Settings') pushOverlay(new SettingsMenu());
        else if (o === 'Save') {
          game.state.chapterName = game.state.chapterName || '';
          const ok = saveGame(game.state);
          audio.sfx(ok ? 'save' : 'buzzer');
          this.msg = { text: ok ? 'Your journey has been recorded.' : 'Could not save (storage unavailable).', t: 120 };
        } else if (o === 'Items') {
          this.items = Object.entries(game.state.items).filter(([, n]) => n > 0);
          if (!this.items.length) { this.msg = { text: 'You carry nothing.', t: 80 }; return; }
          this.mode = 'items'; this.ii = 0;
        }
      }
      return;
    }
    if (this.mode === 'items') {
      const n = this.items.length;
      if (input.repeat('down')) { this.ii = (this.ii + 1) % n; audio.sfx('cursor'); }
      if (input.repeat('up')) { this.ii = (this.ii + n - 1) % n; audio.sfx('cursor'); }
      if (input.pressed('b')) { this.mode = 'main'; audio.sfx('cancel'); return; }
      if (input.pressed('a')) {
        const [id] = this.items[this.ii];
        const it = ITEMS[id];
        if (!it.heal) { audio.sfx('buzzer'); this.msg = { text: it.desc, t: 120 }; return; }
        this.mode = 'target'; this.ti = 0; audio.sfx('confirm');
      }
      return;
    }
    if (this.mode === 'target') {
      const n = game.state.party.length;
      if (input.repeat('down')) { this.ti = (this.ti + 1) % n; audio.sfx('cursor'); }
      if (input.repeat('up')) { this.ti = (this.ti + n - 1) % n; audio.sfx('cursor'); }
      if (input.pressed('b')) { this.mode = 'items'; audio.sfx('cancel'); return; }
      if (input.pressed('a')) {
        const [id] = this.items[this.ii];
        const c = game.state.chars[game.state.party[this.ti]];
        if (c.hp <= 0 || c.hp >= c.maxhp) { audio.sfx('buzzer'); return; }
        c.hp = Math.min(c.maxhp, c.hp + ITEMS[id].heal);
        game.state.items[id]--;
        audio.sfx('heal');
        this.items = Object.entries(game.state.items).filter(([, k]) => k > 0);
        if (!this.items.length) this.mode = 'main';
        else if (!game.state.items[id]) { this.mode = 'items'; this.ii = 0; }
      }
    }
  }
  draw(ctx) {
    drawWindow(ctx, 8, 8, 270, 200);
    drawWindow(ctx, 282, 8, 94, 64);
    drawWindow(ctx, 282, 76, 94, 60);
    this.opts.forEach((o, i) => drawText(ctx, o, 304, 16 + i * 12, UI.text));
    if (this.mode === 'main') drawCursor(ctx, 288, 16 + this.i * 12, game.frame);
    drawText(ctx, 'Time', 290, 84, UI.textDim); drawTextRight(ctx, fmtTime(game.state.playtime), 368, 84, UI.text);
    drawText(ctx, 'Parts', 290, 96, UI.textDim); drawTextRight(ctx, String(game.state.parts), 368, 96, R.brass[0]);
    drawText(ctx, (game.state.mapName || '').slice(0, 14), 290, 112, UI.name);

    if (this.mode === 'main' || this.mode === 'target') {
      game.state.party.forEach((id, i) => {
        const c = game.state.chars[id];
        const y = 18 + i * 46;
        const sheet = fieldSheet(c.fieldOverride || c.field);
        ctx.drawImage(sheet.down[0], 22, y);
        drawText(ctx, c.name, 46, y + 2, UI.name);
        drawText(ctx, c.title || '', 120, y + 2, UI.textDim);
        drawText(ctx, 'LV ' + c.lv, 46, y + 14, UI.text);
        drawText(ctx, 'HP', 90, y + 14, UI.textDim);
        drawText(ctx, `${c.hp}/${c.maxhp}`, 106, y + 14, c.hp < c.maxhp / 4 ? UI.hpLow : UI.text);
        if (c.maxsp) drawText(ctx, `SP ${c.sp}/${c.maxsp}`, 180, y + 14, UI.pink);
        drawText(ctx, 'Next ' + Math.max(0, expForLevel(c.lv + 1) - c.exp), 46, y + 26, UI.textDim);
        if (this.mode === 'target' && this.ti === i) drawCursor(ctx, 12, y + 8, game.frame);
      });
    }
    if (this.mode === 'items' || this.mode === 'target') {
      const x = this.mode === 'target' ? 150 : 16;
      if (this.mode === 'items') {
        this.items.forEach(([id, n], i) => {
          drawText(ctx, ITEMS[id].name, x + 20, 18 + i * 12, ITEMS[id].key ? UI.name : UI.text);
          drawTextRight(ctx, ITEMS[id].key ? '' : 'x' + n, 266, 18 + i * 12, UI.gold);
        });
        drawCursor(ctx, x + 4, 18 + this.ii * 12, game.frame);
        const it = ITEMS[this.items[this.ii][0]];
        drawText(ctx, it.desc, 16, 190, UI.name);
      }
    }
    if (this.msg) {
      drawWindow(ctx, 30, 90, W - 60, 24);
      drawTextCentered(ctx, this.msg.text, W / 2, 98, UI.text);
    }
  }
}

const SETTINGS = [
  { key: 'music', label: 'Music', vals: [0, 0.2, 0.4, 0.55, 0.7, 0.85, 1], fmt: (v) => Math.round(v * 100) + '%' },
  { key: 'sfx', label: 'Sound FX', vals: [0, 0.2, 0.4, 0.6, 0.8, 1], fmt: (v) => Math.round(v * 100) + '%' },
  { key: 'battleMode', label: 'Battle Mode', vals: ['wait', 'active'], fmt: (v) => (v === 'wait' ? 'Wait' : 'Active') },
  { key: 'textSpeed', label: 'Text Speed', vals: [1, 2, 3], fmt: (v) => ['', 'Slow', 'Normal', 'Fast'][v] },
  { key: 'reduceFlash', label: 'Reduce Flashing', vals: [false, true], fmt: (v) => (v ? 'On' : 'Off') },
  { key: 'shake', label: 'Screen Shake', vals: [0, 0.5, 1], fmt: (v) => (v === 0 ? 'Off' : v === 0.5 ? 'Low' : 'Full') },
];

export class SettingsMenu {
  constructor(onClose) { this.i = 0; this.onClose = onClose; }
  update() {
    const n = SETTINGS.length + 1;
    if (input.repeat('down')) { this.i = (this.i + 1) % n; audio.sfx('cursor'); }
    if (input.repeat('up')) { this.i = (this.i + n - 1) % n; audio.sfx('cursor'); }
    const s = SETTINGS[this.i];
    const step = input.repeat('right') || (input.pressed('a') && s) ? 1 : input.repeat('left') ? -1 : 0;
    if (s && step) {
      const cur = s.vals.indexOf(game.settings[s.key]);
      let ni = cur < 0 ? 0 : cur + step;
      if (input.pressed('a')) ni = (cur + 1) % s.vals.length;
      ni = Math.max(0, Math.min(s.vals.length - 1, ni));
      game.settings[s.key] = s.vals[ni];
      audio.setVolumes(game.settings.music, game.settings.sfx);
      audio.sfx('cursor');
      saveSettings(game.settings);
    }
    if (input.pressed('b') || (input.pressed('a') && !s)) {
      audio.sfx('cancel');
      saveSettings(game.settings);
      removeOverlay(this);
      input.clearAll();
      if (this.onClose) this.onClose();
    }
  }
  draw(ctx) {
    drawWindow(ctx, 60, 30, W - 120, 150);
    drawTextCentered(ctx, 'Settings', W / 2, 38, UI.name);
    SETTINGS.forEach((s, i) => {
      const y = 56 + i * 15;
      drawText(ctx, s.label, 92, y, UI.text);
      drawTextRight(ctx, '< ' + s.fmt(game.settings[s.key]) + ' >', W - 82, y, UI.gold);
    });
    drawText(ctx, 'Done', 92, 56 + SETTINGS.length * 15, UI.text);
    drawCursor(ctx, 76, 56 + this.i * 15, game.frame);
  }
}
