// Vinduet i «Overfør»: et blokklandskap med fjell, sol og en liten innsjø, i en runde på 360 grader som går sakte.
// Landskapet tegnes én gang i en egen tråd. Figurene tegnes oppå når du kjøper, og selve rundturen er en ren flytting.
import { etasje, oyehoyde, figurer, plasser, STEDER, tegnHimmel, tegnSkyer, tegnLand } from "/lib/landskap.js";
import { AKSJER } from "/lib/klikker.js";
import { FIGURER } from "./klikker-figurer.js";
import { $, rolig } from "./overfor-felles.js";

const PIKSEL = 1.5;          // så store er punktene i bildet
const RUNDE_MS = 420000;     // sju minutter rundt
const SKYER_MS = 372000;     // skyene driver litt i forhold til fjellene
const TEGN_MS = 500;         // kjøper du mye på en gang, tegnes figurene høyst så ofte
const SPRITE = 48;

const morkt = matchMedia("(prefers-color-scheme: dark)");
const el = { utsikt: $("utsikt"), rute: $("utsikt-rute"), korn: $("utsikt-korn") };
const start = performance.now();
let api = null, nokkel = "", figNokkel = "", scene = null, nr = 0, planlagt = 0, forrigeEtasje = null, sistFigur = -Infinity;

// ---------- Bakgrunnstråden ----------

let arbeider = null;
try {
  arbeider = new Worker("/lib/landskap-arbeider.js" + new URL(import.meta.url).search, { type: "module" });
  arbeider.onerror = () => { arbeider = null; if (venter) bruk({ nr: venter.nr, ...alt(venter) }); };
  arbeider.onmessage = ({ data }) => bruk(data);
} catch { arbeider = null; }
let venter = null;
function alt(k) { const { rgba, dybde } = tegnLand(k); return { himmel: tegnHimmel(k), skyer: tegnSkyer(k), land: rgba, dybde }; }

// ---------- Figurene ----------

const bilder = new Map();
/** Figuren som punkter, så den kan tegnes med klosser og skjules bak trær og bakker. */
function sprite(id) {
  if (bilder.has(id)) return bilder.get(id);
  bilder.set(id, null);
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = c.height = SPRITE;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(img, 0, 0, SPRITE, SPRITE);
    const d = g.getImageData(0, 0, SPRITE, SPRITE).data;
    let bunn = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 120) bunn = Math.floor((i >> 2) / SPRITE);
    bilder.set(id, { d, bunn: bunn + 1 });
    figNokkel = ""; be();
  };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(FIGURER[id].svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" '));
  return null;
}

function tegnFigurer(s, aksjer) {
  const { P, hoyde, natt } = s.k, ut = new ImageData(P, hoyde), d = ut.data, dyp = s.dybde;
  const punkt = (x, y, r, g, b, a, r0) => {
    if (y < 0 || y >= hoyde) return;
    x = ((x % P) + P) % P;
    const i = y * P + x;
    if (dyp[i] < r0 - 1.3) return;
    const q = i * 4, f = d[q + 3] / 255, n = a + f * (1 - a);
    d[q] = (r * a + d[q] * f * (1 - a)) / n; d[q + 1] = (g * a + d[q + 1] * f * (1 - a)) / n; d[q + 2] = (b * a + d[q + 2] * f * (1 - a)) / n; d[q + 3] = n * 255;
  };
  for (const fig of figurer(aksjer)) {
    const sp = sprite(fig.id);
    if (!sp) continue;
    const p = plasser(fig, s.k), h = Math.max(8, Math.round(p.h)), m = SPRITE / h, x0 = Math.round(p.x - h / 2), fot = Math.round(p.y) + 1, y0 = fot - Math.round(sp.bunn / m);
    const br = h * 0.36, hr = Math.max(1.5, br * Math.min(0.5, s.k.oye / fig.r) * 0.75);
    for (let y = -Math.ceil(hr); y <= hr; y++) for (let x = -Math.ceil(br); x <= br; x++) if ((x / br) ** 2 + (y / hr) ** 2 <= 1) punkt(Math.round(p.x) + x, fot - 1 + y, natt ? 255 : 20, natt ? 190 : 34, natt ? 90 : 16, natt ? 0.3 : 0.34, fig.r - 3);
    const tykk = Math.max(1, Math.round(h * 0.055));
    for (let lag = tykk; lag >= 0; lag--) {   // bakerst først: figuren får tykkelse som en kloss
      const l = lag ? 0.5 : natt ? 0.86 : 1;
      for (let y = 0; y < h; y++) for (let x = 0; x < h; x++) {
        const q = (Math.floor((y + 0.5) * m) * SPRITE + Math.floor((x + 0.5) * m)) * 4;
        if (sp.d[q + 3] > 110) punkt(x0 + x + lag, y0 + y, sp.d[q] * l, sp.d[q + 1] * l, sp.d[q + 2] * l, 1, fig.r);
      }
    }
  }
  const c = s.figur.getContext("2d");
  c.putImageData(ut, 0, 0);
  const hale = s.figurHale.getContext("2d");
  hale.clearRect(0, 0, s.figurHale.width, hoyde);
  hale.drawImage(s.figur, 0, 0);
}

// ---------- Rundturen ----------

function oppsett() {
  const b = el.utsikt.offsetWidth, h = el.utsikt.offsetHeight;
  return { b, h, grader: Math.max(50, Math.min(84, b / 8.6)) };
}
function be(ms = 60) {
  if (planlagt) return;
  planlagt = setTimeout(() => { planlagt = 0; bygg(); }, ms);
}
function lerret(b, h) { const c = document.createElement("canvas"); c.width = b; c.height = h; c.style.width = `${b * PIKSEL}px`; c.style.height = `${h * PIKSEL}px`; return c; }

function bygg() {
  if (!api) return;
  const t = api.hent(), etg = etasje(t), { b, h, grader } = oppsett();
  if (!(b > 40) || !(h > 40)) return;
  const ny = `${Math.round(b)}x${Math.round(h)}:${morkt.matches}:${etg}`;
  if (ny !== nokkel) {
    nokkel = ny;
    const hoyde = Math.ceil(h / PIKSEL), k = { nr: ++nr, P: Math.round((b * 360) / grader / PIKSEL), hoyde, horisont: Math.round(hoyde * (0.47 - 0.0065 * etg)), oye: oyehoyde(etg), natt: morkt.matches, bp: Math.ceil(b / PIKSEL), etg };
    venter = k;
    if (arbeider) arbeider.postMessage(k); else setTimeout(() => venter === k && bruk({ nr: k.nr, ...alt(k) }), 30);
    return;
  }
  if (!scene) return;
  const fig = figurNokkel(t);
  if (fig === figNokkel) return;
  if (performance.now() - sistFigur < TEGN_MS) { be(TEGN_MS); return; }
  figNokkel = fig; sistFigur = performance.now();
  tegnFigurer(scene, t.aksjer);
}
const figurNokkel = (t) => AKSJER.map((a, s) => Math.min(t.aksjer[a.id] ?? 0, STEDER[s].length * 9)).join(",");

function bruk(data) {
  if (!venter || data.nr !== venter.nr) return;
  const k = venter, { P, hoyde, bp } = k;
  venter = null;
  const rot = document.createElement("div");
  rot.className = "utsikt-lag";
  const strimmel = (rgba, ms, klasse) => {
    const s = document.createElement("div"), pano = lerret(P, hoyde), hale = lerret(bp, hoyde);
    s.className = `utsikt-strimmel u-${klasse}`;
    if (rgba) pano.getContext("2d").putImageData(new ImageData(rgba, P, hoyde), 0, 0);
    hale.getContext("2d").drawImage(pano, 0, 0);   // begynnelsen en gang til, så runden går rundt uten skjøt
    s.append(pano, hale);
    rot.append(s);
    const tur = s.animate([{ transform: "translate3d(0,0,0)" }, { transform: `translate3d(${-P * PIKSEL}px,0,0)` }], { duration: ms, iterations: Infinity });
    tur.currentTime = (performance.now() - start + ms * 0.015) % ms;   // samme retning som før, så landskapet ikke hopper
    if (rolig.matches) tur.pause();
    return [pano, hale];
  };
  strimmel(data.himmel, RUNDE_MS, "himmel");
  strimmel(data.skyer, SKYER_MS, "skyer");
  strimmel(data.land, RUNDE_MS, "land");
  const [figur, figurHale] = strimmel(null, RUNDE_MS, "figurer");
  const gammel = scene;
  scene = { k, rot, figur, figurHale, dybde: data.dybde };
  const t = api.hent();
  figNokkel = figurNokkel(t);
  tegnFigurer(scene, t.aksjer);
  el.rute.append(rot);
  const opp = forrigeEtasje !== null && k.etg > forrigeEtasje;
  forrigeEtasje = k.etg;
  if (!gammel) { rot.animate([{ opacity: 0 }, { opacity: 1 }], { duration: rolig.matches ? 1 : 500 }); return; }
  // Nytt selskap: du løftes opp, så den gamle utsikten synker og blekner. Ellers bare et mykt skifte.
  const ms = rolig.matches ? 1 : opp ? 1100 : 350;
  const ut = gammel.rot.animate(opp && !rolig.matches ? [{ opacity: 1, translate: "0 0" }, { opacity: 0, translate: "0 10%" }] : [{ opacity: 1 }, { opacity: 0 }], { duration: ms, easing: "cubic-bezier(0.77, 0, 0.175, 1)", fill: "forwards" });
  ut.finished.then(() => gammel.rot.remove(), () => gammel.rot.remove());
  el.rute.append(gammel.rot);   // den gamle ligger øverst mens den blekner
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
  if (!nokkel.endsWith(`:${etasje(t)}`) || figurNokkel(t) !== figNokkel) be();
}

export function start360(a) {
  api = a;
  lagKorn();
  bygg();
  const ny = () => be(200);
  morkt.addEventListener?.("change", ny);
  if ("ResizeObserver" in window) new ResizeObserver(ny).observe(el.utsikt);
  addEventListener("resize", ny);
}
