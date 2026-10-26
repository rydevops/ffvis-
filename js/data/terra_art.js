// Terra, hand-drawn. Field frames are 16x24; the outline is part of the art (#18141F) rather
// than generated, the way 16-bit sprites were made. Letters index PAL.
//
//   hair   a cream highlight · b light sage · c sage · d mid · e dark · f deepest strand line
//   skin   s highlight · t base · u shade · v deep shade (cheek, mouth, chin)
//   violet p light · q mid · r dark · w deepest        pink band  m / n
//   dress  A highlight · B base · C shade · D deepest   gold  G / F / E
//   eyes   k dark · l iris · i glint        O outline
//
// Each facing has a standing pose; the two walking poses are derived from it in code (the body
// drops a row, one boot lifts), so the cycle stays consistent when the stand art is touched up.
export const PAL = {
  O: '#18141F',
  a: '#F8F8D0', b: '#BDDBB0', c: '#8EB696', d: '#628F78', e: '#3D6052', f: '#243F37',
  s: '#FFEFD0', t: '#F7C597', u: '#DB8C66', v: '#A9503E',
  p: '#E2AEFF', q: '#B27AEE', r: '#7F4FC0', w: '#4B2E8A',
  m: '#F27BD0', n: '#B24C9E',
  A: '#E94A30', B: '#B8141C', C: '#860A18', D: '#520812',
  G: '#F6D860', F: '#CB9A22', E: '#7F5C14',
  k: '#18142A', l: '#2F7A66', i: '#FFFFFF',
};

//                 0123456789ABCDEF
const STAND = {
  down: [
    '....OOOOOOOO....', // 0
    '...OabbbcbpqO...', // 1  violet ribbon at the crown
    '.OabbbcbcccdqrO.', // 2
    'ObcacbcccdcddeeO', // 3
    '.OabcbcccbcdeeO.', // 4
    'ObbcfcbcdfcddeeO', // 5  bangs, with tufts at the temples
    '.OcfcdtsttdcdeO.', // 6
    '.OcbdtsttttdfeO.', // 7
    '.OcbtkkttkktdeO.', // 8  eyes
    '.OcbtlittiltdeO.', // 9
    '.OdcuttttttudeO.', // 10
    '.OdbtttvvtttefO.', // 11
    'OpqOeuttttueOqpO', // 12 chin, shoulder guards begin
    'OprqOrrqqrrOqrpO', // 13 collar
    'OwrOBAAABBCCOrwO', // 14
    'OstOBAAmmBCCOtuO', // 15 bare arms
    'OttOGGGGGGGFOuuO', // 16 gold belt
    'OtuOBBBABBCCOuvO', // 17 hands
    '..OBABBBBBBCCO..', // 18 skirt
    '..OCBGBBBBGBDO..', // 19 hem with gold studs
    '...OBBGBBGBCO...', // 20
    '....OBCOOCBO....', // 21
    '...OGGFOOFGGO...', // 22 boots
    '...OFFEOOEFFO...', // 23
  ],
  up: [
    '....OOOOOOOO....', // 0
    '...OcbbqqbcdO...', // 1  ribbon bow
    '..ObbqpOOpqcdO..', // 2
    '.ObcbcbqqbcddeO.', // 3
    '.OabcdbbcbcddeO.', // 4
    '.OabccbcccbddeO.', // 5
    '.ObcbbbaaccddeO.', // 6  cream stripe down the hair
    '.ObcbbcaabccdeO.', // 7
    '..OcbbcaabcddO..', // 8
    '...OcbcaabcdO...', // 9
    'OppqObcaabdOqppO', // 10 shoulder guards
    'OprqOcdaabdOqrpO', // 11
    '.OwrOddaabdOrwO.', // 12
    '..OsOeddbdeOsO..', // 13
    'OtuOCrrrrrrCOuvO', // 14
    'OttOBBBBBBBCOuuO', // 15
    'OtuOnnnmmnnnOuvO', // 16
    'OuvOBBABBBBCOuvO', // 17
    '..OBABBBBBBCCO..', // 18
    '..OCBGBBBBGBDO..', // 19
    '...OBBGBBGBCO...', // 20
    '....OBCOOCBO....', // 21
    '...OGGFOOFGGO...', // 22
    '...OFFEOOEFFO...', // 23
  ],
  left: [
    '....OOOOOOOO....', // 0
    '...ObbcbbcbpqO..', // 1  ribbon, back of the crown
    '..ObabbcbcccdqrO', // 2
    '.OtbabcbcdcdddeO', // 3  forehead tip, bangs sweep across
    '.OtsfbcabcdcddeO', // 4
    '.OtkfdcbcddcOdeO', // 5  eye (tall); the ponytail separates at the back
    '.OtkcddfcddcOeeO', // 6
    '.OtkicdddcddOeeO', // 7  glint
    '.OtkcdddcddeOdeO', // 8
    'OtttdddfcdddOeO.', // 9  nose
    'OuttudddcddeOO..', // 10 mouth
    '.OvtuOdddeedO...', // 11 chin
    '..OuuOeddeeO....', // 12 neck
    '..OtOrqpOdeO....', // 13 shoulder guard
    '.OstOrBBBBCO....', // 14
    '.OttOBAABBCO....', // 15
    '.OtuOGGGGGFO....', // 16 gold belt
    '.OuvOBABBBCO....', // 17
    '...OBBABBBCCO...', // 18
    '...OCBGBBGBDO...', // 19
    '....OBBGBBCO....', // 20
    '....OBBCOBBO....', // 21
    '...OGGFEOGGFEO..', // 22
    '...OFFEEOFFEEO..', // 23
  ],
};

const BLANK = '................';

// Walking poses. The whole figure drops one row (rows 0-18 become 1-19), the hem row is kept,
// and the legs are redrawn: one boot planted, the other lifted.
const STEP_LEGS = {
  down: {
    hem: '..OCBGBBBBGBDO..',
    a: ['....OBCOOCBO....', '...OGGFOOFGGO...', '...OFFEOOOOO....'],
    b: ['....OBCOOCBO....', '...OGGFOOFGGO...', '....OOOOOEFFO...'],
  },
  up: {
    hem: '..OCBGBBBBGBDO..',
    a: ['....OBCOOCBO....', '...OGGFOOFGGO...', '...OFFEOOOOO....'],
    b: ['....OBCOOCBO....', '...OGGFOOFGGO...', '....OOOOOEFFO...'],
  },
  left: {
    hem: '...OCBGBBGBDO...',
    a: ['..OBBCO..OBBCO..', '..OGFEO..OGFEO..', '..OFEEO..OFEEO..'],
    b: ['....OBBCOBBO....', '....OGFEOGFO....', '....OFEEOFEO....'],
  },
};

function stepFrame(dir, which) {
  const s = STAND[dir];
  const L = STEP_LEGS[dir];
  return [BLANK, ...s.slice(0, 19), L.hem, ...L[which]];
}

export const FIELD = {};
for (const dir of ['down', 'up', 'left']) FIELD[dir] = [STAND[dir], stepFrame(dir, 'a'), stepFrame(dir, 'b')];

// Battle parts (left-facing, 16 wide). The sprite builder composes poses from these: the body is
// rows 0-19 of the left-facing stand; arms and the sword are drawn on top at each pose's angles.
export const BATTLE_PARTS = {
  body: STAND.left.slice(0, 20),
  legs: {
    stand: STAND.left.slice(20),
    lunge: [
      '...OBBCO..OBBCO.',
      '..OBBCO....OBBO.',
      '.OGGFEO.....OGGF',
      '.OFFEEO.....OFFE',
    ],
  },
  // kneeling: head, shoulders and belt (rows 0-15 of the body) over a spread skirt and one folded leg
  kneel: [
    '...OBBABBBBCCO..',
    '..OCBGBBGBBBBCO.',
    '..OGFEOBBBBBCDO.',
    '..OFEEOOGFEEEO..',
  ],
};

// Palette swaps for story forms (same drawing, different colours).
const swap = (m) => ({ ...PAL, ...m });
export const FORMS = {
  terra: PAL,
  // the first flicker of Trance: the same Terra, skin and hair washed with pink light
  terraGlow: swap({ s: '#FFF4F8', t: '#FBD0E0', u: '#E898C0', v: '#B8548C', a: '#FFFFFF', b: '#F8D8F0' }),
  // Trance proper: hair and clothes turn rose and white-violet
  terraEsper: swap({
    a: '#FFF4FF', b: '#FAC8EC', c: '#F08CD0', d: '#C860B0', e: '#8E3C8A', f: '#5E2468',
    s: '#FFFFFF', t: '#FFE6F4', u: '#F4B0D8', v: '#B8548C',
    A: '#FFFFFF', B: '#E8D0FF', C: '#B890F0', D: '#7650B8', m: '#FFB8F0', n: '#E070C8',
    G: '#FFF4A0', F: '#F0C860', E: '#B08830',
  }),
};
