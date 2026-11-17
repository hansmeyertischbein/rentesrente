import { test } from "node:test";
import assert from "node:assert/strict";
import {
  REGLER, AKSJER, BOOSTERE, nyTilstand, grunnTrykk, trykkverdi, trykkAndel, fartFaktor, klikkverdi, trykk,
  perSekund, aksjeRate, utbyttePerAksje, gfAntall, faktor, prisAksje, maksAksje, kjopAksje, prisTrykk, kjopTrykk,
  nesteBoostere, andelRad, kjopBooster, generalforsamlinger, tikk, borte, uroFyll, urolig, uroSteg, lagHendelse,
  startHendelse, rabatt, ekstraTilbud, ekstraAvkastning, investerEkstra, gikkDarlig, synlige, fordeler, nyeFordeler, maksTrykk, radgiverTreff, prisRadgiver, kjopRadgiver,
  radgiverSynlig, rimeligst, radgiverFordeling, radgiverPek, EKSTRA_LENGST, tilLagring, fraLagring, formaterOre, formaterTid,
} from "../src/lib/klikker.js";

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

test("ekstraordinært utbytte: lengre ventetid gir høyere avkastning", () => {
  assert.equal(ekstraTilbud(nyTilstand()), null);
  const t = medAksjer({ limonade: 10 }, { saldo: 10000 });
  const tilbud = ekstraTilbud(t, fast(0, 1));
  assert.deepEqual(tilbud, { sum: 1250, valg: [{ pris: 938, vent: 45, risiko: 0.1 }, { pris: 813, vent: 105, risiko: 0.2 }, { pris: 600, vent: 210, risiko: 0.3 }] });
  for (const rng of [() => 0, () => 0.9999]) {
    assert.ok(ekstraTilbud(medAksjer({ limonade: 10 }, { saldo: 1e9 }), rng).valg.every((v) => v.pris <= 100 * 10), "aldri mer enn 10 sekunder utbytte");
  }
  for (const rng of [() => 0, () => 0.5, () => 0.9999]) {
    const tb = ekstraTilbud(t, rng);
    for (let i = 1; i < tb.valg.length; i++) {
      assert.ok(tb.valg[i].vent > tb.valg[i - 1].vent, "hvert valg venter lenger");
      assert.ok(ekstraAvkastning(tb, tb.valg[i]) > ekstraAvkastning(tb, tb.valg[i - 1]), "og gir mer");
      assert.ok(tb.valg[i].risiko > tb.valg[i - 1].risiko, "men med høyere risiko");
    }
  }
  assert.equal(EKSTRA_LENGST, 210);
  const gikkBra = () => 0.9999;
  let etter = investerEkstra(t, tilbud, 2, gikkBra);
  assert.equal(etter.saldo, 10000 - 600);
  etter = tikk(etter, 209);
  assert.equal(etter.ventende.length, 1);
  etter = tikk(etter, 1);
  assert.equal(etter.ventende.length, 0);
  assert.equal(etter.saldo, 10000 - 600 + 100 * 210 + 1250);
  assert.equal(investerEkstra(t, tilbud, 0, gikkBra).saldo, 10000 - 938, "kort tid koster mest");
  assert.equal(investerEkstra(t, tilbud, 5), t, "et valg som ikke finnes, gjør ingenting");
  assert.equal(investerEkstra(med({ saldo: 10 }), tilbud).ventende.length, 0, "uten råd skjer ingenting");
  const fattig = medAksjer({ limonade: 10 }, { saldo: 700 });
  const lite = ekstraTilbud(fattig, () => 0.9999);
  assert.equal(lite.sum, 875, "summen blir aldri større enn at du har råd");
  assert.ok(lite.valg.every((v) => v.pris <= fattig.saldo), "du har råd til alle valgene");
  assert.equal(ekstraTilbud(medAksjer({ limonade: 10 }, { saldo: 0 })), null);
});

test("investeringen kan gå dårlig: høyere avkastning gir høyere risiko, og du taper 0 til 10 % av det du betalte", () => {
  const t = medAksjer({ limonade: 10 }, { saldo: 10000 });
  const tilbud = ekstraTilbud(t, fast(0, 1));
  const bra = investerEkstra(t, tilbud, 2, () => 0.3).ventende[0];
  assert.deepEqual(bra, { sum: 1250, lovet: 1250, pris: 600, igjen: 210, lengde: 210 }, "risikoen er 30 %, så 0,3 går bra");
  assert.equal(gikkDarlig(bra), false);
  const verst = investerEkstra(t, tilbud, 2, fast(0.29, 0.9999)).ventende[0];
  assert.ok(gikkDarlig(verst));
  assert.equal(verst.sum, Math.floor(600 * (1 - 0.1 * 0.9999)), "verste fall er nesten 10 % tap");
  assert.ok(verst.sum >= 600 * 0.9 && verst.sum <= 600);
  assert.equal(investerEkstra(t, tilbud, 2, fast(0.29, 0)).ventende[0].sum, 600, "beste dårlige utfall er null tap");
  assert.equal(gikkDarlig(investerEkstra(t, tilbud, 0, () => 0.15).ventende[0]), false, "kort tid har bare 10 % risiko");
  assert.equal(gikkDarlig(investerEkstra(t, tilbud, 1, () => 0.15).ventende[0]), true, "middels har 20 %");
  // Over mange forsøk går lang tid oftere dårlig enn kort tid, men gir likevel mest i snitt.
  let fro = 7;
  const rng = () => { fro = (fro * 16807) % 2147483647; return fro / 2147483647; };
  const snitt = (nr) => {
    let sum = 0, darlige = 0;
    for (let i = 0; i < 4000; i++) { const v = investerEkstra(t, tilbud, nr, rng).ventende[0]; sum += v.sum / tilbud.valg[nr].pris; darlige += gikkDarlig(v); }
    return { igjen: sum / 4000, darlige: darlige / 4000 };
  };
  const kort = snitt(0), lang = snitt(2);
  assert.ok(lang.darlige > kort.darlige);
  assert.ok(lang.igjen > kort.igjen && kort.igjen > 1, "i snitt lønner begge seg");
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
    { ...god, boostere: "fast" }, { ...god, ventende: [{ sum: -1, igjen: 2 }] }, { ...god, trykkNiva: -1 }]) {
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
