// Active Time Battle. Party on the right (facing left), enemies on the left.
// Attack anatomy per the guide: anticipation -> launch -> travel -> impact (held, target
// flashes white 2 frames) -> dissipation. Machines move in eased arcs with no overshoot.
import { game, wait, flash, shake, fadeOut } from '../game.js';
import * as input from '../core/input.js';
import * as audio from '../core/audio.js';
import { W, H, drawWindow, drawCursor, ditherRect, ditherPattern, whiteOf, darkOf, greyOf, rot90, flipH, makeCanvas, recolor } from '../core/gfx.js';
import { drawText, drawTextRight, drawTextCentered, drawNumber, numberWidth, textWidth } from '../core/font.js';
import { UI, R, EL, OUTLINE } from '../data/palette.js';
import { battleSprite } from '../data/sprites.js';
import { ENEMIES, RAGES, enemySprite } from '../data/enemies.js';
import { CMD_NAMES, ABIL, ITEMS, ECHOES, STATUS, abilitiesFor, echoTier, expForLevel, levelUp, stats, relic } from '../data/party.js';
import { drawBg } from './bgs.js';
import { Effects, fxForElement, line } from './bfx.js';

const FIELD_H = 160;
const rnd = (a, b) => a + Math.random() * (b - a);
const ease = (t) => 0.5 - Math.cos(Math.PI * Math.min(1, Math.max(0, t))) / 2;
const SEC = 60;

const SLOTS = {
  1: [[84, 122]], 2: [[64, 104], [124, 138]], 3: [[52, 96], [122, 112], [66, 148]],
  4: [[46, 90], [114, 98], [60, 140], [130, 150]], 5: [[40, 86], [100, 92], [150, 120], [50, 140], [110, 150]],
};
const PARTY_Y = { 1: [74], 2: [56, 92], 3: [42, 76, 110], 4: [28, 56, 84, 112] };
const INCAP = ['sleep', 'stop', 'petrify', 'rest'];
const DANCE_FX = {
  gust: { kind: 'magic', el: 'wind', target: 'allEnemies', power: 1.6, fx: 'gust', name: 'Gust' },
  haste: { kind: 'buff', buff: 'haste', target: 'allAllies', fx: 'clock', name: 'Tailwind' },
  blindAll: { kind: 'status', status: 'blind', chance: 0.7, target: 'allEnemies', fx: 'smoke', name: 'Dust Devil' },
  quake: { kind: 'magic', el: 'earth', target: 'allEnemies', power: 1.8, fx: 'quake', name: 'Landslide' },
  protect: { kind: 'buff', buff: 'protect', target: 'allAllies', fx: 'hex', name: 'Stone Shelter' },
  stoneGaze: { kind: 'status', status: 'petrify', chance: 0.4, target: 'enemy', fx: 'rings', name: 'Stone Stare' },
  healAll: { kind: 'heal', target: 'allAllies', power: 1.2, fx: 'heal', name: 'Kupo Step' },
  regen: { kind: 'buff', buff: 'regen', target: 'allAllies', fx: 'heal', name: 'Warm Spring' },
  blizzardAll: { kind: 'magic', el: 'ice', target: 'allEnemies', power: 2.4, fx: 'ice', tier: 2, name: 'Snowfall' },
  sleepAll: { kind: 'status', status: 'sleep', chance: 0.6, target: 'allEnemies', fx: 'pollen', name: 'Hush of Snow' },
};
const REELS = ['7', 'Bar', 'Bell', 'Falcon', 'Coin'];
const SLOT_RESULT = {
  '7': { name: 'Jackpot!', kind: 'magic', el: 'holy', power: 5.0, target: 'allEnemies', fx: 'column', tier: 3 },
  Falcon: { name: 'Falcon Dive', kind: 'phys', power: 3.0, target: 'allEnemies', fx: 'beasts' },
  Bell: { name: 'Bell Chime', kind: 'heal', power: 4.0, target: 'allAllies', fx: 'heal', cure: true },
  Bar: { name: 'Bar Brawl', kind: 'phys', power: 2.0, target: 'allEnemies', fx: 'claw' },
  Coin: { name: 'Coin Toss', kind: 'phys', power: 1.6, target: 'allEnemies', fx: 'star' },
};

export class BattleScene {
  constructor(group, opts) {
    this.group = group;
    this.opts = opts;
    this.bg = opts.bg || 'vault';
    this.t = 0;
    this.fx = new Effects();
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
    this.tint = null;
    this.memory = null;
    this.learned = [];
    this.lastParty = null;
    this.lastEnemyMove = null;
    this.runic = null;
    this.used = new Set();
  }

  enter() {
    const st = game.state;
    const ids = (this.opts.party || st.party).slice(0, 4);
    const ys = PARTY_Y[ids.length] || PARTY_Y[4];
    this.party = ids.map((id, i) => {
      const c = st.chars[id];
      const b = {
        side: 'party', id, c, name: c.name, base: c.spriteOverride || c.battle,
        hx: 296 + i * 8, hy: ys[i], dx: 0, dy: 0, pose: null, atb: rnd(15, 60), ready: false,
        defending: false, flashT: 0, status: {}, tick: 0,
        get alive() { return this.c.hp > 0 && !this.status.petrify; },
      };
      const rl = relic(c);
      if (rl && rl.startStatus) b.status[rl.startStatus] = 30 * SEC;
      if (c.spriteOverride === 'terraGlow' && !st.flags.trance) b.base = 'terraGlow';
      return b;
    });
    this.enemies = [];
    for (const spec of this.group) this.addEnemy(spec);
    audio.playMusic(this.opts.battleMusic || (this.opts.boss ? 'boss' : 'battle'));
    audio.setAmbience('none');
    if (this.opts.script) this.runHook('start');
  }

  addEnemy(spec) {
    if (typeof spec === 'string') spec = { kind: spec };
    const kind = spec.kind;
    const d = ENEMIES[kind];
    if (!d) throw new Error('unknown enemy ' + kind);
    const e = {
      side: 'enemy', kind, d, name: spec.name || d.name, hp: spec.hp || d.hp, maxhp: spec.hp || d.hp, atb: rnd(0, 40), dx: 0, dy: 0, flashT: 0,
      dying: 0, alive: true, phase: Math.random() * 100, dmg: 0, status: {}, tick: 0, at: spec.at || null,
      invuln: !!spec.invuln, face: spec.face || null, faces: spec.faces || null,
    };
    this.enemies.push(e);
    this.layoutEnemies();
    return e;
  }

  layoutEnemies() {
    const live = this.enemies.filter((e) => e.alive || e.dying);
    const free = live.filter((e) => !e.at);
    const big = free.filter((e) => e.d.big);
    const small = free.filter((e) => !e.d.big);
    for (const e of live) if (e.at) [e.fx, e.fy] = e.at;
    if (big.length) {
      big.forEach((e, i) => { e.fx = 20 + i * 90; e.fy = 152; });
      const slots = [[150, 74], [160, 128], [24, 64], [150, 150]];
      small.forEach((e, i) => { [e.fx, e.fy] = slots[i % slots.length]; });
    } else {
      const s = SLOTS[Math.min(5, small.length)] || SLOTS[5];
      small.forEach((e, i) => { [e.fx, e.fy] = s[i % s.length]; });
    }
  }

  // ---------------------------------------------------------------- queries
  livingParty() { return this.party.filter((p) => p.alive); }
  ableParty() { return this.party.filter((p) => p.alive && !p.status.rest); }
  livingEnemies() { return this.enemies.filter((e) => e.alive); }
  member(id) { return this.party.find((p) => p.id === id); }
  st(b) { // effective stats
    if (b.side === 'enemy') return { atk: b.d.atk, def: b.d.def, mag: b.d.atk, mdf: b.d.mdf, spd: b.d.spd, lv: Math.round(b.d.atk / 2) };
    const s = stats(b.c);
    s.lv = b.c.lv;
    if (b.status.trance) { s.mag = Math.round(s.mag * 1.6); s.atk = Math.round(s.atk * 1.3); }
    return s;
  }
  spriteId(b) { return b.status.trance ? 'terraEsper' : b.base; }
  spriteOf(b) {
    if (b.side === 'party') {
      let pose = b.pose;
      if (!pose) {
        if (b.status.sleep || b.status.rest) pose = 'kneel';
        else if (b.defending) pose = 'defend';
        else if (b.c.hp < b.c.maxhp / 4) pose = 'kneel';
        else if (b.status.stop || b.status.petrify) pose = 'idle0';
        else pose = 'idle' + (Math.floor(this.t / (b.status.slow ? 24 : b.status.haste ? 8 : 12)) % 4);
      }
      let img = battleSprite(this.spriteId(b), pose);
      if (b.status.petrify || b.status.rest) img = greyOf(img);
      else if (b.status.stop) img = tintOf(img, 'stop');
      else if (b.status.poison) img = tintOf(img, 'poison');
      return img;
    }
    const frame = Math.floor((this.t + b.phase) / 24) % 2; // glass cores pulse on a 48-frame loop
    let img = enemySprite(b.kind, frame, b.dmg, b.face ? { face: b.face } : null);
    if (b.status.petrify) img = greyOf(img);
    return img;
  }
  posOf(b) {
    if (b.side === 'party') return [b.hx + b.dx, b.hy + b.dy];
    const s = this.spriteOf(b);
    const bob = b.d.hover && !b.status.stop ? Math.round(Math.sin(((this.t + b.phase) / 32) * Math.PI * 2) * 2) : 0;
    const x = b.d.big && !b.at ? b.fx + b.dx : b.fx + b.dx - s.width / 2;
    return [Math.round(x), Math.round(b.fy + b.dy - s.height + bob)];
  }
  centerOf(b) {
    const [x, y] = this.posOf(b);
    if (b.side === 'party') return [x + 14, y + 22];
    const s = this.spriteOf(b);
    return [x + s.width / 2, y + s.height / 2];
  }
  msgOut(text, frames = 60) { this.msg = { text, t: frames }; }
  flashMsg(text, frames) { this.msgOut(text, frames); }

  // ---------------------------------------------------------------- update
  update(canControl, noOverlay) {
    this.t++;
    this.fx.update();
    for (const n of this.nums) n.t++;
    this.nums = this.nums.filter((n) => n.t < 54);
    for (const b of [...this.party, ...this.enemies]) if (b.flashT > 0) b.flashT--;
    for (const e of this.enemies) if (e.dying > 0) { e.dying--; if (e.dying === 0) this.layoutEnemies(); }
    if (this.tint && --this.tint.t <= 0) this.tint = null;
    if (this.memory && --this.memory.t <= 0) this.memory = null;
    if (!noOverlay) return;
    if (this.over) { if (this.overUpdate) this.overUpdate(); return; }
    if (this.mini) { this.updateMini(); return; }

    const waitMode = game.settings.battleMode === 'wait';
    const timeRuns = !this.acting && !this.paused && !(this.menu && waitMode);
    if (timeRuns) this.tickTime();

    if (!this.opts.boss && !this.opts.noFlee && input.isHeld('b') && !this.acting && (!this.menu || this.menu.stage === 'cmd')) {
      this.fleeT++;
      if (this.fleeT > 70) { this.flee(); return; }
    } else this.fleeT = 0;

    if (!this.acting && this.queue.length && !this.paused) {
      const a = this.queue.shift();
      this.acting = true;
      this.execute(a).catch((err) => console.error(err)).finally(() => { this.acting = false; this.afterAction(); });
    }

    if (!this.menu && !this.paused) {
      const r = this.party.find((p) => p.ready && p.alive && !this.queue.some((q) => q.actor === p));
      if (r) {
        const auto = this.autoAction(r);
        if (auto) { r.ready = false; this.queue.push(auto); }
        else this.openMenu(r);
      }
    }
    if (this.menu) this.updateMenu();
  }

  rate(b) {
    if (INCAP.some((s) => b.status[s])) return 0;
    const spd = this.st(b).spd;
    return (spd + 20) * 0.075 * (b.status.haste ? 1.5 : 1) * (b.status.slow ? 0.5 : 1);
  }

  tickTime() {
    const all = [...this.party, ...this.enemies.filter((e) => e.alive)];
    for (const b of all) {
      if (b.side === 'party' && !b.alive) continue;
      // status timers
      for (const [k, v] of Object.entries(b.status)) {
        if (v === -1) continue;
        b.status[k] = v - 1;
        if (b.status[k] <= 0) { delete b.status[k]; if (k === 'trance') this.msgOut(b.name + "'s trance fades.", 40); }
      }
      // poison / regen every 3 seconds
      if (++b.tick % (3 * SEC) === 0) {
        const max = b.side === 'party' ? b.c.maxhp : b.maxhp;
        if (b.status.poison) this.damage(b, Math.max(1, Math.round(max / 16)), EL.bio[1]);
        if (b.status.regen) this.heal(b, Math.max(1, Math.round(max / 16)));
      }
      if (b.side === 'party') {
        if (b.ready) continue;
        b.atb += this.rate(b);
        if (b.atb >= 100) { b.atb = 100; b.ready = true; b.defending = false; if (this.runic && this.runic === b) this.runic = null; }
      } else {
        b.atb += this.rate(b);
        if (b.atb >= 100) { b.atb = 0; this.queue.push({ enemy: b }); }
      }
    }
    if (this.turret && this.turret.shots > 0) {
      this.turret.atb += 1.6;
      if (this.turret.atb >= 100) { this.turret.atb = 0; this.queue.push({ turret: true }); }
    }
  }

  async runHook(ev, arg) {
    if (!this.opts.script) return;
    this.paused = true;
    try { await this.opts.script(this, ev, arg); } finally { this.paused = false; }
  }

  afterAction() {
    this.turns++;
    if (this.over) return;
    if (!this.livingEnemies().length) { this.victory(); return; }
    if (!this.ableParty().length) { this.defeat(); return; }
    if (this.opts.script) this.runHook('turn');
  }

  // Characters who act on their own: Umaro, raging Gau, dancing Mog, the confused/berserk.
  autoAction(p) {
    const foes = this.livingEnemies();
    if (!foes.length) return null;
    const anyFoe = () => foes[Math.floor(Math.random() * foes.length)];
    if (p.status.confuse) {
      const pool = [...foes, ...this.livingParty()];
      return { kind: 'fight', actor: p, targets: [pool[Math.floor(Math.random() * pool.length)]] };
    }
    if (p.status.berserk) return { kind: 'fight', actor: p, targets: [anyFoe()] };
    if (p.id === 'umaro') {
      const hurt = this.livingParty().filter((q) => q.c.hp < q.c.maxhp * 0.5).length >= 2;
      if (game.state.flags.ult_umaro && hurt && Math.random() < 0.5) return { kind: 'ability', id: 'bigHug', actor: p, targets: this.livingParty() };
      if (Math.random() < 0.25) return { kind: 'effect', eff: { kind: 'magic', el: 'ice', power: 1.4, target: 'allEnemies', fx: 'ice', name: 'Snowball' }, actor: p, targets: foes };
      return { kind: 'fight', actor: p, targets: [anyFoe()] };
    }
    if (p.raging) {
      if (Math.random() < 0.55) return { kind: 'effect', eff: moveToEffect(p.raging.move), actor: p, targets: p.raging.move.all ? foes : [anyFoe()] };
      return { kind: 'fight', actor: p, targets: [anyFoe()] };
    }
    if (p.dancing) {
      const list = ABIL[p.dancing].dance;
      const eff = DANCE_FX[list[Math.floor(Math.random() * list.length)]];
      return { kind: 'effect', eff, actor: p, targets: this.targetsFor(eff.target, p) };
    }
    return null;
  }

  targetsFor(target, p) {
    if (target === 'allEnemies') return this.livingEnemies();
    if (target === 'allAllies') return this.party.filter((q) => q.alive || q.c.hp <= 0);
    if (target === 'enemy') { const f = this.livingEnemies(); return f.length ? [f[Math.floor(Math.random() * f.length)]] : []; }
    if (target === 'ally') { const f = this.livingParty().sort((a, b) => a.c.hp / a.c.maxhp - b.c.hp / b.c.maxhp); return f.slice(0, 1); }
    return [p];
  }

  // ---------------------------------------------------------------- menus
  cmdList(p) {
    return p.c.cmds.filter((c) => c !== 'echo' || p.c.echo).filter((c) => c !== 'spirit' || game.state.flags.spirit || p.c.cmds.includes('spirit'));
  }
  cmdUsable(p, c) {
    if (p.status.silence && ['echo', 'spirit', 'lore'].includes(c)) return false;
    if (c === 'blast' && this.used.has('blast')) return false;
    if (c === 'rage' && !Object.keys(game.state.rages || {}).length) return false;
    if (c === 'mimic' && !this.lastParty) return false;
    return true;
  }
  openMenu(p) {
    this.menu = { actor: p, stage: 'cmd', i: (this.lastCmd || {})[p.id] || 0, cmds: this.cmdList(p) };
    if (this.menu.i >= this.menu.cmds.length) this.menu.i = 0;
    audio.sfx('cursor');
  }

  updateMenu() {
    const m = this.menu;
    const p = m.actor;
    if (!p.alive || INCAP.some((s) => p.status[s])) { this.menu = null; p.ready = false; return; }
    if (m.stage === 'cmd') {
      const n = m.cmds.length;
      if (input.repeat('down')) { m.i = (m.i + 1) % n; audio.sfx('cursor'); }
      if (input.repeat('up')) { m.i = (m.i + n - 1) % n; audio.sfx('cursor'); }
      if (input.pressed('right') || input.pressed('left')) {
        const others = this.party.filter((q) => q.ready && q.alive && q !== p && !this.queue.some((a) => a.actor === q) && !this.autoAction(q));
        if (others.length) { this.menu = null; this.openMenu(others[0]); return; }
      }
      if (input.pressed('a')) this.chooseCmd(p, m.cmds[m.i]);
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
        it.pick();
      }
      return;
    }
    if (m.stage === 'target') {
      const pool = this.targetPool(m);
      if (!pool.length) { m.stage = 'cmd'; return; }
      m.ti = Math.min(m.ti, pool.length - 1);
      if (m.multi === 'all') { // all-target spells: left/right toggles back to single (not supported) -> confirm
        if (input.pressed('a')) { audio.sfx('confirm'); this.commit({ ...m.act, actor: p, targets: pool }); }
        if (input.pressed('b')) { m.stage = m.list ? 'list' : 'cmd'; audio.sfx('cancel'); }
        return;
      }
      if (input.repeat('down') || (input.repeat('right') && m.side === 'party')) { m.ti = (m.ti + 1) % pool.length; audio.sfx('cursor'); }
      if (input.repeat('up') || (input.repeat('left') && m.side === 'party')) { m.ti = (m.ti + pool.length - 1) % pool.length; audio.sfx('cursor'); }
      if (m.side === 'enemy' && input.pressed('right') && !m.lockSide) { m.side = 'party'; m.ti = Math.max(0, this.party.indexOf(p)); audio.sfx('cursor'); }
      else if (m.side === 'party' && input.pressed('left') && !m.lockSide) { m.side = 'enemy'; m.ti = 0; audio.sfx('cursor'); }
      if (input.pressed('b')) { m.stage = m.list ? 'list' : 'cmd'; audio.sfx('cancel'); return; }
      if (input.pressed('a')) { audio.sfx('confirm'); this.commit({ ...m.act, actor: p, targets: [this.targetPool(m)[m.ti]] }); }
    }
  }

  targetPool(m) {
    if (m.side === 'enemy') return this.livingEnemies();
    if (m.koOnly) { const ko = this.party.filter((q) => q.c.hp <= 0); return ko.length ? ko : this.party; }
    return this.party.filter((q) => q.c.hp > 0 || m.allowKO);
  }

  chooseCmd(p, cmd) {
    if (!this.cmdUsable(p, cmd)) { audio.sfx('buzzer'); return; }
    const m = this.menu;
    (this.lastCmd ||= {})[p.id] = m.i;
    audio.sfx('confirm');
    const st = game.state;
    if (cmd === 'fight') return this.beginTarget({ kind: 'fight' }, 'enemy');
    if (cmd === 'defend') return this.commit({ kind: 'defend', actor: p });
    if (cmd === 'heave') return this.beginTarget({ kind: 'ability', id: 'heave' }, 'enemy');
    if (cmd === 'brace') return this.beginTarget({ kind: 'ability', id: 'brace' }, 'party', { lockSide: true });
    if (cmd === 'blast') return this.commit({ kind: 'ability', id: 'blast', actor: p, targets: this.livingEnemies() });
    if (cmd === 'steal') return this.abilityList(p, cmd);
    if (cmd === 'runic') return this.abilityList(p, cmd);
    if (cmd === 'mimic') return this.commit({ kind: 'mimic', actor: p });
    if (cmd === 'learn') return this.commit({ kind: 'learn', actor: p });
    if (cmd === 'sketch') return this.beginTarget({ kind: 'ability', id: 'sketch' }, 'enemy', { lockSide: true });
    if (cmd === 'bushido') { this.mini = { kind: 'bushido', actor: p, t: 0, max: st.flags.ult_cyan ? 4 : 3 }; this.menu = null; return; }
    if (cmd === 'slots') { this.mini = { kind: 'slots', actor: p, t: 0, stopped: [], reels: [0, 2, 4] }; this.menu = null; return; }
    if (cmd === 'rage') {
      const list = Object.keys(st.rages || {}).filter((r) => RAGES[r]).map((r) => ({ label: RAGES[r].name, right: '', ok: true, desc: RAGES[r].move.name,
        pick: () => this.commit({ kind: 'rage', rage: r, actor: p }) }));
      return this.openList('rage', list);
    }
    if (cmd === 'item') {
      const list = Object.entries(st.items).filter(([k, n]) => n > 0 && ITEMS[k] && !ITEMS[k].key && !ITEMS[k].field && k !== 'shuriken')
        .map(([k, n]) => ({ id: k, label: ITEMS[k].name, right: 'x' + n, ok: true, desc: ITEMS[k].desc,
          pick: () => this.pickTargetType({ kind: 'item', id: k }, ITEMS[k].target) }));
      if (!list.length) { audio.sfx('buzzer'); this.msgOut('No items.'); return; }
      return this.openList('item', list);
    }
    if (cmd === 'dance') {
      const list = abilitiesFor(p.c, 'dance', st).map((id) => ({ label: ABIL[id].name, right: '', ok: true, desc: ABIL[id].desc,
        pick: () => this.commit({ kind: 'dance', id, actor: p }) }));
      return this.openList('dance', list);
    }
    return this.abilityList(p, cmd);
  }

  abilityList(p, cmd) {
    const st = game.state;
    const ids = abilitiesFor(p.c, cmd, st);
    if (!ids.length) { audio.sfx('buzzer'); this.msgOut(cmd === 'lore' ? 'No lores learned yet.' : 'Nothing to use.'); return; }
    const half = relic(p.c) && relic(p.c).spHalf;
    const list = ids.map((id) => {
      const ab = ABIL[id];
      const sp = ab.cost.sp ? (half ? Math.ceil(ab.cost.sp / 2) : ab.cost.sp) : 0;
      let ok = p.c.sp >= sp && (!ab.cost.parts || st.parts >= ab.cost.parts) && (!ab.cost.item || (st.items[ab.cost.item] || 0) > 0);
      if (ab.once && this.used.has(id)) ok = false;
      if (ab.duo && !ab.duo.every((d) => this.party.some((q) => q.id === d && q.alive))) ok = false;
      const right = sp ? sp + ' SP' : ab.cost.parts ? ab.cost.parts + 'p' : ab.cost.item ? 'x' + (st.items[ab.cost.item] || 0) : ab.input ? '' : '';
      return { id, label: ab.name, right, ok, desc: ab.desc, pick: () => this.pickTargetType({ kind: 'ability', id }, ab.target) };
    });
    this.openList(cmd, list);
  }

  pickTargetType(act, target) {
    const p = this.menu.actor;
    if (target === 'none' || target === 'self') return this.commit({ ...act, actor: p, targets: [p] });
    if (target === 'allEnemies') return this.beginTarget(act, 'enemy', { multi: 'all' });
    if (target === 'allAllies') return this.beginTarget(act, 'party', { multi: 'all', allowKO: true });
    if (target === 'koAlly') return this.beginTarget(act, 'party', { koOnly: true, allowKO: true });
    if (target === 'ally') return this.beginTarget(act, 'party');
    return this.beginTarget(act, 'enemy');
  }

  openList(kind, list) {
    const m = this.menu;
    m.stage = 'list'; m.listKind = kind; m.list = list; m.li = 0;
  }
  beginTarget(act, side, o = {}) {
    const m = this.menu;
    Object.assign(m, { stage: 'target', act, side, multi: o.multi || null, allowKO: !!o.allowKO, koOnly: !!o.koOnly, lockSide: !!o.lockSide });
    m.ti = side === 'party' ? Math.max(0, this.party.indexOf(m.actor)) : 0;
    if (side === 'party' && o.koOnly) m.ti = 0;
  }
  commit(act) {
    const p = act.actor;
    p.ready = false;
    this.queue.push(act);
    this.menu = null;
  }

  // ---------------------------------------------------------------- minigames
  updateMini() {
    const g = this.mini;
    g.t++;
    if (g.kind === 'bushido') { // the gauge fills; release with A
      const lv = Math.min(g.max, 1 + Math.floor(g.t / 40));
      g.lv = lv;
      if (input.pressed('b')) { this.mini = null; this.openMenu(g.actor); return; }
      if (input.pressed('a') || g.t > 40 * g.max + 60) {
        const id = ['fang', 'sky', 'tiger', 'dawnblade'][lv - 1];
        this.mini = null;
        audio.sfx('confirm');
        const ab = ABIL[id];
        this.queue.push({ kind: 'ability', id, actor: g.actor, targets: this.targetsFor(ab.target, g.actor) });
        g.actor.ready = false;
      } else if (g.t % 40 === 0 && lv < g.max) audio.sfx('cursor');
      return;
    }
    if (g.kind === 'slots') { // three reels; A stops each one
      for (let i = 0; i < 3; i++) if (g.stopped[i] === undefined) g.reels[i] = (g.reels[i] + (g.t % 6 === 0 ? 1 : 0)) % REELS.length;
      if (input.pressed('a') || g.t > 300) {
        const i = g.stopped.length;
        g.stopped.push(g.reels[i]);
        audio.sfx('cursor');
        if (g.stopped.length === 3) {
          const syms = g.stopped.map((s) => REELS[s]);
          this.mini = null;
          g.actor.ready = false;
          this.queue.push({ kind: 'slots', actor: g.actor, syms });
        }
      }
      return;
    }
    if (g.kind === 'blitz') { // enter the motion
      const want = g.seq[g.pos];
      const map = { L: 'left', R: 'right', U: 'up', D: 'down', A: 'a' };
      for (const [k, btn] of Object.entries(map)) {
        if (input.pressed(btn)) {
          if (k === want) { g.pos++; audio.sfx('cursor'); } else { g.fail = true; }
        }
      }
      if (g.pos >= g.seq.length || g.fail || g.t > 240) {
        this.mini = null;
        g.done(g.pos >= g.seq.length && !g.fail);
      }
    }
  }

  blitzInput(seq) {
    return new Promise((res) => { this.mini = { kind: 'blitz', seq: [...seq], pos: 0, t: 0, done: res }; });
  }

  // ---------------------------------------------------------------- execution
  async execute(a) {
    if (a.turret) return this.turretShot();
    if (a.enemy) return this.enemyAct(a.enemy);
    const p = a.actor;
    if (!p.alive || INCAP.some((s) => p.status[s])) return;
    p.atb = 0;
    let targets = (a.targets || []).map((t) => this.validTarget(t, a)).filter(Boolean);
    if (a.kind !== 'mimic' && a.kind !== 'learn') this.lastParty = { ...a, by: p.id };
    switch (a.kind) {
      case 'fight': return this.physical(p, targets[0], 1, 'Fight');
      case 'defend': p.defending = true; audio.sfx('defend'); this.msgOut(p.name + ' defends.', 40); await wait(20); return;
      case 'item': return this.useItem(p, a.id, targets[0]);
      case 'ability': return this.useAbility(p, a.id, targets);
      case 'effect': this.msgOut(a.eff.name, 50); return this.resolve(p, a.eff, targets.length ? targets : this.targetsFor(a.eff.target, p));
      case 'rage': {
        const r = RAGES[a.rage];
        p.raging = r;
        this.msgOut(`${p.name} becomes the ${r.name}!`, 60);
        audio.sfx('heavy');
        await wait(20);
        return this.resolve(p, moveToEffect(r.move), r.move.all ? this.livingEnemies() : this.targetsFor('enemy', p));
      }
      case 'dance': {
        p.dancing = a.id;
        this.msgOut(ABIL[a.id].name, 50);
        const list = ABIL[a.id].dance;
        const eff = DANCE_FX[list[Math.floor(Math.random() * list.length)]];
        await wait(10);
        this.msgOut(eff.name, 50);
        return this.resolve(p, eff, this.targetsFor(eff.target, p));
      }
      case 'slots': return this.slots(p, a.syms);
      case 'mimic': {
        const last = this.lastParty;
        if (!last) { this.msgOut('Nothing to mimic.'); return; }
        this.msgOut('Mimic!', 40);
        await wait(16);
        const copy = { ...last, actor: p, targets: (last.targets || []).map((t) => this.validTarget(t, last)).filter(Boolean) };
        if (copy.kind === 'ability') return this.useAbility(p, copy.id, copy.targets, { free: true });
        if (copy.kind === 'effect' || copy.kind === 'rage' || copy.kind === 'dance' || copy.kind === 'slots') return this.execute({ ...copy, actor: p });
        if (copy.kind === 'item') { this.msgOut('Mimic: ' + ITEMS[copy.id].name, 40); return this.useItem(p, copy.id, copy.targets[0], true); }
        return this.physical(p, copy.targets[0] || this.targetsFor('enemy', p)[0], 1, 'Fight');
      }
      case 'learn': return this.learn(p);
    }
  }

  validTarget(t, a) {
    if (!t) return null;
    if (t.side === 'enemy') return t.alive ? t : (this.livingEnemies()[0] || null);
    if (a.kind === 'item' || a.kind === 'ability') return t; // revives/heals may target the fallen
    return t.alive ? t : (this.livingParty()[0] || null);
  }

  async stepForward(p, dist = 16) { for (let i = 1; i <= 12; i++) { p.dx = -Math.round((dist * i) / 12); await wait(1); } }
  async stepBack(p) { const from = p.dx; for (let i = 1; i <= 10; i++) { p.dx = Math.round(from * (1 - i / 10)); await wait(1); } p.dx = 0; }

  calcPhys(att, def, power, o = {}) {
    const a = this.st(att), d = this.st(def);
    const crit = Math.random() < 0.07 + (att.c && att.c.id === 'shadow' ? 0.08 : 0);
    let dmg;
    if (att.side === 'party') dmg = (a.atk * 3 + a.lv * 2) * power * rnd(0.88, 1.12) - (o.pierce ? 0 : d.def * 1.2);
    else dmg = (a.atk * 2.2 + 6) * power * rnd(0.88, 1.12) - d.def * 1.2;
    if (crit) dmg *= 1.8;
    return { dmg: Math.max(1, Math.round(dmg)), crit };
  }
  calcMag(att, def, power, tier = 1) {
    const a = this.st(att), d = this.st(def);
    let dmg;
    if (att.side === 'party') dmg = (a.mag * 3 + a.lv * 2 + 20) * power * (1 + (tier - 1) * 0.25) * rnd(0.92, 1.08) - d.mdf;
    else dmg = (a.atk * 2.0 + 8) * power * rnd(0.9, 1.1) - d.mdf;
    return Math.max(1, Math.round(dmg));
  }
  elemMult(target, el) {
    if (!el || target.side !== 'enemy') return 1;
    if (target.d.absorb && target.d.absorb.includes(el)) return -1;
    if (target.d.weak && target.d.weak.includes(el)) return 2;
    return 1;
  }

  async physical(p, target, power, label, o = {}) {
    if (!target) return;
    if (p.side === 'party') await this.stepForward(p);
    p.pose = 'windup'; await wait(6);
    p.pose = 'swing';
    audio.sfx(p.c.weapon === 'none' ? 'hit' : 'slash');
    this.addSmear(p, p.c.weapon);
    await wait(2);
    const hits = o.hits || 1;
    for (let h = 0; h < hits; h++) {
      if (!target.alive) break;
      if (p.status.blind && Math.random() < 0.5) { await this.impact(target, 'miss'); continue; }
      const { dmg, crit } = this.calcPhys(p, target, power, o);
      await this.impact(target, dmg, { crit, weapon: p.c.weapon, el: o.el, src: p });
      if (hits > 1) await wait(4);
    }
    await wait(6);
    p.pose = null;
    await wait(6);
    await this.stepBack(p);
  }

  // Impact: biggest frame, target flashes white 2 frames, number pops.
  async impact(target, dmg, o = {}) {
    const [cx, cy] = this.centerOf(target);
    if (dmg === 'miss') { this.addNum(target, 'MISS', '#9A927E'); audio.sfx('miss'); return; }
    let amount = dmg;
    if (target.side === 'enemy' && target.invuln) { this.addNum(target, 'NO EFFECT', '#9A927E'); audio.sfx('miss'); target.flashT = 2; return; }
    if (target.side === 'party') {
      if (this.decoy > 0 && !o.noDecoy && !o.magic) { this.decoy--; this.fx.add('spark', cx - 20, cy, { style: 'ring', color: EL.holy }); this.msgOut('The decoy takes the hit!', 50); audio.sfx('glass'); return; }
      if (this.brace && this.brace.for === target && this.brace.by.alive && this.brace.by !== target && !o.all) {
        const by = this.brace.by;
        this.msgOut(`${by.name} steps in!`, 40);
        target = by;
        amount = Math.round(amount * 0.6);
      }
      // Interceptor shields Shadow
      if (target.id === 'shadow' && !o.magic && Math.random() < 0.3 && o.src) {
        this.msgOut('Interceptor!', 40);
        audio.sfx('slash');
        this.fx.add('beasts', 0, 0, { dur: 16, color: R.black[2] });
        await wait(10);
        if (o.src.alive) this.damage(o.src, Math.round(this.calcPhys(target, o.src, 1.2).dmg), '#FFFDF5');
        return;
      }
      if (target.status.aegis) { delete target.status.aegis; this.fx.add('hex', cx, cy, { color: R.brass[0], dur: 20 }); this.addNum(target, '0', '#FFFDF5'); return; }
      if (target.defending) amount = Math.round(amount / 2);
      if (o.magic ? target.status.shell : target.status.protect) amount = Math.round(amount * 0.6);
    }
    target.flashT = 2;
    const [tx, ty] = this.centerOf(target);
    if (o.crit) { shake(2, 6); flash(); audio.sfx('crit'); target.flashT = 3; }
    else if (!o.silent) audio.sfx(o.heavy ? 'heavy' : 'hit');
    if (o.weapon !== undefined) this.fx.add(o.weapon === 'none' || o.weapon === 'claw' ? 'claw' : 'spark', tx, ty, { dur: 6 });
    if (target.side === 'enemy') {
      if (target.d.family === 'machine') this.fx.shards(tx, ty);
      else this.fx.add('dust', tx, ty + 10, { dur: 14 });
    }
    if (target.side === 'party') {
      target.pose = 'hurt';
      target.dx = 2;
      this.fx.add('timer', 0, 0, { dur: 10, done: () => { target.pose = null; target.dx = 0; } });
      if (target.status.sleep) delete target.status.sleep;
      if (target.status.confuse && Math.random() < 0.5) delete target.status.confuse;
    } else {
      if (target.status.sleep) delete target.status.sleep;
    }
    this.damage(target, Math.min(9999, amount), o.crit ? '#F5D68A' : '#FFFDF5', o.crit);
    // counters
    if (target.side === 'party' && target.alive && o.src && o.src.alive && !o.magic) {
      const rl = relic(target.c);
      if (target.counter && target.counter.n > 0) {
        target.counter.n--;
        const pw = target.counter.power;
        if (target.counter.n <= 0) target.counter = null;
        this.msgOut('Counter!', 30);
        this.queue.unshift({ kind: 'effect', eff: { kind: 'phys', power: pw, target: 'enemy', fx: 'slash', name: 'Counter' }, actor: target, targets: [o.src], counter: true });
      } else if (rl && rl.counter && Math.random() < rl.counter) {
        this.queue.unshift({ kind: 'effect', eff: { kind: 'phys', power: 1, target: 'enemy', fx: 'claw', name: 'Counter' }, actor: target, targets: [o.src], counter: true });
      }
    }
    await wait(4);
  }

  damage(target, amount, color, big = false) {
    if (target.side === 'party') {
      target.c.hp = Math.max(0, target.c.hp - amount);
      if (target.c.hp === 0) {
        target.ready = false; target.atb = 0; target.defending = false; target.status = {}; target.raging = null; target.dancing = null;
        audio.sfx('collapse');
        if (this.menu && this.menu.actor === target) this.menu = null;
      }
    } else {
      target.hp = Math.max(0, target.hp - amount);
      target.dmg = target.hp < target.maxhp * 0.33 ? 2 : target.hp < target.maxhp * 0.66 ? 1 : 0;
      if (target.hp === 0 && target.alive) this.kill(target);
    }
    this.addNum(target, String(amount), color, big);
  }

  heal(target, amount, sp = 0) {
    if (target.side === 'party') {
      if (!target.alive) return;
      target.c.hp = Math.min(target.c.maxhp, target.c.hp + amount);
      if (sp) target.c.sp = Math.min(target.c.maxsp, target.c.sp + sp);
    } else target.hp = Math.min(target.maxhp, target.hp + amount);
    if (amount) this.addNum(target, String(Math.min(9999, amount)), '#78C050');
    else if (sp) this.addNum(target, sp + 'SP', UI.pink);
  }

  addStatus(t, id, frames = 25 * SEC) {
    if (t.side === 'party' && relic(t.c) && relic(t.c).immune && STATUS[id] && STATUS[id].bad) { this.addNum(t, 'IMMUNE', '#9A927E'); return false; }
    if (t.side === 'enemy' && t.d.boss && ['petrify', 'stop', 'confuse', 'berserk', 'rest'].includes(id)) { this.addNum(t, 'NO EFFECT', '#9A927E'); return false; }
    if (id === 'rest' && t.side === 'party' && ['terra', 'dalia'].includes(t.id) && Math.random() < 0.5) { this.addNum(t, 'RESIST', R.spirit[1]); return false; }
    if (id === 'petrify' && t.side === 'enemy') { t.status.petrify = -1; this.kill(t); this.msgOut(t.name + ' turns to stone.', 40); return true; }
    t.status[id] = id === 'rest' || id === 'petrify' ? -1 : frames;
    if (id === 'haste') delete t.status.slow;
    if (id === 'slow') delete t.status.haste;
    if (t.side === 'party' && INCAP.includes(id)) { t.ready = false; if (this.menu && this.menu.actor === t) this.menu = null; }
    this.addNum(t, STATUS[id] ? STATUS[id].name.toUpperCase() : id, STATUS[id] && STATUS[id].bad ? '#C4BCA6' : UI.name);
    return true;
  }
  cure(t) { for (const k of Object.keys(t.status)) if (STATUS[k] && STATUS[k].bad) delete t.status[k]; }

  kill(e) {
    e.alive = false;
    e.dying = 24;
    audio.sfx(e.d.family === 'machine' ? 'glass' : 'collapse');
    const sp = (this.spoils ||= { exp: 0, parts: 0, gp: 0, drops: [], rages: [] });
    sp.exp += e.d.exp || 0;
    sp.gp += e.d.gp || 0;
    sp.parts += e.d.parts || 0;
    if (e.d.drops && Math.random() < 0.5) sp.drops.push(e.d.drops);
    if (e.d.rage && this.member('gau') && !game.state.rages[e.d.rage]) { game.state.rages[e.d.rage] = true; sp.rages.push(RAGES[e.d.rage].name); }
    if (e.d.family === 'machine') { const [x, y] = this.centerOf(e); for (let i = 0; i < 3; i++) this.fx.shards(x + rnd(-10, 10), y + rnd(-10, 10)); }
    this.queue = this.queue.filter((q) => q.enemy !== e);
    if (this.opts.script) this.runHook('enemyDown', e);
  }

  // ---------------------------------------------------------------- ability resolution
  async useAbility(p, id, targets, o = {}) {
    const ab = ABIL[id];
    const st = game.state;
    // pay
    if (!o.free) {
      const half = relic(p.c) && relic(p.c).spHalf;
      if (ab.cost.sp) { const c = half ? Math.ceil(ab.cost.sp / 2) : ab.cost.sp; if (p.c.sp < c) { this.msgOut('Not enough SP.'); return; } p.c.sp -= c; }
      if (ab.cost.parts) { if (st.parts < ab.cost.parts) { this.msgOut('Not enough parts.'); return; } st.parts -= ab.cost.parts; }
      if (ab.cost.item) { if (!st.items[ab.cost.item]) { this.msgOut('None left.'); return; } st.items[ab.cost.item]--; }
    }
    if (ab.once) this.used.add(id);
    if (ab.input) { // Blitz: enter the motion
      this.msgOut('Blitz: ' + ab.desc.replace('Input: ', ''), 240);
      const ok = await this.blitzInput(ab.input);
      this.msg = null;
      if (!ok) { this.msgOut('The motion slips. Try again!', 50); audio.sfx('buzzer'); return; }
    }
    if (ab.duo) { for (const d of ab.duo) { const q = this.member(d); if (q && q !== p) { q.atb = 0; q.ready = false; q.pose = 'swing'; this.fx.add('timer', 0, 0, { dur: 40, done: () => { q.pose = null; } }); } } }
    this.msgOut(ab.name, 60);
    switch (id) {
      case 'turret': return this.special(p, () => { this.turret = { shots: 3, atb: 60, x: p.hx - 26, y: p.hy + 22, owner: p }; audio.sfx('turret'); });
      case 'decoy': return this.special(p, () => { this.decoy = 2; audio.sfx('spirit'); });
      case 'brace': this.brace = { by: p, for: targets[0] }; p.defending = true; audio.sfx('defend'); this.msgOut(`${p.name} braces to cover ${targets[0].name}.`, 60); await wait(24); return;
      case 'runic': p.pose = 'defend'; this.runic = p; audio.sfx('defend'); this.msgOut(`${p.name} readies her runes.`, 50); await wait(24); p.pose = null; return;
      case 'sky': p.counter = { n: 1, power: 1.8 }; p.pose = 'defend'; audio.sfx('defend'); this.msgOut('Sky: a counter stance.', 50); await wait(24); p.pose = null; return;
      case 'counterStance': p.counter = { n: 3, power: 1.0 }; p.pose = 'defend'; audio.sfx('defend'); await wait(24); p.pose = null; return;
      case 'trance': return this.special(p, () => { p.status.trance = 40 * SEC; this.cure(p); flash(R.spirit[0]); audio.sfx('spirit'); this.msgOut('Terra embraces the Esper within.', 70); });
      case 'steal': case 'mug': return this.steal(p, targets[0], id === 'mug');
      case 'sketch': return this.sketch(p, targets[0]);
    }
    const tier = this.tierFor(p, ab, id);
    return this.resolve(p, { ...ab, tier }, targets.length ? targets : this.targetsFor(ab.target, p), { echo: p.c.echo && abilitiesFor(p.c, 'echo', st).includes(id) });
  }

  tierFor(p, ab, id) {
    if (ab.tier) return ab.tier;
    if (p.c.echo && abilitiesFor(p.c, 'echo', game.state).includes(id)) return echoTier(game.state);
    if (ab.kind === 'magic' && game.state.flags.wsWind) return 2;
    return 1;
  }

  async special(p, fn) {
    p.pose = 'cast';
    audio.sfx('build');
    const [px, py] = this.centerOf(p);
    for (let i = 0; i < 6; i++) this.fx.add('part', px + rnd(-20, 4), py + rnd(-18, 10), { tx: px - 18, ty: py });
    await wait(16);
    fn();
    await wait(14);
    p.pose = null;
  }

  // The single place every damaging/healing/buffing effect lands.
  async resolve(src, eff, targets, o = {}) {
    targets = targets.filter(Boolean);
    if (!targets.length) return;
    const party = src.side === 'party';
    const magicLike = eff.kind === 'magic' || eff.kind === 'heal' || eff.kind === 'revive' || eff.kind === 'buff' || eff.kind === 'status';
    const tier = eff.tier || 1;
    const fxKind = eff.fx || (eff.el ? fxForElement(eff.el) : eff.kind === 'heal' ? 'heal' : 'spark');
    // caster wind-up
    if (party) {
      if (eff.kind === 'phys' && targets.length === 1 && !['bolts', 'star', 'beasts', 'drill'].includes(fxKind)) {
        return this.physical(src, targets[0], eff.power, eff.name, { hits: eff.hits, pierce: eff.pierce, el: eff.el })
          .then(() => this.afterEffect(src, eff, targets));
      }
      src.pose = magicLike ? 'cast' : 'windup';
      const [px, py] = this.centerOf(src);
      if (magicLike) { this.fx.add('aura', px, py, { dur: 12, color: auraColour(eff.el, eff.kind) }); audio.sfx(eff.kind === 'heal' || eff.kind === 'revive' ? 'heal' : 'spirit'); }
      await wait(12);
    }
    // tier 2/3: tint the background toward the element; tier 3 also shakes and darkens the party side
    if (eff.kind === 'magic' && tier >= 2) this.tint = { color: (EL[eff.el] || EL.holy)[2], level: tier === 3 ? 2 : 1, t: 70 + tier * 20 };
    if (o.echo && tier === 3) await this.memoryFrame(src.c.echo);
    if (tier === 3) shake(3, 30);
    // launch the visual on each target
    let lead = 0;
    if (fxKind === 'beasts' || fxKind === 'screencut' || (eff.fx === 'wave' && tier === 3)) {
      lead = this.fx.play(fxKind, 0, 100, { tier, y: 100 });
    } else {
      for (const t of targets) {
        const [tx, ty] = this.centerOf(t);
        const [sx, sy] = this.centerOf(src);
        lead = Math.max(lead, this.fx.play(fxKind, tx, ty, { tier, sx, sy, color: eff.paintCol }));
      }
    }
    sfxFor(fxKind);
    await wait(Math.min(40, lead));
    for (const t of targets) await this.applyTo(src, eff, t, tier);
    if (party) src.pose = null;
    await this.afterEffect(src, eff, targets);
    await wait(10);
  }

  async afterEffect(src, eff, targets) {
    if (src.side !== 'party') return;
    if (eff.healParty) for (const q of this.livingParty()) this.heal(q, Math.round(q.c.maxhp * eff.healParty));
    if (eff.atbBoost) for (const q of this.livingParty()) q.atb = Math.min(100, q.atb + eff.atbBoost);
    if (eff.atbFill) for (const q of this.livingParty()) if (q !== src) { q.atb = 100; }
    if (eff.atbAfter) src.atb = eff.atbAfter;
  }

  async applyTo(src, eff, t, tier) {
    const party = src.side === 'party';
    switch (eff.kind) {
      case 'phys': {
        if (t.side === 'enemy' && !t.alive) return;
        if (eff.instant && t.side === 'enemy' && !t.d.boss && Math.random() < eff.instant) { this.msgOut('Cut down!', 40); this.damage(t, t.hp, '#FFFDF5'); return; }
        for (let h = 0; h < (eff.hits || 1); h++) {
          if (!t.alive) break;
          let { dmg, crit } = this.calcPhys(src, t, eff.power, { pierce: eff.pierce });
          const m = this.elemMult(t, eff.el);
          if (m < 0) { this.heal(t, dmg); continue; }
          await this.impact(t, Math.round(dmg * m), { crit, src, silent: h > 0 });
        }
        return;
      }
      case 'magic': {
        if (t.side === 'enemy' && !t.alive) return;
        if (!t.alive && t.side === 'party') return;
        let el = eff.el;
        if (el === 'weakest' && t.side === 'enemy') el = (t.d.weak || ['holy']).find((w) => typeof w === 'string') || 'holy';
        let dmg = this.calcMag(src, t, eff.power, tier);
        const m = this.elemMult(t, el);
        if (m < 0) { this.heal(t, dmg); this.msgOut(t.name + ' absorbs it!', 40); return; }
        await this.impact(t, Math.round(dmg * m), { magic: true, src, silent: true });
        if (eff.status && t.alive && Math.random() < (eff.chance ?? 1)) this.addStatus(t, eff.status);
        if (eff.drain && src.alive) this.heal(src, Math.round(dmg * 0.5));
        return;
      }
      case 'heal': {
        if (t.c && t.c.hp <= 0) return;
        const a = this.st(src);
        const amt = party ? Math.round((a.mag * 4 + 30 + a.lv * 2) * eff.power) : Math.round((t.maxhp || 0) * (eff.heal || 0.05));
        if (eff.cure) this.cure(t);
        this.heal(t, amt);
        return;
      }
      case 'revive': {
        if (t.side !== 'party') return;
        if (t.c.hp > 0) { if (eff.target === 'allAllies') this.heal(t, Math.round(t.c.maxhp * eff.power * 0.5)); return; }
        t.c.hp = Math.max(1, Math.round(t.c.maxhp * eff.power));
        t.status = {};
        t.atb = 0;
        this.addNum(t, String(t.c.hp), '#78C050');
        return;
      }
      case 'buff': {
        if (t.c && t.c.hp <= 0) return;
        if (eff.buff) this.addStatus(t, eff.buff, 40 * SEC);
        if (eff.buff2) this.addStatus(t, eff.buff2, 40 * SEC);
        return;
      }
      case 'status': {
        if (!t.alive) return;
        if (Math.random() < (eff.chance ?? 1)) this.addStatus(t, eff.status);
        else this.addNum(t, 'MISS', '#9A927E');
      }
    }
  }

  async memoryFrame(shard) { // Echoes are remembered images: sepia-violet duotone, a silhouette, scanline flicker
    const kind = ['shiva', 'siren', 'unicorn', 'valtheia'].includes(shard) ? 'echoShiva' : 'echoIfrit';
    this.memory = { kind, t: 50, name: ECHOES[shard] ? ECHOES[shard].esper : '' };
    audio.sfx('chime');
    await wait(36);
  }

  async steal(p, t, mug) {
    if (!t) return;
    if (mug) await this.physical(p, t, 1.1, 'Mug');
    else { await this.stepForward(p, 28); p.pose = 'swing'; await wait(8); }
    const st = game.state;
    if (t.alive || mug) {
      const chance = (t.d.boss ? 0.35 : 0.6) + (this.st(p).lv - this.st(t).lv) * 0.01;
      if (!t.d.steal || t.stolen) this.msgOut("There's nothing to steal.", 50);
      else if (Math.random() < chance) { t.stolen = true; st.items[t.d.steal] = (st.items[t.d.steal] || 0) + 1; if (!ITEMS[t.d.steal]) { delete st.items[t.d.steal]; st.gear[t.d.steal] = (st.gear[t.d.steal] || 0) + 1; } audio.sfx('item'); this.msgOut(`Stole ${(ITEMS[t.d.steal] || {}).name || t.d.steal}!`, 60); }
      else { this.msgOut("Couldn't steal anything.", 50); audio.sfx('miss'); }
    }
    await wait(20);
    p.pose = null;
    if (!mug) await this.stepBack(p);
  }

  async sketch(p, t) {
    if (!t) return;
    p.pose = 'cast';
    this.fx.play('paint', ...this.centerOf(t), { color: [R.stone[0], R.tunicRed[1], R.farmBlue[1]] });
    audio.sfx('build');
    await wait(24);
    const moves = t.d.moves.filter((mv) => mv.power > 0);
    if (!moves.length) { this.msgOut('The sketch fades.', 40); p.pose = null; return; }
    const mv = moves[Math.floor(Math.random() * moves.length)];
    this.msgOut('Sketch: ' + mv.name, 50);
    await this.resolve(p, { ...moveToEffect(mv), power: mv.power * 1.2 }, mv.all ? this.livingEnemies() : [t]);
  }

  async learn(p) {
    const mv = this.lastEnemyMove;
    p.pose = 'cast';
    if (!mv || mv.power <= 0) { this.msgOut("Seven's lens watches, but there is nothing to copy yet.", 60); await wait(30); p.pose = null; return; }
    if (!this.learned.includes(mv.name)) { this.learned.push(mv.name); (game.state.sevenLearned ||= {})[mv.name] = true; this.msgOut('Seven copies ' + mv.name + '!', 60); audio.sfx('chime'); await wait(30); }
    else this.msgOut('Copy: ' + mv.name, 50);
    const eff = { ...moveToEffect(mv), name: mv.name };
    await this.resolve(p, eff, mv.all ? this.livingEnemies() : this.targetsFor('enemy', p));
  }

  async slots(p, syms) {
    const [a, b, c] = syms;
    let res;
    if (a === b && b === c) res = { ...SLOT_RESULT[a] };
    else if (a === b || b === c || a === c) res = { name: 'Lucky Pair', kind: 'phys', power: 1.6, target: 'enemy', fx: 'star' };
    else if (Math.random() < 0.15) res = { name: 'Bust!', kind: 'phys', power: 0.6, target: 'ally', fx: 'star', bust: true };
    else res = { name: 'Fizzle...', kind: 'none' };
    if (a === '7' && b === '7' && c === '7' && game.state.flags.ult_setzer) { res.name = 'Jackpot Royale!'; res.power = 7.0; }
    this.msgOut(`${a} - ${b} - ${c}: ${res.name}`, 80);
    await wait(24);
    if (res.kind === 'none') { audio.sfx('miss'); return; }
    const targets = res.bust ? [this.livingParty()[Math.floor(Math.random() * this.livingParty().length)]] : this.targetsFor(res.target, p);
    if (res.bust) { const t = targets[0]; await this.impact(t, Math.round(t.c.maxhp * 0.1), { noDecoy: true }); return; }
    await this.resolve(p, res, targets);
  }

  async useItem(p, id, target, free = false) {
    const it = ITEMS[id];
    if (!free) { if (!game.state.items[id]) return; game.state.items[id]--; }
    p.pose = 'item';
    this.msgOut(it.name, 50);
    audio.sfx('item');
    await wait(10);
    if (it.flee) { p.pose = null; if (this.opts.boss || this.opts.noFlee) { this.msgOut("Can't escape!", 50); return; } await this.flee(); return; }
    if (!target) { p.pose = null; return; }
    const [tx, ty] = this.centerOf(target);
    if (it.revive) {
      if (target.c.hp > 0) this.addNum(target, 'MISS', '#9A927E');
      else {
        this.fx.play('feather', tx, ty);
        audio.sfx('heal');
        await wait(26);
        target.c.hp = Math.max(1, Math.round(target.c.maxhp * it.revive));
        target.atb = 0; target.status = {};
        this.addNum(target, String(target.c.hp), '#78C050');
      }
    } else {
      if (target.c.hp <= 0) { this.addNum(target, 'MISS', '#9A927E'); p.pose = null; return; }
      this.fx.play('heal', tx, ty);
      audio.sfx('heal');
      await wait(18);
      if (it.cure) { this.cure(target); this.addNum(target, 'CURED', UI.name); }
      if (it.heal || it.sp) this.heal(target, Math.min(target.c.maxhp, it.heal || 0), it.sp || 0);
    }
    await wait(6);
    p.pose = null;
  }

  async turretShot() {
    const t = this.turret;
    const foes = this.livingEnemies();
    const e = foes[Math.floor(Math.random() * foes.length)];
    if (!e) return;
    t.shots--;
    audio.sfx('turret');
    const [tx, ty] = this.centerOf(e);
    this.fx.add('boltline', tx, ty, { sx: t.x, sy: t.y, dur: 8 });
    await wait(6);
    await this.impact(e, Math.round((24 + t.owner.c.lv * 4) * rnd(0.85, 1.15)), { weapon: 'bolts' });
    if (t.shots <= 0) { this.turret = null; this.msgOut('The turret falls apart.', 40); }
  }

  // ---------------------------------------------------------------- enemies
  pickMove(e) {
    const ai = BOSS_AI[e.kind];
    if (ai) { const m = ai(this, e); if (m) return m; }
    const moves = e.d.moves.filter((m) => m.w > 0);
    const total = moves.reduce((s, m) => s + m.w, 0);
    let r = Math.random() * total;
    for (const m of moves) { r -= m.w; if (r <= 0) return m; }
    return moves[0];
  }

  async enemyAct(e) {
    if (!e.alive || INCAP.some((s) => e.status[s])) return;
    const move = this.pickMove(e);
    if (!move) return;
    const able = this.livingParty();
    if (!able.length) return;
    // confusion turns enemies on each other
    let foes = able;
    if (e.status.confuse) foes = this.livingEnemies();
    let target = foes[Math.floor(Math.random() * foes.length)];
    this.msgOut(move.name, 50);
    const machine = e.d.family === 'machine';
    const lunge = e.d.big ? 6 : 12;
    for (let i = 1; i <= 10; i++) { e.dx = machine ? Math.round(ease(i / 10) * lunge) : Math.round(Math.sin((i / 10) * Math.PI * 0.6) * lunge * 1.2); await wait(1); }
    e.flashT = 2;
    if (e.faces) { // Mercy changes faces: hard cut with a 2-frame white flash
      e.face = e.faces[Math.floor(Math.random() * e.faces.length)];
      e.flashT = 2;
    }
    this.lastEnemyMove = move;
    // Strago learns lores by watching
    if (move.lore && this.member('strago') && this.member('strago').alive && !game.state.lores[move.lore]) {
      game.state.lores[move.lore] = true;
      this.fx.add('timer', 0, 0, { dur: 50, done: () => this.msgOut('Strago learned ' + ABIL[move.lore].name + '!', 80) });
    }
    if (move.summon) {
      audio.sfx('flower');
      for (let i = 0; i < 2; i++) if (this.livingEnemies().length < 5) this.addEnemy(move.summon);
      this.msgOut(e.kind === 'vigil' ? 'Vigil spends its crew without hesitation.' : 'More of them arrive!', 60);
      await wait(30);
    } else if (move.healCore) {
      const core = this.enemies.find((x) => x.alive && (x.d.part === 'core' || x.kind === 'solaceGarden'));
      if (core) { audio.sfx('heal'); this.fx.play('drain', ...this.centerOf(core), { sx: this.centerOf(e)[0], sy: this.centerOf(e)[1] }); await wait(24); this.heal(core, move.healCore); }
    } else if (move.heal || move.healAll || move.selfHeal) {
      audio.sfx('heal');
      const who = move.healAll ? this.livingEnemies() : [e];
      for (const w of who) { this.fx.play('heal', ...this.centerOf(w)); }
      await wait(20);
      for (const w of who) this.heal(w, Math.round(w.maxhp * (move.heal || move.healAll || move.selfHeal)));
    } else {
      const eff = moveToEffect(move);
      const targets = move.all ? foes : [target];
      // Runic absorbs magic aimed at the party
      if (eff.kind === 'magic' && this.runic && this.runic.alive && !e.status.confuse) {
        const c = this.runic;
        this.runic = null;
        this.msgOut('Runic absorbs the spell!', 60);
        audio.sfx('spirit');
        this.fx.play('rings', ...this.centerOf(c), { color: [R.cream[0], R.moss[1], R.moss[2]] });
        await wait(24);
        this.heal(c, 0, Math.round(10 + move.power * 12));
      } else {
        await this.resolve(e, eff, targets);
      }
    }
    for (let i = 1; i <= 10; i++) { e.dx = Math.round(lunge * (1 - ease(i / 10))); await wait(1); }
    e.dx = 0;
    if (this.brace && Math.random() < 0.5) this.brace = null;
  }

  // ---------------------------------------------------------------- endings
  async flee() {
    this.over = true;
    this.menu = null;
    audio.sfx('flee');
    this.msgOut('Escaped!', 60);
    for (let i = 0; i < 24; i++) { for (const p of this.party) p.dx += 3; await wait(1); }
    await fadeOut(16);
    this.finish('flee');
  }

  async victory() {
    if (this.over) return;
    this.over = true;
    this.menu = null;
    this.mini = null;
    await wait(30);
    if (this.opts.noVictory) { this.finish('win'); return; }
    audio.playMusic('victory');
    for (const p of this.party) if (p.alive && !p.status.rest) p.pose = 'victory';
    const sp = this.spoils || { exp: 0, parts: 0, gp: 0, drops: [], rages: [] };
    const st = game.state;
    const lines = [];
    const alive = this.party.filter((p) => p.alive);
    if (sp.exp) {
      lines.push(`Gained ${sp.exp} EXP.`);
      for (const p of alive) {
        p.c.exp += sp.exp;
        while (p.c.exp >= expForLevel(p.c.lv + 1)) { levelUp(p.c); lines.push(`${p.name} reached level ${p.c.lv}!`); audio.sfx('levelup'); }
      }
      // reserve members share half, so the bench keeps up
      for (const id of st.roster || []) {
        if (this.party.some((p) => p.id === id)) continue;
        const c = st.chars[id];
        if (!c) continue;
        c.exp += Math.floor(sp.exp / 2);
        while (c.exp >= expForLevel(c.lv + 1)) levelUp(c);
      }
    }
    if (sp.gp) { st.gp = (st.gp || 0) + sp.gp; lines.push(`Found ${sp.gp} GP.`); }
    if (sp.parts) { st.parts += sp.parts; lines.push(`Salvaged ${sp.parts} machine part${sp.parts > 1 ? 's' : ''}.`); }
    for (const d of sp.drops) { st.items[d] = (st.items[d] || 0) + 1; lines.push(`Found a ${ITEMS[d].name}.`); }
    for (const r of sp.rages) lines.push(`Gau learned the ${r} rage!`);
    if (this.learned.length) lines.push(`Seven remembers: ${this.learned.join(', ')}.`);
    for (const p of this.party) { p.c.status = undefined; }
    this.results = lines.length ? lines.slice(0, 9) : ['Victory.'];
    this.overUpdate = () => {
      this.resT = (this.resT || 0) + 1;
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
    this.mini = null;
    audio.stopMusic(1.5);
    await wait(40);
    await fadeOut(this.opts.canLose ? 30 : 40);
    this.finish('lose');
  }

  finish(result) {
    // fallen or resting members get back up at 1 HP after a win so the field never has a dead leader
    if (result !== 'lose') for (const p of this.party) if (p.c.hp <= 0) p.c.hp = 1;
    this.opts.onEnd(result);
  }

  // ---------------------------------------------------------------- effects helpers
  addSmear(p, weapon) {
    const [x, y] = this.posOf(p);
    this.fx.add('smear', x - 4, y + 8, { dur: 3, w: weapon === 'knife' ? 4 : weapon === 'lance' ? 3 : weapon === 'none' || weapon === 'claw' ? 4 : weapon === 'club' || weapon === 'pick' ? 8 : 6 });
  }
  addNum(target, text, color, big = false) {
    const [x, y] = this.centerOf(target);
    this.nums.push({ x, y: y - 10, text, color, t: 0, big });
  }

  // ---------------------------------------------------------------- draw
  draw(ctx) {
    drawBg(ctx, this.bg, this.t);
    if (this.tint) ditherRect(ctx, 0, 0, W, FIELD_H, this.tint.color, this.tint.level);
    for (const e of this.enemies) {
      if (!e.alive && !e.dying) continue;
      const s = this.spriteOf(e);
      const [x, y] = this.posOf(e);
      if (!e.d.hover || e.d.big) {
        ctx.fillStyle = ditherPattern(ctx, OUTLINE, 2);
        const sw = Math.min(60, s.width * 0.7);
        ctx.fillRect(Math.round(x + s.width / 2 - sw / 2), e.fy - 2 + e.dy, Math.round(sw), 3);
      }
      let img = e.flashT > 0 ? whiteOf(s) : s;
      if (e.dying) img = dissolve(img, 1 - e.dying / 24);
      ctx.drawImage(img, x, y + (e.dying && e.d.family !== 'machine' ? Math.floor((24 - e.dying) / 3) : 0));
      this.drawStatusIcons(ctx, e, x + s.width / 2, y - 4);
    }
    if (this.turret) drawTurret(ctx, this.turret, this.t);
    if (this.decoy > 0) {
      const p = this.party[0];
      ctx.fillStyle = (this.t >> 2) % 2 ? R.brass[0] : '#FFFDF5';
      ctx.fillRect(p.hx - 36, p.hy + 18, 4, 6); ctx.fillRect(p.hx - 37, p.hy + 16, 6, 2);
    }
    if (this.tint && this.tint.level === 2) ditherRect(ctx, 260, 0, W - 260, FIELD_H, OUTLINE, 1); // tier 3 darkens the party side
    for (const p of this.party) {
      const [x, y] = this.posOf(p);
      ctx.fillStyle = ditherPattern(ctx, OUTLINE, 2);
      ctx.fillRect(x + 6, y + 36, 20, 3); ctx.fillRect(x + 8, y + 39, 16, 1);
      if (p.c.hp <= 0) { ctx.drawImage(koSprite(p.base), x - 4, y + 26); continue; }
      const s = this.spriteOf(p);
      const ox = Math.floor((32 - s.width) / 2), oy = 40 - s.height;
      ctx.drawImage(p.flashT > 0 ? whiteOf(s) : s, x + ox, y + oy);
      if (p.status.protect || p.status.shell) { if ((this.t % 90) < 6) ditherRect(ctx, x + 4, y + 2, 24, 36, p.status.shell ? R.spirit[1] : R.iron[0], 1); }
      if (p.ready && !this.acting && Math.floor(this.t / 8) % 2 === 0 && this.menu?.actor !== p) { ctx.fillStyle = UI.gold; ctx.fillRect(x + 14, y - 4, 3, 2); }
      this.drawStatusIcons(ctx, p, x + 16, y - 2);
    }
    this.fx.draw(ctx);
    if (this.memory) this.drawMemory(ctx);
    for (const n of this.nums) drawPopNumber(ctx, n);
    if (this.msg && this.msg.t > 0) {
      this.msg.t--;
      const w = Math.min(W - 8, textWidth(this.msg.text) + 20);
      drawWindow(ctx, Math.floor((W - w) / 2), 4, w, 20);
      drawTextCentered(ctx, this.msg.text, W / 2, 10, UI.text);
    }
    this.drawHud(ctx);
    if (this.mini) this.drawMini(ctx);
    if (this.fleeT > 10) drawTextCentered(ctx, 'Fleeing...', W / 2, 28, UI.text);
    if (this.results) this.drawResults(ctx);
  }

  drawMemory(ctx) {
    const m = this.memory;
    ditherRect(ctx, 0, 0, W, FIELD_H, R.plum[3], 2); // sepia-violet duotone
    const img = enemySprite(m.kind, (this.t >> 2) % 2);
    const lvl = m.t > 40 ? 1 : m.t < 10 ? 1 : 2;
    ctx.globalAlpha = 1;
    if (lvl) ctx.drawImage(img, 150 - img.width / 2, 20);
    drawTextCentered(ctx, m.name, W / 2, 140, R.spirit[0]);
  }

  drawStatusIcons(ctx, b, cx, y) {
    const ids = Object.keys(b.status).filter((k) => STATUS[k] && STATUS[k].icon);
    ids.slice(0, 3).forEach((k, i) => drawIcon(ctx, STATUS[k].icon, Math.round(cx - ids.length * 5 + i * 10), y - 8, this.t));
  }

  drawHud(ctx) {
    const y0 = FIELD_H;
    drawWindow(ctx, 0, y0, 132, H - y0);
    drawWindow(ctx, 132, y0, W - 132, H - y0);
    const names = {};
    for (const e of this.livingEnemies()) names[e.name] = (names[e.name] || 0) + 1;
    Object.entries(names).slice(0, 4).forEach(([n, c], i) => drawText(ctx, (n + (c > 1 ? ' x' + c : '')).slice(0, 20), 7, y0 + 5 + i * 11, UI.text));
    const n = this.party.length;
    const rowH = n > 3 ? 12 : 13;
    this.party.forEach((p, i) => {
      const y = y0 + 5 + i * rowH;
      const sel = this.menu && this.menu.actor === p;
      const col = p.c.hp <= 0 ? UI.hpLow : sel ? UI.gold : p.status.rest ? UI.textDim : UI.text;
      drawText(ctx, p.name, 140, y, col);
      const hp = p.c.hp, mh = p.c.maxhp;
      drawTextRight(ctx, String(hp), 222, y, hp < mh / 4 ? UI.hpLow : UI.text);
      drawText(ctx, '/' + mh, 224, y, UI.textDim);
      if (p.c.maxsp) drawTextRight(ctx, p.c.sp + 'sp', 310, y, UI.pink);
      const gx = 318, gw = 56;
      ctx.fillStyle = OUTLINE; ctx.fillRect(gx - 1, y + 1, gw + 2, 6);
      ctx.fillStyle = '#24244E'; ctx.fillRect(gx, y + 2, gw, 4);
      const fill = Math.round((Math.max(0, Math.min(100, p.atb)) / 100) * gw);
      ctx.fillStyle = p.ready ? (Math.floor(this.t / 6) % 2 ? UI.atbFull : '#FFFDF5') : p.status.stop ? R.farmBlue[2] : UI.atb;
      ctx.fillRect(gx, y + 2, fill, 4);
      if (fill > 1) { ctx.fillStyle = p.ready ? '#FFFDF5' : R.glass[1]; ctx.fillRect(gx, y + 2, fill, 1); }
    });
    if (this.turret) drawText(ctx, 'Turret x' + this.turret.shots, 7, y0 + 44, R.brass[0]);
    else if (this.party.some((p) => p.c.cmds.includes('salvage'))) drawText(ctx, 'Parts ' + game.state.parts, 7, y0 + 44, R.brass[0]);
    if (this.menu) this.drawMenu(ctx);
  }

  drawMenu(ctx) {
    const m = this.menu;
    const y0 = FIELD_H;
    const p = m.actor;
    const cmds = m.cmds;
    const w = 72, h = Math.max(H - y0, cmds.length * 11 + 8);
    const y = H - h;
    drawWindow(ctx, 60, y, w, h);
    cmds.forEach((c, i) => drawText(ctx, CMD_NAMES[c] || c, 76, y + 5 + i * 11, this.cmdUsable(p, c) ? UI.text : UI.textDim));
    if (m.stage === 'cmd') drawCursor(ctx, 63, y + 5 + m.i * 11, this.t);
    if (m.list && (m.stage === 'list' || m.stage === 'target')) {
      const L = m.list;
      const rows = Math.min(7, L.length);
      const lw = 240, lh = rows * 11 + 24;
      const lx = 140, ly = y0 - lh + 2;
      drawWindow(ctx, lx, ly, lw, lh);
      const start = Math.max(0, Math.min(L.length - rows, m.li - rows + 2));
      for (let i = 0; i < rows; i++) {
        const it = L[start + i];
        drawText(ctx, it.label, lx + 18, ly + 5 + i * 11, it.ok ? UI.text : UI.textDim);
        drawTextRight(ctx, it.right || '', lx + lw - 8, ly + 5 + i * 11, it.ok ? UI.gold : UI.textDim);
      }
      const cur = L[m.li];
      if (cur && cur.desc) drawText(ctx, cur.desc.slice(0, 54), lx + 7, ly + lh - 14, UI.name);
      if (m.stage === 'list') drawCursor(ctx, lx + 4, ly + 5 + (m.li - start) * 11, this.t);
    }
    if (m.stage === 'target') {
      const pool = this.targetPool(m);
      const sel = m.multi === 'all' ? pool : [pool[Math.min(m.ti, pool.length - 1)]];
      for (const t of sel) {
        if (!t) continue;
        const [cx, cy] = this.centerOf(t);
        if (t.side === 'enemy') { const s = this.spriteOf(t); drawCursor(ctx, cx - s.width / 2 - 12, cy - 3, this.t); }
        else drawCursor(ctx, cx - 26, cy - 3, this.t);
      }
      if (sel.length === 1 && sel[0]) drawText(ctx, sel[0].name, 6, FIELD_H - 12, UI.gold);
    }
  }

  drawMini(ctx) {
    const g = this.mini;
    if (g.kind === 'bushido') {
      drawWindow(ctx, 100, 120, 184, 36);
      drawText(ctx, 'Bushido — release with A', 110, 126, UI.text);
      for (let i = 0; i < g.max; i++) {
        ctx.fillStyle = OUTLINE; ctx.fillRect(110 + i * 42, 140, 38, 8);
        const fill = Math.max(0, Math.min(38, (g.t - i * 40) * 38 / 40));
        ctx.fillStyle = i < (g.lv || 1) - 1 ? UI.gold : UI.atb; ctx.fillRect(110 + i * 42, 141, fill, 6);
        drawText(ctx, String(i + 1), 126 + i * 42, 139, OUTLINE, null);
      }
    } else if (g.kind === 'slots') {
      drawWindow(ctx, 112, 40, 160, 56);
      drawTextCentered(ctx, 'Press A to stop each reel', W / 2, 46, UI.text);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#FFFDF5'; ctx.fillRect(124 + i * 48, 60, 40, 24);
        ctx.fillStyle = OUTLINE; ctx.fillRect(124 + i * 48, 60, 40, 1); ctx.fillRect(124 + i * 48, 83, 40, 1);
        const sym = REELS[g.stopped[i] ?? g.reels[i]];
        drawTextCentered(ctx, sym, 144 + i * 48, 68, sym === '7' ? R.tunicRed[2] : sym === 'Bell' ? R.brass[3] : R.navy[2], null);
      }
    } else if (g.kind === 'blitz') {
      drawWindow(ctx, 100, 120, 184, 34);
      drawText(ctx, 'Enter the motion!', 110, 125, UI.text);
      const sym = { L: '<', R: '>', U: '^', D: 'v', A: 'A' };
      g.seq.forEach((k, i) => drawText(ctx, sym[k], 116 + i * 14, 138, i < g.pos ? UI.gold : UI.text));
      ctx.fillStyle = UI.atb; ctx.fillRect(200, 141, Math.max(0, 76 - g.t * 76 / 240), 4);
    }
  }

  drawResults(ctx) {
    const h = this.results.length * 12 + 14;
    drawWindow(ctx, 40, 28, W - 80, h);
    this.results.forEach((l, i) => drawText(ctx, l, 52, 35 + i * 12, UI.text));
  }
}

// ---------------------------------------------------------------- boss AI
const BOSS_AI = {
  warden(b, e) { if (e.hp < e.maxhp * 0.5 && !e.usedSeal) { e.usedSeal = true; return { ...e.d.moves.find((m) => m.fx === 'seal'), all: true }; } return null; },
  bloom(b) { const d = b.livingEnemies().filter((x) => x.kind === 'seedDrone').length; return d === 0 && Math.random() < 0.6 ? b.enemies[0].d.moves.find((m) => m.summon) : null; },
  broodHive(b, e) { const d = b.livingEnemies().filter((x) => x.kind === 'vaultMite').length; return d < 2 && Math.random() < 0.5 ? e.d.moves.find((m) => m.summon) : null; },
  vigil(b, e) { const d = b.livingEnemies().filter((x) => x.kind === 'hushGunner').length; return d === 0 && Math.random() < 0.4 ? e.d.moves.find((m) => m.summon) : null; },
  conduit(b, e) { return Math.random() < 0.25 ? e.d.moves.find((m) => m.healCore) : null; },
  flowerPod(b, e) { return e.d.moves[0]; },
  solaceCore(b, e) { // the core is shielded while any conduit stands
    e.invuln = b.livingEnemies().some((x) => x.kind === 'conduit');
    return null;
  },
  solaceGarden(b, e) { if (b.livingEnemies().filter((x) => x.kind === 'flowerPod').length < 2 && Math.random() < 0.3) { b.addEnemy({ kind: 'flowerPod', at: [140 + Math.random() * 30, 80 + Math.random() * 60] }); b.msgOut('A white flower opens.', 50); } return null; },
  mercy(b, e) { const resting = b.party.filter((p) => p.status.rest).length; if (resting >= b.party.length - 1) return e.d.moves[1]; return null; },
  dirge(b, e) { if (e.invuln && Math.random() < 0.5) return e.d.moves[2]; return null; },
};

function moveToEffect(m) {
  const magic = !!m.el || ['beam', 'void', 'column', 'rings', 'chord', 'wave', 'fire', 'ice', 'bolt', 'pollen', 'petals', 'gust'].includes(m.fx);
  if (m.power <= 0) return { name: m.name, kind: 'status', status: m.status, chance: m.chance ?? 0.5, target: m.all ? 'allEnemies' : 'enemy', fx: m.fx };
  return { name: m.name, kind: magic ? 'magic' : 'phys', power: m.power, el: m.el, status: m.status, chance: m.chance, drain: m.drain, target: m.all ? 'allEnemies' : 'enemy', fx: m.fx === 'reseed' ? 'pollen' : m.fx === 'seal' ? 'column' : m.fx };
}

function auraColour(el, kind) {
  if (kind === 'heal' || kind === 'revive') return [R.folRest[0], R.folRest[1], R.folRest[2], R.folRest[3]];
  const e = EL[el] || R.spirit;
  return [e[0], e[1], e[2], e[3] || e[2]];
}
function sfxFor(kind) {
  const m = { fire: 'fire', flame: 'fire', ice: 'glass', bolt: 'bolt', wave: 'drain', gust: 'flee', tornado: 'flee', quake: 'quake', column: 'chime', void: 'pulse', bio: 'drain', petals: 'spirit', heal: 'heal', feather: 'chime', hex: 'defend', clock: 'defend', rings: 'chime', chord: 'chime', chi: 'spirit', fists: 'hit', cut: 'slash', screencut: 'crit', bolts: 'turret', drill: 'turret', flashbang: 'laser', star: 'slash', paint: 'item', beasts: 'heavy', rally: 'levelup', pollen: 'flower', drain: 'drain', smoke: 'flee', slam: 'heavy', needle: 'miss', beam: 'laser', claw: 'hit', slash: 'slash' };
  audio.sfx(m[kind] || 'hit');
}

const tintCache = new Map();
function tintOf(img, kind) {
  const key = kind;
  let m = tintCache.get(img);
  if (!m) { m = {}; tintCache.set(img, m); }
  if (!m[key]) {
    m[key] = recolor(img, (r, g, b) => kind === 'poison' ? [Math.round(r * 0.8 + 0x30), Math.round(g * 0.85 + 0x40), Math.round(b * 0.6)] : [Math.round(r * 0.55), Math.round(g * 0.7 + 30), Math.round(b * 0.8 + 70)]);
  }
  return m[key];
}

const koCache = new Map();
function koSprite(id) {
  if (!koCache.has(id)) koCache.set(id, darkOf(flipH(rot90(battleSprite(id, 'hurt')))));
  return koCache.get(id);
}

const dis = makeCanvas(160, 160);
function dissolve(img, k) {
  const c = dis.ctx;
  if (dis.canvas.width < img.width || dis.canvas.height < img.height) { dis.canvas.width = Math.max(dis.canvas.width, img.width); dis.canvas.height = Math.max(dis.canvas.height, img.height); }
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

function drawPopNumber(ctx, n) {
  const t = n.t;
  const rise = t < 6 ? t * 1.4 : t < 10 ? 8 - (t - 6) * 0.5 : t < 14 ? 6 + (t - 10) * 0.5 : 8;
  if (t > 44 && t % 2) return;
  if (isNaN(+n.text)) { drawTextCentered(ctx, n.text, n.x, Math.round(n.y - rise), n.color); return; }
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

// 8x8 looping status icons (status never relies on colour alone)
function drawIcon(ctx, icon, x, y, t) {
  const f = (t >> 3) % 4;
  ctx.fillStyle = OUTLINE; ctx.fillRect(x - 1, y - 1, 10, 10);
  switch (icon) {
    case 'poison': ctx.fillStyle = EL.bio[1]; ctx.fillRect(x + 2, y + 6 - f, 4, 3); ctx.fillStyle = EL.bio[0]; ctx.fillRect(x + 3, y + 6 - f, 1, 1); break;
    case 'z': drawText(ctx, 'z', x + 1 + (f % 2), y - (f >> 1), '#FFFDF5', null); break;
    case 'cloud': ctx.fillStyle = R.iron[2]; ctx.fillRect(x, y + 2, 8, 4); ctx.fillRect(x + 2, y + 1, 4, 1); break;
    case 'mute': ctx.fillStyle = '#FFFDF5'; ctx.fillRect(x, y + 1, 8, 5); ctx.fillStyle = R.tunicRed[2]; for (let i = 0; i < 6; i++) { ctx.fillRect(x + 1 + i, y + 1 + Math.round((i * 4) / 6), 1, 1); ctx.fillRect(x + 6 - i, y + 1 + Math.round((i * 4) / 6), 1, 1); } break;
    case 'slow': case 'fast': case 'clock': {
      ctx.fillStyle = icon === 'slow' ? R.violet[1] : icon === 'fast' ? EL.holy[1] : R.farmBlue[0];
      ctx.fillRect(x + 1, y + 1, 6, 6);
      ctx.fillStyle = OUTLINE;
      const a = (icon === 'slow' ? -1 : 1) * f * Math.PI / 2;
      ctx.fillRect(x + 4 + Math.round(Math.cos(a) * 2), y + 4 + Math.round(Math.sin(a) * 2), 1, 1);
      ctx.fillRect(x + 4, y + 4, 1, 1);
      break;
    }
    case 'vein': ctx.fillStyle = R.tunicRed[1]; ctx.fillRect(x + 1, y + 1, 2, 6); ctx.fillRect(x + 5, y + 1, 2, 6); ctx.fillRect(x + 1, y + 3, 6, 2); break;
    case 'stars': for (let i = 0; i < 3; i++) { const a = f * 0.8 + i * 2.1; ctx.fillStyle = EL.holy[1]; ctx.fillRect(x + 3 + Math.round(Math.cos(a) * 3), y + 3 + Math.round(Math.sin(a) * 2), 2, 2); } break;
  }
}
