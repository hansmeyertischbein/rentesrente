// Landskapet utenfor vinduet i «Overfør»: en blokkverden med eng, skog, en liten innsjø og fjell rundt.
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

// Blokktyper
const GRESS = 0, SAND = 1, STEIN = 2, SNO = 3, GRUS = 4, JORD = 5, STAMME = 6, LOV = 7, GRAN = 8, BJORK = 9, BJORKLOV = 10, VANN = 11;
const DAG = [[104, 156, 62], [222, 206, 150], [138, 140, 146], [240, 246, 252], [134, 126, 120], [134, 96, 64], [102, 76, 46], [74, 138, 48], [52, 96, 62], [222, 220, 210], [128, 172, 72], [64, 132, 190]];
const BLOMST = [[244, 244, 240], [232, 92, 92], [160, 120, 230], [248, 200, 70]];
const GRESSKANT = [112, 138, 66];   // siden av en gressblokk langt unna
const N = 2 * LAND.R, ide = (x, z) => (x + LAND.R) * N + (z + LAND.R);

let verden = null;
/** Hele verden: høyden og typen i hver rute, trærne og skyggene. Lages én gang. */
export function lagVerden() {
  if (verden) return verden;
  const R = LAND.R, H = new Int16Array(N * N), T = new Uint8Array(N * N), spenn = new Map(), skygge = new Uint8Array(N * N), krone = new Map();
  for (let x = -R; x < R; x++) for (let z = -R; z < R; z++) {
    const h = terreng(x + 0.5, z + 0.5), k = ide(x, z), r = Math.hypot(x, z);
    H[k] = Math.floor(h);
    const bratt = Math.abs(terreng(x + 1.5, z + 0.5) - terreng(x - 0.5, z + 0.5)) + Math.abs(terreng(x + 0.5, z + 1.5) - terreng(x + 0.5, z - 0.5));
    const uro = lag(x / 11, z / 11, 71, 3);
    let type = GRESS;
    if (h < 1 || (h < 2 && sjo(x + 0.5, z + 0.5) < 1.45)) type = SAND;
    else if (h > 50 + uro * 20) type = SNO;
    else if (r > 74 && (h > 24 + uro * 18 || bratt > 5)) type = uro > 0.66 ? GRUS : STEIN;
    if (H[k] < 0) type = uro > 0.5 ? SAND : GRUS;
    T[k] = type;
  }
  const legg = (x, z, y0, y1, type) => { if (x < -R || z < -R || x >= R || z >= R) return; const k = ide(x, z); if (!spenn.has(k)) spenn.set(k, []); spenn.get(k).push([y0, y1, type]); if (type !== STAMME && type !== BJORK) { const g = krone.get(k); krone.set(k, g ? [Math.min(g[0], y0), Math.max(g[1], y1)] : [y0, y1]); } };
  const tre = (x, z, gran, bjork) => {
    const b = H[ide(x, z)];
    if (gran) {
      const hoy = 7 + Math.floor(fast(x, z, 5) * 5);
      legg(x, z, b, b + hoy - 1, STAMME);
      for (let y = 2, brei = 2; y < hoy + 1; y++) {
        brei = y >= hoy - 1 ? 0 : (hoy - y) % 3 === 0 ? Math.max(1, Math.round((hoy - y) / 4)) : Math.min(3, Math.round((hoy - y) / 3));
        for (let i = -brei; i <= brei; i++) for (let j = -brei; j <= brei; j++) if (Math.abs(i) + Math.abs(j) <= brei + (brei > 1 ? 1 : 0)) legg(x + i, z + j, b + y, b + y + 1, GRAN);
      }
    } else {
      const hoy = 4 + Math.floor(fast(x, z, 6) * 3), lov = bjork ? BJORKLOV : LOV;
      legg(x, z, b, b + hoy, bjork ? BJORK : STAMME);
      for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) if (Math.abs(i) + Math.abs(j) < 4 || fast(x + i, z + j, 8) > 0.6) legg(x + i, z + j, b + hoy - 2, b + hoy, lov);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) if (Math.abs(i) + Math.abs(j) < 2 || fast(x + i, z + j, 9) > 0.55) legg(x + i, z + j, b + hoy, b + hoy + (Math.abs(i) + Math.abs(j) < 2 ? 2 : 1), lov);
    }
  };
  for (let x = -R + 4; x < R - 4; x++) for (let z = -R + 4; z < R - 4; z++) {
    const k = ide(x, z), r = Math.hypot(x, z);
    if (T[k] !== GRESS || r < 24) continue;
    const skog = lag(x / 20, z / 20, 131, 2), tett = r > 68 ? Math.max(0, skog - 0.3) * 0.085 : skog > 0.6 ? 0.012 : 0.0016;
    if (fast(x, z, 3) < tett) tre(x, z, r > 74 || (skog > 0.5 && fast(x, z, 4) > 0.4), fast(x, z, 7) > 0.6);
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
  dag: { sol: [1.08, 1.02, 0.9], skygge: [0.58, 0.66, 0.8], dis: [196, 218, 232], disMaks: 0.5, himmel: [[58, 128, 214], [132, 190, 236], [232, 238, 226]], vann: [44, 112, 176] },
  natt: { sol: [0.44, 0.5, 0.7], skygge: [0.2, 0.25, 0.42], dis: [44, 54, 92], disMaks: 0.62, himmel: [[8, 13, 34], [24, 34, 74], [66, 66, 108]], vann: [16, 32, 72] },
};
function himmelfarge(L, h) {   // h er høyden over horisonten, fra 0 til 1
  const u = Math.max(0, Math.min(1, h)), [a, b, c] = L.himmel, k = u < 0.4 ? u / 0.4 : (u - 0.4) / 0.6, f = u < 0.4 ? c : b, t = u < 0.4 ? b : a;
  return [f[0] + (t[0] - f[0]) * k, f[1] + (t[1] - f[1]) * k, f[2] + (t[2] - f[2]) * k];
}
const solI = (kol, rad, P, f, horisont) => { let dx = kol - ((LAND.sol.v + 2 * Math.PI) % (2 * Math.PI)) * f; if (dx > P / 2) dx -= P; if (dx < -P / 2) dx += P; return [dx, rad - (horisont - f * Math.tan(LAND.sol.h * 0.82))]; };

/** Himmelen med en firkantet sol eller måne. Gir RGBA. */
export function tegnHimmel({ P, hoyde, horisont, natt }) {
  const L = natt ? LYS.natt : LYS.dag, f = P / (2 * Math.PI), ut = new Uint8ClampedArray(P * hoyde * 4), S = Math.max(7, Math.round(f * 0.055)), enhet = S / 6;
  for (let y = 0; y < hoyde; y++) {
    const c = himmelfarge(L, (horisont - y) / (f * 0.85));
    for (let x = 0; x < P; x++) {
      const i = (y * P + x) * 4, [dx, dy] = solI(x, y, P, f, horisont), d = Math.hypot(dx, dy) / f;
      const gl = natt ? 0.3 * Math.exp(-d * 9) : 0.75 * Math.exp(-d * 4.2);
      let r = c[0] + (255 - c[0]) * gl, g = c[1] + ((natt ? 250 : 238) - c[1]) * gl, b = c[2] + ((natt ? 255 : 196) - c[2]) * gl;
      if (Math.abs(dx) < S && Math.abs(dy) < S) {
        const u = Math.floor(dx / enhet), v = Math.floor(dy / enhet), krater = natt && fast(u, v, 5) > 0.78;
        const kant = Math.max(Math.abs(dx), Math.abs(dy)) > S - enhet;
        [r, g, b] = natt ? (krater ? [196, 202, 220] : [236, 240, 250]) : kant ? [255, 226, 120] : [255, 246, 190];
      } else if (natt) { const s = fast(x >> 1, y >> 1, 77); if (s > 0.9975 && y < horisont) { const l = 0.35 + 0.65 * fast(x >> 1, y >> 1, 78); r += (255 - r) * l; g += (250 - g) * l; b += (235 - b) * l; } }
      ut[i] = r; ut[i + 1] = g; ut[i + 2] = b; ut[i + 3] = 255;
    }
  }
  return ut;
}

/** Skyene: flate klosser høyt over deg, sett nedenfra og fra siden. Gir RGBA med gjennomsiktige hull. */
export function tegnSkyer({ P, hoyde, horisont, natt, oye }) {
  const f = P / (2 * Math.PI), ut = new Uint8ClampedArray(P * hoyde * 4), bunn = 84, tykk = 7, rute = 11;
  const sky = (x, z) => {
    const i = Math.floor(x / rute), j = Math.floor(z / rute), r = Math.hypot(i, j) * rute;
    if (Math.abs(Math.atan2(j + 0.5, i + 0.5) - LAND.sol.v) < 0.24 && r > 110 && r < 430) return false;   // sola skal synes
    return lag(i * 0.17 + 40, j * 0.17 + 40, 201, 3) + (fast(i, j, 9) - 0.5) * 0.1 > 0.6;
  };
  for (let y = 0; y < Math.min(hoyde, horisont); y++) {
    const s = (horisont - y) / f;   // stigningen på strålen
    if (s < 0.1) continue;
    const t0 = (bunn - oye) / s, t1 = (bunn + tykk - oye) / s;
    if (t0 > 620) continue;
    const syn = glatt(620, 330, t0) * (natt ? 0.5 : 0.92);
    for (let x = 0; x < P; x++) {
      const v = x / f, c = Math.cos(v), w = Math.sin(v);
      let treff = -1;
      for (let k = 0; k <= 5; k++) { const t = t0 + ((t1 - t0) * k) / 5; if (sky(c * t, w * t)) { treff = k; break; } }
      if (treff < 0) continue;
      const i = (y * P + x) * 4, l = treff === 0 ? 0.86 : 1;   // undersiden er litt mørkere enn sidene
      ut[i] = (natt ? 96 : 255) * l; ut[i + 1] = (natt ? 106 : 255) * l; ut[i + 2] = (natt ? 150 : 255) * (natt ? l : l + 0.03); ut[i + 3] = 255 * syn * (treff === 0 ? 0.9 : 1);
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
    const farge = (rad, d, type, l, u, w, topp, k, ryk) => {
      // Teksturen er 16 punkter i hver blokk nær deg, og grovere lenger unna.
      const px = f / d, res = px > 22 ? 16 : px > 9 ? 8 : px > 4.5 ? 4 : px > 2 ? 2 : 1;
      const a = Math.floor(u * res), b = Math.floor(w * res), nb = fast(k * 16 + a, b + (topp ? 5000 : 0), type);
      let c = DAG[type], m = 1 + (nb - 0.5) * (res > 1 ? 0.2 : 0.1);
      if (type === GRESS) {
        const tone = stoy((k % N) / 17, Math.floor(k / N) / 17, 301);
        if (!topp) {
          const kant = 1 - (3 + Math.floor(fast(a, k, 3) * 3)) / 16;
          if (px < 6) { c = ryk > 0 ? DAG[JORD] : GRESSKANT; } else if (w - Math.floor(w) < kant || ryk > 0) c = DAG[JORD];
        }
        if (c === DAG[GRESS]) m *= 0.88 + 0.26 * tone;
        if (topp && res >= 8 && fast(k, 1, 401) > 0.955) {   // blomster i enga
          const p = Math.floor(u * 8) - 2 - Math.floor(fast(k, 2, 401) * 3), o = Math.floor((w - Math.floor(w)) * 8) - 2 - Math.floor(fast(k, 3, 401) * 3);
          if (Math.abs(p) + Math.abs(o) < 2) { c = p === 0 && o === 0 ? [250, 214, 80] : BLOMST[Math.floor(fast(k, 4, 401) * 4)]; m = 1; }
        }
      } else if (type === STEIN) { if (nb > 0.82) m *= 0.86; m *= 0.9 + 0.2 * stoy((k % N) / 9, w / 5, 311); }
      else if (type === BJORK && fast(a >> 1, b, 19) > 0.8) c = [60, 56, 52];
      else if ((type === LOV || type === GRAN || type === BJORKLOV) && nb < 0.2) m *= 0.7;
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
          const ned = Math.floor(flate - w);
          const type = under ? VANN : T[k] === GRESS ? (ned > 2 ? STEIN : GRESS) : T[k] === SNO ? (ned > 1 ? STEIN : SNO) : T[k];
          farge(y, t0, type, skygget ? 0 : side, u, w, false, k, ned);
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
        const lov = type === LOV || type === GRAN || type === BJORKLOV;
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
      const bolge = (fast(Math.floor(hx * 5), Math.floor(hz * 5), 17) - 0.5) * 0.05, s = Math.max(0.015, (oye / d) * (1 + bolge * 2) + bolge * 0.4);
      const q = (kol - fra + y * bredde) * 4, ref = speil(d, s), frem = Math.max(0.28, Math.min(0.82, 0.95 - s * 1.15));
      const glimt = fast(Math.floor(hx * 4), Math.floor(hz * 8), 23) > 0.965 ? 34 : 0, sk = skygge[k] ? 0.82 : 1, v0 = L.vann;
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
        if (H[k] > hy) type = T[k] === GRESS && H[k] - hy > 1 ? JORD : T[k];
        else if (sp) for (const [b, tp, ty] of sp) if (hy >= b && hy < tp) type = ty;
        if (type < 0) continue;
        const c = DAG[type], mot = ax2 === 0 ? -sx * solx : -sz * solz, l = skygge[k] ? L.skygge : L.sol, g = skygge[k] ? 1 : mot > 0 ? 0.8 : 0.66, dis = Math.min(L.disMaks, Math.max(0, (tt - 58) / 190));
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
