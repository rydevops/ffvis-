// Field sprite art (16x24). Authored without outlines; the builder adds a 1px outline in
// the deep step of the adjacent ramp, with #140C14 only at the feet.
//
// Layer keys
//   hair  H h j      (light, base, shadow)      skin  S s z
//   top   T t u      bottom B b n               trim/accent  A a
//   cape  C c v      boots  F f                 extra  X x y (bag, helmet, etc.)
//   eye   k (#140C14) eye-light w                mouth m
//
// Each sprite = body layer (shared, per build) + head layer (per character) + extras.
// Rows 0-11: head. Rows 11-21: body. Feet on row 21; outline on row 22; row 23 empty.

// ---------------------------------------------------------------- adult bodies
// [dir][frame] -> 24 rows. frame 0 stand, 1 step A, 2 step B. Head bob is applied in code.
const E = '................';
const pad = (rows, top = 0) => [...Array(top).fill(E), ...rows, ...Array(24 - top - rows.length).fill(E)];

const TORSO_DOWN = [
  '.....uTTTTu.....',
  '....tTTTTTTu....',
  '...tTTtTTtTTu...',
  '...TTttTTttTu...',
  '...sutaaaaauz...',
  '...zuBBbbBBnz...',
];
const TORSO_UP = [
  '.....uttttu.....',
  '....tTttttTu....',
  '...tTTtttttTu...',
  '...TTttttttuu...',
  '...sutaaaaauz...',
  '...zubbbbbbnz...',
];
const TORSO_LEFT = [
  '......uTTu......',
  '.....tTTTTu.....',
  '.....TTttTu.....',
  '.....TstTTu.....',
  '.....zaaaau.....',
  '.....BBbbbn.....',
];
const LEGS = {
  down: [
    ['....bBb..bBn....', '....bBb..bbn....', '....nbb..bbn....', '....fFf..fFf....', '...kfff..fffk...'],
    ['....bBb..bBn....', '....bBb..bbn....', '....fFf..bbn....', '....kff..fFf....', '.........fffk...'],
    ['....bBb..bBn....', '....bBb..bbn....', '....nbb..fFf....', '....fFf..ffk....', '...kfff.........'],
  ],
  up: [
    ['....bbn..bbn....', '....bbn..bbn....', '....nbn..nbn....', '....fff..fff....', '...kfff..fffk...'],
    ['....bbn..bbn....', '....bbn..bbn....', '....fff..nbn....', '....kff..fff....', '.........fffk...'],
    ['....bbn..bbn....', '....bbn..bbn....', '....nbn..fff....', '....fff..ffk....', '...kfff.........'],
  ],
  left: [
    ['......bBbn......', '......bBbn......', '......bbnn......', '......fFff......', '.....kffff......'],
    ['.....bBb.bn.....', '....bBb...bn....', '....bb....nn....', '...fFf....ff....', '..kfff....ffk...'],
    ['......bBbn......', '.....bBb.n......', '.....bb..nb.....', '....fFf..ff.....', '...kfff..fk.....'],
  ],
};
// Long-coat / skirt variant: the hem covers the thighs.
const LEGS_COAT = {
  down: LEGS.down.map((f) => ['...utttttttu....', ...f.slice(1)]),
  up: LEGS.up.map((f) => ['...utttttttu....', ...f.slice(1)]),
  left: LEGS.left.map((f) => ['.....tTttu......', ...f.slice(1)]),
};

function bodyFrames(torso, legs) {
  const out = {};
  for (const dir of ['down', 'up', 'left']) {
    out[dir] = [0, 1, 2].map((fr) => pad([...torso[dir], ...legs[dir][fr]], 11));
  }
  return out;
}
export const BODY = {
  adult: bodyFrames({ down: TORSO_DOWN, up: TORSO_UP, left: TORSO_LEFT }, LEGS),
  coat: bodyFrames({ down: TORSO_DOWN, up: TORSO_UP, left: TORSO_LEFT }, LEGS_COAT),
};

// ---------------------------------------------------------------- heads
// Each head is 12 rows (0-11) in a 16-wide frame. Row 11 overlaps the collar.
export const HEADS = {
  terra: {
    down: [
      '........jh......',
      '.......hHhj.....',
      '.....jhHHhhj....',
      '....jhHHhhhhj...',
      '...jhHhhhhhhhj..',
      '...jhhhhhSShhj..',
      '...jhSSSSSSShj..',
      '...jhSkSSSkShj..',
      '...jjSkwSSkwjj..',
      '...jjzSSmSSzjj..',
      '...jj.zzzzz.jj..',
      '....j.......j...',
    ],
    up: [
      '.......jh.......',
      '......hHHj......',
      '.....jhHHhj.....',
      '....jhHhhhhj....',
      '...jhHhhhhhhj...',
      '...jhhhhhhhhj...',
      '...jhhhjhhhhj...',
      '...jhhhhjhhhj...',
      '...jjhhhhhhjj...',
      '...jjjhhhhjjj...',
      '....jjjjjjjj....',
      '.....j....j.....',
    ],
    left: [
      '..........hhj...',
      '.........hHhhj..',
      '.....jhhhHhhhj..',
      '....jhHHhhhhhhj.',
      '...jhHhhhhhhhjj.',
      '...hhhhhhhhhjj..',
      '..jSSShhhhhjj...',
      '..SSSSShhhhj....',
      '..SkSSShhhj.....',
      '..SkwSzhhjj.....',
      '...zSzzjjj......',
      '....zz..........',
    ],
  },
  ilse: {
    down: [
      '................',
      '................',
      '.....jhhhhj.....',
      '....jhHHHhhj....',
      '...jhHHhhhhhj...',
      '...jhhHhhhhhj...',
      '...jhSSSSShhj...',
      '...jSSSSSSSSj...',
      '...jSkSSSkSSj...',
      '...jSkSSSkSSj...',
      '....zSSmSSSz....',
      '.....zzzzzz.....',
    ],
    up: [
      '................',
      '................',
      '.....jhhhhj.....',
      '....jhHHhhhj....',
      '...jhHhhhhhhj...',
      '...jhhhhhhhhj...',
      '...jhhhhhhhhj...',
      '...jhhhhhhhhj...',
      '...jjhhhhhhjj...',
      '....jjhhhhjj....',
      '.....zjjjjz.....',
      '.....zzzzzz.....',
    ],
    left: [
      '................',
      '................',
      '.....jhhhhj.....',
      '....hHHHhhhj....',
      '...hHhhhhhhhj...',
      '...hhhhhhhhhj...',
      '..jSSShhhhhjj...',
      '..SSSSShhhhj....',
      '..SkSSSShhj.....',
      '..SkSSSzhjj.....',
      '...SmSzzjj......',
      '....zzzz........',
    ],
  },
  duane: {
    down: [
      '................',
      '................',
      '.....jhhhhj.....',
      '....jhHhhhhj....',
      '...jhHhhHhhhj...',
      '...jhhhhhhhhj...',
      '...jSSSSSSSSj...',
      '...SSSSSSSSSS...',
      '...SSkSSSSkSS...',
      '...zSSSSSSSSz...',
      '....zSSmmSSz....',
      '.....zzzzzz.....',
    ],
    up: [
      '................',
      '................',
      '.....jhhhhj.....',
      '....jhHhhhhj....',
      '...jhHhhhhhhj...',
      '...jhhhhhhhhj...',
      '...jhhhhhhhhj...',
      '...zjhhhhhhjz...',
      '...zjjhhhhjjz...',
      '...zzjjjjjjzz...',
      '....zzzzzzzz....',
      '.....zzzzzz.....',
    ],
    left: [
      '................',
      '................',
      '.....jhhhhj.....',
      '....hHHhhhhj....',
      '...hHhhhhhhhj...',
      '...hhhhhhhhhj...',
      '..SSSShhhhhj....',
      '..SSSSSShhzj....',
      '..SkSSSSzzz.....',
      '..SSSSSSzz......',
      '...SmmSzz.......',
      '....zzzz........',
    ],
  },
  katarin: {
    down: [
      '................',
      '................',
      '.....jhhhhj.....',
      '....jhHHhhhj....',
      '...jhHhhhhhhj...',
      '...jhhSSSShhj...',
      '..jhhSSSSSShhj..',
      '..jhSkSSSSkShj..',
      '..jhSkSSSSkShj..',
      '..jhzSSmmSSzhj..',
      '..jhjzzzzzzjhj..',
      '..jh........hj..',
    ],
    up: [
      '................',
      '................',
      '.....jhhhhj.....',
      '....jhHHhhhj....',
      '...jhHhhhhhhj...',
      '...jhhhhhhhhj...',
      '..jhhhhhhhhhhj..',
      '..jhhhhhhhhhhj..',
      '..jhhhhhhhhhhj..',
      '..jjhhhhhhhhjj..',
      '..jjjhhhhhhjjj..',
      '...jjjjjjjjjj...',
    ],
    left: [
      '................',
      '................',
      '.....jhhhhj.....',
      '....hHHHhhhj....',
      '...hHhhhhhhhj...',
      '...hhhhhhhhhhj..',
      '..jSSShhhhhhhj..',
      '..SSSSShhhhhhj..',
      '..SkSSShhhhhjj..',
      '..SSSSzhhhhhj...',
      '...Smzzjhhhjj...',
      '....zz..jjjj....',
    ],
  },
  hale: { // crew foreman: brass helmet with lamp, big beard
    down: [
      '................',
      '................',
      '.....xXXXXx.....',
      '....xXXAAXXx....',
      '...xXXXAAXXXy...',
      '...yxxxxxxxxy...',
      '...hSSSSSSSSh...',
      '...hSkSSSSkSh...',
      '...hSkSSSSkSh...',
      '...hhhSSSShhh...',
      '....hhhmmhhh....',
      '.....jhhhhj.....',
    ],
    up: [
      '................',
      '................',
      '.....xXXXXx.....',
      '....xXXXXXXx....',
      '...xXXXXXXXXy...',
      '...yxxxxxxxxy...',
      '...jhhhhhhhhj...',
      '...jhhhhhhhhj...',
      '...zjhhhhhhjz...',
      '...zzjjjjjjzz...',
      '....zzzzzzzz....',
      '.....zzzzzz.....',
    ],
    left: [
      '................',
      '................',
      '.....xXXXXx.....',
      '..AAxXXXXXXx....',
      '..AXXXXXXXXXy...',
      '...yxxxxxxxxy...',
      '..SSSShhhhhj....',
      '..SkSSShhhj.....',
      '..SkSSSzhj......',
      '..hhhSShhj......',
      '...hhhhhj.......',
      '....jhhj........',
    ],
  },
  crew: { // digger: helmet, no beard
    down: [
      '................',
      '................',
      '.....xXXXXx.....',
      '....xXXAAXXx....',
      '...xXXXAAXXXy...',
      '...yxxxxxxxxy...',
      '...jSSSSSSSSj...',
      '...SSkSSSSkSS...',
      '...SSkSSSSkSS...',
      '...zSSSSSSSSz...',
      '....zSSmmSSz....',
      '.....zzzzzz.....',
    ],
    up: null, // filled from hale
    left: [
      '................',
      '................',
      '.....xXXXXx.....',
      '..AAxXXXXXXx....',
      '..AXXXXXXXXXy...',
      '...yxxxxxxxxy...',
      '..SSSShhhhhj....',
      '..SkSSSSzhj.....',
      '..SkSSSSzzj.....',
      '..SSSSSzzz......',
      '...SmSzzz.......',
      '....zzzz........',
    ],
  },
};
HEADS.crew.up = HEADS.hale.up;

// ---------------------------------------------------------------- extras (drawn over body)
export const EXTRAS = {
  terraCape: {
    down: pad(['..vc........cv..', '..vcc......ccv..', '...vc......cv...', '...v........v...'], 11),
    up: pad(['....cCCCCCCc....', '...cCCCcCCCCv...', '...cCCcCCCcCv...', '...vccccccccv...', '....vvvvvvvv....'], 11),
    left: pad(['.......CCcv.....', '.......CCccv....', '.......cCccv....', '........cvvv....'], 11),
  },
  ilseBag: {
    down: pad(['................', '................', '................', '..........XXy...', '..........xxy...'], 11),
    up: pad(['................', '................', '................', '...yXX..........', '...yxx..........'], 11),
    left: pad(['................', '................', '........yXXy....', '........yxxy....', '.........yy.....'], 11),
  },
  ilsePatch: {
    down: pad(['................', '................', '.........A......'], 11),
    up: pad([]),
    left: pad(['................', '................', '.......A........'], 11),
  },
  katarinBaby: {
    down: pad(['................', '................', '.....XXXXX......', '....XxSSXXx.....', '.....xxxxx......'], 11),
    up: pad([]),
    left: pad(['................', '................', '...XXXX.........', '..XSSXXx........', '...xxxx.........'], 11),
  },
};

// ---------------------------------------------------------------- children (16x24, shorter)
const KID_BODY_DOWN = ['.....tTTTt......', '....sTTtTTs.....', '....zuaaaau.....', '.....BBbbn......'];
const KID_BODY_UP = ['.....ttttt......', '....stttttu.....', '....zuaaaau.....', '.....bbbbn......'];
const KID_BODY_LEFT = ['......tTTu......', '......sTtu......', '......aaau......', '......Bbbn......'];
const KID_LEGS = {
  down: [['.....bb.bn......', '.....ff.ff......', '....kff.ffk.....'], ['.....bb.bn......', '.....kf.ff......', '........ffk.....'], ['.....bb.bn......', '.....ff.fk......', '....kff.........']],
  up: [['.....bn.bn......', '.....ff.ff......', '....kff.ffk.....'], ['.....bn.bn......', '.....kf.ff......', '........ffk.....'], ['.....bn.bn......', '.....ff.fk......', '....kff.........']],
  left: [['......bbn.......', '......fff.......', '.....kfff.......'], ['.....bb.n.......', '....ff...f......', '...kff...fk.....'], ['......bbn.......', '.....ff.f.......', '....kff.fk......']],
};
function kidFrames() {
  const out = {};
  const T = { down: KID_BODY_DOWN, up: KID_BODY_UP, left: KID_BODY_LEFT };
  for (const dir of ['down', 'up', 'left']) out[dir] = [0, 1, 2].map((fr) => pad([...T[dir], ...KID_LEGS[dir][fr]], 14));
  return out;
}
BODY.kid = kidFrames();

const KH = { // kid heads occupy rows 5-14
  pigtails: {
    down: ['................', '................', '................', '................', '................',
      '..hh.jhhhhj.hh..', '..hHjhHHhhhjHh..', '..hhjhhhhhhjhh..', '...jhSSSSSShj...', '...jSkSSSkSSj...',
      '...jSkwSSkwSj...', '....zSSmSSSz....', '.....zzzzzz.....', '................', '................'],
    up: ['................', '................', '................', '................', '................',
      '..hh.jhhhhj.hh..', '..hHjhHHhhhjHh..', '..hhjhhhhhhjhh..', '...jhhhhhhhhj...', '...jhhhhhhhhj...',
      '...jjhhhhhhjj...', '....jjhhhhjj....', '.....zzzzzz.....', '................', '................'],
    left: ['................', '................', '................', '................', '................',
      '.....jhhhhj.....', '....hHHhhhhjhh..', '...hHhhhhhhjHh..', '..jSSShhhhhjhh..', '..SkSSShhhj.....',
      '..SkwSzhhjj.....', '...SmSzzjj......', '....zzzz........', '................', '................'],
  },
  cap: {
    down: ['................', '................', '................', '................', '................',
      '.....xXXXXx.....', '....xXXXXXXx....', '...yyyyyyyyyy...', '...jSSSSSSSSj...', '...jSkSSSSkSj...',
      '...jSkSSSSkSj...', '....zSSmmSSz....', '.....zzzzzz.....', '................', '................'],
    up: ['................', '................', '................', '................', '................',
      '.....xXXXXx.....', '....xXXXXXXx....', '...yxxxxxxxxy...', '...jhhhhhhhhj...', '...jhhhhhhhhj...',
      '...jjhhhhhhjj...', '....jjhhhhjj....', '.....zzzzzz.....', '................', '................'],
    left: ['................', '................', '................', '................', '................',
      '.....xXXXXx.....', '....xXXXXXXx....', '.yyyyyyyyyyy....', '..SSSShhhhhj....', '..SkSSShhhj.....',
      '..SkSSSzhjj.....', '...SmSzzjj......', '....zzzz........', '................', '................'],
  },
  bob: {
    down: ['................', '................', '................', '................', '................',
      '.....jhhhhj.....', '....jhHHhhhj....', '...jhHhhhhhhj...', '...jhSSSSSShj...', '...jhkSSSSkhj...',
      '...jhkwSSkwhj...', '...jjSSmSSSjj...', '.....zzzzzz.....', '................', '................'],
    up: ['................', '................', '................', '................', '................',
      '.....jhhhhj.....', '....jhHHhhhj....', '...jhHhhhhhhj...', '...jhhhhhhhhj...', '...jhhhhhhhhj...',
      '...jjhhhhhhjj...', '...jjjhhhhjjj...', '.....zzzzzz.....', '................', '................'],
    left: ['................', '................', '................', '................', '................',
      '.....jhhhhj.....', '....hHHhhhhj....', '...hHhhhhhhhj...', '..jSSShhhhhhj...', '..SkSSShhhhj....',
      '..SkwSzhhhjj....', '...SmSzzjjj.....', '....zzzz........', '................', '................'],
  },
};
for (const k of Object.keys(KH)) for (const d of Object.keys(KH[k])) KH[k][d] = pad(KH[k][d], 0);
export const KID_HEADS = KH;

// ---------------------------------------------------------------- robes (hem to the floor)
const LEGS_ROBE = {
  down: [
    ['....tTTttTTu....', '....tTTttTTu....', '...tTTttttTTu...', '...tTttttttuu...', '....kff..ffk....'],
    ['....tTTttTTu....', '....tTTttTTu....', '...tTTttttTTu...', '...tTtttttttu...', '....kff.........'],
    ['....tTTttTTu....', '....tTTttTTu....', '...tTTttttTTu...', '...uTttttttTu...', '.........ffk....'],
  ],
  up: [
    ['....ttttttu.....', '....tttttttu....', '...ttttttttuu...', '...tttttttttu...', '....kff..ffk....'],
    ['....ttttttu.....', '....tttttttu....', '...ttttttttuu...', '...tttttttttu...', '....kff.........'],
    ['....ttttttu.....', '....tttttttu....', '...ttttttttuu...', '...tttttttttu...', '.........ffk....'],
  ],
  left: [
    ['.....tTttu......', '.....tTtttu.....', '....tTttttu.....', '....tTtttuu.....', '....kfff........'],
    ['.....tTttu......', '.....tTtttu.....', '....tTttttu.....', '....tTttttu.....', '...kfff..f......'],
    ['.....tTttu......', '.....tTtttu.....', '....tTttttu.....', '....tTtttuu.....', '.....kff........'],
  ],
};
BODY.robe = bodyFrames({ down: TORSO_DOWN, up: TORSO_UP, left: TORSO_LEFT }, LEGS_ROBE);

// ---------------------------------------------------------------- more heads ('up' is derived when absent)
Object.assign(HEADS, {
  locke: {
    down: ['................', '................', '.....xXXXXx.....', '....xXXXXXXx....', '...xXXXXXXXXy...', '...yxxxxxxxxy...',
      '...jhSSSSSShj...', '...jSSSSSSSSj...', '...jSkSSSkSSj...', '...jSkSSSkSSj...', '....zSSmSSSz....', '.....zzzzzz.....'],
    left: ['................', '................', '.....xXXXXx.....', '....xXXXXXXxy...', '...xXXXXXXXXxyy.', '...yxxxxxxxxy.y.',
      '..jSSShhhhhjj...', '..SSSSShhhhj....', '..SkSSSShhj.....', '..SkSSSzhjj.....', '...SmSzzjj......', '....zzzz........'],
  },
  longhair: {
    down: ['................', '................', '.....jhhhhj.....', '....jhHHhhhj....', '...jhHhhhhhhj...', '...jhhSSSShhj...',
      '..jhhSSSSSShhj..', '..jhSkSSSSkShj..', '..jhSkSSSSkShj..', '..jhzSSmmSSzhj..', '..jhjzzzzzzjhj..', '..jh........hj..'],
    left: ['................', '................', '.....jhhhhj.....', '....hHHHhhhj....', '...hHhhhhhhhj...', '...hhhhhhhhhhj..',
      '..jSSShhhhhhhj..', '..SSSSShhhhhhj..', '..SkSSShhhhhjj..', '..SSSSzhhhhhj...', '...Smzzjhhhjj...', '....zz..jjjj....'],
  },
  edgar: {
    down: ['................', '................', '.....jhhhhj.....', '....jhHHHhhj....', '...jhHHhhhhhj...', '...jAAAAAAAAj...',
      '...jhSSSSSShj...', '...jSSSSSSSSj...', '...jSkSSSkSSj...', '...jSkSSSkSSj...', '....zSSmSSSz....', '.....zzzzzz.....'],
    left: ['................', '................', '.....jhhhhj.....', '....hHHHhhhj....', '...hHhhhhhhhj...', '..AAAAAAhhhhjj..',
      '..jSSShhhhhjhj..', '..SSSSShhhhjhj..', '..SkSSSShhj.jh..', '..SkSSSzhjj..j..', '...SmSzzjj......', '....zzzz........'],
  },
  sabin: {
    down: ['................', '.....h..h.......', '....hHhhHh.h....', '...hHHhhHHhh....', '...jhHHhhhhhj...', '...jhhhhhhhhj...',
      '...jSSSSSSSSj...', '...SSSSSSSSSS...', '...SSkSSSSkSS...', '...zSSSSSSSSz...', '....zSSmmSSz....', '.....zzzzzz.....'],
    left: ['................', '.....h..h.......', '....hHhhHhh.....', '...hHHhhHHhhj...', '...hhhhhhhhhj...', '..SSSShhhhhj....',
      '..SSSSSShhhjj...', '..SkSSSShhj.jj..', '..SSSSSSzz...j..', '...SSSSzz....j..', '...SmmSz........', '....zzzz........'],
  },
  cyan: {
    down: ['.......jh.......', '.......hj.......', '......jhhj......', '.....jhHHhj.....', '....jhHhhhhj....', '...jhhhhhhhhj...',
      '...jSSSSSSSSj...', '...SSSSSSSSSS...', '...SSkSSSSkSS...', '...zSSSSSSSSz...', '....zjjjjjjz....', '.....zzzzzz.....'],
    left: ['........jh......', '........hj......', '.......jhhj.....', '.....jhHHhhj....', '....hHhhhhhhj...', '...hhhhhhhhhj...',
      '..SSSShhhhhj....', '..SSSSSShhhj....', '..SkSSSSzhj.....', '..SSSSSSzz......', '..jjjSSzz.......', '....zzzz........'],
  },
  hood: { // hood + mouth cloth (Shadow, Hush acolytes)
    down: ['................', '.....xxxxxx.....', '....xXXXXXXx....', '...xXXXXXXXXx...', '...xXxxxxxxXx...', '...xXSSSSSSXx...',
      '...xXkSSSkSXx...', '...xXaaaaaaXx...', '...xXaaaaaaXx...', '...xxaaaaaaxx...', '....xxxxxxxx....', '.....aaaaaa.....'],
    up: ['................', '.....xxxxxx.....', '....xXXXXXXx....', '...xXXXXXXXXx...', '...xXXXXXXXXx...', '...xXXXXXXXXx...',
      '...xXXXXXXXXx...', '...xxXXXXXXxx...', '...xxxxxxxxxx...', '...xxxxxxxxxx...', '....xxxxxxxx....', '.....aaaaaa.....'],
    left: ['................', '.....xxxxxx.....', '....xXXXXXXx....', '...xXXXXXXXXx...', '..xXxxxxxxxXx...', '..xSSSSxxxXXx...',
      '..xkSSSxxXXxx...', '..aaaaaaxXXx....', '..aaaaaaxXx.....', '...aaaaxxx......', '....xxxx.aa.....', '.........aaa....'],
  },
  cowl: { // hood with the face showing (Ostrander, cultists)
    down: ['................', '.....xxxxxx.....', '....xXXXXXXx....', '...xXXXXXXXXx...', '...xXxxxxxxXx...', '...xXSSSSSSXx...',
      '...xXSSSSSSXx...', '...xSkSSSSkSx...', '...xSkSSSSkSx...', '...xzSSmmSSzx...', '....xzzzzzzx....', '.....xxxxxx.....'],
    up: ['................', '.....xxxxxx.....', '....xXXXXXXx....', '...xXXXXXXXXx...', '...xXXXXXXXXx...', '...xXXXXXXXXx...',
      '...xXXXXXXXXx...', '...xxXXXXXXxx...', '...xxxxxxxxxx...', '...xxxxxxxxxx...', '....xxxxxxxx....', '.....xxxxxx.....'],
    left: ['................', '.....xxxxxx.....', '....xXXXXXXx....', '...xXXXXXXXXx...', '..xXxxxxxxxXx...', '..xSSSxxxxXXx...',
      '..SSSSSxxXXxx...', '..SkSSSxXXx.....', '..SkSSzxXx......', '..SmSzzxx.......', '...zzzxx........', '....xxx.........'],
  },
  strago: {
    down: ['.......xy.......', '......xXxy......', '.....xXXxxy.....', '....xXXXxxxy....', '...yyyyyyyyyy...', '...jhSSSSSShj...',
      '...jSkSSSSkSj...', '...hhSSSSSShh...', '...hhhhhhhhhh...', '....hhhhhhhh....', '.....hhhhhh.....', '.......hh.......'],
    up: ['.......xy.......', '......xXxy......', '.....xXXxxy.....', '....xXXXxxxy....', '...yyyyyyyyyy...', '...jhhhhhhhhj...',
      '...jhhhhhhhhj...', '...jjhhhhhhjj...', '....jjhhhhjj....', '.....zzzzzz.....', '................', '................'],
    left: ['........xy......', '.......xXxy.....', '......xXXxxy....', '.....xXXXxxxy...', '..yyyyyyyyyyyy..', '..SSSShhhhhj....',
      '..SkSSShhhj.....', '..hhhSShhj......', '..hhhhhhj.......', '...hhhhj........', '...hhhh.........', '....hh..........'],
  },
  gau: {
    down: ['................', '...h.h..h..h....', '..hHhhHhhHhhh...', '..hHHhhHHhhhhh..', '.hhHhhhhhhhhhh..', '..hhhhhhhhhhh...',
      '..hhSSSSSShhh...', '...hSkSSSkShh...', '...jSkwSSkwSj...', '...jzSSmSSzj....', '....zzzzzzz.....', '................'],
    left: ['................', '....h..h..h.....', '...hHhhHhhHhh...', '..hHHhhHHhhhhh..', '..hhhhhhhhhhhhh.', '..SSShhhhhhhhh..',
      '..SSSShhhhhhh...', '..SkSSShhhjh....', '..SkwSzhhjj.....', '...SmSzzj.......', '....zzzz........', '................'],
  },
  dalia: {
    down: ['................', '................', '.....jhhhhj.....', '....jhHHhhhj....', '...jhHhhhhhhj...', '..jhhhSSSShhhj..',
      '..jhSSSSSSSShj..', '..jhSkSSSSkShj..', '..jhSkwSSkwShj..', '..jhAzSmSSzAhj..', '..jhjzzzzzzjhj..', '...h........h...'],
    left: ['................', '................', '.....jhhhhj.....', '....hHHHhhhj.h..', '...hHhhhhhhhjh..', '...hhhhhhhhhhj..',
      '..jSSShhhhhhhj..', '..SSSSShhhhhhj..', '..SkSSShhhhhjj..', '..SkwAzhhhhhj...', '...Smzzjhhhjj...', '....zz..jjjj.h..'],
  },
  maren: {
    down: ['.......AA.......', '......AAA.......', '.....xXXXXx.....', '....xXXXXXXx....', '...xXXXXXXXXy...', '...yxxxxxxxxy...',
      '...jSSSSSSSSj...', '...SSkSSSSkSS...', '...SSkSSSSkSS...', '...zSSSSSSSSz...', '....zSSmSSSz....', '.....zzzzzz.....'],
    left: ['........AAA.....', '.......AAAAA....', '.....xXXXXx.AA..', '....xXXXXXXx....', '...xXXXXXXXXy...', '...yxxxxxxxxy...',
      '..SSSShhhhhj....', '..SkSSSSzhj.....', '..SkSSSSzzj.....', '..SSSSSzzz......', '...SmSzzz.......', '....zzzz........'],
  },
  gogo: {
    down: ['................', '.....xXXXXx.....', '....xXXAXXXx....', '...xXXXXXaXXy...', '...xXAXXXXXXy...', '...yXXXXXXXXy...',
      '...ykkkkkkkky...', '...yXXXXXXAXy...', '...yxXaXXXXxy...', '...yxxxxXxxxy...', '....yxxxxxxy....', '.....yyyyyy.....'],
    up: ['................', '.....xXXXXx.....', '....xXXAXXXx....', '...xXXXXXaXXy...', '...xXAXXXXXXy...', '...yXXXXXXXXy...',
      '...yXXaXXXXXy...', '...yXXXXXXAXy...', '...yxXaXXXXxy...', '...yxxxxXxxxy...', '....yxxxxxxy....', '.....yyyyyy.....'],
    left: ['................', '.....xXXXXx.....', '....xXXAXXXx....', '...xXXXXXaXXy...', '..xXAXXXXXXXy...', '..yXXXXXXXXXy...',
      '..kkkkkXXXXy....', '..XXXXXXAXy.....', '..xXaXXXXxy.....', '..yxxxxXxxy.....', '...yxxxxxy......', '....yyyyy.......'],
  },
  oldman: {
    down: ['................', '................', '.....SSSSSS.....', '....hSSSSSSh....', '...hhSSSSSShh...', '...hhSSSSSShh...',
      '...hSSSSSSSSh...', '...SSkSSSSkSS...', '...SSkSSSSkSS...', '...zShhhhhhSz...', '....hhhhhhhh....', '.....zzzzzz.....'],
    up: ['................', '................', '.....SSSSSS.....', '....hSSSSSSh....', '...hhSSSSSShh...', '...hhhSSSShhh...',
      '...hhhhhhhhhh...', '...hhhhhhhhhh...', '...jhhhhhhhhj...', '....jjhhhhjj....', '.....zzzzzz.....', '.....zzzzzz.....'],
    left: ['................', '................', '.....SSSSS......', '....SSSSSShh....', '...SSSSSSSShh...', '...SSSSSSShhh...',
      '..SSSSSSShhh....', '..SkSSSSSzh.....', '..SkSSSSzz......', '..hhhhSzz.......', '...hhhzz........', '....zzzz........'],
  },
  bun: {
    down: ['.......hh.......', '......hHhj......', '.....jhhhhj.....', '....jhHHHhhj....', '...jhHHhhhhhj...', '...jhhHhhhhhj...',
      '...jhSSSSShhj...', '...jSSSSSSSSj...', '...jSkSSSkSSj...', '...jSkSSSkSSj...', '....zSSmSSSz....', '.....zzzzzz.....'],
    left: ['........hh......', '.......hHhj.....', '.....jhhhhj.....', '....hHHHhhhj....', '...hHhhhhhhhj...', '...hhhhhhhhhj...',
      '..jSSShhhhhjj...', '..SSSSShhhhj....', '..SkSSSShhj.....', '..SkSSSzhjj.....', '...SmSzzjj......', '....zzzz........'],
  },
  soldier: { // Imperial veteran helmet
    down: ['................', '................', '.....xXXXXx.....', '....xXXXXXXx....', '...xXXXXXXXXy...', '...xxxxxxxxxx...',
      '...xSSSSSSSSx...', '...xSkSSSSkSx...', '...xSkSSSSkSx...', '...xzSSSSSSzx...', '....zSSmmSSz....', '.....zzzzzz.....'],
    left: ['................', '................', '.....xXXXXx.....', '....xXXXXXXx....', '...xXXXXXXXXy...', '..xxxxxxxxxxx...',
      '..SSSSSxxxxx....', '..SkSSSSzxx.....', '..SkSSSSzx......', '..SSSSSzzx......', '...SmSzzz.......', '....zzzz........'],
  },
});
HEADS.ilse.up = HEADS.ilse.up; // keep authored backs
// Kefka's face from Terra's nightmare: white paint, red smile, feathered plume
HEADS.jester = {
  down: ['.....A..A.A.....', '....AxAAxAx.....', '.....xXXXXx.....', '....hXXXXXXh....', '...hhSSSSSShh...', '...hSSSSSSSSh...',
    '...SSkSSSSkSS...', '...SSkSSSSkSS...', '...SSAAAAAASS...', '...zSSAAAASSz...', '....zSSSSSSz....', '.....zzzzzz.....'],
  left: ['......A..A.A....', '.....AxAAxAx....', '.....xXXXXx.....', '....XXXXXXhh....', '...SSSSSSShhh...', '..SSSSSSSShhh...',
    '..SkSSSSShhh....', '..SkSSSSzhh.....', '..AAAASSzh......', '..SAASSzz.......', '...SSSzz........', '....zzzz........'],
};

Object.assign(KID_HEADS, {
  beret: {
    down: ['................', '................', '................', '................', '.....xXXXXXx....',
      '...xXXXXXXXXx...', '...yxxxxxxxxyy..', '...jhhSSSShhj...', '...jSkSSSkSSj...', '...jSkwSSkwSj...',
      '....zSSmSSSz....', '.....zzzzzz.....', '................', '................', '................'],
    up: ['................', '................', '................', '................', '.....xXXXXXx....',
      '...xXXXXXXXXx...', '...yxxxxxxxxyy..', '...jhhhhhhhhj...', '...jhhhhhhhhj...', '...jjhhhhhhjj...',
      '....jjhhhhjj....', '.....zzzzzz.....', '................', '................', '................'],
    left: ['................', '................', '................', '................', '....xXXXXXx.....',
      '..xXXXXXXXXXx...', '.yyxxxxxxxxy....', '..jSSShhhhhj....', '..SkSSShhhj.....', '..SkwSzhhjj.....',
      '...SmSzzjj......', '....zzzz........', '................', '................', '................'],
  },
});
