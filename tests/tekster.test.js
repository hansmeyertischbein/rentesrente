import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { beregnSparing, simuler } from "../src/lib/sparing.js";
import { andeler, lagTekster } from "../src/lib/tekster.js";

const NBSP = " ";
const n = (s) => s.replace(/ /g, NBSP);
const base = { start: 10000, mnd: 1000, ar: 30, avk: 6.6, kost: 0.3, infl: 2, sving: 16, skatt: "salg", skattesats: 37.84 };

test("resultatet står i én setning med omtrentlige tall", () => {
  const r = beregnSparing(base);
  const t = lagTekster(base, r, simuler(base));
  assert.equal(t.ar, "30");
  assert.equal(t.verdi, n("1,09 mill. kr"));
  assert.match(t["idag-setning"], /^Det er omtrent .+ i dagens kroner\.$/);
  assert.match(t["skatt-setning"], /^Selger du alt da, går omtrent .+ til skatt\./);
  assert.equal(t.innskudd, n("370 000 kr"));
  assert.match(t.usikkerhet, /I 8 av 10 simulerte forløp ender du mellom/);
  assert.match(t["graf-tittel"], /^Etter 30 år er \d+ % av beløpet avkastning$/);
});

test("tap gir egne formuleringer og ingen skatt", () => {
  const p = { ...base, avk: -3, sving: 0 };
  const r = beregnSparing(p);
  const t = lagTekster(p, r, null);
  assert.equal(t["avkastning-tekst"], "Du har tapt");
  assert.match(t["skatt-setning"], /ingen skatt/);
  assert.match(t["graf-tittel"], /lavere enn det du har satt inn/);
  assert.match(t.usikkerhet, /0 % svingning/);
  assert.deepEqual(andeler(r), { innskudd: 100, avkastning: 0 });
});

test("årlig skatt og ingen skatt har egne setninger", () => {
  const aar = { ...base, skatt: "aar", skattesats: 22, sving: 0, avk: 3, kost: 0 };
  const t = lagTekster(aar, beregnSparing(aar), null);
  assert.equal(t["skatt-tekst"], "Skatten underveis har tatt");
  assert.match(t["skatt-setning"], /hvert år underveis/);
  const ingen = { ...base, skatt: "ingen", skattesats: 0 };
  assert.equal(lagTekster(ingen, beregnSparing(ingen), null)["skatt-setning"], "Skatt er ikke regnet med.");
});

test("andelene av sluttverdien summerer til 100", () => {
  const a = andeler(beregnSparing(base));
  assert.ok(Math.abs(a.innskudd + a.avkastning - 100) < 1e-9);
  assert.ok(a.avkastning > 50);
});

test("skattesatsen for aksjer er kapitalskatten ganget med oppjusteringsfaktoren", () => {
  const satser = JSON.parse(readFileSync(new URL("../src/_data/satser.json", import.meta.url)));
  const s = satser.skattAksjegevinst;
  assert.ok(Math.abs(satser.skattKapital.verdi * s.faktor - s.verdi) < 1e-9);
});

test("uten startbeløp og sparing sier teksten hva som mangler", () => {
  const p = { ...base, start: 0, mnd: 0, ar: 1 };
  const r = beregnSparing(p);
  const t = lagTekster(p, r, simuler(p));
  assert.match(t["idag-setning"], /Skriv inn et startbeløp/);
  assert.equal(t.usikkerhet, "");
  assert.equal(t["graf-tittel"], "Ingen sparing å vise ennå");
});

test("null avkastning gir verdi lik innskudd, og nesten alt avkastning sies med ord", () => {
  const null0 = { ...base, avk: 0, kost: 0, sving: 0, skatt: "ingen" };
  assert.match(lagTekster(null0, beregnSparing(null0), null)["graf-tittel"], /lik det du har satt inn/);
  const maks = { start: 100_000_000, mnd: 1_000_000, ar: 80, avk: 25, kost: 0, infl: 0, sving: 0, skatt: "ingen", skattesats: 0 };
  assert.match(lagTekster(maks, beregnSparing(maks), null)["graf-tittel"], /nesten hele beløpet/);
});
