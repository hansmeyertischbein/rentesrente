// Meglerhuset: kjøp på bunn og selg på topp i tre svært urolige aktiva før børsen stenger. Rene regler.

export const MEGLER = Object.freeze({
  steg: 240, for: 50, perSek: 4, start: 10000,   // for er kursene du ser før børsen åpner
  aktiva: Object.freeze([
    Object.freeze({ id: "tulipan", navn: "Tulipanløk", grunn: 120, uro: 0.055, trekk: 0.05, hopp: 0.02 }),
    Object.freeze({ id: "grisecoin", navn: "Grisecoin", grunn: 40, uro: 0.085, trekk: 0.06, hopp: 0.035 }),
    Object.freeze({ id: "rakett", navn: "Rakettfrø", grunn: 260, uro: 0.065, trekk: 0.045, hopp: 0.025 }),
  ]),
  mal: Object.freeze([0.3, 0.7, 1.3, 2.2, 4]),   // så mye pengene må vokse
});
const normal = (rng) => Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());

/** Kursene for hele dagen, trukket på forhånd. De svinger kraftig rundt et nivå som flytter seg, med hopp innimellom. */
export function lagKurser(rng = Math.random) {
  return MEGLER.aktiva.map((a) => {
    let x = (rng() - 0.5) * 0.5, midt = 0;
    return Array.from({ length: MEGLER.for + MEGLER.steg + 1 }, () => {
      midt += 0.012 * normal(rng) - 0.01 * midt;
      x += a.trekk * (midt - x) + a.uro * normal(rng) + (rng() < a.hopp ? (rng() - 0.5) * 0.5 : 0);
      x = Math.max(-1.1, Math.min(1.1, x));
      return Math.max(1, Math.round(a.grunn * Math.exp(x) * 10) / 10);
    });
  });
}
export function lagMegler(niva, rng = Math.random) {
  return { niva, i: MEGLER.for, kurser: lagKurser(rng), penger: MEGLER.start, eier: -1, antall: 0, kjopt: 0 };
}
const SLUTT = MEGLER.for + MEGLER.steg;
/** Sekunder til børsen stenger. */
export const sekIgjen = (m) => Math.ceil((SLUTT - m.i) / MEGLER.perSek);
export const kurs = (m, a) => m.kurser[a][m.i];
export const verdi = (m) => m.penger + (m.eier >= 0 ? m.antall * kurs(m, m.eier) : 0);
/** Kjøper for alt du har. Eier du noe annet, selges det først. */
export function kjopAktiva(m, a) {
  if (!MEGLER.aktiva[a] || m.i >= SLUTT || m.eier === a) return m;
  const s = m.eier >= 0 ? selgAktiva(m) : m;
  return { ...s, eier: a, antall: s.penger / kurs(s, a), kjopt: kurs(s, a), penger: 0 };
}
export function selgAktiva(m) {
  return m.eier < 0 ? m : { ...m, penger: verdi(m), eier: -1, antall: 0, kjopt: 0 };
}
export const meglerSteg = (m) => (m.i >= SLUTT ? m : { ...m, i: m.i + 1 });
export const meglerFerdig = (m) => m.i >= SLUTT;
export const meglerKlart = (m) => verdi(m) >= MEGLER.start * (1 + MEGLER.mal[m.niva - 1]);
