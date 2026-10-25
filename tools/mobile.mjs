import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const SP = process.env.SP;
const browser = await chromium.launch();
for (const [name, w, h] of [['portrait', 393, 852], ['landscape', 852, 393]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  await page.goto('http://localhost:8123/index.html?debug');
  await page.waitForTimeout(1500);
  // tap A button to start
  await page.tap('#btn-a');
  await page.waitForTimeout(600);
  const info = await page.evaluate(() => { const c = document.getElementById('screen'); const r = c.getBoundingClientRect(); return { css: [r.width, r.height, r.top], dpr: devicePixelRatio, scale: r.width * devicePixelRatio / 384 }; });
  console.log(name, JSON.stringify(info));
  await page.screenshot({ path: `${SP}/mob-${name}.png` });
  await ctx.close();
}
await browser.close();
