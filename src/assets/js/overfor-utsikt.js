// Utsikten bak «Overfør»: du ser ut over byen fra etasjen din, i en runde på 360 grader som går sakte rundt.
// Byen tegnes på ett langt panorama og bare på nytt når noe endres. Selve rundturen er en ren flytting, så den koster lite.
// Hvor husene står og hvor høyt du bor, regnes ut i /lib/byutsikt.js.
import { BY, etasje, oyehoyde, dineHus, vanligeHus, projiser, fast } from "/lib/byutsikt.js";
import { FIGURER } from "./klikker-figurer.js";
import { $, rolig } from "./overfor-felles.js";

// En fjerdedel av kornet i Ordjakt: der er pikslene 3,4 ganger så store som vanlig, og kornlaget ligger på 0,16.
const PIKSEL = 1 + (3.4 - 1) / 4;
const RUNDE_MS = 160000;
const NY_TEGNING_MS = 1200;   // kjøper du mye på en gang, tegnes byen høyst så ofte

const morkt = matchMedia("(prefers-color-scheme: dark)");
const el = { utsikt: $("utsikt"), rute: $("utsikt-rute"), korn: $("utsikt-korn") };

const DAG = {
  himmel: ["#6fb1e6", "#a9d4ef", "#e9f3ee"], dis: [226, 236, 236], bakke: [198, 204, 178], gate: [186, 180, 168], fortau: [214, 208, 194], vann: ["#5f9fc4", "#8cc0d8"],
  fjell: ["#9fb6c4", "#86a391", "#6f9076"], park: [140, 178, 106], tre: ["#5f9147", "#79a857", "#4d7f45"], rute: [92, 112, 126], lys: 0,
  hus: [[226, 205, 168], [201, 143, 107], [236, 226, 206], [178, 190, 198], [214, 169, 143], [190, 174, 148], [232, 196, 138], [163, 178, 160]], tak: [132, 92, 78], flatt: [168, 162, 152],
};
const NATT = {
  himmel: ["#0b1430", "#1d2750", "#4a4468"], dis: [46, 48, 78], bakke: [34, 40, 48], gate: [40, 40, 50], fortau: [52, 52, 62], vann: ["#16284a", "#2a3f63"],
  fjell: ["#343d60", "#283250", "#202a42"], park: [34, 54, 46], tre: ["#1f3a33", "#28463a", "#1b332f"], rute: [30, 34, 52], lys: 0.5,
  hus: [[74, 66, 70], [82, 56, 56], [80, 78, 88], [58, 64, 82], [84, 66, 68], [66, 60, 64], [82, 70, 62], [56, 64, 68]], tak: [52, 40, 46], flatt: [56, 56, 66],
};

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const bland = (a, b, x) => a.map((v, i) => v + (b[i] - v) * x);
const rgb = (c) => `rgb(${c[0] | 0} ${c[1] | 0} ${c[2] | 0})`;

const bilder = new Map();
function figur(id) {
  if (!bilder.has(id)) {
    const img = new Image();
    img.onload = () => { nokkel = ""; be(); };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(FIGURER[id].svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" '));
    bilder.set(id, img);
  }
  return bilder.get(id);
}

// ---------- Tegningen ----------

function tegnPanorama(tilstand, bredde, hoyde, grader) {
  const P = Math.max(8, Math.round((bredde * 360) / grader));
  const c = document.createElement("canvas");
  c.width = P; c.height = hoyde;
  const g = c.getContext("2d", { alpha: false });
  const F = morkt.matches ? NATT : DAG;
  const etg = etasje(tilstand);
  // Jo høyere opp, jo mer ser du ned på byen: horisonten flytter seg oppover.
  const kamera = { P, oye: oyehoyde(etg), horisont: Math.round(hoyde * (0.5 - 0.012 * etg)) };
  const f = P / (2 * Math.PI);
  const disig = (farge, d) => bland(farge, F.dis, Math.min(0.72, Math.max(0, (d - 60) / 560)));

  // Himmel, sol eller måne og stjerner
  const himmel = g.createLinearGradient(0, 0, 0, kamera.horisont);
  F.himmel.forEach((h, i) => himmel.addColorStop(i / (F.himmel.length - 1), h));
  g.fillStyle = himmel;
  g.fillRect(0, 0, P, kamera.horisont + 2);
  if (F === NATT) {
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgb(255 250 225 / ${0.25 + fast(i, 1) * 0.6})`; g.fillRect(Math.floor(fast(i, 2) * P), Math.floor(fast(i, 3) * kamera.horisont * 0.8), 1 + (fast(i, 4) > 0.9), 1); }
  }
  const solX = P * 0.18, solY = kamera.horisont * 0.36, solR = Math.max(10, f * 0.045);
  const skinn = g.createRadialGradient(solX, solY, solR * 0.6, solX, solY, solR * 5);
  skinn.addColorStop(0, F === NATT ? "rgb(230 235 255 / 0.45)" : "rgb(255 244 200 / 0.75)");
  skinn.addColorStop(1, "rgb(255 244 200 / 0)");
  g.fillStyle = skinn; g.fillRect(solX - solR * 5, solY - solR * 5, solR * 10, solR * 10);
  g.fillStyle = F === NATT ? "#eef0fb" : "#fff3c4";
  g.beginPath(); g.arc(solX, solY, solR, 0, 7); g.fill();
  for (let i = 0; i < 16; i++) {   // skyer
    const x = fast(i, 11) * P, y = kamera.horisont * (0.12 + fast(i, 12) * 0.62), b = f * (0.07 + fast(i, 13) * 0.13);
    g.fillStyle = F === NATT ? "rgb(120 126 170 / 0.22)" : "rgb(255 255 255 / 0.75)";
    for (let k = 0; k < 4; k++) for (const o of [0, P, -P]) { g.beginPath(); g.ellipse(x + o + (k - 1.5) * b * 0.42, y - (k % 2) * b * 0.07, b * 0.36, b * 0.12, 0, 0, 7); g.fill(); }
  }

  // Fjell i tre lag, og fjorden i en del av synsfeltet
  F.fjell.forEach((farge, lag) => {
    g.fillStyle = farge;
    g.beginPath(); g.moveTo(0, kamera.horisont + 2);
    for (let x = 0; x <= P; x += 3) {
      const v = (x / P) * 2 * Math.PI;
      const h = 0.5 + 0.28 * Math.sin(3 * v + lag) + 0.17 * Math.sin(7 * v + 2 * lag) + 0.1 * Math.sin(17 * v + 5 * lag) + 0.05 * Math.sin(41 * v);
      g.lineTo(x, kamera.horisont - Math.max(0, h) * f * (0.135 - lag * 0.04));
    }
    g.lineTo(P, kamera.horisont + 2); g.fill();
  });
  const bakke = g.createLinearGradient(0, kamera.horisont, 0, hoyde);
  bakke.addColorStop(0, rgb(disig(F.bakke, 500)));
  bakke.addColorStop(0.18, rgb(disig(F.bakke, 160)));
  bakke.addColorStop(1, rgb(F.gate));
  g.fillStyle = bakke;
  g.fillRect(0, kamera.horisont, P, hoyde - kamera.horisont);
  const byKant = projiser(BY.ytre, 0, 0, kamera)[1];
  const vann = g.createLinearGradient(0, kamera.horisont, 0, byKant + 2);
  vann.addColorStop(0, F.vann[1]); vann.addColorStop(1, F.vann[0]);
  g.fillStyle = vann;
  g.beginPath(); g.moveTo(P * 0.55, kamera.horisont);
  for (let x = P * 0.55; x <= P * 0.86; x += 4) g.lineTo(x, kamera.horisont + (byKant + 3 - kamera.horisont) * Math.min(1, Math.sin(((x - P * 0.55) / (P * 0.31)) * Math.PI) * 2.4));
  g.lineTo(P * 0.86, kamera.horisont); g.fill();

  /** En flate med fire hjørner. Vannrette kanter deles opp, siden rette linjer blir buer på et panorama. */
  const flate = (hjorner, mot, farge) => {
    g.fillStyle = farge;
    const punkter = [];
    for (let i = 0; i < hjorner.length; i++) {
      const a = hjorner[i], b = hjorner[(i + 1) % hjorner.length];
      const n = a[0] === b[0] && a[1] === b[1] ? 1 : Math.min(8, 1 + Math.ceil(120 / Math.hypot(a[0], a[1])));
      for (let k = 0; k < n; k++) { const s = k / n; punkter.push(projiser(a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s, kamera, mot)); }
    }
    let lav = Infinity, hoy = -Infinity;
    for (const p of punkter) { if (p[0] < lav) lav = p[0]; if (p[0] > hoy) hoy = p[0]; }
    for (const o of [0, P, -P, 2 * P]) {
      if (hoy + o < 0 || lav + o > P) continue;
      g.beginPath();
      punkter.forEach((p, i) => (i ? g.lineTo(p[0] + o, p[1]) : g.moveTo(p[0] + o, p[1])));
      g.closePath(); g.fill();
    }
  };
  const firkant = (h, r) => [[h.x - r, h.y - r], [h.x + r, h.y - r], [h.x + r, h.y + r], [h.x - r, h.y + r]];

  const dine = dineHus(tilstand.aksjer);
  const alle = [...vanligeHus(dine), ...dine].sort((a, b) => b.d - a.d);
  for (const h of alle) {   // fortau og parker ligger flatt, så de kan tegnes først
    const mot = Math.atan2(h.y, h.x);
    flate(firkant(h, 14).map(([x, y]) => [x, y, 0]), mot, rgb(disig(h.park ? F.park : F.fortau, h.d)));
  }
  for (const h of alle) {
    const mot = Math.atan2(h.y, h.x);
    const eid = Boolean(h.id);
    const tre = (x, y, stor) => {
      const d = Math.hypot(x, y), [px, py] = projiser(x, y, 0, kamera, mot), r = (stor / d) * f;
      for (const o of [0, P, -P]) {
        if (px + o < -r || px + o > P + r) continue;
        g.fillStyle = rgb(disig([96, 70, 48], d)); g.fillRect(px + o - r * 0.14, py - r * 1.1, Math.max(1, r * 0.28), r * 1.1);
        g.fillStyle = rgb(disig(hex(F.tre[Math.floor(fast(Math.round(x), Math.round(y)) * 3)]), d));
        g.beginPath(); g.arc(px + o, py - r * 1.7, r, 0, 7); g.fill();
      }
    };
    if (h.park) { for (let k = 0; k < 5; k++) tre(h.x + (fast(h.i, h.j, 20 + k) - 0.5) * 24, h.y + (fast(h.i, h.j, 30 + k) - 0.5) * 24, 2.4 + fast(h.i, h.j, k) * 1.6); continue; }
    const r = h.bredde / 2, kant = firkant(h, r);
    const grunn = eid ? bland(hex(FIGURER[h.id].tile), [20, 24, 50], F.lys * 0.75) : F.hus[h.farge];
    for (let s = 0; s < 4; s++) {   // veggene som vender mot deg, bakerst først
      const a = kant[s], b = kant[(s + 1) % 4];
      const nx = b[1] - a[1], ny = a[0] - b[0];
      if (nx * (-a[0]) + ny * (-a[1]) <= 0) continue;
      const skygge = s % 2 ? 0.86 : 1;
      flate([[...a, 0], [...b, 0], [...b, h.hoyde], [...a, h.hoyde]], mot, rgb(disig(grunn.map((v) => v * skygge), h.d)));
      if ((h.bredde / h.d) * f < 9) continue;   // for langt unna til at vinduer synes
      const kol = Math.max(2, Math.round(h.bredde / 5));
      for (let e = 0; e < h.etasjer; e++) for (let k = 0; k < kol; k++) {
        const u0 = (k + 0.28) / kol, u1 = (k + 0.72) / kol, z0 = 3.2 * e + 1, z1 = z0 + 1.5;
        const paa = F.lys > 0 && fast(h.i * 7 + e, h.j * 5 + k, s) < F.lys;
        const p = (u, z) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, z];
        flate([p(u0, z0), p(u1, z0), p(u1, z1), p(u0, z1)], mot, rgb(paa ? [255, 214, 130] : disig(F.rute, h.d)));
      }
    }
    if (kamera.oye > h.hoyde || !h.tak || eid) flate(kant.map(([x, y]) => [x, y, h.hoyde]), mot, rgb(disig(eid ? grunn.map((v) => Math.min(255, v * 1.06)) : F.flatt, h.d)));
    if (h.tak && !eid) {   // mønetak
      const topp = h.hoyde + 4.2;
      for (let s = 0; s < 4; s++) {
        const a = kant[s], b = kant[(s + 1) % 4];
        if ((b[1] - a[1]) * (-a[0]) + (a[0] - b[0]) * (-a[1]) <= 0 && kamera.oye < topp) continue;
        flate([[...a, h.hoyde], [...b, h.hoyde], [h.x, h.y, topp]], mot, rgb(disig(F.tak.map((v) => v * (s % 2 ? 0.84 : 1)), h.d)));
      }
    }
    if (eid) {   // figuren står på taket og ser mot deg
      const img = figur(h.id), str = Math.max(11, (15 / h.d) * f);
      const [px, py] = projiser(h.x, h.y, h.hoyde, kamera, mot);
      if (img.complete && img.naturalWidth) for (const o of [0, P, -P]) if (px + o > -str && px + o < P + str) g.drawImage(img, px + o - str / 2, py - str * 0.94, str, str);
    }
  }
  return c;
}

// ---------- Rundturen ----------

let api = null, nokkel = "", sistTegnet = -Infinity, planlagt = 0, lag = null, forrigeEtasje = null;
const start = performance.now();

function oppsett() {
  const z = el.utsikt.getBoundingClientRect().width / el.utsikt.offsetWidth || 1;   // på PC er spillet zoomet
  const b = el.utsikt.offsetWidth, h = Math.min(el.utsikt.offsetHeight, innerHeight / z);
  return { b, h, grader: Math.max(46, Math.min(82, b / 14)) };
}

function be() {
  if (planlagt) return;
  planlagt = setTimeout(() => { planlagt = 0; bygg(); }, Math.max(60, NY_TEGNING_MS - (performance.now() - sistTegnet)));
}

function bygg() {
  if (!api) return;
  const t = api.hent();
  const { b, h, grader } = oppsett();
  if (!(b > 40) || !(h > 40)) return;
  const ny = `${Math.round(b)}x${Math.round(h)}:${morkt.matches}:${etasje(t)}:${Object.values(t.aksjer).join(",")}`;
  if (ny === nokkel) return;
  nokkel = ny;
  sistTegnet = performance.now();
  el.rute.style.height = `${Math.round(h)}px`;
  const bp = Math.round(b / PIKSEL), hp = Math.round(h / PIKSEL);
  const pano = tegnPanorama(t, bp, hp, grader);
  // Etter panoramaet kommer begynnelsen av det en gang til, så runden går rundt uten skjøt.
  const hale = document.createElement("canvas");
  hale.width = bp; hale.height = hp;
  hale.getContext("2d").drawImage(pano, 0, 0);
  const full = pano.width * PIKSEL;
  const nytt = document.createElement("div");
  nytt.className = "utsikt-lag";
  for (const c of [pano, hale]) { c.style.width = `${c.width * PIKSEL}px`; c.style.height = `${Math.round(h)}px`; nytt.append(c); }
  el.rute.append(nytt);
  const tur = nytt.animate([{ transform: "translate3d(0,0,0)" }, { transform: `translate3d(${-full}px,0,0)` }], { duration: RUNDE_MS, iterations: Infinity });
  tur.currentTime = (performance.now() - start + RUNDE_MS * 0.1) % RUNDE_MS;   // samme retning som før, så byen ikke hopper
  if (rolig.matches) tur.pause();
  const gammelt = lag;
  lag = nytt;
  const opp = forrigeEtasje !== null && etasje(t) > forrigeEtasje;
  forrigeEtasje = etasje(t);
  if (!gammelt) return;
  // Ny etasje: du løftes opp, så den gamle utsikten synker og blekner. Ellers bare et mykt skifte.
  const ms = rolig.matches ? 1 : opp ? 1100 : 350;
  const ut = gammelt.animate(opp && !rolig.matches ? [{ opacity: 1, translate: "0 0" }, { opacity: 0, translate: "0 14%" }] : [{ opacity: 1 }, { opacity: 0 }], { duration: ms, easing: "cubic-bezier(0.77, 0, 0.175, 1)", fill: "forwards" });
  ut.finished.then(() => gammelt.remove(), () => gammelt.remove());
  el.rute.append(gammelt);   // den gamle ligger øverst mens den blekner
}

function lagKorn() {
  const c = document.createElement("canvas");
  c.width = c.height = 96;
  const g = c.getContext("2d"), b = g.createImageData(96, 96);
  for (let i = 0; i < b.data.length; i += 4) { b.data[i] = b.data[i + 1] = b.data[i + 2] = Math.random() * 255; b.data[i + 3] = 255; }
  g.putImageData(b, 0, 0);
  el.korn.style.backgroundImage = `url(${c.toDataURL()})`;
}

/** Kalles når noe er endret i spillet. Tegner bare når utsikten faktisk er ny. */
export function tegn() {
  if (!api) return;
  const t = api.hent();
  const ny = `${etasje(t)}:${Object.values(t.aksjer).join(",")}`;
  if (!nokkel.endsWith(`:${ny}`)) be();
}

export function start360(a) {
  api = a;
  lagKorn();
  bygg();
  morkt.addEventListener?.("change", be);
  if ("ResizeObserver" in window) new ResizeObserver(be).observe(el.utsikt);
  addEventListener("resize", be);
}
