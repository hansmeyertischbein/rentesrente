// Vakten på grisen i «Overfør»: kjenner igjen trykk som kommer fra skript, autoklikkere og nettleserroboter.
// Rene regler uten nettleser. Vakten kan aldri være tett, siden spillet kjører hos spilleren, men den stopper det enkle.
// Mistanke gir en kort sjekk og ikke utestenging, så skjermlesere, tastatur og styreflater fortsatt virker.

export const VAKT = Object.freeze({
  vindu: 40,          // så mange trykk vurderes om gangen
  vinduMs: 60000,     // og de må ha kommet innen ett minutt
  kortMs: 8,          // en robot trykker ned og slipper nesten samtidig
  andelKorte: 0.95,
  jevnhet: 0.03,      // spredningen i pausene delt på snittet: mennesker er aldri så jevne
  fri: 300,           // etter en bestått sjekk er det så mange trykk til neste
  ventSek: 30,        // den som ikke kan fange mynten, kan vente i stedet
  mynter: 3,          // så mange ganger må mynten fanges
});

export function nyVakt(sperret = false) {
  return { trykk: [], fri: 0, sperret };
}

/** Om trykket skal avvises med en gang: laget av et skript, eller nettleseren styres av et program. */
export function avvist({ ekte, styrt }) {
  return ekte !== true || styrt === true;
}

/** Jevnheten i pausene: standardavviket delt på snittet. Uendelig når det er for få trykk. */
export function jevnhet(tider) {
  if (tider.length < 3) return Infinity;
  const pauser = tider.slice(1).map((x, i) => x - tider[i]);
  const snitt = pauser.reduce((a, b) => a + b, 0) / pauser.length;
  if (!(snitt > 0)) return Infinity;
  const varians = pauser.reduce((s, x) => s + (x - snitt) ** 2, 0) / pauser.length;
  return Math.sqrt(varians) / snitt;
}

/**
 * Om trykkene i vinduet ser ut som en robots. Enten er pausene helt jevne, eller så er nesten alle trykkene
 * uten varighet på nøyaktig samme punkt. Trykk uten varighet (skjermleser) teller ikke som korte.
 */
export function mistenkelig(trykk) {
  if (trykk.length < VAKT.vindu) return false;
  const siste = trykk.slice(-VAKT.vindu);
  if (siste.at(-1).tid - siste[0].tid > VAKT.vinduMs) return false;
  if (jevnhet(siste.map((x) => x.tid)) < VAKT.jevnhet) return true;
  const korte = siste.filter((x) => Number.isFinite(x.varighet) && x.varighet < VAKT.kortMs).length;
  const sammePunkt = siste.every((x) => x.x === siste[0].x && x.y === siste[0].y);
  return sammePunkt && korte >= VAKT.andelKorte * VAKT.vindu;
}

/** Tar imot et trykk { tid, varighet, x, y }. Gir den nye vakten. sperret betyr at sjekken må bestås først. */
export function registrer(vakt, trykk) {
  if (vakt.sperret) return vakt;
  if (vakt.fri > 0) return { ...vakt, fri: vakt.fri - 1 };
  const liste = [...vakt.trykk, trykk].slice(-VAKT.vindu);
  return { ...vakt, trykk: liste, sperret: mistenkelig(liste) };
}

/** Sjekken er bestått. */
export function slippInn() {
  return { trykk: [], fri: VAKT.fri, sperret: false };
}
