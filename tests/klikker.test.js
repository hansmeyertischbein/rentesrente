import { test } from "node:test";
import assert from "node:assert/strict";
import {
  REGLER, AKSJER, BOOSTERE, nyTilstand, grunnTrykk, trykkverdi, trykkAndel, fartFaktor, klikkverdi, trykk,
  perSekund, aksjeRate, utbyttePerAksje, gfAntall, faktor, prisAksje, maksAksje, kjopAksje, prisTrykk, kjopTrykk,
  nesteBoostere, andelRad, kjopBooster, generalforsamlinger, tikk, borte, uroFyll, urolig, uroSteg, lagHendelse,
  startHendelse, rabatt, ekstraTilbud, investerEkstra, synlige, tilLagring, fraLagring, formaterOre, formaterTid,
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

test("overføringen gir 10,1 øre på nivå 1 og 10,2 øre på nivå 2, uten avrundingsfeil", () => {
  assert.equal(grunnTrykk(0), 10);
  assert.equal(grunnTrykk(1), 10.1);
  assert.equal(grunnTrykk(2), 10.2);
  assert.equal(grunnTrykk(100), 20);
  assert.equal(trykkverdi(med({ trykkNiva: 3 })), 10.3);
});

test("oppgradering av overføringen koster 10 øre først og 5 % mer per nivå", () => {
  assert.equal(prisTrykk(nyTilstand()), 10);
  assert.equal(prisTrykk(med({ trykkNiva: 1 })), Math.ceil(10 * 1.05));
  const t = kjopTrykk(med({ saldo: 10 }));
  assert.equal(t.trykkNiva, 1);
  assert.equal(t.saldo, 0);
  assert.equal(kjopTrykk(med({ saldo: 9 })).trykkNiva, 0);
});

test("raske trykk gir fartsboost fra fire trykk i sekundet, opptil 2,5 ganger", () => {
  assert.equal(fartFaktor(0), 1);
  assert.equal(fartFaktor(3), 1);
  naer(fartFaktor(4), 1.15);
  naer(fartFaktor(8), 1.75);
  assert.equal(fartFaktor(13), 2.5);
  assert.equal(fartFaktor(50), 2.5);
  assert.equal(fartFaktor(NaN), 1);
  naer(klikkverdi(nyTilstand(), 8), 17.5);
  naer(trykk(nyTilstand(), 8).saldo, 17.5);
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

test("ekstraordinært utbytte: betal 60 til 70 % nå og få hele summen om 40 til 60 sekunder", () => {
  assert.equal(ekstraTilbud(nyTilstand()), null);
  const t = medAksjer({ limonade: 10 }, { saldo: 10000 });
  const tilbud = ekstraTilbud(t, fast(0, 1));
  assert.deepEqual(tilbud, { sum: 9000, pris: 5400, vent: 60 });
  assert.equal(ekstraTilbud(t, fast(1, 0)).pris, 6300);
  let etter = investerEkstra(t, tilbud);
  assert.equal(etter.saldo, 10000 - 5400);
  etter = tikk(etter, 59);
  assert.equal(etter.ventende.length, 1);
  etter = tikk(etter, 1);
  assert.equal(etter.ventende.length, 0);
  assert.equal(etter.saldo, 10000 - 5400 + 100 * 60 + 9000);
  assert.equal(investerEkstra(med({ saldo: 10 }), tilbud).ventende.length, 0, "uten råd skjer ingenting");
  const fattig = medAksjer({ limonade: 10 }, { saldo: 700 });
  const lite = ekstraTilbud(fattig, fast(1, 0));
  assert.equal(lite.sum, 1000, "summen blir aldri større enn at du har råd");
  assert.ok(lite.pris <= fattig.saldo);
  assert.equal(ekstraTilbud(medAksjer({ limonade: 10 }, { saldo: 0 })), null);
});

test("bare første selskap og én skygge vises i starten, og nye åpnes når du har tjent halve prisen", () => {
  assert.deepEqual(synlige(nyTilstand()), [{ id: "limonade", status: "apen" }, { id: "blomst", status: "skygge" }]);
  const t = med({ totalt: AKSJER[1].pris * REGLER.visFra });
  assert.deepEqual(synlige(t).map((x) => x.status), ["apen", "apen", "skygge"]);
});

test("en lagret tilstand kommer likt tilbake, uten uro", () => {
  let t = medAksjer({ limonade: 12, geitan: 3 }, { saldo: 1234.5, totalt: 99999, trykk: 40, trykkNiva: 5, boostere: ["fast", "tangent"], ventende: [{ sum: 500, igjen: 20 }] });
  t = startHendelse(t, { type: "krakk", sek: 30 });
  const lagret = JSON.parse(JSON.stringify(tilLagring(t, 1000)));
  assert.equal(lagret.uro, undefined);
  const r = fraLagring(lagret);
  assert.equal(r.tid, 1000);
  assert.deepEqual(r.tilstand, { ...t, uro: nyTilstand().uro });
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
