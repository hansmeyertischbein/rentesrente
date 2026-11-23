import { test } from "node:test";
import assert from "node:assert/strict";
import { normaliser, finnOrd, poengFor, vurder, rekkefolge, nyKode, gyldigKode, avstand, simulerSpillere, toppProsent, SVAR_PER_RUNDE } from "../src/lib/ordjakt.js";
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

test("skrivefeil: flere feil tåles i lange ord, og korte ord må starte likt", () => {
  const l = [["elg", 3], ["tiger", 4], ["elefant", 5], ["dostojevskij", 2], ["kløver", 5], ["nebukadnesar", 1]];
  assert.equal(finnOrd(l, "tigar"), 1);
  assert.equal(finnOrd(l, "ellefannt"), 2);
  assert.equal(finnOrd(l, "dostojefski"), 3);
  assert.equal(finnOrd(l, "nebukanesser"), 5);
  assert.equal(finnOrd(l, "løver"), -1);
  assert.equal(finnOrd(l, "els"), -1);
  const p = [["c", 1], ["c++", 2], ["c#", 3]];
  assert.deepEqual(["C", "C++", "c#"].map((x) => finnOrd(p, x)), [0, 1, 2]);
});

test("andre navn på samme ting er ett svar, og første ord i et navn holder når det er entydig", () => {
  const l = [["spider-man", 9, 0, ["edderkoppen"]], ["wallenius wilhelmsen", 2], ["norsk elghund", 3], ["amerikansk dollar", 4]];
  assert.equal(finnOrd(l, "Edderkoppen"), 0);
  assert.equal(vurder(l, "edderkoppen", new Set([0])).status, "brukt");
  assert.equal(finnOrd(l, "wallenius"), 1);
  assert.equal(finnOrd(l, "norsk"), -1);
  assert.equal(finnOrd(l, "amerikansk"), -1);
});

test("hvert ord i dataene finner seg selv", () => {
  const feil = [];
  for (const k of data.kategorier) k.ord.forEach((o, i) => { for (const x of [o[0], ...(o[3] ?? [])]) if (finnOrd(k.ord, x) !== i) feil.push(k.navn + ": " + x); });
  assert.ok(feil.length <= 5, feil.join(", "));
});

test("etternavn og slutten av navn holder", () => {
  const navn = [["vincent van gogh", 9], ["george h.w. bush", 2], ["george w. bush", 8], ["konstantin den store", 3], ["fjodor dostojevskij", 4], ["spider-man", 5], ["bogotá", 6], ["theodosius i", 1]];
  assert.equal(finnOrd(navn, "Gogh"), 0);
  assert.equal(finnOrd(navn, "van gogh"), 0);
  assert.equal(finnOrd(navn, "bush"), 2);
  assert.equal(finnOrd(navn, "bush", new Set([2])), 1);
  assert.equal(finnOrd(navn, "konstantin"), 3);
  assert.equal(finnOrd(navn, "dostojevski"), 4);
  assert.equal(finnOrd(navn, "man"), -1);
  assert.equal(finnOrd(navn, "spiderman"), 5);
  assert.equal(finnOrd(navn, "bogota"), 6);
  assert.equal(finnOrd(navn, "theodosius"), 7);
  assert.equal(normaliser("Ålesund"), "ålesund");
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

test("toppProsent: best gir 1, null poeng gir 100, like poeng teller som bedre", () => {
  assert.equal(toppProsent([10, 20, 30, 40], 41), 1);
  assert.equal(toppProsent([10, 20, 30, 40], 40), 25);
  assert.equal(toppProsent([10, 20, 30, 40], 0), 100);
  assert.equal(toppProsent([], 50), 100);
});

test("simulerte spillere er like hver gang, sortert og innenfor mulige poeng i alle kategorier", () => {
  for (const k of data.kategorier) {
    const r = simulerSpillere(k.ord, k.navn, 300);
    assert.equal(r.length, 300);
    assert.ok(r[0] >= 0 && r.at(-1) <= 150 * SVAR_PER_RUNDE, k.navn);
    assert.ok(r.every((x, i) => i === 0 || x >= r[i - 1]));
    assert.ok(toppProsent(r, r[Math.floor(r.length / 2)]) <= 60, k.navn);
  }
  assert.deepEqual(simulerSpillere(dyr, "a", 50), simulerSpillere(dyr, "a", 50));
});

test("dataene har 100 kategorier med tall for hvert ord", () => {
  assert.equal(data.kategorier.length, 100);
  for (const k of data.kategorier) {
    assert.ok(k.ord.length >= SVAR_MIN, k.navn);
    for (const [o, n] of k.ord) assert.ok(typeof o === "string" && n > 0, `${k.navn}: ${o}`);
  }
});
const SVAR_MIN = 25;
