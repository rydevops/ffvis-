// Field menu (items, party, equip, echoes, status, settings, save), shops, inns and the
// party picker used when the story splits the party.
import { game, removeOverlay, pushOverlay } from '../game.js';
import * as input from '../core/input.js';
import * as audio from '../core/audio.js';
import { drawWindow, drawCursor, W, H } from '../core/gfx.js';
import { drawText, drawTextRight, drawTextCentered, wrap } from '../core/font.js';
import { UI, R } from '../data/palette.js';
import { ITEMS, GEAR, ECHOES, SHOPS, CMD_NAMES, expForLevel, stats, echoTier, abilitiesFor, ABIL } from '../data/party.js';
import { saveGame, saveSettings } from '../core/save.js';
import { fieldSheet } from '../data/sprites.js';

function fmtTime(frames) {
  const s = Math.floor(frames / 60);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}
const st = () => game.state;
const nav = (o, key, n) => {
  if (n <= 0) return;
  if (input.repeat('down')) { o[key] = (o[key] + 1) % n; audio.sfx('cursor'); }
  if (input.repeat('up')) { o[key] = (o[key] + n - 1) % n; audio.sfx('cursor'); }
};

// Base overlay with a message strip and a close() helper.
class Panel {
  constructor() { this.msg = null; }
  close() { removeOverlay(this); input.clearAll(); if (this.onClose) this.onClose(); }
  say(text, t = 100) { this.msg = { text, t }; }
  tickMsg() { if (this.msg) { this.msg.t--; if (this.msg.t <= 0 || input.pressed('a') || input.pressed('b')) this.msg = null; return true; } return false; }
  drawMsg(ctx) {
    if (!this.msg) return;
    const lines = wrap(this.msg.text, W - 80);
    drawWindow(ctx, 30, 84, W - 60, 12 + lines.length * 11);
    lines.forEach((l, i) => drawTextCentered(ctx, l, W / 2, 90 + i * 11, UI.text));
  }
}

function drawMember(ctx, c, x, y, sel = false) {
  const sheet = fieldSheet(c.fieldOverride || c.field);
  const img = sheet.down[0];
  ctx.drawImage(img, x + 8 - Math.floor(img.width / 2), y + 24 - img.height);
  drawText(ctx, c.name, x + 22, y + 2, sel ? UI.gold : UI.name);
  drawText(ctx, 'LV ' + c.lv, x + 22, y + 13, UI.text);
  drawText(ctx, `HP ${c.hp}/${c.maxhp}`, x + 64, y + 13, c.hp < c.maxhp / 4 ? UI.hpLow : UI.text);
  if (c.maxsp) drawText(ctx, `SP ${c.sp}/${c.maxsp}`, x + 140, y + 13, UI.pink);
}

export class FieldMenu extends Panel {
  constructor(field) {
    super();
    this.field = field;
    this.opts = ['Items', 'Party', 'Equip', 'Echoes', 'Status', 'Settings', 'Save', 'Close'];
    this.i = 0;
    audio.sfx('confirm');
  }
  update() {
    if (this.tickMsg()) return;
    nav(this, 'i', this.opts.length);
    if (input.pressed('b') || input.pressed('start')) { audio.sfx('cancel'); this.close(); return; }
    if (!input.pressed('a')) return;
    const o = this.opts[this.i];
    audio.sfx('confirm');
    if (o === 'Close') this.close();
    else if (o === 'Settings') pushOverlay(new SettingsMenu());
    else if (o === 'Items') pushOverlay(new ItemsMenu(this.field));
    else if (o === 'Party') { if (st().flags.partyLocked) { this.say('The party cannot be changed right now.'); return; } pushOverlay(new PartyMenu()); }
    else if (o === 'Equip') pushOverlay(new MemberPick((c) => pushOverlay(new EquipMenu(c))));
    else if (o === 'Echoes') { if (!(st().shards || []).length) { this.say('You have not found any Echo Shards yet.'); return; } pushOverlay(new MemberPick((c) => pushOverlay(new EchoMenu(c)), (c) => c.cmds.includes('echo'))); }
    else if (o === 'Status') pushOverlay(new MemberPick((c) => pushOverlay(new StatusMenu(c))));
    else if (o === 'Save') {
      const ok = saveGame(st());
      audio.sfx(ok ? 'save' : 'buzzer');
      this.say(ok ? 'Your journey has been recorded.' : 'Could not save (storage unavailable).');
    }
  }
  draw(ctx) {
    drawWindow(ctx, 8, 8, 270, 200);
    drawWindow(ctx, 282, 8, 94, 104);
    drawWindow(ctx, 282, 116, 94, 92);
    this.opts.forEach((o, i) => drawText(ctx, o, 302, 15 + i * 12, UI.text));
    drawCursor(ctx, 286, 15 + this.i * 12, game.frame);
    const s = st();
    drawText(ctx, 'Time', 290, 124, UI.textDim); drawTextRight(ctx, fmtTime(s.playtime), 368, 124, UI.text);
    drawText(ctx, 'GP', 290, 136, UI.textDim); drawTextRight(ctx, String(s.gp || 0), 368, 136, R.brass[0]);
    drawText(ctx, 'Parts', 290, 148, UI.textDim); drawTextRight(ctx, String(s.parts), 368, 148, R.brass[0]);
    if (s.flags.act3) { drawText(ctx, 'Stilled', 290, 160, UI.textDim); drawTextRight(ctx, String(s.stilled || 0), 368, 160, R.glass[1]); }
    drawText(ctx, (s.chapterName || '').slice(0, 14), 290, 178, UI.gold);
    drawText(ctx, (s.mapName || '').slice(0, 14), 290, 190, UI.name);
    s.party.forEach((id, i) => drawMember(ctx, s.chars[id], 16, 16 + i * 46));
    this.drawMsg(ctx);
  }
}

class MemberPick extends Panel {
  constructor(then, filter = () => true) { super(); this.then = then; this.filter = filter; this.i = 0; this.list = () => (st().roster || st().party).filter((id) => st().chars[id] && this.filter(st().chars[id])); }
  update() {
    const L = this.list();
    nav(this, 'i', L.length);
    if (input.pressed('b')) { audio.sfx('cancel'); this.close(); return; }
    if (input.pressed('a') && L.length) { audio.sfx('confirm'); this.then(st().chars[L[this.i]]); }
  }
  draw(ctx) {
    const L = this.list();
    drawWindow(ctx, 8, 8, 270, 200);
    const start = Math.max(0, Math.min(L.length - 7, this.i - 3));
    L.slice(start, start + 7).forEach((id, i) => drawMember(ctx, st().chars[id], 22, 14 + i * 27, start + i === this.i));
    drawCursor(ctx, 10, 20 + (this.i - start) * 27, game.frame);
  }
}

class ItemsMenu extends Panel {
  constructor(field) { super(); this.field = field; this.i = 0; this.mode = 'list'; this.ti = 0; this.refresh(); }
  refresh() { this.items = Object.entries(st().items).filter(([k, n]) => n > 0 && ITEMS[k]).sort((a, b) => (ITEMS[a[0]].key ? 1 : 0) - (ITEMS[b[0]].key ? 1 : 0)); }
  update() {
    if (this.tickMsg()) return;
    if (!this.items.length) { this.say('You carry nothing.'); this.onClose = null; this.close(); return; }
    if (this.mode === 'list') {
      nav(this, 'i', this.items.length);
      if (input.pressed('b')) { audio.sfx('cancel'); this.close(); return; }
      if (input.pressed('a')) {
        const [id] = this.items[this.i];
        const it = ITEMS[id];
        if (it.field) {
          if (!this.field || !this.field.map.world) { audio.sfx('buzzer'); this.say('Tents can only be pitched on the world map.'); return; }
          st().items[id]--; for (const pid of st().party) { const c = st().chars[pid]; c.hp = c.maxhp; c.sp = c.maxsp; }
          audio.sfx('heal'); this.say('The party rests in the tent. Fully recovered.'); this.refresh(); return;
        }
        if (!(it.heal || it.sp || it.revive || it.cure)) { audio.sfx('buzzer'); this.say(it.desc); return; }
        this.mode = 'target'; this.ti = 0; audio.sfx('confirm');
      }
      return;
    }
    const P = st().party;
    nav(this, 'ti', P.length);
    if (input.pressed('b')) { this.mode = 'list'; audio.sfx('cancel'); return; }
    if (input.pressed('a')) {
      const [id] = this.items[this.i];
      const it = ITEMS[id];
      const c = st().chars[P[this.ti]];
      if (it.revive) { if (c.hp > 0) { audio.sfx('buzzer'); return; } c.hp = Math.max(1, Math.round(c.maxhp * it.revive)); }
      else {
        if (c.hp <= 0) { audio.sfx('buzzer'); return; }
        if (it.heal && c.hp >= c.maxhp && !(it.sp && c.sp < c.maxsp)) { audio.sfx('buzzer'); return; }
        if (it.heal) c.hp = Math.min(c.maxhp, c.hp + it.heal);
        if (it.sp) c.sp = Math.min(c.maxsp, c.sp + it.sp);
      }
      st().items[id]--;
      audio.sfx('heal');
      this.refresh();
      if (!this.items.length) { this.close(); return; }
      if (!st().items[id]) { this.mode = 'list'; this.i = Math.min(this.i, this.items.length - 1); }
    }
  }
  draw(ctx) {
    drawWindow(ctx, 8, 8, 368, 200);
    const rows = 12;
    const start = Math.max(0, Math.min(this.items.length - rows, this.i - 6));
    this.items.slice(start, start + rows).forEach(([id, n], i) => {
      drawText(ctx, ITEMS[id].name, 28, 16 + i * 12, ITEMS[id].key ? UI.name : UI.text);
      if (!ITEMS[id].key) drawTextRight(ctx, 'x' + n, 190, 16 + i * 12, UI.gold);
    });
    if (this.items.length) {
      drawCursor(ctx, 12, 16 + (this.i - start) * 12, game.frame);
      const it = ITEMS[this.items[this.i][0]];
      wrap(it.desc, 160).forEach((l, i) => drawText(ctx, l, 204, 16 + i * 11, UI.name));
    }
    if (this.mode === 'target') {
      drawWindow(ctx, 196, 60, 176, st().party.length * 24 + 8);
      st().party.forEach((id, i) => { const c = st().chars[id]; drawText(ctx, c.name, 216, 66 + i * 24, UI.text); drawText(ctx, `${c.hp}/${c.maxhp}`, 216, 77 + i * 24, c.hp <= 0 ? UI.hpLow : UI.textDim); if (c.maxsp) drawText(ctx, `${c.sp}sp`, 300, 77 + i * 24, UI.pink); });
      drawCursor(ctx, 200, 66 + this.ti * 24, game.frame);
    }
    this.drawMsg(ctx);
  }
}

// Swap members between the active party (max 4) and the reserve.
class PartyMenu extends Panel {
  constructor() { super(); this.i = 0; this.held = null; }
  slots() { const s = st(); const reserve = (s.roster || []).filter((id) => !s.party.includes(id)); return [...s.party, ...reserve]; }
  update() {
    if (this.tickMsg()) return;
    const L = this.slots();
    nav(this, 'i', L.length);
    if (input.pressed('b')) { audio.sfx('cancel'); if (this.held !== null) { this.held = null; return; } this.close(); return; }
    if (!input.pressed('a')) return;
    const s = st();
    if (this.held === null) { this.held = this.i; audio.sfx('confirm'); return; }
    const a = L[this.held], b = L[this.i];
    const aIn = s.party.includes(a), bIn = s.party.includes(b);
    const locked = s.lockedMembers || [];
    if (aIn && bIn) { const ia = s.party.indexOf(a), ib = s.party.indexOf(b); s.party[ia] = b; s.party[ib] = a; }
    else if (aIn !== bIn) {
      const out = aIn ? a : b, inn = aIn ? b : a;
      if (locked.includes(out)) { audio.sfx('buzzer'); this.say(s.chars[out].name + ' must stay in the party.'); this.held = null; return; }
      s.party[s.party.indexOf(out)] = inn;
    } else if (s.party.length < 4) { s.party.push(a); }
    this.held = null;
    audio.sfx('confirm');
    s.leaderSprite = s.chars[s.party[0]].fieldOverride || s.chars[s.party[0]].field;
    const f = game.fieldScene; if (f && f.player && !f.vehicle) f.player.sprite = s.leaderSprite;
  }
  draw(ctx) {
    const L = this.slots();
    const s = st();
    drawWindow(ctx, 8, 8, 368, 200);
    drawText(ctx, 'Active', 22, 14, UI.gold);
    drawText(ctx, 'Reserve', 202, 14, UI.gold);
    L.forEach((id, i) => {
      const c = s.chars[id];
      const active = s.party.includes(id);
      const col = active ? 0 : 1, row = active ? s.party.indexOf(id) : i - s.party.length;
      const x = 20 + col * 180, y = 28 + row * (active ? 42 : 24);
      if (active) drawMember(ctx, c, x, y, this.held === i);
      else { const img = fieldSheet(c.fieldOverride || c.field).down[0]; ctx.drawImage(img, x + 8 - img.width / 2, y + 20 - img.height); drawText(ctx, `${c.name}  LV${c.lv}`, x + 20, y + 6, this.held === i ? UI.gold : UI.text); }
      if (i === this.i) drawCursor(ctx, x - 12, y + 6, game.frame);
    });
    drawText(ctx, 'Pick two to swap. Leader walks in front.', 22, 194, UI.textDim);
    this.drawMsg(ctx);
  }
}

class EquipMenu extends Panel {
  constructor(c) { super(); this.c = c; this.slot = 0; this.mode = 'slot'; this.li = 0; }
  slotName(i) { return ['weapon', 'armor', 'relic'][i]; }
  options() {
    const slot = this.slotName(this.slot);
    const inv = st().gear || {};
    const list = Object.entries(inv).filter(([id, n]) => n > 0 && GEAR[id] && GEAR[id].slot === slot && (slot !== 'weapon' || GEAR[id].cls === this.c.weapon)).map(([id]) => id);
    return ['(remove)', ...list];
  }
  update() {
    const c = this.c;
    if (this.mode === 'slot') {
      nav(this, 'slot', 3);
      if (input.pressed('b')) { audio.sfx('cancel'); this.close(); return; }
      if (input.pressed('a')) { if (this.slot === 0 && (c.weapon === 'none' || !c.weapon)) { audio.sfx('buzzer'); return; } this.mode = 'list'; this.li = 0; audio.sfx('confirm'); }
      return;
    }
    const L = this.options();
    nav(this, 'li', L.length);
    if (input.pressed('b')) { this.mode = 'slot'; audio.sfx('cancel'); return; }
    if (input.pressed('a')) {
      const slot = this.slotName(this.slot);
      const inv = (st().gear ||= {});
      const cur = c.gear[slot];
      const pick = L[this.li];
      if (cur) inv[cur] = (inv[cur] || 0) + 1;
      if (pick === '(remove)') c.gear[slot] = null;
      else { c.gear[slot] = pick; inv[pick]--; }
      audio.sfx('item');
      this.mode = 'slot';
    }
  }
  draw(ctx) {
    const c = this.c;
    drawWindow(ctx, 8, 8, 368, 200);
    drawMember(ctx, c, 16, 14);
    ['Weapon', 'Armor', 'Relic'].forEach((n, i) => {
      const g = c.gear[this.slotName(i)];
      drawText(ctx, n, 30, 52 + i * 13, UI.textDim);
      drawText(ctx, g ? GEAR[g].name : '-', 84, 52 + i * 13, UI.text);
    });
    if (this.mode === 'slot') drawCursor(ctx, 14, 52 + this.slot * 13, game.frame);
    const s = stats(c);
    let preview = null;
    if (this.mode === 'list') {
      const L = this.options();
      drawWindow(ctx, 196, 44, 176, Math.min(11, L.length) * 12 + 10);
      const start = Math.max(0, Math.min(L.length - 11, this.li - 5));
      L.slice(start, start + 11).forEach((id, i) => { drawText(ctx, id === '(remove)' ? '(remove)' : GEAR[id].name, 214, 50 + i * 12, UI.text); if (id !== '(remove)') drawTextRight(ctx, 'x' + st().gear[id], 366, 50 + i * 12, UI.gold); });
      drawCursor(ctx, 200, 50 + (this.li - start) * 12, game.frame);
      const pick = L[this.li];
      const slot = this.slotName(this.slot);
      const old = c.gear[slot];
      c.gear[slot] = pick === '(remove)' ? null : pick;
      preview = stats(c);
      c.gear[slot] = old;
      if (pick !== '(remove)') { const g = GEAR[pick]; const fx = [g.spHalf && 'SP cost halved', g.immune && 'Blocks ailments', g.noEncounters && 'No random battles', g.startStatus && 'Starts with ' + g.startStatus, g.counter && 'Counterattacks'].filter(Boolean)[0]; if (fx) drawText(ctx, fx, 30, 196, UI.name); }
    }
    ['atk', 'def', 'mag', 'mdf', 'spd'].forEach((k, i) => {
      drawText(ctx, k.toUpperCase(), 30, 104 + i * 13, UI.textDim);
      drawTextRight(ctx, String(s[k]), 96, 104 + i * 13, UI.text);
      if (preview && preview[k] !== s[k]) { drawText(ctx, '>', 104, 104 + i * 13, UI.textDim); drawTextRight(ctx, String(preview[k]), 140, 104 + i * 13, preview[k] > s[k] ? UI.hp : UI.hpLow); }
    });
  }
}

class EchoMenu extends Panel {
  constructor(c) { super(); this.c = c; this.li = 0; }
  options() { return ['(none)', ...(st().shards || [])]; }
  holder(sh) { return Object.values(st().chars).find((x) => x.echo === sh && x !== this.c); }
  update() {
    const L = this.options();
    nav(this, 'li', L.length);
    if (input.pressed('b')) { audio.sfx('cancel'); this.close(); return; }
    if (input.pressed('a')) {
      const pick = L[this.li];
      if (pick === '(none)') this.c.echo = null;
      else { const h = this.holder(pick); if (h) h.echo = null; this.c.echo = pick; }
      audio.sfx('chime');
      this.close();
    }
  }
  draw(ctx) {
    const L = this.options();
    const tier = echoTier(st());
    drawWindow(ctx, 8, 8, 368, 200);
    drawMember(ctx, this.c, 16, 14);
    drawText(ctx, `Echo strength: tier ${tier}`, 200, 16, R.spirit[1]);
    L.forEach((id, i) => {
      const y = 46 + i * 12;
      if (id === '(none)') { drawText(ctx, '(none)', 30, y, UI.text); return; }
      const h = this.holder(id);
      drawText(ctx, ECHOES[id].name, 30, y, this.c.echo === id ? UI.gold : UI.text);
      if (h) drawText(ctx, h.name, 150, y, UI.textDim);
    });
    drawCursor(ctx, 14, 46 + this.li * 12, game.frame);
    const pick = L[this.li];
    if (pick !== '(none)') {
      const e = ECHOES[pick];
      drawText(ctx, 'A memory of ' + e.esper, 200, 46, UI.name);
      e.spells.forEach(([t, id], i) => drawText(ctx, `${ABIL[id].name}`, 200, 62 + i * 12, t <= tier ? UI.text : UI.textDim));
      drawText(ctx, Object.entries(e.bonus).map(([k, v]) => `${k.toUpperCase()}+${v}`).join(' '), 200, 104, R.brass[0]);
    }
  }
}

class StatusMenu extends Panel {
  constructor(c) { super(); this.c = c; }
  update() { if (input.pressed('a') || input.pressed('b')) { audio.sfx('cancel'); this.close(); } }
  draw(ctx) {
    const c = this.c;
    const s = stats(c);
    drawWindow(ctx, 8, 8, 368, 200);
    drawMember(ctx, c, 16, 14);
    drawText(ctx, c.title || '', 200, 16, UI.textDim);
    drawText(ctx, `EXP ${c.exp}`, 30, 46, UI.text);
    drawText(ctx, `Next ${Math.max(0, expForLevel(c.lv + 1) - c.exp)}`, 30, 58, UI.textDim);
    ['atk', 'def', 'mag', 'mdf', 'spd'].forEach((k, i) => { drawText(ctx, k.toUpperCase(), 30, 78 + i * 13, UI.textDim); drawTextRight(ctx, String(s[k]), 96, 78 + i * 13, UI.text); });
    drawText(ctx, 'Commands', 200, 46, UI.gold);
    c.cmds.forEach((k, i) => drawText(ctx, CMD_NAMES[k] || k, 210, 58 + i * 12, UI.text));
    if (!c.cmds.length) drawText(ctx, '(acts on instinct)', 210, 58, UI.textDim);
    drawText(ctx, 'Echo: ' + (c.echo ? ECHOES[c.echo].name : '-'), 200, 120, R.spirit[1]);
    const list = c.cmds.filter((k) => !['fight', 'item', 'defend', 'echo'].includes(k)).flatMap((k) => abilitiesFor(c, k, st())).slice(0, 6);
    list.forEach((id, i) => drawText(ctx, ABIL[id].name, 210, 134 + i * 11, UI.name));
  }
}

// ---------------------------------------------------------------- shops & inns
export class ShopMenu extends Panel {
  constructor(shopId) { super(); this.shop = SHOPS[shopId]; this.mode = 'top'; this.i = 0; this.li = 0; this.qty = 1; }
  priceOf(id) { return (ITEMS[id] || GEAR[id]).price || 0; }
  nameOf(id) { return (ITEMS[id] || GEAR[id]).name; }
  owned(id) { return ITEMS[id] ? (st().items[id] || 0) : (st().gear[id] || 0) + Object.values(st().chars).filter((c) => Object.values(c.gear).includes(id)).length; }
  sellList() {
    const s = st();
    return [...Object.entries(s.items).filter(([k, n]) => n > 0 && ITEMS[k] && !ITEMS[k].key && ITEMS[k].price), ...Object.entries(s.gear || {}).filter(([k, n]) => n > 0 && GEAR[k] && GEAR[k].price)].map(([k]) => k);
  }
  update() {
    if (this.tickMsg()) return;
    const s = st();
    s.gear ||= {};
    if (this.mode === 'top') {
      nav(this, 'i', 3);
      if (input.pressed('b')) { audio.sfx('cancel'); this.close(); return; }
      if (input.pressed('a')) { audio.sfx('confirm'); if (this.i === 2) { this.close(); return; } this.mode = this.i === 0 ? 'buy' : 'sell'; this.li = 0; this.qty = 1; }
      return;
    }
    const L = this.mode === 'buy' ? this.shop.stock : this.sellList();
    if (!L.length) { this.mode = 'top'; this.say('Nothing to sell.'); return; }
    this.li = Math.min(this.li, L.length - 1);
    nav(this, 'li', L.length);
    if (input.repeat('right')) { this.qty = Math.min(99, this.qty + 1); audio.sfx('cursor'); }
    if (input.repeat('left')) { this.qty = Math.max(1, this.qty - 1); audio.sfx('cursor'); }
    if (input.pressed('b')) { this.mode = 'top'; audio.sfx('cancel'); return; }
    if (input.pressed('a')) {
      const id = L[this.li];
      const bag = ITEMS[id] ? s.items : s.gear;
      if (this.mode === 'buy') {
        const cost = this.priceOf(id) * this.qty;
        if ((s.gp || 0) < cost) { audio.sfx('buzzer'); this.say('Not enough GP.'); return; }
        s.gp -= cost; bag[id] = (bag[id] || 0) + this.qty; audio.sfx('item');
      } else {
        const n = Math.min(this.qty, bag[id] || 0);
        s.gp = (s.gp || 0) + Math.floor(this.priceOf(id) / 2) * n; bag[id] -= n; audio.sfx('item');
      }
      this.qty = 1;
    }
  }
  draw(ctx) {
    const s = st();
    drawWindow(ctx, 8, 8, 368, 30);
    drawText(ctx, this.shop.name, 20, 18, UI.gold);
    drawTextRight(ctx, (s.gp || 0) + ' GP', 366, 18, R.brass[0]);
    drawWindow(ctx, 8, 42, 100, 50);
    ['Buy', 'Sell', 'Leave'].forEach((o, i) => drawText(ctx, o, 30, 49 + i * 13, UI.text));
    if (this.mode === 'top') drawCursor(ctx, 14, 49 + this.i * 13, game.frame);
    if (this.mode !== 'top') {
      const L = this.mode === 'buy' ? this.shop.stock : this.sellList();
      drawWindow(ctx, 112, 42, 264, 166);
      const rows = 12;
      const start = Math.max(0, Math.min(L.length - rows, this.li - 6));
      L.slice(start, start + rows).forEach((id, i) => {
        const y = 49 + i * 12;
        const g = GEAR[id];
        const fits = g && g.slot === 'weapon' ? Object.values(s.chars).filter((c) => (s.roster || []).includes(c.id) && c.weapon === g.cls).map((c) => c.name[0]).join('') : '';
        drawText(ctx, this.nameOf(id), 130, y, UI.text);
        if (fits) drawText(ctx, fits, 250, y, UI.textDim);
        drawTextRight(ctx, String(this.mode === 'buy' ? this.priceOf(id) : Math.floor(this.priceOf(id) / 2)), 336, y, UI.gold);
        drawTextRight(ctx, String(this.owned(id)), 368, y, UI.textDim);
      });
      drawCursor(ctx, 116, 49 + (this.li - start) * 12, game.frame);
      const id = L[this.li];
      if (id) {
        const it = ITEMS[id] || GEAR[id];
        const desc = it.desc || [it.atk && 'ATK ' + it.atk, it.def && 'DEF ' + it.def, it.mag && 'MAG ' + it.mag, it.mdf && 'MDF ' + it.mdf, it.spd && 'SPD +' + it.spd].filter(Boolean).join('  ');
        drawWindow(ctx, 8, 96, 100, 112);
        wrap(desc || '', 86).slice(0, 7).forEach((l, i) => drawText(ctx, l, 14, 102 + i * 11, UI.name));
        drawText(ctx, `Qty < ${this.qty} >`, 14, 194, UI.text);
      }
    }
    this.drawMsg(ctx);
  }
}

// Pick a team from the roster (story splits). required: ids that must be on this team.
export class PartyPicker extends Panel {
  constructor(o) {
    super();
    this.title = o.title || 'Choose a party';
    this.pool = o.pool;
    this.min = o.min || 1; this.max = o.max || 4;
    this.chosen = [...(o.required || [])];
    this.required = o.required || [];
    this.i = 0;
    this.promise = new Promise((res) => { this.resolve = res; });
  }
  update() {
    if (this.tickMsg()) return;
    const L = [...this.pool, 'Done'];
    nav(this, 'i', L.length);
    if (!input.pressed('a')) return;
    const id = L[this.i];
    if (id === 'Done') {
      if (this.chosen.length < this.min) { audio.sfx('buzzer'); this.say(`Choose at least ${this.min}.`); return; }
      audio.sfx('confirm'); removeOverlay(this); input.clearAll(); this.resolve(this.chosen); return;
    }
    if (this.required.includes(id)) { audio.sfx('buzzer'); return; }
    if (this.chosen.includes(id)) this.chosen = this.chosen.filter((c) => c !== id);
    else if (this.chosen.length < this.max) this.chosen.push(id);
    else { audio.sfx('buzzer'); return; }
    audio.sfx('cursor');
  }
  draw(ctx) {
    drawWindow(ctx, 8, 8, 368, 200);
    drawText(ctx, this.title, 20, 14, UI.gold);
    drawText(ctx, `${this.chosen.length}/${this.max}`, 330, 14, UI.text);
    const L = [...this.pool, 'Done'];
    L.forEach((id, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 30 + col * 170, y = 30 + row * 16;
      if (id === 'Done') { drawText(ctx, 'Done', x, y, UI.gold); }
      else { const c = st().chars[id]; drawText(ctx, c.name + '  LV' + c.lv, x, y, this.chosen.includes(id) ? UI.gold : UI.text); if (this.required.includes(id)) drawText(ctx, '*', x - 8, y, UI.hpLow); }
      if (i === this.i) drawCursor(ctx, x - 16, y, game.frame);
    });
    this.drawMsg(ctx);
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
