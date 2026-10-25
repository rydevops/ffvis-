import { battleSprite, BATTLE_POSES } from '../js/data/sprites.js';
import { makeCanvas } from '../js/core/gfx.js';
export async function render() {
  const ids = ['terra', 'terraGlow', 'ilse', 'hale', 'duane'];
  const { canvas, ctx } = makeCanvas(BATTLE_POSES.length * 34 + 2, ids.length * 84 + 2);
  ids.forEach((id, r) => BATTLE_POSES.forEach((p, i) => {
    ctx.fillStyle = '#C06048'; ctx.fillRect(1 + i * 34, 1 + r * 84, 32, 40);
    ctx.fillStyle = '#2E1424'; ctx.fillRect(1 + i * 34, 1 + r * 84 + 42, 32, 40);
    ctx.drawImage(battleSprite(id, p), 1 + i * 34, 1 + r * 84);
    ctx.drawImage(battleSprite(id, p), 1 + i * 34, 1 + r * 84 + 42);
  }));
  return canvas;
}
