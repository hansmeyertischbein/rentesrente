// Utsikten i «Overfør»: hvilken etasje du bor i, hvor husene i byen står, og hvordan de havner på et panorama i 360 grader.
// Rene funksjoner uten nettleser. Lengder er i meter, kameraet står i (0, 0), og z er høyden over bakken.

import { AKSJER } from "./klikker.js";

export const BY = Object.freeze({
  oyeBakke: 4,        // øyehøyden i første etasje
  oyeEtasje: 4.6,     // så mye høyere for hver etasje
  rute: 34,           // avstand mellom kvartalene
  indre: 46,          // åpen plass rundt huset ditt
  ytre: 430,
  tomter: 408,        // 24 tomter til hvert av de 17 selskapene
});

/** Etasjen du bor i: en opp for hvert selskap du har kjøpt i for første gang. */
export function etasje(t) {
  return (t.forstekjop ?? []).length;
}

export function oyehoyde(etg) {
  return BY.oyeBakke + BY.oyeEtasje * etg;
}

/** Et tall fra 0 til 1 som alltid blir likt for samme tall inn. */
export function fast(a, b = 0, c = 0) {
  let h = Math.imul(a + 374761393, 668265263) ^ Math.imul(b + 1274126177, 2246822519) ^ Math.imul(c + 3266489917, 1103515245);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Alle kvartalene i byen, med litt slingring så gatene ikke blir helt rette.
const RUTER = (() => {
  const n = Math.ceil(BY.ytre / BY.rute), ut = [];
  for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
    const x = i * BY.rute + (fast(i, j, 1) - 0.5) * 6, y = j * BY.rute + (fast(i, j, 2) - 0.5) * 6;
    const d = Math.hypot(x, y);
    if (d < BY.indre || d > BY.ytre) continue;
    ut.push({ i, j, x, y, d });
  }
  return ut;
})();

// Tomtene til selskapene, spredt rundt hele byen: hver ny tomt ligger 137,5 grader videre og litt lenger ute.
// Hver runde på 17 tomter gir én til hvert selskap, så et hus aldri flytter seg når du kjøper mer.
export const TOMTER = (() => {
  const ledige = new Set(RUTER), ut = [];
  for (let k = 0; k < BY.tomter && ledige.size; k++) {
    const v = k * 2.399963, r = BY.indre + 8 + (BY.ytre - BY.indre - 40) * Math.sqrt(k / BY.tomter);
    const x = r * Math.cos(v), y = r * Math.sin(v);
    let best = null, bd = Infinity;
    for (const c of ledige) { const d = (c.x - x) ** 2 + (c.y - y) ** 2; if (d < bd) { bd = d; best = c; } }
    ledige.delete(best);
    ut.push(best);
  }
  return Object.freeze(ut);
})();

const PER_SELSKAP = Math.floor(TOMTER.length / AKSJER.length);

/**
 * Husene dine: ett for hver aksje til tomtene er brukt opp. Deretter vokser husene en etasje for hver runde,
 * så hver eneste aksje synes. Gir { id, x, y, d, bredde, hoyde, etasjer }.
 */
export function dineHus(aksjer) {
  const ut = [];
  AKSJER.forEach((a, s) => {
    const n = aksjer[a.id] ?? 0;
    for (let k = 0; k < Math.min(n, PER_SELSKAP); k++) {
      const c = TOMTER[k * AKSJER.length + ((s + 5 * k) % AKSJER.length)];   // forskjøvet, så husene kommer på alle kanter
      const etasjer = 2 + Math.min(14, Math.floor((n - 1 - k) / PER_SELSKAP));
      ut.push({ id: a.id, x: c.x, y: c.y, d: c.d, i: c.i, j: c.j, bredde: 17, etasjer, hoyde: 3.2 * etasjer });
    }
  });
  return ut;
}

/** Resten av byen: vanlige hus, lave nær deg og høyere lenger ute. Tomtene dine holdes av. */
export function vanligeHus(dine) {
  const opptatt = new Set(dine.map((h) => `${h.i},${h.j}`));
  const ut = [];
  for (const c of RUTER) {
    if (opptatt.has(`${c.i},${c.j}`)) continue;
    const r = fast(c.i, c.j, 3);
    if (r < 0.16) { ut.push({ ...c, park: true }); continue; }
    const naer = Math.min(1, Math.max(0, (c.d - 60) / 220));
    const etasjer = 2 + Math.floor(fast(c.i, c.j, 4) * (2 + 5 * naer)) + (fast(c.i, c.j, 5) > 0.95 && c.d > 170 ? 5 : 0);
    ut.push({ ...c, bredde: 16 + fast(c.i, c.j, 6) * 8, etasjer, hoyde: 3.2 * etasjer, farge: Math.floor(fast(c.i, c.j, 7) * 8), tak: fast(c.i, c.j, 8) > 0.45 });
  }
  return ut;
}

/** Hvor på panoramaet et punkt havner. P er bredden på hele runden i piksler. x regnes ut fra retningen mot, så hus ikke deles. */
export function projiser(x, y, z, kamera, mot = null) {
  let v = Math.atan2(y, x);
  if (mot !== null) { while (v - mot > Math.PI) v -= 2 * Math.PI; while (v - mot < -Math.PI) v += 2 * Math.PI; }
  const f = kamera.P / (2 * Math.PI);
  return [v * f, kamera.horisont - ((z - kamera.oye) / Math.max(1, Math.hypot(x, y))) * f];
}
