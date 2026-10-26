# Requiem for Ruin

An unofficial, fan-made 16-bit RPG set one year after the World of Ruin, built as an
installable **PWA for iPhone** that runs from GitHub Pages. Follows the *Requiem for Ruin*
story bible and the *Pixel Art Rendering Guide*.

This is a fan project. It is not affiliated with or endorsed by Square Enix. All art, music
and code here are original; no assets from the original games are used.

## What's playable

The full story bible, start to finish:

| Part | Content |
| --- | --- |
| **Prologue** | Ilse's dig under Kefka's Tower, the Vault of Unmaking, SOLACE wakes, the **Warden Construct** |
| **Act I — The Rootless Year** | Mobliz Morning and the **Seedling Swarm**; Letters by Falcon (**Skywatcher** on the deck); Council at Figaro; three scenarios in any order — Hollowmere (**Maren**, **Brood Hive**), the Veldt (Seven joins, **Retriever**), the Singing Mine; the three-path Defense of Narshe and **Psalm** |
| **Act II — The Race for the Wellsprings** | The Falcon and an open world map. Thamasa's Archive of Ash (Relm paints bridges, **Archive Sentinel**); the Esper Ruins (Dalia joins, Echo of **Ifrit & Shiva**); then in any order the Drowned Temple (**Litany**'s memory loops), Doma's crypts (**Dirge**), Vigil's three-deck armada (Maren joins, **Vigil**). The Silent Hour at Albrook, the three-team Sanctum of the Hush (**Ostrander**), and the Circuit Closes |
| **Act III — Requiem** | Ilse alone and a brass skiff; gather the scattered party in any order (Maranda's siege, Edgar's rescue dive, the Veldt escort, Setzer's card game, Locke in the dust storm, Doma's long night, Relm's pigments, the collapsed mine, Dalia lost in an Echo, Gogo's mirror dance); the Dreaming Esper and **Nightmare Kefka**; Gogo's Gambit; the Cradle's three paths (Mercy, Memory with **Amen**, Rest); **SOLACE** in four forms; the Green Return and an epilogue that changes with your choices |

**World:** every relit Wellspring recolours its region of the world map (snow, sea, forests, sky);
SOLACE broadcasts after each one; the Bloom spreads silent green across the heartland in Act III,
and a Stilled counter tracks the sleepers you've helped wake.

**Side content:** a personal quest and ultimate for every character (Morning Star, Second Chance,
Runic Blade, Royal Tempest, Dawnblade, Jackpot Royale and a faster Falcon, Atonement and Living
Canvas, Beast King's Roar, Snowfall Dance and Big Hug, Overclock, Unbroken Line, Esper Bloom, Gogo's
mirror), Seven's *Learning to Dream* (which decides Seven's fate), the Interceptor's Trail to Shadow,
the Eight Seraphs, 24 Echo points, *The Return of Maria*, Cid's last notes, the Colosseum,
rebuilding Mobliz, Hollowmere and Albrook, and waking the Stilled early with Relm's paintings.

**Systems:** Active Time Battle with 20 playable characters and their commands (Salvage, Spirit,
Tools, Blitz, Bushido, Slots, Runic, Steal, Sketch, Lore, Rage, Dance, Learn, Bulwark, Call, Throw,
Mimic), Echo Shards that grow stronger as the world heals, equipment and shops, inns, party
switching, save/continue, and settings (volume, text speed, battle mode, reduce flashing, shake).

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

## Telling which version you're running

The title screen shows the running build at the top-left, e.g. `Build 26 Oct 03:12 UTC - f4bc254`
(deploy time and commit), with the window size, device pixel ratio, scale and whether it runs
as an installed app or in the browser beneath it. If the commit there isn't the latest one on
`main`, you're on an older copy: close the app fully and reopen it while online. `dev build`
means an unstamped local copy.

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

## Art

Characters are being redrawn by hand in the 16-bit style, one at a time. **Terra** is first:
`js/data/terra_art.js` holds her 16x24 field frames (down/up/left, with walking poses derived
from the standing art) and the body parts her battle poses are composed from, with the outline
drawn as part of the art. Her Trance forms are palette swaps of the same drawing. The rest of
the cast still uses the layered/procedural builders in `js/data/chars.js` and `sprites.js`.

## Local development

```sh
python3 -m http.server 8123      # then open http://localhost:8123
```

`?debug` exposes `window.__rfr` for testing. With the server running:

- `node tools/validate.mjs` checks every map and story script for broken references
  (row widths, props, sprites, enemies, items, songs, sound effects, story handlers, locations).
- `STEPS='name|name:{json}|js:code' node tools/drive.mjs flow` plays story handlers in order,
  answering dialogue and fighting battles (`GOD=1` for speed, `CHOICES=0,1` for menus).
- `tools/viewer.html?m=field|battle|enemy|terra` shows sprites (`terra` lays out every field frame and battle pose of her forms); `?m=map&map=<id>&flags=a,b&z=1`
  renders a whole map.
