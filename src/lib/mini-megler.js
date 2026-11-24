// Meglerhuset: kjøp på bunn og selg på topp i tre svært urolige aktiva før børsen stenger. Hver handel koster kurtasje,
// trendene skifter, og nyhetene stemmer ikke alltid. Rene regler.

export const MEGLER = Object.freeze({
  steg: 220, for: 50, perSek: 4, start: 10000,   // for er kursene du ser før børsen åpner
  kurtasje: Object.freeze([0.005, 0.0075, 0.01, 0.0125, 0.015]),
  sant: Object.freeze([0.75, 0.68, 0.62, 0.58, 0.55]),       // så ofte nyhetene stemmer
  nyheter: Object.freeze([4, 5, 6, 6, 7]),
  aktiva: Object.freeze([
    Object.freeze({ id: "tulipan", navn: "Tulipanløk", grunn: 120, uro: 0.05, trekk: 0.035, hopp: 0.02 }),
    Object.freeze({ id: "grisecoin", navn: "Grisecoin", grunn: 40, uro: 0.08, trekk: 0.04, hopp: 0.04 }),
    Object.freeze({ id: "rakett", navn: "Rakettfrø", grunn: 260, uro: 0.06, trekk: 0.03, hopp: 0.028 }),
  ]),
  mal: Object.freeze([0.35, 0.6, 0.9, 1.3, 1.9]),   // så mye pengene må vokse
});
const SLUTT = MEGLER.for + MEGLER.steg;
const normal = (rng) => Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());

const TEKST = Object.freeze({
  opp: ["Rykte: Alle vil ha %", "Kilder: Stor kjøper på vei inn i %", "Analytiker roper kjøp på %"],
  ned: ["Rykte: % er oppskrytt", "Kilder: Stor eier vil ut av %", "Analytiker roper salg på %"],
});
export const nyhetTekst = (n) => TEKST[n.opp ? "opp" : "ned"][n.tekst].replace("%", MEGLER.aktiva[n.a].navn);
export function lagNyheter(niva, rng = Math.random) {
  const n = MEGLER.nyheter[niva - 1], luke = (MEGLER.steg - 40) / n;
  return Array.from({ length: n }, (_, k) => ({ i: MEGLER.for + 12 + Math.floor(luke * (k + 0.7 * rng())), a: Math.floor(rng() * MEGLER.aktiva.length), opp: rng() < 0.5, tekst: Math.floor(rng() * 3), sann: rng() < MEGLER.sant[niva - 1] }));
}
/** Kursene for hele dagen, trukket på forhånd. De svinger rundt et nivå som selv trender opp og ned, med hopp og nyheter innimellom. */
export function lagKurser(rng = Math.random, nyheter = []) {
  return MEGLER.aktiva.map((a, nr) => {
    let x = (rng() - 0.5) * 0.5, midt = 0, fart = 0;
    return Array.from({ length: SLUTT + 1 }, (_, i) => {
      if (rng() < 0.03) fart = 0.016 * normal(rng);
      midt = Math.max(-0.9, Math.min(0.9, midt + fart + 0.008 * normal(rng)));
      if (Math.abs(midt) > 0.85) fart = -fart;
      for (const n of nyheter) if (n.a === nr && i > n.i + 3 && i <= n.i + 15) x += 0.028 * (n.opp === n.sann ? 1 : -1);
      x += a.trekk * (midt - x) + a.uro * normal(rng) + (rng() < a.hopp ? (rng() - 0.5) * 0.5 : 0);
      x = Math.max(-1.3, Math.min(1.3, x));
      return Math.max(1, Math.round(a.grunn * Math.exp(x) * 10) / 10);
    });
  });
}
export function lagMegler(niva, rng = Math.random) {
  const nyheter = lagNyheter(niva, rng);
  return { niva, i: MEGLER.for, nyheter, kurser: lagKurser(rng, nyheter), penger: MEGLER.start, eier: -1, antall: 0, kjopt: 0 };
}
/** Sekunder til børsen stenger. */
export const sekIgjen = (m) => Math.ceil((SLUTT - m.i) / MEGLER.perSek);
export const kurs = (m, a) => m.kurser[a][m.i];
const gebyr = (m) => 1 - MEGLER.kurtasje[m.niva - 1];
/** Det du sitter igjen med om du selger nå. */
export const verdi = (m) => m.penger + (m.eier >= 0 ? m.antall * kurs(m, m.eier) * gebyr(m) : 0);
/** Kjøper for alt du har. Eier du noe annet, selges det først. */
export function kjopAktiva(m, a) {
  if (!MEGLER.aktiva[a] || m.i >= SLUTT || m.eier === a) return m;
  const s = m.eier >= 0 ? selgAktiva(m) : m;
  return { ...s, eier: a, antall: (s.penger * gebyr(s)) / kurs(s, a), kjopt: kurs(s, a), penger: 0 };
}
export function selgAktiva(m) {
  return m.eier < 0 ? m : { ...m, penger: verdi(m), eier: -1, antall: 0, kjopt: 0 };
}
export const meglerSteg = (m) => (m.i >= SLUTT ? m : { ...m, i: m.i + 1 });
export const meglerFerdig = (m) => m.i >= SLUTT;
export const meglerKlart = (m) => verdi(m) >= MEGLER.start * (1 + MEGLER.mal[m.niva - 1]);
