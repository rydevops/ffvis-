// Renders the app icons from a 36x36 pixel-art design at integer scales.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
const out = await page.evaluate(() => {
  const S = ['#FFFDF5', '#E8E2D0', '#C4BCA6', '#9A927E', '#6E6858'];
  const G = ['#F0FFFC', '#B8F4E8', '#6CD8C8', '#2EA8A0', '#146A6A'];
  const B = ['#F5D68A', '#D4A84E', '#A87C34', '#7A5426'];
  const P = ['#FFE8F8', '#F8A8E0', '#E060C0'];
  const art = document.createElement('canvas'); art.width = 36; art.height = 36;
  const c = art.getContext('2d');
  // background: bruised ruin sky, banded
  const sky = ['#2E1424', '#5A2434', '#8A3A3C', '#5A2434', '#2E1424'];
  for (let y = 0; y < 36; y++) { c.fillStyle = sky[Math.min(4, Math.floor(y / 7.2))]; c.fillRect(0, y, 36, 1); }
  for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++) if ((x + y) % 2 === 0 && y % 7 === 6) { c.fillStyle = sky[Math.min(4, Math.floor(y / 7.2) + 1)]; c.fillRect(x, y, 1, 1); }
  // brass halo
  for (let a = 180; a <= 360; a += 3) { const r = a * Math.PI / 180; c.fillStyle = B[1]; c.fillRect(Math.round(18 + Math.cos(r) * 15), Math.round(19 + Math.sin(r) * 13), 1, 1); }
  // eye
  for (let y = -7; y <= 7; y++) for (let x = -14; x <= 14; x++) {
    if ((x * x) / 196 + (y * y) / 49 > 1) continue;
    let col = y < -3 ? S[1] : y < 2 ? S[2] : S[3];
    if ((x * x) / 121 + (y * y) / 25 <= 1) {
      const d = Math.hypot(x, y * 1.3);
      col = d < 2 ? '#140C14' : d < 4 ? G[0] : d < 6 ? G[1] : d < 8 ? G[2] : d < 10 ? G[3] : G[4];
      if (x === -2 && y === -2) col = '#FFFFFF';
    }
    c.fillStyle = col; c.fillRect(18 + x, 19 + y, 1, 1);
  }
  // outline
  const img = c.getImageData(0, 0, 36, 36);
  // spirit petals
  c.fillStyle = P[1]; c.fillRect(6, 29, 2, 1); c.fillRect(7, 28, 1, 1); c.fillStyle = P[0]; c.fillRect(7, 29, 1, 1);
  c.fillStyle = P[2]; c.fillRect(28, 30, 2, 1); c.fillStyle = P[1]; c.fillRect(29, 29, 1, 1);
  c.fillStyle = P[1]; c.fillRect(25, 6, 1, 1); c.fillRect(10, 7, 1, 1);
  void img;
  const make = (size, scale, pad) => {
    const k = document.createElement('canvas'); k.width = size; k.height = size;
    const x = k.getContext('2d'); x.imageSmoothingEnabled = false;
    x.fillStyle = '#2E1424'; x.fillRect(0, 0, size, size);
    const s = 36 * scale; const o = Math.floor((size - s) / 2);
    x.drawImage(art, 0, 0, 36, 36, o, o, s, s);
    return k.toDataURL('image/png');
  };
  return {
    apple: make(180, 5), i192: make(192, 5), i512: make(512, 14), mask: make(512, 11),
  };
});
const save = (name, url) => writeFileSync(new URL('../icons/' + name, import.meta.url), Buffer.from(url.split(',')[1], 'base64'));
save('apple-touch-icon.png', out.apple);
save('icon-192.png', out.i192);
save('icon-512.png', out.i512);
save('icon-maskable-512.png', out.mask);
await browser.close();
console.log('icons written');
