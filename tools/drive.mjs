// Headless play-test helpers. Run a scenario: node tools/drive.mjs <scenario-name>
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');
const SP = process.env.SP || '/tmp';

export async function open(q = '?debug') {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 768, height: 432 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) { errors.push(m.text()); console.log('[' + m.type() + ']', m.text()); } });
  page.on('pageerror', (e) => { errors.push(e.message); console.log('[pageerror]', e.message, (e.stack || '').split('\n').slice(0, 4).join(' | ')); });
  await page.goto('http://localhost:8123/index.html' + q);
  await page.waitForFunction(() => window.__rfr && window.__rfr.game.scene);
  const api = {
    page, browser, errors,
    wait: (ms) => page.waitForTimeout(ms),
    async key(k, n = 1) { for (let i = 0; i < n; i++) { await page.keyboard.down(k); await page.waitForTimeout(50); await page.keyboard.up(k); await page.waitForTimeout(90); } },
    async hold(k, ms) { await page.keyboard.down(k); await page.waitForTimeout(ms); await page.keyboard.up(k); },
    shot: (name) => page.locator('#screen').screenshot({ path: `${SP}/${name}.png` }),
    ev: (fn, arg) => page.evaluate(fn, arg),
    // fast-forward any dialogue / captions / notices currently on screen
    async skip(times = 1) {
      for (let i = 0; i < times; i++) {
        await page.evaluate(() => {
          const g = window.__rfr.game;
          for (const o of [...g.overlays]) {
            if (o.frames !== undefined) o.t = o.frames + 1;
            else if (o.pages) { o.page = o.pages.length - 1; o.shown = 1e9; o.timer = 99; }
          }
        });
        await page.waitForTimeout(30);
        await api.key('KeyZ');
        await page.waitForTimeout(60);
      }
    },
    // keep skipping until no overlay and no script running (or a choice is up)
    async settle(maxMs = 20000) {
      const t0 = Date.now();
      while (Date.now() - t0 < maxMs) {
        const st = await page.evaluate(() => { const g = window.__rfr.game; const top = g.overlays[g.overlays.length - 1]; return { n: g.overlays.length, busy: g.busy, choice: !!(top && top.options), scene: g.scene.constructor.name, fade: g.fx.fade }; });
        if (st.choice) return st;
        if (st.scene === 'BattleScene') return st;
        if (!st.n && !st.busy) return st;
        if (st.n) await api.skip(); else await page.waitForTimeout(100);
      }
      return null;
    },
    state: () => page.evaluate(() => { const g = window.__rfr.game; const f = g.scene; return { scene: f.constructor.name, map: f.mapId, x: f.player?.x, y: f.player?.y, flags: g.state?.flags, busy: g.busy, overlays: g.overlays.length }; }),
  };
  return api;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const name = process.argv[2];
  const mod = await import('./scenarios/' + name + '.mjs');
  const api = await open(mod.query || '?debug');
  try { await mod.default(api); } catch (e) { console.log('SCENARIO ERROR', e.message); }
  await api.browser.close();
}
