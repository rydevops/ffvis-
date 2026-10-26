// Act I maps: the Falcon, Figaro, Hollowmere, the Veldt, Narshe and its mines.
import { Grid, carve, room, edgeExits, shopkeeper, innkeeper, npc, sayNpc } from './mapkit.js';

// ---------------------------------------------------------------- the Falcon's deck
const deck = new Grid(26, 14, ' ');
deck.rect(3, 1, 22, 1, '#').rect(3, 12, 22, 12, '#').rect(3, 2, 22, 11, '.');
deck.rect(8, 4, 17, 9, ',');

export const ACT1_MAPS = {
  falconDeck: {
    name: 'The Falcon', theme: 'deck', music: 'falcon', ambience: 'wind', region: 'sky', shadow: '#3A2418',
    rows: deck.rows(),
    props: [
      { type: 'beam', x: 7, y: 6 }, { type: 'beam', x: 18, y: 6 }, { type: 'crate', x: 4, y: 10 }, { type: 'crate', x: 5, y: 10 }, { type: 'barrel', x: 21, y: 10 },
      { type: 'engine', x: 11, y: 2, state: 'on' }, { type: 'banner', x: 4, y: 3 }, { type: 'banner', x: 21, y: 3 },
    ],
    npcs: [{ id: 'setzer', name: 'Setzer', sprite: 'setzer', x: 12, y: 3, dir: 'down', talk: 'setzerHelm' }],
    events: [{ id: 'flight', on: 'auto', run: 'm2Flight', once: true }],
  },

  // ---------------------------------------------------------------- Figaro Castle (interior)
  figaro: (() => {
    const g = new Grid(30, 26, '#');
    g.rect(11, 3, 18, 9, '.').rect(13, 3, 16, 9, 'x'); // throne hall with a runner
    g.rect(2, 4, 8, 11, '.'); // council chamber
    g.rect(21, 4, 27, 11, '.'); // Verdance workshop
    g.rect(2, 15, 8, 21, '.'); // infirmary
    g.rect(21, 15, 27, 21, '.'); // quarters and stores
    g.rect(9, 7, 10, 8, '.').rect(19, 7, 20, 8, '.'); // doors from the hall
    g.rect(13, 10, 16, 21, '.').rect(12, 22, 17, 25, '.').rect(14, 10, 15, 25, 'x'); // main corridor down to the gate
    g.rect(9, 17, 12, 18, '.').rect(17, 17, 20, 18, '.'); // side halls
    g.rect(4, 12, 5, 14, '.').rect(24, 12, 25, 14, '.');
    g.rect(2, 12, 8, 12, '#');
    return {
      name: 'Figaro Castle', theme: 'castle', music: 'figaro', region: 'west', shadow: '#8C6C40',
      rows: g.rows(),
      props: [
        { type: 'throne', x: 14, y: 4 }, { type: 'banner', x: 12, y: 4, state: 'navy' }, { type: 'banner', x: 17, y: 4, state: 'navy' },
        { type: 'table', x: 4, y: 7 }, { type: 'table', x: 6, y: 7 }, { type: 'shelf', x: 2, y: 4 }, { type: 'lantern', x: 8, y: 5 },
        { id: 'verdance', type: 'engine', x: 23, y: 6, state: 'on' }, { type: 'engine', x: 21, y: 10 }, { type: 'crate', x: 27, y: 10 }, { type: 'crate', x: 26, y: 10 },
        { type: 'bed', x: 2, y: 17 }, { type: 'bed', x: 4, y: 17 }, { type: 'bed', x: 6, y: 17 }, { type: 'bed', x: 2, y: 21 },
        { type: 'stall', x: 22, y: 16, state: 'navy' }, { type: 'bed', x: 26, y: 17 }, { type: 'barrel', x: 21, y: 21 },
        { type: 'statue', x: 13, y: 12 }, { type: 'statue', x: 16, y: 12 }, { type: 'lantern', x: 13, y: 20 }, { type: 'lantern', x: 16, y: 20 },
        { id: 'c1', type: 'chest', x: 27, y: 20 }, { id: 'c2', type: 'chest', x: 8, y: 21 },
      ],
      npcs: [
        { id: 'edgar', name: 'Edgar', sprite: 'edgar', x: 23, y: 8, dir: 'down', talk: 'edgarFig', flag: 'act1Council', unless: 'act1Done' },
        npc('guard1', 'soldierB', 13, 24, 'lines', { name: 'Guard', dir: 'up', lines: ['Welcome to Figaro. Mind the sand; it gets everywhere.', { if: 'act2', say: ['The King flies with the Falcon now. We keep the engines warm for him.'] }] }),
        npc('guard2', 'soldierB', 16, 24, 'lines', { name: 'Guard', dir: 'up', lines: ['Long live King Edgar.', { if: 'act3', say: ['Half the garrison fell Stilled. We stand watch for them.'] }] }),
        npc('chancellor', 'oldman', 17, 11, 'lines', { name: 'Chancellor', lines: ['His Majesty is in the workshop again. He sleeps there, I think.', { if: 'act2', say: ['Project Verdance has the whole castle humming. I pray it works.'] }] }),
        shopkeeper('qm', 23, 18, 'figaro', 'miner'),
        innkeeper('matron', 26, 19, 0, 'woman'),
        npc('engineer', 'miner', 25, 8, 'lines', { name: 'Engineer', lines: ['The Verdance igniter draws from the castle engine itself. If it overheats, we all go up together. No pressure.'] }),
        npc('nurse', 'womanB', 5, 19, 'lines', { name: 'Nurse', lines: ['Rest here if you need it.', { if: 'act3', say: ['She woke up, then. The Imperial woman. She keeps asking for a wrench.'] }] }),
      ],
      events: [
        ...edgeExits(30, 26, ['bottom'], 'leaveTown'),
        { id: 'council', on: 'auto', run: 'm3Council', once: true, flag: 'm2Done', unless: 'act1Council' },
        { id: 'tc1', on: 'talk', x: 27, y: 20, run: 'chest', item: 'hiTonic', n: 2, prop: 'c1' },
        { id: 'tc2', on: 'talk', x: 8, y: 21, run: 'chest', gp: 500, prop: 'c2' },
        { id: 'map', on: 'talk', x: 4, y: 6, w: 4, run: 'councilTable' },
      ],
    };
  })(),

  // ---------------------------------------------------------------- Hollowmere
  hollowmere: (() => {
    const g = new Grid(30, 24, '.');
    g.top(2).rect(0, 0, 0, 23, '#').rect(29, 0, 29, 23, '#').rect(0, 22, 29, 23, '#');
    g.rect(13, 22, 16, 23, ',');
    g.path([[14, 21], [14, 13]], ',', 2).path([[4, 12], [26, 12]], ',');
    return {
      name: 'Hollowmere', theme: 'mobliz', music: 'stillness', region: 'west', weather: 'ash', shadow: '#453E26',
      rows: g.rows(),
      props: [
        { id: 'hall', type: 'house', x: 12, y: 8, state: 'grey' },
        { type: 'house', x: 3, y: 9, state: 'red' }, { type: 'house', x: 21, y: 9, state: 'green' },
        { type: 'house', x: 3, y: 19, state: 'plum' }, { type: 'house', x: 21, y: 19, state: 'red' },
        { id: 'hive', type: 'hiveProp', x: 9, y: 15 }, { type: 'well', x: 18, y: 15 }, { type: 'deadTree', x: 26, y: 15 }, { type: 'deadTree', x: 2, y: 15 },
        { type: 'lantern', x: 11, y: 11 }, { type: 'lantern', x: 18, y: 11 }, { type: 'sign', x: 12, y: 21 },
        { id: 'records', type: 'crate', x: 16, y: 9 },
      ],
      npcs: [
        { id: 's1', name: 'Villager', sprite: 'man', x: 6, y: 13, lying: true, stilled: true, talk: 'stilled', solid: true },
        { id: 's2', name: 'Villager', sprite: 'woman', x: 22, y: 13, lying: true, stilled: true, talk: 'stilled' },
        { id: 's3', name: 'Child', sprite: 'child', x: 20, y: 17, lying: true, stilled: true, talk: 'stilledChild' },
        { id: 's4', name: 'Farmer', sprite: 'manB', x: 5, y: 20, lying: true, stilled: true, talk: 'stilled' },
        { id: 'h1', name: 'Hush Acolyte', sprite: 'hush', x: 14, y: 14, dir: 'down', talk: 'hushFight', unless: 'hm_h1' },
        { id: 'h2', name: 'Hush Acolyte', sprite: 'hushB', x: 24, y: 12, dir: 'left', talk: 'hushFight', unless: 'hm_h2' },
        { id: 'maren', name: 'Masked Soldier', sprite: 'soldier', x: 14, y: 10, dir: 'down', talk: 'marenDuel', unless: 'marenFled' },
      ],
      events: [
        ...edgeExits(30, 24, ['bottom'], 'leaveTown'),
        { id: 'enter', on: 'auto', run: 'hmEnter', once: true },
        { id: 'hive', on: 'talk', x: 9, y: 15, w: 2, run: 'hmHive', unless: 'hiveDown' },
        { id: 'records', on: 'talk', x: 16, y: 9, run: 'hmRecords' },
        { id: 'sign', on: 'talk', x: 12, y: 21, run: 'sign', text: 'HOLLOWMERE — Bread, beer, and a warm welcome.' },
      ],
    };
  })(),

  // ---------------------------------------------------------------- the Veldt
  veldt: (() => {
    const g = new Grid(52, 22, '.');
    g.top(2).rect(0, 20, 51, 21, '#');
    g.scatter('t', 0.28, 5).scatter('t', 0.3, 6);
    g.rect(0, 10, 2, 13, '.');
    return {
      name: 'The Veldt', theme: 'mobliz', music: 'thamasa', region: 'east', weather: 'ash', shadow: '#453E26',
      rows: g.rows(),
      props: [
        { type: 'bush', x: 10, y: 6 }, { type: 'bush', x: 22, y: 15 }, { type: 'bush', x: 31, y: 5 }, { type: 'bush', x: 40, y: 16 },
        { type: 'deadTree', x: 16, y: 9 }, { type: 'deadTree', x: 35, y: 12 }, { type: 'rock', x: 27, y: 8 }, { type: 'bigRock', x: 44, y: 7 },
        { id: 'tangle', type: 'bush', x: 47, y: 11 },
      ],
      npcs: [
        { id: 'gau', name: 'Gau', sprite: 'gau', x: 6, y: 11, dir: 'left', talk: 'gauVeldt', flag: 'veldtTeam', unless: 'gauJoined' },
        { id: 'umaro', name: 'Umaro', sprite: 'umaro', x: 7, y: 13, dir: 'left', talk: 'umaroVeldt', flag: 'veldtTeam', unless: 'gauJoined' },
        { id: 'seven', name: '???', sprite: 'sevenBlue', x: 47, y: 12, dir: 'left', talk: 'sevenFound', flag: 'veldtTeam', unless: 'sevenJoined', alwaysAnim: true },
        { id: 'herd1', name: 'Herd', sprite: 'beast', x: 30, y: 10, dir: 'left', wander: true },
        { id: 'herd2', name: 'Herd', sprite: 'beastGrey', x: 33, y: 13, dir: 'left', wander: true },
        { id: 'herd3', name: 'Herd', sprite: 'beast', x: 20, y: 17, dir: 'left', wander: true },
      ],
      events: [
        { id: 'exit', on: 'step', x: 0, y: 10, h: 4, run: 'leaveTown' },
        { id: 'enter', on: 'auto', run: 'veldtEnter', once: true, flag: 'veldtTeam' },
      ],
      encounter: { groups: [['brushback'], ['burrower', 'burrower'], ['brushback', 'burrower']], bg: 'plains' },
    };
  })(),

  // ---------------------------------------------------------------- Narshe
  narshe: (() => {
    const g = new Grid(32, 28, '.');
    g.top(4).rect(0, 0, 1, 27, '#').rect(30, 0, 31, 27, '#').rect(0, 26, 31, 27, '#');
    g.rect(14, 26, 17, 27, ',');
    g.rect(14, 2, 17, 3, '.'); // mine mouth
    g.path([[15, 25], [15, 4]], ',', 2).path([[3, 15], [28, 15]], ',');
    return {
      name: 'Narshe', theme: 'snow', music: 'narshe', region: 'north', weather: (f) => (f.wsStone ? 'snow' : 'ash'), shadow: '#625A54',
      rows: g.rows(),
      props: [
        { type: 'timberHouse', x: 3, y: 11 }, { type: 'timberHouse', x: 8, y: 11 }, { type: 'timberHouse', x: 21, y: 11 }, { type: 'timberHouse', x: 26, y: 11 },
        { type: 'timberHouse', x: 3, y: 22 }, { type: 'timberHouse', x: 25, y: 22 },
        { type: 'lamppost', x: 13, y: 8 }, { type: 'lamppost', x: 18, y: 8 }, { type: 'lamppost', x: 13, y: 19 }, { type: 'lamppost', x: 18, y: 19 },
        { type: 'pine', x: 10, y: 24, state: 'snow' }, { type: 'pine', x: 21, y: 24, state: 'snow' }, { type: 'cart', x: 19, y: 5 },
        { type: 'stall', x: 9, y: 18, state: 'grey' }, { type: 'sign2', x: 20, y: 18, state: 'inn' }, { type: 'sign2', x: 8, y: 18, state: 'shop' },
        { id: 'c1', type: 'chest', x: 28, y: 18 },
      ],
      npcs: [
        shopkeeper('nshop', 10, 19, 'narshe', 'miner', 'down'),
        innkeeper('ninn', 21, 19, 60, 'womanB', 'down'),
        { id: 'mog', name: 'Mog', sprite: 'mog', x: 16, y: 5, dir: 'down', talk: 'mogNarshe', flag: 'mineTeam', unless: 'mogJoined' },
        npc('moogle1', 'moogle', 12, 5, 'lines', { name: 'Moogle', lines: ['Kupo... the singing is louder every night, kupo.', { if: 'wsStone', say: ['The snow is white again, kupo! White! Mog says we can have a festival!'] }] }),
        npc('moogle2', 'moogle', 19, 7, 'lines', { name: 'Moogle', lines: ['Miners and moogles work the deep tunnels together now, kupo. Nobody hits us with pickaxes anymore.'] }),
        npc('miner1', 'miner', 6, 16, 'lines', { name: 'Miner', lines: ["The veins went dark the year the world fell. Coal's all we pull up now.", { if: 'wsStone', say: ['Have you SEEN the ore? It glows like it did when I was a boy!'] }] }),
        npc('elder', 'oldman', 24, 16, 'lines', { name: 'Narshe Elder', lines: ['Narshe has buried more than one secret in that mountain. I pray this one wants to stay buried.', { if: 'act2', say: ['Since the Wellspring woke, the children laugh in the street again. Thank you.'] }] }),
      ],
      events: [
        ...edgeExits(32, 28, ['bottom'], 'leaveTown'),
        { id: 'mine', on: 'step', x: 14, y: 2, w: 4, run: 'enterMines' },
        { id: 'tc1', on: 'talk', x: 28, y: 18, run: 'chest', gear: 'mythrilVest', prop: 'c1' },
        { id: 'enter', on: 'auto', run: 'narsheEnter', once: true, flag: 'mineTeam' },
      ],
    };
  })(),

  narsheMines: (() => {
    const g = carve(40, 32, [
      [17, 26, 22, 30], [18, 18, 20, 25, '='], [8, 14, 30, 18], [6, 6, 11, 13], [26, 6, 34, 13], [12, 4, 26, 7], [30, 14, 36, 24], [4, 19, 12, 26], [17, 1, 21, 3],
    ], 0.3);
    return {
      name: 'Narshe Mines', theme: 'mine', music: 'vault', region: 'north', dark: 1, playerLight: 48, shadow: '#221E1C',
      rows: g.rows(),
      props: [
        { type: 'lantern', x: 17, y: 26 }, { type: 'lantern', x: 22, y: 26 }, { type: 'lantern', x: 9, y: 14 }, { type: 'lantern', x: 29, y: 14 },
        { type: 'lantern', x: 13, y: 4 }, { type: 'lantern', x: 25, y: 4 }, { type: 'beam', x: 8, y: 16 }, { type: 'beam', x: 30, y: 16 },
        { type: 'cart', x: 24, y: 16 }, { type: 'rubble', x: 6, y: 24 }, { type: 'crate', x: 34, y: 23 },
        { id: 'c1', type: 'chest', x: 7, y: 7 }, { id: 'c2', type: 'chest', x: 34, y: 7 }, { id: 'c3', type: 'chest', x: 5, y: 21 },
        { id: 'e1', type: 'echoPoint', x: 35, y: 20, flat: true },
      ],
      events: [
        { id: 'out', on: 'step', x: 17, y: 30, w: 6, run: 'leaveMines' },
        { id: 'deep', on: 'step', x: 17, y: 1, w: 5, run: 'enterWellspringStone' },
        { id: 'tc1', on: 'talk', x: 7, y: 7, run: 'chest', item: 'ether', n: 2, prop: 'c1' },
        { id: 'tc2', on: 'talk', x: 34, y: 7, run: 'chest', gear: 'lance1', prop: 'c2' },
        { id: 'tc3', on: 'talk', x: 5, y: 21, run: 'chest', gear: 'guardRing', prop: 'c3' },
        { id: 'e1', on: 'talk', x: 35, y: 20, run: 'echoPoint', shard: 'shiva', memory: 'Snow falls upward. A woman of ice turns, as if she can see you through a thousand years, and smiles.', prop: 'e1' },
        { id: 'e1b', on: 'step', x: 35, y: 20, run: 'echoPoint', shard: 'shiva', memory: 'Snow falls upward. A woman of ice turns, as if she can see you through a thousand years, and smiles.', prop: 'e1' },
      ],
      encounter: { groups: [['snowWolf', 'snowWolf'], ['mineBat', 'mineBat', 'mineBat'], ['mineBat', 'snowWolf']], bg: 'mine' },
    };
  })(),

  wellspringStone: (() => {
    const g = carve(26, 20, [[3, 4, 22, 17], [11, 17, 14, 19]], 0.5);
    return {
      name: 'Wellspring of Stone', theme: 'mine', music: 'espers', region: 'north', shadow: '#221E1C',
      rows: g.rows(),
      props: [
        { id: 'ws', type: 'wellspring', x: 11, y: 9 }, { id: 'psalm', type: 'psalmFig', x: 9, y: 6, unless: 'psalmDown' },
        { type: 'crystal', x: 4, y: 6, state: 'glass' }, { type: 'crystal', x: 21, y: 6, state: 'glass' }, { type: 'crystal', x: 5, y: 15 }, { type: 'crystal', x: 20, y: 15 },
      ],
      events: [
        { id: 'see', on: 'auto', run: 'wsStoneScene', once: true },
        { id: 'back', on: 'step', x: 11, y: 19, w: 4, run: 'backToMines' },
      ],
    };
  })(),

  // ---------------------------------------------------------------- the cliffs above Narshe (the defense)
  narsheCliffs: (() => {
    const g = new Grid(40, 34, '#');
    g.rect(16, 2, 23, 6, '.'); // the mine mouth where the igniter charges
    for (const [x0, x1] of [[3, 8], [17, 22], [31, 36]]) g.rect(x0, 7, x1, 30, '.');
    g.rect(3, 7, 36, 9, '.').rect(3, 30, 36, 32, '.');
    g.rect(9, 12, 16, 28, '#').rect(23, 12, 30, 28, '#');
    return {
      name: 'Narshe Cliffs', theme: 'snow', music: 'battle', region: 'north', weather: 'ash', shadow: '#625A54',
      rows: g.rows(),
      props: [
        { id: 'igniter', type: 'engine', x: 18, y: 5, state: 'on' },
        { type: 'lamppost', x: 16, y: 6 }, { type: 'lamppost', x: 23, y: 6 },
        { type: 'pine', x: 4, y: 20, state: 'snow' }, { type: 'pine', x: 35, y: 18, state: 'snow' }, { type: 'pine', x: 20, y: 24, state: 'snow' },
      ],
      npcs: [
        { id: 'edgarD', name: 'Edgar', sprite: 'edgar', x: 21, y: 6, dir: 'down', talk: 'defenseEdgar' },
        { id: 'w1', name: 'Hush Raiders', sprite: 'hush', x: 5, y: 24, dir: 'down', talk: 'defenseWave', wave: 'L1', unless: 'dw_L1' },
        { id: 'w2', name: 'Drones', sprite: 'mite', x: 6, y: 14, dir: 'down', talk: 'defenseWave', wave: 'L2', unless: 'dw_L2', alwaysAnim: true },
        { id: 'w3', name: 'Hush Raiders', sprite: 'hushB', x: 19, y: 22, dir: 'down', talk: 'defenseWave', wave: 'C1', unless: 'dw_C1' },
        { id: 'w4', name: 'Drones', sprite: 'mite', x: 20, y: 13, dir: 'down', talk: 'defenseWave', wave: 'C2', unless: 'dw_C2', alwaysAnim: true },
        { id: 'w5', name: 'Snow Wolves', sprite: 'beastGrey', x: 33, y: 24, dir: 'down', talk: 'defenseWave', wave: 'R1', unless: 'dw_R1' },
        { id: 'w6', name: 'Drones', sprite: 'mite', x: 34, y: 14, dir: 'down', talk: 'defenseWave', wave: 'R2', unless: 'dw_R2', alwaysAnim: true },
      ],
      events: [
        { id: 'start', on: 'auto', run: 'defenseStart', once: true },
        { id: 'laneL', on: 'step', x: 3, y: 11, w: 6, run: 'laneTeam', lane: 'L' },
        { id: 'laneC', on: 'step', x: 17, y: 11, w: 6, run: 'laneTeam', lane: 'C' },
        { id: 'laneR', on: 'step', x: 31, y: 11, w: 6, run: 'laneTeam', lane: 'R' },
      ],
    };
  })(),
};
