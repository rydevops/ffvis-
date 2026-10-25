// Story-script API. Scripts are async functions; each command resolves when done.
import { game, setScene, wait, fadeOut, fadeIn, flash, shake, setFade, letterbox } from './game.js';
import * as audio from './core/audio.js';
import * as input from './core/input.js';
import { say, choose, notice, caption } from './scenes/ui.js';
import { FieldScene } from './scenes/field.js';
import { ITEMS, CHARS, GEAR, makeChar } from './data/party.js';

export { say, choose, notice, caption, wait, fadeOut, fadeIn, flash, shake, setFade, letterbox };

export const field = () => (game.scene instanceof FieldScene ? game.scene : game.fieldScene);
export const flags = () => game.state.flags;
export const sfx = (n) => audio.sfx(n);
export const music = (n, o) => audio.playMusic(n, o);
export const stopMusic = (f) => audio.stopMusic(f);
export const ambience = (k) => audio.setAmbience(k);

// Run a script with field control locked; errors are reported instead of freezing the game.
export async function runScript(fn) {
  game.busy++;
  try { await fn(); } catch (err) {
    console.error(err);
    await say('', 'Something went wrong: ' + err.message);
  } finally {
    game.busy = Math.max(0, game.busy - 1);
    input.clearAll();
  }
}

let STORY = null;
export async function story(name, ctx) {
  if (!STORY) STORY = (await import('./data/story.js')).STORY;
  const fn = STORY[name];
  if (!fn) { await say('', `(missing event: ${name})`); return; }
  await fn(ctx);
}

// ---------------------------------------------------------------- field helpers
export const walk = (id, path, speed) => field().walk(id, path, speed);
export function face(id, dir) { const a = field().actor(id); if (a) a.dir = dir; }
export function actor(id) { return field().actor(id); }
export function show(id, on = true) { const a = field().actor(id); if (a) a.visible = on; }
export function place(id, x, y, dir) {
  const a = field().actor(id);
  if (!a) return;
  a.x = x; a.y = y; a.px = x * 16; a.py = y * 16; a.moving = false; a.queue.length = 0;
  if (dir) a.dir = dir;
}
export async function addActor(o) {
  const { Actor } = await import('./scenes/field.js');
  const a = new Actor(o);
  field().actors.push(a);
  return a;
}
export function removeActor(id) { const f = field(); f.actors = f.actors.filter((a) => a.id !== id); }
export function emote(id, e, dur = 60) {
  const a = field().actor(id);
  if (!a) return Promise.resolve();
  a.emote = e; a.emoteT = 0; a.emoteDur = dur;
  return wait(Math.min(dur, 40));
}
export function setProp(id, state) {
  const f = field();
  const p = f.prop(id);
  if (p) p.state = state;
  game.state.propState[f.mapId + ':' + id] = state;
}
export function camTo(tx, ty) { field().camOverride = [tx * 16 + 8 - 192, ty * 16 + 8 - 108]; return wait(50); }
export function camReset() { field().camOverride = null; return wait(30); }
export function tint(color, level) { field().tint = color ? { color, level } : null; }

export async function teleport(mapId, x, y, dir, opts = {}) {
  if (!opts.noFade) await fadeOut(opts.frames || 20);
  const f = new FieldScene(mapId, x, y, dir);
  f.keepMusic = !!opts.keepMusic;
  game.fieldScene = f;
  setScene(f);
  if (!opts.noFadeIn && !opts.noFade) await fadeIn(opts.frames || 20);
}

// ---------------------------------------------------------------- state helpers
export function setFlag(k, v = true) { game.state.flags[k] = v; }
export function getFlag(k) { return game.state.flags[k]; }
export async function give(item, n = 1, quiet = false) {
  game.state.items[item] = (game.state.items[item] || 0) + n;
  if (!quiet) { audio.sfx('item'); await notice(`Received ${ITEMS[item].name}${n > 1 ? ' x' + n : ''}.`, { frames: 90 }); }
}
export async function giveParts(n, quiet = false) {
  game.state.parts += n;
  if (!quiet) { audio.sfx('build'); await notice(`Salvaged ${n} machine part${n > 1 ? 's' : ''}.`, { frames: 90 }); }
}
export function setParty(ids) {
  game.state.party = ids;
  game.state.roster ||= [];
  for (const id of ids) {
    if (!game.state.chars[id]) game.state.chars[id] = makeChar(id);
    if (!game.state.roster.includes(id)) game.state.roster.push(id);
  }
}
// Recruit a character (at a level that keeps up with the party).
export function recruit(id, lv) {
  const st = game.state;
  if (!st.chars[id]) {
    const avg = Math.round(Object.values(st.chars).reduce((s, c) => s + c.lv, 0) / Math.max(1, Object.keys(st.chars).length));
    st.chars[id] = makeChar(id, Math.max(lv || 0, avg, CHARS[id].lv));
  }
  st.roster ||= [];
  if (!st.roster.includes(id)) st.roster.push(id);
}
export function dropFromRoster(id) {
  const st = game.state;
  st.roster = (st.roster || []).filter((r) => r !== id);
  st.party = st.party.filter((r) => r !== id);
}
export function healAll() {
  for (const id of game.state.party) { const c = game.state.chars[id]; c.hp = c.maxhp; c.ko = false; }
}
export function setLeader(sprite) {
  game.state.leaderSprite = sprite;
  const f = field();
  if (f) { f.player.sprite = sprite; }
}

// ---------------------------------------------------------------- battle
// group: array of enemy kinds. Resolves 'win' | 'lose' | 'flee'.
export async function battle(group, opts = {}) {
  const { BattleScene } = await import('./scenes/battle.js');
  const f = field();
  audio.sfx(opts.boss ? 'boss' : 'encounter');
  const prevMusic = audio.currentSong();
  await swirl(opts.boss);
  const result = await new Promise((resolve) => {
    setScene(new BattleScene(group, { ...opts, onEnd: resolve }));
  });
  if (result === 'lose' && !opts.canLose) {
    const { GameOverScene } = await import('./scenes/title.js');
    setScene(new GameOverScene());
    await new Promise(() => {}); // the game-over scene takes over
  }
  setFade(4);
  f.keepMusic = false;
  setScene(f);
  if (opts.music !== undefined) audio.playMusic(opts.music);
  else if (prevMusic && prevMusic !== 'battle' && prevMusic !== 'boss') audio.playMusic(prevMusic, { restart: false });
  await fadeIn(16);
  return result;
}

// Battle entry: the screen breaks into a 16x16 mosaic that spins out (30 frames).
async function swirl(boss) {
  const { W, H, makeCanvas } = await import('./core/gfx.js');
  const snap = makeCanvas(W, H);
  snap.ctx.drawImage(game.ctx.canvas, 0, 0);
  const tiles = [];
  for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) tiles.push({ x, y, d: Math.hypot(x - W / 2, y - H / 2) });
  const ov = {
    t: 0,
    update() { this.t++; },
    draw(ctx) {
      const t = this.t;
      ctx.fillStyle = '#140C14';
      ctx.fillRect(0, 0, W, H);
      for (const tl of tiles) {
        const k = Math.max(0, t - tl.d / 12);
        const ang = Math.atan2(tl.y - H / 2, tl.x - W / 2) + k * 0.06;
        const r = tl.d * (1 + k * 0.08);
        const x = Math.round(W / 2 + Math.cos(ang) * r), y = Math.round(H / 2 + Math.sin(ang) * r);
        const s = Math.max(0, 16 - Math.floor(k / 2));
        if (s > 0) ctx.drawImage(snap.canvas, tl.x, tl.y, 16, 16, x, y, s, s);
      }
      if (boss) { ctx.fillStyle = '#FFFDF5'; for (let i = 0; i < Math.min(8, t / 3); i++) ctx.fillRect(0, Math.floor((i * 53 + t * 3) % H), W, 1); }
    },
  };
  const { pushOverlay, removeOverlay } = await import('./game.js');
  pushOverlay(ov);
  await wait(30);
  removeOverlay(ov);
}
