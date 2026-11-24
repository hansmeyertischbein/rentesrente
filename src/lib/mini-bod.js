// Limonadeboden: se på været og sett prisen, press frukt, hell til streken, legg i is og pynt, og server før kundene går.
// Pengene du selger for, brukes på en bedre bod. Rene regler.

export const BOD = Object.freeze({
  bodFaktor: Object.freeze([1, 1.1, 1.25, 1.5, 2, 3]),    // utbyttet fra alle limonadebodene etter hvert klarte nivå, for godt
  sek: Object.freeze([70, 75, 80, 85, 90]),
  plasser: 3,
  frukt: Object.freeze(["sitron", "jordbaer", "blaabaer", "mynte"]),
  antallFrukt: Object.freeze([2, 2, 3, 3, 4]),
  pynt: Object.freeze(["sugeror", "paraply", "sukker"]),
  antallPynt: Object.freeze([1, 2, 2, 3, 3]),
  mestPress: Object.freeze([2, 3, 3, 4, 4]),
  streker: Object.freeze([0.55, 0.72, 0.88]),
  mellom: Object.freeze([6, 5.2, 4.6, 4.1, 3.7]),         // sekunder mellom kundene
  taalmod: Object.freeze([22, 20, 18, 16.5, 15.5]),
  mal: Object.freeze([390, 640, 960, 1150, 1400]),
  presstid: 0.26, helletid: 0.5, slingring: 0.06,
  prisFra: 10, prisTil: 60,
});
export const BODKJOP = Object.freeze({
  kanne: Object.freeze({ navn: "Bedre kran", tekst: "Heller raskere, og streken er snillere", pris: 110 }),
  presse: Object.freeze({ navn: "Saftpresse", tekst: "Presser frukten raskere", pris: 100 }),
  parasoll: Object.freeze({ navn: "Parasoll", tekst: "Kundene venter lenger", pris: 120 }),
  skilt: Object.freeze({ navn: "Skilt på hjørnet", tekst: "Flere kunder", pris: 140 }),
  oppskrift: Object.freeze({ navn: "Bestemors oppskrift", tekst: "Kundene betaler mer", pris: 160 }),
  katt: Object.freeze({ navn: "Vaktkatt", tekst: "Måker og veps kommer sjeldnere", pris: 90 }),
});
export const BOD_MAKS = 5;

export const nyBod = () => ({ penger: 0, opp: Object.fromEntries(Object.keys(BODKJOP).map((k) => [k, 0])) });
export const prisBod = (bod, id) => ((bod.opp[id] ?? 0) >= BOD_MAKS ? Infinity : Math.round((BODKJOP[id].pris * Math.pow(1.65, bod.opp[id] ?? 0)) / 10) * 10);
export function kjopBod(bod, id) {
  if (!BODKJOP[id] || prisBod(bod, id) > bod.penger) return bod;
  return { penger: bod.penger - prisBod(bod, id), opp: { ...bod.opp, [id]: (bod.opp[id] ?? 0) + 1 } };
}
/** Leser en lagret bod, eller gir en ny. */
export function lesBod(o) {
  const b = nyBod();
  if (Number.isFinite(o?.penger) && o.penger >= 0) b.penger = Math.floor(o.penger);
  for (const k of Object.keys(b.opp)) if (Number.isInteger(o?.opp?.[k]) && o.opp[k] >= 0 && o.opp[k] <= BOD_MAKS) b.opp[k] = o.opp[k];
  return b;
}

// ---------- Været og prisen ----------

const VAER = Object.freeze([
  Object.freeze({ id: "sol", navn: "Sol", fra: 24, til: 33, kunder: 1 }),
  Object.freeze({ id: "sky", navn: "Skyet", fra: 16, til: 23, kunder: 0.9 }),
  Object.freeze({ id: "regn", navn: "Regn", fra: 11, til: 16, kunder: 0.72 }),
]);
export function lagVaer(rng = Math.random) {
  const u = rng(), v = VAER[u < 0.5 ? 0 : u < 0.82 ? 1 : 2];
  return { ...v, grader: Math.round(v.fra + (v.til - v.fra) * rng()) };
}
/** Prisen kundene synes er grei: høyere jo varmere det er, og jo bedre oppskriften er. */
export const greiPris = (vaer, bod) => Math.round((9 + 0.5 * vaer.grader) * (1 + 0.12 * (bod.opp.oppskrift ?? 0)));
/** Hvor mange kunder en pris gir, der 1 er vanlig. Dyrt gir færre, billig gir flere. */
export function kundestrom(pris, vaer, bod) {
  return vaer.kunder * Math.max(0.3, Math.min(1.45, Math.pow(greiPris(vaer, bod) / pris, 1.35)));
}

/** Målet for dagen. Det er lavere når været er dårlig. */
export const malFor = (niva, vaer) => Math.round((BOD.mal[niva - 1] * (1 - (1 - Math.min(1.05, 0.036 * vaer.grader)) * [1, 1, 1, 0.8, 0.66][niva - 1])) / 10) * 10;

// ---------- Dagen ----------

export const nyttGlass = () => ({ frukt: {}, press: 0, is: 0, fyll: 0, pynt: null, solt: false });
export function lagDag(niva, bod, pris = 20, vaer = { id: "sol", grader: 26, kunder: 1 }) {
  const o = bod.opp, i = niva - 1;
  return {
    niva, tid: BOD.sek[i], slutt: BOD.sek[i], neste: 0.6, ko: [], glass: nyttGlass(), opptatt: 0, heller: false, salg: 0, rekke: 0, best: 0, teller: 0, servert: 0, gikk: 0,
    maake: null, maakeOm: niva >= 2 ? 14 * (1 + 0.25 * o.katt) : Infinity, vepsOm: niva >= 3 ? 11 * (1 + 0.25 * o.katt) : Infinity, sist: 0,
    vaer, pris, presstid: BOD.presstid * Math.pow(0.85, o.presse), hellefart: BOD.helletid * (1 + 0.14 * o.kanne), slingring: BOD.slingring + 0.014 * o.kanne,
    taalmod: BOD.taalmod[i] * (1 + 0.1 * o.parasoll), mellom: (BOD.mellom[i] * Math.pow(0.92, o.skilt)) / kundestrom(pris, vaer, bod), katt: o.katt,
    greit: greiPris(vaer, bod),
  };
}
const heltall = (rng, n) => Math.floor(rng() * n);
export function lagOrdre(niva, rng = Math.random) {
  const i = niva - 1, frukt = {}, press = 1 + heltall(rng, BOD.mestPress[i]), slag = BOD.frukt.slice(0, BOD.antallFrukt[i]);
  for (let k = 0; k < press; k++) { const f = slag[heltall(rng, slag.length)]; frukt[f] = (frukt[f] ?? 0) + 1; }
  return { frukt, is: heltall(rng, niva >= 3 ? 4 : 3), strek: BOD.streker[heltall(rng, 3)], pynt: rng() < 0.35 + 0.1 * niva ? BOD.pynt[heltall(rng, BOD.antallPynt[i])] : null };
}

/** Tiden går. Gir { tilstand, hendelser }. */
export function dagSteg(d, dt, rng = Math.random) {
  if (d.tid <= 0) return { tilstand: d, hendelser: [] };
  const h = [], n = { ...d, tid: Math.max(0, d.tid - dt), opptatt: Math.max(0, d.opptatt - dt), glass: { ...d.glass } };
  if (n.heller) {
    n.glass.fyll += n.hellefart * dt;
    if (n.glass.fyll >= 1) { n.glass.fyll = 1; n.glass.solt = true; n.heller = false; h.push("sol"); }
  }
  n.ko = d.ko.map((k) => ({ ...k, igjen: k.igjen - dt * (k.veps ? 2.2 : 1) }));
  for (const k of n.ko) if (k.igjen <= 0) { n.gikk++; n.rekke = 0; h.push("gikk"); }
  n.ko = n.ko.filter((k) => k.igjen > 0);
  n.neste -= dt;
  if (n.neste <= 0) {
    const ledig = [...Array(BOD.plasser).keys()].find((p) => !n.ko.some((k) => k.plass === p));
    if (ledig !== undefined && n.tid > 4) {
      const dyrt = Math.max(0.65, Math.min(1.15, Math.pow(d.greit / d.pris, 0.5)));
      n.ko.push({ id: ++n.teller, plass: ledig, ordre: lagOrdre(d.niva, rng), igjen: d.taalmod * dyrt, tid: d.taalmod * dyrt, person: heltall(rng, 6), veps: false });
      h.push("kom");
      n.neste = d.mellom * (0.65 + 0.7 * rng());
    } else n.neste = 0.4;
  }
  // Måka vil ha myntene, og vepsen plager kundene.
  if (n.maake) { n.maake = { ...n.maake, igjen: n.maake.igjen - dt }; if (n.maake.igjen <= 0) { const tap = Math.round(n.sist * 0.5); n.salg = Math.max(0, n.salg - tap); n.maake = null; h.push({ type: "stjal", tap }); } }
  else if ((n.maakeOm -= dt) <= 0) { n.maakeOm = (12 + 8 * rng()) * (1 + 0.3 * d.katt); if (n.sist > 0) { n.maake = { igjen: 2.6 + 0.3 * d.katt, side: rng() < 0.5 ? -1 : 1 }; h.push("maake"); } }
  if ((n.vepsOm -= dt) <= 0) { n.vepsOm = (9 + 7 * rng()) * (1 + 0.3 * d.katt); const fri = n.ko.filter((k) => !k.veps); if (fri.length) { fri[heltall(rng, fri.length)].veps = true; h.push("veps"); } }
  return { tilstand: n, hendelser: h };
}

const klar = (d) => d.tid > 0 && d.opptatt <= 0;
export function press(d, frukt) {
  if (!klar(d) || d.heller || d.glass.press >= 5 || !BOD.frukt.slice(0, BOD.antallFrukt[d.niva - 1]).includes(frukt)) return d;
  return { ...d, opptatt: d.presstid, glass: { ...d.glass, press: d.glass.press + 1, frukt: { ...d.glass.frukt, [frukt]: (d.glass.frukt[frukt] ?? 0) + 1 } } };
}
export const leggIs = (d) => (!klar(d) || d.glass.is >= 4 ? d : { ...d, opptatt: 0.14, glass: { ...d.glass, is: d.glass.is + 1 } });
export const hell = (d, paa) => (d.tid <= 0 || d.heller === paa || (paa && (d.opptatt > 0 || d.glass.fyll >= 1)) ? d : { ...d, heller: paa });
export const pynt = (d, id) => (!klar(d) || !BOD.pynt.slice(0, BOD.antallPynt[d.niva - 1]).includes(id) ? d : { ...d, opptatt: 0.12, glass: { ...d.glass, pynt: d.glass.pynt === id ? null : id } });
export const tomGlass = (d) => (d.tid <= 0 ? d : { ...d, heller: false, opptatt: 0.3, glass: nyttGlass() });
export const jagMaake = (d) => (d.maake ? { ...d, maake: null } : d);
export const jagVeps = (d, id) => ({ ...d, ko: d.ko.map((k) => (k.id === id ? { ...k, veps: false } : k)) });

/** Hvor godt glasset treffer bestillingen, fra 0 til 1. */
export function kvalitet(glass, ordre, slingring = BOD.slingring) {
  let q = 1;
  for (const f of BOD.frukt) q -= 0.28 * Math.abs((glass.frukt[f] ?? 0) - (ordre.frukt[f] ?? 0));
  q -= 0.14 * Math.abs(glass.is - ordre.is);
  if (glass.pynt !== ordre.pynt) q -= 0.22;
  q -= Math.max(0, Math.abs(glass.fyll - ordre.strek) - slingring) * 2.4;
  if (glass.solt) q -= 0.15;
  return Math.max(0, Math.min(1, q));
}
/** Serverer glasset til en kunde. Er det for dårlig, vil kunden ikke ha det og blir utålmodig. */
export function server(d, id) {
  const k = d.ko.find((x) => x.id === id);
  if (!k || d.tid <= 0 || d.heller || d.glass.fyll < 0.15) return { tilstand: d, resultat: null };
  const q = kvalitet(d.glass, k.ordre, d.slingring), tomt = { ...d, glass: nyttGlass(), opptatt: 0.2 };
  if (q < 0.4) return { tilstand: { ...tomt, rekke: 0, ko: d.ko.map((x) => (x === k ? { ...x, igjen: x.igjen - x.tid * 0.3 } : x)) }, resultat: { riktig: false, q, belop: 0 } };
  const perfekt = q >= 0.97, rekke = perfekt ? d.rekke + 1 : 0;
  const belop = Math.round(d.pris * (0.35 + 0.65 * q) * (1 + 0.3 * Math.max(0, k.igjen / k.tid)) * (1 + 0.06 * Math.min(8, d.rekke)));
  return { tilstand: { ...tomt, ko: d.ko.filter((x) => x !== k), salg: d.salg + belop, sist: belop, rekke, best: Math.max(d.best, rekke), servert: d.servert + 1 }, resultat: { riktig: true, perfekt, q, belop } };
}
export const dagKlart = (d) => d.salg >= malFor(d.niva, d.vaer);
