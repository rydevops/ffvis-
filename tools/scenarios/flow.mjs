// Story-flow driver: runs story handlers in order (STEPS env, '|'-separated list of name or name:json-ctx),
// auto-answering dialogue, choices (CHOICES env) and party pickers, and fighting battles.
// GOD=1 makes the party overwhelming so long flows finish quickly. Shots on each step and on errors.
export async function drive(t, done, { choices = [], maxMs = +(process.env.STEPMS || 120000), tag = '' } = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    const st = await t.ev(() => {
      const g = window.__rfr.game; const b = g.scene; const top = g.overlays.at(-1);
      return { scene: b.constructor.name, menu: b.menu ? b.menu.stage : null, res: !!b.results, ov: g.overlays.length, top: top && top.constructor.name, choice: !!(top && top.options), busy: g.busy, map: b.mapId };
    });
    if (await done(st)) return st;
    if (st.top === 'PartyPicker') {
      await t.ev(() => { const g = window.__rfr.game; const o = g.overlays.at(-1); const pool = o.pool || []; const ch = [...o.chosen]; for (const id of pool) if (ch.length < (o.max || 4) && !ch.includes(id)) ch.push(id); g.overlays.splice(g.overlays.indexOf(o), 1); o.resolve(ch); });
      continue;
    }
    if (await t.ev(() => { const o = window.__rfr.game.overlays.at(-1); if (o && o.seq && o.stage === 'input') { o.got = [...o.seq]; o.ok = true; o.stage = 'done'; o.t = 0; return true; } return false; })) continue;
    if (st.choice) {
      const c = choices.length ? choices.shift() : 0;
      console.error(tag, 'choice ->', c);
      await t.ev((c) => { const o = window.__rfr.game.overlays.at(-1); o.i = c; }, c);
      await t.key('KeyZ');
      continue;
    }
    if (st.top === 'TextBox' || st.top === 'Caption' || st.top === 'Notice') { await t.skip(); continue; }
    if (st.scene === 'BattleScene') {
      if (st.menu) await t.ev(() => {
        const g = window.__rfr.game, b = g.scene, m = b.menu, p = m.actor;
        const low = b.party.find((q) => q.alive && q.c.hp < q.c.maxhp * 0.4);
        const idx = (c) => m.cmds.indexOf(c);
        if (m.stage === 'cmd') m.i = low && g.state.items.tonic > 0 ? idx('item') : 0;
        else if (m.stage === 'list') m.li = m.listKind === 'item' ? Math.max(0, m.list.findIndex((x) => x.id === 'tonic')) : 0;
        else if (m.stage === 'target' && m.side === 'party' && low) m.ti = b.party.indexOf(low);
        void p;
      });
      if (st.menu || st.res) await t.key('KeyZ'); else await t.wait(60);
      continue;
    }
    if (st.scene === 'GameOverScene') throw new Error('GAME OVER ' + tag);
    await t.wait(80);
  }
  await t.shot('timeout_' + tag);
  throw new Error('timeout ' + tag);
}

export default async function (t) {
  await t.wait(400);
  if (process.env.SETUP) await t.ev(process.env.SETUP);
  await t.wait(600);
  const choices = (process.env.CHOICES || '').split(',').filter(Boolean).map(Number);
  const god = () => t.ev(() => { const s = window.__rfr.game.state; for (const c of Object.values(s.chars)) { c.atk = 250; c.mag = 250; c.maxhp = c.hp = 9999; c.spd = 80; } });
  const steps = (process.env.STEPS || '').split('|').filter(Boolean);
  for (const [i, step] of steps.entries()) {
    const [name, json] = step.split(/:(.*)/s);
    if (process.env.GOD) await god();
    console.error(`--- step ${i}: ${name}`);
    if (name === 'js') { await t.ev(json); await t.wait(500); continue; }
    await t.ev(({ name, json }) => { window.__stepDone = false; const s = window.__rfr.script; s.runScript(() => s.story(name, json ? JSON.parse(json) : {})).then(() => { window.__stepDone = true; }); }, { name, json });
    await drive(t, async (st) => (await t.ev(() => window.__stepDone)) && !st.ov && st.scene !== 'BattleScene', { choices, tag: name });
    // auto events (map entry scenes) start once the step's script releases control: let them play out
    let calm = 0;
    await drive(t, async (st) => { calm = !st.busy && !st.ov && st.scene !== 'BattleScene' ? calm + 1 : 0; return calm >= 8; }, { choices, tag: name + '+auto' });
    await t.shot(`${process.env.PFX || 'f'}${i}_${name}`);
    console.error(JSON.stringify(await t.ev(() => { const g = window.__rfr.game; const s = g.state; return { map: g.scene.mapId, scene: g.scene.constructor.name, party: s.party, roster: s.roster, lv: s.party.map((p) => s.chars[p].lv), chapter: s.chapterName }; })));
  }
  console.error('errors:', t.errors.length);
}
