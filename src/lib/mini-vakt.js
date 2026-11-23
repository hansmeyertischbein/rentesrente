// Grisevakta: et tårnforsvar der regninger og gebyrer er på vei mot sparegrisen. Rene regler på et brett på 600 × 400.

export const VAKT_TYPER = Object.freeze({
  regning: Object.freeze({ navn: "Regning", liv: 11, fart: 46, lonn: 6, skade: 1 }),
  gebyr: Object.freeze({ navn: "Gebyr", liv: 7, fart: 84, lonn: 5, skade: 1 }),
  laan: Object.freeze({ navn: "Forbrukslån", liv: 46, fart: 30, lonn: 16, skade: 2 }),
  inkasso: Object.freeze({ navn: "Inkasso", liv: 240, fart: 25, lonn: 60, skade: 5 }),
});
export const TARN = Object.freeze({
  mynt: Object.freeze({ navn: "Myntkaster", pris: 50, rekke: 100, skade: 5, takt: 1.5 }),
  frys: Object.freeze({ navn: "Sparefrys", pris: 55, rekke: 92, skade: 2.2, takt: 0.9, brems: 0.5, bremsSek: 1.4 }),
  rente: Object.freeze({ navn: "Rentetårn", pris: 70, rekke: 98, skade: 5, takt: 1.35, vekst: 1.2 }),   // sterkere for hver bølge det står: renters rente
});
const BRETT = [
  { sti: [[-20, 90], [160, 90], [160, 250], [330, 250], [330, 120], [480, 120], [480, 320], [560, 320]], plasser: [[90, 150], [220, 160], [100, 215], [250, 200], [270, 310], [400, 190], [395, 65], [540, 210], [420, 300]] },
  { sti: [[-20, 320], [110, 320], [110, 110], [270, 110], [270, 300], [430, 300], [430, 90], [560, 90]], plasser: [[55, 250], [170, 180], [190, 50], [200, 250], [335, 220], [340, 120], [350, 360], [500, 200], [490, 340]] },
  { sti: [[80, -20], [80, 180], [240, 180], [240, 60], [410, 60], [410, 230], [180, 320], [560, 340]], plasser: [[150, 110], [150, 240], [310, 130], [320, 200], [470, 120], [340, 320], [260, 250], [480, 270], [80, 270]] },
];
export const VAKT_NIVA = Object.freeze([5, 6, 7, 8, 9].map((bolger, i) => Object.freeze({ bolger, brett: i % 3, styrke: 1 + 0.22 * i })));
export const brett = (niva) => BRETT[VAKT_NIVA[niva - 1].brett];

/** Hvem som kommer i en bølge, i rekkefølge. */
export function bolge(nr, siste) {
  const ut = [];
  for (let i = 0; i < 5 + 2 * nr; i++) ut.push(nr > 1 && i % 3 === 2 ? "gebyr" : "regning");
  if (nr >= 3) for (let i = 0; i < nr - 2; i++) ut.splice(2 + i * 3, 0, "laan");
  if (nr === siste) ut.push("inkasso");
  return ut;
}

export function lagVakt(niva) {
  return { niva, penger: 120 + 25 * niva, liv: 10, bolge: 0, ko: [], nesteOm: 0, fiender: [], tarn: [], skudd: [], teller: 0, ferdig: null };
}

const STREKK = BRETT.map(({ sti }) => {
  let sum = 0;
  const deler = sti.slice(1).map((b, i) => { const a = sti[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); sum += l; return { a, b, l }; });
  return { deler, lengde: sum };
});
/** Punktet så langt ut på stien. */
export function paaSti(niva, d) {
  for (const { a, b, l } of STREKK[VAKT_NIVA[niva - 1].brett].deler) { if (d <= l) return [a[0] + ((b[0] - a[0]) * d) / l, a[1] + ((b[1] - a[1]) * d) / l]; d -= l; }
  return STREKK[VAKT_NIVA[niva - 1].brett].deler.at(-1).b;
}

export function byggTarn(s, type, plass) {
  const t = TARN[type];
  if (!t || s.ferdig || !brett(s.niva).plasser[plass] || s.tarn.some((x) => x.plass === plass) || s.penger < t.pris) return s;
  const [x, y] = brett(s.niva).plasser[plass];
  return { ...s, penger: s.penger - t.pris, tarn: [...s.tarn, { type, plass, x, y, niva: 1, bolger: 0, klar: 0 }] };
}
export const prisOpp = (t) => (t.niva >= 4 ? Infinity : Math.round(TARN[t.type].pris * 0.8 * t.niva));
export function oppgraderTarn(s, plass) {
  const t = s.tarn.find((x) => x.plass === plass);
  if (!t || s.ferdig || prisOpp(t) > s.penger) return s;
  return { ...s, penger: s.penger - prisOpp(t), tarn: s.tarn.map((x) => (x === t ? { ...x, niva: x.niva + 1 } : x)) };
}
export const tarnSkade = (t) => TARN[t.type].skade * Math.pow(1.65, t.niva - 1) * Math.pow(TARN[t.type].vekst ?? 1, t.bolger);
export const tarnRekke = (t) => TARN[t.type].rekke * (1 + 0.08 * (t.niva - 1));

export function nesteBolge(s) {
  const { bolger } = VAKT_NIVA[s.niva - 1];
  if (s.ferdig || s.ko.length || s.fiender.length || s.bolge >= bolger) return s;
  return { ...s, bolge: s.bolge + 1, ko: bolge(s.bolge + 1, bolger), nesteOm: 0, tarn: s.tarn.map((t) => ({ ...t, bolger: t.bolger + 1 })) };
}

/** Et lite steg. Gir { tilstand, hendelser } med «treff», «dod» og «slapp». */
export function vaktSteg(s, dt) {
  if (s.ferdig) return { tilstand: s, hendelser: [] };
  const { bolger, styrke } = VAKT_NIVA[s.niva - 1], lengde = STREKK[VAKT_NIVA[s.niva - 1].brett].lengde, hendelser = [];
  let { penger, liv, nesteOm, teller } = s;
  const ko = [...s.ko], fiender = s.fiender.map((f) => ({ ...f })), tarn = s.tarn.map((t) => ({ ...t }));
  nesteOm -= dt;
  if (ko.length && nesteOm <= 0) {
    const type = ko.shift(), maks = VAKT_TYPER[type].liv * styrke * (1 + 0.5 * (s.bolge - 1));
    fiender.push({ id: ++teller, type, liv: maks, maks, d: 0, bremset: 0 });
    nesteOm = type === "laan" ? 1.1 : 0.75;
  }
  for (const f of fiender) { f.bremset = Math.max(0, f.bremset - dt); f.d += VAKT_TYPER[f.type].fart * (f.bremset > 0 ? TARN.frys.brems : 1) * dt; }
  const skudd = s.skudd.map((k) => ({ ...k, igjen: k.igjen - dt })).filter((k) => k.igjen > 0);
  for (const t of tarn) {
    t.klar -= dt;
    if (t.klar > 0) continue;
    const r = tarnRekke(t);
    const mal = fiender.filter((f) => f.liv > 0 && f.d < lengde).map((f) => ({ f, p: paaSti(s.niva, f.d) })).filter(({ p }) => Math.hypot(p[0] - t.x, p[1] - t.y) <= r).sort((a, b) => b.f.d - a.f.d);
    if (!mal.length) continue;
    t.klar = 1 / TARN[t.type].takt;
    for (const { f, p } of t.type === "frys" ? mal : mal.slice(0, 1)) {
      f.liv -= tarnSkade(t);
      if (t.type === "frys") f.bremset = TARN.frys.bremsSek + 0.3 * t.niva;
      skudd.push({ type: t.type, fra: [t.x, t.y], til: p, igjen: 0.14 });
    }
    hendelser.push({ type: "skudd", tarn: t.type });
  }
  const igjen = [];
  for (const f of fiender) {
    if (f.liv <= 0) { penger += VAKT_TYPER[f.type].lonn; hendelser.push({ type: "dod", p: paaSti(s.niva, f.d) }); }
    else if (f.d >= lengde) { liv -= VAKT_TYPER[f.type].skade; hendelser.push({ type: "slapp" }); }
    else igjen.push(f);
  }
  const ferdig = liv <= 0 ? "tapt" : s.bolge >= bolger && !ko.length && !igjen.length ? "vunnet" : null;
  return { tilstand: { ...s, penger, liv: Math.max(0, liv), ko, nesteOm, fiender: igjen, tarn, skudd, teller, ferdig }, hendelser };
}
