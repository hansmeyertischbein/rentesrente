import { test } from "node:test";
import assert from "node:assert/strict";
import { SEDDEL, nesteOm, nySeddel, steg, treffer } from "../src/lib/seddel.js";
import { REGLER, MINISPILL, AKSJER, nyTilstand, perSekund, trykkverdi, prisAksje, tikk, borte, rabatt, fangSeddel, tilLagring, fraLagring, minispillPremie, klarteNiva, apentNiva } from "../src/lib/klikker.js";

const rngFra = (fro) => () => { fro = (fro * 16807) % 2147483647; return fro / 2147483647; };
const med = (e) => ({ ...nyTilstand(), ...e });
const eier = (a, e = {}) => med({ ...e, aksjer: { ...nyTilstand().aksjer, ...a } });

/** En spiller som jager seddelen med musen: ser den med 110 ms forsinkelse og kommer ikke fortere frem enn fart piksler i sekundet. */
function jakt(fro, { fart, grep }, rom = { b: 1280, h: 720 }) {
  const rng = rngFra(fro), dt = 1 / 60;
  let s = nySeddel(rom, rng), p = { x: rom.b / 2, y: rom.h / 2, vx: 0, vy: 0 }, inne = 0;
  const spor = [];
  for (let i = 0; i < 60 * 60 && s; i++) {
    spor.push([s.x, s.y]);
    const [mx, my] = spor[Math.max(0, spor.length - 7)];
    const dx = mx + (rng() - 0.5) * 26 - p.x, dy = my + (rng() - 0.5) * 26 - p.y, d = Math.hypot(dx, dy) || 1;
    const f = Math.min(fart, d * grep);
    p = { x: p.x + (dx / d) * f * dt, y: p.y + (dy / d) * f * dt, vx: (dx / d) * f, vy: (dy / d) * f };
    s = steg(s, p, rom, dt, rng);
    inne = s && treffer(s, p.x, p.y) ? inne + 1 : 0;
    if (inne >= 4) return true;   // musen må være på seddelen i 4 bilder før knappen rekker ned
  }
  return false;
}
const andel = (spiller, n = 300) => Array.from({ length: n }, (_, i) => jakt(i + 11, spiller)).filter(Boolean).length / n;

test("seddelen er vanskelig, men ikke umulig å fange", () => {
  const rolig = andel({ fart: 450, grep: 5 }), vanlig = andel({ fart: 900, grep: 8 }), rask = andel({ fart: 2000, grep: 13 });
  assert.ok(rolig < 0.05, `en rolig mus fanger ${rolig}`);
  assert.ok(vanlig < 0.2, `en vanlig mus fanger ${vanlig}`);
  assert.ok(rask > 0.15 && rask < 0.9, `et raskt sveip fanger ${rask}`);
});

test("vinden skyver seddelen bort og i samme retning som musen", () => {
  const rom = { b: 1000, h: 800 }, s = { farge: "lilla", x: 500, y: 400, vx: 0, vy: 0, tid: 0, kast: 9 };
  const hoyre = steg(s, { x: 420, y: 400, vx: 600, vy: 0 }, rom, 0.1), venstre = steg(s, { x: 580, y: 400, vx: -600, vy: 0 }, rom, 0.1);
  assert.ok(hoyre.x > 505);
  assert.ok(venstre.x < 495);
  const langt = steg(s, { x: 100, y: 100, vx: 600, vy: 0 }, rom, 0.1), uten = steg(s, null, rom, 0.1);
  assert.equal(langt.x, uten.x, "langt unna merkes ingenting");
  assert.ok(Math.hypot(hoyre.vx, hoyre.vy) <= SEDDEL.maks + 1e-9);
});

test("seddelen holder seg på skjermen, faller til slutt ut, og kommer en gang i ny og ne", () => {
  const rng = rngFra(5), rom = { b: 390, h: 800 };
  for (const beroring of [false, true]) {
    let s = nySeddel(rom, rng), n = 0;
    while (s && n < 60 * 90) { s = steg(s, null, rom, 1 / 60, rng, beroring); n++; if (s) assert.ok(s.x >= SEDDEL.bredde / 2 - 1e-6 && s.x <= rom.b - SEDDEL.bredde / 2 + 1e-6); }
    assert.equal(s, null, "den faller ut");
    assert.ok(n > 60 * 5, "men du får noen sekunder på deg");
  }
  assert.equal(nesteOm(true, () => 0), 50);
  assert.equal(nesteOm(false, () => 1), 240);
});

test("lilla lapp dobler all inntekt i 20 sekunder", () => {
  const t = eier({ limonade: 10 });
  const l = fangSeddel(t, "lilla");
  assert.equal(perSekund(l), 2 * perSekund(t));
  assert.equal(trykkverdi(l), 2 * trykkverdi(t));
  assert.equal(perSekund(tikk(l, 19)), 2 * perSekund(t));
  assert.equal(perSekund(tikk(l, 20)), perSekund(t));
  assert.equal(borte(l, 100).gevinst, 100 * perSekund(t), "den varer ikke mens du er borte");
  assert.equal(tilLagring(l, 1).lapp, undefined);
});

test("grønn lapp gir halv pris på ett selskap en stund", () => {
  const t = eier({ limonade: 1 }, { totalt: 1e5 });
  const l = fangSeddel(t, "gronn", () => 0);
  assert.equal(l.lapp.halv.mal, "limonade");
  assert.equal(rabatt(l, "limonade"), 0.5);
  assert.equal(prisAksje(l, "limonade"), Math.ceil(1000 * 1.15 * 0.5));
  assert.equal(rabatt(l, "blomst"), 0);
  assert.equal(rabatt(tikk(l, REGLER.lappHalvSek), "limonade"), 0);
  assert.ok(fangSeddel(nyTilstand(), "gronn", () => 0.999).lapp.halv.mal, "også helt i starten");
});

test("minispill: nivåene åpnes i rekkefølge, premien følger utbyttet, og gjentak gir en femdel", () => {
  const t = eier({ limonade: 10 });
  assert.equal(apentNiva(t, "grisetoget"), 1);
  assert.equal(klarteNiva(t, "grisetoget", 2), t, "nivå 2 er ikke åpnet");
  assert.equal(klarteNiva(t, "ukjent", 1), t);
  const en = klarteNiva(t, "grisetoget", 1);
  assert.equal(en.saldo, 100 * MINISPILL.sek[0]);
  assert.equal(apentNiva(en, "grisetoget"), 2);
  assert.equal(klarteNiva(en, "grisetoget", 1).saldo - en.saldo, 100 * MINISPILL.sek[0] * 0.2);
  assert.equal(minispillPremie(nyTilstand(), "regnskapet", 5), MINISPILL.minst[4], "fast beløp uten utbytte");
  assert.equal(minispillPremie(fangSeddel(t, "lilla"), "grisetoget", 1), minispillPremie(t, "grisetoget", 1), "lappen dobler ikke premien");
  assert.deepEqual(fraLagring(JSON.parse(JSON.stringify(tilLagring(en, 1)))).tilstand.minispill, { grisetoget: 1 });
  assert.deepEqual(fraLagring({ ...tilLagring(en, 1), minispill: { grisetoget: 99, tull: 2 } }).tilstand.minispill, {});
  for (let i = 1; i < MINISPILL.nivaer; i++) assert.ok(MINISPILL.sek[i] > MINISPILL.sek[i - 1]);
  assert.ok(AKSJER.length === 17);
});
