import { test } from "node:test";
import assert from "node:assert/strict";
import { tapFor, netto, tolkStatus, kanStarte, avtal, erVert, antallRunder, VERSJON } from "../src/lib/ordjakt-duell.js";

const st = (x = {}) => tolkStatus({ v: VERSJON, id: "a1", fro: "abc", ...x });

test("raske treff tar 5, 10 og så 15 poeng, og ingen kommer under null", () => {
  assert.deepEqual([0, 1, 2, 3, 5].map(tapFor), [0, 5, 10, 15, 15]);
  assert.equal(netto(96.5, 10), 86.5);
  assert.equal(netto(5, 15), 0);
});

test("ugyldige og overdrevne meldinger blir klippet eller avvist", () => {
  for (const m of [null, "x", {}, { id: "a" }, { id: "<b>", fro: "abc" }]) assert.equal(tolkStatus(m), null);
  const s = st({ brutto: 1e9, skade: 1e9, treff: 99, svar: -3, runde: NaN });
  assert.deepEqual([s.brutto, s.skade, s.treff, s.svar, s.runde], [1500, 150, 10, 0, 0]);
  assert.equal(tolkStatus({ id: "a", fro: "b" }).gammel, true);
});

test("runden starter bare når begge er klare for samme runde med samme kategorier", () => {
  const jeg = { klar: true, fro: "abc", neste: 2, antall: 3 };
  assert.ok(!kanStarte(jeg, st({ klar: true, neste: 2, antall: 5 })));
  assert.ok(kanStarte(jeg, st({ klar: true, neste: 2 })));
  assert.ok(!kanStarte(jeg, st({ klar: false, neste: 2 })));
  assert.ok(!kanStarte(jeg, st({ klar: true, neste: 1 })));
  assert.ok(!kanStarte(jeg, st({ klar: true, neste: 2, fro: "xyz" })));
  assert.ok(!kanStarte({ ...jeg, klar: false }, st({ klar: true, neste: 2 })));
  assert.ok(!kanStarte(jeg, tolkStatus({ id: "a", fro: "abc", klar: true, neste: 2 })));
  assert.ok(kanStarte(jeg, st({ startet: true, runde: 2 })));
  assert.ok(!kanStarte(jeg, null));
});

test("den som laget koden, velger antall runder, og begge regner ut det samme", () => {
  const vert = { id: "b", vert: true, valgt: 7 }, gjest = { id: "a", vert: false, valgt: 3 };
  assert.ok(erVert(vert, gjest) && !erVert(gjest, vert));
  assert.equal(antallRunder(vert, st({ id: "a", antall: 3 })), 7);
  assert.equal(antallRunder(gjest, st({ id: "b", vert: true, antall: 7 })), 7);
  assert.equal(st({ antall: 999 }).antall, 3);
  const x = { id: "a", vert: false }, y = { id: "b", vert: false };
  assert.ok(erVert(x, y) !== erVert(y, x));
});

test("svarene til motspilleren klippes til ti korte tekster", () => {
  const s = st({ ord: [["a".repeat(90), 999], ["ok", 5], [3, 4], "x", ...Array(20).fill(["b", 1])], sum: 1e9 });
  assert.equal(s.ord[0][0].length, 40);
  assert.equal(s.ord[0][1], 150);
  assert.ok(s.ord.length <= 10 && s.ord.every(([o]) => typeof o === "string"));
  assert.equal(s.sum, 15000);
  assert.deepEqual(st({ ord: "x" }).ord, []);
});

test("begge kommer fram til samme kategorier, og den som kommer sent, venter på neste runde", () => {
  const a = { startet: false, fro: "bbb", runde: 0 }, b = { startet: false, fro: "aaa", runde: 0, neste: 0 };
  assert.deepEqual(avtal(a, b), avtal(b, a));
  assert.deepEqual(avtal(a, { startet: true, fro: "zzz", runde: 3, neste: 4 }), { fro: "zzz", runde: 4 });
  assert.deepEqual(avtal({ startet: true, fro: "q", runde: 3 }, b), { fro: "q", runde: 3 });
});
