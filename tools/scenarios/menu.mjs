export default async function (t) {
  await t.wait(400);
  await t.ev(() => { const R = window.__rfr, g = R.game; g.state = R.party.newState(); g.state.flags['ev:dig:intro'] = true; R.script.teleport('dig', 12, 12, 'up', { noFade: true }); });
  await t.wait(800);
  await t.key('KeyC'); await t.wait(300); await t.shot('menu1');
  await t.key('KeyZ'); await t.wait(300); await t.shot('menu2');
  await t.key('KeyX'); await t.key('ArrowDown'); await t.key('KeyZ'); await t.wait(300); await t.shot('menu3');
}
