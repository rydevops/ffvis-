// Active Time Battle. Party on the right (facing left), enemies on the left.
// Attack anatomy per the guide: anticipation -> launch -> travel -> impact (held, target
// flashes white 2 frames) -> dissipation.
import { game, wait, flash, shake, fadeOut, setFade, fadeIn } from '../game.js';
import * as input from '../core/input.js';
import * as audio from '../core/audio.js';
import { W, H, drawWindow, drawCursor, ditherRect, ditherPattern, whiteOf, darkOf, rot90, flipH, makeCanvas, bayer } from '../core/gfx.js';
import { drawText, drawTextRight, drawTextCentered, drawNumber, numberWidth, textWidth } from '../core/font.js';
import { UI, R, EL, OUTLINE } from '../data/palette.js';
import { battleSprite } from '../data/sprites.js';
import { ENEMIES, enemySprite } from '../data/enemies.js';
import { CMD_NAMES, SALVAGE, SPIRIT, ITEMS, expForLevel, levelUp } from '../data/party.js';
import { drawBg } from './bgs.js';
import { say } from './ui.js';

const FIELD_H = 160;
const rnd = (a, b) => a + Math.random() * (b - a);
const ease = (t) => 0.5 - Math.cos(Math.PI * Math.min(1, Math.max(0, t))) / 2;

// enemy formations (feet positions) by count
const SLOTS = {
  1: [[80, 120]],
  2: [[60, 104], [120, 136]],
  3: [[50, 96], [118, 112], [62, 146]],
  4: [[46, 92], [112, 100], [60, 140], [126, 148]],
};

export class BattleScene {
  constructor(group, opts) {
    this.group = group;
    this.opts = opts;
    this.bg = opts.bg || 'vault';
    this.t = 0;
    this.fx = [];
    this.nums = [];
    this.queue = [];
    this.menu = null;
    this.acting = false;
    this.over = false;
    this.paused = false;
    this.turns = 0;
    this.fleeT = 0;
    this.msg = null;
    this.turret = null;
    this.decoy = 0;
  }

  enter() {
    const st = game.state;
    const n = st.party.length;
    const ys = n === 1 ? [74] : n === 2 ? [56, 92] : [42, 76, 108];
    this.party = st.party.map((id, i) => {
      const c = st.chars[id];
      return {
        side: 'party', id, c, name: c.name, sprite: c.spriteOverride || c.battle,
        hx: 300 + i * 10, hy: ys[i], dx: 0, dy: 0, pose: null, atb: rnd(20, 70), ready: false,
        defending: false, flashT: 0, get alive() { return this.c.hp > 0; },
      };
    });
    this.enemies = [];
    this.group.forEach((kind) => this.addEnemy(kind));
    const boss = this.opts.boss;
    audio.playMusic(this.opts.battleMusic || (boss ? 'boss' : 'battle'));
    audio.setAmbience('none');
    this.scriptQueue = [];
    if (this.opts.script) this.runHook('start');
  }

  addEnemy(kind, at) {
    const d = ENEMIES[kind];
    const big = d.big;
    const e = {
      side: 'enemy', kind, d, name: d.name, hp: d.hp, maxhp: d.hp, atb: rnd(0, 40), dx: 0, dy: 0, flashT: 0,
      dying: 0, alive: true, phase: Math.random() * 100, dmg: 0,
    };
    this.enemies.push(e);
    this.layoutEnemies(at);
    return e;
  }

  layoutEnemies() {
    const live = this.enemies.filter((e) => e.alive || e.dying);
    const big = live.filter((e) => e.d.big);
    const small = live.filter((e) => !e.d.big);
    if (big.length) {
      big.forEach((e) => { e.fx = 30; e.fy = 150; });
      const slots = [[130, 70], [146, 120], [20, 70], [24, 128]];
      small.forEach((e, i) => { [e.fx, e.fy] = slots[i % slots.length]; });
    } else {
      const s = SLOTS[Math.min(4, small.length)] || SLOTS[4];
      small.forEach((e, i) => { [e.fx, e.fy] = s[i % s.length]; });
    }
  }

  // ---------------------------------------------------------------- helpers
  livingParty() { return this.party.filter((p) => p.alive); }
  livingEnemies() { return this.enemies.filter((e) => e.alive); }
  spriteOf(b) {
    if (b.side === 'party') {
      if (!b.alive) return null;
      let pose = b.pose;
      if (!pose) {
        if (b.defending) pose = 'defend';
        else if (b.c.hp < b.c.maxhp / 4) pose = 'kneel';
        else pose = 'idle' + (Math.floor(this.t / 12) % 4);
      }
      return battleSprite(b.sprite, pose);
    }
    const frame = Math.floor((this.t + b.phase) / 24) % 2; // glass core pulses on a 48-frame loop
    return enemySprite(b.kind, frame, b.dmg);
  }
  posOf(b) { // top-left of sprite
    if (b.side === 'party') return [b.hx + b.dx, b.hy + b.dy];
    const s = this.spriteOf(b);
    const bob = b.d.hover ? Math.round(Math.sin(((this.t + b.phase) / 32) * Math.PI * 2) * 2) : 0;
    return [Math.round(b.fx + b.dx - (b.d.big ? 0 : s.width / 2)), Math.round(b.fy + b.dy - s.height + bob)];
  }
  centerOf(b) {
    const [x, y] = this.posOf(b);
    if (b.side === 'party') return [x + 14, y + 22];
    const s = this.spriteOf(b);
    return [x + s.width / 2, y + s.height / 2];
  }

  // ---------------------------------------------------------------- update
  update(canControl, noOverlay) {
    this.t++;
    for (const f of this.fx) { f.t++; if (f.kind === 'timer' && f.t >= f.dur && !f.fired) { f.fired = true; f.done(); } }
    this.fx = this.fx.filter((f) => f.t <= f.dur);
    for (const n of this.nums) n.t++;
    this.nums = this.nums.filter((n) => n.t < 54);
    for (const b of [...this.party, ...this.enemies]) if (b.flashT > 0) b.flashT--;
    for (const e of this.enemies) if (e.dying > 0) { e.dying--; if (e.dying === 0) this.layoutEnemies(); }
    if (!noOverlay) return; // dialogue on top: everything waits
    if (this.over) { if (this.overUpdate) this.overUpdate(); return; }

    const menuOpen = !!this.menu;
    const waitMode = game.settings.battleMode === 'wait';
    const timeRuns = !this.acting && !this.paused && !(menuOpen && waitMode);
    if (timeRuns) {
      for (const p of this.party) {
        if (!p.alive || p.ready) continue;
        p.atb += (p.c.spd + 20) * 0.075 * (p.c.haste ? 1.5 : 1);
        if (p.atb >= 100) { p.atb = 100; p.ready = true; p.defending = false; }
      }
      for (const e of this.livingEnemies()) {
        e.atb += (e.d.spd + 20) * 0.075;
        if (e.atb >= 100) { e.atb = 0; this.queue.push({ enemy: e }); }
      }
      if (this.turret && this.turret.shots > 0) {
        this.turret.atb += 1.6;
        if (this.turret.atb >= 100) { this.turret.atb = 0; this.queue.push({ turret: true }); }
      }
    }

    // flee: hold B (not in boss fights)
    if (!this.opts.boss && !this.opts.noFlee && input.isHeld('b') && !this.acting && (!this.menu || this.menu.stage === 'cmd')) {
      this.fleeT++;
      if (this.fleeT > 70) { this.flee(); return; }
    } else this.fleeT = 0;

    if (!this.acting && this.queue.length && !this.paused) {
      const a = this.queue.shift();
      this.acting = true;
      this.execute(a).finally(() => { this.acting = false; this.afterAction(); });
    }

    if (!this.menu && !this.paused) {
      const r = this.party.find((p) => p.ready && p.alive && !this.queue.some((q) => q.actor === p));
      if (r) this.openMenu(r);
    }
    if (this.menu) this.updateMenu();
  }

  async runHook(ev) {
    if (!this.opts.script) return;
    this.paused = true;
    try { await this.opts.script(this, ev); } finally { this.paused = false; }
  }

  afterAction() {
    this.turns++;
    if (!this.livingEnemies().length) { this.victory(); return; }
    if (!this.livingParty().length) { this.defeat(); return; }
    if (this.opts.script) this.runHook('turn');
  }

  // ---------------------------------------------------------------- menus
  openMenu(p) {
    const cmds = p.c.cmds.slice();
    this.menu = { actor: p, stage: 'cmd', i: this.lastCmd?.[p.id] || 0, cmds };
    audio.sfx('cursor');
  }

  updateMenu() {
    const m = this.menu;
    const p = m.actor;
    if (!p.alive) { this.menu = null; return; }
    if (m.stage === 'cmd') {
      if (input.repeat('down')) { m.i = (m.i + 1) % m.cmds.length; audio.sfx('cursor'); }
      if (input.repeat('up')) { m.i = (m.i + m.cmds.length - 1) % m.cmds.length; audio.sfx('cursor'); }
      if (input.pressed('right') || input.pressed('left')) { // skip to next ready member
        const others = this.party.filter((q) => q.ready && q.alive && q !== p && !this.queue.some((a) => a.actor === q));
        if (others.length) { this.menu = null; this.openMenu(others[0]); return; }
      }
      if (input.pressed('a')) {
        const cmd = m.cmds[m.i];
        (this.lastCmd ||= {})[p.id] = m.i;
        audio.sfx('confirm');
        if (cmd === 'fight') this.beginTarget({ kind: 'fight' }, 'enemy');
        else if (cmd === 'defend') this.commit({ kind: 'defend', actor: p });
        else if (cmd === 'heave') this.beginTarget({ kind: 'heave' }, 'enemy');
        else if (cmd === 'brace') this.beginTarget({ kind: 'brace' }, 'ally');
        else if (cmd === 'blast') {
          if (this.blastUsed) { audio.sfx('buzzer'); this.flashMsg('The charges are spent.'); return; }
          this.commit({ kind: 'blast', actor: p, targets: this.livingEnemies() });
        } else if (cmd === 'salvage') this.openList('salvage', SALVAGE.map((s) => ({ ...s, label: s.name, right: s.cost + 'p', ok: game.state.parts >= s.cost })));
        else if (cmd === 'spirit') this.openList('spirit', SPIRIT.map((s) => ({ ...s, label: s.name, right: s.cost + ' SP', ok: p.c.sp >= s.cost })));
        else if (cmd === 'item') {
          const list = Object.entries(game.state.items).filter(([k, n]) => n > 0 && !ITEMS[k].key)
            .map(([k, n]) => ({ id: k, label: ITEMS[k].name, right: 'x' + n, ok: true, target: ITEMS[k].target, desc: ITEMS[k].desc }));
          if (!list.length) { audio.sfx('buzzer'); this.flashMsg('No items.'); return; }
          this.openList('item', list);
        }
      }
      return;
    }
    if (m.stage === 'list') {
      const L = m.list;
      if (input.repeat('down')) { m.li = (m.li + 1) % L.length; audio.sfx('cursor'); }
      if (input.repeat('up')) { m.li = (m.li + L.length - 1) % L.length; audio.sfx('cursor'); }
      if (input.pressed('b')) { m.stage = 'cmd'; audio.sfx('cancel'); return; }
      if (input.pressed('a')) {
        const it = L[m.li];
        if (!it.ok) { audio.sfx('buzzer'); return; }
        audio.sfx('confirm');
        const act = { kind: m.listKind, id: it.id };
        const tgt = it.target;
        if (tgt === 'none') this.commit({ ...act, actor: p });
        else if (tgt === 'allEnemies') this.commit({ ...act, actor: p, targets: this.livingEnemies() });
        else this.beginTarget(act, tgt === 'ally' ? 'ally' : 'enemy', it.id === 'salts');
      }
      return;
    }
    if (m.stage === 'target') {
      const pool = m.side === 'enemy' ? this.livingEnemies() : this.party.filter((q) => m.allowKO ? true : q.alive);
      if (!pool.length) { m.stage = 'cmd'; return; }
      m.ti = Math.min(m.ti, pool.length - 1);
      if (input.repeat('down') || input.repeat('right') && m.side === 'party') { m.ti = (m.ti + 1) % pool.length; audio.sfx('cursor'); }
      if (input.repeat('up') || input.repeat('left') && m.side === 'party') { m.ti = (m.ti + pool.length - 1) % pool.length; audio.sfx('cursor'); }
      if (m.side === 'enemy' && input.pressed('right')) { m.side = 'party'; m.ti = this.party.indexOf(p); audio.sfx('cursor'); }
      else if (m.side === 'party' && input.pressed('left') && m.act.kind !== 'brace') { m.side = 'enemy'; m.ti = 0; audio.sfx('cursor'); }
      if (input.pressed('b')) { m.stage = m.list ? 'list' : 'cmd'; audio.sfx('cancel'); return; }
      if (input.pressed('a')) {
        audio.sfx('confirm');
        const target = (m.side === 'enemy' ? this.livingEnemies() : this.party.filter((q) => m.allowKO ? true : q.alive))[m.ti];
        this.commit({ ...m.act, actor: p, targets: [target] });
      }
    }
  }

  openList(kind, list) {
    const m = this.menu;
    m.stage = 'list'; m.listKind = kind; m.list = list; m.li = 0;
  }
  beginTarget(act, side, allowKO = false) {
    const m = this.menu;
    m.stage = 'target'; m.act = act; m.side = side; m.allowKO = allowKO;
    m.ti = side === 'party' ? this.party.indexOf(m.actor) : 0;
  }
  commit(act) {
    const p = act.actor;
    p.ready = false;
    this.queue.push(act);
    this.menu = null;
  }
  flashMsg(text, frames = 70) { this.msg = { text, t: frames }; }

  // ---------------------------------------------------------------- execution
  async execute(a) {
    if (a.turret) return this.turretShot();
    if (a.enemy) return this.enemyAct(a.enemy);
    const p = a.actor;
    if (!p.alive) return;
    p.atb = 0;
    const targets = (a.targets || []).map((t) => (t.alive || (t.side === 'party' && a.id === 'salts') ? t : this.retarget(t))).filter(Boolean);
    switch (a.kind) {
      case 'fight': return this.physical(p, targets[0], 1, CMD_NAMES.fight);
      case 'heave': await this.physical(p, targets[0], 1.7, 'Heave'); p.atb = -40; return;
      case 'defend': p.defending = true; audio.sfx('defend'); this.flashMsg(p.name + ' defends.', 40); await wait(20); return;
      case 'brace': {
        const t = targets[0];
        this.brace = { by: p, for: t };
        audio.sfx('defend');
        this.flashMsg(`${p.name} braces to cover ${t.name}.`, 60);
        p.defending = true;
        await wait(24); return;
      }
      case 'blast': return this.blast(p);
      case 'salvage': return this.salvage(p, a.id, targets);
      case 'spirit': return this.spirit(p, a.id, targets);
      case 'item': return this.useItem(p, a.id, targets[0]);
    }
  }

  retarget(t) {
    if (t.side === 'enemy') return this.livingEnemies()[0] || null;
    return this.livingParty()[0] || null;
  }

  async stepForward(p, dist = 16) {
    for (let i = 1; i <= 12; i++) { p.dx = -Math.round((dist * i) / 12); await wait(1); }
  }
  async stepBack(p) {
    const from = p.dx;
    for (let i = 1; i <= 10; i++) { p.dx = Math.round(from * (1 - i / 10)); await wait(1); }
    p.dx = 0;
  }

  calcPhys(att, def, power) {
    const crit = Math.random() < 0.07;
    let dmg;
    if (att.c) { // party -> enemy
      dmg = (att.c.atk * 3 + att.c.lv * 2) * power * rnd(0.88, 1.12) - def.d.def * 1.2;
    } else { // enemy -> party
      dmg = (att.d.atk * 2.2 + 6) * power * rnd(0.88, 1.12) - def.c.def * 1.2;
    }
    if (crit) dmg *= 1.8;
    return { dmg: Math.max(1, Math.round(dmg)), crit };
  }

  async physical(p, target, power, label) {
    if (!target) return;
    await this.stepForward(p);
    p.pose = 'windup'; await wait(6); // anticipation
    p.pose = 'swing';
    audio.sfx(p.c.weapon === 'none' ? 'hit' : 'slash');
    this.addSmear(p, p.c.weapon);
    await wait(2);
    const { dmg, crit } = this.calcPhys(p, target, power);
    await this.impact(target, dmg, { crit, weapon: p.c.weapon });
    await wait(6);
    p.pose = 'idle0'; p.pose = null;
    await wait(8);
    await this.stepBack(p);
  }

  // Impact: biggest frame, target flashes white 2 frames, number pops.
  async impact(target, dmg, o = {}) {
    const [cx, cy] = this.centerOf(target);
    if (dmg === 'miss') { this.addNum(target, 'MISS', '#9A927E'); audio.sfx('miss'); return; }
    let amount = dmg;
    if (target.side === 'party') {
      if (this.decoy > 0 && !o.noDecoy) { this.decoy--; this.addFx('spark', cx - 20, cy, { style: 'ring', color: EL.holy }); this.flashMsg('The decoy takes the hit!', 50); audio.sfx('glass'); return; }
      if (this.brace && this.brace.for === target && this.brace.by.alive && this.brace.by !== target && !o.all) {
        const by = this.brace.by;
        this.flashMsg(`${by.name} steps in!`, 40);
        target = by;
        amount = Math.round(amount * 0.6);
      }
      if (target.defending) amount = Math.round(amount / 2);
    }
    target.flashT = 2;
    const [tx, ty] = this.centerOf(target);
    if (o.crit) { shake(2, 6); flash(); audio.sfx('crit'); target.flashT = 3; }
    else if (!o.silent) audio.sfx(o.heavy ? 'heavy' : 'hit');
    if (o.weapon !== undefined) this.addFx('spark', tx, ty, { style: o.weapon });
    if (target.side === 'enemy') {
      if (target.d.family === 'machine') this.addShards(tx, ty);
      else this.addFx('dust', tx, ty + 10, {});
    }
    if (target.side === 'party') {
      target.pose = 'hurt';
      target.dx = 2;
      this.after(10, () => { target.pose = null; target.dx = 0; });
    }
    this.damage(target, amount, o.crit ? '#F5D68A' : '#FFFDF5', o.crit);
    await wait(4);
  }

  after(frames, fn) { this.fx.push({ kind: 'timer', t: 0, dur: frames, done: fn }); }

  damage(target, amount, color, big = false) {
    if (target.side === 'party') {
      target.c.hp = Math.max(0, target.c.hp - amount);
      if (target.c.hp === 0) { target.ready = false; target.atb = 0; target.defending = false; audio.sfx('collapse'); if (this.menu && this.menu.actor === target) this.menu = null; }
    } else {
      target.hp = Math.max(0, target.hp - amount);
      target.dmg = target.hp < target.maxhp * 0.33 ? 2 : target.hp < target.maxhp * 0.66 ? 1 : 0;
      if (target.hp === 0 && target.alive) this.kill(target);
    }
    this.addNum(target, String(amount), color, big);
  }

  heal(target, amount) {
    if (target.side === 'party') {
      if (!target.alive) return;
      target.c.hp = Math.min(target.c.maxhp, target.c.hp + amount);
    } else target.hp = Math.min(target.maxhp, target.hp + amount);
    this.addNum(target, String(amount), '#78C050');
  }

  kill(e) {
    e.alive = false;
    e.dying = 24;
    audio.sfx(e.d.family === 'machine' ? 'glass' : 'collapse');
    this.spoils = this.spoils || { exp: 0, parts: 0, drops: [] };
    this.spoils.exp += e.d.exp;
    this.spoils.parts += e.d.parts || 0;
    if (e.d.drops && Math.random() < 0.5) this.spoils.drops.push(e.d.drops);
    if (e.d.family === 'machine') { const [x, y] = this.centerOf(e); for (let i = 0; i < 3; i++) this.addShards(x + rnd(-10, 10), y + rnd(-10, 10)); }
    this.queue = this.queue.filter((q) => q.enemy !== e);
  }

  // ---------------------------------------------------------------- abilities
  async blast(p) {
    this.blastUsed = true;
    await this.stepForward(p, 8);
    p.pose = 'windup'; await wait(8);
    p.pose = 'swing';
    this.flashMsg('Blast Charge', 60);
    // thrown charge travels, then fire tier 1 (faint, flickering) on all enemies
    const [sx, sy] = this.centerOf(p);
    for (let i = 0; i < 14; i++) { this.addFx('ember', sx - i * 12, sy - Math.sin(i / 14 * Math.PI) * 30, { life: 6 }); await wait(1); }
    audio.sfx('fire');
    shake(4, 10);
    for (const e of this.livingEnemies()) {
      const [x, y] = this.centerOf(e);
      this.addFx('flame', x, y + 8, { dur: 40 });
    }
    await wait(18);
    for (const e of this.livingEnemies()) {
      const weak = e.d.weak?.includes('fire') ? 2 : 1;
      await this.impact(e, Math.round((60 + p.c.lv * 6) * rnd(0.9, 1.1) * weak), { silent: true, noDecoy: true });
    }
    p.pose = null;
    await wait(10);
    await this.stepBack(p);
  }

  async salvage(p, id, targets) {
    const s = SALVAGE.find((x) => x.id === id);
    if (game.state.parts < s.cost) { this.flashMsg('Not enough parts.'); return; }
    game.state.parts -= s.cost;
    this.flashMsg(s.name, 50);
    p.pose = 'cast';
    audio.sfx('build');
    const [px, py] = this.centerOf(p);
    for (let i = 0; i < 6; i++) { this.addFx('part', px + rnd(-20, 4), py + rnd(-18, 10), { tx: px - 18, ty: py }); }
    await wait(16);
    if (id === 'shock') {
      const t = targets[0];
      if (!t) { p.pose = null; return; }
      const [tx, ty] = this.centerOf(t);
      this.addFx('bolt', tx, ty, { dur: 24 });
      audio.sfx('bolt');
      flash('#FFF890');
      await wait(10);
      const weak = t.d.weak?.includes('bolt') ? 2 : 1;
      const dmg = Math.round((p.c.mag * 3 + 20 + p.c.lv * 2) * rnd(0.9, 1.1) * weak);
      await this.impact(t, dmg, { silent: true });
      if (weak > 1) this.flashMsg('It shorts out!', 40);
    } else if (id === 'turret') {
      this.turret = { shots: 3, atb: 60, x: p.hx - 26, y: p.hy + 22, owner: p };
      audio.sfx('turret');
    } else if (id === 'decoy') {
      this.decoy = 2;
      this.addFx('spark', px - 30, py, { style: 'ring', color: EL.holy });
      audio.sfx('spirit');
    } else if (id === 'patch') {
      const t = targets[0];
      const [tx, ty] = this.centerOf(t);
      this.addFx('heal', tx, ty, { dur: 40 });
      audio.sfx('heal');
      await wait(20);
      this.heal(t, Math.round(80 + p.c.lv * 4));
    }
    await wait(10);
    p.pose = null;
  }

  async turretShot() {
    const t = this.turret;
    const e = this.livingEnemies()[Math.floor(Math.random() * this.livingEnemies().length)];
    if (!e) return;
    t.shots--;
    audio.sfx('turret');
    const [tx, ty] = this.centerOf(e);
    this.addFx('bolt-line', t.x, t.y, { tx, ty, dur: 8 });
    await wait(6);
    await this.impact(e, Math.round((24 + t.owner.c.lv * 3) * rnd(0.85, 1.15)), { weapon: 'bolts' });
    if (t.shots <= 0) { this.turret = null; this.flashMsg('The turret falls apart.', 40); }
  }

  async spirit(p, id, targets) {
    const s = SPIRIT.find((x) => x.id === id);
    p.c.sp -= s.cost;
    p.pose = 'cast';
    this.flashMsg(s.name, 60);
    const [px, py] = this.centerOf(p);
    this.addFx('aura', px, py, { dur: 24, color: R.spirit });
    audio.sfx('spirit');
    await wait(24);
    if (id === 'petal') {
      for (const e of this.livingEnemies()) { const [x, y] = this.centerOf(e); this.addFx('petals', x, y, { dur: 42 }); }
      game.fx.tint = null;
      await wait(26);
      for (const e of this.livingEnemies()) {
        const weak = e.d.weak?.includes('spirit') ? 2 : 1;
        await this.impact(e, Math.round((p.c.mag * 4 + 20) * rnd(0.9, 1.1) * weak), { silent: true });
      }
    } else if (id === 'mend') {
      const t = targets[0];
      const [tx, ty] = this.centerOf(t);
      this.addFx('heal', tx, ty, { dur: 40 });
      audio.sfx('heal');
      await wait(20);
      this.heal(t, Math.round(p.c.mag * 5 + 40));
    }
    await wait(8);
    p.pose = null;
  }

  async useItem(p, id, target) {
    const it = ITEMS[id];
    if (!game.state.items[id]) return;
    game.state.items[id]--;
    p.pose = 'item';
    this.flashMsg(it.name, 50);
    audio.sfx('item');
    await wait(10);
    if (it.flee) { p.pose = null; await this.flee(true); return; }
    if (!target) { p.pose = null; return; }
    const [tx, ty] = this.centerOf(target);
    if (it.revive) {
      if (target.alive) { this.addNum(target, 'MISS', '#9A927E'); }
      else {
        this.addFx('heal', tx, ty, { dur: 60 });
        audio.sfx('heal');
        await wait(20);
        target.c.hp = Math.max(1, Math.round(target.c.maxhp * it.revive));
        target.atb = 0;
        this.addNum(target, String(target.c.hp), '#78C050');
      }
    } else if (it.heal) {
      this.addFx('heal', tx, ty, { dur: 40 });
      audio.sfx('heal');
      await wait(18);
      this.heal(target, it.heal);
    }
    await wait(6);
    p.pose = null;
  }

  // ---------------------------------------------------------------- enemies
  pickMove(e) {
    let moves = e.d.moves.filter((m) => m.w > 0);
    if (e.kind === 'warden' && e.hp < e.maxhp * 0.5 && !e.usedSeal) { e.usedSeal = true; return e.d.moves.find((m) => m.fx === 'seal'); }
    if (e.kind === 'bloom') {
      const drones = this.livingEnemies().filter((x) => x.kind === 'seedDrone').length;
      if (drones === 0 && Math.random() < 0.6) return e.d.moves.find((m) => m.summon);
    }
    const total = moves.reduce((s, m) => s + m.w, 0);
    let r = Math.random() * total;
    for (const m of moves) { r -= m.w; if (r <= 0) return m; }
    return moves[0];
  }

  async enemyAct(e) {
    if (!e.alive) return;
    const move = this.pickMove(e);
    const living = this.livingParty();
    if (!living.length) return;
    let target = living[Math.floor(Math.random() * living.length)];
    this.flashMsg(move.name, 50);
    const machine = e.d.family === 'machine';
    // machines move with eased, perfectly smooth arcs, no overshoot; beasts lunge and settle
    const lunge = e.d.big ? 6 : 12;
    for (let i = 1; i <= 10; i++) { e.dx = machine ? Math.round(ease(i / 10) * lunge) : Math.round(Math.sin((i / 10) * Math.PI * 0.6) * lunge * 1.2); await wait(1); }
    e.flashT = 2;
    const [ex, ey] = this.centerOf(e);

    if (move.summon) {
      audio.sfx('flower');
      this.flashMsg('Silver seeds drift loose from the petals!', 60);
      for (let i = 0; i < 2; i++) if (this.enemies.filter((x) => x.alive).length < 4) this.addEnemy(move.summon);
      await wait(30);
    } else if (move.all) {
      if (move.fx === 'chord') { audio.sfx('chime'); for (let i = 0; i < 3; i++) { this.addFx('rings', ex, ey, { dur: 30, delay: i * 6, color: R.glass }); } }
      else if (move.fx === 'seal') { audio.sfx('laser'); flash(R.glass[0]); for (const p of living) { const [x, y] = this.centerOf(p); this.addFx('column', x, y, { dur: 40 }); } }
      else if (move.fx === 'pollen') { audio.sfx('flower'); for (const p of living) { const [x, y] = this.centerOf(p); this.addFx('pollen', x, y, { dur: 50 }); } }
      else audio.sfx('laser');
      await wait(22);
      for (const p of living) {
        const { dmg, crit } = this.calcPhys(e, p, move.power);
        await this.impact(p, dmg, { crit: false, all: true, silent: true });
      }
    } else {
      const [tx, ty] = this.centerOf(target);
      if (move.fx === 'beam') { audio.sfx('laser'); this.addFx('beam', ex, ey, { tx, ty, dur: 14 }); await wait(10); }
      else if (move.fx === 'needle') { audio.sfx('miss'); for (let i = 0; i <= 10; i++) { this.addFx('needle', ex + (tx - ex) * i / 10, ey + (ty - ey) * i / 10, { dur: 2 }); await wait(1); } }
      else if (move.fx === 'drain') {
        audio.sfx('drain');
        this.addFx('drain', tx, ty, { sx: ex, sy: ey, dur: 50 });
        await wait(30);
      } else if (move.fx === 'slam') { await wait(4); shake(4, 10); }
      else { audio.sfx('slash'); }
      const evade = Math.random() < 0.05;
      if (evade) await this.impact(target, 'miss');
      else {
        const { dmg, crit } = this.calcPhys(e, target, move.power);
        await this.impact(target, dmg, { crit, heavy: move.fx === 'slam' });
        if (move.drain) this.heal(e, Math.round(dmg * 0.6));
      }
    }
    for (let i = 1; i <= 10; i++) { e.dx = Math.round(lunge * (1 - ease(i / 10))); await wait(1); }
    e.dx = 0;
    if (this.brace && Math.random() < 0.5) this.brace = null;
  }

  // ---------------------------------------------------------------- endings
  async flee(item = false) {
    this.over = true;
    this.menu = null;
    audio.sfx('flee');
    this.flashMsg('Escaped!', 60);
    for (let i = 0; i < 24; i++) { for (const p of this.party) p.dx += 3; await wait(1); }
    await fadeOut(16);
    this.finish('flee');
  }

  async victory() {
    if (this.over) return;
    this.over = true;
    this.menu = null;
    await wait(30);
    if (this.opts.noVictory) { this.finish('win'); return; }
    audio.playMusic('victory');
    for (const p of this.party) if (p.alive) p.pose = 'victory';
    const sp = this.spoils || { exp: 0, parts: 0, drops: [] };
    const lines = [];
    const alive = this.party.filter((p) => p.alive);
    if (sp.exp) {
      lines.push(`Gained ${sp.exp} EXP.`);
      for (const p of alive) {
        p.c.exp += sp.exp;
        while (p.c.exp >= expForLevel(p.c.lv + 1)) { levelUp(p.c); lines.push(`${p.name} reached level ${p.c.lv}!`); audio.sfx('levelup'); }
      }
    }
    if (sp.parts) { game.state.parts += sp.parts; lines.push(`Salvaged ${sp.parts} machine part${sp.parts > 1 ? 's' : ''}.`); }
    for (const d of sp.drops) { game.state.items[d] = (game.state.items[d] || 0) + 1; lines.push(`Found a ${ITEMS[d].name}.`); }
    this.results = lines.length ? lines : ['Victory.'];
    this.overUpdate = () => {
      if (this.resT === undefined) this.resT = 0;
      this.resT++;
      if (this.resT > 30 && input.pressed('a')) { this.overUpdate = null; this.endWin(); }
    };
  }
  async endWin() {
    await fadeOut(16);
    for (const p of this.party) p.pose = null;
    this.finish('win');
  }

  async defeat() {
    if (this.over) return;
    this.over = true;
    this.menu = null;
    audio.stopMusic(1.5);
    await wait(40);
    if (this.opts.canLose) { await fadeOut(30); this.finish('lose'); return; }
    await fadeOut(40);
    this.finish('lose');
  }

  finish(result) {
    // fallen party members revive at 1 HP after a win so the field never has a dead leader
    if (result !== 'lose') for (const p of this.party) if (p.c.hp <= 0) p.c.hp = 1;
    this.opts.onEnd(result);
  }

  // ---------------------------------------------------------------- effects
  addFx(kind, x, y, o = {}) { this.fx.push({ kind, x, y, t: -(o.delay || 0), dur: o.dur || 16, ...o, draw: null }); }
  addShards(x, y) {
    for (let i = 0; i < 4; i++) this.fx.push({ kind: 'shard', x, y, vx: rnd(-1.5, 1.5), vy: rnd(-2.5, -0.5), t: 0, dur: 16 });
  }
  addSmear(p, weapon) {
    const [x, y] = this.posOf(p);
    this.fx.push({ kind: 'smear', x: x - 4, y: y + 8, t: 0, dur: 3, w: weapon === 'wrench' ? 5 : weapon === 'none' ? 4 : 6 });
  }
  addNum(target, text, color, big = false) {
    const [x, y] = this.centerOf(target);
    this.nums.push({ x, y: y - 10, text, color, t: 0, big });
  }

  drawFx(ctx) {
    for (const f of this.fx) {
      if (f.t < 0) continue;
      const t = f.t, k = t / f.dur;
      switch (f.kind) {
        case 'smear': { // crescent: white core, steel mid, dark trailing edge
          const lvl = t === 0 ? 4 : 2;
          for (let a = -60; a <= 70; a += 3) {
            const r = (a * Math.PI) / 180;
            for (let w = 0; w < f.w; w++) {
              const rr = 18 - w;
              const c = w < 2 ? '#FFFDF5' : w < f.w - 1 ? '#9AA0A8' : '#4C5058';
              const x = Math.round(f.x - Math.cos(r) * rr), y = Math.round(f.y + Math.sin(r) * rr);
              if (lvl === 4 || bayer(x, y, 2)) { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); }
            }
          }
          break;
        }
        case 'spark': { // 4-point cross star / impact ring, 5 frames
          const s = Math.min(t, 4);
          const col = f.color ? f.color[Math.min(3, s)] : ['#FFFDF5', '#FFF4C0', '#F5D68A', '#9AA0A8', '#6E747E'][s];
          ctx.fillStyle = col;
          if (f.style === 'ring' || f.style === 'none' || f.color) {
            const r = 4 + t * 2;
            for (let a = 0; a < 24; a++) { const ang = (a / 24) * Math.PI * 2; ctx.fillRect(Math.round(f.x + Math.cos(ang) * r), Math.round(f.y + Math.sin(ang) * r), 1, 1); }
          } else {
            const len = [6, 11, 12, 10, 6][s];
            ctx.fillRect(f.x - len, f.y, len * 2 + 1, 1);
            ctx.fillRect(f.x, f.y - len, 1, len * 2 + 1);
            const d = Math.floor(len * 0.5);
            for (let i = -d; i <= d; i++) { ctx.fillRect(f.x + i, f.y + i, 1, 1); ctx.fillRect(f.x + i, f.y - i, 1, 1); }
            if (s < 2) { ctx.fillStyle = '#FFFDF5'; ctx.fillRect(f.x - 2, f.y - 2, 5, 5); }
          }
          f.dur = Math.min(f.dur, 6);
          break;
        }
        case 'shard': { // white-and-cyan glass shards fall with gravity over 16 frames
          f.x += f.vx; f.vy += 0.25; f.y += f.vy;
          ctx.fillStyle = t % 4 < 2 ? R.glass[0] : R.glass[2];
          ctx.fillRect(Math.round(f.x), Math.round(f.y), 2, 2);
          break;
        }
        case 'dust': {
          const r = 3 + t;
          ctx.fillStyle = ditherPattern(ctx, R.folRuin[0], t < 8 ? 2 : 1);
          ctx.fillRect(Math.round(f.x - r), Math.round(f.y - r / 2), r * 2, r);
          f.dur = 14;
          break;
        }
        case 'beam': {
          const c = t < 4 ? R.glass[0] : R.glass[2];
          ctx.strokeStyle = c; ctx.lineWidth = 1;
          line(ctx, f.x, f.y, f.tx, f.ty, c);
          line(ctx, f.x, f.y + 1, f.tx, f.ty + 1, R.glass[3]);
          break;
        }
        case 'bolt-line': line(ctx, f.x, f.y, f.tx, f.ty, t % 2 ? EL.bolt[1] : '#FFFFFF'); break;
        case 'needle': ctx.fillStyle = R.stone[0]; ctx.fillRect(Math.round(f.x) - 2, Math.round(f.y), 5, 1); ctx.fillStyle = R.glass[1]; ctx.fillRect(Math.round(f.x) - 3, Math.round(f.y), 1, 1); break;
        case 'bolt': { // jagged 1-2px bolts, redrawn every frame
          if (t % 2) break;
          for (let b = 0; b < 2; b++) {
            let x = f.x + rnd(-6, 6), y = f.y - 60;
            ctx.fillStyle = b ? EL.bolt[2] : '#FFFFFF';
            while (y < f.y) { const nx = x + rnd(-5, 5), ny = y + rnd(4, 9); line(ctx, x, y, nx, ny, ctx.fillStyle); x = nx; y = ny; }
          }
          ctx.fillStyle = ditherPattern(ctx, EL.bolt[1], 2);
          ctx.fillRect(f.x - 10, f.y - 6, 20, 12);
          break;
        }
        case 'ember': ctx.fillStyle = t % 2 ? EL.fire[1] : EL.fire[0]; ctx.fillRect(Math.round(f.x), Math.round(f.y), 3, 3); f.dur = f.life || 6; break;
        case 'flame': { // tier-1 fire: faint, translucent, flickers 2 frames in 8
          if (t % 8 >= 6) break;
          for (let i = 0; i < 5; i++) {
            const h = 10 + ((t + i * 3) % 8) * 2;
            const x = f.x - 12 + i * 6, y = f.y - h;
            ctx.fillStyle = ditherPattern(ctx, EL.fire[2], 2); ctx.fillRect(x - 2, y, 6, h);
            ctx.fillStyle = ditherPattern(ctx, EL.fire[1], 2); ctx.fillRect(x - 1, y + 3, 4, h - 4);
            ctx.fillStyle = EL.fire[0]; ctx.fillRect(x, y + h - 4, 2, 2);
          }
          break;
        }
        case 'petals': { // spirit tier 1: faint pink petals spiral in, flicker on 2 frames of 8
          if (t % 8 >= 6) break;
          for (let i = 0; i < 10; i++) {
            const a = i * 0.63 + t * 0.12, r = 26 * (1 - k) + 4;
            const x = Math.round(f.x + Math.cos(a) * r), y = Math.round(f.y + Math.sin(a) * r * 0.7);
            ctx.fillStyle = ditherPattern(ctx, R.spirit[i % 2 ? 1 : 2], 2);
            ctx.fillRect(x - 1, y - 1, 3, 2);
            ctx.fillStyle = R.spirit[0]; if (i % 3 === 0) ctx.fillRect(x, y, 1, 1);
          }
          break;
        }
        case 'aura': { // 3-ring caster aura
          for (let i = 0; i < 3; i++) {
            const r = ((t + i * 4) % 12) + 6;
            const col = f.color[i + 1];
            for (let a = 0; a < 20; a++) { const ang = (a / 20) * Math.PI * 2; if ((a + t) % 2) continue; ctx.fillStyle = col; ctx.fillRect(Math.round(f.x + Math.cos(ang) * r), Math.round(f.y + 10 + Math.sin(ang) * r * 0.4), 1, 1); }
          }
          break;
        }
        case 'heal': { // green-white sparkles rise + soft ring beneath
          for (let i = 0; i < 8; i++) {
            const y = f.y + 16 - ((t * 1.2 + i * 7) % 34), x = f.x - 12 + i * 3 + (i % 2) * 2;
            ctx.fillStyle = i % 2 ? '#FFFDF5' : R.folRest[0];
            ctx.fillRect(Math.round(x), Math.round(y), 1, 3);
          }
          ctx.fillStyle = ditherPattern(ctx, R.folRest[1], 1);
          ctx.fillRect(f.x - 14, f.y + 16, 28, 3);
          break;
        }
        case 'part': {
          const x = f.x + (f.tx - f.x) * ease(k), y = f.y + (f.ty - f.y) * ease(k);
          ctx.fillStyle = t % 4 < 2 ? R.brass[1] : R.stone[1];
          ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
          break;
        }
        case 'rings': {
          const r = 8 + t * 3;
          ctx.fillStyle = t < f.dur / 2 ? f.color[0] : f.color[2];
          for (let a = 0; a < 40; a++) { if (a % 2 && t > 10) continue; const ang = (a / 40) * Math.PI * 2; ctx.fillRect(Math.round(f.x + Math.cos(ang) * r), Math.round(f.y + Math.sin(ang) * r * 0.5), 2, 1); }
          break;
        }
        case 'column': {
          const h = Math.min(80, t * 6);
          ctx.fillStyle = ditherPattern(ctx, R.glass[1], t < 20 ? 2 : 1);
          ctx.fillRect(f.x - 8, f.y + 20 - h, 16, h);
          ctx.fillStyle = R.glass[0]; ctx.fillRect(f.x - 2, f.y + 20 - h, 4, h);
          break;
        }
        case 'pollen': {
          for (let i = 0; i < 14; i++) {
            const x = f.x - 16 + ((i * 7 + t) % 32), y = f.y - 10 + ((i * 11 + t * 0.5) % 28);
            ctx.fillStyle = i % 2 ? R.folSilent[0] : R.stone[0];
            ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
          }
          ctx.fillStyle = ditherPattern(ctx, R.folSilent[1], 1);
          ctx.fillRect(f.x - 18, f.y - 12, 36, 30);
          break;
        }
        case 'drain': { // thin glass ribbons from target to machine, warm motes travel along
          for (let r = 0; r < 3; r++) {
            const pts = [];
            for (let i = 0; i <= 20; i++) {
              const u = i / 20;
              pts.push([f.x + (f.sx - f.x) * u, f.y + (f.sy - f.y) * u + Math.sin(u * Math.PI * 2 + t * 0.2 + r * 2) * 6]);
            }
            for (let i = 0; i < pts.length - 1; i++) line(ctx, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], R.glass[r === 0 ? 1 : 2]);
            const m = Math.floor(((t * 0.6 + r * 7) % 20));
            ctx.fillStyle = R.skinLight[0];
            ctx.fillRect(Math.round(pts[m][0]), Math.round(pts[m][1]) - 1, 2, 2);
          }
          break;
        }
      }
    }
  }

  // ---------------------------------------------------------------- draw
  draw(ctx) {
    drawBg(ctx, this.bg, this.t);
    // enemies
    for (const e of this.enemies) {
      if (!e.alive && !e.dying) continue;
      const s = this.spriteOf(e);
      const [x, y] = this.posOf(e);
      // shadow
      ctx.fillStyle = ditherPattern(ctx, OUTLINE, 2);
      const sw = Math.min(60, s.width * 0.7);
      ctx.fillRect(Math.round(e.fx + (e.d.big ? s.width / 2 : 0) - sw / 2 + e.dx), e.fy - 2, Math.round(sw), 3);
      let img = e.flashT > 0 ? whiteOf(s) : s;
      if (e.dying) img = dissolve(img, 1 - e.dying / 24, e.d.family === 'machine');
      ctx.drawImage(img, x, y + (e.dying && e.d.family !== 'machine' ? Math.floor((24 - e.dying) / 3) : 0));
    }
    // turret
    if (this.turret) drawTurret(ctx, this.turret, this.t);
    // decoy
    if (this.decoy > 0) {
      const p = this.party[0];
      ctx.fillStyle = (this.t >> 2) % 2 ? R.brass[0] : '#FFFDF5';
      ctx.fillRect(p.hx - 36, p.hy + 18, 4, 6); ctx.fillRect(p.hx - 37, p.hy + 16, 6, 2);
    }
    // party
    for (const p of this.party) {
      const [x, y] = this.posOf(p);
      ctx.fillStyle = ditherPattern(ctx, OUTLINE, 2);
      ctx.fillRect(x + 6, y + 36, 20, 3); ctx.fillRect(x + 8, y + 39, 16, 1);
      if (!p.alive) {
        const ko = koSprite(p.sprite);
        ctx.drawImage(ko, x - 4, y + 26);
        continue;
      }
      const s = this.spriteOf(p);
      ctx.drawImage(p.flashT > 0 ? whiteOf(s) : s, x, y);
      if (p.ready && !this.acting && Math.floor(this.t / 8) % 2 === 0 && this.menu?.actor !== p) {
        ctx.fillStyle = UI.gold; ctx.fillRect(x + 14, y - 4, 3, 2);
      }
    }
    this.drawFx(ctx);
    for (const n of this.nums) drawPopNumber(ctx, n);

    // message strip
    if (this.msg && this.msg.t > 0) {
      this.msg.t--;
      const w = textWidth(this.msg.text) + 20;
      drawWindow(ctx, Math.floor((W - w) / 2), 4, w, 20);
      drawTextCentered(ctx, this.msg.text, W / 2, 10, UI.text);
    }
    this.drawHud(ctx);
    if (this.fleeT > 10) drawTextCentered(ctx, 'Fleeing...', W / 2, 28, UI.text);
    if (this.results) this.drawResults(ctx);
  }

  drawHud(ctx) {
    const y0 = FIELD_H;
    drawWindow(ctx, 0, y0, 150, H - y0);
    drawWindow(ctx, 150, y0, W - 150, H - y0);
    // enemy names (grouped)
    const names = {};
    for (const e of this.livingEnemies()) names[e.name] = (names[e.name] || 0) + 1;
    Object.entries(names).slice(0, 4).forEach(([n, c], i) => drawText(ctx, n + (c > 1 ? ' x' + c : ''), 8, y0 + 6 + i * 11, UI.text));
    // party rows
    this.party.forEach((p, i) => {
      const y = y0 + 6 + i * 12;
      const sel = this.menu && this.menu.actor === p;
      const col = !p.alive ? UI.hpLow : sel ? UI.gold : UI.text;
      drawText(ctx, p.name, 160, y, col);
      const hp = p.c.hp, mh = p.c.maxhp;
      drawTextRight(ctx, String(hp), 248, y, hp < mh / 4 ? UI.hpLow : UI.text);
      drawText(ctx, '/' + mh, 250, y, UI.textDim);
      if (p.c.maxsp) drawText(ctx, p.c.sp + 'SP', 284, y, UI.pink);
      // ATB gauge
      const gx = 318, gw = 56;
      ctx.fillStyle = OUTLINE; ctx.fillRect(gx - 1, y + 1, gw + 2, 6);
      ctx.fillStyle = '#24244E'; ctx.fillRect(gx, y + 2, gw, 4);
      const fill = Math.round((Math.max(0, p.atb) / 100) * gw);
      ctx.fillStyle = p.ready ? (Math.floor(this.t / 6) % 2 ? UI.atbFull : '#FFFDF5') : UI.atb;
      ctx.fillRect(gx, y + 2, fill, 4);
      if (fill > 1) { ctx.fillStyle = p.ready ? '#FFFDF5' : R.glass[1]; ctx.fillRect(gx, y + 2, fill, 1); }
    });
    if (this.turret) drawText(ctx, 'Turret x' + this.turret.shots, 8, y0 + 44, R.brass[0]);
    else if (game.state.parts !== undefined && this.party.some((p) => p.c.cmds.includes('salvage'))) drawText(ctx, 'Parts ' + game.state.parts, 8, y0 + 44, R.brass[0]);
    if (this.menu) this.drawMenu(ctx);
  }

  drawMenu(ctx) {
    const m = this.menu;
    const y0 = FIELD_H;
    if (m.stage === 'cmd' || m.stage === 'list' || m.stage === 'target') {
      const w = 76, h = Math.max(H - y0, m.cmds.length * 12 + 8);
      const y = H - h;
      drawWindow(ctx, 74, y, w, h);
      m.cmds.forEach((c, i) => drawText(ctx, CMD_NAMES[c], 92, y + 5 + i * 12, (c === 'blast' && this.blastUsed) ? UI.textDim : UI.text));
      if (m.stage === 'cmd') drawCursor(ctx, 78, y + 5 + m.i * 12, this.t);
    }
    if (m.stage === 'list' || (m.stage === 'target' && m.list)) {
      const L = m.list;
      const w = 230, h = L.length * 12 + 26;
      const x = 152, y = y0 - h + 2;
      drawWindow(ctx, x, y, w, h);
      L.forEach((it, i) => {
        drawText(ctx, it.label, x + 20, y + 6 + i * 12, it.ok ? UI.text : UI.textDim);
        drawTextRight(ctx, it.right, x + w - 10, y + 6 + i * 12, it.ok ? UI.gold : UI.textDim);
      });
      const cur = L[m.li];
      if (cur && cur.desc) drawText(ctx, cur.desc, x + 8, y + h - 14, UI.name);
      if (m.stage === 'list') drawCursor(ctx, x + 6, y + 6 + m.li * 12, this.t);
    }
    if (m.stage === 'target') {
      const pool = m.side === 'enemy' ? this.livingEnemies() : this.party.filter((q) => m.allowKO ? true : q.alive);
      const t = pool[Math.min(m.ti, pool.length - 1)];
      if (t) {
        const [cx, cy] = this.centerOf(t);
        if (t.side === 'enemy') drawCursor(ctx, cx - 14 - (t.d.big ? 30 : 6), cy - 3, this.t);
        else drawCursor(ctx, cx - 24, cy - 3, this.t);
        drawText(ctx, t.name, 8, FIELD_H - 12, UI.gold);
      }
    }
  }

  drawResults(ctx) {
    const h = this.results.length * 12 + 14;
    drawWindow(ctx, 40, 30, W - 80, h);
    this.results.forEach((l, i) => drawText(ctx, l, 52, 37 + i * 12, UI.text));
  }
}

// ---------------------------------------------------------------- draw helpers
function line(ctx, x0, y0, x1, y1, color) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  ctx.fillStyle = color;
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (let n = 0; n < 600; n++) {
    ctx.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

const koCache = new Map();
function koSprite(id) {
  if (!koCache.has(id)) koCache.set(id, darkOf(flipH(rot90(battleSprite(id, 'hurt')))));
  return koCache.get(id);
}

// Death: machines dissolve over 12+ frames through dither steps; beasts fall and fade.
const dis = makeCanvas(160, 120);
function dissolve(img, k, machine) {
  const c = dis.ctx;
  if (dis.canvas.width < img.width || dis.canvas.height < img.height) { dis.canvas.width = img.width; dis.canvas.height = img.height; }
  c.clearRect(0, 0, dis.canvas.width, dis.canvas.height);
  c.globalCompositeOperation = 'source-over';
  c.drawImage(img, 0, 0);
  const lvl = Math.min(4, Math.floor(k * 5));
  if (lvl > 0) {
    c.globalCompositeOperation = 'destination-out';
    c.fillStyle = ditherPattern(c, '#000000', lvl);
    c.fillRect(0, 0, img.width, img.height);
    c.globalCompositeOperation = 'source-over';
  }
  const out = makeCanvas(img.width, img.height);
  out.ctx.drawImage(dis.canvas, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
  return out.canvas;
}

// Damage numbers: pop up 8px, bounce 2px, hold ~30 frames.
function drawPopNumber(ctx, n) {
  const t = n.t;
  const rise = t < 6 ? t * 1.4 : t < 10 ? 8 - (t - 6) * 0.5 : t < 14 ? 6 + (t - 10) * 0.5 : 8;
  if (t > 44 && t % 2) return;
  const isText = isNaN(+n.text);
  if (isText) { drawTextCentered(ctx, n.text, n.x, Math.round(n.y - rise), n.color); return; }
  const w = numberWidth(n.text);
  drawNumber(ctx, n.text, Math.round(n.x - w / 2), Math.round(n.y - rise), n.color);
}

function drawTurret(ctx, t, f) {
  const x = Math.round(t.x), y = Math.round(t.y);
  ctx.fillStyle = OUTLINE; ctx.fillRect(x - 1, y - 1, 14, 14);
  ctx.fillStyle = R.iron[2]; ctx.fillRect(x, y + 6, 12, 6);
  ctx.fillStyle = R.iron[1]; ctx.fillRect(x, y + 6, 12, 1);
  ctx.fillStyle = R.brass[2]; ctx.fillRect(x + 2, y, 8, 6);
  ctx.fillStyle = R.stone[1]; ctx.fillRect(x - 6, y + 2, 8, 2);
  ctx.fillStyle = (f >> 4) % 2 ? R.glass[0] : R.glass[2]; ctx.fillRect(x + 5, y + 2, 2, 2);
}
