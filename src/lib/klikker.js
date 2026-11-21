// Spillet «Overfør»: regler og regning. Rene funksjoner uten avhengigheter til nettleseren.
// Alle beløp er i øre. Tilstanden endres aldri, hver handling gir en ny tilstand.
// Tilfeldighet kommer inn som en funksjon rng() som gir et tall fra 0 til 1, så testene kan styre den.

import { formaterTall } from "./format.js";
import { gudVirkning, grein, GRENER, IKONER, GAMLE_IKONER, ikon, STRATEGI, STRATEGIER, OBLIGASJONER, OBL, PRESTISJE, PRESTASJONER } from "./klikker-guder.js";
import { LOTTO, prisRekker, resultat as lottoResultat, trekkTid } from "./klikker-lotto.js";

const NBSP = " ";

export const REGLER = Object.freeze({
  trykkStart: 10,          // øre per trykk på «Overfør»
  trykkSteg: 1,            // øre mer per nivå, en tidel av det første trykket
  trykkGrunnpris: 40,      // øre for første nivå: fire trykk
  trykkVekst: 1.08,        // hvert nivå koster 8 % mer enn forrige
  prisvekst: 1.15,         // hver aksje koster 15 % mer enn forrige, men gir like mye
  boosterPris: Object.freeze([20, 300, 8000]),  // prisen på boosterne for en aksje, i ganger grunnprisen
  gfHver: 50,              // generalforsamling for hver 50. aksje i samme selskap
  gfFaktor: 1.5,           // hver generalforsamling gir 1,5 ganger utbytte
  fartFra: 3,              // trykk i sekundet før farten gir ekstra
  fartKne: 11,             // trykk i sekundet som gir 2,5 ganger
  fartLett: 2.5,           // fartsboosten øker jevnt hit
  fartVekst: 1.11,         // over kneet gir hvert ekstra trykk i sekundet 11 % mer
  fartMaks: 12,            // høyeste fartsboost
  ekstraMaksSek: 10,       // du kan aldri investere mer enn 10 sekunder utbytte i et ekstraordinært utbytte
  // Tre aktiva med samme innsats og samme ventetid. Jo høyere avkastning, jo høyere er risikoen for at investeringen
  // går dårlig. Risikoen vises bare med ord i spillet. Navnene er oppdiktet, og ett trekkes fra hver gruppe.
  ekstraValg: Object.freeze([
    Object.freeze({ niva: "Lavest risiko", avkastning: Object.freeze([0.15, 0.25]), risiko: 0.1,
      navn: Object.freeze(["Statsobligasjoner", "Sparekonto i Grisebanken", "Rentefond fra Trygge Trine"]) }),
    Object.freeze({ niva: "Litt risiko", avkastning: Object.freeze([0.4, 0.7]), risiko: 0.2,
      navn: Object.freeze(["Aksjefond med litt av alt", "Utleiehytte på fjellet", "Gårdsbutikk i Bygda"]) }),
    Object.freeze({ niva: "Mest risiko", avkastning: Object.freeze([1, 1.5]), risiko: 0.3,
      navn: Object.freeze(["Obligasjoner fra Alis Bilopphuggeri", "CDF på kakaobønner", "Kryptomynten Grisecoin"]) }),
  ]),
  ekstraVent: Object.freeze([60, 120]),  // sekunder til utbyttet kommer, likt for alle valgene i et tilbud
  ekstraTap: Object.freeze([0, 0.1]),  // går det dårlig, taper du 0 til 10 % av det du betalte
  ekstraVisSek: 15,        // så lenge tilbudet står
  radgiverPris: 1e9,       // 10 mill. kr for å ansette investeringsrådgiveren
  radgiverStart: 0.3,      // sjansen for at han peker på den rimeligste aksjen
  radgiverSteg: 0.1,       // hver oppgradering gir 10 prosentpoeng mer
  radgiverMaks: 0.8,
  radgiverSek: Object.freeze([300, 600, 1200, 2400, 4800]),  // oppgraderingene koster så mange sekunder utbytte
  radgiverSpredning: 1.5,  // bommer han, er det oftest på en av de nest beste
  uroSek: 180,             // så lang tid streken bruker på å fylles
  uroFare: 0.004,          // sjanse i sekundet for en hendelse når streken er full, før den er helt full
  verdenFall: Object.freeze([0.2, 0.5]),
  verdenSek: Object.freeze([30, 60]),
  krakkRabatt: Object.freeze([0.1, 0.2]),  // fra selskapet med lavest vekst til det med høyest
  krakkSek: Object.freeze([30, 60]),
  maksBorteSek: 2 * 3600,  // lengste tid aksjene gir utbytte mens du er borte
  maksKjop: 1000,          // flest aksjer i ett kjøp
  visFra: 0.5,             // et selskap vises når du har tjent halve grunnprisen
});

// Fra lavest til høyest vekst. Navnene er oppdiktet. rate er øre i sekundet per aksje, pris er øre for den første.
const LISTE = [
  { id: "limonade", navn: "Limonadebod", sektor: "Gatesalg", en: "bod", fler: "boder", rate: 10, pris: 1000,
    boostere: ["Mer sitron", "Isbiter", "Bod på hvert hjørne"], uro: "Det regner hele uka" },
  { id: "blomst", navn: "Blomsterbutikk", sektor: "Blomster", en: "butikk", fler: "butikker", rate: 50, pris: 6000,
    boostere: ["Tulipaner", "Buketter til morsdag", "Drivhus"], uro: "Pollensesongen kom tidlig" },
  { id: "jordbaer", navn: "Jordbærstand", sektor: "Bær", en: "stand", fler: "stander", rate: 300, pris: 45000,
    boostere: ["Større kurver", "Fløte på toppen", "Hel åker"], uro: "Snegler i åkeren" },
  { id: "onkel", navn: "Onkels ølbryggeri", sektor: "Bryggeri", en: "bryggeri", fler: "bryggerier", rate: 1500, pris: 2.85e5,
    boostere: ["Ny gjær", "Onkels hemmelige humle", "Bryggeripub"], uro: "Humlemangel" },
  { id: "geitan", navn: "O. Geitan", sektor: "Dagligvare", en: "aksje", fler: "aksjer", rate: 8000, pris: 1.92e6,
    boostere: ["Større handlevogn", "Åpent til sent", "Butikk i hver bygd"], uro: "Priskrig i dagligvare" },
  { id: "lilledalen", navn: "P. Lilledalen", sektor: "Hotell", en: "aksje", fler: "aksjer", rate: 45000, pris: 1.35e7,
    boostere: ["Frokostbuffet", "Takterrasse", "Hotell i hver by"], uro: "Turistene uteblir" },
  { id: "fredriksjo", navn: "J. Fredriksjø", sektor: "Skipsfart", en: "aksje", fler: "aksjer", rate: 260000, pris: 9.62e7,
    boostere: ["Større tankskip", "Ny rute", "Hel flåte"], uro: "Storm i Nordsjøen" },
  { id: "lokke", navn: "K. Løkke", sektor: "Industri", en: "aksje", fler: "aksjer", rate: 1.4e6, pris: 6.3e8,
    boostere: ["Større kran", "Nytt verft", "Industripark"], uro: "Stålprisen stiger" },
  { id: "blitzoe", navn: "G. Blitzøe", sektor: "Havbruk", en: "aksje", fler: "aksjer", rate: 7.8e6, pris: 4.21e9,
    boostere: ["Større merd", "Fôrbåt", "Merd til havs"], uro: "Lakselus i merdene" },
  { id: "sandresen", navn: "K. Sandresen", sektor: "Familieselskap", en: "aksje", fler: "aksjer", rate: 4.4e7, pris: 2.86e10,
    boostere: ["Styremøte", "Langsiktig plan", "Neste generasjon"], uro: "Nye regler for eiere" },
  { id: "mittelfart", navn: "C. Mittelfart", sektor: "Investeringer", en: "aksje", fler: "aksjer", rate: 2.6e8, pris: 2.03e11,
    boostere: ["Regneark", "Større portefølje", "Styreverv"], uro: "Renten hopper opp" },
  { id: "kolla", navn: "Koka-Kolla", sektor: "Brus", en: "aksje", fler: "aksjer", rate: 1.6e9, pris: 1.5e12,
    boostere: ["Ny smak", "Uten sukker", "Automat i hver gang"], uro: "Ny sukkeravgift" },
  { id: "valmart", navn: "Valmart", sektor: "Varehus", en: "aksje", fler: "aksjer", rate: 1e10, pris: 1.13e13,
    boostere: ["Lavpris hver dag", "Større parkering", "Varehus i hver by"], uro: "Tollkrig" },
  { id: "amasan", navn: "Amasån", sektor: "Netthandel", en: "aksje", fler: "aksjer", rate: 6.5e10, pris: 8.78e13,
    boostere: ["Raskere levering", "Lager med roboter", "Levering med drone"], uro: "Pakkene står fast" },
  { id: "mikromyk", navn: "Mikromyk", sektor: "Programvare", en: "aksje", fler: "aksjer", rate: 4.3e11, pris: 6.97e14,
    boostere: ["Ny versjon", "Abonnement", "Sky for alle"], uro: "Skyen er nede" },
  { id: "eple", navn: "Eple", sektor: "Telefoner", en: "aksje", fler: "aksjer", rate: 2.9e12, pris: 5.66e15,
    boostere: ["Ny farge", "Større skjerm", "Egen butikk"], uro: "Ny modell blir utsatt" },
  { id: "nvidde", navn: "N-Vidde", sektor: "Databrikker", en: "aksje", fler: "aksjer", rate: 2.1e13, pris: 4.91e16,
    boostere: ["Raskere brikke", "Egen fabrikk", "Datasenter"], uro: "Brikkemangel" },
];

const [rabattLav, rabattHoy] = REGLER.krakkRabatt;
export const AKSJER = Object.freeze(LISTE.map((a, i) => Object.freeze({
  ...a,
  boostere: Object.freeze(a.boostere),
  krakk: Math.round((rabattLav + ((rabattHoy - rabattLav) * i) / (LISTE.length - 1)) * 100) / 100,
})));

// Trykkboostere: hvert trykk gir også en andel av utbyttet i sekundet.
const TRYKKBOOST = [
  { id: "fast", navn: "Fast overføring", andel: 0.01, pris: 2e4 },
  { id: "lonn", navn: "Lønningsdag", andel: 0.02, pris: 2e6 },
  { id: "forst", navn: "Spar først", andel: 0.03, pris: 2e8 },
];

// Alle boostere, sortert etter pris. type er «aksje» (ganger utbyttet fra ett selskap),
// «trykk» (andel av utbyttet per trykk) eller «alle» (ganger utbyttet fra alle selskapene).
export const BOOSTERE = Object.freeze([
  ...AKSJER.flatMap((a) => a.boostere.map((navn, i) => ({
    id: `${a.id}-${i + 1}`, type: "aksje", mal: a.id, trinn: i + 1, navn, faktor: 2, pris: a.pris * REGLER.boosterPris[i],
  }))),
  ...TRYKKBOOST.map((b, i) => ({ ...b, type: "trykk", trinn: i + 1 })),
  { id: "tangent", type: "alle", navn: "N. Tangent", faktor: 1.5, pris: 5e9, trinn: 1 },
].sort((a, b) => a.pris - b.pris).map(Object.freeze));

// Fordeler: når du eier mange nok i et av de små selskapene, får du noe ekstra.
export const FORDELER = Object.freeze([
  { id: "limonade-25", mal: "limonade", antall: 25, type: "trykkRabatt", verdi: 0.5, tekst: "Større overføring koster halvparten" },
  { id: "blomst-50", mal: "blomst", antall: 50, type: "bonus", verdi: 1000, tekst: "Engangsbonus verdt 1 000 trykk" },
  { id: "jordbaer-25", mal: "jordbaer", antall: 25, type: "trykkGanger", verdi: 2, tekst: "Hvert trykk gir dobbelt" },
  { id: "onkel-25", mal: "onkel", antall: 25, type: "risiko", verdi: 0.5, tekst: "Halv risiko på ekstraordinært utbytte" },
].map(Object.freeze));

const aksje = (id) => AKSJER.find((a) => a.id === id);

/** Om du har en fordel: du eier minst så mange i selskapet. */
export function harFordel(t, f) {
  return (t.aksjer[f.mal] ?? 0) >= f.antall;
}

/** Fordelene i et selskap, med om du har dem. */
export function fordeler(t, id) {
  return FORDELER.filter((f) => f.mal === id).map((f) => ({ ...f, oppnadd: harFordel(t, f) }));
}

// Ganger sammen verdiene til fordelene av en type som du har, eller 1 når du ikke har noen.
function fordelFaktor(t, type) {
  return FORDELER.filter((f) => f.type === type && harFordel(t, f)).reduce((x, f) => x * f.verdi, 1);
}
const booster = (id) => BOOSTERE.find((b) => b.id === id);
const mellom = ([lav, hoy], x) => lav + (hoy - lav) * x;

function stille() {
  return { fyll: 0, verden: null, krakk: null };
}

export function nyTilstand() {
  return {
    saldo: 0,
    totalt: 0,      // alt som har kommet inn på kontoen
    trykk: 0,
    trykkNiva: 0,
    aksjer: Object.fromEntries(AKSJER.map((a) => [a.id, 0])),
    boostere: [],   // id-ene til kjøpte boostere
    ventende: [],   // ekstraordinære utbytter: { sum, igjen }
    radgiver: 0,    // 0 er ikke ansatt, 1 er 30 % treff, og hvert nivå over gir 10 prosentpoeng mer
    ikon: "deg",    // ikonet øverst til venstre
    ikoner: ["deg"],
    gren: null,     // greinen av gudegriser du har valgt
    gud: 0,         // hvor mange guder du har i greinen
    strategi: null, // «avers», «noytral» eller «glad»
    giring: 1,      // bare for risikoglad
    prestisje: 0,
    lodd: [],       // lottorekker som venter på trekning: { runde, antall, fro }
    prestasjoner: [], // id-ene til prestasjonene du har, blir med gjennom prestisje
    alleTrykk: 0,   // trykk i alle spill, blir med gjennom prestisje
    uro: stille(),  // lagres ikke
  };
}

const har = (t, id) => t.boostere.includes(id);

/** Det prestisje ganger med: 2 for første gang, 4 for andre. */
export function prestisjeFaktor(t) {
  return Math.pow(PRESTISJE.faktor, t.prestisje ?? 0);
}
const avers = (t) => (t.strategi === "avers" ? STRATEGI.aversRisiko : 1);

/** Antall generalforsamlinger du har stemt på i et selskap: én for hver 50. aksje. */
export function gfAntall(t, id) {
  return Math.floor((t.aksjer[id] ?? 0) / REGLER.gfHver);
}

/** Det boosterne og generalforsamlingene ganger utbyttet med, uten verdenshendelser. */
export function faktor(t, id) {
  let f = Math.pow(REGLER.gfFaktor, gfAntall(t, id));
  for (const b of BOOSTERE) {
    if (!har(t, b.id)) continue;
    if (b.type === "aksje" && b.mal === id) f *= b.faktor;
    if (b.type === "alle") f *= b.faktor;
  }
  return f;
}

/** Hvor mye en verdenshendelse trekker fra utbyttet, fra 0 til 1. */
export function fall(t, id) {
  const v = t.uro?.verden;
  return v && v.mal === id ? v.fall * gudVirkning(t, "verdenFall") * avers(t) : 0;
}

/** Utbytte per aksje i sekundet, i øre. Det samme for hver aksje du kjøper. */
export function utbyttePerAksje(t, id) {
  const a = aksje(id);
  return a ? a.rate * faktor(t, id) * (1 - fall(t, id)) * gudVirkning(t, "utbytte") * prestisjeFaktor(t) : 0;
}

/** Utbytte fra ett selskap i sekundet, i øre. */
export function aksjeRate(t, id) {
  return utbyttePerAksje(t, id) * (t.aksjer[id] ?? 0);
}

/** Utbytte fra alle selskapene i sekundet, i øre. */
export function perSekund(t) {
  return AKSJER.reduce((sum, a) => sum + aksjeRate(t, a.id), 0);
}

/** Verdien av ett trykk uten boostere: 10 øre, så 11 og 12. Regnet i tideler for å unngå avrundingsfeil. */
export function grunnTrykk(niva) {
  return (Math.round(REGLER.trykkStart * 10) + Math.round(REGLER.trykkSteg * 10) * niva) / 10;
}

/** Andelen av utbyttet i sekundet som hvert trykk gir i tillegg. */
export function trykkAndel(t) {
  return BOOSTERE.filter((b) => b.type === "trykk" && har(t, b.id)).reduce((sum, b) => sum + b.andel, 0);
}

/** Verdien av ett trykk i rolig tempo, i øre. */
export function trykkverdi(t) {
  return (grunnTrykk(t.trykkNiva) * gudVirkning(t, "trykk") * prestisjeFaktor(t) + trykkAndel(t) * perSekund(t)) * fordelFaktor(t, "trykkGanger");
}

/**
 * Fartsboost: trykker du mer enn tre ganger i sekundet, gir hvert trykk mer. Den øker jevnt til 2,5 ganger ved 11 trykk
 * i sekundet. Over det gir hvert ekstra trykk i sekundet 11 % mer, opptil 12 ganger, som krever 27 trykk i sekundet.
 */
export function fartFaktor(trykkSisteSek) {
  const n = Number.isFinite(trykkSisteSek) ? trykkSisteSek : 0;
  const { fartFra, fartKne, fartLett, fartVekst, fartMaks } = REGLER;
  if (n <= fartFra) return 1;
  if (n <= fartKne) return 1 + ((fartLett - 1) * (n - fartFra)) / (fartKne - fartFra);
  return Math.min(fartMaks, fartLett * Math.pow(fartVekst, n - fartKne));
}

/** Verdien av ett trykk når du har trykket så mange ganger det siste sekundet. */
export function klikkverdi(t, trykkSisteSek = 0) {
  return trykkverdi(t) * fartFaktor(trykkSisteSek);
}

/** Ett trykk på «Overfør». */
export function trykk(t, trykkSisteSek = 0) {
  const verdi = klikkverdi(t, trykkSisteSek);
  return { ...t, saldo: t.saldo + verdi, totalt: t.totalt + verdi, trykk: t.trykk + 1, alleTrykk: (t.alleTrykk ?? 0) + 1 };
}

/** Rabatten på et selskap under et børskrakk, fra 0 til 1. */
export function rabatt(t, id) {
  return t.uro?.krakk ? Math.min(0.9, (aksje(id)?.krakk ?? 0) * gudVirkning(t, "krakk")) : 0;
}

function sumPriser(grunnpris, vekst, fra, antall, ganger = 1) {
  let sum = 0;
  for (let i = 0; i < antall; i++) sum += Math.ceil(grunnpris * Math.pow(vekst, fra + i) * ganger);
  return sum;
}

function maks(grunnpris, vekst, fra, saldo, ganger = 1) {
  let antall = 0;
  let sum = 0;
  while (antall < REGLER.maksKjop) {
    const neste = Math.ceil(grunnpris * Math.pow(vekst, fra + antall) * ganger);
    if (sum + neste > saldo) break;
    sum += neste;
    antall++;
  }
  return antall;
}

const gyldigAntall = (antall) => Number.isInteger(antall) && antall >= 1 && antall <= REGLER.maksKjop;

/** Prisen for de neste aksjene i et selskap, i hele øre. Hver aksje koster mer enn den forrige. */
export function prisAksje(t, id, antall = 1) {
  const a = aksje(id);
  return a && gyldigAntall(antall) ? sumPriser(a.pris, REGLER.prisvekst, t.aksjer[id], antall, 1 - rabatt(t, id)) : Infinity;
}

/** Hvor mange aksjer saldoen rekker til. */
export function maksAksje(t, id) {
  const a = aksje(id);
  return a ? maks(a.pris, REGLER.prisvekst, t.aksjer[id], t.saldo, 1 - rabatt(t, id)) : 0;
}

/** Kjøper aksjer. Gir samme tilstand tilbake når saldoen ikke rekker. Når du når en engangsbonus, kommer den med en gang. */
export function kjopAksje(t, id, antall = 1) {
  const pris = prisAksje(t, id, antall);
  if (!(pris <= t.saldo)) return t;
  const etter = { ...t, saldo: t.saldo - pris, aksjer: { ...t.aksjer, [id]: t.aksjer[id] + antall } };
  const bonus = FORDELER.filter((f) => f.type === "bonus" && !harFordel(t, f) && harFordel(etter, f))
    .reduce((sum, f) => sum + f.verdi * trykkverdi(etter), 0);
  return bonus > 0 ? { ...etter, saldo: etter.saldo + bonus, totalt: etter.totalt + bonus } : etter;
}

/** Fordelene du fikk ved å gå fra én tilstand til en annen. */
export function nyeFordeler(for_, etter) {
  return FORDELER.filter((f) => !harFordel(for_, f) && harFordel(etter, f));
}

/** Prisen for de neste nivåene av overføringen, i hele øre. */
export function prisTrykk(t, antall = 1) {
  return gyldigAntall(antall) ? sumPriser(REGLER.trykkGrunnpris, REGLER.trykkVekst, t.trykkNiva, antall, fordelFaktor(t, "trykkRabatt")) : Infinity;
}

export function maksTrykk(t) {
  return maks(REGLER.trykkGrunnpris, REGLER.trykkVekst, t.trykkNiva, t.saldo, fordelFaktor(t, "trykkRabatt"));
}

/** Kjøper nivåer av overføringen. */
export function kjopTrykk(t, antall = 1) {
  const pris = prisTrykk(t, antall);
  if (!(pris <= t.saldo)) return t;
  return { ...t, saldo: t.saldo - pris, trykkNiva: t.trykkNiva + antall };
}

/** De neste boosterne du ikke har kjøpt, billigste først. */
export function nesteBoostere(t, antall = 3) {
  return BOOSTERE.filter((b) => !har(t, b.id)).slice(0, antall);
}

/** Hvor stor del av prisen du har råd til, fra 0 til 1. */
export function andelRad(t, pris) {
  return pris > 0 ? Math.min(1, Math.max(0, t.saldo / pris)) : 1;
}

export function kjopBooster(t, id) {
  const b = booster(id);
  if (!b || har(t, id) || !(b.pris <= t.saldo)) return t;
  return { ...t, saldo: t.saldo - b.pris, boostere: [...t.boostere, id] };
}

/** Selskapene der du har stemt på generalforsamling, med neste grense. */
export function generalforsamlinger(t) {
  return AKSJER.filter((a) => gfAntall(t, a.id) > 0).map((a) => ({
    id: a.id, antall: gfAntall(t, a.id), faktor: Math.pow(REGLER.gfFaktor, gfAntall(t, a.id)),
    neste: (gfAntall(t, a.id) + 1) * REGLER.gfHver,
  }));
}

/**
 * Tiden går: aksjene gir utbytte, hendelser løper ut, og ekstraordinære utbytter kommer når ventetiden er over.
 * Gir den nye tilstanden og det som kom inn fra ekstraordinære utbytter.
 */
export function tikk(t, sekunder) {
  if (!(sekunder > 0) || !Number.isFinite(sekunder)) return t;
  const utbytte = perSekund(t) * sekunder;
  let inn = 0, ut = 0;
  const ventende = [];
  for (const v of t.ventende) {
    const igjen = v.igjen - sekunder;
    if (igjen > 0) ventende.push({ ...v, igjen });
    else if (v.sum >= 0) inn += v.sum;
    else ut -= v.sum;   // med giring kan du tape mer enn du satte inn
  }
  const nedtell = (h) => (h && h.igjen - sekunder > 0 ? { ...h, igjen: h.igjen - sekunder } : null);
  const uro = t.uro ? { ...t.uro, verden: nedtell(t.uro.verden), krakk: nedtell(t.uro.krakk) } : stille();
  const etter = { ...t, saldo: t.saldo + utbytte + inn - ut, totalt: t.totalt + utbytte + inn, ventende, uro };
  return etter.saldo < 0 ? tvangssalg(etter) : etter;
}

/** Lengste tid aksjene gir utbytte mens du er borte. Noen guder gjør den lengre. */
export function maksBorte(t) {
  return Math.max(REGLER.maksBorteSek, gudVirkning(t, "borteSek") ?? 0);
}

/**
 * Når saldoen er under null, selges aksjer til den er null eller mer. Den dyreste aksjen selges først,
 * for halvparten av det den kostet. Rekker ikke aksjene, slettes resten av gjelden.
 */
export function tvangssalg(t) {
  if (!(t.saldo < 0)) return t;
  const aksjer = { ...t.aksjer };
  let saldo = t.saldo;
  const sistePris = (a) => Math.ceil(a.pris * Math.pow(REGLER.prisvekst, aksjer[a.id] - 1));
  while (saldo < 0) {
    const eide = AKSJER.filter((a) => aksjer[a.id] > 0);
    if (!eide.length) break;
    const a = eide.reduce((x, y) => (sistePris(y) > sistePris(x) ? y : x));
    saldo += Math.floor(sistePris(a) * 0.5);
    aksjer[a.id]--;
  }
  return { ...t, saldo: Math.max(0, saldo), aksjer };
}

/** Tiden du har vært borte teller, men aldri mer enn to timer. Hendelser er over når du kommer tilbake. */
export function borte(t, sekunder) {
  const sek = Math.min(Math.max(0, Number.isFinite(sekunder) ? sekunder : 0), maksBorte(t));
  const rolig = { ...t, uro: { ...stille(), fyll: t.uro?.fyll ?? 0 } };
  const etter = tikk(rolig, sek);
  return { tilstand: etter, sekunder: sek, gevinst: etter.totalt - t.totalt };
}

// ---------- Uro i markedet ----------

/** Hvor full streken er, fra 0 til 1. */
export function uroFyll(t) {
  return Math.min(1, (t.uro?.fyll ?? 0) / REGLER.uroSek);
}

/** Om det er en hendelse på gang nå. */
export function urolig(t) {
  return Boolean(t.uro?.verden || t.uro?.krakk);
}

/**
 * Fyller streken. Sjansen for en hendelse vokser med streken, og når den er full, skjer det alltid noe.
 * Streken står stille mens en hendelse varer. Gir { tilstand, hendelse } der hendelse er null når ingenting skjer.
 */
export function uroSteg(t, sekunder, rng = Math.random) {
  if (!(sekunder > 0) || urolig(t)) return { tilstand: t, hendelse: null };
  const fyll = Math.min(REGLER.uroSek, (t.uro?.fyll ?? 0) + sekunder);
  const andel = fyll / REGLER.uroSek;
  const sjanse = andel >= 1 ? 1 : 1 - Math.exp(-REGLER.uroFare * andel * sekunder);
  const neste = { ...t, uro: { ...(t.uro ?? stille()), fyll } };
  if (rng() >= sjanse) return { tilstand: neste, hendelse: null };
  const hendelse = lagHendelse(neste, rng);
  return { tilstand: startHendelse(neste, hendelse), hendelse };
}

/** Trekker en hendelse: en verdenshendelse som rammer ett selskap, eller et børskrakk som gjør aksjene billigere. */
export function lagHendelse(t, rng = Math.random) {
  if (rng() < 0.5) {
    const eide = AKSJER.filter((a) => t.aksjer[a.id] > 0);
    const kandidater = eide.length ? eide : [AKSJER[0]];
    const a = kandidater[Math.min(kandidater.length - 1, Math.floor(rng() * kandidater.length))];
    return {
      type: "verden", mal: a.id,
      fall: Math.round(mellom(REGLER.verdenFall, rng()) * 100) / 100,
      sek: Math.round(mellom(REGLER.verdenSek, rng())),
    };
  }
  return { type: "krakk", sek: Math.round(mellom(REGLER.krakkSek, rng())) };
}

export function startHendelse(t, h) {
  const uro = { ...(t.uro ?? stille()), fyll: 0 };
  if (h.type === "verden") uro.verden = { mal: h.mal, fall: h.fall, igjen: h.sek };
  else uro.krakk = { igjen: h.sek };
  return { ...t, uro };
}

// ---------- Ekstraordinært utbytte ----------

/** Runder ned til to gjeldende siffer, så beløpet blir pent: 634 øre blir 630 øre, 12 345 blir 12 000. */
export function pentBelop(ore) {
  if (!(ore > 0) || !Number.isFinite(ore)) return 0;
  if (ore < 100) return Math.floor(ore);
  const steg = Math.pow(10, Math.floor(Math.log10(ore)) - 1);
  return Math.floor(ore / steg + 1e-9) * steg;
}

/**
 * Et tilbud: invester samme beløp i ett av tre aktiva, og få pengene om 1 til 2 minutter, like lenge for alle.
 * Innsatsen er 10 sekunder utbytte, men aldri mer enn du har. Null når du ikke har utbytte.
 */
export function ekstraTilbud(t, rng = Math.random) {
  const innsats = pentBelop(Math.min(perSekund(t) * REGLER.ekstraMaksSek, t.saldo));
  if (!(innsats > 0)) return null;
  const risiko = fordelFaktor(t, "risiko") * gudVirkning(t, "risiko") * avers(t);
  const avk = gudVirkning(t, "ekstraAvk") * prestisjeFaktor(t);
  const vent = Math.round(mellom(REGLER.ekstraVent, rng()) * gudVirkning(t, "vent"));
  return {
    innsats,
    valg: REGLER.ekstraValg.map((v) => {
      const navn = v.navn[Math.min(v.navn.length - 1, Math.floor(rng() * v.navn.length))];
      return { navn, niva: v.niva, sum: Math.floor(innsats * (1 + mellom(v.avkastning, rng()) * avk)), vent, risiko: v.risiko * risiko };
    }),
  };
}

/** Avkastningen på et valg, for eksempel 0,25 når du setter inn 100 og får 125. */
export function ekstraAvkastning(tilbud, valg) {
  return valg && tilbud?.innsats > 0 ? valg.sum / tilbud.innsats - 1 : 0;
}

/**
 * Investerer i et av valgene. Utfallet trekkes nå, men vises først når pengene kommer:
 * som oftest hele summen, men med sjansen i risiko går det dårlig, og du får 90 til 100 % av det du betalte.
 * Ventende utbytter lagres som { sum, lovet, pris, igjen, lengde }, der sum er det som faktisk kommer og lengde er hele ventetiden.
 */
export function investerEkstra(t, tilbud, nr = 0, rng = Math.random) {
  const valg = tilbud?.valg?.[nr];
  const innsats = tilbud?.innsats;
  if (!valg || !(innsats > 0) || !(innsats <= t.saldo)) return t;
  const darlig = rng() < (valg.risiko ?? 0);
  const tap = Math.min(1, mellom(REGLER.ekstraTap, rng()) * prestisjeFaktor(t));
  const sum = darlig ? Math.floor(innsats * (1 - tap)) : valg.sum;
  return { ...t, saldo: t.saldo - innsats, ventende: [...t.ventende, ventPa(t, valg.navn, innsats, sum, valg.sum, valg.vent)] };
}

/** Det du får igjen for en investering med giring: innsatsen pluss gevinsten eller tapet ganget med giringen. */
export function giret(t, innsats, sum) {
  return Math.floor(innsats + giring(t) * (sum - innsats));
}

/** Giringen du bruker nå: 1 uten risikoglad strategi. */
export function giring(t) {
  return t.strategi === "glad" ? t.giring : 1;
}

// Et ventende beløp. Med giring låner du til resten, så gevinst og tap ganges med giringen.
function ventPa(t, navn, innsats, sum, lovet, vent) {
  return { navn, sum: giret(t, innsats, sum), lovet: giret(t, innsats, lovet), pris: innsats, igjen: vent, lengde: vent };
}

/** Om et ventende utbytte gikk dårlig, slik at du får mindre enn du ble lovet. */
export function gikkDarlig(v) {
  return v.lovet !== undefined && v.sum < v.lovet;
}

// ---------- Obligasjoner ----------

/** Om obligasjonene vises. */
export function oblSynlig(t) {
  return t.totalt >= OBL.grense;
}

/** Beløpet du setter inn i en obligasjon nå: ett minutt utbytte, men aldri mer enn du har. */
export function oblInnsats(t) {
  return pentBelop(Math.min(perSekund(t) * OBL.maksSek, t.saldo));
}

/** Renten på en obligasjon, med strategi, guder og prestisje. */
export function oblRente(t, o) {
  const noytral = t.strategi === "noytral" ? STRATEGI.noytralObl : 1;
  return o.rente * noytral * gudVirkning(t, "oblRente") * prestisjeFaktor(t);
}

/** Sjansen for at utstederen går konkurs før obligasjonen forfaller. */
export function oblRisiko(t, o) {
  return (1 - o.sikker) * avers(t);
}

export function antallObl(t) {
  return t.ventende.filter((v) => v.obl).length;
}

/** Kjøper en obligasjon. Utfallet trekkes nå og kommer når løpetiden er over. */
export function kjopObligasjon(t, id, rng = Math.random) {
  const o = OBLIGASJONER.find((x) => x.id === id);
  const innsats = oblInnsats(t);
  if (!o || !(innsats > 0) || innsats > t.saldo || antallObl(t) >= OBL.maksSamtidig) return t;
  const lovet = Math.floor(innsats * (1 + oblRente(t, o)) + 1e-6);
  const konkurs = rng() < oblRisiko(t, o);
  const tap = Math.min(1, (1 - OBL.gjenvinning) * prestisjeFaktor(t));
  const sum = konkurs ? Math.floor(innsats * (1 - tap)) : lovet;
  const vent = Math.round(OBL.lopetid * gudVirkning(t, "vent"));
  return { ...t, saldo: t.saldo - innsats, ventende: [...t.ventende, { ...ventPa(t, o.navn, innsats, sum, lovet, vent), obl: true }] };
}

// ---------- Strategi ----------

/** Om du kan velge strategi: når du har hatt 1 mill. kr innom grisen og ikke har valgt. */
export function kanVelgeStrategi(t) {
  return !t.strategi && t.totalt >= STRATEGI.grense;
}

export function velgStrategi(t, id) {
  if (!kanVelgeStrategi(t) || !STRATEGIER.some((s) => s.id === id)) return t;
  return { ...t, strategi: id, giring: 1 };
}

export function settGiring(t, x) {
  if (t.strategi !== "glad" || !Number.isFinite(x)) return t;
  const g = Math.round(Math.min(STRATEGI.giringMaks, Math.max(STRATEGI.giringMin, x)) * 10) / 10;
  return g === t.giring ? t : { ...t, giring: g };
}

// ---------- Ikoner ----------

export function kjopIkon(t, id) {
  const i = ikon(id);
  if (!i || i.prestisje || t.ikoner.includes(id) || !(i.pris <= t.saldo)) return t;
  return { ...t, saldo: t.saldo - i.pris, ikoner: [...t.ikoner, id], ikon: id };
}

export function velgIkon(t, id) {
  return t.ikoner.includes(id) && t.ikon !== id ? { ...t, ikon: id } : t;
}

// ---------- Gudegriser ----------

/** Om gudene vises: når du har en, eller har tjent halve prisen på den første. */
export function guderSynlig(t) {
  return t.gud > 0 || t.totalt >= GRENER[0].guder[0].pris * REGLER.visFra;
}

/** Neste gud du kan kjøpe i en grein, eller null. Har du valgt grein, er de andre stengt. */
export function nesteGud(t, gren = t.gren) {
  if (t.gren && gren !== t.gren) return null;
  return grein(gren)?.guder[t.gren ? t.gud : 0] ?? null;
}

/** Kjøper neste gud. Første kjøp velger greinen for godt, helt til prestisje. */
export function kjopGud(t, gren = t.gren) {
  const g = nesteGud(t, gren);
  if (!g || !(g.pris <= t.saldo)) return t;
  return { ...t, saldo: t.saldo - g.pris, gren, gud: g.niva };
}

// ---------- Lotto ----------

/** Kjøper rekker i en trekning. UI sjekker at salget er åpent etter den felles klokka. */
export function kjopLodd(t, runde, antall, fro) {
  const pris = prisRekker(antall);
  const har = t.lodd.filter((l) => l.runde === runde).reduce((s, l) => s + l.antall, 0);
  if (!Number.isInteger(runde) || !(pris <= t.saldo) || har + antall > LOTTO.maksRekker) return t;
  return { ...t, saldo: t.saldo - pris, lodd: [...t.lodd, { runde, antall, fro: fro >>> 0 }] };
}

/** Rekker i trekningen du har kjøpt. */
export function loddI(t, runde) {
  return t.lodd.filter((l) => l.runde === runde).reduce((s, l) => s + l.antall, 0);
}

/**
 * Trekker alle kjøp der tallene er trukket ved tidspunktet sek (sekunder etter 1970, fra den felles klokka).
 * Gir den nye tilstanden og ett resultat per trekning.
 */
export function avgjorLodd(t, sek) {
  const ferdige = t.lodd.filter((l) => trekkTid(l.runde) <= sek);
  if (!ferdige.length) return { tilstand: t, resultater: [] };
  const tilbake = t.strategi === "avers" ? LOTTO.aversTilbake : 0;
  const perRunde = new Map();
  for (const l of ferdige) {
    const r = lottoResultat(l, tilbake);
    const sum = perRunde.get(l.runde) ?? { runde: l.runde, trekning: r.trekning, antall: 0, pris: 0, gevinst: 0, premier: 0, treff: {}, beste: null, besteRette: -1 };
    sum.antall += l.antall; sum.pris += r.pris; sum.gevinst += r.gevinst; sum.premier += r.premier;
    for (const [k, n] of Object.entries(r.treff)) sum.treff[k] = (sum.treff[k] ?? 0) + n;
    if (r.besteRette > sum.besteRette) { sum.beste = r.beste; sum.besteRette = r.besteRette; }
    perRunde.set(l.runde, sum);
  }
  const resultater = [...perRunde.values()];
  const gevinst = resultater.reduce((s, r) => s + r.gevinst, 0);
  return {
    tilstand: { ...t, saldo: t.saldo + gevinst, totalt: t.totalt + gevinst, lodd: t.lodd.filter((l) => !ferdige.includes(l)) },
    resultater,
  };
}

// ---------- Prestasjoner ----------

// Prestasjonene som kommer av seg selv når tilstanden er god nok.
const MAL = {
  "trykk-1": (t) => t.alleTrykk >= 1, "trykk-100": (t) => t.alleTrykk >= 100, "trykk-1000": (t) => t.alleTrykk >= 1000,
  "trykk-10000": (t) => t.alleTrykk >= 1e4, "trykk-100000": (t) => t.alleTrykk >= 1e5, "trykk-1000000": (t) => t.alleTrykk >= 1e6,
  "aksje-1": (t) => AKSJER.some((a) => t.aksjer[a.id] > 0),
  "gf-1": (t) => AKSJER.some((a) => gfAntall(t, a.id) > 0),
  "alle-selskaper": (t) => AKSJER.every((a) => t.aksjer[a.id] > 0),
  "booster-1": (t) => t.boostere.length > 0,
  "booster-alle": (t) => BOOSTERE.every((b) => har(t, b.id)),
  "kr-1000": (t) => t.totalt >= 1e5, "kr-mill": (t) => t.totalt >= 1e8, "kr-mrd": (t) => t.totalt >= 1e11,
  "kr-billion": (t) => t.totalt >= 1e14, "kr-billiard": (t) => t.totalt >= 1e17,
  radgiver: (t) => t.radgiver > 0, "radgiver-maks": (t) => t.radgiver >= RADGIVER_NIVAER,
  strategi: (t) => Boolean(t.strategi), "giring-10": (t) => t.strategi === "glad" && t.giring >= STRATEGI.giringMaks,
  "ikon-1": (t) => t.ikoner.length > 1,
  "ikon-alle": (t) => IKONER.every((i) => i.prestisje || t.ikoner.includes(i.id)),
  "gud-1": (t) => t.gud >= 1, "gud-5": (t) => t.gud >= 5, kronos: (t) => t.gren === "gresk" && t.gud >= 5,
  "norron-5": (t) => t.gren === "norron" && t.gud >= 5, "romersk-5": (t) => t.gren === "romersk" && t.gud >= 5,
  "egyptisk-5": (t) => t.gren === "egyptisk" && t.gud >= 5,
  "prestisje-1": (t) => t.prestisje >= 1, "prestisje-3": (t) => t.prestisje >= 3, "prestisje-5": (t) => t.prestisje >= 5,
  "trykknivå-25": (t) => t.trykkNiva >= 25, "trykknivå-100": (t) => t.trykkNiva >= 100,
  "aksje-100-en": (t) => AKSJER.some((a) => t.aksjer[a.id] >= 100),
  "aksjer-500": (t) => AKSJER.reduce((s, a) => s + t.aksjer[a.id], 0) >= 500,
  "gf-10": (t) => AKSJER.reduce((s, a) => s + gfAntall(t, a.id), 0) >= 10,
  "kr-trilliard": (t) => t.totalt >= 1e23,
  "inntekt-mill": (t) => perSekund(t) >= 1e8, "inntekt-mrd": (t) => perSekund(t) >= 1e11,
  "obl-3": (t) => antallObl(t) >= OBL.maksSamtidig,
  "strategi-avers": (t) => t.strategi === "avers", "strategi-noytral": (t) => t.strategi === "noytral", "strategi-glad": (t) => t.strategi === "glad",
  "ikon-episk": (t) => t.ikoner.some((id) => ["episk", "legendarisk", "mytisk"].includes(ikon(id)?.sjelden)),
};

/**
 * Gir nye prestasjoner: de du har nådd, og hendelsene i listen (for eksempel «lotto-7»).
 * Gir { tilstand, nye } der nye er prestasjonene du nettopp fikk.
 */
export function prestasjonerSteg(t, hendelser = []) {
  const har = new Set(t.prestasjoner ?? []);
  const nye = PRESTASJONER.filter((p) => !har.has(p.id) && (hendelser.includes(p.id) || MAL[p.id]?.(t)));
  if (!nye.length) return { tilstand: t, nye };
  return { tilstand: { ...t, prestasjoner: [...har, ...nye.map((p) => p.id)] }, nye };
}

// ---------- Prestisje ----------

/** Alt som kan kjøpes: alle selskapene, alle boosterne, full rådgiver, alle ikonene og den høyeste guden. */
export function prestisjeMangler(t) {
  const mangler = [];
  const aksjer = AKSJER.filter((a) => !(t.aksjer[a.id] > 0)).length;
  if (aksjer) mangler.push(`${aksjer} selskap${aksjer === 1 ? "" : "er"}`);
  const boostere = BOOSTERE.filter((b) => !har(t, b.id)).length;
  if (boostere) mangler.push(`${boostere} booster${boostere === 1 ? "" : "e"}`);
  if ((t.radgiver ?? 0) < RADGIVER_NIVAER) mangler.push("full rådgiver");
  const ikoner = IKONER.filter((i) => !i.prestisje && !t.ikoner.includes(i.id)).length;
  if (ikoner) mangler.push(`${ikoner} ikon${ikoner === 1 ? "" : "er"}`);
  if ((t.gud ?? 0) < 5) mangler.push("den høyeste guden");
  return mangler;
}

export function kanPrestisje(t) {
  return prestisjeMangler(t).length === 0;
}

/** Nytt spill med dobbelt av alt. Ikonene og lottorekkene du har betalt for, blir med. */
export function prestisje(t) {
  if (!kanPrestisje(t)) return t;
  const ny = nyTilstand();
  return {
    ...ny, prestisje: (t.prestisje ?? 0) + 1, ikoner: [...new Set([...t.ikoner, "fonix"])], ikon: "fonix", lodd: t.lodd,
    prestasjoner: t.prestasjoner ?? [], alleTrykk: t.alleTrykk ?? 0,
  };
}

// ---------- Investeringsrådgiveren ----------

const RADGIVER_NIVAER = Math.round((REGLER.radgiverMaks - REGLER.radgiverStart) / REGLER.radgiverSteg) + 1;

/** Sjansen for at rådgiveren peker på den rimeligste aksjen, eller 0 når han ikke er ansatt. */
export function radgiverTreff(t) {
  const n = t.radgiver ?? 0;
  return n > 0 ? Math.round((REGLER.radgiverStart + REGLER.radgiverSteg * (n - 1)) * 100) / 100 : 0;
}

/** Prisen for å ansette ham, så for hver oppgradering. Oppgraderingene koster et antall sekunder utbytte. */
export function prisRadgiver(t) {
  const n = t.radgiver ?? 0;
  if (n === 0) return REGLER.radgiverPris;
  if (n >= RADGIVER_NIVAER) return Infinity;
  return Math.max(1, Math.ceil(perSekund(t) * REGLER.radgiverSek[n - 1]));
}

export function kjopRadgiver(t) {
  const pris = prisRadgiver(t);
  if (!(pris <= t.saldo)) return t;
  return { ...t, saldo: t.saldo - pris, radgiver: (t.radgiver ?? 0) + 1 };
}

/** Om rådgiveren vises: når han er ansatt, eller når du har tjent halve prisen. */
export function radgiverSynlig(t) {
  return (t.radgiver ?? 0) > 0 || t.totalt >= REGLER.radgiverPris * REGLER.visFra;
}

/** Selskapene du kan kjøpe, fra rimeligst til dyrest: mest utbytte per krone for neste aksje først. */
export function rimeligst(t) {
  return synlige(t).filter((s) => s.status === "apen")
    .map(({ id }) => ({ id, verdi: utbyttePerAksje(t, id) / prisAksje(t, id, 1) }))
    .sort((a, b) => b.verdi - a.verdi)
    .map((x) => x.id);
}

/**
 * Sjansen for at rådgiveren peker på hvert selskap. Den rimeligste får treffsikkerheten hans.
 * Resten fordeles som en normalfordeling nedover listen, så han oftest bommer med lite.
 */
export function radgiverFordeling(t) {
  const liste = rimeligst(t);
  const treff = radgiverTreff(t);
  if (!liste.length || treff === 0) return [];
  if (liste.length === 1) return [{ id: liste[0], p: 1 }];
  const vekter = liste.slice(1).map((_, i) => Math.exp(-((i + 1) ** 2) / (2 * REGLER.radgiverSpredning ** 2)));
  const sum = vekter.reduce((a, b) => a + b, 0);
  return liste.map((id, i) => ({ id, p: i === 0 ? treff : ((1 - treff) * vekter[i - 1]) / sum }));
}

/** Selskapet rådgiveren peker på nå, eller null når han ikke er ansatt. */
export function radgiverPek(t, rng = Math.random) {
  const fordeling = radgiverFordeling(t);
  let x = rng();
  for (const { id, p } of fordeling) {
    if (x < p) return id;
    x -= p;
  }
  return fordeling.at(-1)?.id ?? null;
}

/**
 * Hvilke selskaper som vises: de du eier, de du snart har råd til, og det neste som skygge.
 * Gir en liste med { id, status } der status er «apen» eller «skygge».
 */
export function synlige(t) {
  const liste = [];
  for (const [i, a] of AKSJER.entries()) {
    const apen = i === 0 || t.aksjer[a.id] > 0 || t.totalt >= a.pris * REGLER.visFra;
    if (apen) liste.push({ id: a.id, status: "apen" });
    else { liste.push({ id: a.id, status: "skygge" }); break; }
  }
  return liste;
}

// ---------- Lagring ----------

const tall = (x) => typeof x === "number" && Number.isFinite(x) && x >= 0;
const heltall = (x, maksimum) => Number.isInteger(x) && x >= 0 && x <= maksimum;

/** Tilstanden som et enkelt objekt som kan gjøres om til tekst. Uro lagres ikke. */
export function tilLagring(t, tid) {
  const { uro, ...resten } = t;
  return { v: 2, tid, ...resten };
}

/** Leser en lagret tilstand. Gir null når noe mangler eller ikke er gyldig. Lagring fra tidligere utgaver avvises, så alle starter på null. */
export function fraLagring(obj) {
  if (!obj || typeof obj !== "object") return null;
  const t = nyTilstand();
  const tid = tall(obj.tid) ? obj.tid : null;
  if (obj.v !== 2) return null;
  if (!tall(obj.saldo) || !tall(obj.totalt)) return null;
  if (!heltall(obj.trykk, Number.MAX_SAFE_INTEGER) || !heltall(obj.trykkNiva, 1e6)) return null;
  t.saldo = obj.saldo; t.totalt = obj.totalt; t.trykk = obj.trykk; t.trykkNiva = obj.trykkNiva;
  for (const a of AKSJER) {
    const n = obj.aksjer?.[a.id] ?? 0;
    if (!heltall(n, 1e5)) return null;
    t.aksjer[a.id] = n;
  }
  if (!Array.isArray(obj.boostere) || !obj.boostere.every((id) => typeof id === "string")) return null;
  t.boostere = [...new Set(obj.boostere.filter((id) => booster(id)))];
  const radgiver = obj.radgiver ?? 0;
  if (!heltall(radgiver, RADGIVER_NIVAER)) return null;
  t.radgiver = radgiver;
  if (!Array.isArray(obj.ventende)) return null;
  const endelig = (x) => typeof x === "number" && Number.isFinite(x);
  for (const v of obj.ventende.slice(0, 20)) {
    if (!v || !endelig(v.sum) || !tall(v.igjen)) return null;
    const lovet = endelig(v.lovet) ? Math.max(v.lovet, v.sum) : v.sum;
    const pris = tall(v.pris) ? v.pris : 0;
    const igjen = Math.min(v.igjen, OBL.lopetid);
    const lengde = tall(v.lengde) ? Math.min(Math.max(v.lengde, igjen), OBL.lopetid) : igjen;
    const ny = { sum: v.sum, lovet, pris, igjen, lengde };
    if (typeof v.navn === "string") ny.navn = v.navn.slice(0, 60);
    if (v.obl === true) ny.obl = true;
    t.ventende.push(ny);
  }
  if (typeof obj.ikoner !== "undefined") {
    if (!Array.isArray(obj.ikoner)) return null;
    t.ikoner = [...new Set(["deg", ...obj.ikoner.map((id) => GAMLE_IKONER[id] ?? id).filter((id) => ikon(id))])];
  }
  const valgt = GAMLE_IKONER[obj.ikon] ?? obj.ikon;
  if (t.ikoner.includes(valgt)) t.ikon = valgt;
  if (obj.gren !== undefined && obj.gren !== null) {
    if (!grein(obj.gren) || !heltall(obj.gud, 5)) return null;
    t.gren = obj.gren; t.gud = obj.gud;
  }
  if (STRATEGIER.some((s) => s.id === obj.strategi)) t.strategi = obj.strategi;
  if (tall(obj.giring)) t.giring = Math.min(STRATEGI.giringMaks, Math.max(STRATEGI.giringMin, obj.giring));
  if (obj.prestisje !== undefined && !heltall(obj.prestisje, 100)) return null;
  t.prestisje = obj.prestisje ?? 0;
  if (Array.isArray(obj.prestasjoner)) t.prestasjoner = [...new Set(obj.prestasjoner.filter((id) => PRESTASJONER.some((p) => p.id === id)))];
  t.alleTrykk = heltall(obj.alleTrykk, Number.MAX_SAFE_INTEGER) ? obj.alleTrykk : t.trykk;
  if (Array.isArray(obj.lodd)) {
    for (const l of obj.lodd.slice(0, 50)) {
      if (!l || !Number.isInteger(l.runde) || !heltall(l.antall, LOTTO.maksRekker) || l.antall < 1 || !heltall(l.fro, 4294967295)) return null;
      t.lodd.push({ runde: l.runde, antall: l.antall, fro: l.fro });
    }
  }
  return { tilstand: t, tid };
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
