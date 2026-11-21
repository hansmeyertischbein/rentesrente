// Prestasjoner i «Overfør»: pokalen øverst til venstre viser hva du har låst opp og hvor mye du har trykket.
import { AKSJER } from "/lib/klikker.js";
import { PRESTASJONER } from "/lib/klikker-guder.js";
import { formaterTall } from "/lib/format.js";
import { MENYIKONER } from "./klikker-figurer.js";
import { $, ore, settTekst, lag, apne, hopp } from "./overfor-felles.js";
import { spill } from "./lyd.js";

const el = { knapp: $("prestasjon-knapp"), antall: $("prestasjon-antall"), vindu: $("prestasjon-vindu"), liste: $("prestasjon-liste"), stat: $("statistikk"), toast: $("prestasjon-toast") };
let api = null, ko = [], viser = false;

function tegnVindu() {
  const t = api.hent();
  const har = new Set(t.prestasjoner ?? []);
  const rader = [
    ["Trykk i alle spill", formaterTall(t.alleTrykk ?? 0)],
    ["Trykk i dette spillet", formaterTall(t.trykk)],
    ["Innom grisen", ore(t.totalt)],
    ["Aksjer", formaterTall(AKSJER.reduce((s, a) => s + t.aksjer[a.id], 0))],
    ["Prestisje", formaterTall(t.prestisje ?? 0)],
    ["Prestasjoner", `${har.size} av ${PRESTASJONER.length}`],
  ];
  el.stat.replaceChildren(...rader.map(([navn, verdi]) => {
    const d = lag(`<div class="stat"><dt></dt><dd></dd></div>`);
    d.querySelector("dt").textContent = navn;
    d.querySelector("dd").textContent = verdi;
    return d;
  }));
  // Opplåste først, så de som gjenstår. Hemmelige viser bare spørsmålstegn til du har dem.
  const sortert = [...PRESTASJONER].sort((a, b) => har.has(b.id) - har.has(a.id));
  el.liste.replaceChildren(...sortert.map((p) => {
    const ok = har.has(p.id);
    const li = lag(`<li class="prestasjon ${ok ? "oppnadd" : ""}"><span class="prestasjon-merke" aria-hidden="true">${ok ? "★" : p.hemmelig ? "?" : "☆"}</span><b></b><span></span></li>`);
    li.querySelector("b").textContent = ok || !p.hemmelig ? p.navn : "Hemmelig";
    li.querySelector("span:last-child").textContent = ok || !p.hemmelig ? p.tekst : "Noe spesielt må skje.";
    return li;
  }));
}

function visNeste() {
  if (viser || !ko.length) return;
  viser = true;
  const p = ko.shift();
  el.toast.replaceChildren(lag(`<span class="toast-merke" aria-hidden="true">★</span>`), lag(`<span><small>Prestasjon låst opp</small><b></b></span>`));
  el.toast.querySelector("b").textContent = p.navn;
  el.toast.hidden = false;
  el.toast.classList.remove("ut");
  spill("prestasjon");
  setTimeout(() => el.toast.classList.add("ut"), 2800);
  setTimeout(() => { el.toast.hidden = true; viser = false; visNeste(); }, 3200);
}

/** Viser nye prestasjoner én om gangen. */
export function vis(nye) {
  if (!nye.length) return;
  ko.push(...nye);
  hopp(el.knapp);
  visNeste();
  if (el.vindu.open) tegnVindu();
}

export function tegn() {
  if (!api) return;
  settTekst(el.antall, formaterTall((api.hent().prestasjoner ?? []).length));
}

export function start(a) {
  api = a;
  el.knapp.insertAdjacentHTML("afterbegin", `<span class="ikon-flis" style="--tile:${MENYIKONER.pokal.tile}">${MENYIKONER.pokal.svg}</span>`);
  el.knapp.addEventListener("click", () => { tegnVindu(); apne(el.vindu); });
}
