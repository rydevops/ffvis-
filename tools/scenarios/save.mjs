// Save/continue position regression: node tools/drive.mjs save
// Checks that saves record where the player stands, that Continue restores it, that an old
// save with a stale/invalid position is rescued onto a walkable tile, and that flying over
// open sea is left alone.
export default async function (t) {
  const page = t.page;
  const fails = [];
  const check = (name, ok, got) => { console.log(ok ? 'ok  ' : 'FAIL', name, ok ? '' : JSON.stringify(got)); if (!ok) fails.push(name); };
  const reboot = async () => { await page.goto('http://localhost:8123/index.html?debug'); await page.waitForFunction(() => window.__rfr && window.__rfr.game.scene); await page.waitForTimeout(500); };
  const cont = async () => { for (let i = 0; i < 3; i++) { await page.keyboard.press('KeyZ'); await page.waitForTimeout(400); } await page.waitForTimeout(2200); };
  const where = () => page.evaluate(() => { const f = window.__rfr.game.scene; return { scene: f.constructor.name, map: f.mapId, at: f.player && [f.player.x, f.player.y], vehicle: f.vehicle || null, size: [f.w, f.h] }; });
  const put = (extra) => page.evaluate((extra) => {
    const r = window.__rfr; const s = r.party.newState();
    s.party = ['terra']; s.chars = { terra: r.party.makeChar('terra') }; s.leaderSprite = 'terra';
    localStorage.setItem('rfr-save-v1', JSON.stringify({ ...s, ...extra }));
  }, extra);

  // 1. an old save: Terra's house is 16x11 but the saved position is the new-game default (13,16)
  await put({ map: 'house', x: 13, y: 16, dir: 'up' });
  await reboot(); await cont();
  let w = await where();
  check('old save on a small map lands inside the map', w.scene === 'FieldScene' && w.map === 'house' && w.at[0] < w.size[0] && w.at[1] < w.size[1], w);

  // 2. walking updates the recorded position; a fresh save restores it exactly
  await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(700); await page.keyboard.up('ArrowLeft'); await page.waitForTimeout(200);
  const st = await page.evaluate(() => { const g = window.__rfr.game; const f = g.scene; return { player: [f.player.x, f.player.y], rec: [g.state.x, g.state.y] }; });
  check('state tracks the player as they walk', st.player[0] === st.rec[0] && st.player[1] === st.rec[1], st);
  await page.evaluate(async () => { const m = await import('/js/core/save.js'); m.saveGame(window.__rfr.game.state); });
  await reboot(); await cont();
  w = await where();
  check('continue restores the saved spot', w.at[0] === st.player[0] && w.at[1] === st.player[1], { w, st });

  // 3. world map: flying over deep sea is kept; on foot in the ocean is moved to land
  await put({ map: 'world', x: 30, y: 22, dir: 'down', boarded: 'falcon', vehicles: { falcon: null }, flags: { act2: true } });
  await reboot(); await cont();
  w = await where();
  check('flying over open sea is left alone', w.vehicle === 'falcon' && w.at[0] === 30 && w.at[1] === 22, w);
  await put({ map: 'world', x: 30, y: 22, dir: 'down', flags: { act2: true } });
  await reboot(); await cont();
  w = await where();
  check('on foot in the ocean is moved to land', w.vehicle === null && !(w.at[0] === 30 && w.at[1] === 22), w);

  // 4. a new game still starts in the dig
  await page.evaluate(() => localStorage.removeItem('rfr-save-v1'));
  await reboot();
  await page.keyboard.press('KeyZ'); await page.waitForTimeout(500); await page.keyboard.press('KeyZ'); await page.waitForTimeout(3500);
  w = await where();
  check('new game starts in the dig', w.map === 'dig', w);

  console.log(fails.length ? 'FAILED: ' + fails.join(', ') : 'all save checks passed');
  if (fails.length) process.exitCode = 1;
}
