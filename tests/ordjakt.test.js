import { test } from "node:test";
import assert from "node:assert/strict";
import { normaliser, finnOrd, poengFor, vurder, rekkefolge, nyKode, gyldigKode, avstand } from "../src/lib/ordjakt.js";
import data from "../src/assets/js/ordjakt-data.js";

const dyr = [["løve", 10], ["elg", 50], ["isbjørn", 30], ["sjiraff", 10]];

test("eksempelet: løve med 10 av 100 gir 90 poeng", () => {
  assert.equal(poengFor(10, 100), 90);
  assert.equal(vurder(dyr, "Løve").poeng, 90);
});

test("poeng i kanttilfeller", () => {
  assert.equal(poengFor(0, 100), 100);
  assert.equal(poengFor(100, 100), 0);
  assert.equal(poengFor(5, 0), 0);
  assert.equal(poengFor(-1, 100), 0);
  assert.equal(poengFor(1, 3), 66.7);
});

test("finner ord med store bokstaver, bøying og skrivefeil", () => {
  assert.equal(normaliser("  LØVE! "), "løve");
  assert.equal(finnOrd(dyr, "løver"), 0);
  assert.equal(finnOrd(dyr, "isbjørnene"), 2);
  assert.equal(finnOrd(dyr, "sjriaff"), 3);
  assert.equal(finnOrd(dyr, "sjiraf"), 3);
  assert.equal(finnOrd(dyr, "katt"), -1);
  assert.equal(finnOrd([["kløver", 5]], "løver"), -1);
  assert.equal(finnOrd(dyr, ""), -1);
  assert.equal(avstand("abc", "abd"), 1);
});

test("samme ord to ganger gir null", () => {
  const r = vurder(dyr, "elg", new Set([1]));
  assert.equal(r.status, "brukt");
  assert.equal(r.poeng, 0);
  assert.equal(vurder(dyr, "hval").status, "ukjent");
});

test("romkoden gir samme rekkefølge på begge maskiner", () => {
  assert.deepEqual(rekkefolge(100, "ABCD"), rekkefolge(100, "abcd"));
  assert.notDeepEqual(rekkefolge(100, "ABCD"), rekkefolge(100, "WXYZ"));
  assert.deepEqual([...rekkefolge(100, "ABCD")].sort((a, b) => a - b), Array.from({ length: 100 }, (_, i) => i));
  assert.ok(gyldigKode(nyKode()));
  assert.ok(!gyldigKode("AB1"));
});

test("dataene har 100 kategorier med tall for hvert ord", () => {
  assert.equal(data.kategorier.length, 100);
  for (const k of data.kategorier) {
    assert.ok(k.ord.length >= SVAR_MIN, k.navn);
    for (const [o, n] of k.ord) assert.ok(typeof o === "string" && n > 0, `${k.navn}: ${o}`);
  }
});
const SVAR_MIN = 25;
