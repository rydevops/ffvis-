export async function fight(t, maxMs = 60000, shotAt = []) {
  const t0 = Date.now();
  let shots = 0;
  let seenBattle = false;
  while (Date.now() - t0 < maxMs) {
    const st = await t.ev(() => { const g = window.__rfr.game; const b = g.scene; return { scene: b.constructor.name, menu: b.menu ? b.menu.stage : null, res: !!b.results, ov: g.overlays.length, choice: !!(g.overlays.at(-1) || {}).options }; });
    if (st.scene === 'BattleScene') seenBattle = true;
    else if (seenBattle) return st;
    if (st.choice) return st;
    if (st.ov) { await t.skip(); continue; }
    if (shots < shotAt.length && Date.now() - t0 > shotAt[shots][0]) { await t.shot(shotAt[shots][1]); shots++; }
    if (st.menu || st.res) await t.key('KeyZ'); else await t.wait(100);
  }
  return 'timeout';
}
export default async function (t) {
  await t.wait(500);
  await t.ev(() => { const g = window.__rfr.game; g.state = window.__rfr.party.newState(); g.state.flags['ev:dig:intro'] = true; window.__rfr.script.teleport('dig', 12, 9, 'up', { noFade: true }); });
  await t.wait(500);
  await t.ev(() => { window.__rfr.script.runScript(() => window.__rfr.script.story('burrowerAmbush')); });
  console.error(await fight(t, 60000, [[3000, 'b1'], [5000, 'b2'], [7000, 'b3'], [9000, 'b4']]));
  console.error(await t.settle());
  await t.shot('b5');
  console.error(JSON.stringify(await t.state()));
}
