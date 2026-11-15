// Grensesnittet for spillet «Overfør».
// Reglene ligger i /lib/klikker.js og er testet der. Denne filen tegner kontoen, butikken og figurene.
// Fjordblått er det du har overført selv, multegult er det hjelperne har tjent. Figurene er tegnet i blekk.

import {
  REGLER, HJELPERE, nyTilstand, grunnTrykk, trykkverdi, perSekund, hjelperRate, prisHjelper, maksHjelper, prisTrykk, maksTrykk,
  trykk, kjopHjelper, kjopTrykk, tilgjengeligeLoft, nesteLoftNiva, kjopLoft, tikk, borte, utbytteverdi, taUtbytte, synlige,
  tilLagring, fraLagring, formaterOre, formaterTid,
} from "/lib/klikker.js";
import { formaterTall } from "/lib/format.js";

const $ = (id) => document.getElementById(id);
const rolig = matchMedia("(prefers-reduced-motion: reduce)");
const NBSP = " ";
const NOKKEL = "rr-overfor";
const MILEPELER = [100, 1e4, 1e6, 1e8, 1e11, 1e14];

const el = {
  saldo: $("saldo"), rate: $("rate"), mynt: $("overfor"), myntVerdi: $("mynt-verdi"), flate: $("mynt-flate"),
  blaa: $("andel-blaa"), gul: $("andel-gul"), selv: $("sum-selv"), tjent: $("sum-tjent"),
  status: $("status"), utbytte: $("utbytte"), butikk: $("butikk"), loftBoks: $("loft"), loft: $("loft-liste"),
  husk: $("husk"), omstart: $("omstart"),
};

let t = nyTilstand();
let modus = 1;            // 1, 10 eller "maks"
let forrige = Date.now();
let milepel = 0;
let utbytteNeste = 0, utbytteSlutt = 0;
let myntNeste = 0;
const rader = new Map();
let loftNokkel = "";

// ---------- Figurene ----------
// Byster i strek, 64 × 64. Klassen f fyller med papir, m fyller med blekk, p er prikker.
// Gruppene fig-kropp, fig-oyne og fig-ting beveger seg hver for seg når du eier hjelperen.

const SKULDRE = '<path class="f" d="M9 63C9 52 16 47.5 23 46.5h10c7 1 14 5.5 14 16.5z"/>';
const HALS = '<path class="f" d="M24 39v8.5h8V39"/>';
const HODE = '<ellipse class="f" cx="28" cy="27" rx="11" ry="13"/>';
const OYNE = '<g class="fig-oyne"><circle class="p" cx="23.4" cy="26" r="1.15"/><circle class="p" cx="32.6" cy="26" r="1.15"/></g>';
const NESE = '<path d="M28 27.5q-1.6 3 .6 3.6"/>';
const SMIL = '<path d="M23.5 34q4.5 3.4 9 0"/>';
const BRILLER = '<circle cx="23.3" cy="26" r="3.7"/><circle cx="32.7" cy="26" r="3.7"/><path d="M27 25.6h2M19.6 25.4l-2.3-1M36.4 25.4l2.3-1"/>';
const SLIPS = '<path d="M22 47l6 6 6-6"/>';

const lag = (kropp, ting) => `<svg class="fig" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><g class="fig-kropp">${kropp}</g><g class="fig-ting">${ting}</g></svg>`;

const FIGURER = {
  // Runde briller, bar isse med hår på sidene, handlekurv.
  reitan: lag(
    SKULDRE + SLIPS + HALS + HODE
    + '<path d="M17.4 21q-2.6 3.5-.6 8M38.6 21q2.6 3.5.6 8M22.5 16.2q5.5-2.6 11 0"/>'
    + OYNE + BRILLER + NESE + '<path d="M22.5 33.5q5.5 4.6 11 0"/>',
    '<path class="f" d="M45 46h16l-2 12H47z"/><path d="M48 46q5-9.5 10 0M50.2 46l.8 12M53 46v12M55.8 46l-.8 12"/>'),
  // Bakoverstrøket hår, bredt glis, åpen skjorte, resepsjonsklokke.
  stordalen: lag(
    SKULDRE + '<path d="M21.5 47l5 8.5M34.5 47l-5 8.5"/>' + HALS + HODE
    + '<path class="m" d="M16.6 25C13.5 12 23.5 6.6 31 8.2c8.4.6 12.6 8 8.4 16.8-1.4-6-5.4-8.6-11.4-8.2-6-.4-9.8 2.2-11.4 8.2z"/>'
    + OYNE + '<path d="M20.8 22.4q2.6-1.8 5.2-.6M30 21.8q2.6-1.2 5.2.6"/>' + NESE
    + '<path class="f" d="M22 32.4q6 7.6 12 0z"/><path d="M23.6 34.2h8.8"/>',
    '<path class="f" d="M46 56a8 8 0 0 1 16 0z"/><path d="M44 59.5h20M54 48v-2.6"/><circle class="p" cx="54" cy="44" r="1.5"/>'),
  // Kort hår, arbeidsjakke, en laks.
  witzoe: lag(
    SKULDRE + '<path d="M22 47l6 5 6-5M28 52v11"/>' + HALS + HODE
    + '<path class="m" d="M17 23.5C17 12.8 39 12.8 39 23.5 35.8 18.6 20.2 18.6 17 23.5z"/>'
    + OYNE + '<path d="M21 22.6h4.6M30.4 22.6H35"/>' + NESE + '<path d="M24 34.2q4 2.2 8 0"/>',
    '<path class="f" d="M43.5 50c4-6.4 12-6.4 15.5 0-3.5 6.4-11.500 6.4-15.5 0z"/><path class="f" d="M59 50l4.200-4.400v8.800z"/><circle class="p" cx="47.4" cy="49" r=".9"/><path d="M50.6 46.800q1.600 3.200 0 6.400"/>'),
  // Langt, lyst hår med midtskill, en spire i potte.
  andresen: lag(
    '<path class="f" d="M16 26C14 11.500 42 11.500 40 26c1 12 3 20 5.500 26.500h-35C13 46 15 38 16 26z"/>'
    + SKULDRE + SLIPS + HALS + HODE
    + '<path d="M28 14.200c-4 2.600-9 5.600-10.600 13.300M28 14.200c4 2.600 9 5.600 10.600 13.300"/>'
    + OYNE + '<path d="M21 22.800q2.300-1.200 4.600-.300M30.400 22.500q2.300-.900 4.600.300"/>' + NESE + SMIL,
    '<path class="f" d="M49 55h10l-1.500 7.500h-7z"/><path d="M54 55v-9"/><path class="f" d="M54 49.500q-6.500-.800-6.500-6.500 6.500.300 6.500 6.500zM54 46.500q.500-6 6.500-6.500 0 6-6.500 6.500z"/>'),
  // Bredt hode, kortklipt hår, skjeggstubb, anker.
  rokke: lag(
    SKULDRE + '<path d="M20.500 47.500q7.500 5.500 15 0"/>' + '<path class="f" d="M22.500 39v8.500h11V39"/>'
    + '<ellipse class="f" cx="28" cy="27.500" rx="12.600" ry="12.600"/>'
    + '<path class="m" d="M15.500 24.500C15 12 41 12 40.500 24.500 37 19.600 19 19.600 15.500 24.500z"/>'
    + OYNE + '<path d="M20.600 22.800l5.200-.600M30.200 22.200l5.200.600"/>' + NESE + '<path d="M23 33.200q5.500 3.200 10.500-.600"/>'
    + '<g class="p"><circle cx="19.600" cy="34.500" r=".55"/><circle cx="21.800" cy="37.200" r=".55"/><circle cx="24.600" cy="38.800" r=".55"/><circle cx="28" cy="39.300" r=".55"/><circle cx="31.400" cy="38.800" r=".55"/><circle cx="34.200" cy="37.200" r=".55"/><circle cx="36.400" cy="34.500" r=".55"/><circle cx="23.200" cy="36" r=".55"/><circle cx="32.800" cy="36" r=".55"/></g>',
    '<circle cx="54" cy="42" r="2.200"/><path d="M54 44.200V59.500M50 48h8M46 53q1 7 8 6.500 7 .500 8-6.500M44.600 55.800l1.400-2.800 2.800 1.400M63.400 55.800L62 53l-2.800 1.400"/>'),
  // Eldre, rundt ansikt, hvitt hår, tunge bryn, dress, tankskip på bølger.
  fredriksen: lag(
    SKULDRE + SLIPS + '<path d="M28 53v10"/>' + HALS
    + '<ellipse class="f" cx="28" cy="27.500" rx="12" ry="12.600"/>'
    + '<path class="f" d="M16.600 24C14.500 12.500 22.500 9.500 28 10.800c6-1.300 13.500 1.700 11.400 13.200-2.400-5.200-6-6.600-11.400-6.400-5.400-.200-9 1.200-11.400 6.400z"/>'
    + '<path d="M20.500 15q3.700-2.600 7.500-.200 3.800-2.400 7.500.200"/>'
    + OYNE + '<path stroke-width="2.600" d="M20.400 22.600l5.200-1M30.400 21.600l5.200 1"/><path d="M21.400 28.800q2 1.200 4 0M30.600 28.800q2 1.200 4 0"/>' + NESE
    + '<path d="M23.500 34.600q4.500 1.400 9 0"/>',
    '<path class="f" d="M43 52h20.500l-3 6.500H45.500z"/><path class="f" d="M57 52v-5.500h4.500V52"/><path d="M45.500 49.800h9M42 62q2.600-2.200 5.200 0t5.200 0 5.200 0 5.200 0"/>'),
  // Langt, mørkt hår med sidelugg, stigende kurve.
  midelfart: lag(
    '<path class="m" d="M15.500 27C13 10.500 43 10.500 40.500 27c1 11 3.500 18.500 5.500 25H10c2-6.500 4.500-14 5.500-25z"/>'
    + SKULDRE + SLIPS + HALS + HODE
    + '<path class="m" d="M17.300 24.500C17.500 14.500 30 12 38.800 19.500 33 18.800 24 19.500 17.300 24.500z"/>'
    + OYNE + '<path d="M21 23.200q2.300-1 4.600-.200M30.400 23q2.300-.800 4.600.200"/>' + NESE + SMIL,
    '<path d="M45 43.500V60h18.500M47.500 57l4-4.200 3.200 2.200 7-9M58 46h3.700v3.700"/>'),
  // Mørkt hår med sideskill, runde briller, slips, globus.
  tangen: lag(
    SKULDRE + SLIPS + '<path class="m" d="M28 53l-2.200 4.500L28 63l2.200-5.500z"/>' + HALS + HODE
    + '<path class="m" d="M17 24.500C15.800 13 30 10.300 39 16c1 3 .700 6 0 8.500-2-4.600-8-6.800-13.500-5.800-3.500.600-6.500 2.800-8.500 5.800z"/>'
    + OYNE + BRILLER + NESE + SMIL,
    '<circle class="f" cx="54" cy="52" r="8.500"/><ellipse cx="54" cy="52" rx="3.700" ry="8.500"/><path d="M45.500 52h17M47.300 47q6.700 2.600 13.400 0M47.300 57q6.700-2.600 13.400 0"/>'),
  trykk: `<svg class="fig" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><g class="fig-kropp"><circle class="f" cx="32" cy="32" r="19"/><circle cx="32" cy="32" r="14.500" stroke-width="1.200"/><path stroke-width="2.600" d="M32 24.500v15M24.500 32h15"/></g><g class="fig-ting"></g></svg>`,
  skygge: `<svg class="fig fig-skygge" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M9 63C9 52 16 47.500 23 46.500h1V39c-4.500-2.500-7-7-7-12 0-7.200 4.900-13 11-13s11 5.800 11 13c0 5-2.500 9.500-7 12v7.500h1c7 1 14 5.500 14 16.500z"/></svg>`,
};

// ---------- Tekst ----------

const settTekst = (node, tekst) => { if (node.__t !== tekst) { node.__t = tekst; node.textContent = tekst; } };
const settAttr = (node, navn, verdi) => { if (node.getAttribute(navn) !== verdi) node.setAttribute(navn, verdi); };
let statusTid = 0;
function si(tekst) {
  el.status.textContent = tekst;
  clearTimeout(statusTid);
  statusTid = setTimeout(() => { el.status.textContent = ""; }, 7000);
}
const antallTrykk = (x) => formaterTall(Math.max(1, Math.ceil(x - 1e-9))) + NBSP + "trykk";
const nivaTekst = (n) => (n === 1 ? "Neste nivå" : formaterTall(n) + NBSP + "nivåer");

// ---------- Butikken ----------

function lagRad(id, status) {
  const li = document.createElement("li");
  li.className = "rad";
  li.dataset.id = id;
  if (status === "skygge") {
    const h = HJELPERE.find((x) => x.id === id);
    li.classList.add("rad-skygge");
    li.innerHTML = `<div class="rad-knapp"><span class="rad-figur">${FIGURER.skygge}</span><span class="rad-navn">Ukjent hjelper</span><span class="rad-info">Viser seg når du har hatt ${formaterOre(h.pris * REGLER.visFra)} innom kontoen.</span></div>`;
    return { status, li };
  }
  const navn = id === "trykk" ? "Større overføring" : HJELPERE.find((x) => x.id === id).navn;
  li.innerHTML = `<button type="button" class="rad-knapp"><span class="rad-figur">${FIGURER[id]}</span><span class="rad-navn">${navn} <span class="rad-niva"></span></span><span class="rad-pris"></span><span class="rad-info"></span><span class="rad-kjop"></span><span class="rad-strek" aria-hidden="true"><i></i></span></button>`;
  const knapp = li.firstChild;
  knapp.addEventListener("click", () => kjop(id));
  return {
    status, li, knapp, figur: li.querySelector(".rad-figur"), niva: li.querySelector(".rad-niva"), pris: li.querySelector(".rad-pris"),
    info: li.querySelector(".rad-info"), kjop: li.querySelector(".rad-kjop"), strek: li.querySelector(".rad-strek i"), andel: -1,
  };
}

function antallFor(id) {
  if (modus !== "maks") return modus;
  return Math.max(1, id === "trykk" ? maksTrykk(t) : maksHjelper(t, id));
}

function tegnButikk() {
  const liste = [{ id: "trykk", status: "apen" }, ...synlige(t)];
  for (const { id, status } of liste) {
    let rad = rader.get(id);
    if (!rad) { rad = lagRad(id, status); rader.set(id, rad); el.butikk.append(rad.li); }
    else if (rad.status !== status) { const ny = lagRad(id, status); rad.li.replaceWith(ny.li); rader.set(id, ny); rad = ny; }
    if (status === "skygge") continue;

    const antall = antallFor(id);
    let pris, niva, info, inn;
    if (id === "trykk") {
      pris = prisTrykk(t, antall);
      niva = t.trykkNiva;
      info = `Grunnbeløp per trykk: ${formaterOre(grunnTrykk(niva))}. Etter kjøpet: ${formaterOre(grunnTrykk(niva + antall))}.`;
      inn = antallTrykk(pris / (antall * REGLER.trykkSteg));
    } else {
      const h = HJELPERE.find((x) => x.id === id);
      const perNiva = h.rate * Math.pow(2, t.loft[id]);
      pris = prisHjelper(t, id, antall);
      niva = t.hjelpere[id];
      const loftNiva = nesteLoftNiva(t, id);
      const loftTekst = loftNiva === null ? "" : niva >= loftNiva ? " Løft klart nederst." : niva > 0 ? ` Løft på nivå ${loftNiva}.` : "";
      info = niva > 0
        ? `${h.bransje}. Tjener ${formaterOre(hjelperRate(t, id))} i sekundet.${loftTekst}`
        : `${h.bransje}. Tjener ${formaterOre(perNiva)} i sekundet per nivå.`;
      inn = formaterTid(pris / (antall * perNiva));
    }
    const raad = pris <= t.saldo;
    settTekst(rad.niva, niva > 0 ? `Nivå${NBSP}${formaterTall(niva)}` : "");
    settTekst(rad.pris, formaterOre(pris));
    settTekst(rad.info, info);
    settTekst(rad.kjop, `${nivaTekst(antall)}. Tjent inn på ${inn}.`);
    settAttr(rad.knapp, "aria-disabled", raad ? "false" : "true");
    rad.li.classList.toggle("eier", niva > 0);
    const andel = raad ? 0 : Math.round(Math.min(1, t.saldo / pris) * 200) / 200;
    if (andel !== rad.andel) { rad.andel = andel; rad.strek.style.transform = `scaleX(${andel})`; }
  }
}

function kjop(id) {
  const antall = antallFor(id);
  const for_ = t;
  const pris = id === "trykk" ? prisTrykk(t, antall) : prisHjelper(t, id, antall);
  t = id === "trykk" ? kjopTrykk(t, antall) : kjopHjelper(t, id, antall);
  if (t === for_) { si(`Du mangler ${formaterOre(Math.max(0.1, pris - t.saldo))}.`); return; }
  const rad = rader.get(id);
  hopp(rad.figur);
  si(id === "trykk"
    ? `Større overføring er på nivå ${t.trykkNiva}. Hvert trykk gir ${formaterOre(trykkverdi(t))}.`
    : `${HJELPERE.find((x) => x.id === id).navn} er på nivå ${t.hjelpere[id]}.`);
  tegn();
  lagre();
}

// ---------- Løft ----------

function tegnLoft() {
  const liste = tilgjengeligeLoft(t);
  const nokkel = liste.map((l) => l.id + ":" + l.navn).join("|");
  if (nokkel !== loftNokkel) {
    const nye = liste.filter((l) => !loftNokkel.includes(l.id + ":" + l.navn));
    const fokus = document.activeElement?.closest?.(".loft-knapp")?.dataset.id;
    loftNokkel = nokkel;
    el.loft.replaceChildren(...liste.map((l) => {
      const li = document.createElement("li");
      const virkning = l.type === "trykk"
        ? `Hvert trykk gir også ${formaterTall(l.andel * 100)}${NBSP}% av det hjelperne tjener i sekundet.`
        : `${l.hjelper} tjener dobbelt.`;
      li.innerHTML = `<button type="button" class="loft-knapp" data-id="${l.id}"><span class="loft-navn"></span><span class="loft-pris"></span><span class="loft-virkning"></span></button>`;
      li.querySelector(".loft-navn").textContent = l.navn;
      li.querySelector(".loft-pris").textContent = formaterOre(l.pris);
      li.querySelector(".loft-virkning").textContent = virkning;
      li.firstChild.addEventListener("click", () => kjopEtLoft(l));
      return li;
    }));
    el.loftBoks.hidden = liste.length === 0;
    if (fokus) (el.loft.querySelector(`[data-id="${fokus}"]`) ?? rader.get(fokus)?.knapp ?? el.mynt).focus();
    if (nye.length) si(`Nytt løft nederst i butikken: ${nye.map((l) => l.navn).join(", ")}.`);
  }
  for (const l of liste) {
    const knapp = el.loft.querySelector(`[data-id="${l.id}"]`);
    if (knapp) settAttr(knapp, "aria-disabled", l.pris <= t.saldo ? "false" : "true");
  }
}

function kjopEtLoft(l) {
  const for_ = t;
  t = kjopLoft(t, l.id);
  if (t === for_) { si(`Du mangler ${formaterOre(Math.max(0.1, l.pris - t.saldo))}.`); return; }
  if (l.type === "hjelper") hopp(rader.get(l.id)?.figur);
  tegn();
  si(l.type === "trykk" ? `${l.navn}: hvert trykk gir nå ${formaterOre(trykkverdi(t))}.` : `${l.navn}: ${l.hjelper} tjener nå ${formaterOre(hjelperRate(t, l.id))} i sekundet.`);
  lagre();
}

// ---------- Kontoen ----------

function tegnKonto() {
  const saldo = formaterOre(t.saldo);
  settTekst(el.saldo, saldo);
  el.saldo.classList.toggle("lang", saldo.length > 13);
  const ps = perSekund(t);
  settTekst(el.rate, ps > 0 ? `${formaterOre(ps)} i sekundet` : "Ingen hjelpere ennå");
  settTekst(el.myntVerdi, "+" + formaterOre(trykkverdi(t)));
  settTekst(el.selv, formaterOre(t.overfort));
  settTekst(el.tjent, formaterOre(t.tjent));
  const sum = t.overfort + t.tjent;
  const blaa = sum > 0 ? Math.round((t.overfort / sum) * 200) / 200 : 0;
  if (el.blaa.__a !== blaa || el.blaa.__s !== (sum > 0)) {
    el.blaa.__a = blaa; el.blaa.__s = sum > 0;
    el.blaa.style.flexGrow = sum > 0 ? blaa : 0;
    el.gul.style.flexGrow = sum > 0 ? 1 - blaa : 0;
  }
}

function tegnMilepel() {
  const sum = t.overfort + t.tjent;
  let ny = milepel;
  while (ny < MILEPELER.length && sum >= MILEPELER[ny]) ny++;
  if (ny > milepel) { milepel = ny; si(`Du har hatt ${formaterOre(MILEPELER[ny - 1])} innom kontoen.`); }
}

function tegnUtbytte(naa) {
  const ps = perSekund(t);
  const vist = !el.utbytte.hidden;
  if (!vist) {
    if (ps <= 0) { utbytteNeste = 0; return; }
    if (!utbytteNeste) utbytteNeste = naa + 1000 * (utbytteSlutt ? 45 + Math.random() * 45 : 20 + Math.random() * 15);
    if (naa < utbytteNeste) return;
    utbytteSlutt = naa + REGLER.utbytteVisSek * 1000;
    el.utbytte.hidden = false;
    el.status.textContent = "";
  } else if (naa >= utbytteSlutt) { skjulUtbytte(); return; }
  settTekst(el.utbytte, `Ta imot utbytte: ${formaterOre(utbytteverdi(t))}`);
}
function skjulUtbytte() {
  if (document.activeElement === el.utbytte) el.mynt.focus();
  el.utbytte.hidden = true;
  utbytteNeste = 0;
}
el.utbytte.addEventListener("click", () => {
  const verdi = utbytteverdi(t);
  t = taUtbytte(t);
  skjulUtbytte();
  si(`Utbytte: hjelperne ga ${formaterOre(verdi)} ekstra.`);
  tegn();
});

function tegn(naa = Date.now()) {
  tegnKonto();
  tegnButikk();
  tegnLoft();
  tegnMilepel();
  tegnUtbytte(naa);
}

// ---------- Bevegelse ----------
// Bare transform og opacity. Alt står stille for den som har bedt om mindre bevegelse.

function hopp(node) {
  if (!node || rolig.matches || !node.animate) return;
  node.animate([{ transform: "translateY(0)" }, { transform: "translateY(-7px)" }, { transform: "translateY(0)" }], { duration: 320, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
}

function flyt(node, hoyde, varighet) {
  const a = node.animate?.([{ transform: "translate(-50%, 0)", opacity: 1 }, { transform: `translate(-50%, ${-hoyde}px)`, opacity: 0 }], { duration: varighet, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
  if (a) a.onfinish = () => node.remove(); else node.remove();
}

function pluss(e, verdi) {
  if (rolig.matches || el.flate.querySelectorAll(".pluss").length > 14) return;
  const r = el.flate.getBoundingClientRect();
  const fraMus = e.detail > 0 && e.clientX > 0;
  const node = document.createElement("span");
  node.className = "pluss";
  node.setAttribute("aria-hidden", "true");
  node.textContent = "+" + formaterOre(verdi);
  node.style.left = (fraMus ? e.clientX - r.left : r.width / 2) + (Math.random() * 16 - 8) + "px";
  node.style.top = (fraMus ? e.clientY - r.top - 28 : -8) + "px";
  el.flate.append(node);
  flyt(node, 46, 800);
}

function gulMynt(naa) {
  if (rolig.matches || document.hidden || naa < myntNeste) return;
  myntNeste = naa + 900 + Math.random() * 900;
  const eide = HJELPERE.filter((h) => t.hjelpere[h.id] > 0).map((h) => rader.get(h.id)).filter((r) => r?.figur);
  if (!eide.length) return;
  const rad = eide[Math.floor(Math.random() * eide.length)];
  const node = document.createElement("i");
  node.className = "gulmynt";
  node.setAttribute("aria-hidden", "true");
  rad.figur.append(node);
  flyt(node, 20, 900);
}

// ---------- Trykket ----------

el.mynt.addEventListener("click", (e) => {
  const verdi = trykkverdi(t);
  t = trykk(t);
  pluss(e, verdi);
  tegn();
});
// Holder du en tast inne, teller det som ett trykk.
el.mynt.addEventListener("keydown", (e) => { if (e.repeat && (e.key === "Enter" || e.key === " ")) e.preventDefault(); });

for (const radio of document.querySelectorAll('input[name="antall"]')) {
  radio.addEventListener("change", () => { modus = radio.value === "maks" ? "maks" : Number(radio.value); tegn(); });
  if (radio.checked) modus = radio.value === "maks" ? "maks" : Number(radio.value);
}

// ---------- Lagring, bare når du ber om det ----------

function lagre() {
  if (!el.husk.checked) return;
  try { localStorage.setItem(NOKKEL, JSON.stringify(tilLagring(t, Date.now()))); } catch { /* fullt eller sperret lager: spillet går videre uten */ }
}
function slett() { try { localStorage.removeItem(NOKKEL); } catch { /* ingenting å slette */ } }
function hent() {
  try { return fraLagring(JSON.parse(localStorage.getItem(NOKKEL))); } catch { return null; }
}

el.husk.addEventListener("change", () => {
  if (el.husk.checked) { lagre(); si("Spillet huskes i nettleseren på denne enheten."); }
  else { slett(); si("Det lagrede spillet er slettet fra denne enheten."); }
});
addEventListener("pagehide", lagre);
document.addEventListener("visibilitychange", () => { if (document.hidden) lagre(); });
setInterval(lagre, 10000);

function velkommenTilbake(sekunder) {
  const b = borte(t, sekunder);
  t = b.tilstand;
  if (b.gevinst > 0 && sekunder >= 60) {
    const tak = sekunder > REGLER.maksBorteSek ? ` Bare de første ${formaterTid(REGLER.maksBorteSek)} teller.` : "";
    si(`Mens du var borte, tjente hjelperne ${formaterOre(b.gevinst)}.${tak}`);
  }
}

// ---------- Start på nytt ----------

{
  const tekst = el.omstart.textContent;
  let tid = 0;
  const nullstill = () => { clearTimeout(tid); delete el.omstart.dataset.klar; el.omstart.textContent = tekst; };
  el.omstart.addEventListener("click", () => {
    const brukt = t.trykk > 0 || t.tjent > 0;
    if (brukt && !el.omstart.dataset.klar) {
      el.omstart.dataset.klar = "1";
      el.omstart.textContent = "Trykk en gang til for å slette kontoen";
      tid = setTimeout(nullstill, 4000);
      return;
    }
    nullstill();
    t = nyTilstand();
    milepel = 0; utbytteNeste = 0; utbytteSlutt = 0; loftNokkel = "";
    el.utbytte.hidden = true;
    el.loft.replaceChildren();
    el.loftBoks.hidden = true;
    for (const rad of rader.values()) rad.li.remove();
    rader.clear();
    tegn();
    lagre();
    si("Kontoen er tom. Du starter på nytt.");
  });
}

// ---------- I gang ----------

const lagret = hent();
if (lagret) {
  t = lagret.tilstand;
  el.husk.checked = true;
  while (milepel < MILEPELER.length && t.overfort + t.tjent >= MILEPELER[milepel]) milepel++;
  loftNokkel = tilgjengeligeLoft(t).map((l) => l.id + ":" + l.navn).join("|");
  if (lagret.tid) velkommenTilbake((Date.now() - lagret.tid) / 1000);
  loftNokkel = "";
  const melding = el.status.textContent;
  tegnLoft();
  if (melding) si(melding);
}
tegn();
document.documentElement.classList.add("klikk-klar");

setInterval(() => {
  const naa = Date.now();
  const dt = (naa - forrige) / 1000;
  forrige = naa;
  if (dt > 5) velkommenTilbake(dt); else t = tikk(t, dt);
  tegn(naa);
  gulMynt(naa);
}, 100);
