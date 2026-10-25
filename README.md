# Requiem for Ruin

An unofficial, fan-made 16-bit RPG set one year after the World of Ruin, built as an
installable **PWA for iPhone** that runs from GitHub Pages. Follows the *Requiem for Ruin*
story bible and the *Pixel Art Rendering Guide*.

This is a fan project. It is not affiliated with or endorsed by Square Enix. All art, music
and code here are original; no assets from the original games are used.

## What's playable

| Chapter | Content |
| --- | --- |
| **Prologue — Breaking Ground** | Ilse's dig crew under Kefka's Tower, the six-glyph door puzzle, the Vault of Unmaking, SOLACE's awakening and the crew's loss, the Halls of Warning (random encounters), the **Warden Construct** boss, collapse in the Ashen Reach, and the title card as SOLACE's eye opens |
| **Mission 1 — Mobliz Morning** | Wake the children, water the crops, the schoolhouse lesson and the Straw Knight sparring tutorial, nightfall and the silent "stilling wave", the impossible bloom, Pip collapsing, Seed Drones, the **Seedling Swarm** boss, and Terra's first Trance flicker (unlocks *Spirit*) |

Systems: tile-based exploration with y-sorted props and NPCs, Active Time Battle (Wait/Active
modes), Ilse's *Salvage* (Shock Trap, Turret, Flash Decoy, Patch Kit, built from machine parts),
Hale's *Blast*, Duane's *Heave*/*Brace*, Terra's *Spirit*, items, EXP and levels, save/continue,
and settings (music/SFX volume, text speed, battle mode, reduce flashing, screen-shake level).

## Controls

| | Touch | Keyboard |
| --- | --- | --- |
| Move | D-pad | Arrows / WASD |
| Confirm / talk | **A** (or tap the game screen) | Z, Enter, Space |
| Cancel / run (hold) | **B** | X, Esc |
| Menu | **MENU** | C, Tab |
| Flee a battle | hold **B** | hold X |

Portrait puts the controls under the screen; landscape overlays them in the side gutters.

## Install on iPhone

1. Open the GitHub Pages URL in **Safari**.
2. Tap **Share → Add to Home Screen**.
3. Launch it from the home screen. It runs full-screen and works offline after the first load.

Sound plays even with the ringer switch off (iOS 17+). The first tap wakes the audio.

## Deploying to GitHub Pages

1. In the repo, go to **Settings → Pages** and set **Source** to **GitHub Actions** (one-time).
2. Push to `main`. The workflow in `.github/workflows/pages.yml` stamps a build id and deploys.

## How auto-update works

Every deploy runs `tools/stamp.mjs`, which writes a unique build id (UTC time + commit) into
`sw.js`, `js/version.js` and `version.json`, and regenerates the service worker's precache list.

On every launch (and whenever the app returns from the background) the game:

1. fetches `version.json` with no caching and compares it to the build it is running;
2. if it differs, shows *Updating…*, asks the service worker to re-check `sw.js`
   (`updateViaCache: 'none'`), which precaches the new build with cache-busting requests,
   activates it and deletes the old cache;
3. reloads into the new version.

If the service-worker route stalls (some iOS versions are lazy about it), it falls back to
clearing the caches and reloading, at most once per build, so it can never loop. An update found
mid-game is held until you are back on the title screen, so it never interrupts play.

## Project layout

```
index.html, css/, manifest.webmanifest, sw.js, version.json, icons/
js/main.js            boot, integer-scale layout, update check
js/game.js            loop (fixed 60 fps), scenes/overlays, fades, flashes, shake
js/script.js          story-script API (say, walk, battle, teleport, ...)
js/core/              gfx (painter, dither, outlines), font, input, audio synth, save, update
js/data/              palette ramps, character art, enemies, tiles/props, maps, music, story
js/scenes/            title, field, battle (+ backgrounds), menus, dialogue UI
tools/                dev-only: stamping, icon generator, sprite viewer, headless play-tests
```

All graphics are generated at runtime from text-art and procedural painters that use only the
guide's master ramps (384×216 internal resolution, 16 px tiles, 2×2 Bayer dithering, deep-step
outlines, light from the upper left). All music is an original score played by a WebAudio synth
(main theme, SOLACE's lullaby and its variants, vault, battle, boss, Mobliz, victory).

## Local development

```sh
python3 -m http.server 8123      # then open http://localhost:8123
```

`?debug` exposes `window.__rfr` for testing. Headless play-test scenarios live in
`tools/scenarios` (`node tools/drive.mjs run` with `SETUP`/`CHOICES` env vars); the sprite
viewer is `tools/viewer.html?m=field|battle|enemy`.
