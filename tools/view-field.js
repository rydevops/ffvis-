import { fieldSheet, CHAR_DEFS } from '../js/data/sprites.js';
import { makeCanvas } from '../js/core/gfx.js';
export async function render() {
  const ids = [...Object.keys(CHAR_DEFS), 'mog', 'moogle', 'seven', 'sevenBlue', 'umaro', 'interceptor', 'falcon', 'skiff'];
  const cols = 4;
  const cw = 12 * 26 + 8;
  const rows = Math.ceil(ids.length / cols);
  const { canvas, ctx } = makeCanvas(cols * cw, rows * 36 + 4);
  ids.forEach((id, n) => {
    const s = fieldSheet(id);
    const ox = (n % cols) * cw, oy = Math.floor(n / cols) * 36;
    ctx.fillStyle = n % 2 ? '#C4BCA6' : '#5A2434'; ctx.fillRect(ox, oy, cw - 4, 35);
    ['down', 'up', 'left', 'right'].forEach((d, di) => s[d].forEach((f, fi) => ctx.drawImage(f, ox + 2 + (di * 3 + fi) * 26, oy + 34 - f.height)));
  });
  return canvas;
}
