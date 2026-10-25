// Shared story handlers: travel, NPC talk, services, treasure, Echo points, Seraphs, and the
// restoration wave that relights a region.
import {
  say, choose, notice, wait, fadeOut, fadeIn, flash, shake, setFade, teleport, setFlag, getFlag, give, field,
  sfx, music, battle, recruit, setParty, walk, actor,
} from '../script.js';
import { game, pushOverlay, removeOverlay } from '../game.js';
import { W, H, ditherRect } from '../core/gfx.js';
import { R } from './palette.js';
import { ITEMS, GEAR, ECHOES } from './party.js';
import { LOCATIONS } from './world.js';
import { MAPS } from './maps.js';
import { saveGame } from '../core/save.js';

export const st = () => game.state;

export function autosave() { if (saveGame(game.state)) return notice('Progress saved.', { frames: 60 }); return Promise.resolve(); }

// Restoration wave: a warm golden ring with flowers bursting along its edge; colour floods in behind.
export function restorationWave(cx, cy, onPass, warm = true) {
  return new Promise((resolve) => {
    let fired = false;
    const ov = {
      r: 0,
      update() { this.r += 3.2; if (!fired && this.r > 120) { fired = true; onPass(); } if (this.r > 480) { removeOverlay(this); resolve(); } },
      draw(ctx) {
        const r = this.r;
        const col = warm ? [R.brass[0], '#FFF4C0', R.spirit[1]] : [R.glass[1], R.glass[0], R.glass[2]];
        for (let a = 0; a < 720; a++) {
          const t = (a / 720) * Math.PI * 2;
          ctx.fillStyle = col[a % 3 === 0 ? 1 : 0];
          ctx.fillRect(Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r), 2, 1);
          if (warm && a % 24 === 0) { const fx = cx + Math.cos(t) * (r - 4), fy = cy + Math.sin(t) * (r - 4); ctx.fillStyle = col[2]; ctx.fillRect(Math.round(fx) - 1, Math.round(fy), 3, 1); ctx.fillRect(Math.round(fx), Math.round(fy) - 1, 1, 3); ctx.fillStyle = '#FFFDF5'; ctx.fillRect(Math.round(fx), Math.round(fy), 1, 1); }
        }
        if (warm) ditherRect(ctx, 0, 0, W, H, R.brass[0], r < 60 ? 1 : 0);
      },
    };
    pushOverlay(ov);
  });
}

// Relight a Wellspring: flag, wave, palette swap, Echoes grow stronger.
export async function relight(flag, label) {
  sfx('spirit');
  flash('#FFF4C0');
  await wait(20);
  const f = field();
  await restorationWave(W / 2, H / 2, () => { setFlag(flag); if (f) { f.wstate = 'rest'; f.renderGround(); } });
  await notice(label, { frames: 160 });
  await notice('The Echoes grow stronger.', { frames: 120 });
}

export async function getShard(id) {
  st().shards ||= [];
  if (st().shards.includes(id)) return;
  st().shards.push(id);
  sfx('spirit');
  await notice(`Obtained the Echo Shard "${ECHOES[id].name}".`, { frames: 140 });
}

export async function joins(id, lv) {
  recruit(id, lv);
  sfx('levelup');
  const c = st().chars[id];
  if (st().party.length < 4 && !st().party.includes(id)) st().party.push(id);
  await notice(`${c.name} joins the party!`, { frames: 120 });
}

export const COMMON = {
  async enterLocation(e) {
    const L = LOCATIONS.find((l) => l.id === e.loc);
    const p = field().player;
    const size = L.big ? 3 : 2;
    st().worldPos = [L.x + Math.floor(size / 2), L.y + size];
    if (L.event) { const { STORY } = await import('./story.js'); if (STORY[L.event]) { await STORY[L.event](L); } return; }
    if (!L.map || !MAPS[L.map]) { await say('', `${L.name}. There is no way in yet.`); return; }
    void p;
    await teleport(L.map, ...L.spawn);
  },
  async toWorld() {
    const pos = st().worldPos || [10, 46];
    await teleport('world', pos[0], pos[1], 'down');
  },
  // NPC lines: entries are strings, or { if, unless, say: [...] }; the last matching entry wins.
  async lines(n) {
    const f = st().flags;
    let chosen = null;
    for (const e of n.lines) {
      if (typeof e === 'string') { chosen = [e]; continue; }
      if (e.if && !f[e.if]) continue;
      if (e.unless && f[e.unless]) continue;
      chosen = e.say;
    }
    if (!chosen) return;
    for (const l of chosen) await say(n.name, l);
  },
  async shop(n) {
    const { ShopMenu } = await import('../scenes/menu.js');
    await say(n.name, 'Welcome. Take a look.');
    await new Promise((res) => { const m = new ShopMenu(n.shop); m.onClose = res; pushOverlay(m); });
  },
  async inn(n) {
    const price = n.price || 50;
    await say(n.name, `A warm bed for the night: ${price} GP. Stay?`);
    const c = await choose(['Stay', 'Not now'], { cancel: 1 });
    if (c !== 0) return;
    if ((st().gp || 0) < price) { await say(n.name, "Come back when you've got the coin, love."); return; }
    st().gp -= price;
    await fadeOut(30);
    music(null);
    sfx('save');
    for (const id of st().roster || st().party) { const ch = st().chars[id]; if (ch) { ch.hp = ch.maxhp; ch.sp = ch.maxsp; } }
    await wait(60);
    field().enter();
    await fadeIn(30);
    await notice('Fully rested.', { frames: 80 });
  },
  async chest(e) {
    const f = field();
    const key = 'chest:' + f.mapId + ':' + e.id;
    if (st().flags[key]) { await say('', 'Empty.'); return; }
    st().flags[key] = true;
    const prop = f.prop(e.prop || e.id);
    if (prop) { prop.state = 'open'; st().propState[f.mapId + ':' + prop.id] = 'open'; }
    sfx('door');
    if (e.gp) { st().gp = (st().gp || 0) + e.gp; sfx('item'); await notice(`Found ${e.gp} GP.`, { frames: 80 }); }
    if (e.item) await give(e.item, e.n || 1);
    if (e.gear) { st().gear ||= {}; st().gear[e.gear] = (st().gear[e.gear] || 0) + 1; sfx('item'); await notice(`Found ${GEAR[e.gear].name}.`, { frames: 90 }); }
    if (e.shard) await getShard(e.shard);
  },
  async echoPoint(e) {
    const party = st().party;
    if (!party.includes('terra') && !party.includes('dalia')) { await say('', 'Faint pink motes drift up from the ground and fade. Something lingers here, but only Esper blood could hear it.'); return; }
    const key = 'echo:' + e.id;
    if (st().flags[key]) { await say('', 'The memory here has gone quiet.'); return; }
    st().flags[key] = true;
    const f = field();
    const prop = f.prop(e.prop || e.id);
    if (prop) { prop.state = 'spent'; st().propState[f.mapId + ':' + prop.id] = 'spent'; }
    const who = party.includes('dalia') ? 'Dalia' : 'Terra';
    sfx('chime');
    flash(R.spirit[0]);
    await say('', e.memory || 'For a moment the world turns sepia-violet. A great shape moves through a memory older than the Empire, then breaks apart into rising petals.');
    await say(who, e.line || "I can hear it. It doesn't want anything from us. It just wants to be remembered.");
    st().flags.echoes = (st().flags.echoes || 0) + 1;
    if (e.shard) await getShard(e.shard);
    else { for (const id of party) { const c = st().chars[id]; c.hp = c.maxhp; c.sp = c.maxsp; } await notice('The memory restores the party.', { frames: 90 }); }
  },
  async seraph(e) {
    const key = 'seraph:' + e.boss;
    if (st().flags[key]) { await say('', 'The glyph circle is dark and cold.'); return; }
    await say('', 'A circle of glass glyphs pulses in the ground. Something unfinished sleeps beneath it.');
    const c = await choose(['Wake it', 'Leave it'], { cancel: 1 });
    if (c !== 0) return;
    const r = await battle([e.boss], { boss: true, bg: e.bg || 'wasteland', canLose: true, battleMusic: 'boss' });
    if (r === 'win') {
      st().flags[key] = true;
      st().flags.seraphs = (st().flags.seraphs || 0) + 1;
      const f = field();
      const prop = f.prop(e.prop || e.id);
      if (prop) { prop.state = 'done'; st().propState[f.mapId + ':' + prop.id] = 'done'; }
      await notice(`Seraphs laid to rest: ${st().flags.seraphs}/8`, { frames: 140 });
    }
  },
  async sign(e) { await say('', e.text); },
  async savePoint() {
    sfx('save');
    for (const id of st().party) { const c = st().chars[id]; c.hp = c.maxhp; c.sp = c.maxsp; }
    if (saveGame(st())) await notice('A quiet place. The party rests, and the journey is recorded.', { frames: 140 });
  },
};

export async function pickTeam(o) {
  const { PartyPicker } = await import('../scenes/menu.js');
  return pushOverlay(new PartyPicker(o)).promise;
}

export { say, choose, notice, wait, fadeOut, fadeIn, flash, shake, setFade, teleport, setFlag, getFlag, give, field, sfx, music, battle, recruit, setParty, walk, actor, ITEMS };
