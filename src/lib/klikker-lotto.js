// Lotto i «Overfør»: samme spill som vanlig Lotto fra Norsk Tipping, 7 av 34 tall og ett tilleggstall, 5 kr per rekke.
// Trekningene følger en felles klokke, så alle spillere får samme trekning med samme tall.
// Alle beløp er i øre. Rene funksjoner uten avhengigheter til nettleseren.

export const LOTTO = Object.freeze({
  tall: 34,
  trekk: 7,
  pris: 500,               // 5 kr per rekke (Norsk Tippings kundevilkår, sett november 2026)
  premieandel: 0.5,        // om lag halvparten av innsatsen går tilbake som premier (Store norske leksikon)
  // Andelen av premiepotten for hver premiegruppe (Wikipedia, «Lotto (Norge)»). Andelen som gikk til Millionsjansen er tatt ut,
  // så summen er 92 %. I ekte Lotto deles potten på vinnerne. Her får du det en vinner får i snitt, regnet ut av sjansen.
  grupper: Object.freeze([
    Object.freeze({ id: "7", navn: "7 rette", rette: 7, tillegg: false, andel: 0.372 }),
    Object.freeze({ id: "6+1", navn: "6 rette + tilleggstall", rette: 6, tillegg: true, andel: 0.0525 }),
    Object.freeze({ id: "6", navn: "6 rette", rette: 6, tillegg: false, andel: 0.055 }),
    Object.freeze({ id: "5", navn: "5 rette", rette: 5, tillegg: null, andel: 0.06 }),
    Object.freeze({ id: "4", navn: "4 rette", rette: 4, tillegg: null, andel: 0.38 }),
  ]),
  intervall: 330,          // sekunder mellom hver trekning i snitt
  slingring: 30,           // hver trekning flyttes 0 til 30 sekunder, så det går 5 til 6 minutter mellom dem
  salg: 60,                // du kan kjøpe rekker i ett minutt, så trekkes tallene
  maksRekker: 10000,       // flest rekker per trekning
  aversTilbake: 0.2,       // risikoavers strategi: 20 % tilbake for hver rekke uten premie
});

function binom(n, k) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

export const MULIGE_REKKER = binom(LOTTO.tall, LOTTO.trekk);   // 5 379 616

/** Sjansen for en premiegruppe på én rekke. Tilleggstallet trekkes blant de 27 tallene som ikke ble trukket. */
export function sjanse(gruppe) {
  const { tall, trekk } = LOTTO;
  const andre = tall - trekk;
  const kombinasjoner = binom(trekk, gruppe.rette) * binom(andre, trekk - gruppe.rette);
  let p = kombinasjoner / MULIGE_REKKER;
  if (gruppe.tillegg === true) p *= (trekk - gruppe.rette) / andre;
  if (gruppe.tillegg === false) p *= 1 - (trekk - gruppe.rette) / andre;
  return p;
}

/** Premien for en gruppe: det gruppen får av innsatsen, delt på sjansen, rundet ned til hele kroner. */
export function premie(gruppe) {
  return Math.floor((LOTTO.pris * LOTTO.premieandel * gruppe.andel) / sjanse(gruppe) / 100) * 100;
}

export const PREMIER = Object.freeze(LOTTO.grupper.map((g) => Object.freeze({ ...g, sjanse: sjanse(g), premie: premie(g) })));

// ---------- Tilfeldighet som er lik for alle ----------

/** Et heltall fra et heltall, så samme trekning gir samme tall overalt. */
export function blande(x) {
  let h = (x ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/** En tallrekke fra 0 til 1 som alltid blir lik for samme frø. */
export function froRng(fro) {
  let a = fro >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Trekker de første tallene fra 1 til 34 i tilfeldig rekkefølge. */
function trekkTall(rng, antall) {
  const tall = Array.from({ length: LOTTO.tall }, (_, i) => i + 1);
  for (let i = 0; i < antall; i++) {
    const j = i + Math.floor(rng() * (tall.length - i));
    [tall[i], tall[j]] = [tall[j], tall[i]];
  }
  return tall.slice(0, antall);
}

// ---------- Når trekningene er ----------

const forskyv = (nr) => blande(nr) % (LOTTO.slingring + 1);
const start = (nr) => nr * LOTTO.intervall + forskyv(nr);

/**
 * Trekningen som gjelder ved et tidspunkt i sekunder etter 1970: den siste som har åpnet for salg.
 * Gir { nr, apner, trekkes, neste } i sekunder. Salget er åpent fra apner til trekkes.
 */
export function runde(sek) {
  let nr = Math.floor(sek / LOTTO.intervall);
  if (start(nr) > sek) nr -= 1;
  const apner = start(nr);
  return { nr, apner, trekkes: apner + LOTTO.salg, neste: start(nr + 1) };
}

/** Når tallene i en trekning trekkes, i sekunder etter 1970. */
export function trekkTid(nr) {
  return start(nr) + LOTTO.salg;
}

/** Om salget er åpent. */
export function apen(r, sek) {
  return sek >= r.apner && sek < r.trekkes;
}

/** Vinnertallene i en trekning: sju tall i stigende rekkefølge og et tilleggstall. Det samme for alle. */
export function vinnertall(nr) {
  const tall = trekkTall(froRng(blande(nr * 2 + 1)), LOTTO.trekk + 1);
  return { tall: tall.slice(0, LOTTO.trekk).sort((a, b) => a - b), tillegg: tall[LOTTO.trekk] };
}

/** Premiegruppen for en rekke, eller null. */
export function gruppeFor(rekke, trekning) {
  const vinn = new Set(trekning.tall);
  const rette = rekke.filter((x) => vinn.has(x)).length;
  const tillegg = rekke.includes(trekning.tillegg);
  return PREMIER.find((g) => g.rette === rette && (g.tillegg === null || g.tillegg === tillegg)) ?? null;
}

/** Lyntips: rekkene i et kjøp, laget av frøet, så de kan regnes ut igjen ved trekningen. */
export function rekker(fro, antall) {
  const rng = froRng(fro);
  return Array.from({ length: antall }, () => trekkTall(rng, LOTTO.trekk).sort((a, b) => a - b));
}

/**
 * Resultatet av et kjøp. Gir antall vinnerrekker i hver gruppe, samlet premie og den beste rekken.
 * Med tilbake = 0,2 får du 20 % av prisen tilbake for hver rekke uten premie.
 */
export function resultat(kjop, tilbake = 0) {
  const trekning = vinnertall(kjop.runde);
  const treff = Object.fromEntries(PREMIER.map((g) => [g.id, 0]));
  let beste = null, besteRette = -1, premier = 0, tomme = 0;
  for (const rekke of rekker(kjop.fro, kjop.antall)) {
    const g = gruppeFor(rekke, trekning);
    const rette = rekke.filter((x) => trekning.tall.includes(x)).length;
    if (rette > besteRette) { besteRette = rette; beste = rekke; }
    if (g) { treff[g.id]++; premier += g.premie; } else tomme++;
  }
  const refusjon = Math.floor(tomme * LOTTO.pris * tilbake);
  return { trekning, treff, premier, refusjon, gevinst: premier + refusjon, beste, besteRette, pris: kjop.antall * LOTTO.pris };
}

/** Prisen for et antall rekker. */
export function prisRekker(antall) {
  return Number.isInteger(antall) && antall >= 1 && antall <= LOTTO.maksRekker ? antall * LOTTO.pris : Infinity;
}
