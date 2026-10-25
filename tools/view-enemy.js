import { enemySprite, ENEMIES } from '../js/data/enemies.js';
import { makeCanvas } from '../js/core/gfx.js';
export async function render() {
  const ids = Object.keys(ENEMIES);
  const { canvas, ctx } = makeCanvas(ids.length * 92, 200);
  let x = 2;
  ids.forEach((id) => {
    const a = enemySprite(id, 0), b = enemySprite(id, 1, 2);
    ctx.fillStyle = '#8A3A3C'; ctx.fillRect(x, 0, a.width, 100);
    ctx.fillStyle = '#2E1424'; ctx.fillRect(x, 100, a.width, 100);
    ctx.drawImage(a, x, 2); ctx.drawImage(b, x, 102);
    x += a.width + 4;
  });
  return canvas;
}
