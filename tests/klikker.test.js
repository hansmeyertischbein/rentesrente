import { test } from "node:test";
import assert from "node:assert/strict";
import {
  REGLER, HJELPERE, TRYKKLOFT, nyTilstand, grunnTrykk, trykkverdi, trykkAndel, perSekund, hjelperRate,
  prisHjelper, maksHjelper, prisTrykk, maksTrykk, trykk, kjopHjelper, kjopTrykk, tilgjengeligeLoft, nesteLoftNiva,
  kjopLoft, tikk, borte, utbytteverdi, taUtbytte, nedbetalingSek, nedbetalingTrykk, synlige, tilLagring, fraLagring,
  formaterOre, formaterTid,
} from "../src/lib/klikker.js";

const med = (endring) => ({ ...nyTilstand(), ...endring });
const medHjelpere = (h, resten = {}) => med({ ...resten, hjelpere: { ...nyTilstand().hjelpere, ...h } });
const rent = (s) => s.replace(/ /g, " ");

test("du starter med tom konto, og ett trykk gir 10 øre", () => {
  const t = nyTilstand();
  assert.equal(t.saldo, 0);
  assert.equal(trykkverdi(t), 10);
  const etter = trykk(t);
  assert.equal(etter.saldo, 10);
  assert.equal(etter.overfort, 10);
  assert.equal(etter.tjent, 0);
  assert.equal(etter.trykk, 1);
  assert.equal(t.saldo, 0, "den gamle tilstanden er urørt");
});

test("overføringen gir 10,1 øre på nivå 1 og 10,2 øre på nivå 2, uten avrundingsfeil", () => {
  assert.equal(grunnTrykk(0), 10);
  assert.equal(grunnTrykk(1), 10.1);
  assert.equal(grunnTrykk(2), 10.2);
  assert.equal(grunnTrykk(3), 10.3);
  assert.equal(grunnTrykk(1000), 110);
  assert.equal(trykkverdi(med({ trykkNiva: 7 })), 10.7);
});

test("første hjelper gir 10 øre i sekundet på nivå 1 og 20 på nivå 2", () => {
  const id = HJELPERE[0].id;
  assert.equal(perSekund(medHjelpere({ [id]: 1 })), 10);
  assert.equal(perSekund(medHjelpere({ [id]: 2 })), 20);
  assert.equal(perSekund(medHjelpere({ [id]: 15 })), 150);
  assert.equal(perSekund(nyTilstand()), 0);
});

test("hjelperne ligger i stigende rekkefølge, og hver ny bruker lengre tid på å tjene seg inn", () => {
  const t = nyTilstand();
  for (let i = 1; i < HJELPERE.length; i++) {
    assert.ok(HJELPERE[i].rate > HJELPERE[i - 1].rate);
    assert.ok(HJELPERE[i].pris > HJELPERE[i - 1].pris);
    assert.ok(nedbetalingSek(t, HJELPERE[i].id) > nedbetalingSek(t, HJELPERE[i - 1].id));
  }
  assert.equal(new Set(HJELPERE.map((h) => h.id)).size, HJELPERE.length);
  for (const h of HJELPERE) assert.equal(h.loft.length, REGLER.loftNivaer.length);
});

test("prisen stiger 15 % per nivå, rundet opp til hele øre", () => {
  const h = HJELPERE[0];
  assert.equal(prisHjelper(nyTilstand(), h.id), 150);
  assert.equal(prisHjelper(medHjelpere({ [h.id]: 1 }), h.id), Math.ceil(150 * 1.15));
  assert.equal(prisHjelper(medHjelpere({ [h.id]: 10 }), h.id), Math.ceil(150 * Math.pow(1.15, 10)));
});

test("prisen for flere nivåer er summen av enkeltprisene", () => {
  const h = HJELPERE[1];
  let t = med({ saldo: 1e9 });
  let sum = 0;
  for (let i = 0; i < 10; i++) { sum += prisHjelper(t, h.id); t = kjopHjelper(t, h.id); }
  assert.equal(prisHjelper(med({}), h.id, 10), sum);
  assert.equal(t.hjelpere[h.id], 10);
  assert.equal(t.saldo, 1e9 - sum);
});

test("kjøp uten nok penger endrer ingenting", () => {
  const id = HJELPERE[0].id;
  const t = med({ saldo: 149 });
  assert.equal(kjopHjelper(t, id), t);
  const blakk = med({ saldo: 9 });
  assert.equal(kjopTrykk(blakk), blakk);
  assert.equal(kjopHjelper(med({ saldo: 150 }), id).saldo, 0);
});

test("ugyldig antall og ukjent hjelper kjøper ingenting", () => {
  const id = HJELPERE[0].id;
  const t = med({ saldo: 1e12 });
  for (const antall of [0, -1, 1.5, NaN, Infinity, REGLER.maksKjop + 1]) {
    assert.equal(kjopHjelper(t, id, antall), t);
    assert.equal(kjopTrykk(t, antall), t);
  }
  assert.equal(kjopHjelper(t, "finnes-ikke"), t);
  assert.equal(prisHjelper(t, "finnes-ikke"), Infinity);
  assert.equal(maksHjelper(t, "finnes-ikke"), 0);
  assert.equal(hjelperRate(t, "finnes-ikke"), 0);
});

test("maks gir flest mulige nivåer saldoen rekker til, og aldri flere enn grensen", () => {
  const id = HJELPERE[0].id;
  assert.equal(maksHjelper(med({ saldo: 0 }), id), 0);
  assert.equal(maksHjelper(med({ saldo: 150 }), id), 1);
  const t = med({ saldo: 5000 });
  const n = maksHjelper(t, id);
  assert.ok(prisHjelper(t, id, n) <= 5000);
  assert.ok(prisHjelper(t, id, n + 1) > 5000);
  assert.equal(maksTrykk(med({ saldo: 1e300 })), REGLER.maksKjop);
  const m = maksTrykk(med({ saldo: 100 }));
  assert.ok(prisTrykk(med({}), m) <= 100 && prisTrykk(med({}), m + 1) > 100);
});

test("oppgradering av overføringen koster 10 øre først og 5 % mer per nivå", () => {
  assert.equal(prisTrykk(nyTilstand()), 10);
  assert.equal(prisTrykk(med({ trykkNiva: 1 })), 11);
  const etter = kjopTrykk(med({ saldo: 10 }));
  assert.equal(etter.trykkNiva, 1);
  assert.equal(etter.saldo, 0);
  assert.equal(nedbetalingTrykk(nyTilstand()), 100);
});

test("løft blir tilgjengelig på nivå 10, 25 og 50 og dobler hjelperen hver gang", () => {
  const h = HJELPERE[0];
  assert.deepEqual(tilgjengeligeLoft(medHjelpere({ [h.id]: 9 })), []);
  assert.equal(nesteLoftNiva(nyTilstand(), h.id), 10);
  let t = medHjelpere({ [h.id]: 10 }, { saldo: 1e12 });
  const [l] = tilgjengeligeLoft(t);
  assert.equal(l.navn, h.loft[0]);
  assert.equal(l.pris, h.pris * REGLER.loftPris[0]);
  t = kjopLoft(t, h.id);
  assert.equal(hjelperRate(t, h.id), 10 * 10 * 2);
  assert.equal(nesteLoftNiva(t, h.id), 25);
  assert.deepEqual(tilgjengeligeLoft(t), [], "neste løft krever nivå 25");
  t = { ...t, hjelpere: { ...t.hjelpere, [h.id]: 50 } };
  t = kjopLoft(kjopLoft(t, h.id), h.id);
  assert.equal(hjelperRate(t, h.id), 10 * 50 * 8);
  assert.equal(nesteLoftNiva(t, h.id), null);
  assert.equal(kjopLoft(t, h.id), t, "det finnes bare tre løft");
});

test("løft uten nok penger eller uten krav endrer ingenting", () => {
  const h = HJELPERE[0];
  const fattig = medHjelpere({ [h.id]: 10 }, { saldo: 1 });
  assert.equal(kjopLoft(fattig, h.id), fattig);
  const tidlig = medHjelpere({ [h.id]: 3 }, { saldo: 1e12 });
  assert.equal(kjopLoft(tidlig, h.id), tidlig);
  assert.equal(kjopLoft(tidlig, "trykk"), tidlig);
});

test("løft for overføringen gir en andel av inntekten per sekund i hvert trykk", () => {
  const id = HJELPERE[0].id;
  let t = medHjelpere({ [id]: 5 }, { saldo: 1e12, trykk: TRYKKLOFT[0].krav });
  assert.equal(trykkAndel(t), 0);
  assert.equal(tilgjengeligeLoft(t)[0].navn, TRYKKLOFT[0].navn);
  t = kjopLoft(t, "trykk");
  assert.equal(t.trykkloft, 1);
  assert.equal(trykkverdi(t), 10 + 0.01 * 50);
  const etter = trykk(t);
  assert.equal(etter.overfort, 10.5, "alt du får av et trykk teller som overført selv");
});

test("tiden gir det hjelperne tjener, og null, negativ og ugyldig tid gir ingenting", () => {
  const id = HJELPERE[0].id;
  const t = medHjelpere({ [id]: 3 });
  const etter = tikk(t, 10);
  assert.equal(etter.saldo, 300);
  assert.equal(etter.tjent, 300);
  assert.equal(etter.overfort, 0);
  for (const s of [0, -5, NaN, Infinity]) assert.equal(tikk(t, s), t);
  const tom = nyTilstand();
  assert.equal(tikk(tom, 100), tom, "uten hjelpere skjer ingenting");
});

test("tid borte teller høyst to timer", () => {
  const id = HJELPERE[0].id;
  const t = medHjelpere({ [id]: 1 });
  assert.equal(borte(t, 60).gevinst, 600);
  const lenge = borte(t, 30 * 86400);
  assert.equal(lenge.sekunder, REGLER.maksBorteSek);
  assert.equal(lenge.gevinst, 10 * REGLER.maksBorteSek);
  assert.equal(borte(t, -100).gevinst, 0);
  assert.equal(borte(t, NaN).gevinst, 0);
});

test("utbytte er verdt ett minutt inntekt", () => {
  const id = HJELPERE[0].id;
  const t = medHjelpere({ [id]: 2 });
  assert.equal(utbytteverdi(t), 20 * 60);
  assert.equal(taUtbytte(t).tjent, 1200);
  assert.equal(utbytteverdi(nyTilstand()), 0);
});

test("nedbetalingstiden er pris delt på det nivået tjener, og løft gjør den kortere", () => {
  const h = HJELPERE[0];
  assert.equal(nedbetalingSek(nyTilstand(), h.id), 15);
  const loftet = { ...nyTilstand(), loft: { ...nyTilstand().loft, [h.id]: 1 } };
  assert.equal(nedbetalingSek(loftet, h.id), 7.5);
  assert.equal(nedbetalingSek(nyTilstand(), "finnes-ikke"), Infinity);
});

test("bare første hjelper og én skygge vises i starten, og nye åpnes når du har tjent halve prisen", () => {
  assert.deepEqual(synlige(nyTilstand()), [{ id: HJELPERE[0].id, status: "apen" }, { id: HJELPERE[1].id, status: "skygge" }]);
  const t = med({ overfort: HJELPERE[1].pris * REGLER.visFra });
  assert.deepEqual(synlige(t).map((x) => x.status), ["apen", "apen", "skygge"]);
  const alle = med({ tjent: 1e30 });
  assert.equal(synlige(alle).length, HJELPERE.length);
  assert.ok(synlige(alle).every((x) => x.status === "apen"));
});

test("en lagret tilstand kommer likt tilbake", () => {
  let t = med({ saldo: 1e9 });
  t = kjopTrykk(kjopHjelper(trykk(t), HJELPERE[0].id, 12), 3);
  t = kjopLoft(t, HJELPERE[0].id);
  const tekst = JSON.stringify(tilLagring(t, 1234));
  const lest = fraLagring(JSON.parse(tekst));
  assert.deepEqual(lest.tilstand, t);
  assert.equal(lest.tid, 1234);
});

test("ødelagt eller fremmed lagring avvises", () => {
  const god = tilLagring(nyTilstand(), 1);
  for (const feil of [null, undefined, 5, "tekst", [], {}, { ...god, v: 2 }, { ...god, saldo: -1 }, { ...god, saldo: "100" },
    { ...god, saldo: Infinity }, { ...god, tjent: NaN }, { ...god, trykk: 1.5 }, { ...god, trykkloft: 99 },
    { ...god, hjelpere: {} }, { ...god, hjelpere: { ...god.hjelpere, reitan: -3 } }, { ...god, loft: { ...god.loft, reitan: 4 } }]) {
    assert.equal(fraLagring(feil), null);
  }
  assert.equal(fraLagring({ ...god, tid: "i går" }).tid, null);
  assert.equal(fraLagring({ ...god, ukjent: 1 }).tilstand.ukjent, undefined);
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

test("svært store tall holder seg endelige", () => {
  let t = med({ saldo: 1e300 });
  for (const h of HJELPERE) t = kjopHjelper(t, h.id, REGLER.maksKjop);
  t = tikk(t, 1);
  assert.ok(Number.isFinite(t.saldo));
  assert.ok(Number.isFinite(perSekund(t)));
  assert.notEqual(formaterOre(perSekund(t)), "");
});

test("spillet nevner ingen forsikringsselskaper eller banker", () => {
  const tekst = JSON.stringify([HJELPERE, TRYKKLOFT]).toLowerCase();
  for (const ord of ["forsikring", "bank", "storebrand", "gjensidige", "tryg", "fremtind"]) assert.ok(!tekst.includes(ord), ord);
  assert.ok(!/\bif\b/.test(tekst));
});
