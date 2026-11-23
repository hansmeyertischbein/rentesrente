// Lyden i Ordjakt: en fanfare laget i nettleseren med Web Audio, uten lydfiler.
let ctx = null, ut = null, paa = true;
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

// Kalles fra et trykk, slik nettleserne krever før lyd kan spilles.
export function lasOpp() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (!ctx) {
    ctx = new AC();
    const komp = ctx.createDynamicsCompressor();
    komp.threshold.value = -18; komp.ratio.value = 4;
    ut = ctx.createGain(); ut.gain.value = paa ? 0.5 : 0;
    ut.connect(komp).connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
}

export function settLyd(ny) {
  paa = ny;
  if (ut) ut.gain.setTargetAtTime(paa ? 0.5 : 0, ctx.currentTime, 0.03);
}

// Messing: to sagtenner litt ute av stemming gjennom et filter som åpner seg i anslaget.
function messing(midi, t, varighet, styrke) {
  const g = ctx.createGain(), f = ctx.createBiquadFilter();
  f.type = "lowpass"; f.Q.value = 1;
  f.frequency.setValueAtTime(500, t);
  f.frequency.linearRampToValueAtTime(3200, t + 0.05);
  f.frequency.exponentialRampToValueAtTime(1500, t + varighet);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(styrke, t + 0.025);
  g.gain.setValueAtTime(styrke * 0.85, t + varighet * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t + varighet);
  for (const cent of [-6, 6]) {
    const o = ctx.createOscillator();
    o.type = "sawtooth"; o.frequency.value = hz(midi); o.detune.value = cent;
    o.connect(f); o.start(t); o.stop(t + varighet + 0.05);
  }
  f.connect(g).connect(ut);
}

function pauke(midi, t) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(hz(midi) * 1.5, t);
  o.frequency.exponentialRampToValueAtTime(hz(midi), t + 0.08);
  g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  o.connect(g).connect(ut); o.start(t); o.stop(t + 0.65);
}

// [tid, varighet, toner]: tre korte støt, et løft og en lang durakkord.
export const FANFARE = [
  [0, 0.14, [67, 62, 59]], [0.16, 0.14, [67, 62, 59]], [0.32, 0.14, [67, 62, 59]],
  [0.48, 0.42, [72, 67, 64]], [0.94, 0.28, [69, 65, 60]], [1.24, 0.28, [71, 67, 62]],
  [1.54, 1.7, [76, 72, 67, 60]],
];

export function spillFanfare() {
  if (!ctx || !paa) return;
  const t0 = ctx.currentTime + 0.05;
  for (const [t, varighet, toner] of FANFARE) for (const n of toner) messing(n, t0 + t, varighet, 0.11);
  for (const [t, n] of [[0, 43], [0.48, 48], [1.54, 48], [1.72, 43], [1.9, 48]]) pauke(n, t0 + t);
}

let stoy = null;
function stoyLyd(t, varighet, styrke, type, fra, til) {
  if (!stoy) {
    stoy = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = stoy.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const k = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  k.buffer = stoy; f.type = type;
  f.frequency.setValueAtTime(fra, t); f.frequency.exponentialRampToValueAtTime(til, t + varighet);
  g.gain.setValueAtTime(styrke, t); g.gain.exponentialRampToValueAtTime(0.0001, t + varighet);
  k.connect(f).connect(g).connect(ut); k.start(t, Math.random() * 0.2, varighet + 0.05);
}
function dunk(t, fra, til, varighet, styrke) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(fra, t); o.frequency.exponentialRampToValueAtTime(til, t + varighet);
  g.gain.setValueAtTime(styrke, t); g.gain.exponentialRampToValueAtTime(0.0001, t + varighet);
  o.connect(g).connect(ut); o.start(t); o.stop(t + varighet + 0.05);
}
const klar = () => ctx && paa;

// Kanonen: et dypt smell med krutt i.
export function spillSkudd() {
  if (!klar()) return;
  const t = ctx.currentTime;
  dunk(t, 170, 38, 0.35, 0.9);
  stoyLyd(t, 0.4, 0.6, "lowpass", 2600, 180);
}
// Treff i borgen: smell og steiner som raser.
export function spillTreff() {
  if (!klar()) return;
  const t = ctx.currentTime;
  dunk(t, 110, 45, 0.22, 0.7);
  stoyLyd(t, 0.3, 0.6, "bandpass", 1400, 400);
  for (let i = 0; i < 6; i++) stoyLyd(t + 0.12 + i * 0.07 + Math.random() * 0.04, 0.07, 0.28, "bandpass", 700 + Math.random() * 1100, 350);
}
// Bom: kula plasker i havet.
export function spillPlask() {
  if (!klar()) return;
  const t = ctx.currentTime;
  stoyLyd(t, 0.5, 0.4, "bandpass", 900, 3200);
  dunk(t + 0.08, 260, 620, 0.16, 0.18);
}
