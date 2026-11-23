import { test } from "node:test";
import assert from "node:assert/strict";
import { VAKT, nyVakt, avvist, jevnhet, mistenkelig, registrer, slippInn } from "../src/lib/trykkvakt.js";

// Tilfeldige tall som er like hver gang testen kjøres.
const rngFra = (fro) => () => { fro = (fro * 16807) % 2147483647; return fro / 2147483647; };
const spillAv = (lag, antall = 400) => {
  let v = nyVakt(), tid = 0;
  for (let i = 0; i < antall; i++) { const x = lag(i); tid += x.pause; v = registrer(v, { tid, varighet: x.varighet, x: x.x ?? 100, y: x.y ?? 100 }); if (v.sperret) return i + 1; }
  return 0;
};

test("trykk fra skript og styrte nettlesere avvises med en gang", () => {
  assert.equal(avvist({ ekte: false, styrt: false }), true, "element.click() er ikke et ekte trykk");
  assert.equal(avvist({ ekte: undefined, styrt: false }), true);
  assert.equal(avvist({ ekte: true, styrt: true }), true, "navigator.webdriver");
  assert.equal(avvist({ ekte: true, styrt: false }), false);
});

test("en autoklikker med jevne pauser stoppes, også når trykkene varer som hos et menneske", () => {
  const rng = rngFra(1);
  assert.equal(spillAv(() => ({ pause: 100, varighet: 60 })), VAKT.vindu);
  assert.ok(spillAv(() => ({ pause: 100 + (rng() - 0.5) * 4, varighet: 60 })) > 0, "litt støy hjelper ikke");
});

test("en nettleserrobot med ujevne pauser stoppes når trykkene er uten varighet på samme punkt", () => {
  const rng = rngFra(2);
  assert.equal(spillAv(() => ({ pause: 200 + rng() * 600, varighet: 1 + rng() * 3 })), VAKT.vindu);
});

test("mennesker slipper gjennom: raske fingre, stille mus, styreflate og skjermleser", () => {
  const rng = rngFra(3);
  const menneske = () => 110 * (0.75 + rng() * 0.6);
  assert.equal(spillAv(() => ({ pause: menneske(), varighet: 40 + rng() * 80 })), 0, "stille mus, samme punkt");
  assert.equal(spillAv(() => ({ pause: menneske(), varighet: 2 + rng() * 4, x: 100 + Math.round(rng() * 3) })), 0, "styreflate med korte trykk som flytter seg litt");
  assert.equal(spillAv(() => ({ pause: menneske() * 4, varighet: null })), 0, "skjermleser uten varighet");
  assert.equal(spillAv(() => ({ pause: menneske() / 3, varighet: 20 + rng() * 30, x: Math.round(rng() * 80) })), 0, "flere fingre");
});

test("sperren står til sjekken er bestått, og så er det fritt en stund", () => {
  let v = { ...nyVakt(), sperret: true };
  assert.equal(registrer(v, { tid: 1, varighet: 50, x: 1, y: 1 }), v);
  v = slippInn();
  assert.equal(v.sperret, false);
  for (let i = 0; i < VAKT.fri; i++) v = registrer(v, { tid: i * 100, varighet: 0, x: 1, y: 1 });
  assert.equal(v.sperret, false, "fri etter bestått sjekk");
  for (let i = 0; i < VAKT.vindu; i++) v = registrer(v, { tid: i * 100, varighet: 0, x: 1, y: 1 });
  assert.equal(v.sperret, true, "men ikke for alltid");
});

test("kanttilfeller: få trykk, trykk over lang tid og like tidspunkter", () => {
  assert.equal(mistenkelig([]), false);
  assert.equal(jevnhet([1, 2]), Infinity);
  assert.equal(jevnhet([5, 5, 5, 5]), Infinity);
  const sakte = Array.from({ length: VAKT.vindu }, (_, i) => ({ tid: i * 5000, varighet: 1, x: 1, y: 1 }));
  assert.equal(mistenkelig(sakte), false, "ett trykk hvert femte sekund er ikke verdt å stoppe");
});
