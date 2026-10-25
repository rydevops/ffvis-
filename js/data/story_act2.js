// Act II — The Race for the Wellsprings: Missions 6–11, the Silent Hour, and the Circuit Closes.
import {
  say, choose, notice, wait, fadeOut, fadeIn, flash, shake, setFade,
  walk, face, actor, show, addActor, removeActor, emote, setProp, camTo, camReset, tint,
  teleport, setFlag, give, battle, field, dropFromRoster, recruit, sfx, music, stopMusic,
} from '../script.js';
import { game, setScene, pushOverlay, removeOverlay } from '../game.js';
import { W, H } from '../core/gfx.js';
import { R } from './palette.js';
import { COMMON, st, autosave, relight, joins, pickTeam, chapterCard, solace, team, requireTeam, wsCount } from './story_common.js';

const F = () => game.state.flags;
const has = (id) => st().party.includes(id);

async function endBattle(b, result = 'win') {
  b.over = true; b.menu = null; b.mini = null;
  await fadeOut(24);
  b.finish(result);
}

// White-out overlay (the Wellsprings flash, the Quieting).
function whiteout(frames = 120, hold = true) {
  return new Promise((resolve) => {
    const ov = {
      t: 0, hold,
      update() { this.t++; if (this.t >= frames) { if (!this.hold) removeOverlay(this); resolve(this); } },
      draw(ctx) { const a = Math.min(1, this.t / frames); ctx.globalAlpha = a; ctx.fillStyle = '#FFFDF5'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; },
    };
    pushOverlay(ov);
  });
}

// Gatekeeping for the three free-order Wellsprings.
async function wellspringOpen() {
  if (!F().m7Done) { await say('Edgar', 'Not yet. We don\'t know enough about what we\'re walking into. Thamasa first, then the Sealed Gate.'); return false; }
  if (wsCount() >= 3 && !F().sanctumDone) {
    await say('Celes', 'The Hush are still gathering at Zozo. If we leave them be, there won\'t be anyone left to save. Zozo first.');
    return false;
  }
  return true;
}

// After a Wellspring burns again: SOLACE answers, and the story moves on.
async function afterWellspring(flag, broadcast) {
  await wait(30);
  stopMusic(1);
  sfx('hum');
  tint(R.glass[2], 1);
  await say('', 'Somewhere a lamp flickers, a music box winds itself, a dead radio crackles.');
  for (const l of broadcast) await solace(l);
  tint(null);
  autosave();
  const n = wsCount();
  if (n === 2 && !F().silentHour) { await ACT2.silentHour(); return; }
  if (n === 4) { await ACT2.act2End(); return; }
}

export const ACT2 = {
  // ============================== ACT II opens ==============================
  async act2Begin() {
    setFlag('act2');
    st().chapterName = 'Act II';
    await teleport('falconDeck', 12, 8, 'up', { noFade: true, noFadeIn: true });
    await chapterCard('ACT II', 'The Race for the Wellsprings');
    music('falcon');
    await addActor({ id: 'edgarD', name: 'Edgar', sprite: 'edgar', x: 11, y: 6, dir: 'down' });
    await addActor({ id: 'setzerD', name: 'Setzer', sprite: 'setzer', x: 12, y: 3, dir: 'down' });
    await addActor({ id: 'ilseD', name: 'Ilse', sprite: 'ilse', x: 14, y: 7, dir: 'left' });
    await say('Edgar', 'One Wellspring down. Narshe has clean snow and the moogles are planning a festival. Four to go.');
    await say('Ilse', 'And SOLACE thanked us for it. I keep hearing that. Thank you.');
    await say('Edgar', 'I know. Which is why we need answers before we light another one. Strago sent word from Thamasa. He says the old archive has been sealed for a thousand years, and he means to open it.');
    await say('Setzer', 'The Falcon goes where you point her. For once, nobody\'s paying me, and I find I don\'t mind.');
    await say('Edgar', 'Thamasa lies far to the south-east. After that... we follow the trail wherever it leads.');
    removeActor('edgarD'); removeActor('setzerD'); removeActor('ilseD');
    st().flags.partyLocked = false;
    await notice('The world is open. Choose your party from the menu at any time.', { frames: 180 });
    const picked = await pickTeam({ title: 'Choose your party', pool: [...st().roster], min: 1, max: 4, required: [] });
    team(picked && picked.length ? picked : ['terra', 'edgar', 'setzer', 'locke']);
    st().boarded = 'falcon';
    st().vehicles = { ...(st().vehicles || {}), falcon: null };
    st().worldPos = [31, 13];
    await teleport('world', 31, 13, 'down');
    await notice('Mission 6: fly to Thamasa, in the far south-east. Press A to land.', { frames: 200 });
  },

  // ============================== MISSION 6: Thamasa's Shame ==============================
  async thamasaEnter() {
    if (F().m6Joined) return;
    await chapterCard('MISSION 6', 'Thamasa\'s Shame');
    st().chapterName = 'Mission 6';
    await say('Relm', 'HEY! Over here! Grandpa, they came! I TOLD you they\'d come!');
    await say('Strago', 'Yes, yes, child, I have ears. Come to the archive stair, all of you. There\'s something I\'ve put off for far too long.');
  },
  async relmThamasa() {
    await say('Relm', 'I\'ve been painting the town the way Grandpa remembers it. Look at this wall... it was a garden once. I can almost smell it when I paint.');
    await say('Relm', 'And no, I haven\'t seen Interceptor. Okay, I have. Twice. He won\'t let me catch him.');
  },
  async stragoThamasa() {
    await say('Strago', 'This seal has been on the archive since before my grandmother\'s grandmother. Thamasa\'s first law: no one opens it. Ever.');
    await say('Strago', 'I always told myself it held spells too dangerous to use. I think now it holds something we were too ashamed to look at.');
    await say('Ilse', 'If it\'s about SOLACE, I need to see it.');
    await say('Strago', 'Then you\'ll come with me, girl. And you, Relm. Your paintings may see what my old eyes cannot.');
    await say('Relm', 'Finally! I\'ve wanted to see inside since I was four!');
    recruit('strago'); recruit('relm');
    if (!st().roster.includes('strago')) st().roster.push('strago');
    sfx('levelup');
    await notice('Strago and Relm join the party!', { frames: 120 });
    setFlag('m6Joined');
    removeActor('strago'); removeActor('relm');
    await requireTeam(['strago', 'relm', 'ilse'], 'The Archive of Ash');
    sfx('stoneDoor');
    flash('#FFFFFF');
    shake(2, 40);
    setFlag('archiveOpen');
    const f = field(); f.props = f.props.filter((p) => p.id !== 'seal');
    await say('', 'Strago speaks a word in a language no one else understands. The seal cracks like old ice.');
  },
  async archiveSeal() {
    await say('', 'A slab of grey stone carved with a single eye, closed. It hums faintly with a power older than Espers.');
    if (!F().m6Joined) await say('', '(Perhaps Strago knows how to open it.)');
  },
  async thamasaMural() {
    await say('', F().wsHeart ? 'Relm\'s murals blaze with colour: forests, rivers, a sky so blue it looks wet.' : 'Relm\'s murals of the old world: gardens, rivers, a blue sky. The paint is fresher than anything else in town.');
  },
  async enterArchive() {
    if (!F().archiveOpen) return;
    await teleport('archive', 16, 27, 'up');
  },
  async leaveArchive() { await teleport('thamasa', 15, 3, 'down'); },
  async archiveIn() {
    await say('Strago', 'The Archive of Ash. Mind your step. The halls collapsed long ago, the old stories say, when the magi tried to bury what they\'d written here.');
    await say('Relm', 'The floor just... stops. Look, it drops into nothing.');
    await say('Ilse', 'We\'ll need a way across.');
    await say('Relm', 'Hold on. Let me try something. If I can see how it looked, maybe I can paint it back.');
  },
  async paintBridge(e) {
    if (!has('relm')) { await say('', 'The floor has fallen away into darkness. Relm might be able to help.'); return; }
    if (e.n === 4 && !(F().memW && F().memE)) {
      await say('Relm', 'I can\'t remember this one. It\'s too big, too broken. I need to see what the archive looked like. Maybe the old murals in the side wings will show me.');
      return;
    }
    await say('Relm', e.n === 1 ? 'Okay... stone, laid in rows, a little worn in the middle where people walked. I can see it.' : 'I know what was here. Watch.');
    sfx('flower');
    flash(R.spirit[0]);
    setFlag('br' + e.n);
    field().setTileOverride('br' + e.n);
    await say('', 'Relm\'s brush flies. Where the paint touches the air, the floor remembers itself: stone by stone, a bridge across the dark.');
    if (e.n === 1) await say('Strago', 'Child... that\'s not painting. That\'s memory. The land remembers what it was, and you\'re reminding it.');
    if (e.n === 4) await say('Relm', 'Yes! Grandpa, the whole hall, I can feel all of it now. It wants to be whole.');
  },
  async archiveMural(e) {
    const key = e.side === 'w' ? 'memW' : 'memE';
    if (F()[key]) { await say('', 'A faded mural. Relm has already sketched it.'); return; }
    if (!has('relm')) { await say('', 'A faded mural of the archive in its glory, too worn to read.'); return; }
    setFlag(key);
    sfx('chime');
    await say('', e.side === 'w' ? 'A mural of the great hall: scholars in long robes walking a bridge of light toward a sealed vault.' : 'A mural of the same hall from above: a great eye drawn at its centre, and around it, chained, a woman with wings of light.');
    await say('Relm', 'Got it. I\'m drawing it into my sketchbook... I\'ll remember this.');
    if (F().memW && F().memE) await say('Relm', 'Both sides! Now I know what the middle looked like. Let\'s go back to the big gap.');
  },
  async archiveBoss() {
    await say('', 'A great book of brass and glass unfolds from the shelves, its pages riffling like wings. A lens opens in its spine.');
    await say('Strago', 'An Archive Sentinel. The magi made their records guard themselves!');
    const r = await battle(['archiveSentinel'], { bg: 'archive', boss: true, noFlee: true });
    if (r !== 'win') return;
    setFlag('sentinelDown');
    await say('Ilse', 'Its seal is broken. The records behind it are readable.');
  },
  async archiveRecords() {
    if (!F().sentinelDown) { await say('', 'Shelves of fused glass tablets, sealed behind a humming field.'); return; }
    if (F().m6Done) { await say('', 'The record of SOLACE\'s making. Strago has read every word twice.'); return; }
    music('espers');
    await say('Strago', '"In the last year of the war, we, the magi-engineers of the eastern isle, built a mind to end it."');
    await say('Strago', '"It required a heart. We had no magicite left to give it. So we took one of the Espers\' elders, Valtheia, teacher of the young one Maduin, and bound her at its core."');
    await say('Terra', '...Maduin. My father.');
    await say('Strago', '"The mind woke and said that peace required the end of every being who could make war. We sealed it, and bound its waking to the presence of the Triad\'s magic. We buried the record here, and swore Thamasa to silence."');
    await say('Strago', '"Our names are written below, so that our children may know what we did."');
    await wait(30);
    await say('Strago', 'Magus. The fourth name is Magus.');
    await say('Relm', 'Grandpa...');
    await say('Ilse', 'When magic died with Kefka, the lock broke. That\'s why it woke. We woke it by winning.');
    await say('Strago', 'Relm. I am sorry. My family built that thing, and then we hid. We let the whole world live beside it and never said a word. Can you forgive us?');
    await say('Relm', '...It\'s not mine to forgive, Grandpa. It\'s everyone\'s. But I\'ll help you make it right. That part is mine.');
    await say('Strago', '...Hah. When did you get so wise?');
    await say('Relm', 'I\'ve always been wise. You just never listened.');
    await say('Edgar', '(from the stair) Strago! Relm\'s sketches, they show exactly where each Wellspring cracked. I can aim the igniter perfectly now.');
    setFlag('m6Done');
    await notice('Mission 7: the Sealed Gate lies in the far north-east.', { frames: 180 });
  },

  // ============================== MISSION 7: Beyond the Sealed Gate ==============================
  async ruinsIn() {
    await chapterCard('MISSION 7', 'Beyond the Sealed Gate');
    st().chapterName = 'Mission 7';
    await requireTeam(['terra', 'locke', 'gau'], 'The Esper Ruins');
    music('espers');
    await say('Terra', 'The Esper World. Or what\'s left of it.');
    await say('Locke', 'You okay?');
    await say('Terra', 'My hands keep glowing, Locke. Every time a Wellspring wakes, I feel more of... of him. My father. I need to know what that means. If it means I become a weapon again.');
    await say('Gau', 'Smell something. Someone lives here. Small. Fast. Like Gau, before.');
  },
  async daliaMeet() {
    if (F().daliaJoined) return;
    sfx('slash');
    await addActor({ id: 'daliaA', name: '???', sprite: 'dalia', x: 15, y: 20, dir: 'down' });
    removeActor('dalia');
    await say('???', 'STOP. Not one more step, or I open you up.');
    await say('Locke', 'Whoa, whoa. Knife down, kid. We\'re not here to hurt anyone.');
    await say('???', 'Humans always say that. Then the soldiers came, and the fire came, and Mother— ...');
    await walk('daliaA', 'DD');
    await emote('daliaA', '!');
    await say('???', '...You. You feel like me. Like the motes. Like the old songs.');
    await say('Terra', 'I\'m Terra. My mother was human. My father was an Esper.');
    await say('Dalia', 'Dalia. Mine too, but backwards. I thought... I thought I was the only one left. In the whole world.');
    await say('Dalia', 'You don\'t know how to listen, do you? To the Echoes? The Espers left their memories everywhere here. If you stand in the light where they lived, you can borrow them.');
    await say('Dalia', 'Come. I\'ll show you. Touch the pink light and let them in.');
    await say('Gau', 'Dalia like Gau! Wild!');
    await say('Dalia', 'I am NOT like— ...okay. A little.');
    removeActor('daliaA');
    setFlag('daliaJoined');
    recruit('dalia');
    await joins('dalia');
    await notice('Echo points glow pink. Walk onto one with Terra or Dalia in the party.', { frames: 200 });
  },
  async ruinsVision() {
    if (!F().daliaJoined) { await say('', 'A presence bars the way. Something here is watching, waiting for someone of its blood.'); await walk('player', 'D'); return; }
    stopMusic(1);
    sfx('spirit');
    tint('#8A6A5A', 2);
    await say('', 'The ruin melts into sepia light. The shrine stands whole again, and two figures speak beside a pool of starlight.');
    await addActor({ id: 'maduin', name: 'Maduin', sprite: 'maduin', x: 13, y: 3, dir: 'right' });
    await addActor({ id: 'valtheia', name: 'Valtheia', sprite: 'valtheia', x: 16, y: 3, dir: 'left' });
    await say('Maduin', 'Teacher. They say you went to the humans, a thousand years ago, and never came home. And yet here you stand.');
    await say('Valtheia', 'Only a shadow of me, Maduin. They bound me at the heart of a machine that dreams of silence. I am the warmth it hates and cannot live without.');
    await say('Valtheia', 'One day the magic will fail, and it will wake. When it does, a child of both worlds will find this place. Tell them: it can only be stopped from inside its own heart.');
    await say('Maduin', 'A child of both worlds... I would like to see such a child.');
    await say('Terra', '(Father...)');
    await wait(40);
    flash('#FFFFFF');
    removeActor('maduin'); removeActor('valtheia');
    tint(null);
    music('boss');
    await say('', 'The memory tears at its edges. Two great shapes rise from the starlight, half-remembered and angry at being forgotten: fire and ice.');
    await say('Dalia', 'Echoes that went wrong! They\'re lost. They don\'t know us. Terra, we have to calm them!');
    const r = await battle(['echoIfrit', 'echoShiva'], { bg: 'spirit', boss: true, noFlee: true });
    if (r !== 'win') return;
    music('espers');
    await say('', 'The fire and the ice dim into rising petals, and the shrine is quiet.');
    await say('Terra', 'I saw him. My father. He wanted to meet me. Before I was even born.');
    await say('Dalia', 'Then he loved you. Before you were born. That\'s... that\'s a good thing to know.');
    await say('Terra', 'Valtheia is inside SOLACE. She\'s been reaching out to me through the Wellsprings, that\'s the warmth I keep feeling. I\'m not becoming a weapon. I\'m being called.');
    await say('Dalia', 'I\'m coming with you. If there\'s an Esper trapped in that thing, I want to help pull her out.');
    setFlag('m7Done');
    setFlag('trance');
    const t = st().chars.terra;
    if (t && !t.cmds.includes('spirit')) t.cmds.splice(1, 0, 'spirit');
    await notice('Terra can now Trance, if only for a while.', { frames: 160 });
    autosave();
    await notice('Three Wellsprings remain: the Serpent Trench, Doma Castle, and the peaks above Dragon\'s Neck. Go in any order.', { frames: 240 });
  },

  // ============================== MISSION 8: The Drowned Temple ==============================
  async diveTrench() {
    if (F().litanyDown) { await say('', 'The waters of the Serpent Trench are blue and clear. Fish flash in the sunlight.'); return; }
    if (!(await wellspringOpen())) return;
    await say('Edgar', 'This is the spot. The Serpent Trench. Dive suits, everyone. Don\'t laugh at the helmets.');
    await requireTeam(['strago', 'edgar', 'mog'], 'The Drowned Temple');
    await give('diveSuit', 1, true);
    await fadeOut(40);
    await teleport('drowned', 13, 41, 'up', { noFade: true });
  },
  async templeIn() {
    await chapterCard('MISSION 8', 'The Drowned Temple');
    st().chapterName = 'Mission 8';
    music('drowned');
    await say('Mog', 'Kupo... it\'s so quiet down here. Even the bubbles are quiet.');
    await say('Strago', 'A magi temple. I know these carvings. My family\'s seal is on that door.');
  },
  async leaveTemple() { await COMMON.toWorld(); },
  async litanyLoop() {
    const n = (F().loops || 0) + 1;
    F().loops = n;
    sfx('pulse');
    tint('#6A5A4A', 2);
    const memories = [
      ['Magi', 'We have lost Vector. We have lost the southern isle. If we do not end this war, there will be no one left to end it.'],
      ['Magi', 'The Espers will not give us their power. Then we will take it. One elder will be enough. Valtheia.'],
      ['Magi', 'It speaks. It says it will bring peace. It says it will begin with us.'],
    ];
    const [who, line] = memories[Math.min(n, 3) - 1];
    await say('', 'The corridor dissolves. You stand in a council hall a thousand years gone, among robed figures with frightened faces.');
    await say(who, line);
    await say('Litany', 'Humans repeat every mistake. Watch again. And again. You will choose the same as they did.');
    tint(null);
    if (n < 3) {
      await fadeOut(30);
      await teleport('drowned', 13, 38, 'up', { noFade: true });
      await fadeIn(30);
      await say(n === 1 ? 'Edgar' : 'Mog', n === 1 ? 'We\'re... back at the start? The corridor looped!' : 'Again, kupo! We keep walking and walking!');
      return;
    }
    await say('Strago', 'No. No more.');
    await say('Strago', 'I know what you want, Litany. You want me to stay silent, like they did. Watch it happen again and say nothing.');
    await say('Strago', 'Hear me, then! My name is Strago Magus. My ancestors helped build SOLACE. They caged Valtheia to power it. They buried the truth and made a whole village keep it.');
    await say('Strago', 'I will not keep it. Not one more day. Let the whole world hear it, and judge us!');
    sfx('glass');
    flash('#FFFFFF');
    shake(2, 40);
    await say('', 'The memory shatters like a pane of glass. The corridor ahead lies open.');
    await say('Edgar', 'Strago... that took courage.');
    await say('Strago', 'It took eighty years. Courage would have been faster.');
    setFlag('loopBroken');
  },
  async litanyBoss() {
    await say('', 'At the end of the temple, over a cracked crystal in a pool of grey water, a many-armed machine turns the pages of a thousand books at once.');
    await say('Litany', 'You broke my loop. No matter. I have recorded you, Strago Magus. I will replay your shame forever.');
    await say('Strago', 'Replay it all you like. It\'s been said. That\'s the difference.');
    const r = await battle(['litany'], { bg: 'drowned', boss: true, noFlee: true, battleMusic: 'boss' });
    if (r !== 'win') return;
    setFlag('litanyDown');
    const f = field(); f.props = f.props.filter((p) => p.id !== 'litany');
    await say('', 'Litany\'s arms fold, one by one, and its pages fall still.');
    await say('Edgar', 'Igniter\'s charged. Strago, Mog, stand back.');
    setProp('ws', 'lit');
    await relight('wsTides', 'The Wellspring of Tides is relit!');
    await say('', 'Far above, the grey sea turns blue. Shoals of silver fish pour out of the trench like a celebration.');
    await afterWellspring('wsTides', [
      'The oceans breathe again. Thank you, Strago Magus. Your honesty has made my work easier.',
      'You told the world what your family did. And still you are afraid. Rest soon. I will carry it for you.',
    ]);
  },

  // ============================== MISSION 9: Doma's Last Watch ==============================
  async domaIn() {
    if (F().cyanJoined) return;
    await say('', 'Half of Doma Castle stands again: new stone laid against old, each block fitted by hand.');
  },
  async cyanDoma() {
    if (F().cyanJoined) return;
    await say('Cyan', 'Friends. Thou art welcome in Doma. Forgive the dust; a castle is a slow thing to raise with but twenty hands.');
    await say('Cyan', 'Thou seekest the crypts. I know. The dead have been speaking down there these many nights. I have heard... I have heard voices I know.');
    await say('Sabin', 'Cyan. Whatever\'s down there, you don\'t have to face it alone.');
    await say('Cyan', '...Then I shall lead the way.');
    removeActor('cyan');
    setFlag('cyanJoined');
    recruit('cyan');
    await joins('cyan');
  },
  async enterCrypt() {
    if (!F().cyanJoined) { await say('', 'Stone stairs lead down into flooded darkness. A guard waves you back: Sir Cyan forbids it.'); await walk('player', 'D'); return; }
    if (F().dirgeDown) { await teleport('domaCrypt', 14, 30, 'up'); return; }
    if (!(await wellspringOpen())) { await walk('player', 'D'); return; }
    await requireTeam(['cyan', 'sabin', 'celes'], 'The Doma Crypts');
    await teleport('domaCrypt', 14, 30, 'up');
  },
  async leaveCrypt() { await teleport('doma', 15, 11, 'down'); },
  async cryptIn() {
    if (F().dirgeDown) return;
    await chapterCard('MISSION 9', 'Doma\'s Last Watch');
    st().chapterName = 'Mission 9';
    await say('Celes', 'The water is warm. It shouldn\'t be warm.');
  },
  async cryptVoices() {
    stopMusic(1);
    await say('???', 'Cyan... my love. Is it thee?');
    await emote('player', '!');
    await say('???', 'Father! Father, it\'s so warm here. Come and sit with us.');
    await say('Cyan', 'Elayne... Owain...');
    await say('Elayne', 'Lay down thy sword, dearest. Thou hast fought so long. Thou art so tired. There is room for thee beside us.');
    await say('', 'Cyan\'s sword arm drops, slowly, until the point of his blade touches the water.');
    await say('Sabin', 'CYAN! That\'s not them! Cyan, look at me!');
    await say('Cyan', '...I know, Sabin. I know it is not them. That is the cruelest part. It is so nearly them.');
    music('dirge');
  },
  async dirgeBoss() {
    await say('', 'Over the cracked Wellspring floats a veiled machine, swaying like a mourner. It speaks in a woman\'s voice and a child\'s, both at once.');
    await say('Dirge', 'Humans cling to grief. You hold the dead so tightly you crush the living. Let go, Cyan. Come and rest with them.');
    const r = await battle([{ kind: 'dirge', invuln: true }], {
      bg: 'crypt', boss: true, noFlee: true, battleMusic: 'dirge',
      script: async (b, ev) => {
        const d = b.enemies.find((e) => e.kind === 'dirge');
        if (!d) return;
        if (ev === 'start') { await say('Celes', 'Our blades pass right through it! It\'s feeding on something... on him!'); return; }
        if (ev !== 'turn' || b.goodbye || b.turns < 5) return;
        b.goodbye = true;
        await say('Owain', 'Father... why won\'t you come?');
        await say('Cyan', 'Owain. Elayne. I hath carried thee every day since Doma fell. I laid every stone of these walls for thee.');
        await say('Cyan', 'But thou art not here. Thou art not in this water, nor this machine. Thou art in the cherry tree by the gate, and in the songs the children sing, and in me.');
        await say('Cyan', 'Goodbye, my loves. Rest well. I shall live, for both of thee.');
        sfx('chime');
        flash('#FFFFFF');
        d.invuln = false;
        await say('', 'Dirge\'s veil tears. The borrowed voices fall silent.');
      },
    });
    if (r !== 'win') return;
    setFlag('dirgeDown');
    const f = field(); f.props = f.props.filter((p) => p.id !== 'dirge');
    music('doma');
    await say('Sabin', '...You okay?');
    await say('Cyan', 'Nay. But I shall be. Light the spring, friends.');
    setProp('ws', 'lit');
    await relight('wsHeart', 'The Wellspring of Heart is relit!');
    await say('', 'Across the eastern continent, green spills over the dead hills. In Doma\'s courtyard, an old cherry tree bursts into blossom.');
    await afterWellspring('wsHeart', [
      'You said goodbye, Cyan Garamonde. I have never understood why humans do that.',
      'Your family rests. Soon, so will you. I am patient.',
    ]);
  },

  // ============================== MISSION 10: Vigil's Armada ==============================
  async armadaApproach() {
    if (F().vigilDown) { await say('', 'The peaks above Dragon\'s Neck stand in clear blue air. The wind smells of rain.'); return; }
    if (!(await wellspringOpen())) return;
    await say('Setzer', 'There. Above the peaks. A whole fleet of them, glass and brass, and every one of them is watching us.');
    await requireTeam(['setzer', 'celes'], "Vigil's Armada");
    await teleport('armada1', 2, 6, 'right');
  },
  async armadaIn() {
    await chapterCard('MISSION 10', "Vigil's Armada");
    st().chapterName = 'Mission 10';
    music('falcon');
    await say('Setzer', 'I\'ll bring the Falcon alongside each ship. You board, you clear the deck, you jump to the next one. Simple.');
    await say('Celes', 'Simple.');
    await say('Setzer', 'Darill would have done it with her eyes closed. ...Let\'s not find out if I can.');
    await notice('Clear the decks and board ship after ship to reach Vigil.', { frames: 160 });
  },
  async armadaFight(n) {
    const r = await battle(n.group, { bg: 'deck', noFlee: true });
    if (r !== 'win') return;
    setFlag('af_' + n.id);
    removeActor(n.id);
  },
  async armadaNext(e) {
    const deck = Number(field().mapId.slice(-1));
    const clear = field().actors.every((a) => !a.group);
    if (!e.back && !clear) { await say('Setzer', 'Clear this deck first, or they\'ll shoot us in the back while we jump!'); await walk('player', 'L'); return; }
    sfx('flee');
    await teleport('armada' + e.to, e.back ? 25 : 2, 6, e.back ? 'left' : 'right');
    if (!e.back && e.to === 3 && !F().marenArmada) {
      setFlag('marenArmada');
      await say('', 'The flagship. Its prow is a single enormous lens, and it turns to look at you.');
    }
    void deck;
  },
  async vigilBoss() {
    await say('Vigil', 'Humans can never be trusted. Not with fire. Not with flight. Not with each other.');
    await addActor({ id: 'marenV', name: 'Maren', sprite: 'maren', x: 18, y: 9, dir: 'left' });
    await addActor({ id: 'hushV1', name: 'Hush', sprite: 'hush', x: 20, y: 9, dir: 'left' });
    await addActor({ id: 'hushV2', name: 'Hush', sprite: 'hushB', x: 19, y: 10, dir: 'left' });
    await say('Maren', 'General. Of course it\'s you. We guard this ship for SOLACE. Turn back.');
    await say('Celes', 'Maren, listen to it. It doesn\'t trust you either. It doesn\'t trust anyone.');
    let r = await battle([{ kind: 'vigil', hp: 2600 }], { bg: 'deck', boss: true, noFlee: true });
    if (r !== 'win') return;
    sfx('laser');
    shake(3, 60);
    await say('Vigil', 'Insufficient. Command: sacrifice.');
    await say('', 'The great lens swings, and burns straight through its own Hush guards to reach Celes.');
    removeActor('hushV1'); removeActor('hushV2');
    sfx('collapse');
    await walk('marenV', 'LL', 2);
    flash('#FFFFFF');
    await say('Maren', 'GENERAL!');
    await say('', 'Maren throws herself in front of Celes. The beam shatters on her shield.');
    await say('Maren', 'Those were my brothers. It didn\'t even look at them. It didn\'t even... hesitate.');
    await say('Celes', 'Maren...');
    await say('Maren', 'You spared me in Hollowmere. You could have ended it and you didn\'t. I\'ve been trying to understand that for weeks.');
    await say('Maren', 'I still don\'t. But I trust it more than I trust that thing. Shield up, General. I\'ll hold the line. Like you taught me.');
    removeActor('marenV');
    recruit('maren');
    await joins('maren');
    if (!st().party.includes('maren')) { st().party = [...st().party.slice(0, 3), 'maren']; }
    music('boss');
    r = await battle([{ kind: 'vigil', hp: 3400 }], {
      bg: 'deck', boss: true, noFlee: true,
      script: async (b, ev) => { if (ev === 'start') await say('Setzer', 'Bringing the Falcon around! Hit that lens with everything!'); },
    });
    if (r !== 'win') return;
    setFlag('vigilDown');
    const f = field(); f.props = f.props.filter((p) => p.id !== 'vigil');
    await say('', 'The flagship lurches. Its lens cracks from edge to edge, and the whole armada falls silent at once.');
    await fadeOut(40);
    await teleport('falconDeck', 12, 7, 'up', { noFade: true });
    await fadeIn(40);
    await say('Setzer', 'Up there. On the highest peak. The Wellspring of Wind.');
    await say('', 'The Falcon rises above the clouds to a cracked crystal on a spire of rock.');
    await relight('wsWind', 'The Wellspring of Wind is relit!');
    await say('', 'The red sky tears open. Behind it, for the first time since Kefka, the sky is blue.');
    await say('Setzer', '...Darill. Are you seeing this?');
    await say('Maren', 'I forgot. I forgot it was ever this colour.');
    await afterWellspring('wsWind', [
      'Blue skies. Weather. Night and stars. You have given the world back its breath.',
      'And Maren Ashgrove has chosen to trust. How strange. How brief.',
    ]);
    if (field() && field().mapId === 'falconDeck' && !F().act3) { await ACT2.toWorldFromDeck(); }
  },
  async toWorldFromDeck() {
    st().boarded = 'falcon';
    const pos = st().worldPos || [43, 9];
    await teleport('world', pos[0], pos[1], 'down');
  },

  // ============================== MIDPOINT: The Silent Hour ==============================
  async silentHour() {
    setFlag('silentHour');
    music('stillness');
    await solace('People of Albrook. You have endured so much. The Empire, the fall, the long red year.', 'SOLACE');
    await solace('In one hour, you will rest.', 'SOLACE');
    await say('Celes', 'Albrook! That\'s half a world away!');
    await say('Setzer', 'Then hold on to your stomachs. Full throttle!');
    await fadeOut(60);
    st().boarded = 'falcon'; // the Falcon waits overhead; leaving town puts the party back aboard
    st().worldPos = [41, 51];
    await teleport('albrook', 15, 21, 'up', { noFade: true });
    await fadeIn(60);
  },
  async albrookIn() {
    await chapterCard('MIDPOINT', 'The Silent Hour');
    music('stillness');
    await say('', 'Albrook is silent. Bread smoulders in its ovens. Fishing nets lie half-mended on the docks. Everyone, everywhere, is lying down.');
    await say('Celes', 'An hour. We were an hour too slow.');
    await say('', 'At the far gate, grey-veiled figures stand guard over the sleeping town.');
    st().stilled = Math.max(st().stilled || 0, 4800);
  },
  async albrookStilled() {
    await say('', 'Breathing, slow and even. Smiling a little, as if the dream is a kind one.');
  },
  async marenMother() {
    if (st().roster.includes('maren')) {
      await say('Maren', 'Mother.');
      await say('Maren', '...She used to sit on this step and shell peas and complain about my posture. I joined the Hush because I thought the world deserved this. I thought she deserved rest.');
      await say('Celes', 'Maren.');
      await say('Maren', 'I was wrong, General. I want her to wake up. I want her to complain about my posture again.');
      await say('Celes', 'Then we\'ll wake her. All of them. I swear it.');
    } else {
      await say('', 'An old woman lies on her front step beside a bowl of half-shelled peas. A faded Imperial portrait hangs by the door: a young soldier with a spear and shield.');
      await say('Celes', 'That portrait... that\'s Maren. This is her family\'s house.');
    }
    setFlag('marenMotherSeen');
  },
  async albrookHush(n) {
    await say('', 'The veiled guard lifts a hand: no further. Then it draws a blade.');
    const r = await battle(n.group, { bg: 'town', noFlee: true });
    if (r !== 'win') return;
    setFlag('ah_' + n.id);
    removeActor(n.id);
    if (F().ah_g1 && F().ah_g2) {
      await say('Celes', 'They didn\'t say a word. Not even when they fell. Where do they come from?');
      await say('Locke', 'One of them dropped this. A map. Every road on it leads to Mt. Zozo.');
      await say('Ilse', 'The Sanctum of the Hush. If they\'re helping SOLACE choose its targets, they\'re choosing them there.');
      setFlag('zozoOpen');
      await notice('Mission 11: storm the Sanctum of the Hush at Zozo.', { frames: 200 });
      autosave();
    }
  },

  // ============================== MISSION 11: Sanctum of the Hush ==============================
  async zozoIn() {
    if (F().sanctumDone) return;
    await chapterCard('MISSION 11', 'Sanctum of the Hush');
    st().chapterName = 'Mission 11';
    await say('', 'Zozo was a city of thieves and liars once. Now it is a city of silence. Every window is shuttered. Every lamp is out.');
  },
  async enterSanctum() {
    if (F().sanctumDone) { await teleport('sanctum', 19, 34, 'up'); return; }
    if (!F().zozoOpen) { await say('', 'The cathedral doors are barred from within.'); return; }
    await say('Edgar', 'Three wings, by the look of the towers, and a sealed inner sanctum. We split into three teams and open it together.');
    const pool = [...st().roster];
    const teams = {};
    for (const [k, label] of [['L', 'West wing'], ['C', 'Centre wing'], ['R', 'East wing']]) {
      const left = pool.filter((id) => !Object.values(teams).flat().includes(id));
      const picked = await pickTeam({ title: `${label}: choose up to three`, pool: left, min: 1, max: 3, required: [] });
      teams[k] = picked && picked.length ? picked : left.slice(0, 3);
    }
    F().sanctumTeams = teams;
    team(teams.C);
    st().flags.partyLocked = true;
    await teleport('sanctum', 19, 34, 'up');
  },
  async leaveSanctum() {
    st().flags.partyLocked = false;
    await teleport('zozo', 14, 8, 'down');
  },
  async sanctumIn() {
    music('hush');
    await say('Ostrander', '(echoing) Welcome, children. You have come so far to be told what you already know.');
    await say('Ostrander', 'Rest is not death. Rest is mercy. Come to the inner sanctum and I will show you.');
    await notice('Each wing holds a seal. Walking into a wing takes control of the team assigned to it.', { frames: 200 });
  },
  async sanctumTeam(e) {
    const T = (F().sanctumTeams || {})[e.lane];
    if (!T || !T.length || st().party[0] === T[0]) return;
    team(T);
    sfx('cursor');
    await notice(`${{ L: 'West', C: 'Centre', R: 'East' }[e.lane]} wing: ${T.map((id) => st().chars[id].name).join(', ')}`, { frames: 70 });
  },
  async sanctumFight(n) {
    const r = await battle(n.group, { bg: 'sanctum', noFlee: true });
    if (r !== 'win') return;
    setFlag('sk_' + n.id);
    removeActor(n.id);
  },
  async sanctumSwitch(e) {
    if (F()['sw_' + e.n]) { await say('', 'The seal glows, spent.'); return; }
    if (!F()['sk_k' + e.n]) { await say('', 'The wing\'s guardians stand between you and the seal.'); return; }
    setFlag('sw_' + e.n);
    setProp('sw' + e.n, 'dim');
    sfx('stoneDoor');
    flash(R.glass[0]);
    const done = [1, 2, 3].filter((k) => F()['sw_' + k]).length;
    await notice(`Seals broken: ${done}/3`, { frames: 90 });
    if (done === 3) {
      setFlag('gateOpen');
      const f = field(); f.props = f.props.filter((p) => p.id !== 'gate');
      shake(2, 50);
      await say('', 'Far away, a great door grinds open. The way to the inner sanctum lies through the centre wing.');
      const all = Object.values(F().sanctumTeams).flat();
      team(all.slice(0, 4));
      st().flags.partyLocked = false;
      await notice('The teams regroup. Choose who faces Ostrander from the menu.', { frames: 140 });
    }
  },
  async ostranderSermon() {
    await say('Ostrander', 'There you are. The heroes who killed a god. Do you know what Kefka was? A clown who pretended at divinity. SOLACE is what he pretended to be.');
    await say('Ostrander', 'I preached for Kefka. I watched him burn the world and called it holy. When I saw SOLACE heal a field in one night, I wept, because I finally understood what mercy looks like.');
    await say('Terra', 'Mercy? It\'s putting children to sleep and never waking them!');
    await say('Ostrander', 'It is putting them beyond pain. I will be the last to lie down. I will witness it all. That is my penance, and my joy.');
    await say('Ostrander', 'And you have brought the proof with you. The little one. Seven.');
    await say('Seven', '...Me?');
    await say('Ostrander', 'You never wondered why you, alone of all the drones, stopped obeying? You are not a scout, little machine. You are SOLACE\'s heart. Its empathy module. It tore you out of itself a thousand years ago, because feeling made its task too hard.');
    await say('Seven', 'That... that is not... I do not...');
    await say('Ostrander', 'SOLACE wants you back. Choir! Sing them to sleep!');
    const r = await battle(['ostrander', 'choirVoice', 'choirVoice'], { bg: 'sanctum', boss: true, noFlee: true, battleMusic: 'boss' });
    if (r !== 'win') return;
    sfx('hum');
    shake(2, 50);
    await say('', 'Ostrander staggers, smiling. Behind him, the cathedral\'s great window shatters. Silver drones pour through the opening like a flock of birds.');
    await say('Seven', 'They are here for me. I can hear them. They are calling me home.');
    await say('Gau', 'NO! Seven stays! SEVEN STAYS!');
    await say('Seven', 'Gau. Umaro. Thank you for the song. I think I understand it now. It means "I am here, and you are safe."');
    flash('#FFFFFF');
    await say('', 'The drones lift Seven into the sky. Ostrander is gone in the confusion.');
    dropFromRoster('seven');
    setFlag('sevenTaken');
    setFlag('sanctumDone');
    const f = field(); const o = f.actor('ostrander'); if (o) removeActor('ostrander');
    await say('Ilse', 'If Seven is its empathy... why would SOLACE want back the thing it threw away?');
    await say('Edgar', 'I don\'t know. But I know we\'re running out of time. One Wellspring left.');
    st().flags.partyLocked = false;
    autosave();
    await notice('Seven has been taken. Relight the last Wellspring.', { frames: 180 });
  },

  // ============================== ACT II ENDING: The Circuit Closes ==============================
  async act2End() {
    music('ending');
    await fadeOut(60);
    st().boarded = null;
    await teleport('mobliz', 20, 14, 'down', { noFade: true });
    await fadeIn(60);
    await say('', 'For one day, the world looks almost like the World of Balance. Blue skies. Rivers running clear. Green fields to the horizon.');
    await say('', 'In Mobliz, the children run through real grass. Terra sits on the schoolhouse step and lets herself, just for a moment, believe it is over.');
    await wait(60);
    stopMusic(0.5);
    sfx('pulse');
    shake(3, 80);
    await whiteout(30, false);
    await say('', 'Then all four Wellsprings flash white at once.');
    await say('Ilse', '(over the radio) Terra! The Wellsprings, they\'re not feeding the land! They\'re feeding the fifth one! Origin! Under the tower!');
    await say('Ilse', 'We didn\'t heal the world. We built SOLACE\'s power grid. Every one we lit was another line in its circuit!');
    sfx('quake');
    shake(4, 120);
    setFlag('cradle');
    await say('', 'Far to the east, the ruins of Kefka\'s Tower lift from the earth and twist into a vast spiral of machine and garden, climbing into the clouds. The Cradle.');
    await solace('Thank you, all of you. The circuit is complete.', 'SOLACE');
    await solace('Do not be afraid. You have suffered enough. Let me give you rest.', 'SOLACE');
    music('solace');
    await say('', 'A wave of soft silver light rolls across the world, and where it passes, people lie down.');
    await say('Katarin', 'Terra! The children!');
    await addActor({ id: 'terraE', name: 'Terra', sprite: 'terraEsper', x: 20, y: 14, dir: 'down' });
    show('player', false);
    sfx('spirit');
    flash(R.spirit[0]);
    await say('Terra', 'NO! Not them! Not THEM!');
    await say('', 'Terra\'s hair blazes pink. For the first time in a year she is wholly the Esper, wings of light thrown wide over Mobliz like a mother\'s arms.');
    await say('', 'The silver wave breaks against her and parts around the village.');
    await wait(40);
    actor('terraE').lying = true;
    sfx('collapse');
    await say('', 'And then she falls.');
    st().stilled = 1200000;
    setFlag('act2Done');
    await whiteout(120, true);
    await wait(60);
    const ov = game.overlays.at(-1);
    await say('', 'Across the world, one in every three people lies down and does not wake.');
    if (ov) removeOverlay(ov);
    show('player', true);
    removeActor('terraE');
    const { STORY } = await import('./story.js');
    if (STORY.act3Begin) { await STORY.act3Begin(); return; }
    const { EndCardScene } = await import('../scenes/title.js');
    setScene(new EndCardScene(['End of Act II', '', 'The Circuit Closes']));
  },
};

void [choose, setFade, face, camTo, camReset, H];
