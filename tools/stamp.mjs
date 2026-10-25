// Stamps a build id into sw.js / js/version.js / version.json and regenerates the
// service worker's precache list from the files on disk.
//
//   node tools/stamp.mjs                 -> stamp with $BUILD_ID (or a timestamp) + refresh assets
//   node tools/stamp.mjs --assets-only   -> only refresh the precache list (safe to commit)
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const assetsOnly = process.argv.includes('--assets-only');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = ['index.html', 'manifest.webmanifest']
  .map((f) => join(root, f))
  .concat(walk(join(root, 'css')), walk(join(root, 'js')), walk(join(root, 'icons')))
  .map((p) => './' + relative(root, p).split('\\').join('/'))
  .sort();
const assets = ['./', ...files];

let sw = readFileSync(join(root, 'sw.js'), 'utf8');
sw = sw.replace(/\/\*ASSETS\*\/[\s\S]*?\/\*END\*\//, '/*ASSETS*/' + JSON.stringify(assets, null, 2) + '/*END*/');

if (!assetsOnly) {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 12);
  const build = process.env.BUILD_ID || stamp;
  sw = sw.replace(/const BUILD = '[^']*';/, `const BUILD = '${build}';`);
  const vjs = join(root, 'js/version.js');
  writeFileSync(vjs, readFileSync(vjs, 'utf8').replace(/BUILD = '[^']*'/, `BUILD = '${build}'`));
  writeFileSync(join(root, 'version.json'), JSON.stringify({ build, date: now.toISOString() }) + '\n');
  console.log('stamped build', build);
}
writeFileSync(join(root, 'sw.js'), sw);
console.log(assets.length, 'assets in precache list');
