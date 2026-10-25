// Game loop, scene stack, frame-based waiting and full-screen effects.
import * as input from './core/input.js';
import * as audio from './core/audio.js';
import { W, H, ditherRect } from './core/gfx.js';
import { OUTLINE } from './data/palette.js';
import { loadSettings } from './core/save.js';

export const game = {
  ctx: null,
  frame: 0,
  scene: null,
  overlays: [],
  waiters: [],
  busy: 0, // >0 while a story script is running (field input disabled)
  settings: null,
  state: null, // save-able progress, see core/save.js
  fx: {
    fade: 0, fadeTo: 0, fadeRate: 0, fadeColor: OUTLINE,
    flash: 0, flashColor: '#FFFDF5',
    shake: 0, shakeMag: 0,
    tint: null, tintLevel: 0,
    letterbox: 0,
  },
};

const FRAME_MS = 1000 / 60;

export function boot(ctx) {
  game.ctx = ctx;
  game.settings = loadSettings();
  audio.setVolumes(game.settings.music, game.settings.sfx);
  import('./scenes/title.js').then((m) => {
    setScene(new m.TitleScene());
    let last = performance.now();
    let acc = 0;
    const loop = (now) => {
      acc += Math.min(100, now - last);
      last = now;
      let n = 0;
      while (acc >= FRAME_MS - 0.5 && n < 4) { update(); acc -= FRAME_MS; n++; }
      if (acc > FRAME_MS * 4) acc = 0;
      draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
}

// ---------------------------------------------------------------- scenes & overlays
export function setScene(scene) {
  if (game.scene && game.scene.exit) game.scene.exit();
  game.scene = scene;
  if (scene.enter) scene.enter();
}
export function pushOverlay(o) { game.overlays.push(o); return o; }
export function removeOverlay(o) {
  const i = game.overlays.indexOf(o);
  if (i >= 0) game.overlays.splice(i, 1);
}
export function topOverlay() { return game.overlays[game.overlays.length - 1] || null; }

// ---------------------------------------------------------------- time
export function wait(frames) {
  return new Promise((res) => game.waiters.push({ n: Math.max(0, frames | 0), res }));
}
export function waitUntil(pred) {
  return new Promise((res) => game.waiters.push({ pred, res }));
}

// ---------------------------------------------------------------- effects
// Scene fade: steps through 4 dither levels to the fade colour (24 frames by default).
export function fadeOut(frames = 24, color = OUTLINE) {
  game.fx.fadeColor = color;
  game.fx.fadeTo = 4;
  game.fx.fadeRate = 4 / Math.max(1, frames);
  return waitUntil(() => game.fx.fade >= 4);
}
export function fadeIn(frames = 24) {
  game.fx.fadeTo = 0;
  game.fx.fadeRate = 4 / Math.max(1, frames);
  return waitUntil(() => game.fx.fade <= 0);
}
export function setFade(level, color = OUTLINE) {
  game.fx.fade = level;
  game.fx.fadeTo = level;
  game.fx.fadeColor = color;
}
// White flash: 2 frames full, 1 frame 50% dither. "Reduce flashing" swaps in a dim 4-frame flash.
export function flash(color = '#FFFDF5') {
  game.fx.flashColor = color;
  game.fx.flash = game.settings.reduceFlash ? -4 : 3;
}
export function shake(mag = 2, frames = 8) {
  const s = game.settings.shake;
  if (s <= 0) return;
  game.fx.shakeMag = Math.max(1, Math.round(mag * s));
  game.fx.shake = frames;
}
export function letterbox(on) { game.fx.letterbox = on ? 1 : 0; }

// ---------------------------------------------------------------- loop
function update() {
  game.frame++;
  if (game.state) game.state.playtime = (game.state.playtime || 0) + 1;
  input.poll();
  audio.tick();

  if (game.waiters.length) {
    const list = game.waiters;
    game.waiters = [];
    for (const w of list) {
      if (w.pred ? w.pred() : --w.n <= 0) w.res();
      else game.waiters.push(w);
    }
  }

  const fx = game.fx;
  if (fx.fade !== fx.fadeTo) {
    fx.fade += Math.sign(fx.fadeTo - fx.fade) * fx.fadeRate;
    if (Math.abs(fx.fade - fx.fadeTo) < fx.fadeRate) fx.fade = fx.fadeTo;
  }
  if (fx.flash > 0) fx.flash--;
  if (fx.flash < 0) fx.flash++;
  if (fx.shake > 0) fx.shake--;
  if (fx.letterbox && fx.lb < 16) fx.lb = (fx.lb || 0) + 1;
  if (!fx.letterbox && fx.lb > 0) fx.lb--;

  const top = topOverlay();
  if (game.scene) game.scene.update(!top && game.busy === 0, !top);
  if (top) top.update();
}

function draw() {
  const ctx = game.ctx;
  const fx = game.fx;
  ctx.save();
  if (fx.shake > 0) {
    const m = Math.max(1, Math.round(fx.shakeMag * (fx.shake / 8)));
    const ox = (game.frame % 2 ? 1 : -1) * m;
    const oy = ((game.frame >> 1) % 2 ? 1 : -1) * Math.floor(m / 2);
    ctx.translate(ox, oy);
  }
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(-8, -8, W + 16, H + 16);
  if (game.scene) game.scene.draw(ctx);
  ctx.restore();

  if (fx.lb > 0) {
    const h = Math.round(fx.lb * 1.25);
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(0, 0, W, h);
    ctx.fillRect(0, H - h, W, h);
  }

  if (fx.fade > 0) ditherRect(ctx, 0, 0, W, H, fx.fadeColor, Math.round(fx.fade));
  for (const o of game.overlays) o.draw(ctx);
  if (fx.flash > 0) ditherRect(ctx, 0, 0, W, H, fx.flashColor, fx.flash >= 2 ? 4 : 2);
  if (fx.flash < 0) ditherRect(ctx, 0, 0, W, H, fx.flashColor, 1);
}
