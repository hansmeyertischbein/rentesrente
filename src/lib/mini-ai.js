// Oss mot AI: folk og maskiner kjemper om tårn som er bundet sammen av veier. Rene regler på et brett på 640 × 460.
// Hvert tårn har en ringvei rundt seg. Folk går langs veiene, slåss når de møter maskiner, og tar tårn ved å gå inn i dem.
// Tilstanden endres på stedet for fart, siden det kan være mange på veiene samtidig.

export const FLATE = Object.freeze({ b: 640, h: 460, rx: 29, ry: 18 });   // rx og ry: ringveien rundt hvert tårn
const frys = (o) => { for (const v of Object.values(o)) if (v && typeof v === "object") frys(v); return Object.freeze(o); };

// ---------- Tårnene ----------

// takt: nye i sekundet. maks: så mange det blir plass til av seg selv. kr: penger i sekundet. Hver liste er trinn 1 til 3.
export const TYPER = frys({
  hus: { navn: "Hus", ai: "Fabrikk", tekst: "Gir flest nye folk.", takt: [0.55, 0.75, 1], maks: [20, 32, 48], kr: [0.25, 0.3, 0.35], forsvar: 1, pris: [45, 95], bygg: 50 },
  vakt: { navn: "Vakttårn", ai: "Laser", tekst: "Skyter på fiender på veiene rundt.", takt: [0.2, 0.26, 0.32], maks: [12, 18, 26], kr: [0.15, 0.15, 0.15], forsvar: 1.35, rekke: [82, 96, 112], skudd: [0.85, 1.25, 1.8], pris: [50, 110], bygg: 60 },
  bank: { navn: "Bank", ai: "Kryptogruve", tekst: "Gir penger til oppgraderinger og krefter.", takt: [0.22, 0.28, 0.34], maks: [12, 18, 26], kr: [1.7, 2.8, 4.4], forsvar: 1, pris: [55, 120], bygg: 60 },
  skole: { navn: "Skole", ai: "Datasenter", tekst: "De som går herfra, er sterkere.", takt: [0.34, 0.42, 0.52], maks: [14, 22, 32], kr: [0.2, 0.2, 0.2], forsvar: 1, styrke: [1.4, 1.6, 1.85], pris: [60, 130], bygg: 70 },
  kjerne: { navn: "Rådhuset", ai: "Serveren", tekst: "Hovedsetet. Mister du det, er det slutt.", takt: [0.85, 1.05, 1.3], maks: [40, 56, 80], kr: [1, 1.4, 2], forsvar: 1.25, rekke: [66, 72, 80], skudd: [0.5, 0.65, 0.8], pris: [90, 190] },
});
export const BYGGBARE = Object.freeze(["hus", "vakt", "bank", "skole"]);
export const FART = 47;
const MELLOM = 0.11;   // sekunder mellom hver som går ut av porten

export const KREFTER = frys({
  dugnad: { navn: "Dugnad", tekst: "Alle tårnene dine får 5 folk.", pris: 55, vent: 30, antall: 5 },
  strom: { navn: "Strømbrudd", tekst: "Maskinene står stille i 5 sekunder.", pris: 80, vent: 45, sek: 5 },
  mur: { navn: "Brannmur", tekst: "Tårnet du har valgt, kan ikke tas på 8 sekunder.", pris: 40, vent: 22, sek: 8 },
});

// ---------- Brettene ----------

// [x, y, type, eier, folk]. speil: legger til de samme tårnene på motsatt side, med maskinene der vi er.
const speil = (l) => [...l, ...l.filter(([x, y]) => x !== 320 || y !== 230).map(([x, y, type, eier, folk]) => [640 - x, 460 - y, type, eier === "oss" ? "ai" : eier, folk])];
const O = "oss", A = "ai", N = null;
const LIGGENDE = frys([
  { navn: "Grenda", tema: 0, tarn: speil([[85, 350, "kjerne", O, 20], [200, 385, "hus", N, 7], [95, 225, "hus", N, 7], [215, 265, "bank", N, 9], [320, 230, "hus", N, 14]]) },
  { navn: "Elvesvingen", tema: 1, elv: { bredde: 34, punkter: [[300, -20], [350, 90], [300, 190], [345, 300], [305, 400], [330, 480]] }, tarn: speil([[65, 230, "kjerne", O, 20], [110, 105, "hus", N, 7], [115, 355, "hus", N, 7], [210, 225, "skole", N, 12], [235, 100, "hus", N, 10], [235, 355, "vakt", N, 9]]) },
  { navn: "Ringveien", tema: 2, tarn: [[60, 235, "kjerne", O, 22], [120, 115, "hus", N, 7], [120, 355, "hus", N, 7], [235, 60, "bank", N, 9], [235, 405, "skole", N, 10], [405, 60, "hus", N, 9], [405, 405, "hus", N, 9], [520, 115, "vakt", N, 10], [520, 355, "vakt", N, 10], [580, 235, "hus", A, 10], [215, 235, "vakt", N, 12], [320, 160, "hus", N, 12], [320, 320, "hus", N, 12], [425, 235, "kjerne", A, 26]] },
  { navn: "Fjellpasset", tema: 3, vann: [[320, 70, 46, 60], [320, 395, 46, 70]], tarn: speil([[70, 385, "kjerne", O, 22], [75, 250, "hus", N, 7], [185, 340, "hus", N, 7], [100, 115, "bank", N, 9], [205, 195, "skole", N, 11], [215, 70, "hus", N, 9], [265, 280, "vakt", N, 12]]) },
  { navn: "To servere", tema: 4, tarn: [[65, 235, "kjerne", O, 24], [110, 115, "hus", N, 7], [110, 355, "hus", N, 7], [205, 235, "bank", N, 9], [225, 75, "skole", N, 10], [225, 395, "hus", N, 8], [320, 165, "hus", N, 10], [320, 310, "vakt", N, 12], [340, 60, "hus", N, 9], [340, 410, "hus", N, 9], [435, 235, "bank", N, 12], [455, 100, "hus", A, 8], [455, 365, "hus", A, 8], [565, 60, "kjerne", A, 24], [565, 405, "kjerne", A, 24], [555, 235, "vakt", A, 10]] },
  { navn: "Øyriket", tema: 5, oyer: [[130, 225, 118, 200], [320, 100, 92, 88], [320, 350, 92, 88], [510, 235, 118, 200]], tarn: speil([[70, 235, "kjerne", O, 24], [105, 110, "hus", N, 7], [105, 360, "hus", N, 7], [190, 180, "vakt", N, 10], [190, 290, "bank", N, 9], [280, 65, "hus", N, 9], [195, 75, "hus", N, 9], [285, 165, "skole", N, 12]]) },
  { navn: "Storbyen", tema: 6, tarn: [[60, 400, "kjerne", O, 26], [65, 290, "hus", N, 7], [165, 405, "hus", N, 7], [60, 175, "bank", N, 9], [165, 290, "vakt", N, 9], [65, 65, "hus", N, 8], [170, 170, "skole", N, 10], [175, 60, "hus", N, 9], [275, 400, "hus", N, 8], [275, 285, "bank", N, 10], [280, 175, "hus", N, 10], [285, 65, "vakt", N, 11], [385, 400, "skole", N, 11], [385, 290, "hus", N, 11], [390, 175, "vakt", N, 11], [390, 65, "hus", N, 10], [490, 400, "hus", N, 10], [490, 285, "bank", N, 11], [485, 175, "hus", A, 8], [490, 60, "hus", A, 8], [585, 400, "kjerne", A, 26], [580, 285, "hus", A, 8], [580, 170, "vakt", A, 10], [585, 60, "kjerne", A, 26]] },
  { navn: "Serverparken", tema: 7, tarn: [[320, 405, "kjerne", O, 30], [215, 395, "hus", N, 7], [425, 395, "hus", N, 7], [320, 295, "bank", N, 9], [215, 290, "vakt", N, 9], [425, 290, "skole", N, 9], [115, 400, "hus", N, 9], [525, 400, "hus", N, 9], [115, 300, "bank", N, 10], [525, 300, "bank", N, 10], [270, 190, "hus", N, 10], [375, 190, "hus", N, 10], [170, 195, "hus", N, 11], [475, 195, "hus", N, 11], [50, 345, "hus", N, 9], [590, 345, "hus", N, 9], [55, 235, "vakt", A, 9], [585, 235, "vakt", A, 9], [65, 125, "kjerne", A, 26], [575, 125, "kjerne", A, 26], [150, 95, "hus", A, 9], [490, 95, "hus", A, 9], [245, 60, "skole", N, 12], [398, 60, "bank", N, 12], [322, 105, "kjerne", A, 28]] },
]);
// Stående skjerm: de samme brettene på skrå, med rådhuset nederst.
const p2 = ([x, y]) => [y, 640 - x], e2 = ([x, y, rx, ry]) => [y, 640 - x, ry, rx];
const STAENDE = frys(LIGGENDE.map((b, n) => {
  const nede = n === 7;   // Serverparken har rådhuset nederst fra før, og speiles så det blir der
  const q = nede ? ([x, y]) => [x * 0.72, y * 1.4] : p2, f = nede ? ([x, y, rx, ry]) => [x * 0.72, y * 1.4, rx * 0.72, ry * 1.4] : e2;
  return { ...b, tarn: b.tarn.map(([x, y, ...r]) => [...q([x, y]).map(Math.round), ...r]), vann: b.vann?.map(f), oyer: b.oyer?.map(f), elv: b.elv && { ...b.elv, punkter: b.elv.punkter.map(q) } };
}));
let BRETT = LIGGENDE, staaende = false;
// hvert: sekunder mellom hver gang maskinene tenker. kilder: så mange tårn de samler fra. laer: hvor mye de lærer i minuttet.
export const AI_NIVA = frys([
  { hvert: 3.4, kilder: 1, feil: 0.5, forsvar: false, oppgrader: false, laer: 0.02, fart: 0.65, hack: 0 },
  { hvert: 2.8, kilder: 2, feil: 0.4, forsvar: false, oppgrader: true, laer: 0.03, fart: 0.72, hack: 0 },
  { hvert: 2.3, kilder: 2, feil: 0.3, forsvar: true, oppgrader: true, laer: 0.04, fart: 0.72, hack: 55 },
  { hvert: 1.9, kilder: 3, feil: 0.25, forsvar: true, oppgrader: true, laer: 0.05, fart: 0.85, hack: 48 },
  { hvert: 1.6, kilder: 3, feil: 0.2, forsvar: true, oppgrader: true, laer: 0.05, fart: 0.48, hack: 45 },
  { hvert: 1.3, kilder: 4, feil: 0.15, forsvar: true, oppgrader: true, laer: 0.06, fart: 0.87, hack: 40 },
  { hvert: 1.1, kilder: 5, feil: 0.1, forsvar: true, oppgrader: true, laer: 0.06, fart: 0.55, hack: 36 },
  { hvert: 0.9, kilder: 6, feil: 0.05, forsvar: true, oppgrader: true, laer: 0.06, fart: 0.46, hack: 32 },
]);
export const aiBrett = (niva) => BRETT[niva - 1];
export const VARSEL = 3;      // sekunder fra hackeren varsles til den slår til
export const HACKET = 6;      // så lenge tårnet er ute

const RUTER = new Map();
/** Er det vann her? Bare til pynt: veiene går over på broer. */
export function iVann(niva, x, y) {
  const { vann = [], elv, oyer } = BRETT[niva - 1], inni = ([ex, ey, rx, ry]) => ((x - ex) / rx) ** 2 + ((y - ey) / ry) ** 2 < 1;
  if (oyer) return !oyer.some(inni);
  if (vann.some(inni)) return true;
  return elv ? elv.punkter.slice(1).some((b, i) => { const a = elv.punkter[i], l = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2, u = Math.max(0, Math.min(1, ((x - a[0]) * (b[0] - a[0]) + (y - a[1]) * (b[1] - a[1])) / l)); return Math.hypot(x - a[0] - (b[0] - a[0]) * u, y - a[1] - (b[1] - a[1]) * u) < elv.bredde / 2; }) : false;
}

// Veiene: to tårn bindes sammen når ingen andre tårn ligger mellom dem.
function lagVeier(tarn) {
  const ut = [], a2 = (p, q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
  for (let i = 0; i < tarn.length; i++) for (let j = i + 1; j < tarn.length; j++) {
    const l = a2(tarn[i], tarn[j]);
    if (l < 205 ** 2 && tarn.every((c, k) => k === i || k === j || a2(c, tarn[i]) + a2(c, tarn[j]) > l * 1.06)) ut.push([i, j]);
  }
  return ut;
}
const VEIER = LIGGENDE.map(({ tarn }) => lagVeier(tarn));
export const veier = (niva) => VEIER[niva - 1];
const ringpunkt = (t, v) => [t[0] + Math.cos(v) * FLATE.rx, t[1] + Math.sin(v) * FLATE.ry];
/** Veien mellom to tårn som punkter fra ringvei til ringvei, med en liten sving. */
export function veiPunkter(niva, i, j) {
  if (i > j) return veiPunkter(niva, j, i).reverse();
  const { tarn } = BRETT[niva - 1], a = tarn[i], b = tarn[j], v = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const p = ringpunkt(a, v), q = ringpunkt(b, v + Math.PI), sving = (((i * 7 + j * 13) % 5) - 2) * 0.045, mx = (p[0] + q[0]) / 2 - (q[1] - p[1]) * sving, my = (p[1] + q[1]) / 2 + (q[0] - p[0]) * sving;
  return Array.from({ length: 9 }, (_, k) => { const u = k / 8, w = 1 - u; return [w * w * p[0] + 2 * w * u * mx + u * u * q[0], w * w * p[1] + 2 * w * u * my + u * u * q[1]]; });
}
const lagNaboer = () => BRETT.map(({ tarn }, n) => tarn.map((_, i) => VEIER[n].filter((v) => v.includes(i)).map(([a, b]) => ({ til: a === i ? b : a, l: Math.hypot(tarn[a][0] - tarn[b][0], tarn[a][1] - tarn[b][1]) }))));
let NABO = lagNaboer();
/** Snur brettene for stående skjerm. Veiene mellom tårnene er de samme. */
export function snu(staa) {
  if (staa === staaende) return;
  staaende = staa;
  BRETT = staa ? STAENDE : LIGGENDE;
  NABO = lagNaboer();
  RUTER.clear();
}
export const flate = () => (staaende ? { b: 460, h: 640 } : { b: 640, h: 460 });
export const naboer = (niva, i) => NABO[niva - 1][i].map((n) => n.til);

/** Korteste vei fra ett tårn til et annet. Går helst bare gjennom egne tårn. */
export function finnVei(s, fra, til, eier) {
  const n = s.tarn.length, av = Array(n).fill(Infinity), forrige = Array(n).fill(-1), tatt = Array(n).fill(false);
  av[fra] = 0;
  for (;;) {
    let i = -1;
    for (let k = 0; k < n; k++) if (!tatt[k] && av[k] < Infinity && (i < 0 || av[k] < av[i])) i = k;
    if (i < 0 || i === til) break;
    tatt[i] = true;
    for (const { til: j, l } of NABO[s.niva - 1][i]) { const k = av[i] + l + (j !== til && s.tarn[j].eier !== eier ? 1e5 : 0); if (k < av[j]) { av[j] = k; forrige[j] = i; } }
  }
  if (!(av[til] < Infinity)) return null;
  const ut = [til];
  while (ut[0] !== fra) ut.unshift(forrige[ut[0]]);
  return { vei: ut, lengde: av[til] };
}
/** Hele ruta som én linje. merker[k] er hvor langt ute den kommer fram til ringveien rundt tårn nummer k + 1 på veien. */
function rute(niva, vei) {
  const nokkel = `${niva}:${vei}`;
  if (RUTER.has(nokkel)) return RUTER.get(nokkel);
  const { tarn } = BRETT[niva - 1], punkter = [[tarn[vei[0]][0], tarn[vei[0]][1]]], merkeVed = [];
  for (let k = 0; k + 1 < vei.length; k++) {
    const del = veiPunkter(niva, vei[k], vei[k + 1]);
    if (k) {   // rundt ringveien, korteste vei
      const t = tarn[vei[k]], a = punkter.at(-1), va = Math.atan2((a[1] - t[1]) / FLATE.ry, (a[0] - t[0]) / FLATE.rx), vb = Math.atan2((del[0][1] - t[1]) / FLATE.ry, (del[0][0] - t[0]) / FLATE.rx);
      let dv = vb - va;
      while (dv > Math.PI) dv -= 2 * Math.PI;
      while (dv < -Math.PI) dv += 2 * Math.PI;
      for (let m = 1; m < 6; m++) punkter.push(ringpunkt(t, va + (dv * m) / 6));
    }
    punkter.push(...del);
    merkeVed.push(punkter.length - 1);
  }
  const t = tarn[vei.at(-1)];
  punkter.push([t[0], t[1]]);
  const lang = [0];
  for (let k = 1; k < punkter.length; k++) lang.push(lang[k - 1] + Math.hypot(punkter[k][0] - punkter[k - 1][0], punkter[k][1] - punkter[k - 1][1]));
  const r = { vei, punkter, lang, lengde: lang.at(-1), merker: merkeVed.map((k) => lang[k]) };
  RUTER.set(nokkel, r);
  return r;
}

// ---------- Spillet ----------

export function lagKamp(niva) {
  const b = BRETT[niva - 1];
  return {
    niva, tid: 0, ferdig: null, teller: 0, laert: 0, stille: 0, tenkOm: 4, folk: [], skudd: [],
    kr: { oss: 60, ai: 40 }, vent: { dugnad: 0, strom: 0, mur: 0 }, hack: null, hackOm: AI_NIVA[niva - 1].hack,
    tarn: b.tarn.map(([x, y, type, eier, folk], id) => ({ id, x, y, type, eier, folk, trinn: 1, ko: [], fast: null, fastOm: 0, klar: 1, mur: 0, hacket: 0, blink: 0, vinkel: -1.5 })),
    statistikk: { tatt: 0, tapt: 0, sendt: 0 },
  };
}
export const egen = (t, felt) => TYPER[t.type][felt]?.[t.trinn - 1] ?? 0;
export const forsvar = (t) => TYPER[t.type].forsvar * (1 + 0.1 * (t.trinn - 1));
export const navnPa = (t) => (t.eier === "ai" ? TYPER[t.type].ai : TYPER[t.type].navn);
const makt = (s, eier) => (eier === "ai" ? AI_NIVA[s.niva - 1].fart * (1 + s.laert) : 1);

/** Sender folk fra ett tårn til et annet. antall er hvor mange. Gir hvor mange som går. */
export function send(s, fra, til, antall, eier = s.tarn[fra]?.eier) {
  const t = s.tarn[fra];
  if (s.ferdig || !t || fra === til || !s.tarn[til] || !eier || t.eier !== eier || t.hacket > 0) return 0;
  const iKo = t.ko.reduce((a, k) => a + k.antall, 0), n = Math.min(Math.floor(antall), Math.floor(t.folk) - iKo);
  if (n < 1) return 0;
  const v = finnVei(s, fra, til, eier);
  if (!v) return 0;
  t.ko.push({ rute: rute(s.niva, v.vei), antall: n, om: 0 });
  if (eier === "oss") s.statistikk.sendt += n;
  return n;
}
export const ledige = (t) => Math.max(0, Math.floor(t.folk) - t.ko.reduce((a, k) => a + k.antall, 0));
/** Fast overføring: tårnet sender folk videre av seg selv. */
export function settFast(s, fra, til) {
  const t = s.tarn[fra];
  if (!t || t.eier !== "oss" || s.ferdig) return false;
  t.fast = til === null || til === fra || t.fast === til || !s.tarn[til] ? null : til;
  t.fastOm = 0;
  return true;
}
export const oppgraderPris = (t) => (t.trinn < 3 ? TYPER[t.type].pris[t.trinn - 1] : Infinity);
export function oppgrader(s, id, eier = "oss") {
  const t = s.tarn[id], pris = t ? oppgraderPris(t) : Infinity;
  if (!t || s.ferdig || t.eier !== eier || s.kr[eier] < pris) return false;
  s.kr[eier] -= pris; t.trinn++;
  return true;
}
export const kanBygge = (t, type) => t.type !== "kjerne" && t.type !== type && BYGGBARE.includes(type);
export function byggOm(s, id, type, eier = "oss") {
  const t = s.tarn[id];
  if (!t || s.ferdig || t.eier !== eier || !kanBygge(t, type) || s.kr[eier] < TYPER[type].bygg) return false;
  s.kr[eier] -= TYPER[type].bygg; t.type = type; t.trinn = 1; t.klar = 1;
  return true;
}
export function brukKraft(s, kraft, id = -1) {
  const k = KREFTER[kraft], t = s.tarn[id];
  if (!k || s.ferdig || s.vent[kraft] > 0 || s.kr.oss < k.pris || (kraft === "mur" && t?.eier !== "oss")) return false;
  s.kr.oss -= k.pris; s.vent[kraft] = k.vent;
  if (kraft === "dugnad") for (const x of s.tarn) if (x.eier === "oss") x.folk += k.antall;
  if (kraft === "strom") s.stille = k.sek;
  if (kraft === "mur") t.mur = k.sek;
  return true;
}

function kommerInn(s, t, f, ut) {
  if (t.eier === f.eier) { t.folk += 1; return; }
  t.blink = 0.15;
  if (t.mur > 0) { ut.push({ type: "mur", p: [t.x, t.y] }); return; }
  t.folk -= f.liv / forsvar(t);
  if (t.folk >= 0) { ut.push({ type: "slag", p: [f.x, f.y], eier: f.eier }); return; }
  const for_ = t.eier;
  t.eier = f.eier; t.folk = Math.max(1, -t.folk); t.ko = []; t.fast = null; t.trinn = Math.max(1, t.trinn - 1); t.hacket = 0;
  if (f.eier === "oss") s.statistikk.tatt++; else if (for_ === "oss") s.statistikk.tapt++;
  if (s.hack?.id === t.id) s.hack = null;
  ut.push({ type: "tatt", id: t.id, p: [t.x, t.y], eier: f.eier, for: for_ });
}

/** Et steg i tiden. Endrer s og gir hendelser til lyd og bilde. */
export function kampSteg(s, dt, rng = Math.random) {
  const ut = [];
  if (s.ferdig) return ut;
  const evne = AI_NIVA[s.niva - 1];
  s.tid += dt;
  s.stille = Math.max(0, s.stille - dt);
  s.laert = Math.min(1, s.laert + (evne.laer * dt) / 60);
  for (const k of Object.keys(s.vent)) s.vent[k] = Math.max(0, s.vent[k] - dt);
  // Tårnene: nye folk, penger, porten og faste overføringer
  for (const t of s.tarn) {
    t.mur = Math.max(0, t.mur - dt); t.hacket = Math.max(0, t.hacket - dt); t.blink -= dt; t.klar -= dt;
    if (!t.eier || t.hacket > 0 || (t.eier === "ai" && s.stille > 0)) continue;
    const m = makt(s, t.eier);
    if (t.folk < egen(t, "maks")) t.folk = Math.min(egen(t, "maks"), t.folk + egen(t, "takt") * m * dt);
    s.kr[t.eier] += egen(t, "kr") * m * dt;
    if (t.fast !== null) { t.fastOm -= dt; if (t.fastOm <= 0) { t.fastOm = 1.6; const n = ledige(t); if (n >= 5) send(s, t.id, t.fast, n - 2); } }
    for (const k of t.ko) {
      k.om -= dt;
      while (k.om <= 0 && k.antall > 0 && t.folk >= 1) {
        k.om += MELLOM; k.antall--; t.folk -= 1;
        s.folk.push({ id: ++s.teller, eier: t.eier, rute: k.rute, d: 0, del: 1, neste: 0, liv: t.type === "skole" ? egen(t, "styrke") : 1, x: t.x, y: t.y, side: ((s.teller * 37) % 7) - 3 });
      }
      if (t.folk < 1) k.antall = 0;
    }
    if (t.ko.length) t.ko = t.ko.filter((k) => k.antall > 0);
  }
  // De som går
  for (const f of s.folk) {
    if (f.eier === "ai" && s.stille > 0) continue;
    f.d += FART * dt;
    const r = f.rute;
    while (f.del < r.lang.length - 1 && r.lang[f.del] < f.d) f.del++;
    const a = r.punkter[f.del - 1], b = r.punkter[f.del], l = r.lang[f.del] - r.lang[f.del - 1] || 1, u = Math.min(1, (f.d - r.lang[f.del - 1]) / l);
    f.x = a[0] + (b[0] - a[0]) * u; f.y = a[1] + (b[1] - a[1]) * u;
    if (f.neste < r.merker.length && f.d >= r.merker[f.neste]) {
      const t = s.tarn[r.vei[f.neste + 1]], sist = f.neste === r.merker.length - 1;
      f.neste++;
      if (t.eier !== f.eier) { kommerInn(s, t, f, ut); f.liv = 0; } else if (sist) f.inne = t;
    }
    if (f.liv > 0 && f.d >= r.lengde) { kommerInn(s, f.inne ?? s.tarn[r.vei.at(-1)], f, ut); f.liv = 0; }
  }
  // Møter på veien
  const rute16 = new Map(), nokkel = (x, y) => (x >> 4) * 64 + (y >> 4);
  for (const f of s.folk) if (f.liv > 0 && f.eier === "ai") { const k = nokkel(f.x, f.y); if (rute16.has(k)) rute16.get(k).push(f); else rute16.set(k, [f]); }
  for (const f of s.folk) {
    if (f.liv <= 0 || f.eier !== "oss") continue;
    for (let dx = -16; dx <= 16 && f.liv > 0; dx += 16) for (let dy = -16; dy <= 16 && f.liv > 0; dy += 16) for (const m of rute16.get(nokkel(f.x + dx, f.y + dy)) ?? []) {
      if (m.liv <= 0 || Math.hypot(m.x - f.x, m.y - f.y) > 9) continue;
      const k = Math.min(m.liv, f.liv);
      m.liv -= k; f.liv -= k;
      ut.push({ type: "mote", p: [(m.x + f.x) / 2, (m.y + f.y) / 2] });
      if (f.liv <= 0) break;
    }
  }
  // Vakttårn og hovedseter skyter. Nøytrale vakttårn skyter på alle.
  for (const t of s.tarn) {
    const rekke = egen(t, "rekke");
    if (!rekke || t.klar > 0 || t.hacket > 0 || (t.eier === "ai" && s.stille > 0) || (!t.eier && t.type === "kjerne")) continue;
    let best = null, ba = rekke;
    for (const f of s.folk) { if (f.liv <= 0 || f.eier === t.eier) continue; const a = Math.hypot(f.x - t.x, (f.y - t.y) * 1.25); if (a < ba) { ba = a; best = f; } }
    if (!best) continue;
    t.klar = 1 / (egen(t, "skudd") * (t.eier ? makt(s, t.eier) : 0.8)); t.vinkel = Math.atan2(best.y - t.y, best.x - t.x);
    best.liv -= 1;
    ut.push({ type: "skudd", p: [t.x, t.y], til: [best.x, best.y], eier: t.eier });
  }
  s.folk = s.folk.filter((f) => f.liv > 0.01);
  // Hackeren
  if (evne.hack && s.stille <= 0) {
    if (s.hack) {
      s.hack.om -= dt;
      if (s.hack.om <= 0) { const t = s.tarn[s.hack.id]; if (t.eier === "oss" && t.mur <= 0) { t.hacket = HACKET; t.ko = []; ut.push({ type: "hacket", id: t.id, p: [t.x, t.y] }); } s.hack = null; s.hackOm = evne.hack; }
    } else if ((s.hackOm -= dt) <= 0) {
      const mulige = s.tarn.filter((t) => t.eier === "oss" && t.type !== "kjerne").sort((a, b) => b.folk - a.folk);
      if (mulige.length) { const t = mulige[Math.floor(rng() * Math.min(3, mulige.length))]; s.hack = { id: t.id, om: VARSEL }; ut.push({ type: "hackVarsel", id: t.id, p: [t.x, t.y] }); } else s.hackOm = 8;
    }
  }
  // Maskinene tenker
  if (s.stille <= 0 && (s.tenkOm -= dt) <= 0) { s.tenkOm = evne.hvert; tenk(s, "ai", evne, rng); }
  if (!s.tarn.some((t) => t.type === "kjerne" && t.eier === "ai")) s.ferdig = "vunnet";
  else if (!s.tarn.some((t) => t.type === "kjerne" && t.eier === "oss")) s.ferdig = "tapt";
  return ut;
}

const VERDI = { hus: 10, bank: 9, skole: 9, vakt: 6, kjerne: 24 };
/** Én runde med valg for den ene siden. Brukes av maskinene, og av robotene som tester nivåene. */
export function tenk(s, eier, evne, rng = Math.random) {
  const mine = s.tarn.filter((t) => t.eier === eier), nabo = (t) => NABO[s.niva - 1][t.id];
  const paaVei = s.tarn.map(() => [0, 0]);   // [egne, fremmede]
  for (const f of s.folk) paaVei[f.rute.vei.at(-1)][f.eier === eier ? 0 : 1] += f.liv;
  for (const t of mine) for (const k of t.ko) paaVei[k.rute.vei.at(-1)][0] += k.antall;
  const front = (t) => nabo(t).some((n) => s.tarn[n.til].eier !== eier);
  const ledig = (t) => Math.max(0, ledige(t) - (t.type === "kjerne" ? evne.vern ?? 6 : front(t) ? 2 : 1) - (evne.forsvar ? Math.max(0, paaVei[t.id][1] - paaVei[t.id][0]) / forsvar(t) : 0));
  // Forsvar
  if (evne.forsvar) for (const t of mine) {
    const mangler = paaVei[t.id][1] / forsvar(t) - t.folk - paaVei[t.id][0];
    if (mangler < 0) continue;
    const hjelp = mine.filter((x) => x !== t && ledig(x) > 2).map((x) => ({ x, l: finnVei(s, x.id, t.id, eier)?.lengde ?? 1e9 })).filter((h) => h.l < 260).sort((a, b) => a.l - b.l)[0];
    if (hjelp) send(s, hjelp.x.id, t.id, Math.min(ledig(hjelp.x), mangler + 4));
  }
  // Oppgrader
  if (evne.oppgrader) {
    const kan = mine.filter((t) => oppgraderPris(t) <= s.kr[eier]).sort((a, b) => VERDI[b.type] - VERDI[a.type] || b.folk - a.folk)[0];
    if (kan) oppgrader(s, kan.id, eier);
  }
  // Angrep
  const maal = new Set(mine.flatMap((t) => nabo(t).map((n) => n.til)).filter((i) => s.tarn[i].eier !== eier));
  let best = null;
  for (const i of maal) {
    const t = s.tarn[i];
    if (t.mur > 0) continue;
    const kilder = mine.map((x) => ({ x, n: ledig(x), l: 0 })).filter((k) => k.n >= 2).map((k) => ({ ...k, l: finnVei(s, k.x.id, i, eier)?.lengde ?? 1e9 })).filter((k) => k.l < 380).sort((a, b) => a.l - b.l).slice(0, evne.kilder);
    if (!kilder.length) continue;
    const reise = kilder.at(-1).l / FART, vokser = t.eier ? Math.min(egen(t, "maks") - Math.min(t.folk, egen(t, "maks")), egen(t, "takt") * makt(s, t.eier) * reise) : 0;
    const trengs = (t.folk + vokser + paaVei[i][1]) * forsvar(t) + 2 + (egen(t, "rekke") ? 3 * t.trinn : 0) - paaVei[i][0];
    if (trengs <= 0) continue;
    let sum = 0, brukt = [];
    for (const k of kilder) { if (sum >= trengs * 1.12) break; const n = Math.min(k.n, Math.ceil(trengs * 1.12 - sum)); brukt.push([k.x.id, n]); sum += n; }
    if (sum < trengs) continue;
    const poeng = ((VERDI[t.type] * (t.eier ? 1.5 : 1)) / (trengs + 0.07 * kilder[0].l + 4)) * (1 + (rng() - 0.5) * 2 * evne.feil);
    if (!best || poeng > best.poeng) best = { poeng, i, brukt };
  }
  if (best) for (const [fra, n] of best.brukt) send(s, fra, best.i, n);
  // Flytt framover fra tårn uten fiender ved siden av
  for (const t of mine) {
    if (front(t) || ledige(t) < 0.55 * egen(t, "maks")) continue;
    const m = mine.filter((x) => x !== t && front(x)).map((x) => ({ x, l: finnVei(s, t.id, x.id, eier)?.lengde ?? 1e9 })).sort((a, b) => a.l - b.l)[0];
    if (m && rng() > evne.feil) send(s, t.id, m.x.id, ledige(t) * 0.8);
  }
}
