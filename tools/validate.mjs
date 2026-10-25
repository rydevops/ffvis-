// Static checks for map/story data: row widths and every prop, sprite, enemy, item,
// shop and story-handler reference. Needs the dev server on :8123. Usage: node tools/validate.mjs
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://localhost:8123/index.html');
const out = await page.evaluate(async () => {
  const imp = (p) => import('/js/data/' + p);
  const { MAPS } = await imp('maps.js');
  const { PROPS } = await imp('tiles.js');
  const { hasSprite } = await imp('sprites.js');
  const { ENEMIES } = await imp('enemies.js');
  const { ITEMS, GEAR, ECHOES, SHOPS } = await imp('party.js');
  const { STORY } = await imp('story.js');
  const { LOCATIONS } = await imp('world.js');
  const errs = [];
  const err = (m) => errs.push(m);
  for (const [id, m] of Object.entries(MAPS)) {
    if (m.world) continue;
    const w = m.rows[0].length;
    m.rows.forEach((r, y) => { if (r.length !== w) err(`${id}: row ${y} width ${r.length} != ${w}`); });
    for (const p of m.props || []) if (!PROPS[p.type]) err(`${id}: unknown prop ${p.type}`);
    for (const n of m.npcs || []) {
      if (!hasSprite(n.sprite)) err(`${id}: unknown sprite ${n.sprite} (${n.id})`);
      if (n.talk && !STORY[n.talk]) err(`${id}: missing story ${n.talk} (npc ${n.id})`);
      if (n.shop && !SHOPS[n.shop]) err(`${id}: unknown shop ${n.shop}`);
      if (n.x >= w || n.y >= m.rows.length) err(`${id}: npc ${n.id} off map`);
    }
    for (const e of m.events || []) {
      if (!STORY[e.run]) err(`${id}: missing story ${e.run} (event ${e.id})`);
      if (e.item && !ITEMS[e.item]) err(`${id}: unknown item ${e.item}`);
      if (e.gear && !GEAR[e.gear]) err(`${id}: unknown gear ${e.gear}`);
      if (e.shard && !ECHOES[e.shard]) err(`${id}: unknown shard ${e.shard}`);
      if (e.boss && !ENEMIES[e.boss]) err(`${id}: unknown boss ${e.boss}`);
    }
    for (const g of (m.encounter && m.encounter.groups) || []) for (const k of g) if (!ENEMIES[k]) err(`${id}: unknown enemy ${k}`);
  }
  for (const L of LOCATIONS) {
    if (L.map && !MAPS[L.map]) err(`location ${L.id}: unknown map ${L.map}`);
    if (L.event && !STORY[L.event]) err(`location ${L.id}: missing story ${L.event}`);
    if (L.map && MAPS[L.map] && L.spawn) { const [x, y] = L.spawn; const r = MAPS[L.map].rows; if (!r[y] || r[y][x] === undefined || r[y][x] === '#') err(`location ${L.id}: spawn ${x},${y} blocked`); }
  }
  // dangling references inside story sources
  const { SONGS } = await import('/js/data/music.js');
  const { BG_KINDS } = await import('/js/scenes/bgs.js');
  const { SFX_NAMES } = await import('/js/core/audio.js');
  const { CHARS } = await imp('party.js');
  const bgs = new Set(BG_KINDS()), sfxs = new Set(SFX_NAMES());
  for (const file of ['story.js', 'story_common.js', 'story_act1.js', 'story_act2.js', 'story_act3.js', 'story_side.js']) {
    const res = await fetch('/js/data/' + file);
    if (!res.ok) continue;
    const src = await res.text();
    const each = (re, fn) => { for (const m of src.matchAll(re)) fn(m); };
    each(/battle\(\[([^\]]*)\]/g, (m) => { for (const k of m[1].matchAll(/'([a-zA-Z0-9]+)'/g)) if (!ENEMIES[k[1]]) err(`${file}: battle with unknown enemy ${k[1]}`); });
    each(/teleport\('([a-zA-Z0-9]+)'/g, (m) => { if (!MAPS[m[1]]) err(`${file}: teleport to unknown map ${m[1]}`); });
    each(/sprite: '([a-zA-Z0-9]+)'/g, (m) => { if (!hasSprite(m[1])) err(`${file}: unknown sprite ${m[1]}`); });
    each(/music\('([a-zA-Z0-9]+)'/g, (m) => { if (!SONGS[m[1]]) err(`${file}: unknown song ${m[1]}`); });
    each(/battleMusic: '([a-zA-Z0-9]+)'/g, (m) => { if (!SONGS[m[1]]) err(`${file}: unknown song ${m[1]}`); });
    each(/sfx\('([a-zA-Z0-9]+)'/g, (m) => { if (!sfxs.has(m[1])) err(`${file}: unknown sfx ${m[1]}`); });
    each(/bg: '([a-zA-Z0-9]+)'/g, (m) => { if (!bgs.has(m[1])) err(`${file}: unknown battle bg ${m[1]}`); });
    each(/give\('([a-zA-Z0-9]+)'/g, (m) => { if (!ITEMS[m[1]]) err(`${file}: unknown item ${m[1]}`); });
    each(/(?:joins|recruit|makeChar)\('([a-zA-Z0-9]+)'/g, (m) => { if (!CHARS[m[1]]) err(`${file}: unknown char ${m[1]}`); });
    each(/type: '([a-zA-Z0-9]+)'/g, (m) => { if (!PROPS[m[1]]) err(`${file}: unknown prop ${m[1]}`); });
    each(/STORY\.([a-zA-Z0-9]+)\(/g, (m) => { if (!STORY[m[1]] && m[1] !== 'act2Begin') err(`${file}: call to missing STORY.${m[1]}`); });
    each(/ACT[0-9]\.([a-zA-Z0-9]+)\(/g, (m) => { if (!STORY[m[1]]) err(`${file}: call to missing ${m[0]}`); });
  }
  return { errs, maps: Object.keys(MAPS).length, story: Object.keys(STORY).length };
});
console.log(out.errs.length ? out.errs.join('\n') : 'all ok', `(${out.maps} maps, ${out.story} story handlers)`);
await browser.close();
process.exit(out.errs.length ? 1 : 0);
