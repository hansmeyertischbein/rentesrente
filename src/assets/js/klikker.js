// Grensesnittet for spillet «Overfør». Regnereglene ligger i /lib/klikker.js, figurene i klikker-figurer.js.
import {
  REGLER, AKSJER, BOOSTERE, nyTilstand, trykk, klikkverdi, grunnTrykk, fartFaktor, perSekund, aksjeRate, utbyttePerAksje,
  prisAksje, maksAksje, kjopAksje, prisTrykk, kjopTrykk, nesteBoostere, andelRad, kjopBooster, generalforsamlinger, gfAntall,
  tikk, borte, uroFyll, urolig, uroSteg, rabatt, ekstraTilbud, ekstraAvkastning, investerEkstra, synlige, tilLagring, fraLagring,
  radgiverTreff, prisRadgiver, kjopRadgiver, radgiverSynlig, radgiverPek, formaterOre, formaterTid,
} from "/lib/klikker.js";
import { formaterTall } from "/lib/format.js";
import { FIGURER, GRIS } from "./klikker-figurer.js";

const NOKKEL = "rr-overfor-2";
const GAMLE_NOKLER = ["rr-overfor"];   // lagring fra tidligere utgaver slettes, så alle starter på null
const MILEPELER = [100, 1e4, 1e6, 1e8, 1e11, 1e14, 1e17];
const rolig = matchMedia("(prefers-reduced-motion: reduce)");
const $ = (id) => document.getElementById(id);

const el = {
  konto: $("konto"), saldo: $("saldo"), inntekt: $("inntekt"), rate: $("rate"), klikkrate: $("klikkrate"),
  gris: $("overfor"), grisFlate: $("gris-flate"), grisVerdi: $("gris-verdi"),
  fart: $("fart"), fartTekst: $("fart-tekst"), fartFyll: $("fart-fyll"),
  oppgrader: $("oppgrader"), oppgraderNiva: $("oppgrader-niva"), oppgraderPris: $("oppgrader-pris"),
  boostere: $("booster-liste"), gf: $("gf-liste"), tips: $("tips"),
  uro: $("uro"), uroIkon: $("uro-ikon"), uroFyll: $("uro-fyll"),
  hendelse: $("hendelse"), ekstra: $("ekstra"), ekstraVilkar: $("ekstra-vilkar"), ekstraValg: $("ekstra-valg"), ventende: $("ventende"), status: $("status"), annonse: $("annonse"),
  butikk: $("butikk"), husk: $("husk"), omstart: $("omstart"),
  mini: $("mini"), miniSaldo: $("mini-saldo"), miniRate: $("mini-rate"),
  scene: $("scene"), by: $("by"),
  radgiver: $("radgiver"), radgiverFigur: $("radgiver-figur"), radgiverInfo: $("radgiver-info"),
  radgiverKnapp: $("radgiver-knapp"), radgiverHandling: $("radgiver-handling"), radgiverPris: $("radgiver-pris"),
};

let t = nyTilstand();
let modus = 1;            // 1, 10 eller "maks"
let forrige = Date.now();
let milepel = 0;
let klikk = [];           // trykk det siste sekundet: { tid, verdi }
let tilbud = null, tilbudSlutt = 0, tilbudNeste = 0;
let boosterNokkel = "", gfNokkel = "", ventNokkel = "";
let aktivTips = null, pekertype = "mouse";
let myntNeste = 0;
let pekt = null, pekNeste = 0;  // aksjen rådgiveren peker på, og når han ser på nytt
const PEK_SEK = 20;
const rader = new Map();

const ore = formaterOre;
const perSek = (x) => `${ore(x)}/sek`;
const aksje = (id) => AKSJER.find((a) => a.id === id);
const prosent = (x) => `${formaterTall(Math.round(x * 100))} %`;
const ganger = (f) => {
  const des = Number.isInteger(f) ? 0 : Number.isInteger(Math.round(f * 1000) / 100) ? 1 : 2;
  return formaterTall(f, des) + "x";
};
const flertall = (a, n) => (n === 1 ? a.en : a.fler);
const tilfeldig = (lav, hoy) => lav + Math.random() * (hoy - lav);

function settTekst(node, tekst) { if (node.textContent !== tekst) node.textContent = tekst; }
function settAttr(node, navn, verdi) { if (node.getAttribute(navn) !== verdi) node.setAttribute(navn, verdi); }
function si(tekst) { el.status.textContent = tekst; }
function annonser(tekst) { el.annonse.textContent = tekst; }

// ---------- Bevegelse ----------

function hopp(node) {
  if (!node || rolig.matches) return;
  node.animate([{ transform: "scale(1)" }, { transform: "scale(1.12) rotate(-3deg)" }, { transform: "scale(1)" }], { duration: 320, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
}

function flyt(node, hoyde, varighet) {
  node.animate([{ transform: `${node.style.transform} translateY(0)`, opacity: 1 }, { transform: `${node.style.transform} translateY(${-hoyde}px)`, opacity: 0 }],
    { duration: varighet, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }).finished.then(() => node.remove(), () => node.remove());
}

function pluss(e, verdi, fart) {
  if (rolig.matches || el.grisFlate.querySelectorAll(".pluss").length > 14) return;
  const flate = el.grisFlate.getBoundingClientRect();
  const fraMus = e && e.clientX > 0;
  const x = fraMus ? e.clientX - flate.left : flate.width / 2 + tilfeldig(-30, 30);
  const y = fraMus ? e.clientY - flate.top : flate.height * 0.3;
  const p = document.createElement("span");
  p.className = fart > 1 ? "pluss rask" : "pluss";
  p.textContent = "+" + ore(verdi);
  p.style.left = `${x}px`;
  p.style.top = `${y - 18}px`;
  p.style.transform = "translate(-50%, 0)";
  el.grisFlate.append(p);
  flyt(p, 60, 800);
}

function myntInn() {
  const fig = el.gris.querySelector(".gris-fig");
  if (rolig.matches || !fig) return;
  fig.animate([{ transform: "scale(1)" }, { transform: "scale(1.05, 0.92)" }, { transform: "scale(1)" }], { duration: 180, easing: "ease-out" });
  if (el.gris.querySelectorAll(".gris-mynt").length > 5) return;
  const m = document.createElement("span");
  m.className = "gris-mynt";
  m.textContent = "kr";
  el.gris.append(m);
  m.animate([{ transform: "translate(-50%, -2.2rem)", opacity: 1 }, { transform: "translate(-50%, 0.2rem)", opacity: 1, offset: 0.8 }, { transform: "translate(-50%, 0.5rem) scaleY(0.4)", opacity: 0 }],
    { duration: 300, easing: "cubic-bezier(0.55, 0, 1, 0.45)" }).finished.then(() => m.remove(), () => m.remove());
}

function gulMynt(naa) {
  if (rolig.matches || naa < myntNeste) return;
  myntNeste = naa + tilfeldig(900, 1800);
  const eide = [...rader.values()].filter((r) => r.status === "apen" && t.aksjer[r.id] > 0);
  if (!eide.length) return;
  const r = eide[Math.floor(Math.random() * eide.length)];
  const flis = r.figur.getBoundingClientRect();
  if (flis.bottom < 0 || flis.top > innerHeight) return;
  const m = document.createElement("span");
  m.className = "gulmynt";
  m.textContent = "kr";
  m.style.left = `${tilfeldig(25, 75)}%`;
  r.figur.append(m);
  flyt(m, 28, 900);
}

// ---------- Tips ved ikonene ----------

function tipsInnhold(anker) {
  const type = anker.dataset.tips;
  const linjer = [];
  let tittel = "";
  if (type === "booster") {
    const b = BOOSTERE.find((x) => x.id === anker.dataset.id);
    if (!b) return null;
    tittel = b.navn;
    linjer.push(boosterVirkning(b), `Koster ${ore(b.pris)}.`);
    const andel = andelRad(t, b.pris);
    linjer.push(andel >= 1 ? "Du har råd. Trykk for å kjøpe." : `Du har ${prosent(andel)} av prisen.`);
  } else if (type === "gf") {
    const a = aksje(anker.dataset.id);
    const n = t.aksjer[a.id];
    const antall = gfAntall(t, a.id);
    tittel = `Generalforsamling i ${a.navn}`;
    linjer.push(`Du eier ${formaterTall(n)} ${flertall(a, n)} og stemte for høyere utbytte.`);
    linjer.push(`Gir ${ganger(REGLER.gfFaktor)} utbytte fra ${a.navn} for hver ${REGLER.gfHver}. ${a.en}, nå ${ganger(Math.pow(REGLER.gfFaktor, antall))}.`);
    linjer.push(`Neste ved ${formaterTall((antall + 1) * REGLER.gfHver)} ${a.fler}.`);
  } else if (type === "uro") {
    tittel = "Uro i markedet";
    linjer.push(`Streken fylles på ${formaterTid(REGLER.uroSek)}. Jo fullere den er, jo større er sjansen for en verdenshendelse eller et børskrakk. Når den er full, skjer det alltid.`);
    linjer.push(urolig(t) ? "Noe skjer nå." : `Nå: ${prosent(uroFyll(t))}.`);
  }
  return { tittel, linjer };
}

function visTips(anker) {
  const innhold = tipsInnhold(anker);
  if (!innhold) return;
  aktivTips = anker;
  const s = document.createElement("strong");
  s.textContent = innhold.tittel;
  el.tips.replaceChildren(s, ...innhold.linjer.map((l, i) => {
    const p = document.createElement("p");
    p.textContent = l;
    if (i === innhold.linjer.length - 1) p.className = "tips-status";
    return p;
  }));
  el.tips.hidden = false;
  plasserTips();
}

function plasserTips() {
  if (!aktivTips) return;
  const r = aktivTips.getBoundingClientRect();
  const b = el.tips.getBoundingClientRect();
  const kant = 8;
  let x = r.right + 10;
  if (x + b.width > innerWidth - kant) x = r.left - b.width - 10;
  if (x < kant) x = Math.min(innerWidth - b.width - kant, Math.max(kant, r.left + r.width / 2 - b.width / 2));
  let y = r.top + r.height / 2 - b.height / 2;
  if (x === Math.min(innerWidth - b.width - kant, Math.max(kant, r.left + r.width / 2 - b.width / 2))) y = r.bottom + 10;
  y = Math.min(innerHeight - b.height - kant, Math.max(kant, y));
  el.tips.style.left = `${Math.round(x)}px`;
  el.tips.style.top = `${Math.round(y)}px`;
}

function skjulTips(anker) {
  if (anker && anker !== aktivTips) return;
  aktivTips = null;
  el.tips.hidden = true;
}

function oppdaterTips() {
  if (!aktivTips) return;
  if (!aktivTips.isConnected) { skjulTips(); return; }
  const innhold = tipsInnhold(aktivTips);
  if (!innhold) return;
  const siste = el.tips.lastElementChild;
  if (siste) settTekst(siste, innhold.linjer.at(-1));
}

/** Gir et ikon tips ved hover, fokus og første trykk med finger. Andre trykk utfører handlingen. */
function medTips(knapp, handling) {
  let siste = { type: "mouse", varApen: false };
  knapp.setAttribute("aria-describedby", "tips");
  knapp.addEventListener("pointerdown", (e) => { pekertype = e.pointerType; siste = { type: e.pointerType, varApen: aktivTips === knapp }; });
  knapp.addEventListener("keydown", () => { siste = { type: "keyboard", varApen: true }; });
  knapp.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") visTips(knapp); });
  knapp.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") skjulTips(knapp); });
  knapp.addEventListener("focus", () => visTips(knapp));
  knapp.addEventListener("blur", () => skjulTips(knapp));
  knapp.addEventListener("click", () => {
    if ((siste.type === "touch" || siste.type === "pen") && !siste.varApen) { visTips(knapp); siste.varApen = true; return; }
    handling?.();
  });
}

document.addEventListener("pointerdown", (e) => {
  if (aktivTips && !aktivTips.contains(e.target)) skjulTips();
}, { passive: true });
addEventListener("scroll", () => { if (aktivTips && pekertype !== "mouse") skjulTips(); else plasserTips(); }, { passive: true });
addEventListener("keydown", (e) => { if (e.key === "Escape") skjulTips(); });

// ---------- Boostere og generalforsamling ----------

function boosterVirkning(b) {
  if (b.type === "aksje") return `Gir ${ganger(b.faktor)} utbytte fra ${aksje(b.mal).navn}.`;
  if (b.type === "alle") return `Gir ${ganger(b.faktor)} utbytte fra alle selskapene.`;
  return `Hvert trykk gir også ${prosent(b.andel)} av utbyttet i sekundet.`;
}

function boosterFigur(b) {
  return b.type === "aksje" ? FIGURER[b.mal] : b.type === "alle" ? FIGURER.tangent : FIGURER.trykk;
}

function lagBooster(b) {
  const li = document.createElement("li");
  const f = boosterFigur(b);
  const merke = b.type === "trykk" ? `+${formaterTall(b.andel * 100)}%` : ganger(b.faktor);
  li.innerHTML = `<button type="button" class="spillikon booster svart" data-tips="booster" data-id="${b.id}"><span class="ikon-flis" style="--tile:${f.tile}">${f.svg}</span><span class="ikon-merke">${merke}</span></button>`;
  const knapp = li.firstChild;
  knapp.setAttribute("aria-label", `${b.navn}. ${boosterVirkning(b)} Koster ${ore(b.pris)}.`);
  medTips(knapp, () => kjopEnBooster(b, knapp));
  return li;
}

function tegnBoostere() {
  const neste = nesteBoostere(t, 3);
  const nokkel = neste.map((b) => b.id).join("|");
  if (nokkel !== boosterNokkel) {
    const knapper = [...el.boostere.querySelectorAll("button")];
    const fokus = knapper.indexOf(document.activeElement);
    boosterNokkel = nokkel;
    el.boostere.replaceChildren(...neste.map(lagBooster));
    if (fokus >= 0) el.boostere.querySelectorAll("button")[Math.min(fokus, neste.length - 1)]?.focus();
  }
  for (const knapp of el.boostere.querySelectorAll("button")) {
    const b = BOOSTERE.find((x) => x.id === knapp.dataset.id);
    const andel = andelRad(t, b.pris);
    const klasse = andel >= 1 ? "klar" : andel >= 0.5 ? "halv" : "svart";
    if (!knapp.classList.contains(klasse)) { knapp.classList.remove("klar", "halv", "svart"); knapp.classList.add(klasse); }
    settAttr(knapp, "aria-disabled", andel >= 1 ? "false" : "true");
  }
}

function kjopEnBooster(b, knapp) {
  const for_ = t;
  t = kjopBooster(t, b.id);
  if (t === for_) { si(`${b.navn}: du mangler ${ore(b.pris - t.saldo)}.`); visTips(knapp); return; }
  skjulTips();
  si(`${b.navn}. ${boosterVirkning(b)}`);
  if (b.type === "aksje") hopp(rader.get(b.mal)?.figur);
  else if (b.type === "alle") for (const r of rader.values()) if (t.aksjer[r.id] > 0) hopp(r.figur);
  tegn();
  lagre();
}

function tegnGf() {
  const liste = generalforsamlinger(t);
  const nokkel = liste.map((g) => g.id + ":" + g.antall).join("|");
  if (nokkel === gfNokkel) return;
  const nye = liste.filter((g) => !gfNokkel.split("|").includes(g.id + ":" + g.antall));
  gfNokkel = nokkel;
  el.gf.hidden = liste.length === 0;
  el.gf.replaceChildren(...liste.map((g) => {
    const a = aksje(g.id);
    const li = document.createElement("li");
    li.innerHTML = `<button type="button" class="spillikon gf" data-tips="gf" data-id="${g.id}"><span class="ikon-flis" style="--tile:${FIGURER[g.id].tile}">${FIGURER[g.id].svg}</span><span class="ikon-merke">${ganger(g.faktor)}</span></button>`;
    const knapp = li.firstChild;
    knapp.setAttribute("aria-label", `Generalforsamling i ${a.navn}: ${ganger(g.faktor)} utbytte.`);
    medTips(knapp);
    if (nye.some((n) => n.id === g.id)) requestAnimationFrame(() => hopp(knapp));
    return li;
  }));
}

// ---------- Butikken ----------

function lagRad(id, status) {
  const a = aksje(id);
  const li = document.createElement("li");
  li.className = "aksjerad";
  li.dataset.id = id;
  if (status === "skygge") {
    li.classList.add("rad-skygge");
    li.innerHTML = `<div class="rad-knapp"><span class="rad-figur"><span class="ikon-flis" style="--tile:${FIGURER.skygge.tile}">${FIGURER.skygge.svg}</span></span><span class="rad-navn"><span class="rad-tittel">Ukjent selskap</span></span><span class="rad-info"></span></div>`;
    li.querySelector(".rad-info").textContent = `Viser seg når du har hatt ${ore(a.pris * REGLER.visFra)} innom grisen.`;
    return { id, li, status };
  }
  const f = FIGURER[id];
  li.innerHTML = `<button type="button" class="rad-knapp"><span class="rad-figur"><span class="ikon-flis" style="--tile:${f.tile}">${f.svg}</span><span class="rad-antall" hidden></span></span>` +
    '<span class="rad-navn"><span class="rad-tittel"></span><span class="rad-sektor"></span></span>' +
    '<span class="rad-kjop"><span class="rad-mengde"></span><span class="pris rad-pris"></span></span><span class="rad-info"></span><span class="rad-merker"></span></button>';
  li.querySelector(".rad-tittel").textContent = a.navn;
  li.querySelector(".rad-sektor").textContent = a.sektor;
  const knapp = li.querySelector("button");
  knapp.addEventListener("click", () => kjop(id));
  return {
    id, li, status, knapp, figur: li.querySelector(".rad-figur"), antall: li.querySelector(".rad-antall"),
    mengde: li.querySelector(".rad-mengde"), pris: li.querySelector(".rad-pris"), info: li.querySelector(".rad-info"), merker: li.querySelector(".rad-merker"),
  };
}

function antallKjop(id) {
  return modus === "maks" ? Math.max(1, maksAksje(t, id)) : modus;
}

function tegnButikk() {
  const liste = synlige(t);
  let forrigeLi = null;
  for (const { id, status } of liste) {
    let r = rader.get(id);
    if (!r || r.status !== status) {
      const ny = lagRad(id, status);
      if (r) r.li.replaceWith(ny.li);
      rader.set(id, ny);
      r = ny;
      if (status === "apen") hopp(r.figur);
    }
    if (r.li.previousElementSibling !== forrigeLi || r.li.parentNode !== el.butikk) {
      if (forrigeLi) forrigeLi.after(r.li); else el.butikk.prepend(r.li);
    }
    forrigeLi = r.li;
    if (status !== "apen") continue;
    const a = aksje(id);
    const n = t.aksjer[id];
    const ant = antallKjop(id);
    const pris = prisAksje(t, id, ant);
    settTekst(r.pris, ore(pris));
    settTekst(r.mengde, modus === 1 ? "" : `${formaterTall(ant)} ${flertall(a, ant)}`);
    r.antall.hidden = n === 0;
    settTekst(r.antall, formaterTall(n));
    const perAksje = utbyttePerAksje(t, id);
    settTekst(r.info, n > 0
      ? `${perSek(aksjeRate(t, id))} · ${formaterTall(n)} ${flertall(a, n)} · ${ore(perAksje)}/${a.en}/sek`
      : `Gir ${ore(perAksje)}/sek per ${a.en}`);
    const merker = [];
    if (rabatt(t, id) > 0) merker.push(["krakk", `Krakk: ${prosent(rabatt(t, id))} billigere`]);
    if (t.uro.verden?.mal === id) merker.push(["verden", `Utbytte ${prosent(t.uro.verden.fall)} lavere`]);
    if (pekt === id) merker.push(["rad", "Fondsen peker hit"]);
    const merkeNokkel = merker.map((m) => m.join(":")).join("|");
    if (r.merker.dataset.n !== merkeNokkel) {
      r.merker.dataset.n = merkeNokkel;
      r.merker.replaceChildren(...merker.map(([type, tekst]) => {
        const s = document.createElement("span");
        s.className = `radmerke merke-${type}`;
        s.textContent = tekst;
        return s;
      }));
    }
    settAttr(r.knapp, "aria-disabled", pris <= t.saldo ? "false" : "true");
    r.li.classList.toggle("eier", n > 0);
    r.li.classList.toggle("pekt", pekt === id);
  }
}

function kjop(id) {
  const a = aksje(id);
  const ant = antallKjop(id);
  const for_ = t;
  const gfFor = gfAntall(t, id);
  t = kjopAksje(t, id, ant);
  if (t === for_) { si(`Du mangler ${ore(prisAksje(t, id, ant) - t.saldo)}.`); return; }
  hopp(rader.get(id)?.figur);
  if (id === pekt) pekNeste = 0;   // rådgiveren ser på nytt når du har kjøpt det han pekte på
  const n = t.aksjer[id];
  const gf = gfAntall(t, id);
  if (gf > gfFor) si(`Generalforsamling i ${a.navn}: du stemte for høyere utbytte. Nå ${ganger(Math.pow(REGLER.gfFaktor, gf))} utbytte.`);
  else si(`${a.navn}: ${formaterTall(n)} ${flertall(a, n)}, ${perSek(aksjeRate(t, id))}.`);
  tegn();
  lagre();
}

// ---------- Kontoen, farten og overføringen ----------

function klikkSisteSek(naa = performance.now()) {
  klikk = klikk.filter((k) => naa - k.tid < 1000);
  return klikk;
}

// Fartsstreken: de første 60 % går jevnt til 2,5 ganger, resten opp mot 12 ganger.
function fartAndel(f) {
  if (f <= REGLER.fartLett) return (0.6 * (f - 1)) / (REGLER.fartLett - 1);
  return 0.6 + (0.4 * Math.log(f / REGLER.fartLett)) / Math.log(REGLER.fartMaks / REGLER.fartLett);
}

function tegnKonto() {
  const saldo = ore(t.saldo);
  settTekst(el.saldo, saldo);
  el.saldo.classList.toggle("lang", saldo.length > 13);
  const ps = perSekund(t);
  const siste = klikkSisteSek();
  const fraTrykk = siste.reduce((sum, k) => sum + k.verdi, 0);
  settTekst(el.inntekt, perSek(ps + fraTrykk));
  settTekst(el.rate, perSek(ps));
  settTekst(el.klikkrate, ore(fraTrykk));
  settTekst(el.miniSaldo, saldo);
  settTekst(el.miniRate, perSek(ps + fraTrykk));

  const f = fartFaktor(siste.length);
  settTekst(el.grisVerdi, "+" + ore(klikkverdi(t, siste.length + 1)));
  settTekst(el.fartTekst, f > 1 ? `Fart ${formaterTall(f, f >= 10 ? 1 : 2)}x` : "Trykk raskt for fart");
  el.fart.classList.toggle("pa", f > 1);
  el.fart.classList.toggle("vill", f > REGLER.fartLett);
  el.fartFyll.style.transform = `scaleX(${fartAndel(f).toFixed(3)})`;

  const pris = prisTrykk(t, 1);
  settTekst(el.oppgraderNiva, `nivå ${formaterTall(t.trykkNiva)}`);
  settTekst(el.oppgraderPris, ore(pris));
  settAttr(el.oppgrader, "aria-disabled", pris <= t.saldo ? "false" : "true");
  settAttr(el.oppgrader, "aria-label", `Større overføring, nivå ${t.trykkNiva}. Etter kjøpet gir hvert trykk ${ore(grunnTrykk(t.trykkNiva + 1))}. Koster ${ore(pris)}.`);
}

function tegnMilepel() {
  let ny = milepel;
  while (ny < MILEPELER.length && t.totalt >= MILEPELER[ny]) ny++;
  if (ny > milepel) { milepel = ny; si(`Du har hatt ${ore(MILEPELER[ny - 1])} innom grisen.`); }
}

el.gris.insertAdjacentHTML("afterbegin", GRIS);
el.gris.addEventListener("click", (e) => {
  const naa = performance.now();
  const n = klikkSisteSek(naa).length + 1;
  const verdi = klikkverdi(t, n);
  t = trykk(t, n);
  klikk.push({ tid: naa, verdi });
  pluss(e, verdi, fartFaktor(n));
  myntInn();
  tegn();
});
el.gris.addEventListener("keydown", (e) => { if (e.repeat && (e.key === "Enter" || e.key === " ")) e.preventDefault(); });

el.oppgrader.addEventListener("click", () => {
  const for_ = t;
  t = kjopTrykk(t, 1);
  if (t === for_) { si(`Du mangler ${ore(prisTrykk(t, 1) - t.saldo)}.`); return; }
  si(`Hvert trykk gir nå ${ore(grunnTrykk(t.trykkNiva))} før boostere.`);
  hopp(el.oppgrader);
  tegn();
  lagre();
});

// ---------- Uro i markedet ----------

el.uroIkon.innerHTML = FIGURER.klode.svg;
el.uro.dataset.tips = "uro";
el.uro.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") visTips(el.uro); });
el.uro.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") skjulTips(el.uro); });
el.uro.addEventListener("focus", () => visTips(el.uro));
el.uro.addEventListener("blur", () => skjulTips(el.uro));
el.uro.addEventListener("pointerdown", (e) => { pekertype = e.pointerType; });
el.uro.addEventListener("click", () => { if (pekertype !== "mouse") visTips(el.uro); });

let uroProsent = -1;
function tegnUro() {
  const fyll = urolig(t) ? 1 : uroFyll(t);
  el.uroFyll.style.transform = `scaleY(${fyll})`;
  el.uro.classList.toggle("aktiv", urolig(t));
  const p = Math.floor(fyll * 10) * 10;
  if (p !== uroProsent) { uroProsent = p; el.uro.setAttribute("aria-label", urolig(t) ? "Uro i markedet: noe skjer nå" : `Uro i markedet: ${p} prosent`); }

  const v = t.uro.verden, k = t.uro.krakk;
  let tekst = "", klasse = "";
  if (v) {
    const a = aksje(v.mal);
    tekst = `Verdenshendelse: ${a.uro}. ${a.navn} gir ${prosent(v.fall)} mindre utbytte i ${Math.ceil(v.igjen)} sek.`;
    klasse = "verden";
  } else if (k) {
    tekst = `Børskrakk! Aksjene er ${prosent(REGLER.krakkRabatt[0]).replace(" %", "")} til ${prosent(REGLER.krakkRabatt[1])} billigere i ${Math.ceil(k.igjen)} sek. Mest der veksten er høyest.`;
    klasse = "krakk";
  }
  el.hendelse.hidden = !tekst;
  settTekst(el.hendelse, tekst);
  if (klasse && !el.hendelse.classList.contains(klasse)) el.hendelse.className = `hendelse ${klasse}`;
}

function meldHendelse(h) {
  if (h.type === "verden") {
    const a = aksje(h.mal);
    annonser(`Verdenshendelse: ${a.uro}. ${a.navn} gir ${prosent(h.fall)} mindre utbytte i ${h.sek} sek.`);
  } else {
    annonser(`Børskrakk! Aksjene er billigere i ${h.sek} sek.`);
  }
  hopp(el.uroIkon);
}

// ---------- Ekstraordinært utbytte ----------

function tegnEkstra(naa) {
  const ps = perSekund(t);
  if (tilbud && naa > tilbudSlutt) {
    tilbud = null;
    el.ekstra.hidden = true;
    tilbudNeste = naa + tilfeldig(45, 90) * 1000;
  }
  if (!tilbud && ps > 0) {
    if (!tilbudNeste) tilbudNeste = naa + tilfeldig(20, 35) * 1000;
    if (naa >= tilbudNeste) {
      tilbud = ekstraTilbud(t);
      if (tilbud) {
        tilbudSlutt = naa + REGLER.ekstraVisSek * 1000;
        lagEkstraValg();
        el.ekstra.hidden = false;
        hopp(el.ekstra);
      }
    }
  }
  if (tilbud) {
    settTekst(el.ekstraVilkar, `Få ${ore(tilbud.sum)}. Jo lenger du venter, jo mindre betaler du nå.`);
    for (const knapp of el.ekstraValg.children) {
      const v = tilbud.valg[Number(knapp.dataset.nr)];
      settAttr(knapp, "aria-disabled", v.pris <= t.saldo ? "false" : "true");
    }
    el.ekstra.style.setProperty("--igjen", Math.max(0, (tilbudSlutt - naa) / (REGLER.ekstraVisSek * 1000)).toFixed(3));
  }
  const nokkel = t.ventende.map((v) => `${v.sum}:${formaterTid(Math.ceil(v.igjen))}`).join("|");
  if (nokkel !== ventNokkel) {
    ventNokkel = nokkel;
    el.ventende.replaceChildren(...t.ventende.map((v) => {
      const li = document.createElement("li");
      li.textContent = `Ekstraordinært utbytte: ${ore(v.sum)} om ${formaterTid(Math.ceil(v.igjen))}`;
      return li;
    }));
  }
}

function lagEkstraValg() {
  el.ekstraValg.replaceChildren(...tilbud.valg.map((v, nr) => {
    const knapp = document.createElement("button");
    knapp.type = "button";
    knapp.className = "ekstra-knapp";
    knapp.dataset.nr = nr;
    knapp.innerHTML = '<span class="ekstra-tid"></span><span class="ekstra-avk"></span><span class="pris"></span>';
    knapp.querySelector(".ekstra-tid").textContent = formaterTid(v.vent);
    knapp.querySelector(".ekstra-avk").textContent = `+${prosent(ekstraAvkastning(tilbud, v))}`;
    knapp.querySelector(".pris").textContent = ore(v.pris);
    knapp.setAttribute("aria-label", `Vent ${formaterTid(v.vent)}: betal ${ore(v.pris)} nå og få ${ore(tilbud.sum)}, ${prosent(ekstraAvkastning(tilbud, v))} avkastning.`);
    knapp.addEventListener("click", () => investerValg(nr));
    return knapp;
  }));
}

function investerValg(nr) {
  if (!tilbud) return;
  const v = tilbud.valg[nr];
  const for_ = t;
  t = investerEkstra(t, tilbud, nr);
  if (t === for_) { si(`Du mangler ${ore(v.pris - t.saldo)}.`); return; }
  si(`Du investerte ${ore(v.pris)}. ${ore(tilbud.sum)} kommer om ${formaterTid(v.vent)}.`);
  tilbud = null;
  el.ekstra.hidden = true;
  tilbudNeste = Date.now() + tilfeldig(45, 90) * 1000;
  tegn();
  lagre();
}

// ---------- Alt sammen ----------

// ---------- Investeringsrådgiveren ----------

el.radgiverFigur.innerHTML = `<span class="ikon-flis" style="--tile:${FIGURER.radgiver.tile}">${FIGURER.radgiver.svg}</span>`;

function tegnRadgiver(naa) {
  const vis = radgiverSynlig(t);
  if (el.radgiver.hidden === vis) el.radgiver.hidden = !vis;
  if (!vis) return;
  const treff = radgiverTreff(t);
  if (treff > 0 && (naa >= pekNeste || (pekt && !rader.has(pekt)))) {
    const ny = radgiverPek(t);
    if (ny !== pekt && ny) { pekt = ny; hopp(rader.get(ny)?.figur); }
    pekNeste = naa + PEK_SEK * 1000;
  }
  if (treff === 0) pekt = null;
  const navn = pekt ? aksje(pekt).navn : "";
  settTekst(el.radgiverInfo, treff === 0
    ? `Peker på aksjen som ser rimeligst ut, med mest utbytte per krone. Treffer ${prosent(REGLER.radgiverStart)} av gangene, og bommer han, er det oftest med lite.`
    : `Treffsikkerhet ${prosent(treff)}. Han peker nå på ${navn}.`);
  const pris = prisRadgiver(t);
  const toppen = !Number.isFinite(pris);
  el.radgiverKnapp.hidden = toppen;
  if (toppen) return;
  const neste = treff === 0 ? REGLER.radgiverStart : treff + REGLER.radgiverSteg;
  settTekst(el.radgiverHandling, treff === 0 ? "Ansett" : `Oppgrader til ${prosent(neste)}`);
  settTekst(el.radgiverPris, ore(pris));
  settAttr(el.radgiverKnapp, "aria-disabled", pris <= t.saldo ? "false" : "true");
}

el.radgiverKnapp.addEventListener("click", () => {
  const for_ = t;
  t = kjopRadgiver(t);
  if (t === for_) { si(`Du mangler ${ore(prisRadgiver(t) - t.saldo)}.`); return; }
  pekNeste = 0;
  si(for_.radgiver === 0 ? "Finn Fondsen er ansatt. Han peker på én aksje om gangen." : `Finn Fondsen treffer nå ${prosent(radgiverTreff(t))} av gangene.`);
  hopp(el.radgiverFigur);
  tegn();
  lagre();
});

// ---------- Byen i bakgrunnen: én figur for hver aksje, bod og butikk du eier ----------

const bilder = {};
let byNokkel = "";

function bilde(id) {
  if (!bilder[id]) {
    const img = new Image();
    const kode = FIGURER[id].svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" ');
    img.onload = () => { byNokkel = ""; };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(kode);
    bilder[id] = img;
  }
  return bilder[id];
}

// Byen bygges fra bakken og opp. Innen hver rad er rekkefølgen fast, men stokket, så figurene står på samme sted fra gang til gang.
function rekkefolge(kol, rad) {
  let fro = 20261117;
  const neste = () => { fro = (fro * 1664525 + 1013904223) % 4294967296; return fro / 4294967296; };
  const liste = [];
  for (let r = rad - 1; r >= 0; r--) {
    const kolonner = Array.from({ length: kol }, (_, i) => i);
    for (let i = kol - 1; i > 0; i--) { const j = Math.floor(neste() * (i + 1)); [kolonner[i], kolonner[j]] = [kolonner[j], kolonner[i]]; }
    for (const k of kolonner) liste.push({ k, r, dx: neste() - 0.5, dy: neste() - 0.5 });
  }
  return liste;
}

function tegnBy() {
  // Byen står under saldoen, så tallene alltid er lette å lese.
  const topp = el.konto.offsetTop + el.konto.offsetHeight + 8;
  const b = el.scene.clientWidth, h = Math.max(0, el.scene.clientHeight - topp);
  if (el.by.style.top !== `${topp}px`) { el.by.style.top = `${topp}px`; el.by.style.height = `${h}px`; }
  const eide = AKSJER.filter((a) => t.aksjer[a.id] > 0).map((a) => ({ id: a.id, n: t.aksjer[a.id] }));
  const nokkel = `${b}x${h}:` + eide.map((e) => `${e.id}${e.n}`).join(",");
  if (nokkel === byNokkel || !b || !h) return;
  byNokkel = nokkel;
  const dpr = Math.min(2, devicePixelRatio || 1);
  el.by.width = Math.round(b * dpr);
  el.by.height = Math.round(h * dpr);
  const ctx = el.by.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, b, h);
  const totalt = eide.reduce((s, e) => s + e.n, 0);
  if (!totalt) return;
  const rute = Math.max(13, Math.min(34, Math.floor(Math.sqrt((b * h) / totalt))));
  const kol = Math.floor(b / rute), rad = Math.floor(h / rute);
  const plasser = kol * rad;
  // Er det flere enn det er plass til, får hvert selskap plass etter hvor mange du eier, men minst én.
  const tegnes = totalt <= plasser ? eide : eide.map((e) => ({ ...e, n: Math.max(1, Math.floor((e.n / totalt) * plasser)) }));
  const rekke = rekkefolge(kol, rad);
  const kant = (b - kol * rute) / 2;
  const luft = Math.max(1.5, rute * 0.08);
  const str = rute - 2 * luft;
  let i = 0;
  for (const e of tegnes) {
    const img = bilde(e.id);
    const tile = FIGURER[e.id].tile;
    for (let k = 0; k < e.n && i < plasser; k++, i++) {
      const p = rekke[i];
      const x = kant + p.k * rute + luft + p.dx * luft;
      const y = h - (rad - p.r) * rute + luft + p.dy * luft;
      ctx.fillStyle = tile;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, str, str, str * 0.25) : ctx.rect(x, y, str, str);
      ctx.fill();
      if (img.complete && img.naturalWidth) ctx.drawImage(img, x, y, str, str);
    }
  }
}
if ("ResizeObserver" in window) new ResizeObserver(() => { byNokkel = ""; tegnBy(); }).observe(el.scene);

function tegn(naa = Date.now()) {
  tegnRadgiver(naa);
  tegnKonto();
  tegnBoostere();
  tegnGf();
  tegnButikk();
  tegnUro();
  tegnEkstra(naa);
  tegnMilepel();
  tegnBy();
  oppdaterTips();
}

for (const radio of document.querySelectorAll('input[name="antall"]')) {
  radio.addEventListener("change", () => { modus = radio.value === "maks" ? "maks" : Number(radio.value); tegn(); });
}

// Liten linje øverst med saldo og inntekt når kontoen er rullet ut av syne.
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([inngang]) => {
    el.mini.classList.toggle("vis", !inngang.isIntersecting && inngang.boundingClientRect.top < 0);
  }).observe(el.konto);
}

// ---------- Lagring ----------

function lagre() {
  if (!el.husk.checked) return;
  try { localStorage.setItem(NOKKEL, JSON.stringify(tilLagring(t, Date.now()))); } catch { /* lagring er valgfritt */ }
}
function slett() {
  try { localStorage.removeItem(NOKKEL); } catch { /* ingenting å slette */ }
}
function hent() {
  try { const tekst = localStorage.getItem(NOKKEL); return tekst ? fraLagring(JSON.parse(tekst)) : null; } catch { return null; }
}

function velkommenTilbake(sekunder) {
  const r = borte(t, sekunder);
  t = r.tilstand;
  if (r.gevinst > 0) si(`Mens du var borte, ga aksjene ${ore(r.gevinst)} i utbytte.` + (sekunder > REGLER.maksBorteSek ? ` Bare de første ${formaterTid(REGLER.maksBorteSek)} teller.` : ""));
}

el.husk.addEventListener("change", () => {
  if (el.husk.checked) { lagre(); si("Spillet huskes på denne enheten."); }
  else { slett(); si("Det lagrede spillet er slettet fra denne enheten."); }
});
setInterval(lagre, 10000);
addEventListener("pagehide", lagre);
document.addEventListener("visibilitychange", () => { if (document.hidden) lagre(); });

{
  const tekst = el.omstart.textContent;
  let tid = 0;
  const nullstill = () => { clearTimeout(tid); delete el.omstart.dataset.klar; el.omstart.textContent = tekst; };
  el.omstart.addEventListener("click", () => {
    const brukt = t.trykk > 0 || t.totalt > 0;
    if (brukt && !el.omstart.dataset.klar) {
      el.omstart.dataset.klar = "1";
      el.omstart.textContent = "Trykk en gang til for å tømme grisen";
      tid = setTimeout(nullstill, 4000);
      return;
    }
    nullstill();
    t = nyTilstand();
    milepel = 0; klikk = []; tilbud = null; tilbudNeste = 0; pekt = null; pekNeste = 0;
    boosterNokkel = ""; gfNokkel = ""; ventNokkel = "";
    el.ekstra.hidden = true;
    skjulTips();
    for (const rad of rader.values()) rad.li.remove();
    rader.clear();
    tegn();
    lagre();
    si("Grisen er tom. Du starter på nytt.");
  });
}

// ---------- I gang ----------

try { for (const n of GAMLE_NOKLER) localStorage.removeItem(n); } catch { /* ingenting å slette */ }
const lagret = hent();
if (lagret) {
  t = lagret.tilstand;
  el.husk.checked = true;
  while (milepel < MILEPELER.length && t.totalt >= MILEPELER[milepel]) milepel++;
  gfNokkel = generalforsamlinger(t).map((g) => g.id + ":" + g.antall).join("|");
  const borteSek = lagret.tid ? (Date.now() - lagret.tid) / 1000 : 0;
  if (borteSek > 5) velkommenTilbake(borteSek);
  else if (borteSek > 0) t = tikk(t, borteSek);
  const melding = el.status.textContent;
  gfNokkel = "";
  tegn();
  if (melding) si(melding);
} else {
  tegn();
}
for (const r of rader.values()) r.figur && r.figur.getAnimations().forEach((a) => a.finish());
document.documentElement.classList.add("klikk-klar");

setInterval(() => {
  const naa = Date.now();
  const dt = (naa - forrige) / 1000;
  forrige = naa;
  if (dt > 5) velkommenTilbake(dt);
  else if (dt > 0) {
    const ventFor = t.ventende.reduce((sum, v) => sum + v.sum, 0);
    const varUrolig = urolig(t);
    t = tikk(t, dt);
    const ventEtter = t.ventende.reduce((sum, v) => sum + v.sum, 0);
    if (ventEtter < ventFor) { si(`Ekstraordinært utbytte: ${ore(ventFor - ventEtter)} kom inn.`); hopp(el.saldo); }
    if (perSekund(t) > 0) {
      const r = uroSteg(t, dt);
      t = r.tilstand;
      if (r.hendelse) meldHendelse(r.hendelse);
    }
    if (varUrolig && !urolig(t)) annonser("Markedet er rolig igjen.");
  }
  tegn(naa);
  gulMynt(naa);
}, 100);
