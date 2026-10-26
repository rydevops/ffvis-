// Requiem for Ruin — service worker.
// BUILD and the asset list are rewritten on every deploy by tools/stamp.mjs, so each
// deploy produces a byte-different sw.js; that is what lets the browser detect updates.
const BUILD = '__BUILD__';
const CACHE = 'rfr-' + BUILD;
const ASSETS = /*ASSETS*/[
  "./",
  "./css/style.css",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./index.html",
  "./js/core/audio.js",
  "./js/core/font.js",
  "./js/core/gfx.js",
  "./js/core/input.js",
  "./js/core/save.js",
  "./js/core/update.js",
  "./js/data/chars.js",
  "./js/data/enemies.js",
  "./js/data/mapkit.js",
  "./js/data/maps.js",
  "./js/data/maps_act1.js",
  "./js/data/maps_act2.js",
  "./js/data/maps_act3.js",
  "./js/data/maps_side.js",
  "./js/data/music.js",
  "./js/data/palette.js",
  "./js/data/party.js",
  "./js/data/sprites.js",
  "./js/data/story.js",
  "./js/data/story_act1.js",
  "./js/data/story_act2.js",
  "./js/data/story_act3.js",
  "./js/data/story_common.js",
  "./js/data/story_side.js",
  "./js/data/tiles.js",
  "./js/data/world.js",
  "./js/game.js",
  "./js/main.js",
  "./js/scenes/battle.js",
  "./js/scenes/bfx.js",
  "./js/scenes/bgs.js",
  "./js/scenes/field.js",
  "./js/scenes/menu.js",
  "./js/scenes/title.js",
  "./js/scenes/ui.js",
  "./js/script.js",
  "./js/version.js",
  "./manifest.webmanifest"
]/*END*/;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // cache: 'reload' bypasses the HTTP cache so we never precache a stale file.
    await cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('rfr-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // The version probe must always hit the network.
  if (url.pathname.endsWith('/version.json')) {
    event.respondWith(fetch(req, { cache: 'no-store' }).catch(() =>
      new Response('{}', { headers: { 'content-type': 'application/json' } })));
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const resp = await fetch(req);
      if (resp.ok) {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return resp;
    } catch (err) {
      if (req.mode === 'navigate') {
        const shell = await caches.match('./index.html');
        if (shell) return shell;
      }
      throw err;
    }
  })());
});
