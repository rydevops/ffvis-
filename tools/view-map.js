// Whole-map overview: viewer.html?m=map&map=<id>&flags=a,b&z=1  — renders the real FieldScene in tiles.
import { game } from '../js/game.js';
import { newState } from '../js/data/party.js';
import { FieldScene } from '../js/scenes/field.js';
import { makeCanvas, W, H } from '../js/core/gfx.js';
export async function render() {
  const q = new URLSearchParams(location.search);
  game.state = newState();
  for (const f of (q.get('flags') || '').split(',').filter(Boolean)) game.state.flags[f] = true;
  game.state.party = ['terra']; game.state.chars.terra = (await import('../js/data/party.js')).makeChar('terra');
  const f = new FieldScene(q.get('map'), 1, 1, 'down');
  f.load();
  f.snapCamera = () => {};
  const mw = f.w * 16, mh = f.h * 16;
  const { canvas, ctx } = makeCanvas(mw, mh);
  const scr = makeCanvas(W, H);
  for (let y = 0; y < mh; y += H) for (let x = 0; x < mw; x += W) {
    f.camGoal = () => [x, y]; f.camX = x; f.camY = y;
    f.particles = [];
    scr.ctx.clearRect(0, 0, W, H);
    f.draw(scr.ctx);
    ctx.drawImage(scr.canvas, x, y);
  }
  return canvas;
}
