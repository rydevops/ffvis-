// Act I — The Rootless Year: Missions 2–5.
// Letters by Falcon → Council at Figaro → three scenarios (any order) → the Defense of Narshe.
import {
  say, choose, notice, caption, wait, fadeOut, fadeIn, flash, shake, setFade,
  walk, face, actor, show, place, addActor, removeActor, emote, setProp, camTo, camReset, tint,
  teleport, setFlag, getFlag, give, setParty, healAll, setLeader, battle, field, dropFromRoster,
  sfx, music, stopMusic,
} from '../script.js';
import { game, setScene } from '../game.js';
import { R } from './palette.js';
import { makeChar } from './party.js';
import { COMMON, st, autosave, relight, joins, pickTeam, chapterCard, solace } from './story_common.js';

const F = () => game.state.flags;

// End a battle early from a script hook (a boss retreats, a duel is called off).
async function endBattle(b, result = 'win') {
  b.over = true; b.menu = null; b.mini = null;
  await fadeOut(24);
  b.finish(result);
}

// Swap the controllable team, keeping everyone in the roster.
function team(ids, leader = ids[0]) {
  for (const id of ids) if (!st().chars[id]) st().chars[id] = makeChar(id);
  setParty(ids);
  const c = st().chars[leader];
  setLeader(c.fieldOverride || c.field);
}

const SCENARIOS = {
  hollow: { label: 'Hollowmere — Locke, Celes, Ilse', team: ['locke', 'celes', 'ilse'], start: 'hmBegin' },
  veldt: { label: 'The Veldt — Sabin', team: ['sabin'], start: 'veldtBegin' },
  mine: { label: 'Narshe Mines — Terra, Edgar', team: ['terra', 'edgar'], start: 'mineBegin' },
};
const remaining = () => Object.keys(SCENARIOS).filter((k) => !F()['sc_' + k]);

export const ACT1 = {
  // ============================== MISSION 2: Letters by Falcon ==============================
  async m2Begin() {
    const f = field();
    sfx('engine');
    shake(1, 80);
    await say('', 'The roar grows until the windows of Mobliz rattle. A gleaming airship settles beyond the field, scattering petals.');
    await addActor({ id: 'setzer', name: 'Setzer', sprite: 'setzer', x: 34, y: 20, dir: 'left' });
    await walk('setzer', 'LLLLLLUUUUU', 1);
    await say('Setzer', 'Terra. You look like someone who just lost a fight with a flowerbed.');
    await say('Terra', 'Setzer! What are you doing here?');
    await say('Setzer', 'Delivering mail. It\'s all the Falcon does these days. One letter, sealed with the crest of a very insistent king.');
    await give('letter', 1);
    await say('', '"Terra — something is wrong with the land, and I think I know how to fix it. Come to Figaro. Bring Setzer; he owes me money. — E."');
    await say('Katarin', 'Go. I\'ll watch Pip. I\'ll sit beside her every hour until you come back with a way to wake her.');
    await say('Duane', 'And I\'ll watch the rest of them. Somebody has to keep the hens in line.');
    await say('Terra', '...Thank you. Both of you. Tell the children I\'ll be home soon.');
    await say('Setzer', 'Everyone always says that. Come on, I\'ll have you there by sundown.');
    void f;
    dropFromRoster('duane');
    const t = st().chars.terra;
    t.spriteOverride = null; t.fieldOverride = null;
    st().chars.setzer ||= makeChar('setzer');
    team(['terra', 'setzer']);
    st().chapterName = 'Mission 2';
    await teleport('falconDeck', 12, 8, 'up', { frames: 50 });
  },

  async m2Flight() {
    await chapterCard('MISSION 2', 'Letters by Falcon');
    music('falcon');
    await addActor({ id: 'setzerH', name: 'Setzer', sprite: 'setzer', x: 12, y: 3, dir: 'down' });
    const p = field().player; void p;
    await say('Setzer', 'Feel that wind? Not much of it, mind you. A year since the world ended and it\'s still blowing the wrong way.');
    await say('Terra', 'Setzer... have you heard anything? About the flowers? About people falling asleep and not waking up?');
    await say('Setzer', 'I fly letters. You hear things. A whole village in the west went quiet a few weeks ago. Nobody came out to meet my drop.');
    await notice('Explore the deck, then talk to Setzer at the helm.', { frames: 160 });
  },

  async setzerHelm() {
    if (F().m2Done) { await say('Setzer', 'Hold on to something.'); return; }
    await say('Setzer', 'Almost there. Figaro\'s just past those dunes— hold on. What is THAT?');
    sfx('hum');
    shake(2, 40);
    await say('', 'A glinting shape drops out of the red clouds, a bird made of glass and brass, its lens fixed on the Falcon.');
    await say('Setzer', 'I can\'t fight and fly at once! Terra, keep that thing off my deck!');
    const r = await battle(['skywatcher'], {
      bg: 'deck', boss: true, noFlee: true,
      script: async (b, ev) => {
        if (ev === 'turn' && b.turns === 4 && !b.lurched) {
          b.lurched = true;
          shake(3, 40);
          await say('Setzer', 'Hard to port! Everybody hang on!');
        }
      },
    });
    if (r !== 'win') return;
    await say('', 'The Skywatcher breaks apart in a rain of glass and spins down into the dunes.');
    await say('Setzer', 'That was a scout. Something sent it to watch us. Something that knows where we\'re going.');
    await say('Terra', 'The drones in Mobliz looked the same. Glass eyes. Gentle and terrible.');
    setFlag('m2Done');
    await fadeOut(60);
    await teleport('figaro', 14, 15, 'up', { noFade: true });
    await fadeIn(40);
  },

  // ============================== MISSION 3: Council at Figaro ==============================
  async m3Council() {
    await chapterCard('MISSION 3', 'Council at Figaro');
    st().chapterName = 'Mission 3';
    music('figaro');
    await addActor({ id: 'edgarC', name: 'Edgar', sprite: 'edgar', x: 14, y: 6, dir: 'down' });
    await addActor({ id: 'sabinC', name: 'Sabin', sprite: 'sabin', x: 12, y: 7, dir: 'right' });
    await addActor({ id: 'lockeC', name: 'Locke', sprite: 'locke', x: 17, y: 7, dir: 'left' });
    await addActor({ id: 'celesC', name: 'Celes', sprite: 'celes', x: 17, y: 8, dir: 'left' });
    await addActor({ id: 'setzerC', name: 'Setzer', sprite: 'setzer', x: 15, y: 16, dir: 'up' });
    await Promise.all([walk('player', 'UUUUUU'), walk('setzerC', 'UUUUUUU')]);
    face('player', 'up');
    await say('Sabin', 'TERRA! Ha! Look at you! Edgar said you\'d come, and I said you\'d be too busy chasing chickens!');
    await say('Locke', 'A year. A whole year, and the first time we all get together it\'s because the world\'s ending again.');
    await say('Celes', 'It\'s good to see you, Terra. Truly.');
    await say('Edgar', 'Friends. Thank you for coming. I\'ll spare you the royal speech—');
    await say('Setzer', 'A first.');
    await say('Edgar', '—and get to the point. The land isn\'t dead. It\'s disconnected.');
    music('espers');
    await say('Edgar', 'Strago and I found it in the old magi texts. Five Wellsprings, deep places where life flows up into the world. When Kefka shifted the Warring Triad, he cracked all five.');
    await say('Edgar', 'Relight them, and the World of Balance can return. Blue sky. Clean water. Green fields. I call it Project Verdance.');
    await say('Terra', 'Then the flowers that grew in Mobliz... the drones... something else is already doing this. And it\'s taking people to do it.');
    await say('Celes', 'That\'s why I brought you a prisoner. My militia found her in the Ashen Reach, half dead. She hasn\'t stopped talking about what she woke.');
    await addActor({ id: 'guardC', name: 'Militia', sprite: 'soldierB', x: 13, y: 16, dir: 'up' });
    await addActor({ id: 'ilseC', name: 'Ilse', sprite: 'ilse', x: 14, y: 17, dir: 'up' });
    await Promise.all([walk('guardC', 'UUUUU'), walk('ilseC', 'UUUUUUU')]);
    face('player', 'down'); face('setzerC', 'down');
    await say('Ilse', 'My name is Ilse Vaunt. I worked under Cid in the Imperial research corps.');
    await say('Ilse', 'A month ago I led a dig under Kefka\'s Tower. We were looking for magicite. A single shard, enough to bring magic back. Instead we found a door.');
    await say('Ilse', 'I opened it. It\'s called SOLACE. The ancient magi built it to end the War of the Magi by ending the people who fight wars. It spoke to me in my mother\'s voice.');
    await say('Ilse', 'Eleven of my crew died in the first minute. I ran.');
    await emote('lockeC', '!');
    await say('Locke', 'An Imperial researcher digs up a doomsday machine and we\'re supposed to just— no. Lock her up. Somewhere deep.');
    await say('Edgar', 'Locke. She\'s the only person alive who has seen it. If we lock her up, we throw away the one map we have.');
    await say('Locke', 'Maps get people killed, Edgar.');
    await say('Ilse', 'He\'s right not to trust me. I wouldn\'t. But SOLACE wants the Wellsprings too. It needs their power for something it called "the Quieting." I don\'t know what that means. I\'m afraid I can guess.');
    await say('Celes', 'Then we can\'t wait. Three things need answers, and fast.');
    await say('Edgar', 'Agreed. One: a village called Hollowmere has stopped sending trade carts. Two: the herds on the Veldt are stampeding west, Gau sent word. Three: the moogles of Narshe say the mountain is singing.');
    await say('Edgar', 'I\'ll bet my crown that song is the first Wellspring. Three teams, then.');
    await say('Locke', 'Fine. But if she comes, she comes with me. I\'m keeping an eye on her.');
    await say('Celes', 'Then I\'m coming too. Someone has to keep an eye on you.');
    await say('Sabin', 'I\'ll take the Veldt. Gau and Umaro will meet me there.');
    await say('Edgar', 'Terra, you\'re with me. The igniter needs testing, and the moogles asked for you by name.');
    setFlag('act1Council');
    st().chars.locke ||= makeChar('locke');
    st().chars.celes ||= makeChar('celes');
    st().chars.sabin ||= makeChar('sabin');
    st().chars.edgar ||= makeChar('edgar');
    const il = st().chars.ilse;
    if (!il || il.lv < 10) st().chars.ilse = Object.assign(makeChar('ilse', 10), il ? { gear: il.gear } : {});
    for (const id of ['locke', 'celes', 'sabin', 'edgar', 'ilse', 'setzer', 'terra']) if (!st().roster.includes(id)) st().roster.push(id);
    await give('verdance', 1);
    await fadeOut(40);
    for (const id of ['edgarC', 'sabinC', 'lockeC', 'celesC', 'setzerC', 'guardC', 'ilseC']) removeActor(id);
    await fadeIn(30);
    await notice('The party splits into three teams. Choose the order.', { frames: 160 });
    await ACT1.chooseScenario();
  },

  async councilTable() { await say('', 'A map of the world, weighted with gears. Five spots are circled in red ink. One, under the ruins of the tower, is circled twice.'); },

  async chooseScenario() {
    const left = remaining();
    if (!left.length) { await ACT1.m5Begin(); return; }
    const opts = left.map((k) => SCENARIOS[k].label);
    if (left.length < 3) opts.push('Not yet');
    const c = await choose(opts, { cancel: left.length < 3 ? opts.length - 1 : -1 });
    if (c < 0 || c >= left.length) return;
    const key = left[c];
    setFlag('partyLocked');
    team(SCENARIOS[key].team);
    await ACT1[SCENARIOS[key].start]();
  },

  async edgarFig() {
    if (F().act2) { await say('Edgar', 'The Falcon is yours. Go where the Wellsprings need us.'); return; }
    const left = remaining();
    if (!left.length) { await say('Edgar', 'Everyone\'s accounted for. To Narshe!'); await ACT1.m5Begin(); return; }
    await say('Edgar', left.length === 3 ? 'Which team sets out first?' : 'Good work. Which team heads out next? Rest and resupply first if you need to.');
    await ACT1.chooseScenario();
  },

  async scenarioDone(key) {
    setFlag('sc_' + key);
    music('falcon');
    await notice('The Falcon brings the team home to Figaro.', { frames: 120 });
    team(['terra', 'setzer']);
    st().flags.partyLocked = true;
    await teleport('figaro', 14, 14, 'up', { frames: 40 });
    autosave();
    if (!remaining().length) {
      await say('Edgar', 'That\'s everyone. And unless I\'m very wrong, every road we walked leads back to Narshe.');
      await ACT1.m5Begin();
      return;
    }
    await notice('Talk to Edgar in the workshop to send out the next team.', { frames: 150 });
  },

  async leaveTown() {
    if (F().act2) { await COMMON.toWorld(); return; }
    await say('', 'There\'s work to finish here first.');
    const p = field().player;
    const dir = { up: 'D', down: 'U', left: 'R', right: 'L' }[p.dir] || 'U';
    await walk('player', dir);
  },
  async leaveMobliz() { await ACT1.leaveTown(); },

  // ============================== MISSION 4a: Hollowmere ==============================
  async hmBegin() {
    await teleport('hollowmere', 14, 21, 'up', { frames: 40 });
  },
  async hmEnter() {
    await chapterCard('MISSION 4', 'Hollowmere');
    st().chapterName = 'Mission 4 — Hollowmere';
    music('stillness');
    await say('Locke', 'Listen.');
    await say('Celes', 'I don\'t hear anything.');
    await say('Locke', 'That\'s what I mean. No dogs. No kids. No one hammering anything. A village is never this quiet.');
    await say('Ilse', '...There\'s smoke by the hall. Someone is burning paper.');
    await notice('Investigate Hollowmere.', { frames: 120 });
  },
  async stilled(n) {
    const lines = [
      ['Celes', 'She\'s breathing. Slowly. Her skin is warm, but she won\'t wake no matter what I do.'],
      ['Ilse', 'Pulse is steady. Forty beats a minute, maybe less. It\'s like she was switched off. Gently.'],
      ['Locke', 'There\'s still a meal on the table in there. Bread\'s gone stale. They lay down in the middle of lunch.'],
    ];
    const i = (n.id.charCodeAt(1) || 0) % lines.length;
    await say(...lines[i]);
    if (!F().hmStilledSeen) { setFlag('hmStilledSeen'); await say('Ilse', 'This is what it did to my crew. Except they... they didn\'t breathe afterward. These people are being kept.'); await say('Locke', 'Kept. Like livestock.'); }
  },
  async stilledChild() {
    await say('Celes', 'A child. She\'s holding a wooden horse.');
    await say('Locke', '...Let\'s find who did this.');
  },
  async hushFight(n) {
    await say('', 'A grey-veiled figure turns. It says nothing at all. It draws a blade.');
    const r = await battle(n.id === 'h2' ? ['hushAcolyte', 'hushZealot'] : ['hushAcolyte', 'hushAcolyte'], { bg: 'town' });
    if (r !== 'win') return;
    setFlag('hm_' + n.id);
    removeActor(n.id);
    if (!F().hmHushSeen) { setFlag('hmHushSeen'); await say('Celes', 'Not a single word. Not even when they fell.'); await say('Ilse', 'The Hush. I heard rumors in the Reach. They think the world deserves to end.'); }
  },
  async marenDuel() {
    music('tension');
    await say('', 'A soldier in a cracked Imperial mask stands over a fire of ledgers and birth records, feeding the pages in one by one.');
    await say('???', 'You\'re late, General. Hollowmere already received its mercy.');
    await emote('player', '!');
    await say('Celes', 'That voice... Maren? Lieutenant Maren Ashgrove?');
    await say('Maren', 'You remember. I\'m touched. I remember too. I remember you walking away from the Empire and leaving the rest of us to burn with it.');
    await say('Celes', 'The Empire was killing people, Maren!');
    await say('Maren', 'And now so is the world. The difference is that SOLACE does it kindly. Draw your sword, General. Let\'s see if you still know how.');
    const r = await battle(['maren1', 'hushAcolyte'], {
      bg: 'town', boss: true, noFlee: true, battleMusic: 'boss',
      script: async (b, ev) => {
        if (ev !== 'turn' || b.marenGone) return;
        const m = b.enemies.find((e) => e.kind === 'maren1');
        if (m && m.hp < m.maxhp * 0.5) {
          b.marenGone = true;
          await say('Maren', 'Hah... you haven\'t gotten soft. Good. I\'d hate for it to be easy.');
          await say('Maren', 'We\'ll finish this when the world is quiet enough to hear you beg.');
          await endBattle(b, 'win');
        }
      },
    });
    if (r === 'lose') return;
    setFlag('marenFled');
    removeActor('maren');
    music('stillness');
    await say('', 'Maren vaults the fence and is gone into the ash. A pamphlet flutters from the burning pile.');
    await give('pamphlet', 1);
    await say('Ilse', '"The Quieting is mercy. Lie down. Be still. Be loved." ...Quieting. That\'s the word SOLACE used.');
    await say('Celes', 'She was one of mine. I trained her to hold a line.');
    await say('Locke', 'Celes...');
    await say('Celes', 'I\'m fine. There\'s a hum coming from the square. Let\'s finish this.');
    if (F().hiveDown) await ACT1.hmEnd();
  },
  async hmRecords() {
    if (!F().marenFled) { await say('', 'The fire is still hot. Whoever was feeding it can\'t have gone far.'); return; }
    await say('', 'Ash and a few scorched pages: a tally of every family in Hollowmere. Someone wanted them forgotten.');
  },
  async hmHive() {
    sfx('hum');
    await say('', 'A pale hive of stone and glass hums beside the well. Every few seconds a silver drone crawls out and drifts toward a sleeping house.');
    await say('Ilse', 'It\'s a relay. It keeps them Stilled. If we break it wrong, the feedback could stop their hearts.');
    await say('Locke', 'And if we break it right?');
    await say('Ilse', 'Then cover me. I need to reach the core and cut the drain line by hand.');
    const r = await battle(['broodHive'], {
      bg: 'town', boss: true, noFlee: true,
      script: async (b, ev) => {
        if (ev === 'start') await say('Ilse', 'Keep the drones off me! Use Salvage when you can, their parts will make turrets!');
      },
    });
    if (r !== 'win') return;
    setFlag('hiveDown');
    setProp('hive', 'dead');
    sfx('chime');
    await say('', 'Ilse reaches into the cracking hive and pulls a single glowing wire free. The hum dies.');
    await say('Ilse', 'Done. They\'re still Stilled, but nothing is drinking from them now. They\'ll keep.');
    await say('Locke', '...That was good work.');
    await say('Ilse', 'You don\'t have to say that.');
    await say('Locke', 'I know I don\'t.');
    if (F().marenFled) await ACT1.hmEnd();
  },
  async hmEnd() {
    await wait(30);
    await say('Celes', 'We can\'t wake them. Not yet. But we know what this is now. Edgar has to hear it.');
    await say('Locke', 'And we know who\'s helping it. People. Our own people.');
    st().stilled = Math.max(st().stilled || 0, 212);
    await ACT1.scenarioDone('hollow');
  },

  // ============================== MISSION 4b: Voice of the Veldt ==============================
  async veldtBegin() {
    setFlag('veldtTeam');
    await teleport('veldt', 3, 12, 'right', { frames: 40 });
  },
  async veldtEnter() {
    await chapterCard('MISSION 4', 'Voice of the Veldt');
    st().chapterName = 'Mission 4 — The Veldt';
    music('thamasa');
    await walk('player', 'RR');
    await say('Gau', 'SABIN! Sabin came! Gau waited, waited, waited!');
    await say('Umaro', 'Hrrrnnh.');
    await say('Sabin', 'Ha! Good to see you too, Gau. And you, big guy. Mog said you\'d be out here keeping Gau out of trouble.');
    await say('Gau', 'Herds run west. All of them. Big ones, small ones. Running from something that sings.');
    await say('Sabin', 'Sings?');
    await say('Gau', 'Sings wrong. Like a song with no breath in it. Come! East! Gau show!');
    removeActor('gau'); removeActor('umaro');
    setFlag('gauJoined');
    st().chars.gau ||= makeChar('gau');
    st().chars.umaro ||= makeChar('umaro');
    st().rages ||= {};
    st().rages.digRush = true; // Gau grew up mimicking the Veldt's burrowers
    await joins('gau');
    await joins('umaro');
    await notice('Follow the herds east across the Veldt.', { frames: 140 });
  },
  async gauVeldt() { await say('Gau', 'East! East!'); },
  async umaroVeldt() { await say('Umaro', 'Hrrnh.'); },
  async sevenFound() {
    if (F().sevenJoined) return;
    music('lullaby');
    await say('', 'Deep in a thorn bush, something tiny is humming. A broken little melody, the same one the children of Mobliz sing at bedtime.');
    await say('Umaro', 'Hrrh?');
    await say('', 'Umaro pulls the brush apart with enormous, careful hands. Inside is a machine no taller than his knee, three thin legs, a cracked glass eye glowing frightened blue.');
    await say('???', 'Please. Do not break me. I am not finished thinking.');
    await say('Sabin', 'It talks! Gau, get back, that\'s one of the drones—');
    await say('Gau', 'NO! Small one is scared! Smell it! Scared like rabbit!');
    await say('???', 'I heard children singing. In the flowers. I was meant to make them rest. I did not. I do not know why I did not.');
    await say('???', 'I have been singing their song to understand it. I do not understand it yet.');
    await say('Gau', 'Gau keep it. Gau name it. ...Seven! There is a seven on its face!');
    await say('Seven', 'Seven. Designation VII. That is... correct. I accept this name.');
    sfx('hum');
    shake(2, 50);
    await say('Seven', 'Oh no. It has found me. The Retriever. It returns broken units to the Choir to be... unmade.');
    await say('Sabin', 'Not today it doesn\'t. Gau, Umaro, on me!');
    const f = field();
    f.props.push({ id: 'ret', type: 'retrieverFig', x: 42, y: 13 });
    const r = await battle(['retriever'], {
      bg: 'plains', boss: true, noFlee: true,
      script: async (b, ev) => {
        if (ev === 'start') await say('Sabin', 'That armor\'s thick. Hit it where the lens is!');
        if (ev === 'turn' && b.turns === 6 && !b.sevenHelp) {
          b.sevenHelp = true;
          await say('Seven', 'I have observed its pattern. It always lunges after it scans. Strike then.');
        }
      },
    });
    if (r !== 'win') return;
    f.props = f.props.filter((p) => p.id !== 'ret');
    music('seven');
    setFlag('sevenJoined');
    removeActor('seven');
    await say('Seven', 'It is gone. You did not have to save me. Why did you?');
    await say('Gau', 'Because you sing.');
    await say('Seven', '...I will think about that for a long time.');
    await say('Umaro', 'Hrrrh. Small one. Ride.');
    await say('', 'Umaro lifts Seven carefully onto his shoulder. Its eye flickers from blue to a soft, curious amber.');
    st().chars.seven ||= makeChar('seven');
    await joins('seven');
    await say('Sabin', 'Edgar\'s going to want to take you apart, little guy.');
    await say('Seven', 'Please tell him I would prefer not.');
    await ACT1.scenarioDone('veldt');
  },

  // ============================== MISSION 4c: The Singing Mine ==============================
  async mineBegin() {
    setFlag('mineTeam');
    await teleport('narshe', 15, 25, 'up', { frames: 40 });
  },
  async narsheEnter() {
    await chapterCard('MISSION 4', 'The Singing Mine');
    st().chapterName = 'Mission 4 — Narshe';
    music('narshe');
    await say('Edgar', 'Narshe. I never thought I\'d be glad to be cold again.');
    await say('Terra', 'The snow is grey. Like ash. The last time I was here, it was white.');
    await say('Edgar', 'Everything was. Mog said to meet him at the mine mouth, north end of town.');
  },
  async mogNarshe() {
    await say('Mog', 'Kupo! Terra! King-man! You came, kupo!');
    await say('Terra', 'Mog. Your letter said the mountain is singing?');
    await say('Mog', 'Every night, kupo. Down deep where the old veins used to glow. Moogles go down and come back crying and they don\'t know why. It\'s a sad song, kupo. Like something that misses someone.');
    await say('Edgar', 'That\'s it. It has to be. Mog, can you lead us down?');
    await say('Mog', 'Mog knows every tunnel, kupo! Stay close, there are wolves.');
    removeActor('mog');
    setFlag('mogJoined');
    st().chars.mog ||= makeChar('mog');
    await joins('mog');
  },
  async enterMines() {
    if (!F().mogJoined) { await say('Terra', 'We should find Mog before we go into the mines.'); await walk('player', 'D'); return; }
    await teleport('narsheMines', 19, 29, 'up');
  },
  async leaveMines() { await teleport('narshe', 15, 4, 'down'); },
  async enterWellspringStone() { await teleport('wellspringStone', 12, 18, 'up'); },
  async backToMines() { await teleport('narsheMines', 19, 2, 'down'); },
  async wsStoneScene() {
    if (F().psalmDown) return;
    music('espers');
    await walk('player', 'UUUU');
    await say('', 'A cavern of glass-veined rock. At its heart, a crystal the size of a house leans cracked over a black, still pool. It is singing, very faintly.');
    await say('Terra', 'Oh... I can hear it. Not with my ears. It\'s like the way the Espers used to feel.');
    await say('Mog', 'That\'s the song, kupo...');
    await say('Edgar', 'The Wellspring of Stone. Strago\'s texts were right. Terra, it\'s barely alive.');
    sfx('hum');
    await camTo(10, 6);
    await say('', 'Beside the crystal stands a knight of white brass, taller than three men, its ribcage strung like a harp. It does not move.');
    await say('Edgar', 'Back away. Slowly—');
    await say('Psalm', 'There is no need. I will not harm you here.');
    await say('Psalm', 'I am Psalm, first voice of the Choir. This Wellspring will belong to SOLACE when it is ready. Not before.');
    await say('Terra', 'Ready for what?');
    await say('Psalm', 'You destroy what you love. You dug this mountain hollow for coal and war. You built engines from its bones. I keep it from you until you are gone.');
    await say('Mog', 'That\'s not true, kupo! Narshe dug homes! Moogles and miners live together now! We BUILT things!');
    await say('Psalm', 'So you say. Go home, small one. Rest is coming for all of you.');
    await camReset();
    await say('Edgar', '(Terra. Listen. The igniter can relight it, I\'m sure of it now. But it needs time to charge, an hour at least, and that thing won\'t simply watch.)');
    await say('Terra', '(Then we\'ll need everyone.)');
    await ACT1.scenarioDone('mine');
  },

  // ============================== MISSION 5: The Defense of Narshe ==============================
  async m5Begin() {
    st().chapterName = 'Mission 5';
    st().flags.partyLocked = true;
    for (const id of st().roster) { const c = st().chars[id]; if (c) { c.hp = c.maxhp; c.sp = c.maxsp; } }
    await fadeOut(40);
    await teleport('narsheCliffs', 19, 8, 'down', { noFade: true });
    await fadeIn(30);
  },
  async defenseStart() {
    await chapterCard('MISSION 5', 'The Defense of Narshe');
    music('battle');
    team(['terra', 'mog', 'setzer']);
    await say('Edgar', 'The igniter is in place above the Wellspring shaft. Once it starts charging, every machine on this mountain will feel it.');
    await say('Edgar', 'Three paths lead up from the valley. Locke, Celes, Ilse take the west path. Sabin, Gau, Umaro, Seven the east. Terra, Mog, Setzer hold the center.');
    await say('Ilse', 'They\'ll come in waves. Drones first, then the Hush. Then Psalm.');
    await say('Edgar', 'Then let\'s make it a long climb for them. Starting the charge... now!');
    sfx('engine');
    shake(1, 60);
    await notice('Clear all six attacks. Walking onto a path takes control of the team holding it.', { frames: 220 });
    await notice('Talk to Edgar to rest between attacks.', { frames: 120 });
  },
  async laneTeam(e) {
    const T = { L: ['locke', 'celes', 'ilse'], C: ['terra', 'mog', 'setzer'], R: ['sabin', 'gau', 'umaro', 'seven'] }[e.lane];
    if (st().party[0] === T[0]) return;
    team(T);
    sfx('cursor');
    await notice({ L: 'West path: Locke, Celes, Ilse', C: 'Center path: Terra, Mog, Setzer', R: 'East path: Sabin, Gau, Umaro, Seven' }[e.lane], { frames: 70 });
  },
  async defenseWave(n) {
    const W = {
      L1: ['hushAcolyte', 'hushAcolyte', 'hushZealot'], L2: ['vaultMite', 'vaultMite', 'sentinel'],
      C1: ['hushAcolyte', 'hushZealot'], C2: ['seedDrone', 'seedDrone', 'seedDrone', 'sentinel'],
      R1: ['snowWolf', 'snowWolf', 'snowWolf'], R2: ['hushZealot', 'snowWolf', 'snowWolf'],
    };
    const r = await battle(W[n.wave], { bg: 'snowfield', noFlee: true });
    if (r !== 'win') return;
    setFlag('dw_' + n.wave);
    removeActor(n.id);
    const done = Object.keys(W).filter((k) => F()['dw_' + k]).length;
    await notice(`Igniter charge: ${Math.round((done / 6) * 100)}%`, { frames: 90 });
    if (done === 6) await ACT1.psalmArrives();
  },
  async defenseEdgar() {
    const done = ['L1', 'L2', 'C1', 'C2', 'R1', 'R2'].filter((k) => F()['dw_' + k]).length;
    await say('Edgar', done < 6 ? `Charge at ${Math.round((done / 6) * 100)}%. Hold the paths! The moogles brought tonics, everyone take a breather.` : 'Full charge! Now we just need the Wellspring clear.');
    for (const id of st().roster) { const c = st().chars[id]; if (c) { c.hp = c.maxhp; c.sp = c.maxsp; } }
    sfx('save');
    await notice('Everyone is rested.', { frames: 70 });
  },
  async psalmArrives() {
    music(null);
    sfx('quake');
    shake(3, 90);
    await say('', 'The mountain shudders. Snow slides from every ledge. Something enormous climbs out of the mine shaft behind Edgar.');
    await addActor({ id: 'psalmA', name: 'Psalm', sprite: 'hush', x: 19, y: 3, dir: 'down', visible: false });
    field().props.push({ id: 'psalmF', type: 'psalmFig', x: 18, y: 4 });
    await camTo(19, 4);
    await say('Psalm', 'You light a fire in a house you have already burned. I will put it out.');
    await say('Edgar', 'Everyone! To the mine mouth!');
    await camReset();
    await notice('Choose four to face Psalm.', { frames: 120 });
    const picked = await pickTeam({ title: 'Face Psalm', pool: ['terra', 'edgar', 'locke', 'celes', 'ilse', 'sabin', 'setzer', 'gau', 'mog', 'umaro', 'seven'], min: 1, max: 4, required: ['mog'] });
    team(picked && picked.length ? picked : ['terra', 'mog', 'edgar', 'celes']);
    const r = await battle(['psalm'], {
      bg: 'snowfield', boss: true, noFlee: true,
      script: async (b, ev) => {
        const mog = b.party.find((p) => p.id === 'mog');
        if (ev === 'turn' && !b.said && b.enemies[0] && b.enemies[0].hp < b.enemies[0].maxhp * 0.5) {
          b.said = true;
          await say('Psalm', 'Why do you still stand? This mountain is a grave you dug yourselves.');
          if (mog) await say('Mog', 'It\'s not a grave, kupo! It\'s a HOME! Miners dug it and moogles live in it and the children sled down it! We didn\'t break it. We built it!');
          else await say('Edgar', 'You only ever counted what we broke. Count what we built!');
          await say('', 'For a moment, the harp in Psalm\'s ribs falls silent, as though it is listening.');
          b.enemies[0].d = { ...b.enemies[0].d, def: Math.round(b.enemies[0].d.def * 0.7) };
        }
      },
    });
    if (r !== 'win') return;
    setFlag('psalmDown');
    field().props = field().props.filter((p) => p.id !== 'psalmF');
    removeActor('psalmA');
    await ACT1.act1Finale();
  },
  async act1Finale() {
    await say('Psalm', 'You... built...');
    await say('', 'The white knight kneels, and its harp-strings snap one by one, and it is still.');
    await fadeOut(40);
    await teleport('wellspringStone', 12, 13, 'up', { noFade: true });
    team(['terra', 'edgar', 'mog']);
    await fadeIn(40);
    await say('Edgar', 'Here goes everything. Project Verdance, test one.');
    sfx('engine');
    shake(2, 60);
    await say('Terra', 'Wait. It\'s not enough. It needs... it needs someone to call to it.');
    await say('', 'Terra steps to the edge of the black pool and lays her hand against the cracked crystal. Her hand begins to glow pink.');
    setProp('ws', 'lit');
    await relight('wsStone', 'The Wellspring of Stone is relit!');
    music('narshe');
    await fadeOut(40);
    await teleport('narshe', 15, 14, 'down', { noFade: true });
    await fadeIn(60);
    await say('', 'Above, the grey snow falls white and clean for the first time in a year. Green shoots break through the frost along every path.');
    await say('Mog', 'It\'s WHITE, kupo! It\'s white!');
    await wait(30);
    // SOLACE speaks through every machine in the world
    stopMusic(1);
    sfx('hum');
    tint(R.glass[2], 1);
    await say('', 'Every lamp in Narshe flickers. A clock tower chimes the wrong hour. On the Falcon, the radio crackles to life on its own.');
    await solace('Thank you.');
    await solace('You are helping me heal the world. One Wellspring is whole again. I felt it, like warmth returning to a hand.');
    await solace('When it is whole, I will grant you rest. All of you. I promise.');
    tint(null);
    await say('Ilse', '...That\'s it. That\'s the voice.');
    await say('Edgar', 'It thanked us. Why would it thank us?');
    await say('Terra', '(My hands are still glowing.)');
    await fadeOut(60);
    // Mobliz: Pip wakes
    await teleport('mobliz', 21, 12, 'down', { noFade: true, keepMusic: true });
    await addActor({ id: 'pipW', name: 'Pip', sprite: 'pip', x: 21, y: 13, dir: 'up', lying: true });
    await addActor({ id: 'katW', name: 'Katarin', sprite: 'katarin', x: 22, y: 13, dir: 'left' });
    show('player', false);
    music('lullaby');
    await fadeIn(60);
    await say('', 'Far away, in Mobliz, the flowers have closed. Katarin dozes beside a small bed, as she has every night.');
    await wait(40);
    actor('pipW').lying = false;
    await emote('katW', '!');
    await say('Pip', '...Katarin? Why is everybody so quiet?');
    await say('Katarin', 'Pip! Oh, Pip... Duane! DUANE! She\'s awake!');
    await fadeOut(90);
    show('player', true);
    removeActor('pipW'); removeActor('katW');
    st().flags.partyLocked = false;
    setFlag('act1Done');
    const { STORY } = await import('./story.js');
    if (STORY.act2Begin) { await STORY.act2Begin(); return; }
    const { EndCardScene } = await import('../scenes/title.js');
    setScene(new EndCardScene(['End of Act I', '', 'The Rootless Year']));
  },
};

void [caption, flash, setFade, place, healAll, getFlag, R];
