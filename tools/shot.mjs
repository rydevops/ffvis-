// usage: node tools/shot.mjs <url-path> <out.png> [w h] [waitMs]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , path, out, w = '1200', h = '900', waitMs = '300'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
await page.goto('http://localhost:8123/' + path);
await page.waitForTimeout(+waitMs);
await page.screenshot({ path: out, fullPage: true });
if (errs.length) console.log(errs.join('\n'));
await browser.close();
