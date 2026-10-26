import { fieldSheet, battleSprite, BATTLE_POSES } from '../js/data/sprites.js';
import { makeCanvas } from '../js/core/gfx.js';
// ?m=terra&ids=terra,terraGlow — every field frame (walk cycle) and every battle pose
export async function render() {
  const ids = (new URLSearchParams(location.search).get('ids') || 'terra').split(',');
  const { canvas, ctx } = makeCanvas(480, 190 * ids.length);
  ids.forEach((id, n) => {
    const oy = n * 190;
    ctx.fillStyle = '#6E9A9A'; ctx.fillRect(0, oy, 480, 188);
    const s = fieldSheet(id);
    ['down', 'up', 'left', 'right'].forEach((d, di) => s[d].forEach((f, fi) => ctx.drawImage(f, 4 + (di * 3 + fi) * 20, oy + 4)));
    BATTLE_POSES.forEach((p, i) => { try { const b = battleSprite(id, p); ctx.drawImage(b, 4 + (i % 12) * 38, oy + 36 + Math.floor(i / 12) * 44); } catch (e) { /* pose missing */ } });
  });
  return canvas;
}
