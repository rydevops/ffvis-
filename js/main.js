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

// Integer scaling in *device* pixels (×3 portrait / ×5 landscape on most iPhones),
// letterboxed otherwise, so no source pixel is ever resampled unevenly.
function layout() {
  const dpr = window.devicePixelRatio || 1;
  const vw = window.innerWidth, vh = window.innerHeight;
  const ins = insets();
  const portrait = vh > vw * 1.05;
  document.body.classList.toggle('portrait', portrait);
  document.body.classList.toggle('landscape', !portrait);
  let availW, availH, top;
  if (portrait && isTouch) {
    availW = vw - ins.l - ins.r;
    availH = Math.max(120, vh * 0.52 - ins.t);
    top = ins.t + 6;
  } else {
    availW = vw - ins.l - ins.r;
    availH = vh - ins.t - ins.b;
    top = ins.t;
  }
  const s = Math.max(1, Math.floor(Math.min((availW * dpr) / 384, (availH * dpr) / 216)));
  const cssW = (384 * s) / dpr, cssH = (216 * s) / dpr;
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  if (portrait && isTouch) {
    wrap.style.top = top + 'px';
    wrap.style.height = cssH + 'px';
  } else {
    wrap.style.top = top + 'px';
    wrap.style.height = availH + 'px';
  }
}
window.addEventListener('resize', layout);
window.addEventListener('orientationchange', () => setTimeout(layout, 120));
layout();

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
