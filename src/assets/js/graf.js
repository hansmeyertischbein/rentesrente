// Linjegraf for sparing over tid, tegnet som inline SVG.
// Punktene er ett per år: { ar, innskudd, verdi, lav?, hoy? }.

import { aksetekst, omtrentKr, formaterKr } from "../../lib/format.js";
import { glattSti, flateSti, gradient, reduserBevegelse } from "./kurve.js";

const NS = "http://www.w3.org/2000/svg";

function el(navn, attrs = {}, forelder) {
  const e = document.createElementNS(NS, navn);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (forelder) forelder.appendChild(e);
  return e;
}

/** Runde verdier for rutenettet: 1, 2, 2,5 eller 5 ganger en tierpotens. */
export function finTrinn(maks, antall = 4) {
  if (!(maks > 0)) return { trinn: 1, topp: 1 };
  const grov = maks / antall;
  const potens = Math.pow(10, Math.floor(Math.log10(grov)));
  const trinn = [1, 2, 2.5, 5, 10].map((f) => f * potens).find((t) => t >= grov);
  return { trinn, topp: Math.ceil(maks / trinn) * trinn };
}

function linje(punkter, x, y, felt) {
  return glattSti(punkter.map((p) => [x(p.ar), y(p[felt])]));
}

function flate(punkter, x, y, ovre, nedre) {
  return flateSti(
    punkter.map((p) => [x(p.ar), y(typeof ovre === "function" ? ovre(p) : p[ovre])]),
    punkter.map((p) => [x(p.ar), y(typeof nedre === "function" ? nedre(p) : p[nedre])]),
  );
}

export function lagGraf(beholder) {
  let punkter = [];
  let visBand = false;
  let eksakteInnskudd = true;
  let valgt = null;
  let geometri = null;
  let forsteTegning = true;

  const tips = document.createElement("div");
  tips.className = "graf-tips";
  tips.hidden = true;

  function tegn() {
    beholder.replaceChildren();
    if (!punkter.length) return;
    const bredde = Math.max(280, beholder.clientWidth);
    const hoyde = Math.round(Math.min(400, Math.max(260, bredde * 0.6)));
    const m = { topp: 22, hoyre: 10, bunn: 30, venstre: 2 };
    const sisteAr = Math.max(1, punkter[punkter.length - 1].ar);

    let maks = 0;
    for (const p of punkter) {
      maks = Math.max(maks, p.verdi, p.innskudd);
      if (visBand && Number.isFinite(p.hoy)) maks = Math.max(maks, p.hoy);
    }
    if (!(maks > 0)) {
      geometri = null;
      const tom = document.createElement("p");
      tom.className = "graf-tom";
      tom.textContent = "Grafen viser seg når du har skrevet inn et startbeløp eller en månedlig sparing.";
      beholder.appendChild(tom);
      return;
    }
    const { trinn, topp } = finTrinn(maks);
    const x = (ar) => m.venstre + (ar / sisteAr) * (bredde - m.venstre - m.hoyre);
    const y = (v) => m.topp + (1 - Math.max(0, v) / topp) * (hoyde - m.topp - m.bunn);
    geometri = { x, y, m, bredde, hoyde, sisteAr };

    const svg = el("svg", { viewBox: `0 0 ${bredde} ${hoyde}`, width: bredde, height: hoyde, "aria-hidden": "true", focusable: "false" });
    if (forsteTegning && !reduserBevegelse()) svg.classList.add("tegn-inn");
    forsteTegning = false;
    const defs = el("defs", {}, svg);
    gradient(defs, "g-avk", [["0", "stopp-multe-sterk"], ["1", "stopp-multe-svak"]]);
    gradient(defs, "g-inn", [["0", "stopp-fjord-sterk"], ["1", "stopp-fjord-svak"]]);

    // Rutenett og y-akse: tekst over hver linje, så hele bredden kan brukes til data.
    const rutenett = el("g", { class: "rutenett" }, svg);
    for (let v = 0; v <= topp + trinn / 2; v += trinn) {
      el("line", { x1: 0, x2: bredde, y1: y(v), y2: y(v) }, rutenett);
      const t = el("text", { x: 0, y: y(v) - 6, class: "akse" }, rutenett);
      t.textContent = v === 0 ? "0 kr" : aksetekst(v);
    }

    // X-akse
    const arTrinn = sisteAr <= 6 ? 1 : sisteAr <= 15 ? 5 : sisteAr <= 40 ? 10 : 20;
    const xAkse = el("g", { class: "xakse" }, svg);
    const xMerker = [];
    for (let a = 0; a <= sisteAr; a += arTrinn) xMerker.push(a);
    if (xMerker[xMerker.length - 1] !== sisteAr) {
      if (x(sisteAr) - x(xMerker[xMerker.length - 1]) < 44) xMerker.pop();
      xMerker.push(sisteAr);
    }
    for (const a of xMerker) {
      const t = el("text", { x: x(a), y: hoyde - 8, class: "akse", "text-anchor": a === 0 ? "start" : a === sisteAr ? "end" : "middle" }, xAkse);
      t.textContent = a === sisteAr ? `${a} år` : String(a);
    }

    // Flater: det du har satt inn nederst, avkastningen oppå.
    const bunn = () => 0;
    el("path", { d: flate(punkter, x, y, "innskudd", bunn), class: "flate-innskudd", fill: "url(#g-inn)" }, svg);
    if (punkter.some((p) => p.verdi > p.innskudd)) {
      el("path", { d: flate(punkter, x, y, (p) => Math.max(p.verdi, p.innskudd), "innskudd"), class: "flate-avkastning", fill: "url(#g-avk)" }, svg);
    }

    if (visBand && punkter.every((p) => Number.isFinite(p.lav))) {
      el("path", { d: flate(punkter, x, y, "hoy", "lav"), class: "flate-band" }, svg);
      el("path", { d: linje(punkter, x, y, "lav"), class: "linje-band" }, svg);
      el("path", { d: linje(punkter, x, y, "hoy"), class: "linje-band" }, svg);
    }
    el("path", { d: linje(punkter, x, y, "innskudd"), class: "linje-innskudd", pathLength: 1 }, svg);
    el("path", { d: linje(punkter, x, y, "verdi"), class: "linje-verdi", pathLength: 1 }, svg);

    const siste = punkter[punkter.length - 1];
    el("circle", { cx: x(siste.ar), cy: y(siste.verdi), r: 10, class: "punkt-glod" }, svg);
    el("circle", { cx: x(siste.ar), cy: y(siste.verdi), r: 4.5, class: "punkt-verdi punkt-slutt" }, svg);

    // Trådkors som følger året nærmest pekeren.
    const kors = el("g", { class: "kors", visibility: "hidden" }, svg);
    el("line", { y1: m.topp, y2: hoyde - m.bunn, class: "kors-linje" }, kors);
    el("circle", { r: 4, class: "punkt-innskudd kors-innskudd" }, kors);
    el("circle", { r: 4, class: "punkt-verdi kors-verdi" }, kors);

    beholder.appendChild(svg);
    beholder.appendChild(tips);
    if (valgt !== null) visAr(Math.min(valgt, sisteAr));
  }

  function visAr(ar) {
    if (!geometri) return;
    valgt = ar;
    const p = punkter.find((q) => q.ar === ar) ?? punkter[punkter.length - 1];
    const { x, y, bredde, m } = geometri;
    const svg = beholder.querySelector("svg");
    const kors = svg.querySelector(".kors");
    kors.setAttribute("visibility", "visible");
    const kx = x(p.ar);
    kors.querySelector(".kors-linje").setAttribute("x1", kx);
    kors.querySelector(".kors-linje").setAttribute("x2", kx);
    kors.querySelector(".kors-innskudd").setAttribute("cx", kx);
    kors.querySelector(".kors-innskudd").setAttribute("cy", y(p.innskudd));
    kors.querySelector(".kors-verdi").setAttribute("cx", kx);
    kors.querySelector(".kors-verdi").setAttribute("cy", y(p.verdi));

    tips.replaceChildren();
    const overskrift = document.createElement("p");
    overskrift.className = "tips-ar";
    overskrift.textContent = p.ar === 0 ? "Start" : `Etter ${p.ar} år`;
    tips.appendChild(overskrift);
    const liste = document.createElement("ul");
    const rader = [
      ["strek-multe", omtrentKr(p.verdi), "verdi"],
      ["strek-fjord", eksakteInnskudd ? formaterKr(p.innskudd) : omtrentKr(p.innskudd), "satt inn"],
    ];
    if (visBand && Number.isFinite(p.lav)) rader.push(["strek-tynn", `${omtrentKr(p.lav)} til ${omtrentKr(p.hoy)}`, "8 av 10 forløp"]);
    for (const [klasse, verdi, tekst] of rader) {
      const li = document.createElement("li");
      const strek = document.createElement("span");
      strek.className = `strek ${klasse}`;
      const sterk = document.createElement("strong");
      sterk.textContent = verdi;
      li.append(strek, sterk, " " + tekst);
      liste.appendChild(li);
    }
    tips.appendChild(liste);
    tips.hidden = false;
    const tipsBredde = tips.offsetWidth;
    const venstre = kx + 12 + tipsBredde > bredde ? kx - 12 - tipsBredde : kx + 12;
    tips.style.transform = `translate(${Math.max(0, venstre)}px, ${m.topp}px)`;
  }

  function skjul() {
    valgt = null;
    tips.hidden = true;
    beholder.querySelector(".kors")?.setAttribute("visibility", "hidden");
  }

  function arFraPeker(hendelse) {
    const boks = beholder.getBoundingClientRect();
    const { m, bredde, sisteAr } = geometri;
    const andel = (hendelse.clientX - boks.left - m.venstre) / (bredde - m.venstre - m.hoyre);
    return Math.round(Math.min(1, Math.max(0, andel)) * sisteAr);
  }

  beholder.addEventListener("pointermove", (e) => geometri && visAr(arFraPeker(e)));
  beholder.addEventListener("pointerdown", (e) => geometri && visAr(arFraPeker(e)));
  beholder.addEventListener("pointerleave", (e) => e.pointerType === "mouse" && skjul());
  beholder.addEventListener("focus", () => geometri && visAr(valgt ?? geometri.sisteAr));
  beholder.addEventListener("blur", skjul);
  beholder.addEventListener("keydown", (e) => {
    if (!geometri) return;
    const naa = valgt ?? geometri.sisteAr;
    const nytt = { ArrowLeft: naa - 1, ArrowRight: naa + 1, Home: 0, End: geometri.sisteAr }[e.key];
    if (nytt === undefined) return;
    e.preventDefault();
    visAr(Math.min(geometri.sisteAr, Math.max(0, nytt)));
  });

  // Tegn på nytt bare når bredden endres; høyden følger av tegningen selv.
  let ventende = 0;
  let sisteBredde = 0;
  new ResizeObserver(() => {
    if (beholder.clientWidth === sisteBredde) return;
    sisteBredde = beholder.clientWidth;
    cancelAnimationFrame(ventende);
    ventende = requestAnimationFrame(tegn);
  }).observe(beholder);

  return {
    oppdater(nyePunkter, { band, eksakt = true }) {
      punkter = nyePunkter;
      visBand = band;
      eksakteInnskudd = eksakt;
      tegn();
    },
  };
}
