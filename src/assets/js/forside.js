// Forsidegrafikken: en kurs som glir mot venstre og svinger opp og ned.
// Biter som stiger tegnes grønt, biter som faller tegnes rødt. Bare pynt, ingen tall.

const lerret = document.getElementById("kurs");
const ctx = lerret.getContext("2d");
const rolig = matchMedia("(prefers-reduced-motion: reduce)");

const AVSTAND = 5;      // piksler mellom punktene
const FART = 38;        // piksler per sekund
const HODE = 0.86;      // hvor langt til høyre kurven ender, som andel av bredden

let bredde = 0, hoyde = 0, antall = 0;
let punkter = [];       // verdier mellom 0 (bunn) og 1 (topp); det siste er det neste punktet
let fart = 0;
let retning = 1;        // langsom trend som bytter av og til, så vi får tydelige oppturer og nedturer
let andel = 0;          // hvor langt vi er kommet mot neste punkt
let farger = {};

function lesFarger() {
  const s = getComputedStyle(document.documentElement);
  farger = {
    opp: s.getPropertyValue("--opp").trim() || "#1F9D55",
    ned: s.getPropertyValue("--ned").trim() || "#D64545",
    rute: s.getPropertyValue("--rule").trim() || "#D7DDD5",
  };
}

function nestePunkt(forrige) {
  if (Math.random() < 0.025) retning = -retning;
  const trend = retning * 0.0045 + 0.0008;              // litt mer opp enn ned over tid
  const tilbake = (0.55 - forrige) * 0.02;              // trekkes mot midten, så kurven blir i bildet
  fart = fart * 0.85 + trend + tilbake + (Math.random() - 0.5) * 0.018;
  return Math.min(0.92, Math.max(0.12, forrige + fart));
}

function tilpass() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  bredde = lerret.clientWidth;
  hoyde = lerret.clientHeight;
  lerret.width = Math.round(bredde * dpr);
  lerret.height = Math.round(hoyde * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const trengs = Math.ceil((bredde * HODE) / AVSTAND) + 3;
  if (!punkter.length) punkter = [0.4];
  while (punkter.length < trengs) punkter.push(nestePunkt(punkter[punkter.length - 1]));
  if (punkter.length > trengs) punkter = punkter.slice(punkter.length - trengs);
  antall = trengs;
}

const y = (v) => 18 + (1 - v) * (hoyde - 36);

function tegn(tid) {
  ctx.clearRect(0, 0, bredde, hoyde);
  const hodeX = bredde * HODE;

  // Diskré rutenett
  ctx.save();
  ctx.strokeStyle = farger.rute;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 6]);
  for (let i = 1; i <= 3; i++) {
    const ry = Math.round((hoyde / 4) * i) + 0.5;
    ctx.beginPath(); ctx.moveTo(0, ry); ctx.lineTo(bredde, ry); ctx.stroke();
  }
  ctx.restore();

  // Punktene på skjermen. Det siste er hodet, interpolert mot neste verdi.
  const n = punkter.length - 1;
  const xy = [];
  for (let i = 0; i < n; i++) xy.push([hodeX - andel * AVSTAND - (n - 1 - i) * AVSTAND, punkter[i]]);
  const hodeV = punkter[n - 1] + (punkter[n] - punkter[n - 1]) * andel;
  xy.push([hodeX, hodeV]);

  // Del kurven i strekninger med samme retning.
  const biter = [];
  for (let i = 1; i < xy.length; i++) {
    const opp = xy[i][1] >= xy[i - 1][1];
    const siste = biter[biter.length - 1];
    if (siste && siste.opp === opp) siste.pts.push(xy[i]);
    else biter.push({ opp, pts: [xy[i - 1], xy[i]] });
  }

  // Flate under kurven, tonet ut nedover.
  for (const b of biter) {
    const farge = b.opp ? farger.opp : farger.ned;
    const g = ctx.createLinearGradient(0, 0, 0, hoyde);
    g.addColorStop(0, farge + "40");
    g.addColorStop(1, farge + "00");
    ctx.fillStyle = g;
    ctx.beginPath();
    // Et halvt piksel overlapp på hver side, så det ikke blir lyse striper der fargen skifter.
    const forste = b.pts[0], siste = b.pts[b.pts.length - 1];
    ctx.moveTo(forste[0] - 0.5, hoyde);
    ctx.lineTo(forste[0] - 0.5, y(forste[1]));
    for (const [px, v] of b.pts) ctx.lineTo(px, y(v));
    ctx.lineTo(siste[0] + 0.5, y(siste[1]));
    ctx.lineTo(siste[0] + 0.5, hoyde);
    ctx.closePath();
    ctx.fill();
  }

  // Selve linjen, med glød.
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const b of biter) {
    const farge = b.opp ? farger.opp : farger.ned;
    ctx.strokeStyle = farge;
    ctx.shadowColor = farge + "99";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    b.pts.forEach(([px, v], i) => (i ? ctx.lineTo(px, y(v)) : ctx.moveTo(px, y(v))));
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // Hodet: prikk med en ring som pulserer.
  const opp = punkter[n] >= punkter[n - 1];
  const farge = opp ? farger.opp : farger.ned;
  const hy = y(hodeV);
  const puls = ((tid || 0) % 1600) / 1600;
  ctx.fillStyle = farge;
  ctx.globalAlpha = 0.35 * (1 - puls);
  ctx.beginPath(); ctx.arc(hodeX, hy, 5 + puls * 16, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath(); ctx.arc(hodeX, hy, 5, 0, Math.PI * 2); ctx.fill();

  // Stiplet linje fra hodet ut til høyre kant, som en kursmarkør.
  ctx.strokeStyle = farge;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath(); ctx.moveTo(hodeX + 10, hy); ctx.lineTo(bredde, hy); ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

let forrigeTid = 0;
let synlig = true;
let ramme = 0;

function steg(tid) {
  const dt = Math.min(0.05, (tid - (forrigeTid || tid)) / 1000);
  forrigeTid = tid;
  andel += (FART * dt) / AVSTAND;
  while (andel >= 1) {
    andel -= 1;
    punkter.shift();
    punkter.push(nestePunkt(punkter[punkter.length - 1]));
  }
  tegn(tid);
  ramme = synlig && !rolig.matches ? requestAnimationFrame(steg) : 0;
}

function start() {
  if (ramme || rolig.matches || !synlig) return;
  forrigeTid = 0;
  ramme = requestAnimationFrame(steg);
}

lesFarger();
tilpass();
tegn(0);
start();

new ResizeObserver(() => { tilpass(); tegn(performance.now()); }).observe(lerret);
new IntersectionObserver(([e]) => { synlig = e.isIntersecting; start(); }).observe(lerret);
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { lesFarger(); tegn(performance.now()); });
rolig.addEventListener("change", start);
