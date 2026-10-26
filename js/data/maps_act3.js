// Act III maps: Maranda under siege, the Zone Eater, Terra's dream, the Cradle — plus the
// changes Act III makes to places visited before (who waits where after the Quieting).
import { Grid, carve, edgeExits, shopkeeper, innkeeper, npc } from './mapkit.js';

const lines = (id, sprite, x, y, name, ls, o = {}) => npc(id, sprite, x, y, 'lines', { name, lines: ls, ...o });

export const ACT3_MAPS = {
  // ---------------------------------------------------------------- Maranda (a town in Act II, a siege in Act III)
  maranda: (() => {
    const g = new Grid(30, 26, '.');
    g.top(3).rect(0, 0, 0, 25, '#').rect(29, 0, 29, 25, '#').rect(0, 24, 29, 25, '#').rect(13, 24, 16, 25, ',');
    g.path([[14, 23], [14, 4]], ',', 2).path([[3, 10], [26, 10]], ',');
    return {
      name: 'Maranda', theme: 'desert', music: (f) => (f.act3 && !f.marandaFreed ? 'tension' : 'town'), region: 'central', weather: 'dust', shadow: '#584428',
      rows: g.rows(),
      props: [
        { type: 'house', x: 2, y: 8, state: 'brick' }, { type: 'house', x: 8, y: 8, state: 'brick' }, { type: 'house', x: 18, y: 8, state: 'brick' }, { type: 'house', x: 24, y: 8, state: 'brick' },
        { type: 'house', x: 2, y: 21, state: 'grey' }, { type: 'house', x: 24, y: 21, state: 'grey' },
        { type: 'stall', x: 9, y: 12, state: 'navy' }, { type: 'sign2', x: 19, y: 12, state: 'inn' }, { type: 'well', x: 20, y: 16 },
        ...[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26].map((x) => ({ type: 'crate', x, y: 14, flag: 'act3', unless: 'marandaFreed' })),
        { type: 'rubble', x: 6, y: 18 }, { type: 'rubble', x: 22, y: 19 },
      ],
      npcs: [
        shopkeeper('mshop', 10, 13, 'nikeah', 'manB'),
        innkeeper('minn', 20, 13, 100, 'woman'),
        lines('m1', 'soldierB', 6, 12, 'Veteran', ['I served the Empire twenty years. Now I sweep streets. Better work, honestly.', { if: 'act3', say: ['The General held the gate three days with eleven of us. Eleven!'] }], { unless: 'never' }),
        lines('m2', 'oldwoman', 23, 16, 'Widow', ['My boy went to the Hush. Said the world deserved to end. I told him to come home for supper.', { if: 'marandaFreed', say: ['He came home. He threw that grey cloth in the fire himself.'] }]),
        { id: 'celesM', name: 'Celes', sprite: 'celes', x: 14, y: 12, dir: 'down', talk: 'marandaCeles', flag: 'act3', unless: 'celesJoined3' },
        { id: 'marenM', name: 'Maren', sprite: 'maren', x: 15, y: 12, dir: 'down', talk: 'marandaCeles', flag: 'act3', unless: 'celesJoined3' },
        { id: 'sg1', name: 'Hush Siege', sprite: 'soldier', x: 6, y: 19, dir: 'up', talk: 'siegeFight', group: ['siegebreaker', 'hushGunner'], flag: 'act3', unless: 'sg_sg1' },
        { id: 'sg2', name: 'Hush Siege', sprite: 'hushB', x: 14, y: 17, dir: 'up', talk: 'siegeFight', group: ['silentChoir', 'silentChoir', 'hushGunner'], flag: 'act3', unless: 'sg_sg2' },
        { id: 'sg3', name: 'Hush Siege', sprite: 'soldier', x: 22, y: 18, dir: 'up', talk: 'siegeFight', group: ['siegebreaker', 'siegebreaker'], flag: 'act3', unless: 'sg_sg3' },
      ],
      blocks: [{ x: 14, y: 14, flag: 'act3', unless: 'marandaFreed' }, { x: 15, y: 14, flag: 'act3', unless: 'marandaFreed' }],
      events: [
        ...edgeExits(30, 26, ['bottom']),
        { id: 'in', on: 'auto', run: 'marandaIn', once: true, flag: 'act3' },
      ],
    };
  })(),

  // ---------------------------------------------------------------- the Zone Eater (Gogo)
  zoneEater: (() => {
    const g = carve(24, 32, [[8, 26, 15, 31], [10, 18, 13, 25], [3, 12, 20, 17], [3, 4, 7, 11], [16, 4, 20, 11], [8, 1, 15, 6]], 0.2);
    return {
      name: 'Zone Eater', theme: 'tunnel', music: 'nightmare', region: 'north', dark: 1, playerLight: 50, shadow: '#2A2018',
      rows: g.rows(),
      props: [
        { type: 'bones', x: 5, y: 14, flat: true }, { type: 'bones', x: 18, y: 15, flat: true }, { type: 'rubble', x: 12, y: 21 },
        { type: 'lantern', x: 8, y: 26 }, { type: 'lantern', x: 15, y: 26 }, { id: 'c1', type: 'chest', x: 4, y: 5 }, { id: 'c2', type: 'chest', x: 19, y: 5 },
      ],
      npcs: [{ id: 'gogo', name: '???', sprite: 'gogo', x: 11, y: 2, dir: 'down', talk: 'gogoMeet', unless: 'gogoJoined' }],
      events: [
        { id: 'out', on: 'step', x: 8, y: 31, w: 8, run: 'toWorld' },
        { id: 'in', on: 'auto', run: 'zoneIn', once: true },
        { id: 'tc1', on: 'talk', x: 4, y: 5, run: 'chest', gear: 'ribbon', prop: 'c1' },
        { id: 'tc2', on: 'talk', x: 19, y: 5, run: 'chest', item: 'elixir', prop: 'c2' },
      ],
      encounter: { groups: [['stalker'], ['crawler', 'crawler'], ['stalker', 'crawler']], bg: 'mine' },
    };
  })(),

  // ---------------------------------------------------------------- Terra's dream (the World of Balance)
  dream: (() => {
    const g = new Grid(32, 34, '.');
    g.rect(0, 0, 31, 1, '#').rect(0, 0, 0, 33, '#').rect(31, 0, 31, 33, '#').rect(0, 32, 31, 33, '#');
    g.scatter('"', 0.22, 31).scatter('g', 0.12, 32);
    g.rect(1, 16, 30, 17, 'w').rect(14, 16, 17, 17, 'b');
    g.path([[15, 31], [15, 3]], ',', 2);
    return {
      name: 'Somewhere Green', theme: 'dream', music: 'dream', region: 'west', weather: 'pollen', shadow: '#3A5A2A',
      rows: g.rows(),
      props: [
        { type: 'tree', x: 4, y: 6 }, { type: 'tree', x: 9, y: 4 }, { type: 'tree', x: 24, y: 5 }, { type: 'tree', x: 27, y: 9 }, { type: 'tree', x: 5, y: 24 },
        { type: 'tree', x: 25, y: 26 }, { type: 'tree', x: 20, y: 21 }, { type: 'tree', x: 9, y: 28 }, { type: 'cottage', x: 3, y: 12 }, { type: 'well', x: 22, y: 12 },
        { type: 'fence', x: 10, y: 22 }, { type: 'fence', x: 11, y: 22 }, { type: 'fence', x: 12, y: 22 },
      ],
      npcs: [
        { id: 'terraD', name: 'Terra', sprite: 'terra', x: 16, y: 20, dir: 'up', talk: 'dreamTerra', unless: 'dreamTerraMet' },
        { id: 'valtheia', name: 'Valtheia', sprite: 'valtheia', x: 15, y: 4, dir: 'down', talk: 'dreamValtheia', flag: 'dreamTerraMet', unless: 'm14Done' },
      ],
      events: [
        { id: 'in', on: 'auto', run: 'dreamIn', once: true },
      ],
    };
  })(),

  // ---------------------------------------------------------------- the Cradle (final dungeon)
  cradle: (() => {
    const g = carve(44, 46, [
      [19, 42, 24, 45], [3, 38, 40, 41], // gate and the root-hall
      [3, 6, 10, 37], [18, 10, 25, 37], [34, 6, 37, 37], // Mercy, Memory, Rest
      [17, 1, 26, 8], // the heart chamber's door
    ], 0.5);
    g.rect(21, 9, 22, 9, '.');
    g.rect(4, 20, 9, 22, '"').rect(19, 26, 24, 28, '"').rect(34, 14, 37, 16, '"');
    return {
      name: 'The Cradle', theme: 'garden', music: 'cradle', region: 'central', weather: 'pollen', shadow: '#6E6858',
      rows: g.rows(),
      blocks: [{ x: 21, y: 9, unless: 'coreOpen' }, { x: 22, y: 9, unless: 'coreOpen' }],
      props: [
        { id: 'gate', type: 'sealedDoor', x: 21, y: 9, unless: 'coreOpen' },
        { type: 'column', x: 4, y: 39 }, { type: 'column', x: 39, y: 39 }, { type: 'crystal', x: 12, y: 39, state: 'glass' }, { type: 'crystal', x: 31, y: 39, state: 'glass' },
        { type: 'tree', x: 4, y: 30 }, { type: 'tree', x: 9, y: 14 }, { type: 'tree', x: 19, y: 18 }, { type: 'tree', x: 24, y: 32 },
        { id: 'sw1', type: 'echoPoint', x: 6, y: 7, flat: true }, { id: 'sw2', type: 'echoPoint', x: 21, y: 11, flat: true }, { id: 'sw3', type: 'echoPoint', x: 35, y: 7, flat: true },
        { id: 'amenF', type: 'amenFig', x: 18, y: 16, unless: 'amenDown' },
        { id: 'c1', type: 'chest', x: 3, y: 36 }, { id: 'c2', type: 'chest', x: 25, y: 36 }, { id: 'c3', type: 'chest', x: 37, y: 36 },
        { id: 'seraphS', type: 'seraphCircle', x: 30, y: 39, flag: 'seraphsSeven' },
      ],
      npcs: [
        { id: 'ostrander', name: 'Brother Ostrander', sprite: 'ostrander', x: 6, y: 9, dir: 'down', talk: 'mercyPath', unless: 'ostranderDone' },
        { id: 'il1', name: 'Rachel', sprite: 'rachel', x: 35, y: 30, dir: 'down', talk: 'restIllusion', who: 'rachel', unless: 'ill_rachel' },
        { id: 'il2', name: 'Elayne', sprite: 'elayne', x: 36, y: 24, dir: 'down', talk: 'restIllusion', who: 'elayne', unless: 'ill_elayne' },
        { id: 'il3', name: 'Darill', sprite: 'darill', x: 35, y: 18, dir: 'down', talk: 'restIllusion', who: 'darill', unless: 'ill_darill' },
        { id: 'il4', name: 'Maduin', sprite: 'maduin', x: 36, y: 11, dir: 'down', talk: 'restIllusion', who: 'maduin', unless: 'ill_maduin' },
        { id: 'shadowC', name: 'Shadow', sprite: 'shadow', x: 26, y: 40, dir: 'left', talk: 'shadowCradle', flag: 'shadowPromise', unless: 'shadowJoined' },
      ],
      events: [
        { id: 'out', on: 'step', x: 19, y: 45, w: 6, run: 'leaveCradle' },
        { id: 'in', on: 'auto', run: 'cradleIn', once: true },
        { id: 'laneL', on: 'step', x: 3, y: 37, w: 8, run: 'cradleTeam', lane: 'L' },
        { id: 'laneC', on: 'step', x: 18, y: 37, w: 8, run: 'cradleTeam', lane: 'C' },
        { id: 'laneR', on: 'step', x: 34, y: 37, w: 4, run: 'cradleTeam', lane: 'R' },
        { id: 'rest1', on: 'step', x: 34, y: 31, w: 4, run: 'restIllusion', who: 'rachel', unless: 'ill_rachel' },
        { id: 'rest2', on: 'step', x: 34, y: 25, w: 4, run: 'restIllusion', who: 'elayne', unless: 'ill_elayne' },
        { id: 'rest3', on: 'step', x: 34, y: 19, w: 4, run: 'restIllusion', who: 'darill', unless: 'ill_darill' },
        { id: 'rest4', on: 'step', x: 34, y: 12, w: 4, run: 'restIllusion', who: 'maduin', unless: 'ill_maduin' },
        { id: 'amen', on: 'step', x: 18, y: 20, w: 8, run: 'amenBoss', unless: 'amenDown' },
        { id: 'sw1', on: 'step', x: 6, y: 7, run: 'cradleSwitch', n: 1 },
        { id: 'sw2', on: 'step', x: 21, y: 11, run: 'cradleSwitch', n: 2 },
        { id: 'sw3', on: 'step', x: 35, y: 7, run: 'cradleSwitch', n: 3 },
        { id: 'core', on: 'step', x: 17, y: 1, w: 10, run: 'enterCore', flag: 'coreOpen' },
        { id: 'tc1', on: 'talk', x: 3, y: 36, run: 'chest', item: 'elixir', n: 2, prop: 'c1' },
        { id: 'tc2', on: 'talk', x: 25, y: 36, run: 'chest', gear: 'solaceShell', prop: 'c2' },
        { id: 'tc3', on: 'talk', x: 37, y: 36, run: 'chest', item: 'pinion', n: 3, prop: 'c3' },
        { id: 'seraph8', on: 'talk', x: 30, y: 39, w: 3, run: 'seraph', boss: 'seraphSilence', bg: 'garden', prop: 'seraphS', flag: 'seraphsSeven' },
      ],
      encounter: { groups: [['bloomHound', 'bloomHound'], ['gardener', 'thornChoir'], ['thornChoir', 'bloomHound'], ['gardener']], bg: 'garden', offFlag: 'solaceDown' },
    };
  })(),

  cradleCore: (() => {
    const g = carve(24, 18, [[3, 3, 20, 14], [10, 14, 13, 17]], 0.6);
    return {
      name: 'The Heart of SOLACE', theme: 'garden', music: 'solace', region: 'central', shadow: '#6E6858',
      rows: g.rows(),
      props: [{ id: 'heart', type: 'solaceFig', x: 9, y: 7 }, { type: 'crystal', x: 4, y: 4, state: 'glass' }, { type: 'crystal', x: 19, y: 4, state: 'glass' }, { type: 'column', x: 5, y: 12 }, { type: 'column', x: 18, y: 12 }],
      events: [{ id: 'final', on: 'auto', run: 'finalBattle', once: true }],
    };
  })(),
};

// Act III changes to earlier maps: who you find where after the Quieting.
export function patchAct3(MAPS) {
  const add = (id, o) => {
    const m = MAPS[id];
    if (!m) return;
    if (o.npcs) m.npcs = [...(m.npcs || []), ...o.npcs];
    if (o.events) m.events = [...(m.events || []), ...o.events];
    if (o.props) m.props = [...(m.props || []), ...o.props];
    if (o.blocks) m.blocks = [...(m.blocks || []), ...o.blocks];
  };
  const hideInAct3 = (id, ids) => { for (const n of MAPS[id].npcs || []) if (ids.includes(n.id) && !n.unless) n.unless = 'act3'; };

  // Figaro: Ilse wakes in a half-empty castle
  hideInAct3('figaro', ['chancellor', 'engineer', 'guard1', 'matron']);
  add('figaro', {
    npcs: [lines('nurse3', 'womanB', 3, 19, 'Nurse', ['You were out for seven days. You kept saying eleven names.'], { flag: 'act3', unless: 'act3Done' })],
    events: [
      { id: 'wake3', on: 'auto', run: 'act3Wake', once: true, flag: 'act3' },
      { id: 'skiff', on: 'talk', x: 23, y: 7, w: 3, run: 'repairSkiff', flag: 'act3', unless: 'skiffBuilt' },
    ],
  });
  // Mobliz: the children are awake after Act I; Terra sleeps in Act III
  for (const n of MAPS.mobliz.npcs) if (['pip', 'rowan', 'mina', 'tobin', 'duane'].includes(n.id)) n.unless = n.unless || 'lessonDone';
  add('mobliz', {
    npcs: [
      lines('pip2', 'pip', 11, 11, 'Pip', ['Terra! I had the longest dream. I was a flower.', { if: 'act3', say: ['Terra\'s asleep like I was. I\'m going to sit with her the way she sat with me.'] }], { flag: 'act1Done', wander: true }),
      lines('rowan2', 'rowan', 17, 12, 'Rowan', ['I\'m practising with a stick sword. Duane says I\'m a natural.', { if: 'act3', say: ['When Terra wakes up I\'m going to show her I protected everybody.'] }], { flag: 'act1Done', wander: true }),
      lines('duane2', 'duane', 9, 13, 'Duane', ['The crops are coming in, Terra. Real crops!', { if: 'act3', say: ['She threw herself over the whole village. Every one of us is awake because of her.'] }], { flag: 'act1Done' }),
    ],
  });
  for (const e of MAPS.house.events) if (['pip', 'pip2', 'rowan', 'rowan2', 'mina', 'mina2', 'tobin', 'tobin2'].includes(e.id)) e.unless = 'act1Done';
  for (const e of MAPS.mobliz.events) if (e.id.startsWith('crop')) e.unless = 'act1Done';
  add('house', {
    npcs: [
      { id: 'terraC', name: 'Terra', sprite: 'terra', x: 13, y: 7, lying: true, talk: 'terraComa', flag: 'act3', unless: 'm14Done' },
      { id: 'katC', name: 'Katarin', sprite: 'katarin', x: 11, y: 7, dir: 'right', talk: 'terraComa', flag: 'act3', unless: 'm14Done' },
    ],
  });
  // the Drowned Temple: Edgar, trapped while trying to fix the Wellspring
  add('drowned', {
    npcs: [{ id: 'edgarT', name: 'Edgar', sprite: 'edgar', x: 14, y: 8, dir: 'down', talk: 'edgarTrapped', flag: 'act3', unless: 'edgarJoined3' }],
    events: [{ id: 'rescue', on: 'step', x: 12, y: 20, w: 4, run: 'templeRescue', flag: 'act3', unless: 'rescueFought' }],
  });
  // the Veldt: Sabin and Gau lead refugees west
  add('veldt', {
    npcs: [
      { id: 'sabinV', name: 'Sabin', sprite: 'sabin', x: 40, y: 11, dir: 'left', talk: 'veldtEscort', flag: 'act3', unless: 'sabinJoined3' },
      { id: 'gauV', name: 'Gau', sprite: 'gau', x: 41, y: 12, dir: 'left', talk: 'veldtEscort', flag: 'act3', unless: 'sabinJoined3' },
      { id: 'ref1', name: 'Refugee', sprite: 'oldwoman', x: 43, y: 10, dir: 'left', talk: 'refugee', flag: 'act3', unless: 'veldtEscorted' },
      { id: 'ref2', name: 'Refugee', sprite: 'child', x: 43, y: 13, dir: 'left', talk: 'refugee', flag: 'act3', unless: 'veldtEscorted' },
    ],
  });
  // the Ashen Reach: Locke, searching the storm for Celes
  const ash = MAPS.ashen;
  ash.rows = ash.rows.map((r, y) => (y >= 8 && y <= 10 ? r.slice(0, 29) + '.' : r));
  add('ashen', {
    npcs: [{ id: 'lockeA', name: 'Locke', sprite: 'locke', x: 4, y: 13, dir: 'up', talk: 'lockeFound', flag: 'trackDone', unless: 'lockeJoined3' }],
    events: [
      { id: 'exitR', on: 'step', x: 29, y: 8, h: 3, run: 'toWorld' },
      { id: 'tr1', on: 'talk', x: 22, y: 9, run: 'lockeTrail', n: 1, flag: 'act3' },
      { id: 'tr1b', on: 'step', x: 22, y: 9, run: 'lockeTrail', n: 1, flag: 'act3' },
      { id: 'tr2', on: 'step', x: 15, y: 11, run: 'lockeTrail', n: 2, flag: 'act3' },
      { id: 'tr3', on: 'step', x: 9, y: 6, run: 'lockeTrail', n: 3, flag: 'act3' },
      { id: 'ash3', on: 'auto', run: 'ashenAct3', once: true, flag: 'act3' },
    ],
  });
  // Doma: Cyan guards the Stilled through the night
  add('doma', {
    npcs: [
      { id: 'cyanN', name: 'Cyan', sprite: 'cyan', x: 15, y: 12, dir: 'down', talk: 'domaNight', flag: 'act3', unless: 'cyanJoined3' },
      { id: 'dst1', name: 'Volunteer', sprite: 'manB', x: 9, y: 19, lying: true, stilled: true, talk: 'albrookStilled', flag: 'act3', unless: 'act3Done' },
      { id: 'dst2', name: 'Volunteer', sprite: 'womanB', x: 21, y: 19, lying: true, stilled: true, talk: 'albrookStilled', flag: 'act3', unless: 'act3Done' },
    ],
  });
  // Thamasa: Strago and Relm, painting a cure
  add('thamasa', {
    npcs: [
      { id: 'relmT', name: 'Relm', sprite: 'relm', x: 12, y: 4, dir: 'up', talk: 'relmPigments', flag: 'act3', unless: 'relmJoined3' },
      { id: 'stragoT', name: 'Strago', sprite: 'strago', x: 14, y: 5, dir: 'down', talk: 'relmPigments', flag: 'act3', unless: 'relmJoined3' },
    ],
  });
  // Narshe mines: a collapsed tunnel with Mog and Umaro behind it
  add('narsheMines', {
    npcs: [
      { id: 'mogM', name: 'Mog', sprite: 'mog', x: 19, y: 16, dir: 'down', talk: 'mogTrapped', flag: 'act3', unless: 'mogJoined3' },
      { id: 'umaroM', name: 'Umaro', sprite: 'umaro', x: 21, y: 16, dir: 'down', talk: 'mogTrapped', flag: 'act3', unless: 'mogJoined3' },
    ],
    props: [{ id: 'cavein', type: 'rubble', x: 19, y: 20, flag: 'act3', unless: 'tunnelClear' }],
    blocks: [18, 19, 20].map((x) => ({ x, y: 20, flag: 'act3', unless: 'tunnelClear' })),
    events: [{ id: 'cavein', on: 'talk', x: 18, y: 20, w: 3, run: 'clearTunnel', flag: 'act3', unless: 'tunnelClear' }],
  });
  // Esper Ruins: Dalia, lost inside an Echo
  add('esperRuins', {
    npcs: [{ id: 'daliaE', name: 'Dalia', sprite: 'dalia', x: 15, y: 3, lying: true, talk: 'daliaLost', flag: 'act3', unless: 'daliaJoined3' }],
  });
  // the Falcon, grounded: Setzer drinks alone on the deck
  add('falconDeck', {
    npcs: [{ id: 'setzerH3', name: 'Setzer', sprite: 'setzer', x: 18, y: 9, dir: 'left', talk: 'setzerHangar', flag: 'act3', unless: 'setzerJoined3' }],
    props: [{ id: 'logCrate', type: 'chest', x: 4, y: 9, flag: 'act3' }],
    events: [
      { id: 'log', on: 'talk', x: 4, y: 9, run: 'darillLog', flag: 'act3', unless: 'gotDarillLog' },
      { id: 'leave3', on: 'step', x: 12, y: 11, w: 2, run: 'toWorld', flag: 'act3', unless: 'setzerJoined3' },
    ],
  });
  for (const n of MAPS.falconDeck.npcs) if (n.id === 'setzer') n.unless = 'act3';

  // Relm's three pigments, one from each restored region
  add('narsheMines', { events: [{ id: 'pigR', on: 'talk', x: 8, y: 13, w: 3, run: 'pigment', color: 'pigmentRed', flag: 'act3', unless: 'got_pigmentRed' }] });
  add('drowned', { events: [{ id: 'pigB', on: 'talk', x: 4, y: 28, w: 3, run: 'pigment', color: 'pigmentBlue', flag: 'act3', unless: 'got_pigmentBlue' }] });
  add('doma', { events: [{ id: 'pigG', on: 'talk', x: 27, y: 18, run: 'pigment', color: 'pigmentGreen', flag: 'act3', unless: 'got_pigmentGreen' }] });
}
