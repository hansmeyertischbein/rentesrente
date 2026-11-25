// Skjermen til Oss mot AI. Reglene ligger i /lib/mini-ai.js.
import * as A from "/lib/mini-ai.js";
import { lag, settTekst, settAttr, rolig } from "./overfor-felles.js";
import { skarpt } from "./overfor-mini-brett.js";

const K = "#2b2118", TAU = Math.PI * 2, { rx: RX, ry: RY } = A.FLATE;
let { b: B, h: H } = A.flate();
const staaende = matchMedia("(max-width: 34rem) and (orientation: portrait)");
const fast = (a, b = 0) => { let h = Math.imul(a + 374761393, 668265263) ^ Math.imul(b + 1274126177, 2246822519); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const FARGE = { oss: "#f0533a", ai: "#12b5c4", null: "#9b9486" };
const GLOD = { oss: "255 190 60", ai: "40 220 240" };

// ---------- Brettet, tegnet én gang ----------

const TEMA = [
  { mark: ["#b6d88a", "#a6cb79", "#c5e39b"], vei: ["#8a6b45", "#ead3a6", "#d9bd88"], tre: ["#4f8f48", "#6cae58", "#3c7540"], vann: ["#5fb0d6", "#8fd0ea"] },
  { mark: ["#9fd0a4", "#90c496", "#b3dcb5"], vei: ["#6f6a5c", "#e4dcc6", "#cdc3a8"], tre: ["#3f8a63", "#58a679", "#2f6f4d"], vann: ["#3f93c9", "#74bde4"] },
  { mark: ["#e9d8a6", "#dfcb93", "#f2e5bd"], vei: ["#7c5a44", "#d8b48c", "#c49d75"], tre: ["#7f9a4b", "#98b25d", "#637c38"], vann: ["#5fb0d6", "#8fd0ea"] },
  { mark: ["#cfd9d2", "#bfccc5", "#dfe7e1"], vei: ["#6b6f78", "#f1f3f4", "#dcdfe2"], tre: ["#4e7f74", "#6a9b8e", "#3a655c"], vann: ["#6f9fc2", "#a5c8de"] },
  { mark: ["#e3bf9b", "#d8b18b", "#edceb0"], vei: ["#7a4a3a", "#f0dcc0", "#dcc19d"], tre: ["#a66a3c", "#c98548", "#84522d"], vann: ["#4d9fae", "#86c8cf"] },
  { mark: ["#b9dd8f", "#a8cf7d", "#c9e8a2"], vei: ["#8a6b45", "#f3e4be", "#e0cb9a"], tre: ["#3f8f58", "#5cae6c", "#2f7045"], vann: ["#3aa0cf", "#6cc3e6"] },
  { mark: ["#a7aebb", "#9aa2b1", "#b5bcc8"], vei: ["#454c5a", "#6d7687", "#5f6878"], tre: ["#4f8f6a", "#69aa82", "#3c7153"], vann: ["#4a86b5", "#7fb1d6"] },
  { mark: ["#4c4a70", "#434165", "#57557e"], vei: ["#211f3d", "#8d89b8", "#7a76a6"], tre: ["#3d6d8c", "#4f87a8", "#2c536e"], vann: ["#2b5b8f", "#4c86bd"] },
];
function lagBakgrunn(niva, skala) {
  const c = document.createElement("canvas"), g = c.getContext("2d"), brett = A.aiBrett(niva), t = TEMA[brett.tema], vei = A.veier(niva);
  c.width = B * skala; c.height = H * skala; g.scale(skala, skala);
  g.lineJoin = g.lineCap = "round";
  const ell = ([x, y, rx, ry], k = 0) => { g.beginPath(); g.ellipse(x, y, rx + k, ry + k, 0, 0, TAU); };
  const mark = () => {
    g.fillStyle = t.mark[0]; g.fillRect(0, 0, B, H);
    for (let i = 0; i < 24; i++) { g.globalAlpha = 0.35; g.fillStyle = t.mark[1 + (i % 2)]; g.beginPath(); g.ellipse(fast(i, 11) * B, fast(i, 12) * H, 40 + fast(i, 13) * 80, 20 + fast(i, 14) * 36, fast(i, 15) * 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 1100; i++) { g.globalAlpha = 0.7; g.fillStyle = t.mark[1 + (i % 2)]; const x = fast(i, 1) * B, y = fast(i, 2) * H, l = 2 + fast(i, 3) * 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 1.5, y - l); g.lineTo(x + 3, y); g.fill(); }
    g.globalAlpha = 1;
  };
  const bolger = (i, n = 160) => { g.strokeStyle = t.vann[1]; g.lineWidth = 1.6; for (let k = 0; k < n; k++) { const x = fast(k, 51 + i) * B, y = fast(k, 61 + i) * H; if (!A.iVann(niva, x, y) || !A.iVann(niva, x + 9, y)) continue; g.globalAlpha = 0.75; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 3, y - 2.4, x + 5, y); g.quadraticCurveTo(x + 7.5, y + 2, x + 10, y); g.stroke(); } g.globalAlpha = 1; };
  if (brett.oyer) {
    g.fillStyle = t.vann[0]; g.fillRect(0, 0, B, H); bolger(1, 420);
    for (const o of brett.oyer) { g.fillStyle = "rgb(255 255 255 / 0.28)"; ell(o, 13); g.fill(); g.fillStyle = "rgb(43 33 24 / 0.22)"; g.save(); g.translate(0, 6); ell(o, 4); g.fill(); g.restore(); g.fillStyle = "#f3e0b0"; ell(o, 5); g.fill(); }
    g.save(); g.beginPath(); for (const o of brett.oyer) { g.moveTo(o[0] + o[2] - 4, o[1]); g.ellipse(o[0], o[1], o[2] - 4, o[3] - 4, 0, 0, TAU); } g.clip(); mark(); g.restore();
  } else {
    mark();
    for (const v of brett.vann ?? []) { g.fillStyle = t.vei[0]; ell(v, 5); g.fill(); g.fillStyle = t.vann[0]; ell(v); g.fill(); }
    if (brett.elv) for (const [br, f] of [[brett.elv.bredde + 9, "#8a7a58"], [brett.elv.bredde, t.vann[0]]]) { g.strokeStyle = f; g.lineWidth = br; g.beginPath(); brett.elv.punkter.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); }
    bolger(2, 900);
  }
  // Veiene og ringveiene rundt hvert tårn
  const linjer = vei.map(([i, j]) => A.veiPunkter(niva, i, j));
  const spor = () => { g.beginPath(); for (const p of linjer) p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); };
  const ringer = () => { g.beginPath(); for (const [x, y] of brett.tarn) { g.moveTo(x + RX, y); g.ellipse(x, y, RX, RY, 0, 0, TAU); } };
  for (const [br, f, dy] of [[21, "rgb(43 33 24 / 0.2)", 3], [18, t.vei[0], 0], [14, t.vei[2], 0], [11, t.vei[1], 0]]) { g.save(); g.translate(0, dy); g.strokeStyle = f; g.lineWidth = br; spor(); g.stroke(); ringer(); g.stroke(); g.restore(); }
  for (const p of linjer) for (let k = 0; k < 64; k++) {   // broer der veien går over vann
    const u = (k / 64) * 8, i = Math.min(7, Math.floor(u)), v = u - i, x = p[i][0] + (p[i + 1][0] - p[i][0]) * v, y = p[i][1] + (p[i + 1][1] - p[i][1]) * v;
    if (!A.iVann(niva, x, y)) continue;
    const a = Math.atan2(p[i + 1][1] - p[i][1], p[i + 1][0] - p[i][0]);
    g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = k % 2 ? "#b98249" : "#a8733d"; g.fillRect(-1.8, -9, 3.8, 18); g.fillStyle = "#6b4526"; g.fillRect(-1.8, -10, 3.8, 2.4); g.fillRect(-1.8, 7.6, 3.8, 2.4); g.restore();
  }
  g.setLineDash([5, 7]); g.strokeStyle = brett.tema === 6 ? "#ffe58a" : "rgb(255 255 255 / 0.5)"; g.lineWidth = 1.3; spor(); g.stroke(); g.setLineDash([]);
  for (const [x, y] of brett.tarn) { g.fillStyle = t.mark[2]; g.beginPath(); g.ellipse(x, y, RX - 7, RY - 6, 0, 0, TAU); g.fill(); }
  // Pynt langt fra veiene
  const alle = [...linjer.flat(), ...brett.tarn.flatMap(([x, y]) => [0, 1, 2, 3, 4, 5].map((k) => [x + Math.cos(k * 1.05) * RX, y + Math.sin(k * 1.05) * RY - (k > 2 ? 34 : 0)]))], pynt = [];
  for (let i = 0; i < 420 && pynt.length < 74; i++) { const x = fast(i, 31) * B, y = 14 + fast(i, 32) * (H - 20); if (!A.iVann(niva, x, y) && !A.iVann(niva, x + 8, y + 6) && alle.every(([a, b]) => Math.hypot(a - x, (b - y) * 1.1) > 23)) pynt.push([x, y, i]); }
  for (const [x, y, i] of pynt.sort((a, b) => a[1] - b[1])) {
    const r = 6 + fast(i, 33) * 6;
    g.fillStyle = "rgb(43 33 24 / 0.2)"; g.beginPath(); g.ellipse(x + 2, y + 2, r, r * 0.42, 0, 0, TAU); g.fill();
    g.strokeStyle = K; g.lineWidth = 1.3;
    if (brett.tema === 6) { const hb = 7 + r * 0.4, hh = 12 + fast(i, 34) * 20; g.fillStyle = ["#8f98aa", "#a79a90", "#7d889c"][i % 3]; g.fillRect(x - hb, y - hh, hb * 2, hh); g.strokeRect(x - hb, y - hh, hb * 2, hh); g.fillStyle = "#ffe9a8"; for (let a = 0; a < 2; a++) for (let q = 5; q < hh - 3; q += 6) if (fast(i + a * 7, q) > 0.35) g.fillRect(x - hb + 3 + a * hb, y - q, 3, 3); continue; }
    if (brett.tema === 7) { g.fillStyle = "#2f2d52"; g.beginPath(); g.roundRect(x - 6, y - 15, 12, 16, 2); g.fill(); g.stroke(); for (let q = 0; q < 3; q++) { g.fillStyle = ["#39e6ef", "#ff5ea8", "#8dff7a"][(i + q) % 3]; g.fillRect(x - 3.5, y - 12 + q * 4.5, 7, 1.6); } continue; }
    if (i % 5 === 0) { g.fillStyle = "#9aa3ad"; g.beginPath(); g.ellipse(x, y, r * 0.8, r * 0.55, 0.2, 0, TAU); g.fill(); g.stroke(); continue; }
    g.fillStyle = "#7a5634"; g.fillRect(x - 1.8, y - r * 0.6, 3.6, r * 0.7);
    if (brett.tema === 3) { for (const [oy, q] of [[0.3, 1], [0.9, 0.8], [1.5, 0.55]]) { g.fillStyle = t.tre[0]; g.beginPath(); g.moveTo(x - r * q, y - r * oy); g.lineTo(x, y - r * (oy + 1.1)); g.lineTo(x + r * q, y - r * oy); g.closePath(); g.fill(); g.stroke(); } continue; }
    for (const [ox, oy, rr, f] of [[0, -r * 1.15, r, t.tre[0]], [-r * 0.3, -r * 1.4, r * 0.6, t.tre[1]], [r * 0.35, -r, r * 0.5, t.tre[2]]]) { g.fillStyle = f; g.beginPath(); g.arc(x + ox, y + oy, rr, 0, TAU); g.fill(); if (rr === r) g.stroke(); }
  }
  return c;
}

// ---------- De som går ----------

/** Små figurer tegnes én gang og stemples ut igjen. */
const FIGUR = {};
function figur(eier, sterk, bilde) {
  const nokkel = `${eier}${sterk}${bilde}`;
  if (FIGUR[nokkel]) return FIGUR[nokkel];
  const c = document.createElement("canvas"), g = c.getContext("2d");
  c.width = 72; c.height = 84; g.scale(4, 4); g.translate(9, 17); g.lineJoin = g.lineCap = "round"; g.strokeStyle = K; g.lineWidth = 1.1;
  const steg = bilde ? 1.6 : -1.6;
  if (eier === "ai") {
    g.beginPath(); g.moveTo(-2, -4); g.lineTo(-2 + steg, 0); g.moveTo(2, -4); g.lineTo(2 - steg, 0); g.stroke();
    g.fillStyle = sterk ? "#8e5bd6" : "#4d627f"; g.beginPath(); g.roundRect(-3.8, -9, 7.6, 5.6, 1.4); g.fill(); g.stroke();
    g.fillStyle = "#2a3550"; g.beginPath(); g.roundRect(-4.2, -14.2, 8.4, 5.4, 1.6); g.fill(); g.stroke();
    g.fillStyle = "#4bf0f5"; g.fillRect(-2.7, -12.6, 2, 2); g.fillRect(0.8, -12.6, 2, 2);
    g.beginPath(); g.moveTo(0, -14.2); g.lineTo(0, -16.4); g.stroke(); g.fillStyle = "#ff5ea8"; g.beginPath(); g.arc(0, -16.4, 0.9, 0, TAU); g.fill();
  } else {
    g.beginPath(); g.moveTo(-1.6, -4); g.lineTo(-1.6 + steg, 0); g.moveTo(1.6, -4); g.lineTo(1.6 - steg, 0); g.stroke();
    g.fillStyle = sterk ? "#ffd84a" : "#f0533a"; g.beginPath(); g.roundRect(-3.4, -9.4, 6.8, 6, 2.2); g.fill(); g.stroke();
    g.fillStyle = "#ffd9b3"; g.beginPath(); g.arc(0, -11.8, 3.3, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = sterk ? "#3b4fa8" : "#7a4a22"; g.beginPath(); g.arc(0, -12.6, 3.2, Math.PI, 0); g.fill();
    if (sterk) { g.fillRect(-4.4, -13.2, 8.8, 1.1); }
  }
  return (FIGUR[nokkel] = c);
}

// ---------- Tårnene ----------

const PAL = {
  oss: { v: ["#fbe6bd", "#d9ac6e"], tak: ["#ee5a40", "#b83a26"], d: "#7a4a22", lys: "#fff3b0", f: "#f0533a" },
  ai: { v: ["#4a5a78", "#27324a"], tak: ["#2b3a57", "#1a2338"], d: "#101828", lys: "#3ff0f5", f: "#12b5c4" },
  null: { v: ["#cfc8ba", "#9d9585"], tak: ["#8f887b", "#6d675c"], d: "#5a5247", lys: "#ece6d8", f: "#9b9486" },
};
export function tegnTarn(g, t, tid) {
  const p = PAL[t.eier], ai = t.eier === "ai", trinn = t.trinn ?? 1, st = (1 + 0.1 * (trinn - 1)) * (t.type === "kjerne" ? 1.16 : 1);
  g.save(); g.translate(t.x, t.y + 3); g.scale(st, st);
  g.strokeStyle = K; g.lineWidth = 1.7; g.lineJoin = g.lineCap = "round";
  const vegg = (x, y, b, h, r = 2, farger = p.v) => { const gr = g.createLinearGradient(x, 0, x + b, 0); gr.addColorStop(0, farger[0]); gr.addColorStop(0.45, farger[0]); gr.addColorStop(1, farger[1]); g.fillStyle = gr; g.beginPath(); g.roundRect(x, y, b, h, r); g.fill(); g.stroke(); };
  const tak = (pk) => { g.fillStyle = p.tak[0]; g.beginPath(); pk.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); g.stroke(); };
  const vindu = (x, y, b = 4, h = 5) => { g.fillStyle = p.lys; g.fillRect(x, y, b, h); g.lineWidth = 1; g.strokeRect(x, y, b, h); g.lineWidth = 1.7; };
  const flagg = (x, y, h = 13) => { if (!t.eier) return; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h); g.stroke(); const s = Math.sin(tid * 4 + t.x) * 1.5; g.fillStyle = p.f; g.beginPath(); g.moveTo(x, y - h); g.quadraticCurveTo(x + 6, y - h - 1.5 + s, x + 12, y - h + 1.5); g.lineTo(x + 12, y - h + 8); g.quadraticCurveTo(x + 6, y - h + 5 + s, x, y - h + 7.5); g.closePath(); g.fill(); g.stroke(); g.fillStyle = "#fff"; if (ai) { g.fillRect(x + 4, y - h + 2, 1.8, 1.8); g.fillRect(x + 7, y - h + 2, 1.8, 1.8); } else { g.beginPath(); g.arc(x + 6, y - h + 3.6, 2, 0, TAU); g.fill(); } g.lineWidth = 1.7; };
  const puls = 0.6 + 0.4 * Math.sin(tid * 3 + t.x);
  g.fillStyle = "rgb(43 33 24 / 0.25)"; g.beginPath(); g.ellipse(2, 2, 19, 7, 0, 0, TAU); g.fill();
  switch (t.type) {
    case "hus":
      if (ai) {
        vegg(-15, -17, 30, 19); for (let k = 0; k < 3; k++) tak([[-15 + k * 10, -17], [-15 + k * 10, -26], [-5 + k * 10, -17]]);
        vegg(8, -35, 5, 16, 1, p.tak); g.globalAlpha = 0.5; for (let k = 0; k < 3; k++) { const u = (tid * 0.5 + k / 3) % 1; g.fillStyle = "#9fb4c9"; g.beginPath(); g.arc(10.5 + u * 8, -36 - u * 16, 2 + u * 4, 0, TAU); g.globalAlpha = 0.5 * (1 - u); g.fill(); } g.globalAlpha = 1;
        g.fillStyle = p.lys; g.globalAlpha = puls; g.fillRect(-11, -12, 6, 4); g.fillRect(-2, -12, 6, 4); g.globalAlpha = 1; g.fillStyle = p.d; g.fillRect(6, -10, 6, 12);
      } else {
        vegg(-14, -16, 28, 18); if (trinn > 1) vegg(7, -33, 5, 12, 1, p.v); tak([[-18, -15], [0, -33], [18, -15]]); g.strokeStyle = p.tak[1]; g.lineWidth = 1; for (const q of [-9, -4, 4, 9]) { g.beginPath(); g.moveTo(q, -17); g.lineTo(q * 0.4, -27); g.stroke(); } g.strokeStyle = K; g.lineWidth = 1.7;
        vindu(-10, -11); vindu(6, -11); g.fillStyle = p.d; g.beginPath(); g.roundRect(-3, -10, 6, 12, [3, 3, 0, 0]); g.fill(); g.stroke(); flagg(0, -32, 12);
      }
      break;
    case "vakt":
      if (ai) {
        tak([[-11, 2], [-5, -30], [5, -30], [11, 2]]); g.strokeStyle = "#5f7396"; g.lineWidth = 1.2; g.beginPath(); for (let k = 0; k < 3; k++) { g.moveTo(-9 + k * 2, -4 - k * 9); g.lineTo(8 - k * 2, -10 - k * 9); } g.stroke(); g.strokeStyle = K; g.lineWidth = 1.7;
        const gl = g.createRadialGradient(0, -35, 1, 0, -35, 16); gl.addColorStop(0, `rgb(63 240 245 / ${0.8 * puls})`); gl.addColorStop(1, "rgb(63 240 245 / 0)"); g.fillStyle = gl; g.beginPath(); g.arc(0, -35, 16, 0, TAU); g.fill();
        g.fillStyle = "#1a2338"; g.beginPath(); g.arc(0, -35, 7.5, 0, TAU); g.fill(); g.stroke(); g.fillStyle = p.lys; g.beginPath(); g.arc(Math.cos(t.vinkel ?? 0) * 2.5, -35 + Math.sin(t.vinkel ?? 0) * 2.5, 3.4, 0, TAU); g.fill();
      } else {
        vegg(-9, -32, 18, 34); g.strokeStyle = p.v[1]; g.lineWidth = 1; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(-8, -6 - k * 7); g.lineTo(8, -6 - k * 7); g.stroke(); } g.strokeStyle = K; g.lineWidth = 1.7;
        vegg(-13, -39, 26, 8, 1); for (const q of [-13, -4, 5]) vegg(q, -45, 8, 7, 1); g.fillStyle = p.d; g.beginPath(); g.roundRect(-3, -9, 6, 11, [3, 3, 0, 0]); g.fill(); g.stroke(); vindu(-2, -24, 4, 6); flagg(0, -44, 13);
        g.save(); g.translate(0, -40); g.rotate(t.vinkel ?? -1.2); g.fillStyle = "#6b4526"; g.fillRect(0, -1.6, 13, 3.2); g.beginPath(); g.arc(6, 0, 7, -1.2, 1.2); g.stroke(); g.restore();
      }
      break;
    case "bank":
      if (ai) {
        for (const [x, h] of [[-15, 22], [-4, 30], [7, 22]]) { vegg(x, -h, 9, h + 2, 1); for (let q = 4; q < h - 2; q += 5) { g.fillStyle = Math.sin(tid * 6 + q * 3 + x) > 0 ? "#3ff0f5" : "#ffb03a"; g.fillRect(x + 2, -q - 1, 5, 2); } }
        g.fillStyle = "#ffb03a"; g.beginPath(); g.arc(0.5, -36, 5.5, 0, TAU); g.fill(); g.stroke(); g.fillStyle = K; g.font = "900 8px Archivo, system-ui"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("¤", 0.5, -35.6);
      } else {
        vegg(-17, -2, 34, 5, 1); for (const x of [-14, -5.5, 3, 11]) vegg(x - 0.5, -19, 5, 17, 1); vegg(-17, -23, 34, 4, 1); tak([[-19, -23], [0, -36], [19, -23]]); g.fillStyle = "#ffd84a"; g.beginPath(); g.arc(0, -28, 4, 0, TAU); g.fill(); g.lineWidth = 1.2; g.stroke(); g.lineWidth = 1.7; flagg(0, -35, 12);
      }
      break;
    case "skole":
      if (ai) {
        vegg(-16, -20, 32, 22, 2); for (let q = 0; q < 4; q++) { g.fillStyle = "#101828"; g.fillRect(-13 + q * 7, -17, 5, 16); for (let r = 0; r < 4; r++) { g.fillStyle = fast(q + r * 5, Math.floor(tid * 3)) > 0.5 ? "#8e5bd6" : "#3ff0f5"; g.fillRect(-12 + q * 7, -15 + r * 4, 3, 1.5); } }
        g.save(); g.translate(0, -20); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -7); g.stroke(); g.translate(0, -10); g.rotate(Math.sin(tid) * 0.6 - 0.5); g.fillStyle = "#b9c8dc"; g.beginPath(); g.arc(0, 0, 8, 0.2, Math.PI - 0.2); g.closePath(); g.fill(); g.stroke(); g.restore();
      } else {
        vegg(-17, -15, 34, 17); tak([[-20, -14], [-14, -24], [14, -24], [20, -14]]); vegg(-5, -35, 10, 13, 1); tak([[-8, -34], [0, -44], [8, -34]]); g.fillStyle = "#ffd84a"; g.beginPath(); g.arc(0 + Math.sin(tid * 3) * 1, -28, 2.8, 0, TAU); g.fill(); g.lineWidth = 1.2; g.stroke(); g.lineWidth = 1.7;
        vindu(-13, -10); vindu(9, -10); vindu(-7, -10, 3); vindu(4, -10, 3); g.fillStyle = p.d; g.beginPath(); g.roundRect(-2.5, -8, 5, 10, [2.5, 2.5, 0, 0]); g.fill(); g.stroke(); flagg(0, -43, 11);
      }
      break;
    default:
      if (ai) {
        const gl = g.createRadialGradient(0, -24, 2, 0, -24, 38); gl.addColorStop(0, `rgb(63 240 245 / ${0.45 * puls})`); gl.addColorStop(1, "rgb(63 240 245 / 0)"); g.fillStyle = gl; g.beginPath(); g.arc(0, -24, 38, 0, TAU); g.fill();
        vegg(-17, -8, 34, 10, 2, p.tak); vegg(-13, -44, 26, 38, 3); for (let q = 0; q < 4; q++) { g.fillStyle = "#101828"; g.fillRect(-10, -15 - q * 4.6, 20, 2.8); for (let r = 0; r < 5; r++) { g.fillStyle = fast(q * 9 + r, Math.floor(tid * 5)) > 0.45 ? "#3ff0f5" : "#24506a"; g.fillRect(-9 + r * 4, -14.4 - q * 4.6, 2.2, 1.5); } }
        g.fillStyle = "#0c1322"; g.beginPath(); g.ellipse(0, -38, 9.5, 5, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = "#ff3f6e"; g.beginPath(); g.arc(Math.sin(tid * 1.3) * 4, -38, 3.2, 0, TAU); g.fill();
        for (const q of [-9, 9]) { g.beginPath(); g.moveTo(q, -44); g.lineTo(q * 1.2, -53); g.stroke(); g.fillStyle = "#3ff0f5"; g.beginPath(); g.arc(q * 1.2, -53, 2, 0, TAU); g.fill(); }
      } else {
        vegg(-19, -18, 38, 20); tak([[-21, -17], [-16, -26], [16, -26], [21, -17]]); vegg(-8, -42, 16, 40, 2); tak([[-11, -41], [0, -55], [11, -41]]); g.fillStyle = "#fffaf0"; g.beginPath(); g.arc(0, -33, 5.4, 0, TAU); g.fill(); g.stroke(); g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, -33); g.lineTo(Math.sin(tid * 0.3) * 4, -33 - Math.cos(tid * 0.3) * 4); g.moveTo(0, -33); g.lineTo(2.4, -32); g.stroke(); g.lineWidth = 1.7;
        for (const x of [-16, -12.4, 9, 12.6]) vindu(x, -13, 2.8, 6); g.fillStyle = p.d; g.beginPath(); g.roundRect(-4, -12, 8, 14, [4, 4, 0, 0]); g.fill(); g.stroke(); flagg(0, -54, 14);
      }
  }
  if ((t.blink ?? 0) > 0) { g.globalAlpha = 0.45; g.fillStyle = "#fff"; g.beginPath(); g.ellipse(0, -16, 18, 20, 0, 0, TAU); g.fill(); g.globalAlpha = 1; }
  g.restore();
}
function tegnSkilt(g, t, valgt) {
  const n = String(Math.floor(t.folk)), full = t.eier && t.folk >= A.egen(t, "maks"), b = Math.max(22, 11 + n.length * 7.6), trinn = t.trinn, st = H > B ? 1.25 : 1;
  t = { x: 0, y: 0, eier: t.eier, folk: t.folk, type: t.type, trinn, px: t.x, py: t.y };
  const y = 0;
  g.save(); g.translate(t.px, t.py + 17); g.scale(st, st);
  g.fillStyle = t.eier === "ai" ? "#16324a" : t.eier ? "#fffaf0" : "#e9e3d6"; g.strokeStyle = valgt ? "#ffd84a" : K; g.lineWidth = valgt ? 2.6 : 1.6;
  g.beginPath(); g.roundRect(t.x - b / 2, y - 8, b, 16, 8); g.fill(); g.stroke();
  g.fillStyle = t.eier === "ai" ? "#7df3f7" : K; g.font = "900 12px Archivo, system-ui"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(n, t.x, y + 0.8);
  if (full) { g.fillStyle = "#ffb03a"; g.beginPath(); g.arc(t.x + b / 2, y - 6, 3, 0, TAU); g.fill(); g.lineWidth = 1; g.strokeStyle = K; g.stroke(); }
  for (let k = 1; k < trinn; k++) { g.fillStyle = "#ffd84a"; g.strokeStyle = K; g.lineWidth = 1; const x = t.x - b / 2 - 5, yy = y + 4 - (k - 1) * 8; g.beginPath(); for (let q = 0; q < 10; q++) { const u = (q / 10) * TAU - Math.PI / 2, r = q % 2 ? 1.9 : 4.2; g.lineTo(x + Math.cos(u) * r, yy + Math.sin(u) * r); } g.closePath(); g.fill(); g.stroke(); }
  g.restore();
}

/** Et lite bilde av brettet til nivålista. */
export function aiBilde(niva) {
  A.snu(false);
  ({ b: B, h: H } = A.flate());
  const b = A.aiBrett(niva), t = TEMA[b.tema];
  return `<svg viewBox="0 0 ${B} ${H}" aria-hidden="true"><rect width="${B}" height="${H}" fill="${b.oyer ? t.vann[0] : t.mark[0]}"/>${(b.oyer ?? b.vann ?? []).map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${b.oyer ? t.mark[0] : t.vann[0]}"/>`).join("")}${b.elv ? `<polyline points="${b.elv.punkter.join(" ")}" fill="none" stroke="${t.vann[0]}" stroke-width="${b.elv.bredde}"/>` : ""}<g stroke="${t.vei[1]}" stroke-width="13">${A.veier(niva).map(([i, j]) => `<path d="M${b.tarn[i][0]} ${b.tarn[i][1]}L${b.tarn[j][0]} ${b.tarn[j][1]}"/>`).join("")}</g>${b.tarn.map(([x, y, type, eier]) => `<circle cx="${x}" cy="${y}" r="${type === "kjerne" ? 32 : 21}" fill="${FARGE[eier]}" stroke="${K}" stroke-width="7"/>`).join("")}</svg>`;
}

// ---------- Skjermen ----------

const IKON = {
  dugnad: '<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3.4"/><circle cx="16.5" cy="8" r="3.4"/><path d="M2.5 20q0-7 5.5-7t5.5 7zM11 20q.5-7 5.5-7t5 7z"/></svg>',
  strom: '<svg viewBox="0 0 24 24"><path d="M13.5 2L5 13.5h5.5L9 22l9.5-12.5h-6z"/></svg>',
  mur: '<svg viewBox="0 0 24 24"><path d="M12 2l8.5 3v6.5q0 7-8.5 10.5-8.5-3.500-8.500-10.500V5z"/></svg>',
};
export function ossmotai(rot, niva, { ferdig, lyd }) {
  A.snu(staaende.matches);
  ({ b: B, h: H } = A.flate());
  const brett = A.aiBrett(niva);
  rot.append(
    lag('<div class="vakt-hode"><span class="vakt-tall vakt-kr"></span><span class="vakt-tall ai-laert"></span><button type="button" class="mini-bryter vakt-fart" aria-pressed="false">Dobbel fart</button></div>'),
    lag('<div class="ai-vekt" role="img"><i class="oss"></i><i class="ai"></i><b class="oss"></b><b class="ai"></b></div>'),
    lag('<div class="vakt-brett"><canvas class="mini-lerret ai-lerret" tabindex="0" aria-label="Brettet i Oss mot AI. Piltaster flytter mellom tårnene, Enter velger eller sender."></canvas><p class="vakt-melding" role="status" hidden></p></div>'),
    lag('<div class="ai-krefter"></div>'), lag('<div class="vakt-panel ai-panel"></div>'));
  const q = (k) => rot.querySelector(k), lerret = q("canvas"), g = skarpt(lerret, B, H), melding = q(".vakt-melding"), panel = q(".ai-panel"), fart = q(".vakt-fart"), vekt = q(".ai-vekt");
  lerret.style.aspectRatio = `${B} / ${H}`;
  lerret.style.setProperty("--form", (B / H).toFixed(3));
  const bakgrunn = lagBakgrunn(niva, lerret.width / B);
  let s = A.lagKamp(niva), slutt = false, tid = 0, dobbelt = false, andel = 0.5, valgte = new Set(), drag = null, sikter = false, peker = null, mark = null, meldingTil = 0, panelNokkel = "", rist = 0, moteLyd = 0, skuddLyd = 0, marsjLyd = 0, info = null;
  const bit = [];
  const legg = (o) => { if (bit.length > 320) bit.shift(); bit.push({ t: 0, ...o }); };
  const si = (tekst, sek = 3.4) => { settTekst(melding, tekst); melding.hidden = false; meldingTil = tid + sek; };
  const oss = (t) => t?.eier === "oss", egne = () => s.tarn.filter(oss);

  // ---------- Krefter og knapper
  const krefter = Object.entries(A.KREFTER).map(([id, k], i) => {
    const b = lag(`<button type="button" class="ai-kraft ${id}"><span class="ai-ikon">${IKON[id]}</span><b>${k.navn}</b><small></small><span class="pris">${k.pris} kr</span><kbd>${i + 1}</kbd><i></i></button>`);
    b.querySelector("small").textContent = k.tekst;
    b.addEventListener("click", () => kraft(id));
    q(".ai-krefter").append(b);
    return { id, k, b, i: b.querySelector("i") };
  });
  function kraft(id) {
    const mal = id === "mur" ? [...valgte].map((i) => s.tarn[i]).find(oss) ?? null : null;
    if (id === "mur" && !mal) { lyd("feil"); si("Velg et av tårnene dine først.", 1.8); return; }
    if (!A.brukKraft(s, id, mal?.id ?? -1)) { lyd("feil"); si(s.vent[id] > 0 ? `Klar om ${Math.ceil(s.vent[id])} sek.` : "Du har ikke råd ennå.", 1.6); return; }
    lyd("aiKraft", id);
    if (id === "dugnad") for (const t of egne()) { legg({ type: "tekst", x: t.x, y: t.y - 30, tekst: "+5", f: "#fff3b0", liv: 1, stor: 15 }); legg({ type: "ring", x: t.x, y: t.y, r: 40, liv: 0.6, f: GLOD.oss }); }
    if (id === "strom") { rist = 5; for (const t of s.tarn) if (t.eier === "ai") for (let k = 0; k < 6; k++) legg({ type: "gnist", x: t.x, y: t.y - 18, vx: (Math.random() - 0.5) * 160, vy: -Math.random() * 120, liv: 0.6, f: "#ffe58a", r: 2.4 }); si("Strømmen er borte. Maskinene står stille!", 2.4); }
    if (id === "mur") legg({ type: "ring", x: mal.x, y: mal.y - 12, r: 44, liv: 0.6, f: "255 255 255" });
    panelNokkel = "";
  }
  fart.addEventListener("click", () => { dobbelt = !dobbelt; fart.setAttribute("aria-pressed", String(dobbelt)); lyd("klikk"); });

  // ---------- Sending
  function sendTil(kilder, til) {
    let n = 0;
    for (const i of kilder) if (i !== til) n += A.send(s, i, til, Math.max(1, A.ledige(s.tarn[i]) * andel));
    if (n) { lyd("aiMarsj"); const t = s.tarn[til]; legg({ type: "mal", x: t.x, y: t.y, liv: 0.6, f: oss(t) ? GLOD.oss : "255 80 60" }); } else { lyd("feil"); si("Ingen kan gå derfra akkurat nå.", 1.4); }
  }
  const punkt = (e) => { const b = lerret.getBoundingClientRect(); return [((e.clientX - b.left) / b.width) * B, ((e.clientY - b.top) / b.height) * H]; };
  const naermest = (x, y, maks = 40) => { let best = null, bd = maks; for (const t of s.tarn) { const a = Math.min(Math.hypot(t.x - x, t.y - y), Math.hypot(t.x - x, t.y - 24 - y)); if (a < bd) { bd = a; best = t; } } return best; };
  lerret.addEventListener("pointerdown", (e) => {
    if (slutt || drag) return;
    const [x, y] = punkt(e), t = naermest(x, y);
    peker = [x, y]; mark = null;
    try { lerret.setPointerCapture(e.pointerId); } catch { /* valgfritt */ }
    if (t && sikter) { for (const i of valgte) A.settFast(s, i, t.id); lyd("bygg"); si(`Fast overføring til ${navn(t)}.`, 1.8); sikter = false; panelNokkel = ""; return; }
    drag = { id: e.pointerId, fra: [x, y], start: t, kilder: new Set(oss(t) ? [t.id] : []), flyttet: false };
  });
  lerret.addEventListener("pointermove", (e) => {
    peker = punkt(e);
    if (!drag || drag.id !== e.pointerId) return;
    const [x, y] = peker;
    if (Math.hypot(x - drag.fra[0], y - drag.fra[1]) > 16) drag.flyttet = true;
    if (!drag.flyttet || !drag.kilder.size) return;
    const t = naermest(x, y, 30);
    if (oss(t)) drag.kilder.add(t.id);
  });
  const slipp = (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    const [x, y] = punkt(e), t = naermest(x, y), d = drag;
    drag = null; panelNokkel = "";
    if (slutt) return;
    if (d.flyttet && d.kilder.size) {
      if (t && (d.kilder.size > 1 || !d.kilder.has(t.id))) { sendTil(d.kilder, t.id); valgte.clear(); }
      else { valgte = new Set(d.kilder); info = null; }
      return;
    }
    if (d.flyttet) return;
    trykk(t);
  };
  lerret.addEventListener("pointerup", slipp);
  lerret.addEventListener("pointercancel", () => { drag = null; });
  lerret.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") peker = null; });
  function trykk(t) {
    panelNokkel = "";
    if (!t) { valgte.clear(); info = null; sikter = false; return; }
    if (oss(t)) { info = null; if (valgte.has(t.id) && valgte.size === 1) valgte.clear(); else valgte = new Set([t.id]); lyd("klikk"); return; }
    if (valgte.size) { sendTil(valgte, t.id); return; }
    info = t.id; lyd("klikk");
  }
  const navn = (t) => A.navnPa(t).toLowerCase();
  const tast = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Escape" && (valgte.size || sikter || info !== null)) { e.preventDefault(); e.stopPropagation(); valgte.clear(); sikter = false; info = null; panelNokkel = ""; return; }
    const id = Object.keys(A.KREFTER)[Number(e.key) - 1];
    if (id) { kraft(id); return; }
    if (e.key === "u" || e.key === "U") { oppgraderValgt(); return; }
    if (document.activeElement !== lerret) return;
    const r = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
    if (r) {
      e.preventDefault();
      const fra = s.tarn[mark] ?? egne()[0] ?? s.tarn[0];
      let best = fra, bd = Infinity;
      if (mark !== null) for (const t of s.tarn) { const dx = t.x - fra.x, dy = t.y - fra.y, langs = dx * r[0] + dy * r[1], tvers = Math.abs(dx * r[1]) + Math.abs(dy * r[0]); if (t !== fra && langs > 8 && langs + tvers * 2 < bd) { bd = langs + tvers * 2; best = t; } }
      mark = best.id;
      lerret.setAttribute("aria-label", `${A.navnPa(best)}, ${oss(best) ? "vårt" : best.eier ? "maskinenes" : "ledig"}, ${Math.floor(best.folk)} inni. Enter velger eller sender.`);
    }
    if ((e.key === "Enter" || e.key === " ") && mark !== null) { e.preventDefault(); const t = s.tarn[mark]; if (oss(t) && valgte.size && !valgte.has(t.id) && e.shiftKey) sendTil(valgte, t.id); else trykk(t); }
  };
  document.addEventListener("keydown", tast, true);
  function oppgraderValgt() {
    const t = s.tarn[[...valgte][0]];
    if (!t) return;
    if (A.oppgrader(s, t.id)) { lyd("bygg"); for (let k = 0; k < 16; k++) legg({ type: "gnist", x: t.x, y: t.y - 16, vx: Math.cos(k) * 70, vy: Math.sin(k) * 60 - 50, liv: 0.7, f: "#ffd84a", r: 3 }); } else lyd("feil");
    panelNokkel = "";
  }

  // ---------- Panelet under brettet
  function tegnPanel() {
    for (const i of [...valgte]) if (!oss(s.tarn[i])) valgte.delete(i);
    if (!valgte.size) sikter = false;
    const t = valgte.size === 1 ? s.tarn[[...valgte][0]] : null, i = info !== null ? s.tarn[info] : null;
    const nokkel = `${[...valgte]}|${t ? `${t.type}${t.trinn}${t.fast}${A.oppgraderPris(t) <= s.kr.oss}${A.BYGGBARE.map((b) => A.TYPER[b].bygg <= s.kr.oss)}` : ""}|${sikter}${andel}|${i ? `${i.type}${i.eier}${i.trinn}` : ""}`;
    if (nokkel === panelNokkel) return;
    panelNokkel = nokkel;
    const rad = lag(`<div class="ai-rad"><span class="ai-andel" role="group" aria-label="Hvor mange som går"><button type="button" class="mini-bryter" aria-pressed="${andel < 1}">Halvparten</button><button type="button" class="mini-bryter" aria-pressed="${andel === 1}">Alle</button></span><button type="button" class="mini-bryter ai-alle">Velg alle tårnene</button></div>`);
    const [halv, alle, velg] = rad.querySelectorAll("button");
    halv.addEventListener("click", () => { andel = 0.5; lyd("klikk"); panelNokkel = ""; });
    alle.addEventListener("click", () => { andel = 1; lyd("klikk"); panelNokkel = ""; });
    velg.addEventListener("click", () => { valgte = new Set(egne().map((x) => x.id)); info = null; lyd("klikk"); panelNokkel = ""; });
    const ut = [rad];
    if (valgte.size) {
      const kort = lag('<div class="ai-kort"><div class="ai-kort-hode"><canvas></canvas><div><b></b><small></small></div></div><div class="ai-knapper"></div></div>'), kn = kort.querySelector(".ai-knapper");
      const bilde = skarpt(kort.querySelector("canvas"), 56, 62);
      bilde.translate(28, 54);
      tegnTarn(bilde, { ...(t ?? s.tarn[[...valgte][0]]), x: 0, y: -3, blink: 0 }, 0);
      kort.querySelector("b").textContent = t ? `${A.navnPa(t)}${t.trinn > 1 ? `, trinn ${t.trinn}` : ""}` : `${valgte.size} tårn er valgt`;
      kort.querySelector("small").textContent = sikter ? "Trykk på tårnet de skal gå til." : t ? `${A.TYPER[t.type].tekst} Plass til ${A.egen(t, "maks")}.` : "Trykk på et mål, så går de samlet.";
      const knapp = (tekst, pris, gjor, kan = true, klasse = "") => { const b = lag(`<button type="button" class="ai-knapp ${klasse}"><b></b>${pris ? `<span class="pris">${pris} kr</span>` : ""}</button>`); b.querySelector("b").textContent = tekst; settAttr(b, "aria-disabled", kan ? "false" : "true"); b.addEventListener("click", gjor); kn.append(b); return b; };
      if (t) {
        const p = A.oppgraderPris(t);
        if (Number.isFinite(p)) knapp("Oppgrader", p, oppgraderValgt, p <= s.kr.oss, "hoved"); else knapp("Ferdig oppgradert", 0, () => lyd("feil"), false);
        for (const b of A.BYGGBARE) if (A.kanBygge(t, b)) knapp(`Til ${A.TYPER[b].navn.toLowerCase()}`, A.TYPER[b].bygg, () => { if (A.byggOm(s, t.id, b)) { lyd("bygg"); for (let k = 0; k < 14; k++) legg({ type: "stov", x: t.x, y: t.y, vx: Math.cos(k) * 60, vy: Math.sin(k) * 26 - 20, liv: 0.6, f: "#cbb48a", r: 4 }); } else lyd("feil"); panelNokkel = ""; }, A.TYPER[b].bygg <= s.kr.oss).title = `Bygg om til ${A.TYPER[b].navn.toLowerCase()}: ${A.TYPER[b].tekst}`;
      }
      if (t && t.fast !== null) knapp("Stopp fast overføring", 0, () => { A.settFast(s, t.id, null); lyd("klikk"); panelNokkel = ""; }, true, "paa");
      else knapp(sikter ? "Avbryt" : "Fast overføring", 0, () => { sikter = !sikter; lyd("klikk"); panelNokkel = ""; }, true, sikter ? "paa" : "");
      ut.push(kort);
    } else {
      const p = lag('<p class="ai-tips"></p>');
      p.textContent = i ? `${A.navnPa(i)}: ${A.TYPER[i.type].tekst} ${i.eier === "ai" ? "Maskinene har det." : "Ingen har det ennå."}` : "Dra fra et av tårnene dine til et annet. Dra over flere for å samle dem.";
      ut.push(p);
    }
    panel.replaceChildren(...ut);
  }

  function hendelser(liste, naa) {
    for (const h of liste) {
      const [x, y] = h.p ?? [0, 0];
      if (h.type === "mote") { if (naa - moteLyd > 90) { moteLyd = naa; lyd("aiMote"); } for (let k = 0; k < 3; k++) legg({ type: "gnist", x, y: y - 6, vx: (Math.random() - 0.5) * 110, vy: -Math.random() * 90, liv: 0.35, f: k % 2 ? "#ffe58a" : "#7df3f7", r: 2 }); }
      if (h.type === "slag" && Math.random() < 0.5) legg({ type: "stov", x, y: y - 4, vx: (Math.random() - 0.5) * 50, vy: -30, liv: 0.4, f: "#e9dcc4", r: 3 });
      if (h.type === "mur" && Math.random() < 0.5) legg({ type: "gnist", x: x + (Math.random() - 0.5) * 40, y: y - 10, vx: 0, vy: -40, liv: 0.4, f: "#fff", r: 2.4 });
      if (h.type === "skudd") { if (naa - skuddLyd > 110) { skuddLyd = naa; lyd("aiSkudd", h.eier); } legg({ type: "skudd", x: 0, y: 0, fra: [x, y - 38], til: [h.til[0], h.til[1] - 6], liv: h.eier === "ai" ? 0.14 : 0.18, ai: h.eier === "ai" }); }
      if (h.type === "tatt") {
        const t = s.tarn[h.id];
        lyd(h.eier === "oss" ? "aiTatt" : h.for === "oss" ? "aiTapt" : "klikk");
        if (h.for === "oss") { rist = 5; si(`Maskinene tok ${navn({ ...t, eier: "oss" })}.`, 1.8); }
        legg({ type: "ring", x, y, r: 62, liv: 0.7, f: GLOD[h.eier] });
        for (let k = 0; k < 18; k++) legg({ type: "lapp", x, y: y - 14, vx: (Math.random() - 0.5) * 190, vy: -60 - Math.random() * 110, liv: 0.9, f: h.eier === "oss" ? ["#ffd84a", "#f0533a", "#fffaf0"][k % 3] : ["#3ff0f5", "#8e5bd6", "#1a2338"][k % 3], r: 2 + Math.random() * 2.5, v: Math.random() * 6 });
        if (t.type === "kjerne" && h.eier === "oss") { rist = 10; const n = s.tarn.filter((k) => k.type === "kjerne" && k.eier === "ai").length; si(n ? `En server er tatt! ${n} igjen.` : "Serveren er tatt!", 3); }
        if (h.eier === "oss") legg({ type: "tekst", x, y: y - 44, tekst: "Vårt!", f: "#ffe58a", liv: 1.1, stor: 16 });
        panelNokkel = "";
      }
      if (h.type === "hackVarsel") { lyd("aiHack"); si("Hackeren sikter seg inn. Bruk Brannmur, eller send folkene videre!", 3); }
      if (h.type === "hacket") { lyd("aiTapt"); rist = 4; legg({ type: "ring", x, y: y - 14, r: 50, liv: 0.6, f: "255 60 120" }); }
    }
  }

  // ---------- Tegning
  const glod = {};
  for (const [k, f] of Object.entries(GLOD)) { const c = document.createElement("canvas"), x = c.getContext("2d"); c.width = c.height = 128; const gr = x.createRadialGradient(64, 64, 8, 64, 64, 64); gr.addColorStop(0, `rgb(${f} / 0.6)`); gr.addColorStop(1, `rgb(${f} / 0)`); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); glod[k] = c; }
  const pil = (x0, y0, x1, y1, f, br = 5) => { const a = Math.atan2(y1 - y0, x1 - x0), l = Math.hypot(x1 - x0, y1 - y0); if (l < 24) return; const ex = x1 - Math.cos(a) * 16, ey = y1 - Math.sin(a) * 16; g.strokeStyle = f; g.fillStyle = f; g.lineWidth = br; g.lineCap = "round"; g.setLineDash([9, 8]); g.lineDashOffset = -tid * 40; g.beginPath(); g.moveTo(x0, y0); g.lineTo(ex, ey); g.stroke(); g.setLineDash([]); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - Math.cos(a - 0.45) * 20, y1 - Math.sin(a - 0.45) * 20); g.lineTo(x1 - Math.cos(a + 0.45) * 20, y1 - Math.sin(a + 0.45) * 20); g.closePath(); g.fill(); };
  function tegn(dt) {
    g.save();
    rist = Math.max(0, rist - dt * 20);
    if (rist && !rolig.matches) g.translate((Math.random() - 0.5) * rist, (Math.random() - 0.5) * rist);
    g.drawImage(bakgrunn, 0, 0, B, H);
    for (const t of s.tarn) if (t.eier) {
      g.drawImage(glod[t.eier], t.x - 58, t.y - 40, 116, 80);
      g.strokeStyle = `rgb(${GLOD[t.eier]} / 0.85)`; g.lineWidth = 2.4; g.beginPath(); g.ellipse(t.x, t.y, RX - 6.5, RY - 6, 0, 0, TAU); g.stroke();
    }
    for (const t of s.tarn) {
      const valgt = valgte.has(t.id) || drag?.kilder.has(t.id);
      if (valgt || info === t.id || mark === t.id) {
        const r = A.egen(t, "rekke");
        if (r) { g.fillStyle = "rgb(255 255 255 / 0.12)"; g.strokeStyle = "rgb(255 255 255 / 0.7)"; g.lineWidth = 1.6; g.setLineDash([6, 6]); g.beginPath(); g.ellipse(t.x, t.y, r, r / 1.25, 0, 0, TAU); g.fill(); g.stroke(); g.setLineDash([]); }
        g.strokeStyle = mark === t.id ? "#fff" : "#ffd84a"; g.lineWidth = 3.5; g.setLineDash([8, 5]); g.lineDashOffset = -tid * 22; g.beginPath(); g.ellipse(t.x, t.y, RX + 7, RY + 6, 0, 0, TAU); g.stroke(); g.setLineDash([]);
      }
      if (oss(t) && t.fast !== null) { const m = s.tarn[t.fast]; g.globalAlpha = 0.75; pil(t.x, t.y, t.x + (m.x - t.x) * 0.72, t.y + (m.y - t.y) * 0.72, "#ffd84a", 3); g.globalAlpha = 1; }
    }
    const ting = [...s.tarn.map((t) => ({ y: t.y + 2, t })), ...s.folk.map((f) => ({ y: f.y, f }))].sort((a, b) => a.y - b.y);
    for (const { t, f } of ting) {
      if (f) { const steg = Math.floor(f.d / 5) % 2, st = f.eier === "ai" && s.stille > 0; g.drawImage(figur(f.eier, f.liv > 1.05, st ? 0 : steg), f.x - 9 + f.side * 0.9, f.y - 17 + f.side * 0.5 - (st ? 0 : steg), 18, 21); continue; }
      tegnTarn(g, t, t.eier === "ai" && s.stille > 0 ? 0 : tid);
      if (t.mur > 0) { g.strokeStyle = `rgb(255 255 255 / ${0.7 + 0.3 * Math.sin(tid * 8)})`; g.fillStyle = "rgb(255 200 90 / 0.22)"; g.lineWidth = 2.5; g.beginPath(); g.ellipse(t.x, t.y - 14, 33, 34, 0, 0, TAU); g.fill(); g.stroke(); }
      if (t.hacket > 0) for (let k = 0; k < 5; k++) { g.fillStyle = ["#ff3f7a", "#3ff0f5", "#101828"][k % 3]; g.fillRect(t.x - 18 + fast(k, Math.floor(tid * 14)) * 28, t.y - 42 + fast(k + 9, Math.floor(tid * 14)) * 44, 6 + fast(k, 3) * 10, 2.6); }
    }
    if (s.hack) { const t = s.tarn[s.hack.id], u = s.hack.om / A.VARSEL; g.strokeStyle = "#ff3f7a"; g.lineWidth = 3; g.beginPath(); g.arc(t.x, t.y - 14, 24 + 34 * u, 0, TAU); g.moveTo(t.x - 60, t.y - 14); g.lineTo(t.x - 26, t.y - 14); g.moveTo(t.x + 26, t.y - 14); g.lineTo(t.x + 60, t.y - 14); g.stroke(); }
    if (s.stille > 0) for (const t of s.tarn) if (t.eier === "ai") { g.fillStyle = "rgb(10 14 26 / 0.45)"; g.beginPath(); g.ellipse(t.x, t.y - 14, 26, 30, 0, 0, TAU); g.fill(); }
    for (const t of s.tarn) tegnSkilt(g, t, valgte.has(t.id) || drag?.kilder.has(t.id));
    if (drag?.flyttet && peker && drag.kilder.size) { const m = naermest(peker[0], peker[1]), til = m && (drag.kilder.size > 1 || !drag.kilder.has(m.id)) ? [m.x, m.y] : peker; g.globalAlpha = 0.9; for (const i of drag.kilder) if (!m || m.id !== i) pil(s.tarn[i].x, s.tarn[i].y, til[0], til[1], m && !oss(m) ? "#e8352e" : "#ffd84a"); g.globalAlpha = 1; }
    else if (valgte.size && peker && !drag) { const m = naermest(peker[0], peker[1]); if (m && (sikter || !oss(m))) { g.globalAlpha = 0.7; for (const i of valgte) if (i !== m.id) pil(s.tarn[i].x, s.tarn[i].y, m.x, m.y, sikter ? "#ffd84a" : "#e8352e", 4); g.globalAlpha = 1; } }
    for (const p of bit) {
      p.t += dt;
      const u = Math.min(1, p.t / p.liv);
      if (p.vx !== undefined) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.type === "stov" ? 20 : 250) * dt; p.vx *= 1 - 2 * dt; }
      g.globalAlpha = 1 - u * u;
      if (p.type === "tekst") { g.font = `900 ${p.stor ?? 13}px Archivo, system-ui`; g.textAlign = "center"; g.textBaseline = "alphabetic"; g.lineWidth = 3.5; g.strokeStyle = "rgb(43 33 24 / 0.85)"; g.strokeText(p.tekst, p.x, p.y - u * 22); g.fillStyle = p.f; g.fillText(p.tekst, p.x, p.y - u * 22); }
      else if (p.type === "ring") { g.strokeStyle = `rgb(${p.f} / ${0.95 * (1 - u)})`; g.lineWidth = 7 * (1 - u) + 1; g.beginPath(); g.ellipse(p.x, p.y, p.r * (0.3 + 0.7 * u), p.r * (0.3 + 0.7 * u) * 0.7, 0, 0, TAU); g.stroke(); }
      else if (p.type === "mal") { g.strokeStyle = `rgb(${p.f} / ${1 - u})`; g.lineWidth = 4; g.beginPath(); g.ellipse(p.x, p.y, (RX + 22) * (1 - 0.45 * u), (RY + 18) * (1 - 0.45 * u), 0, 0, TAU); g.stroke(); }
      else if (p.type === "skudd") { if (p.ai) { for (const [br, f] of [[5, "rgb(63 240 245 / 0.4)"], [1.8, "#eaffff"]]) { g.strokeStyle = f; g.lineWidth = br; g.beginPath(); g.moveTo(...p.fra); g.lineTo(...p.til); g.stroke(); } } else { const a = Math.atan2(p.til[1] - p.fra[1], p.til[0] - p.fra[0]), x = p.fra[0] + (p.til[0] - p.fra[0]) * u, y = p.fra[1] + (p.til[1] - p.fra[1]) * u; g.globalAlpha = 1; g.strokeStyle = "#4a3018"; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x - Math.cos(a) * 11, y - Math.sin(a) * 11); g.lineTo(x, y); g.stroke(); } }
      else if (p.type === "lapp") { g.save(); g.translate(p.x, p.y); g.rotate(p.v + p.t * 9); g.fillStyle = p.f; g.fillRect(-p.r, -p.r * 0.7, p.r * 2, p.r * 1.4); g.restore(); }
      else { g.fillStyle = p.f; g.beginPath(); g.arc(p.x, p.y, Math.max(0.3, p.r * (1 - u * 0.6)), 0, TAU); g.fill(); }
      g.globalAlpha = 1;
    }
    for (let i = bit.length - 1; i >= 0; i--) if (bit[i].t >= bit[i].liv) bit.splice(i, 1);
    g.restore();
  }

  let sist = performance.now(), ramme = requestAnimationFrame(function bilde(naa) {
    ramme = requestAnimationFrame(bilde);
    const dt = Math.min(0.1, (naa - sist) / 1000);
    sist = naa;
    if (document.hidden) return;
    tid += dt;
    if (!slutt) {
      let rest = dt * (dobbelt ? 2 : 1);
      while (rest > 0 && !s.ferdig) { const st = Math.min(1 / 30, rest); rest -= st; hendelser(A.kampSteg(s, st), naa); }
      if (naa - marsjLyd > 340 && s.folk.some((f) => f.eier === "oss")) { marsjLyd = naa; lyd("aiSteg"); }
    }
    settTekst(q(".vakt-kr"), `${Math.floor(s.kr.oss)} kr`); settTekst(q(".ai-laert"), `AI har lært ${Math.round(s.laert * 100)} %`);
    const sum = (e) => s.tarn.reduce((a, t) => a + (t.eier === e ? t.folk : 0), 0) + s.folk.filter((f) => f.eier === e).length, o = Math.round(sum("oss")), a = Math.round(sum("ai"));
    const k = Math.round((100 * o) / Math.max(1, o + a));
    vekt.style.setProperty("--oss", `${k}%`);
    settTekst(vekt.querySelector("b.oss"), `Oss ${o}`); settTekst(vekt.querySelector("b.ai"), `AI ${a}`);
    settAttr(vekt, "aria-label", `Vi er ${o}, maskinene er ${a}`);
    for (const x of krefter) { settAttr(x.b, "aria-disabled", s.vent[x.id] > 0 || s.kr.oss < x.k.pris ? "true" : "false"); x.i.style.transform = `scaleX(${(s.vent[x.id] / x.k.vent).toFixed(3)})`; }
    if (!melding.hidden && tid > meldingTil) melding.hidden = true;
    tegnPanel(); tegn(dt);
    if (s.ferdig && !slutt) {
      slutt = true;
      const min = Math.floor(s.tid / 60), sek = String(Math.floor(s.tid % 60)).padStart(2, "0");
      ferdig(s.ferdig === "vunnet", s.ferdig === "vunnet" ? `Alle serverne er våre etter ${min}:${sek}. Du tok ${s.statistikk.tatt} tårn.` : `Maskinene tok rådhuset etter ${min}:${sek}. Hold igjen nok folk der neste gang.`);
    }
  });
  const servere = brett.tarn.filter((t) => t[2] === "kjerne" && t[3] === "ai").length;
  si(servere > 1 ? `Ta alle de ${["", "", "to", "tre"][servere]} serverne, og pass på rådhuset.` : "Ta serveren, og pass på rådhuset.", 5);
  return () => { slutt = true; cancelAnimationFrame(ramme); document.removeEventListener("keydown", tast, true); };
}
