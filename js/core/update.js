// Launch-time update check.
//
// On every launch (and whenever the app returns from the background) we:
//   1. ask the server for version.json, bypassing every cache;
//   2. if its build differs from the build this code was stamped with, force the
//      service worker to re-check sw.js, which installs the new build and activates it;
//   3. reload into the new build once the new worker takes control.
// If the worker route fails (some iOS versions are lazy about it) we fall back to
// clearing the caches and reloading, guarded so we can never loop.
import { BUILD } from '../version.js';

const DEV = BUILD.startsWith('__');
let registration = null;
let hadController = false;
let allowReload = true;
let pendingReload = false;

function status(msg) {
  const el = document.getElementById('boot-msg');
  if (el) el.textContent = msg;
}

function withTimeout(promise, ms, fallback) {
  return Promise.race([promise, new Promise((res) => setTimeout(() => res(fallback), ms))]);
}

async function remoteBuild() {
  try {
    const r = await fetch('./version.json?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return null;
    const j = await r.json();
    return typeof j.build === 'string' ? j.build : null;
  } catch {
    return null;
  }
}

function waitForController(ms) {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(false), ms);
    navigator.serviceWorker.addEventListener('controllerchange', () => { clearTimeout(t); resolve(true); }, { once: true });
  });
}

async function hardRefresh(target) {
  // Loop guard: only ever hard-refresh once per target build per session.
  try {
    if (sessionStorage.getItem('rfr-hard-refresh') === target) return false;
    sessionStorage.setItem('rfr-hard-refresh', target);
  } catch { /* storage unavailable: still try once */ }
  try {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('rfr-')).map((k) => caches.delete(k)));
    if (registration) await registration.unregister();
  } catch { /* ignore */ }
  location.reload();
  return true;
}

async function applyUpdate(target) {
  status('Updating…');
  const swapped = waitForController(15000);
  try { await registration.update(); } catch { /* fall through */ }
  if (await swapped) {
    location.reload();
    return true;
  }
  return hardRefresh(target);
}

// Called once at boot, before the game starts. Resolves when the game may start
// (or never resolves because the page is reloading into a new build).
export async function checkAtLaunch() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  hadController = !!navigator.serviceWorker.controller;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // First install claiming the page is not an update.
    if (!hadController) { hadController = true; return; }
    if (allowReload) location.reload();
    else pendingReload = true;
  });

  status('Checking for updates…');
  try {
    registration = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
  } catch {
    return;
  }
  if (DEV) return;

  const remote = await withTimeout(remoteBuild(), 4000, null);
  if (remote && remote !== BUILD && !remote.startsWith('__')) {
    await applyUpdate(remote);
    await new Promise(() => {}); // page is reloading
  }
  try { registration.update(); } catch { /* background refresh */ }
}

// While the player is in the middle of the game we don't yank the page out from
// under them; the update is applied the next time they reach the title screen.
export function setReloadAllowed(allowed) {
  allowReload = allowed;
  if (allowed && pendingReload) location.reload();
}

export function updatePending() { return pendingReload; }

// iOS keeps standalone apps alive in the background; re-check on resume.
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState !== 'visible' || !registration || DEV) return;
  const remote = await remoteBuild();
  if (remote && remote !== BUILD && !remote.startsWith('__')) {
    try { await registration.update(); } catch { /* ignore */ }
    if (!hadController) return;
    if (allowReload) applyUpdate(remote);
    else pendingReload = true;
  }
});

// "26 Oct 03:12 · f4bc254" from a deploy stamp (YYYYMMDDHHMM-sha); "dev" when running unstamped.
export function buildLabel() {
  if (DEV) return 'dev build';
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})-?(\w*)$/.exec(BUILD);
  if (!m) return BUILD;
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m[2] - 1];
  return `${+m[3]} ${mon} ${m[4]}:${m[5]} UTC${m[6] ? ' - ' + m[6] : ''}`;
}

export { BUILD };
