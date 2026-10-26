import { checkAtLaunch } from './core/update.js';
import * as input from './core/input.js';
import * as audio from './core/audio.js';
import { boot } from './game.js';

const canvas = document.getElementById('screen');
const wrap = document.getElementById('screen-wrap');
const ctx = canvas.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;

const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
if (!isTouch) document.body.classList.add('no-touch');

// Read the safe-area insets (env() can't be read from a custom property directly).
const probe = document.createElement('div');
probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;' +
  'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
document.body.appendChild(probe);
function insets() {
  const cs = getComputedStyle(probe);
  return {
    t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0,
    b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0,
  };
}

// Fill the screen: the 16:9 game is scaled to the largest size that fits (fractional scale,
// snapped to whole device pixels), under the status bar and edge to edge. Whatever the aspect
// ratio leaves over is filled by a soft glow of the game's own colours (see ambient below).
function layout() {
  const dpr = window.devicePixelRatio || 1;
  const vw = window.innerWidth, vh = window.innerHeight;
  const ins = insets();
  const portrait = vh > vw * 1.05;
  document.body.classList.toggle('portrait', portrait);
  document.body.classList.toggle('landscape', !portrait);
  const availW = vw - ins.l - ins.r;
  const availH = vh - ins.t - ins.b;
  const f = Math.min(availW / 384, availH / 216);
  const cssW = Math.round(384 * f * dpr) / dpr, cssH = Math.round(216 * f * dpr) / dpr;
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  if (portrait && isTouch) { // centre the picture in the space above the controls
    const room = vh - ins.b - 235;
    wrap.style.top = Math.max(ins.t, Math.round((room - cssH) / 2)) + 'px';
    wrap.style.height = cssH + 'px';
  } else {
    wrap.style.top = ins.t + 'px';
    wrap.style.height = availH + 'px';
  }
}
window.addEventListener('resize', layout);
window.addEventListener('orientationchange', () => setTimeout(layout, 120));
layout();

// Ambient fill: a tiny copy of the current frame, stretched over the whole screen behind the
// game and smoothed by the browser, so the space around the 16:9 picture glows in its colours.
const amb = document.getElementById('ambient');
const actx = amb.getContext('2d', { alpha: false });
let ambT = 0;
(function ambient(now) {
  if (now - ambT > 66) { actx.drawImage(canvas, 0, 0, 384, 216, 0, 0, amb.width, amb.height); ambT = now; }
  requestAnimationFrame(ambient);
})(0);

input.bindTouch();
input.onFirstInput(() => audio.unlock());
document.addEventListener('pointerdown', () => audio.unlock(), { capture: true });
document.addEventListener('touchend', () => audio.unlock(), { capture: true });

(async () => {
  await checkAtLaunch();
  document.getElementById('boot').classList.add('gone');
  boot(ctx);
})();

// Test hook: ?debug exposes internals for automated play-testing.
if (location.search.includes('debug')) {
  Promise.all([import('./game.js'), import('./script.js'), import('./data/party.js')]).then(([g, s, p]) => {
    window.__rfr = { game: g.game, script: s, party: p };
  });
}
