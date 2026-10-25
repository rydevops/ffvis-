// Original score. Notation (see core/audio.js): NOTE+octave:duration in 16th-note steps,
// [chords], r = rest, (group)*N = repeat. Drum letters: k kick, s snare, h hat, o open hat,
// m shaker, c crash, t timpani (D), T tom, R timpani roll.
//
// Leitmotifs
//   * "Requiem for Ruin" (main theme) — D minor, rising sixth A→D→F, falls home to D.
//   * SOLACE's lullaby — A minor, 3/4, music box. Seven hums a broken version; the
//     vault quotes its first four notes and stops.
//   * Mobliz — F major pastoral; the same tune slows to piano at night.

const j = (...parts) => parts.join(' ');

// ---------------------------------------------------------------- SOLACE's lullaby (3/4)
const LULL_MEL = j(
  'E5:4 A5:4 B5:4 | C6:6 B5:2 A5:4 | G5:4 E5:4 D5:4 | E5:12',
  'E5:4 A5:4 B5:4 | C6:6 D6:2 E6:4 | D6:4 C6:4 B5:4 | A5:12',
  'C6:4 B5:4 A5:4 | G5:6 A5:2 B5:4 | A5:4 G5:4 E5:4 | D5:12',
  'E5:4 A5:4 C6:4 | B5:6 G#5:2 E5:4 | A5:4 B5:4 G#5:4 | A5:12',
);
const ARP = {
  Am: 'A2:2 E3 A3 C4 A3 E3', F: 'F2:2 C3 F3 A3 F3 C3', C: 'C3:2 G3 C4 E4 C4 G3',
  E: 'E2:2 B2 E3 G#3 E3 B2', G: 'G2:2 D3 G3 B3 G3 D3', Em: 'E2:2 B2 E3 G3 E3 B2',
  Dm: 'D2:2 A2 D3 F3 D3 A2', FE: 'F2:2 C3 F3 A3 E3 G#3',
};
const LULL_ARP = j(ARP.Am, ARP.F, ARP.C, ARP.E, ARP.Am, ARP.C, ARP.G, ARP.Am,
  ARP.F, ARP.Em, ARP.Am, ARP.Dm, ARP.Am, ARP.E, ARP.FE, ARP.Am);
const LULL_PAD = j('[A3,C4,E4]:12 [A3,C4,F4]:12 [G3,C4,E4]:12 [G#3,B3,E4]:12',
  '[A3,C4,E4]:12 [G3,C4,E4]:12 [G3,B3,D4]:12 [A3,C4,E4]:12',
  '[A3,C4,F4]:12 [G3,B3,E4]:12 [A3,C4,E4]:12 [A3,D4,F4]:12',
  '[A3,C4,E4]:12 [G#3,B3,E4]:12 [A3,C4,F4]:8 [G#3,B3,E4]:4 [A3,C4,E4]:12');
// Seven's broken hum: same tune, notes missing, held too long
const SEVEN_MEL = j(
  'E5:4 A5:4 B5:4 | C6:6 r:2 A5:4 | G5:4 r:8 | E5:12',
  'E5:4 A5:4 r:4 | C6:6 D6:2 r:4 | D6:4 C6:8 | r:12',
);

// ---------------------------------------------------------------- Requiem for Ruin (D minor)
const REQ_A = j(
  'A4:6 D5:2 F5:4 E5:4 | D5:4 C5:4 A4:8 | Bb4:6 C5:2 D5:4 F5:4 | E5:16',
  'A4:6 D5:2 F5:4 G5:4 | A5:6 G5:2 F5:4 E5:4 | D5:4 E5:4 F5:4 C#5:4 | D5:16',
);
const REQ_B = j(
  'F5:4 G5:4 A5:8 | Bb5:4 A5:4 G5:8 | F5:4 E5:4 D5:4 F5:4 | E5:16',
  'F5:4 G5:4 A5:8 | D6:6 C6:2 Bb5:4 A5:4 | G5:4 A5:4 E5:4 C#5:4 | D5:16',
);
const RH = {
  Dm: 'D3:2 A3 D4 F4 A4 F4 D4 A3', F: 'F2:2 C3 F3 A3 C4 A3 F3 C3', Bb: 'Bb2:2 F3 Bb3 D4 F4 D4 Bb3 F3',
  A: 'A2:2 E3 A3 C#4 E4 C#4 A3 E3', GmA: 'G2:2 D3 G3 Bb3 A2 E3 A3 C#4', DmBb: 'D3:2 A3 D4 F4 Bb2 F3 Bb3 D4',
  Gm: 'G2:2 D3 G3 Bb3 D4 Bb3 G3 D3',
};
const REQ_HARP = j(RH.Dm, RH.F, RH.Bb, RH.A, RH.Dm, RH.F, RH.GmA, RH.Dm,
  RH.F, RH.Gm, RH.DmBb, RH.A, RH.F, RH.Bb, RH.GmA, RH.Dm);
const REQ_STR = j(
  '[D3,F3,A3]:16 [C3,F3,A3]:16 [D3,F3,Bb3]:16 [C#3,E3,A3]:16',
  '[D3,F3,A3]:16 [C3,F3,A3]:16 [D3,G3,Bb3]:8 [C#3,E3,G3]:8 [D3,F3,A3]:16',
  '[C3,F3,A3]:16 [D3,G3,Bb3]:16 [D3,F3,A3]:8 [D3,F3,Bb3]:8 [C#3,E3,A3]:16',
  '[C3,F3,A3]:16 [D3,F3,Bb3]:16 [D3,G3,Bb3]:8 [C#3,E3,G3]:8 [D3,F3,A3]:16',
);
const REQ_BASS = j('D2:16 F2:16 Bb1:16 A1:16 D2:16 F2:16 G1:8 A1:8 D2:16',
  'F2:16 G2:16 D2:8 Bb1:8 A1:16 F2:16 Bb1:16 G1:8 A1:8 D2:16');

// ---------------------------------------------------------------- Battle (E minor)
const B8 = {
  Em: 'E2:2 E2 E3 E2 D3 E2 B2 E2', D: 'D2:2 D2 D3 D2 C3 D2 A2 D2', C: 'C2:2 C2 C3 C2 B2 C2 G2 C2',
  B: 'B1:2 B1 B2 B1 A2 B1 F#2 B1', G: 'G2:2 G2 G3 G2 F#3 G2 D3 G2', Am: 'A1:2 A1 A2 A1 G2 A1 E2 A1',
  AmB: 'A1:2 A2 A1 E2 B1 B2 B1 F#2',
};
const BAT_BASS = j(B8.Em, B8.D, B8.C, B8.B, B8.Em, B8.C, B8.AmB, B8.Em,
  B8.G, B8.D, B8.C, B8.B, B8.G, B8.Am, B8.AmB, B8.Em);
const BAT_MEL = j(
  'E5:3 E5:3 G5:2 F#5:4 E5:4 | D5:3 E5:3 F#5:2 B4:8 | C5:3 D5:3 E5:2 G5:4 F#5:4 | E5:4 D#5:4 B4:8',
  'E5:3 E5:3 G5:2 A5:4 B5:4 | C6:3 B5:3 A5:2 G5:8 | A5:3 G5:3 F#5:2 E5:4 D#5:4 | E5:16',
  'B5:4 A5:2 G5:2 A5:8 | G5:4 F#5:2 E5:2 F#5:8 | E5:4 D5:2 C5:2 D5:4 E5:4 | B4:16',
  'B5:4 A5:2 G5:2 A5:4 B5:4 | C6:4 B5:2 A5:2 B5:8 | A5:4 G5:4 F#5:4 D#5:4 | E5:16',
);
const CH = {
  Em: '[E4,G4,B4]', D: '[D4,F#4,A4]', C: '[C4,E4,G4]', B: '[B3,D#4,F#4]', Am: '[A3,C4,E4]', G: '[G3,B3,D4]',
};
const stab = (c) => `${c}:2 r:4 ${c}:2 r:2 ${c}:2 r:4`;
const BAT_STR = j(stab(CH.Em), stab(CH.D), stab(CH.C), stab(CH.B), stab(CH.Em), stab(CH.C), `${CH.Am}:8 ${CH.B}:8`, stab(CH.Em),
  stab(CH.G), stab(CH.D), stab(CH.C), stab(CH.B), stab(CH.G), stab(CH.Am), `${CH.Am}:8 ${CH.B}:8`, stab(CH.Em));
const BAT_DRUM = j('(c+k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2 (k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2)*6 k:2 h:2 s:2 s:1 s:1 k:2 s:2 s:2 s:2)*2');

// ---------------------------------------------------------------- Boss (D minor)
const O16 = (a, b, c, d) => `(${a}:1 ${a} ${b} ${a} ${c} ${a} ${d} ${a})*2`;
const BO = {
  Dm: O16('D2', 'D3', 'A2', 'C3'), Bb: O16('Bb1', 'Bb2', 'F2', 'A2'), A: O16('A1', 'A2', 'E2', 'G2'),
  Gm: O16('G1', 'G2', 'D2', 'F2'), C: O16('C2', 'C3', 'G2', 'Bb2'),
};
const BOSS_BASS = j(BO.Dm, BO.Dm, BO.Bb, BO.A, BO.Dm, BO.Gm, BO.A, BO.A,
  BO.Bb, BO.C, BO.Dm, BO.Dm, BO.Gm, BO.A, BO.Dm, BO.A);
const BOSS_MEL = j(
  'D5:8 A4:4 D5:4 | F5:6 E5:2 D5:4 C5:4 | Bb4:8 C5:4 D5:4 | A4:16',
  'D5:8 A4:4 D5:4 | G5:6 F5:2 E5:4 D5:4 | C#5:4 D5:4 E5:4 F5:4 | E5:8 A5:8',
  'Bb5:8 A5:4 G5:4 | A5:6 G5:2 F5:4 E5:4 | F5:8 E5:4 D5:4 | A5:16',
  'G5:6 F5:2 E5:4 D5:4 | E5:6 F5:2 G5:4 A5:4 | D6:8 C6:4 A5:4 | A5:16',
);
const BC = { Dm: '[D4,F4,A4]:16', Bb: '[D4,F4,Bb4]:16', A: '[C#4,E4,A4]:16', Gm: '[D4,G4,Bb4]:16', C: '[C4,E4,G4]:16' };
const BOSS_CHOIR = j(BC.Dm, BC.Dm, BC.Bb, BC.A, BC.Dm, BC.Gm, BC.A, BC.A, BC.Bb, BC.C, BC.Dm, BC.Dm, BC.Gm, BC.A, BC.Dm, BC.A);
const BOSS_DRUM = j('((k+t:4 s:4 k:2 k:2 s:4)*3 k+t:2 s:1 s:1 s:2 s:2 s:2 s:1 s:1 s:2 s:2)*4');

// ---------------------------------------------------------------- Mobliz (F major)
const MOB_MEL = j(
  'C5:4 F5:4 A5:6 G5:2 | F5:4 E5:4 D5:8 | Bb4:4 D5:4 F5:6 E5:2 | C5:16',
  'C5:4 F5:4 A5:6 Bb5:2 | C6:4 A5:4 F5:8 | G5:4 A5:4 Bb5:4 E5:4 | F5:16',
  'A5:4 Bb5:4 C6:8 | Bb5:4 A5:4 G5:8 | F5:4 G5:4 A5:4 F5:4 | E5:8 C5:8',
  'D5:4 E5:4 F5:4 D5:4 | C5:4 F5:4 A5:8 | G5:6 F5:2 E5:4 G5:4 | F5:16',
);
const MA = {
  F: 'F2:2 C3 F3 A3 C4 A3 F3 C3', Dm: 'D2:2 A2 D3 F3 A3 F3 D3 A2', Bb: 'Bb1:2 F2 Bb2 D3 F3 D3 Bb2 F2',
  C: 'C2:2 G2 C3 E3 G3 E3 C3 G2', FA: 'A2:2 C3 F3 A3 C4 A3 F3 C3', GmC: 'G2:2 D3 G3 Bb3 C3 G3 C4 E4',
  Gm: 'G2:2 D3 G3 Bb3 D4 Bb3 G3 D3', C7: 'C2:2 G2 Bb2 E3 G3 E3 Bb2 G2',
};
const MOB_ARP = j(MA.F, MA.Dm, MA.Bb, MA.C, MA.F, MA.FA, MA.GmC, MA.F,
  MA.F, MA.Gm, MA.Dm, MA.C, MA.Bb, MA.F, MA.C7, MA.F);
const MOB_PAD = j('[A3,C4,F4]:16 [A3,D4,F4]:16 [Bb3,D4,F4]:16 [G3,C4,E4]:16',
  '[A3,C4,F4]:16 [A3,C4,F4]:16 [Bb3,D4,G4]:8 [Bb3,C4,E4]:8 [A3,C4,F4]:16',
  '[A3,C4,F4]:16 [Bb3,D4,G4]:16 [A3,D4,F4]:16 [G3,C4,E4]:16',
  '[Bb3,D4,F4]:16 [A3,C4,F4]:16 [Bb3,C4,E4]:16 [A3,C4,F4]:16');
const MOB_SHAKE = '(r:2 m:2 r:2 m:2 r:2 m:2 r:2 m:1 m:1)*16';

// ---------------------------------------------------------------- Victory
const VIC_FAN = 'G4:2 C5:2 E5:2 G5:6 r:2 F5:2 E5:2 F5:2 G5:4 A5:2 G5:2 C6:12 r:8';
const VIC_FAN_STR = '[C4,E4,G4]:16 [F4,A4,C5]:8 [G4,B4,D5]:8 [E4,G4,C5]:16';
const VIC_FAN_DR = 'c+k:2 r:6 s:2 s:2 s:4 k:4 s:4 k:4 c+k:4 r:4 r:12';
const VIC_MEL = j('E5:4 G5:4 C6:8 | B5:4 A5:4 G5:8 | A5:4 F5:4 D5:4 F5:4 | E5:16',
  'E5:4 G5:4 C6:8 | D6:4 C6:4 B5:4 A5:4 | G5:4 F5:4 D5:4 B4:4 | C5:16');
const VIC_ARP = j('C3:2 G3 C4 E4 G4 E4 C4 G3', 'G2:2 D3 G3 B3 D4 B3 G3 D3', 'D3:2 A3 D4 F4 A3 F3 D3 A2', 'C3:2 G3 C4 E4 G4 E4 C4 G3',
  'C3:2 G3 C4 E4 G4 E4 C4 G3', 'G2:2 D3 G3 B3 D4 B3 G3 D3', 'G2:2 D3 F3 B3 D4 B3 F3 D3', 'C3:2 G3 C4 E4 G4 C5:6');


// ---------------------------------------------------------------- more themes
const bars = (...b) => b.join(' ');
const R8 = (a, b) => `${a}:2 ${b} ${a} ${b} ${a} ${b} ${a} ${b}`; // root-fifth eighths
const OTHER = {
  falcon: { // Setzer's airship: open sky, C major, brass over driving drums
    bpm: 144, vol: 0.85,
    tracks: [
      { i: 'brass', v: 0.45, n: bars('G4:2 C5 E5 G5:4 E5:2 F5 G5', 'A5:4 G5:2 F5 E5:4 C5', 'D5:2 E5 F5 A5:4 G5:2 F5 E5', 'D5:16',
        'G4:2 C5 E5 G5:4 E5:2 F5 G5', 'A5:4 Bb5:2 A5 G5:4 E5', 'F5:2 E5 D5 F5:4 E5:2 D5 B4', 'C5:16') },
      { i: 'bass', v: 0.5, n: bars(R8('C2', 'G2'), R8('F2', 'C3'), 'D2:2 A2 D2 A2 G2 D3 G2 D3', R8('G2', 'D3'), R8('C2', 'G2'), R8('F2', 'C3'), 'D2:2 A2 D2 A2 G2 D3 G2 F2', R8('C2', 'G2')) },
      { i: 'strings', v: 0.3, n: '[E4,G4,C5]:16 [F4,A4,C5]:16 [F4,A4,D5]:8 [G4,B4,D5]:8 [G4,B4,D5]:16 [E4,G4,C5]:16 [F4,A4,C5]:16 [F4,A4,D5]:8 [F4,G4,B4]:8 [E4,G4,C5]:16' },
      { i: 'drums', v: 0.5, n: '(c+k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 (k:2 h:2 s:2 h:2 k:2 k:2 s:2 o:2)*3)*2' },
    ],
  },
  narshe: { // snow on the mine town: glass bells over a soft pad, E minor
    bpm: 84, vol: 0.85,
    tracks: [
      { i: 'glass', v: 0.4, n: bars('B4:4 E5 G5 F#5', 'E5:8 B4', 'C5:4 E5 A5 G5', 'F#5:16', 'B4:4 E5 G5 B5', 'A5:4 G5 F#5:8', 'E5:4 F#5 G5 D#5', 'E5:16') },
      { i: 'pad', v: 0.3, n: '[E3,G3,B3]:32 [A2,C3,E3]:16 [B2,D#3,F#3]:16 [E3,G3,B3]:16 [D3,F#3,A3]:16 [C3,E3,G3]:8 [B2,D#3,F#3]:8 [E3,G3,B3]:16' },
      { i: 'pizz', v: 0.3, n: '(E2:8 B2:8)*2 A2:8 E3:8 B1:8 F#2:8 (E2:8 B2:8) D2:8 A2:8 C2:8 B1:8 E2:16' },
    ],
  },
  figaro: { // the desert castle: a proud march in Bb
    bpm: 112, vol: 0.85,
    tracks: [
      { i: 'brass', v: 0.45, n: bars('Bb4:4 D5 F5:6 Eb5:2', 'D5:4 C5 Bb4:8', 'Eb5:4 G5 Bb5:6 A5:2', 'G5:4 F5 F5:8', 'Bb4:4 D5 F5:6 Bb5:2', 'A5:4 G5 F5:8', 'Eb5:4 D5 C5 A4', 'Bb4:16') },
      { i: 'bass', v: 0.5, n: 'Bb1:8 F2:8 Bb1:8 F2:8 Eb2:8 Bb2:8 F2:8 C2:8 Bb1:8 F2:8 F2:8 C2:8 Eb2:8 F2:8 Bb1:16' },
      { i: 'strings', v: 0.3, n: '[D4,F4,Bb4]:16 [D4,F4,Bb4]:16 [Eb4,G4,Bb4]:16 [C4,F4,A4]:16 [D4,F4,Bb4]:16 [C4,F4,A4]:16 [Eb4,G4,C5]:8 [C4,F4,A4]:8 [D4,F4,Bb4]:16' },
      { i: 'drums', v: 0.5, n: '(k:4 s:2 s:2 k:4 s:4)*7 k:2 s:1 s:1 s:2 s:2 s:2 s:2 s:2 s:2' },
    ],
  },
  hush: { // the cult: an organ chorale that never resolves, C minor
    bpm: 60, vol: 0.85,
    tracks: [
      { i: 'organ', v: 0.35, n: '[C3,Eb3,G3]:16 [Ab2,C3,Eb3]:16 [F2,Ab2,C3]:16 [G2,B2,D3]:16 [C3,Eb3,G3]:16 [Bb2,D3,F3]:16 [Ab2,C3,F3]:16 [G2,B2,F3]:16' },
      { i: 'choir', v: 0.35, n: 'G4:16 Ab4:16 F4:16 G4:16 Eb4:16 F4:16 C4:16 D4:16' },
      { i: 'drums', v: 0.35, n: '(k:2 k:14 r:16)*4' },
    ],
  },
  thamasa: { // the village of murals: flute and harp, D dorian
    bpm: 84, vol: 0.85,
    tracks: [
      { i: 'flute', v: 0.48, n: bars('D5:4 F5 A5 G5', 'F5:4 E5 D5:8', 'C5:4 E5 G5 F5', 'E5:16', 'D5:4 F5 A5 C6', 'B5:4 A5 G5:8', 'A5:4 G5 F5 E5', 'D5:16') },
      { i: 'harp', v: 0.3, pan: 0.2, n: bars('D3:2 A3 D4 F4 A4 F4 D4 A3', 'D3:2 A3 D4 F4 A4 F4 D4 A3', 'C3:2 G3 C4 E4 G4 E4 C4 G3', 'A2:2 E3 A3 C4 E4 C4 A3 E3', 'D3:2 A3 D4 F4 A4 F4 D4 A3', 'G2:2 D3 G3 B3 D4 B3 G3 D3', 'A2:2 E3 G3 C4 E4 C4 G3 E3', 'D3:2 A3 D4 F4 D4:8') },
      { i: 'strings', v: 0.2, n: '[D3,F3,A3]:32 [C3,E3,G3]:16 [A2,C3,E3]:16 [D3,F3,A3]:16 [G2,B2,D3]:16 [A2,C3,E3]:16 [D3,F3,A3]:16' },
    ],
  },
  espers: { // the Esper world: suspended lydian chords, distant bells
    bpm: 60, vol: 0.9,
    tracks: [
      { i: 'choir', v: 0.3, n: '[F3,A3,C4,E4]:32 [G3,B3,D4]:32 [F3,A3,C4,E4]:32 [E3,G3,B3,D4]:32' },
      { i: 'glass', v: 0.35, pan: 0.3, n: 'C6:8 B5:4 G5:4 A5:16 r:8 E6:8 D6:16 r:16 B5:8 C6:8 G5:16 F5:8 E5:8' },
      { i: 'musicbox', v: 0.18, pan: -0.3, n: 'r:96 E5:4 A5:4 B5:4 r:20' },
    ],
  },
  doma: { // the eastern castle: pentatonic flute, plucked strings, taiko
    bpm: 96, vol: 0.85,
    tracks: [
      { i: 'flute', v: 0.48, n: bars('A4:2 C5 D5:4 E5 G5', 'E5:2 D5 C5:4 A4:8', 'G4:2 A4 C5:4 D5 E5', 'D5:16', 'A4:2 C5 D5:4 E5 A5', 'G5:2 E5 D5:4 C5:8', 'D5:4 C5 A4 G4', 'A4:16') },
      { i: 'harp', v: 0.32, pan: 0.2, n: '(A2:2 E3 A3 C4 D4 C4 A3 E3)*2 (G2:2 D3 G3 A3 C4 A3 G3 D3)*2 (A2:2 E3 A3 C4 D4 C4 A3 E3)*2 (D3:2 A3 C4 D4 E4 D4 C4 A3) (A2:2 E3 A3 C4 E4:8)' },
      { i: 'pad', v: 0.2, n: 'A2:64 G2:32 A2:32' },
      { i: 'drums', v: 0.45, n: '(T:4 r:4 T:2 T:2 r:4)*8' },
    ],
  },
  dirge: { // Cyan's goodbye: piano and strings, G minor
    bpm: 60, vol: 0.9,
    tracks: [
      { i: 'piano', v: 0.5, n: bars('D5:8 C5:4 Bb4', 'A4:8 G4', 'Bb4:8 A4:4 G4', 'F#4:16', 'D5:8 Eb5:4 D5', 'C5:8 Bb4', 'A4:8 Bb4:4 A4', 'G4:16') },
      { i: 'strings', v: 0.3, n: '[G3,Bb3,D4]:16 [G3,Bb3,D4]:16 [Eb3,G3,Bb3]:16 [D3,F#3,A3]:16 [G3,Bb3,D4]:16 [C3,Eb3,G3]:16 [D3,F#3,A3]:16 [G3,Bb3,D4]:16' },
      { i: 'bass', v: 0.3, n: 'G1:16 G1:16 Eb1:16 D1:16 G1:16 C2:16 D2:16 G1:16' },
    ],
  },
  town: { // ports and towns: a bright tune in G
    bpm: 104, vol: 0.85,
    tracks: [
      { i: 'flute', v: 0.45, n: bars('D5:4 G5 B5 A5', 'G5:4 E5 D5:8', 'C5:4 E5 G5 F#5', 'E5:4 D5 D5:8', 'D5:4 G5 B5 D6', 'C6:4 B5 A5:8', 'G5:4 A5 B5 F#5', 'G5:16') },
      { i: 'pizz', v: 0.4, n: '(G2:4 D3:4 G2:4 D3:4) (C3:4 G3:4 C3:4 G3:4) (A2:4 E3:4 D3:4 A3:4) (G2:4 D3:4 G2:4 D3:4) (G2:4 D3:4 G2:4 D3:4) (A2:4 E3:4 D3:4 A3:4) (C3:4 G3:4 D3:4 A3:4) (G2:4 D3:4 G2:8)' },
      { i: 'strings', v: 0.22, n: '[B3,D4,G4]:16 [C4,E4,G4]:16 [C4,E4,A4]:8 [D4,F#4,A4]:8 [B3,D4,G4]:16 [B3,D4,G4]:16 [D4,F#4,A4]:16 [C4,E4,G4]:8 [D4,F#4,A4]:8 [B3,D4,G4]:16' },
      { i: 'drums', v: 0.35, n: '(r:2 m:2 r:2 m:2 r:2 m:2 r:2 m:1 m:1)*8' },
    ],
  },
  drowned: { // the drowned temple: slow water, distant bells
    bpm: 58, vol: 0.9,
    tracks: [
      { i: 'pad', v: 0.32, n: '[D3,A3]:32 [Bb2,F3]:32 [C3,G3]:32 [A2,E3]:32' },
      { i: 'glass', v: 0.3, n: 'A5:12 r:4 D6:8 C6:8 r:16 F5:16 r:16 G5:8 A5:8 r:16 E5:16' },
      { i: 'harp', v: 0.18, n: '(D3:4 A3:4 F4:4 A3:4)*2 (Bb2:4 F3:4 D4:4 F3:4)*2 (C3:4 G3:4 E4:4 G3:4)*2 (A2:4 E3:4 C#4:4 E3:4)*2' },
    ],
  },
  cradle: { // the final dungeon: the lullaby, driven and afraid
    bpm: 124, vol: 0.9,
    tracks: [
      { i: 'strings', v: 0.42, n: bars('E5:4 A5 B5 C6', 'B5:4 A5 G5 E5', 'D5:4 E5 C5 D5', 'E5:16', 'E5:4 A5 B5 C6', 'D6:4 E6 D6 C6', 'B5:4 A5 G#5 B5', 'A5:16') },
      { i: 'bass', v: 0.5, n: '(A1:1 A1 A2 A1 E2 A1 G2 A1)*4 (F1:1 F1 F2 F1 C2 F1 E2 F1)*2 (E1:1 E1 E2 E1 B1 E1 D2 E1)*2 (A1:1 A1 A2 A1 E2 A1 G2 A1)*4 (D2:1 D2 D3 D2 A2 D2 C3 D2)*2 (E1:1 E1 E2 E1 B1 E1 G#1 E1)*2' },
      { i: 'choir', v: 0.35, n: '[A3,C4,E4]:32 [F3,A3,C4]:16 [E3,G#3,B3]:16 [A3,C4,E4]:32 [D3,F3,A3]:16 [E3,G#3,B3]:16' },
      { i: 'drums', v: 0.5, n: '((k:2 h:2 s:2 h:2)*3 k:2 s:2 s:2 s:2)*8' },
    ],
  },
  final: { // SOLACE: the music-box lullaby becomes a full choir
    bpm: 96, vol: 0.95,
    tracks: [
      { i: 'choir', v: 0.5, n: LULL_MEL },
      { i: 'brass', v: 0.32, n: LULL_MEL.replace(/([A-G][#b]?)(\d)/g, (m, a, o) => a + (o - 1)) },
      { i: 'musicbox', v: 0.3, n: LULL_MEL },
      { i: 'bass', v: 0.5, n: '(A1:12 F1:12 C2:12 E1:12 A1:12 C2:12 G1:12 A1:12 F1:12 E1:12 A1:12 D2:12 A1:12 E1:12 F1:8 E1:4 A1:12)' },
      { i: 'drums', v: 0.55, n: '(k+t:4 s:4 s:4)*15 R:12' },
    ],
  },
  ending: { // Requiem for Ruin, at last in a major key
    bpm: 70, vol: 0.95,
    tracks: [
      { i: 'flute', v: 0.5, n: bars('A4:6 D5:2 F#5:4 E5', 'D5:4 C#5 A4:8', 'B4:6 C#5:2 D5:4 F#5', 'E5:16', 'A4:6 D5:2 F#5:4 G5', 'A5:6 G5:2 F#5:4 E5', 'D5:4 E5 F#5 C#5', 'D5:16') },
      { i: 'strings', v: 0.42, n: '[D3,F#3,A3]:16 [C#3,E3,A3]:16 [D3,F#3,B3]:16 [C#3,E3,A3]:16 [D3,F#3,A3]:16 [D3,F#3,A3]:16 [D3,G3,B3]:8 [C#3,E3,A3]:8 [D3,F#3,A3]:16' },
      { i: 'harp', v: 0.3, n: '(D3:2 A3 D4 F#4 A4 F#4 D4 A3)*2 (B2:2 F#3 B3 D4 F#4 D4 B3 F#3) (A2:2 E3 A3 C#4 E4 C#4 A3 E3) (D3:2 A3 D4 F#4 A4 F#4 D4 A3)*2 (G2:2 D3 G3 B3 A2 E3 A3 C#4) (D3:2 A3 D4 F#4 D5:8)' },
      { i: 'bass', v: 0.35, n: 'D2:16 A1:16 B1:16 A1:16 D2:16 D2:16 G1:8 A1:8 D2:16' },
    ],
  },
  celes: { // Celes and Maren: an original theme of loyalty and its cost, G major
    bpm: 76, vol: 0.85,
    tracks: [
      { i: 'oboe', v: 0.5, n: bars('B4:6 D5:2 G5:8', 'F#5:4 E5 D5:8', 'C5:6 E5:2 A5:8', 'G5:16', 'B4:6 D5:2 G5:8', 'A5:4 B5 C6:8', 'B5:4 A5 G5 F#5', 'G5:16') },
      { i: 'strings', v: 0.32, n: '[B3,D4,G4]:16 [B3,D4,G4]:16 [C4,E4,A4]:16 [B3,D4,G4]:16 [B3,D4,G4]:16 [C4,E4,A4]:16 [D4,F#4,A4]:16 [B3,D4,G4]:16' },
      { i: 'harp', v: 0.25, n: '(G2:2 D3 G3 B3 D4 B3 G3 D3)*2 (A2:2 E3 A3 C4 E4 C4 A3 E3) (G2:2 D3 G3 B3 D4 B3 G3 D3)*2 (A2:2 E3 A3 C4 E4 C4 A3 E3) (D3:2 A3 D4 F#4 A4 F#4 D4 A3) (G2:2 D3 G3 B3 G3:8)' },
    ],
  },
  nightmare: { // Terra's last fear: a crooked waltz
    bpm: 132, vol: 0.9,
    tracks: [
      { i: 'organ', v: 0.35, n: bars('C5:4 Eb5 G5', 'F#5:8 G5:4', 'Ab5:4 G5 F5', 'Eb5:12', 'D5:4 F5 Ab5', 'G5:8 F#5:4', 'F5:4 Eb5 D5', 'C5:12') },
      { i: 'musicbox', v: 0.3, n: bars('C6:4 Eb6 G6', 'F#6:8 G6:4', 'Ab6:4 G6 F6', 'Eb6:12', 'D6:4 F6 Ab6', 'G6:8 F#6:4', 'F6:4 Eb6 D6', 'C6:12') },
      { i: 'bass', v: 0.5, n: '(C2:4 [G3,Eb4]:4 [G3,Eb4]:4)*3 (Ab1:4 [Ab3,C4]:4 [Ab3,C4]:4) (G1:4 [F3,B3]:4 [F3,B3]:4)*3 (C2:4 [G3,Eb4]:4 [G3,Eb4]:4)' },
      { i: 'drums', v: 0.4, n: '(k:4 h:4 h:4)*8' },
    ],
  },
  dream: { // the World of Balance, remembered: Mobliz's tune in full bloom
    bpm: 84, vol: 0.85,
    tracks: [
      { i: 'flute', v: 0.48, n: MOB_MEL },
      { i: 'strings', v: 0.32, pan: -0.2, n: MOB_PAD },
      { i: 'harp', v: 0.3, pan: 0.2, n: MOB_ARP },
      { i: 'glass', v: 0.18, n: 'r:224 C6:8 F6:8 A6:16' },
    ],
  },
  mercy: { // SOLACE's Mercy form: the lullaby slowed until it is barely there
    bpm: 52, vol: 0.9,
    tracks: [
      { i: 'musicbox', v: 0.45, n: LULL_MEL },
      { i: 'pad', v: 0.35, n: LULL_PAD },
    ],
  },
};

export const SONGS = {
  title: {
    bpm: 70, vol: 0.95,
    tracks: [
      { i: 'flute', v: 0.55, pan: -0.1, n: j(REQ_A, 'r:128') },
      { i: 'oboe', v: 0.6, pan: 0.1, n: j('r:128', REQ_B) },
      { i: 'strings', v: 0.42, n: j('r:128', REQ_B.replace(/([A-G][#b]?)(\d)/g, (m, a, o) => a + (o - 1))) },
      { i: 'harp', v: 0.32, pan: 0.2, n: REQ_HARP },
      { i: 'strings', v: 0.5, pan: -0.2, n: REQ_STR },
      { i: 'bass', v: 0.4, n: REQ_BASS },
      { i: 'drums', v: 0.4, n: 'r:60 R:4 r:124 R:4 r:48 t:16' },
    ],
  },
  lullaby: {
    bpm: 76, vol: 0.9,
    tracks: [
      { i: 'musicbox', v: 0.6, n: LULL_MEL },
      { i: 'harp', v: 0.22, pan: 0.2, n: LULL_ARP },
    ],
  },
  stillness: { // piano lullaby — loss, the Stilled
    bpm: 62, vol: 0.9,
    tracks: [
      { i: 'piano', v: 0.55, n: LULL_MEL },
      { i: 'piano', v: 0.25, pan: 0.15, n: LULL_ARP },
      { i: 'pad', v: 0.4, n: LULL_PAD },
    ],
  },
  solace: { // SOLACE speaks: music box over a still choir
    bpm: 66, vol: 0.9,
    tracks: [
      { i: 'musicbox', v: 0.5, n: LULL_MEL },
      { i: 'choir', v: 0.3, n: LULL_PAD },
    ],
  },
  seven: {
    bpm: 70, vol: 0.8,
    tracks: [{ i: 'glass', v: 0.4, n: SEVEN_MEL }],
  },
  vault: {
    bpm: 56, vol: 1,
    tracks: [
      { i: 'choir', v: 0.32, n: '[A2,E3]:32 [Bb2,F3]:32 [A2,E3]:32 [G#2,D3]:32' },
      { i: 'pad', v: 0.25, n: 'A1:64 G#1:64' },
      { i: 'glass', v: 0.32, pan: 0.3, n: 'E6:12 r:4 A5:8 r:8 r:16 C6:4 B5:12 r:16 E6:6 F6:2 E6:8 r:16 B5:16' },
      { i: 'musicbox', v: 0.28, pan: -0.3, n: 'r:64 E5:4 A5:4 B5:4 r:4 C6:6 r:10 r:32' },
      { i: 'drums', v: 0.3, n: '(k:2 k:14 r:16)*4' },
    ],
  },
  dig: { // the dig crew's work song: steady, hopeful, a little tired (A minor → C)
    bpm: 84, vol: 0.85,
    tracks: [
      { i: 'pizz', v: 0.4, n: '(A2:4 E3:4 A2:4 E3:4)*2 (F2:4 C3:4 F2:4 C3:4)*2 (C3:4 G3:4 C3:4 G3:4)*2 (E2:4 B2:4 E2:4 G#2:4)*2' },
      { i: 'oboe', v: 0.5, n: 'A4:6 C5:2 E5:8 D5:4 C5:4 B4:8 | C5:6 A4:2 F4:8 A4:8 G4:8 | E4:4 G4:4 C5:8 E5:6 D5:2 C5:8 | B4:6 C5:2 B4:4 G#4:4 E4:16' },
      { i: 'strings', v: 0.3, n: '[A3,C4,E4]:32 [A3,C4,F4]:32 [G3,C4,E4]:32 [G#3,B3,E4]:32' },
      { i: 'drums', v: 0.35, n: '(T:4 h:4 h:4 h:4)*8' },
    ],
  },
  ashen: {
    bpm: 60, vol: 0.8,
    tracks: [
      { i: 'pad', v: 0.32, n: 'D2:64 C2:64' },
      { i: 'glass', v: 0.25, n: 'r:48 A5:16 r:40 G5:8 D5:16' },
    ],
  },
  battle: {
    bpm: 152, vol: 0.85,
    tracks: [
      { i: 'brass', v: 0.42, pan: -0.1, n: BAT_MEL },
      { i: 'lead', v: 0.35, pan: 0.1, n: BAT_MEL.replace(/([A-G][#b]?)(\d)/g, (m, a, o) => a + (o - 1)) },
      { i: 'bass', v: 0.55, n: BAT_BASS },
      { i: 'strings', v: 0.38, pan: 0.2, n: BAT_STR },
      { i: 'drums', v: 0.55, n: BAT_DRUM },
    ],
  },
  boss: {
    bpm: 138, vol: 0.9,
    tracks: [
      { i: 'brass', v: 0.5, n: BOSS_MEL },
      { i: 'organ', v: 0.32, pan: 0.15, n: BOSS_MEL.replace(/([A-G][#b]?)(\d)/g, (m, a, o) => a + (o - 1)) },
      { i: 'bass', v: 0.55, n: BOSS_BASS },
      { i: 'choir', v: 0.4, pan: -0.15, n: BOSS_CHOIR },
      { i: 'drums', v: 0.6, n: BOSS_DRUM },
    ],
  },
  mobliz: {
    bpm: 92, vol: 0.85,
    tracks: [
      { i: 'flute', v: 0.5, n: MOB_MEL },
      { i: 'harp', v: 0.3, pan: 0.2, n: MOB_ARP },
      { i: 'strings', v: 0.22, pan: -0.2, n: MOB_PAD },
      { i: 'drums', v: 0.4, n: MOB_SHAKE },
    ],
  },
  night: { // Mobliz theme at night: solo piano
    bpm: 64, vol: 0.85,
    tracks: [
      { i: 'piano', v: 0.45, n: MOB_MEL },
      { i: 'piano', v: 0.2, pan: 0.15, n: MOB_ARP },
    ],
  },
  victory: {
    bpm: 132, vol: 0.9, loop: false, then: 'victoryLoop',
    tracks: [
      { i: 'brass', v: 0.5, n: VIC_FAN },
      { i: 'strings', v: 0.4, n: VIC_FAN_STR },
      { i: 'drums', v: 0.5, n: VIC_FAN_DR },
    ],
  },
  victoryLoop: {
    bpm: 100, vol: 0.8,
    tracks: [
      { i: 'flute', v: 0.45, n: VIC_MEL },
      { i: 'harp', v: 0.28, n: VIC_ARP },
    ],
  },
  tension: { // something is wrong: low pulse + broken lullaby fragments
    bpm: 72, vol: 0.9,
    tracks: [
      { i: 'pad', v: 0.35, n: '[A2,E3]:32 [Bb2,E3]:32' },
      { i: 'drums', v: 0.4, n: '(k:2 k:6 r:8)*4' },
      { i: 'glass', v: 0.3, n: 'r:16 E5:4 A5:4 B5:4 r:4 r:16 C6:12 r:4' },
      { i: 'strings', v: 0.25, n: 'r:32 E4:16 F4:16' },
    ],
  },

  // ---------------------------------------------------------------- the wider score
  world: { // the World of Ruin: the main theme, alone on an oboe over the harp
    bpm: 72, vol: 0.85,
    tracks: [
      { i: 'oboe', v: 0.5, n: REQ_A },
      { i: 'harp', v: 0.28, pan: 0.2, n: REQ_HARP.split(' ').slice(0, 64).join(' ') },
      { i: 'strings', v: 0.36, pan: -0.2, n: REQ_STR.split(/\s+/).slice(0, 9).join(' ') },
      { i: 'bass', v: 0.32, n: REQ_BASS.split(' ').slice(0, 9).join(' ') },
    ],
  },
  falcon: OTHER.falcon, narshe: OTHER.narshe, figaro: OTHER.figaro, hush: OTHER.hush, thamasa: OTHER.thamasa,
  espers: OTHER.espers, doma: OTHER.doma, dirge: OTHER.dirge, town: OTHER.town, drowned: OTHER.drowned,
  cradle: OTHER.cradle, final: OTHER.final, ending: OTHER.ending, celes: OTHER.celes, nightmare: OTHER.nightmare,
  dream: OTHER.dream, mercy: OTHER.mercy,
};
