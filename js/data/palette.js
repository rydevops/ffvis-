// Master palette ramps (Pixel Art Rendering Guide → "Master palette ramps").
// Every ramp is 5 steps: highlight, light, base, shadow, deep. Hue shifts warm/yellow in
// the highlights and cool/violet in the shadows; nothing darkens by adding black.

export const OUTLINE = '#140C14'; // universal deep outline; pure #000 is never used

export const R = {
  skinLight: ['#FCE0C4', '#F2BE96', '#D9956C', '#A8664A', '#6B3A2E'],
  skinDeep: ['#D9A070', '#B07848', '#8A5634', '#5E3622', '#3A2016'],
  iron: ['#9AA0A8', '#6E747E', '#4C5058', '#33363C', '#1E2024'],
  leather: ['#E0B07C', '#B8824E', '#8C5A34', '#603C26', '#3A2418'],
  stone: ['#FFFDF5', '#E8E2D0', '#C4BCA6', '#9A927E', '#6E6858'],
  brass: ['#F5D68A', '#D4A84E', '#A87C34', '#7A5426', '#4A3018'],
  glass: ['#F0FFFC', '#B8F4E8', '#6CD8C8', '#2EA8A0', '#146A6A'],
  folRuin: ['#A69A5C', '#857A44', '#635A34', '#453E26', '#2B2619'],
  folRest: ['#B8E070', '#78C050', '#3E9A48', '#22703E', '#124430'],
  folSilent: ['#E6FFE8', '#A8F0B4', '#6CD08A', '#3AA070', '#1A6A58'],
  skyRuin: ['#E8A070', '#C06048', '#8A3A3C', '#5A2434', '#2E1424'],
  skyRest: ['#E8F4FF', '#A8D4F8', '#68A8E8', '#3878C8', '#1C4888'],
  seaRuin: ['#B4AE94', '#8A8670', '#64604E', '#44403A', '#2A2826'],
  seaRest: ['#D0F4FF', '#7CCCEC', '#3896CC', '#1E62A0', '#103868'],
  spirit: ['#FFE8F8', '#F8A8E0', '#E060C0', '#A0309C', '#581C6C'],

  // Character ramps. Authored to the same 5-step hue-shift rule so they sit in the
  // master palette's family (art-lead extension of the master ramps).
  hairGreen: ['#D8F8A8', '#8CD878', '#4CA860', '#2C7450', '#164034'], // PC-01 Terra
  tunicRed: ['#FFB898', '#E8684C', '#B8343C', '#7C1E38', '#481028'],
  ashBlonde: ['#FAF0CC', '#DCCFA2', '#B4A67E', '#827862', '#504A40'], // PC-15 Ilse
  coatDrab: ['#BEB48C', '#968E6C', '#706A52', '#4C4A3E', '#2E2C2A'],
  imperial: ['#E8B0A0', '#C07068', '#904448', '#602A38', '#381828'],
  brownHair: ['#D8A878', '#A87448', '#7C4E30', '#523022', '#301C18'],
  farmBlue: ['#B8D0E8', '#7C9CC8', '#52709C', '#384C74', '#20284A'],
  cream: ['#FFF8E8', '#EADFC4', '#C8B898', '#968670', '#5E5446'],
  plum: ['#E8B8D8', '#B87CA8', '#86507C', '#5A3058', '#341C38'],
  moss: ['#D0D8A0', '#A0AC70', '#727E4C', '#4C5636', '#2C3222'],
  night: ['#8890C8', '#5860A0', '#383C78', '#24244E', '#140C24'],
};

// Element palettes (core → edge), from "VFX: magic and abilities → Elements".
export const EL = {
  fire: ['#FFF8D0', '#FFC040', '#F06020', '#8A2018'],
  ice: ['#FFFFFF', '#C8F0FF', '#70B8F0', '#2C5898'],
  bolt: ['#FFFFFF', '#FFF890', '#B0A8FF', '#4038A0'],
  water: ['#E8FCFF', '#80D8F8', '#3090D0', '#185088'],
  wind: ['#FFFFFF', '#D0F8D8', '#80D0A0', '#3A8060'],
  earth: ['#F0DCA8', '#C8A060', '#8A6438', '#503820'],
  holy: ['#FFFFFF', '#FFF4C0', '#F8D870', '#C09838'],
  void: ['#C8B0E8', '#7050A8', '#38245C', '#140C14'],
  bio: ['#F0FFB0', '#B8E048', '#6C9830', '#384C1C'],
  spirit: ['#FFE8F8', '#F8A8E0', '#E060C0', '#A0309C'],
};

// Lookup: any ramp colour -> the deep (step 5) of its ramp. Used by auto-outliners so
// field-sprite outlines use the deep step of the adjacent ramp, as the guide requires.
export const DEEP_OF = {};
export const SHADOW_OF = {};
for (const ramp of Object.values(R)) {
  ramp.forEach((c, i) => {
    DEEP_OF[c.toUpperCase()] = ramp[4];
    SHADOW_OF[c.toUpperCase()] = ramp[Math.min(4, i + 1)];
  });
}

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r, g, b) {
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase();
}

export function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(
    Math.round(A[0] + (B[0] - A[0]) * t),
    Math.round(A[1] + (B[1] - A[1]) * t),
    Math.round(A[2] + (B[2] - A[2]) * t));
}

// UI window colours (navy-violet glass, stone frame).
export const UI = {
  winTop: '#2C2E68',
  winBot: '#14143A',
  winDither: '#22245A',
  frameLight: '#E8E2D0',
  frameMid: '#9A927E',
  frameDark: '#140C14',
  text: '#FFFDF5',
  textDim: '#9A927E',
  textShadow: '#140C14',
  gold: '#F5D68A',
  hp: '#78C050',
  hpLow: '#E8684C',
  atb: '#6CD8C8',
  atbFull: '#F5D68A',
  name: '#B8F4E8',
  pink: '#F8A8E0',
};
