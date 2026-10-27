// Grensesnittet for «Hvor mye blir sparingen din verdt?».
// Regnelogikken ligger i /lib og er testet der; denne filen leser felt, viser svar og tegner grafen.

import { GRENSER, SKATTEVALG, beregnSparing, lagForhandsvalg, simuler, skattesatsFor } from "/lib/sparing.js";
import { formaterDesimal, formaterTall, omtrentKr, formaterKr, parseTall } from "/lib/format.js";
import { lesTilstand, skrivTilstand } from "/lib/tilstand.js";
import { andeler, lagTekster } from "/lib/tekster.js";
import { lagGraf } from "./graf.js";
import { tilpassBredde } from "./felt.js";

const satser = JSON.parse(document.getElementById("satser").textContent);
const forvalg = lagForhandsvalg(satser);
const TYPER = ["aksjefond", "sparekonto", "egne"];
const STANDARD = { start: 10000, mnd: 1000, ar: 30, infl: satser.inflasjonsmaal.verdi, ...forvalg.aksjefond, type: "aksjefond" };
const REKKEFOLGE = ["start", "mnd", "ar", "avk", "kost", "infl", "sving", "skatt", "type"];
const TALLFELT = ["start", "mnd", "ar", "avk", "kost", "infl", "sving"];
const KRONER = new Set(["start", "mnd"]);
const FORVALGSFELT = ["avk", "kost", "sving", "skatt"];

const OM = {
  start: { navn: "Startbeløpet", enhet: "kr", eksempel: "10 000" },
  mnd: { navn: "Den månedlige sparingen", enhet: "kr", eksempel: "1 000" },
  ar: { navn: "Antall år", enhet: "år", eksempel: "30" },
  avk: { navn: "Avkastningen", enhet: "%", eksempel: "6,6" },
  kost: { navn: "Kostnaden", enhet: "%", eksempel: "0,3" },
  infl: { navn: "Inflasjonen", enhet: "%", eksempel: "2" },
  sving: { navn: "Svingningen", enhet: "%", eksempel: "16" },
};

const skjema = document.getElementById("kalkulator");
const felt = Object.fromEntries(TALLFELT.map((n) => [n, document.getElementById(n)]));
const skattVelger = document.getElementById("skatt");
const typeKnapper = [...skjema.querySelectorAll('input[name="type"]')];
const resultat = document.getElementById("resultat");
const feilSamlet = document.getElementById("feil-samlet");
const idagBryter = document.getElementById("idag");
const graf = lagGraf(document.getElementById("graf"));
const tabell = document.getElementById("tabell");
let siste = null;

// ---------- Felt ----------

function visTall(navn, verdi) {
  return KRONER.has(navn) || navn === "ar" ? formaterTall(verdi) : formaterDesimal(verdi);
}

const SETNINGSFELT = ["start", "mnd", "ar"];
const tilpass = (n) => SETNINGSFELT.includes(n) && tilpassBredde(felt[n], n === "ar" ? 2 : 4);

function fyllSkjema(v) {
  for (const n of TALLFELT) {
    felt[n].value = visTall(n, v[n]);
    tilpass(n);
  }
  skattVelger.value = v.skatt;
  for (const k of typeKnapper) k.checked = k.value === v.type;
}

function lesFelt(navn) {
  const raa = felt[navn].value;
  const om = OM[navn];
  const g = GRENSER[navn];
  const tall = parseTall(raa, { heltall: KRONER.has(navn) || navn === "ar" });
  const grense = `mellom ${formaterTall(g.min)} og ${formaterTall(g.max)} ${om.enhet}`;
  if (raa.trim() === "") return { feil: `${om.navn} mangler. Skriv et tall ${grense}.` };
  if (Number.isNaN(tall)) return { feil: `${om.navn} må være et tall, for eksempel ${om.eksempel}.` };
  if (navn === "ar" && !Number.isInteger(tall)) return { feil: "Antall år må være et helt tall, for eksempel 30." };
  if (tall < g.min || tall > g.max) return { feil: `${om.navn} må være ${grense}.` };
  return { verdi: KRONER.has(navn) ? Math.round(tall) : tall };
}

function hentVerdier() {
  const v = {};
  const feil = {};
  for (const n of TALLFELT) {
    const r = lesFelt(n);
    if (r.feil) feil[n] = r.feil;
    else v[n] = r.verdi;
  }
  v.skatt = SKATTEVALG.includes(skattVelger.value) ? skattVelger.value : "salg";
  v.type = typeKnapper.find((k) => k.checked)?.value ?? "egne";
  return { v, feil };
}

function visFeil(feil) {
  for (const n of TALLFELT) {
    const melding = document.getElementById(`${n}-feil`);
    const vis = Boolean(feil[n]) && felt[n].dataset.besokt === "1";
    felt[n].setAttribute("aria-invalid", feil[n] ? "true" : "false");
    melding.textContent = vis ? feil[n] : "";
    melding.hidden = !vis;
  }
}

// ---------- Resultat ----------

function visTekster(t) {
  for (const node of document.querySelectorAll("[data-ut]")) {
    const tekst = t[node.dataset.ut];
    if (tekst !== undefined && node.textContent !== tekst) node.textContent = tekst;
  }
}

function visAndeler(a) {
  document.querySelector('[data-andel="innskudd"]').style.flexGrow = a.innskudd;
  document.querySelector('[data-andel="avkastning"]').style.flexGrow = a.avkastning;
}

function grafpunkter({ p, r, sim }, iDag) {
  const deflator = (ar) => (iDag ? Math.pow(1 + p.infl / 100, ar) : 1);
  return r.serie.map((s) => {
    const d = deflator(s.ar);
    const b = sim?.serie[s.ar];
    return { ar: s.ar, innskudd: s.innskudd / d, verdi: s.verdi / d, lav: b ? b.lav / d : NaN, hoy: b ? b.hoy / d : NaN };
  });
}

function fyllTabell(punkter, band, iDag) {
  const sisteAr = punkter[punkter.length - 1].ar;
  const trinn = sisteAr <= 15 ? 1 : 5;
  const rader = punkter.filter((q) => q.ar % trinn === 0 || q.ar === sisteAr);
  tabell.replaceChildren(
    ...rader.map((q) => {
      const tr = document.createElement("tr");
      const celler = [String(q.ar), iDag ? omtrentKr(q.innskudd) : formaterKr(q.innskudd), omtrentKr(q.verdi)];
      if (band) celler.push(`${omtrentKr(q.lav)} til ${omtrentKr(q.hoy)}`);
      for (const c of celler) {
        const td = document.createElement("td");
        td.textContent = c;
        tr.appendChild(td);
      }
      return tr;
    }),
  );
}

function tegn() {
  if (!siste) return;
  const band = Boolean(siste.sim);
  const iDag = idagBryter.checked;
  const punkter = grafpunkter(siste, iDag);
  // Innskudd er eksakte kroner; omregnet til dagens kroner er de anslag og rundes av.
  graf.oppdater(punkter, { band, eksakt: !iDag });
  fyllTabell(punkter, band, iDag);
  for (const node of document.querySelectorAll('[data-vis="band"]')) node.hidden = !band;
}

function oppdater({ skrivLenke = true } = {}) {
  const { v, feil } = hentVerdier();
  visFeil(feil);
  const harFeil = Object.keys(feil).length > 0;
  resultat.classList.toggle("utdatert", harFeil);
  feilSamlet.hidden = !harFeil;
  if (harFeil) return;

  const p = { ...v, skattesats: skattesatsFor(v.skatt, satser) };
  const r = beregnSparing(p);
  const sim = simuler(p);
  siste = { p, r, sim };
  visTekster(lagTekster(p, r, sim));
  visAndeler(andeler(r));
  tegn();
  if (skrivLenke) history.replaceState(null, "", skrivTilstand(v, REKKEFOLGE));
}

let planlagt = 0;
function planlegg() {
  cancelAnimationFrame(planlagt);
  planlagt = requestAnimationFrame(() => oppdater());
}

// ---------- Forhåndsvalg ----------

function brukForvalg(type) {
  const f = forvalg[type];
  if (!f) return;
  felt.avk.value = visTall("avk", f.avk);
  felt.kost.value = visTall("kost", f.kost);
  felt.sving.value = visTall("sving", f.sving);
  skattVelger.value = f.skatt;
}

function sjekkForvalg() {
  const valgt = typeKnapper.find((k) => k.checked)?.value;
  const f = forvalg[valgt];
  if (!f) return;
  const { v } = hentVerdier();
  const likt = FORVALGSFELT.every((n) => v[n] === f[n]);
  if (!likt) typeKnapper.find((k) => k.value === "egne").checked = true;
}

// ---------- Hendelser ----------

skjema.addEventListener("submit", (e) => e.preventDefault());

for (const n of TALLFELT) {
  felt[n].addEventListener("input", () => {
    tilpass(n);
    if (FORVALGSFELT.includes(n)) sjekkForvalg();
    planlegg();
  });
  felt[n].addEventListener("blur", () => {
    felt[n].dataset.besokt = "1";
    const r = lesFelt(n);
    if (!r.feil) felt[n].value = visTall(n, r.verdi);
    tilpass(n);
    oppdater();
  });
  // Enter går til neste felt i setningen i stedet for å sende skjemaet.
  felt[n].addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    felt[n].blur();
  });
}

skattVelger.addEventListener("change", () => {
  sjekkForvalg();
  oppdater();
});

for (const k of typeKnapper) {
  k.addEventListener("change", () => {
    if (!k.checked) return;
    brukForvalg(k.value);
    oppdater();
  });
}

idagBryter.closest("label").hidden = false;
idagBryter.addEventListener("change", tegn);

// Kopier lenken
const kopierKnapp = document.getElementById("kopier");
const kopiert = document.getElementById("kopiert");
kopierKnapp.hidden = false;
kopierKnapp.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    kopiert.textContent = "Lenken er kopiert.";
  } catch {
    kopiert.textContent = "Kopier lenken fra adressefeltet øverst.";
  }
  clearTimeout(kopierKnapp._tid);
  kopierKnapp._tid = setTimeout(() => (kopiert.textContent = ""), 4000);
});

// Resultatet i en stripe nederst på mobil når hovedtallet er ute av syne under forutsetningene.
const flytende = document.getElementById("flytende");
const hoved = resultat.querySelector(".res-hoved");
const forut = document.querySelector(".kalk-forutsetninger");
let hovedSynlig = true;
let forutSynlig = false;
new IntersectionObserver((oppforinger) => {
  for (const o of oppforinger) {
    if (o.target === hoved) hovedSynlig = o.isIntersecting || o.boundingClientRect.top > 0;
    if (o.target === forut) forutSynlig = o.isIntersecting;
  }
  flytende.hidden = hovedSynlig || !forutSynlig;
}).observe(hoved);
new IntersectionObserver((o) => {
  forutSynlig = o[0].isIntersecting;
  flytende.hidden = hovedSynlig || !forutSynlig;
}).observe(forut);

// ---------- Start ----------

const startverdier = lesTilstand(location.hash, STANDARD, { grenser: GRENSER, valg: { skatt: SKATTEVALG, type: TYPER } });
fyllSkjema(startverdier);
if (startverdier.type !== "egne") sjekkForvalg();
oppdater({ skrivLenke: Boolean(location.hash) });

window.addEventListener("hashchange", () => {
  fyllSkjema(lesTilstand(location.hash, STANDARD, { grenser: GRENSER, valg: { skatt: SKATTEVALG, type: TYPER } }));
  oppdater({ skrivLenke: false });
});
