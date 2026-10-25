export default async function (t) {
  await t.wait(800);
  await t.key('KeyZ'); await t.wait(300); await t.key('KeyZ');
  await t.wait(800);
  console.log(await t.settle());
  await t.shot('d0');
  await t.hold('ArrowUp', 1200);
  console.log(await t.state());
  await t.shot('d1');
  // talk to hale (12,8): go to (12,9) facing up
  await t.ev(() => { const s = window.__rfr.script; s.place('player', 12, 9, 'up'); });
  await t.key('KeyZ'); await t.wait(200);
  await t.shot('d2');
  console.log(await t.settle());
  console.log(await t.state());
  // walk up to trigger the ambush at row 7
  await t.ev(() => { window.__rfr.script.place('player', 10, 8, 'up'); });
  await t.hold('ArrowUp', 400);
  await t.wait(500);
  console.log(await t.settle());
  await t.wait(1500);
  await t.shot('d3');
  console.log(await t.settle());
  await t.wait(1500);
  await t.shot('d4');
}
