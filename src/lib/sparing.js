// Regnelogikken bak «Hvor mye blir sparingen din verdt?».
// Rene funksjoner: samme inndata gir alltid samme svar, også simuleringen (fast frø).
//
// Inndata (prosent som tall, 6.6 betyr 6,6 %):
//   start      startbeløp i kroner, står fra dag én
//   mnd        månedlig sparing i kroner, settes inn på slutten av hver måned
//   ar         antall år
//   avk        forventet avkastning per år før kostnader, geometrisk (det typiske utfallet)
//   kost       årlig kostnad
//   infl       inflasjon per år
//   sving      årlig svingning i avkastningen (standardavvik)
//   skatt      "salg" (skatt på gevinsten når du selger), "aar" (skatt på avkastningen hvert år) eller "ingen"
//   skattesats skattesatsen som hører til valget over

export const GRENSER = {
  start: { min: 0, max: 100_000_000 },
  mnd: { min: 0, max: 1_000_000 },
  ar: { min: 1, max: 80 },
  avk: { min: -10, max: 25 },
  kost: { min: 0, max: 5 },
  infl: { min: -5, max: 20 },
  sving: { min: 0, max: 60 },
};

export const SKATTEVALG = ["salg", "aar", "ingen"];

/**
 * Avkastning per år etter kostnader, og etter skatt når avkastningen skattes hvert år.
 * Ved årlig skatt trekkes skatt bare av positiv avkastning; vi regner ikke med fradrag for tap.
 */
export function arligVekst({ avk, kost, skatt, skattesats = 0 }) {
  const etterKost = (avk - kost) / 100;
  return skatt === "aar" && etterKost > 0 ? etterKost * (1 - skattesats / 100) : etterKost;
}

/** Regner måned for måned og gir verdien ved slutten av hvert år. */
export function framskriv({ start, mnd, ar, vekst }) {
  const m = Math.pow(1 + vekst, 1 / 12) - 1;
  let verdi = start;
  let innskudd = start;
  const serie = [{ ar: 0, innskudd, verdi }];
  for (let y = 1; y <= ar; y++) {
    for (let k = 0; k < 12; k++) {
      verdi = verdi * (1 + m) + mnd;
      innskudd += mnd;
    }
    serie.push({ ar: y, innskudd, verdi });
  }
  return serie;
}

/** Hele regnestykket: sluttverdi, dagens kroner, kostnader og skatt. */
export function beregnSparing(p) {
  const vekst = arligVekst(p);
  const serie = framskriv({ start: p.start, mnd: p.mnd, ar: p.ar, vekst });
  const slutt = serie[serie.length - 1];
  const deflator = (ar) => Math.pow(1 + p.infl / 100, ar);

  const verdi = slutt.verdi;
  const innskudd = slutt.innskudd;
  const avkastning = verdi - innskudd;

  // Hva kostnadene og en årlig skatt har kostet: forskjellen mot samme sparing uten dem.
  const utenKost = framskriv({ start: p.start, mnd: p.mnd, ar: p.ar, vekst: arligVekst({ ...p, kost: 0 }) });
  const kostnader = utenKost[utenKost.length - 1].verdi - verdi;
  let skattUnderveis = 0;
  if (p.skatt === "aar") {
    const utenSkatt = framskriv({ start: p.start, mnd: p.mnd, ar: p.ar, vekst: arligVekst({ ...p, skatt: "ingen" }) });
    skattUnderveis = utenSkatt[utenSkatt.length - 1].verdi - verdi;
  }

  const skattVedSalg = p.skatt === "salg" ? (Math.max(0, avkastning) * p.skattesats) / 100 : 0;
  const etterSkatt = verdi - skattVedSalg;

  return {
    vekst,
    verdi,
    innskudd,
    avkastning,
    verdiIDag: verdi / deflator(p.ar),
    kostnader,
    skattUnderveis,
    skattVedSalg,
    etterSkatt,
    etterSkattIDag: etterSkatt / deflator(p.ar),
    serie: serie.map((s) => ({
      ...s,
      verdiIDag: s.verdi / deflator(s.ar),
      innskuddIDag: s.innskudd / deflator(s.ar),
    })),
  };
}

// Mulberry32: liten, rask og forutsigbar tallgenerator, så simuleringen gir samme svar hver gang.
export function lagTilfeldig(fro) {
  let a = fro >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lagNormal(tilfeldig) {
  let reserve = null;
  return function () {
    if (reserve !== null) {
      const z = reserve;
      reserve = null;
      return z;
    }
    let u = 0;
    while (u === 0) u = tilfeldig();
    const v = tilfeldig();
    const r = Math.sqrt(-2 * Math.log(u));
    reserve = r * Math.sin(2 * Math.PI * v);
    return r * Math.cos(2 * Math.PI * v);
  };
}

export function kvantil(sortert, q) {
  if (sortert.length === 0) return NaN;
  const pos = (sortert.length - 1) * q;
  const lav = Math.floor(pos);
  const hoy = Math.ceil(pos);
  return sortert[lav] + (sortert[hoy] - sortert[lav]) * (pos - lav);
}

/**
 * Standardavviket i logaritmisk årsavkastning som gir en gitt svingning (standardavvik i
 * vanlig årsavkastning) når den typiske (geometriske) avkastningen er gitt.
 */
export function logSvingning(geometrisk, svingning) {
  const mu = Math.log(1 + geometrisk);
  let s = svingning;
  for (let i = 0; i < 50; i++) {
    const aritmetisk = Math.exp(mu + (s * s) / 2) - 1;
    s = Math.sqrt(Math.log(1 + (svingning * svingning) / ((1 + aritmetisk) * (1 + aritmetisk))));
  }
  return s;
}

/**
 * Simulerer mange mulige forløp der avkastningen svinger tilfeldig fra år til år
 * (uavhengige år, lognormalfordelt). Gir for hvert år utfallet som 1 av 10 forløp er
 * under (lav), midten (median) og utfallet som 1 av 10 er over (hoy).
 * Gir null når svingningen er 0, fordi da er alle forløp like.
 */
export function simuler(p, { forlop = 1000, fro = 20261027 } = {}) {
  const sving = (p.skatt === "aar" ? p.sving * (1 - (p.skattesats ?? 0) / 100) : p.sving) / 100;
  if (!(sving > 0)) return null;
  const g = arligVekst(p);
  if (g <= -1) return null;
  const mu = Math.log(1 + g);
  const s = logSvingning(g, sving);
  const normal = lagNormal(lagTilfeldig(fro));

  const perAr = Array.from({ length: p.ar + 1 }, () => new Float64Array(forlop));
  for (let i = 0; i < forlop; i++) {
    let v = p.start;
    perAr[0][i] = v;
    for (let y = 1; y <= p.ar; y++) {
      const mm = Math.exp((mu + s * normal()) / 12) - 1;
      for (let k = 0; k < 12; k++) v = v * (1 + mm) + p.mnd;
      perAr[y][i] = v;
    }
  }

  const innskuddSlutt = p.start + p.mnd * 12 * p.ar;
  const slutt = perAr[p.ar];
  let under = 0;
  for (let i = 0; i < forlop; i++) if (slutt[i] < innskuddSlutt) under++;

  return {
    forlop,
    andelUnderInnskudd: under / forlop,
    serie: perAr.map((verdier, ar) => {
      verdier.sort();
      return { ar, lav: kvantil(verdier, 0.1), median: kvantil(verdier, 0.5), hoy: kvantil(verdier, 0.9) };
    }),
  };
}

/** Standardvalgene for «Hva sparer du i?», regnet ut fra satsene og kildene i satser.json. */
export function lagForhandsvalg(satser) {
  const infl = satser.inflasjonsmaal.verdi;
  const nominell = (real) => Math.round(((1 + real / 100) * (1 + infl / 100) - 1) * 1000) / 10;
  return {
    aksjefond: {
      avk: nominell(satser.realavkastningAksjer.verdi),
      kost: satser.kostnadIndeksfond.verdi,
      sving: satser.realavkastningAksjer.svingning,
      skatt: "salg",
    },
    sparekonto: {
      avk: nominell(satser.realavkastningPengemarked.verdi),
      kost: 0,
      sving: 0,
      skatt: "aar",
    },
  };
}

/** Skattesatsen som hører til et skattevalg. */
export function skattesatsFor(skatt, satser) {
  if (skatt === "salg") return satser.skattAksjegevinst.verdi;
  if (skatt === "aar") return satser.skattKapital.verdi;
  return 0;
}
