// Reglene når to spiller mot hverandre i Ordjakt. Hver PC sender hele stillingen sin, ikke enkelthendelser,
// så en melding som blir borte, rettes av den neste, og begge regner ut det samme resultatet.
export const VERSJON = 2;
export const TAP_PER_TRINN = 5;
export const TAP_TAK = 15;
const MAKS_SKADE = TAP_TAK * 10;

// Treff nummer to på rad tar 5 poeng fra motspilleren, nummer tre 10, og alle etter det 15.
export const tapFor = (rekke) => Math.min(TAP_TAK, TAP_PER_TRINN * Math.max(0, rekke));
export const netto = (brutto, skade) => Math.max(0, Math.round((brutto - skade) * 10) / 10);

const heltall = (x, maks) => (Number.isFinite(x) ? Math.min(maks, Math.max(0, Math.trunc(x))) : 0);
const gyldigId = (x) => typeof x === "string" && /^[a-z0-9]{1,16}$/.test(x);

// Leser en melding fra den andre PC-en. Alt utenfor grensene klippes, og ukjente felt ignoreres.
export function tolkStatus(m) {
  if (!m || typeof m !== "object" || !gyldigId(m.id) || !gyldigId(m.fro)) return null;
  return {
    id: m.id, fro: m.fro, gammel: !(m.v >= VERSJON),
    startet: !!m.startet, ferdig: !!m.ferdig, klar: !!m.klar,
    runde: heltall(m.runde, 1e6), neste: heltall(m.neste, 1e6),
    brutto: Number.isFinite(m.brutto) ? Math.min(1500, Math.max(0, m.brutto)) : 0,
    svar: heltall(m.svar, 10), treff: heltall(m.treff, 10), skade: heltall(m.skade, MAKS_SKADE),
    seil: typeof m.seil === "string" ? m.seil : null, kule: typeof m.kule === "string" ? m.kule : null,
  };
}

// Runden starter når begge er klare for den samme runden med samme kategorier, eller når den andre allerede har startet den.
export function kanStarte(jeg, andre) {
  if (!jeg.klar || !andre?.id || andre.gammel || jeg.fro !== andre.fro) return false;
  return (andre.klar && andre.neste === jeg.neste) || (andre.startet && !andre.ferdig && andre.runde === jeg.neste);
}

// Hvilke kategorier og hvilken runde en spiller som ikke er i gang, skal følge.
export function avtal(jeg, andre) {
  if (jeg.startet) return { fro: jeg.fro, runde: jeg.runde };
  if (andre.startet) return { fro: andre.fro, runde: andre.neste };
  return { fro: andre.fro < jeg.fro ? andre.fro : jeg.fro, runde: 0 };
}
