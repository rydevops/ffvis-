import { enemySprite, ENEMIES } from '../js/data/enemies.js';
import { makeCanvas } from '../js/core/gfx.js';
export async function render() {
  const ids = Object.keys(ENEMIES);
  const { canvas, ctx } = makeCanvas(1400, 900);
  let x = 2, y = 2, rowH = 0;
  ids.forEach((id, i) => {
    const a = enemySprite(id, i % 2, 0, id === 'mercy' ? { face: 'elayne' } : null);
    if (x + a.width > 1398) { x = 2; y += rowH + 4; rowH = 0; }
    ctx.fillStyle = i % 2 ? '#8A3A3C' : '#2E1424'; ctx.fillRect(x, y, a.width, a.height);
    ctx.drawImage(a, x, y);
    x += a.width + 4; rowH = Math.max(rowH, a.height);
  });
  return canvas;
}
