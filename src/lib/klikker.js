// Spillet «Overfør»: regler og regning. Rene funksjoner uten avhengigheter til nettleseren.
// Alle beløp er i øre. Tilstanden endres aldri, hver handling gir en ny tilstand.

import { formaterTall } from "./format.js";

const NBSP = " ";

export const REGLER = Object.freeze({
  trykkStart: 10,          // øre per trykk på «Overfør»
  trykkSteg: 0.1,          // øre mer per nivå
  trykkGrunnpris: 10,      // øre for første nivå
  trykkVekst: 1.05,        // hvert nivå koster 5 % mer enn forrige
  prisvekst: 1.15,         // hvert nivå av en hjelper koster 15 % mer enn forrige
  loftNivaer: Object.freeze([10, 25, 50]),   // nivåene der en hjelper kan få et løft
  loftPris: Object.freeze([12, 150, 4000]),  // prisen på løftet, i ganger hjelperens grunnpris
  utbytteSek: 60,          // et utbytte er verdt så mange sekunder inntekt
  utbytteVisSek: 12,       // så lenge kan et utbytte hentes
  maksBorteSek: 2 * 3600,  // lengste tid hjelperne tjener mens du er borte
  maksKjop: 1000,          // flest nivåer i ett kjøp
  visFra: 0.5,             // en hjelper vises når du har tjent halve grunnprisen
});

// Rekkefølgen er spillets egen og sier ingenting om hvem som har mest.
// rate er øre i sekundet per nivå, pris er øre for første nivå.
export const HJELPERE = Object.freeze([
  { id: "reitan", navn: "Odd Reitan", bransje: "Dagligvare", rate: 10, pris: 150, loft: ["Større handlevogn", "Åpent til sent", "Butikk i hver bygd"] },
  { id: "stordalen", navn: "Petter Stordalen", bransje: "Hotell", rate: 60, pris: 1500, loft: ["Frokostbuffet", "Takterrasse", "Hotell i hver by"] },
  { id: "witzoe", navn: "Gustav Witzøe", bransje: "Laks", rate: 400, pris: 16000, loft: ["Større merd", "Fôrbåt", "Merd til havs"] },
  { id: "andresen", navn: "Katharina Andresen", bransje: "Familieselskap", rate: 2500, pris: 160000, loft: ["Styremøte", "Langsiktig plan", "Neste generasjon"] },
  { id: "rokke", navn: "Kjell Inge Røkke", bransje: "Industri", rate: 15000, pris: 1.6e6, loft: ["Større kran", "Nytt verft", "Industripark"] },
  { id: "fredriksen", navn: "John Fredriksen", bransje: "Skipsfart", rate: 100000, pris: 1.8e7, loft: ["Større tankskip", "Ny rute", "Hel flåte"] },
  { id: "midelfart", navn: "Celina Midelfart", bransje: "Investeringer", rate: 700000, pris: 2.1e8, loft: ["Regneark", "Større portefølje", "Styreverv"] },
  { id: "tangen", navn: "Nicolai Tangen", bransje: "Oljefondet", rate: 5e6, pris: 2.5e9, loft: ["Kvartalsrapport", "Bredere indeks", "Lang horisont"] },
].map((h) => Object.freeze({ ...h, loft: Object.freeze(h.loft) })));

// Løft for selve overføringen. Hvert trykk gir en andel av det hjelperne tjener i sekundet.
export const TRYKKLOFT = Object.freeze([
  { id: "fast", navn: "Fast overføring", andel: 0.01, pris: 5000, krav: 50 },
  { id: "lonn", navn: "Lønningsdag", andel: 0.02, pris: 500000, krav: 300 },
  { id: "forst", navn: "Spar først", andel: 0.03, pris: 5e7, krav: 1000 },
].map(Object.freeze));

const hjelper = (id) => HJELPERE.find((h) => h.id === id);

export function nyTilstand() {
  return {
    saldo: 0,
    overfort: 0,   // det du har overført selv, ved å trykke
    tjent: 0,      // det hjelperne har tjent
    trykk: 0,      // antall trykk
    trykkNiva: 0,
    hjelpere: Object.fromEntries(HJELPERE.map((h) => [h.id, 0])),
    loft: Object.fromEntries(HJELPERE.map((h) => [h.id, 0])),
    trykkloft: 0,  // antall løft for overføringen, kjøpt i rekkefølge
  };
}

/** Det én hjelper tjener i sekundet, i øre. */
export function hjelperRate(t, id) {
  const h = hjelper(id);
  return h ? h.rate * t.hjelpere[id] * Math.pow(2, t.loft[id]) : 0;
}

/** Det alle hjelperne tjener i sekundet, i øre. */
export function perSekund(t) {
  return HJELPERE.reduce((sum, h) => sum + hjelperRate(t, h.id), 0);
}

/** Verdien av ett trykk uten løft: 10 øre, så 10,1 og 10,2. Regnet i tideler for å unngå avrundingsfeil. */
export function grunnTrykk(niva) {
  return (Math.round(REGLER.trykkStart * 10) + Math.round(REGLER.trykkSteg * 10) * niva) / 10;
}

/** Andelen av inntekten per sekund som hvert trykk gir i tillegg. */
export function trykkAndel(t) {
  return TRYKKLOFT.slice(0, t.trykkloft).reduce((sum, l) => sum + l.andel, 0);
}

/** Verdien av ett trykk på «Overfør», i øre. */
export function trykkverdi(t) {
  return grunnTrykk(t.trykkNiva) + trykkAndel(t) * perSekund(t);
}

function sumPriser(grunnpris, vekst, fra, antall) {
  let sum = 0;
  for (let i = 0; i < antall; i++) sum += Math.ceil(grunnpris * Math.pow(vekst, fra + i));
  return sum;
}

function maks(grunnpris, vekst, fra, saldo) {
  let antall = 0;
  let sum = 0;
  while (antall < REGLER.maksKjop) {
    const neste = Math.ceil(grunnpris * Math.pow(vekst, fra + antall));
    if (sum + neste > saldo) break;
    sum += neste;
    antall++;
  }
  return antall;
}

const gyldigAntall = (antall) => Number.isInteger(antall) && antall >= 1 && antall <= REGLER.maksKjop;

/** Prisen for de neste nivåene av en hjelper, i hele øre. */
export function prisHjelper(t, id, antall = 1) {
  const h = hjelper(id);
  return h && gyldigAntall(antall) ? sumPriser(h.pris, REGLER.prisvekst, t.hjelpere[id], antall) : Infinity;
}

/** Hvor mange nivåer av en hjelper saldoen rekker til. */
export function maksHjelper(t, id) {
  const h = hjelper(id);
  return h ? maks(h.pris, REGLER.prisvekst, t.hjelpere[id], t.saldo) : 0;
}

/** Prisen for de neste nivåene av overføringen, i hele øre. */
export function prisTrykk(t, antall = 1) {
  return gyldigAntall(antall) ? sumPriser(REGLER.trykkGrunnpris, REGLER.trykkVekst, t.trykkNiva, antall) : Infinity;
}

export function maksTrykk(t) {
  return maks(REGLER.trykkGrunnpris, REGLER.trykkVekst, t.trykkNiva, t.saldo);
}

/** Ett trykk på «Overfør». */
export function trykk(t) {
  const verdi = trykkverdi(t);
  return { ...t, saldo: t.saldo + verdi, overfort: t.overfort + verdi, trykk: t.trykk + 1 };
}

/** Kjøper nivåer av en hjelper. Gir samme tilstand tilbake når saldoen ikke rekker. */
export function kjopHjelper(t, id, antall = 1) {
  const pris = prisHjelper(t, id, antall);
  if (!(pris <= t.saldo)) return t;
  return { ...t, saldo: t.saldo - pris, hjelpere: { ...t.hjelpere, [id]: t.hjelpere[id] + antall } };
}

/** Kjøper nivåer av overføringen. */
export function kjopTrykk(t, antall = 1) {
  const pris = prisTrykk(t, antall);
  if (!(pris <= t.saldo)) return t;
  return { ...t, saldo: t.saldo - pris, trykkNiva: t.trykkNiva + antall };
}

/**
 * Løftene som kan kjøpes nå. Et løft for en hjelper dobler det hjelperen tjener,
 * og blir tilgjengelig når hjelperen når nivå 10, 25 og 50.
 */
export function tilgjengeligeLoft(t) {
  const liste = [];
  const neste = TRYKKLOFT[t.trykkloft];
  if (neste && t.trykk >= neste.krav) {
    liste.push({ id: "trykk", navn: neste.navn, pris: neste.pris, type: "trykk", andel: neste.andel });
  }
  for (const h of HJELPERE) {
    const steg = t.loft[h.id];
    if (steg < REGLER.loftNivaer.length && t.hjelpere[h.id] >= REGLER.loftNivaer[steg]) {
      liste.push({ id: h.id, navn: h.loft[steg], pris: h.pris * REGLER.loftPris[steg], type: "hjelper", hjelper: h.navn });
    }
  }
  return liste;
}

/** Nivået der hjelperen får sitt neste løft, eller null når alle er brukt. */
export function nesteLoftNiva(t, id) {
  const niva = REGLER.loftNivaer[t.loft[id]];
  return niva === undefined ? null : niva;
}

/** Kjøper løftet for en hjelper, eller for overføringen når id er «trykk». */
export function kjopLoft(t, id) {
  const l = tilgjengeligeLoft(t).find((x) => x.id === id);
  if (!l || !(l.pris <= t.saldo)) return t;
  if (l.type === "trykk") return { ...t, saldo: t.saldo - l.pris, trykkloft: t.trykkloft + 1 };
  return { ...t, saldo: t.saldo - l.pris, loft: { ...t.loft, [id]: t.loft[id] + 1 } };
}

/** Hjelperne tjener i et antall sekunder. */
export function tikk(t, sekunder) {
  if (!(sekunder > 0) || !Number.isFinite(sekunder)) return t;
  const gevinst = perSekund(t) * sekunder;
  if (gevinst === 0) return t;
  return { ...t, saldo: t.saldo + gevinst, tjent: t.tjent + gevinst };
}

/** Tiden du har vært borte teller, men aldri mer enn to timer. */
export function borte(t, sekunder) {
  const sek = Math.min(Math.max(0, Number.isFinite(sekunder) ? sekunder : 0), REGLER.maksBorteSek);
  const etter = tikk(t, sek);
  return { tilstand: etter, sekunder: sek, gevinst: etter.tjent - t.tjent };
}

/** Et utbytte er verdt ett minutt av det hjelperne tjener. */
export function utbytteverdi(t) {
  return perSekund(t) * REGLER.utbytteSek;
}

export function taUtbytte(t) {
  return tikk(t, REGLER.utbytteSek);
}

/** Hvor mange sekunder neste nivå av en hjelper bruker på å tjene inn prisen sin. */
export function nedbetalingSek(t, id) {
  const h = hjelper(id);
  if (!h) return Infinity;
  return prisHjelper(t, id, 1) / (h.rate * Math.pow(2, t.loft[id]));
}

/** Hvor mange trykk neste nivå av overføringen bruker på å tjene inn prisen sin. */
export function nedbetalingTrykk(t) {
  return prisTrykk(t, 1) / REGLER.trykkSteg;
}

/**
 * Hvilke hjelpere som vises: de du eier, de du snart har råd til, og den neste som skygge.
 * Gir en liste med { id, status } der status er «apen» eller «skygge».
 */
export function synlige(t) {
  const totalt = t.overfort + t.tjent;
  const liste = [];
  for (const [i, h] of HJELPERE.entries()) {
    const apen = i === 0 || t.hjelpere[h.id] > 0 || totalt >= h.pris * REGLER.visFra;
    if (apen) liste.push({ id: h.id, status: "apen" });
    else { liste.push({ id: h.id, status: "skygge" }); break; }
  }
  return liste;
}

// ---------- Lagring ----------

const tall = (x) => typeof x === "number" && Number.isFinite(x) && x >= 0;
const heltall = (x, maksimum) => Number.isInteger(x) && x >= 0 && x <= maksimum;

/** Tilstanden som et enkelt objekt som kan gjøres om til tekst. */
export function tilLagring(t, tid) {
  return { v: 1, tid, ...t };
}

/** Leser en lagret tilstand. Gir null når noe mangler eller ikke er et gyldig tall. */
export function fraLagring(obj) {
  if (!obj || typeof obj !== "object" || obj.v !== 1) return null;
  const t = nyTilstand();
  for (const felt of ["saldo", "overfort", "tjent"]) {
    if (!tall(obj[felt])) return null;
    t[felt] = obj[felt];
  }
  if (!heltall(obj.trykk, Number.MAX_SAFE_INTEGER) || !heltall(obj.trykkNiva, 1e6)) return null;
  if (!heltall(obj.trykkloft, TRYKKLOFT.length)) return null;
  t.trykk = obj.trykk;
  t.trykkNiva = obj.trykkNiva;
  t.trykkloft = obj.trykkloft;
  for (const h of HJELPERE) {
    const niva = obj.hjelpere?.[h.id];
    const loft = obj.loft?.[h.id];
    if (!heltall(niva, 1e5) || !heltall(loft, REGLER.loftNivaer.length)) return null;
    t.hjelpere[h.id] = niva;
    t.loft[h.id] = loft;
  }
  return { tilstand: t, tid: tall(obj.tid) ? obj.tid : null };
}

// ---------- Tekst ----------

const STORE = [
  [1e21, "trilliarder"], [1e18, "trillioner"], [1e15, "billiarder"], [1e12, "billioner"], [1e9, "mrd."], [1e6, "mill."],
];

const kutt = (x, desimaler) => { const f = Math.pow(10, desimaler); return Math.floor(x * f + 1e-6) / f; };

/**
 * Beløp i øre som tekst: «10,1 øre», «12,50 kr», «45 300 kr», «1,23 mill. kr».
 * Runder alltid ned, så teksten aldri viser mer enn det som står på kontoen.
 */
export function formaterOre(ore) {
  if (!Number.isFinite(ore)) return "";
  if (ore < 0) return "−" + formaterOre(-ore);
  if (ore < 100) {
    const x = kutt(ore, 1);
    return formaterTall(x, Number.isInteger(x) ? 0 : 1) + NBSP + "øre";
  }
  const kr = ore / 100;
  if (kr < 10000) return formaterTall(kutt(kr, 2), 2) + NBSP + "kr";
  if (kr < 1e6) return formaterTall(Math.floor(kr)) + NBSP + "kr";
  if (kr >= 1e24) return kr.toExponential(2).replace(".", ",").replace("e+", NBSP + "×" + NBSP + "10^") + NBSP + "kr";
  const [grense, navn] = STORE.find(([g]) => kr >= g);
  const x = kr / grense;
  const des = x >= 100 ? 0 : x >= 10 ? 1 : 2;
  return formaterTall(kutt(x, des), des) + NBSP + navn + NBSP + "kr";
}

/** Tid som tekst: «15 sek», «4 min», «2 t 10 min», «3 døgn». */
export function formaterTid(sekunder) {
  if (!Number.isFinite(sekunder)) return "";
  const s = Math.max(0, sekunder);
  if (s < 90) return Math.max(1, Math.round(s)) + NBSP + "sek";
  if (s < 5400) return Math.round(s / 60) + NBSP + "min";
  if (s < 48 * 3600) {
    const t = Math.floor(s / 3600);
    const m = Math.round((s - t * 3600) / 60 / 10) * 10;
    return m === 60 ? (t + 1) + NBSP + "t" : m === 0 ? t + NBSP + "t" : t + NBSP + "t" + NBSP + m + NBSP + "min";
  }
  return formaterTall(Math.round(s / 86400)) + NBSP + "døgn";
}
