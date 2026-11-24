// Grensesnittet for spillet «Overfør». Regnereglene ligger i /lib/klikker.js, figurene i klikker-figurer.js.
import {
  REGLER, AKSJER, BOOSTERE, nyTilstand, trykk, klikkverdi, grunnTrykk, fartFaktor, perSekund, aksjeRate, utbyttePerAksje,
  prisAksje, maksAksje, kjopAksje, prisTrykk, kjopTrykk, nesteBoostere, andelRad, kjopBooster, generalforsamlinger, gfAntall,
  tikk, borte, maksBorte, uroFyll, urolig, uroSteg, rabatt, ekstraTilbud, ekstraAvkastning, investerEkstra, gikkDarlig, synlige, fordeler, nyeFordeler,
  tilLagring, fraLagring, radgiverTreff, prisRadgiver, kjopRadgiver, radgiverSynlig, radgiverPek, formaterTid,
  prestasjonerSteg, giring, giret,
} from "/lib/klikker.js";
import { etasje } from "/lib/landskap.js";
import { formaterTall } from "/lib/format.js";
import { FIGURER, lagGris } from "./klikker-figurer.js";
import {
  $, rolig, ore, perSek, prosent, ganger, tilfeldig, settTekst, settAttr, si, annonser, hopp,
  registrerTips, visTips, skjulTips, oppdaterTips, medTips, apne,
} from "./overfor-felles.js";
import * as klokke from "./klokke.js";
import * as lotto from "./overfor-lotto.js";
import * as profil from "./overfor-profil.js";
import * as konto from "./overfor-konto.js";
import * as prestasjoner from "./overfor-prestasjoner.js";
import * as innstillinger from "./overfor-innstillinger.js";
import * as vakt from "./overfor-vakt.js";
import * as utsikt from "./overfor-utsikt.js";
import * as seddel from "./overfor-seddel.js";
import * as minispill from "./overfor-minispill.js";
import { spill } from "./lyd.js";

const NOKKEL = "rr-overfor-2";
const MILEPELER = [100, 1e4, 1e6, 1e8, 1e11, 1e14, 1e17];

const el = {
  konto: $("konto"), saldo: $("saldo"), inntekt: $("inntekt"), rate: $("rate"), klikkrate: $("klikkrate"),
  gris: $("overfor"), grisFlate: $("gris-flate"), grisVerdi: $("gris-verdi"),
  fart: $("fart"), fartTekst: $("fart-tekst"), fartFyll: $("fart-fyll"),
  oppgrader: $("oppgrader"), oppgraderNiva: $("oppgrader-niva"), oppgraderPris: $("oppgrader-pris"),
  boostere: $("booster-liste"), gf: $("gf-liste"),
  uro: $("uro"), uroIkon: $("uro-ikon"), uroFyll: $("uro-fyll"),
  hendelse: $("hendelse"), ekstra: $("ekstra"), ekstraVilkar: $("ekstra-vilkar"), ekstraNavn: $("ekstra-navn"), ekstraValg: $("ekstra-valg"), ventende: $("ventende"), status: $("status"), annonse: $("annonse"),
  butikk: $("butikk"), husk: $("husk"), omstart: $("omstart"),
  mini: $("mini"), miniSaldo: $("mini-saldo"), miniRate: $("mini-rate"),
  scene: $("scene"), side: document.querySelector(".spillside"), meldinger: document.querySelector(".meldinger"),
  intro: $("intro"), omSpillet: $("om-spillet"),
  radgiver: $("radgiver"), radgiverFigur: $("radgiver-figur"), radgiverInfo: $("radgiver-info"),
  radgiverKnapp: $("radgiver-knapp"), radgiverHandling: $("radgiver-handling"), radgiverPris: $("radgiver-pris"),
};

let t = nyTilstand();
let modus = 1;            // 1, 10 eller "maks"
let forrige = performance.now();
let milepel = 0;
let klikk = [];           // trykk det siste sekundet: { tid, verdi }
let tilbud = null, tilbudSlutt = 0, tilbudNeste = 0;
let boosterNokkel = "", gfNokkel = "", ventNokkel = "";
let resultater = [];      // investeringer som nettopp kom inn: { tekst, bra, slutt }
let myntNeste = 0;
let pekt = null, pekNeste = 0;  // aksjen rådgiveren peker på, og når han ser på nytt
const PEK_SEK = 20;
const rader = new Map();

const aksje = (id) => AKSJER.find((a) => a.id === id);
const flertall = (a, n) => (n === 1 ? a.en : a.fler);

// ---------- Bevegelse ----------

function flyt(node, hoyde, varighet) {
  node.animate([{ transform: `${node.style.transform} translateY(0)`, opacity: 1 }, { transform: `${node.style.transform} translateY(${-hoyde}px)`, opacity: 0 }],
    { duration: varighet, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }).finished.then(() => node.remove(), () => node.remove());
}

function pluss(e, verdi, fart) {
  if (rolig.matches || el.grisFlate.querySelectorAll(".pluss").length > 14) return;
  const flate = el.grisFlate.getBoundingClientRect();
  const z = flate.width / el.grisFlate.offsetWidth || 1;   // på PC er spillet zoomet ut
  const fraMus = e && e.clientX > 0;
  const x = fraMus ? (e.clientX - flate.left) / z : el.grisFlate.offsetWidth / 2 + tilfeldig(-30, 30);
  const y = fraMus ? (e.clientY - flate.top) / z : el.grisFlate.offsetHeight * 0.3;
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
  if (el.gris.querySelectorAll(".gris-mynt").length > 8) return;
  const m = document.createElement("span");
  m.className = "gris-mynt";
  m.textContent = "kr";
  el.gris.append(m);
  // Mynten spretter opp fra grisen, sprer seg litt ut til siden og faller ned i sprekken på ryggen.
  const ut = tilfeldig(-1.6, 1.6).toFixed(2);
  const hoyde = tilfeldig(3.4, 4.6).toFixed(2);
  const snu = tilfeldig(-70, 70).toFixed(0);
  m.animate([
    { transform: "translate(-50%, 0) scale(0.7) rotateY(0deg)", opacity: 0, easing: "cubic-bezier(0.2, 0.8, 0.4, 1)" },
    { transform: `translate(calc(-50% + ${ut}rem), -${hoyde}rem) scale(1) rotateY(${snu}deg)`, opacity: 1, offset: 0.45, easing: "cubic-bezier(0.5, 0, 0.9, 0.5)" },
    { transform: "translate(-50%, 0.1rem) scale(0.9) rotateY(0deg)", opacity: 1, offset: 0.9 },
    { transform: "translate(-50%, 0.5rem) scale(0.8, 0.3)", opacity: 0 },
  ], { duration: 620 }).finished.then(() => m.remove(), () => m.remove());
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

registrerTips("booster", (anker) => {
  const b = BOOSTERE.find((x) => x.id === anker.dataset.id);
  if (!b) return null;
  const andel = andelRad(t, b.pris);
  return { tittel: b.navn, linjer: [boosterVirkning(b), `Koster ${ore(b.pris)}.`, andel >= 1 ? "Du har råd. Trykk for å kjøpe." : `Du har ${prosent(andel)} av prisen.`] };
});
registrerTips("gf", (anker) => {
  const a = aksje(anker.dataset.id);
  const n = t.aksjer[a.id];
  const antall = gfAntall(t, a.id);
  return { tittel: `Generalforsamling i ${a.navn}`, linjer: [
    `Du eier ${formaterTall(n)} ${flertall(a, n)} og stemte for høyere utbytte.`,
    `Gir ${ganger(REGLER.gfFaktor)} utbytte fra ${a.navn} for hver ${REGLER.gfHver}. ${a.en}, nå ${ganger(Math.pow(REGLER.gfFaktor, antall))}.`,
    `Neste ved ${formaterTall((antall + 1) * REGLER.gfHver)} ${a.fler}.`,
  ] };
});
registrerTips("uro", () => ({ tittel: "Uro i markedet", linjer: [
  `Streken fylles på ${formaterTid(REGLER.uroSek)}. Jo fullere den er, jo større er sjansen for en verdenshendelse eller et børskrakk. Når den er full, skjer det alltid.`,
  urolig(t) ? "Noe skjer nå." : `Nå: ${prosent(uroFyll(t))}.`,
] }));

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
  if (t === for_) { spill("feil"); si(`${b.navn}: du mangler ${ore(b.pris - t.saldo)}.`); visTips(knapp); return; }
  skjulTips();
  spill("booster");
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
    if (t.lapp.halv?.mal === id) merker.push(["krakk", "Grønn lapp: halv pris"]);
    else if (rabatt(t, id) > 0) merker.push(["krakk", `Krakk: ${prosent(rabatt(t, id))} billigere`]);
    if (t.uro.verden?.mal === id) merker.push(["verden", `Utbytte ${prosent(t.uro.verden.fall)} lavere`]);
    if (pekt === id) merker.push(["rad", "Fondsen peker hit"]);
    for (const f of fordeler(t, id)) {
      merker.push(f.oppnadd ? ["fordel", `✓ ${f.tekst}`] : ["kommer", `${formaterTall(f.antall)} ${a.fler}: ${f.tekst.charAt(0).toLowerCase()}${f.tekst.slice(1)}`]);
    }
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
  if (t === for_) { spill("feil"); si(`Du mangler ${ore(prisAksje(t, id, ant) - t.saldo)}.`); return; }
  hopp(rader.get(id)?.figur);
  spill("aksje", AKSJER.findIndex((a) => a.id === id));
  const opp = etasje(t) > etasje(for_);
  if (opp) spill("heis");
  if (rabatt(for_, id) > 0) gi(["krakk-kjop"]);
  if (id === pekt) { pekNeste = 0; gi(["radgiver-lytt"]); }   // rådgiveren ser på nytt når du har kjøpt det han pekte på
  const n = t.aksjer[id];
  const gf = gfAntall(t, id);
  const nye = nyeFordeler(for_, t);
  if (nye.length) {
    const bonus = nye.some((f) => f.type === "bonus") ? ` Du fikk ${ore(t.totalt - for_.totalt)}.` : "";
    si(`${formaterTall(n)} ${a.fler}: ${nye.map((f) => f.tekst.toLowerCase()).join(", ")}.${bonus}`.replace(/^./, (c) => c.toUpperCase()));
    hopp(el.saldo);
  } else if (gf > gfFor) {
    spill("gf");
    si(`Generalforsamling i ${a.navn}: du stemte for høyere utbytte. Nå ${ganger(Math.pow(REGLER.gfFaktor, gf))} utbytte.`);
  }
  else si(`${a.navn}: ${formaterTall(n)} ${flertall(a, n)}, ${perSek(aksjeRate(t, id))}.${opp ? ` Du ser lenger utover.${minispill.apnetAv(id) ? ` Nytt minispill: ${minispill.apnetAv(id)}.` : ""}` : ""}`);
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

// Grisen bytter utseende når du får en gudegris.
let grisNokkel;   // udefinert til grisen er tegnet første gang
function tegnGris() {
  const id = profil.grisId(t);
  if (id === grisNokkel) return;
  const for_ = grisNokkel;
  grisNokkel = id;
  el.gris.querySelector(".gris-fig")?.remove();
  el.gris.insertAdjacentHTML("afterbegin", lagGris(id));
  if (for_ !== undefined) hopp(el.gris.querySelector(".gris-fig"));
}
el.gris.addEventListener("pointerdown", vakt.pekerNed);
el.gris.addEventListener("click", (e) => {
  if (!vakt.slipperGjennom(e)) return;
  const naa = performance.now();
  const n = klikkSisteSek(naa).length + 1;
  const verdi = klikkverdi(t, n);
  t = trykk(t, n);
  klikk.push({ tid: naa, verdi });
  const fart = fartFaktor(n);
  spill("mynt", fart);
  if (fart >= 5) gi(["fart-5", ...(fart >= 8 ? ["fart-8"] : []), ...(fart >= REGLER.fartMaks ? ["fart-12"] : [])]);
  pluss(e, verdi, fartFaktor(n));
  myntInn();
  tegn();
});
el.gris.addEventListener("keydown", (e) => { if (e.repeat && (e.key === "Enter" || e.key === " ")) e.preventDefault(); });

el.oppgrader.addEventListener("click", () => {
  const for_ = t;
  t = kjopTrykk(t, 1);
  if (t === for_) { spill("feil"); si(`Du mangler ${ore(prisTrykk(t, 1) - t.saldo)}.`); return; }
  spill("oppgrader");
  si(`Hvert trykk gir nå ${ore(grunnTrykk(t.trykkNiva))} før boostere.`);
  hopp(el.oppgrader);
  tegn();
  lagre();
});

// ---------- Uro i markedet ----------

el.uroIkon.innerHTML = FIGURER.klode.svg;
el.uro.dataset.tips = "uro";
medTips(el.uro);

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
    spill("verden");
    gi(["verden"]);
  } else {
    spill("krakk");
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
        ekstraGiring = null;
        lagEkstraValg();
        el.ekstra.hidden = false;
        hopp(el.ekstra);
      }
    }
  }
  if (tilbud) {
    settTekst(el.ekstraNavn, `Invester ${ore(tilbud.innsats)} i en av disse`);
    const g = giring(t);
    settTekst(el.ekstraVilkar, "Pengene kommer om 1 til 2 minutter. Jo høyere avkastning, jo høyere risiko." + (g !== 1 ? ` Med ${ganger(g)} giring ganges gevinst og tap.` : ""));
    tegnEkstraValg();
    for (const knapp of el.ekstraValg.children) settAttr(knapp, "aria-disabled", tilbud.innsats <= t.saldo ? "false" : "true");
    el.ekstra.style.setProperty("--igjen", Math.max(0, (tilbudSlutt - naa) / (REGLER.ekstraVisSek * 1000)).toFixed(3));
  }
  tegnBobler(naa);
}

// Investeringene som venter, som bobler over grisen. Streken krymper til pengene kommer, uten tall.
function boble(klasse, tekst) {
  const li = document.createElement("li");
  li.className = `boble ${klasse}`;
  li.innerHTML = '<span class="boble-mynt" aria-hidden="true">kr</span><b></b>';
  li.querySelector("b").textContent = tekst;
  return li;
}

function tegnBobler(naa) {
  resultater = resultater.filter((r) => r.slutt > naa);
  // Fordelene fra pengesedlene vises som bobler med en strek som krymper.
  const lapper = [];
  if (t.lapp.dobbel > 0) lapper.push({ klasse: "lilla", tekst: "2x inntekt", andel: t.lapp.dobbel / REGLER.lappDobbelSek });
  if (t.lapp.halv) lapper.push({ klasse: "gronn", tekst: `½ ${aksje(t.lapp.halv.mal).navn}`, andel: t.lapp.halv.igjen / REGLER.lappHalvSek });
  const nokkel = lapper.map((l) => l.klasse + l.tekst).join() + "#" + t.ventende.map((v) => `${v.lovet ?? v.sum}:${v.lengde}:${v.pris}:${v.navn}`).join("|") + "#" + resultater.map((r) => r.slutt).join("|");
  if (nokkel !== ventNokkel) {
    ventNokkel = nokkel;
    el.ventende.replaceChildren(
      ...lapper.map((l) => {
        const li = boble(`lapp-boble ${l.klasse}`, l.tekst);
        li.insertAdjacentHTML("beforeend", '<span class="boble-tid lapp-tid" aria-hidden="true"><i></i></span>');
        return li;
      }),
      ...resultater.map((r) => boble(r.bra ? "bra" : "darlig", r.tekst)),
      ...t.ventende.map((v) => {
        const li = boble("venter", ore(v.lovet ?? v.sum));
        li.insertAdjacentHTML("beforeend", '<span class="boble-tid" aria-hidden="true"><i></i></span>');
        li.setAttribute("aria-label", `${v.navn ?? "Investering"}: ${ore(v.lovet ?? v.sum)} hvis det går bra.`);
        if (v.obl) li.classList.add("obl");
        return li;
      }),
    );
  }
  el.ventende.querySelectorAll(".lapp-tid i").forEach((i, nr) => { i.style.transform = `scaleX(${Math.max(0, lapper[nr]?.andel ?? 0).toFixed(3)})`; });
  const streker = el.ventende.querySelectorAll(".venter .boble-tid i");
  t.ventende.forEach((v, i) => {
    if (streker[i]) streker[i].style.transform = `scaleX(${Math.min(1, Math.max(0, v.igjen / (v.lengde || v.igjen || 1))).toFixed(3)})`;
  });
}

function lagEkstraValg() {
  el.ekstraValg.replaceChildren(...tilbud.valg.map((v, nr) => {
    const knapp = document.createElement("button");
    knapp.type = "button";
    knapp.className = "ekstra-knapp";
    knapp.dataset.nr = nr;
    knapp.classList.add(`niva-${nr}`);
    knapp.innerHTML = '<span class="ekstra-aktiv"></span><span class="ekstra-niva"></span><span class="ekstra-avk"></span><span class="pris"></span>';
    knapp.querySelector(".ekstra-aktiv").textContent = v.navn;
    knapp.querySelector(".ekstra-niva").textContent = v.niva;
    knapp.addEventListener("click", () => investerValg(nr));
    return knapp;
  }));
  tegnEkstraValg();
}

// Med giring viser knappene det du faktisk får: gevinsten ganget med giringen.
let ekstraGiring = null;
function tegnEkstraValg() {
  if (!tilbud) return;
  const g = giring(t);
  if (g === ekstraGiring && el.ekstraValg.dataset.n === String(tilbud.innsats)) return;
  ekstraGiring = g;
  el.ekstraValg.dataset.n = String(tilbud.innsats);
  tilbud.valg.forEach((v, nr) => {
    const knapp = el.ekstraValg.children[nr];
    const sum = giret(t, tilbud.innsats, v.sum);
    const avk = sum / tilbud.innsats - 1;
    knapp.querySelector(".ekstra-avk").textContent = `+${prosent(avk)}`;
    knapp.querySelector(".pris").textContent = `Få ${ore(sum)}`;
    knapp.setAttribute("aria-label", `${v.navn}, ${v.niva.toLowerCase()}: invester ${ore(tilbud.innsats)} og få ${ore(sum)}, ${prosent(avk)} avkastning${g !== 1 ? ` med ${ganger(g)} giring` : ""}.`);
  });
}

function investerValg(nr) {
  if (!tilbud) return;
  const v = tilbud.valg[nr];
  const for_ = t;
  t = investerEkstra(t, tilbud, nr);
  if (t === for_) { spill("feil"); si(`Du mangler ${ore(tilbud.innsats - t.saldo)}.`); return; }
  spill("invester");
  gi(nr === tilbud.valg.length - 1 ? ["ekstra-1", "ekstra-mest"] : ["ekstra-1"]);
  annonser(`Du investerte ${ore(tilbud.innsats)} i ${v.navn}. Går det bra, kommer ${ore(giret(t, tilbud.innsats, v.sum))} om 1 til 2 minutter.`);
  tilbud = null;
  el.ekstra.hidden = true;
  tilbudNeste = performance.now() + tilfeldig(45, 90) * 1000;
  tegn();
  lagre();
}

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
  if (t === for_) { spill("feil"); si(`Du mangler ${ore(prisRadgiver(t) - t.saldo)}.`); return; }
  spill("booster");
  pekNeste = 0;
  si(for_.radgiver === 0 ? "Finn Fondsen er ansatt. Han peker på én aksje om gangen." : `Finn Fondsen treffer nå ${prosent(radgiverTreff(t))} av gangene.`);
  hopp(el.radgiverFigur);
  tegn();
  lagre();
});

function tegn(naa = performance.now()) {
  tegnGris();
  profil.tegn();
  lotto.tegn();
  prestasjoner.tegn();
  innstillinger.tegn();
  tegnRadgiver(naa);
  tegnKonto();
  tegnBoostere();
  tegnGf();
  tegnButikk();
  tegnUro();
  tegnEkstra(naa);
  tegnMilepel();
  utsikt.tegn();
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
  try { localStorage.setItem(NOKKEL, JSON.stringify(tilLagring(t, klokke.naa()))); } catch { /* lagring er valgfritt */ }
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
  if (r.gevinst > 0) gi(sekunder > maksBorte(t) ? ["borte", "borte-lang"] : ["borte"]);
  if (r.gevinst > 0) si(`Mens du var borte, ga aksjene ${ore(r.gevinst)} i utbytte.` + (sekunder > maksBorte(t) ? ` Bare de første ${formaterTid(maksBorte(t))} teller.` : ""));
}

el.husk.addEventListener("change", () => {
  if (el.husk.checked) { lagre(); si("Spillet huskes på denne enheten."); }
  else { slett(); si("Det lagrede spillet er slettet fra denne enheten."); }
});
setInterval(lagre, 10000);
addEventListener("pagehide", lagre);
document.addEventListener("visibilitychange", () => { if (document.hidden) lagre(); });

// Bytter til et nytt spill: tom gris, prestisje eller et spill flyttet fra en annen enhet.
function byttSpill(ny, melding) {
  t = ny;
  milepel = 0; klikk = []; tilbud = null; tilbudNeste = 0; pekt = null; pekNeste = 0;
  while (milepel < MILEPELER.length && t.totalt >= MILEPELER[milepel]) milepel++;
  boosterNokkel = ""; gfNokkel = ""; ventNokkel = ""; resultater = [];
  el.ekstra.hidden = true;
  skjulTips();
  for (const rad of rader.values()) rad.li.remove();
  rader.clear();
  tegn();
  lagre();
  if (melding) si(melding);
}

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
    byttSpill(nyTilstand(), "Grisen er tom. Du starter på nytt.");
  });
}

// ---------- Om spillet ----------

el.omSpillet.addEventListener("click", () => apne(el.intro));

// ---------- Størrelsen på PC ----------

// På PC skaleres spillet så grisen og alt rundt den får plass i høyden på skjermen. Mobilen er som før.
const pc = matchMedia("(min-width: 60rem) and (hover: hover) and (pointer: fine)");
let tilpassTid = 0;
function tilpass() {
  if (!pc.matches) { el.side.style.zoom = ""; return; }
  el.side.style.zoom = "1";
  const topp = el.side.getBoundingClientRect().top + scrollY;
  const scene = el.scene.offsetHeight - el.meldinger.offsetHeight + 150;   // plass til tilbud og hendelser under grisen
  const plass = innerHeight - Math.min(topp, 90) - 24;
  const z = Math.max(0.5, Math.min(1.2, plass / scene));
  el.side.style.zoom = z.toFixed(3);
}
addEventListener("resize", () => { clearTimeout(tilpassTid); tilpassTid = setTimeout(tilpass, 150); });
pc.addEventListener?.("change", tilpass);

// ---------- Prestasjoner ----------

/** Gir prestasjonene du har nådd, og hendelsene i listen. Nye vises med en melding og en lyd. */
function gi(hendelser = []) {
  const r = prestasjonerSteg(t, hendelser);
  if (!r.nye.length) return;
  t = r.tilstand;
  prestasjoner.vis(r.nye);
  lagre();
}

// ---------- Delene i egne filer ----------

const api = {
  hent: () => t,
  /** Ny tilstand fra en handling. Gir false når ingenting endret seg. */
  sett(ny) {
    if (ny === t) return false;
    t = ny;
    tegn();
    lagre();
    return true;
  },
  byttSpill,
  lagring: () => tilLagring(t, klokke.naa()),
  prestasjon: (hendelser) => gi(hendelser),
  /** Laster et lagret spill, for eksempel fra kontoen, og regner med tiden siden det ble lagret. */
  lastInn(obj, melding) {
    const lest = fraLagring(obj);
    if (!lest) return false;
    byttSpill(lest.tilstand, melding);
    const borteSek = lest.tid ? (klokke.naa() - lest.tid) / 1000 : 0;
    if (borteSek > 5) { velkommenTilbake(borteSek); tegn(); lagre(); }
    return true;
  },
};
lotto.start(api);
profil.start(api);
konto.start(api);
prestasjoner.start(api);
innstillinger.start();
vakt.start();
utsikt.start360(api);
seddel.start(api);
minispill.start(api);

// ---------- I gang ----------

const lagret = hent();
const startet = performance.now();
if (lagret) {
  t = lagret.tilstand;
  el.husk.checked = true;
  while (milepel < MILEPELER.length && t.totalt >= MILEPELER[milepel]) milepel++;
}
tegn();
for (const r of rader.values()) r.figur && r.figur.getAnimations().forEach((a) => a.finish());
gfNokkel = generalforsamlinger(t).map((g) => g.id + ":" + g.antall).join("|");
document.documentElement.classList.add("klikk-klar");
tilpass();
if (!lagret) apne(el.intro);   // har du et lagret spill, kjenner du det fra før

// Tiden du var borte regnes etter den felles klokka, ikke enhetens. Sekundene siden siden lastet, er alt regnet med.
klokke.synk().then(() => {
  if (!lagret?.tid) return;
  const borteSek = (klokke.naa() - lagret.tid - (performance.now() - startet)) / 1000;
  if (borteSek > 5) velkommenTilbake(borteSek);
  else if (borteSek > 0) t = tikk(t, borteSek);
  tegn();
});

let tikkTeller = 0;
const antallAksjer = (x) => AKSJER.reduce((s, a) => s + x.aksjer[a.id], 0);

function ferdigTekst(v) {
  if (!gikkDarlig(v)) return { bra: true, tekst: `+${ore(v.sum)}`, si: `${v.navn ?? "Investeringen"}: ${ore(v.sum)} kom inn.` };
  if (v.sum < 0) return { bra: false, tekst: `Tapte ${ore(v.pris - v.sum)}`, si: `${v.navn ?? "Investeringen"} gikk dårlig, og med giringen tapte du ${ore(v.pris - v.sum)}.` };
  const ord = v.obl ? "Konkurs" : "Gikk dårlig";
  return { bra: false, tekst: `${ord}: ${ore(v.sum)} av ${ore(v.pris)}`, si: `${v.navn ?? "Investeringen"}: ${ord.toLowerCase()}. Du fikk ${ore(v.sum)} tilbake av ${ore(v.pris)}.` };
}

setInterval(() => {
  const naa = performance.now();
  const dt = (naa - forrige) / 1000;
  forrige = naa;
  const aksjerFor = antallAksjer(t);
  if (dt > 5) velkommenTilbake(dt);
  else if (dt > 0) {
    const ferdige = t.ventende.filter((v) => v.igjen - dt <= 0);
    const varUrolig = urolig(t);
    t = tikk(t, dt);
    for (const v of ferdige) {
      const f = ferdigTekst(v);
      resultater.push({ bra: f.bra, slutt: naa + 4000, tekst: f.tekst });
      annonser(f.si);
      spill(f.bra ? "gevinst" : v.obl ? "konkurs" : "tap");
      if (!f.bra) gi([v.obl ? "obl-konkurs" : "ekstra-darlig"]);
      if (f.bra) hopp(el.saldo);
    }
    if (perSekund(t) > 0) {
      const r = uroSteg(t, dt);
      t = r.tilstand;
      if (r.hendelse) meldHendelse(r.hendelse);
    }
    if (varUrolig && !urolig(t)) annonser("Markedet er rolig igjen.");
  }
  const solgt = aksjerFor - antallAksjer(t);
  if (solgt > 0) { spill("tvangssalg"); gi(["tvangssalg"]); si(`Tvangssalg: tapet var større enn saldoen, så ${formaterTall(solgt)} aksjer ble solgt for halv pris.`); lagre(); }
  if (++tikkTeller % 10 === 0) gi(new Date(klokke.naa()).getHours() < 4 ? ["natt"] : []);
  tegn(naa);
  gulMynt(naa);
}, 100);
