import { test } from "node:test";
import assert from "node:assert/strict";
import { aksetekst, formaterKr, formaterProsent, omtrentKr, parseTall, rundAv } from "../src/lib/format.js";

const NBSP = " ";
const n = (s) => s.replace(/ /g, NBSP);

test("rundAv beholder tre gjeldende siffer", () => {
  assert.equal(rundAv(684321), 684000);
  assert.equal(rundAv(1234567), 1230000);
  assert.equal(rundAv(999999), 1000000);
  assert.equal(rundAv(0), 0);
});

test("omtrentKr skriver beløp slik de skal stå i en setning", () => {
  assert.equal(omtrentKr(684321), n("684 000 kr"));
  assert.equal(omtrentKr(1234567), n("1,23 mill. kr"));
  assert.equal(omtrentKr(999999), n("1,00 mill. kr"));
  assert.equal(omtrentKr(12345678), n("12,3 mill. kr"));
  assert.equal(omtrentKr(2345678901), n("2,35 mrd. kr"));
  assert.equal(omtrentKr(0), n("0 kr"));
  assert.equal(omtrentKr(-1234), n("−1 230 kr"));
});

test("formaterKr gir eksakte kroner med mellomrom som tusenskille", () => {
  assert.equal(formaterKr(370000), n("370 000 kr"));
  assert.equal(formaterKr(1234.6), n("1 235 kr"));
});

test("formaterProsent bruker komma og mellomrom før prosenttegnet", () => {
  assert.equal(formaterProsent(37.84), n("37,84 %"));
  assert.equal(formaterProsent(2), n("2 %"));
  assert.equal(formaterProsent(0.3), n("0,3 %"));
});

test("aksetekst er kort", () => {
  assert.equal(aksetekst(0), "0");
  assert.equal(aksetekst(250000), n("250 000"));
  assert.equal(aksetekst(1500000), n("1,5 mill."));
});

test("parseTall forstår norske skrivemåter", () => {
  assert.equal(parseTall("10 000"), 10000);
  assert.equal(parseTall("10 000 kr"), 10000);
  assert.equal(parseTall("10.000", { heltall: true }), 10000);
  assert.equal(parseTall("1.234.567", { heltall: true }), 1234567);
  assert.equal(parseTall("1,5"), 1.5);
  assert.equal(parseTall("1.5"), 1.5);
  assert.equal(parseTall("6,6 %"), 6.6);
  assert.equal(parseTall("-2"), -2);
  assert.equal(parseTall("−2"), -2);
  assert.equal(parseTall(",5"), 0.5);
  assert.equal(parseTall("kr 10 000", { heltall: true }), 10000);
  assert.equal(parseTall("Kr. 2500", { heltall: true }), 2500);
});

test("parseTall gir NaN for tekst som ikke er et tall", () => {
  for (const s of ["", "  ", "abc", "1,2,3", "10-", "1e5", "kr"]) assert.ok(Number.isNaN(parseTall(s)), s);
});
