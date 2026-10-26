// Act II maps: Thamasa and the Archive of Ash, the Esper Ruins, the Drowned Temple, Doma and its
// crypts, Vigil's Armada, Albrook after the Silent Hour, Zozo and the Sanctum of the Hush.
import { Grid, carve, edgeExits, shopkeeper, innkeeper, npc } from './mapkit.js';

const lines = (id, sprite, x, y, name, ls, o = {}) => npc(id, sprite, x, y, 'lines', { name, lines: ls, ...o });

export const ACT2_MAPS = {
  // ---------------------------------------------------------------- Thamasa
  thamasa: (() => {
    const g = new Grid(32, 26, '.');
    g.top(3).rect(0, 0, 0, 25, '#').rect(31, 0, 31, 25, '#').rect(0, 24, 31, 25, '#').rect(14, 24, 17, 25, ',');
    for (let x = 2; x < 30; x += 3) g.set(x, 2, 'G'); // murals painted along the cliff wall
    g.rect(15, 0, 16, 2, '.'); // the archive stair
    g.path([[15, 23], [15, 3]], ',', 2).path([[3, 14], [28, 14]], ',');
    return {
      name: 'Thamasa', theme: 'mural', music: 'thamasa', region: 'east', weather: (f) => (f.wsHeart ? 'pollen' : 'ash'), shadow: '#453E26',
      rows: g.rows(),
      props: [
        { id: 'stragoHouse', type: 'house', x: 3, y: 11, state: 'green' }, { type: 'house', x: 22, y: 11, state: 'blue' },
        { type: 'house', x: 3, y: 21, state: 'plum' }, { type: 'house', x: 23, y: 21, state: 'green' },
        { type: 'stall', x: 9, y: 18, state: 'green' }, { type: 'sign2', x: 19, y: 18, state: 'inn' },
        { type: 'tree', x: 11, y: 7 }, { type: 'tree', x: 20, y: 7 }, { type: 'well', x: 12, y: 16 }, { type: 'statue', x: 18, y: 10 },
        { id: 'seal', type: 'sealedDoor', x: 15, y: 2, unless: 'archiveOpen' },
        { id: 'c1', type: 'chest', x: 29, y: 17 },
      ],
      npcs: [
        shopkeeper('tshop', 10, 19, 'thamasa', 'oldwoman'),
        innkeeper('tinn', 20, 19, 80, 'woman'),
        { id: 'strago', name: 'Strago', sprite: 'strago', x: 14, y: 5, dir: 'down', talk: 'stragoThamasa', unless: 'm6Joined' },
        { id: 'relm', name: 'Relm', sprite: 'relm', x: 8, y: 4, dir: 'up', talk: 'relmThamasa', unless: 'm6Joined' },
        lines('t1', 'oldman', 24, 15, 'Elder', ['Thamasa kept the old ways hidden for a thousand years. Some of us are glad they are coming out. Some are afraid.', { if: 'm6Done', say: ['So our ancestors built that thing. ...I always knew we were hiding something worse than magic.'] }]),
        lines('t2', 'rowan', 6, 16, 'Boy', ['Relm painted a dragon on our wall! A blue one! It looks like it could fly off!', { if: 'wsTides', say: ['The sea is BLUE now! Like in Relm\'s paintings!'] }]),
        lines('t3', 'womanB', 26, 9, 'Weaver', ['Relm paints the town as it was before the fall. Some days I swear the colours on her walls are brighter than the sky.']),
      ],
      events: [
        ...edgeExits(32, 26, ['bottom']),
        { id: 'enter', on: 'auto', run: 'thamasaEnter', once: true, flag: 'act2' },
        { id: 'stair', on: 'step', x: 15, y: 0, w: 2, run: 'enterArchive' },
        { id: 'sealT', on: 'talk', x: 15, y: 2, w: 2, run: 'archiveSeal', unless: 'archiveOpen' },
        { id: 'mural', on: 'talk', x: 2, y: 2, w: 28, run: 'thamasaMural' },
        { id: 'tc1', on: 'talk', x: 29, y: 17, run: 'chest', item: 'ether', n: 2, prop: 'c1' },
      ],
    };
  })(),

  // The Archive of Ash: collapsed halls that Relm paints back into being.
  archive: (() => {
    const g = carve(34, 30, [
      [13, 23, 20, 28], [15, 18, 18, 22], [15, 16, 18, 17, '1'], [8, 10, 25, 15],
      [5, 12, 7, 13, '2'], [1, 5, 4, 14], [26, 12, 28, 13, '3'], [29, 5, 32, 14],
      [15, 8, 18, 9, '4'], [11, 1, 22, 7],
    ], 0.55);
    return {
      name: 'Archive of Ash', theme: 'archive', music: 'thamasa', region: 'east', dark: 1, playerLight: 56, shadow: '#1E1418',
      rows: g.rows(),
      override: [{ flag: 'br1', from: '1', to: 'bridge' }, { flag: 'br2', from: '2', to: 'bridge' }, { flag: 'br3', from: '3', to: 'bridge' }, { flag: 'br4', from: '4', to: 'bridge' }],
      props: [
        { type: 'lantern', x: 13, y: 23 }, { type: 'lantern', x: 20, y: 23 }, { type: 'lantern', x: 8, y: 10 }, { type: 'lantern', x: 25, y: 10 },
        { type: 'table', x: 11, y: 12 }, { type: 'table', x: 20, y: 12 }, { type: 'shelf', x: 1, y: 5 }, { type: 'shelf', x: 31, y: 5 },
        { id: 'muralW', type: 'ruinWall', x: 2, y: 6 }, { id: 'muralE', type: 'ruinWall', x: 30, y: 6 },
        { id: 'c1', type: 'chest', x: 1, y: 13 }, { id: 'c2', type: 'chest', x: 32, y: 13 },
        { id: 'records', type: 'shelf', x: 16, y: 2 }, { type: 'pillar', x: 12, y: 3 }, { type: 'pillar', x: 21, y: 3 },
      ],
      events: [
        { id: 'out', on: 'step', x: 13, y: 28, w: 8, run: 'leaveArchive' },
        { id: 'in', on: 'auto', run: 'archiveIn', once: true },
        { id: 'g1', on: 'talk', x: 15, y: 17, w: 4, run: 'paintBridge', n: 1, unless: 'br1' },
        { id: 'g2', on: 'talk', x: 7, y: 12, run: 'paintBridge', n: 2, unless: 'br2' },
        { id: 'g2b', on: 'talk', x: 7, y: 13, run: 'paintBridge', n: 2, unless: 'br2' },
        { id: 'g3', on: 'talk', x: 26, y: 12, run: 'paintBridge', n: 3, unless: 'br3' },
        { id: 'g3b', on: 'talk', x: 26, y: 13, run: 'paintBridge', n: 3, unless: 'br3' },
        { id: 'g4', on: 'talk', x: 15, y: 9, w: 4, run: 'paintBridge', n: 4, unless: 'br4' },
        { id: 'mw', on: 'talk', x: 2, y: 6, w: 2, run: 'archiveMural', side: 'w' },
        { id: 'me', on: 'talk', x: 30, y: 6, w: 2, run: 'archiveMural', side: 'e' },
        { id: 'tc1', on: 'talk', x: 1, y: 13, run: 'chest', gear: 'rod2', prop: 'c1' },
        { id: 'tc2', on: 'talk', x: 32, y: 13, run: 'chest', gear: 'silverPin', prop: 'c2' },
        { id: 'boss', on: 'step', x: 11, y: 6, w: 12, run: 'archiveBoss', unless: 'sentinelDown' },
        { id: 'records', on: 'talk', x: 16, y: 2, w: 2, run: 'archiveRecords' },
      ],
      encounter: { groups: [['inkMoth', 'inkMoth'], ['inkMoth', 'crawler'], ['inkMoth', 'inkMoth', 'inkMoth']], bg: 'archive', offFlag: 'm6Done' },
    };
  })(),

  // ---------------------------------------------------------------- the Esper Ruins (behind the Sealed Gate)
  esperRuins: (() => {
    const g = carve(30, 40, [[11, 33, 18, 39], [13, 26, 16, 32], [4, 20, 25, 25], [2, 12, 8, 19], [21, 12, 27, 19], [11, 6, 18, 19], [9, 1, 20, 5]], 0.4);
    g.rect(9, 22, 10, 23, 'o').rect(19, 22, 20, 23, 'o').rect(14, 3, 15, 4, 'o');
    return {
      name: 'Esper Ruins', theme: 'spirit', music: 'espers', region: 'north', weather: 'motes', shadow: '#2C1C50',
      rows: g.rows(),
      props: [
        { type: 'floatRock', x: 5, y: 22 }, { type: 'floatRock', x: 24, y: 21 }, { type: 'crystal', x: 12, y: 34 }, { type: 'crystal', x: 17, y: 34 },
        { type: 'crystal', x: 3, y: 13, state: 'glass' }, { type: 'crystal', x: 26, y: 13, state: 'glass' }, { type: 'column', x: 11, y: 7 }, { type: 'column', x: 18, y: 7 },
        { type: 'column', x: 10, y: 2 }, { type: 'column', x: 19, y: 2 }, { type: 'ruinWall', x: 6, y: 20 }, { type: 'ruinWall', x: 21, y: 24 },
        { id: 'e1', type: 'echoPoint', x: 4, y: 16, flat: true }, { id: 'e2', type: 'echoPoint', x: 25, y: 16, flat: true }, { id: 'e3', type: 'echoPoint', x: 14, y: 12, flat: true },
        { id: 'c1', type: 'chest', x: 7, y: 12 }, { id: 'c2', type: 'chest', x: 22, y: 12 },
      ],
      npcs: [{ id: 'dalia', name: '???', sprite: 'dalia', x: 15, y: 21, dir: 'down', talk: 'daliaMeet', unless: 'daliaJoined' }],
      events: [
        { id: 'out', on: 'step', x: 11, y: 39, w: 8, run: 'toWorld' },
        { id: 'in', on: 'auto', run: 'ruinsIn', once: true },
        { id: 'meet', on: 'step', x: 4, y: 25, w: 22, run: 'daliaMeet', unless: 'daliaJoined' },
        { id: 'e1', on: 'step', x: 4, y: 16, run: 'echoPoint', shard: 'ramuh', memory: 'An old man of lightning sits on a stone, telling a story to children who are not there anymore. He laughs at his own joke.', prop: 'e1' },
        { id: 'e2', on: 'step', x: 25, y: 16, run: 'echoPoint', shard: 'unicorn', memory: 'A white horse with a single horn kneels beside a wounded soldier and lowers its head. The soldier\'s breathing eases.', prop: 'e2' },
        { id: 'e3', on: 'step', x: 14, y: 12, run: 'echoPoint', memory: 'The village of the Espers, whole and shining. Someone is singing a lullaby you almost know.', prop: 'e3' },
        { id: 'tc1', on: 'talk', x: 7, y: 12, run: 'chest', item: 'pinion', prop: 'c1' },
        { id: 'tc2', on: 'talk', x: 22, y: 12, run: 'chest', gear: 'knife3', prop: 'c2' },
        { id: 'shrine', on: 'step', x: 9, y: 5, w: 12, run: 'ruinsVision', unless: 'm7Done' },
      ],
      encounter: { groups: [['lostEcho'], ['lostEcho', 'crawler'], ['crawler', 'crawler']], bg: 'spirit' },
    };
  })(),

  // ---------------------------------------------------------------- the Drowned Temple (Wellspring of Tides)
  drowned: (() => {
    const g = carve(28, 44, [[9, 37, 18, 43], [12, 9, 15, 36], [4, 28, 11, 33], [16, 20, 23, 25], [6, 1, 21, 8]], 0.3);
    g.rect(9, 40, 9, 43, 'w').rect(18, 40, 18, 43, 'w').rect(11, 12, 11, 34, 'w').rect(16, 12, 16, 18, 'w').rect(16, 26, 16, 34, 'w');
    g.rect(16, 19, 16, 25, '.').rect(11, 29, 11, 32, '.');
    g.rect(6, 6, 8, 8, 'w').rect(19, 6, 21, 8, 'w');
    return {
      name: 'Drowned Temple', theme: 'drowned', music: 'drowned', region: 'sea', dark: 1, playerLight: 60, shadow: '#1A2A34', weather: 'motes',
      rows: g.rows(),
      props: [
        { type: 'coral', x: 10, y: 38 }, { type: 'coral', x: 17, y: 38 }, { type: 'column', x: 12, y: 30 }, { type: 'column', x: 15, y: 22 },
        { type: 'coral', x: 5, y: 29 }, { type: 'coral', x: 22, y: 21 }, { type: 'column', x: 7, y: 2 }, { type: 'column', x: 20, y: 2 },
        { id: 'ws', type: 'wellspring', x: 12, y: 5 }, { id: 'litany', type: 'litanyFig', x: 10, y: 3, unless: 'litanyDown' },
        { id: 'c1', type: 'chest', x: 5, y: 32 }, { id: 'c2', type: 'chest', x: 23, y: 24 }, { id: 'e1', type: 'echoPoint', x: 20, y: 22, flat: true },
      ],
      events: [
        { id: 'out', on: 'step', x: 10, y: 43, w: 8, run: 'leaveTemple' },
        { id: 'in', on: 'auto', run: 'templeIn', once: true },
        { id: 'loop', on: 'step', x: 12, y: 14, w: 4, run: 'litanyLoop', unless: 'loopBroken' },
        { id: 'boss', on: 'step', x: 6, y: 8, w: 16, run: 'litanyBoss', flag: 'loopBroken', unless: 'litanyDown' },
        { id: 'tc1', on: 'talk', x: 5, y: 32, run: 'chest', item: 'xTonic', n: 2, prop: 'c1' },
        { id: 'tc2', on: 'talk', x: 23, y: 24, run: 'chest', gear: 'brassPlate', prop: 'c2' },
        { id: 'e1', on: 'step', x: 20, y: 22, run: 'echoPoint', shard: 'siren', memory: 'A woman with a harp sings on a rock above an old sea. Ships turn toward her voice, gently, and do not wreck.', prop: 'e1' },
      ],
      encounter: { groups: [['tideDrone', 'tideDrone'], ['coralEel'], ['lanternFish', 'tideDrone'], ['lanternFish', 'lanternFish']], bg: 'drowned', offFlag: 'litanyDown' },
    };
  })(),

  // ---------------------------------------------------------------- Doma Castle and its flooded crypts
  doma: (() => {
    const g = new Grid(32, 28, '.');
    g.top(3).rect(0, 0, 1, 27, '#').rect(30, 0, 31, 27, '#').rect(0, 26, 31, 27, '#').rect(14, 26, 17, 27, ',');
    g.rect(2, 3, 5, 8, 'w').rect(26, 3, 29, 8, 'w'); // moat corners
    g.path([[15, 25], [15, 10]], ',', 2).path([[4, 17], [27, 17]], ',');
    g.rect(24, 21, 27, 22, '.');
    return {
      name: 'Doma Castle', theme: 'eastern', music: 'doma', region: 'east', weather: (f) => (f.wsHeart ? 'pollen' : 'ash'), shadow: '#1E2024',
      rows: g.rows(),
      props: [
        { id: 'keep', type: 'pagoda', x: 12, y: 9, state: (f) => (f.wsHeart ? null : 'ruin') }, { type: 'torii', x: 14, y: 22 },
        { type: 'rubble', x: 6, y: 12 }, { type: 'rubble', x: 24, y: 13 }, { type: 'crate', x: 7, y: 20 }, { type: 'crate', x: 8, y: 20 },
        { type: 'tree', x: 3, y: 22 }, { type: 'tree', x: 27, y: 18 }, { type: 'lantern', x: 12, y: 18 }, { type: 'lantern', x: 19, y: 18 },
        { type: 'grave', x: 22, y: 21 }, { type: 'grave', x: 24, y: 21 }, { type: 'grave', x: 26, y: 21 }, { id: 'c1', type: 'chest', x: 3, y: 15 },
      ],
      npcs: [
        { id: 'cyan', name: 'Cyan', sprite: 'cyan', x: 21, y: 15, dir: 'left', talk: 'cyanDoma', unless: 'cyanJoined' },
        lines('d1', 'manB', 8, 15, 'Volunteer', ['Sir Cyan lays a stone every morning before anyone else wakes. Every single morning.', { if: 'wsHeart', say: ['Look at the trees! The old cherry by the gate has blossoms on it!'] }]),
        lines('d2', 'soldierB', 17, 23, 'Guard', ['The crypts flooded when the world fell. Sir Cyan won\'t let anyone go down there. He says the dead are speaking.']),
      ],
      events: [
        ...edgeExits(32, 28, ['bottom']),
        { id: 'in', on: 'auto', run: 'domaIn', once: true },
        { id: 'crypt', on: 'step', x: 15, y: 10, w: 2, run: 'enterCrypt' },
        { id: 'tc1', on: 'talk', x: 3, y: 15, run: 'chest', gear: 'katana3', prop: 'c1' },
      ],
    };
  })(),

  domaCrypt: (() => {
    const g = carve(30, 32, [[12, 26, 17, 31], [13, 18, 16, 25], [3, 14, 26, 19], [3, 6, 8, 13], [21, 6, 26, 13], [9, 1, 20, 9]], 0.35);
    g.rect(4, 15, 25, 18, 'm').rect(13, 19, 16, 23, 'm').rect(4, 8, 7, 12, 'm').rect(22, 8, 25, 12, 'm');
    g.rect(10, 6, 10, 9, 'w').rect(19, 6, 19, 9, 'w');
    return {
      name: 'Doma Crypts', theme: 'crypt', music: 'dirge', region: 'east', dark: 1, playerLight: 52, shadow: '#141618',
      rows: g.rows(),
      props: [
        { type: 'grave', x: 4, y: 7 }, { type: 'grave', x: 6, y: 7 }, { type: 'grave', x: 23, y: 7 }, { type: 'grave', x: 25, y: 7 },
        { type: 'lantern', x: 12, y: 26 }, { type: 'lantern', x: 17, y: 26 }, { type: 'pillar', x: 11, y: 2 }, { type: 'pillar', x: 18, y: 2 },
        { id: 'ws', type: 'wellspring', x: 13, y: 5 }, { id: 'dirge', type: 'dirgeFig', x: 13, y: 3, unless: 'dirgeDown' },
        { id: 'c1', type: 'chest', x: 3, y: 13 }, { id: 'c2', type: 'chest', x: 26, y: 13 }, { id: 'e1', type: 'echoPoint', x: 5, y: 10, flat: true },
      ],
      events: [
        { id: 'out', on: 'step', x: 12, y: 31, w: 6, run: 'leaveCrypt' },
        { id: 'in', on: 'auto', run: 'cryptIn', once: true },
        { id: 'voices', on: 'step', x: 3, y: 16, w: 24, run: 'cryptVoices', once: true },
        { id: 'boss', on: 'step', x: 9, y: 8, w: 12, run: 'dirgeBoss', unless: 'dirgeDown' },
        { id: 'tc1', on: 'talk', x: 3, y: 13, run: 'chest', item: 'remedy', n: 3, prop: 'c1' },
        { id: 'tc2', on: 'talk', x: 26, y: 13, run: 'chest', gear: 'esperSilk', prop: 'c2' },
        { id: 'e1', on: 'step', x: 5, y: 10, run: 'echoPoint', shard: 'odin', memory: 'A rider on a six-legged horse waits at a castle gate for a lord who will never come back. He does not stop waiting.', prop: 'e1' },
      ],
      encounter: { groups: [['cryptMoss', 'cryptMoss'], ['dirgeWisp'], ['dirgeWisp', 'cryptMoss']], bg: 'crypt', offFlag: 'dirgeDown' },
    };
  })(),

  // ---------------------------------------------------------------- Vigil's Armada: three decks
  ...Object.fromEntries([1, 2, 3].map((n) => {
    const g = new Grid(28, 14, ' ');
    g.rect(2, 1, 25, 1, '#').rect(2, 12, 25, 12, '#').rect(2, 2, 25, 11, '.').rect(8, 5, 19, 8, ',');
    if (n < 3) g.rect(26, 6, 27, 7, 'b'); // boarding plank to the next ship
    if (n > 1) g.rect(0, 6, 1, 7, 'b');
    const foes = {
      1: [['a1', 'mite', 10, 4, ['gunDrone', 'gunDrone']], ['a2', 'hushB', 18, 9, ['hushGunner', 'gunDrone']]],
      2: [['a3', 'hush', 9, 9, ['hushGunner', 'hushGunner']], ['a4', 'mite', 17, 4, ['gunDrone', 'gunDrone', 'gunDrone']]],
      3: [],
    }[n];
    return ['armada' + n, {
      name: `Vigil's Armada — Deck ${n}`, theme: 'deck', music: n === 3 ? 'tension' : 'falcon', ambience: 'wind', region: 'sky', shadow: '#3A2418',
      rows: g.rows(),
      props: [
        { type: 'beam', x: 6, y: 6 }, { type: 'beam', x: 21, y: 6 }, { type: 'crate', x: 3, y: 10 }, { type: 'barrel', x: 24, y: 3 },
        { type: 'banner', x: 4, y: 2, state: 'grey' }, { type: 'banner', x: 23, y: 2, state: 'grey' },
        ...(n === 3 ? [{ id: 'vigil', type: 'vigilFig', x: 10, y: 3, unless: 'vigilDown' }] : [{ type: 'engine', x: 12, y: 2, state: 'on' }]),
      ],
      npcs: foes.map(([id, sprite, x, y, group]) => ({ id, name: 'Boarders', sprite, x, y, dir: 'down', talk: 'armadaFight', group, unless: 'af_' + id, alwaysAnim: sprite === 'mite' })),
      events: [
        ...(n === 1 ? [{ id: 'in', on: 'auto', run: 'armadaIn', once: true }] : []),
        ...(n < 3 ? [{ id: 'next', on: 'step', x: 27, y: 6, h: 2, run: 'armadaNext', to: n + 1 }] : []),
        ...(n > 1 ? [{ id: 'back', on: 'step', x: 0, y: 6, h: 2, run: 'armadaNext', to: n - 1, back: true }] : []),
        ...(n === 3 ? [{ id: 'boss', on: 'step', x: 8, y: 2, h: 10, run: 'vigilBoss', unless: 'vigilDown' }] : []),
      ],
    }];
  })),

  // ---------------------------------------------------------------- Albrook (the Silent Hour)
  albrook: (() => {
    const g = new Grid(32, 26, '.');
    g.top(3).rect(0, 0, 0, 25, '#').rect(31, 0, 31, 25, '#').rect(0, 22, 31, 25, 'w').rect(13, 22, 18, 25, 'b');
    g.path([[15, 21], [15, 4]], ',', 2).path([[3, 12], [28, 12]], ',').path([[2, 20], [29, 20]], 'b');
    return {
      name: 'Albrook', theme: 'port', music: (f) => (f.silentHour && !f.act3Done ? 'stillness' : 'town'), region: 'sea', weather: 'ash', shadow: '#3A2418',
      rows: g.rows(),
      props: [
        { type: 'house', x: 3, y: 9, state: 'brick' }, { type: 'house', x: 9, y: 9, state: 'navy' }, { id: 'marenHome', type: 'house', x: 20, y: 9, state: 'blue' },
        { type: 'house', x: 25, y: 9, state: 'brick' }, { type: 'house', x: 4, y: 17, state: 'grey' }, { type: 'house', x: 24, y: 17, state: 'navy' },
        { type: 'lamppost', x: 13, y: 14 }, { type: 'lamppost', x: 18, y: 14 }, { type: 'boat', x: 4, y: 23 }, { type: 'boat', x: 23, y: 23 },
        { type: 'stall', x: 10, y: 15, state: 'navy' }, { type: 'barrel', x: 20, y: 19 }, { type: 'crate', x: 21, y: 19 },
      ],
      npcs: [
        { id: 'st1', name: 'Townsfolk', sprite: 'woman', x: 7, y: 13, lying: true, stilled: true, talk: 'albrookStilled', flag: 'silentHour', unless: 'stilledWake' },
        { id: 'st2', name: 'Townsfolk', sprite: 'man', x: 22, y: 14, lying: true, stilled: true, talk: 'albrookStilled', flag: 'silentHour', unless: 'stilledWake' },
        { id: 'st3', name: 'Child', sprite: 'mina', x: 12, y: 17, lying: true, stilled: true, talk: 'albrookStilled', flag: 'silentHour', unless: 'stilledWake' },
        { id: 'st4', name: 'Dockhand', sprite: 'manB', x: 26, y: 20, lying: true, stilled: true, talk: 'albrookStilled', flag: 'silentHour', unless: 'stilledWake' },
        { id: 'st5', name: 'Old woman', sprite: 'oldwoman', x: 21, y: 11, lying: true, stilled: true, talk: 'marenMother', flag: 'silentHour', unless: 'stilledWake' },
        { id: 'g1', name: 'Hush Guard', sprite: 'hush', x: 14, y: 6, dir: 'down', talk: 'albrookHush', group: ['silentChoir', 'hushGunner'], flag: 'silentHour', unless: 'ah_g1' },
        { id: 'g2', name: 'Hush Guard', sprite: 'hushB', x: 17, y: 6, dir: 'down', talk: 'albrookHush', group: ['silentChoir', 'silentChoir'], flag: 'silentHour', unless: 'ah_g2' },
      ],
      events: [
        ...edgeExits(32, 26, ['bottom']),
        { id: 'in', on: 'auto', run: 'albrookIn', once: true, flag: 'silentHour' },
      ],
    };
  })(),

  // ---------------------------------------------------------------- Zozo and the Sanctum of the Hush
  zozo: (() => {
    const g = new Grid(30, 26, '.');
    g.top(3).rect(0, 0, 1, 25, '#').rect(28, 0, 29, 25, '#').rect(0, 24, 29, 25, '#').rect(13, 24, 16, 25, ',');
    g.path([[14, 23], [14, 8]], ',', 2);
    return {
      name: 'Zozo', theme: 'zozo', music: 'hush', region: 'central', weather: 'ash', shadow: '#140C14',
      rows: g.rows(),
      props: [
        { id: 'cath', type: 'cathedral', x: 11, y: 7 }, { type: 'house', x: 2, y: 12, state: 'grey' }, { type: 'house', x: 22, y: 12, state: 'grey' },
        { type: 'house', x: 2, y: 21, state: 'grey' }, { type: 'house', x: 23, y: 21, state: 'grey' },
        { type: 'lamppost', x: 12, y: 15, state: 'off' }, { type: 'lamppost', x: 17, y: 15, state: 'off' }, { type: 'deadTree', x: 9, y: 19 }, { type: 'deadTree', x: 20, y: 19 },
        { id: 'c1', type: 'chest', x: 26, y: 15 },
      ],
      npcs: [
        lines('z1', 'hush', 8, 15, 'Acolyte', ['...', { if: 'sanctumDone', say: ['(The acolyte stares at the ground. It is no longer sure what it is waiting for.)'] }], { dir: 'right' }),
        lines('z2', 'hushB', 21, 15, 'Acolyte', ['(It raises a finger to its veiled lips.)'], { dir: 'left' }),
      ],
      events: [
        ...edgeExits(30, 26, ['bottom']),
        { id: 'in', on: 'auto', run: 'zozoIn', once: true },
        { id: 'door', on: 'door', x: 13, y: 7, run: 'enterSanctum' },
        { id: 'door2', on: 'door', x: 14, y: 7, run: 'enterSanctum' },
        { id: 'door3', on: 'door', x: 15, y: 7, run: 'enterSanctum' },
        { id: 'tc1', on: 'talk', x: 26, y: 15, run: 'chest', item: 'xTonic', n: 2, prop: 'c1' },
      ],
    };
  })(),

  sanctum: (() => {
    const g = carve(40, 36, [
      [16, 30, 23, 35], [3, 25, 36, 29], // nave and transept
      [3, 8, 8, 24], [17, 12, 22, 24], [31, 8, 36, 24], // three wings
      [14, 1, 25, 5], // inner sanctum
    ], 0.6);
    g.rect(19, 6, 20, 11, '.'); // the central gate passage, sealed until all three switches are thrown
    return {
      name: 'Sanctum of the Hush', theme: 'zozo', music: 'hush', region: 'central', dark: 1, playerLight: 56, shadow: '#140C14',
      rows: g.rows(),
      blocks: [{ x: 19, y: 11, unless: 'gateOpen' }, { x: 20, y: 11, unless: 'gateOpen' }],
      props: [
        { type: 'pillar', x: 16, y: 26 }, { type: 'pillar', x: 23, y: 26 }, { type: 'pillar', x: 9, y: 26 }, { type: 'pillar', x: 30, y: 26 },
        { type: 'banner', x: 12, y: 25, state: 'grey' }, { type: 'banner', x: 27, y: 25, state: 'grey' },
        { id: 'sw1', type: 'crystal', x: 5, y: 9, state: 'glass' }, { id: 'sw2', type: 'crystal', x: 19, y: 13, state: 'glass' }, { id: 'sw3', type: 'crystal', x: 33, y: 9, state: 'glass' },
        { id: 'gate', type: 'sealedDoor', x: 19, y: 11, unless: 'gateOpen' }, { type: 'throne', x: 19, y: 2 },
        { id: 'c1', type: 'chest', x: 3, y: 23 }, { id: 'c2', type: 'chest', x: 36, y: 23 },
      ],
      npcs: [
        { id: 'k1', name: 'Hush Zealots', sprite: 'hushB', x: 5, y: 18, dir: 'down', talk: 'sanctumFight', group: ['silentChoir', 'hushZealot'], unless: 'sk_k1' },
        { id: 'k2', name: 'Hush Gunners', sprite: 'soldierB', x: 19, y: 18, dir: 'down', talk: 'sanctumFight', group: ['hushGunner', 'hushGunner'], unless: 'sk_k2' },
        { id: 'k3', name: 'Hush Choir', sprite: 'hush', x: 34, y: 18, dir: 'down', talk: 'sanctumFight', group: ['silentChoir', 'silentChoir'], unless: 'sk_k3' },
        { id: 'ostrander', name: 'Brother Ostrander', sprite: 'ostrander', x: 19, y: 3, dir: 'down', talk: 'ostranderSermon', unless: 'sanctumDone' },
      ],
      events: [
        { id: 'out', on: 'step', x: 16, y: 35, w: 8, run: 'leaveSanctum' },
        { id: 'in', on: 'auto', run: 'sanctumIn', once: true },
        { id: 'laneL', on: 'step', x: 3, y: 24, w: 6, run: 'sanctumTeam', lane: 'L' },
        { id: 'laneC', on: 'step', x: 17, y: 24, w: 6, run: 'sanctumTeam', lane: 'C' },
        { id: 'laneR', on: 'step', x: 31, y: 24, w: 6, run: 'sanctumTeam', lane: 'R' },
        { id: 's1', on: 'talk', x: 5, y: 9, run: 'sanctumSwitch', n: 1 },
        { id: 's2', on: 'talk', x: 19, y: 13, run: 'sanctumSwitch', n: 2 },
        { id: 's3', on: 'talk', x: 33, y: 9, run: 'sanctumSwitch', n: 3 },
        { id: 'tc1', on: 'talk', x: 3, y: 23, run: 'chest', gear: 'heroRing', prop: 'c1' },
        { id: 'tc2', on: 'talk', x: 36, y: 23, run: 'chest', item: 'elixir', prop: 'c2' },
      ],
      encounter: { groups: [['silentChoir'], ['hushZealot', 'hushZealot'], ['hushGunner', 'silentChoir']], bg: 'sanctum', offFlag: 'sanctumDone' },
    };
  })(),
};
