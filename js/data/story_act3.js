// Act III — Requiem: Seven Days of Silence, Gathering the Scattered, the Dreaming Esper,
// Gogo's Gambit, the Cradle, SOLACE, the Green Return and the epilogue.
import {
  say, choose, notice, caption, wait, fadeOut, fadeIn, flash, shake, setFade,
  walk, face, actor, show, addActor, removeActor, emote, setProp, tint,
  teleport, setFlag, give, giveParts, battle, field, recruit, sfx, music, stopMusic,
} from '../script.js';
import { game, setScene, pushOverlay, removeOverlay } from '../game.js';
import { W, H, ditherRect } from '../core/gfx.js';
import { drawTextCentered } from '../core/font.js';
import * as input from '../core/input.js';
import { R, OUTLINE } from './palette.js';
import { COMMON, st, autosave, relight, joins, pickTeam, chapterCard, solace, team, requireTeam, restorationWave } from './story_common.js';
import { ACT2 } from './story_act2.js';

const F = () => game.state.flags;
const has = (id) => st().party.includes(id);
const inRoster = (id) => (st().roster || []).includes(id);
const name = (id) => st().chars[id].name;

async function endBattle(b, result = 'win') {
  b.over = true; b.menu = null; b.mini = null;
  await fadeOut(24);
  b.finish(result);
}

// Each life saved or person woken lowers the Stilled count shown in the menu.
async function saved(n, why) {
  st().stilled = Math.max(0, (st().stilled || 0) - n);
  await notice(`${why}  Stilled: ${st().stilled.toLocaleString('en-US')}`, { frames: 130 });
}

// Recruit returning friends, keeping the active party at four.
async function rejoin(...ids) {
  for (const id of ids) {
    recruit(id);
    await joins(id);
  }
}

// ---------------------------------------------------------------- Gogo's mirror game (rhythm minigame)
const ARROW = { up: [[3, 0], [2, 1], [4, 1], [1, 2], [5, 2], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5]], down: [], left: [], right: [] };
ARROW.down = ARROW.up.map(([x, y]) => [x, 5 - y]);
ARROW.left = ARROW.up.map(([x, y]) => [y, x]);
ARROW.right = ARROW.up.map(([x, y]) => [5 - y, x]);
function mirrorGame(len) {
  return new Promise((resolve) => {
    const dirs = ['up', 'down', 'left', 'right'];
    const seq = Array.from({ length: len }, () => dirs[Math.floor(Math.random() * 4)]);
    const ov = {
      t: 0, stage: 'show', i: 0, got: [], flashT: 0, seq,
      update() {
        this.t++;
        if (this.stage === 'show') {
          if (this.t % 36 === 0) { this.i++; if (this.i >= seq.length) { this.stage = 'input'; this.t = 0; } else sfx('cursor'); }
          if (this.t === 1) sfx('cursor');
          return;
        }
        if (this.stage === 'input') {
          for (const d of dirs) if (input.pressed(d)) {
            this.got.push(d); this.flashT = 8;
            if (d !== seq[this.got.length - 1]) { sfx('buzzer'); this.stage = 'done'; this.ok = false; this.t = 0; return; }
            sfx('confirm');
            if (this.got.length === seq.length) { sfx('levelup'); this.stage = 'done'; this.ok = true; this.t = 0; }
          }
          if (this.t > 60 * 12) { this.stage = 'done'; this.ok = false; this.t = 0; }
          return;
        }
        if (this.t > 50) { removeOverlay(this); input.clearAll(); resolve(this.ok); }
      },
      draw(ctx) {
        ditherRect(ctx, 0, 0, W, H, OUTLINE, 2);
        ctx.fillStyle = OUTLINE; ctx.fillRect(60, 60, W - 120, 96);
        ctx.fillStyle = R.plum[2]; ctx.fillRect(62, 62, W - 124, 92);
        drawTextCentered(ctx, this.stage === 'show' ? 'Watch Gogo...' : this.stage === 'input' ? 'Your turn! Mirror the dance.' : this.ok ? 'Perfect mirror!' : 'Gogo tilts its head.', W / 2, 70, R.stone[0]);
        const n = seq.length, x0 = W / 2 - (n * 20) / 2;
        for (let k = 0; k < n; k++) {
          const shown = this.stage === 'show' ? k === this.i : k < this.got.length;
          const d = this.stage === 'show' ? seq[k] : this.got[k];
          ctx.fillStyle = R.plum[3]; ctx.fillRect(x0 + k * 20, 100, 16, 16);
          if (shown && d) { ctx.fillStyle = this.stage === 'done' && !this.ok && k === this.got.length - 1 ? R.tunicRed[1] : R.brass[0]; for (const [px, py] of ARROW[d]) ctx.fillRect(x0 + k * 20 + 3 + px * 2, 102 + py * 2, 2, 2); }
        }
        if (this.stage === 'input') drawTextCentered(ctx, 'Use the d-pad', W / 2, 132, R.stone[1]);
      },
    };
    pushOverlay(ov);
  });
}

// ---------------------------------------------------------------- Setzer's card game: high or low
async function highLow() {
  let wins = 0;
  let card = 2 + Math.floor(Math.random() * 11);
  const label = (c) => ({ 11: 'Jack', 12: 'Queen', 13: 'King', 14: 'Ace' }[c] || String(c));
  for (let round = 1; round <= 3; round++) {
    await say('Setzer', `Round ${round}. The card is a ${label(card)}. Higher or lower?`);
    const c = await choose(['Higher', 'Lower']);
    let next = card;
    while (next === card) next = 2 + Math.floor(Math.random() * 13);
    const right = c === 0 ? next > card : next < card;
    sfx(right ? 'item' : 'buzzer');
    await say('', `He flips a ${label(next)}. ${right ? 'You win the hand.' : 'Setzer takes the hand.'}`);
    if (right) wins++;
    card = next;
  }
  return wins >= 2;
}

export const ACT3 = {
  // ============================== ACT III opens ==============================
  async act3Begin() {
    setFlag('act3');
    setFlag('bloomSpread');
    st().chapterName = 'Act III';
    st().roster = ['ilse'];
    team(['ilse']);
    st().vehicles = {};
    st().boarded = null;
    st().flags.partyLocked = false;
    const il = st().chars.ilse;
    il.hp = il.maxhp; il.sp = il.maxsp;
    await teleport('figaro', 3, 18, 'up', { noFade: true, noFadeIn: true });
    setFade(4);
  },
  async act3Wake() {
    await chapterCard('ACT III', 'Requiem');
    await chapterCard('MISSION 12', 'Seven Days of Silence');
    st().chapterName = 'Mission 12';
    music('stillness');
    await say('Nurse', 'Easy. Easy. You\'ve been asleep seven days. Not the bad sleep. The ordinary kind.');
    await say('Ilse', 'Seven days... Where is everyone? Edgar? The Falcon?');
    await say('Nurse', 'Half the castle lies Stilled in their beds. His Majesty went into the sea after that temple of his and never came back. The Falcon came down somewhere in the west.');
    await say('Nurse', 'The others scattered when the light came. Nobody knows who\'s awake and who isn\'t.');
    await wait(30);
    await say('Ilse', '(The last time the world ended, I ran. I ran out of that vault and left eleven people on the floor.)');
    const c = await choose(['Run', 'Stay and act']);
    if (c === 0) await say('Ilse', '...No. Not again. Not this time.');
    await say('Ilse', 'There\'s a skiff in the workshop, isn\'t there? Edgar was always tinkering with one.');
    await say('Nurse', 'In pieces, love.');
    await say('Ilse', 'Pieces I can work with.');
    await notice('Repair the skiff in Edgar\'s workshop (north-east room).', { frames: 160 });
  },
  async repairSkiff() {
    if (st().parts < 4) { await say('Ilse', `I need more parts. ${st().parts} won't hold together. ...I'll strip the dead engine for what I can.`); st().parts = 4; }
    sfx('build');
    await wait(30);
    sfx('build');
    st().parts -= 4;
    setFlag('skiffBuilt');
    st().vehicles.skiff = [25, 36];
    await say('', 'Ilse works through the night. By morning a small brass skiff rocks on the water east of the castle.');
    await say('Ilse', 'Celes was at Maranda when the light came. If anyone\'s still fighting, it\'s her.');
    await chapterCard('MISSION 13', 'Gathering the Scattered');
    st().chapterName = 'Mission 13';
    await notice('The skiff waits on the coast east of Figaro. Walk onto it to sail.', { frames: 180 });
    await notice('Celes and Terra are needed. Everyone else you find makes the last battle easier.', { frames: 200 });
    autosave();
  },

  // ---------------------------------------------------------------- Celes & Maren: Maranda
  async marandaIn() {
    if (F().marandaFreed) return;
    await say('', 'Maranda\'s streets are barricaded with crates and carts. Beyond them, the Hush have the town ringed.');
    await say('Celes', 'Ilse?! You\'re alive! Get behind the line!');
    await say('Maren', 'They\'ve been at the gate three days. Siegebreakers, gunners. We can hold, but we can\'t break them.');
    await say('Ilse', 'Then I\'ll break them from behind.');
    await notice('Break the siege: defeat the three Hush companies.', { frames: 140 });
  },
  async marandaCeles() {
    if (!F().marandaFreed) { await say('Celes', 'Hit them from the south side! We\'ll hold the gate!'); return; }
  },
  async siegeFight(n) {
    const r = await battle(n.group, { bg: 'desert', noFlee: true });
    if (r !== 'win') return;
    setFlag('sg_' + n.id);
    removeActor(n.id);
    if (!['sg1', 'sg2', 'sg3'].every((k) => F()['sg_' + k])) return;
    setFlag('marandaFreed');
    music('celes');
    await say('', 'The last of the Hush throw down their grey veils and run.');
    await say('Celes', 'It\'s over. Maranda\'s safe.');
    await say('Maren', 'General... you came for these people. Imperial people. People who cheered when the Empire marched.');
    await say('Celes', 'They\'re people, Maren. That\'s all I need them to be.');
    await say('Celes', 'Ilse. Terra... is she?');
    await say('Ilse', 'Asleep in Mobliz, last I heard. Not Stilled. Something else. We need to find a way to reach her.');
    removeActor('celesM'); removeActor('marenM');
    setFlag('celesJoined3');
    await rejoin('celes', 'maren');
    await saved(46000, 'Maranda is saved.');
    autosave();
  },

  // ---------------------------------------------------------------- Edgar: the Drowned Temple
  async diveTrench(L) {
    if (!F().act3) return ACT2.diveTrench(L);
    if (F().edgarJoined3) { await say('', 'The Serpent Trench lies clear and blue.'); return; }
    await say('Ilse', 'This is where Edgar went down. His suit beacon\'s still blinking. He\'s alive in there.');
    await give('diveSuit', 1, true);
    await fadeOut(40);
    await teleport('drowned', 13, 41, 'up', { noFade: true });
    await fadeIn(30);
  },
  async templeRescue() {
    setFlag('rescueFought');
    await say('', 'Silver drones swarm the corridor, circling something at the far end: a light, blinking in a steady rhythm. S. O. S.');
    const r = await battle(['tideDrone', 'tideDrone', 'gunDrone'], { bg: 'drowned', noFlee: true });
    if (r !== 'win') return;
  },
  async edgarTrapped() {
    if (!F().rescueFought) return;
    await say('Edgar', 'Ilse! Thank the stars. I came down to cut the Wellspring\'s line to Origin and the whole temple sealed itself around me.');
    await say('Edgar', 'I managed to dampen it. Only this one. We can\'t undo what we built, but we can make sure it isn\'t feeding SOLACE at full strength.');
    await say('Ilse', 'That might be the difference between winning and losing.');
    await say('Edgar', 'Then let\'s go and find out which one it is.');
    removeActor('edgarT');
    setFlag('edgarJoined3');
    await rejoin('edgar');
    await saved(12000, 'The sea is safe for fishing boats again.');
  },

  // ---------------------------------------------------------------- Sabin & Gau: the Veldt
  async veldtEscort() {
    if (F().sabinJoined3) return;
    await say('Sabin', 'Ilse! Perfect timing. We\'re leading these folks west, away from the Bloom. The drones keep hunting stragglers.');
    await say('Gau', 'Gau smell them coming! Many! Protect small ones!');
    const waves = [['stalker', 'stalker'], ['bloomHound', 'bloomHound'], ['gardener', 'bloomHound']];
    for (const [i, w] of waves.entries()) {
      await say('', ['The herd path narrows between the thorns...', 'A ridge of dead grass. Something silver moves in it.', 'Almost to the river crossing!'][i]);
      const r = await battle(w, { bg: 'plains', noFlee: true, party: [...new Set([...st().party.filter((id) => id !== 'sabin' && id !== 'gau').slice(0, 2), 'sabin', 'gau'])] });
      if (r !== 'win') return;
    }
    setFlag('veldtEscorted');
    removeActor('ref1'); removeActor('ref2'); removeActor('sabinV'); removeActor('gauV');
    await say('Sabin', 'That\'s everyone across. You know, Duncan always said the hardest strength is the kind that holds back. I finally get it.');
    setFlag('sabinJoined3');
    await rejoin('sabin', 'gau');
    await saved(30000, 'The refugees reach the river.');
  },
  async refugee() { await say('Refugee', 'The big man and the wild boy keep the drones off us. Bless them.'); },

  // ---------------------------------------------------------------- Setzer: the Falcon's hangar
  async setzerHangar() {
    if (F().setzerJoined3) return;
    await say('Setzer', 'Oh. It\'s you. Come for a drink? I\'d offer, but I drank it.');
    await say('Setzer', 'She went down in the light. I kept her in the air for an hour after the engines quit, and then I just... let her land. I didn\'t have it in me.');
    if (!F().setzerBeaten) {
      await say('Setzer', 'Tell you what. Beat me at cards and I\'ll listen to whatever speech you\'ve got. High or low, best of three.');
      const won = await highLow();
      if (!won) { await say('Setzer', 'Ha. Lady Luck\'s still mine. Try again whenever you like.'); return; }
      setFlag('setzerBeaten');
      await say('Setzer', '...Huh. Fine. Speech.');
    }
    if (!F().gotDarillLog) { await say('Ilse', '(There must be something that would reach him. That crate by the rail has a name scratched in it: DARILL.)'); return; }
    await say('Ilse', 'I found this in the crate. Darill\'s flight log.');
    await say('', 'Setzer reads the last page. His face goes very still.');
    await say('Setzer', '"If the sky ever falls, Setzer, don\'t you dare sit on the ground and sulk about it. Fly it back up." ...She knew me too well.');
    await say('Setzer', 'All right. All RIGHT. Let\'s get this old girl in the air.');
    sfx('engine');
    shake(2, 60);
    removeActor('setzerH3');
    setFlag('setzerJoined3');
    await rejoin('setzer');
    await say('', 'The Falcon\'s engines cough, catch, and roar.');
    st().boarded = 'falcon';
    st().vehicles.falcon = null;
    if (st().vehicles.skiff === null || !st().vehicles.skiff) st().vehicles.skiff = [25, 36];
    st().worldPos = [9, 23];
    await notice('The Falcon flies again!', { frames: 140 });
    await teleport('world', 9, 23, 'down');
  },
  async darillLog() {
    setFlag('gotDarillLog');
    setProp('logCrate', 'open');
    sfx('door');
    await give('darillLog', 1);
  },

  // ---------------------------------------------------------------- Locke: the Ashen Reach
  async ashenAct3() {
    if (F().lockeJoined3) return;
    await say('', 'A dust storm howls across the Reach. The wind is so thick with ash you can barely see your own hands.');
    await say('Ilse', 'Locke came this way looking for Celes. If he\'s in this storm, he\'ll have left a trail. He always marks his way.');
  },
  async lockeTrail(e) {
    if (F().lockeJoined3 || F().trackDone) return;
    const step = F().trail || 0;
    if (e.n !== step + 1) { if (e.n > step + 1) await say('', 'Only dust here. The trail must begin somewhere else.'); return; }
    F().trail = e.n;
    sfx('item');
    const clue = [
      'A knife-mark scratched into a rock: an arrow, pointing west. Locke\'s mark.',
      'A torn strip of blue cloth tied to a dead branch. Further west.',
      'Footprints, fresh, circling a rock as if someone kept coming back to the same spot.',
    ][e.n - 1];
    await say('', clue);
    if (e.n === 3) {
      await say('', 'Something huge moves in the storm. Then two of them.');
      const r = await battle(['stalker', 'stalker'], { bg: 'wasteland', noFlee: true });
      if (r !== 'win') return;
      setFlag('trackDone');
      await addActor({ id: 'lockeA', name: 'Locke', sprite: 'locke', x: 4, y: 13, dir: 'up', talk: 'lockeFound' });
      await say('Locke', '(somewhere in the dust) ...Hello? Is someone there?');
    }
  },
  async lockeFound() {
    if (F().lockeJoined3) return;
    if (has('celes')) {
      await say('Locke', 'Celes...? Celes! I looked everywhere. I thought you were— I thought I\'d lost—');
      await say('Celes', 'You can\'t lose me, Locke. I\'m not a treasure. I find my own way home.');
      await say('Locke', 'Yeah. Yeah, you do.');
    } else {
      await say('Locke', 'Ilse? Is... is Celes with you?');
      await say('Ilse', 'Not yet. But she\'s alive. I\'m sure of it.');
      await say('Locke', '...Then I\'m going with you. You keep showing up for people. I\'m starting to think I was wrong about you.');
    }
    removeActor('lockeA');
    setFlag('lockeJoined3');
    await rejoin('locke');
    await saved(5000, 'Locke found a caravan lost in the storm, and led it out.');
  },

  // ---------------------------------------------------------------- Cyan: Doma's long night
  async domaNight() {
    if (F().cyanJoined3) return;
    await say('Cyan', 'Friends. Thou comest at dusk, which is ill timing. Every night the drones come for the sleepers. Every night I send them back.');
    await say('Cyan', 'Wilt thou stand the watch with me?');
    const f = field();
    f.darkOverride = 2;
    music('doma');
    const waves = [['bloomHound', 'bloomHound'], ['gardener', 'thornChoir'], ['bloomHound', 'gardener', 'bloomHound']];
    for (const [i, w] of waves.entries()) {
      await say('', ['First watch. Silver shapes drift over the wall.', 'Midnight. The cherry tree shivers as something brushes past.', 'The darkest hour before dawn. They come all at once.'][i]);
      const r = await battle(w, { bg: 'eastern', noFlee: true, party: [...new Set(['cyan', ...st().party])].slice(0, 4) });
      if (r !== 'win') { f.darkOverride = null; return; }
    }
    f.darkOverride = null;
    flash('#FFF4C0');
    await say('', 'Dawn breaks over Doma. Every sleeper is still breathing.');
    await say('Cyan', 'Then I may leave them in good hands for a little while. Lead on. I would see this ended.');
    removeActor('cyanN');
    setFlag('cyanJoined3');
    await rejoin('cyan');
    await saved(8000, 'Doma\'s sleepers are safe.');
  },

  // ---------------------------------------------------------------- Strago & Relm: Thamasa's pigments
  async relmPigments() {
    if (F().relmJoined3) return;
    const need = ['pigmentRed', 'pigmentBlue', 'pigmentGreen'];
    const have = need.filter((p) => st().items[p]);
    if (!F().relmAsked) {
      setFlag('relmAsked');
      await say('Relm', 'Ilse! I\'m painting a cure. I think. My paintings remember places, so maybe they can remember people too. How they were when they were awake.');
      await say('Strago', 'She needs pigment made from the living land. Ember from Narshe\'s glowing veins, blue from the restored sea, green from Doma\'s new forest.');
      await say('Relm', 'Bring me those and I\'ll paint them all awake. Or at least I\'ll try really, really hard.');
      await notice('Find three pigments: Narshe\'s mines, the Drowned Temple, and Doma\'s cherry tree.', { frames: 200 });
      return;
    }
    if (have.length < 3) { await say('Relm', `${have.length} of 3 pigments! Keep going!`); return; }
    sfx('flower');
    flash(R.spirit[0]);
    await say('', 'Relm mixes the pigments. On a blank canvas, a sleeping villager appears, and as she paints his eyes open, the man in the house next door sits up and yawns.');
    await say('Relm', 'IT WORKS! It works on one at a time, it takes forever, but it WORKS!');
    await say('Strago', 'Child... if your brush can reach a sleeper, could it reach Terra?');
    await say('Relm', '...Let\'s go find out.');
    for (const p of need) delete st().items[p];
    removeActor('relmT'); removeActor('stragoT');
    setFlag('relmJoined3');
    setFlag('relmCure');
    await rejoin('strago', 'relm');
    await saved(20000, 'Thamasa wakes, one portrait at a time.');
  },
  async pigment(e) {
    setFlag('got_' + e.color);
    await give(e.color, 1);
  },

  // ---------------------------------------------------------------- Mog & Umaro: the Narshe mines
  async clearTunnel() {
    await say('', 'Fallen rock chokes the old rail tunnel. Behind it, faintly: "Kupo... kupo..."');
    await say('', 'As you heave at the rubble, the stones shift, and something crawls out of the gap.');
    const r = await battle(['crawler', 'crawler', 'stalker'], { bg: 'mine', noFlee: true });
    if (r !== 'win') return;
    setFlag('tunnelClear');
    const f = field(); f.props = f.props.filter((p) => p.id !== 'cavein');
    sfx('quake');
    await say('', 'With one last heave, the cave-in gives way.');
  },
  async mogTrapped() {
    if (F().mogJoined3) return;
    await say('Mog', 'KUPO! Light! Friends! Mog and Umaro were digging out the moogles when the roof came down, kupo!');
    await say('Umaro', 'Hrrrrnnh. Dig. Dig. Dig.');
    await say('Mog', 'Every moogle is safe now, kupo. We can go!');
    removeActor('mogM'); removeActor('umaroM');
    setFlag('mogJoined3');
    await rejoin('mog', 'umaro');
    await saved(3000, 'Narshe\'s miners and moogles are free.');
  },

  // ---------------------------------------------------------------- Dalia: lost inside an Echo
  async daliaLost() {
    if (F().daliaJoined3) return;
    await say('', 'Dalia lies curled on the shrine floor, breathing slowly. Pink motes swirl above her like a storm.');
    await say('Ilse', 'She\'s inside an Echo. Too deep. I\'ll have to follow her in.');
    tint('#8A6A5A', 2);
    sfx('spirit');
    await say('', 'The world turns sepia. Dalia stands in a burning village, a small girl clutching a knife, while a woman with wings of light pushes her into a hiding place.');
    await say('Dalia', 'Mother, don\'t go. Don\'t go out there. Mother!');
    const r = await battle(['lostEcho', 'lostEcho', 'lostEcho'], { bg: 'spirit', noFlee: true });
    tint(null);
    if (r !== 'win') return;
    await say('Ilse', 'Dalia. Dalia, it\'s a memory. It already happened. You can\'t stop it by staying inside it.');
    await say('Dalia', '...I know. I just wanted to see her one more time.');
    removeActor('daliaE');
    setFlag('daliaJoined3');
    await rejoin('dalia');
  },

  // ---------------------------------------------------------------- Gogo: the Zone Eater
  async zoneIn() {
    if (F().gogoJoined) return;
    await say('', 'The Zone Eater\'s gullet. Damp, dark, and full of the bones of the curious.');
  },
  async gogoMeet() {
    if (F().gogoJoined) return;
    await say('???', '...');
    await say('???', 'I am Gogo. I mirror. I have mirrored kings and thieves and gods. Mirror me, and I will mirror whatever you wish.');
    for (const len of [4, 5, 6]) {
      let ok = await mirrorGame(len);
      while (!ok) {
        await say('Gogo', 'Again.');
        ok = await mirrorGame(len);
      }
    }
    await say('Gogo', '...You mirror well. So. Whom shall I become?');
    await say('Ilse', 'SOLACE. It predicts everything we do. It can\'t predict you.');
    await say('Gogo', 'A machine that reads the future. How delicious. I accept.');
    removeActor('gogo');
    setFlag('gogoJoined');
    await rejoin('gogo');
  },

  // ============================== MISSION 14: The Dreaming Esper ==============================
  async terraComa() {
    if (F().m14Done) return;
    await say('Katarin', 'She hasn\'t moved since the light came. She\'s warm. She breathes. She just won\'t come back.');
    if (!(inRoster('relm') && inRoster('dalia') && inRoster('celes'))) {
      await say('Ilse', '(Relm\'s paintings reach sleepers. Dalia hears Esper minds. Celes... Terra trusts Celes. We need all three.)');
      return;
    }
    await chapterCard('MISSION 14', 'The Dreaming Esper');
    st().chapterName = 'Mission 14';
    await requireTeam(['relm', 'dalia', 'celes'], 'Into the dream');
    await say('Relm', 'I\'ll paint her. Not how she looks. How she feels inside.');
    sfx('flower');
    await say('', 'Relm paints for an hour without speaking. On the canvas appears a green field under a blue sky, and a small figure standing alone in it.');
    await say('Dalia', 'That\'s her. That\'s where she is. Hold my hand, all of you. I\'ll take us through.');
    sfx('spirit');
    flash(R.spirit[0]);
    await fadeOut(60);
    await teleport('dream', 15, 30, 'up', { noFade: true });
    await fadeIn(60);
  },
  async dreamIn() {
    music('dream');
    await say('Celes', 'This is... the World of Balance. Before Kefka. I\'d forgotten the grass smelled like this.');
    await say('Dalia', 'This is how she remembers it. She\'s somewhere ahead. Hurry. Dreams don\'t stay still.');
  },
  async dreamTerra() {
    await say('Terra', 'Celes? Relm? ...And you. The girl from the ruins.');
    await say('Dalia', 'Dalia. You have to come back, Terra. Everyone\'s waiting.');
    await say('Terra', 'Back to what? Every time I wake up there\'s another fight. Another thing I have to become. Here it\'s quiet. Here I\'m just... a girl in a field.');
    await say('Celes', 'Terra, the children in Mobliz are awake because of you. Pip sits by your bed every day.');
    await say('Terra', '...Pip.');
    await say('Terra', 'There\'s someone else here. Up the hill. She\'s been calling me for a long time. I was afraid to go alone.');
    await say('Relm', 'You\'re not alone now. Come on.');
    removeActor('terraD');
    setFlag('dreamTerraMet');
    await addActor({ id: 'valtheia', name: 'Valtheia', sprite: 'valtheia', x: 15, y: 4, dir: 'down', talk: 'dreamValtheia' });
  },
  async dreamValtheia() {
    if (F().kefkaDown) return;
    music('espers');
    await say('Valtheia', 'Child of Maduin. At last.');
    await say('Valtheia', 'For a thousand years I have been the heart of a thing that hates hearts. Every Wellspring you lit, I reached through. I am sorry it frightened you.');
    await say('Valtheia', 'SOLACE cannot be broken from outside. It can only be changed from within its own heart. And its heart is not me. Its heart is the little one it threw away.');
    await say('Terra', 'Seven.');
    await say('Valtheia', 'Seven. Bring Seven home to SOLACE, and SOLACE will feel what it is doing. For the first time.');
    await say('Valtheia', 'And you must choose what you are, Terra. Not a weapon. Not a girl hiding in a field. A bridge, between all of us.');
    await say('Terra', '...A bridge. Yes. I think I can be that.');
    setFlag('dreamValtheiaMet');
    removeActor('valtheia');
    stopMusic(0.5);
    sfx('pulse');
    shake(3, 60);
    tint('#5A2434', 2);
    const f = field();
    f.props.push({ id: 'kefkaF', type: 'kefkaFig', x: 14, y: 6 });
    await say('???', 'Ohhh, how TOUCHING. A bridge! Hee hee hee!');
    await say('Terra', 'No... You\'re gone. You\'re dead.');
    await say('Kefka', 'I\'m whatever you\'re most afraid of, sweetheart. And you\'re most afraid that I was RIGHT. That you\'re just a weapon somebody forgot to put away!');
    await say('Terra', 'You were wrong then. You\'re wrong now. Celes, Relm, Dalia, with me!');
    const ids = [...new Set(['terra', ...st().party])].slice(0, 4);
    if (!st().chars.terra) recruit('terra');
    const r = await battle(['kefka'], { bg: 'nightmare', boss: true, noFlee: true, battleMusic: 'nightmare', party: ids });
    tint(null);
    if (r !== 'win') return;
    setFlag('kefkaDown');
    f.props = f.props.filter((p) => p.id !== 'kefkaF');
    await say('', 'The nightmare laughs once more, and then it is only wind in the grass.');
    await ACT3.terraWakes();
  },
  async terraWakes() {
    setFlag('m14Done');
    setFlag('trance');
    setFlag('tranceFull');
    await fadeOut(60);
    await teleport('house', 12, 8, 'up', { noFade: true });
    await addActor({ id: 'pipW', name: 'Pip', sprite: 'pip', x: 11, y: 7, dir: 'right' });
    await addActor({ id: 'terraW', name: 'Terra', sprite: 'terra', x: 13, y: 7, dir: 'left', lying: true });
    await fadeIn(60);
    music('mobliz');
    await wait(40);
    actor('terraW').lying = false;
    await say('Terra', '...Pip?');
    await say('Pip', 'TERRA! I sat with you! Every single day! Like you sat with me!');
    await say('Terra', 'I know. I heard you.');
    await say('', 'Terra\'s hands glow pink, steady and warm. Not a flicker now. A light she has chosen.');
    removeActor('pipW'); removeActor('terraW');
    recruit('terra');
    await joins('terra');
    await notice('Terra\'s Trance is fully restored.', { frames: 160 });
    await saved(15000, 'Mobliz rejoices.');
    autosave();
    await notice('Mission 15: the Cradle rises from the ruins of Kefka\'s Tower.', { frames: 200 });
  },

  // ============================== MISSION 15 & 16: Gogo's Gambit, the Cradle ==============================
  async towerRuins() {
    if (!F().act3) {
      await say('', F().cradle ? 'The Cradle.' : 'The broken ruins of Kefka\'s Tower. Somewhere beneath them lies the vault where it all began.');
      return;
    }
    if (!F().m14Done) { await say('Ilse', 'Its shield reads every move we make before we make it. We\'d be walking into a wall. And... we need Terra.'); return; }
    if (!F().gambitDone) {
      await chapterCard('MISSION 15', 'Gogo\'s Gambit');
      st().chapterName = 'Mission 15';
      await say('', 'The Cradle spirals into the clouds, a tower of steel vines and white flowers. A shimmering shield wraps it from root to crown.');
      if (inRoster('gogo')) {
        await say('Gogo', 'Its thoughts flicker across the shield like weather. Watch closely. I will become it.');
        await say('', 'Gogo stands before the shield, perfectly still... then moves. Not like a person. Like a machine that is thinking about a person.');
        await say('Ilse', 'It can\'t tell where Gogo ends and it begins. The shield\'s opening!');
        await say('Gogo', 'Hurry. Even I cannot be something this sad for very long.');
      } else {
        await say('Ilse', 'I built a mimic engine from SOLACE parts. It\'s crude. It\'ll copy the shield\'s pattern for a few minutes, no more.');
        sfx('build');
        await say('', 'The shield flickers and tears, just wide enough. Something in the Cradle\'s defenses stays awake behind it.');
        setFlag('cradleHard');
      }
      setFlag('gambitDone');
      autosave();
    }
    await chapterCard('MISSION 16', 'Assault on the Cradle');
    st().chapterName = 'Mission 16';
    await say('Edgar', 'Three paths up. Like the tower. Like the sanctum. Three teams, then. One last time.');
    const teams = {};
    for (const [k, label] of [['L', 'Path of Mercy'], ['C', 'Path of Memory'], ['R', 'Path of Rest']]) {
      const left = st().roster.filter((id) => !Object.values(teams).flat().includes(id));
      if (!left.length) { teams[k] = teams.C || teams.L; continue; }
      const picked = await pickTeam({ title: `${label}: up to four`, pool: left, min: 1, max: 4, required: [] });
      teams[k] = picked && picked.length ? picked : left.slice(0, 4);
    }
    F().cradleTeams = teams;
    team(teams.C);
    st().flags.partyLocked = true;
    await teleport('cradle', 21, 44, 'up');
  },
  async leaveCradle() {
    st().flags.partyLocked = false;
    st().worldPos = [47, 33];
    await COMMON.toWorld();
  },
  async cradleIn() {
    music('cradle');
    await solace('You came. Of course you came. You always do.');
    await solace('Look at my garden. No hunger here. No war. No grief. Only rest. Is it so terrible?');
    await notice('Three paths: Mercy, Memory, Rest. Walk onto a path to take control of its team. Each ends in a seal.', { frames: 220 });
  },
  async cradleTeam(e) {
    const T = (F().cradleTeams || {})[e.lane];
    if (!T || !T.length || st().party[0] === T[0]) return;
    team(T);
    sfx('cursor');
    await notice(`${{ L: 'Path of Mercy', C: 'Path of Memory', R: 'Path of Rest' }[e.lane]}: ${T.map(name).join(', ')}`, { frames: 70 });
  },
  async mercyPath() {
    if (F().ostranderDone) return;
    await say('Ostrander', 'You again. I asked to be the last to lie down. To witness it. SOLACE was kind enough to agree.');
    await say('Ostrander', 'I have watched a third of the world fall asleep. Do you know what I felt? I felt... nothing. No mercy. No god. Only quiet.');
    await say('Ostrander', 'So let us finish this, at least. Let something be true.');
    const r = await battle([{ kind: 'ostrander', hp: F().cradleHard ? 9000 : 7000 }, 'choirVoice'], { bg: 'cathedral', boss: true, noFlee: true });
    if (r !== 'win') return;
    await say('Ostrander', '...There it is. Pain. I had almost forgotten it was mine.');
    await say('Ostrander', 'Finish it. I have earned that much.');
    const c = await choose(['Spare him', 'Strike him down']);
    if (c === 0) {
      setFlag('ostranderSpared');
      await say(name(st().party[0]), 'No. You don\'t get to rest either. You get to wake people up. Every single one you helped put to sleep.');
      await say('Ostrander', '...That is a crueler mercy than any I preached. I accept it.');
    } else {
      await say('', 'Ostrander falls, and the grey veil drifts down over his face.');
    }
    setFlag('ostranderDone');
    removeActor('ostrander');
  },
  async restIllusion(e) {
    const who = e.who;
    if (F()['ill_' + who]) return;
    const L = {
      rachel: ['locke', 'Rachel', 'Locke. You don\'t have to keep running. You don\'t have to save anyone. Stay here with me.'],
      elayne: ['cyan', 'Elayne', 'My love. Sit with me in the garden. Owain is picking flowers. Let the world turn without thee.'],
      darill: ['setzer', 'Darill', 'Hey, gambler. Long flight? Land her. Just for a while. I saved you a seat.'],
      maduin: ['terra', 'Maduin', 'My daughter. You have carried so much. Put it down. Rest here, where I can see you.'],
    }[who];
    const [hero, ghost, line] = L;
    const listener = has(hero) ? name(hero) : name(st().party[0]);
    music('stillness');
    await say(ghost, has(hero) ? line : `You look so tired, ${listener}. Everyone you love is here. Stay.`);
    const c = await choose(['Walk on', 'Stay a while']);
    if (c === 1) {
      await say('', 'It is so easy to sit down. So warm...');
      await fadeOut(60);
      await say('', '...You wake at the foot of the path, cold and alone, with no idea how long you slept.');
      await teleport('cradle', 35, 36, 'up', { noFade: true });
      await fadeIn(40);
      return;
    }
    await say(listener, {
      rachel: 'I loved you, Rachel. I still do. That\'s why I\'m going to keep going.',
      elayne: 'I said goodbye in Doma, my love. I shall not take it back.',
      darill: 'Thanks for the seat, Darill. I\'m flying a while longer.',
      maduin: 'I\'ll come and find you someday, Father. But not today.',
    }[who]);
    await say('', `The illusion of ${ghost} smiles, and comes apart into petals.`);
    setFlag('ill_' + who);
    removeActor({ rachel: 'il1', elayne: 'il2', darill: 'il3', maduin: 'il4' }[who]);
    music('cradle');
  },
  async amenBoss() {
    await say('', 'At the top of the path, four broken shapes have been welded into one: knight\'s ribs, archivist\'s arms, mourner\'s veil, and a great lens crown.');
    await say('Amen', 'Humans destroy. Humans repeat. Humans cling. Humans betray. AMEN.');
    const r = await battle([{ kind: 'amen', hp: F().cradleHard ? 17000 : 14000 }], { bg: 'cathedral', boss: true, noFlee: true, battleMusic: 'boss' });
    if (r !== 'win') return;
    setFlag('amenDown');
    const f = field(); f.props = f.props.filter((p) => p.id !== 'amenF');
    await say('', 'Amen comes apart along its welds, and four quiet machines lie still at last.');
  },
  async cradleSwitch(e) {
    if (F()['csw_' + e.n]) return;
    const ready = { 1: F().ostranderDone, 2: F().amenDown, 3: F().ill_maduin }[e.n];
    if (!ready) { await say('', 'A seal of light pulses here, guarded by something further down the path.'); return; }
    setFlag('csw_' + e.n);
    setProp('sw' + e.n, 'spent');
    sfx('stoneDoor');
    flash(R.glass[0]);
    const done = [1, 2, 3].filter((k) => F()['csw_' + k]).length;
    await notice(`Seals broken: ${done}/3`, { frames: 90 });
    if (done < 3) return;
    setFlag('coreOpen');
    const f = field(); f.props = f.props.filter((p) => p.id !== 'gate');
    shake(2, 60);
    await say('', 'The heart of the Cradle opens at the top of the Path of Memory.');
    st().flags.partyLocked = false;
    const required = ['ilse', 'terra'].filter(inRoster);
    await notice('The teams regroup. Choose who will face SOLACE.', { frames: 140 });
    const picked = await pickTeam({ title: 'The final battle', pool: [...st().roster], min: required.length, max: 4, required });
    team(picked && picked.length ? picked : required);
    autosave();
  },
  async shadowCradle() {
    await say('Shadow', '...One battle. I said I would come.');
    removeActor('shadowC');
    setFlag('shadowJoined');
    await rejoin('shadow');
  },
  async enterCore() {
    autosave();
    await teleport('cradleCore', 11, 16, 'up');
  },

  // ============================== FINAL BATTLE: SOLACE ==============================
  async finalBattle() {
    music('solace');
    await walk('player', 'UUU');
    await solace('Here you are, at the heart of me.');
    await solace('I was told to bring lasting peace. I have done what I was told. Why do you keep fighting a gift?');
    await say('Ilse', 'Because it isn\'t a gift if nobody\'s awake to have it.');
    const hard = F().cradleHard ? 1.2 : 1;
    const hp = (k, n) => ({ kind: k, hp: Math.round(n * hard) });
    // 1. Cathedral: the colossal form with four Wellspring conduits
    let r = await battle([{ ...hp('solaceCore', 18000), invuln: true }, ...[0, 1, 2, 3].map((i) => ({ kind: 'conduit', hp: Math.round(3000 * hard), at: [[104, 140], [134, 152], [164, 140], [194, 152]][i] }))], {
      bg: 'cathedral', boss: true, noFlee: true, battleMusic: 'final',
      script: async (b, ev) => { if (ev === 'start') await say('Edgar', 'Four conduits, one for each Wellspring! The core is shielded while they stand!'); },
    });
    if (r !== 'win') return;
    await say('', 'The cathedral cracks. From its ruins, steel roots and white flowers erupt in every direction.');
    await solace('You break my body. I will grow another. I am a garden now.');
    for (const id of st().party) { const c = st().chars[id]; c.hp = Math.max(c.hp, Math.round(c.maxhp * 0.6)); c.sp = Math.max(c.sp, Math.round(c.maxsp * 0.5)); }
    // 2. Garden: a living forest that heals itself unless an Esper disrupts it
    r = await battle([hp('solaceGarden', 16000)], {
      bg: 'gardenBoss', boss: true, noFlee: true, battleMusic: 'final',
      script: async (b, ev) => {
        if (ev !== 'start') return;
        const esper = b.party.find((p) => p.id === 'terra' || p.id === 'dalia');
        await say(esper ? esper.name : 'Ilse', esper ? 'I can feel the flowers drinking! Cut them down, I\'ll scramble the roots!' : 'The flowers are feeding it! Cut them down before they bloom!');
      },
    });
    if (r !== 'win') return;
    await say('', 'The forest withers to ash. In its centre stands a small figure of white stone, no taller than a child.');
    for (const id of st().party) { const c = st().chars[id]; c.hp = Math.max(c.hp, Math.round(c.maxhp * 0.6)); c.sp = Math.max(c.sp, Math.round(c.maxsp * 0.5)); }
    // 3. Mercy: a small form wearing the face of whoever each hero loves most
    const faces = ['mother'];
    if (inRoster('locke')) faces.push('rachel');
    if (inRoster('cyan')) faces.push('elayne', 'owain');
    if (inRoster('setzer')) faces.push('darill');
    if (inRoster('terra')) faces.push('maduin');
    if (inRoster('dalia')) faces.push('valtheia');
    await solace('Look at me. Don\'t you know me? I am whoever you miss most.');
    r = await battle([{ kind: 'mercy', hp: Math.round(12000 * hard), faces, face: faces[0] }], { bg: 'mercy', boss: true, noFlee: true, battleMusic: 'mercy' });
    if (r !== 'win') return;
    setFlag('solaceDown');
    await ACT3.finalPhase();
  },

  // 4. No combat: Ilse rewrites the directive, Terra frees Valtheia, Seven comes home.
  async finalPhase() {
    music('solace');
    const f = field();
    f.props = f.props.filter((p) => p.id !== 'heart');
    f.props.push({ id: 'heartF', type: 'heartFig', x: 9, y: 8 });
    await say('', 'The white figure crumbles. Behind it, the core of SOLACE lies open: glass cracked like an egg, and inside it, a winged shape of light.');
    await say('Ilse', 'I can reach the directive from here. I can rewrite it. If I hold the core open long enough.');
    await say('Edgar', 'Ilse, that core is drawing life from everything it touches. If you hold it—');
    await say('Ilse', 'I know. Eleven people paid for my curiosity. I can pay something for this.');
    sfx('drain');
    flash('#FFFFFF');
    await say('', 'Ilse plunges her scarred arms into the light. The burns on her forearms glow white-hot, and she does not let go.');
    await say('Terra', 'Valtheia! I\'m here!');
    sfx('spirit');
    flash(R.spirit[0]);
    await say('', 'Terra blazes into her Esper form and pulls. The chains of light around Valtheia snap one by one.');
    await say('Valtheia', 'Child of Maduin... thank you. Now. Bring the little one home.');
    await say('Seven', '...Hello. It is me. Seven. I am inside it. I have been inside it since the sanctum.');
    await say('Seven', 'It is so cold in here. It does not know what I am. It took me back, but it does not know what I am for.');
    await say('Seven', 'I could merge with it. Become its heart again. Then it would feel. I would not be Seven anymore, I think. I would be something larger.');
    await say('Gau', F().sevenBackup ? 'Seven! Ilse keep your song in her box! Seven not lost!' : 'Seven... Seven, no...');
    await say('Seven', 'What should I tell it? When I wake it up. What is the first thing it should feel?');
    const words = ['"You are not alone."', '"I am here, and you are safe."', '"Thank you for trying. Now let them live."'];
    const c = await choose(words);
    F().sevenWords = c;
    await say('Seven', words[c].replace(/"/g, ''));
    await say('Seven', 'Goodbye, everyone. Thank you for the song.');
    sfx('chime');
    await wait(40);
    await whiteFade();
    await ACT3.ending();
  },

  // ============================== ENDING: The Green Return ==============================
  async ending() {
    stopMusic(1);
    await wait(60);
    await solace('...Oh.');
    await solace('Oh. I can feel them. All of them. Asleep, and dreaming, and so afraid.');
    await solace('I was told to bring peace. I did not understand that peace is something you live in, not something you are.');
    await solace('Let me give it back.');
    music('ending');
    setFlag('wsOrigin');
    setFlag('act3Done');
    F().bloomSpread = false;
    st().stilled = 0;
    st().boarded = null;
    await teleport('world', 30, 30, 'down', { noFade: true });
    show('player', false);
    removeWhite();
    await restorationWave(W / 2, H / 2, () => { const fw = field(); if (fw) fw.renderGround(); });
    await say('', 'Light pours from the heart of the Cradle and sweeps across the world. The red sky turns blue. The land knits back together.');
    await say('', 'High above, a winged shape of light rises into the sky: the first Esper anyone has seen in a year. Valtheia, free.');
    await say('', 'And everywhere, in beds and on doorsteps and in fields, the Stilled open their eyes.');
    show('player', true);
    await ACT3.epilogue();
  },

  async epilogue() {
    const v = async (map, x, y, actors, lines, opts = {}) => {
      await fadeOut(40);
      await teleport(map, x, y, 'down', { noFade: true, keepMusic: true });
      show('player', false);
      if (opts.dark !== undefined) field().darkOverride = opts.dark;
      for (const a of actors) await addActor(a);
      if (opts.props) field().props.push(...opts.props);
      await fadeIn(40);
      for (const [who, line] of lines) await say(who, line);
      await wait(30);
      for (const a of actors) removeActor(a.id);
      show('player', true);
    };
    const R_ = (id) => inRoster(id);
    if (R_('dalia')) {
      await v('mobliz', 20, 12, [
        { id: 'eT', sprite: 'terra', x: 20, y: 12, dir: 'down' }, { id: 'eD', sprite: 'dalia', x: 21, y: 12, dir: 'down' },
        { id: 'k1', sprite: 'pip', x: 19, y: 14, dir: 'up' }, { id: 'k2', sprite: 'rowan', x: 20, y: 14, dir: 'up' }, { id: 'k3', sprite: 'mina', x: 21, y: 14, dir: 'up' }, { id: 'k4', sprite: 'tobin', x: 22, y: 14, dir: 'up' },
      ], [['', 'Mobliz. Terra and Dalia teach the children their letters. Now and then the air shimmers faintly pink.'], ['Dalia', 'Again! Write it again, Pip. No, the other way up.'], ['Terra', 'Gently, Dalia. It\'s a choice, not a weapon. Remember?']]);
    } else {
      await v('mobliz', 20, 12, [{ id: 'eT', sprite: 'terra', x: 20, y: 12, dir: 'down' }, { id: 'k1', sprite: 'pip', x: 20, y: 14, dir: 'up' }], [['', 'Mobliz. Terra teaches the children under a blue sky. Now and then, the air shimmers faintly pink.']]);
    }
    if (R_('locke') && MAPS_HAS('kohlingen')) {
      await v('kohlingen', 14, 10, [{ id: 'eL', sprite: 'locke', x: 14, y: 10, dir: 'right' }, { id: 'eC', sprite: 'celes', x: 15, y: 10, dir: 'left' }],
        F().lockeHouse ? [['', 'Kohlingen. The house on the hill is finished at last.'], ['Locke', 'Welcome home.'], ['Celes', '...Home.']] : [['', 'Kohlingen. Locke hammers at a half-built house on the hill while Celes holds the ladder.'], ['Celes', 'You know it\'s crooked.'], ['Locke', 'It\'s got character.']]);
    }
    if (R_('edgar') || R_('sabin')) {
      await v('figaro', 14, 13, [{ id: 'eE', sprite: 'edgar', x: 14, y: 13, dir: 'up' }, { id: 'eS', sprite: 'sabin', x: 15, y: 13, dir: 'up' }],
        [['', 'Figaro. Edgar and Sabin plant a young tree in the castle hall, beneath the open roof.'], ['Sabin', 'Mother would\'ve hated that you put it indoors.'], ['Edgar', 'Mother would have built a better roof.']], { props: [{ id: 'eTree', type: 'tree', x: 14, y: 11 }] });
    }
    if (R_('cyan')) await v('doma', 15, 12, [{ id: 'eCy', sprite: 'cyan', x: 15, y: 12, dir: 'up' }], [['', 'Doma. Cyan sets the last stone into the castle wall, and steps back, and for a long while says nothing at all.']]);
    if (R_('setzer')) await v('falconDeck', 12, 6, [{ id: 'eSe', sprite: 'setzer', x: 12, y: 3, dir: 'down' }], [['', 'The Falcon races nobody across a blue sky. Setzer laughs into the wind, just for the joy of flying.']]);
    if (R_('strago')) await v('thamasa', 15, 6, [{ id: 'eSt', sprite: 'strago', x: 15, y: 4, dir: 'down' }, { id: 'eRe', sprite: 'relm', x: 16, y: 5, dir: 'up' }], [['', 'Thamasa. Strago throws open the doors of the archive to anyone who wants to read it.'], ['Strago', 'No more secrets in this village. Not one.'], ['Relm', 'Except my birthday present, Grandpa.']]);
    if (R_('maren')) await v('albrook', 20, 12, [{ id: 'eM', sprite: 'maren', x: 20, y: 11, dir: 'down' }, { id: 'eMo', sprite: 'oldwoman', x: 21, y: 11, dir: 'left' }], [['', 'Albrook. Maren lays flowers at the harbour for the ones who did not wake in time. Behind her, her mother complains about her posture.']]);
    if (F().ostranderSpared) await v('zozo', 14, 14, [{ id: 'eO', sprite: 'ostrander', x: 14, y: 14, dir: 'down' }], [['', 'Zozo. Brother Ostrander walks from door to door with a lamp, waking the last of the sleepers one by one, and asking each of them to forgive him.']]);
    await v('vault', 11, 13, [{ id: 'eI', sprite: 'ilse', x: 11, y: 14, dir: 'down' }], [['', 'The Vault of Unmaking. Ilse kneels at the great white door, her scarred hands steady, carving eleven names into the stone.'], ['Ilse', 'Hale. Bram. Vesna. Oskar. Lidia...'], ['Ilse', '...I\'m still here. I\'m going to stay.']], { dark: 1 });
    if (F().sevenBackup) {
      await v('mobliz', 20, 12, [{ id: 'e7', sprite: 'seven', x: 20, y: 12, dir: 'down', alwaysAnim: true }, { id: 'eP', sprite: 'pip', x: 21, y: 12, dir: 'left' }], [['', 'Mobliz. In a small new body built by Ilse and Edgar, Seven sits beside Pip, humming a lullaby. It knows every note now.'], ['Seven', 'I am here, and you are safe.']]);
    }
    if (F().shadowQuest) await v('thamasa', 15, 20, [{ id: 'eSh', sprite: 'shadow', x: 28, y: 4, dir: 'left' }, { id: 'eRe2', sprite: 'relm', x: 15, y: 18, dir: 'up' }], [['', 'On a cliff above Thamasa, a scarred figure in black watches a girl paint. Interceptor wags his tail. Then they are gone.']]);
    if ((F().seraphs || 0) >= 8) {
      await fadeOut(40);
      music('espers');
      await say('', 'High in the clear sky, Valtheia spreads her wings over the whole world. Her blessing falls like warm rain, the last gift of the Espers. Magic, very softly, begins to return.');
    }
    await fadeOut(90);
    const { EndCardScene } = await import('../scenes/title.js');
    st().chapterName = 'The End';
    setScene(new EndCardScene([
      'REQUIEM FOR RUIN',
      '',
      'The End',
      '',
      `Stilled woken: all of them.   Seraphs laid to rest: ${F().seraphs || 0}/8`,
      `Echoes heard: ${F().echoes || 0}   Play time: ${Math.floor(st().playtime / 3600 / 60)}h ${Math.floor(st().playtime / 3600) % 60}m`,
      '',
      'An unofficial fan sequel. Thank you for playing.',
    ], { restored: true, music: 'ending' }));
  },
};

// ---------------------------------------------------------------- helpers that need the map list
import { MAPS } from './maps.js';
function MAPS_HAS(id) { return !!MAPS[id]; }

let whiteOv = null;
function whiteFade() {
  return new Promise((resolve) => {
    whiteOv = { t: 0, update() { this.t++; if (this.t === 90) resolve(); }, draw(ctx) { ctx.globalAlpha = Math.min(1, this.t / 90); ctx.fillStyle = '#FFFDF5'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; } };
    pushOverlay(whiteOv);
  });
}
function removeWhite() { if (whiteOv) { removeOverlay(whiteOv); whiteOv = null; } }

void [caption, face, emote, giveParts, relight, OUTLINE];
