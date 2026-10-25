// Auto-plays: skips dialogue, answers choices from CHOICES env (comma list), fights battles.
// SETUP env: JS to run first; STEPS: story events to run in order. Shots every SHOTMS.
export default async function (t) {
  const choices = (process.env.CHOICES || '').split(',').filter(Boolean).map(Number);
  await t.wait(400);
  if (process.env.SETUP) await t.ev(process.env.SETUP);
  await t.wait(1200);
  let shot = 0;
  const shotMs = +(process.env.SHOTMS || 1500);
  let last = Date.now();
  const t0 = Date.now();
  const max = +(process.env.MAXMS || 60000);
  const prefix = process.env.PFX || 'r';
  while (Date.now() - t0 < max) {
    if (Date.now() - last > shotMs) { await t.shot(prefix + (shot++)); last = Date.now(); }
    const st = await t.ev(() => { const g = window.__rfr.game; const b = g.scene; const top = g.overlays.at(-1); return { scene: b.constructor.name, menu: b.menu ? b.menu.stage : null, res: !!b.results, ov: g.overlays.length, top: top && top.constructor.name, choice: !!(top && top.options), busy: g.busy, map: b.mapId, flags: g.state && Object.keys(g.state.flags).length }; });
    if (st.choice) {
      const c = choices.length ? choices.shift() : 0;
      console.error('choice ->', c);
      await t.ev((c) => { const o = window.__rfr.game.overlays.at(-1); o.i = c; }, c);
      await t.key('KeyZ');
      continue;
    }
    if (st.top === 'TextBox' || st.top === 'Caption' || st.top === 'Notice') { await t.skip(); continue; }
    if (st.scene === 'BattleScene') {
      if (st.menu) await t.ev(() => { // a sensible player: heal when low, use machine-breaking abilities
        const g = window.__rfr.game, b = g.scene, m = b.menu, p = m.actor;
        const low = b.party.find((q) => q.alive && q.c.hp < q.c.maxhp * 0.4);
        const machines = b.livingEnemies().some((e) => e.d.family === 'machine');
        const idx = (c) => m.cmds.indexOf(c);
        if (m.stage === 'cmd') {
          if (low && g.state.items.tonic > 0) m.i = idx('item');
          else if (idx('spirit') >= 0 && p.c.sp >= 6) m.i = idx('spirit');
          else if (idx('salvage') >= 0 && machines && g.state.parts >= 1) m.i = idx('salvage');
          else m.i = 0;
        } else if (m.stage === 'list') {
          if (m.listKind === 'item') m.li = Math.max(0, m.list.findIndex((x) => x.id === 'tonic'));
          else m.li = 0;
        } else if (m.stage === 'target' && m.side === 'party' && low) m.ti = b.party.indexOf(low);
      });
      if (st.menu || st.res) await t.key('KeyZ'); else await t.wait(80);
      continue;
    }
    if (st.scene === 'EndCardScene') { console.error('END CARD'); await t.wait(500); await t.shot(prefix + 'end'); break; }
    if (!st.busy && !st.ov) { console.error('idle', JSON.stringify(st)); break; }
    await t.wait(100);
  }
  await t.shot(prefix + 'final');
  console.error(JSON.stringify(await t.state()));
}
