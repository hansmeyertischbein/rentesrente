// Ordjakt: grensesnitt og pikselscene. Regnelogikken ligger i /lib/ordjakt.js.
import { SVAR_PER_RUNDE, SEKUNDER_PER_RUNDE, vurder, rekkefolge, nyKode, gyldigKode, simulerSpillere, toppProsent, BOOST_SEKUNDER, boostFaktor, nesteRekke, medBoost } from "/lib/ordjakt.js";
import { VERSJON, tapFor, netto, tolkStatus, kanStarte, avtal, erVert, antallRunder, STANDARD_RUNDER } from "/lib/ordjakt-duell.js";
import { kommentar } from "/lib/ordjakt-kommentarer.js";
import { lasOpp, settLyd, spillFanfare, spillSkudd, spillTreff, spillPlask } from "./ordjakt-lyd.js";
import { VARER, FLERE, EKSTRA_SEKUNDER, nyKasse, lesKasse, tjen, mynterFor, kjop, velg, bruk } from "/lib/ordjakt-butikk.js";
import { BREDDE, HOYDE, nyBorg, igjen as steinerIgjen, sikt, knus } from "/lib/ordjakt-borg.js";
import data from "./ordjakt-data.js";
import { kobleTilRom } from "./ordjakt-rom.js";

const $ = (id) => document.getElementById(id);
// Pengene huskes bare på denne enheten, og bare når spilleren har krysset av for det.
let kasse = nyKasse(), husk = false;
try { const lagret = localStorage.getItem("rr-ordjakt-kasse"); if (lagret) { kasse = lesKasse(lagret); husk = true; } } catch { /* lageret er stengt */ }

const scene = $("oj");
const lerret = $("lerret");
const ctx = lerret.getContext("2d");
const roligere = matchMedia("(prefers-reduced-motion: reduce)").matches;
const FART = roligere ? 2.2 : 1; // kortere animasjoner når brukeren vil ha mindre bevegelse
const fmt = (n) => n.toLocaleString("nb-NO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/* ---------------- Tilfeldige tall med frø, så teksturene ikke flimrer ---------------- */
function hash(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const blend = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c, a = 1) => `rgb(${c[0]} ${c[1]} ${c[2]} / ${a})`;

/* ---------------- Pikselskrift, 3 × 5 ---------------- */
const GLYFER = {
  "0": "111101101101111", "1": "010110010010111", "2": "111001111100111", "3": "111001111001111", "4": "101101111001001",
  "5": "111100111001111", "6": "111100111101111", "7": "111001010010010", "8": "111101111101111", "9": "111101111001111",
  ",": "000000000010100", "−": "000000111000000", "+": "000010111010000", " ": "000000000000000",
};
function tegnTekst(tekst, cx, cy, s, farge, alfa = 1, oppløs = 0, frø = 1) {
  const tegn = [...tekst].map((c) => GLYFER[c] ?? GLYFER[" "]);
  const bredde = tegn.length * 4 * s - s;
  const x0 = Math.round(cx - bredde / 2), y0 = Math.round(cy - 2.5 * s);
  const lys = [];
  tegn.forEach((g, i) => {
    for (let p = 0; p < 15; p++) if (g[p] === "1" && hash(i * 15 + p, frø, 7) >= oppløs) lys.push([x0 + i * 4 * s + (p % 3) * s, y0 + Math.floor(p / 3) * s]);
  });
  ctx.globalAlpha = alfa;
  ctx.fillStyle = "#08131c";
  for (const [x, y] of lys) ctx.fillRect(x - 1, y - 1, s + 2, s + 2);
  ctx.fillStyle = farge;
  for (const [x, y] of lys) ctx.fillRect(x, y, s, s);
  ctx.fillStyle = "rgb(255 255 255 / 0.35)";
  for (const [x, y] of lys) ctx.fillRect(x, y, s, 1);
  ctx.globalAlpha = 1;
}

/* ---------------- Scenen ---------------- */
const B = 320; // bredde i spillpiksler
let H = 200, vann = 50, bunn = 190, bak = null;
const mål = { kanonX: 0, kanonY: 0, treff: [0, 0], hvile: [160, 110], total: [160, 20], skipX: 10 };

const STEIN = [[118, 118, 122], [96, 96, 102], [140, 138, 140]];
const kystY = () => vann - Math.max(6, Math.round(vann * 0.2));
let duell = false; // mot en venn: to skip på åpent hav, uten land og borg
const veggX = (y) => duell ? B + 50 : Math.round(B * 0.8) + Math.floor(hash(0, Math.floor(y / 5), 3) * 5) + (y > vann ? Math.floor((y - vann) / 14) : 0);
const bunnY = (x) => bunn - Math.round(3 * Math.sin(x / 23) + 2 * Math.sin(x / 7 + 1));

function lagBakgrunn() {
  const c = document.createElement("canvas");
  c.width = B; c.height = H;
  const g = c.getContext("2d");
  const bilde = g.createImageData(B, H);
  const himmelTopp = [74, 150, 214], himmelBunn = [178, 224, 244];
  const vannTopp = [38, 128, 178], vannBunn = [6, 30, 56];
  const sandA = [214, 190, 128], sandB = [186, 160, 100];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < B; x++) {
      const st = hash(x, y, 1) - 0.5; // pikselstøy
      let c;
      const vx = veggX(y);
      if (x >= vx && y >= kystY() + Math.floor(hash(Math.floor(x / 4), 0, 5) * 3)) {
        const topp = kystY() + Math.floor(hash(Math.floor(x / 4), 0, 5) * 3);
        const blokk = hash(Math.floor(x / 4), Math.floor(y / 4), 2);
        if (y - topp < 3) c = blend([88, 158, 52], [62, 122, 38], hash(x, y, 9));
        else if (y - topp < 7) c = blend([121, 85, 58], [96, 66, 44], hash(x, y, 9));
        else c = blend(STEIN[Math.floor(blokk * 3)], [70, 70, 76], (x % 4 === 0 || y % 4 === 0) ? 0.35 : 0);
        if (x === vx) c = blend(c, [40, 40, 46], 0.5);
        if (y > vann) c = blend(c, blend(vannTopp, vannBunn, (y - vann) / (H - vann)), 0.55);
      } else if (y < vann) {
        const t = Math.floor((y / vann) * 6) / 6;
        c = blend(himmelTopp, himmelBunn, t);
      } else if (y >= bunnY(x)) {
        c = blend(sandA, sandB, hash(Math.floor(x / 2), Math.floor(y / 2), 4));
        if (hash(x, y, 6) > 0.93) c = [150, 140, 120];
      } else {
        const d = (y - vann) / (bunn - vann);
        c = blend(vannTopp, vannBunn, Math.floor(d * 9) / 9);
        if (((x + y * 0.55) % 46) < 9 && d < 0.7) c = blend(c, [120, 200, 230], 0.12 * (1 - d)); // lysstriper
      }
      const i = (y * B + x) * 4;
      bilde.data[i] = c[0] + st * 14; bilde.data[i + 1] = c[1] + st * 14; bilde.data[i + 2] = c[2] + st * 14; bilde.data[i + 3] = 255;
    }
  }
  g.putImageData(bilde, 0, 0);
  // steiner på bunnen
  for (let k = 0; k < 9; k++) {
    const x = Math.floor(hash(k, 1, 11) * (B * 0.8)), w = 4 + Math.floor(hash(k, 2, 11) * 8), y = bunnY(x);
    g.fillStyle = rgb(STEIN[k % 3]); g.fillRect(x, y - 3, w, 4);
    g.fillStyle = "rgb(0 0 0 / 0.25)"; g.fillRect(x, y, w, 1);
  }
  // en sunket kiste
  const kx = Math.round(B * 0.12), ky = bunnY(kx) - 6;
  g.fillStyle = "#5a3418"; g.fillRect(kx, ky, 12, 7);
  g.fillStyle = "#7d4a22"; g.fillRect(kx, ky, 12, 2);
  g.fillStyle = "#e0b43c"; g.fillRect(kx + 5, ky + 2, 2, 2); g.fillRect(kx + 2, ky - 1, 2, 1); g.fillRect(kx + 8, ky - 2, 1, 1);
  return c;
}

const skyer = Array.from({ length: 5 }, (_, i) => ({ x: hash(i, 0, 20) * B, y: 4 + hash(i, 1, 20) * 18, w: 3 + Math.floor(hash(i, 2, 20) * 4), v: 2 + hash(i, 3, 20) * 3 }));
function tegnSkyer(dt) {
  for (const s of skyer) {
    s.x += s.v * dt;
    if (s.x > B + 30) s.x = -s.w * 6;
    const y = Math.round(s.y * (vann / 50)), x = Math.round(s.x);
    for (let i = 0; i < s.w; i++) {
      const h = i === 0 || i === s.w - 1 ? 1 : 2;
      ctx.fillStyle = "#f4fbff"; ctx.fillRect(x + i * 6, y - h * 3 + 3, 6, h * 3);
      ctx.fillStyle = "#cfe3ef"; ctx.fillRect(x + i * 6, y + 3, 6, 2);
    }
  }
}

const tang = Array.from({ length: 16 }, (_, i) => ({ x: Math.round(hash(i, 0, 30) * B * 0.78) + 4, h: 10 + Math.floor(hash(i, 1, 30) * 26), f: hash(i, 2, 30) * 6 }));
function tegnTang(t) {
  for (const s of tang) {
    const y0 = bunnY(s.x);
    for (let k = 0; k < s.h; k += 2) {
      const dx = Math.round(Math.sin(t * 1.2 + s.f + k * 0.18) * (k / s.h) * 3);
      ctx.fillStyle = k % 6 < 2 ? "#2f7d3a" : "#256a31";
      ctx.fillRect(s.x + dx, y0 - k - 2, 2, 2);
    }
  }
}

const vare = (type) => VARER.find((v) => v.id === kasse.valgt[type]);
const fiendevare = (type) => VARER.find((v) => v.type === type && v.id === motspiller[type]);
function tegnSkip(t, fiende = false) {
  const seilfarge = (fiende ? fiendevare("seil") : vare("seil"))?.farge ?? [238, 228, 200];
  const treff = duell ? (fiende ? skader.deres : skader.mine) : 0;
  const x = mål.skipX, dy = Math.round(Math.sin(t * 1.6 + (fiende ? 2 : 0)) * 1.2 + Math.min(4, treff * 0.4));
  const dekk = vann - 7 + dy, L = 66;
  // skrog
  for (let r = 0; r < 12; r++) {
    const a = x + Math.round(r * 0.7), b = x + L - Math.round(r * 1.1) + (r < 3 ? 4 - r : 0);
    for (let px = a; px < b; px++) {
      const lys = r % 3 === 0 ? 0.85 : 1;
      const base = r === 2 ? [212, 168, 60] : [112 * lys, 66 * lys, 30 * lys];
      const n = (hash(px, r, 40) - 0.5) * 18;
      ctx.fillStyle = `rgb(${base[0] + n} ${base[1] + n} ${base[2] + n})`;
      ctx.fillRect(px, dekk + r, 1, 1);
    }
  }
  // kanonporter
  ctx.fillStyle = "#1a0f08";
  for (let p = 0; p < 5; p++) ctx.fillRect(x + 12 + p * 9, dekk + 5, 3, 3);
  // akterkastell og rekkverk
  ctx.fillStyle = "#7a4520"; ctx.fillRect(x, dekk - 6, 16, 6);
  ctx.fillStyle = "#5a3418"; ctx.fillRect(x, dekk - 7, 16, 1); ctx.fillRect(x + 16, dekk - 2, L - 16, 1);
  ctx.fillStyle = "#ffd34d"; ctx.fillRect(x + 3, dekk - 4, 2, 2); ctx.fillRect(x + 8, dekk - 4, 2, 2);
  // kanon på dekk, pekende mot fjellet
  ctx.fillStyle = "#222"; ctx.fillRect(x + L - 10, dekk - 4, 8, 3); ctx.fillRect(x + L - 3, dekk - 5, 3, 3);
  ctx.fillStyle = "#5a3418"; ctx.fillRect(x + L - 10, dekk - 1, 4, 1);
  if (!fiende) { mål.kanonX = x + L + 1; mål.kanonY = dekk - 4; }
  for (let i = 0; i < treff; i++) {
    const hx = x + 6 + ((i * 17) % 50), hy = dekk - 1 + Math.floor(hash(i, 2, 60) * 5);
    ctx.fillStyle = "#b5713a"; ctx.fillRect(hx - 1, hy - 1, 8, 1); ctx.fillRect(hx - 1, hy + 5, 5, 1);
    ctx.fillStyle = "#120904"; ctx.fillRect(hx, hy, 6, 5); ctx.fillRect(hx + 6, hy + 1, 2, 2);
  }
  // master og seil
  const topp = Math.max(3, Math.round(vann * 0.08), dekk - 48);
  for (const [mx, h] of [[x + 24, 1], [x + 44, 0.86]]) {
    const mt = Math.round(topp + (dekk - topp) * (1 - h));
    ctx.fillStyle = "#4a2a12"; ctx.fillRect(mx, mt, 2, dekk - mt);
    const seilH = Math.round((dekk - mt) * 0.36);
    for (const [sy, sb] of [[mt + 5, 16], [mt + 7 + seilH, 20]]) {
      for (let yy = 0; yy < seilH; yy++) {
        const bule = Math.round(Math.sin((yy / seilH) * Math.PI) * 2);
        for (let xx = -sb / 2 - bule; xx < sb / 2 + bule; xx++) {
          const n = (hash(mx + xx, sy + yy, 41) - 0.5) * 16;
          ctx.fillStyle = `rgb(${seilfarge[0] + n} ${seilfarge[1] + n} ${seilfarge[2] + n})`;
          ctx.fillRect(mx + 1 + xx, sy + yy, 1, 1);
        }
      }
      ctx.fillStyle = "#4a2a12"; ctx.fillRect(mx - sb / 2 - 2, sy - 1, sb + 6, 1);
    }
    if (h === 1) {
      // flagg med hodeskalle
      ctx.fillStyle = "#111"; ctx.fillRect(mx + 2, mt, 9, 6);
      ctx.fillStyle = "#eee"; ctx.fillRect(mx + 5, mt + 1, 3, 2); ctx.fillRect(mx + 6, mt + 3, 1, 1); ctx.fillRect(mx + 4, mt + 4, 1, 1); ctx.fillRect(mx + 8, mt + 4, 1, 1);
    }
  }
  for (let i = 0; i < treff; i++) {
    const sx = x + 15 + ((i * 11) % 36), sy = topp + 7 + Math.floor(hash(i, 4, 60) * Math.max(4, dekk - topp - 18));
    ctx.fillStyle = "#8fc7e8"; ctx.fillRect(sx, sy, 5, 4); ctx.fillRect(sx + 1, sy + 4, 3, 2);
    ctx.fillStyle = "#3a2a1c"; ctx.fillRect(sx, sy - 1, 5, 1);
  }
  // vann over den nederste delen av skroget
  ctx.fillStyle = "rgb(38 128 178 / 0.55)"; ctx.fillRect(x - 2, vann + 1, L + 8, 6);
}

/* Borgen står på land. Steinene er rutene i /lib/ordjakt-borg.js. */
let borg = nyBorg();
const rute = () => Math.max(2, Math.min(4, Math.floor((kystY() - 2) / HOYDE)));
function stein(s) {
  const r = rute();
  return [Math.round(B * 0.82) + Math.floor((B * 0.18 - BREDDE * r) / 2) + s.x * r, kystY() + 3 - (HOYDE - s.y) * r];
}
function tegnBorg(t) {
  const r = rute();
  for (const s of borg) {
    if (!s.hel) continue;
    const [x, y] = stein(s);
    const n = (hash(s.x, s.y, 50) - 0.5) * 34;
    ctx.fillStyle = s.type === "D" ? `rgb(${94 + n / 2} ${58 + n / 2} ${30 + n / 3})` : `rgb(${164 + n} ${156 + n} ${144 + n})`;
    ctx.fillRect(x, y, r, r);
    ctx.fillStyle = "rgb(40 34 30 / 0.4)";
    ctx.fillRect(x, y + r - 1, r, 1); ctx.fillRect(x + r - 1, y, 1, r);
    if (s.type === "V") { ctx.fillStyle = "#1c1512"; ctx.fillRect(x + (r >> 2), y, Math.max(1, r >> 1), r); }
  }
  const topp = borg.find((s) => s.x === 6 && s.y === 0);
  if (topp.hel) {
    const [x, y] = stein(topp);
    ctx.fillStyle = "#4a2a12"; ctx.fillRect(x + 1, y - 6, 1, 6);
    ctx.fillStyle = "#c22f2f"; ctx.fillRect(x + 2, y - 6, 5 + (Math.sin(t * 2) > 0 ? 1 : 0), 3);
  }
}
function knusBorg(mål) {
  if (!mål) return;
  const r = rute(), start = borg.length;
  const antall = Math.ceil((start / SVAR_PER_RUNDE) * (kasse.valgt.kanon ? 1.8 : 1));
  for (const s of knus(borg, mål, antall)) {
    const [x, y] = stein(s);
    for (let i = 0; i < 3; i++) partikkel(x + Math.random() * r, y + Math.random() * r, -10 - Math.random() * 60, -20 - Math.random() * 70, i ? "#a49c90" : "#7d756b", 1.6, { s: i ? 1 : 2 });
  }
}

function tegnOverflate(t) {
  for (let x = 0; x < B; x++) {
    if (x >= veggX(vann)) break;
    const y = vann + Math.round(Math.sin(x * 0.16 + t * 0.9) * 1);
    ctx.fillStyle = "#8fd3f0"; ctx.fillRect(x, y, 1, 1);
    if ((x + Math.floor(t * 1.5)) % 11 === 0) { ctx.fillStyle = "#ffffff"; ctx.fillRect(x, y - 1, 1, 1); }
  }
}

/* ---------------- Partikler, kanonkuler og tall ---------------- */
const partikler = [];
const kuler = [];
const tall = [];
let rist = 0;

function partikkel(x, y, vx, vy, farge, liv, opts = {}) {
  partikler.push({ x, y, vx, vy, farge, liv, maks: liv, g: opts.g ?? 260, s: opts.s ?? 1, boble: !!opts.boble });
}
function sprut(x, n = 12) {
  for (let i = 0; i < n; i++) partikkel(x + (Math.random() - 0.5) * 6, vann, (Math.random() - 0.5) * 60, -40 - Math.random() * 70, Math.random() < 0.5 ? "#dff5ff" : "#8fd3f0", 0.7);
  for (let i = 0; i < 6; i++) partikkel(x + (Math.random() - 0.5) * 8, vann + 4, 0, -10, "#bfe9ff", 1 + Math.random(), { boble: true });
}

function skyt(treff, vedNedslag) {
  spillSkudd();
  const x0 = mål.kanonX, y0 = mål.kanonY;
  const stn = treff && !duell ? sikt(borg) : null;
  const [tx, ty] = treff && duell ? skipsmål(true) : treff ? (stn ? stein(stn) : [Math.round(B * 0.9), kystY()]) : [Math.round(x0 + ((duell ? B - mål.kanonX : veggX(vann)) - x0) * (0.45 + Math.random() * 0.2)), vann];
  const T = 0.6 / FART, g = 260;
  kuler.push({ x: x0, y: y0, vx: (tx - x0) / T, vy: (ty - y0 - 0.5 * g * T * T) / T, g, t: 0, T, treff, stn, vedNedslag, farge: vare("kule")?.farge });
  for (let i = 0; i < 10; i++) partikkel(x0 + 1, y0 + 1, 40 + Math.random() * 60, (Math.random() - 0.7) * 50, i < 4 ? "#ffd34d" : "#ff8a3d", 0.18, { g: 0 });
  for (let i = 0; i < 8; i++) partikkel(x0, y0, 10 + Math.random() * 25, -8 - Math.random() * 14, "#d9d9d9", 0.9 + Math.random() * 0.5, { g: -10, s: 2 });
}

let plass = 0; // seks plasser under feltet, så tall som kommer raskt, ikke dekker hverandre
// Et tilfeldig punkt på skroget eller seilene, på motspillerens skip eller ditt.
function skipsmål(fiende) {
  const x = mål.skipX + 14 + Math.random() * 40, y = vann - 4 - Math.random() * Math.min(30, vann * 0.5);
  return [fiende ? B - x : x, y];
}
// Motspilleren skyter på deg. tap er poengene du mister når kula treffer.
function fiendeskudd(tap) {
  spillSkudd();
  const x0 = B - mål.kanonX, y0 = mål.kanonY, [tx, ty] = skipsmål(false), T = 0.6 / FART, g = 260;
  kuler.push({ x: x0, y: y0, vx: (tx - x0) / T, vy: (ty - y0 - 0.5 * g * T * T) / T, g, t: 0, T, treff: true, motMeg: true, tap, farge: fiendevare("kule")?.farge });
  for (let i = 0; i < 8; i++) partikkel(x0 - 1, y0 + 1, -40 - Math.random() * 60, (Math.random() - 0.7) * 50, i < 4 ? "#ffd34d" : "#ff8a3d", 0.18, { g: 0 });
}
const taptall = []; // «−10» som stiger opp fra skipet som ble truffet
function visTap(tap, fiende) {
  if (tap > 0) taptall.push({ tekst: "−" + tap, x: fiende ? B - mål.skipX - 34 : mål.skipX + 34, y: vann - 22, t: 0 });
}

function nyttTall(tekst, poeng, x, y, farge, synkerBare) {
  tall.push({ tekst, poeng, farge, x, y, vx: -35 - Math.random() * 25, vy: -70, fase: "fall", t: 0, frø: Math.floor(Math.random() * 1000), synkerBare, hvileX: mål.hvile[0] + [0, -56, 56][plass % 3], rad: plass >= 3 ? 14 : 0 });
  plass = (plass + 1) % 6;
}

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

function oppdater(dt) {
  for (const k of kuler) {
    k.t += dt; k.x += k.vx * dt; k.vy += k.g * dt; k.y += k.vy * dt;
    if (Math.random() < 0.6) partikkel(k.x, k.y, 0, -4, k.farge ?? "rgb(220 220 220 / 0.7)", 0.4, { g: 0, s: k.farge ? 2 : 1 });
    if (k.t >= k.T) {
      k.ferdig = true;
      if (k.treff) {
        rist = roligere ? 0 : 0.25;
        spillTreff();
        if (k.motMeg) { skader.mine++; spill.tapVist += k.tap; visTap(k.tap, false); visTotal(); }
        else if (duell) { skader.deres++; visTap(k.tap ?? 0, true); }
        else knusBorg(k.stn);
        const ut = k.motMeg ? -1 : 1;
        for (let i = 0; i < 18; i++) partikkel(k.x, k.y, ut * (-20 - Math.random() * 80), -30 - Math.random() * 80, duell ? ["#70421e", "#4a2a12", "#eee4c8"][i % 3] : rgb(STEIN[i % 3]), 1.4, { s: 1 + (i % 2) });
        for (let i = 0; i < 8; i++) partikkel(k.x, k.y, -10 - Math.random() * 20, -5 - Math.random() * 15, "#c9c2b8", 0.9, { g: -6, s: 2 });
        for (let i = 0; i < 6; i++) partikkel(k.x, k.y, -30 - Math.random() * 40, -20 - Math.random() * 40, "#ffd34d", 0.25, { g: 0 });
      } else { sprut(k.x, 16); spillPlask(); }
      k.vedNedslag?.(k.treff ? Math.min(k.x, veggX(vann) - 6) : k.x, k.y);
    }
  }
  if (duell) for (const [treff, x] of [[skader.mine, mål.skipX + 30], [skader.deres, B - mål.skipX - 30]]) {
    if (treff >= 3 && Math.random() < dt * treff) partikkel(x + (Math.random() - 0.5) * 30, vann - 8, 4, -10, treff >= 7 && Math.random() < 0.5 ? "#ff8a3d" : "#6b6b6b", 1.6, { g: -8, s: 2 });
  }
  for (const n of taptall) { n.t += dt; n.y -= dt * 12; }
  for (let i = taptall.length - 1; i >= 0; i--) if (taptall[i].t > 1.6) taptall.splice(i, 1);
  for (let i = kuler.length - 1; i >= 0; i--) if (kuler[i].ferdig) kuler.splice(i, 1);

  for (const p of partikler) {
    p.liv -= dt;
    if (p.boble) { p.vy = -18; p.vx = Math.sin((p.liv + p.x) * 9) * 6; if (p.y <= vann + 1) p.liv = 0; }
    else { p.vy += p.g * dt; if (p.y > vann && p.vy > 0 && p.g > 0) { p.vy *= 0.85; p.vx *= 0.9; } }
    p.x += p.vx * dt; p.y += p.vy * dt;
  }
  for (let i = partikler.length - 1; i >= 0; i--) if (partikler[i].liv <= 0 || partikler[i].y > H) partikler.splice(i, 1);

  for (const n of tall) {
    n.t += dt * FART;
    if (n.fase === "fall") {
      n.vy += 260 * dt * FART; n.x += n.vx * dt * FART; n.y += n.vy * dt * FART;
      if (n.y >= vann) { sprut(n.x, 14); n.fase = "synk"; n.t = 0; n.sx = n.x; n.sy = n.y; }
    } else if (n.fase === "synk") {
      const k = Math.min(1, n.t / 1.4), e = 1 - (1 - k) ** 3;
      n.x = n.sx + (n.hvileX - n.sx) * e + Math.sin(n.t * 5) * 2 * (1 - k);
      n.y = n.sy + (mål.hvile[1] + n.rad - n.sy) * e;
      if (Math.random() < 0.15) partikkel(n.x, n.y - 4, 0, -18, "#bfe9ff", 2, { boble: true });
      if (k >= 1) { n.fase = "hvil"; n.t = 0; }
    } else if (n.fase === "hvil") {
      n.y = mål.hvile[1] + n.rad + Math.round(Math.sin(n.t * 3) * 1);
      if (n.t > 0.8) { n.fase = n.synkerBare ? "løs" : "stig"; n.t = 0; n.sy = n.y; }
    } else if (n.fase === "løs") {
      if (n.t > 0.8) n.ferdig = true;
    } else if (n.fase === "stig") {
      const k = Math.min(1, n.t / 1.2);
      n.y = n.sy + (vann - 3 - n.sy) * ease(k);
      n.x = n.hvileX + Math.sin(n.t * 6) * 1.5;
      if (Math.random() < 0.5) partikkel(n.x + (Math.random() - 0.5) * 10, n.y + 5, 0, -18, "#d8f3ff", 1, { boble: true });
      if (k >= 1) { n.fase = "damp"; n.t = 0; n.sx = n.x; n.sy = n.y; }
    } else if (n.fase === "damp") {
      const k = Math.min(1, n.t / 1.0), e = k * k;
      n.x = n.sx + (mål.total[0] - n.sx) * e;
      n.y = n.sy + (mål.total[1] - n.sy) * e;
      for (let i = 0; i < 3; i++) partikkel(n.x + (Math.random() - 0.5) * 14, n.y + (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 10, -15 - Math.random() * 15, `rgb(255 255 255 / ${0.6 - k * 0.4})`, 0.6, { g: -20, s: Math.random() < 0.3 ? 2 : 1 });
      if (k >= 1) { n.ferdig = true; vedAnkomst(n.poeng); }
    }
  }
  for (let i = tall.length - 1; i >= 0; i--) if (tall[i].ferdig) tall.splice(i, 1);
  if (spill.sluttTidligst && !tall.length && !kuler.length && Date.now() >= spill.sluttTidligst) { spill.sluttTidligst = 0; visSlutt(); }
  rist = Math.max(0, rist - dt);
}

function tegn(t) {
  ctx.save();
  if (rist > 0) ctx.translate(Math.round((Math.random() - 0.5) * 4), Math.round((Math.random() - 0.5) * 3));
  ctx.drawImage(bak, 0, 0);
  tegnSkyer(sistDt);
  tegnTang(t);
  if (duell) { ctx.save(); ctx.translate(B, 0); ctx.scale(-1, 1); tegnSkip(t, true); ctx.restore(); } else tegnBorg(t);
  tegnSkip(t);
  tegnOverflate(t);
  for (const k of kuler) { ctx.fillStyle = k.farge ?? "#111"; ctx.fillRect(Math.round(k.x) - 1, Math.round(k.y) - 1, 3, 3); ctx.fillStyle = "#666"; ctx.fillRect(Math.round(k.x) - 1, Math.round(k.y) - 1, 1, 1); }
  for (const p of partikler) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.liv / p.maks + 0.2));
    ctx.fillStyle = p.farge; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
  }
  ctx.globalAlpha = 1;
  const s = B >= 320 ? 2 : 1;
  for (const n of tall) {
    let alfa = 1, opp = 0;
    if (n.fase === "damp") { const k = Math.min(1, n.t / 1.0); alfa = 1 - k * 0.6; opp = k * 0.85; }
    if (n.fase === "løs") { opp = Math.min(1, n.t / 0.8); }
    if (n.y > vann) alfa *= 0.92;
    tegnTekst(n.tekst, n.x, n.y, s, n.farge, alfa, opp, n.frø);
  }
  for (const n of taptall) tegnTekst(n.tekst, n.x, n.y, s, "#ff6f5e", Math.max(0, 1 - n.t / 1.6));
  ctx.restore();
}

let sist = performance.now(), sistDt = 0;
function løkke(nå) {
  sistDt = Math.min(0.05, (nå - sist) / 1000);
  sist = nå;
  oppdater(sistDt);
  tegn(nå / 1000);
  requestAnimationFrame(løkke);
}

function tilLerret(el, ankerY = 0.5) {
  const a = scene.getBoundingClientRect(), b = el.getBoundingClientRect();
  const k = B / a.width;
  return [Math.round((b.left + b.width / 2 - a.left) * k), Math.round((b.top + b.height * ankerY - a.top) * k)];
}

function tilpass() {
  const r = scene.getBoundingClientRect();
  H = Math.max(120, Math.round((B * r.height) / r.width));
  lerret.width = B; lerret.height = H;
  vann = Math.round(H * 0.25);
  bunn = H - 8;
  bak = lagBakgrunn();
  mål.skipX = Math.max(4, Math.round(B * 0.03));
  oppdaterMål();
  tegn(performance.now() / 1000); // endret størrelse tømmer lerretet
}
function oppdaterMål() {
  const skjema = $("skjema");
  if (!skjema.hidden) {
    const [x, y] = tilLerret(skjema, 1);
    mål.hvile = [x, y + Math.round(H * 0.11)];
  } else mål.hvile = [B / 2, Math.round(H * 0.55)];
  mål.total = tilLerret($("total"));
}

function lagKorn() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d"), bilde = g.createImageData(128, 128);
  for (let i = 0; i < bilde.data.length; i += 4) {
    const v = Math.random() * 255;
    bilde.data[i] = bilde.data[i + 1] = bilde.data[i + 2] = v; bilde.data[i + 3] = 255;
  }
  g.putImageData(bilde, 0, 0);
  const korn = scene.querySelector(".oj-korn");
  korn.style.backgroundImage = `url(${c.toDataURL()})`;
  korn.style.backgroundSize = "384px";
  korn.style.imageRendering = "pixelated";
}

/* ---------------- Spillet ---------------- */
const KATEGORIER = data.kategorier;
const meg = Math.random().toString(36).slice(2, 10);
const spill = { kode: null, rekkefolge: [], runde: 0, svar: [], brukt: new Set(), total: 0, vist: 0, ferdig: false, låst: false, frist: 0, klokke: null, sluttTidligst: 0, sluttTittel: "", rekke: 0, sisteTreff: 0, hjelp: false, tapVist: 0, mynterGitt: true };
const skader = { mine: 0, deres: 0 }; // treff på hvert skip, slik de er tegnet
const mitt = { skade: 0, treff: 0 }; // det du har gjort mot motspilleren i denne runden
let frøMitt = Math.random().toString(36).slice(2, 10); // rekkefølgen av kategorier; i rom avtales den mellom dere
let startet = false;
let rom = null;
const TOM = { id: null, fro: "", gammel: false, startet: false, klar: false, neste: 0, runde: 0, brutto: 0, svar: 0, ferdig: false, skade: 0, treff: 0, seil: null, kule: null, vert: false, antall: STANDARD_RUNDER, ord: [], sum: 0 };
const motspiller = { ...TOM };
let kontakt = 0, klar = false, nedtelling = null, puls = null, treffSett = 0, skadeSett = 0;
// En kamp er et valgt antall runder. sumMeg er poengene dine fra de ferdige rundene i kampen.
let vertMeg = false, valgtRunder = STANDARD_RUNDER, kampStart = 0, kampAntall = STANDARD_RUNDER, sumMeg = 0, nyKamp = true;
const rund = (x) => Math.round(x * 10) / 10;
const jegVert = () => erVert({ id: meg, vert: vertMeg }, motspiller);
const rundeNr = () => spill.runde - kampStart + 1;
const sisteRunde = () => !!rom && rundeNr() >= kampAntall;
const sammeRunde = () => !!motspiller.id && motspiller.startet && startet && motspiller.runde === spill.runde;
const skadeMottatt = () => (sammeRunde() ? motspiller.skade : skadeSett);
const minNetto = () => netto(spill.total, rom ? skadeMottatt() : 0);
const deresNetto = () => netto(motspiller.brutto, mitt.skade);
const visTotal = () => { $("total").textContent = fmt(netto(spill.vist, spill.tapVist)); };

const kategori = () => KATEGORIER[spill.rekkefolge[spill.runde % KATEGORIER.length]];
const vis = (id, på) => { $(id).hidden = !på; };

function startRunde() {
  startet = true; klar = false;
  spill.tapVist = 0; spill.mynterGitt = false;
  skader.mine = 0; skader.deres = 0; mitt.skade = 0; mitt.treff = 0; treffSett = 0; skadeSett = 0; taptall.length = 0;
  if (!rom) sett.push(spill.rekkefolge[spill.runde % KATEGORIER.length]);
  borg = nyBorg();
  spill.rekke = 0; spill.sisteTreff = 0; spill.hjelp = false; spill.sluttTidligst = 0;
  tall.length = 0; kuler.length = 0; // tall fra forrige runde skal ikke telle i denne
  spill.svar = []; spill.brukt = new Set(); spill.total = 0; spill.vist = 0; spill.ferdig = false;
  $("kategori").textContent = kategori().navn;
  $("total").textContent = fmt(0);
  $("teller").textContent = `0/${SVAR_PER_RUNDE}`;
  $("logg").replaceChildren();
  $("melding").textContent = "";
  for (const id of ["start", "venter", "slutt", "butikk"]) vis(id, false);
  vis("skjema", true);
  oppdaterMål();
  $("svar").value = "";
  $("svar").focus({ preventScroll: true });
  lasOpp();
  spill.frist = Date.now() + SEKUNDER_PER_RUNDE * 1000;
  clearInterval(spill.klokke);
  spill.klokke = setInterval(tikk, 100);
  tikk();
  visHjelp();
  visMotspiller();
  sendStatus();
  visSkader();
}

// Tiden regnes fra fristen, så den stemmer også når fanen har ligget i bakgrunnen.
function tikk() {
  const igjen = Math.max(0, Math.ceil((spill.frist - Date.now()) / 1000));
  $("tid").textContent = String(igjen);
  $("tid").parentElement.classList.toggle("snart", igjen <= 10);
  visBoost();
  if (igjen === 0) avsluttRunde(true);
}

// Boost-måleren viser hva neste treff ganges med, og hvor lenge det er igjen å svare.
function visBoost() {
  const siden = (Date.now() - spill.sisteTreff) / 1000;
  const aktiv = !spill.ferdig && spill.sisteTreff > 0 && siden <= BOOST_SEKUNDER;
  $("boost").hidden = !aktiv;
  if (!aktiv) return;
  $("boost-tekst").textContent = `Boost ×${fmt(boostFaktor(nesteRekke(spill.rekke, siden)))}`;
  $("boost-fyll").style.transform = `scaleX(${Math.max(0, 1 - siden / BOOST_SEKUNDER)})`;
}

function avsluttRunde(tidenUte) {
  if (spill.ferdig) return;
  if (!$("avslutt").hidden) lukkAvslutt(); // runden ble ferdig før du svarte
  spill.ferdig = true;
  clearInterval(spill.klokke);
  vis("skjema", false); vis("boost", false); vis("hjelp", false);
  $("melding").classList.remove("bom");
  $("melding").textContent = tidenUte === "motspiller" ? "Motspilleren ble ferdig, så runden er over!" : tidenUte ? "Tiden er ute!" : "";
  spill.sluttTittel = tidenUte === "motspiller" ? "Motspilleren ble ferdig først" : tidenUte ? "Tiden er ute!" : "Runden er over";
  if (tidenUte === true) $("tid").textContent = "0";
  spillFanfare();
  sendStatus();
  // Oppsummeringen kommer når fanfaren (3,3 s) er ferdig og alle tallene har fordampet.
  spill.sluttTidligst = Date.now() + 3300;
}

function vedAnkomst(poeng) {
  spill.vist = Math.round((spill.vist + poeng) * 10) / 10;
  visTotal();
  const p = $("total").parentElement;
  p.classList.remove("pulser"); void p.offsetWidth; p.classList.add("pulser");
}

function loggRad(tekst, poeng, null_) {
  const li = document.createElement("li");
  if (null_) li.className = "null";
  li.append(tekst + " ");
  const b = document.createElement("b"); b.textContent = fmt(poeng); li.append(b);
  $("logg").append(li);
}

$("skjema").addEventListener("submit", (e) => {
  e.preventDefault();
  const felt = $("svar");
  const tekst = felt.value.trim();
  if (spill.klokke && Date.now() >= spill.frist) { avsluttRunde(true); return; }
  if (!tekst || spill.låst || spill.ferdig) return;
  const ordliste = kategori().ord;
  const r = vurder(ordliste, tekst, spill.brukt);
  const melding = $("melding");
  melding.classList.toggle("bom", r.status !== "treff");
  if (r.status === "brukt") { melding.textContent = `Du har allerede brukt «${r.ord}». Prøv et annet ord.`; felt.select(); return; }
  felt.value = "";
  spill.låst = true;
  setTimeout(() => { spill.låst = false; }, 700 / FART);
  if (r.status === "treff") {
    spill.brukt.add(r.indeks);
    const nå = Date.now();
    spill.rekke = nesteRekke(spill.rekke, spill.sisteTreff ? (nå - spill.sisteTreff) / 1000 : Infinity);
    spill.sisteTreff = nå;
    const boost = boostFaktor(spill.rekke);
    r.poeng = medBoost(r.poeng, spill.rekke);
    spill.total = Math.round((spill.total + r.poeng) * 10) / 10;
    const andel = Math.round(r.andel * 1000) / 10;
    melding.textContent = `Treff! «${r.ord}» er ${fmt(andel)} % av lesingen. ${fmt(r.poeng)} poeng${boost > 1 ? ` med boost ×${fmt(boost)}` : ""}.`;
    loggRad(r.ord, r.poeng, false);
    const tap = rom ? tapFor(spill.rekke) : 0;
    if (rom) { mitt.treff++; mitt.skade += tap; }
    if (tap) melding.textContent += ` Motspilleren mister ${tap}.`;
    skyt(true, (x, y) => nyttTall("+" + fmt(r.poeng), r.poeng, x, y, "#ffd34d", false));
    kuler.at(-1).tap = tap;
  } else {
    melding.textContent = `«${tekst}» står ikke på lista. 0 poeng.`;
    spill.rekke = 0; spill.sisteTreff = 0;
    loggRad(tekst, 0, true);
    skyt(false, (x) => nyttTall("0", 0, x, vann, "#ff8a7a", true));
  }
  visBoost();
  r.tekst = tekst;
  spill.svar.push(r);
  visMotspiller();
  $("teller").textContent = `${spill.svar.length}/${SVAR_PER_RUNDE}`;
  if (spill.svar.length >= SVAR_PER_RUNDE) avsluttRunde(false);
  else sendStatus();
});

function visSlutt() {
  $("melding").textContent = "";
  spill.vist = spill.total;
  spill.tapVist = rom ? skadeMottatt() : 0;
  visTotal();
  const ord = kategori().ord;
  const topp = toppProsent(simulerSpillere(ord, kategori().navn), spill.total);
  $("kommentar").textContent = kommentar(topp);
  $("rang").textContent = `Du er blant de ${topp} % beste`;
  $("rang-felt").textContent = spill.hjelp ? "mot 2 000 simulerte spillere uten hjelpemidler" : "mot 2 000 simulerte spillere";
  $("tjent").textContent = "Myntene kommer når begge er ferdige.";
  if (!rom) giMynter();
  oppdaterSlutt();
  vis("slutt", true);
  $("neste").focus({ preventScroll: true });
}

function oppdaterSlutt() {
  if (!spill.ferdig || !startet) return;
  const tittel = $("slutt-tittel"), tekst = $("slutt-tekst");
  if (!rom || !motspiller.id || !sammeRunde()) {
    tittel.textContent = spill.sluttTittel;
    visSvarene();
    tekst.textContent = `Du fikk ${fmt(minNetto())} poeng på ${spill.svar.length} svar.`;
    if (rom && !$("slutt").hidden) giMynter();
    return;
  }
  const jeg = minNetto(), de = deresNetto(), mistet = skadeMottatt();
  const skutt = `${mistet ? ` Motspilleren skjøt bort ${mistet} av poengene dine.` : ""}${mitt.skade ? ` Du skjøt bort ${mitt.skade}.` : ""}`;
  visSvarene();
  const a = mittSammenlagt(), b = deresSammenlagt();
  if (motspiller.ferdig) {
    const utfall = (x, y, hva) => (x > y ? `Du vant ${hva}!` : x < y ? `Motspilleren vant ${hva}` : `Uavgjort i ${hva}`);
    tittel.textContent = sisteRunde() ? utfall(a, b, "kampen") : utfall(jeg, de, "runden");
    tekst.textContent = `${spill.sluttTittel === "Motspilleren ble ferdig først" ? "Motspilleren ble ferdig først. " : ""}Du fikk ${fmt(jeg)} poeng, motspilleren fikk ${fmt(de)}.${skutt}`;
    if (!$("slutt").hidden) giMynter();
  } else {
    tittel.textContent = spill.sluttTittel;
    tekst.textContent = `Du har ${fmt(jeg)} poeng. Venter på de siste poengene til motspilleren.${skutt}`;
  }
  $("sammenlagt").textContent = `${sisteRunde() ? "Kampen er ferdig" : `Runde ${rundeNr()} av ${kampAntall}`}. Sammenlagt: du ${fmt(a)}, motspilleren ${fmt(b)}.`;
  if (!$("slutt").hidden) { spill.tapVist = mistet; visTotal(); }
}

// Mot en venn venter myntene til begge er ferdige, fordi skudd på slutten kan ta poeng.
function giMynter() {
  if (spill.mynterGitt) return;
  spill.mynterGitt = true;
  const poeng = minNetto();
  settKasse(tjen(kasse, poeng));
  $("tjent").textContent = `+${mynter(mynterFor(poeng))}. Du har ${mynter(kasse.mynter)}.`;
}
$("neste").addEventListener("click", () => { if (rom) { settKlar(); return; } spill.runde++; startRunde(); });

/* ---------------- Synkron start ---------------- */
const nesteRunde = () => (startet ? spill.runde + 1 : spill.runde);
const avtaltAntall = () => antallRunder({ id: meg, vert: vertMeg, valgt: valgtRunder }, motspiller);
const mittSammenlagt = () => rund(sumMeg + minNetto());
const deresSammenlagt = () => rund(motspiller.sum + (sammeRunde() ? deresNetto() : 0));
const jegNå = () => ({ klar, antall: avtaltAntall(), fro: frøMitt, neste: nesteRunde(), startet, runde: spill.runde });
function settKlar() {
  if (!motspiller.id || motspiller.gammel || klar) return;
  giMynter();
  lasOpp();
  klar = true;
  sendStatus(); visKlar(); provStart();
}
function visKlar() {
  const på = !!rom && !!motspiller.id && !motspiller.gammel;
  for (const [id, tekst] of [["start-na", "Klar"], ["neste", rom ? (startet && sisteRunde() ? "Klar for ny kamp" : "Klar for neste") : "Neste kategori"]]) {
    $(id).disabled = !!rom && (!på || klar);
    $(id).textContent = klar ? "Venter på motspiller …" : tekst;
  }
  if (!rom) return;
  const vert = jegVert();
  $("runder").disabled = !vert || klar || !!nedtelling;
  $("runder").value = String(avtaltAntall());
  $("runder-hvem").textContent = vert ? "Du laget koden, så du velger." : "Den som laget koden, velger.";
  $("rom-status").textContent = motspiller.gammel ? "Motspilleren har en gammel versjon. Be dem laste siden på nytt."
    : !motspiller.id ? "Koblet til. Venter på motspiller …"
    : motspiller.startet && !motspiller.ferdig ? "Motspilleren er midt i en runde. Trykk Klar, så venter du på neste."
    : motspiller.klar ? (klar ? "Begge er klare!" : "Motspilleren er klar. Er du?")
    : klar ? "Du er klar. Venter på at motspilleren trykker Klar."
    : "Motspilleren er med! Trykk Klar når du er klar.";
}
function provStart() {
  if (nedtelling || !rom || !kanStarte(jegNå(), motspiller)) return;
  const runde = nesteRunde(), slutt = Date.now() + 3000;
  for (const id of ["venter", "slutt", "butikk", "start"]) vis(id, false);
  vis("telling", true);
  const vent = () => {
    const igjen = Math.ceil((slutt - Date.now()) / 1000);
    $("telling-tall").textContent = String(Math.max(1, igjen));
    if (igjen > 0) return;
    stoppNedtelling();
    if (!startet || nyKamp || sisteRunde()) { nyKamp = false; sumMeg = 0; kampStart = runde; kampAntall = avtaltAntall(); }
    else sumMeg = rund(sumMeg + minNetto());
    spill.runde = runde;
    startRunde();
  };
  nedtelling = setInterval(vent, 50);
  vent();
}
function stoppNedtelling() { clearInterval(nedtelling); nedtelling = null; vis("telling", false); }

/* ---------------- Rom for to ---------------- */
const konto = { url: scene.dataset.url, nokkel: scene.dataset.nokkel };
if (!konto.url) { $("lag-rom").hidden = true; $("bli-med").hidden = true; }

// Etter runden vises svarene til begge side om side.
function visSvarene() {
  const vises = !!rom && sammeRunde() && motspiller.ferdig;
  $("svarene").hidden = !vises;
  if (!vises) { $("sammenlagt").textContent = ""; return; }
  const mine = spill.svar.map((r) => [r.ord ?? r.tekst, r.poeng]);
  for (const [id, liste] of [["svar-mine", mine], ["svar-deres", motspiller.ord]]) {
    $(id).replaceChildren(...(liste.length ? liste : [["ingen svar", null]]).map(([ord, p]) => {
      const li = document.createElement("li"), b = document.createElement("b");
      li.append(ord + " ");
      if (p !== null) { b.textContent = fmt(p); li.append(b); }
      if (p === 0) li.className = "null";
      return li;
    }));
  }
}

function sendStatus() {
  rom?.sendMelding("status", { v: VERSJON, id: meg, fro: frøMitt, startet, runde: spill.runde, klar, neste: nesteRunde(), brutto: spill.total, total: minNetto(), svar: spill.svar.length, ferdig: startet && spill.ferdig, skade: mitt.skade, treff: mitt.treff, vert: vertMeg, antall: avtaltAntall(), sum: sumMeg, ord: startet && spill.ferdig ? spill.svar.map((r) => [r.ord ?? r.tekst, r.poeng]) : [], seil: kasse.valgt.seil, kule: kasse.valgt.kule });
}

// Nye treff fra motspilleren blir til skudd mot skipet ditt.
function visSkader() {
  if (!sammeRunde()) return;
  const nye = motspiller.treff - treffSett, tap = Math.max(0, motspiller.skade - skadeSett);
  treffSett = Math.max(treffSett, motspiller.treff);
  skadeSett = Math.max(skadeSett, motspiller.skade);
  if (nye > 0 && $("slutt").hidden) for (let i = 0; i < nye; i++) setTimeout(() => { if (rom && startet) fiendeskudd(i === 0 ? tap : 0); }, i * 250);
}

function visMotspiller() {
  const el = $("motstander");
  if (!rom || !motspiller.id) { el.hidden = true; return; }
  el.hidden = false;
  el.textContent = Date.now() - kontakt > 10000 ? "Får ikke kontakt med motspilleren"
    : sammeRunde() ? `Runde ${rundeNr()}/${kampAntall} · Motspiller ${motspiller.svar}/${SVAR_PER_RUNDE} svar\nSammenlagt: du ${fmt(mittSammenlagt())} · motspiller ${fmt(deresSammenlagt())}`
    : motspiller.klar ? "Motspilleren er klar" : "Motspilleren er med";
}

function settDuell(på) {
  if (duell === på) return;
  duell = på;
  bak = lagBakgrunn();
}

function gåInnIRom(kode, vert = false) {
  stoppNedtelling();
  spill.kode = kode;
  Object.assign(motspiller, TOM);
  startet = false; klar = false; spill.ferdig = true; spill.mynterGitt = true;
  nyKamp = true; sumMeg = 0; vertMeg = vert;
  skader.mine = 0; skader.deres = 0;
  settRekkefølge(Math.random().toString(36).slice(2, 10), 0);
  history.replaceState(null, "", "#rom=" + kode);
  $("rom-kode").textContent = kode;
  $("kopiert").textContent = "";
  vis("start", false); vis("venter", true);
  rom?.lukk();
  settDuell(true);
  rom = kobleTilRom({
    ...konto, kode,
    vedStatus: (s) => {
      if (s === "tilkoblet") { rom.sendMelding("hei", { id: meg }); sendStatus(); visKlar(); }
      if (s === "frakoblet") $("rom-status").textContent = "Mistet forbindelsen. Prøver igjen …";
    },
    vedMelding,
  });
  visKlar();
  $("rom-status").textContent = "Kobler til …";
  visMotspiller();
  clearInterval(puls);
  puls = setInterval(() => { sendStatus(); visMotspiller(); }, 2000);
}

function vedMelding(hendelse, m) {
  if (!m || m.id === meg || !rom) return;
  if (hendelse === "fullt") {
    if (m.til === meg) { tilMeny(); $("kode-feil").textContent = "Rommet er fullt. Lag et nytt rom."; }
    return;
  }
  if (hendelse === "forlot") {
    if (m.id !== motspiller.id) return;
    const varSamme = sammeRunde();
    Object.assign(motspiller, TOM);
    klar = klar && !!nedtelling;
    visMotspiller();
    $("motstander").hidden = false;
    $("motstander").textContent = "Motspilleren forlot spillet";
    visKlar();
    $("rom-status").textContent = "Motspilleren forlot rommet. Venter på en ny …";
    if (varSamme && spill.ferdig) oppdaterSlutt();
    return;
  }
  // Rommet har plass til to. En tredje slipper ikke inn så lenge motspilleren er i kontakt.
  if (motspiller.id && m.id !== motspiller.id && Date.now() - kontakt < 10000) {
    if (hendelse === "hei") rom.sendMelding("fullt", { til: m.id });
    return;
  }
  if (hendelse === "hei") { sendStatus(); return; }
  if (hendelse !== "status") return;
  const s = tolkStatus(m);
  if (!s) return;
  if (s.id !== motspiller.id) { nyKamp = true; treffSett = 0; skadeSett = sammeRunde() ? skadeSett : 0; }
  const antallFør = avtaltAntall();
  Object.assign(motspiller, s);
  if (klar && !nedtelling && avtaltAntall() !== antallFør) klar = false; // verten endret antall runder
  kontakt = Date.now();
  if (!startet && !nedtelling) {
    const a = avtal(jegNå(), motspiller);
    const endret = a.fro !== frøMitt;
    settRekkefølge(a.fro, a.runde);
    if (endret) sendStatus();
  }
  visSkader();
  // Når én er ferdig, stopper runden for begge.
  if (sammeRunde() && motspiller.ferdig && !spill.ferdig) avsluttRunde(spill.frist - Date.now() < 1500 ? true : "motspiller");
  visKlar();
  visMotspiller();
  if (spill.ferdig && startet) oppdaterSlutt();
  provStart();
}

function settRekkefølge(frø, runde) {
  frøMitt = frø;
  spill.rekkefolge = rekkefolge(KATEGORIER.length, frø);
  spill.runde = runde;
}
// Alene trekkes kategoriene uten gjentak til alle 100 er brukt.
let sett = [];
$("alene").addEventListener("click", () => {
  const ny = rekkefolge(KATEGORIER.length, Math.random().toString(36));
  if (sett.length >= KATEGORIER.length) sett = [];
  spill.rekkefolge = [...ny.filter((i) => !sett.includes(i)), ...ny.filter((i) => sett.includes(i))];
  spill.runde = 0;
  startRunde();
});
$("lag-rom").addEventListener("click", () => gåInnIRom(nyKode(), true));
$("bli-med").addEventListener("submit", (e) => {
  e.preventDefault();
  const kode = $("kode").value.trim().toUpperCase();
  if (!gyldigKode(kode)) { $("kode-feil").textContent = "Koden har fire bokstaver, for eksempel ABCD."; return; }
  $("kode-feil").textContent = "";
  gåInnIRom(kode);
});
$("start-na").addEventListener("click", settKlar);
$("runder").addEventListener("change", (e) => { if (!jegVert()) return; valgtRunder = Number(e.target.value); sendStatus(); visKlar(); });
addEventListener("pagehide", () => rom?.sendMelding("forlot", { id: meg }));

/* ---------------- Hovedmeny, penger og butikk ---------------- */
const LAGER = "rr-ordjakt-kasse";
const mynter = (n) => `${n.toLocaleString("nb-NO")} ${n === 1 ? "mynt" : "mynter"}`;
function settKasse(ny) {
  kasse = ny;
  if (husk) try { localStorage.setItem(LAGER, JSON.stringify(kasse)); } catch { /* lageret er stengt */ }
  $("menymynter").textContent = mynter(kasse.mynter);
  visButikk(); visHjelp();
}

function visButikk() {
  $("butikk-mynter").textContent = `Du har ${mynter(kasse.mynter)}`;
  const aktiv = document.activeElement?.dataset?.vare;
  $("varer").replaceChildren(...VARER.map((v) => {
    const li = document.createElement("li"), om = document.createElement("div"), navn = document.createElement("b"), tekst = document.createElement("span"), knapp = document.createElement("button");
    const eier = kasse.eier.includes(v.id), valgt = kasse.valgt[v.type] === v.id;
    navn.textContent = v.navn + (FLERE(v) && kasse.antall[v.id] ? ` (har ${kasse.antall[v.id]})` : "");
    tekst.textContent = v.tekst;
    knapp.type = "button"; knapp.className = "oj-knapp"; knapp.dataset.vare = v.id;
    knapp.textContent = eier ? (valgt ? "Legg bort" : "Bruk") : mynter(v.pris);
    knapp.setAttribute("aria-label", eier ? `${knapp.textContent} ${v.navn}` : `Kjøp ${v.navn} for ${mynter(v.pris)}`);
    knapp.disabled = !eier && kasse.mynter < v.pris;
    knapp.addEventListener("click", () => settKasse(eier ? velg(kasse, v.id) : kjop(kasse, v.id)));
    om.append(navn, tekst); li.append(om, knapp);
    return li;
  }));
  if (aktiv) $("varer").querySelector(`[data-vare="${aktiv}"]:not(:disabled)`)?.focus({ preventScroll: true });
}

function visHjelp() {
  const kan = !rom && startet && !spill.ferdig;
  for (const id of ["timeglass", "kikkert"]) {
    const n = kasse.antall[id];
    $("bruk-" + id).hidden = !n;
    $("bruk-" + id).textContent = `${VARER.find((v) => v.id === id).navn} (${n})`;
  }
  vis("hjelp", kan && (kasse.antall.timeglass > 0 || kasse.antall.kikkert > 0));
}
$("bruk-timeglass").addEventListener("click", () => {
  if (rom || spill.ferdig || !kasse.antall.timeglass) return;
  spill.frist += EKSTRA_SEKUNDER * 1000; spill.hjelp = true;
  settKasse(bruk(kasse, "timeglass"));
  tikk(); $("svar").focus({ preventScroll: true });
});
$("bruk-kikkert").addEventListener("click", () => {
  if (rom || spill.ferdig || !kasse.antall.kikkert) return;
  const ledige = kategori().ord.map((o, i) => ({ o, i })).filter(({ o, i }) => !spill.brukt.has(i) && !o[2]).sort((a, b) => a.o[1] - b.o[1]);
  if (!ledige.length) return;
  const ord = ledige[Math.floor(Math.random() * Math.min(5, ledige.length))].o[0];
  spill.hjelp = true;
  settKasse(bruk(kasse, "kikkert"));
  $("melding").classList.remove("bom");
  $("melding").textContent = `Kikkerten ser et sjeldent ord som starter på «${ord.slice(0, 3)}», ${ord.length} tegn.`;
  $("svar").focus({ preventScroll: true });
});

function tilMeny() {
  if (!$("slutt").hidden) giMynter();
  clearInterval(spill.klokke);
  startet = false; spill.ferdig = true; spill.sluttTidligst = 0;
  tall.length = 0; kuler.length = 0;
  borg = nyBorg();
  stoppNedtelling(); clearInterval(puls);
  rom?.sendMelding("forlot", { id: meg });
  rom?.lukk(); rom = null; Object.assign(motspiller, TOM); klar = false;
  taptall.length = 0; skader.mine = 0; skader.deres = 0;
  settDuell(false); visKlar();
  history.replaceState(null, "", location.pathname + location.search);
  for (const id of ["skjema", "venter", "slutt", "butikk", "boost", "hjelp", "avslutt"]) vis(id, false);
  $("melding").textContent = ""; $("logg").replaceChildren();
  $("kategori").textContent = "…"; $("total").textContent = fmt(0); $("teller").textContent = `0/${SVAR_PER_RUNDE}`;
  $("tid").textContent = String(SEKUNDER_PER_RUNDE); $("tid").parentElement.classList.remove("snart");
  visMotspiller();
  vis("start", true);
  $("alene").focus({ preventScroll: true });
}
// Midt i en runde spør vi først. Det gjelder både hovedmenyen og lenkene til resten av nettstedet.
const midtIRunde = () => startet && $("slutt").hidden;
let etterAvslutt = null;
function beOmAvslutt(videre) {
  if (!midtIRunde()) { videre(); return; }
  etterAvslutt = videre;
  vis("avslutt", true);
  $("avslutt-nei").focus({ preventScroll: true });
}
function lukkAvslutt() {
  vis("avslutt", false);
  etterAvslutt = null;
  if (!$("skjema").hidden) $("svar").focus({ preventScroll: true });
}
$("avslutt-nei").addEventListener("click", lukkAvslutt);
$("avslutt-ja").addEventListener("click", () => { const videre = etterAvslutt; vis("avslutt", false); etterAvslutt = null; tilMeny(); if (videre !== tilMeny) videre?.(); });
for (const id of ["meny", "slutt-meny", "venter-meny"]) $(id).addEventListener("click", () => beOmAvslutt(tilMeny));
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!$("avslutt").hidden) lukkAvslutt(); else if (midtIRunde()) beOmAvslutt(tilMeny);
});
document.addEventListener("click", (e) => {
  const a = e.target.closest?.("a[href]");
  if (!a || !midtIRunde() || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank" || a.getAttribute("href").startsWith("#")) return;
  e.preventDefault();
  beOmAvslutt(() => { location.href = a.href; });
});
// Lukker du fanen eller laster på nytt midt i runden, spør nettleseren selv.
addEventListener("beforeunload", (e) => { if (midtIRunde()) e.preventDefault(); });

async function kopier(tekst, hva) {
  try { await navigator.clipboard.writeText(tekst); $("kopiert").textContent = `${hva} er kopiert.`; }
  catch { $("kopiert").textContent = `Kopier selv: ${tekst}`; }
}
$("kopier-kode").addEventListener("click", () => kopier(spill.kode, "Koden"));
$("kopier-lenke").addEventListener("click", () => kopier(location.href, "Lenken"));
$("apne-butikk").addEventListener("click", () => { vis("start", false); vis("butikk", true); visButikk(); $("lukk-butikk").focus({ preventScroll: true }); });
$("lukk-butikk").addEventListener("click", () => { vis("butikk", false); vis("start", true); $("apne-butikk").focus({ preventScroll: true }); });
$("husk").addEventListener("change", (e) => {
  husk = e.target.checked;
  try { if (husk) localStorage.setItem(LAGER, JSON.stringify(kasse)); else localStorage.removeItem(LAGER); } catch { /* lageret er stengt */ }
});

let lydPå = true;
$("lyd").addEventListener("click", () => {
  lydPå = !lydPå;
  settLyd(lydPå);
  $("lyd").setAttribute("aria-pressed", String(lydPå));
  $("lyd").textContent = lydPå ? "Lyd på" : "Lyd av";
});

/* ---------------- Oppstart ---------------- */
$("husk").checked = husk;
settKasse(kasse);
lagKorn();
tilpass();
new ResizeObserver(tilpass).observe(scene);
requestAnimationFrame(løkke);
const iLenke = location.hash.match(/rom=([A-Za-z]{4})/);
if (iLenke && konto.url) gåInnIRom(iLenke[1].toUpperCase());
