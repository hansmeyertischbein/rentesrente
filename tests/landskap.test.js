import { test } from "node:test";
import assert from "node:assert/strict";
import { AKSJER, nyTilstand, kjopAksje, tvangssalg, tilLagring, fraLagring } from "../src/lib/klikker.js";
import { LAND, STEDER, etasje, oyehoyde, figurer, plasser, storrelse, lagVerden, hoydeVed, terreng, tegnLand, tegnHimmel, tegnSkyer } from "../src/lib/landskap.js";

const rik = () => ({ ...nyTilstand(), saldo: 1e12, totalt: 1e12 });

test("etasjen øker med en ved første kjøp i et selskap, og bare da", () => {
  let t = rik();
  assert.equal(etasje(t), 0);
  t = kjopAksje(t, "limonade", 1);
  assert.equal(etasje(t), 1);
  t = kjopAksje(t, "limonade", 10);
  assert.equal(etasje(t), 1, "flere i samme selskap gir ingen ny etasje");
  t = kjopAksje(t, "blomst", 1);
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

test("de dårligste står lengst unna og er flest, de beste står nærmest og er størst", () => {
  const snitt = (s) => STEDER[s].reduce((x, p) => x + p.r, 0) / STEDER[s].length;
  for (let s = 1; s < AKSJER.length; s++) {
    assert.ok(snitt(s) < snitt(s - 1), AKSJER[s].id);
    assert.ok(storrelse(s) > storrelse(s - 1));
    assert.ok(STEDER[s].length <= STEDER[s - 1].length + 1);
  }
  assert.ok(STEDER[0].length > 2 * STEDER.at(-1).length);
  const retninger = new Set(STEDER[0].map((p) => Math.floor(((Math.atan2(p.z, p.x) + Math.PI) / (2 * Math.PI)) * 8) % 8));
  assert.ok(retninger.size >= 7, "spredt rundt hele utsikten");
});

test("hver aksje får en figur på land, den flytter seg aldri, og svært store tall går bra", () => {
  const en = figurer({ limonade: 5, blomst: 2 }), mer = figurer({ limonade: 6, blomst: 2, onkel: 4 });
  assert.equal(en.length, 7);
  for (const f of en) assert.ok(mer.some((m) => m.id === f.id && m.x === f.x && m.z === f.z));
  assert.equal(figurer({}).length, 0);
  const mange = figurer({ limonade: 1e6 });
  assert.equal(mange.length, STEDER[0].length);
  assert.ok(mange[0].hoyde > storrelse(0) && mange[0].hoyde < 2 * storrelse(0), "de vokser når plassene er brukt opp");
  const { H } = lagVerden();
  for (const liste of STEDER) for (const p of liste) assert.ok(H[(Math.floor(p.x + 0.5) + LAND.R) * 2 * LAND.R + Math.floor(p.z + 0.5) + LAND.R] >= 0, "ikke i vannet");
  assert.ok(figurer(Object.fromEntries(AKSJER.map((a) => [a.id, 3]))).every((f, i, a) => !i || a[i - 1].r >= f.r), "bakerst først");
});

test("landskapet har fjell, en innsjø og flat eng rundt deg, og er likt hver gang", () => {
  const { H } = lagVerden();
  let hoyest = 0, vann = 0;
  for (const h of H) { if (h > hoyest) hoyest = h; if (h < 0) vann++; }
  assert.ok(hoyest > 60, `fjell: ${hoyest}`);
  assert.ok(vann > 150 && vann < 1200, `liten innsjø: ${vann}`);
  assert.ok(Math.abs(hoydeVed(5, 5) - hoydeVed(-5, 5)) <= 2);
  assert.ok(hoydeVed(0, 0) + 4 < oyehoyde(0), "du ser ned på enga");
  assert.equal(terreng(12.5, 40.5), terreng(12.5, 40.5));
});

test("panoramaet: himmelen er åpen over fjellene, bakken er tett, og det nære er nærmere", () => {
  for (const natt of [false, true]) {
    const k = { P: 360, hoyde: 140, horisont: 60, oye: oyehoyde(8), natt };
    const { rgba, dybde } = tegnLand(k);
    const a = (x, y) => rgba[(y * k.P + x) * 4 + 3];
    for (let x = 0; x < k.P; x += 7) {
      assert.equal(a(x, k.hoyde - 1), 255);
      assert.ok(dybde[(k.hoyde - 1) * k.P + x] < dybde[80 * k.P + x]);
    }
    let apne = 0;
    for (let x = 0; x < k.P; x++) if (a(x, 0) === 0) apne++;
    assert.ok(apne > k.P * 0.6);
    const del = tegnLand(k, 100, 130);
    for (let y = 0; y < k.hoyde; y += 9) assert.equal(del.rgba[(y * 30 + 5) * 4 + 1], rgba[(y * k.P + 105) * 4 + 1], "deler blir som helheten");
    assert.equal(tegnHimmel(k).length, k.P * k.hoyde * 4);
    assert.ok(tegnSkyer(k).some((v, i) => i % 4 === 3 && v > 100));
  }
});

test("figurer havner i riktig retning, og de nære er størst", () => {
  const k = { P: 3600, horisont: 200, oye: 20 };
  const naer = plasser({ x: 20, z: 0, r: 20, hoyde: 4 }, k), fjern = plasser({ x: 0, z: 60, r: 60, hoyde: 4 }, k);
  assert.ok(naer.h > fjern.h && naer.y > fjern.y);
  assert.ok(Math.abs(fjern.x - 900) < 1e-6);
});
