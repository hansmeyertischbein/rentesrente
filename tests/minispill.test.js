import { test } from "node:test";
import assert from "node:assert/strict";
import { MINISPILL, spillApent, minispillPremie, nyTilstand, perSekund, klarteNiva, bodFaktor, prestisje, AKSJER, BOOSTERE, tilLagring, fraLagring } from "../src/lib/klikker.js";
import { IKONER } from "../src/lib/klikker-guder.js";
import * as B from "../src/lib/mini-brett.js";
import * as V from "../src/lib/mini-vakt.js";
import * as L from "../src/lib/mini-bod.js";
import * as M from "../src/lib/mini-megler.js";

const rngFra = (f) => () => { f = (f * 16807) % 2147483647; return f / 2147483647; };

test("Grisetoget: mynter gir vogner, vegger og egne vogner stopper toget", () => {
  let s = { ...B.lagTog(1, rngFra(1)), mynt: [8, 7] };
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
  for (let niva = 1; niva <= 5; niva++) {
    const t = B.lagTog(niva, rngFra(niva + 3));
    assert.equal(t.steiner.length, B.TOG.steiner[niva - 1]);
    for (const [x, y] of t.steiner) { assert.ok(Math.abs(y - 7) > 1); assert.equal(t.steiner.filter(([a, b]) => Math.max(Math.abs(a - x), Math.abs(b - y)) <= 1).length, 1, "aldri inntil hverandre"); }
  }
  assert.equal(B.kjorTog({ ...sirkel, steiner: [[9, 5]], tog: [[8, 5], [7, 5]] }).krasj, true, "stein");
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
  for (const fro of [3, 7]) { const rng = rngFra(fro); let t = B.lagVeksle(rng), n = 0; while (B.kanSkyve(t) && n++ < 2000) { const for_ = t; for (const r of ["ned", "venstre", "hoyre", "opp"]) { t = B.skyv(t, r, rng); if (t !== for_) break; } } assert.ok(B.storstePenge(t) >= 4); }
  for (let i = 0; i < 5; i++) {   // trekkene må holde: hver ny penge er verdt 1,1 i snitt
    assert.ok(B.VEKSLE.trekk[i] * 1.1 > 2 ** B.VEKSLE.mal[i] * 1.18);
    assert.ok(B.VEKSLE.mal[i] < B.VEKSLE.stige.length); }
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

// En spiller med en fast plan: bygg der veien er lengst innen rekkevidde, og oppgrader i rekkefølge.
const PLAN = [["b", "mynt"], ["b", "mynt"], ["b", "frys"], ["o", 0, 2], ["b", "mynt"], ["o", 0, 0], ["o", 0, 0], ["b", "kanon"], ["o", 1, 0], ["o", 1, 0], ["o", 2, 0], ["o", 2, 2], ["o", 2, 2], ["o", 3, 0], ["o", 3, 0], ["b", "kanon"], ["o", 4, 2], ["o", 4, 2], ["o", 0, 0], ["o", 5, 0], ["o", 5, 0], ["b", "rente"], ["o", 6, 2], ["o", 6, 2], ["o", 0, 0]];
const vakt = (niva, plan) => {
  const s = V.lagVakt(niva), rng = rngFra(niva * 31 + 7), tarn = [], plasser = [];
  for (let x = 30; x < 620; x += 14) for (let y = 34; y < 400; y += 14) if (V.kanStaa(s, x, y)) { let n = 0; for (let d = 0; d < V.lengdeFor(niva, "regning"); d += 10) { const q = V.paaSti(niva, d); if (Math.hypot(q[0] - x, q[1] - y) < 100) n++; } plasser.push([n, x, y]); }
  plasser.sort((a, b) => b[0] - a[0]);
  for (let n = 0, i = 0; !s.ferdig && n < 90000; n++) {
    V.vaktSteg(s, 1 / 30, rng);
    for (; i < plan.length; i++) {
      const [hva, a, b] = plan[i];
      if (hva === "b") { if (s.penger < V.TARN[a].pris) break; for (const [, x, y] of plasser) { const t = V.byggTarn(s, a, x, y); if (t) { tarn.push(t); break; } } }
      else { const p = V.prisOpp(tarn[a], b); if (Number.isFinite(p) && p > s.penger) break; V.oppgrader(s, tarn[a].id, b); }
    }
  }
  return s;
};
test("Grisevakta: nivå 1 klares med en god plan, ingen nivåer uten, og bølgene kommer av seg selv", () => {
  assert.equal(vakt(1, PLAN).ferdig, "vunnet");
  for (let niva = 1; niva <= 5; niva++) {
    const s = vakt(niva, []);
    assert.equal(s.ferdig, "tapt");
    assert.ok(s.bolge >= 1, "bølgen kom uten at noen trykket");
    for (let n = 1; n <= V.VAKT_NIVA[niva - 1].bolger; n++) {
      assert.deepEqual(V.bolge(niva, n), V.bolge(niva, n));
      assert.ok(V.bolge(niva, n).every((k) => V.FIENDER[k.type] && k.antall >= 1 && k.mellom > 0));
    }
  }
  assert.equal(vakt(3, [["b", "mynt"], ["b", "mynt"], ["b", "mynt"], ["b", "mynt"]]).ferdig, "tapt", "noen få myntkastere holder ikke");
});
test("Grisevakta: tre veier per tårn, høyst én til 4 og én til 2", () => {
  const lov = new Set();
  const gaa = (n) => { const k = n.join(""); if (lov.has(k)) return; lov.add(k); for (let v = 0; v < 3; v++) if (V.kanOppgradere({ niva: n }, v)) { const m = [...n]; m[v]++; gaa(m); } };
  gaa([0, 0, 0]);
  for (const k of ["402", "420", "024", "204", "240", "042"]) assert.ok(lov.has(k), k);
  for (const k of lov) { const n = [...k].map(Number); assert.ok(n.filter((x) => x > 0).length <= 2 && n.filter((x) => x > 2).length <= 1, k); }
  assert.ok(!lov.has("430") && !lov.has("111") && !lov.has("330"));
  for (const type of Object.keys(V.TARN)) {
    assert.equal(V.TARN[type].veier.length, 3);
    for (const v of V.TARN[type].veier) { assert.equal(v.trinn.length, 4); v.trinn.forEach((t, i) => assert.ok(!i || t.pris > v.trinn[i - 1].pris)); }
  }
  assert.ok(V.egenskaper("mynt", [4, 2, 0]).skade > 8 * V.TARN.mynt.basis.skade);
});
test("Grisevakta: tårn selges for 25 prosent mindre enn du har brukt, og kan ikke stå på veien", () => {
  const s = V.lagVakt(1);
  s.penger = 1000;
  assert.equal(V.byggTarn(s, "mynt", 170, 90), null, "på veien");
  const t = V.byggTarn(s, "mynt", 254, 202);
  assert.equal(V.byggTarn(s, "mynt", 260, 205), null, "for tett");
  assert.ok(V.oppgrader(s, t.id, 0) && V.oppgrader(s, t.id, 0));
  const for_ = s.penger, brukt = 1000 - for_;
  assert.equal(brukt, 60 + 45 + 95);
  assert.equal(V.selg(s, t.id), Math.floor(brukt * 0.75));
  assert.equal(s.penger, for_ + 150);
  assert.equal(s.tarn.length, 0);
  assert.equal(V.selg(s, t.id), 0);
  assert.equal(V.byggTarn({ ...s, penger: 10 }, "mynt", 254, 202), null);
});
test("Grisevakta: fiendene har hver sin egenskap", () => {
  const med = (type, tarn, opp = []) => {
    const s = V.lagVakt(1);
    s.penger = 9999; s.bolge = 1; s.pause = 99;
    const t = tarn ? V.byggTarn(s, tarn, 254, 202) : null;
    if (t) for (const v of opp) V.oppgrader(s, t.id, v);
    s.fiender.push({ id: 900, type, liv: 500, maks: 500, d: 300, p: V.paaSti(1, 300, V.FIENDER[type].flyr), brems: 1, bremset: 0, stopp: 0, gift: 0, giftSek: 0, merke: 1, merket: 0, spurt: 0, ur: 0, tr: 0 });
    for (let i = 0; i < 60; i++) V.vaktSteg(s, 1 / 30, () => 0.9);
    return s;
  };
  const liv = (s) => s.fiender.find((f) => f.id === 900)?.liv ?? 0;
  assert.ok(liv(med("purring", "mynt")) > liv(med("regning", "mynt")), "panser");
  assert.ok(liv(med("purring", "mynt", [0, 0])) < liv(med("purring", "mynt", [0])) - 10, "tunge mynter bryter panser");
  assert.equal(liv(med("skjult", "mynt")), 500, "usynlig");
  assert.ok(liv(med("skjult", "mynt", [2])) < 500, "briller ser den");
  assert.equal(liv(med("luft", "kanon")), 500, "kanonen når ikke luftslottet");
  const langt = (s) => s.fiender.find((f) => f.id === 900).d;
  assert.ok(langt(med("regning", "frys")) < langt(med("regning", null)) - 10, "bremses");
  assert.ok(langt(med("svindler", "frys")) >= langt(med("svindler", null)), "svindleren bremses ikke");
  const laan = med("laan", null).fiender.find((f) => f.id === 900);
  assert.ok(laan.maks > 500, "renten løper");
  const abo = V.lagVakt(1);
  abo.bolge = 1; abo.pause = 99;
  abo.fiender.push({ id: 1, type: "abo", liv: 0, maks: 5, d: 200, p: [0, 0], brems: 1, bremset: 0, stopp: 0, gift: 0, giftSek: 0, merke: 1, merket: 0, spurt: 0, ur: 0, tr: 0 });
  V.vaktSteg(abo, 1 / 30);
  assert.deepEqual(abo.fiender.map((f) => f.type), ["gebyr", "gebyr", "gebyr"]);
});

const alleOpp = (o) => ({ penger: 0, opp: Object.fromEntries(Object.keys(L.BODKJOP).map((k) => [k, o])) });
const SOL = { id: "sol", navn: "Sol", grader: 28, kunder: 1 };
const dag = (fro, niva, bod, { akt = 0.3, tenk = 0.7 } = {}) => {
  const rng = rngFra(fro * 7919 + 13), dt = 0.02;
  let d = L.lagDag(niva, bod, L.greiPris(SOL, bod), SOL), vent = tenk, mal = null, til = 0;
  while (d.tid > 0) {
    d = L.dagSteg(d, dt, rng).tilstand;
    vent -= dt;
    if (d.maake && d.maake.igjen < 1.6) d = L.jagMaake(d);
    for (const k of d.ko) if (k.veps && rng() < 0.03) d = L.jagVeps(d, k.id);
    if (d.heller) { if (d.glass.fyll >= til) { d = L.hell(d, false); vent = akt; } continue; }
    if (vent > 0 || d.opptatt > 0) continue;
    const k = d.ko.find((x) => x.id === mal);
    if (!k) { if (!d.ko.length) continue; if (d.glass.press) d = L.tomGlass(d); mal = [...d.ko].sort((a, b) => a.igjen - b.igjen)[0].id; vent = tenk; continue; }
    const f = L.BOD.frukt.find((x) => (d.glass.frukt[x] ?? 0) < (k.ordre.frukt[x] ?? 0));
    vent = akt;
    if (f) d = L.press(d, f); else if (d.glass.is < k.ordre.is) d = L.leggIs(d); else if (k.ordre.pynt && d.glass.pynt !== k.ordre.pynt) d = L.pynt(d, k.ordre.pynt);
    else if (d.glass.fyll < 0.1) { til = k.ordre.strek + 0.06 * (rng() - 0.5); d = L.hell(d, true); } else { d = L.server(d, k.id).tilstand; mal = null; vent = akt * 1.4; }
  }
  return d;
};
test("Limonadeboden: nivå 1 kan klares uten oppgraderinger, nivå 5 krever dem", () => {
  const klart = (niva, o, spill) => Array.from({ length: 24 }, (_, i) => L.dagKlart(dag(i + 5, niva, alleOpp(o), spill))).filter(Boolean).length / 24;
  assert.ok(klart(1, 0) > 0.5);
  assert.ok(klart(1, 0, { akt: 0.7, tenk: 2 }) < 0.4, "en treg servitør klarer den ikke");
  assert.equal(klart(5, 1), 0);
  assert.ok(klart(5, 5) > 0.1);
});
test("Limonadeboden: glasset må stemme, det renner over, og været og prisen styrer køen", () => {
  let d = { ...L.lagDag(3, L.nyBod(), 20, SOL), ko: [{ id: 1, plass: 0, ordre: { frukt: { sitron: 2 }, is: 1, strek: 0.72, pynt: null }, igjen: 10, tid: 10, person: 0, veps: true }] };
  const fri = (x) => ({ ...x, opptatt: 0 });
  d = fri(L.press(fri(L.press(d, "sitron")), "sitron"));
  assert.equal(L.press(d, "mynte"), d, "mynte finnes ikke på nivå 3");
  d = fri(L.leggIs(d));
  assert.equal(L.server(d, 1).resultat, null, "tomt glass serveres ikke");
  const full = { ...d, glass: { ...d.glass, fyll: 0.72 } };
  const r = L.server(full, 1);
  assert.ok(r.resultat.perfekt && r.resultat.belop >= 20);
  assert.equal(r.tilstand.rekke, 1);
  assert.equal(L.server({ ...full, glass: { ...full.glass, frukt: { jordbaer: 2 } } }, 1).resultat.riktig, false);
  assert.ok(L.kvalitet({ ...full.glass, fyll: 0.5 }, d.ko[0].ordre) < L.kvalitet(full.glass, d.ko[0].ordre));
  let over = L.hell(d, true);
  for (let i = 0; i < 200; i++) over = L.dagSteg(over, 0.02, () => 0.5).tilstand;
  assert.ok(over.glass.solt && !over.heller);
  assert.ok(L.dagSteg(d, 1, () => 0.5).tilstand.ko[0].igjen < 8, "vepsen gjør kunden utålmodig");
  assert.equal(L.jagVeps(d, 1).ko[0].veps, false);
  const tyv = { ...d, salg: 100, sist: 40, maake: { igjen: 0.01, side: 1 } };
  assert.equal(L.dagSteg(tyv, 0.02, () => 0.5).tilstand.salg, 80);
  assert.equal(L.jagMaake(tyv).maake, null);
  assert.ok(L.kundestrom(15, SOL, L.nyBod()) > L.kundestrom(40, SOL, L.nyBod()));
  assert.ok(L.greiPris(SOL, L.nyBod()) > L.greiPris({ ...SOL, grader: 12 }, L.nyBod()));
  assert.ok(L.malFor(1, { grader: 12 }) < L.malFor(1, SOL));
  const kjopt = L.kjopBod({ ...L.nyBod(), penger: 150 }, "kanne");
  assert.deepEqual([kjopt.penger, kjopt.opp.kanne], [40, 1]);
  assert.equal(L.kjopBod(L.nyBod(), "kanne").opp.kanne, 0);
});

test("Limonadeboden gir mer utbytte fra bodene for hvert nivå, også etter prestisje", () => {
  const t = { ...nyTilstand(), forstekjop: ["onkel"], aksjer: { ...nyTilstand().aksjer, limonade: 10, blomst: 1 } };
  const e = klarteNiva(klarteNiva(t, "limonadeboden", 1), "limonadeboden", 2);
  assert.equal(bodFaktor(e), L.BOD.bodFaktor[2]);
  assert.equal(perSekund(e), 1.25 * 100 + 50, "bare bodene");
  assert.equal(bodFaktor(klarteNiva(e, "limonadeboden", 1)), 1.25, "gjentak gir ikke mer");
  const alt = { ...e, aksjer: Object.fromEntries(AKSJER.map((a) => [a.id, 1])), boostere: BOOSTERE.map((b) => b.id), radgiver: 6, ikoner: IKONER.filter((i) => !i.prestisje).map((i) => i.id), gren: "gresk", gud: 5, bod: { penger: 7, opp: { ...L.nyBod().opp, kanne: 2 } } };
  const p = prestisje(alt);
  assert.deepEqual([p.bodNiva, p.bod.opp.kanne, p.minispill], [2, 2, {}]);
  const lest = fraLagring(JSON.parse(JSON.stringify(tilLagring(alt, 1)))).tilstand;
  assert.deepEqual([lest.bodNiva, lest.bod], [2, alt.bod]);
  assert.deepEqual(fraLagring({ ...tilLagring(alt, 1), bod: { penger: -5, opp: { kanne: 99 } }, bodNiva: 50 }).tilstand.bod, L.nyBod());
  assert.deepEqual(L.lesBod({ penger: 3, opp: { kanne: 1 } }).opp, { ...L.nyBod().opp, kanne: 1 }, "eldre bod uten de nye oppgraderingene");
});

test("minispillene låses opp ett for ett, fra det første ølbryggeriet", () => {
  let t = nyTilstand();
  assert.equal(MINISPILL.spill.filter((s) => spillApent(t, s)).length, 0);
  t = { ...t, forstekjop: ["limonade", "blomst", "jordbaer"] };
  assert.equal(MINISPILL.spill.filter((s) => spillApent(t, s)).length, 0);
  t = { ...t, forstekjop: [...t.forstekjop, "onkel"] };
  assert.deepEqual(MINISPILL.spill.filter((s) => spillApent(t, s)), [MINISPILL.spill[0]]);
  const nr = MINISPILL.spill.map((s) => AKSJER.findIndex((a) => a.id === MINISPILL.apnes[s]));
  assert.ok(nr.every((n, i) => n >= 0 && (!i || n > nr[i - 1])), "i stigende rekkefølge");
  assert.equal(klarteNiva(t, "regnskapet", 1), t, "låst spill gir ingenting");
  assert.ok(spillApent({ ...t, minispill: { regnskapet: 1 } }, "regnskapet"), "det du har klart, forblir åpent");
  const alle = { ...t, forstekjop: AKSJER.map((a) => a.id) };
  for (let i = 1; i < MINISPILL.spill.length; i++) assert.ok(minispillPremie({ ...alle, aksjer: { ...alle.aksjer, onkel: 100 } }, MINISPILL.spill[i], 1) > minispillPremie({ ...alle, aksjer: { ...alle.aksjer, onkel: 100 } }, MINISPILL.spill[i - 1], 1));
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
  const r = Array.from({ length: 200 }, (_, i) => handel(i * 7919 + 3)).sort((a, b) => a - b);
  const andel = (mal) => r.filter((x) => x >= mal).length / r.length;
  assert.ok(andel(M.MEGLER.mal[0]) > 0.35 && andel(M.MEGLER.mal[0]) < 0.8, `nivå 1: ${andel(M.MEGLER.mal[0])}`);
  assert.ok(andel(M.MEGLER.mal[4]) > 0.03 && andel(M.MEGLER.mal[4]) < 0.35, "nivå 5 er mulig, men vanskelig");
  let m = M.lagMegler(1, rngFra(9));
  const k = M.kjopAktiva(m, 1);
  assert.equal(k.penger, 0);
  assert.ok(Math.abs(M.verdi(k) - 10000 * 0.995 ** 2) < 1e-6, "kurtasje inn og ut");
  assert.ok(m.nyheter.length === 4 && m.nyheter.every((n) => n.i > M.MEGLER.for && M.nyhetTekst(n).length > 10));
  assert.equal(M.kjopAktiva(k, 1), k);
  assert.equal(M.selgAktiva(m), m);
  assert.ok(m.kurser.flat().every((x) => x >= 1 && Number.isFinite(x)));
  assert.equal(MINISPILL.spill.length, 7);
});
