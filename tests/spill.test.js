import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { REGLER, lagSpill, nyTilstand, utsyn, grenser, fordel, spillAar, sluttverdi, skattVedSalg, ROBOTER, spillRobot, dagensFro, utfallStatistikk } from "../src/lib/spill.js";

const satser = JSON.parse(readFileSync(new URL("../src/_data/satser.json", import.meta.url), "utf8"));
const spill = (fro = 20261114) => lagSpill(fro, satser);
// Et spill der vi styrer markedet og regningene selv.
function fast({ marked = 0, regning = 0 } = {}) {
  const s = spill(1);
  s.marked = s.marked.map(() => marked);
  s.regninger = s.regninger.map(() => (regning ? { type: "liten", navn: "Test", fra: regning, til: regning, belop: regning } : null));
  s.tilbud = s.tilbud.map(() => null);
  return s;
}

test("samme frø gir samme spill, annet frø gir et annet", () => {
  assert.deepEqual(spill(42), spill(42));
  assert.notDeepEqual(spill(42).marked, spill(43).marked);
});

test("utfallene ligger nær forutsetningene i satser.json", () => {
  const s = utfallStatistikk();
  assert.equal(REGLER.utfall.length, 20);
  assert.equal(s.snitt, 6);
  assert.ok(Math.abs(s.geometrisk - satser.realavkastningAksjer.verdi) < 0.3, `geometrisk snitt ${s.geometrisk}`);
  assert.ok(Math.abs(s.standardavvik - satser.realavkastningAksjer.svingning) < 0.5, `standardavvik ${s.standardavvik}`);
});

test("hvert spill har tjue år, intet i år 1, tre tilbud og regninger innenfor spennet", () => {
  for (let fro = 1; fro <= 300; fro++) {
    const s = spill(fro);
    assert.equal(s.marked.length, 20);
    assert.equal(s.regninger[0], null);
    assert.equal(s.tilbud.filter(Boolean).length, 3);
    for (const g of s.regninger.filter(Boolean)) {
      assert.ok(g.belop >= g.fra && g.belop <= g.til && g.belop % 5000 === 0, JSON.stringify(g));
    }
    for (const p of s.marked) assert.ok(REGLER.utfall.includes(p));
  }
});

test("utsynet viser tre år og aldri beløpet på en regning", () => {
  const s = spill(7);
  const syn = utsyn(s, nyTilstand(s));
  assert.equal(syn.length, 3);
  for (const aar of syn) if (aar.regning) assert.equal("belop" in aar.regning, false);
  const sent = utsyn(s, { ...nyTilstand(s), aar: 19 });
  assert.equal(sent.length, 1);
});

test("madrassen: bare konto med rente, ingen skatt", () => {
  const s = fast();
  const { slutt } = spillRobot(s, ROBOTER[0]);
  let konto = 60000;
  for (let i = 0; i < 20; i++) konto = konto + Math.round(konto * s.kontorente) + (i < 19 ? 60000 : 0);
  assert.equal(slutt.sum, konto);
  assert.equal(slutt.skatt, 0);
  assert.equal(slutt.innsatt, 1200000);
});

test("fondet vokser med markedet, og gevinsten skattes til slutt", () => {
  const s = fast({ marked: 10 });
  let t = nyTilstand(s);
  t = spillAar(s, t, { flytt: 60000 }).tilstand;
  assert.equal(t.fond, 66000);
  assert.equal(t.kostpris, 60000);
  assert.equal(t.konto, 60000);
  const slutt = sluttverdi(s, t);
  assert.equal(slutt.skatt, Math.round(6000 * s.skattesats));
  assert.equal(slutt.sum, 60000 + 66000 - slutt.skatt);
});

test("salg: skatt på gevinstandelen, kostprisen følger med forholdsmessig", () => {
  const s = fast({ marked: 0 });
  const t = { ...nyTilstand(s), konto: 0, fond: 200000, kostpris: 100000 };
  assert.equal(skattVedSalg(s, t, 50000), Math.round(25000 * s.skattesats));
  const f = fordel(s, t, { flytt: -50000 });
  assert.equal(f.fond, 150000);
  assert.equal(f.kostpris, 75000);
  assert.equal(f.konto, 50000 - f.skatt);
  assert.equal(f.kontoTjent, 25000 - f.skatt);
});

test("salg med tap gir ingen skatt og intet fradrag", () => {
  const s = fast();
  const t = { ...nyTilstand(s), konto: 0, fond: 80000, kostpris: 100000 };
  const f = fordel(s, t, { flytt: -80000 });
  assert.equal(f.skatt, 0);
  assert.equal(f.konto, 80000);
  assert.equal(f.fond, 0);
  assert.equal(f.kostpris, 0);
});

test("flytting holdes innenfor grensene", () => {
  const s = fast();
  const t = { ...nyTilstand(s), konto: 30000, fond: 50000, kostpris: 50000 };
  assert.deepEqual(grenser(s, t), { maksKjop: 30000, maksSalg: 50000 });
  assert.equal(fordel(s, t, { flytt: 999999 }).kjop, 30000);
  assert.equal(fordel(s, t, { flytt: -999999 }).salg, 50000);
  assert.equal(fordel(s, t, { flytt: NaN }).flytt, 0);
  assert.equal(fordel(s, { ...t, konto: -5000 }, { flytt: 10000 }).kjop, 0);
});

test("regning uten dekning gir minus, og minus koster tjue prosent", () => {
  const s = fast({ regning: 100000 });
  let t = nyTilstand(s);
  const { tilstand, hendelse } = spillAar(s, t, { flytt: 60000 });
  assert.equal(hendelse.kontoForRente, -100000);
  assert.equal(hendelse.rente, -20000);
  assert.equal(tilstand.konto, -120000 + 60000);
  assert.equal(grenser(s, tilstand).maksKjop, 0);
});

test("kurs: prisen trekkes, tillegget kommer fra neste år og kan ikke kjøpes uten tilbud", () => {
  const s = fast();
  s.tilbud[0] = { navn: "Kurs", pris: 80000, tillegg: 12000 };
  let t = nyTilstand(s);
  assert.equal(grenser(s, t, true).maksKjop, 0);
  const a = spillAar(s, t, { kurs: true });
  assert.equal(a.hendelse.kontoForRente, -20000);
  assert.equal(a.tilstand.tillegg, 12000);
  assert.equal(a.tilstand.konto, -20000 - 4000 + 72000);
  assert.equal(a.tilstand.betalt, 80000);
  const b = spillAar(s, a.tilstand, { kurs: true });
  assert.equal(b.tilstand.tillegg, 12000);
  assert.equal(b.hendelse.kurs, false);
});

test("spillet varer i tjue år og står stille etterpå", () => {
  const s = spill(99);
  let t = nyTilstand(s);
  for (let i = 0; i < 20; i++) { assert.equal(t.ferdig, false); t = spillAar(s, t, {}).tilstand; }
  assert.equal(t.ferdig, true);
  assert.equal(t.logg.length, 20);
  assert.equal(spillAar(s, t, { flytt: 1 }).tilstand, t);
  const slutt = sluttverdi(s, t);
  assert.equal(slutt.sum, slutt.innsatt - slutt.betalt + slutt.tjent);
});

test("tilstanden endres aldri på stedet", () => {
  const s = spill(5);
  const t = Object.freeze({ ...nyTilstand(s), logg: Object.freeze([]) });
  assert.doesNotThrow(() => spillAar(s, t, { flytt: 30000 }));
});

test("robotene spiller ferdig på mange frø, og Planleggeren slår de to andre i snitt", () => {
  const sum = [0, 0, 0];
  const n = 400;
  for (let fro = 1; fro <= n; fro++) {
    const s = spill(fro * 7919);
    ROBOTER.forEach((r, i) => {
      const { slutt } = spillRobot(s, r);
      assert.ok(Number.isFinite(slutt.sum));
      sum[i] += slutt.sum / n;
    });
  }
  assert.ok(sum[2] > sum[1] && sum[1] > sum[0], sum.map(Math.round).join(" "));
});

test("dagens frø er datoen som tall", () => {
  assert.equal(dagensFro(new Date(2026, 10, 14)), 20261114);
});
