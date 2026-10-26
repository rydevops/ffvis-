// Random-command stress test with mixed parties.
export default async function (t) {
  const parties = (process.env.PARTIES || 'terra,sabin,setzer,strago|celes,cyan,edgar,locke|mog,gau,umaro,relm|maren,dalia,seven,gogo|shadow,ilse,terra,sabin').split('|');
  const foes = (process.env.FOES || 'snowWolf,mineBat,tideDrone|psalm|hushAcolyte,hushZealot,crawler|litany|coralEel,lanternFish').split('|');
  await t.wait(400);
  for (let i = 0; i < parties.length; i++) {
    await t.ev(([party, foe]) => {
      const R = window.__rfr, g = R.game;
      g.state = R.party.newState();
      const ids = party.split(',');
      g.state.party = ids; g.state.roster = ids;
      g.state.chars = Object.fromEntries(ids.map((id) => [id, R.party.makeChar(id, 22)]));
      const shards = Object.keys(R.party.ECHOES);
      ids.forEach((id, k) => { g.state.chars[id].echo = shards[k % shards.length]; });
      Object.assign(g.state.flags, { wsStone: true, wsTides: true, wsHeart: true, wsWind: true, trance: true, tranceFull: true, act2: true, ...Object.fromEntries(['terra', 'locke', 'celes', 'figaro', 'cyan', 'setzer', 'strago', 'relm', 'gau', 'mog', 'umaro', 'gogo', 'ilse', 'maren', 'dalia'].map((k) => ['ult_' + k, true])) });
      g.state.lores = { tideBreath: true, ribChord: true };
      g.state.rages = { frostFang: true, digRush: true };
      g.state.items = { tonic: 9, hiTonic: 5, ether: 5, salts: 3, remedy: 3, shuriken: 5 };
      g.state.parts = 9;
      R.script.teleport('mobliz', 10, 10, 'down', { noFade: true });
      setTimeout(() => R.script.runScript(() => R.script.battle(foe.split(','), { bg: 'vault', noFlee: true, canLose: true })), 400);
    }, [parties[i], foes[i % foes.length]]);
    await t.wait(1500);
    const t0 = Date.now();
    let shots = 0;
    while (Date.now() - t0 < 45000) {
      const st = await t.ev(() => {
        const g = window.__rfr.game, b = g.scene;
        if (b.constructor.name !== 'BattleScene') return { done: true, scene: b.constructor.name };
        if (b.mini) { // play the minigames
          if (b.mini.kind === 'blitz') return { blitz: b.mini.seq[b.mini.pos] };
          return { mini: b.mini.kind, t: b.mini.t };
        }
        const m = b.menu;
        if (m) {
          if (m.stage === 'cmd') m.i = Math.floor(Math.random() * m.cmds.length);
          if (m.stage === 'list') m.li = Math.floor(Math.random() * m.list.length);
        }
        return { menu: m ? m.stage : null, res: !!b.results, ov: g.overlays.length, hp: b.enemies.map((e) => e.hp), party: b.party.map((p) => p.c.hp) };
      });
      if (st.done) { console.error('battle', i, 'ended ->', st.scene); break; }
      if (Date.now() - t0 > 4000 * (shots + 1) && shots < 3) { await t.shot('cmd' + i + '_' + shots); shots++; }
      if (st.blitz) { const k = { L: 'ArrowLeft', R: 'ArrowRight', U: 'ArrowUp', D: 'ArrowDown', A: 'KeyZ' }[st.blitz]; await t.key(k); continue; }
      if (st.mini) { if (st.t > 30) await t.key('KeyZ'); else await t.wait(60); continue; }
      if (st.ov) { await t.skip(); continue; }
      if (st.menu === 'list' || st.menu === 'target' || st.menu === 'cmd' || st.res) { await t.key('KeyZ'); continue; }
      await t.wait(60);
    }
    await t.wait(800);
  }
  console.error('errors:', t.errors.length);
}
