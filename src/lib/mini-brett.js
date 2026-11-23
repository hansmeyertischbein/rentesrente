// Brettspillene blant minispillene i «Overfør»: Grisetoget, Vekslebanken, Krakkfeltet og Regnskapet.
// Rene regler, bygget på Hans' egne spill. Tilfeldighet kommer inn som rng().

const stokk = (a, rng) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------- Grisetoget: grisen drar vogner og plukker mynter ----------

export const TOG = Object.freeze({ n: 15, mal: Object.freeze([6, 10, 15, 20, 26]), ms: Object.freeze([190, 170, 150, 132, 116]) });
const RETNING = Object.freeze({ opp: [0, -1], ned: [0, 1], venstre: [-1, 0], hoyre: [1, 0] });
const MOTSATT = Object.freeze({ opp: "ned", ned: "opp", venstre: "hoyre", hoyre: "venstre" });

function nyMynt(tog, rng) {
  const ledig = [];
  for (let x = 0; x < TOG.n; x++) for (let y = 0; y < TOG.n; y++) if (!tog.some(([a, b]) => a === x && b === y)) ledig.push([x, y]);
  return ledig.length ? ledig[Math.floor(rng() * ledig.length)] : null;
}
export function lagTog(rng = Math.random) {
  const m = Math.floor(TOG.n / 2), tog = [[m, m], [m - 1, m], [m - 2, m]];
  return { tog, retning: "hoyre", ko: [], mynt: nyMynt(tog, rng), tatt: 0, krasj: false };
}
/** Svinger toget. Rett bakover går ikke, og høyst tre svinger huskes. */
export function svingTog(s, retning) {
  const sist = s.ko.at(-1) ?? s.retning;
  return !RETNING[retning] || retning === sist || retning === MOTSATT[sist] || s.ko.length > 2 ? s : { ...s, ko: [...s.ko, retning] };
}
export function kjorTog(s, rng = Math.random) {
  if (s.krasj) return s;
  const retning = s.ko[0] ?? s.retning, [dx, dy] = RETNING[retning], [hx, hy] = s.tog[0];
  const x = hx + dx, y = hy + dy, spiser = s.mynt && x === s.mynt[0] && y === s.mynt[1];
  const kropp = spiser ? s.tog : s.tog.slice(0, -1);
  const ny = { ...s, retning, ko: s.ko.slice(1) };
  if (x < 0 || y < 0 || x >= TOG.n || y >= TOG.n || kropp.some(([a, b]) => a === x && b === y)) return { ...ny, krasj: true };
  const tog = [[x, y], ...kropp];
  return { ...ny, tog, tatt: s.tatt + (spiser ? 1 : 0), mynt: spiser ? nyMynt(tog, rng) : s.mynt };
}

// ---------- Vekslebanken: to like penger veksles til den neste ----------

export const VEKSLE = Object.freeze({ n: 4, stige: Object.freeze([1, 5, 10, 20, 50, 100, 200, 500, 1000, 2000]), mal: Object.freeze([4, 5, 6, 7, 8]) });

export function lagVeksle(rng = Math.random) {
  return nyPenge(nyPenge({ brett: Array(16).fill(null), poeng: 0, sammen: [], ny: -1 }, rng), rng);
}
function nyPenge(s, rng) {
  const ledig = s.brett.flatMap((v, i) => (v === null ? [i] : []));
  if (!ledig.length) return s;
  const i = ledig[Math.floor(rng() * ledig.length)], brett = [...s.brett];
  brett[i] = rng() < 0.9 ? 0 : 1;
  return { ...s, brett, ny: i };
}
const LINJER = Object.freeze({
  venstre: (r) => [0, 1, 2, 3].map((k) => r * 4 + k), hoyre: (r) => [3, 2, 1, 0].map((k) => r * 4 + k),
  opp: (r) => [0, 1, 2, 3].map((k) => k * 4 + r), ned: (r) => [3, 2, 1, 0].map((k) => k * 4 + r),
});
/** Skyver alt i en retning. Gir samme tilstand når ingenting kan flyttes. */
export function skyv(s, retning, rng = Math.random) {
  if (!LINJER[retning]) return s;
  const brett = Array(16).fill(null), sammen = [];
  for (let r = 0; r < 4; r++) {
    const linje = LINJER[retning](r), verdier = linje.map((i) => s.brett[i]).filter((v) => v !== null), ut = [];
    for (let k = 0; k < verdier.length; k++) {
      if (verdier[k] === verdier[k + 1] && verdier[k] < VEKSLE.stige.length - 1) { sammen.push(linje[ut.length]); ut.push(verdier[k] + 1); k++; } else ut.push(verdier[k]);
    }
    ut.forEach((v, k) => { brett[linje[k]] = v; });
  }
  if (brett.every((v, i) => v === s.brett[i])) return s;
  return nyPenge({ brett, sammen, poeng: s.poeng + sammen.reduce((x, i) => x + VEKSLE.stige[brett[i]], 0), ny: -1 }, rng);
}
export const kanSkyve = (s) => Object.keys(LINJER).some((r) => skyv(s, r, () => 0) !== s);
export const storstePenge = (s) => Math.max(...s.brett.map((v) => v ?? -1));

// ---------- Krakkfeltet: finn de trygge aksjene uten å treffe et krakk ----------

export const KRAKK = Object.freeze([[6, 5], [7, 8], [8, 12], [9, 16], [9, 20]]);   // størrelse og antall krakk

const nabo = (n, i) => {
  const x = i % n, y = Math.floor(i / n), ut = [];
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if ((dx || dy) && x + dx >= 0 && x + dx < n && y + dy >= 0 && y + dy < n) ut.push((y + dy) * n + x + dx);
  return ut;
};
/** Feltet lages ved første trykk, så det og rutene rundt alltid er trygge. */
export function lagFelt(niva, forste, rng = Math.random) {
  const [n, antall] = KRAKK[niva - 1], fri = new Set([forste, ...nabo(n, forste)]);
  const plasser = stokk([...Array(n * n).keys()].filter((i) => !fri.has(i)), rng).slice(0, antall);
  const krakk = Array(n * n).fill(false);
  plasser.forEach((i) => { krakk[i] = true; });
  return { n, krakk, tall: krakk.map((_, i) => nabo(n, i).filter((j) => krakk[j]).length), vist: Array(n * n).fill(false), flagg: Array(n * n).fill(false), tapt: -1 };
}
export function avdekk(f, i) {
  if (f.tapt >= 0 || f.vist[i] || f.flagg[i]) return f;
  if (f.krakk[i]) return { ...f, tapt: i };
  const vist = [...f.vist], ko = [i];
  while (ko.length) {
    const k = ko.pop();
    if (vist[k] || f.flagg[k]) continue;
    vist[k] = true;
    if (f.tall[k] === 0) ko.push(...nabo(f.n, k));
  }
  return { ...f, vist };
}
export const flagg = (f, i) => (f.vist[i] || f.tapt >= 0 ? f : { ...f, flagg: f.flagg.map((v, k) => (k === i ? !v : v)) });
export const feltKlart = (f) => f.tapt < 0 && f.krakk.every((k, i) => k || f.vist[i]);

// ---------- Regnskapet: hvert tall én gang i hver rad, kolonne og boks ----------

export const REGNSKAP = Object.freeze([[6, 10], [6, 16], [6, 21], [9, 36], [9, 46]]);   // størrelse og tomme ruter
const BOKS = Object.freeze({ 6: [3, 2], 9: [3, 3] });

const lagVenner = (n) => {
  const [b, h] = BOKS[n], boks = (i) => Math.floor(Math.floor(i / n) / h) * (n / b) + Math.floor((i % n) / b);
  return Array.from({ length: n * n }, (_, i) => Array.from({ length: n * n }, (_, j) => j).filter((j) => j !== i && (j % n === i % n || Math.floor(j / n) === Math.floor(i / n) || boks(j) === boks(i))));
};
const VENNER = Object.freeze({ 6: lagVenner(6), 9: lagVenner(9) });
export const venner = (n, i) => VENNER[n][i];

function mulige(g, n, i) {
  const brukt = new Set(VENNER[n][i].map((j) => g[j])), ut = [];
  for (let v = 1; v <= n; v++) if (!brukt.has(v)) ut.push(v);
  return ut;
}
function trangest(g, n) {
  let best = -1, valg = null;
  for (let i = 0; i < g.length; i++) {
    if (g[i]) continue;
    const m = mulige(g, n, i);
    if (!valg || m.length < valg.length) { best = i; valg = m; if (m.length < 2) break; }
  }
  return [best, valg];
}
function fyll(g, n, rng) {
  const [i, valg] = trangest(g, n);
  if (i < 0) return true;
  for (const v of stokk([...valg], rng)) { g[i] = v; if (fyll(g, n, rng)) return true; }
  g[i] = 0;
  return false;
}
/** Antall løsninger, men stopper ved grensen. */
export function losninger(g, n, grense = 2) {
  const [i, valg] = trangest(g, n);
  if (i < 0) return 1;
  let sum = 0;
  for (const v of valg) { g[i] = v; sum += losninger(g, n, grense - sum); if (sum >= grense) break; }
  g[i] = 0;
  return sum;
}
/** Et regnskap med nøyaktig én løsning. */
export function lagRegnskap(niva, rng = Math.random) {
  const [n, tomme] = REGNSKAP[niva - 1], fasit = Array(n * n).fill(0);
  fyll(fasit, n, rng);
  const start = [...fasit];
  let fjernet = 0;
  for (const i of stokk([...Array(n * n).keys()], rng)) {
    if (fjernet >= tomme) break;
    const v = start[i];
    start[i] = 0;
    if (losninger([...start], n) === 1) fjernet++; else start[i] = v;
  }
  return { n, boks: BOKS[n], start, fasit, ruter: [...start] };
}
export const regnskapKlart = (r) => r.ruter.every((v, i) => v === r.fasit[i]);
