// WebAudio synth + step sequencer + sound effects. No samples: every instrument is
// built from oscillators, filtered noise and envelopes, then sent through a shared
// hall reverb and a soft SNES-style echo.
import { SONGS } from '../data/music.js';

let ctx = null;
let master, musicBus, sfxBus, reverbIn, echoIn, noiseBuf;
const vol = { music: 0.7, sfx: 0.8 };

export function setVolumes(music, sfx) {
  vol.music = music;
  vol.sfx = sfx;
  if (!ctx) return;
  musicBus.gain.setTargetAtTime(music * 0.9, ctx.currentTime, 0.05);
  sfxBus.gain.setTargetAtTime(sfx, ctx.currentTime, 0.05);
}

export function unlock() {
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback'; // play even with the iOS ringer switch off
  } catch { /* not supported */ }
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC({ latencyHint: 'interactive' });
    build();
  }
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  // iOS needs a sound started inside the gesture
  const b = ctx.createBuffer(1, 1, 22050);
  const s = ctx.createBufferSource();
  s.buffer = b; s.connect(ctx.destination); s.start(0);
}

document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.visibilityState === 'hidden') ctx.suspend().catch(() => {});
  else ctx.resume().catch(() => {});
});

function build() {
  master = ctx.createDynamicsCompressor();
  master.threshold.value = -14;
  master.ratio.value = 3;
  master.attack.value = 0.005;
  master.release.value = 0.2;
  const out = ctx.createGain();
  out.gain.value = 0.9;
  master.connect(out).connect(ctx.destination);

  musicBus = ctx.createGain();
  musicBus.gain.value = vol.music * 0.9;
  sfxBus = ctx.createGain();
  sfxBus.gain.value = vol.sfx;
  musicBus.connect(master);
  sfxBus.connect(master);

  // noise
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

  // hall reverb (generated impulse response)
  const len = Math.floor(ctx.sampleRate * 2.6);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const t = i / ctx.sampleRate;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2) * (t < 0.012 ? t / 0.012 : 1);
    }
  }
  const conv = ctx.createConvolver();
  conv.buffer = ir;
  reverbIn = ctx.createGain();
  reverbIn.gain.value = 0.32;
  const revLP = ctx.createBiquadFilter();
  revLP.type = 'lowpass'; revLP.frequency.value = 5200;
  reverbIn.connect(conv).connect(revLP).connect(musicBus);

  // SNES-ish echo: filtered feedback delay
  echoIn = ctx.createGain();
  echoIn.gain.value = 0.16;
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.24;
  const fb = ctx.createGain();
  fb.gain.value = 0.32;
  const eLP = ctx.createBiquadFilter();
  eLP.type = 'lowpass'; eLP.frequency.value = 2600;
  echoIn.connect(delay).connect(eLP).connect(fb).connect(delay);
  eLP.connect(musicBus);

  // pulse waves for chip-like reeds and leads
  WAVES.pulse25 = pulseWave(0.25);
  WAVES.pulse12 = pulseWave(0.125);
}

const WAVES = {};
function pulseWave(duty) {
  const n = 48;
  const real = new Float32Array(n), imag = new Float32Array(n);
  for (let k = 1; k < n; k++) real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
  return ctx.createPeriodicWave(real, imag);
}

// ---------------------------------------------------------------- building blocks
function osc(type, freq, t, stop, detuneCents = 0) {
  const o = ctx.createOscillator();
  if (WAVES[type]) o.setPeriodicWave(WAVES[type]); else o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (detuneCents) o.detune.setValueAtTime(detuneCents, t);
  o.start(t);
  o.stop(stop);
  return o;
}
function gainNode(v = 1) { const g = ctx.createGain(); g.gain.value = v; return g; }
function filter(type, freq, q = 0.7) {
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  return f;
}
function noise(t, stop) {
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  s.loop = true;
  s.start(t, Math.random() * 1.5);
  s.stop(stop);
  return s;
}
// attack / decay-to-sustain / release envelope on a gain param
function adsr(param, t, dur, a, d, s, r, peak) {
  param.setValueAtTime(0.0001, t);
  param.linearRampToValueAtTime(peak, t + a);
  if (s < 1) param.setTargetAtTime(peak * s, t + a, Math.max(0.005, d / 3));
  const end = Math.max(t + a, t + dur);
  param.setTargetAtTime(0.0001, end, Math.max(0.005, r / 4));
  return end + r + 0.05;
}
function pluckEnv(param, t, peak, decay) {
  param.setValueAtTime(0.0001, t);
  param.linearRampToValueAtTime(peak, t + 0.003);
  param.setTargetAtTime(0.0001, t + 0.003, decay / 4);
  return t + decay + 0.05;
}
function vibrato(o, t, rate, depthCents, delay = 0.2) {
  const lfo = ctx.createOscillator();
  lfo.frequency.value = rate;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(depthCents, t + delay + 0.25);
  lfo.connect(g).connect(o.detune);
  lfo.start(t);
  return lfo;
}
function out(node, dest, pan, wet) {
  let n = node;
  if (pan && ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    n.connect(p);
    n = p;
  }
  n.connect(dest);
  if (wet > 0) {
    const s = gainNode(wet);
    n.connect(s);
    s.connect(reverbIn);
    const e = gainNode(wet * 0.8);
    n.connect(e);
    e.connect(echoIn);
  }
}

// ---------------------------------------------------------------- instruments
// Each: (t, freq, dur, vel, dest, pan) -> schedules nodes.
const INST = {
  musicbox(t, f, dur, v, dest, pan) {
    const g = gainNode(0);
    const end = pluckEnv(g.gain, t, v * 0.5, 1.8);
    const g2 = gainNode(0);
    pluckEnv(g2.gain, t, v * 0.12, 0.35);
    osc('sine', f, t, end).connect(g);
    osc('sine', f * 2, t, end, 4).connect(g);
    osc('sine', f * 5.95, t, end).connect(g2);
    g2.connect(g);
    const lp = filter('lowpass', 6000);
    g.connect(lp);
    out(lp, dest, pan, 0.45);
  },
  glass(t, f, dur, v, dest, pan) {
    const g = gainNode(0);
    const end = pluckEnv(g.gain, t, v * 0.42, 2.6);
    const car = osc('sine', f, t, end);
    const mod = osc('sine', f * 3.5, t, end);
    const mg = gainNode(0);
    mg.gain.setValueAtTime(f * 1.6, t);
    mg.gain.setTargetAtTime(f * 0.1, t, 0.25);
    mod.connect(mg).connect(car.frequency);
    car.connect(g);
    out(g, dest, pan, 0.6);
  },
  harp(t, f, dur, v, dest, pan) {
    const g = gainNode(0);
    const end = pluckEnv(g.gain, t, v * 0.45, 1.1);
    osc('triangle', f, t, end).connect(g);
    const h = gainNode(0.25);
    osc('sine', f * 2, t, end).connect(h).connect(g);
    const lp = filter('lowpass', 3200);
    g.connect(lp);
    out(lp, dest, pan, 0.35);
  },
  piano(t, f, dur, v, dest, pan) {
    const g = gainNode(0);
    const decay = Math.min(3.2, 2600 / f);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v * 0.42, t + 0.004);
    g.gain.setTargetAtTime(v * 0.18, t + 0.004, 0.12);
    g.gain.setTargetAtTime(0.0001, t + 0.1, decay / 3);
    g.gain.setTargetAtTime(0.0001, t + dur, 0.08);
    const end = t + Math.min(dur + 0.4, decay + 0.2);
    osc('triangle', f, t, end).connect(g);
    const h = gainNode(0.35);
    osc('sine', f * 2, t, end, 3).connect(h).connect(g);
    const h3 = gainNode(0.1);
    osc('sine', f * 3, t, end).connect(h3).connect(g);
    const lp = filter('lowpass', 3800);
    g.connect(lp);
    out(lp, dest, pan, 0.4);
  },
  strings(t, f, dur, v, dest, pan) {
    const g = gainNode(0);
    const end = adsr(g.gain, t, dur, 0.22, 0.3, 0.85, 0.45, v * 0.16);
    const lp = filter('lowpass', Math.min(2400, f * 6), 0.5);
    for (const dc of [-7, 6]) {
      const o = osc('sawtooth', f, t, end, dc);
      vibrato(o, t, 5.2, 7, 0.3);
      o.connect(lp);
    }
    lp.connect(g);
    out(g, dest, pan, 0.5);
  },
  pad(t, f, dur, v, dest, pan) {
    const g = gainNode(0);
    const end = adsr(g.gain, t, dur, 0.9, 0.5, 0.9, 1.2, v * 0.14);
    const lp = filter('lowpass', 900, 0.6);
    for (const dc of [-9, 0, 10]) osc('sawtooth', f, t, end, dc).connect(lp);
    lp.connect(g);
    out(g, dest, pan, 0.6);
  },
  choir(t, f, dur, v, dest, pan) {
    const g = gainNode(0);
    const end = adsr(g.gain, t, dur, 0.35, 0.3, 0.9, 0.7, v * 0.3);
    const f1 = filter('bandpass', 720, 3.5), f2 = filter('bandpass', 1150, 4.5), f3 = filter('bandpass', 2600, 6);
    const mix = gainNode(1);
    for (const dc of [-10, 0, 11]) {
      const o = osc('sawtooth', f, t, end, dc);
      vibrato(o, t, 4.8, 9, 0.25);
      o.connect(f1); o.connect(f2); o.connect(f3);
    }
    const g3 = gainNode(0.4);
    f1.connect(mix); f2.connect(mix); f3.connect(g3).connect(mix);
    mix.connect(g);
    out(g, dest, pan, 0.7);
  },
  flute(t, f, dur, v, dest, pan) {
    const g = gainNode(0);
    const end = adsr(g.gain, t, dur * 0.95, 0.05, 0.2, 0.8, 0.15, v * 0.34);
    const o = osc('triangle', f, t, end);
    vibrato(o, t, 5.4, 12, 0.25);
    o.connect(g);
    const s = osc('sine', f * 2, t, end);
    const sg = gainNode(0.12);
    s.connect(sg).connect(g);
    const n = noise(t, end);
    const bp = filter('bandpass', f * 2, 3);
    const ng = gainNode(0.05);
    n.connect(bp).connect(ng).connect(g);
    out(g, dest, pan, 0.45);
  },
  oboe(t, f, dur, v, dest, pan) {
    const g = gainNode(0);
    const end = adsr(g.gain, t, dur * 0.95, 0.04, 0.2, 0.85, 0.12, v * 0.16);
    const o = osc('pulse25', f, t, end);
    vibrato(o, t, 5.6, 10, 0.3);
    const lp = filter('lowpass', 2400, 1.2);
    o.connect(lp).connect(g);
    out(g, dest, pan, 0.4);
  },
  brass(t, f, dur, v, dest, pan) {
    const g = gainNode(0);
    const end = adsr(g.gain, t, dur * 0.95, 0.04, 0.2, 0.8, 0.15, v * 0.2);
    const lp = filter('lowpass', 500, 1.5);
    lp.frequency.setValueAtTime(400, t);
    lp.frequency.linearRampToValueAtTime(Math.min(4200, f * 7), t + 0.08);
    lp.frequency.setTargetAtTime(Math.min(2600, f * 4), t + 0.1, 0.2);
    for (const dc of [-5, 5]) {
      const o = osc('sawtooth', f, t, end, dc);
      o.frequency.setValueAtTime(f * 0.97, t);
      o.frequency.linearRampToValueAtTime(f, t + 0.05);
      o.connect(lp);
    }
    lp.connect(g);
    out(g, dest, pan, 0.35);
  },
  lead(t, f, dur, v, dest, pan) {
    const g = gainNode(0);
    const end = adsr(g.gain, t, dur * 0.9, 0.01, 0.15, 0.7, 0.08, v * 0.12);
    const o = osc('square', f, t, end);
    vibrato(o, t, 6, 8, 0.25);
    const lp = filter('lowpass', 3000);
    o.connect(lp).connect(g);
    out(g, dest, pan, 0.3);
  },
  bass(t, f, dur, v, dest, pan) {
    const g = gainNode(0);
    const end = adsr(g.gain, t, dur * 0.92, 0.008, 0.25, 0.65, 0.06, v * 0.5);
    osc('triangle', f, t, end).connect(g);
    const sq = gainNode(0.18);
    const lp = filter('lowpass', 700);
    osc('square', f, t, end).connect(lp).connect(sq).connect(g);
    out(g, dest, pan, 0.08);
  },
  pizz(t, f, dur, v, dest, pan) {
    const g = gainNode(0);
    const end = pluckEnv(g.gain, t, v * 0.3, 0.35);
    const lp = filter('lowpass', Math.min(2000, f * 4));
    osc('sawtooth', f, t, end).connect(lp).connect(g);
    out(g, dest, pan, 0.45);
  },
  organ(t, f, dur, v, dest, pan) {
    const g = gainNode(0);
    const end = adsr(g.gain, t, dur, 0.03, 0.1, 1, 0.25, v * 0.12);
    [1, 2, 3, 4, 6].forEach((m, i) => {
      const h = gainNode([1, 0.6, 0.35, 0.25, 0.12][i]);
      osc('sine', f * m, t, end).connect(h).connect(g);
    });
    out(g, dest, pan, 0.6);
  },
};

// Drum kit; tokens are letters in drum tracks.
const DRUM = {
  k(t, v, dest) { // kick
    const g = gainNode(0);
    pluckEnv(g.gain, t, v * 0.9, 0.3);
    const o = osc('sine', 120, t, t + 0.35);
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    o.connect(g); g.connect(dest);
  },
  s(t, v, dest) { // snare
    const g = gainNode(0);
    pluckEnv(g.gain, t, v * 0.45, 0.18);
    const n = noise(t, t + 0.25);
    const hp = filter('highpass', 1200);
    n.connect(hp).connect(g);
    const tg = gainNode(0);
    pluckEnv(tg.gain, t, v * 0.25, 0.08);
    osc('triangle', 190, t, t + 0.12).connect(tg);
    tg.connect(dest);
    out(g, dest, 0, 0.25);
  },
  h(t, v, dest) { // closed hat
    const g = gainNode(0);
    pluckEnv(g.gain, t, v * 0.16, 0.04);
    noise(t, t + 0.08).connect(filter('highpass', 7500)).connect(g);
    g.connect(dest);
  },
  o(t, v, dest) { // open hat
    const g = gainNode(0);
    pluckEnv(g.gain, t, v * 0.14, 0.3);
    noise(t, t + 0.4).connect(filter('highpass', 6500)).connect(g);
    g.connect(dest);
  },
  m(t, v, dest) { // shaker
    const g = gainNode(0);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v * 0.08, t + 0.02);
    g.gain.setTargetAtTime(0.0001, t + 0.03, 0.02);
    noise(t, t + 0.12).connect(filter('bandpass', 9000, 1)).connect(g);
    g.connect(dest);
  },
  c(t, v, dest) { // crash
    const g = gainNode(0);
    pluckEnv(g.gain, t, v * 0.22, 1.6);
    noise(t, t + 1.8).connect(filter('highpass', 4200)).connect(g);
    out(g, dest, 0, 0.4);
  },
  t(t, v, dest) { // timpani (low D)
    DRUM.T(t, v, dest, 73.4);
  },
  T(t, v, dest, f = 98) { // tom / timpani at freq
    const g = gainNode(0);
    pluckEnv(g.gain, t, v * 0.7, 1.2);
    const o = osc('sine', f, t, t + 1.3);
    o.frequency.setValueAtTime(f * 1.08, t);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
    o.connect(g);
    const ng = gainNode(0);
    pluckEnv(ng.gain, t, v * 0.12, 0.1);
    noise(t, t + 0.15).connect(filter('lowpass', 900)).connect(ng).connect(g);
    out(g, dest, 0, 0.5);
  },
  R(t, v, dest) { // timpani roll (A)
    for (let i = 0; i < 8; i++) DRUM.T(t + i * 0.055, v * (0.3 + i * 0.07), dest, 110);
  },
};

// ---------------------------------------------------------------- notation parser
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function freqOf(name) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) return null;
  let n = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const midi = (parseInt(m[3], 10) + 1) * 12 + n;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Grammar: tokens separated by spaces. "C5:4" note (16th-note steps), "r:4" rest,
// "[C4,E4,G4]:8" chord, "(...)*N" repeat group, "|" ignored. Duration defaults to the
// previous one. Drum tracks use letters: "k:2 h:2 s+h:2".
function tokenize(src) {
  return src.replace(/\|/g, ' ').replace(/\(/g, ' ( ').replace(/\)\*(\d+)/g, ' )*$1 ').trim().split(/\s+/).filter(Boolean);
}
function parseTrack(src, drums, transpose) {
  const toks = tokenize(src);
  let pos = 0, last = 4;
  function block(end) {
    const evs = [];
    let step = 0;
    while (pos < toks.length) {
      const tk = toks[pos++];
      if (tk === '(') {
        const inner = block(true);
        const rep = inner.rep;
        for (let r = 0; r < rep; r++) for (const e of inner.evs) evs.push({ ...e, s: e.s + step + r * inner.len });
        step += inner.len * rep;
        continue;
      }
      if (tk.startsWith(')*')) {
        if (end) return { evs, len: step, rep: parseInt(tk.slice(2), 10) };
        continue;
      }
      const [what, durS] = tk.split(':');
      const dur = durS ? parseFloat(durS) : last;
      last = dur;
      if (what !== 'r') {
        let notes;
        if (drums) notes = what.split('+');
        else notes = what.replace(/[[\]]/g, '').split(',').map((n) => freqOf(n)).filter(Boolean).map((f) => f * transpose);
        evs.push({ s: step, d: dur, n: notes });
      }
      step += dur;
    }
    return { evs, len: step, rep: 1 };
  }
  const b = block(false);
  return { evs: b.evs, len: b.len };
}

const compiled = new Map();
function compile(name) {
  if (compiled.has(name)) return compiled.get(name);
  const song = SONGS[name];
  if (!song) return null;
  const tr = Math.pow(2, (song.transpose || 0) / 12);
  const tracks = song.tracks.map((t) => {
    const drums = t.i === 'drums';
    const p = parseTrack(t.n, drums, tr);
    const byStep = new Map();
    for (const e of p.evs) {
      const k = e.s;
      if (!byStep.has(k)) byStep.set(k, []);
      byStep.get(k).push(e);
    }
    return { ...t, drums, len: p.len, byStep };
  });
  const c = { ...song, tracks, len: Math.max(...tracks.map((t) => t.len)) };
  compiled.set(name, c);
  return c;
}

// ---------------------------------------------------------------- music player
let current = null; // { name, c, gain, step, next }
let ambience = null;

export function playMusic(name, opts = {}) {
  if (!ctx) { pendingSong = name; return; }
  if (current && current.name === name && !opts.restart) return;
  stopMusic(opts.fade ?? 0.8);
  if (!name) return;
  const c = compile(name);
  if (!c) return;
  const g = gainNode(0);
  g.gain.setTargetAtTime(c.vol ?? 1, ctx.currentTime, 0.05);
  g.connect(musicBus);
  current = { name, c, gain: g, step: 0, next: ctx.currentTime + 0.08, done: false };
}
let pendingSong = null;

export function stopMusic(fade = 0.8) {
  if (!current || !ctx) { current = null; return; }
  const g = current.gain;
  g.gain.cancelScheduledValues(ctx.currentTime);
  g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + Math.max(0.02, fade));
  setTimeout(() => g.disconnect(), (fade + 4) * 1000);
  current = null;
}

export function currentSong() { return current ? current.name : null; }

// Called every frame from the main loop.
export function tick() {
  if (!ctx) return;
  if (pendingSong) { const s = pendingSong; pendingSong = null; playMusic(s); }
  if (!current || ctx.state !== 'running') return;
  const cur = current;
  const c = cur.c;
  const stepDur = 60 / c.bpm / 4;
  const horizon = ctx.currentTime + 0.2;
  if (cur.next < ctx.currentTime - 0.5) cur.next = ctx.currentTime + 0.05; // resumed after a stall
  while (cur.next < horizon && !cur.done) {
    for (const tr of c.tracks) {
      const local = c.loop === false ? cur.step : cur.step % tr.len;
      if (c.loop === false && cur.step >= tr.len) continue;
      const evs = tr.byStep.get(local);
      if (!evs) continue;
      for (const e of evs) {
        const dur = e.d * stepDur;
        if (tr.drums) {
          for (const d of e.n) if (DRUM[d]) DRUM[d](cur.next, tr.v ?? 0.6, cur.gain);
        } else {
          const fn = INST[tr.i];
          for (const f of e.n) fn(cur.next, f, dur, tr.v ?? 0.6, cur.gain, tr.pan || 0);
        }
      }
    }
    cur.step++;
    cur.next += stepDur;
    if (c.loop === false && cur.step >= c.len) {
      cur.done = true;
      if (c.then) {
        const at = cur.next;
        const nm = c.then;
        setTimeout(() => { if (current === cur) { current = null; playMusic(nm); } }, Math.max(0, (at - ctx.currentTime) * 1000));
      }
    }
  }
}

// Ambient beds that sit under (or replace) music.
export function setAmbience(kind) {
  if (!ctx) return;
  if (ambience && ambience.kind === kind) return;
  if (ambience) {
    const a = ambience;
    a.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
    setTimeout(() => { try { a.src.stop(); a.lfo && a.lfo.stop(); } catch { /* */ } a.g.disconnect(); }, 2500);
    ambience = null;
  }
  if (!kind || kind === 'none') return;
  const g = gainNode(0);
  const t = ctx.currentTime;
  const src = noise(t, t + 100000);
  let lfo = null;
  if (kind === 'wind') {
    const bp = filter('bandpass', 500, 0.8);
    lfo = ctx.createOscillator();
    lfo.frequency.value = 0.11;
    const lg = gainNode(320);
    lfo.connect(lg).connect(bp.frequency);
    lfo.start(t);
    src.connect(bp).connect(g);
    g.gain.setTargetAtTime(0.09, t, 1);
  } else if (kind === 'hum') { // machine hum: low filtered noise + faint tone
    const lp = filter('lowpass', 160, 2);
    src.connect(lp).connect(g);
    lfo = osc('sine', 55, t, t + 100000);
    const og = gainNode(0.25);
    lfo.connect(og).connect(g);
    g.gain.setTargetAtTime(0.12, t, 1.5);
  } else if (kind === 'night') {
    const hp = filter('bandpass', 4200, 8);
    lfo = ctx.createOscillator();
    lfo.frequency.value = 7;
    const lg = gainNode(0.5);
    const am = gainNode(0.5);
    lfo.connect(lg).connect(am.gain);
    lfo.start(t);
    src.connect(hp).connect(am).connect(g);
    g.gain.setTargetAtTime(0.03, t, 1);
  }
  g.connect(sfxBus);
  ambience = { kind, g, src, lfo };
}

// ---------------------------------------------------------------- sound effects
function sweep(t, type, f0, f1, dur, v, dest = sfxBus) {
  const g = gainNode(0);
  pluckEnv(g.gain, t, v, dur);
  const o = osc(type, f0, t, t + dur + 0.1);
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  o.connect(g).connect(dest);
}
function blip(t, f, dur, v, type = 'square') {
  const g = gainNode(0);
  g.gain.setValueAtTime(v, t);
  g.gain.setValueAtTime(0.0001, t + dur);
  osc(type, f, t, t + dur + 0.02).connect(filter('lowpass', 4000)).connect(g).connect(sfxBus);
}
function noiseHit(t, dur, v, type, f, q = 1) {
  const g = gainNode(0);
  pluckEnv(g.gain, t, v, dur);
  noise(t, t + dur + 0.1).connect(filter(type, f, q)).connect(g).connect(sfxBus);
  return g;
}

const SFX = {
  cursor(t) { blip(t, 1320, 0.03, 0.08); },
  confirm(t) { blip(t, 990, 0.04, 0.09); blip(t + 0.05, 1480, 0.07, 0.09); },
  cancel(t) { blip(t, 740, 0.04, 0.08); blip(t + 0.05, 494, 0.06, 0.08); },
  buzzer(t) { blip(t, 140, 0.18, 0.1, 'sawtooth'); },
  text(t) { blip(t, 1700 + Math.random() * 200, 0.012, 0.025, 'triangle'); },
  step(t) { noiseHit(t, 0.03, 0.03, 'lowpass', 600); },
  door(t) { sweep(t, 'sine', 90, 50, 0.4, 0.4); noiseHit(t, 0.3, 0.12, 'lowpass', 400); },
  stoneDoor(t) {
    const g = noiseHit(t, 1.6, 0.18, 'lowpass', 220, 2);
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.18, t + 0.3);
    g.gain.linearRampToValueAtTime(0.0001, t + 1.8);
    sweep(t + 1.6, 'sine', 70, 40, 0.5, 0.4);
  },
  slash(t) { noiseHit(t, 0.12, 0.25, 'bandpass', 3000, 1.2); sweep(t, 'sawtooth', 900, 300, 0.08, 0.05); },
  hit(t) { noiseHit(t, 0.12, 0.3, 'lowpass', 1800); sweep(t, 'sine', 160, 60, 0.12, 0.35); },
  heavy(t) { noiseHit(t, 0.3, 0.4, 'lowpass', 900); sweep(t, 'sine', 120, 35, 0.3, 0.5); },
  crit(t) { SFX.heavy(t); blip(t + 0.02, 2200, 0.05, 0.06); },
  glass(t) {
    noiseHit(t, 0.25, 0.18, 'highpass', 5000);
    for (let i = 0; i < 5; i++) {
      const f = 2400 + Math.random() * 2600;
      const g = gainNode(0);
      pluckEnv(g.gain, t + i * 0.035, 0.05, 0.4);
      osc('sine', f, t + i * 0.035, t + 0.8).connect(g).connect(sfxBus);
    }
  },
  miss(t) { sweep(t, 'triangle', 600, 300, 0.12, 0.08); },
  heal(t) {
    [0, 4, 7, 12, 16].forEach((st, i) => {
      const f = 660 * Math.pow(2, st / 12);
      const g = gainNode(0);
      pluckEnv(g.gain, t + i * 0.06, 0.07, 0.5);
      osc('sine', f, t + i * 0.06, t + 1).connect(g).connect(sfxBus);
    });
  },
  spirit(t) {
    [0, 7, 12, 19, 24, 19].forEach((st, i) => {
      const f = 784 * Math.pow(2, st / 12);
      const g = gainNode(0);
      pluckEnv(g.gain, t + i * 0.08, 0.05, 0.9);
      osc('sine', f, t + i * 0.08, t + 1.6).connect(g).connect(sfxBus);
    });
    noiseHit(t, 0.8, 0.03, 'highpass', 8000);
  },
  fire(t) { const g = noiseHit(t, 0.6, 0.25, 'lowpass', 700, 1); sweep(t, 'sawtooth', 80, 160, 0.5, 0.06); return g; },
  bolt(t) {
    for (let i = 0; i < 6; i++) noiseHit(t + i * 0.04 + Math.random() * 0.02, 0.05, 0.25, 'bandpass', 2000 + Math.random() * 3000, 0.8);
    sweep(t, 'square', 1800, 200, 0.25, 0.06);
  },
  turret(t) { for (let i = 0; i < 3; i++) { blip(t + i * 0.07, 300, 0.02, 0.1); noiseHit(t + i * 0.07, 0.05, 0.15, 'highpass', 2500); } },
  build(t) { for (let i = 0; i < 5; i++) blip(t + i * 0.06, 400 + i * 90, 0.03, 0.07); },
  drain(t) { sweep(t, 'sine', 900, 180, 1.2, 0.12); sweep(t, 'triangle', 1350, 270, 1.2, 0.05); },
  hum(t) { sweep(t, 'sine', 110, 108, 0.8, 0.2); },
  laser(t) { sweep(t, 'square', 2400, 600, 0.35, 0.07); noiseHit(t, 0.3, 0.06, 'highpass', 4000); },
  encounter(t) {
    sweep(t, 'sawtooth', 200, 1600, 0.45, 0.08);
    sweep(t + 0.05, 'square', 300, 2400, 0.45, 0.05);
    noiseHit(t, 0.5, 0.1, 'highpass', 3000);
  },
  boss(t) { sweep(t, 'sawtooth', 60, 40, 1.2, 0.3); noiseHit(t, 1.2, 0.2, 'lowpass', 300); SFX.glass(t + 0.3); },
  flee(t) { for (let i = 0; i < 4; i++) noiseHit(t + i * 0.08, 0.06, 0.1, 'bandpass', 800 + i * 300); },
  item(t) { blip(t, 1046, 0.06, 0.07, 'triangle'); blip(t + 0.07, 1568, 0.1, 0.07, 'triangle'); },
  save(t) { [0, 5, 9, 12].forEach((s, i) => blip(t + i * 0.09, 523 * Math.pow(2, s / 12), 0.14, 0.06, 'triangle')); },
  levelup(t) { [0, 4, 7, 12, 7, 12, 16].forEach((s, i) => blip(t + i * 0.07, 523 * Math.pow(2, s / 12), 0.08, 0.06, 'square')); },
  defend(t) { sweep(t, 'triangle', 500, 900, 0.15, 0.08); },
  collapse(t) { sweep(t, 'sine', 300, 60, 0.9, 0.15); },
  flower(t) { [12, 16, 19, 24].forEach((s, i) => { const g = gainNode(0); pluckEnv(g.gain, t + i * 0.12, 0.04, 1.2); osc('sine', 523 * Math.pow(2, s / 12), t + i * 0.12, t + 2).connect(g).connect(sfxBus); }); },
  quake(t) { noiseHit(t, 1.5, 0.3, 'lowpass', 120, 3); sweep(t, 'sine', 50, 30, 1.5, 0.4); },
  engine(t) { sweep(t, 'sawtooth', 45, 70, 1.6, 0.12); sweep(t, 'square', 90, 140, 1.6, 0.04); noiseHit(t, 1.6, 0.12, 'lowpass', 400, 2); },
  pulse(t) { sweep(t, 'sine', 70, 35, 2.5, 0.35); },
  thud(t) { sweep(t, 'sine', 100, 40, 0.25, 0.4); noiseHit(t, 0.12, 0.1, 'lowpass', 500); },
  chime(t) { const g = gainNode(0); pluckEnv(g.gain, t, 0.12, 2.5); osc('sine', 1318, t, t + 3).connect(g).connect(sfxBus); const g2 = gainNode(0); pluckEnv(g2.gain, t, 0.05, 2); osc('sine', 1318 * 2.76, t, t + 3).connect(g2).connect(sfxBus); },
};

export const SFX_NAMES = () => Object.keys(SFX);
export function sfx(name) {
  if (!ctx || ctx.state !== 'running') return;
  const fn = SFX[name];
  if (fn) fn(ctx.currentTime + 0.005);
}

export function audioReady() { return !!ctx && ctx.state === 'running'; }
