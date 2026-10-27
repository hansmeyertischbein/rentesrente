import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lesTilstand, skrivTilstand } from "../src/lib/tilstand.js";
import { GRENSER, SKATTEVALG } from "../src/lib/sparing.js";

const standard = { start: 10000, mnd: 1000, ar: 30, avk: 6.6, kost: 0.3, infl: 2, sving: 16, skatt: "salg", type: "aksjefond" };
const opts = { grenser: GRENSER, valg: { skatt: SKATTEVALG, type: ["aksjefond", "sparekonto", "egne"] } };

test("lenken gir tilbake de samme verdiene", () => {
  const verdier = { ...standard, start: 25000, mnd: 2500, ar: 40, avk: 5.5, skatt: "ingen", type: "egne" };
  assert.deepEqual(lesTilstand(skrivTilstand(verdier), standard, opts), verdier);
});

test("ugyldige og manglende verdier blir standardverdier", () => {
  const ut = lesTilstand("#start=abc&mnd=-5&ar=500&avk=&skatt=hemmelig&type=x&ukjent=1", standard, opts);
  assert.deepEqual(ut, standard);
});

test("tom lenke gir standardverdiene", () => {
  assert.deepEqual(lesTilstand("", standard, opts), standard);
});

const satser = JSON.parse(readFileSync(new URL("../src/_data/satser.json", import.meta.url)));

test("hver sats har verdi, år, kilde, lenke og kontrolldato", () => {
  for (const [navn, s] of Object.entries(satser)) {
    assert.equal(typeof s.verdi, "number", navn);
    assert.ok(Number.isInteger(s.aar), navn);
    assert.ok(s.kilde && s.beskrivelse, navn);
    assert.match(s.url, /^https:\/\//, navn);
    assert.match(s.kontrollert, /^\d{4}-\d{2}-\d{2}$/, navn);
  }
});

test("ingen sats er mer enn 400 dager siden kontrollert", () => {
  const idag = Date.now();
  for (const [navn, s] of Object.entries(satser)) {
    const dager = (idag - Date.parse(s.kontrollert)) / 86_400_000;
    assert.ok(dager <= 400, `${navn} ble sist kontrollert ${s.kontrollert}. Kontroller satsen mot kilden og oppdater datoen.`);
  }
});
