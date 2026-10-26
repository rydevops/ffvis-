import { battleSprite, BATTLE_POSES } from '../js/data/sprites.js';
import { makeCanvas } from '../js/core/gfx.js';
export async function render() {
  const ids = ['terra', 'terraEsper', 'ilse', 'locke', 'celes', 'edgar', 'sabin', 'cyan', 'setzer', 'shadow', 'relm', 'strago', 'gau', 'maren', 'dalia', 'gogo', 'mog', 'umaro', 'seven', 'hush', 'ostrander', 'soldier', 'kefka'];
  const poses = ['idle0', 'windup', 'swing', 'cast', 'hurt', 'kneel', 'victory', 'defend'];
  const { canvas, ctx } = makeCanvas(poses.length * 42 + 2, ids.length * 46 + 2);
  ids.forEach((id, r) => poses.forEach((p, i) => {
    ctx.fillStyle = r % 2 ? '#C06048' : '#2E1424'; ctx.fillRect(1 + i * 42, 1 + r * 46, 40, 44);
    const s = battleSprite(id, p);
    ctx.drawImage(s, 1 + i * 42 + Math.floor((40 - s.width) / 2), 1 + r * 46 + 44 - s.height);
  }));
  return canvas;
}
