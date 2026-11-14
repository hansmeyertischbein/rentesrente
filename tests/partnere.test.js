import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FORBUDT, KATEGORIER, aktivePartnere, feilIAktive, reklameoversikt, validerPartner } from "../src/lib/partnere.js";

const idag = new Date("2026-11-14T12:00:00Z");
const gyldig = {
  id: "eksempelbank",
  navn: "Eksempelbank",
  kategori: "aksjesparekonto",
  url: "https://eksempel.no/?ref=rentesrente",
  beskrivelse: "Bank med aksjesparekonto.",
  nettverk: "direkte",
  godtgjorelse: "Fast beløp per ny kunde",
  tillatelse: "https://www.finanstilsynet.no/virksomhetsregisteret/detalj/?id=1",
  avtaleFra: "2026-11-01",
  avtaleTil: null,
  kontrollert: "2026-11-10",
  aktiv: true,
};

test("en fullstendig partner har ingen feil", () => {
  assert.deepEqual(validerPartner(gyldig, idag), []);
});

test("hvert påkrevd felt gir feil når det mangler", () => {
  for (const felt of ["navn", "url", "beskrivelse", "nettverk", "godtgjorelse", "tillatelse", "avtaleFra", "kontrollert"]) {
    const p = { ...gyldig, [felt]: undefined };
    assert.ok(validerPartner(p, idag).length > 0, felt);
  }
});

test("forbudte og ukjente kategorier blir stoppet", () => {
  for (const kategori of [...FORBUDT, "noe-annet", undefined]) {
    assert.ok(validerPartner({ ...gyldig, kategori }, idag).length > 0, String(kategori));
  }
  for (const kategori of FORBUDT) assert.ok(!(kategori in KATEGORIER), kategori);
});

test("lenken må være https, og tillatelsen må peke til Finanstilsynet", () => {
  assert.ok(validerPartner({ ...gyldig, url: "http://eksempel.no" }, idag).length > 0);
  assert.ok(validerPartner({ ...gyldig, tillatelse: "https://eksempel.no/tillatelse" }, idag).length > 0);
  assert.ok(validerPartner({ ...gyldig, tillatelse: "https://finanstilsynet.no.eksempel.no/" }, idag).length > 0);
});

test("avtaler som ikke har begynt, er utløpt eller ikke er kontrollert, vises ikke", () => {
  assert.equal(aktivePartnere([{ ...gyldig, avtaleFra: "2026-12-01" }], null, idag).length, 0);
  assert.equal(aktivePartnere([{ ...gyldig, avtaleTil: "2026-11-13" }], null, idag).length, 0);
  assert.equal(aktivePartnere([{ ...gyldig, avtaleTil: "2026-11-14" }], null, idag).length, 1, "siste avtaledag teller med");
  assert.equal(aktivePartnere([{ ...gyldig, kontrollert: "2025-09-01" }], null, idag).length, 0);
});

test("bare partnere som er slått på, vises", () => {
  assert.equal(aktivePartnere([{ ...gyldig, aktiv: false }], null, idag).length, 0);
  assert.equal(aktivePartnere([{ ...gyldig, aktiv: "ja" }], null, idag).length, 0);
  assert.equal(aktivePartnere(undefined, null, idag).length, 0);
});

test("rekkefølgen er alltid alfabetisk, uansett rekkefølgen i filen", () => {
  const liste = ["Østbank", "Zeta", "alfa", "Åsbank", "Beta"].map((navn, i) => ({ ...gyldig, id: "p" + i, navn }));
  assert.deepEqual(aktivePartnere(liste, null, idag).map((p) => p.navn), ["alfa", "Beta", "Zeta", "Østbank", "Åsbank"]);
});

test("oversikten deler partnerne på kategori", () => {
  const o = reklameoversikt([gyldig, { ...gyldig, id: "b", kategori: "bsu" }, { ...gyldig, id: "c", aktiv: false }], idag);
  assert.equal(o.harReklame, true);
  assert.equal(o.perKategori.aksjesparekonto.length, 1);
  assert.equal(o.perKategori.bsu.length, 1);
  assert.equal(o.perKategori.sparekonto.length, 0);
  assert.equal(reklameoversikt([], idag).harReklame, false);
});

test("feil i partnere som er slått på, blir meldt, også like id-er", () => {
  assert.deepEqual(feilIAktive([gyldig], idag), []);
  assert.equal(feilIAktive([{ ...gyldig, aktiv: false, url: "" }], idag).length, 0, "avslåtte partnere stopper ikke byggingen");
  assert.ok(feilIAktive([{ ...gyldig, url: "" }], idag).length > 0);
  assert.ok(feilIAktive([gyldig, { ...gyldig }], idag).some((f) => f.includes("to ganger")));
});

test("partnerne i src/_data/partnere.json er gyldige", () => {
  const liste = JSON.parse(readFileSync(new URL("../src/_data/partnere.json", import.meta.url)));
  assert.ok(Array.isArray(liste));
  assert.deepEqual(feilIAktive(liste), []);
});
