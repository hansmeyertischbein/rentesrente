import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  arligVekst,
  beregnSparing,
  framskriv,
  kvantil,
  lagForhandsvalg,
  logSvingning,
  simuler,
  skattesatsFor,
} from "../src/lib/sparing.js";

const satser = JSON.parse(readFileSync(new URL("../src/_data/satser.json", import.meta.url)));

const base = { start: 10000, mnd: 1000, ar: 30, avk: 6.6, kost: 0.3, infl: 2, sving: 16, skatt: "salg", skattesats: 37.84 };
const naer = (a, b, rel = 1e-9) => assert.ok(Math.abs(a - b) <= rel * Math.max(1, Math.abs(b)), `${a} er ikke nær ${b}`);

test("uten avkastning er verdien summen av innskuddene", () => {
  const r = beregnSparing({ ...base, avk: 0, kost: 0, skatt: "ingen" });
  assert.equal(r.verdi, 10000 + 1000 * 12 * 30);
  assert.equal(r.innskudd, 370000);
  assert.equal(r.avkastning, 0);
  assert.equal(r.skattVedSalg, 0);
});

test("et engangsbeløp vokser med (1 + r) opphøyd i antall år", () => {
  const r = beregnSparing({ ...base, start: 10000, mnd: 0, avk: 5, kost: 0, skatt: "ingen" });
  naer(r.verdi, 10000 * Math.pow(1.05, 30)); // 43 219,42 kr
  naer(Math.round(r.verdi), 43219, 0);
});

test("månedlig sparing følger formelen for sluttverdien av en annuitet", () => {
  const r = beregnSparing({ ...base, start: 0, mnd: 1000, ar: 30, avk: 12, kost: 0, skatt: "ingen" });
  const m = Math.pow(1.12, 1 / 12) - 1;
  naer(r.verdi, (1000 * (Math.pow(1 + m, 360) - 1)) / m);
});

test("kostnaden trekkes fra avkastningen", () => {
  const med = beregnSparing({ ...base, avk: 6.6, kost: 0.3, skatt: "ingen" });
  const samme = beregnSparing({ ...base, avk: 6.3, kost: 0, skatt: "ingen" });
  naer(med.verdi, samme.verdi);
  const utenKost = beregnSparing({ ...base, kost: 0, skatt: "ingen" });
  naer(med.kostnader, utenKost.verdi - med.verdi);
  assert.ok(med.kostnader > 0);
});

test("dagens kroner deler på inflasjonen over hele perioden", () => {
  const r = beregnSparing(base);
  naer(r.verdiIDag, r.verdi / Math.pow(1.02, 30));
  naer(r.serie[10].verdiIDag, r.serie[10].verdi / Math.pow(1.02, 10));
});

test("skatt ved salg er satsen ganget med gevinsten", () => {
  const r = beregnSparing(base);
  naer(r.skattVedSalg, (r.verdi - r.innskudd) * 0.3784);
  naer(r.etterSkatt, r.verdi - r.skattVedSalg);
});

test("ingen skatt når sparingen går med tap", () => {
  const r = beregnSparing({ ...base, avk: -5 });
  assert.ok(r.verdi < r.innskudd);
  assert.equal(r.skattVedSalg, 0);
  assert.equal(r.etterSkatt, r.verdi);
});

test("årlig skatt gir lavere vekst: (avkastning minus kostnad) ganger (1 minus skattesats)", () => {
  naer(arligVekst({ avk: 3, kost: 0, skatt: "aar", skattesats: 22 }), 0.03 * 0.78);
  const r = beregnSparing({ ...base, avk: 3, kost: 0, sving: 0, skatt: "aar", skattesats: 22 });
  const uten = beregnSparing({ ...base, avk: 3, kost: 0, sving: 0, skatt: "ingen" });
  naer(r.skattUnderveis, uten.verdi - r.verdi);
  assert.equal(r.skattVedSalg, 0);
});

test("null år gir startbeløpet tilbake", () => {
  const s = framskriv({ start: 5000, mnd: 1000, ar: 0, vekst: 0.05 });
  assert.equal(s.length, 1);
  assert.equal(s[0].verdi, 5000);
});

test("svært store tall gir endelige svar", () => {
  const r = beregnSparing({ start: 100_000_000, mnd: 1_000_000, ar: 80, avk: 25, kost: 0, infl: 20, sving: 60, skatt: "salg", skattesats: 37.84 });
  for (const x of [r.verdi, r.verdiIDag, r.skattVedSalg, r.etterSkattIDag, r.kostnader]) assert.ok(Number.isFinite(x));
});

test("serien har ett punkt per år og øker med positiv avkastning", () => {
  const r = beregnSparing(base);
  assert.equal(r.serie.length, 31);
  for (let i = 1; i < r.serie.length; i++) assert.ok(r.serie[i].verdi > r.serie[i - 1].verdi);
});

test("simuleringen er null uten svingning", () => {
  assert.equal(simuler({ ...base, sving: 0 }), null);
});

test("simuleringen gir samme svar med samme frø", () => {
  const a = simuler(base, { forlop: 200 });
  const b = simuler(base, { forlop: 200 });
  assert.deepEqual(a, b);
});

test("simuleringen sprer seg rundt det typiske utfallet", () => {
  const sim = simuler(base, { forlop: 4000 });
  const slutt = sim.serie[30];
  assert.ok(slutt.lav < slutt.median && slutt.median < slutt.hoy);
  // Medianen for et engangsbeløp er (1 + g)^år; med månedlig sparing ligger den nær det deterministiske tallet.
  const r = beregnSparing(base);
  assert.ok(Math.abs(slutt.median / r.verdi - 1) < 0.05, `median ${slutt.median} mot ${r.verdi}`);
  assert.ok(sim.andelUnderInnskudd >= 0 && sim.andelUnderInnskudd < 0.2);
});

test("medianen for et engangsbeløp treffer den geometriske avkastningen", () => {
  const p = { ...base, mnd: 0, start: 100000, ar: 20, kost: 0, skatt: "ingen" };
  const sim = simuler(p, { forlop: 20000 });
  const ventet = 100000 * Math.pow(1.066, 20);
  assert.ok(Math.abs(sim.serie[20].median / ventet - 1) < 0.03);
});

test("logaritmisk svingning gir riktig svingning i vanlig årsavkastning", () => {
  const g = 0.063;
  const s = logSvingning(g, 0.16);
  const mu = Math.log(1 + g);
  const variansAritmetisk = (Math.exp(s * s) - 1) * Math.exp(2 * mu + s * s);
  naer(Math.sqrt(variansAritmetisk), 0.16, 1e-6);
});

test("kvantil interpolerer lineært", () => {
  const x = Float64Array.from([1, 2, 3, 4, 5]);
  assert.equal(kvantil(x, 0.5), 3);
  assert.equal(kvantil(x, 0.1), 1.4);
  assert.equal(kvantil(x, 0.9), 4.6);
});

test("forhåndsvalgene regnes ut fra satsene", () => {
  const v = lagForhandsvalg(satser);
  // (1 + 4,5 %) × (1 + 2 %) − 1 = 6,59 %, avrundet til 6,6 %
  assert.equal(v.aksjefond.avk, 6.6);
  assert.equal(v.aksjefond.kost, 0.3);
  assert.equal(v.aksjefond.sving, 16);
  assert.equal(v.aksjefond.skatt, "salg");
  // (1 + 1 %) × (1 + 2 %) − 1 = 3,02 %, avrundet til 3,0 %
  assert.equal(v.sparekonto.avk, 3);
  assert.equal(v.sparekonto.skatt, "aar");
  assert.equal(skattesatsFor("salg", satser), 37.84);
  assert.equal(skattesatsFor("aar", satser), 22);
  assert.equal(skattesatsFor("ingen", satser), 0);
});

test("årlig skatt gir ikke negativ skatt når avkastningen er negativ", () => {
  const p = { ...base, avk: -10, kost: 5, sving: 0, skatt: "aar", skattesats: 22 };
  const r = beregnSparing(p);
  assert.equal(r.skattUnderveis, 0);
  assert.equal(arligVekst(p), -0.15);
});
