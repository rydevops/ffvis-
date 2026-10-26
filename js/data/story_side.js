// Optional side missions: character quests and ultimates, Seven's "Learning to Dream", the
// Interceptor's Trail, the Return of Maria, Cid's notes, the Colosseum, rebuilding towns,
// waking the Stilled early, and the Seraphs' tally.
import {
  say, choose, notice, wait, fadeOut, fadeIn, flash, shake, walk, actor, show, addActor, removeActor, emote, setProp, tint,
  teleport, setFlag, give, battle, field, recruit, sfx, music,
} from '../script.js';
import { game } from '../game.js';
import { R } from './palette.js';
import { makeChar, GEAR } from './party.js';
import { RAGES } from './enemies.js';
import { COMMON, st, autosave, joins } from './story_common.js';

const F = () => game.state.flags;
const has = (id) => st().party.includes(id);
const count = (prefix, n) => Array.from({ length: n }, (_, i) => i + 1).filter((k) => F()[prefix + k]).length;
const giveGear = async (id) => { st().gear[id] = (st().gear[id] || 0) + 1; sfx('item'); await notice(`Received ${GEAR[id].name}.`, { frames: 100 }); };
async function ultimate(flag, text) {
  setFlag(flag);
  sfx('levelup');
  flash('#FFF4C0');
  await notice(text, { frames: 200 });
  autosave();
}
async function needs(ids, line) {
  const miss = ids.filter((id) => !has(id));
  if (!miss.length) return true;
  await say('', line || `(${miss.map((id) => (st().chars[id] ? st().chars[id].name : id)).join(' and ')} should be in the party for this.)`);
  return false;
}
async function lessStilled(n, why) {
  if (!F().act3) return;
  st().stilled = Math.max(0, (st().stilled || 0) - n);
  await notice(`${why}  Stilled: ${st().stilled.toLocaleString('en-US')}`, { frames: 120 });
}

export const SIDE = {
  // ============================== the Seraphs ==============================
  async seraph(e) {
    await COMMON.seraph(e);
    if ((F().seraphs || 0) >= 7) setFlag('seraphsSeven');
  },

  // ============================== the Interceptor's Trail ==============================
  async interceptor(n) {
    sfx('flee');
    await say('', 'A black dog with a scarred muzzle looks up at you. For a moment he wags his tail. Then he is gone, quick as a shadow.');
    if (has('relm')) await say('Relm', 'INTERCEPTOR! Come back! ...He always runs off like that. Like he\'s leading me somewhere.');
    setFlag('int_' + n.n);
    removeActor(n.id);
    const c = count('int_', 7);
    await notice(`Interceptor sightings: ${c}/7`, { frames: 100 });
    if (c === 7) {
      setFlag('intTrail');
      await say('', 'Every sighting traced on the map points the same way: a sea cave on the coast near Thamasa.');
    }
  },
  async shadowCave() {
    music('night');
    await say('', 'A camp in the dark: a bedroll, a cold fire, a dog curled at the feet of a man in black. His face is badly scarred.');
    await say('Shadow', '...So the dog led you here. Traitor.');
    if (has('relm')) {
      await say('Relm', 'You\'re... You\'re him. Interceptor\'s person. Everybody thought you died in the tower.');
      await say('Shadow', 'Everybody was nearly right.');
      await say('Relm', 'Why didn\'t you come home? Why didn\'t you come to Thamasa?');
      await say('Shadow', 'Some people are better as a rumour. Paint your murals, girl. Live in the light. That is all I ever wanted for you.');
    } else {
      await say('Shadow', 'You want something. Everyone who comes here wants something.');
    }
    await say('Shadow', 'I know what is coming. The Cradle. I will not come back to the world. But I will stand with you for one battle, when it matters. Then I go.');
    setFlag('shadowQuest');
    setFlag('shadowPromise');
    st().chars.shadow ||= makeChar('shadow');
    await notice('Shadow will be waiting at the Cradle.', { frames: 160 });
  },

  // ============================== Cid's last notes ==============================
  async cidPage(e) {
    if (F()['cid_' + e.n]) return;
    setFlag('cid_' + e.n);
    setProp('cid' + e.n, 'open');
    sfx('item');
    const pages = [
      '"Day 1. The Empire is gone. I am an old man on a beach with a fishing rod. It is better than I deserve."',
      '"Ilse Vaunt was my best student. Too curious, too brave. I told her once that curiosity is a lamp, not a key."',
      '"Magitek drew on Espers. Without them it is scrap. And yet, something under the tower still hums. I can feel it in my teeth."',
      '"If the girl ever reads this: the eleven were not your fault alone. I taught you. I should have taught you fear."',
      '"Notes on a skiff design. Small, brass, very silly. Edgar would laugh."',
      '"Celes came by. She brought fish. She always brings fish. I pretend to be surprised."',
      '"If anyone finds these pages, I am on the island. Come and tell me how it ends."',
    ];
    await say('', 'A page of Cid\'s research, in his small cramped hand.');
    await say('Cid', pages[e.n - 1]);
    const c = count('cid_', 7);
    await notice(`Cid's notes: ${c}/7`, { frames: 100 });
    if (c === 7) { setFlag('cidNotesDone'); await say('', '(The notes lead to Solitary Island.)'); }
  },
  async cidHouse() {
    if (!F().cidNotesDone || F().cidAlive || F().cidLost) {
      await say('', F().cidAlive ? 'Cid\'s door is open. He waves from inside.' : 'A little beach house with a fishing rod by the door.');
      return;
    }
    await say('', 'At the door of the beach house, you hesitate. On the island, all that time ago... did Cid live?');
    const c = await choose(['Cid lived', 'Cid was lost']);
    if (c === 0) {
      setFlag('cidAlive');
      await addActor({ id: 'cidA', name: 'Cid', sprite: 'cid', x: 9, y: 9, dir: 'down', talk: 'cidReunion' });
      await say('Cid', 'Well, don\'t just stand there letting the sand in!');
      if (has('celes')) await say('Celes', 'Grandpa...');
      if (has('ilse')) {
        await say('Ilse', 'Professor.');
        await say('Cid', 'Ilse. My girl. I read the news on the wind. I know what you woke. I also know who\'s been fixing it.');
        await say('Ilse', 'I read your notes. Curiosity is a lamp, not a key.');
        await say('Cid', 'Hah. Did I write that? I was clever, once.');
      }
    } else {
      setFlag('cidLost');
      await say('', 'Inside, everything is tidy. A grave stands beside the house, with fresh flowers someone keeps bringing.');
      if (has('celes')) await say('Celes', '...I still bring fish. Every time.');
      if (has('ilse')) await say('Ilse', 'Thank you, Professor. For the notes. For all of it.');
    }
    await giveGear('lensCharm');
  },
  async cidReunion() { await say('Cid', 'Go on, save the world. Come back for supper after. I\'ll catch something.'); },

  // ============================== Terra: "Mobliz Lullaby" ==============================
  async terraPlay() {
    if (!F().playStarted) {
      await say('Mina', 'Terra! We\'re putting on a play! It\'s called "The Girl Who Saved the World" and it\'s about YOU.');
      await say('Mina', 'We need costumes. A crown, from a real castle. A cape, a fancy one, from Jidoor. And a wooden sword. Rowan lost his in Kohlingen.');
      setFlag('playStarted');
      await notice('Find a crown (Figaro), a cape (Jidoor) and a wooden sword (Kohlingen).', { frames: 200 });
      return;
    }
    const got = ['crown', 'cape', 'sword'].filter((k) => F()['costume_' + k]);
    if (got.length < 3) { await say('Mina', `We have ${got.length} of 3 costumes. The show must go on!`); return; }
    if (!(await needs(['terra'], '(Mina wants Terra in the audience.)'))) return;
    music('mobliz');
    await say('', 'The children perform on the schoolhouse step. Pip wears the crown. Rowan waves the wooden sword. Tobin is the monster, and roars with tremendous seriousness.');
    await say('Pip', '"And the girl said: I won\'t let you hurt my family! And she glowed pink, and the monster went away, and then she made everybody supper."');
    await say('Terra', '...Supper?');
    await say('Mina', 'That\'s the most important part. You always make supper.');
    await say('Terra', '(They don\'t see a weapon at all. They just see... their mother.)');
    await ultimate('ult_terra', 'Terra learned Morning Star!');
  },
  async costume(e) {
    if (F()['costume_' + e.costume]) { await say('', 'Nothing else here.'); return; }
    setFlag('costume_' + e.costume);
    if (e.prop) setProp(e.prop, 'open');
    sfx('item');
    await notice({ crown: 'Found a tin crown behind the throne.', cape: 'Found a velvet cape, only slightly moth-eaten.', sword: 'Found a wooden sword with ROWAN carved on the hilt.' }[e.costume], { frames: 110 });
  },

  // ============================== Locke: "The Last Keepsake" ==============================
  async rachelLetters() {
    if (F().gotRachelLetters) { await say('', 'An empty box.'); return; }
    if (!(await needs(['locke']))) return;
    setFlag('gotRachelLetters');
    setProp('letters', 'open');
    await say('', 'In the ruined house, under a fallen beam, a tin box tied with ribbon.');
    await give('rachelLetters', 1);
    await say('Locke', '...These are Rachel\'s. Her handwriting. She wrote them while I was away. I never knew.');
  },
  async rachelGrave() {
    if (!F().gotRachelLetters || !has('locke') || F().lettersRead) { await say('', 'Rachel\'s grave. Someone keeps fresh flowers on it.'); return; }
    setFlag('lettersRead');
    music('stillness');
    await say('', 'Locke kneels by the grave and reads the letters aloud, one by one.');
    await say('Locke', '"Locke, if you\'re reading this, I\'m probably cross with you for being late again. Come home. Or don\'t, and be happy. Just don\'t be sad on my account."');
    await say('Locke', '...I spent a long time being sad on your account, Rachel. I think I can stop now.');
    if (has('celes')) await say('Celes', 'She sounds like she loved you very much.');
    await say('Locke', 'Her family should have these. Not me.');
  },
  async rachelFamily() {
    if (!F().lettersRead) { await say('Rachel\'s Father', 'Locke? He comes by. Builds that house on the hill. Never stays to talk.'); return; }
    if (F().ult_locke) { await say('Rachel\'s Father', 'Tell Locke to come for dinner. And to bring the General.'); return; }
    await say('Locke', 'These are hers. Letters she wrote me. I think she\'d want you to have them.');
    await say('Rachel\'s Father', '...Thank you, son. Go on, now. Finish that house of yours. She\'d want that too.');
    delete st().items.rachelLetters;
    setFlag('lockeHouse');
    await ultimate('ult_locke', 'Locke learned Second Chance! The house on the hill will be finished.');
  },

  // ============================== Celes: "Iron Rose" ==============================
  async ironRose() {
    await say('Colonel Varre', 'General Chere. You\'re a long way from Maranda. We\'re restarting the facility. SOLACE parts, Imperial know-how. Magitek armour that doesn\'t need Espers.');
    if (!(await needs(['celes', 'maren'], '(Colonel Varre won\'t speak to anyone but General Celes and Lieutenant Maren.)'))) return;
    await say('Celes', 'And then what, Colonel? Another Empire? Another war?');
    await say('Colonel Varre', 'Then we\'d matter again! Get out of my way, General.');
    await say('Maren', 'General. These are our people. Don\'t kill them.');
    await say('Celes', 'I won\'t. Swords flat, Maren.');
    const r = await battle(['siegebreaker', 'hushGunner', 'hushGunner'], { bg: 'desert', canLose: true, noFlee: true });
    if (r !== 'win') return;
    await say('', 'The loyalists lie groaning, bruised but alive. Celes kicks the SOLACE engine core until it sparks and dies.');
    await say('Colonel Varre', 'Why... why didn\'t you finish us?');
    await say('Celes', 'Because I was you, once. Go home, Colonel. Grow something.');
    await ultimate('ult_celes', 'Celes learned Runic Blade!');
  },

  // ============================== Edgar & Sabin: "Twin Crowns" ==============================
  async twinCrowns() {
    if (!(await needs(['edgar', 'sabin'], '(The old engine core. Edgar and Sabin should both see this.)'))) return;
    await say('Edgar', 'Mother designed this engine core. Did you know? The whole castle moves on her drawings.');
    await say('Sabin', 'I knew. She used to let me hold the wrench.');
    if (st().parts < 12) { await say('Edgar', `If we rebuild the core properly, it'll take twelve machine parts. We have ${st().parts}.`); return; }
    st().parts -= 12;
    sfx('build'); await wait(20); sfx('engine');
    await say('', 'As the core turns over, a panel slides open behind it: a small hidden chamber, and inside it, a music box with a brass cylinder.');
    music('lullaby');
    await say('Queen of Figaro', '"Edgar, Sabin. If you\'re hearing this, you\'ve fixed my engine, which means you\'ve been working together. Good."');
    await say('Queen of Figaro', '"Whatever you become, become it together. I love you both. Now go and wash your hands."');
    await say('Sabin', '...She always said that. Wash your hands.');
    await say('Edgar', 'Let\'s do her proud, brother.');
    await ultimate('ult_figaro', 'Edgar and Sabin learned Royal Tempest!');
  },

  // ============================== Cyan: "Letters to Doma" ==============================
  async domaLettersFind() {
    setFlag('gotDomaLetters');
    await say('', 'In a sealed chest by the Wellspring: a soldier\'s satchel, full of letters never sent.');
    await give('domaLetters', 1);
    if (has('cyan')) await say('Cyan', 'These are... the last letters of my men. To their families. They never reached them.');
  },
  async domaLetter(n) {
    if (F()['dl_' + n.n]) { await say(n.name, 'Thank you for bringing his letter. I read it every night.'); return; }
    if (!st().items.domaLetters || !has('cyan')) { await say(n.name, ['My husband was a soldier of Doma. He never came home.', 'My boy served at Doma. They say the castle fell in a single night.', 'My brother was Doma\'s blacksmith. I still have his hammer.'][n.n - 1]); return; }
    setFlag('dl_' + n.n);
    await say('Cyan', 'Forgive me. I am Cyan Garamonde, once of Doma\'s guard. I carry a letter written to thee.');
    await say(n.name, '...It\'s his handwriting. He was thinking of me. At the end, he was thinking of me.');
    const c = count('dl_', 3);
    if (c === 3) {
      delete st().items.domaLetters;
      await say('Cyan', 'Every letter delivered. Rest now, my brothers. Thy words have come home.');
      await ultimate('ult_cyan', 'Cyan learned the last Bushido: Dawnblade!');
    } else await notice(`Letters delivered: ${c}/3`, { frames: 100 });
  },

  // ============================== Setzer: "Darill's Wake" ==============================
  async crashSite(e) {
    if (F()['crash_' + e.n]) { await say('', 'Twisted brass and old canvas. Nothing else here.'); return; }
    if (!has('setzer')) { await say('', 'Wreckage of an old airship, half buried. Someone who knew airships might recognise it.'); return; }
    setFlag('crash_' + e.n);
    sfx('build');
    await say('Setzer', ['A piece of Darill\'s engine. I\'d know this housing anywhere.', 'Her fuel regulator. She tuned it by ear.', 'The prop hub. Look at that, still balanced.', 'The prototype throttle. Her hand-prints are worn into it.'][e.n - 1]);
    const c = count('crash_', 4);
    await notice(`Darill's engine parts: ${c}/4`, { frames: 100 });
    if (c < 4) return;
    await say('Setzer', 'That\'s all of them. With these the Falcon could outfly anything in the sky.');
    await say('Setzer', '...Anything. Even them. I saw one of Vigil\'s racers still circling Dragon\'s Neck. Let\'s find out who\'s faster.');
    const r = await battle([{ kind: 'vigil', name: "Vigil's Racer", hp: 6000 }, 'gunDrone'], { bg: 'deck', boss: true, canLose: true, noFlee: true });
    if (r !== 'win') { setFlag('crash_4', false); return; }
    await say('Setzer', 'HA! Did you see that, Darill? Did you SEE that?');
    setFlag('falconFast');
    await ultimate('ult_setzer', 'The Falcon is faster! Setzer\'s Slots can now hit Jackpot Royale.');
  },

  // ============================== Strago & Relm: "The Painted Archive" ==============================
  async paintedArchive() {
    if (!(await needs(['strago', 'relm']))) return;
    await say('Relm', 'Grandpa, sit. I\'m going to paint the magi city the way the archive remembers it. You read whatever shows up.');
    sfx('flower');
    flash(R.spirit[0]);
    await say('', 'Relm paints a city of white towers. As the paint dries, words surface in it like fish in a pond: lost lore, a thousand years old.');
    await say('Strago', '"The last spell of the magi was not a weapon. It was an apology." ...Atonement. I know this one. I have always known it, I think.');
    await say('Relm', 'And look at my brush, Grandpa. The paint\'s still moving.');
    setFlag('ult_relm');
    await ultimate('ult_strago', 'Strago learned Atonement! Relm learned Living Canvas!');
  },

  // ============================== Gau: "Voice of the Veldt" ==============================
  async gauHerd(n) {
    if (!(await needs(['gau'], '(The herd is panicking. Only Gau could calm it.)'))) return;
    await say('Gau', 'Shhh. Shhh. Gau here. Gau take you somewhere safe.');
    await say('', 'Silver drones drop out of the sky, nets of light trailing beneath them.');
    const r = await battle([['gunDrone', 'gunDrone'], ['seedDrone', 'seedDrone', 'seedDrone', 'seedDrone'], ['gunDrone', 'gardener']][n.n - 1], { bg: 'plains', noFlee: true });
    if (r !== 'win') return;
    setFlag('herd_' + n.n);
    removeActor(n.id);
    const c = count('herd_', 3);
    await notice(`Herds led to the sanctuary: ${c}/3`, { frames: 100 });
    if (c < 3) return;
    await say('', 'At a ring of old stones in the heart of the Veldt, the herds settle and graze, safe at last.');
    await say('Gau', 'Gau\'s family. All of them. Gau is king of the Veldt!');
    st().rages ||= {};
    for (const k of Object.keys(RAGES)) st().rages[k] = true;
    await ultimate('ult_gau', 'Gau learned Beast King\'s Roar, and every rage of the Veldt!');
  },

  // ============================== Mog & Umaro: "Narshe's Hearth" ==============================
  async narsheHearth() {
    if (!F().wsStone) { await say('Moogle Elder', 'Kupo...'); return; }
    if (!F().festivalAsked) {
      await say('Moogle Elder', 'Kupo! The snow is clean! We must have a festival, kupo! But twelve moogles went exploring in the mines and haven\'t come back!');
      setFlag('festivalAsked');
      await notice('Find the twelve lost moogles in the Narshe mines.', { frames: 160 });
      return;
    }
    const c = Array.from({ length: 12 }, (_, i) => F()['moogle_' + i]).filter(Boolean).length;
    if (c < 12) { await say('Moogle Elder', `${c} of 12 moogles home, kupo!`); return; }
    if (!(await needs(['mog'], '(The festival can\'t start without Mog, kupo!)'))) return;
    music('narshe');
    await give('festivalBell', 1);
    await say('', 'The Festival Bell rings over Narshe. Miners and moogles dance in the clean white snow. Umaro is persuaded, eventually, to dance too.');
    await say('Mog', 'This is the best day of Mog\'s whole life, kupo!');
    setFlag('ult_umaro');
    await ultimate('ult_mog', 'Mog learned Snowfall Dance! Umaro learned Big Hug!');
  },
  async lostMoogle(n) {
    const i = n.id.replace('lost', '');
    setFlag('moogle_' + i);
    removeActor(n.id);
    sfx('item');
    const c = Array.from({ length: 12 }, (_, k) => F()['moogle_' + k]).filter(Boolean).length;
    await say('Moogle', ['Kupo! I got lost!', 'Is it festival time, kupo?', 'I was counting rocks, kupo.', 'Kupopo! You found me!'][c % 4]);
    await notice(`Moogles found: ${c}/12`, { frames: 80 });
  },

  // ============================== Gogo: "The Mimic's Mirror" ==============================
  async mimicMirror() {
    if (!(await needs(['gogo']))) return;
    await say('Gogo', 'I have studied each of you. Every swing. Every hesitation. One final performance: I will mirror all of you at once.');
    const r = await battle([{ kind: 'gogoMirror' }], { bg: 'nightmare', boss: true, canLose: true, noFlee: true });
    if (r !== 'win') { await say('Gogo', 'Again, when you are ready.'); return; }
    await say('Gogo', 'Bravo. Bravo. Now I am all of you, and you are a little of me.');
    await ultimate('ult_gogo', 'Gogo can now mimic every party ability!');
  },

  // ============================== Ilse: "Eleven Names" ==============================
  async elevenNames(n) {
    if (F()['en_' + n.n]) { await say(n.name, ['Thank you for coming. Truly.', 'I said what I said.', 'Come back and see the baby.'][n.n - 1]); return; }
    if (!has('ilse')) { await say(n.name, ['My son went to dig under the tower. For magicite, he said.', 'My husband worked for the Imperial researchers. He never came back.', 'My brother Oskar went digging. He was the funny one.'][n.n - 1]); return; }
    setFlag('en_' + n.n);
    const scenes = [
      [['Ilse', 'Your son, Bram. He was on my crew. I opened the door that killed him. I came to tell you myself.'], ['Old Sailor', '...He loved that work. He wrote me about you. Said you were the cleverest woman alive.'], ['Old Sailor', 'I forgive you, girl. He would have.']],
      [['Ilse', 'Your husband, Hale. He was my foreman. He was the last one standing.'], ['Widow', 'Get out.'], ['Widow', '...I don\'t forgive you. I can\'t. Maybe one day. Not today.'], ['Ilse', 'I understand. Thank you for listening.']],
      [['Ilse', 'Oskar. Your brother. He told jokes in the dark to keep us brave.'], ['Young Wife', 'He did that at home too. Terrible jokes.'], ['Young Wife', 'We named the baby after him. ...You\'ll come back and meet him? Promise me.']],
    ][n.n - 1];
    for (const [w, l] of scenes) await say(w, l);
    const c = count('en_', 3);
    if (c < 3) { await notice(`Families visited: ${c}/3`, { frames: 100 }); return; }
    await give('elevenNames', 1);
    await say('Ilse', 'Some forgave me. Some didn\'t. Both of those are fair. I\'ll carry all eleven.');
    await ultimate('ult_ilse', 'Ilse learned Overclock!');
  },

  // ============================== Seven: "Learning to Dream" ==============================
  async sevenBirthday() {
    if (!(await needs(['seven'], '(Tobin\'s birthday party! "Bring the little robot," he says.)'))) return;
    await say('Tobin', 'It\'s my birthday! You have to sing! Everyone has to sing!');
    await say('Seven', 'I know one song. It is a lullaby. Is that acceptable?');
    await say('Tobin', 'YES.');
    await say('', 'Seven sings the Mobliz lullaby, a little off-key, and the children join in. Its eye glows amber the whole time.');
    await say('Seven', 'I did not know a song could be for being awake, as well as for sleeping.');
    setFlag('sevenBirthday');
    removeActor('bday');
    await SIDE.sevenCheck();
  },
  async sevenSunrise() {
    if (F().sevenSunrise || !has('seven')) return;
    setFlag('sevenSunrise');
    tint('#FFD8A0', 1);
    await say('', 'On the island\'s western shore, Seven watches the sun climb out of the sea.');
    await say('Seven', 'It happens every day? Every single day? And people go on sleeping through it?');
    await say('Ilse', 'Most of us forget to look.');
    await say('Seven', 'I will not forget.');
    tint(null);
    await SIDE.sevenCheck();
  },
  async sevenCheck() {
    const n = ['sevenBirthday', 'sevenSunrise', 'sevenConcert'].filter((k) => F()[k]).length;
    await notice(`Seven's memories: ${n}/3`, { frames: 100 });
    if (n < 3 || F().sevenBackup) return;
    await say('Seven', 'Ilse. I have a request. If I am ever... taken apart. Could you keep a copy of who I am? The songs. The sunrise. The birthday.');
    await say('Ilse', 'You want a backup.');
    await say('Seven', 'I want to be remembered. I think that is what dreaming is for.');
    setFlag('sevenBackup');
    await give('sevenBackup', 1);
    await notice('Seven\'s memory is safe in Ilse\'s toolkit.', { frames: 160 });
  },

  // ============================== Maren: "Albrook's Watch" ==============================
  async albrookWatch() {
    if (!(await needs(['maren'], '(A grey-veiled man is whispering to the grieving at the docks.)'))) return;
    await say('Grey Recruiter', 'Lieutenant Ashgrove. Come back to us. Your mother sleeps peacefully. Wouldn\'t you like to join her?');
    await say('Maren', 'Get away from my mother\'s door.');
    const r = await battle(['silentChoir', 'siegebreaker', 'silentChoir'], { bg: 'town', noFlee: true });
    if (r !== 'win') return;
    await say('Maren', 'Nobody else gets recruited on this street. Not while I\'m standing.');
    removeActor('hushCell');
    await ultimate('ult_maren', 'Maren learned Unbroken Line!');
  },

  // ============================== Dalia: "The Mother's Song" ==============================
  async mothersSong() {
    if (!(await needs(['dalia']))) return;
    if ((F().echoes || 0) < 8) { await say('Dalia', `I can almost hear her. I need to listen to more Echoes first. (${F().echoes || 0}/8 heard)`); return; }
    music('espers');
    tint('#8A6A5A', 1);
    await say('', 'The shrine sings with every Echo Dalia has gathered. Out of them, one voice comes clear.');
    await say('Dalia\'s Mother', 'My little knife. If you hear this, you lived. That is all I wanted. Don\'t fight because you are angry. Fight because there is something you love.');
    await say('Dalia', '...Okay. Okay, Mother. I will.');
    tint(null);
    await ultimate('ult_dalia', 'Dalia learned Esper Bloom!');
  },

  // ============================== The Return of Maria / Seven's concert ==============================
  async impresario() {
    if (F().mariaDone) {
      if (has('seven') && !F().sevenConcert) {
        setFlag('sevenConcert');
        await say('Impresario', 'Ah, the little machine! Come, sit in my box. The orchestra is rehearsing.');
        await say('', 'Seven sits very still through the whole overture. When it ends, its lens is fogged with condensation.');
        await say('Seven', 'I think I was... moved. Is that the word? Something moved, inside.');
        await SIDE.sevenCheck();
        return;
      }
      await say('Impresario', 'Bravissimo! Come back any time. The best seats, always, for you.');
      return;
    }
    if (!F().mariaStarted) {
      await say('Impresario', 'A new opera! The fall of Kefka, the return of hope! But it needs a Maria, and there is only one Maria.');
      if (!(await needs(['celes'], '(The Impresario keeps glancing at the door, as if waiting for a particular General.)'))) return;
      await say('Celes', '...Oh no.');
      await say('Impresario', 'Oh YES. I need an orchestra, a stage that doesn\'t fall down, and you. Find me musicians, there\'s a fiddler in Nikeah, and ten parts to fix the rigging.');
      setFlag('mariaStarted');
      return;
    }
    if (!F().mus_1) { await say('Impresario', 'Musicians! The fiddler in Nikeah!'); return; }
    if (!F().stageFixed) {
      if (st().parts < 10) { await say('Impresario', `The rigging! Ten parts! You have ${st().parts}.`); return; }
      st().parts -= 10; sfx('build'); setFlag('stageFixed');
      await say('Impresario', 'Magnificent! Tonight, then. Celes, your dress is in the wings.');
    }
    if (!has('celes')) { await say('Impresario', 'Where is my Maria?!'); return; }
    music('celes');
    await say('', 'The house lights dim. Celes steps onto the stage in white, and the theatre goes silent.');
    await say('Celes', '"O my hero, so far away now... Will I ever see your smile?"');
    sfx('hum');
    await say('', 'In the rafters, something moves. Grey veils. A blade catches the light above the singer\'s head.');
    await say('Celes', '(Not tonight.) "...I will wait for you, though the night is long!"');
    const r = await battle(['hushZealot', 'hushZealot', 'hushGunner'], { bg: 'town', noFlee: true });
    if (r !== 'win') return;
    await say('', 'The saboteurs are dragged away. Celes finishes the aria. The audience weeps, and then stands, and then will not stop applauding.');
    if (has('seven')) setFlag('sevenConcert');
    setFlag('mariaDone');
    await giveGear('ribbon');
    if (has('seven')) await SIDE.sevenCheck();
  },
  async recruitMusician(e) {
    if (F()['mus_' + e.n]) { await say('Fiddler', 'See you at the opera!'); return; }
    setFlag('mus_' + e.n);
    await say('Fiddler', 'For Maria? I\'d play for free. ...I\'ll play for free, I mean it.');
  },

  // ============================== the Colosseum ==============================
  async colosseum() {
    await say('General Rask', 'Welcome to the new Colosseum! I fought for the Empire forty years. Now I put salvaged SOLACE machines in a ring and let brave fools beat them up. Much healthier.');
    const bouts = [
      { label: 'Drone Swarm (500 GP)', cost: 500, group: ['gunDrone', 'gunDrone', 'gunDrone'], prize: 'blackBelt' },
      { label: 'Gardener Trio (1500 GP)', cost: 1500, group: ['gardener', 'gardener', 'thornChoir'], prize: 'hermesSandal' },
      { label: 'Siege Line (3000 GP)', cost: 3000, group: ['siegebreaker', 'siegebreaker', 'stalker'], prize: 'heroRing' },
      { label: 'The Champion (8000 GP)', cost: 8000, group: [{ kind: 'retriever', name: 'Champion Unit', hp: 12000 }], prize: 'sword5' },
    ];
    const c = await choose([...bouts.map((b) => b.label), 'Leave'], { cancel: bouts.length });
    if (c < 0 || c >= bouts.length) return;
    const b = bouts[c];
    if ((st().gp || 0) < b.cost) { await say('General Rask', 'Come back with the entry fee, soldier.'); return; }
    st().gp -= b.cost;
    const r = await battle(b.group, { bg: 'desert', canLose: true, noFlee: true, battleMusic: 'boss' });
    if (r === 'win') { await say('General Rask', 'HA! Now that\'s a fight!'); await giveGear(b.prize); }
    else await say('General Rask', 'Get up, soldier. Try again when you\'ve had a nap.');
  },

  // ============================== rebuilding towns ==============================
  async rebuild(n) {
    const key = 'rb_' + n.town;
    const stage = F()[key] || 0;
    const prize = { mobliz: 'lensCharm', hollowmere: 'hermesSandal', albrook: 'esperSilk' }[n.town];
    if (stage >= 3) { await say(n.name, 'Look at the place! Thank you, truly.'); return; }
    if (n.town === 'mobliz' && stage === 0 && !F().rbAsked) { setFlag('rbAsked'); }
    await say(n.name, `We could rebuild with machine parts. Ten parts would see the next stage done. (${stage}/3 stages)`);
    if (st().parts < 10) { await say('', `(You have ${st().parts} parts.)`); return; }
    const c = await choose(['Donate 10 parts', 'Not now'], { cancel: 1 });
    if (c !== 0) return;
    st().parts -= 10;
    F()[key] = stage + 1;
    sfx('build');
    await notice(`${n.town[0].toUpperCase() + n.town.slice(1)} rebuilding: ${stage + 1}/3`, { frames: 100 });
    await lessStilled(4000, 'New homes for the families who woke.');
    if (stage + 1 === 3) { await say(n.name, 'It\'s done! Here, we found this while clearing the rubble. It\'s yours.'); await giveGear(prize); }
  },

  // ============================== waking the Stilled early (Act III, with Relm) ==============================
  async albrookStilled(n) { await SIDE.wakeStilled(n); },
  async stilled(n) { if (!(await SIDE.wakeStilled(n, true))) { const { ACT1 } = await import('./story_act1.js'); await ACT1.stilled(n); } },
  async stilledChild(n) { if (!(await SIDE.wakeStilled(n, true))) { const { ACT1 } = await import('./story_act1.js'); await ACT1.stilledChild(n); } },
  async wakeStilled(n, quiet) {
    if (!(F().act3 && F().relmCure && has('relm'))) {
      if (!quiet) await say('', 'Breathing, slow and even. Smiling a little, as if the dream is a kind one.');
      return false;
    }
    const key = 'woke_' + field().mapId + '_' + n.id;
    if (F()[key]) return true;
    await say('Relm', 'Hold still. I\'ll paint you awake.');
    sfx('flower');
    flash(R.spirit[0]);
    F()[key] = true;
    const a = actor(n.id);
    if (a) { a.stilled = false; a.lying = false; a.lyingCanvas = null; a.dir = 'down'; a.talk = 'wokenThanks'; }
    await say(n.name, 'Wha...? I was dreaming of my garden. ...Thank you. Thank you!');
    await lessStilled(1500, 'One more face woken, and everyone who loves them.');
    return true;
  },
  async wokenThanks(n) { await say(n.name, 'I\'m awake. I\'m really awake.'); },
};

void [choose, fadeOut, fadeIn, shake, walk, show, emote, teleport, recruit, joins];
