// Limonadeboden: server riktig limonade før kundene går, og bruk drikkepengene på en bedre bod. Rene regler.

export const BOD = Object.freeze({
  sek: 45, ko: 4, helletid: 0.75, taalmod: 8, pris: 10,
  smaker: Object.freeze(["sitron", "jordbaer", "blaabaer", "mynte"]),
  antallSmaker: Object.freeze([2, 3, 3, 4, 4]),
  mellom: Object.freeze([2.6, 2.2, 1.9, 1.65, 1.45]),   // sekunder mellom kundene
  mal: Object.freeze([230, 320, 430, 620, 850]),
  bodFaktor: 2,                                          // hvert nivå dobler utbyttet fra alle limonadebodene, for godt
});
export const BODKJOP = Object.freeze({
  kanne: Object.freeze({ navn: "Større kanne", tekst: "Hell raskere", pris: 70 }),
  parasoll: Object.freeze({ navn: "Parasoll", tekst: "Kundene venter lenger", pris: 60 }),
  skilt: Object.freeze({ navn: "Skilt på hjørnet", tekst: "Flere kunder", pris: 80 }),
  oppskrift: Object.freeze({ navn: "Bestemors oppskrift", tekst: "Høyere pris", pris: 90 }),
});
export const BOD_MAKS = 5;

export const nyBod = () => ({ penger: 0, opp: Object.fromEntries(Object.keys(BODKJOP).map((k) => [k, 0])) });
export const prisBod = (bod, id) => ((bod.opp[id] ?? 0) >= BOD_MAKS ? Infinity : Math.round(BODKJOP[id].pris * Math.pow(1.6, bod.opp[id] ?? 0)));
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

export function lagDag(niva, bod) {
  const o = bod.opp;
  return {
    niva, tid: BOD.sek, neste: 0.4, ko: [], heller: 0, salg: 0, rekke: 0, teller: 0,
    helletid: BOD.helletid * Math.pow(0.86, o.kanne), taalmod: (BOD.taalmod - 0.5 * (niva - 1)) * (1 + 0.14 * o.parasoll),
    mellom: BOD.mellom[niva - 1] * Math.pow(0.91, o.skilt), pris: BOD.pris * (1 + 0.16 * o.oppskrift),
  };
}

/** Tiden går: nye kunder kommer, og de som har ventet for lenge, går. Gir { tilstand, hendelser }. */
export function dagSteg(d, dt, rng = Math.random) {
  if (d.tid <= 0) return { tilstand: d, hendelser: [] };
  const hendelser = [];
  let { neste, teller, rekke } = d;
  neste -= dt;
  let ko = d.ko.map((k) => ({ ...k, igjen: k.igjen - dt }));
  const gikk = ko.filter((k) => k.igjen <= 0).length;
  if (gikk) { rekke = 0; hendelser.push("gikk"); ko = ko.filter((k) => k.igjen > 0); }
  if (neste <= 0) {
    if (ko.length < BOD.ko) { ko.push({ id: ++teller, smak: BOD.smaker[Math.floor(rng() * BOD.antallSmaker[d.niva - 1])], igjen: d.taalmod, person: Math.floor(rng() * 6) }); hendelser.push("kom"); }
    neste = d.mellom * (0.7 + 0.6 * rng());
  }
  return { tilstand: { ...d, tid: Math.max(0, d.tid - dt), neste, teller, rekke, ko, heller: Math.max(0, d.heller - dt) }, hendelser };
}

/** Server den første i køen. Riktig smak gir prisen og drikkepenger, mer jo flere på rad. Feil smak gjør kunden utålmodig. */
export function server(d, smak) {
  if (d.tid <= 0 || d.heller > 0 || !d.ko.length) return { tilstand: d, resultat: null };
  const [k, ...resten] = d.ko;
  if (k.smak !== smak) return { tilstand: { ...d, rekke: 0, heller: d.helletid * 0.6, ko: [{ ...k, igjen: k.igjen - d.taalmod * 0.35 }, ...resten] }, resultat: { riktig: false, belop: 0 } };
  const belop = Math.round(d.pris * (1 + 0.5 * Math.max(0, k.igjen / d.taalmod)) * (1 + 0.04 * Math.min(10, d.rekke)));
  return { tilstand: { ...d, ko: resten, heller: d.helletid, salg: d.salg + belop, rekke: d.rekke + 1 }, resultat: { riktig: true, belop } };
}
export const dagKlart = (d) => d.salg >= BOD.mal[d.niva - 1];
