import { test } from "node:test";
import assert from "node:assert/strict";
import { AKSJER, nyTilstand, kjopAksje, tvangssalg, tilLagring, fraLagring, prestisje } from "../src/lib/klikker.js";
import { BY, TOMTER, etasje, oyehoyde, dineHus, vanligeHus, projiser } from "../src/lib/byutsikt.js";

const rik = () => ({ ...nyTilstand(), saldo: 1e12, totalt: 1e12 });

test("etasjen øker med en ved første kjøp i et selskap, og bare da", () => {
  let t = rik();
  assert.equal(etasje(t), 0);
  t = kjopAksje(t, "limonade", 1);
  assert.equal(etasje(t), 1);
  t = kjopAksje(t, "limonade", 10);
  assert.equal(etasje(t), 1, "flere i samme selskap gir ingen ny etasje");
  t = kjopAksje(t, "blomst", 1);
  assert.equal(etasje(t), 2);
  assert.deepEqual(t.forstekjop, ["limonade", "blomst"]);
  assert.ok(oyehoyde(2) > oyehoyde(1));
  assert.equal(etasje(kjopAksje(nyTilstand(), "limonade", 1)), 0, "uten råd skjer ingenting");
});

test("du beholder etasjen ved tvangssalg, og den huskes", () => {
  let t = kjopAksje(kjopAksje(rik(), "limonade", 1), "blomst", 1);
  t = tvangssalg({ ...t, saldo: -1e9 });
  assert.equal(t.aksjer.blomst, 0);
  assert.equal(etasje(t), 2);
  assert.deepEqual(fraLagring(JSON.parse(JSON.stringify(tilLagring(t, 1)))).tilstand.forstekjop, ["limonade", "blomst"]);
  const { forstekjop, ...gammel } = tilLagring({ ...nyTilstand(), aksjer: { ...nyTilstand().aksjer, blomst: 3, onkel: 1 } }, 1);
  assert.deepEqual(fraLagring(gammel).tilstand.forstekjop, ["blomst", "onkel"], "eldre lagring");
  assert.deepEqual(fraLagring({ ...gammel, forstekjop: ["tull", "onkel", "onkel"] }).tilstand.forstekjop, ["onkel", "blomst"]);
});

test("hver aksje får et hus, spredt rundt hele byen, og husene flytter seg aldri", () => {
  assert.equal(TOMTER.length, BY.tomter);
  assert.equal(new Set(TOMTER.map((c) => `${c.i},${c.j}`)).size, BY.tomter, "ingen tomt brukes to ganger");
  const en = dineHus({ limonade: 5, blomst: 2 });
  assert.equal(en.length, 7);
  const mer = dineHus({ limonade: 6, blomst: 2, onkel: 4 });
  for (const h of en) assert.ok(mer.some((m) => m.id === h.id && m.x === h.x && m.y === h.y));
  const retninger = new Set(dineHus({ limonade: 24 }).map((h) => Math.floor(((Math.atan2(h.y, h.x) + Math.PI) / (2 * Math.PI)) * 8) % 8));
  assert.ok(retninger.size >= 7, "nesten alle retninger har et hus");
  const alle = Object.fromEntries(AKSJER.map((a) => [a.id, 1]));
  assert.equal(new Set(dineHus(alle).map((h) => h.id)).size, AKSJER.length);
});

test("når tomtene er brukt opp, vokser husene i stedet, og svært store tall går bra", () => {
  const lav = dineHus({ limonade: 24 }), hoy = dineHus({ limonade: 48 });
  assert.equal(lav.length, 24);
  assert.equal(hoy.length, 24);
  assert.ok(hoy.every((h, i) => h.etasjer === lav[i].etasjer + 1));
  assert.equal(dineHus({ limonade: 1e5 }).length, 24);
  assert.equal(dineHus({}).length, 0);
});

test("resten av byen bygges ikke på tomtene dine, og er lik hver gang", () => {
  const dine = dineHus({ limonade: 24, onkel: 10 });
  const opptatt = new Set(dine.map((h) => `${h.i},${h.j}`));
  const andre = vanligeHus(dine);
  assert.ok(andre.length > 200);
  assert.ok(andre.every((h) => !opptatt.has(`${h.i},${h.j}`)));
  assert.deepEqual(andre, vanligeHus(dine));
});

test("panoramaet: horisonten er i øyehøyde, retninger går rundt, og hus over skjøten deles ikke", () => {
  const k = { P: 3600, horisont: 200, oye: 20 };
  assert.equal(projiser(100, 0, 20, k)[1], 200);
  assert.ok(projiser(100, 0, 0, k)[1] > 200, "bakken er under horisonten");
  assert.ok(projiser(100, 0, 0, { ...k, oye: 80 })[1] > projiser(100, 0, 0, k)[1], "høyere opp ser du mer ned på byen");
  assert.ok(Math.abs(projiser(0, 100, 0, k)[0] - 900) < 1e-6);
  const [a] = projiser(-100, 5, 0, k, Math.PI), [b] = projiser(-100, -5, 0, k, Math.PI);
  assert.ok(Math.abs(a - b) < 100);
});
