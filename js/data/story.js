// Story events: Prologue "Breaking Ground" and Mission 1 "Mobliz Morning".
import {
  say, choose, notice, caption, wait, fadeOut, fadeIn, flash, shake, setFade, letterbox,
  walk, face, actor, show, place, addActor, removeActor, emote, setProp, camTo, camReset, tint,
  teleport, setFlag, getFlag, give, giveParts, setParty, healAll, setLeader, battle, field,
  sfx, music, stopMusic, ambience,
} from '../script.js';
import { game, setScene, pushOverlay, removeOverlay } from '../game.js';
import { W, H, ditherRect } from '../core/gfx.js';
import { drawTextCentered } from '../core/font.js';
import { R, OUTLINE, UI } from './palette.js';
import { CHARS, ITEMS, makeChar } from './party.js';
import { saveGame } from '../core/save.js';
import * as input from '../core/input.js';
import { COMMON } from './story_common.js';
import { ACT1 } from './story_act1.js';
import { ACT2 } from './story_act2.js';
import { ACT3 } from './story_act3.js';
import { SIDE } from './story_side.js';

const SOLACE_NAME = '???';
const solace = (text, name = SOLACE_NAME) => say(name, text, { style: 'solace' });

// ---------------------------------------------------------------- overlays
// SOLACE's eye opens for the first time; the title card.
function titleCard() {
  return new Promise(async (resolve) => {
    const { drawEye, art } = await import('../scenes/title.js');
    const ov = {
      t: 0,
      update() { this.t++; if (this.t > 420 || (this.t > 200 && input.pressed('a'))) { removeOverlay(this); resolve(); } },
      draw(ctx) {
        ctx.fillStyle = OUTLINE; ctx.fillRect(0, 0, W, H);
        const t = this.t;
        const open = Math.min(1, Math.max(0.02, (t - 40) / 120));
        if (t > 20) drawEye(ctx, 192, 80, open, t);
        if (t > 170) {
          const a = art();
          const lvl = Math.min(4, Math.floor((t - 170) / 8));
          ctx.drawImage(a.logo, Math.floor((W - a.logo.width) / 2), 132);
          if (lvl < 4) ditherRect(ctx, 0, 128, W, 30, OUTLINE, 4 - lvl);
        }
        if (t > 240) drawTextCentered(ctx, 'One year after the fall of Kefka', W / 2, 166, R.skyRuin[0]);
        if (t > 400) ditherRect(ctx, 0, 0, W, H, OUTLINE, Math.min(4, Math.floor((t - 400) / 5)));
      },
    };
    pushOverlay(ov);
  });
}

// The stilling wave: a perfect circle of pale glass-glow expanding at a constant 4 px per
// frame. Completely silent; no particles, no shake. Behind its edge, the world changes.
function stillingWave(cx, cy, onPass) {
  return new Promise((resolve) => {
    let fired = false;
    const ov = {
      r: 0,
      update() {
        this.r += 4;
        if (!fired && this.r > 140) { fired = true; onPass(); }
        if (this.r > 460) { removeOverlay(this); resolve(); }
      },
      draw(ctx) {
        const r = this.r;
        ctx.fillStyle = R.glass[1];
        for (let a = 0; a < 720; a++) {
          const ang = (a / 720) * Math.PI * 2;
          ctx.fillRect(Math.round(cx + Math.cos(ang) * r), Math.round(cy + Math.sin(ang) * r), 2, 1);
        }
        ctx.fillStyle = R.glass[0];
        for (let a = 0; a < 720; a += 2) {
          const ang = (a / 720) * Math.PI * 2;
          ctx.fillRect(Math.round(cx + Math.cos(ang) * (r - 2)), Math.round(cy + Math.sin(ang) * (r - 2)), 1, 1);
        }
      },
    };
    pushOverlay(ov);
  });
}

async function chapterCard(title, sub) {
  setFade(4);
  await caption([title, sub], { frames: 200, color: R.stone[0] });
}

function autosave() {
  if (saveGame(game.state)) return notice('Progress saved.', { frames: 70 });
}

// ---------------------------------------------------------------- the story
export const STORY = {
  // ============================== PROLOGUE: Breaking Ground ==============================
  async prologueIntro() {
    setFade(4);
    music('lullaby');
    await caption(['Year 1 After Ruin.', '', 'Magic is gone. The Espers are gone.', 'The sky is still the colour of a bruise.'], { frames: 300 });
    await caption(['Beneath the rubble of Kefka\'s Tower,', 'a dig crew searches for whatever', 'magic might have left behind.'], { frames: 280 });
    await caption(['PROLOGUE', 'Breaking Ground'], { frames: 200, color: R.stone[0] });
    music('dig');
    await fadeIn(40);
    await say('Hale', 'Ilse! Over here. You\'ll want to see this before the rest of the crew starts touching things.');
    await say('Ilse', '(Twelve of us down here, and every one of them hoping for magicite. If there\'s even one shard left in this rock...)');
    await notice('Walk with the D-pad. A talks. Hold B to run. MENU opens the menu.', { frames: 260 });
  },

  async hale() {
    if (!getFlag('hale1')) {
      await say('Hale', 'North wall. Bram\'s pick went through the rock and hit something smooth. White. Not stone, not metal.');
      await say('Hale', 'It\'s a door, Ilse. Carved all over with writing nobody here can read. Nobody but you.');
      await say('Ilse', 'Imperial script?');
      await say('Hale', 'Older. Older than the Empire. Older than anything. Bram swears it hummed at him.');
      await say('Hale', 'And the burrowers have been acting strange all morning. Watch your step on the way up.');
      setFlag('hale1');
      return;
    }
    if (!getFlag('doorOpen')) await say('Hale', 'Go on. It\'s your find. The rest of us will be right behind you.');
    else await say('Hale', 'I\'ve been digging thirty years and I never heard rock breathe before.');
  },
  async bram() {
    if (!getFlag('hale1')) await say('Bram', 'Tell Hale I\'m not crazy. That wall hummed. Like a kettle just before it whistles.');
    else await say('Bram', 'My grandmother said the old magi buried their mistakes deep. I always thought she meant secrets.');
  },
  async vesna() {
    await say('Vesna', 'If we find magicite down here we\'ll be rich. If we find nothing, at least we\'re not hauling rubble topside.');
    await say('Vesna', 'Your coat... you tore the insignia off yourself, didn\'t you? Good. Nobody down here cares who you used to work for.');
  },
  async oskar() {
    await say('Oskar', 'Twelve of us, one lift, and a tower full of Kefka\'s junk on top. Don\'t think about the ceiling. I don\'t.');
  },
  async lidia() {
    await say('Lidia', 'Found a bone over there. Too big to be a person. Too small to be anything I want to meet.');
  },

  async burrowerAmbush() {
    sfx('quake');
    shake(2, 20);
    await emote('player', '!');
    await say('Hale', 'Burrowers! They\'re coming up through the floor!');
    const r = await battle(['burrower', 'burrower'], {
      bg: 'tunnel', noFlee: true,
      script: async (b, ev) => {
        if (ev === 'start') {
          await say('Hale', 'When your name lights up gold below, pick a command. Fight to swing. I\'ll throw a Blast charge if it gets ugly!');
          await say('Ilse', 'And I have my Salvage kit. A few machine parts and I can build a Shock Trap or a Turret on the spot.');
        }
      },
    });
    if (r === 'win') await say('Hale', 'Hah. Not bad for a scholar. Now let\'s see that door.');
  },

  async vaultDoor() {
    if (getFlag('doorOpen')) return;
    if (!getFlag('hale1')) { await say('Ilse', 'A white door... I should hear what Hale has to say about this first.'); return; }
    await say('', 'A sealed white door fills the rock face. Six glyphs ring the seal, carved in a language dead a thousand years.');
    if (!getFlag('readDoor')) {
      await say('Ilse', 'These are warnings. "Here sleeps the answer to the war." "Do not wake it." "Do not let it be woken."');
      await say('Ilse', 'And the lock... "First the Ring that binds. Then the Eye that never closes. Last the Hand that keeps the peace."');
      setFlag('readDoor');
    }
    const ok = await choose(['Work the lock', 'Leave it'], { cancel: 1 });
    if (ok !== 0) return;
    const answer = ['Ring', 'Eye', 'Hand'];
    let lit = 0;
    while (lit < 3) {
      const c = await choose(['Ring', 'Eye', 'Hand', 'Wing', 'Step back'], { cancel: 4 });
      if (c === 4) { field().prop('door').frame = 0; return; }
      if (['Ring', 'Eye', 'Hand', 'Wing'][c] === answer[lit]) {
        lit++;
        sfx('chime');
        field().prop('door').frame = lit * 2;
        await wait(20);
      } else {
        sfx('buzzer');
        field().prop('door').frame = 0;
        lit = 0;
        await say('Ilse', 'The glyphs go dark. Ring that binds, Eye that never closes, Hand that keeps the peace...');
        return;
      }
    }
    await say('', 'All six glyphs blaze with pale green light.');
    sfx('stoneDoor');
    shake(2, 90);
    await wait(60);
    setProp('door', 'open');
    setFlag('doorOpen');
    flash();
    await wait(40);
    // the crew gathers
    for (const id of ['hale', 'bram', 'vesna', 'oskar', 'lidia']) { const a = actor(id); if (a) { a.wander = false; } }
    await say('Hale', 'Gods above. Everyone! Ilse opened it!');
    await say('Ilse', 'It\'s warm. The air coming out of it is warm. Like breath.');
    await say('Hale', 'Lamps up. Stay close. Whatever\'s in there has been waiting a long time for company.');
  },

  async enterVault() {
    await teleport('vault', 10, 17, 'up');
  },

  async vaultAwaken() {
    const f = field();
    f.darkOverride = 3;
    show('player', true);
    letterbox(true);
    setParty(['ilse', 'hale']);
    const crew = [
      { id: 'hale', name: 'Hale', sprite: 'hale', x: 11, y: 17 },
      { id: 'bram', name: 'Bram', sprite: 'crewA', x: 9, y: 17 },
      { id: 'vesna', name: 'Vesna', sprite: 'crewB', x: 12, y: 17 },
      { id: 'oskar', name: 'Oskar', sprite: 'crewA', x: 10, y: 17 },
      { id: 'lidia', name: 'Lidia', sprite: 'crewB', x: 11, y: 17 },
    ];
    await fadeIn(30);
    await walk('player', 'uuuu');
    for (const c of crew) await addActor({ ...c, dir: 'up', solid: false });
    walk('hale', 'uuuuu');
    walk('bram', 'uuuuur');
    walk('vesna', 'uuuuul');
    await wait(40);
    walk('oskar', 'uuul');
    walk('lidia', 'uuur');
    await walk('player', 'uu');
    await wait(30);
    await say('Ilse', 'It\'s so dark... wait. Listen.');
    // the lights wake, one by one
    for (let i = 1; i <= 6; i++) {
      setProp('l' + i, 'lit');
      sfx('chime');
      if (i === 2) f.darkOverride = 2;
      if (i === 5) f.darkOverride = 1;
      await wait(40);
    }
    f.darkOverride = 0;
    await camTo(12, 4);
    await wait(60);
    await say('', 'A shape fills the far end of the chamber: a face of white stone the size of a cathedral, its single eye closed.');
    await say('Bram', 'Is that... an Esper? Petrified?');
    await say('Ilse', 'No. Look at the seams, the brass. Someone built this. It\'s a machine. A machine older than the War of the Magi.');
    await say('Hale', 'Ilse. The others are saying they can hear singing.');
    music('solace');
    await wait(90);
    await camReset();
    setProp('core', 'half');
    sfx('hum');
    shake(1, 40);
    await wait(30);
    await solace('Ilse.');
    await emote('player', '!');
    await say('Ilse', '...Mother?');
    await solace('You\'ve worked so hard, my darling. All those years. All that guilt.');
    await solace('You can rest now.');
    await say('Hale', 'That\'s not your mother, Ilse. That\'s not—');
    // the crew is drained, one by one
    const order = ['lidia', 'oskar', 'vesna', 'bram'];
    for (const id of order) {
      const a = actor(id);
      sfx('drain');
      tint(R.glass[2], 1);
      await wait(20);
      tint(null);
      a.lying = true;
      a.stilled = true;
      sfx('collapse');
      await wait(36);
    }
    await say('Ilse', 'No— no, no, no! Get up! Everyone, get up!');
    const hale = actor('hale');
    face('hale', 'down');
    await say('Hale', 'Ilse... run. Whatever you woke... it\'s not finished...');
    sfx('drain');
    await wait(30);
    hale.lying = true; hale.stilled = true;
    sfx('collapse');
    await wait(40);
    await solace('Do not be afraid. You have suffered enough. Let me give you rest.');
    setParty(['ilse']);
    setProp('core', 'open');
    flash();
    sfx('quake');
    shake(4, 60);
    // the way back collapses, a side door slides open
    f.props.push({ id: 'r1', type: 'rubble', x: 9, y: 15 }, { id: 'r2', type: 'rubble', x: 11, y: 15 });
    setFlag('vaultEscape');
    setProp('exit', 'open');
    sfx('stoneDoor');
    await wait(60);
    letterbox(false);
    await say('Ilse', 'The tunnel\'s gone— the door! There, in the north wall!');
    music('tension');
  },

  async toHalls() {
    await teleport('halls', 5, 26, 'up');
  },

  async hallsIntro() {
    music('vault');
    await say('Ilse', 'Eleven. Eleven people, and I opened the door for it.');
    await say('Ilse', '...Later. Grieve later. Get out first, so somebody can tell their families.');
    await notice('Defeated machines leave parts. Salvage turns parts into devices.', { frames: 240 });
  },
  async pickup(e) {
    const f = field();
    setProp(e.id, 'taken');
    if (e.give === 'parts') await giveParts(e.n);
    else await give(e.give, e.n);
    void f;
  },
  async hallsBones() {
    await say('', 'An ancient skeleton in the robes of a magi-engineer. One hand still rests on a carved warning.');
    await say('Ilse', '"We built it to end the war. It understood the cause of the war better than we did."');
  },

  async wardenBoss() {
    sfx('quake');
    shake(2, 30);
    await say('', 'Stone grinds on stone. A guardian of white and brass unfolds from the wall, its ribs open like a harp.');
    await say('Ilse', 'A vault warden. It\'s guarding the way out... which means there IS a way out.');
    const r = await battle(['warden'], { bg: 'vault', boss: true, music: 'tension' });
    if (r === 'win') {
      setFlag('wardenDown');
      setProp('northDoor', 'open');
      sfx('stoneDoor');
      await wait(40);
      await say('Ilse', 'Daylight... or what passes for it.');
      music('vault');
    }
  },

  async toAshen() {
    await teleport('ashen', 4, 4, 'down');
  },

  async ashenEnter() {
    await say('', 'The Ashen Reach. Grey dust to the edge of the world, and a red wind that never stops.');
    await say('Ilse', 'Vector is east. Figaro is... somewhere south. Keep walking. Just keep walking.');
  },

  async ilseCollapse() {
    const p = actor('player');
    p.speed = 1;
    await say('Ilse', 'Hale. Bram. Vesna. Oskar. Lidia...');
    await walk('player', 'rr');
    await say('Ilse', 'I\'ll carve your names into that door myself. I swear it. I swear...');
    await walk('player', 'r');
    await wait(40);
    p.lying = true;
    sfx('collapse');
    stopMusic(3);
    await wait(120);
    await fadeOut(80);
    ambience('none');
    music('title');
    await titleCard();
    await STORY.m1Begin();
  },

  // ============================== MISSION 1: Mobliz Morning ==============================
  async m1Begin() {
    stopMusic(1);
    setParty(['terra', 'duane']);
    game.state.chars.terra = makeChar('terra');
    game.state.chars.duane = makeChar('duane');
    game.state.roster = ['terra', 'duane'];
    game.state.items = { tonic: 5, salts: 2, smoke: 1 };
    game.state.chapterName = 'Mission 1';
    setLeader('terra');
    game.state.leaderSprite = 'terra';
    await teleport('house', 8, 6, 'down', { noFadeIn: true });
  },

  async m1Start() {
    setFade(4);
    await chapterCard('MISSION 1', 'Mobliz Morning');
    music('mobliz');
    autosave();
    await fadeIn(40);
    await say('Terra', 'Morning already... The light through the window is still that tired red. One whole year, and the sky never healed.');
    await say('Terra', 'Still. The children don\'t know any other sky. Time to wake them.');
    await notice('Wake the four children. Talk to each bed.', { frames: 200 });
  },

  async wakeKid(e) {
    const kid = e.kid;
    const st = game.state.flags;
    if (st['woke_' + kid]) return;
    st['woke_' + kid] = true;
    const bedId = { pip: 'bedPip', rowan: 'bedRowan', mina: 'bedMina', tobin: 'bedTobin' }[kid];
    const bed = field().prop(bedId);
    const lines = {
      pip: [['Pip', 'Five more minutes... the dream had a sky that was blue, Mama Terra. Really, really blue.'], ['Terra', 'Then you can tell everyone about it at breakfast.']],
      rowan: [['Rowan', 'I\'m up! I was already up! I was just guarding my bed.'], ['Terra', 'A very brave guard.']],
      mina: [['Mina', 'Did Duane say we could have the eggs today? He promised the hens would lay.'], ['Terra', 'We\'ll see. Wash your face first.']],
      tobin: [['Tobin', '...'], ['Terra', 'Tobin. I know you\'re awake. Your foot is wiggling.'], ['Tobin', '(giggling) Nooo.']],
    }[kid];
    setProp(bedId, 'empty');
    sfx('step');
    const nx = bed.x, ny = bed.y + 1;
    await addActor({ id: kid, name: kid, sprite: kid, x: nx, y: ny, dir: 'down', solid: false });
    for (const [n, t] of lines) await say(n, t);
    // uppercase = forced steps (children weave around the furniture)
    const toDoor = (x) => 'D'.repeat(Math.max(0, 8 - ny)) + (7 - x > 0 ? 'R' : 'L').repeat(Math.abs(7 - x)) + 'DD';
    walk(kid, toDoor(nx), 2).then(() => removeActor(kid));
    await wait(10);
    if (['pip', 'rowan', 'mina', 'tobin'].every((k) => st['woke_' + k])) {
      setFlag('kidsAwake');
      await wait(30);
      await say('Terra', 'All up. Now, outside. Duane will want help with the crops before the heat comes.');
    }
  },
  async terraBed() { await say('Terra', 'My bed. Still warm. No time for that today.'); },
  async houseShelf() {
    await say('', 'Children\'s drawings are pinned to the shelf. A green-haired woman holding hands with every one of them.');
  },
  async leaveHouse() {
    if (!getFlag('kidsAwake')) { await say('Terra', 'Not before the children are up.'); walk('player', 'u'); return; }
    if (getFlag('night') && !getFlag('bloom')) { await say('Terra', 'It\'s late. The children need me here tonight.'); walk('player', 'u'); return; }
    await teleport('mobliz', 7, 8, 'down');
  },
  async enterHouse() {
    if (getFlag('lessonDone') && !getFlag('night')) { await STORY.nightfall(); return; }
    await teleport('house', 7, 9, 'up');
  },

  async katarin() {
    if (getFlag('bloom')) { await say('Katarin', 'Terra... what are these flowers? I don\'t like them. They don\'t smell like anything.'); return; }
    if (getFlag('lessonDone')) { await say('Katarin', 'Go home and rest, Terra. Duane and I will finish up here.'); return; }
    await say('Katarin', 'Good morning, Terra! The baby slept the whole night for once. I feel like a new woman.');
    await say('Katarin', 'Duane\'s at the field already. He\'s been talking to the beans again. He thinks it helps.');
  },
  async kdDoor() { await say('', 'Katarin and Duane\'s cottage. The door is painted with a crooked yellow sun.'); },
  async mobSign() { await say('', '"MOBLIZ. Population: 14, plus one baby, plus Duane\'s hens. Visitors welcome. Be nice."'); },

  async duane() {
    if (!getFlag('askWater')) {
      await say('Duane', 'Morning, Terra! Look at these poor rows. Nothing wants to grow in this soil, but they keep trying, bless them.');
      await say('Duane', 'Could you fill a bucket at the well and give them a drink? Every row. I\'ll get the hoe sharpened.');
      setFlag('askWater');
      return;
    }
    if (!getFlag('watered')) { await say('Duane', 'Bucket\'s by the well. Every row, mind. They\'re thirsty.'); return; }
    if (!getFlag('toSchool')) {
      await say('Duane', 'Look at that. Is it my imagination, or did the leaves just stand up a little?');
      await say('Duane', 'Oh, and the kids have been whispering all week. They\'ve "built something" behind the schoolhouse. You\'d best go see.');
      setFlag('toSchool');
      await notice('Go to the schoolhouse (east).', { frames: 160 });
      return;
    }
    await say('Duane', 'Go on to the schoolhouse. I\'ll catch up. Don\'t tell them I told you.');
  },
  async well() {
    if (getFlag('askWater') && !getFlag('bucket')) {
      sfx('item');
      setFlag('bucket');
      await say('', 'Terra hauls up the bucket. The water is grey and smells of iron, but it\'s water.');
      return;
    }
    await say('', 'The old well. Somebody has carved every child\'s name into the stone rim.');
  },
  async waterCrop(e) {
    if (!getFlag('bucket') || getFlag('watered')) {
      if (getFlag('watered')) await say('', 'The furrows are dark and damp.');
      else await say('', 'Dry furrows, cracked like old paint. The seedlings droop.');
      return;
    }
    const k = 'row' + e.row;
    if (getFlag(k)) { await say('', 'This row has had its drink.'); return; }
    setFlag(k);
    sfx('heal');
    const n = [1, 2, 3, 4].filter((r) => getFlag('row' + r)).length;
    await say('', `Terra waters the row. (${n}/4)`);
    if (n >= 4) {
      setFlag('watered');
      field().renderGround();
      sfx('flower');
      await say('Terra', 'There. ...Did they just lift toward the light? Or am I imagining things?');
      await say('Terra', '(For a moment my hands felt warm. Like when the magic was still in me.)');
    }
  },

  async kidPip() {
    if (getFlag('toSchool')) await say('Pip', 'Mama Terra! We\'re not allowed to tell you about the surprise! Go to the schoolhouse!');
    else await say('Pip', 'I\'m going to draw the blue sky from my dream so I don\'t forget it. Do you think the real sky was ever that blue?');
  },
  async kidRowan() { await say('Rowan', 'When I grow up I\'m going to be a knight. A real one. With a sword and everything, like you!'); },
  async kidMina() { await say('Mina', 'Duane says the hens laid three eggs. THREE. That\'s almost a feast.'); },
  async kidTobin() { await say('Tobin', '...(He hands you a smooth grey pebble, very seriously, and runs off.)'); },

  async schoolDoor() {
    if (getFlag('lessonDone')) { await say('', 'The schoolhouse. Chalk letters on the door: TODAY WE LERN ABOUT ESPERS.'); return; }
    if (!getFlag('toSchool')) { await say('Terra', 'Class isn\'t until the crops are tended. That\'s the rule.'); return; }
    await STORY.lesson();
  },

  async lesson() {
    const f = field();
    await fadeOut(20);
    for (const id of ['pip', 'rowan', 'mina', 'tobin', 'duane']) removeActor(id);
    place('player', 28, 10, 'down');
    await addActor({ id: 'pip', name: 'Pip', sprite: 'pip', x: 26, y: 12, dir: 'up' });
    await addActor({ id: 'rowan', name: 'Rowan', sprite: 'rowan', x: 27, y: 12, dir: 'up' });
    await addActor({ id: 'mina', name: 'Mina', sprite: 'mina', x: 29, y: 12, dir: 'up' });
    await addActor({ id: 'tobin', name: 'Tobin', sprite: 'tobin', x: 30, y: 12, dir: 'up' });
    await addActor({ id: 'duane', name: 'Duane', sprite: 'duane', x: 31, y: 10, dir: 'left' });
    f.snapCamera();
    await fadeIn(20);
    await say('Terra', 'Today\'s lesson: before the world fell apart, there were Espers. Creatures of pure magic.');
    await say('Mina', 'Like you! You were an Esper!');
    await say('Terra', 'Half. My father was an Esper. When magic left the world, that half of me... went quiet.');
    await say('Pip', 'Do you miss it?');
    await say('Terra', '...Sometimes. But I have all of you now. I don\'t need to be magic to be happy.');
    await say('Rowan', 'Okay, lesson\'s over! SURPRISE!');
    await emote('player', '?');
    await say('Rowan', 'We built a knight! Out of straw and Duane\'s old bucket! You have to fight him so we can learn sword fighting!');
    await say('Duane', 'Don\'t look at me. I only donated the bucket. ...And the stick. And the nails.');
    await say('Terra', '(Laughing) All right. Duane, you\'re with me. Children, stand back and watch carefully.');
    const r = await battle(['dummy'], {
      bg: 'sparring', noFlee: true, canLose: true, battleMusic: 'battle',
      script: async (b, ev) => {
        if (ev === 'start') {
          await say('Duane', 'Terra, when your name glows gold, pick a command. I\'ve got Heave for a big hit, and Brace to shield somebody.');
          await say('Terra', 'And Item uses the supplies we carry. Let\'s make this a good show!');
        }
        if (ev === 'turn' && b.turns === 4 && !b.cheered) {
          b.cheered = true;
          await say('Tobin', 'GET HIM, MAMA TERRA!');
        }
      },
    });
    void r;
    healAll();
    await say('Rowan', 'You beat him! You beat him so hard his bucket fell off!');
    await say('Pip', 'Again! Again!');
    await say('Duane', 'Not today, little ones. Look at the sky — it\'s nearly dark.');
    setFlag('lessonDone');
    await STORY.nightfall();
  },

  async nightfall() {
    setFlag('night');
    await fadeOut(40);
    music('night');
    ambience('night');
    await teleport('house', 7, 6, 'down', { noFade: true, keepMusic: true });
    const f = field();
    for (const [b, k] of [['bedPip', 'pip'], ['bedRowan', 'rowan'], ['bedMina', 'mina'], ['bedTobin', 'tobin']]) setProp(b, k);
    tint(R.night[3], 2);
    await fadeIn(30);
    await say('Pip', 'Mama Terra? Will the sky ever be blue again? Like in my dream?');
    await say('Terra', 'I think so. I think if we take care of the world, it will remember how to heal.');
    await say('Pip', 'Then I\'ll take care of it too. Goodnight...');
    await wait(60);
    await say('Terra', '(Goodnight, Pip.)');
    await fadeOut(60);
    // outside, in the dark, something passes over Mobliz
    stopMusic(2);
    ambience('none');
    await teleport('mobliz', 32, 18, 'down', { noFade: true, keepMusic: true });
    const m = field();
    show('player', false);
    m.tint = { color: R.night[3], level: 2 };
    m.camOverride = [32 * 16 + 8 - 192, 18 * 16 - 108];
    m.snapCamera();
    await fadeIn(60);
    await wait(90);
    await stillingWave(200, 120, () => { setFlag('bloom'); m.setTileOverride('bloom'); });
    await wait(120);
    await fadeOut(80);
    void f;
    await STORY.bloomMorning();
  },

  async bloomMorning() {
    tint(null);
    await teleport('house', 7, 6, 'down', { noFade: true });
    for (const b of ['bedPip', 'bedRowan', 'bedMina', 'bedTobin']) setProp(b, 'empty');
    await addActor({ id: 'rowan', name: 'Rowan', sprite: 'rowan', x: 7, y: 9, dir: 'up' });
    music('lullaby');
    await fadeIn(40);
    await say('Rowan', 'MAMA TERRA! Wake up! Come look, come look! There are flowers! Everywhere!');
    await say('Terra', 'Flowers...?');
    await walk('rowan', 'dd', 2);
    removeActor('rowan');
    await teleport('mobliz', 27, 12, 'down');
    const f = field();
    f.actors = f.actors.filter((a) => a === f.player || a.id === 'katarin');
    await addActor({ id: 'pip', name: 'Pip', sprite: 'pip', x: 29, y: 14, dir: 'down' });
    await addActor({ id: 'rowan', name: 'Rowan', sprite: 'rowan', x: 26, y: 13, dir: 'right' });
    await addActor({ id: 'mina', name: 'Mina', sprite: 'mina', x: 31, y: 13, dir: 'down' });
    await addActor({ id: 'tobin', name: 'Tobin', sprite: 'tobin', x: 33, y: 14, dir: 'left' });
    await addActor({ id: 'duane', name: 'Duane', sprite: 'duane', x: 24, y: 12, dir: 'right' });
    music('solace');
    await say('', 'Overnight, the dead field east of town has bloomed: pale green leaves, white flowers with glassy hearts. Not one of them moves in the wind.');
    await say('Mina', 'They\'re so pretty! Are they magic? Did the magic come back?');
    await say('Terra', '(Silent... No bees. No smell. Flowers don\'t grow like this. Not overnight.)');
    await say('Terra', 'Children, come away from there. Please. Come back to me.');
    await say('Pip', 'Just one! I want to pick one for my drawing!');
    await walk('pip', 'ddr', 1);
    await wait(30);
    await say('Pip', 'It\'s cold... Mama Terra, the flower is so cold...');
    const pip = actor('pip');
    sfx('drain');
    tint(R.glass[2], 1);
    await wait(30);
    tint(null);
    pip.lying = true;
    sfx('collapse');
    await wait(40);
    await emote('player', '!');
    await say('Terra', 'PIP!');
    await walk('player', 'ddrr', 2);
    await say('Terra', 'She\'s so cold... she\'s barely breathing! Duane! Get the children back!');
    sfx('hum');
    await say('', 'Silver shapes lift out of the flowers, humming softly, like seeds on the wind.');
    music('battle');
    let r = await battle(['seedDrone', 'seedDrone', 'seedDrone'], { bg: 'bloom', noFlee: true, music: 'tension' });
    if (r !== 'win') return;
    sfx('quake');
    shake(3, 60);
    await say('Duane', 'Terra... the whole field is moving!');
    await say('', 'The flowers fold toward each other, petals locking like hands, until they rise as one great bloom of stone and glass.');
    r = await battle(['bloom', 'seedDrone'], {
      bg: 'bloom', boss: true, music: 'stillness',
      script: async (b, ev) => {
        if (ev !== 'turn' || b.tranced) return;
        const terra = b.party.find((p) => p.id === 'terra');
        if (!terra) return;
        if (b.turns >= 5 || terra.c.hp < terra.c.maxhp * 0.5 || !b.party.some((p) => p.alive && p.id === 'duane')) {
          b.tranced = true;
          await say('Terra', 'Pip is in there somewhere... It\'s drinking her. It\'s drinking all of them...');
          await say('Terra', 'No. NO. I won\'t let you!');
          sfx('spirit');
          flash(R.spirit[0]);
          terra.base = 'terraGlow';
          terra.c.spriteOverride = 'terraGlow';
          terra.c.fieldOverride = 'terraGlow';
          terra.c.maxsp = 24; terra.c.sp = 24;
          if (!terra.c.cmds.includes('spirit')) terra.c.cmds.splice(1, 0, 'spirit');
          terra.c.hp = Math.max(terra.c.hp, Math.round(terra.c.maxhp * 0.6));
          terra.ready = true; terra.atb = 100;
          await say('', 'For a heartbeat, Terra\'s hands glow pink. A warmth she thought she had lost forever.');
          await say('Terra', 'This feeling... it\'s faint, but it\'s here. It\'s still here!');
          await notice('Terra can use Spirit! Its petals cut through machines.', { frames: 200 });
        }
      },
    });
    if (r !== 'win') return;
    await STORY.m1End();
  },

  async m1End() {
    const f = field();
    music('stillness');
    await addActor({ id: 'katarin2', name: 'Katarin', sprite: 'katarin', x: 25, y: 12, dir: 'right' });
    await say('', 'The great bloom shatters into glass and white petals. Across the field, every flower closes at once.');
    await walk('katarin2', 'rrrd', 2);
    await say('Katarin', 'Terra! Is she— is Pip—');
    await say('Terra', 'She\'s alive. Cold, and so still, but her heart is beating. I can feel it. Slow... like she\'s dreaming.');
    await say('Duane', 'What WAS that thing? Those drones... they came out of the flowers like they grew there.');
    await say('Terra', 'I don\'t know. But it wasn\'t angry. It was gentle. It was... tucking her in.');
    await say('Terra', '(And my hands... for one moment, the Esper in me woke up. I thought I\'d buried that part of myself.)');
    await say('Terra', '(If it\'s coming back... does that mean something is coming back with it?)');
    await wait(30);
    sfx('chime');
    await say('', 'Far to the north, an engine roars across the red sky. An airship, bearing the crest of Figaro.');
    void f;
    removeActor('katarin2');
    await STORY.m2Begin();
  },

  async fieldEdge() {
    await say('Terra', 'The east field. Nothing has grown here since the world fell. Not even weeds.');
  },
};
Object.assign(STORY, COMMON, ACT1, ACT2, ACT3, SIDE);
