// Spillet «Tjue år»: rene regler uten grensesnitt.
// Alle beløp er i dagens kroner. Markedet, regningene og tilbudene trekkes fra et frø,
// slik at spilleren og robotene møter nøyaktig samme tjue år.

import { lagTilfeldig } from "./sparing.js";

export const REGLER = Object.freeze({
  aar: 20,
  tilOvers: 60000,   // kroner til overs hvert år før tillegg fra kurs
  mynt: 10000,       // én mynt i tegningen
  minusrente: 20,    // prosent per år når kontoen står i minus. En spilleregel, ikke en sats fra en bank.
  utsyn: 3,          // spilleren ser dette året og de to neste
  // Tjue like sannsynlige utfall for fondet, i prosent. Eget regnestykke:
  // snitt 6 %, geometrisk snitt om lag 4,6 %, standardavvik om lag 16 %.
  utfall: Object.freeze([30, 30, 20, 20, 20, 20, 10, 10, 10, 10, 10, 10, 0, 0, 0, 0, -10, -10, -30, -30]),
  regninger: Object.freeze([
    Object.freeze({ type: "liten", andel: 0.25, fra: 5000, til: 25000, navn: Object.freeze(["Tannlege", "Ny telefon", "Sykkelen må fikses", "Vaskemaskin"]) }),
    Object.freeze({ type: "middels", andel: 0.2, fra: 25000, til: 60000, navn: Object.freeze(["Bilen på verksted", "Flytting", "Ny varmtvannsbereder"]) }),
    Object.freeze({ type: "stor", andel: 0.1, fra: 60000, til: 120000, navn: Object.freeze(["Vannskade", "Taket lekker", "Bilen må byttes"]) }),
  ]),
  regningSteg: 5000,
  // Tre tilbud om kurs i hvert spill. Vinduene er årsnummer fra 0.
  tilbud: Object.freeze([
    Object.freeze({ navn: "Fagkurs", fra: 2, til: 4, pris: Object.freeze([80000, 110000]), tillegg: Object.freeze([10000, 14000]) }),
    Object.freeze({ navn: "Videreutdanning", fra: 8, til: 10, pris: Object.freeze([70000, 100000]), tillegg: Object.freeze([9000, 13000]) }),
    Object.freeze({ navn: "Sertifisering", fra: 14, til: 16, pris: Object.freeze([40000, 70000]), tillegg: Object.freeze([8000, 12000]) }),
  ]),
});

const kr = (x) => Math.round(x);
const heltall = (r, fra, til) => fra + Math.floor(r() * (til - fra + 1));
const trinn = (r, fra, til, steg) => fra + steg * heltall(r, 0, Math.round((til - fra) / steg));

// Lager ett spill. Alt som skal skje er trukket her, men spilleren får bare se det utsyn() gir.
export function lagSpill(fro, satser, regler = REGLER) {
  const f = (Number(fro) >>> 0) || 1;
  const rMarked = lagTilfeldig(f);
  const rRegning = lagTilfeldig(Math.imul(f, 0x9e3779b1) ^ 0x51ed270b);
  const rTilbud = lagTilfeldig(Math.imul(f, 0x85ebca6b) ^ 0x2545f491);

  const marked = Array.from({ length: regler.aar }, () => regler.utfall[heltall(rMarked, 0, regler.utfall.length - 1)]);

  const regninger = Array.from({ length: regler.aar }, (_, i) => {
    const u = rRegning(), v = rRegning(), w = rRegning();
    if (i === 0) return null; // første år er fritt, så spilleren rekker å forstå brettet
    let sum = 0;
    for (const slag of regler.regninger) {
      sum += slag.andel;
      if (u < sum) {
        const antall = Math.round((slag.til - slag.fra) / regler.regningSteg) + 1;
        return {
          type: slag.type,
          navn: slag.navn[Math.floor(v * slag.navn.length)],
          fra: slag.fra,
          til: slag.til,
          belop: slag.fra + regler.regningSteg * Math.min(antall - 1, Math.floor(w * antall)),
        };
      }
    }
    return null;
  });

  const tilbud = Array(regler.aar).fill(null);
  for (const t of regler.tilbud) {
    const aar = heltall(rTilbud, t.fra, t.til);
    const pris = trinn(rTilbud, t.pris[0], t.pris[1], 5000);
    const tillegg = trinn(rTilbud, t.tillegg[0], t.tillegg[1], 1000);
    if (aar < regler.aar) tilbud[aar] = { navn: t.navn, pris, tillegg };
  }

  return {
    fro: f,
    regler,
    marked,
    regninger,
    tilbud,
    kontorente: satser.realavkastningPengemarked.verdi / 100,
    skattesats: satser.skattAksjegevinst.verdi / 100,
  };
}

export function nyTilstand(spill) {
  const r = spill.regler;
  return {
    aar: 0,
    konto: r.tilOvers,
    kontoTjent: 0, // den delen av kontoen som er renter og gevinst etter skatt
    fond: 0,
    kostpris: 0,
    tillegg: 0,
    innsatt: r.tilOvers,
    betalt: 0,     // regninger og kurs til sammen
    ferdig: false,
    logg: [],
  };
}

// Det spilleren får vite: slag og spenn for regningene, og tilbudene, tre år fram. Aldri beløpet på en regning.
export function utsyn(spill, tilstand) {
  const ut = [];
  for (let i = tilstand.aar; i < Math.min(spill.regler.aar, tilstand.aar + spill.regler.utsyn); i++) {
    const g = spill.regninger[i], t = spill.tilbud[i];
    ut.push({
      aar: i,
      regning: g ? { type: g.type, navn: g.navn, fra: g.fra, til: g.til } : null,
      tilbud: t ? { ...t, aarIgjen: spill.regler.aar - 1 - i } : null,
    });
  }
  return ut;
}

// Hvor mye som kan flyttes i år. Kjøp krever penger på konto etter et eventuelt kurs.
export function grenser(spill, tilstand, kurs = false) {
  const t = spill.tilbud[tilstand.aar];
  const pris = kurs && t ? t.pris : 0;
  return { maksKjop: Math.max(0, kr(tilstand.konto - pris)), maksSalg: Math.max(0, kr(tilstand.fond)) };
}

// Skatt ved salg av S kroner fra fondet: gevinstandelen av salget ganger skattesatsen. Tap gir ingen skatt og intet fradrag.
export function skattVedSalg(spill, tilstand, salg) {
  if (tilstand.fond <= 0 || salg <= 0) return 0;
  const andel = Math.max(0, tilstand.fond - tilstand.kostpris) / tilstand.fond;
  return kr(salg * andel * spill.skattesats);
}

// Tilstanden etter valgene, før markedet har trukket. Brukes både av spillAar og av grensesnittet mens spilleren drar.
export function fordel(spill, tilstand, valg = {}) {
  const tilbud = spill.tilbud[tilstand.aar];
  const kurs = Boolean(valg.kurs && tilbud);
  const g = grenser(spill, tilstand, kurs);
  const onsket = Number.isFinite(valg.flytt) ? kr(valg.flytt) : 0;
  const flytt = Math.min(g.maksKjop, Math.max(-g.maksSalg, onsket));
  let { konto, kontoTjent, fond, kostpris } = tilstand;
  let kjop = 0, salg = 0, skatt = 0;
  const kurspris = kurs ? tilbud.pris : 0;
  konto -= kurspris;
  if (flytt > 0) {
    kjop = flytt;
    konto -= kjop; fond += kjop; kostpris += kjop;
  } else if (flytt < 0) {
    salg = -flytt;
    skatt = skattVedSalg(spill, tilstand, salg);
    const kost = fond > 0 ? kr(kostpris * (salg / fond)) : 0;
    kontoTjent += Math.max(0, salg - kost - skatt);
    kostpris -= kost; fond -= salg; konto += salg - skatt;
    if (fond < 1) { fond = 0; kostpris = 0; }
  }
  kontoTjent = Math.min(Math.max(0, konto), kontoTjent);
  return { konto: kr(konto), kontoTjent: kr(kontoTjent), fond: kr(fond), kostpris: kr(kostpris), kjop, salg, skatt, kurs, kurspris, flytt };
}

// Spiller ett år: valgene, så markedet, så regningen, så renten, og til slutt neste års penger.
export function spillAar(spill, tilstand, valg = {}) {
  if (tilstand.ferdig) return { tilstand, hendelse: null };
  const r = spill.regler, i = tilstand.aar;
  const f = fordel(spill, tilstand, valg);
  const prosent = spill.marked[i];
  const fondEtter = kr(f.fond * (1 + prosent / 100));
  const regning = spill.regninger[i] ? spill.regninger[i].belop : 0;
  const forRente = f.konto - regning;
  const rente = forRente >= 0 ? kr(forRente * spill.kontorente) : kr(forRente * (r.minusrente / 100));
  const tillegg = tilstand.tillegg + (f.kurs ? spill.tilbud[i].tillegg : 0);
  const siste = i === r.aar - 1;
  const inn = siste ? 0 : r.tilOvers + tillegg;
  const konto = forRente + rente + inn;
  const hendelse = {
    aar: i, kjop: f.kjop, salg: f.salg, skatt: f.skatt, kurs: f.kurs, kurspris: f.kurspris,
    kursnavn: f.kurs ? spill.tilbud[i].navn : null,
    prosent, fondFor: f.fond, fondEtter, fondEndring: fondEtter - f.fond,
    regning, regningnavn: spill.regninger[i] ? spill.regninger[i].navn : null,
    kontoForRente: forRente, rente, inn, kontoEtter: konto,
  };
  const ny = {
    aar: i + 1,
    konto,
    kontoTjent: Math.min(Math.max(0, konto), f.kontoTjent + Math.max(0, rente)),
    fond: fondEtter,
    kostpris: f.kostpris,
    tillegg,
    innsatt: tilstand.innsatt + inn,
    betalt: tilstand.betalt + regning + f.kurspris,
    ferdig: siste,
    logg: [...tilstand.logg, hendelse],
  };
  return { tilstand: ny, hendelse };
}

// Sluttsummen: konto pluss fond, minus skatten på gevinsten som ennå står i fondet.
export function sluttverdi(spill, tilstand) {
  const skatt = kr(Math.max(0, tilstand.fond - tilstand.kostpris) * spill.skattesats);
  const sum = tilstand.konto + tilstand.fond - skatt;
  return { konto: tilstand.konto, fond: tilstand.fond, skatt, sum, innsatt: tilstand.innsatt, betalt: tilstand.betalt, tjent: sum - tilstand.innsatt + tilstand.betalt };
}

// Robotene får bare utsynet og tilstanden, akkurat som spilleren. De kan ikke se beløpet på en regning før den kommer.
export const ROBOTER = Object.freeze([
  Object.freeze({
    id: "madrassen",
    navn: "Madrassen",
    regel: "Lar alt stå på konto og takker nei til kurs.",
    velg: () => ({ flytt: 0, kurs: false }),
  }),
  Object.freeze({
    id: "autopiloten",
    navn: "Autopiloten",
    regel: "Setter alt i fondet hvert år, uten buffer og uten kurs.",
    velg: (syn, t) => ({ flytt: Math.max(0, t.konto), kurs: false }),
  }),
  Object.freeze({
    id: "planleggeren",
    navn: "Planleggeren",
    regel: "Har alltid 60 000 kr på konto, tar kurs som betaler seg halvannen gang, og setter resten i fondet.",
    // En fast tommelfingerregel. Den ser ikke på utsynet over regninger, og det er der spilleren kan slå den.
    velg: (syn, t) => {
      const tilbud = syn[0].tilbud;
      const kurs = Boolean(tilbud && tilbud.tillegg * tilbud.aarIgjen >= 1.5 * tilbud.pris);
      return { flytt: t.konto - (kurs ? tilbud.pris : 0) - 60000, kurs };
    },
  }),
]);

export function spillRobot(spill, robot) {
  let t = nyTilstand(spill);
  while (!t.ferdig) t = spillAar(spill, t, robot.velg(utsyn(spill, t), t)).tilstand;
  return { tilstand: t, slutt: sluttverdi(spill, t) };
}

// Dagens marked: samme frø for alle som spiller samme dag.
export function dagensFro(dato = new Date()) {
  return dato.getFullYear() * 10000 + (dato.getMonth() + 1) * 100 + dato.getDate();
}

// Nøkkeltall for utfallene, til tekst og test.
export function utfallStatistikk(utfall = REGLER.utfall) {
  const n = utfall.length;
  const snitt = utfall.reduce((a, b) => a + b, 0) / n;
  const varians = utfall.reduce((a, b) => a + (b - snitt) ** 2, 0) / n;
  const geo = (Math.exp(utfall.reduce((a, b) => a + Math.log(1 + b / 100), 0) / n) - 1) * 100;
  return { snitt, standardavvik: Math.sqrt(varians), geometrisk: geo, tapsaar: utfall.filter((x) => x < 0).length / n };
}
