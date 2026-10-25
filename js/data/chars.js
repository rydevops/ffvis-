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
