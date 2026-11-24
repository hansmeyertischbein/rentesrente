// Grisevakta: et tårnforsvar der regninger og gebyrer er på vei mot sparegrisen. Rene regler på et brett på 640 × 420.
// Tårnene settes hvor som helst utenfor veien. Hvert tårn har tre veier å oppgradere, og du kan høyst ta én vei til 4 og én til 2.
// Tilstanden endres på stedet for fart, siden det kan være mange på brettet samtidig.

export const FLATE = Object.freeze({ b: 640, h: 420 });
const frys = (o) => { for (const v of Object.values(o)) if (v && typeof v === "object") frys(v); return Object.freeze(o); };

// ---------- Fiendene ----------

export const FIENDER = frys({
  regning: { navn: "Regning", tekst: "Helt vanlig, men det er mange av dem.", liv: 15, fart: 44, lonn: 7, skade: 1, stor: 12, pris: 1 },
  gebyr: { navn: "Gebyr", tekst: "Lite og raskt.", liv: 9, fart: 92, lonn: 5, skade: 1, stor: 9, pris: 1 },
  purring: { navn: "Purring", tekst: "Panser: hvert treff gjør 3 mindre skade.", liv: 36, fart: 38, lonn: 10, skade: 1, stor: 13, panser: 3, pris: 2.6 },
  skjult: { navn: "Skjult avgift", tekst: "Synes bare for tårn med blikk.", liv: 24, fart: 54, lonn: 11, skade: 2, stor: 11, skjult: true, pris: 2.4 },
  luft: { navn: "Luftslott", tekst: "Flyr rett mot grisen. Hvelvkanonen når det ikke.", liv: 40, fart: 36, lonn: 12, skade: 2, stor: 15, flyr: true, pris: 3 },
  abo: { navn: "Abonnement", tekst: "Blir til tre gebyrer når det stoppes.", liv: 52, fart: 40, lonn: 9, skade: 2, stor: 14, deler: ["gebyr", 3], pris: 4 },
  laan: { navn: "Forbrukslån", tekst: "Renten løper: får mer liv hele tiden.", liv: 70, fart: 30, lonn: 17, skade: 3, stor: 16, vekst: 0.055, pris: 4.6 },
  selger: { navn: "Telefonselger", tekst: "Gir de rundt seg nytt liv.", liv: 84, fart: 36, lonn: 18, skade: 2, stor: 14, helbred: 8, pris: 5.4 },
  svindler: { navn: "Svindler", tekst: "Kan ikke bremses, og spurter når den blir truffet.", liv: 64, fart: 46, lonn: 16, skade: 3, stor: 13, immun: true, spurt: 1.9, pris: 5 },
  inkasso: { navn: "Inkasso", tekst: "Sjef: tykt panser, og sender ut gebyrer.", liv: 420, fart: 23, lonn: 110, skade: 6, stor: 24, panser: 3, sender: ["gebyr", 2, 4.5], sjef: true, pris: 40 },
  krakk: { navn: "Krakket", tekst: "Sjef: lammer tårnene i nærheten.", liv: 1500, fart: 19, lonn: 200, skade: 20, stor: 30, panser: 4, lammer: [130, 5.5, 1.8], sjef: true, pris: 110 },
});

// ---------- Tårnene ----------

const g = (navn, tekst, pris, gjor) => ({ navn, tekst, pris, gjor });
export const TARN = frys({
  mynt: {
    navn: "Myntkaster", tekst: "Kaster mynter raskt på én om gangen.", pris: 60, farge: ["#ffd84a", "#b87a10"],
    basis: { skade: 5, rekke: 104, takt: 1.35, antall: 1 },
    veier: [
      { navn: "Kraft", trinn: [g("Blanke mynter", "+3 skade", 45, (s) => { s.skade += 3; }), g("Tunge mynter", "+4 skade, bryter panser", 95, (s) => { s.skade += 4; s.bryter = true; }), g("Gullmynter", "Dobbel skade", 260, (s) => { s.skade *= 2; }), g("Kongens mynt", "Dobbel skade, fire ganger mot sjefer", 620, (s) => { s.skade *= 2; s.sjefG = 2; })] },
      { navn: "Fart", trinn: [g("Løs arm", "30 % raskere", 45, (s) => { s.takt *= 1.3; }), g("Myntsekk", "35 % raskere", 90, (s) => { s.takt *= 1.35; }), g("Tre på en gang", "Kaster på tre samtidig", 280, (s) => { s.antall = 3; }), g("Myntstorm", "Dobbelt så raskt", 640, (s) => { s.takt *= 2; })] },
      { navn: "Blikk", trinn: [g("Briller", "Ser skjulte avgifter", 40, (s) => { s.ser = true; }), g("Kikkert", "30 % lengre rekkevidde", 70, (s) => { s.rekke *= 1.3; }), g("Merkepenn", "Merkede får 30 % mer skade av alle", 240, (s) => { s.merke = 1.3; }), g("Skarpt øye", "Hvert fjerde treff gjør fem ganger skaden", 560, (s) => { s.krit = 0.25; s.kritG = 5; })] },
    ],
  },
  frys: {
    navn: "Sparefrys", tekst: "Bremser alle rundt seg.", pris: 70, farge: ["#9fdcf5", "#2f7fa8"],
    basis: { skade: 2, rekke: 88, takt: 0.85, omrade: true, brems: 0.6, bremsSek: 1.3 },
    veier: [
      { navn: "Kulde", trinn: [g("Kaldere", "Bremser mer", 50, (s) => { s.brems = 0.48; }), g("Dypfrys", "Bremser lenger", 85, (s) => { s.bremsSek += 0.9; }), g("Isblokk", "Stopper alle et lite øyeblikk", 290, (s) => { s.stopp = 0.4; }), g("Istid", "Stopper alle dobbelt så lenge", 640, (s) => { s.stopp = 0.8; })] },
      { navn: "Frostbrann", trinn: [g("Istapper", "+4 skade", 55, (s) => { s.skade += 4; }), g("Frostbrann", "8 skade i sekundet i tre sekunder", 105, (s) => { s.gift = 8; s.giftSek = 3; }), g("Blåis", "Tre ganger så sterk frostbrann, bryter panser", 280, (s) => { s.gift = 24; s.bryter = true; }), g("Absolutt null", "Tre ganger så sterk igjen", 660, (s) => { s.gift = 72; s.skade += 8; })] },
      { navn: "Vinter", trinn: [g("Vifte", "25 % lengre rekkevidde", 45, (s) => { s.rekke *= 1.25; }), g("Snøfokk", "Ser skjulte, 35 % raskere", 95, (s) => { s.ser = true; s.takt *= 1.35; }), g("Sprø is", "De som bremses, får 25 % mer skade", 260, (s) => { s.merke = 1.25; }), g("Polarnatt", "Halvannen rekkevidde, bremser også svindlere", 560, (s) => { s.rekke *= 1.5; s.bryterImmun = true; })] },
    ],
  },
  rente: {
    navn: "Rentetårn", tekst: "Blir sterkere for hver bølge det står.", pris: 90, farge: ["#8fd18a", "#2f8a46"],
    basis: { skade: 6, rekke: 98, takt: 1.15, antall: 1, strale: true, vekst: 0.06 },
    veier: [
      { navn: "Renters rente", trinn: [g("Bedre rente", "9 % per bølge", 60, (s) => { s.vekst = 0.09; }), g("Lang horisont", "13 % per bølge, bryter panser", 120, (s) => { s.vekst = 0.13; s.bryter = true; }), g("Snøball", "18 % per bølge", 300, (s) => { s.vekst = 0.18; }), g("Tidens kraft", "26 % per bølge", 650, (s) => { s.vekst = 0.26; })] },
      { navn: "Utbytte", trinn: [g("Småutbytte", "18 kr etter hver bølge", 80, (s) => { s.utbytte = 18; }), g("Kvartalsutbytte", "45 kr etter hver bølge", 170, (s) => { s.utbytte = 45; }), g("Storutbytte", "110 kr etter hver bølge", 420, (s) => { s.utbytte = 110; }), g("Hovedaksjonær", "260 kr etter hver bølge", 980, (s) => { s.utbytte = 260; })] },
      { navn: "Nettverk", trinn: [g("To i strøm", "Strålen hopper til én til", 60, (s) => { s.kjede = 1; }), g("Antenne", "Ser skjulte, 20 % lengre rekkevidde", 90, (s) => { s.ser = true; s.rekke *= 1.2; }), g("Nettverk", "Strålen hopper til fire til", 290, (s) => { s.kjede = 4; }), g("Høyspent", "Dobbel skade, hopper til åtte", 640, (s) => { s.kjede = 8; s.skade *= 2; })] },
    ],
  },
  kanon: {
    navn: "Hvelvkanon", tekst: "Sprenger mange på en gang. Når ikke det som flyr.", pris: 110, farge: ["#8b97a6", "#3c4756"],
    basis: { skade: 15, rekke: 118, takt: 0.5, antall: 1, sprut: 42, bakke: true },
    veier: [
      { navn: "Sprengkraft", trinn: [g("Tyngre kuler", "+9 skade", 70, (s) => { s.skade += 9; }), g("Større smell", "Treffer bredere", 120, (s) => { s.sprut += 18; }), g("Bankboks", "Dobbel skade, bryter panser", 320, (s) => { s.skade *= 2; s.bryter = true; }), g("Hele hvelvet", "Dobbel skade, enda bredere", 760, (s) => { s.skade *= 2; s.sprut += 24; })] },
      { navn: "Ladning", trinn: [g("Rask lunte", "30 % raskere", 65, (s) => { s.takt *= 1.3; }), g("To menn", "35 % raskere", 115, (s) => { s.takt *= 1.35; }), g("Dobbelt løp", "Skyter på to", 320, (s) => { s.antall = 2; }), g("Batteri", "Skyter på fire", 720, (s) => { s.antall = 4; })] },
      { navn: "Sikte", trinn: [g("Lengre løp", "25 % lengre rekkevidde", 55, (s) => { s.rekke *= 1.25; }), g("Luftvern", "Når det som flyr, og ser skjulte", 110, (s) => { s.bakke = false; s.ser = true; }), g("Rekyl", "Dytter dem bakover", 280, (s) => { s.dytt = 20; }), g("Sjokkbølge", "Lammer alle som treffes", 600, (s) => { s.stopp = 0.7; })] },
    ],
  },
});
export const SALG = 0.75;   // av det du har brukt på tårnet

/** Kan veien tas ett trinn til? Høyst to veier i bruk, og bare én av dem forbi trinn 2. */
export function kanOppgradere(t, vei) {
  const n = [...t.niva];
  if (!(n[vei] < 4)) return false;
  n[vei]++;
  return n.filter((x) => x > 0).length <= 2 && n.filter((x) => x > 2).length <= 1;
}
export function egenskaper(type, niva) {
  const s = { ...TARN[type].basis };
  TARN[type].veier.forEach((v, i) => { for (let k = 0; k < niva[i]; k++) v.trinn[k].gjor(s); });
  return s;
}
export const prisOpp = (t, vei) => (kanOppgradere(t, vei) ? TARN[t.type].veier[vei].trinn[t.niva[vei]].pris : Infinity);
export const salgspris = (t) => Math.floor(t.brukt * SALG);
export const tarnSkade = (t) => t.s.skade * Math.pow(1 + (t.s.vekst ?? 0), Math.min(20, t.bolger));

// ---------- Brettene ----------

const BRETT = frys([
  { sti: [[-20, 90], [170, 90], [170, 260], [330, 260], [330, 110], [490, 110], [490, 330], [590, 330]] },
  { sti: [[-20, 340], [110, 340], [110, 110], [280, 110], [280, 310], [440, 310], [440, 90], [590, 90]] },
  { sti: [[90, -20], [90, 190], [250, 190], [250, 70], [430, 70], [430, 230], [190, 330], [590, 350]] },
  { sti: [[-20, 210], [130, 210], [130, 70], [510, 70], [510, 210], [300, 210], [300, 350], [590, 350]] },
  { sti: [[-20, 70], [540, 70], [540, 170], [90, 170], [90, 270], [540, 270], [540, 365], [330, 365]] },
]);
export const VAKT_NIVA = frys([
  { bolger: 12, styrke: 0.85, penger: 300, liv: 15 },
  { bolger: 15, styrke: 0.95, penger: 310, liv: 12 },
  { bolger: 18, styrke: 1, penger: 330, liv: 10 },
  { bolger: 21, styrke: 1.03, penger: 360, liv: 10 },
  { bolger: 25, styrke: 0.96, penger: 420, liv: 10 },
]);
export const brett = (niva) => BRETT[niva - 1];
const STREKK = BRETT.map(({ sti }) => {
  let sum = 0;
  const deler = sti.slice(1).map((b, i) => { const a = sti[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); sum += l; return { a, b, l }; });
  return { deler, lengde: sum, rett: Math.hypot(sti.at(-1)[0] - sti[0][0], sti.at(-1)[1] - sti[0][1]) };
});
/** Punktet så langt ute på stien. Det som flyr, tar rett linje. */
export function paaSti(niva, d, flyr = false) {
  const { deler, rett } = STREKK[niva - 1], sti = BRETT[niva - 1].sti;
  if (flyr) { const a = sti[0], b = sti.at(-1), k = Math.min(1, d / rett); return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; }
  for (const { a, b, l } of deler) { if (d <= l) return [a[0] + ((b[0] - a[0]) * d) / l, a[1] + ((b[1] - a[1]) * d) / l]; d -= l; }
  return deler.at(-1).b;
}
export const lengdeFor = (niva, type) => (FIENDER[type].flyr ? STREKK[niva - 1].rett : STREKK[niva - 1].lengde);
function tilSti(niva, x, y) {
  let best = Infinity;
  for (const { a, b, l } of STREKK[niva - 1].deler) { const u = Math.max(0, Math.min(1, ((x - a[0]) * (b[0] - a[0]) + (y - a[1]) * (b[1] - a[1])) / (l * l))); best = Math.min(best, Math.hypot(x - a[0] - (b[0] - a[0]) * u, y - a[1] - (b[1] - a[1]) * u)); }
  return best;
}
export function kanStaa(s, x, y) {
  const [gx, gy] = brett(s.niva).sti.at(-1);
  return x > 20 && y > 24 && x < FLATE.b - 20 && y < FLATE.h - 16 && tilSti(s.niva, x, y) >= 37 && Math.hypot(x - gx, y - gy) > 52 && s.tarn.every((t) => Math.hypot(t.x - x, t.y - y) >= 36);
}

// ---------- Bølgene ----------

const APNES = frys({ regning: 1, gebyr: 2, purring: 4, abo: 5, skjult: 6, luft: 8, laan: 9, selger: 10, svindler: 11 });
/** Hvem som kommer i en bølge, i grupper: { type, antall, mellom }. Lik hver gang, så du kan lære den. */
export function bolge(niva, nr) {
  const { bolger } = VAKT_NIVA[niva - 1], tidlig = Math.floor(niva / 3);
  const mulige = Object.keys(APNES).filter((t) => nr + tidlig >= APNES[t]);
  const budsjett = 5.5 + 1.8 * nr + 0.11 * nr * nr;
  let fro = (niva * 7919 + nr * 104729) % 2147483647;
  const rng = () => { fro = (fro * 16807) % 2147483647; return fro / 2147483647; };
  const ut = [], legg = (type, del) => {
    const antall = Math.max(1, Math.round((budsjett * del) / FIENDER[type].pris));
    ut.push({ type, antall, mellom: Math.max(0.24, (type === "gebyr" ? 0.42 : FIENDER[type].pris > 3 ? 1.1 : 0.8) * (1 - 0.018 * nr)) });
  };
  const egne = mulige.slice(2), velg = () => egne[Math.floor(rng() * egne.length)], nyest = mulige.at(-1);
  if (nr === bolger) ut.push({ type: niva >= 3 ? "krakk" : "inkasso", antall: niva === 2 ? 2 : 1, mellom: 9 });
  if (nr === bolger && niva === 5) ut.push({ type: "inkasso", antall: 3, mellom: 4 });
  else if (nr % 7 === 0) ut.push({ type: "inkasso", antall: Math.max(1, Math.floor(nr / 11)), mellom: 6 });
  legg(rng() < 0.5 || nr < 2 ? "regning" : "gebyr", egne.length ? 0.35 : 0.6);
  if (egne.length) { legg(APNES[nyest] === nr + tidlig ? nyest : velg(), 0.35); legg(velg(), 0.2); }
  legg(nr > 1 && rng() < 0.6 ? "gebyr" : "regning", egne.length ? 0.2 : 0.4);
  return ut;
}
export const livFor = (niva, nr, type) => FIENDER[type].liv * VAKT_NIVA[niva - 1].styrke * (1 + 0.05 * (nr - 1) + 0.0085 * (nr - 1) ** 2);

// ---------- Spillet ----------

export const PAUSE = Object.freeze({ forst: 14, mellom: 4, lengst: 22 });
export function lagVakt(niva) {
  const n = VAKT_NIVA[niva - 1];
  return { niva, penger: n.penger, liv: n.liv, maksLiv: n.liv, bolge: 0, ko: [], nesteOm: 0, pause: PAUSE.forst, siden: 0, fiender: [], tarn: [], skudd: [], teller: 0, tid: 0, ferdig: null };
}
export function byggTarn(s, type, x, y) {
  const t = TARN[type];
  if (!t || s.ferdig || s.penger < t.pris || !kanStaa(s, x, y)) return null;
  s.penger -= t.pris;
  const ny = { id: ++s.teller, type, x, y, niva: [0, 0, 0], s: egenskaper(type, [0, 0, 0]), brukt: t.pris, bolger: 0, klar: 0.2, lam: 0, vinkel: -Math.PI / 2, sikte: "forst", stoppet: 0 };
  s.tarn.push(ny);
  return ny;
}
export function oppgrader(s, id, vei) {
  const t = s.tarn.find((x) => x.id === id), pris = t ? prisOpp(t, vei) : Infinity;
  if (!t || s.ferdig || pris > s.penger) return false;
  s.penger -= pris; t.brukt += pris; t.niva[vei]++; t.s = egenskaper(t.type, t.niva);
  return true;
}
export function selg(s, id) {
  const i = s.tarn.findIndex((x) => x.id === id);
  if (i < 0 || s.ferdig) return 0;
  const kr = salgspris(s.tarn[i]);
  s.penger += kr;
  s.tarn.splice(i, 1);
  return kr;
}
export const SIKTER = Object.freeze({ forst: "Første", sist: "Siste", sterkest: "Sterkeste" });
export function byttSikte(t) { const k = Object.keys(SIKTER); t.sikte = k[(k.indexOf(t.sikte) + 1) % k.length]; }

/** Sender neste bølge med en gang. Gir litt ekstra for hvert sekund du sparer. */
export function nesteNa(s) {
  if (s.ferdig || s.ko.length || s.bolge >= VAKT_NIVA[s.niva - 1].bolger || !(s.pause > 0)) return 0;
  const bonus = s.bolge > 0 ? Math.ceil(s.pause * 2) : 0;
  s.penger += bonus;
  start(s);
  return bonus;
}
function start(s) {
  s.bolge++; s.pause = 0; s.siden = 0; s.nesteOm = 0;
  s.ko = bolge(s.niva, s.bolge).map((k) => ({ ...k }));
  for (const t of s.tarn) t.bolger++;
}
function fiende(s, type, d, nr = s.bolge) {
  const maks = livFor(s.niva, nr, type);
  s.fiender.push({ id: ++s.teller, type, liv: maks, maks, d, p: paaSti(s.niva, d, FIENDER[type].flyr), brems: 1, bremset: 0, stopp: 0, gift: 0, giftSek: 0, merke: 1, merket: 0, spurt: 0, ur: 0, tr: 0 });
}
function skad(s, f, skade, e, hendelser) {
  const F = FIENDER[f.type];
  let k = skade * (f.merket > 0 ? f.merke : 1) * (F.sjef ? e.sjefG ?? 1 : 1), krit = false;
  if (e.krit && hendelser.rng() < e.krit) { k *= e.kritG; krit = true; }
  if (F.panser && !e.bryter) k = Math.max(k * 0.15, k - F.panser);
  f.liv -= k; f.tr = 0.12;
  if (F.spurt) f.spurt = 0.8;
  if (e.merke) { f.merke = Math.max(f.merket > 0 ? f.merke : 1, e.merke); f.merket = 2.5; }
  if (e.brems && (!F.immun || e.bryterImmun)) { f.brems = f.bremset > 0 ? Math.min(f.brems, e.brems) : e.brems; f.bremset = Math.max(f.bremset, e.bremsSek); }
  if (e.stopp && (!F.immun || e.bryterImmun)) f.stopp = Math.max(f.stopp, F.sjef ? e.stopp * 0.25 : e.stopp);
  if (e.gift) { f.gift = Math.max(f.giftSek > 0 ? f.gift : 0, e.gift); f.giftSek = e.giftSek; }
  if (e.dytt && !F.sjef && !F.flyr) f.d = Math.max(0, f.d - e.dytt);
  if (k >= 1) hendelser.push({ type: "treff", p: f.p, skade: Math.round(k), krit });
}
const sikt = { forst: (a, b) => b.igjen - a.igjen, sist: (a, b) => a.igjen - b.igjen, sterkest: (a, b) => b.f.liv - a.f.liv };
export function maal(s, t, rekke = t.s.rekke) {
  const ut = [];
  for (const f of s.fiender) {
    const F = FIENDER[f.type];
    if (f.liv <= 0 || (F.skjult && !t.s.ser) || (F.flyr && t.s.bakke)) continue;
    const a = Math.hypot(f.p[0] - t.x, f.p[1] - t.y);
    if (a <= rekke) ut.push({ f, a, igjen: -(lengdeFor(s.niva, f.type) - f.d) });
  }
  return ut.sort(sikt[t.sikte]);
}

/** Et steg i tiden. Endrer s og gir hendelser til lyd og bilde. */
export function vaktSteg(s, dt, rng = Math.random) {
  const ut = [];
  ut.rng = rng;
  if (s.ferdig) return ut;
  const { bolger } = VAKT_NIVA[s.niva - 1];
  s.tid += dt;
  // Bølgene kommer av seg selv
  if (s.ko.length) {
    s.nesteOm -= dt;
    while (s.ko.length && s.nesteOm <= 0) {
      const k = s.ko[0];
      fiende(s, k.type, 0);
      if (FIENDER[k.type].sjef) ut.push({ type: "sjef", navn: FIENDER[k.type].navn });
      s.nesteOm += k.mellom;
      if (--k.antall <= 0) { s.ko.shift(); s.nesteOm += 0.9; if (!s.ko.length) { s.siden = 0; s.pause = s.bolge < bolger ? PAUSE.lengst : 0; } }
    }
  } else if (s.bolge < bolger) {
    if (s.bolge > 0 && !s.fiender.length && s.pause > PAUSE.mellom) {
      s.pause = PAUSE.mellom;
      let kr = 26 + 5 * s.bolge;
      for (const t of s.tarn) if (t.s.utbytte) { kr += t.s.utbytte; ut.push({ type: "utbytte", p: [t.x, t.y], kr: t.s.utbytte }); }
      s.penger += kr;
      ut.push({ type: "bolgeKlar", kr });
    }
    s.pause -= dt;
    if (s.pause <= 0) { start(s); ut.push({ type: "bolge", nr: s.bolge }); }
  }
  // Fiendene
  for (const f of s.fiender) {
    const F = FIENDER[f.type];
    f.bremset -= dt; f.merket -= dt; f.spurt -= dt; f.tr -= dt;
    if (f.giftSek > 0) { f.giftSek -= dt; f.liv -= f.gift * dt * (f.merket > 0 ? f.merke : 1); }
    if (F.vekst) { const k = f.maks * F.vekst * dt; f.maks += k * 0.6; f.liv = Math.min(f.maks, f.liv + k); }
    f.ur += dt;
    if (F.helbred && f.ur > 1) { f.ur = 0; for (const n of s.fiender) if (n !== f && n.liv > 0 && Math.hypot(n.p[0] - f.p[0], n.p[1] - f.p[1]) < 70 && n.liv < n.maks) n.liv = Math.min(n.maks, n.liv + F.helbred * (f.maks / F.liv)); ut.push({ type: "helbred", p: f.p }); }
    if (F.sender && f.ur > F.sender[2]) { f.ur = 0; for (let k = 0; k < F.sender[1]; k++) fiende(s, F.sender[0], Math.max(0, f.d - 14 * k)); }
    if (F.lammer && f.ur > F.lammer[1]) { f.ur = 0; for (const t of s.tarn) if (Math.hypot(t.x - f.p[0], t.y - f.p[1]) < F.lammer[0]) t.lam = F.lammer[2]; ut.push({ type: "lammer", p: f.p, r: F.lammer[0] }); }
    if (f.stopp > 0) { f.stopp -= dt; continue; }
    f.d += F.fart * (f.bremset > 0 ? f.brems : 1) * (f.spurt > 0 ? F.spurt : 1) * dt;
    f.p = paaSti(s.niva, f.d, F.flyr);
  }
  // Tårnene
  for (const t of s.tarn) {
    t.klar -= dt; t.stoppet -= dt;
    if (t.lam > 0) { t.lam -= dt; continue; }
    if (t.klar > 0) continue;
    const m = maal(s, t);
    if (!m.length) continue;
    t.klar = 1 / t.s.takt; t.stoppet = 0.16;
    const e = t.s, skade = tarnSkade(t);
    ut.push({ type: "skudd", tarn: t.type, p: [t.x, t.y], id: t.id });
    if (e.omrade) { for (const { f } of m) skad(s, f, skade, e, ut); ut.push({ type: "ring", p: [t.x, t.y], r: e.rekke, farge: e.gift ? 1 : 0 }); continue; }
    t.vinkel = Math.atan2(m[0].f.p[1] - t.y, m[0].f.p[0] - t.x);
    if (e.strale) {
      const punkter = [[t.x, t.y - 22]], tatt = new Set();
      let f = m[0].f;
      for (let k = 0; f && k <= (e.kjede ?? 0); k++) {
        tatt.add(f); punkter.push([...f.p]);
        skad(s, f, skade * Math.pow(0.85, k), e, ut);
        let best = null, bd = 95;
        for (const n of s.fiender) { if (n.liv <= 0 || tatt.has(n) || (FIENDER[n.type].skjult && !e.ser)) continue; const a = Math.hypot(n.p[0] - f.p[0], n.p[1] - f.p[1]); if (a < bd) { bd = a; best = n; } }
        f = best;
      }
      ut.push({ type: "strale", punkter });
      continue;
    }
    for (const { f } of m.slice(0, e.antall)) s.skudd.push({ type: t.type, x: t.x, y: t.y - 20, mal: f, til: [...f.p], fart: e.sprut ? 300 : 430, skade, e, z: e.sprut ? 1 : 0, fra: [t.x, t.y - 20], stor: 1 + 0.25 * t.niva[0] });
  }
  // Skuddene er på vei
  s.skudd = s.skudd.filter((k) => {
    if (k.mal.liv > 0 && s.fiender.includes(k.mal)) k.til = [...k.mal.p];
    const dx = k.til[0] - k.x, dy = k.til[1] - k.y, a = Math.hypot(dx, dy), gang = k.fart * dt;
    if (a > gang) { k.x += (dx / a) * gang; k.y += (dy / a) * gang; return true; }
    if (k.e.sprut) {
      for (const f of s.fiender) if (f.liv > 0 && !(FIENDER[f.type].flyr && k.e.bakke)) { const r = Math.hypot(f.p[0] - k.til[0], f.p[1] - k.til[1]); if (r <= k.e.sprut) skad(s, f, k.skade * (1 - 0.45 * (r / k.e.sprut)), k.e, ut); }
      ut.push({ type: "smell", p: k.til, r: k.e.sprut });
    } else if (k.mal.liv > 0) skad(s, k.mal, k.skade, k.e, ut);
    return false;
  });
  // Hvem er ute?
  const igjen = [], nye = [];
  for (const f of s.fiender) {
    const F = FIENDER[f.type];
    if (f.liv <= 0) { s.penger += F.lonn; ut.push({ type: "dod", p: f.p, fiende: f.type, kr: F.lonn }); if (F.deler) for (let k = 0; k < F.deler[1]; k++) nye.push([F.deler[0], Math.max(0, f.d - 10 * k)]); }
    else if (f.d >= lengdeFor(s.niva, f.type)) { s.liv -= F.skade; ut.push({ type: "slapp", skade: F.skade }); }
    else igjen.push(f);
  }
  s.fiender = igjen;
  for (const [type, d] of nye) fiende(s, type, d);
  if (s.liv <= 0) { s.liv = 0; s.ferdig = "tapt"; } else if (s.bolge >= bolger && !s.ko.length && !s.fiender.length) s.ferdig = "vunnet";
  return ut;
}
