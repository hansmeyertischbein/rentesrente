import { test } from "node:test";
import assert from "node:assert/strict";
import { MINISPILL, nyTilstand, perSekund, klarteNiva, bodFaktor, prestisje, AKSJER, BOOSTERE, tilLagring, fraLagring } from "../src/lib/klikker.js";
import { IKONER } from "../src/lib/klikker-guder.js";
import * as B from "../src/lib/mini-brett.js";
import * as V from "../src/lib/mini-vakt.js";
import * as L from "../src/lib/mini-bod.js";
import * as M from "../src/lib/mini-megler.js";

const rngFra = (f) => () => { f = (f * 16807) % 2147483647; return f / 2147483647; };

test("Grisetoget: mynter gir vogner, vegger og egne vogner stopper toget", () => {
  let s = { ...B.lagTog(rngFra(1)), mynt: [8, 7] };
  s = B.kjorTog(s, rngFra(2));
  assert.equal(s.tatt, 1);
  assert.equal(s.tog.length, 4);
  assert.equal(B.svingTog(s, "venstre"), s, "ikke rett bakover");
  s = B.svingTog(s, "opp");
  assert.equal(B.kjorTog(s).retning, "opp");
  for (let i = 0; i < 20; i++) s = B.kjorTog({ ...s, mynt: null });
  assert.equal(s.krasj, true);
  const sirkel = { tog: [[5, 5], [5, 6], [6, 6], [6, 5], [6, 4]], retning: "hoyre", ko: [], mynt: null, tatt: 0, krasj: false };
  assert.equal(B.kjorTog(sirkel).krasj, true);
});

test("Vekslebanken: like penger veksles, hver bare én gang per trekk, og ulovlige trekk gjør ingenting", () => {
  const s = { brett: [0, 0, 0, 0, ...Array(12).fill(null)], poeng: 0, sammen: [], ny: -1 };
  const e = B.skyv(s, "venstre", () => 0.5);
  assert.deepEqual(e.brett.slice(0, 2), [1, 1]);
  assert.equal(e.poeng, 10);
  assert.equal(e.brett.filter((v) => v !== null).length, 3, "to penger og en ny");
  const fast = { ...s, brett: [0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0] };
  assert.equal(B.kanSkyve(fast), false);
  assert.equal(B.skyv(fast, "opp"), fast);
  assert.equal(B.skyv(s, "tull"), s);
  for (const fro of [3, 7]) { const rng = rngFra(fro); let t = B.lagVeksle(rng), n = 0; while (B.kanSkyve(t) && n++ < 2000) { const for_ = t; for (const r of ["ned", "venstre", "hoyre", "opp"]) { t = B.skyv(t, r, rng); if (t !== for_) break; } } assert.ok(B.storstePenge(t) >= B.VEKSLE.mal[0], "nivå 1 nås selv med enkel strategi"); }
});

test("Krakkfeltet: første trykk er trygt, tallene stemmer, og feltet kan klares", () => {
  for (let niva = 1; niva <= 5; niva++) for (const forste of [0, 7, 20]) {
    let f = B.lagFelt(niva, forste, rngFra(niva * 31 + forste));
    assert.equal(f.krakk.filter(Boolean).length, B.KRAKK[niva - 1][1]);
    assert.equal(f.tall[forste], 0);
    f = B.avdekk(f, forste);
    assert.ok(f.vist.filter(Boolean).length >= 4);
    const krakk = f.krakk.indexOf(true);
    assert.equal(B.avdekk(f, krakk).tapt, krakk);
    assert.equal(B.avdekk(B.flagg(f, krakk), krakk).tapt, -1, "et flagg beskytter");
    f.krakk.forEach((k, i) => { if (!k) f = B.avdekk(f, i); });
    assert.ok(B.feltKlart(f));
  }
});

test("Regnskapet: hvert nivå har nøyaktig én løsning og omtrent riktig antall tomme ruter", () => {
  for (let niva = 1; niva <= 5; niva++) {
    const r = B.lagRegnskap(niva, rngFra(niva + 40));
    const tomme = r.start.filter((v) => !v).length;
    assert.ok(tomme >= B.REGNSKAP[niva - 1][1] * 0.75, `nivå ${niva}: ${tomme}`);
    assert.equal(B.losninger([...r.start], r.n), 1);
    assert.equal(B.regnskapKlart(r), false);
    assert.equal(B.regnskapKlart({ ...r, ruter: r.fasit }), true);
    for (let i = 0; i < r.n * r.n; i++) for (const j of B.venner(r.n, i)) assert.notEqual(r.fasit[i], r.fasit[j]);
  }
});

const vakt = (niva, plan) => {
  let s = V.lagVakt(niva), n = 0;
  while (!s.ferdig && n++ < 60000) {
    if (plan) {
      for (const p of V.brett(niva).plasser.keys()) s = V.byggTarn(s, plan[s.tarn.length % plan.length], p);
      if (s.tarn.length >= 5) for (const t of [...s.tarn].sort((a, b) => a.niva - b.niva)) s = V.oppgraderTarn(s, t.plass);
    }
    if (!s.ko.length && !s.fiender.length) s = V.nesteBolge(s);
    s = V.vaktSteg(s, 1 / 30).tilstand;
  }
  return s;
};
test("Grisevakta: alle nivåene kan klares, men ikke uten å gjøre noe, og rentetårnet vokser", () => {
  for (let niva = 1; niva <= 5; niva++) {
    assert.equal(vakt(niva, ["rente", "mynt", "frys"]).ferdig, "vunnet", `nivå ${niva}`);
    assert.equal(vakt(niva, null).ferdig, "tapt");
  }
  const t = { type: "rente", niva: 1, bolger: 0 };
  assert.ok(Math.abs(V.tarnSkade({ ...t, bolger: 3 }) / V.tarnSkade(t) - 1.2 ** 3) < 1e-9);
  const s = V.lagVakt(1);
  assert.equal(V.byggTarn(s, "mynt", 99), s);
  assert.equal(V.byggTarn({ ...s, penger: 10 }, "mynt", 0).tarn.length, 0);
  assert.equal(V.byggTarn(V.byggTarn(s, "mynt", 0), "mynt", 0).tarn.length, 1, "én per plass");
});

const dag = (fro, niva, bod, reaksjon) => {
  const rng = rngFra(fro);
  let d = L.lagDag(niva, bod), vent = reaksjon;
  while (d.tid > 0) {
    d = L.dagSteg(d, 0.05, rng).tilstand;
    if (d.ko.length && d.heller <= 0 && (vent -= 0.05) <= 0) { d = L.server(d, d.ko[0].smak).tilstand; vent = reaksjon; }
  }
  return d;
};
test("Limonadeboden: nivå 1 klares uten oppgraderinger, nivå 5 krever dem, og feil smak koster", () => {
  const med = (o) => ({ penger: 0, opp: { kanne: o, parasoll: o, skilt: o, oppskrift: o } });
  const klart = (niva, o, r) => Array.from({ length: 30 }, (_, i) => L.dagKlart(dag(i + 5, niva, med(o), r))).filter(Boolean).length / 30;
  assert.ok(klart(1, 0, 0.8) > 0.8);
  assert.ok(klart(5, 0, 0.55) < 0.1);
  assert.ok(klart(5, 3, 0.55) > 0.8);
  const d = { ...L.lagDag(1, L.nyBod()), ko: [{ id: 1, smak: "sitron", igjen: 8, person: 0 }] };
  assert.equal(L.server(d, "jordbaer").resultat.riktig, false);
  assert.ok(L.server(d, "sitron").resultat.belop >= 10);
  assert.equal(L.server({ ...d, heller: 1 }, "sitron").resultat, null);
  const kjopt = L.kjopBod({ ...L.nyBod(), penger: 100 }, "kanne");
  assert.deepEqual([kjopt.penger, kjopt.opp.kanne], [30, 1]);
  assert.equal(L.kjopBod(L.nyBod(), "kanne").opp.kanne, 0);
});

test("Limonadeboden gir dobbelt utbytte fra bodene for hvert nivå, også etter prestisje", () => {
  const t = { ...nyTilstand(), aksjer: { ...nyTilstand().aksjer, limonade: 10, blomst: 1 } };
  const e = klarteNiva(klarteNiva(t, "limonadeboden", 1), "limonadeboden", 2);
  assert.equal(bodFaktor(e), 4);
  assert.equal(perSekund(e), 4 * 100 + 50, "bare bodene");
  assert.equal(bodFaktor(klarteNiva(e, "limonadeboden", 1)), 4, "gjentak gir ikke mer");
  const alt = { ...e, aksjer: Object.fromEntries(AKSJER.map((a) => [a.id, 1])), boostere: BOOSTERE.map((b) => b.id), radgiver: 6, ikoner: IKONER.filter((i) => !i.prestisje).map((i) => i.id), gren: "gresk", gud: 5, bod: { penger: 7, opp: { kanne: 2, parasoll: 0, skilt: 0, oppskrift: 0 } } };
  const p = prestisje(alt);
  assert.deepEqual([p.bodNiva, p.bod.opp.kanne, p.minispill], [2, 2, {}]);
  const lest = fraLagring(JSON.parse(JSON.stringify(tilLagring(alt, 1)))).tilstand;
  assert.deepEqual([lest.bodNiva, lest.bod], [2, alt.bod]);
  assert.deepEqual(fraLagring({ ...tilLagring(alt, 1), bod: { penger: -5, opp: { kanne: 99 } }, bodNiva: 50 }).tilstand.bod, L.nyBod());
});

test("Meglerhuset: kjøp lavt og selg høyt tjener, og alle nivåene er innen rekkevidde", () => {
  const handel = (fro) => {
    let m = M.lagMegler(1, rngFra(fro));
    while (!M.meglerFerdig(m)) {
      m = M.meglerSteg(m);
      const j = m.i - 2;
      if (j < 24) continue;
      const z = m.kurser.map((k) => { const v = k.slice(Math.max(0, j - 60), j + 1), s = v.reduce((a, b) => a + b, 0) / v.length; return (k[j] - s) / (Math.sqrt(v.reduce((a, b) => a + (b - s) ** 2, 0) / v.length) || 1); });
      if (m.eier >= 0 && z[m.eier] > 0.8) m = M.selgAktiva(m);
      if (m.eier < 0) { const a = z.indexOf(Math.min(...z)); if (z[a] < -0.8) m = M.kjopAktiva(m, a); }
    }
    return M.verdi(m) / M.MEGLER.start - 1;
  };
  const r = Array.from({ length: 200 }, (_, i) => handel(i + 3)).sort((a, b) => a - b);
  assert.ok(r[40] > M.MEGLER.mal[0], "nivå 1 klares nesten alltid med en enkel regel");
  assert.ok(r.filter((x) => x > M.MEGLER.mal[4]).length > 10, "nivå 5 er mulig");
  let m = M.lagMegler(1, rngFra(9));
  const k = M.kjopAktiva(m, 1);
  assert.equal(k.penger, 0);
  assert.ok(Math.abs(M.verdi(k) - 10000) < 1e-6);
  assert.equal(M.kjopAktiva(k, 1), k);
  assert.equal(M.selgAktiva(m), m);
  assert.ok(m.kurser.flat().every((x) => x >= 1 && Number.isFinite(x)));
  assert.equal(MINISPILL.spill.length, 7);
});
