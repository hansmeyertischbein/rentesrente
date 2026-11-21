// Lyden i «Overfør»: all lyd lages i nettleseren med Web Audio, uten lydfiler.
// Musikken er en jazzete børsgroove som lages mens du spiller, og hver handling har sin egen lyd.
// Ingenting spilles før du har trykket på siden, slik nettleserne krever.

const NOKKEL = "rr-overfor-lyd";
const STANDARD = { effekter: true, musikk: true, effektVolum: 0.7, musikkVolum: 0.4 };

let valg = { ...STANDARD };
try { valg = { ...STANDARD, ...JSON.parse(localStorage.getItem(NOKKEL) ?? "{}") }; } catch { /* standard */ }

let ctx = null, master, effektBus, musikkBus, romSend, stoyBuffer;
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const tilf = (a, b) => a + Math.random() * (b - a);

export function innstillinger() { return { ...valg }; }
export function endre(ny) {
  valg = { ...valg, ...ny };
  try { localStorage.setItem(NOKKEL, JSON.stringify(valg)); } catch { /* valgfritt */ }
  if (!ctx) return;
  effektBus.gain.setTargetAtTime(valg.effekter ? valg.effektVolum : 0, ctx.currentTime, 0.05);
  musikkBus.gain.setTargetAtTime(valg.musikk ? valg.musikkVolum * 0.5 : 0, ctx.currentTime, 0.3);
  if (valg.musikk) startMusikk(); else stoppMusikk();
}

// ---------- Oppsett ----------

function lagRom(sek = 2.2) {
  const lengde = Math.floor(ctx.sampleRate * sek);
  const buf = ctx.createBuffer(2, lengde, ctx.sampleRate);
  for (let k = 0; k < 2; k++) {
    const d = buf.getChannelData(k);
    for (let i = 0; i < lengde; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / lengde, 3.2);
  }
  const rom = ctx.createConvolver();
  rom.buffer = buf;
  return rom;
}

function start() {
  if (ctx) { if (ctx.state === "suspended") ctx.resume(); return true; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  const komp = ctx.createDynamicsCompressor();
  komp.threshold.value = -16; komp.ratio.value = 4; komp.attack.value = 0.004; komp.release.value = 0.2;
  master = ctx.createGain(); master.gain.value = 0.9;
  komp.connect(master).connect(ctx.destination);
  effektBus = ctx.createGain(); effektBus.gain.value = valg.effekter ? valg.effektVolum : 0; effektBus.connect(komp);
  musikkBus = ctx.createGain(); musikkBus.gain.value = 0; musikkBus.connect(komp);   // tones inn, så første tone ikke smeller
  const rom = lagRom();
  romSend = ctx.createGain(); romSend.gain.value = 0.22;
  romSend.connect(rom).connect(komp);
  stoyBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = stoyBuffer.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  endre({});
  return true;
}

// Lyden låses opp ved første trykk eller tast på siden.
const lasOpp = () => { start(); };
addEventListener("pointerdown", lasOpp, { passive: true });
addEventListener("keydown", lasOpp);
document.addEventListener("visibilitychange", () => {
  if (!ctx) return;
  if (document.hidden) ctx.suspend(); else ctx.resume();
});

// ---------- Byggeklosser ----------

/** En tone med konvolutt: rask opp, så ned. Gir oscillatoren, så den kan kobles videre. */
function tone(f, t0, varighet, { type = "sine", volum = 0.2, angrep = 0.004, til = effektBus, glid = null, rom = 0, filter = null, detune = 0 } = {}) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (glid) o.frequency.exponentialRampToValueAtTime(Math.max(20, glid[0]), t0 + glid[1]);
  o.detune.value = detune;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(volum, t0 + angrep);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + varighet);
  let node = o;
  if (filter) {
    const fl = ctx.createBiquadFilter();
    fl.type = filter.type ?? "lowpass"; fl.frequency.value = filter.f; fl.Q.value = filter.q ?? 0.7;
    if (filter.til) fl.frequency.exponentialRampToValueAtTime(filter.til, t0 + (filter.tid ?? varighet));
    node.connect(fl); node = fl;
  }
  node.connect(g).connect(til);
  if (rom) { const s = ctx.createGain(); s.gain.value = rom; g.connect(s).connect(romSend); }
  o.start(t0); o.stop(t0 + varighet + 0.05);
  return o;
}

/** Støy gjennom et filter: klikk, sus, papir og trommer. */
function stoy(t0, varighet, { type = "bandpass", f = 2000, q = 1, volum = 0.2, til = effektBus, sveip = null, angrep = 0.002, rom = 0 } = {}) {
  const s = ctx.createBufferSource();
  s.buffer = stoyBuffer;
  s.loop = true;
  const fl = ctx.createBiquadFilter();
  fl.type = type; fl.frequency.setValueAtTime(f, t0); fl.Q.value = q;
  if (sveip) fl.frequency.exponentialRampToValueAtTime(sveip, t0 + varighet);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(volum, t0 + angrep);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + varighet);
  s.connect(fl).connect(g).connect(til);
  if (rom) { const r = ctx.createGain(); r.gain.value = rom; g.connect(r).connect(romSend); }
  s.start(t0, Math.random() * 0.5); s.stop(t0 + varighet + 0.05);
}

/** En bjelle: grunntone med uharmoniske overtoner som dør ut i ulikt tempo. */
function bjelle(f, t0, { volum = 0.12, lengde = 1.2, rom = 0.5 } = {}) {
  [[1, 1], [2.76, 0.4], [5.4, 0.18], [8.93, 0.08]].forEach(([g, v]) => tone(f * g, t0, lengde / Math.sqrt(g), { volum: volum * v, angrep: 0.002, rom }));
}

/** Et plukk på en streng: trekant med raskt filter som lukker seg. */
function plukk(f, t0, { volum = 0.14, lengde = 0.6, rom = 0.35, type = "triangle" } = {}) {
  tone(f, t0, lengde, { type, volum, angrep: 0.003, rom, filter: { f: f * 6, til: f * 1.2, tid: lengde * 0.6 } });
  tone(f * 2, t0, lengde * 0.4, { type: "sine", volum: volum * 0.25, angrep: 0.002 });
}

/** Messing: sagtann gjennom et filter som åpner seg, med litt vibrato i lange toner. */
function messing(f, t0, lengde, { volum = 0.08, rom = 0.4 } = {}) {
  for (const d of [-6, 6]) tone(f, t0, lengde, { type: "sawtooth", volum, angrep: 0.03, rom, detune: d, filter: { f: f * 1.5, til: f * 5, tid: 0.08 } });
}

/** Kor: seks svakt forstemte sagtenner gjennom to formantfiltre som gir en «aah». */
function kor(noter, t0, lengde, { volum = 0.035 } = {}) {
  const sum = ctx.createGain(); sum.gain.value = 1;
  const f1 = ctx.createBiquadFilter(); f1.type = "bandpass"; f1.frequency.value = 800; f1.Q.value = 3;
  const f2 = ctx.createBiquadFilter(); f2.type = "bandpass"; f2.frequency.value = 1150; f2.Q.value = 4;
  const ut = ctx.createGain();
  ut.gain.setValueAtTime(0.0001, t0);
  ut.gain.exponentialRampToValueAtTime(1, t0 + lengde * 0.3);
  ut.gain.exponentialRampToValueAtTime(0.0001, t0 + lengde);
  sum.connect(f1).connect(ut); sum.connect(f2).connect(ut);
  ut.connect(effektBus);
  const r = ctx.createGain(); r.gain.value = 0.8; ut.connect(r).connect(romSend);
  for (const n of noter) for (const d of [-9, 0, 9]) {
    const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = hz(n); o.detune.value = d + tilf(-3, 3);
    const g = ctx.createGain(); g.gain.value = volum;
    o.connect(g).connect(sum); o.start(t0); o.stop(t0 + lengde + 0.1);
  }
}

function tromme(t0, { f = 110, volum = 0.5, lengde = 0.35, til = effektBus } = {}) {
  tone(f, t0, lengde, { volum, angrep: 0.002, glid: [f * 0.35, lengde * 0.6], til });
}

// ---------- Lydene ----------

let sisteMynt = 0;
const LYDER = {
  // Overfør: et lite myntklirr. Høyere tone jo raskere du trykker.
  mynt(fart = 1) {
    const t0 = ctx.currentTime;
    if (t0 - sisteMynt < 0.035) return;
    sisteMynt = t0;
    const opp = Math.min(7, Math.round(Math.log2(fart) * 3));
    const f = hz(88 + opp) * tilf(0.985, 1.015);
    tone(f, t0, 0.05, { type: "square", volum: 0.025, filter: { f: 4000 } });
    tone(f * 1.5, t0 + 0.045, 0.22, { type: "sine", volum: 0.09, rom: 0.15 });
    tone(f * 1.5 * 2.76, t0 + 0.045, 0.08, { type: "sine", volum: 0.02 });
    stoy(t0, 0.02, { type: "highpass", f: 6000, volum: 0.04 });
  },
  // Aksje: kassaapparat. Skuffen smeller, bjellen ringer, dypere for de store selskapene.
  aksje(nr = 0) {
    const t0 = ctx.currentTime;
    const ned = Math.min(10, nr) * 0.5;
    stoy(t0, 0.05, { f: 2600, q: 2, volum: 0.18 });
    stoy(t0 + 0.06, 0.04, { f: 3400, q: 3, volum: 0.12 });
    tromme(t0 + 0.05, { f: 140, volum: 0.25, lengde: 0.12 });
    bjelle(hz(96 - ned), t0 + 0.08, { volum: 0.06, lengde: 0.9 });
    bjelle(hz(100 - ned), t0 + 0.1, { volum: 0.05, lengde: 0.9 });
  },
  // Booster: en arpeggio som stiger, med glitter på toppen.
  booster() {
    const t0 = ctx.currentTime;
    [72, 76, 79, 84, 88].forEach((n, i) => tone(hz(n), t0 + i * 0.055, 0.18, { type: "square", volum: 0.05, filter: { f: 3200 }, rom: 0.3 }));
    stoy(t0 + 0.1, 0.45, { type: "highpass", f: 4000, sveip: 12000, volum: 0.05, rom: 0.4 });
    bjelle(hz(100), t0 + 0.28, { volum: 0.05 });
  },
  // Større overføring: to korte toner opp.
  oppgrader() {
    const t0 = ctx.currentTime;
    tone(hz(79), t0, 0.1, { type: "triangle", volum: 0.12 });
    tone(hz(86), t0 + 0.07, 0.2, { type: "triangle", volum: 0.12, rom: 0.2 });
  },
  // Generalforsamling: liten fanfare.
  gf() {
    const t0 = ctx.currentTime;
    [67, 72, 76].forEach((n, i) => messing(hz(n), t0 + i * 0.09, 0.18));
    for (const n of [67, 72, 76, 79]) messing(hz(n), t0 + 0.3, 0.7, { volum: 0.04 });
  },
  // Investering: et sus og et plukk.
  invester() {
    const t0 = ctx.currentTime;
    stoy(t0, 0.35, { f: 400, sveip: 3500, q: 2, volum: 0.1 });
    plukk(hz(81), t0 + 0.25);
  },
  // Gevinst: mynter som renner ned i grisen.
  gevinst() {
    const t0 = ctx.currentTime;
    for (let i = 0; i < 7; i++) {
      const f = hz(88 + [0, 4, 7, 12, 7, 12, 16][i]);
      tone(f, t0 + i * 0.06, 0.25, { volum: 0.07, rom: 0.25 });
      tone(f * 2.76, t0 + i * 0.06, 0.06, { volum: 0.015 });
    }
  },
  // Tap: en trist trombone som synker.
  tap() {
    const t0 = ctx.currentTime;
    [55, 54, 53].forEach((n, i) => messing(hz(n), t0 + i * 0.28, 0.26, { volum: 0.07 }));
    const o = tone(hz(52), t0 + 0.84, 0.8, { type: "sawtooth", volum: 0.07, filter: { f: 900 } });
    const lfo = ctx.createOscillator(); lfo.frequency.value = 6;
    const dybde = ctx.createGain(); dybde.gain.value = 12;
    lfo.connect(dybde).connect(o.detune); lfo.start(t0 + 0.84); lfo.stop(t0 + 1.7);
  },
  // Obligasjon: et stempel i papiret.
  obligasjon() {
    const t0 = ctx.currentTime;
    tromme(t0, { f: 95, volum: 0.35, lengde: 0.16 });
    stoy(t0, 0.08, { type: "lowpass", f: 900, volum: 0.2 });
    stoy(t0 + 0.09, 0.18, { type: "highpass", f: 3000, volum: 0.04 });
    bjelle(hz(84), t0 + 0.12, { volum: 0.03, lengde: 0.6 });
  },
  konkurs() {
    const t0 = ctx.currentTime;
    tromme(t0, { f: 70, volum: 0.45, lengde: 0.6 });
    tone(hz(60), t0 + 0.05, 0.9, { type: "triangle", volum: 0.1, glid: [hz(43), 0.85] });
  },
  // Lotto: kupongen rives av.
  lottoKjop() {
    const t0 = ctx.currentTime;
    for (let i = 0; i < 9; i++) stoy(t0 + i * 0.022, 0.03, { type: "highpass", f: 2500 + i * 200, volum: 0.06 });
    plukk(hz(84), t0 + 0.22, { volum: 0.07 });
  },
  // En lottokule spretter ut.
  lottoKule(n = 0) {
    const t0 = ctx.currentTime;
    tone(hz(76 + [0, 2, 4, 7, 9, 12, 14, 16][n % 8]), t0, 0.18, { volum: 0.1, glid: [hz(70), 0.12], rom: 0.2 });
    stoy(t0, 0.015, { f: 3000, volum: 0.08 });
  },
  lottoGevinst(stor = false) {
    const t0 = ctx.currentTime;
    const noter = stor ? [60, 64, 67, 72, 76, 79, 84] : [72, 76, 79, 84];
    noter.forEach((n, i) => messing(hz(n), t0 + i * 0.08, 0.2, { volum: 0.06 }));
    for (const n of noter.slice(-3)) messing(hz(n), t0 + noter.length * 0.08, stor ? 1.6 : 0.7, { volum: 0.035 });
    if (stor) { kor([60, 64, 67, 72], t0 + 0.3, 2.4); for (let i = 0; i < 12; i++) bjelle(hz(tilf(90, 104)), t0 + 0.4 + i * 0.09, { volum: 0.03 }); }
    else this.gevinst();
  },
  lottoTom() {
    const t0 = ctx.currentTime;
    tone(hz(64), t0, 0.25, { type: "sine", volum: 0.09 });
    tone(hz(59), t0 + 0.18, 0.45, { type: "sine", volum: 0.08, rom: 0.3 });
  },
  // Gudegris: kor og en lyd fra greinen.
  gud(gren = "norron", niva = 1) {
    const t0 = ctx.currentTime;
    const grunn = { norron: 50, romersk: 55, egyptisk: 52, gresk: 57 }[gren] ?? 52;
    kor([grunn + 12, grunn + 19, grunn + 24, grunn + 28], t0 + 0.15, 2.2 + niva * 0.2, { volum: 0.025 + niva * 0.004 });
    if (gren === "norron") {
      tromme(t0, { f: 60, volum: 0.6, lengde: 0.8 });
      for (const n of [grunn, grunn + 7]) messing(hz(n), t0 + 0.1, 1.4, { volum: 0.07 });
    } else if (gren === "romersk") {
      [0, 4, 7, 12].forEach((d, i) => messing(hz(grunn + 12 + d), t0 + i * 0.1, 0.16, { volum: 0.07 }));
      for (const d of [0, 4, 7, 12]) messing(hz(grunn + 12 + d), t0 + 0.45, 1, { volum: 0.035 });
    } else if (gren === "egyptisk") {
      [0, 1, 4, 5, 7, 8, 10, 12].forEach((d, i) => plukk(hz(grunn + 12 + d), t0 + i * 0.07, { volum: 0.08, lengde: 0.9 }));
      bjelle(hz(grunn), t0 + 0.6, { volum: 0.14, lengde: 2.6, rom: 0.8 });
    } else {
      [0, 2, 4, 7, 9, 12, 14].forEach((d, i) => plukk(hz(grunn + 12 + d), t0 + i * 0.06, { volum: 0.08, lengde: 1 }));
      if (niva >= 4) stoy(t0 + 0.5, 1.6, { type: "lowpass", f: 300, sveip: 80, volum: 0.35, rom: 0.6 });
    }
  },
  // Nytt ikon: glitter.
  ikon() {
    const t0 = ctx.currentTime;
    for (let i = 0; i < 7; i++) tone(hz(tilf(92, 108)), t0 + i * 0.045, 0.3, { volum: 0.045, rom: 0.4 });
  },
  strategi() {
    const t0 = ctx.currentTime;
    for (const n of [55, 62, 67, 71]) messing(hz(n), t0, 0.35, { volum: 0.04 });
    for (const n of [60, 64, 67, 72]) messing(hz(n), t0 + 0.32, 0.9, { volum: 0.04 });
  },
  prestisje() {
    const t0 = ctx.currentTime;
    stoy(t0, 1.2, { type: "bandpass", f: 300, sveip: 8000, q: 1.5, volum: 0.12, rom: 0.5 });
    kor([48, 55, 60, 64, 67], t0 + 0.6, 3.5, { volum: 0.04 });
    [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => messing(hz(n), t0 + 0.9 + i * 0.07, 0.25, { volum: 0.05 }));
    bjelle(hz(48), t0 + 1.4, { volum: 0.2, lengde: 3.5, rom: 0.9 });
  },
  // Prestasjon: et lite klokkespill.
  prestasjon() {
    const t0 = ctx.currentTime;
    [84, 88, 91, 96].forEach((n, i) => tone(hz(n), t0 + i * 0.07, 0.5, { type: "triangle", volum: 0.08, rom: 0.35 }));
    bjelle(hz(96), t0 + 0.3, { volum: 0.05, lengde: 1.4 });
  },
  verden() {
    const t0 = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      tone(hz(76), t0 + i * 0.36, 0.17, { type: "triangle", volum: 0.07 });
      tone(hz(72), t0 + i * 0.36 + 0.18, 0.17, { type: "triangle", volum: 0.07 });
    }
  },
  krakk() {
    const t0 = ctx.currentTime;
    tone(900, t0, 1.1, { type: "sawtooth", volum: 0.06, glid: [90, 1], filter: { f: 2500, til: 300 } });
    stoy(t0 + 0.4, 1, { type: "lowpass", f: 250, volum: 0.25, rom: 0.5 });
  },
  tvangssalg() {
    const t0 = ctx.currentTime;
    for (let i = 0; i < 3; i++) tone(110, t0 + i * 0.22, 0.18, { type: "square", volum: 0.06, filter: { f: 700 } });
  },
  feil() {
    const t0 = ctx.currentTime;
    tone(220, t0, 0.14, { type: "sine", volum: 0.12, glid: [150, 0.12] });
    tone(110, t0, 0.12, { type: "triangle", volum: 0.06 });
  },
  apne() {
    const t0 = ctx.currentTime;
    tone(hz(84), t0, 0.06, { volum: 0.05 });
    tone(hz(91), t0 + 0.04, 0.12, { volum: 0.04, rom: 0.2 });
  },
  klikk() {
    const t0 = ctx.currentTime;
    stoy(t0, 0.015, { f: 4000, volum: 0.05 });
    tone(hz(96), t0, 0.04, { volum: 0.025 });
  },
};

/** Spiller en lyd. Ukjente navn og lyd som er slått av, gir ingenting. */
export function spill(navn, ...arg) {
  if (!valg.effekter || !LYDER[navn] || !start()) return;
  try { LYDER[navn](...arg); } catch (e) { console.warn("Lyd", navn, e); }   // lyd er pynt, spillet går videre
}

// ---------- Musikken ----------

// «Børsen åpner»: en tett, jazzete groove som minner om nyhetssendinger fra børsen. 108 slag i minuttet i D dorisk.
// Elpiano med synkoperte akkorder, funky bass og hi-hat som tikker som et kursbånd. Melodien er en kurs:
// den går opp og ned som en aksje i en tilfeldig gang, oftest litt opp, og av og til kommer et lite krakk.
// Hver åttende takt ringer kassaapparatet svakt.
const TEMPO = 108;
const SEKSTENDEL = 60 / TEMPO / 4;
const AKKORDER = [
  { rot: 38, toner: [53, 57, 60, 64] },   // Dm9
  { rot: 43, toner: [53, 57, 59, 62] },   // G9
  { rot: 38, toner: [53, 57, 60, 64] },   // Dm9
  { rot: 43, toner: [53, 57, 59, 64] },   // G13
  { rot: 46, toner: [53, 57, 58, 62] },   // Bbmaj7
  { rot: 48, toner: [52, 55, 58, 62] },   // C9
  { rot: 45, toner: [52, 55, 60, 64] },   // Am7
  { rot: 45, toner: [55, 57, 61, 64] },   // A7
];
// Bassen per sekstendel i takten: hvor mange halvtoner over grunntonen, eller null for pause.
const BASS = [0, null, null, 0, null, null, 12, null, 0, null, 7, 12, null, null, 10, null];
// Elpianoet slår an på disse sekstendelene, synkopert.
const KOMP = { 0: 0.9, 6: 0.55, 10: 0.7, 14: 0.45 };
const KURS = [62, 64, 65, 67, 69, 72, 74, 76, 77, 79, 81, 84];   // D dorisk uten sjetten, fra D4
let spiller = false, neste = 0, steg = 0, kurs = 5, tidtaker = 0;

/** Elpiano: grunntone, en svak oktav som dør raskt og en kort metallisk «tine», med svak tremolo. */
function elpiano(f, t0, lengde, volum) {
  const ut = ctx.createGain();
  ut.gain.value = 1;
  const trem = ctx.createOscillator(); trem.frequency.value = 4.8;
  const dybde = ctx.createGain(); dybde.gain.value = 0.18;
  trem.connect(dybde).connect(ut.gain);
  trem.start(t0); trem.stop(t0 + lengde + 0.1);
  ut.connect(musikkBus);
  const r = ctx.createGain(); r.gain.value = 0.12; ut.connect(r).connect(romSend);
  tone(f, t0, lengde, { type: "sine", volum, angrep: 0.004, til: ut });
  tone(f * 2, t0, lengde * 0.35, { type: "sine", volum: volum * 0.3, angrep: 0.002, til: ut });
  tone(f * 7.02, t0, 0.07, { type: "sine", volum: volum * 0.12, angrep: 0.001, til: ut });
}

/** Kursen: en tone som klinger kort og lyst, som et varsel fra en kursskjerm. */
function kursTone(f, t0, volum) {
  tone(f, t0, 0.28, { type: "sine", volum, angrep: 0.002, til: musikkBus });
  tone(f * 4, t0, 0.05, { type: "sine", volum: volum * 0.15, angrep: 0.001, til: musikkBus });
  tone(f, t0, 0.18, { type: "triangle", volum: volum * 0.3, angrep: 0.002, til: musikkBus, filter: { f: 3000 } });
}

function musikkSteg(t0) {
  const takt = Math.floor(steg / 16);
  const s = steg % 16;
  const a = AKKORDER[takt % AKKORDER.length];
  const ut = musikkBus;

  // Trommer: stortromme på 1 og 3, klapp på 2 og 4, hi-hat på hver sekstendel som et kursbånd.
  if (s === 0 || s === 8 || (s === 11 && takt % 2 === 1)) tromme(t0, { f: 95, volum: 0.2, lengde: 0.2, til: ut });
  if (s === 4 || s === 12) {
    stoy(t0, 0.14, { f: 1700, q: 1.2, volum: 0.1, til: ut });
    stoy(t0 + 0.012, 0.1, { f: 1100, q: 1, volum: 0.05, til: ut });
  }
  const aksent = s % 4 === 2 ? 0.03 : s % 2 === 0 ? 0.016 : 0.01;
  stoy(t0, s === 14 ? 0.16 : 0.025, { type: "highpass", f: 8500, volum: s === 14 ? 0.025 : aksent, til: ut });

  // Bass
  const b = BASS[s];
  if (b !== null) {
    const f = hz(a.rot + b);
    tone(f, t0, SEKSTENDEL * 1.6, { type: "sawtooth", volum: 0.07, angrep: 0.004, til: ut, filter: { f: 1400, til: 380, tid: 0.14, q: 2 } });
    tone(f, t0, SEKSTENDEL * 1.6, { type: "sine", volum: 0.08, angrep: 0.004, til: ut });
  }

  // Elpiano
  if (KOMP[s] !== undefined) for (const n of a.toner) elpiano(hz(n), t0, s === 0 ? 0.9 : 0.4, 0.085 * KOMP[s]);

  // Kursen går på åttendeler i annenhver firetakt, som spørsmål og svar.
  if (Math.floor(takt / 2) % 2 === 1 && s % 2 === 0 && Math.random() < 0.7) {
    const krakk = Math.random() < 0.06;
    kurs += krakk ? -3 : Math.random() < 0.58 ? 1 : -1;
    if (kurs >= KURS.length) kurs = KURS.length - 4;   // toppen nådd: gevinst tas hjem
    kurs = Math.max(0, kurs);
    kursTone(hz(KURS[kurs]), t0, 0.1);
  }

  // Kassaapparatet ringer svakt hver åttende takt.
  if (s === 0 && takt % 8 === 0 && takt > 0) {
    stoy(t0, 0.04, { f: 2800, q: 2, volum: 0.05, til: ut });
    for (const n of [93, 97, 100]) tone(hz(n), t0 + 0.03, 0.7, { type: "sine", volum: 0.018, til: ut });
  }
  steg++;
}

function planlegg() {
  if (!spiller || !ctx) return;
  while (neste < ctx.currentTime + 0.15) {
    musikkSteg(Math.max(neste, ctx.currentTime + 0.01));
    neste += SEKSTENDEL;
  }
}

export function startMusikk() {
  if (spiller || !valg.musikk || !start()) return;
  spiller = true;
  neste = ctx.currentTime + 0.1;
  steg = 0;
  tidtaker = setInterval(planlegg, 30);
}

export function stoppMusikk() {
  spiller = false;
  clearInterval(tidtaker);
}

// Musikken starter ved første trykk når den er slått på.
addEventListener("pointerdown", () => { if (valg.musikk) startMusikk(); }, { passive: true, once: true });
