// Landskapet utenfor vinduet i «Overfør»: en modell i malt treverk, med eng, skog, en liten innsjø og fjell rundt.
// Toppene er malt, og kantene er kryssfinér. Bakken går i halve trinn, trærne er kjegler og kuler, og om natten er det nordlys.
// Rene funksjoner uten nettleser. Én enhet er én blokk, du står i (0, 0), og panoramaet går 360 grader rundt.
// Hver kolonne i panoramaet følger én stråle utover i verden, blokk for blokk, så alt får riktig perspektiv.

import { AKSJER } from "./klikker.js";

export const LAND = Object.freeze({
  R: 186,               // hvor langt verden strekker seg
  oyeGrunn: 9,          // øyehøyden før du har kjøpt noe
  oyeEtasje: 0.85,      // så mye høyere for hvert selskap
  ytterst: 64, innerst: 21,   // avstanden til de dårligste og de beste investeringene
  plasserYtterst: 42, plasserInnerst: 12,
  innsjo: Object.freeze({ x: -27, z: 25, a: 17, b: 9.5, vri: 0.5 }),
  sol: Object.freeze({ v: 0.62, h: 0.44 }),    // retning og høyde i radianer
});

/** Etasjen du står i: en opp for hvert selskap du har kjøpt i for første gang. */
export const etasje = (t) => (t.forstekjop ?? []).length;
export const oyehoyde = (etg) => LAND.oyeGrunn + LAND.oyeEtasje * etg;

/** Et tall fra 0 til 1 som alltid blir likt for samme tall inn. */
export function fast(a, b = 0, c = 0) {
  let h = Math.imul(a + 374761393, 668265263) ^ Math.imul(b + 1274126177, 2246822519) ^ Math.imul(c + 3266489917, 1103515245);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const glatt = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
function stoy(x, z, fro) {
  const i = Math.floor(x), j = Math.floor(z), u = x - i, v = z - j, s = u * u * (3 - 2 * u), t = v * v * (3 - 2 * v);
  const a = fast(i, j, fro), b = fast(i + 1, j, fro), c = fast(i, j + 1, fro), d = fast(i + 1, j + 1, fro);
  return a + (b - a) * s + (c - a) * t + (a - b - c + d) * s * t;
}
const lag = (x, z, fro, n = 4) => { let sum = 0, vekt = 0.5, tot = 0; for (let k = 0; k < n; k++) { sum += vekt * stoy(x, z, fro + k); tot += vekt; x *= 2.03; z *= 2.03; vekt *= 0.5; } return sum / tot; };
const rygg = (x, z, fro, n = 5) => { let sum = 0, vekt = 0.5, tot = 0; for (let k = 0; k < n; k++) { const r = 1 - Math.abs(2 * stoy(x, z, fro + k) - 1); sum += vekt * r * r; tot += vekt; x *= 2.07; z *= 2.07; vekt *= 0.5; } return sum / tot; };

/** Hvor langt ute i innsjøen et punkt er: under 1 er vann. */
function sjo(x, z) {
  const { x: sx, z: sz, a, b, vri } = LAND.innsjo, dx = x - sx, dz = z - sz, c = Math.cos(vri), s = Math.sin(vri);
  return Math.hypot((dx * c + dz * s) / a, (-dx * s + dz * c) / b) + (lag(x / 9, z / 9, 91, 3) - 0.5) * 0.55;
}
/** Høyden på bakken, før den deles i blokker. */
export function terreng(x, z) {
  const r = Math.hypot(x, z), v = Math.atan2(z, x);
  let h = 2.6 + (lag(x / 30, z / 30, 11) - 0.5) * 9 * glatt(4, 34, r);
  h = Math.max(1.1, h);
  // Fjellene: rygger med dype skar, lavere der sola står og i en dal bak innsjøen.
  const apen = (mot, bredde) => { let d = Math.abs(v - mot); if (d > Math.PI) d = 2 * Math.PI - d; return glatt(0, bredde, d); };
  const massiv = (0.5 + 0.5 * stoy(5 + 2.2 * Math.cos(v), 5 + 2.2 * Math.sin(v), 41)) * (0.2 + 0.8 * apen(LAND.sol.v, 0.85)) * (0.6 + 0.4 * apen(Math.atan2(LAND.innsjo.z, LAND.innsjo.x), 0.5));
  const fot = glatt(68, 132, r), topp = fot * (8 + 126 * massiv * rygg(x / 66, z / 66, 23) + 10 * lag(x / 13, z / 13, 57));
  h += topp;
  const e = sjo(x, z);
  if (e < 1.7) h = h + (Math.min(h, -2.2 + 3.4 * Math.max(0, e - 0.55)) - h) * glatt(1.7, 1.0, e);
  return h;
}

// Flatene: hva toppen er malt som
const ENG = 0, STRAND = 1, SKIFER = 2, SNO = 3, LYNG = 4, GULLENG = 5, STAMME = 6, KULE = 7, GRAN = 8, LYSSTAMME = 9, HOSTKULE = 10, VANN = 11, FINER = 12;
const FARGE = [[134, 176, 132], [236, 208, 176], [124, 140, 168], [250, 241, 238], [168, 148, 178], [206, 188, 124], [128, 88, 62], [226, 128, 78], [44, 104, 106], [236, 226, 212], [238, 186, 82], [42, 146, 158], [212, 174, 124]];
const FINERLAG = [[224, 190, 142], [190, 146, 98], [214, 172, 120], [172, 128, 84]];   // lagene i kryssfinéren
const TRE = new Set([KULE, GRAN, HOSTKULE]);
const N = 2 * LAND.R, ide = (x, z) => (x + LAND.R) * N + (z + LAND.R);

let verden = null;
/** Hele verden: høyden og typen i hver rute, trærne og skyggene. Lages én gang. */
export function lagVerden() {
  if (verden) return verden;
  const R = LAND.R, H = new Float32Array(N * N), T = new Uint8Array(N * N), spenn = new Map(), skygge = new Uint8Array(N * N), krone = new Map();
  for (let x = -R; x < R; x++) for (let z = -R; z < R; z++) {
    const h = terreng(x + 0.5, z + 0.5), k = ide(x, z), r = Math.hypot(x, z);
    H[k] = Math.floor(h * 2) / 2;
    const bratt = Math.abs(terreng(x + 1.5, z + 0.5) - terreng(x - 0.5, z + 0.5)) + Math.abs(terreng(x + 0.5, z + 1.5) - terreng(x + 0.5, z - 0.5));
    const uro = lag(x / 11, z / 11, 71, 3);
    let type = ENG;
    if (h < 1 || (h < 2 && sjo(x + 0.5, z + 0.5) < 1.45)) type = STRAND;
    else if (h > 50 + uro * 20) type = SNO;
    else if (r > 74 && (h > 24 + uro * 18 || bratt > 5)) type = SKIFER;
    else if (lag(x / 15, z / 15, 171, 3) > 0.655) type = LYNG;
    else if (lag(x / 19, z / 19, 181, 3) > 0.675) type = GULLENG;
    if (H[k] < 0) type = STRAND;
    T[k] = type;
  }
  const legg = (x, z, y0, y1, type) => { if (x < -R || z < -R || x >= R || z >= R || y1 <= y0) return; const k = ide(x, z); if (!spenn.has(k)) spenn.set(k, []); spenn.get(k).push([y0, y1, type]); if (TRE.has(type)) { const g = krone.get(k); krone.set(k, g ? [Math.min(g[0], y0), Math.max(g[1], y1)] : [y0, y1]); } };
  const halv = (v) => Math.round(v * 2) / 2;
  const tre = (x, z, gran, gul) => {
    const b = H[ide(x, z)];
    if (gran) {   // en kjegle på tre etasjer
      const hoy = 8 + fast(x, z, 5) * 6, br = 2.1 + fast(x, z, 15) * 1.1;
      legg(x, z, b, b + 2, STAMME);
      for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
        const d = Math.hypot(i, j);
        for (let e = 0; e < 3; e++) { const rad = br * (1 - e * 0.27), fot = 1.5 + e * hoy * 0.27, topp = fot + hoy * 0.46; if (d < rad + 0.2) legg(x + i, z + j, b + halv(fot + d * 0.12), b + halv(topp - (d / (rad + 0.2)) * hoy * 0.4), GRAN); }
      }
    } else {   // en kule på en pinne, som i et modellandskap
      const hoy = 3.2 + fast(x, z, 6) * 2, rad = 1.9 + fast(x, z, 16) * 1.1, my = b + hoy + rad * 0.7, type = gul ? HOSTKULE : KULE;
      legg(x, z, b, b + hoy, gul ? LYSSTAMME : STAMME);
      for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) { const d = Math.hypot(i, j); if (d < rad + 0.25) { const q = Math.sqrt(Math.max(0.1, (rad + 0.3) ** 2 - d * d)); legg(x + i, z + j, halv(my - q), halv(my + q), type); } }
    }
  };
  for (let x = -R + 4; x < R - 4; x++) for (let z = -R + 4; z < R - 4; z++) {
    const k = ide(x, z), r = Math.hypot(x, z);
    if ((T[k] !== ENG && T[k] !== LYNG && T[k] !== GULLENG) || r < 24) continue;
    const skog = lag(x / 20, z / 20, 131, 2), tett = r > 68 ? Math.max(0, skog - 0.3) * 0.07 : skog > 0.6 ? 0.011 : 0.0018;
    if (fast(x, z, 3) < tett) tre(x, z, r > 74 ? fast(x, z, 4) > 0.12 : skog > 0.5 && fast(x, z, 4) > 0.45, fast(x, z, 7) > 0.45);
  }
  // Skyggene: gå mot sola og se om noe er høyere enn strålen.
  const dx = Math.cos(LAND.sol.v), dz = Math.sin(LAND.sol.v), stig = Math.tan(LAND.sol.h);
  for (let x = -R; x < R; x++) for (let z = -R; z < R; z++) {
    const k = ide(x, z), h = Math.max(0, H[k]) + 0.02;
    for (let t = 1.2; t < 78; t += t < 14 ? 0.6 : 1.4) {
      const i = Math.floor(x + 0.5 + dx * t), j = Math.floor(z + 0.5 + dz * t);
      if (i < -R || j < -R || i >= R || j >= R) break;
      const y = h + t * stig, m = ide(i, j);
      if (H[m] > y) { skygge[k] = 1; break; }
      const g = t < 26 ? krone.get(m) : null;
      if (g && y > g[0] && y < g[1]) { skygge[k] = 1; break; }
    }
  }
  verden = { H, T, spenn, skygge };
  return verden;
}
export function hoydeVed(x, z) { const { H } = lagVerden(); return Math.max(0, H[ide(Math.floor(x + 0.5), Math.floor(z + 0.5))]); }

// ---------- Investeringene ----------

/** Plassene til hvert selskap: de dårligste lengst unna og flest, de beste nærmest. En plass flytter seg aldri. */
export const STEDER = Object.freeze(AKSJER.map((a, s) => {
  const del = s / (AKSJER.length - 1), r0 = LAND.ytterst + (LAND.innerst - LAND.ytterst) * del;
  const antall = Math.round(LAND.plasserYtterst + (LAND.plasserInnerst - LAND.plasserYtterst) * del), ut = [];
  for (let k = 0, n = 0; n < antall && k < antall * 9; k++) {
    const v = k * 2.399963 + s * 1.13, r = r0 + (fast(s, k, 61) - 0.5) * 5, x = r * Math.cos(v), z = r * Math.sin(v);
    if (sjo(x, z) < 1.32) continue;
    ut.push(Object.freeze({ x, z, r }));
    n++;
  }
  return Object.freeze(ut);
}));
/** Så høy er figuren i blokker. */
export const storrelse = (s) => 3.5 + (2.2 * s) / (AKSJER.length - 1);

/** Figurene i landskapet: én for hver aksje til plassene er brukt opp, deretter vokser de litt for hver runde. */
export function figurer(aksjer) {
  const ut = [];
  AKSJER.forEach((a, s) => {
    const n = Math.floor(aksjer[a.id] ?? 0), plasser = STEDER[s];
    for (let k = 0; k < Math.min(n, plasser.length); k++) {
      const runder = Math.min(8, Math.floor((n - 1 - k) / plasser.length));
      ut.push({ id: a.id, s, ...plasser[k], hoyde: storrelse(s) * (1 + 0.06 * runder) });
    }
  });
  return ut.sort((a, b) => b.r - a.r);
}

// ---------- Tegningen ----------

const LYS = {
  dag: { sol: [1.07, 1.0, 0.9], skygge: [0.66, 0.68, 0.84], dis: [226, 214, 214], disMaks: 0.5, himmel: [[84, 148, 190], [160, 204, 212], [252, 222, 190]], vann: [38, 138, 150] },
  natt: { sol: [0.46, 0.56, 0.78], skygge: [0.24, 0.31, 0.5], dis: [40, 62, 92], disMaks: 0.6, himmel: [[10, 16, 44], [22, 46, 82], [56, 84, 112]], vann: [12, 52, 78] },
};
function himmelfarge(L, h) {   // h er høyden over horisonten, fra 0 til 1
  const u = Math.max(0, Math.min(1, h)), [a, b, c] = L.himmel, k = u < 0.4 ? u / 0.4 : (u - 0.4) / 0.6, f = u < 0.4 ? c : b, t = u < 0.4 ? b : a;
  return [f[0] + (t[0] - f[0]) * k, f[1] + (t[1] - f[1]) * k, f[2] + (t[2] - f[2]) * k];
}
const solI = (kol, rad, P, f, horisont) => { let dx = kol - ((LAND.sol.v + 2 * Math.PI) % (2 * Math.PI)) * f; if (dx > P / 2) dx -= P; if (dx < -P / 2) dx += P; return [dx, rad - (horisont - f * Math.tan(LAND.sol.h * 0.82))]; };

/** Himmelen: en rund sol med ringer om dagen, og nymåne, stjerner og nordlys om natten. Gir RGBA. */
export function tegnHimmel({ P, hoyde, horisont, natt }) {
  const L = natt ? LYS.natt : LYS.dag, f = P / (2 * Math.PI), ut = new Uint8ClampedArray(P * hoyde * 4), S = Math.max(7, f * 0.058);
  for (let y = 0; y < hoyde; y++) {
    const e = (horisont - y) / f, c = himmelfarge(L, e / 0.85);
    for (let x = 0; x < P; x++) {
      const i = (y * P + x) * 4, [dx, dy] = solI(x, y, P, f, horisont), r0 = Math.hypot(dx, dy), d = r0 / f;
      let [r, g, b] = c;
      const legg = (kr, kg, kb, k) => { r += (kr - r) * k; g += (kg - g) * k; b += (kb - b) * k; };
      if (natt) {
        legg(190, 226, 255, 0.22 * Math.exp(-d * 8));
        const st = fast(x >> 1, y >> 1, 77);
        if (st > 0.9975 && y < horisont) legg(255, 248, 232, 0.35 + 0.65 * fast(x >> 1, y >> 1, 78));
        // Nordlyset: to bånd som bølger, med strenger oppover
        const v = x / f;
        for (let n = 0; n < 2; n++) {
          const vekt = Math.max(0, Math.cos((v - 3.7 - n * 0.5) / 1.35)) ** 1.5;
          if (vekt <= 0 || Math.abs(v - 3.7 - n * 0.5) > 2.1) continue;
          const bunn = 0.26 + 0.17 * n + 0.07 * Math.sin(v * 3.1 + n * 2) + 0.035 * Math.sin(v * 8.3 + n), opp = e - bunn;
          if (opp < -0.02) continue;
          const streng = 0.45 + 0.55 * stoy(v * 46, n * 9, 88), styrke = vekt * streng * (opp < 0 ? 1 + opp / 0.02 : Math.exp(-opp * 5.2)) * 0.8;
          const u = Math.min(1, opp / 0.32);
          legg(80 + 110 * u, 240 - 130 * u, 172 + 50 * u, styrke);
        }
        if (r0 < S && Math.hypot(dx - S * 0.42, dy + S * 0.18) > S * 0.86) legg(246, 242, 226, Math.min(1, S - r0));
      } else {
        legg(255, 226, 176, 0.7 * Math.exp(-d * 4));
        for (const [k, a2] of [[2.5, 0.16], [1.75, 0.26]]) if (r0 < S * k) legg(255, 240, 206, a2 * Math.min(1, S * k - r0));
        if (r0 < S) legg(255, 206, 132, Math.min(1, S - r0));
        if (r0 < S * 0.78) legg(255, 232, 178, Math.min(1, S * 0.78 - r0));
      }
      ut[i] = r; ut[i + 1] = g; ut[i + 2] = b; ut[i + 3] = 255;
    }
  }
  return ut;
}

/** Skyene: runde, med flat bunn, som skåret ut av tynt tre. Gir RGBA med gjennomsiktige hull. */
export function tegnSkyer({ P, hoyde, horisont, natt }) {
  const f = P / (2 * Math.PI), ut = new Uint8ClampedArray(P * hoyde * 4), lys = natt ? [86, 112, 150] : [255, 250, 242], mork = natt ? [58, 82, 120] : [238, 214, 208];
  for (let n = 0; n < 26; n++) {
    const e = 0.13 + 0.5 * fast(n, 1, 501), bunn = Math.round(horisont - f * e), mx = fast(n, 2, 501) * P, br = f * (0.1 + 0.14 * fast(n, 3, 501)) * (0.6 + e), k = 4 + Math.floor(fast(n, 4, 501) * 3), syn = (natt ? 0.5 : 0.9) * (0.65 + 0.35 * fast(n, 5, 501));
    const kuler = Array.from({ length: k }, (_, j) => { const u = k > 1 ? j / (k - 1) : 0.5; return [(u - 0.5) * 2 * br * 0.82, -br * 0.05, br * (0.14 + 0.2 * Math.sin(u * Math.PI) + 0.07 * fast(n, j, 502))]; });
    for (let y = Math.floor(bunn - br * 0.5); y <= bunn; y++) {
      if (y < 0 || y >= hoyde) continue;
      for (let x = Math.floor(-br * 1.2); x <= br * 1.2; x++) {
        let inne = -1;
        for (const [kx, ky, kr] of kuler) { const q = 1 - Math.hypot(x - kx, (y - bunn - ky) * 1.25) / kr; if (q > inne) inne = q; }
        if (inne < 0) continue;
        const i = (y * P + ((((Math.round(mx) + x) % P) + P) % P)) * 4, skygge = y > bunn - br * 0.075 || inne < 0.1, c = skygge ? mork : lys, a = Math.max(ut[i + 3] / 255, syn * Math.min(1, inne * 14));
        if (a * 255 < ut[i + 3]) continue;
        ut[i] = c[0]; ut[i + 1] = c[1]; ut[i + 2] = c[2]; ut[i + 3] = a * 255;
      }
    }
  }
  return ut;
}

/**
 * Selve landskapet. Gir { rgba, dybde }: himmelen er gjennomsiktig, og dybde er avstanden til det som synes i hvert punkt.
 * fra og til er kolonnene som skal tegnes, så arbeidet kan deles opp.
 */
export function tegnLand({ P, hoyde, horisont, oye, natt }, fra = 0, til = P) {
  const { H, T, spenn, skygge } = lagVerden(), R = LAND.R, f = P / (2 * Math.PI), L = natt ? LYS.natt : LYS.dag, bredde = til - fra;
  const rgba = new Uint8ClampedArray(bredde * hoyde * 4), dybde = new Float32Array(bredde * hoyde).fill(1e9);
  const solx = Math.cos(LAND.sol.v), solz = Math.sin(LAND.sol.v);
  const celler = { t0: new Float32Array(600), t1: new Float32Array(600), k: new Int32Array(600) };
  const fylt = new Uint8Array(hoyde);
  for (let kol = fra; kol < til; kol++) {
    const v = ((kol + 0.5) / P) * 2 * Math.PI, dx = Math.cos(v), dz = Math.sin(v);
    fylt.fill(0);
    let igjen = hoyde, n = 0, cx = 0, cz = 0, t = 0, akse = 0;
    const sx = dx > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1, ddx = Math.abs(1 / (dx || 1e-9)), ddz = Math.abs(1 / (dz || 1e-9));
    let tx = 0.5 * ddx, tz = 0.5 * ddz;   // du står midt i rute (0, 0)
    /** ett punkt: rad, avstand, flate, lys (0 er skygge), hvor på flaten, topp eller side, rute, og hvor langt ned på siden. */
    const farge = (rad, d, type, l, u, w, topp, k, ned) => {
      const px = f / d;
      let c = FARGE[type], m = 1;
      const aar = px > 4 ? (stoy(topp ? u * 2 + (k % 97) : u * 2 + (k % 97), (topp ? w : w * 2) * (px > 12 ? 11 : 6), 701) - 0.5) * 0.13 : 0;   // årene i treet
      if (TRE.has(type)) {   // trærne er dreide: ringer rundt, lyse øverst
        m = 1 + aar * 0.6 + (Math.floor(w * 2) % 2 ? 0.05 : -0.05) + (topp ? 0.06 : 0);
      } else if (topp) {
        const blokk = type === ENG ? k : type === LYNG || type === GULLENG ? k + 7 : 0;
        m = 1 + aar + (type === SNO ? 0 : (fast(blokk, 3, 19) - 0.5) * 0.07);
        if (type === ENG) { const t2 = stoy((k % N) / 21, Math.floor(k / N) / 21, 301); c = [c[0] + 26 * (t2 - 0.5), c[1] + 14 * (t2 - 0.5), c[2] - 30 * (t2 - 0.5)]; }
        if (px > 7) { const kant = px > 16 ? 0.07 : 0.11; if (u < kant || w < kant) m *= 1.075; else if (u > 1 - kant || w > 1 - kant) m *= 0.9; }   // faset kant
      } else if (type === STAMME || type === LYSSTAMME) m = 1 + aar * 1.5;
      else if (type === SKIFER || type === SNO) m = (Math.floor(w * 2) % 2 ? 1.045 : 0.955) + aar * 0.5;   // lag på lag, som et høydekart
      else if (type !== VANN) {
        if (px < 6) { const g = FARGE[FINER]; c = [c[0] * 0.5 + g[0] * 0.5, c[1] * 0.5 + g[1] * 0.5, c[2] * 0.5 + g[2] * 0.5]; }
        else if (ned > 0.14) { const q = ((Math.floor(w * 6) % 4) + 4) % 4; c = FINERLAG[q]; m = 1 + aar * 0.7; if (w * 6 - Math.floor(w * 6) < 0.16 && px > 14) m *= 0.8; }
        else m = 1.05 + aar;
      }
      const s = l === 0 ? L.skygge : L.sol, styrke = l === 0 ? 1 : l;
      const dis = Math.min(L.disMaks, Math.max(0, (d - 58) / 190)), q = (kol - fra + rad * bredde) * 4;
      rgba[q] = c[0] * m * s[0] * styrke * (1 - dis) + L.dis[0] * dis;
      rgba[q + 1] = c[1] * m * s[1] * styrke * (1 - dis) + L.dis[1] * dis;
      rgba[q + 2] = c[2] * m * s[2] * styrke * (1 - dis) + L.dis[2] * dis;
      rgba[q + 3] = 255;
      dybde[q >> 2] = d;
      fylt[rad] = 1; igjen--;
    };
    const maks = R - 2;
    while (igjen > 0 && t < maks && n < 600) {
      const t0 = t, ax = akse;
      const iX = tx < tz;
      if (iX) { t = tx; tx += ddx; } else { t = tz; tz += ddz; }
      const t1 = t, k = ide(cx, cz), h = H[k], under = h < 0, flate = under ? -0.14 : h;
      celler.t0[n] = t0; celler.t1[n] = t1; celler.k[n] = k; n++;
      // Lyset på sidene: mot sola er lysest.
      const mot = ax === 0 ? -sx * solx : -sz * solz, side = t0 === 0 ? 0.8 : mot > 0 ? 0.74 + 0.22 * mot : 0.6 + 0.1 * (ax === 0 ? 0 : 1);
      const skygget = skygge[k] === 1;
      if (t0 > 0) {   // siden
        const y0 = Math.max(0, Math.ceil(horisont - (f * (flate - oye)) / t0)), hit = ax === 0 ? t0 * dz + 0.5 : t0 * dx + 0.5, u = hit - Math.floor(hit);
        for (let y = y0; y < hoyde; y++) {
          if (fylt[y]) continue;
          const w = oye + ((horisont - y) * t0) / f;
          if (w < flate - 40) break;
          farge(y, t0, under ? VANN : T[k], skygget ? 0 : side, u, w, false, k, flate - w);
        }
      }
      if (flate < oye && t1 > 0) {   // toppen
        const a = Math.max(0, Math.ceil(horisont - (f * (flate - oye)) / t1)), b = Math.min(hoyde - 1, t0 > 0 ? Math.floor(horisont - (f * (flate - oye)) / t0) : hoyde - 1);
        for (let y = a; y <= b; y++) {
          if (fylt[y]) continue;
          const d = ((oye - flate) * f) / (y - horisont + 1e-6), hx = d * dx + 0.5, hz = d * dz + 0.5, u = hx - Math.floor(hx), w = hz - Math.floor(hz);
          if (under) { vannpunkt(y, d, hx, hz, k); continue; }
          let l = skygget ? 0 : 1;
          if (d < 90) {   // mykt mørkere i kroken mot høyere blokker
            let ao = 1;
            if (u < 0.35 && H[k - N] > h) ao *= 0.74 + 0.74 * u; if (u > 0.65 && H[k + N] > h) ao *= 0.74 + 0.74 * (1 - u);
            if (w < 0.35 && H[k - 1] > h) ao *= 0.74 + 0.74 * w; if (w > 0.65 && H[k + 1] > h) ao *= 0.74 + 0.74 * (1 - w);
            if (l) l *= ao;
          }
          farge(y, d, T[k], l, u, w, true, k, 0);
        }
      }
      const sp = spenn.get(k);
      if (sp) for (const [b, tp, type] of sp) {
        const lov = TRE.has(type);
        if (t0 > 0) {
          const ya = Math.max(0, Math.ceil(horisont - (f * (tp - oye)) / t0)), yb = Math.min(hoyde - 1, Math.floor(horisont - (f * (b - oye)) / t0)), hit = ax === 0 ? t0 * dz + 0.5 : t0 * dx + 0.5, u = hit - Math.floor(hit);
          for (let y = ya; y <= yb; y++) if (!fylt[y]) { const w = oye + ((horisont - y) * t0) / f; farge(y, t0, type, side * (lov ? 0.94 : 0.9), u, w, false, k + Math.floor(w) * 7, 0); }
        }
        if (tp < oye) {
          const ya = Math.max(0, Math.ceil(horisont - (f * (tp - oye)) / t1)), yb = Math.min(hoyde - 1, t0 > 0 ? Math.floor(horisont - (f * (tp - oye)) / t0) : hoyde - 1);
          for (let y = ya; y <= yb; y++) if (!fylt[y]) { const d = ((oye - tp) * f) / (y - horisont + 1e-6), hx = d * dx + 0.5, hz = d * dz + 0.5; farge(y, d, type, 1, hx - Math.floor(hx), hz - Math.floor(hz), true, k, 0); }
        } else if (b > oye) {
          const ya = Math.max(0, Math.ceil(horisont - (f * (b - oye)) / t0)), yb = Math.min(hoyde - 1, Math.floor(horisont - (f * (b - oye)) / t1));
          for (let y = ya; y <= yb; y++) if (!fylt[y]) { const d = ((b - oye) * f) / (horisont - y + 1e-6), hx = d * dx + 0.5, hz = d * dz + 0.5; farge(y, d, type, 0.5, hx - Math.floor(hx), hz - Math.floor(hz), true, k, 0); }
        }
      }
      if (iX) { cx += sx; akse = 0; } else { cz += sz; akse = 1; }
      if (cx < -R + 1 || cz < -R + 1 || cx >= R - 1 || cz >= R - 1) break;
    }
    // Vannet speiler fjellene og himmelen: strålen går opp igjen i samme retning.
    function vannpunkt(y, d, hx, hz, k) {
      const b0 = Math.sin((hx * 0.5 + hz) * 2.3 + 5 * stoy(hx / 4, hz / 4, 611)), bolge = b0 * 0.018, s = Math.max(0.015, (oye / d) * (1 + bolge * 2) + bolge * 0.35);
      const q = (kol - fra + y * bredde) * 4, ref = speil(d, s), frem = Math.max(0.24, Math.min(0.76, 0.9 - s * 1.15));
      const glimt = b0 > 0.93 ? 22 : 0, sk = skygge[k] ? 0.82 : 1, v0 = L.vann;
      for (let i = 0; i < 3; i++) rgba[q + i] = (v0[i] * (1 - frem) + ref[i] * frem + glimt) * sk;
      rgba[q + 3] = 255; dybde[q >> 2] = d; fylt[y] = 1; igjen--;
    }
    function speil(d, s) {
      let x = cx, z = cz, tt = d, ax2 = akse, txx = tx, tzz = tz;
      for (let m = 0; m < 300; m++) {
        if (txx < tzz) { tt = txx; txx += ddx; x += sx; ax2 = 0; } else { tt = tzz; tzz += ddz; z += sz; ax2 = 1; }
        if (x < -R + 1 || z < -R + 1 || x >= R - 1 || z >= R - 1) break;
        const k = ide(x, z), hy = (tt - d) * s;
        const sp = tt < 110 ? spenn.get(k) : null;
        let type = -1;
        if (H[k] > hy) type = T[k];
        else if (sp) for (const [b, tp, ty] of sp) if (hy >= b && hy < tp) type = ty;
        if (type < 0) continue;
        const c = FARGE[type], mot = ax2 === 0 ? -sx * solx : -sz * solz, l = skygge[k] ? L.skygge : L.sol, g = skygge[k] ? 1 : mot > 0 ? 0.8 : 0.66, dis = Math.min(L.disMaks, Math.max(0, (tt - 58) / 190));
        return [0, 1, 2].map((i) => c[i] * l[i] * g * (1 - dis) + L.dis[i] * dis);
      }
      return himmelfarge(L, s / 0.85);
    }
  }
  return { rgba, dybde };
}

/** Hvor en figur havner på panoramaet: midten, foten og høyden i punkter. */
export function plasser(fig, { P, horisont, oye }) {
  const f = P / (2 * Math.PI), v = (Math.atan2(fig.z, fig.x) + 2 * Math.PI) % (2 * Math.PI);
  return { x: v * f, y: horisont - (f * (hoydeVed(fig.x, fig.z) - oye)) / fig.r, h: (f * fig.hoyde) / fig.r };
}
