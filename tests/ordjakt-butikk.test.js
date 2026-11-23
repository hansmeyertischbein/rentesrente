import { test } from "node:test";
import assert from "node:assert/strict";
import { VARER, nyKasse, lesKasse, tjen, kjop, velg, bruk } from "../src/lib/ordjakt-butikk.js";
import { nyBorg, igjen, sikt, knus } from "../src/lib/ordjakt-borg.js";
import { KOMMENTARER, kommentar } from "../src/lib/ordjakt-kommentarer.js";
import { boostFaktor, nesteRekke, medBoost } from "../src/lib/ordjakt.js";

test("poeng blir hele mynter, og ugyldige poeng gir ingen", () => {
  assert.equal(tjen(nyKasse(), 966.9).mynter, 966);
  for (const x of [0, -5, NaN, Infinity]) assert.equal(tjen(nyKasse(), x).mynter, 0);
});

test("kjøp krever nok mynter, og pynt kan bare kjøpes én gang", () => {
  assert.equal(kjop(tjen(nyKasse(), 499), "seil-rod").eier.length, 0);
  let k = kjop(tjen(nyKasse(), 1200), "seil-rod");
  assert.deepEqual([k.mynter, k.eier, k.valgt.seil], [700, ["seil-rod"], "seil-rod"]);
  assert.equal(kjop(k, "seil-rod"), k);
  assert.equal(velg(k, "seil-rod").valgt.seil, null);
  assert.equal(velg(k, "seil-gull"), k);
  assert.equal(kjop(k, "finnes-ikke"), k);
});

test("hjelpemidler kan kjøpes flere ganger og brukes opp", () => {
  let k = kjop(kjop(tjen(nyKasse(), 1000), "kikkert"), "kikkert");
  assert.deepEqual([k.mynter, k.antall.kikkert], [0, 2]);
  k = bruk(bruk(bruk(k, "kikkert"), "kikkert"), "kikkert");
  assert.equal(k.antall.kikkert, 0);
});

test("lagret kasse leses tilbake, og ødelagte data gir en tom kasse", () => {
  const k = kjop(tjen(nyKasse(), 3000), "kule-ild");
  assert.deepEqual(lesKasse(JSON.stringify(k)), k);
  for (const t of ["", "null", "{", '{"mynter":-4,"eier":["x"],"valgt":{"seil":"kule-ild"}}']) assert.deepEqual(lesKasse(t), nyKasse());
  assert.equal(new Set(VARER.map((v) => v.id)).size, VARER.length);
});

test("boost øker med ti prosent per raske treff, stopper på femti og nullstilles av pause", () => {
  let r = nesteRekke(0, Infinity);
  assert.equal(boostFaktor(r), 1);
  for (let i = 0; i < 8; i++) r = nesteRekke(r, 2);
  assert.equal(boostFaktor(r), 1.5);
  assert.equal(nesteRekke(r, 6.1), 0);
  assert.equal(nesteRekke(1, 6), 2);
  assert.equal(medBoost(90, 2), 108);
});

test("borgen mister steiner for hvert treff, ingenting blir hengende, og ti treff tar hele", () => {
  for (let forsok = 0; forsok < 50; forsok++) {
    const b = nyBorg(), start = igjen(b);
    for (let i = 0; i < 10; i++) {
      const før = igjen(b), s = sikt(b);
      if (!s) break;
      assert.ok(knus(b, s, Math.ceil(start / 10)).length > 0);
      assert.ok(igjen(b) < før);
    }
    assert.equal(igjen(b), 0);
  }
  assert.equal(sikt([]), null);
});

test("kommentaren skryter ved høy plassering og er frekk ved lav", () => {
  assert.ok(KOMMENTARER[0].tekster.includes(kommentar(1)));
  assert.ok(KOMMENTARER[1].tekster.includes(kommentar(11)));
  assert.equal(kommentar(80, () => 0), "Har du lest mange bøker i det siste?");
  assert.ok(KOMMENTARER.at(-1).tekster.includes(kommentar(100, () => 0.99)));
  assert.equal(KOMMENTARER.at(-1).til, 100);
});
