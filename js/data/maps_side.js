// Side content: the remaining towns, the Colosseum and Shadow's cave — plus the optional pieces
// scattered through earlier maps (Seraphs, Interceptor sightings, Echo points, quest objects).
import { Grid, carve, edgeExits, shopkeeper, innkeeper, npc } from './mapkit.js';

const lines = (id, sprite, x, y, name, ls, o = {}) => npc(id, sprite, x, y, 'lines', { name, lines: ls, ...o });

// A 30x24 town: walls on three sides, an exit at the bottom centre, a cross of paths.
function town(o) {
  const g = new Grid(30, 24, '.');
  g.top(o.top || 3).rect(0, 0, 0, 23, '#').rect(29, 0, 29, 23, '#').rect(0, 22, 29, 23, '#').rect(13, 22, 16, 23, ',');
  g.path([[14, 21], [14, o.top || 3]], ',', 2).path([[2, o.cross || 12], [27, o.cross || 12]], ',');
  if (o.grid) o.grid(g);
  return {
    name: o.name, theme: o.theme, music: o.music || 'town', region: o.region, weather: o.weather, shadow: o.shadow || '#3A2418',
    rows: g.rows(), props: o.props || [], npcs: o.npcs || [], blocks: o.blocks,
    events: [...edgeExits(30, 24, ['bottom']), ...(o.events || [])],
  };
}
const H = (x, y, state, type = 'house') => ({ type, x, y, state });
const echo = (id, x, y, memory, shard) => [{ id, type: 'echoPoint', x, y, flat: true }, { id, on: 'step', x, y, run: 'echoPoint', memory, shard, prop: id }];
const sighting = (n, x, y) => ({ id: 'int' + n, name: 'Interceptor', sprite: 'interceptor', x, y, dir: 'down', talk: 'interceptor', n, flag: 'act2', unless: 'int_' + n, alwaysAnim: true });
const page = (n, x, y) => [{ id: 'cid' + n, type: 'chest', x, y, flag: 'act2' }, { id: 'cid' + n, on: 'talk', x, y, run: 'cidPage', n, flag: 'act2', unless: 'cid_' + n, prop: 'cid' + n }];
const split = (pairs) => ({ props: pairs.map((p) => p[0]), events: pairs.map((p) => p[1]) });

export const SIDE_MAPS = {
  southFigaro: (() => {
    const e = split([echo('eSF', 24, 17, 'A bird of fire spreads its wings over a battlefield, and the fallen stand up, blinking, as if from a nap.', 'phoenix'), page(1, 27, 6)]);
    return town({
      name: 'South Figaro', theme: 'port', region: 'sea', weather: (f) => (f.wsWind ? null : 'ash'),
      grid: (g) => g.rect(1, 18, 28, 21, 'w').rect(13, 18, 16, 21, 'b'),
      props: [H(3, 9, 'red'), H(9, 9, 'navy'), H(19, 9, 'blue'), H(24, 9, 'red'), { type: 'stall', x: 9, y: 14, state: 'navy' }, { type: 'sign2', x: 20, y: 14, state: 'inn' },
        { type: 'boat', x: 4, y: 19 }, { type: 'boat', x: 22, y: 19 }, { type: 'lamppost', x: 12, y: 15 }, { type: 'lamppost', x: 17, y: 15 }, ...e.props],
      npcs: [
        shopkeeper('sfShop', 10, 15, 'figaro', 'manB'), innkeeper('sfInn', 20, 15, 70, 'woman'),
        lines('sf1', 'man', 6, 13, 'Dockhand', ['Ships stay docked. The water burns your hands.', { if: 'wsTides', say: ['Clean water! The fleet sails tomorrow! First time in a year!'] }]),
        lines('sf2', 'womanB', 23, 13, 'Merchant', ['Grey-veiled folk came through last week asking about the harbour. Never said a word, just pointed.']),
        { id: 'sfLetter', name: 'Fisherman\'s Widow', sprite: 'oldwoman', x: 5, y: 16, dir: 'right', talk: 'domaLetter', n: 1 },
        { id: 'sfIlse', name: 'Old Sailor', sprite: 'oldman', x: 25, y: 16, dir: 'left', talk: 'elevenNames', n: 1 },
        sighting(1, 27, 15),
      ],
      events: e.events,
    });
  })(),

  kohlingen: (() => {
    const e = split([echo('eKo', 4, 18, 'A small woman made of jewels sits on a man\'s shoulder and laughs every time he trips.', null), page(2, 26, 19)]);
    return town({
      name: 'Kohlingen', theme: 'mobliz', region: 'west', weather: (f) => (f.wsWind ? null : 'ash'), shadow: '#453E26',
      props: [H(3, 9, 'grey'), H(9, 9, 'grey'), { id: 'ruin', type: 'ruinWall', x: 22, y: 8 }, { id: 'lockeHome', type: 'frameHouse', x: 18, y: 18, state: (f) => (f.lockeHouse ? 'done' : null) },
        { type: 'grave', x: 6, y: 17, state: 'flowers' }, { type: 'deadTree', x: 9, y: 16 }, { type: 'tree', x: 26, y: 14 }, { id: 'letters', type: 'chest', x: 24, y: 6 }, { id: 'sword', type: 'chest', x: 2, y: 13 }, ...e.props],
      npcs: [
        shopkeeper('koShop', 11, 13, 'narshe', 'manB'), innkeeper('koInn', 17, 13, 60, 'womanB'),
        { id: 'rachelDad', name: 'Rachel\'s Father', sprite: 'oldman', x: 4, y: 14, dir: 'down', talk: 'rachelFamily' },
        lines('ko1', 'woman', 21, 13, 'Neighbour', ['Locke\'s building that house on the hill one plank at a time. For the General, folks say.', { if: 'lockeHouse', say: ['They finished the house! There was cake. Real cake.'] }]),
        sighting(2, 27, 10),
      ],
      events: [
        ...e.events,
        { id: 'grave', on: 'talk', x: 6, y: 17, run: 'rachelGrave' },
        { id: 'letters', on: 'talk', x: 24, y: 6, run: 'rachelLetters', flag: 'act2', prop: 'letters' },
        { id: 'sword', on: 'talk', x: 2, y: 13, run: 'costume', costume: 'sword', prop: 'sword', flag: 'playStarted' },
        { id: 'wreck1', on: 'talk', x: 22, y: 8, w: 2, run: 'crashSite', n: 1 },
      ],
    });
  })(),

  jidoor: (() => {
    const e = split([echo('eJi', 25, 17, 'A tiny green beast with a ruby on its brow throws up a shimmering wall, and arrows bounce away like rain.', 'carbuncle'), page(3, 3, 5)]);
    return town({
      name: 'Jidoor', theme: 'mural', region: 'west', weather: (f) => (f.wsWind ? null : 'ash'), shadow: '#453E26',
      props: [H(10, 7, 'plum', 'castle'), H(3, 17, 'plum'), H(23, 17, 'plum'), { type: 'statue', x: 12, y: 15 }, { type: 'statue', x: 17, y: 15 },
        { type: 'stall', x: 5, y: 13, state: 'plum' }, { type: 'stall', x: 22, y: 13, state: 'plum' }, { id: 'cape', type: 'chest', x: 27, y: 4 }, ...e.props],
      npcs: [
        shopkeeper('jiShop', 6, 14, 'jidoor', 'manB'), innkeeper('jiInn', 23, 14, 150, 'woman'),
        lines('owzer', 'oldman', 15, 9, 'Owzer', ['Owzer pays for the rebuilding, and Owzer expects receipts! ...And perhaps a little gratitude.', { if: 'act3', say: ['Half my servants are Stilled. I sit with them. Money buys nothing worth having, it turns out.'] }], { dir: 'down' }),
        { id: 'jiLetter', name: 'Soldier\'s Mother', sprite: 'womanB', x: 8, y: 18, dir: 'right', talk: 'domaLetter', n: 2 },
        sighting(3, 2, 10),
      ],
      events: [...e.events, { id: 'cape', on: 'talk', x: 27, y: 4, run: 'costume', costume: 'cape', prop: 'cape', flag: 'playStarted' }],
    });
  })(),

  opera: (() => {
    const g = new Grid(22, 18, '.');
    g.top(3).rect(0, 0, 0, 17, '#').rect(21, 0, 21, 17, '#').rect(0, 16, 21, 17, '#').rect(9, 16, 12, 17, 'x');
    g.rect(3, 3, 18, 6, 'x'); // the stage
    g.rect(9, 7, 12, 15, 'x');
    const e = split([echo('eOp', 3, 13, 'A grand opera house before the war. A young woman in white sings to an empty hall, practising, and a dragon listens at the window.', null)]);
    return {
      name: 'Opera House', theme: 'archive', music: 'celes', region: 'west', shadow: '#1E1418',
      rows: g.rows(),
      props: [{ type: 'banner', x: 3, y: 3, state: 'red' }, { type: 'banner', x: 18, y: 3, state: 'red' }, { type: 'column', x: 2, y: 9 }, { type: 'column', x: 19, y: 9 },
        ...[4, 5, 6, 7, 14, 15, 16, 17].map((x) => ({ type: 'table', x, y: 10 })), { id: 'seraphO', type: 'seraphCircle', x: 9, y: 4 }, ...e.props],
      npcs: [
        { id: 'impresario', name: 'Impresario', sprite: 'manB', x: 10, y: 8, dir: 'down', talk: 'impresario' },
        lines('op1', 'woman', 15, 13, 'Stagehand', ['The rigging in the rafters hums at night. The Impresario says it\'s the wind. It is not the wind.']),
        sighting(4, 19, 14),
      ],
      events: [
        { id: 'out', on: 'step', x: 9, y: 17, w: 4, run: 'toWorld' },
        { id: 'seraph7', on: 'talk', x: 9, y: 4, w: 3, run: 'seraph', boss: 'seraphSong', bg: 'town', prop: 'seraphO' },
        ...e.events,
      ],
    };
  })(),

  solitary: (() => {
    const g = new Grid(24, 18, 'w');
    g.rect(3, 3, 20, 15, '.').rect(2, 5, 21, 13, '.').rect(1, 16, 22, 17, 'w');
    g.rect(10, 14, 13, 17, 'b');
    const e = split([echo('eSo', 18, 6, 'A whale the size of an island sings to a lonely shore. The waves keep time.', 'bismarck'), page(6, 4, 4)]);
    return {
      name: 'Solitary Island', theme: 'beach', music: 'lullaby', region: 'sea', shadow: '#2A2826',
      rows: g.rows(),
      props: [{ id: 'cidHouse', type: 'cottage', x: 8, y: 7 }, { type: 'palm', x: 4, y: 9 }, { type: 'palm', x: 18, y: 10 }, { type: 'palm', x: 15, y: 4 },
        { type: 'grave', x: 6, y: 12, flag: 'cidLost' }, { type: 'boat', x: 3, y: 15 }, { id: 'wreck2', type: 'rubble', x: 19, y: 13 }, ...e.props],
      npcs: [{ id: 'cid', name: 'Cid', sprite: 'cid', x: 12, y: 10, dir: 'down', talk: 'cidReunion', flag: 'cidAlive' }, sighting(5, 20, 8)],
      events: [
        { id: 'out', on: 'step', x: 10, y: 17, w: 4, run: 'toWorld' },
        { id: 'sunrise', on: 'step', x: 2, y: 5, h: 9, run: 'sevenSunrise' },
        { id: 'wreck2', on: 'talk', x: 19, y: 13, run: 'crashSite', n: 2 },
        { id: 'cidDoor', on: 'door', x: 9, y: 7, run: 'cidHouse' },
        { id: 'cidDoor2', on: 'door', x: 10, y: 7, run: 'cidHouse' },
        ...e.events,
      ],
    };
  })(),

  tzen: (() => {
    const e = split([echo('eTz', 4, 18, 'A thunder-god in a war mask lowers his spear, refusing to fight for anyone ever again.', null)]);
    return town({
      name: 'Tzen', theme: 'desert', region: 'central', weather: (f) => (f.wsWind ? null : 'ash'), shadow: '#584428',
      props: [H(3, 9, 'brick'), H(9, 9, 'brick'), H(19, 9, 'brick'), H(24, 9, 'brick'), { id: 'facility', type: 'engine', x: 20, y: 17, state: (f) => (f.ult_celes ? null : 'on') }, { type: 'crate', x: 18, y: 18 },
        { type: 'well', x: 7, y: 15 }, { id: 'wreck3', type: 'rubble', x: 26, y: 15 }, ...e.props],
      npcs: [
        lines('tz1', 'soldierB', 10, 14, 'Veteran', ['Some of the old boys want to restart the research facility. With SOLACE parts. God help us.'], { unless: 'ult_celes' }),
        { id: 'loyalist', name: 'Colonel Varre', sprite: 'soldier', x: 21, y: 16, dir: 'down', talk: 'ironRose', flag: 'act2', unless: 'ult_celes' },
        { id: 'tzLetter', name: 'Blacksmith', sprite: 'miner', x: 5, y: 13, dir: 'right', talk: 'domaLetter', n: 3 },
        { id: 'tzIlse', name: 'Widow', sprite: 'womanB', x: 24, y: 13, dir: 'left', talk: 'elevenNames', n: 2 },
        sighting(6, 2, 7),
      ],
      events: [...e.events, { id: 'wreck3', on: 'talk', x: 26, y: 15, run: 'crashSite', n: 3 }],
    });
  })(),

  nikeah: (() => {
    const e = split([echo('eNi', 26, 6, 'A great old serpent coils in the deep, protecting a city of shells from something above.', null), page(4, 3, 6)]);
    return town({
      name: 'Nikeah', theme: 'port', region: 'sea', weather: (f) => (f.wsWind ? null : 'ash'),
      grid: (g) => g.rect(1, 18, 28, 21, 'w').rect(13, 18, 16, 21, 'b'),
      props: [H(3, 9, 'navy'), H(9, 9, 'green'), H(19, 9, 'navy'), H(24, 9, 'green'), { type: 'stall', x: 8, y: 14, state: 'green' }, { type: 'sign2', x: 21, y: 14, state: 'inn' },
        { type: 'boat', x: 5, y: 19 }, { type: 'boat', x: 21, y: 19 }, ...e.props],
      npcs: [
        shopkeeper('niShop', 9, 15, 'nikeah', 'manB'), innkeeper('niInn', 21, 15, 90, 'woman'),
        lines('ni1', 'man', 5, 13, 'Fisher', ['Can\'t eat anything from these waters.', { if: 'wsTides', say: ['Fish! Silver ones, big as your arm! I cried, I\'m not ashamed.'] }]),
        { id: 'niIlse', name: 'Young Wife', sprite: 'woman', x: 25, y: 16, dir: 'left', talk: 'elevenNames', n: 3 },
        lines('niMus', 'manB', 17, 16, 'Fiddler', ['I play for coins, when anyone has coins.', { if: 'mariaStarted', say: ['An orchestra for the opera? For Maria? Count me in!'] }]),
      ],
      events: [...e.events, { id: 'mus', on: 'talk', x: 17, y: 16, run: 'recruitMusician', n: 1, flag: 'mariaStarted' }],
    });
  })(),

  colosseum: (() => {
    const g = new Grid(26, 20, '#');
    g.rect(2, 3, 23, 17, '.').rect(6, 6, 19, 14, 'd').rect(11, 17, 14, 19, ',');
    const e = split([echo('eCo', 21, 4, 'Two gladiators of the old Empire bow to each other before a match, then laugh and share a drink instead.', null)]);
    return {
      name: 'Colosseum', theme: 'desert', music: 'boss', region: 'central', shadow: '#584428',
      rows: g.rows(),
      props: [{ type: 'column', x: 3, y: 4 }, { type: 'column', x: 22, y: 4 }, { type: 'column', x: 3, y: 15 }, { type: 'column', x: 22, y: 15 }, { type: 'banner', x: 8, y: 3, state: 'red' }, { type: 'banner', x: 17, y: 3, state: 'red' }, ...e.props],
      npcs: [{ id: 'general', name: 'General Rask', sprite: 'soldier', x: 12, y: 5, dir: 'down', talk: 'colosseum' }],
      events: [{ id: 'out', on: 'step', x: 11, y: 19, w: 4, run: 'toWorld' }, ...e.events],
    };
  })(),

  shadowCave: (() => {
    const g = carve(20, 18, [[7, 13, 12, 17], [4, 4, 15, 12]], 0.3);
    return {
      name: 'Hidden Cave', theme: 'tunnel', music: 'night', region: 'east', dark: 1, playerLight: 50, shadow: '#2A2018',
      rows: g.rows(),
      props: [{ type: 'tent', x: 6, y: 6 }, { type: 'lantern', x: 12, y: 5 }, { type: 'barrel', x: 14, y: 10 }],
      npcs: [{ id: 'shadow', name: 'Shadow', sprite: 'shadow', x: 9, y: 6, dir: 'down', talk: 'shadowCave', unless: 'shadowQuest' }],
      events: [{ id: 'out', on: 'step', x: 7, y: 17, w: 6, run: 'toWorld' }],
    };
  })(),
};

// Optional content layered onto earlier maps.
export function patchSide(MAPS) {
  const add = (id, o) => {
    const m = MAPS[id];
    if (!m) return;
    for (const k of ['npcs', 'events', 'props', 'blocks']) if (o[k]) m[k] = [...(m[k] || []), ...o[k]];
  };
  const seraph = (map, boss, x, y, bg) => add(map, {
    props: [{ id: 'sc_' + boss, type: 'seraphCircle', x, y, flag: 'act2' }],
    events: [{ id: 'sc_' + boss, on: 'talk', x, y, w: 3, run: 'seraph', boss, bg, prop: 'sc_' + boss, flag: 'act2' }],
  });
  // the Eight Seraphs (the eighth, Silence, waits in the Cradle; Song in the Opera House rafters)
  seraph('ashen', 'seraphAsh', 20, 13, 'wasteland');
  seraph('narsheCliffs', 'seraphFrost', 4, 28, 'snowfield');
  seraph('drowned', 'seraphCoral', 17, 23, 'drowned');
  seraph('domaCrypt', 'seraphThorns', 22, 17, 'forest');
  seraph('armada3', 'seraphGales', 18, 9, 'deck');
  seraph('figaro', 'seraphSand', 23, 20, 'desert');

  // Echo points across the world (24 in all, with those in the dungeons)
  const ep = (map, id, x, y, memory, shard) => add(map, { props: [{ id, type: 'echoPoint', x, y, flat: true }], events: [{ id, on: 'step', x, y, run: 'echoPoint', memory, shard, prop: id }] });
  ep('mobliz', 'eMo', 36, 22, 'An Esper with a gentle face watches a human woman hang laundry in this very field, long before Mobliz was built.');
  ep('hollowmere', 'eHo', 26, 20, 'A family eating supper. The Esper memory doesn\'t know why it kept this one. It just did.');
  ep('veldt', 'eVe', 25, 4, 'Herds without end, and a great beast of lightning running alongside them for the joy of it.');
  ep('narshe', 'eNa', 27, 24, 'A frozen Esper in the cliffs above, dreaming of a girl it will never meet.');
  ep('figaro', 'eFi', 26, 5, 'A queen of Figaro with her two small sons, explaining an engine with great patience.');
  ep('thamasa', 'eTh', 28, 20, 'An Esper elder teaching a young one named Maduin to fly. He keeps falling. She keeps laughing.', 'maduin');
  ep('doma', 'eDo', 4, 20, 'Doma\'s gardens in spring. A boy with a wooden sword chases his father across the lawn.');
  ep('albrook', 'eAl', 28, 15, 'Imperial ships leaving Albrook for the Esper World, and a single Esper watching them come.');
  ep('zozo', 'eZo', 25, 18, 'Zozo before the rain: a market, music, a thief returning a purse with a wink.');
  ep('esperRuins', 'eEr', 18, 2, 'Valtheia\'s own memory: the last morning before the magi came. She chose to go with them, to spare the others.', 'valtheia');
  add('figaro', { events: [{ id: 'core', on: 'talk', x: 21, y: 10, w: 3, run: 'twinCrowns', flag: 'act2', unless: 'ult_figaro' }] });

  // the Interceptor's Trail: the last sighting is in Mobliz
  add('mobliz', { npcs: [{ id: 'int7', name: 'Interceptor', sprite: 'interceptor', x: 33, y: 4, dir: 'down', talk: 'interceptor', n: 7, flag: 'act2', unless: 'int_7', alwaysAnim: true }] });

  // Terra's play, Seven's birthday, rebuilding Mobliz
  add('mobliz', {
    npcs: [
      { id: 'director', name: 'Mina', sprite: 'mina', x: 10, y: 10, dir: 'down', talk: 'terraPlay', flag: 'act2', unless: 'ult_terra' },
      { id: 'bday', name: 'Tobin', sprite: 'tobin', x: 16, y: 15, dir: 'up', talk: 'sevenBirthday', flag: 'act2', unless: 'sevenBirthday' },
      { id: 'foremanMo', name: 'Katarin', sprite: 'katarin', x: 15, y: 9, dir: 'down', talk: 'rebuild', town: 'mobliz', flag: 'act2' },
    ],
  });
  for (const n of MAPS.mobliz.npcs) if (n.id === 'katarin') n.unless = 'act2';
  add('hollowmere', { npcs: [{ id: 'foremanHo', name: 'Carter', sprite: 'manB', x: 13, y: 20, dir: 'up', talk: 'rebuild', town: 'hollowmere', flag: 'act2' }] });
  add('albrook', {
    npcs: [
      { id: 'foremanAl', name: 'Harbourmaster', sprite: 'oldman', x: 17, y: 19, dir: 'up', talk: 'rebuild', town: 'albrook', flag: 'act3' },
      { id: 'hushCell', name: 'Grey Recruiter', sprite: 'hushB', x: 27, y: 13, dir: 'left', talk: 'albrookWatch', flag: 'vigilDown', unless: 'ult_maren' },
    ],
  });

  // Gau's herds on the Veldt; Setzer's last crash site
  add('veldt', {
    npcs: [1, 2, 3].map((n) => ({ id: 'herdQ' + n, name: 'Frightened Herd', sprite: n === 2 ? 'beastGrey' : 'beast', x: [14, 28, 38][n - 1], y: [5, 17, 6][n - 1], dir: 'left', talk: 'gauHerd', n, flag: 'act2', unless: 'herd_' + n })),
    events: [{ id: 'wreck4', on: 'talk', x: 44, y: 7, w: 2, run: 'crashSite', n: 4 }],
  });

  // Narshe's Hearth: twelve lost moogles in the mines
  const spots = [[7, 8], [10, 12], [30, 8], [33, 12], [14, 5], [24, 5], [9, 16], [27, 16], [34, 20], [5, 24], [10, 22], [20, 2]];
  add('narsheMines', { npcs: spots.map(([x, y], i) => ({ id: 'lost' + i, name: 'Moogle', sprite: 'moogle', x, y, dir: 'down', talk: 'lostMoogle', flag: 'festivalAsked', unless: 'moogle_' + i })) });
  add('narshe', { npcs: [{ id: 'elderMoogle', name: 'Moogle Elder', sprite: 'moogle', x: 20, y: 6, dir: 'down', talk: 'narsheHearth', flag: 'act2', unless: 'ult_mog' }] });

  // the Painted Archive and the Mother's Song
  add('archive', { events: [{ id: 'painted', on: 'talk', x: 11, y: 12, w: 2, run: 'paintedArchive', flag: 'm6Done', unless: 'ult_strago' }] });
  add('esperRuins', { events: [{ id: 'motherSong', on: 'talk', x: 14, y: 2, w: 2, run: 'mothersSong', flag: 'm7Done', unless: 'ult_dalia' }] });
  add('zoneEater', { events: [{ id: 'mirror', on: 'talk', x: 11, y: 1, run: 'mimicMirror', flag: 'gogoJoined', unless: 'ult_gogo' }] });
  add('domaCrypt', { events: [{ id: 'letters', on: 'talk', x: 13, y: 9, w: 4, run: 'domaLettersFind', flag: 'dirgeDown', unless: 'gotDomaLetters' }] });
  add('figaro', { events: [{ id: 'crown', on: 'talk', x: 14, y: 4, w: 2, run: 'costume', costume: 'crown', flag: 'playStarted' }] });

  // Cid's last notes
  for (const [map, n, x, y] of [['narshe', 5, 2, 24], ['thamasa', 7, 2, 21]]) add(map, { props: [{ id: 'cid' + n, type: 'chest', x, y, flag: 'act2' }], events: [{ id: 'cid' + n, on: 'talk', x, y, run: 'cidPage', n, flag: 'act2', unless: 'cid_' + n, prop: 'cid' + n }] });
}
