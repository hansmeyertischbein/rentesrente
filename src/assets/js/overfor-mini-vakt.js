// Skjermen til Grisevakta. Reglene ligger i /lib/mini-vakt.js.
import * as V from "/lib/mini-vakt.js";
import { lagGris } from "./klikker-figurer.js";
import { lag, settTekst, settAttr, rolig } from "./overfor-felles.js";
import { skarpt } from "./overfor-mini-brett.js";

const K = "#2b2118", TAU = Math.PI * 2, { b: B, h: H } = V.FLATE;
const svgBilde = (kode) => { const i = new Image(); i.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(kode.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ')); return i; };
const fast = (a, b = 0) => { let h = Math.imul(a + 374761393, 668265263) ^ Math.imul(b + 1274126177, 2246822519); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// ---------- Brettet, tegnet én gang ----------

const TEMA = [
  { gress: ["#a8d07f", "#9ac572", "#b7db8f"], vei: ["#8c6a40", "#e2c795", "#d4b580"], tre: ["#4f8f48", "#6cae58", "#3c7540"] },
  { gress: ["#e6cf95", "#dcc283", "#f0dca9"], vei: ["#8b5a36", "#c9976a", "#b98658"], tre: ["#6f9a4b", "#8ab45d", "#55803a"] },
  { gress: ["#8fc48a", "#82b87f", "#a2d29a"], vei: ["#5d5a66", "#bcb8c2", "#a9a5b1"], tre: ["#3f7d5a", "#57986f", "#2f6448"] },
  { gress: ["#dfe9f2", "#d0deea", "#eef4f9"], vei: ["#6c7c8e", "#b9c7d6", "#a6b6c8"], tre: ["#5f8f86", "#7fb0a4", "#47746d"] },
  { gress: ["#9b93c0", "#8d85b4", "#aba4cd"], vei: ["#3e3558", "#6f6494", "#61568a"], tre: ["#53508c", "#6d69a8", "#403d70"] },
  { gress: ["#b4d98c", "#a4cb7b", "#c4e59f"], vei: ["#7d6a4a", "#ead9b0", "#d6c294"], tre: ["#4f9a58", "#6cb868", "#3c7f45"] },
  { gress: ["#f0b9a0", "#e6ab90", "#f6c9b4"], vei: ["#7a3f3a", "#f3dfc6", "#dfc4a4"], tre: ["#c4623f", "#dc8150", "#9c4a30"] },
  { gress: ["#b7c98a", "#a9bc7b", "#c6d79c"], vei: ["#6b5a3e", "#cdbb92", "#b9a67c"], tre: ["#7b8f3e", "#97ab52", "#617430"] },
  { gress: ["#a6d8c9", "#95cbbb", "#b8e4d7"], vei: ["#3f6f6a", "#e6f0dc", "#cbdcc2"], tre: ["#2f8f82", "#4bab9c", "#23736a"] },
  { gress: ["#5f6f9c", "#54638f", "#6d7dab"], vei: ["#262e4d", "#a9b2cf", "#929cbd"], tre: ["#3b6f8f", "#4f8bab", "#2c5672"] },
];
function lagBakgrunn(niva, skala) {
  const c = document.createElement("canvas"), g = c.getContext("2d"), t = TEMA[niva - 1], { stier, vann = [], elv } = V.brett(niva);
  c.width = B * skala; c.height = H * skala; g.scale(skala, skala);
  g.fillStyle = t.gress[0]; g.fillRect(0, 0, B, H);
  for (let i = 0; i < 1100; i++) { g.fillStyle = t.gress[1 + (i % 2)]; const x = fast(i, 1) * B, y = fast(i, 2) * H, l = 2 + fast(i, 3) * 5; g.globalAlpha = 0.75; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 1.6, y - l); g.lineTo(x + 3.2, y); g.fill(); }
  for (let i = 0; i < 26; i++) { g.globalAlpha = 0.16; g.fillStyle = t.gress[2]; g.beginPath(); g.ellipse(fast(i, 11) * B, fast(i, 12) * H, 30 + fast(i, 13) * 60, 16 + fast(i, 14) * 26, fast(i, 15) * 3, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  g.lineJoin = g.lineCap = "round";
  for (const [x, y, rx, ry] of vann) for (const [k, f] of [[7, "#8a7a58"], [3, "#5fa9c9"], [0, "#4f9fd0"]]) { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx + k, ry + k, 0, 0, TAU); g.fill(); }
  if (elv) for (const [k, f] of [[12, "#8a7a58"], [4, "#5fa9c9"], [0, "#4f9fd0"]]) { g.strokeStyle = f; g.lineWidth = elv.bredde + k; g.beginPath(); elv.punkter.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); }
  g.strokeStyle = "#8fd0ea"; g.lineWidth = 1.6;
  for (let k = 0; k < 900; k++) { const x = fast(k, 51) * B, y = fast(k, 61) * H; if (!V.iVann(niva, x, y) || !V.iVann(niva, x + 10, y)) continue; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 3, y - 2.4, x + 5, y); g.quadraticCurveTo(x + 7.5, y + 2, x + 10, y); g.stroke(); }
  const spor = () => { g.beginPath(); for (const sti of stier) sti.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); };
  for (const [br, f, dy] of [[54, "rgb(43 33 24 / 0.22)", 4], [50, t.vei[0], 0], [43, t.vei[2], 0], [36, t.vei[1], 0]]) { g.save(); g.translate(0, dy); g.strokeStyle = f; g.lineWidth = br; spor(); g.stroke(); g.restore(); }
  for (let vei = 0; vei < stier.length; vei++) for (let d = 0, L = V.lengdeFor(niva, "regning", vei); d < L; d += 5) {   // broer over vann
    const [x, y] = V.paaSti(niva, d, false, vei), [x2, y2] = V.paaSti(niva, d + 2, false, vei);
    if (!V.iVann(niva, x, y, 4)) continue;
    g.save(); g.translate(x, y); g.rotate(Math.atan2(y2 - y, x2 - x)); g.fillStyle = d % 2 ? "#b98249" : "#a8733d"; g.fillRect(-2.4, -22, 4.6, 44); g.fillStyle = "#6b4526"; g.fillRect(-2.4, -25, 5, 4); g.fillRect(-2.4, 21, 5, 4); g.restore();
  }
  for (let i = 0; i < 260; i++) { const vei = i % stier.length, [x, y] = V.paaSti(niva, fast(i, 21) * V.lengdeFor(niva, "regning", vei), false, vei); if (V.iVann(niva, x, y, 10)) continue; g.globalAlpha = 0.35; g.fillStyle = i % 3 ? t.vei[2] : t.vei[0]; g.beginPath(); g.ellipse(x + (fast(i, 22) - 0.5) * 32, y + (fast(i, 23) - 0.5) * 32, 1.4 + fast(i, 24) * 2.6, 1 + fast(i, 25) * 1.6, 0, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  const s = V.lagVakt(niva), pynt = [];
  for (let i = 0; i < 240 && pynt.length < 34; i++) { const x = fast(i, 31) * B, y = fast(i, 32) * H; if ((x < 34 || x > B - 34 || y < 30 || y > H - 26 || i % 9 === 0) && !V.iVann(niva, x, y, 14) && V.kanStaa({ ...s, tarn: [] }, Math.max(22, Math.min(B - 22, x)), Math.max(26, Math.min(H - 18, y)))) pynt.push([x, y, i]); }
  for (const [x, y, i] of pynt.sort((a, b) => a[1] - b[1])) {
    const r = 9 + fast(i, 33) * 8;
    g.fillStyle = "rgb(43 33 24 / 0.2)"; g.beginPath(); g.ellipse(x + 3, y + 4, r, r * 0.45, 0, 0, TAU); g.fill();
    if (i % 4 === 0) { g.fillStyle = "#9aa3ad"; g.strokeStyle = K; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x, y, r * 0.7, r * 0.5, 0.2, 0, TAU); g.fill(); g.stroke(); g.fillStyle = "#c3cad1"; g.beginPath(); g.ellipse(x - r * 0.2, y - r * 0.15, r * 0.3, r * 0.16, 0.2, 0, TAU); g.fill(); continue; }
    g.fillStyle = "#7a5634"; g.strokeStyle = K; g.lineWidth = 1.6; g.fillRect(x - 2.5, y - r * 0.6, 5, r * 0.7); g.strokeRect(x - 2.5, y - r * 0.6, 5, r * 0.7);
    for (const [ox, oy, rr, f] of [[0, -r * 1.2, r, t.tre[0]], [-r * 0.3, -r * 1.45, r * 0.62, t.tre[1]], [r * 0.35, -r * 1.05, r * 0.5, t.tre[2]]]) { g.fillStyle = f; g.beginPath(); g.arc(x + ox, y + oy, rr, 0, TAU); g.fill(); if (rr === r) g.stroke(); }
  }
  for (let i = 0; i < 60; i++) { const x = fast(i, 41) * B, y = fast(i, 42) * H; if (!V.kanStaa({ ...s, tarn: [] }, x, y)) continue; g.fillStyle = ["#fff", "#ffd84a", "#f08a9e"][i % 3]; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x + Math.cos((k * TAU) / 4) * 2.1, y + Math.sin((k * TAU) / 4) * 2.1, 1.5, 0, TAU); g.fill(); } g.fillStyle = "#b87a10"; g.beginPath(); g.arc(x, y, 1.2, 0, TAU); g.fill(); }
  return c;
}

// ---------- Tårnene ----------

function tegnTarn(g, t, tid) {
  const [a, b] = V.TARN[t.type].farge, [n0, n1, n2] = t.niva ?? [0, 0, 0], opp = n0 + n1 + n2, rekyl = Math.max(0, t.stoppet ?? 0) / 0.16, v = t.vinkel ?? -Math.PI / 2;
  g.save(); g.translate(t.x, t.y);
  g.strokeStyle = K; g.lineWidth = 2; g.lineJoin = "round";
  g.fillStyle = "rgb(43 33 24 / 0.28)"; g.beginPath(); g.ellipse(2, 7, 21, 11, 0, 0, TAU); g.fill();
  g.fillStyle = "#b9a27c"; g.beginPath(); g.ellipse(0, 4, 19, 11, 0, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = "#d9c49c"; g.beginPath(); g.ellipse(0, 2, 15, 8, 0, 0, TAU); g.fill();
  const kropp = (br, ho, f) => { const gr = g.createLinearGradient(-br, 0, br, 0); gr.addColorStop(0, f[0]); gr.addColorStop(0.45, f[0]); gr.addColorStop(1, f[1]); g.fillStyle = gr; };
  if (t.type === "mynt") {
    kropp(12, 20, ["#c98f58", "#8a5a30"]); g.beginPath(); g.moveTo(-11, 3); g.lineTo(-8, -15); g.lineTo(8, -15); g.lineTo(11, 3); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-9, -5); g.lineTo(9, -5); g.stroke();
    for (let k = 0; k < n1; k++) { g.fillStyle = "#e3bd76"; g.beginPath(); g.ellipse(-14 + (k % 2) * 28, 3 - k * 2, 5, 6, 0, 0, TAU); g.fill(); g.stroke(); }
    g.save(); g.translate(0, -18); g.rotate(v); g.translate(-4 * rekyl, 0);
    g.fillStyle = "#6b4526"; g.beginPath(); g.roundRect(-6, -4, 22, 8, 3); g.fill(); g.stroke();
    g.fillStyle = n0 > 2 ? "#fff3b0" : a; g.beginPath(); g.arc(15, 0, 6 + n0, 0, TAU); g.fill(); g.stroke();
    g.restore();
    g.fillStyle = a; g.beginPath(); g.arc(0, -18, 6.5, 0, TAU); g.fill(); g.stroke();
    if (n2 > 0) { g.fillStyle = "#cfe8f7"; for (const o of [-4, 4]) { g.beginPath(); g.arc(o, -19, 3.2, 0, TAU); g.fill(); g.stroke(); } }
    if (n0 > 3) { g.fillStyle = "#ffd84a"; g.beginPath(); g.moveTo(-8, -25); g.lineTo(-9, -35); g.lineTo(-3, -30); g.lineTo(0, -37); g.lineTo(3, -30); g.lineTo(9, -35); g.lineTo(8, -25); g.closePath(); g.fill(); g.stroke(); }
  } else if (t.type === "frys") {
    kropp(13, 26, ["#f4fbff", "#a9cfe4"]); g.beginPath(); g.roundRect(-13, -24, 26, 28, 5); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-13, -13); g.lineTo(13, -13); g.stroke();
    g.fillStyle = "#5b7c92"; g.fillRect(7, -22, 2.4, 6); g.fillRect(7, -10, 2.4, 8);
    g.save(); g.translate(-2, -5); g.rotate(tid * 0.8); g.strokeStyle = n1 > 1 ? "#4a5fd8" : "#2f7fa8"; g.lineWidth = 1.8; for (let k = 0; k < 3; k++) { g.rotate(Math.PI / 3); g.beginPath(); g.moveTo(-6, 0); g.lineTo(6, 0); g.stroke(); } g.restore();
    g.strokeStyle = K; g.fillStyle = "#e8f8ff";
    for (let k = 0; k < 3 + n0; k++) { const x = -11 + (k * 22) / (2 + n0); g.beginPath(); g.moveTo(x - 2.5, -24); g.lineTo(x, -30 - n0 * 1.5 - (k % 2) * 4); g.lineTo(x + 2.5, -24); g.closePath(); g.fill(); g.lineWidth = 1.4; g.stroke(); }
    if (n2 > 0) { g.save(); g.translate(0, -19); g.rotate(tid * (3 + n2)); g.fillStyle = "#7fb9d8"; for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.ellipse(4, 0, 4, 1.7, 0, 0, TAU); g.fill(); } g.restore(); }
    if (rekyl > 0) { g.globalAlpha = rekyl * 0.5; g.fillStyle = "#dff6ff"; g.beginPath(); g.arc(0, -10, 24, 0, TAU); g.fill(); g.globalAlpha = 1; }
  } else if (t.type === "rente") {
    const vekst = Math.min(1, (t.bolger ?? 0) / 14), ho = 18 + 10 * vekst;
    kropp(9, ho, ["#b9e4b0", "#4e9a55"]); g.beginPath(); g.moveTo(-11, 3); g.lineTo(-6, -ho); g.lineTo(6, -ho); g.lineTo(11, 3); g.closePath(); g.fill(); g.stroke();
    for (let k = 1; k < 4; k++) { const y = 3 - (k * ho) / 4; g.beginPath(); g.moveTo(-11 + k * 1.3, y); g.lineTo(11 - k * 1.3, y); g.lineWidth = 1; g.stroke(); }
    g.lineWidth = 2;
    const puls = 1 + 0.07 * Math.sin(tid * 4) + 0.25 * rekyl;
    const gl = g.createRadialGradient(0, -ho - 6, 1, 0, -ho - 6, 20 * puls); gl.addColorStop(0, "rgb(190 255 170 / 0.75)"); gl.addColorStop(1, "rgb(190 255 170 / 0)"); g.fillStyle = gl; g.beginPath(); g.arc(0, -ho - 6, 20 * puls, 0, TAU); g.fill();
    g.fillStyle = a; g.beginPath(); g.arc(0, -ho - 6, (7 + n0) * puls, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = K; g.font = "900 10px Archivo, system-ui"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("%", 0, -ho - 5.5);
    for (let k = 0; k < n2; k++) { const u = tid * 2 + (k * TAU) / Math.max(1, n2); g.fillStyle = "#eaffea"; g.beginPath(); g.arc(Math.cos(u) * 14, -ho - 6 + Math.sin(u) * 6, 2.4, 0, TAU); g.fill(); g.lineWidth = 1.2; g.stroke(); }
    for (let k = 0; k < n1; k++) { g.fillStyle = "#ffd84a"; g.lineWidth = 1.2; g.beginPath(); g.ellipse(-13 + (k % 2) * 4, 4 - k * 3.2, 5, 2.4, 0, 0, TAU); g.fill(); g.stroke(); }
  } else if (t.type === "bue") {
    kropp(11, 30, ["#d9ac6e", "#8a5a30"]); g.beginPath(); g.moveTo(-11, 3); g.lineTo(-9, -26); g.lineTo(9, -26); g.lineTo(11, 3); g.closePath(); g.fill(); g.stroke();
    for (const y of [-6, -16]) { g.beginPath(); g.moveTo(-10, y); g.lineTo(10, y); g.stroke(); }
    g.fillStyle = "#b5763c"; g.beginPath(); g.roundRect(-14, -31, 28, 7, 2); g.fill(); g.stroke();
    if (n2 > 0) { g.fillStyle = "#cfe8f7"; g.beginPath(); g.arc(0, -12, 4, 0, TAU); g.fill(); g.stroke(); }
    g.save(); g.translate(0, -34); g.rotate(v); g.translate(-5 * rekyl, 0);
    for (let k = 0; k < (n1 > 2 ? 3 : 1); k++) { const o = n1 > 2 ? (k - 1) * 5 : 0; g.strokeStyle = K; g.lineWidth = 3; g.beginPath(); g.moveTo(-8, o); g.lineTo(18, o); g.stroke(); g.strokeStyle = n0 > 1 ? "#dfe6ee" : "#e7c27a"; g.lineWidth = 1.6; g.stroke(); g.fillStyle = n0 > 2 ? "#ffd84a" : "#c9ced6"; g.strokeStyle = K; g.lineWidth = 1.3; g.beginPath(); g.moveTo(25, o); g.lineTo(16, o - 4); g.lineTo(16, o + 4); g.closePath(); g.fill(); g.stroke(); }
    g.lineWidth = 3.4; g.strokeStyle = b; g.beginPath(); g.arc(-4, 0, 16 + n0, -1.05, 1.05); g.stroke();
    g.lineWidth = 1.2; g.strokeStyle = "#fffaf0"; const tx = -4 + Math.cos(1.05) * (16 + n0), ty = Math.sin(1.05) * (16 + n0), dra = -8 * (1 - rekyl); g.beginPath(); g.moveTo(tx, -ty); g.lineTo(dra, 0); g.lineTo(tx, ty); g.stroke();
    g.restore();
  } else if (t.type === "fyr") {
    const ho = 34 + n2 * 3;
    for (const [q, r] of [[0, 1], [1, 0.82], [2, 0.64]]) { const y = 3 - (q * ho) / 3, gr = g.createLinearGradient(-11, 0, 11, 0); gr.addColorStop(0, q % 2 ? b : a); gr.addColorStop(1, q % 2 ? "#8f2f18" : "#c9c0ac"); g.fillStyle = gr; g.beginPath(); g.moveTo(-12 * r, y); g.lineTo(-12 * r + 2.2, y - ho / 3); g.lineTo(12 * r - 2.2, y - ho / 3); g.lineTo(12 * r, y); g.closePath(); g.fill(); g.stroke(); }
    g.save(); g.translate(0, 3 - ho - 6); g.globalAlpha = 0.5; for (const o of [0, Math.PI]) { const u = tid * (0.8 + n1 * 0.5) + o, gr = g.createLinearGradient(0, 0, Math.cos(u) * 46, Math.sin(u) * 16); gr.addColorStop(0, "rgb(255 240 160 / 0.9)"); gr.addColorStop(1, "rgb(255 240 160 / 0)"); g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(u - 0.22) * 48, Math.sin(u - 0.22) * 18); g.lineTo(Math.cos(u + 0.22) * 48, Math.sin(u + 0.22) * 18); g.closePath(); g.fill(); } g.globalAlpha = 1;
    g.fillStyle = "#fff3a8"; g.beginPath(); g.roundRect(-5, -5, 10, 11, 2); g.fill(); g.stroke(); g.fillStyle = b; g.beginPath(); g.moveTo(-8, -5); g.lineTo(0, -13); g.lineTo(8, -5); g.closePath(); g.fill(); g.stroke(); g.restore();
    for (let k = 0; k < n0; k++) { const u = tid * 1.4 + (k * TAU) / n0; g.fillStyle = "#ffd84a"; g.beginPath(); g.arc(Math.cos(u) * 17, -ho + Math.sin(u) * 6, 2, 0, TAU); g.fill(); }
  } else {
    kropp(15, 18, ["#8f9aa8", "#4a5564"]); g.beginPath(); g.roundRect(-15, -12, 30, 17, 6); g.fill(); g.stroke();
    g.fillStyle = "#ffd84a"; g.beginPath(); g.arc(0, -3, 4.5, 0, TAU); g.fill(); g.lineWidth = 1.5; g.stroke(); g.lineWidth = 2;
    g.save(); g.translate(0, -14); g.rotate(v); g.translate(-7 * rekyl, 0);
    const lop = n1 > 2 ? [-5.5, 5.5] : [0], lg = 22 + n2 * 3;
    for (const o of lop) { const gr = g.createLinearGradient(0, o - 6, 0, o + 6); gr.addColorStop(0, "#aab4bf"); gr.addColorStop(1, b); g.fillStyle = gr; g.beginPath(); g.roundRect(-9, o - 6 - n0 * 0.5, lg, 12 + n0, 4); g.fill(); g.stroke(); g.fillStyle = "#2b3440"; g.beginPath(); g.ellipse(lg - 9, o, 2.5, 4.5 + n0 * 0.5, 0, 0, TAU); g.fill(); g.stroke(); }
    if (rekyl > 0.55) { g.fillStyle = "#ffe58a"; g.beginPath(); g.moveTo(lg - 8, -7); g.lineTo(lg + 14 * rekyl, 0); g.lineTo(lg - 8, 7); g.closePath(); g.fill(); }
    g.restore();
  }
  if (t.hjulpet) { g.strokeStyle = "rgb(255 226 120 / 0.85)"; g.lineWidth = 1.6; g.beginPath(); g.ellipse(0, 4, 21, 12.5, 0, 0, TAU); g.stroke(); }
  for (let k = 0; k < opp; k++) { g.fillStyle = k < n0 ? "#ff8f6b" : k < n0 + n1 ? "#ffd84a" : "#7fc4ff"; g.strokeStyle = K; g.lineWidth = 1; g.beginPath(); g.arc((k - (opp - 1) / 2) * 5.4, 13, 2.2, 0, TAU); g.fill(); g.stroke(); }
  if ((t.lam ?? 0) > 0) for (let k = 0; k < 3; k++) { const u = tid * 5 + (k * TAU) / 3; g.fillStyle = "#ffd84a"; g.beginPath(); g.arc(Math.cos(u) * 13, -32 + Math.sin(u) * 4, 2.6, 0, TAU); g.fill(); }
  g.restore();
}

// ---------- Fiendene ----------

function tegnFiende(g, f, tid) {
  const F = V.FIENDER[f.type], r = F.stor * (f.type === "laan" ? Math.min(1.5, 0.85 + 0.15 * (f.maks / Math.max(1, f.maks0 ?? f.maks))) : 1), [x, y] = f.p, gang = tid * (F.fart / 7) + f.id, hopp = f.stopp > 0 ? 0 : Math.abs(Math.sin(gang)) * 3, vugg = f.stopp > 0 ? 0 : Math.sin(gang) * 0.09;
  f.maks0 ??= f.maks;
  g.save(); g.translate(x, y); g.lineJoin = "round"; g.strokeStyle = K; g.lineWidth = 2;
  g.fillStyle = "rgb(43 33 24 / 0.25)"; g.beginPath(); g.ellipse(0, r + (F.flyr ? 16 : 2), r * 0.85, r * 0.3, 0, 0, TAU); g.fill();
  if (F.skjult) g.globalAlpha = 0.42 + 0.14 * Math.sin(tid * 4 + f.id);
  if (!F.flyr) { g.beginPath(); for (const o of [-1, 1]) { g.moveTo(o * r * 0.38, r * 0.5); g.lineTo(o * r * 0.38 + Math.sin(gang + (o > 0 ? 3 : 0)) * 3, r * 1.1); } g.stroke(); }
  g.translate(0, -hopp - (F.flyr ? 8 + Math.sin(tid * 2 + f.id) * 3 : 0)); g.rotate(vugg);
  const blink = f.tr > 0;
  const fyll = (c) => { g.fillStyle = blink ? "#fff" : c; g.fill(); g.stroke(); };
  const fjes = (yy, sint = true, c = K) => { g.fillStyle = c; for (const o of [-0.32, 0.32]) { g.beginPath(); g.arc(o * r, yy, r * 0.13, 0, TAU); g.fill(); } g.strokeStyle = c; g.lineWidth = 1.7; g.beginPath(); if (sint) { g.moveTo(-r * 0.58, yy - r * 0.34); g.lineTo(-r * 0.16, yy - r * 0.15); g.moveTo(r * 0.58, yy - r * 0.34); g.lineTo(r * 0.16, yy - r * 0.15); } g.moveTo(-r * 0.28, yy + r * 0.45); g.quadraticCurveTo(0, yy + r * 0.22, r * 0.28, yy + r * 0.45); g.stroke(); g.strokeStyle = K; g.lineWidth = 2; };
  const ark = (br, ho, c) => { g.beginPath(); g.moveTo(-br, -ho); g.lineTo(br * 0.55, -ho); g.lineTo(br, -ho + br * 0.45); g.lineTo(br, ho); for (let k = 3; k >= -3; k--) g.lineTo((k * br) / 3.5, ho - (Math.abs(k) % 2) * 3); g.lineTo(-br, ho); g.closePath(); fyll(c); };
  switch (f.type) {
    case "regning": ark(r * 0.82, r * 1.05, "#fffaf0"); g.lineWidth = 1.2; g.beginPath(); for (const k of [0.48, 0.72]) { g.moveTo(-r * 0.5, r * k); g.lineTo(r * 0.5, r * k); } g.stroke(); fjes(-r * 0.25); break;
    case "gebyr": g.beginPath(); g.moveTo(0, -r); for (let k = 0; k < 16; k++) { const u = (k / 16) * TAU - Math.PI / 2, q = k % 2 ? r * 0.82 : r * 1.12; g.lineTo(Math.cos(u) * q, Math.sin(u) * q); } g.closePath(); fyll("#ff9c6b"); fjes(-r * 0.12); break;
    case "purring": ark(r * 0.8, r, "#ffe3c2"); fjes(-r * 0.05); g.beginPath(); g.moveTo(-r * 0.95, -r * 0.5); g.quadraticCurveTo(0, -r * 2, r * 0.95, -r * 0.5); g.closePath(); fyll("#9aa7b5"); g.beginPath(); g.moveTo(0, -r * 1.25); g.lineTo(0, -r * 0.5); g.stroke(); g.beginPath(); g.moveTo(-r * 1.15, -r * 0.1); g.lineTo(-r * 0.4, -r * 0.1); g.lineTo(-r * 0.4, r * 0.55); g.quadraticCurveTo(-r * 0.78, r * 0.95, -r * 1.15, r * 0.55); g.closePath(); fyll("#7d8b9b"); break;
    case "skjult": g.beginPath(); g.arc(0, -r * 0.2, r * 0.85, Math.PI, 0); for (let k = 0; k <= 4; k++) g.lineTo(r * 0.85 - (k * r * 1.7) / 4, r * (k % 2 ? 0.72 : 0.95)); g.closePath(); fyll("#d9d2f0"); fjes(-r * 0.2, false); break;
    case "luft": for (const [ox, oy, q] of [[-0.65, 0.3, 0.55], [0.65, 0.3, 0.55], [0, 0.35, 0.75]]) { g.beginPath(); g.arc(ox * r, oy * r, q * r, 0, TAU); fyll("#fff"); } g.fillStyle = blink ? "#fff" : "#fff"; g.fillRect(-r * 0.8, r * 0.1, r * 1.6, r * 0.5); g.beginPath(); g.moveTo(-r * 0.75, r * 0.05); g.lineTo(-r * 0.75, -r * 0.8); for (let k = 0; k < 5; k++) { g.lineTo(-r * 0.75 + k * r * 0.3, -r * (k % 2 ? 0.8 : 1.05)); g.lineTo(-r * 0.45 + k * r * 0.3, -r * (k % 2 ? 0.8 : 1.05)); } g.lineTo(r * 0.75, r * 0.05); g.closePath(); fyll("#f3c6dc"); fjes(-r * 0.4); break;
    case "abo": g.beginPath(); g.roundRect(-r * 0.9, -r * 0.85, r * 1.8, r * 1.75, 5); fyll("#cfe3ff"); g.beginPath(); g.roundRect(-r * 0.9, -r * 0.85, r * 1.8, r * 0.45, 5); fyll("#3b6fd8"); g.fillStyle = "#3b6fd8"; for (const o of [-0.45, 0, 0.45]) { g.beginPath(); g.arc(o * r, r * 0.68, r * 0.12, 0, TAU); g.fill(); } fjes(0); break;
    case "laan": g.beginPath(); g.moveTo(-r * 0.35, -r * 0.85); g.quadraticCurveTo(-r * 1.25, r * 0.1, -r * 0.75, r * 0.85); g.quadraticCurveTo(0, r * 1.1, r * 0.75, r * 0.85); g.quadraticCurveTo(r * 1.25, r * 0.1, r * 0.35, -r * 0.85); g.closePath(); fyll("#d8b5f0"); g.beginPath(); g.moveTo(-r * 0.5, -r * 1.15); g.lineTo(r * 0.5, -r * 1.15); g.lineTo(r * 0.35, -r * 0.8); g.lineTo(-r * 0.35, -r * 0.8); g.closePath(); fyll("#a36fd0"); fjes(0); break;
    case "selger": g.beginPath(); g.roundRect(-r * 0.72, -r * 0.1, r * 1.44, r, 5); fyll("#4f7fb8"); g.beginPath(); g.arc(0, -r * 0.4, r * 0.68, 0, TAU); fyll("#ffd7b0"); g.beginPath(); g.arc(0, -r * 0.45, r * 0.78, Math.PI * 1.05, -Math.PI * 0.05); g.lineWidth = 3; g.stroke(); g.lineWidth = 2; for (const o of [-1, 1]) { g.beginPath(); g.roundRect(o * r * 0.74 - 3, -r * 0.6, 6, 9, 3); fyll("#2f9a5a"); } fjes(-r * 0.4, false); break;
    case "svindler": g.beginPath(); g.moveTo(0, -r * 1.1); g.lineTo(r * 1.1, r * 0.95); g.lineTo(-r * 1.1, r * 0.95); g.closePath(); fyll("#4a3a5e"); g.beginPath(); g.arc(0, -r * 0.25, r * 0.66, 0, TAU); fyll("#f0cfae"); g.fillStyle = K; g.beginPath(); g.roundRect(-r * 0.66, -r * 0.5, r * 1.32, r * 0.42, 4); g.fill(); g.fillStyle = "#fff"; for (const o of [-0.28, 0.28]) { g.beginPath(); g.arc(o * r, -r * 0.29, r * 0.14, 0, TAU); g.fill(); } g.beginPath(); g.ellipse(0, -r * 0.86, r * 0.85, r * 0.2, 0, 0, TAU); fyll("#2f2440"); g.beginPath(); g.roundRect(-r * 0.45, -r * 1.35, r * 0.9, r * 0.5, 3); fyll("#2f2440"); break;
    case "inkasso": g.beginPath(); g.roundRect(-r * 0.85, -r * 0.2, r * 1.7, r * 1.15, 6); fyll("#3d4658"); g.beginPath(); g.moveTo(-r * 0.25, -r * 0.2); g.lineTo(0, r * 0.4); g.lineTo(r * 0.25, -r * 0.2); g.closePath(); fyll("#fff"); g.beginPath(); g.moveTo(0, -r * 0.1); g.lineTo(r * 0.12, r * 0.45); g.lineTo(0, r * 0.65); g.lineTo(-r * 0.12, r * 0.45); g.closePath(); fyll("#c93a3a"); g.beginPath(); g.arc(0, -r * 0.5, r * 0.6, 0, TAU); fyll("#f2c9a0"); fjes(-r * 0.5); g.beginPath(); g.roundRect(-r * 0.62, -r * 1.2, r * 1.24, r * 0.35, 3); fyll("#222a38"); g.beginPath(); g.roundRect(r * 0.62, r * 0.35, r * 0.75, r * 0.55, 4); fyll("#8a5a30"); break;
    case "strom": g.beginPath(); g.roundRect(-r * 0.85, -r, r * 1.7, r * 1.95, 4); fyll("#fff1a8"); g.beginPath(); g.moveTo(r * 0.2, -r * 0.95); g.lineTo(-r * 0.4, r * 0.0); g.lineTo(0, r * 0.0); g.lineTo(-r * 0.15, r * 0.9); g.lineTo(r * 0.45, -r * 0.2); g.lineTo(r * 0.05, -r * 0.2); g.closePath(); fyll("#f2a93b"); fjes(-r * 0.45); if (f.skjold > 0) { g.strokeStyle = `rgb(90 190 255 / ${0.45 + 0.13 * f.skjold})`; g.lineWidth = 1 + f.skjold * 0.8; g.beginPath(); g.arc(0, 0, r * 1.35, 0, TAU); g.stroke(); g.fillStyle = "rgb(120 210 255 / 0.2)"; g.fill(); g.strokeStyle = K; } break;
    case "hopp": { const lad = Math.min(1, (f.ur ?? 0) / 3.6); g.lineWidth = 2; g.strokeStyle = K; g.beginPath(); for (let k = 0; k < 4; k++) { const y = r * (0.55 + k * 0.16 * (1 - lad * 0.5)); g.moveTo(-r * 0.5, y); g.lineTo(r * 0.5, y + 2); } g.stroke(); g.beginPath(); g.arc(0, -r * 0.1 + lad * 3, r * 0.86, 0, TAU); fyll("#8ed67a"); g.fillStyle = K; g.font = `900 ${r * 0.62}px Archivo, system-ui`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("%", 0, r * 0.45 + lad * 3); fjes(-r * 0.4 + lad * 3); break; }
    case "inflasjon": { const p = 1 + 0.06 * Math.sin(tid * 3); g.beginPath(); g.ellipse(0, -r * 0.1, r * p, r * 1.05 * p, 0, 0, TAU); fyll("#ff8fb0"); g.beginPath(); g.moveTo(-r * 0.18, r * 1.1); g.lineTo(r * 0.18, r * 1.1); g.lineTo(0, r * 0.88); g.closePath(); fyll("#e0607f"); g.globalAlpha *= 0.6; g.fillStyle = "#fff"; g.beginPath(); g.ellipse(-r * 0.35, -r * 0.5, r * 0.18, r * 0.3, 0.5, 0, TAU); g.fill(); g.globalAlpha = 1; fjes(-r * 0.15); g.fillStyle = K; g.font = `900 ${r * 0.42}px Archivo, system-ui`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("+12 %", 0, r * 0.58); break; }
    case "spiral": { g.save(); g.rotate(tid * (1 + 0.6 * (3 - (f.kvart ?? 3)))); for (let k = 0; k < 3; k++) { g.rotate(TAU / 3); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(r * 0.9, -r * 0.5, r * 1.25, r * 0.35); g.quadraticCurveTo(r * 0.5, r * 0.2, 0, 0); fyll(["#7a4fb0", "#9a6fd0", "#5f3a94"][k]); } g.restore(); g.beginPath(); g.arc(0, 0, r * 0.68, 0, TAU); fyll("#c9a6f0"); fjes(-r * 0.12); g.fillStyle = "#5f3a94"; g.font = `900 ${r * 0.4}px Archivo, system-ui`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("kr", 0, -r * 0.46); break; }
    default: for (const o of [-1, 1]) { g.beginPath(); g.arc(o * r * 0.62, -r * 0.78, r * 0.32, 0, TAU); fyll("#7a4a22"); } g.beginPath(); g.ellipse(0, 0, r, r * 0.98, 0, 0, TAU); fyll("#a0693a"); g.beginPath(); g.ellipse(0, r * 0.3, r * 0.5, r * 0.4, 0, 0, TAU); fyll("#e7c49b"); g.fillStyle = K; g.beginPath(); g.moveTo(-r * 0.16, r * 0.1); g.lineTo(r * 0.16, r * 0.1); g.lineTo(0, r * 0.26); g.fill(); g.fillStyle = "#e02b2b"; for (const o of [-0.36, 0.36]) { g.beginPath(); g.arc(o * r, -r * 0.2, r * 0.14, 0, TAU); g.fill(); } g.lineWidth = 3; g.beginPath(); g.moveTo(-r * 0.62, -r * 0.5); g.lineTo(-r * 0.18, -r * 0.32); g.moveTo(r * 0.62, -r * 0.5); g.lineTo(r * 0.18, -r * 0.32); g.stroke();
  }
  g.globalAlpha = 1;
  if (f.stopp > 0) { g.fillStyle = "rgb(150 220 255 / 0.55)"; g.strokeStyle = "#e8f8ff"; g.beginPath(); g.roundRect(-r * 1.1, -r * 1.2, r * 2.2, r * 2.3, 5); g.fill(); g.stroke(); }
  else if (f.bremset > 0) { g.fillStyle = "rgb(130 210 255 / 0.3)"; g.beginPath(); g.arc(0, 0, r * 1.1, 0, TAU); g.fill(); }
  if (f.giftSek > 0) for (let k = 0; k < 3; k++) { const u = (tid * 1.8 + k / 3 + f.id * 0.1) % 1; g.fillStyle = `rgb(90 120 255 / ${0.8 * (1 - u)})`; g.beginPath(); g.arc((k - 1) * r * 0.6, r * 0.4 - u * r * 1.6, 3.2 * (1 - u) + 1, 0, TAU); g.fill(); }
  if (f.merket > 0) { g.strokeStyle = "#e8352e"; g.lineWidth = 1.8; g.beginPath(); g.arc(0, 0, r * 1.2, 0, TAU); g.moveTo(-r * 1.4, 0); g.lineTo(-r, 0); g.moveTo(r, 0); g.lineTo(r * 1.4, 0); g.stroke(); }
  g.restore();
  const br = F.sjef ? 54 : 26, yy = y - r * 1.35 - hopp - (F.flyr ? 12 : 0) - 8;
  if (f.liv < f.maks || F.sjef) { g.fillStyle = K; g.fillRect(x - br / 2 - 1, yy, br + 2, F.sjef ? 7 : 5); g.fillStyle = F.sjef ? "#ff5a4a" : f.liv / f.maks > 0.5 ? "#62c45a" : "#f2a93b"; g.fillRect(x - br / 2, yy + 1, br * Math.max(0, f.liv / f.maks), F.sjef ? 5 : 3); }
}

/** Et lite bilde av banen til nivålista. */
export function vaktBilde(niva) {
  const { stier, vann = [], elv } = V.brett(niva), t = TEMA[niva - 1], [x, y] = V.grisPa(niva);
  return `<svg viewBox="0 0 ${B} ${H}" aria-hidden="true"><rect width="${B}" height="${H}" fill="${t.gress[0]}"/>${vann.map((v) => `<ellipse cx="${v[0]}" cy="${v[1]}" rx="${v[2]}" ry="${v[3]}" fill="#4f9fd0"/>`).join("")}${elv ? `<polyline points="${elv.punkter.join(" ")}" fill="none" stroke="#4f9fd0" stroke-width="${elv.bredde}"/>` : ""}${[[58, t.vei[0]], [38, t.vei[1]]].map(([b, f]) => `<g fill="none" stroke="${f}" stroke-width="${b}" stroke-linejoin="round">${stier.map((s) => `<polyline points="${s.join(" ")}"/>`).join("")}</g>`).join("")}<circle cx="${x}" cy="${y}" r="34" fill="#f7b3c2" stroke="${K}" stroke-width="8"/></svg>`;
}

// ---------- Skjermen ----------

export function grisevakta(rot, niva, { ferdig, lyd }) {
  rot.append(lag('<div class="vakt-hode"><span class="vakt-tall vakt-kr"></span><span class="vakt-tall vakt-liv"></span><span class="vakt-tall vakt-nr"></span><button type="button" class="mini-bryter vakt-fart" aria-pressed="false">Dobbel fart</button></div>'),
    lag('<div class="vakt-brett"><canvas class="mini-lerret vakt-lerret" aria-label="Brettet i Grisevakta"></canvas><p class="vakt-melding" role="status" hidden></p></div>'),
    lag('<div class="vakt-neste"><span class="vakt-kommer"></span><button type="button" class="mini-bryter vakt-na"></button></div>'), lag('<div class="vakt-panel"></div>'));
  const q = (k) => rot.querySelector(k), lerret = q("canvas"), g = skarpt(lerret, B, H), panel = q(".vakt-panel"), melding = q(".vakt-melding"), kommer = q(".vakt-kommer"), na = q(".vakt-na"), fart = q(".vakt-fart");
  const bakgrunn = lagBakgrunn(niva, lerret.width / B), gris = svgBilde(lagGris(null, "v"));
  const [gx, gy] = V.grisPa(niva), { bolger } = V.VAKT_NIVA[niva - 1];
  let s = V.lagVakt(niva), slutt = false, valgt = null, bygger = null, peker = null, dobbelt = false, panelNokkel = "", kommerNokkel = "", tid = 0, rist = 0, skuddLyd = 0, meldingTil = 0, dytt = 0;
  const bit = [], sett = new Set();
  const legg = (o) => { if (bit.length > 340) bit.shift(); bit.push({ t: 0, ...o }); };
  const si = (tekst, sek = 3.6) => { settTekst(melding, tekst); melding.hidden = false; meldingTil = tid + sek; };

  const punkt = (e) => { const b = lerret.getBoundingClientRect(); return [((e.clientX - b.left) / b.width) * B, ((e.clientY - b.top) / b.height) * H]; };
  lerret.addEventListener("pointermove", (e) => { peker = punkt(e); });
  lerret.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") peker = null; });
  lerret.addEventListener("pointerdown", (e) => { peker = punkt(e); if (bygger) { e.preventDefault(); lerret.setPointerCapture(e.pointerId); } });
  lerret.addEventListener("pointerup", (e) => {
    const [x, y] = punkt(e);
    if (bygger) {
      const t = V.byggTarn(s, bygger, x, y);
      if (!t) { lyd("feil"); si(s.penger < V.tarnPris(s, bygger) ? "Du har ikke råd." : "Tårnet kan ikke stå der.", 1.6); return; }
      lyd("bygg");
      for (let k = 0; k < 14; k++) legg({ type: "stov", x, y: y + 6, vx: Math.cos(k) * 60, vy: Math.sin(k) * 24 - 20, liv: 0.5, f: "#cbb48a", r: 4 });
      valgt = t; bygger = null;
    } else {
      let best = null, bd = 26;
      for (const t of s.tarn) { const a = Math.hypot(t.x - x, t.y - 8 - y); if (a < bd) { bd = a; best = t; } }
      valgt = best === valgt ? null : best;
      lyd("klikk");
    }
    panelNokkel = "";
  });
  fart.addEventListener("click", () => { dobbelt = !dobbelt; fart.setAttribute("aria-pressed", String(dobbelt)); lyd("klikk"); });
  na.addEventListener("click", () => { const for_ = s.bolge, kr = V.nesteNa(s); if (s.bolge !== for_) { lyd("bolge"); if (kr) si(`+${kr} kr for å sende bølgen tidlig`, 1.8); } });
  const tast = (e) => {
    if (e.key === "Escape" && (bygger || valgt)) { e.preventDefault(); e.stopPropagation(); bygger = null; valgt = null; panelNokkel = ""; return; }
    const nr = Number(e.key), typer = V.tarnPa(niva);
    if (nr >= 1 && nr <= (valgt ? 3 : typer.length)) { if (valgt) kjop(nr - 1); else velg(typer[nr - 1]); }
    if (e.key === " ") { e.preventDefault(); na.click(); }
  };
  document.addEventListener("keydown", tast, true);

  function velg(type) { bygger = bygger === type ? null : type; valgt = null; lyd("klikk"); panelNokkel = ""; if (bygger) si("Trykk på brettet der tårnet skal stå.", 2.2); }
  function kjop(vei) {
    if (!valgt) return;
    if (V.oppgrader(s, valgt.id, vei)) {
      lyd("bygg");
      for (let k = 0; k < 18; k++) legg({ type: "gnist", x: valgt.x, y: valgt.y - 12, vx: Math.cos(k * 1.1) * (40 + k * 4), vy: Math.sin(k * 1.1) * 50 - 50, liv: 0.7, f: ["#ff8f6b", "#ffd84a", "#7fc4ff"][vei], r: 3 });
    } else lyd("feil");
    panelNokkel = "";
  }
  function tegnPanel() {
    if (valgt && !s.tarn.includes(valgt)) valgt = null;
    const nokkel = valgt ? `${valgt.id}:${valgt.niva}:${valgt.sikte}:${Math.round(V.tarnSkade(valgt))}:${valgt.brukt}:${[0, 1, 2].map((v) => V.oppPris(s, valgt, v) <= s.penger)}:${V.prisFaktor(s)}` : `b${bygger}:${V.tarnPa(niva).map((t) => V.tarnPris(s, t) <= s.penger)}:${V.prisFaktor(s)}`;
    if (nokkel === panelNokkel) return;
    panelNokkel = nokkel;
    if (!valgt) {
      panel.className = "vakt-panel vakt-butikk";
      panel.replaceChildren(...V.tarnPa(niva).map((id, i) => {
        const t = V.TARN[id], pris = V.tarnPris(s, id);
        const b = lag(`<button type="button" class="vakt-tarn" aria-pressed="${bygger === id}"><canvas></canvas><b></b><small></small><span class="pris${pris > t.pris ? " dyr" : ""}">${pris} kr</span><kbd>${i + 1}</kbd></button>`);
        b.querySelector("b").textContent = t.navn; b.querySelector("small").textContent = t.tekst;
        const c = skarpt(b.querySelector("canvas"), 52, 56); const hoy = id === "bue" || id === "fyr"; c.translate(26, hoy ? 46 : 40); if (hoy) c.scale(0.82, 0.82); tegnTarn(c, { type: id, x: 0, y: 0, niva: [0, 0, 0], vinkel: -0.5, bolger: 0 }, 0);
        settAttr(b, "aria-disabled", pris <= s.penger ? "false" : "true");
        b.addEventListener("click", () => velg(id));
        return b;
      }));
      return;
    }
    const t = valgt, T = V.TARN[t.type];
    panel.className = "vakt-panel vakt-valgt";
    const hode = lag('<div class="vakt-valgt-hode"><div><b></b><small></small></div><button type="button" class="mini-bryter vakt-sikte"></button><button type="button" class="mini-bryter vakt-selg"></button></div>');
    hode.querySelector("b").textContent = T.navn;
    hode.querySelector("small").textContent = t.s.stotte ? `Tårnene rundt: ${Math.round(t.s.stotte.skade * 100 - 100)} % mer skade, ${Math.round(t.s.stotte.takt * 100 - 100)} % raskere` : `${Math.round(V.tarnSkade(t))} skade, ${t.s.takt.toLocaleString("nb-NO", { maximumFractionDigits: 1 })} i sekundet${t.s.ser ? ", ser skjulte" : ""}${t.s.bryter ? ", bryter panser" : ""}${t.hjulpet ? ", hjulpet av fyr" : ""}`;
    hode.querySelector(".vakt-sikte").hidden = !!t.s.stotte;
    hode.querySelector(".vakt-sikte").textContent = `Mål: ${V.SIKTER[t.sikte]}`;
    hode.querySelector(".vakt-sikte").addEventListener("click", () => { V.byttSikte(t); lyd("klikk"); panelNokkel = ""; });
    hode.querySelector(".vakt-selg").textContent = `Selg for ${V.salgspris(t)} kr`;
    hode.querySelector(".vakt-selg").addEventListener("click", () => { const kr = V.selg(s, t.id); lyd("selgTarn"); for (let k = 0; k < 10; k++) legg({ type: "mynt", x: t.x, y: t.y - 10, vx: (Math.random() - 0.5) * 120, vy: -60 - Math.random() * 90, liv: 0.9, r: 4 }); legg({ type: "tekst", x: t.x, y: t.y - 26, tekst: `+${kr}`, f: "#ffe58a", liv: 1 }); valgt = null; panelNokkel = ""; });
    panel.replaceChildren(hode, ...T.veier.map((v, i) => {
      const n = t.niva[i], pris = V.oppPris(s, t, i), full = n >= 4, sperret = !full && !Number.isFinite(pris), neste = v.trinn[n];
      const b = lag(`<button type="button" class="vakt-vei v${i}"><span class="vakt-vei-navn"></span><span class="vakt-pinner" aria-label="Trinn ${n} av 4">${[0, 1, 2, 3].map((k) => `<i class="${k < n ? "pa" : ""}"></i>`).join("")}</span><b></b><small></small><span class="pris"></span></button>`);
      b.querySelector(".vakt-vei-navn").textContent = v.navn;
      b.querySelector("b").textContent = full ? v.trinn[3].navn : sperret ? "Sperret" : neste.navn;
      b.querySelector("small").textContent = full ? "Ferdig oppgradert" : sperret ? (t.niva.filter((x) => x > 0).length > 1 && n === 0 ? "To veier er valgt" : "Bare én vei kan gå forbi trinn 2") : neste.tekst;
      b.querySelector(".pris").textContent = full ? "Ferdig" : sperret ? "Låst" : `${pris} kr`;
      settAttr(b, "aria-disabled", pris <= s.penger ? "false" : "true");
      b.classList.toggle("sperret", sperret);
      b.addEventListener("click", () => kjop(i));
      return b;
    }));
  }
  function tegnNeste() {
    const siste = s.bolge >= bolger, venter = !s.ko.length && !siste, nr = s.bolge + 1;
    const nokkel = `${nr}:${siste}`;
    if (nokkel !== kommerNokkel) {
      kommerNokkel = nokkel;
      if (siste) kommer.replaceChildren("Siste bølge");
      else {
        const sum = new Map();
        for (const k of V.bolge(niva, nr)) sum.set(k.type, (sum.get(k.type) ?? 0) + k.antall);
        kommer.replaceChildren(lag("<small>Neste:</small>"), ...[...sum].map(([type, antall]) => {
          const n = lag(`<span class="vakt-fiende" title="${V.FIENDER[type].navn}: ${V.FIENDER[type].tekst}"><canvas></canvas><b>${antall}</b></span>`);
          const c = skarpt(n.querySelector("canvas"), 34, 34), sk = Math.min(1, 12 / V.FIENDER[type].stor); c.translate(17, 18); c.scale(sk, sk);
          tegnFiende(c, { type, p: [0, 0], id: 1, liv: 1, maks: 1, maks0: 1, d: 0, stopp: 0, bremset: 0, giftSek: 0, merket: 0, tr: 0 }, 0.2);
          return n;
        }));
      }
    }
    na.hidden = !venter;
    if (venter) settTekst(na, `Send nå (${Math.max(0, Math.ceil(s.pause))})`);
  }

  function hendelser(liste, naa) {
    for (const h of liste) {
      const [x, y] = h.p ?? [0, 0];
      if (h.type === "skudd" && naa - skuddLyd > 60) { skuddLyd = naa; lyd("tarnSkudd", h.tarn); }
      if (h.type === "treff") { if (h.krit || Math.random() < 0.3) legg({ type: "tekst", x: x + (Math.random() - 0.5) * 14, y: y - 16, tekst: String(h.skade), f: h.krit ? "#ffdf4a" : "#fff", liv: h.krit ? 0.9 : 0.55, stor: h.krit ? 17 : 11 }); for (let k = 0; k < 3; k++) legg({ type: "gnist", x, y, vx: (Math.random() - 0.5) * 120, vy: (Math.random() - 0.5) * 120, liv: 0.25, f: "#fff6c8", r: 2 }); }
      if (h.type === "ring") { legg({ type: "ring", x, y: y - 6, r: h.r, liv: 0.45, f: h.farge ? "120 140 255" : "170 230 255" }); for (let k = 0; k < 8; k++) legg({ type: "sno", x, y: y - 8, vx: Math.cos(k * 0.785) * h.r * 1.6, vy: Math.sin(k * 0.785) * h.r * 1.6, liv: 0.5, r: 3 }); }
      if (h.type === "pil") for (const til of h.piler) legg({ type: "pil", fra: h.p, til, x: 0, y: 0, liv: 0.22 });
      if (h.type === "skjold") legg({ type: "ring", x, y, r: 20, liv: 0.25, f: "120 210 255" });
      if (h.type === "ladet") legg({ type: "ring", x, y, r: 30, liv: 0.5, f: "90 190 255" });
      if (h.type === "hopp") for (let k = 0; k < 8; k++) legg({ type: "stov", x, y: y + 8, vx: Math.cos(k * 0.8) * 60, vy: Math.sin(k * 0.8) * 20 - 10, liv: 0.5, f: "#cbe8b0", r: 4 });
      if (h.type === "spiral") { lyd("sjef"); rist = 7; legg({ type: "ring", x, y, r: 70, liv: 0.6, f: "160 110 230" }); si("Gjeldsspiralen slipper løs nye lån!", 2.4); }
      if (h.type === "strale") legg({ type: "strale", punkter: h.punkter, x: 0, y: 0, liv: 0.2 });
      if (h.type === "smell") { lyd("smell"); rist = Math.max(rist, 2.5); legg({ type: "smell", x, y, r: h.r, liv: 0.4 }); for (let k = 0; k < 12; k++) legg({ type: "stov", x, y, vx: Math.cos(k * 0.52) * (50 + Math.random() * 70), vy: Math.sin(k * 0.52) * 60 - 20, liv: 0.6, f: k % 3 ? "#6b5a4a" : "#ffb347", r: 5 }); }
      if (h.type === "dod") { lyd("fiendeDod"); const sjef = V.FIENDER[h.fiende].sjef; if (sjef) { rist = 9; legg({ type: "smell", x, y, r: 90, liv: 0.7 }); } for (let k = 0; k < (sjef ? 40 : 8); k++) legg({ type: "lapp", x, y, vx: (Math.random() - 0.5) * (sjef ? 320 : 150), vy: -40 - Math.random() * (sjef ? 220 : 90), liv: 0.8, f: ["#fffaf0", "#ffe3c2", "#ffd84a"][k % 3], r: 3 + Math.random() * 3, v: Math.random() * 6 }); legg({ type: "tekst", x, y: y - 10, tekst: `+${h.kr}`, f: "#ffe58a", liv: 0.8, stor: 12 }); }
      if (h.type === "slapp") { lyd("slapp"); rist = Math.max(rist, 6); dytt = 1; legg({ type: "tekst", x: gx, y: gy - 46, tekst: `−${h.skade} ♥`, f: "#ff6b5a", liv: 1.2, stor: 18 }); }
      if (h.type === "helbred") legg({ type: "ring", x, y, r: 70, liv: 0.6, f: "120 230 130" });
      if (h.type === "lammer") { lyd("slapp"); rist = 5; legg({ type: "ring", x, y, r: h.r, liv: 0.7, f: "255 120 90" }); }
      if (h.type === "utbytte") { legg({ type: "tekst", x, y: y - 34, tekst: `+${h.kr}`, f: "#b8ffb0", liv: 1.2, stor: 14 }); for (let k = 0; k < 5; k++) legg({ type: "mynt", x, y: y - 20, vx: (Math.random() - 0.5) * 70, vy: -70 - Math.random() * 40, liv: 0.8, r: 3.5 }); }
      if (h.type === "bolgeKlar") { lyd("bolgeKlar"); si(`Bølge ${s.bolge} er stoppet. +${h.kr} kr`, 2); }
      if (h.type === "bolge") lyd("bolge");
      if (h.type === "sjef") { lyd("sjef"); si(`${h.navn} kommer!`, 3); rist = 5; }
    }
    for (const f of s.fiender) if (!sett.has(f.type)) { sett.add(f.type); if (f.type !== "regning") si(`${V.FIENDER[f.type].navn}: ${V.FIENDER[f.type].tekst}`, 4.5); }
  }

  function tegn(dt) {
    g.save();
    rist = Math.max(0, rist - dt * 22);
    if (rist && !rolig.matches) g.translate((Math.random() - 0.5) * rist, (Math.random() - 0.5) * rist);
    g.drawImage(bakgrunn, 0, 0, B, H);
    // Rekkevidden til det som er valgt eller på vei ned
    const sirkel = (x, y, r, ok) => { g.fillStyle = ok ? "rgb(255 255 255 / 0.2)" : "rgb(230 60 50 / 0.25)"; g.strokeStyle = ok ? "rgb(255 255 255 / 0.9)" : "#c9332a"; g.lineWidth = 2; g.setLineDash([7, 6]); g.lineDashOffset = -tid * 18; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke(); g.setLineDash([]); };
    if (valgt) sirkel(valgt.x, valgt.y, valgt.s.rekke, true);
    const ting = [...s.tarn.map((t) => ({ y: t.y, d: () => tegnTarn(g, t, tid) })), ...s.fiender.filter((f) => !V.FIENDER[f.type].flyr).map((f) => ({ y: f.p[1] + 4, d: () => tegnFiende(g, f, tid) }))];
    ting.push({ y: gy + 8, d: () => { dytt = Math.max(0, dytt - dt * 3); const st = 86 + Math.sin(tid * 2) * 1.5 - dytt * 8; g.fillStyle = "rgb(43 33 24 / 0.25)"; g.beginPath(); g.ellipse(gx, gy + 24, 32, 9, 0, 0, TAU); g.fill(); if (gris.complete) g.drawImage(gris, gx - st / 2, gy - st * 0.6 + dytt * 6, st, st); } });
    ting.sort((a, b) => a.y - b.y);
    for (const t of ting) t.d();
    for (const f of s.fiender) if (V.FIENDER[f.type].flyr) tegnFiende(g, f, tid);
    for (const k of s.skudd) {
      const hele = Math.hypot(k.til[0] - k.fra[0], k.til[1] - k.fra[1]) || 1, gaatt = Math.min(1, Math.hypot(k.x - k.fra[0], k.y - k.fra[1]) / hele), z = k.z ? Math.sin(gaatt * Math.PI) * 34 : 0, v = Math.atan2(k.til[1] - k.y, k.til[0] - k.x);
      if (k.type === "kanon") { g.fillStyle = "rgb(43 33 24 / 0.25)"; g.beginPath(); g.ellipse(k.x, k.y + 10, 6, 3, 0, 0, TAU); g.fill(); g.fillStyle = "#2b3440"; g.strokeStyle = K; g.lineWidth = 1.5; g.beginPath(); g.arc(k.x, k.y - z, 5 * k.stor, 0, TAU); g.fill(); g.stroke(); g.fillStyle = "#7d8b9b"; g.beginPath(); g.arc(k.x - 1.5, k.y - z - 1.5, 1.8, 0, TAU); g.fill(); if (Math.random() < 0.5) legg({ type: "stov", x: k.x, y: k.y - z, vx: 0, vy: -12, liv: 0.4, f: "#8d8376", r: 3 }); } else {
        const gr = g.createLinearGradient(k.x - Math.cos(v) * 22, k.y - Math.sin(v) * 22, k.x, k.y); gr.addColorStop(0, "rgb(255 216 74 / 0)"); gr.addColorStop(1, "rgb(255 216 74 / 0.8)"); g.strokeStyle = gr; g.lineWidth = 5 * k.stor; g.beginPath(); g.moveTo(k.x - Math.cos(v) * 22, k.y - Math.sin(v) * 22); g.lineTo(k.x, k.y); g.stroke();
        g.fillStyle = "#ffd84a"; g.strokeStyle = "#7a4a06"; g.lineWidth = 1.4; g.beginPath(); g.ellipse(k.x, k.y, 5 * k.stor * Math.max(0.25, Math.abs(Math.cos(tid * 16 + k.x))), 5 * k.stor, 0, 0, TAU); g.fill(); g.stroke();
      }
    }
    for (const p of bit) {
      p.t += dt;
      const u = Math.min(1, p.t / p.liv);
      if (p.vx !== undefined) { p.x += p.vx * dt; p.y += p.vy * dt; if (p.type !== "sno") p.vy += (p.type === "stov" ? 20 : 260) * dt; p.vx *= 1 - 2 * dt; }
      g.globalAlpha = 1 - u * u;
      if (p.type === "tekst") { g.font = `900 ${p.stor ?? 13}px Archivo, system-ui`; g.textAlign = "center"; g.lineWidth = 3.5; g.strokeStyle = "rgb(43 33 24 / 0.85)"; g.strokeText(p.tekst, p.x, p.y - u * 24); g.fillStyle = p.f; g.fillText(p.tekst, p.x, p.y - u * 24); }
      else if (p.type === "ring") { g.strokeStyle = `rgb(${p.f} / ${0.9 * (1 - u)})`; g.lineWidth = 7 * (1 - u) + 1; g.beginPath(); g.arc(p.x, p.y, p.r * (0.25 + 0.75 * u), 0, TAU); g.stroke(); g.fillStyle = `rgb(${p.f} / ${0.16 * (1 - u)})`; g.fill(); }
      else if (p.type === "smell") { const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * (0.4 + 0.6 * u)); gr.addColorStop(0, "rgb(255 250 200 / 0.95)"); gr.addColorStop(0.5, "rgb(255 160 60 / 0.7)"); gr.addColorStop(1, "rgb(220 70 40 / 0)"); g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.r * (0.4 + 0.6 * u), 0, TAU); g.fill(); }
      else if (p.type === "strale") { for (const [br, f] of [[7, "rgb(160 255 150 / 0.35)"], [2.6, "#f4fff0"]]) { g.strokeStyle = f; g.lineWidth = br; g.beginPath(); p.punkter.forEach(([x, y], i) => { if (!i) { g.moveTo(x, y); return; } const [a, b] = p.punkter[i - 1]; for (let k = 1; k <= 5; k++) g.lineTo(a + ((x - a) * k) / 5 + (k < 5 ? (Math.random() - 0.5) * 13 : 0), b + ((y - b) * k) / 5 + (k < 5 ? (Math.random() - 0.5) * 13 : 0)); }); g.stroke(); } }
      else if (p.type === "pil") { const a = Math.atan2(p.til[1] - p.fra[1], p.til[0] - p.fra[0]), w = Math.min(1, u * 2.2), x = p.fra[0] + (p.til[0] - p.fra[0]) * w, y = p.fra[1] + (p.til[1] - p.fra[1]) * w; g.strokeStyle = "rgb(255 246 214 / 0.6)"; g.lineWidth = 3; g.beginPath(); g.moveTo(...p.fra); g.lineTo(x, y); g.stroke(); g.strokeStyle = "#4a3018"; g.lineWidth = 3; g.beginPath(); g.moveTo(x - Math.cos(a) * 18, y - Math.sin(a) * 18); g.lineTo(x, y); g.stroke(); g.fillStyle = "#dfe6ee"; g.beginPath(); g.moveTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7); g.lineTo(x - Math.sin(a) * 4, y + Math.cos(a) * 4); g.lineTo(x + Math.sin(a) * 4, y - Math.cos(a) * 4); g.closePath(); g.fill(); }
      else if (p.type === "lapp") { g.save(); g.translate(p.x, p.y); g.rotate(p.v + p.t * 9); g.fillStyle = p.f; g.fillRect(-p.r, -p.r * 0.7, p.r * 2, p.r * 1.4); g.restore(); }
      else if (p.type === "mynt") { g.fillStyle = "#ffd84a"; g.strokeStyle = "#7a4a06"; g.lineWidth = 1.2; g.beginPath(); g.ellipse(p.x, p.y, p.r * Math.abs(Math.cos(p.t * 12)) + 0.6, p.r, 0, 0, TAU); g.fill(); g.stroke(); }
      else { g.fillStyle = p.type === "sno" ? "#fff" : p.f; g.beginPath(); g.arc(p.x, p.y, Math.max(0.3, p.r * (1 - u * 0.6)), 0, TAU); g.fill(); }
      g.globalAlpha = 1;
    }
    for (let i = bit.length - 1; i >= 0; i--) if (bit[i].t >= bit[i].liv) bit.splice(i, 1);
    if (bygger && peker) { const [x, y] = peker, ok = V.kanStaa(s, x, y) && s.penger >= V.tarnPris(s, bygger); sirkel(x, y, V.TARN[bygger].basis.rekke, ok); g.globalAlpha = 0.8; tegnTarn(g, { type: bygger, x, y, niva: [0, 0, 0], bolger: 0 }, tid); g.globalAlpha = 1; }
    if (s.bolge === 0 && !slutt) V.brett(niva).stier.forEach((_, vei) => {
      const [x, y] = V.paaSti(niva, 48 + 8 * Math.sin(tid * 4), false, vei), [x2, y2] = V.paaSti(niva, 66 + 8 * Math.sin(tid * 4), false, vei), a = Math.atan2(y2 - y, x2 - x);
      g.fillStyle = "#e8352e"; g.strokeStyle = "#fff"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x2 + Math.cos(a) * 8, y2 + Math.sin(a) * 8); g.lineTo(x - Math.sin(a) * 13, y + Math.cos(a) * 13); g.lineTo(x + Math.sin(a) * 13, y - Math.cos(a) * 13); g.closePath(); g.fill(); g.stroke();
    });
    if (s.bolge === 0 && !slutt) { g.fillStyle = "rgb(43 33 24 / 0.6)"; g.beginPath(); g.roundRect(B / 2 - 150, H - 46, 300, 32, 16); g.fill(); g.fillStyle = "#fffaf0"; g.font = "800 15px Archivo, system-ui"; g.textAlign = "center"; g.fillText(`Første bølge om ${Math.max(0, Math.ceil(s.pause))} sek. Bygg!`, B / 2, H - 25); }
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
      while (rest > 0 && !s.ferdig) { const st = Math.min(1 / 30, rest); rest -= st; hendelser(V.vaktSteg(s, st), naa); }
    }
    settTekst(q(".vakt-kr"), `${s.penger} kr`); settTekst(q(".vakt-liv"), `♥ ${s.liv}`); settTekst(q(".vakt-nr"), `Bølge ${s.bolge} av ${bolger}`);
    if (!melding.hidden && tid > meldingTil) melding.hidden = true;
    tegnPanel(); tegnNeste(); tegn(dt);
    if (s.ferdig && !slutt) { slutt = true; ferdig(s.ferdig === "vunnet", s.ferdig === "vunnet" ? `Grisen er trygg med ${s.liv} liv igjen.` : `Regningene tok grisen i bølge ${s.bolge} av ${bolger}.`); }
  });
  return () => { slutt = true; cancelAnimationFrame(ramme); document.removeEventListener("keydown", tast, true); };
}
