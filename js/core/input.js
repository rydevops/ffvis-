// Unified input: keyboard + on-screen touch pad. Buttons: up down left right a b start.
const BTNS = ['up', 'down', 'left', 'right', 'a', 'b', 'start'];
const held = Object.fromEntries(BTNS.map((b) => [b, false]));
const prev = { ...held };
const pressedNow = { ...held };
const repeatTimer = Object.fromEntries(BTNS.map((b) => [b, 0]));
const lock = { ...held }; // a locked button is ignored until it is released
let anyTouch = false;
let tapA = false;

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'a', Enter: 'a', Space: 'a', KeyJ: 'a',
  KeyX: 'b', Escape: 'b', Backspace: 'b', KeyK: 'b',
  KeyC: 'start', Tab: 'start', KeyM: 'start',
};

const keySrc = Object.fromEntries(BTNS.map((b) => [b, false]));
const touchSrc = Object.fromEntries(BTNS.map((b) => [b, false]));
// a press shorter than one frame must still register: latch it until the next poll
const latch = Object.fromEntries(BTNS.map((b) => [b, false]));

window.addEventListener('keydown', (e) => {
  const b = KEYMAP[e.code];
  if (!b) return;
  e.preventDefault();
  keySrc[b] = true;
  latch[b] = true;
  listeners.forEach((fn) => fn());
});
window.addEventListener('keyup', (e) => {
  const b = KEYMAP[e.code];
  if (!b) return;
  e.preventDefault();
  keySrc[b] = false;
});
window.addEventListener('blur', () => { for (const b of BTNS) { keySrc[b] = false; touchSrc[b] = false; } });

const listeners = [];
export function onFirstInput(fn) { listeners.push(fn); }

// ---------------------------------------------------------------- touch pad
export function bindTouch() {
  const dpad = document.getElementById('dpad');
  const pointers = new Map(); // pointerId -> { el, btn }

  function dpadDirs(e) {
    const r = dpad.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const dead = r.width * 0.12;
    const out = [];
    if (Math.hypot(dx, dy) < dead) return out;
    const ang = Math.atan2(dy, dx) * 180 / Math.PI; // -180..180, 0 = right
    // 8-way with generous cardinal sectors
    if (ang > -67.5 && ang < 67.5) out.push('right');
    if (ang > 112.5 || ang < -112.5) out.push('left');
    if (ang > 22.5 && ang < 157.5) out.push('down');
    if (ang < -22.5 && ang > -157.5) out.push('up');
    return out;
  }

  function refresh() {
    for (const b of BTNS) touchSrc[b] = false;
    for (const p of pointers.values()) {
      if (p.dirs) p.dirs.forEach((d) => { touchSrc[d] = true; latch[d] = true; });
      if (p.btn) { touchSrc[p.btn] = true; latch[p.btn] = true; }
    }
    dpad.className = ['up', 'down', 'left', 'right'].filter((d) => touchSrc[d]).join(' ');
    document.querySelectorAll('[data-btn]').forEach((el) => el.classList.toggle('on', touchSrc[el.dataset.btn]));
  }

  dpad.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    dpad.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { dirs: dpadDirs(e) });
    anyTouch = true; refresh(); listeners.forEach((fn) => fn());
  });
  dpad.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p || !p.dirs) return;
    p.dirs = dpadDirs(e);
    refresh();
  });

  document.querySelectorAll('[data-btn]').forEach((el) => {
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { btn: el.dataset.btn });
      anyTouch = true; refresh(); listeners.forEach((fn) => fn());
    });
  });

  const end = (e) => { if (pointers.delete(e.pointerId)) refresh(); };
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);

  // Tapping the game screen itself acts as A (handy for dialogue).
  const screen = document.getElementById('screen');
  screen.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    tapA = true;
    anyTouch = true;
    listeners.forEach((fn) => fn());
  });

  // stop iOS double-tap zoom / long-press menus
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => e.preventDefault());
  document.addEventListener('contextmenu', (e) => e.preventDefault());
}

// ---------------------------------------------------------------- per-frame API
export function poll() {
  for (const b of BTNS) {
    prev[b] = held[b];
    held[b] = keySrc[b] || touchSrc[b] || latch[b] || (b === 'a' && tapA);
    latch[b] = false;
    pressedNow[b] = held[b] && !prev[b];
    if (held[b]) repeatTimer[b]++; else { repeatTimer[b] = 0; lock[b] = false; }
    if (lock[b]) pressedNow[b] = false;
  }
  tapA = false;
}

export const isHeld = (b) => held[b];
export const pressed = (b) => pressedNow[b];
// pressed, plus auto-repeat while held (for menu cursors)
export function repeat(b) {
  if (lock[b]) return false;
  if (pressedNow[b]) return true;
  const t = repeatTimer[b];
  return t > 18 && (t - 18) % 5 === 0;
}
export function consume(b) { pressedNow[b] = false; }
export function clearAll() { for (const b of BTNS) { pressedNow[b] = false; lock[b] = held[b]; } }
export const usedTouch = () => anyTouch;
