import { fieldSheet, CHAR_DEFS } from '../js/data/sprites.js';
import { makeCanvas } from '../js/core/gfx.js';
export async function render() {
  const ids = Object.keys(CHAR_DEFS);
  const { canvas, ctx } = makeCanvas(12 * 18 + 4, ids.length * 26 * 2 + 4);
  ids.forEach((id, row) => {
    const s = fieldSheet(id);
    ['down', 'up', 'left', 'right'].forEach((d, di) => s[d].forEach((f, fi) => {
      ctx.fillStyle = '#E8E2D0'; ctx.fillRect(2 + (di * 3 + fi) * 18, 2 + row * 52, 16, 24);
      ctx.fillStyle = '#2E1424'; ctx.fillRect(2 + (di * 3 + fi) * 18, 2 + row * 52 + 26, 16, 24);
      ctx.drawImage(f, 2 + (di * 3 + fi) * 18, 2 + row * 52);
      ctx.drawImage(f, 2 + (di * 3 + fi) * 18, 2 + row * 52 + 26);
    }));
  });
  return canvas;
}
