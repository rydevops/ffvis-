// Field exploration: top-down 3/4 tile maps with y-sorted props and characters.
import { game, setScene, pushOverlay, wait, fadeIn, fadeOut } from '../game.js';
import * as input from '../core/input.js';
import * as audio from '../core/audio.js';
import { W, H, makeCanvas, ditherRect, ditherPattern, rot90, flipH, greyOf } from '../core/gfx.js';
import { drawText } from '../core/font.js';
import { MAPS } from '../data/maps.js';
import { tileCanvas, propCanvas, PROPS, TILE_KIND, SOLID, hash } from '../data/tiles.js';
import { fieldSheet, walkFrame } from '../data/sprites.js';
import { WORLD_KIND, WALK_BLOCK, SAIL_OK, regionState, worldTile, WORLD_ENC, WORLD_BG, actOf, LOCATIONS } from '../data/world.js';
import { relic } from '../data/party.js';
import { R, OUTLINE, UI } from '../data/palette.js';

const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const LETTER = { u: 'up', d: 'down', l: 'left', r: 'right' };

export class Actor {
  constructor(o) {
    Object.assign(this, { dir: 'down', visible: true, solid: true, speed: 1, lying: false, emote: null, emoteT: 0, offY: 0 }, o);
    this.px = this.x * 16;
    this.py = this.y * 16;
    this.moving = false;
    this.walkT = 0;
    this.queue = [];
  }
}

export class FieldScene {
  constructor(mapId, x, y, dir) {
    this.mapId = mapId;
    this.spawn = { x, y, dir };
    this.loaded = false;
  }

  // ---------------------------------------------------------------- loading
  enter() {
    if (!this.loaded) this.load();
    const m = this.map;
    if (m.music && !this.keepMusic) audio.playMusic(m.music);
    audio.setAmbience(m.ambience || 'none');
    game.state.map = this.mapId;
    game.state.mapName = m.name;
  }

  load() {
    const m = this.map = MAPS[this.mapId];
    this.loaded = true;
    this.h = m.rows.length;
    this.w = m.rows[0].length;
    const KIND = m.world ? WORLD_KIND : TILE_KIND;
    this.kinds = m.rows.map((row) => [...row].map((ch) => KIND[ch] || (m.world ? 'plains' : 'floor')));
    this.regions = m.regionGrid || null;
    this.events = [...(m.events || [])];
    this.wstate = regionState(m.region, game.state.flags);
    this.vehicle = null;
    // flag-dependent tile overrides (e.g. the bloom)
    if (m.override) for (const o of m.override) if (game.state.flags[o.flag]) this.applyOverride(o);
    this.props = (m.props || []).filter((p) => (!p.flag || game.state.flags[p.flag]) && !(p.unless && game.state.flags[p.unless])).map((p, i) => ({
      id: p.id || 'p' + i, ...p, state: (game.state.propState[this.mapId + ':' + (p.id || 'p' + i)]) ?? p.state ?? null,
    }));
    this.actors = [];
    const lead = game.state.party[0];
    this.player = new Actor({ id: 'player', sprite: game.state.leaderSprite || lead, x: this.spawn.x, y: this.spawn.y, dir: this.spawn.dir || 'down' });
    this.actors.push(this.player);
    for (const n of m.npcs || []) {
      if (n.flag && !game.state.flags[n.flag]) continue;
      if (n.unless && game.state.flags[n.unless]) continue;
      this.actors.push(new Actor({ ...n }));
    }
    this.steps = 0;
    this.nextEnc = 14 + Math.floor(Math.random() * 18);
    this.particles = [];
    this.tint = null;
    this.camOverride = null;
    if (m.world) this.setupWorld();
    this.renderGround();
    this.snapCamera();
    this.autoRun = this.events.filter((e) => e.on === 'auto');
  }

  applyOverride(o) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (o.from.includes(this.map.rows[y][x])) this.kinds[y][x] = o.to;
    }
  }

  setTileOverride(flag) {
    const o = (this.map.override || []).find((v) => v.flag === flag);
    if (o) { this.applyOverride(o); this.renderGround(); }
  }

  kindAt(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 'wall';
    return this.kinds[y][x];
  }

  wallPart(x, y) {
    const k = (xx, yy) => { const t = this.kindAt(xx, yy); return t === 'wall' || t === 'glyph'; };
    if (!k(x, y + 1)) return 'lower';
    if (!k(x, y + 2) && y + 2 < this.h) return 'upper';
    return 'top';
  }

  renderGround() {
    const theme = this.map.theme;
    const { canvas, ctx } = makeCanvas(this.w * 16, this.h * 16);
    this.glyphs = [];
    if (this.map.world) {
      const f = game.state.flags;
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        const k = this.kinds[y][x], reg = this.regions[y][x];
        ctx.drawImage(worldTile(k, regionState(reg, f), reg, x, y, 0), x * 16, y * 16);
        if (k === 'ocean') this.glyphs.push([x, y, 'wocean', reg]);
      }
      this.ground = canvas;
      return;
    }
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const kind = this.kinds[y][x];
      const part = kind === 'wall' || kind === 'glyph' ? this.wallPart(x, y) : null;
      const st = kind === 'crop' && game.state.flags.watered ? 'watered' : null;
      ctx.drawImage(tileCanvas(theme, kind, x, y, part, st, 0, this.wstate), x * 16, y * 16);
      if (kind === 'glyph' && part !== 'top') this.glyphs.push([x, y, part]);
      if (kind === 'water') this.glyphs.push([x, y, 'water']);
    }
    // walls cast a short shadow down-right (key light is upper-left)
    const isWall = (x, y) => { const k = this.kindAt(x, y); return k === 'wall' || k === 'glyph'; };
    const sh = this.map.shadow || '#2A2018';
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (isWall(x, y) || SOLID.has(this.kinds[y][x])) continue;
      if (isWall(x - 1, y)) ditherRect(ctx, x * 16, y * 16, 3, 16, sh, 2);
      if (isWall(x - 1, y) && !isWall(x - 1, y + 1)) ditherRect(ctx, x * 16, y * 16 + 16, 2, 4, sh, 1);
    }
    this.ground = canvas;
  }

  // ---------------------------------------------------------------- world map
  setupWorld() {
    const st = game.state;
    st.vehicles ||= {};
    const f = st.flags;
    for (const L of LOCATIONS) {
      if (L.flag && !f[L.flag]) continue;
      if (L.hideFlag && f[L.hideFlag]) continue;
      const size = L.big ? 3 : 2;
      const icon = L.id === 'tower' && f.cradle ? { icon: 'iconTower', state: 'cradle' } : { icon: L.icon, state: L.iconState };
      const P = PROPS[icon.icon];
      this.props.push({ id: 'loc_' + L.id, type: icon.icon, x: L.x, y: L.y + Math.ceil(P.h / 16) - 1, state: icon.state || null, flat: L.sea, ox: Math.floor((size * 16 - P.w) / 2) });
      this.events.push({ id: 'loc_' + L.id, on: 'step', x: L.x, y: L.y, w: size, h: size, run: 'enterLocation', loc: L.id });
    }
    if (st.vehicles.falcon) this.props.push({ id: 'veh_falcon', type: 'airship', x: st.vehicles.falcon[0], y: st.vehicles.falcon[1], ox: -12, oy: 4, z: 8 });
    if (st.vehicles.skiff) this.props.push({ id: 'veh_skiff', type: 'skiffProp', x: st.vehicles.skiff[0], y: st.vehicles.skiff[1], ox: -4, oy: 0, flat: true });
    if (st.boarded === 'falcon') this.board('falcon', true);
  }

  board(kind, silent = false) {
    const st = game.state;
    this.vehicle = kind;
    this.player.sprite = kind;
    this.player.fly = kind === 'falcon' ? 14 : 0;
    this.player.noShadow = kind === 'skiff';
    st.boarded = kind;
    this.props = this.props.filter((p) => p.id !== 'veh_' + kind);
    st.vehicles[kind] = null;
    if (!silent) { audio.sfx(kind === 'falcon' ? 'flee' : 'door'); audio.playMusic(kind === 'falcon' ? 'falcon' : 'world'); }
  }

  // A on the world map: land the Falcon / step off the skiff. Returns true if handled.
  vehicleAction() {
    const p = this.player;
    const st = game.state;
    if (this.vehicle === 'falcon') {
      const k = this.kinds[p.y][p.x];
      if (WALK_BLOCK.has(k)) { audio.sfx('buzzer'); return true; }
      this.vehicle = null;
      st.boarded = null;
      st.vehicles.falcon = [p.x, p.y];
      p.sprite = st.leaderSprite || st.party[0];
      p.fly = 0;
      this.props.push({ id: 'veh_falcon', type: 'airship', x: p.x, y: p.y, ox: -12, oy: 4, z: 8 });
      audio.sfx('thud');
      audio.playMusic(this.map.music);
      // landing on a location goes straight in
      const ev = this.events.find((e) => e.on === 'step' && p.y >= e.y && p.y < e.y + (e.h || 1) && p.x >= e.x && p.x < e.x + (e.w || 1) && this.eventLive(e));
      // step off the airship tile first so we can board again later
      if (!ev) { const free = [[0, 1], [1, 0], [-1, 0], [0, -1]].find(([dx, dy]) => !this.blocked(p.x + dx, p.y + dy, p)); if (free) { const d = { '0,1': 'down', '1,0': 'right', '-1,0': 'left', '0,-1': 'up' }[free.join(',')]; this.walk('player', d[0]); } }
      else this.runEvent(ev);
      return true;
    }
    if (this.vehicle === 'skiff') {
      const DV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.dir];
      const tx = p.x + DV[0], ty = p.y + DV[1];
      if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h || WALK_BLOCK.has(this.kinds[ty][tx])) { audio.sfx('buzzer'); return true; }
      this.vehicle = null;
      st.boarded = null;
      st.vehicles.skiff = [p.x, p.y];
      p.sprite = st.leaderSprite || st.party[0];
      p.noShadow = false;
      this.props.push({ id: 'veh_skiff', type: 'skiffProp', x: p.x, y: p.y, ox: -4, flat: true });
      p.queue.push({ dir: p.dir, force: true });
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- queries
  actor(id) { return id === 'player' ? this.player : this.actors.find((a) => a.id === id); }
  prop(id) { return this.props.find((p) => p.id === id); }

  propBlocks(x, y) {
    for (const p of this.props) {
      const P = PROPS[p.type];
      if (p.state === 'open') continue;
      if (p.state === 'taken' || p.walk) continue;
      const [dx, , tw, th] = P.foot;
      if (tw === 0) continue;
      const fx = p.x + dx;
      if (x >= fx && x < fx + tw && y <= p.y && y > p.y - th) return true;
    }
    return false;
  }

  blocked(x, y, self) {
    if (this.map.world && self === this.player) {
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return true;
      const k = this.kinds[y][x];
      if (this.vehicle === 'falcon') return false;
      if (this.vehicle === 'skiff') return !SAIL_OK.has(k);
      const sk = game.state.vehicles && game.state.vehicles.skiff;
      if (sk && sk[0] === x && sk[1] === y) return false;
      return WALK_BLOCK.has(k);
    }
    if (SOLID.has(this.kindAt(x, y))) {
      if (!(this.map.passable || []).some((q) => q.x === x && q.y === y && (!q.flag || game.state.flags[q.flag]))) return true;
    }
    if ((this.map.blocks || []).some((q) => q.x === x && q.y === y && (!q.flag || game.state.flags[q.flag]) && !(q.unless && game.state.flags[q.unless]))) return true;
    if (this.propBlocks(x, y)) return true;
    for (const a of this.actors) {
      if (a === self || !a.visible || !a.solid) continue;
      if ((a.x === x && a.y === y) || (a.moving && a.tx === x && a.ty === y)) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- movement
  startMove(a, dir, force = false) {
    a.dir = dir;
    const [dx, dy] = DIRV[dir];
    const nx = a.x + dx, ny = a.y + dy;
    if (!force && this.blocked(nx, ny, a)) return false;
    a.tx = nx; a.ty = ny; a.moving = true;
    return true;
  }

  stepActor(a) {
    if (!a.moving) {
      if (a.queue.length) {
        const cmd = a.queue.shift();
        if (cmd.face) { a.dir = cmd.face; return; }
        if (!this.startMove(a, cmd.dir, cmd.force)) { a.queue.unshift(cmd); a.waitBlocked = (a.waitBlocked || 0) + 1; if (a.waitBlocked > 90) { a.queue.length = 0; a.waitBlocked = 0; } }
        else a.waitBlocked = 0;
      }
      if (!a.moving) return;
    }
    const sp = a.speed;
    const gx = a.tx * 16, gy = a.ty * 16;
    a.px += Math.sign(gx - a.px) * Math.min(sp, Math.abs(gx - a.px));
    a.py += Math.sign(gy - a.py) * Math.min(sp, Math.abs(gy - a.py));
    a.walkT += sp >= 2 ? 1.6 : 1;
    if (a.px === gx && a.py === gy) {
      a.x = a.tx; a.y = a.ty; a.moving = false;
      if (a === this.player) this.onPlayerStep();
    }
  }

  walk(id, path, speed) {
    const a = this.actor(id);
    if (!a) return Promise.resolve();
    if (speed) a.speed = speed;
    for (const ch of path) {
      if (LETTER[ch]) a.queue.push({ dir: LETTER[ch] });
      else if (LETTER[ch.toLowerCase()]) a.queue.push({ dir: LETTER[ch.toLowerCase()], force: true });
    }
    return new Promise((res) => {
      const check = () => (!a.queue.length && !a.moving);
      game.waiters.push({ pred: check, res: () => { a.speed = a === this.player ? 1 : (a.baseSpeed || 1); res(); } });
    });
  }

  onPlayerStep() {
    const p = this.player;
    if (game.busy) return;
    if (this.map.world && this.vehicle === 'falcon') return;
    if (this.map.world) { // walking onto a parked vehicle boards it
      const v = game.state.vehicles || {};
      if (v.falcon && v.falcon[0] === p.x && v.falcon[1] === p.y && !this.vehicle) { this.board('falcon'); return; }
      if (v.skiff && v.skiff[0] === p.x && v.skiff[1] === p.y && !this.vehicle) { this.board('skiff'); return; }
    }
    const ev = this.events.find((e) => e.on === 'step' && p.y >= e.y && p.y < e.y + (e.h || 1) && (e.x === p.x || (e.w && p.x >= e.x && p.x < e.x + e.w)) && this.eventLive(e));
    if (ev) { this.runEvent(ev); return; }
    if (game.state.party.some((id) => { const c = game.state.chars[id]; const r = c && relic(c); return r && r.noEncounters; })) return;
    if (this.map.world) {
      if (this.vehicle) return;
      const reg = this.regions[p.y][p.x];
      const table = WORLD_ENC[reg];
      if (!table || game.state.flags.noWorldEnc) return;
      this.steps++;
      if (this.steps >= this.nextEnc) {
        this.steps = 0;
        this.nextEnc = 18 + Math.floor(Math.random() * 22);
        const groups = table[actOf(game.state.flags)];
        const g = groups[Math.floor(Math.random() * groups.length)];
        import('../script.js').then((s) => s.runScript(() => s.battle(g, { bg: WORLD_BG[reg], bgState: regionState(reg, game.state.flags) })));
      }
      return;
    }
    const enc = this.map.encounter;
    if (enc && !game.state.flags[enc.offFlag || '__never'] && (!enc.flag || game.state.flags[enc.flag])) {
      this.steps++;
      if (this.steps >= this.nextEnc) {
        this.steps = 0;
        this.nextEnc = 16 + Math.floor(Math.random() * 20);
        const groups = enc.groups;
        const g = groups[Math.floor(Math.random() * groups.length)];
        import('../script.js').then((s) => s.runScript(() => s.battle(g, { bg: enc.bg, bgState: this.wstate })));
      }
    }
  }

  eventLive(e) {
    const f = game.state.flags;
    if (e.once && f['ev:' + this.mapId + ':' + e.id]) return false;
    if (e.flag && !f[e.flag]) return false;
    if (e.unless && f[e.unless]) return false;
    return true;
  }

  runEvent(e) {
    if (e.once) game.state.flags['ev:' + this.mapId + ':' + e.id] = true;
    import('../script.js').then((s) => s.runScript(() => s.story(e.run, e)));
  }

  interact() {
    const p = this.player;
    const [dx, dy] = DIRV[p.dir];
    const tx = p.x + dx, ty = p.y + dy;
    const npc = this.actors.find((a) => a !== p && a.visible && (a.x === tx && a.y === ty) && (a.talk));
    if (npc) {
      const face = { up: 'down', down: 'up', left: 'right', right: 'left' }[p.dir];
      if (!npc.noTurn) npc.dir = face;
      import('../script.js').then((s) => s.runScript(() => s.story(npc.talk, npc)));
      return;
    }
    const ev = this.events.find((e) => e.on === 'talk' && ((e.x === tx && e.y === ty) || (e.w && tx >= e.x && tx < e.x + e.w && ty === e.y)) && this.eventLive(e));
    if (ev) this.runEvent(ev);
  }

  // ---------------------------------------------------------------- camera
  snapCamera() {
    const c = this.camGoal();
    this.camX = c[0]; this.camY = c[1];
  }
  camGoal() {
    let cx, cy;
    if (this.camOverride) { cx = this.camOverride[0]; cy = this.camOverride[1]; }
    else { cx = this.player.px + 8 - W / 2; cy = this.player.py + 8 - H / 2; }
    const mw = this.w * 16, mh = this.h * 16;
    cx = mw <= W ? -(W - mw) / 2 : Math.max(0, Math.min(mw - W, cx));
    cy = mh <= H ? -(H - mh) / 2 : Math.max(0, Math.min(mh - H, cy));
    return [Math.round(cx), Math.round(cy)];
  }

  // ---------------------------------------------------------------- update
  update(canControl) {
    if (this.autoRun && this.autoRun.length && game.busy === 0 && canControl) {
      const e = this.autoRun.find((ev) => this.eventLive(ev));
      this.autoRun = this.autoRun.filter((ev) => ev !== e);
      if (e) { this.runEvent(e); return; }
      this.autoRun = null;
    }

    const p = this.player;
    if (canControl) {
      if (!p.moving && !p.queue.length) {
        const dir = input.isHeld('up') ? 'up' : input.isHeld('down') ? 'down' : input.isHeld('left') ? 'left' : input.isHeld('right') ? 'right' : null;
        p.speed = this.vehicle === 'falcon' ? 3 : input.isHeld('b') && !this.vehicle ? 2 : 1;
        if (dir) {
          if (!this.startMove(p, dir)) {
            p.dir = dir;
            const [dx, dy] = DIRV[dir];
            const door = this.events.find((e) => e.on === 'door' && e.x === p.x + dx && e.y === p.y + dy && this.eventLive(e));
            if (door) this.runEvent(door);
          }
        } else if (input.pressed('a')) { if (!(this.map.world && this.vehicleAction())) this.interact(); }
        else if (input.pressed('start')) {
          import('./menu.js').then((m) => pushOverlay(new m.FieldMenu(this)));
        }
      }
    }
    for (const a of this.actors) {
      this.stepActor(a);
      if (a.wander && !a.moving && !a.queue.length && game.busy === 0 && Math.random() < 0.006) {
        const d = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
        const [dx, dy] = DIRV[d];
        const nx = a.x + dx, ny = a.y + dy;
        const home = a.home || (a.home = [a.x, a.y]);
        if (Math.abs(nx - home[0]) <= 2 && Math.abs(ny - home[1]) <= 2) this.startMove(a, d);
      }
      if (a.emote) { a.emoteT++; if (a.emoteDur && a.emoteT > a.emoteDur) a.emote = null; }
    }

    // camera eases toward goal (integer steps)
    const [gx, gy] = this.camGoal();
    const ease = this.camOverride ? 0.06 : 1;
    this.camX += ease === 1 ? gx - this.camX : Math.round((gx - this.camX) * ease) || Math.sign(gx - this.camX);
    this.camY += ease === 1 ? gy - this.camY : Math.round((gy - this.camY) * ease) || Math.sign(gy - this.camY);

    this.updateWeather();
  }

  updateWeather() {
    const kind = this.weatherKind();
    const ps = this.particles;
    if (kind === 'ash' && ps.length < 70 && Math.random() < 0.6) ps.push({ x: Math.random() * (W + 60), y: -4, vx: -0.25 - Math.random() * 0.2, vy: 0.3 + Math.random() * 0.3, s: Math.random() < 0.3 ? 2 : 1, c: R.skyRuin[0] });
    if (kind === 'dust' && ps.length < 120) ps.push({ x: W + 4, y: Math.random() * H, vx: -2 - Math.random() * 2, vy: 0.2, s: 2, c: Math.random() < 0.5 ? R.seaRuin[0] : R.folRuin[0] });
    if (kind === 'pollen' && ps.length < 30 && Math.random() < 0.1) ps.push({ x: Math.random() * W, y: H + 2, vx: 0, vy: -0.2 - Math.random() * 0.15, s: 1, c: R.folSilent[0] });
    if (kind === 'motes' && ps.length < 24 && Math.random() < 0.08) ps.push({ x: Math.random() * W, y: H + 2, vx: 0, vy: -0.25, s: 1, c: R.glass[1] });
    for (const q of ps) { q.x += q.vx; q.y += q.vy; }
    this.particles = ps.filter((q) => q.x > -8 && q.y > -8 && q.y < H + 8 && q.x < W + 70);
  }
  weatherKind() {
    const w = this.map.weather;
    if (typeof w === 'function') return w(game.state.flags);
    return w;
  }

  // ---------------------------------------------------------------- draw
  draw(ctx) {
    const cx = this.camX, cy = this.camY;
    const f = game.frame;
    if (this.map.backdrop) ctx.fillStyle = this.map.backdrop, ctx.fillRect(0, 0, W, H);
    ctx.drawImage(this.ground, -cx, -cy);
    // animated glyph walls (6-step heartbeat, 10 frames per step) and water
    const gf = Math.floor(f / 10) % 6;
    const theme = this.map.theme;
    for (const [x, y, part] of this.glyphs) {
      const sx = x * 16 - cx, sy = y * 16 - cy;
      if (sx < -16 || sy < -16 || sx > W || sy > H) continue;
      if (part === 'wocean') ctx.drawImage(worldTile('ocean', regionState('sea', game.state.flags), 'sea', x, y, Math.floor((f + hash(x, y) * 96) / 16) % 4), sx, sy);
      else if (part === 'water') ctx.drawImage(tileCanvas(theme, 'water', x, y, null, null, Math.floor((f + hash(x, y) * 96) / 16) % 4, this.wstate), sx, sy);
      else ctx.drawImage(tileCanvas(theme, 'glyph', x, y, part, null, (gf + Math.floor(hash(x, y) * 6)) % 6, this.wstate), sx, sy);
    }

    // y-sorted props and actors
    const list = [];
    for (const p of this.props) {
      const P = PROPS[p.type];
      const fr = P.anim ? Math.floor((f + hash(p.x, p.y) * 48) / 6) % 4 : (p.frame || 0);
      const img = propCanvas(p.type, p.state, fr);
      const x = p.x * 16 - (P.tx || 0) * 16 - cx + (p.ox || 0);
      const y = (p.y + 1) * 16 - P.h - cy + (p.oy || 0);
      list.push({ k: p.flat ? -1e6 + p.y : (p.y + 1) * 16 - 1 + (p.z || 0), draw: () => ctx.drawImage(img, x, y) });
    }
    for (const a of this.actors) {
      if (!a.visible) continue;
      list.push({ k: a.py + 16 + (a.z || 0), draw: () => this.drawActor(ctx, a, cx, cy) });
    }
    list.sort((a, b) => a.k - b.k);
    for (const it of list) it.draw();

    if (this.map.dark || this.darkOverride) this.drawDarkness(ctx, cx, cy);
    if (this.tint) ditherRect(ctx, 0, 0, W, H, this.tint.color, this.tint.level);
    for (const q of this.particles) { ctx.fillStyle = q.c; ctx.fillRect(Math.round(q.x), Math.round(q.y), q.s, q.s === 2 && this.weatherKind() !== 'dust' ? 1 : 1); }
    if (this.weatherKind() === 'dust') ditherRect(ctx, 0, 0, W, H, R.folRuin[1], 1);
    for (const a of this.actors) if (a.visible && a.emote) this.drawEmote(ctx, a, cx, cy);
  }

  drawActor(ctx, a, cx, cy) {
    const sheet = fieldSheet(a.sprite);
    let img = walkFrame(sheet, a.dir, a.walkT, a.moving || a.alwaysAnim);
    if (a.alwaysAnim && !a.moving) img = sheet[a.dir][Math.floor(game.frame / 12) % 2 ? 1 : 0];
    const w = img.width, h = img.height;
    const x = Math.round(a.px - cx) - Math.floor((w - 16) / 2), y = Math.round(a.py - cy) - 8 + (24 - h) + (a.offY || 0);
    // cast shadow (12x4 for 16px sprites, scaled with the sprite), dithered in the ground's shadow tone
    if (a.fly) { ctx.fillStyle = ditherPattern(ctx, OUTLINE, 2); ctx.fillRect(x + 8, y + h - 2, w - 16, 3); }
    else if (!a.lying && !a.noShadow) {
      const sw = Math.max(10, Math.round(w * 0.7));
      ctx.fillStyle = ditherPattern(ctx, this.map.shadow || '#2A2018', 2);
      ctx.fillRect(x + Math.floor((w - sw) / 2) + 1, y + h - 3, sw - 2, 3);
      ctx.fillRect(x + Math.floor((w - sw) / 2), y + h - 2, sw, 1);
    }
    if (a.lying) {
      img = a.lyingCanvas || (a.lyingCanvas = rot90(sheet.left[0]));
      if (a.stilled) img = greyOf(img);
      ctx.drawImage(img, Math.round(a.px - cx) - 4, Math.round(a.py - cy) + 4);
      return;
    }
    if (a.stilled) img = greyOf(img);
    ctx.drawImage(img, x, y - (a.fly || 0));
  }

  drawEmote(ctx, a, cx, cy) {
    const x = Math.round(a.px - cx) + 3, y = Math.round(a.py - cy) - 22 - (a.emoteT < 4 ? 4 - a.emoteT : 0);
    ctx.fillStyle = OUTLINE; ctx.fillRect(x - 1, y - 1, 12, 12);
    ctx.fillStyle = '#FFFDF5'; ctx.fillRect(x, y, 10, 10);
    ctx.fillRect(x + 3, y + 10, 3, 1); ctx.fillRect(x + 4, y + 11, 1, 1);
    const col = a.emote === '!' ? R.tunicRed[2] : a.emote === '♥' ? R.spirit[2] : OUTLINE;
    drawText(ctx, a.emote, x + 5 - Math.floor((a.emote.length * 4) / 2) + (a.emote === '!' ? 1 : 0), y + 2, col, null);
  }

  drawDarkness(ctx, cx, cy) {
    if (!this.dark) this.dark = makeCanvas(W, H);
    const d = this.dark.ctx;
    d.globalCompositeOperation = 'source-over';
    d.clearRect(0, 0, W, H);
    const lvl = this.darkOverride ?? this.map.dark;
    if (!lvl) return;
    d.fillStyle = ditherPattern(d, R.night[4], lvl);
    d.fillRect(0, 0, W, H);
    const lights = [];
    for (const p of this.props) {
      const P = PROPS[p.type];
      if (P.light || p.light) lights.push([p.x * 16 + 8 - cx, (p.y + 1) * 16 - P.h + 8 - cy, p.light || P.light]);
      if (p.type === 'pillar' && p.state === 'lit') lights.push([p.x * 16 + 8 - cx, (p.y + 1) * 16 - 30 - cy, 44]);
    }
    if (this.map.playerLight) lights.push([this.player.px + 8 - cx, this.player.py + 4 - cy, this.map.playerLight]);
    const flick = (game.frame >> 3) % 2;
    for (const [lx, ly, r0] of lights) {
      const r = r0 + flick;
      // three dithered rings: clear centre, 25%, 50%
      d.globalCompositeOperation = 'destination-out';
      d.beginPath(); d.arc(lx, ly, r, 0, Math.PI * 2); d.fill();
      d.globalCompositeOperation = 'source-over';
      d.fillStyle = ditherPattern(d, R.night[4], Math.min(lvl, 2));
      d.beginPath(); d.arc(lx, ly, r, 0, Math.PI * 2); d.fill();
      d.globalCompositeOperation = 'destination-out';
      d.beginPath(); d.arc(lx, ly, r * 0.72, 0, Math.PI * 2); d.fill();
      d.globalCompositeOperation = 'source-over';
      d.fillStyle = ditherPattern(d, R.night[4], 1);
      d.beginPath(); d.arc(lx, ly, r * 0.72, 0, Math.PI * 2); d.fill();
      d.globalCompositeOperation = 'destination-out';
      d.beginPath(); d.arc(lx, ly, r * 0.45, 0, Math.PI * 2); d.fill();
    }
    d.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.dark.canvas, 0, 0);
  }
}
