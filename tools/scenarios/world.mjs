import { writeFileSync } from 'node:fs';
export default async function (t) {
  await t.wait(400);
  await t.ev((flags) => { const R = window.__rfr, g = R.game; g.state = R.party.newState(); Object.assign(g.state.flags, JSON.parse(flags)); g.state.party = ['terra']; g.state.chars.terra = R.party.makeChar('terra'); g.state.leaderSprite = 'terra'; R.script.teleport('world', 9, 47, 'down', { noFade: true }); }, process.env.FLAGS || '{}');
  await t.wait(1200);
  const url = await t.ev(() => {
    const f = window.__rfr.game.scene;
    const c = document.createElement('canvas'); c.width = f.ground.width; c.height = f.ground.height;
    const x = c.getContext('2d'); x.drawImage(f.ground, 0, 0);
    for (const p of f.props) { x.fillStyle = '#FF00FF'; x.fillRect(p.x * 16, p.y * 16, 16, 16); }
    return c.toDataURL();
  });
  writeFileSync(process.env.SP + '/' + (process.env.PFX || 'world') + '_full.png', Buffer.from(url.split(',')[1], 'base64'));
  await t.shot((process.env.PFX || 'world') + '_view');
}
