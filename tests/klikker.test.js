import { test } from "node:test";
import assert from "node:assert/strict";
import {
  REGLER, AKSJER, BOOSTERE, nyTilstand, grunnTrykk, trykkverdi, trykkAndel, fartFaktor, klikkverdi, trykk,
  perSekund, aksjeRate, utbyttePerAksje, gfAntall, faktor, prisAksje, maksAksje, kjopAksje, prisTrykk, kjopTrykk,
  nesteBoostere, andelRad, kjopBooster, generalforsamlinger, tikk, borte, uroFyll, urolig, uroSteg, lagHendelse,
  startHendelse, rabatt, ekstraTilbud, ekstraAvkastning, investerEkstra, gikkDarlig, synlige, fordeler, nyeFordeler, maksTrykk, radgiverTreff, prisRadgiver, kjopRadgiver,
  radgiverSynlig, rimeligst, radgiverFordeling, radgiverPek, pentBelop, tilLagring, fraLagring, formaterOre, formaterTid,
  prestisjeFaktor, maksBorte, tvangssalg, giring, oblInnsats, oblRente, kjopObligasjon, antallObl, kanVelgeStrategi, velgStrategi, settGiring,
  kjopIkon, velgIkon, guderSynlig, nesteGud, kjopGud, kjopLodd, loddI, avgjorLodd, prestisjeMangler, kanPrestisje, prestisje, prestasjonerSteg, giret,
} from "../src/lib/klikker.js";
import { GRENER, IKONER, OBLIGASJONER, OBL, STRATEGI, PRESTASJONER } from "../src/lib/klikker-guder.js";
import { LOTTO, PREMIER, MULIGE_REKKER, sjanse, runde, apen, vinnertall, gruppeFor, rekker, resultat, trekkTid, prisRekker } from "../src/lib/klikker-lotto.js";

const med = (endring) => ({ ...nyTilstand(), ...endring });
const medAksjer = (a, resten = {}) => med({ ...resten, aksjer: { ...nyTilstand().aksjer, ...a } });
const rent = (s) => s.replace(/[\u00a0\u202f]/g, " ");
const fast = (...tall) => { let i = 0; return () => tall[Math.min(i++, tall.length - 1)]; };
const naer = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);

test("du starter med tom konto, og ett trykk gir 10 øre", () => {
  const t = nyTilstand();
  assert.equal(t.saldo, 0);
  assert.equal(trykkverdi(t), 10);
  const etter = trykk(t);
  assert.equal(etter.saldo, 10);
  assert.equal(etter.totalt, 10);
  assert.equal(etter.trykk, 1);
  assert.equal(t.saldo, 0, "den gamle tilstanden er uendret");
});

test("overføringen gir 11 øre på nivå 1 og 12 øre på nivå 2, en tidel mer per nivå", () => {
  assert.equal(grunnTrykk(0), 10);
  assert.equal(grunnTrykk(1), 11);
  assert.equal(grunnTrykk(2), 12);
  assert.equal(grunnTrykk(100), 110);
  assert.equal(trykkverdi(med({ trykkNiva: 3 })), 13);
});

test("oppgradering av overføringen koster 10 øre først og 7 % mer per nivå", () => {
  assert.equal(prisTrykk(nyTilstand()), 10);
  assert.equal(prisTrykk(med({ trykkNiva: 1 })), Math.ceil(10 * 1.07));
  assert.equal(prisTrykk(med({ trykkNiva: 20 })), Math.ceil(10 * Math.pow(1.07, 20)));
  assert.ok(prisTrykk(med({ trykkNiva: 18 })) / (grunnTrykk(19) - grunnTrykk(18)) < 40, "nivå 18 betaler seg på under 40 trykk");
  const t = kjopTrykk(med({ saldo: 10 }));
  assert.equal(t.trykkNiva, 1);
  assert.equal(t.saldo, 0);
  assert.equal(kjopTrykk(med({ saldo: 9 })).trykkNiva, 0);
});

test("raske trykk gir fartsboost: jevnt til 2,5 ganger ved 11 i sekundet, så tungt opp mot 12 ganger", () => {
  assert.equal(fartFaktor(0), 1);
  assert.equal(fartFaktor(3), 1);
  naer(fartFaktor(7), 1.75);
  assert.equal(fartFaktor(11), 2.5);
  naer(fartFaktor(12), 2.775);
  assert.ok(fartFaktor(15) < 4, "fire trykk mer i sekundet gir under 4 ganger");
  assert.ok(fartFaktor(20) < 7);
  assert.ok(fartFaktor(25) < 12, "12 ganger krever 27 trykk i sekundet");
  assert.equal(fartFaktor(27), 12);
  assert.equal(fartFaktor(500), 12);
  assert.ok(REGLER.fartMaks > 10);
  assert.equal(fartFaktor(NaN), 1);
  naer(klikkverdi(nyTilstand(), 7), 17.5);
  naer(trykk(nyTilstand(), 7).saldo, 17.5);
});

test("første selskap gir 10 øre i sekundet per bod, og hver bod gir like mye", () => {
  const a = AKSJER[0];
  assert.equal(a.rate, 10);
  assert.equal(aksjeRate(medAksjer({ [a.id]: 1 }), a.id), 10);
  assert.equal(aksjeRate(medAksjer({ [a.id]: 2 }), a.id), 20);
  assert.equal(utbyttePerAksje(medAksjer({ [a.id]: 49 }), a.id), 10);
});

test("hver aksje koster 15 % mer enn den forrige, rundet opp til hele øre", () => {
  const a = AKSJER[0];
  assert.equal(prisAksje(nyTilstand(), a.id), 150);
  assert.equal(prisAksje(medAksjer({ [a.id]: 1 }), a.id), Math.ceil(150 * 1.15));
  assert.equal(prisAksje(nyTilstand(), a.id, 2), 150 + Math.ceil(150 * 1.15));
  assert.equal(prisAksje(nyTilstand(), a.id, 0), Infinity);
  assert.equal(prisAksje(nyTilstand(), "ukjent"), Infinity);
});

test("kjøp uten nok penger endrer ingenting, og maks kjøper så mange saldoen rekker til", () => {
  const a = AKSJER[0];
  const t = med({ saldo: 149 });
  assert.equal(kjopAksje(t, a.id), t);
  const rik = med({ saldo: 1000 });
  const n = maksAksje(rik, a.id);
  assert.ok(prisAksje(rik, a.id, n) <= 1000);
  assert.ok(prisAksje(rik, a.id, n + 1) > 1000);
  assert.equal(kjopAksje(rik, a.id, n).aksjer[a.id], n);
  assert.equal(maksAksje(med({ saldo: 1e300 }), a.id), REGLER.maksKjop);
});

test("selskapene går fra lavest til høyest vekst og starter med en limonadebod", () => {
  assert.equal(AKSJER[0].navn, "Limonadebod");
  assert.equal(AKSJER.find((a) => a.id === "geitan").sektor, "Dagligvare");
  for (let i = 1; i < AKSJER.length; i++) {
    assert.ok(AKSJER[i].pris > AKSJER[i - 1].pris, AKSJER[i].id);
    assert.ok(AKSJER[i].rate > AKSJER[i - 1].rate, AKSJER[i].id);
    assert.ok(AKSJER[i].pris / AKSJER[i].rate > AKSJER[i - 1].pris / AKSJER[i - 1].rate, "dyrere selskap tjener seg inn senere");
  }
});

test("generalforsamling ved hver 50. aksje gir 1,5 ganger utbytte", () => {
  const id = AKSJER[0].id;
  assert.equal(gfAntall(medAksjer({ [id]: 49 }), id), 0);
  assert.equal(gfAntall(medAksjer({ [id]: 50 }), id), 1);
  assert.equal(gfAntall(medAksjer({ [id]: 150 }), id), 3);
  assert.equal(utbyttePerAksje(medAksjer({ [id]: 50 }), id), 15);
  naer(utbyttePerAksje(medAksjer({ [id]: 100 }), id), 22.5);
  const liste = generalforsamlinger(medAksjer({ [id]: 120 }));
  assert.deepEqual(liste, [{ id, antall: 2, faktor: 2.25, neste: 150 }]);
});

test("boosterne er sortert etter pris, og du ser alltid de tre neste", () => {
  for (let i = 1; i < BOOSTERE.length; i++) assert.ok(BOOSTERE[i].pris >= BOOSTERE[i - 1].pris);
  const tre = nesteBoostere(nyTilstand());
  assert.equal(tre.length, 3);
  assert.deepEqual(tre.map((b) => b.id), BOOSTERE.slice(0, 3).map((b) => b.id));
  const etter = nesteBoostere(med({ boostere: [BOOSTERE[0].id] }));
  assert.equal(etter[0].id, BOOSTERE[1].id);
  assert.equal(etter.length, 3);
});

test("en booster koster mer enn den første aksjen og dobler utbyttet fra selskapet", () => {
  const id = AKSJER[0].id;
  const b = BOOSTERE.find((x) => x.type === "aksje" && x.mal === id && x.trinn === 1);
  assert.ok(b.pris >= AKSJER[0].pris * 20);
  const t = medAksjer({ [id]: 3 }, { saldo: b.pris });
  const etter = kjopBooster(t, b.id);
  assert.equal(etter.saldo, 0);
  assert.equal(aksjeRate(etter, id), 60);
  assert.equal(kjopBooster(etter, b.id), etter, "samme booster kan ikke kjøpes to ganger");
  assert.equal(kjopBooster(med({ saldo: b.pris - 1 }), b.id).boostere.length, 0);
  assert.equal(kjopBooster(med({ saldo: 1e30 }), "ukjent").boostere.length, 0);
});

test("N. Tangent er en booster som gir 1,5 ganger utbytte fra alle selskapene", () => {
  const b = BOOSTERE.find((x) => x.id === "tangent");
  assert.equal(b.type, "alle");
  const t = medAksjer({ limonade: 2, blomst: 1 }, { boostere: ["tangent"] });
  naer(perSekund(t), 1.5 * (20 + 50));
});

test("trykkboostere gir en andel av utbyttet i hvert trykk", () => {
  const t = medAksjer({ limonade: 10 }, { boostere: ["fast"] });
  assert.equal(trykkAndel(t), 0.01);
  naer(trykkverdi(t), 10 + 0.01 * 100);
});

test("andelen du har råd til styrer hvor tydelig en booster er", () => {
  assert.equal(andelRad(med({ saldo: 0 }), 100), 0);
  assert.equal(andelRad(med({ saldo: 50 }), 100), 0.5);
  assert.equal(andelRad(med({ saldo: 500 }), 100), 1);
});

test("tiden gir utbytte, og null, negativ og ugyldig tid gir ingenting", () => {
  const t = medAksjer({ limonade: 2 });
  assert.equal(tikk(t, 10).saldo, 200);
  assert.equal(tikk(t, 10).totalt, 200);
  for (const s of [0, -5, NaN, Infinity]) assert.equal(tikk(t, s), t);
});

test("tid borte teller høyst to timer, og hendelser er over når du kommer tilbake", () => {
  const t = startHendelse(medAksjer({ limonade: 1 }), { type: "verden", mal: "limonade", fall: 0.5, sek: 60 });
  const r = borte(t, 5 * 3600);
  assert.equal(r.sekunder, REGLER.maksBorteSek);
  assert.equal(r.gevinst, 10 * REGLER.maksBorteSek);
  assert.equal(urolig(r.tilstand), false);
  assert.equal(borte(t, -3).gevinst, 0);
});

test("en verdenshendelse kutter utbyttet fra ett selskap i en periode", () => {
  const t = startHendelse(medAksjer({ limonade: 2, blomst: 1 }), { type: "verden", mal: "limonade", fall: 0.3, sek: 40 });
  naer(aksjeRate(t, "limonade"), 14);
  assert.equal(aksjeRate(t, "blomst"), 50);
  const etter = tikk(t, 41);
  assert.equal(etter.uro.verden, null);
  assert.equal(aksjeRate(etter, "limonade"), 20);
});

test("verdenshendelsen rammer et selskap du eier, med 20 til 50 % fall i 30 til 60 sekunder", () => {
  const t = medAksjer({ blomst: 1 });
  const lav = lagHendelse(t, fast(0, 0, 0, 0));
  assert.deepEqual(lav, { type: "verden", mal: "blomst", fall: 0.2, sek: 30 });
  const hoy = lagHendelse(t, fast(0.2, 0.99, 1, 1));
  assert.equal(hoy.fall, 0.5);
  assert.equal(hoy.sek, 60);
});

test("et børskrakk gir 10 til 20 % rabatt etter sektor, og rabatten forsvinner etterpå", () => {
  assert.equal(AKSJER[0].krakk, 0.1);
  assert.equal(AKSJER.at(-1).krakk, 0.2);
  const h = lagHendelse(nyTilstand(), fast(0.7, 0.5));
  assert.equal(h.type, "krakk");
  assert.equal(h.sek, 45);
  const t = startHendelse(nyTilstand(), h);
  assert.equal(rabatt(t, "limonade"), 0.1);
  assert.equal(prisAksje(t, "limonade"), 135);
  assert.equal(prisAksje(tikk(t, 46), "limonade"), 150);
});

test("uro-streken fylles over tre minutter, og når den er full, skjer det alltid noe", () => {
  let t = nyTilstand();
  const ingenting = () => 0.9999;
  let r = uroSteg(t, 90, ingenting);
  assert.equal(r.hendelse, null);
  assert.equal(uroFyll(r.tilstand), 0.5);
  r = uroSteg(r.tilstand, 90, fast(0.9999, 0.7, 0.5));
  assert.equal(r.hendelse.type, "krakk");
  assert.equal(uroFyll(r.tilstand), 0, "streken starter på nytt");
  assert.equal(urolig(r.tilstand), true);
  const stille = uroSteg(r.tilstand, 30, () => 0);
  assert.equal(stille.hendelse, null, "streken står stille mens hendelsen varer");
  assert.equal(stille.tilstand, r.tilstand);
});

test("ekstraordinært utbytte: samme innsats i tre aktiva, samme ventetid, og høyere avkastning gir høyere risiko", () => {
  assert.equal(ekstraTilbud(nyTilstand()), null);
  const t = medAksjer({ limonade: 10 }, { saldo: 10000 });
  const tilbud = ekstraTilbud(t, () => 0);
  assert.deepEqual(tilbud, { innsats: 1000, valg: [
    { navn: "Statsobligasjoner", niva: "Trygg", sum: 1150, vent: 60, risiko: 0.1 },
    { navn: "Aksjefond med litt av alt", niva: "Middels", sum: 1400, vent: 60, risiko: 0.2 },
    { navn: "Obligasjoner fra Alis Bilopphuggeri", niva: "Risikabel", sum: 2000, vent: 60, risiko: 0.3 },
  ] }, "innsatsen er 10 sekunder utbytte");
  const hoy = ekstraTilbud(t, () => 0.9999);
  assert.deepEqual(hoy.valg.map((v) => [v.navn, v.sum, v.vent]), [
    ["Rentefond fra Trygge Trine", 1249, 120], ["Gårdsbutikk i Bygda", 1699, 120], ["Kryptomynten Grisecoin", 2499, 120],
  ]);
  for (const rng of [() => 0, () => 0.5, () => 0.9999]) {
    const tb = ekstraTilbud(t, rng);
    for (let i = 1; i < tb.valg.length; i++) {
      assert.equal(tb.valg[i].vent, tb.valg[0].vent, "alle venter like lenge");
      assert.ok(ekstraAvkastning(tb, tb.valg[i]) > ekstraAvkastning(tb, tb.valg[i - 1]), "hvert aktivum gir mer");
      assert.ok(tb.valg[i].risiko > tb.valg[i - 1].risiko, "men med høyere risiko");
    }
  }
  naer(ekstraAvkastning(tilbud, tilbud.valg[0]), 0.15);
  assert.equal(ekstraTilbud(medAksjer({ limonade: 10 }, { saldo: 634 }), () => 0).innsats, 630, "aldri mer enn du har, rundet pent ned");
  assert.equal(ekstraTilbud(medAksjer({ limonade: 10 }, { saldo: 0 })), null);
  assert.equal(pentBelop(634), 630);
  assert.equal(pentBelop(12345), 12000);
  assert.equal(pentBelop(57), 57);
  assert.equal(pentBelop(0), 0);

  const gikkBra = () => 0.9999;
  let etter = investerEkstra(t, tilbud, 2, gikkBra);
  assert.equal(etter.saldo, 10000 - 1000, "alle koster det samme");
  assert.equal(investerEkstra(t, tilbud, 0, gikkBra).saldo, 10000 - 1000);
  etter = tikk(etter, 59);
  assert.equal(etter.ventende.length, 1);
  etter = tikk(etter, 1);
  assert.equal(etter.ventende.length, 0);
  assert.equal(etter.saldo, 10000 - 1000 + 100 * 60 + 2000);
  assert.equal(investerEkstra(t, tilbud, 5), t, "et valg som ikke finnes, gjør ingenting");
  assert.equal(investerEkstra(med({ saldo: 10 }), tilbud).ventende.length, 0, "uten råd skjer ingenting");
});

test("investeringen kan gå dårlig: risikabel oftere enn trygg, og da taper du 0 til 10 % av innsatsen", () => {
  const t = medAksjer({ limonade: 10 }, { saldo: 10000 });
  const tilbud = ekstraTilbud(t, () => 0);
  const bra = investerEkstra(t, tilbud, 2, () => 0.3).ventende[0];
  assert.deepEqual(bra, { navn: "Obligasjoner fra Alis Bilopphuggeri", sum: 2000, lovet: 2000, pris: 1000, igjen: 60, lengde: 60 }, "risikoen er 30 %, så 0,3 går bra");
  assert.equal(gikkDarlig(bra), false);
  const verst = investerEkstra(t, tilbud, 2, fast(0.29, 0.9999)).ventende[0];
  assert.ok(gikkDarlig(verst));
  assert.equal(verst.sum, Math.floor(1000 * (1 - 0.1 * 0.9999)), "verste fall er nesten 10 % tap");
  assert.equal(investerEkstra(t, tilbud, 2, fast(0.29, 0)).ventende[0].sum, 1000, "beste dårlige utfall er null tap");
  assert.equal(gikkDarlig(investerEkstra(t, tilbud, 0, () => 0.15).ventende[0]), false, "trygg har bare 10 % risiko");
  assert.equal(gikkDarlig(investerEkstra(t, tilbud, 1, () => 0.15).ventende[0]), true, "middels har 20 %");
  let fro = 7;
  const rng = () => { fro = (fro * 16807) % 2147483647; return fro / 2147483647; };
  const snitt = (nr) => {
    let sum = 0, darlige = 0;
    for (let i = 0; i < 4000; i++) { const v = investerEkstra(t, tilbud, nr, rng).ventende[0]; sum += v.sum / tilbud.innsats; darlige += gikkDarlig(v); }
    return { igjen: sum / 4000, darlige: darlige / 4000 };
  };
  const trygg = snitt(0), risikabel = snitt(2);
  assert.ok(risikabel.darlige > trygg.darlige);
  assert.ok(trygg.igjen > 1, "i snitt lønner også det trygge seg");
});

test("fordeler i de små selskapene: halv pris på overføring, dobbelt trykk, halv risiko og en engangsbonus", () => {
  assert.deepEqual(fordeler(nyTilstand(), "limonade").map((f) => [f.antall, f.oppnadd]), [[25, false]]);
  const lim = medAksjer({ limonade: 25 }, { trykkNiva: 10 });
  assert.equal(fordeler(lim, "limonade")[0].oppnadd, true);
  assert.equal(prisTrykk(lim), Math.ceil(10 * Math.pow(1.07, 10) * 0.5), "25 boder gir halv pris på større overføring");
  assert.equal(maksTrykk({ ...lim, saldo: prisTrykk(lim) }), 1);
  assert.equal(trykkverdi(medAksjer({ jordbaer: 25 })), 20, "25 jordbærstander gir dobbelt per trykk");
  const t = medAksjer({ limonade: 10, onkel: 25 }, { saldo: 10000 });
  assert.deepEqual(ekstraTilbud(t, () => 0).valg.map((v) => v.risiko), [0.05, 0.1, 0.15], "25 bryggerier halverer risikoen");
  // Blomsterbutikk nummer 50 gir 1 000 trykk med en gang, og bare én gang.
  const for_ = medAksjer({ blomst: 49 }, { saldo: 1e9 });
  const pris = prisAksje(for_, "blomst", 1);
  const etter = kjopAksje(for_, "blomst", 1);
  assert.equal(etter.saldo, 1e9 - pris + 1000 * 10);
  assert.equal(etter.totalt, 1000 * 10);
  assert.deepEqual(nyeFordeler(for_, etter).map((f) => f.id), ["blomst-50"]);
  const igjen = kjopAksje(etter, "blomst", 1);
  assert.equal(igjen.saldo, etter.saldo - prisAksje(etter, "blomst", 1), "bonusen kommer ikke igjen");
  assert.equal(kjopAksje(medAksjer({ blomst: 45 }, { saldo: 1e12 }), "blomst", 10).totalt, 1000 * 10, "også når du kjøper flere på en gang");
});

test("rådgiveren koster 10 mill. kr, starter på 30 % og kan oppgraderes til 80 %", () => {
  const t0 = medAksjer({ limonade: 10 }, { saldo: 2e9 });
  assert.equal(radgiverTreff(t0), 0);
  assert.equal(prisRadgiver(t0), 1e9);
  assert.equal(radgiverSynlig(nyTilstand()), false);
  assert.equal(radgiverSynlig(med({ totalt: 5e8 })), true);
  assert.equal(kjopRadgiver(med({ saldo: 1e9 - 1 })).radgiver, 0, "uten råd skjer ingenting");
  let t = kjopRadgiver(t0);
  assert.equal(t.saldo, 1e9);
  assert.equal(radgiverTreff(t), 0.3);
  assert.equal(prisRadgiver(t), 100 * 300, "første oppgradering koster fem minutter utbytte");
  const rik = medAksjer({ limonade: 20 }, { radgiver: 1 });
  assert.equal(prisRadgiver(rik), 2 * prisRadgiver(t), "dobbelt utbytte gir dobbel pris");
  for (const [n, treff] of [[2, 0.4], [3, 0.5], [4, 0.6], [5, 0.7], [6, 0.8]]) {
    t = kjopRadgiver({ ...t, saldo: 1e12 });
    assert.equal(t.radgiver, n);
    assert.equal(radgiverTreff(t), treff);
  }
  assert.equal(prisRadgiver(t), Infinity, "80 % er høyest");
  assert.equal(kjopRadgiver({ ...t, saldo: 1e15 }).radgiver, 6);
});

test("rådgiveren peker på den rimeligste aksjen med sin treffsikkerhet, og bommer oftest med lite", () => {
  // Limonade gir 10/150, blomst 50/1000, jordbær 300/11000. Med to boostere på jordbær blir den rimeligst.
  const t = medAksjer({}, { totalt: 2e4, radgiver: 1 });
  assert.deepEqual(rimeligst(t), ["limonade", "blomst", "jordbaer"]);
  assert.deepEqual(rimeligst({ ...t, boostere: ["jordbaer-1", "jordbaer-2"] })[0], "jordbaer");
  const f = radgiverFordeling(t);
  assert.equal(f[0].id, "limonade");
  naer(f[0].p, 0.3);
  naer(f.reduce((s, x) => s + x.p, 0), 1);
  assert.ok(f[1].p > f[2].p, "nest best er mer sannsynlig enn tredje best");
  assert.equal(radgiverPek(t, () => 0), "limonade");
  assert.equal(radgiverPek(t, () => 0.31), "blomst");
  assert.equal(radgiverPek(t, () => 0.9999), "jordbaer");
  assert.equal(radgiverPek(medAksjer({}, { totalt: 2e4 }), () => 0), null, "uten rådgiver peker ingen");
  const best = radgiverFordeling({ ...t, radgiver: 6 });
  naer(best[0].p, 0.8);
  assert.equal(radgiverFordeling(med({ radgiver: 1 }))[0].p, 1, "med ett selskap peker han alltid på det");
});

test("bare første selskap og én skygge vises i starten, og nye åpnes når du har tjent halve prisen", () => {
  assert.deepEqual(synlige(nyTilstand()), [{ id: "limonade", status: "apen" }, { id: "blomst", status: "skygge" }]);
  const t = med({ totalt: AKSJER[1].pris * REGLER.visFra });
  assert.deepEqual(synlige(t).map((x) => x.status), ["apen", "apen", "skygge"]);
});

test("en lagret tilstand kommer likt tilbake, uten uro", () => {
  let t = medAksjer({ limonade: 12, geitan: 3 }, { saldo: 1234.5, totalt: 99999, trykk: 40, trykkNiva: 5, boostere: ["fast", "tangent"], ventende: [{ sum: 500, lovet: 600, pris: 450, igjen: 20, lengde: 40 }], radgiver: 3 });
  t = startHendelse(t, { type: "krakk", sek: 30 });
  const lagret = JSON.parse(JSON.stringify(tilLagring(t, 1000)));
  assert.equal(lagret.uro, undefined);
  const r = fraLagring(lagret);
  assert.equal(r.tid, 1000);
  assert.deepEqual(r.tilstand, { ...t, uro: nyTilstand().uro });
  assert.equal(fraLagring({ ...lagret, radgiver: 99 }), null, "ukjent nivå for rådgiveren avvises");
  const { radgiver, ...utenRadgiver } = lagret;
  assert.equal(fraLagring(utenRadgiver).tilstand.radgiver, 0, "lagring fra før rådgiveren fantes, gir ingen rådgiver");
});

test("lagring fra første utgave avvises, så du starter på null", () => {
  assert.equal(fraLagring({ v: 1, tid: 5, saldo: 5e13, overfort: 100, tjent: 400, trykk: 10, trykkNiva: 2, hjelpere: {}, loft: {} }), null);
});

test("ødelagt eller fremmed lagring avvises", () => {
  const god = tilLagring(medAksjer({ limonade: 1 }), 1);
  for (const feil of [null, 5, "tekst", { v: 3 }, { ...god, saldo: -1 }, { ...god, saldo: "1" }, { ...god, aksjer: { limonade: 1.5 } },
    { ...god, boostere: "fast" }, { ...god, ventende: [{ sum: "1", igjen: 2 }] }, { ...god, gren: "ukjent", gud: 1 }, { ...god, lodd: [{ runde: 1, antall: 0, fro: 1 }] }, { ...god, trykkNiva: -1 }]) {
    assert.equal(fraLagring(feil), null, JSON.stringify(feil));
  }
  assert.deepEqual(fraLagring({ ...god, boostere: ["ukjent", "fast", "fast"] }).tilstand.boostere, ["fast"]);
});

test("svært store tall holder seg endelige", () => {
  let t = med({ saldo: 1e300, boostere: BOOSTERE.map((b) => b.id) });
  for (const a of AKSJER) t = kjopAksje(t, a.id, REGLER.maksKjop);
  t = tikk(t, 1);
  assert.ok(Number.isFinite(t.saldo));
  assert.ok(Number.isFinite(perSekund(t)));
  assert.notEqual(formaterOre(perSekund(t)), "");
});

test("spillet nevner ingen forsikringsselskaper, banker eller ekte personnavn", () => {
  const tekst = JSON.stringify([AKSJER, BOOSTERE]).toLowerCase();
  for (const ord of ["forsikring", "bank", "storebrand", "gjensidige", "tryg", "fremtind", " reitan", " stordalen", " witzøe", " røkke", " fredriksen", " andresen", " midelfart", " tangen\""]) {
    assert.ok(!tekst.includes(ord), ord);
  }
  assert.ok(!/\bif\b/.test(tekst));
});

test("beløp skrives som øre, kroner og store tall, alltid rundet ned", () => {
  assert.equal(rent(formaterOre(0)), "0 øre");
  assert.equal(rent(formaterOre(10)), "10 øre");
  assert.equal(rent(formaterOre(10.1)), "10,1 øre");
  assert.equal(rent(formaterOre(10.2)), "10,2 øre");
  assert.equal(rent(formaterOre(99.9)), "99,9 øre");
  assert.equal(rent(formaterOre(99.97)), "99,9 øre");
  assert.equal(rent(formaterOre(100)), "1,00 kr");
  assert.equal(rent(formaterOre(150)), "1,50 kr");
  assert.equal(rent(formaterOre(149.9)), "1,49 kr");
  assert.equal(rent(formaterOre(123456)), "1 234,56 kr");
  assert.equal(rent(formaterOre(4530099)), "45 300 kr");
  assert.equal(rent(formaterOre(99999999)), "999 999 kr");
  assert.equal(rent(formaterOre(1.239e8)), "1,23 mill. kr");
  assert.equal(rent(formaterOre(2.5e9)), "25,0 mill. kr");
  assert.equal(rent(formaterOre(4.5e11)), "4,50 mrd. kr");
  assert.equal(rent(formaterOre(7.77e14)), "7,77 billioner kr");
  assert.equal(rent(formaterOre(1e17)), "1,00 billiarder kr");
  assert.equal(rent(formaterOre(-150)), "−1,50 kr");
  assert.equal(formaterOre(NaN), "");
  assert.equal(formaterOre(Infinity), "");
  assert.match(rent(formaterOre(1e40)), /^1,00 × 10\^38 kr$/);
});

test("tid skrives kort", () => {
  assert.equal(rent(formaterTid(0.2)), "1 sek");
  assert.equal(rent(formaterTid(15)), "15 sek");
  assert.equal(rent(formaterTid(240)), "4 min");
  assert.equal(rent(formaterTid(2 * 3600 + 11 * 60)), "2 t 10 min");
  assert.equal(rent(formaterTid(3 * 3600)), "3 t");
  assert.equal(rent(formaterTid(3 * 86400)), "3 døgn");
  assert.equal(formaterTid(Infinity), "");
});

// ---------- Lotto ----------

test("lotto: 7 av 34, 5 kr per rekke, og sjansene stemmer med regningen", () => {
  assert.equal(MULIGE_REKKER, 5379616);
  assert.equal(LOTTO.pris, 500);
  const en = (id) => Math.round(1 / PREMIER.find((p) => p.id === id).sjanse);
  assert.equal(en("7"), 5379616);
  assert.equal(en("6+1"), 768517);
  assert.equal(en("6"), 29558);
  assert.equal(en("5"), 730);
  assert.equal(en("4"), 53);
  const utbetaling = PREMIER.reduce((s, p) => s + p.sjanse * p.premie, 0) / LOTTO.pris;
  assert.ok(utbetaling > 0.45 && utbetaling < 0.47, "om lag 46 % av innsatsen kommer tilbake");
  assert.equal(PREMIER.find((p) => p.id === "7").premie % 100, 0, "premiene er hele kroner");
  assert.equal(prisRekker(3), 1500);
  assert.equal(prisRekker(0), Infinity);
});

test("lotto: 5 til 6 minutter mellom trekningene, salg i ett minutt, og samme tall for alle", () => {
  for (let s = 1.7e9; s < 1.7e9 + 50000; s += 97) {
    const r = runde(s);
    assert.ok(r.apner <= s && s < r.neste, "tidspunktet ligger i runden");
    assert.ok(r.neste - r.apner >= 300 && r.neste - r.apner <= 360, `${r.neste - r.apner} sek mellom`);
    assert.equal(r.trekkes, r.apner + 60);
    assert.equal(trekkTid(r.nr), r.trekkes);
    assert.equal(apen(r, s), s < r.trekkes);
  }
  const v = vinnertall(1234);
  assert.deepEqual(v, vinnertall(1234), "samme trekning gir samme tall");
  assert.equal(new Set([...v.tall, v.tillegg]).size, 8);
  assert.ok([...v.tall, v.tillegg].every((x) => x >= 1 && x <= 34));
  assert.deepEqual(rekker(99, 3), rekker(99, 3), "rekkene regnes ut igjen av frøet");
});

test("lotto: premiegruppene og resultatet", () => {
  const tr = { tall: [1, 2, 3, 4, 5, 6, 7], tillegg: 8 };
  assert.equal(gruppeFor([1, 2, 3, 4, 5, 6, 7], tr).id, "7");
  assert.equal(gruppeFor([1, 2, 3, 4, 5, 6, 8], tr).id, "6+1");
  assert.equal(gruppeFor([1, 2, 3, 4, 5, 6, 9], tr).id, "6");
  assert.equal(gruppeFor([1, 2, 3, 4, 5, 8, 9], tr).id, "5");
  assert.equal(gruppeFor([1, 2, 3, 4, 8, 9, 10], tr).id, "4");
  assert.equal(gruppeFor([1, 2, 3, 8, 9, 10, 11], tr), null);
  const r = resultat({ runde: 5, fro: 1, antall: 2000 });
  const fireRette = PREMIER.find((p) => p.id === "4").premie;
  assert.ok(r.treff["4"] > 15 && r.treff["4"] < 60, "om lag én av 53 rekker har 4 rette");
  assert.ok(r.premier >= r.treff["4"] * fireRette);
  const avers = resultat({ runde: 5, fro: 1, antall: 2000 }, 0.2);
  assert.ok(avers.gevinst > r.gevinst, "risikoavers får litt tilbake for rekker uten premie");
});

test("lotto: kjøp trekker fra saldoen, og premien kommer når tallene er trukket", () => {
  const t = med({ saldo: 10000 });
  const r = runde(1.8e9);
  const k = kjopLodd(t, r.nr, 10, 42);
  assert.equal(k.saldo, 5000);
  assert.equal(loddI(k, r.nr), 10);
  assert.equal(kjopLodd(t, r.nr, 30, 1), t, "uten råd skjer ingenting");
  assert.equal(kjopLodd(med({ saldo: 1e12 }), r.nr, LOTTO.maksRekker + 1, 1).lodd.length, 0, "aldri flere enn grensen");
  assert.equal(avgjorLodd(k, r.trekkes - 1).tilstand, k, "før trekningen skjer ingenting");
  const etter = avgjorLodd(k, r.trekkes);
  assert.equal(etter.tilstand.lodd.length, 0);
  assert.equal(etter.resultater.length, 1);
  assert.equal(etter.tilstand.saldo, 5000 + etter.resultater[0].gevinst);
  assert.deepEqual(etter.resultater[0].trekning, vinnertall(r.nr));
});

// ---------- Strategi, giring og obligasjoner ----------

test("strategien kan velges etter 1 mill. kr, én gang", () => {
  assert.equal(kanVelgeStrategi(med({ totalt: STRATEGI.grense - 1 })), false);
  const t = med({ totalt: STRATEGI.grense });
  assert.ok(kanVelgeStrategi(t));
  const glad = velgStrategi(t, "glad");
  assert.equal(glad.strategi, "glad");
  assert.equal(velgStrategi(glad, "avers"), glad, "valget står");
  assert.equal(velgStrategi(t, "ukjent"), t);
  assert.equal(settGiring(glad, 25).giring, 10);
  assert.equal(settGiring(glad, 0).giring, 0.1);
  assert.equal(settGiring(velgStrategi(t, "noytral"), 5).giring, 1, "giring bare for risikoglad");
  assert.equal(giring(velgStrategi(t, "noytral")), 1);
});

test("risikoavers: lavere risiko på investeringer og mindre fall fra verdenshendelser", () => {
  const vanlig = medAksjer({ limonade: 10 }, { saldo: 10000 });
  const avers = { ...vanlig, strategi: "avers" };
  assert.equal(ekstraTilbud(avers, () => 0).valg[2].risiko, ekstraTilbud(vanlig, () => 0).valg[2].risiko * 0.75);
  const uro = { fyll: 0, verden: { mal: "limonade", fall: 0.4, igjen: 10 }, krakk: null };
  naer(utbyttePerAksje({ ...avers, uro }, "limonade"), 10 * (1 - 0.3));
});

test("obligasjoner: staten betaler alltid, selskaper kan gå konkurs, og risikonøytral får 1,5 ganger renten", () => {
  const t = medAksjer({ limonade: 10 }, { saldo: 100000 });
  assert.equal(oblInnsats(t), 6000, "ett minutt utbytte");
  const stat = kjopObligasjon(t, "stat", () => 0);
  assert.equal(stat.saldo, 94000);
  assert.deepEqual(stat.ventende[0], { navn: "Statsobligasjon", sum: 6300, lovet: 6300, pris: 6000, igjen: OBL.lopetid, lengde: OBL.lopetid, obl: true });
  const vekst = kjopObligasjon(t, "vekst", () => 0.05).ventende[0];
  assert.equal(vekst.sum, 3000, "konkurs: halvparten tilbake");
  assert.equal(kjopObligasjon(t, "vekst", () => 0.1).ventende[0].sum, 6900, "90 % sikker");
  assert.equal(kjopObligasjon(t, "kraft", () => 0.06).ventende[0].sum, 6600, "95 % sikker");
  naer(oblRente({ ...t, strategi: "noytral" }, OBLIGASJONER[0]), 0.075);
  let mange = t;
  for (let i = 0; i < 5; i++) mange = kjopObligasjon(mange, "stat", () => 0);
  assert.equal(antallObl(mange), OBL.maksSamtidig);
  const forfalt = tikk(stat, OBL.lopetid);
  assert.equal(forfalt.ventende.length, 0);
  assert.equal(forfalt.saldo, 94000 + 6300 + 10 * 10 * OBL.lopetid);
});

test("giring ganger gevinst og tap, og tvangssalg dekker et tap større enn saldoen", () => {
  const t = medAksjer({ limonade: 10 }, { saldo: 100000, totalt: 1e8, strategi: "glad", giring: 10 });
  const vekst = kjopObligasjon(t, "vekst", () => 0.05).ventende[0];
  assert.equal(vekst.sum, 6000 + 10 * (3000 - 6000), "taper ti ganger så mye");
  const bra = kjopObligasjon(t, "vekst", () => 0.5).ventende[0];
  assert.equal(bra.sum, 6000 + 10 * 900);
  const gjeld = tvangssalg(medAksjer({ limonade: 3, blomst: 1 }, { saldo: -400 }));
  assert.equal(gjeld.aksjer.blomst, 0, "den dyreste selges først");
  assert.equal(gjeld.aksjer.limonade, 3);
  assert.equal(gjeld.saldo, 100, "solgt for halvparten av prisen");
  const alt = tvangssalg(medAksjer({ limonade: 1 }, { saldo: -1e9 }));
  assert.equal(alt.saldo, 0, "resten av gjelden slettes");
  assert.equal(alt.aksjer.limonade, 0);
  const tap = tikk({ ...medAksjer({ blomst: 2 }, { saldo: 0 }), ventende: [{ sum: -500, lovet: 100, pris: 100, igjen: 1, lengde: 1 }] }, 1);
  assert.equal(tap.aksjer.blomst, 1);
  assert.equal(tap.totalt, 100, "tap trekkes ikke fra det som har kommet inn");
});

// ---------- Ikoner, guder og prestisje ----------

test("ikoner: det første er gratis, resten koster fra 500 000 kr og blir dyrere", () => {
  assert.equal(IKONER[0].pris, 0);
  assert.equal(IKONER[1].pris, 5e7);
  for (let i = 2; i < IKONER.length; i++) assert.ok(IKONER[i].pris > IKONER[i - 1].pris);
  const t = med({ saldo: 6e7 });
  const k = kjopIkon(t, "gra");
  assert.equal(k.saldo, 1e7);
  assert.equal(k.ikon, "gra");
  assert.equal(kjopIkon(k, "gra"), k, "kjøpes bare én gang");
  assert.equal(kjopIkon(t, "fonix"), t, "fønix får du bare ved prestisje");
  assert.equal(velgIkon(k, "deg").ikon, "deg");
  assert.equal(velgIkon(k, "drage"), k);
});

test("guder: fem i hver grein, og første kjøp låser greinen", () => {
  assert.equal(GRENER.length, 4);
  for (const g of GRENER) assert.equal(g.guder.length, 5);
  assert.deepEqual(GRENER.find((g) => g.id === "gresk").guder.map((x) => x.navn), ["Hermes", "Ares", "Poseidon", "Zevs", "Kronos"]);
  const t = med({ saldo: 2e10, totalt: 2e10 });
  assert.ok(guderSynlig(t));
  const tor = kjopGud(t, "norron");
  assert.equal(tor.gren, "norron");
  assert.equal(tor.gud, 1);
  assert.equal(trykkverdi(tor), 20, "Loke dobler trykket");
  assert.equal(nesteGud(tor, "gresk"), null, "de andre greinene er stengt");
  assert.equal(nesteGud(tor).navn, "Heimdall");
  assert.equal(kjopGud(tor), tor, "uten råd skjer ingenting");
  const roma = med({ gren: "romersk", gud: 5, aksjer: { ...nyTilstand().aksjer, limonade: 1 } });
  naer(perSekund(roma), 10 * 1.5 * 1.5 * 2 * 2 * 5);
  assert.equal(maksBorte(med({ gren: "egyptisk", gud: 3 })), 12 * 3600);
  assert.equal(maksBorte(nyTilstand()), REGLER.maksBorteSek);
});

test("prestisje: når alt er kjøpt, starter du på nytt med dobbelt av alt", () => {
  const alt = med({
    aksjer: Object.fromEntries(AKSJER.map((a) => [a.id, 1])), boostere: BOOSTERE.map((b) => b.id), radgiver: 6,
    ikoner: IKONER.filter((i) => !i.prestisje).map((i) => i.id), gren: "gresk", gud: 5, saldo: 5,
  });
  assert.deepEqual(prestisjeMangler(alt), []);
  assert.ok(kanPrestisje(alt));
  assert.ok(prestisjeMangler({ ...alt, gud: 4 }).includes("den høyeste guden"));
  const ny = prestisje(alt);
  assert.equal(ny.prestisje, 1);
  assert.equal(ny.saldo, 0);
  assert.equal(ny.gren, null);
  assert.equal(ny.ikon, "fonix");
  assert.equal(prestisjeFaktor(ny), 2);
  assert.equal(trykkverdi(ny), 20);
  naer(utbyttePerAksje(ny, "limonade"), 20);
  const t = medAksjer({ limonade: 10 }, { saldo: 10000, prestisje: 1 });
  naer(ekstraAvkastning(ekstraTilbud(t, () => 0), ekstraTilbud(t, () => 0).valg[0]), 0.3);
  assert.equal(prestisje({ ...alt, gud: 4 }).prestisje, 0, "uten alt skjer ingenting");
});

test("lagring tar med ikoner, guder, strategi, prestisje og lottorekker", () => {
  const t = med({ ikon: "smil", ikoner: ["deg", "smil"], gren: "norron", gud: 2, strategi: "glad", giring: 3.5, prestisje: 2,
    lodd: [{ runde: 7, antall: 3, fro: 99 }], ventende: [{ navn: "Statsobligasjon", sum: -200, lovet: 400, pris: 100, igjen: 100, lengde: 180, obl: true }] });
  const lest = fraLagring(JSON.parse(JSON.stringify(tilLagring(t, 1)))).tilstand;
  for (const k of ["ikon", "ikoner", "gren", "gud", "strategi", "giring", "prestisje", "lodd", "ventende"]) assert.deepEqual(lest[k], t[k], k);
  const gammel = fraLagring(tilLagring(medAksjer({ limonade: 1 }), 1)).tilstand;
  assert.equal(gammel.ikon, "deg");
  assert.equal(gammel.prestisje, 0);
});

test("gudene koster mer jo bedre de er, og ingen to koster det samme", () => {
  const priser = GRENER.flatMap((g) => g.guder.map((x) => x.pris));
  assert.equal(new Set(priser).size, 20);
  for (const g of GRENER) for (let i = 1; i < 5; i++) assert.ok(g.guder[i].pris > g.guder[i - 1].pris * 10, "hvert nivå er mye dyrere");
  const kronos = GRENER.find((g) => g.id === "gresk").guder[4];
  assert.equal(Math.max(...priser), kronos.pris, "Kronos er dyrest");
  assert.ok(GRENER[0].guder[0].pris >= 5e9, "den første koster minst 50 mill. kr");
});

test("prestasjoner: mål gir dem av seg selv, hendelser gis når de skjer, og de blir med gjennom prestisje", () => {
  assert.equal(new Set(PRESTASJONER.map((p) => p.id)).size, PRESTASJONER.length);
  let t = trykk(nyTilstand());
  const r = prestasjonerSteg(t);
  assert.deepEqual(r.nye.map((p) => p.id), ["trykk-1"]);
  assert.equal(prestasjonerSteg(r.tilstand).nye.length, 0, "bare én gang");
  const lotto = prestasjonerSteg(r.tilstand, ["lotto-7", "ukjent"]);
  assert.deepEqual(lotto.nye.map((p) => p.id), ["lotto-7"]);
  const alt = med({
    aksjer: Object.fromEntries(AKSJER.map((a) => [a.id, 1])), boostere: BOOSTERE.map((b) => b.id), radgiver: 6,
    ikoner: IKONER.filter((i) => !i.prestisje).map((i) => i.id), gren: "gresk", gud: 5, prestasjoner: ["lotto-7"], alleTrykk: 500,
  });
  const ny = prestisje(alt);
  assert.deepEqual(ny.prestasjoner, ["lotto-7"]);
  assert.equal(ny.alleTrykk, 500);
  assert.equal(trykk(ny).alleTrykk, 501);
  assert.ok(prestasjonerSteg(ny).nye.some((p) => p.id === "prestisje-1"));
});

test("giring gjelder også investeringene som dukker opp", () => {
  const t = medAksjer({ limonade: 10 }, { saldo: 10000, strategi: "glad", giring: 3 });
  const tilbud = ekstraTilbud(t, () => 0);
  const v = investerEkstra(t, tilbud, 2, () => 0.9).ventende[0];
  assert.equal(v.sum, 1000 + 3 * 1000, "100 % avkastning blir 300 % med 3x giring");
  assert.equal(giret(t, 1000, 2000), 4000);
  assert.equal(giret(nyTilstand(), 1000, 2000), 2000, "uten risikoglad er det ingen giring");
});
