// Felles hjelpere for grensesnittet i «Overfør»: tekst, tall, bevegelse, meldinger og tips ved ikonene.
import { formaterOre } from "/lib/klikker.js";
import { formaterTall } from "/lib/format.js";
import { spill } from "./lyd.js";

export const $ = (id) => document.getElementById(id);
export const rolig = matchMedia("(prefers-reduced-motion: reduce)");
export const ore = formaterOre;
export const perSek = (x) => `${ore(x)}/sek`;
export const prosent = (x) => `${formaterTall(Math.round(x * 100))} %`;
export const ganger = (f) => {
  const des = Number.isInteger(f) ? 0 : Number.isInteger(Math.round(f * 1000) / 100) ? 1 : 2;
  return formaterTall(f, des) + "x";
};
export const tilfeldig = (lav, hoy) => lav + Math.random() * (hoy - lav);

export function settTekst(node, tekst) { if (node && node.textContent !== tekst) node.textContent = tekst; }
export function settAttr(node, navn, verdi) { if (node && node.getAttribute(navn) !== verdi) node.setAttribute(navn, verdi); }
export function vis(node, synlig) { if (node && node.hidden === synlig) node.hidden = !synlig; }

const status = $("status"), annonse = $("annonse");
/** Synlig melding under grisen. */
export function si(tekst) { status.textContent = tekst; }
/** Melding bare for skjermlesere. */
export function annonser(tekst) { annonse.textContent = tekst; }

export function hopp(node) {
  if (!node || rolig.matches) return;
  node.animate([{ transform: "scale(1)" }, { transform: "scale(1.12) rotate(-3deg)" }, { transform: "scale(1)" }], { duration: 320, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
}

/** Lager et element fra HTML. */
export function lag(html) {
  const mal = document.createElement("template");
  mal.innerHTML = html.trim();
  return mal.content.firstElementChild;
}

// ---------- Tips ved ikonene ----------

const tips = $("tips");
const innhold = new Map();   // type → anker => { tittel, linjer }
let aktiv = null;
export let pekertype = "mouse";

/** Hver type ikon har sin egen tekst. Funksjonen får ankeret og gir { tittel, linjer } eller null. */
export function registrerTips(type, fn) { innhold.set(type, fn); }

function lesTips(anker) {
  return innhold.get(anker.dataset.tips)?.(anker) ?? null;
}

export function visTips(anker) {
  const i = lesTips(anker);
  if (!i) return;
  aktiv = anker;
  const s = document.createElement("strong");
  s.textContent = i.tittel;
  tips.replaceChildren(s, ...i.linjer.map((l, n) => {
    const p = document.createElement("p");
    p.textContent = l;
    if (n === i.linjer.length - 1) p.className = "tips-status";
    return p;
  }));
  tips.hidden = false;
  plasser();
}

function plasser() {
  if (!aktiv) return;
  const r = aktiv.getBoundingClientRect();
  const b = tips.getBoundingClientRect();
  const kant = 8;
  const midt = Math.min(innerWidth - b.width - kant, Math.max(kant, r.left + r.width / 2 - b.width / 2));
  let x = r.right + 10;
  if (x + b.width > innerWidth - kant) x = r.left - b.width - 10;
  if (x < kant) x = midt;
  let y = x === midt ? r.bottom + 10 : r.top + r.height / 2 - b.height / 2;
  y = Math.min(innerHeight - b.height - kant, Math.max(kant, y));
  tips.style.left = `${Math.round(x)}px`;
  tips.style.top = `${Math.round(y)}px`;
}

export function skjulTips(anker) {
  if (anker && anker !== aktiv) return;
  aktiv = null;
  tips.hidden = true;
}

/** Oppdaterer siste linje i tipset som vises, for eksempel hvor mye av prisen du har. */
export function oppdaterTips() {
  if (!aktiv) return;
  if (!aktiv.isConnected) { skjulTips(); return; }
  const i = lesTips(aktiv);
  if (i) settTekst(tips.lastElementChild, i.linjer.at(-1));
}

/** Gir et ikon tips ved hover, fokus og første trykk med finger. Andre trykk utfører handlingen. */
export function medTips(knapp, handling) {
  let siste = { type: "mouse", varApen: false };
  knapp.setAttribute("aria-describedby", "tips");
  knapp.addEventListener("pointerdown", (e) => { pekertype = e.pointerType; siste = { type: e.pointerType, varApen: aktiv === knapp }; });
  knapp.addEventListener("keydown", () => { siste = { type: "keyboard", varApen: true }; });
  knapp.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") visTips(knapp); });
  knapp.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") skjulTips(knapp); });
  knapp.addEventListener("focus", () => visTips(knapp));
  knapp.addEventListener("blur", () => skjulTips(knapp));
  knapp.addEventListener("click", () => {
    if ((siste.type === "touch" || siste.type === "pen") && !siste.varApen && handling) { visTips(knapp); siste.varApen = true; return; }
    if (!handling && siste.type !== "mouse") { visTips(knapp); return; }
    handling?.();
  });
}

document.addEventListener("pointerdown", (e) => { if (aktiv && !aktiv.contains(e.target)) skjulTips(); }, { passive: true });
addEventListener("scroll", () => { if (aktiv && pekertype !== "mouse") skjulTips(); else plasser(); }, { passive: true });
addEventListener("keydown", (e) => { if (e.key === "Escape") skjulTips(); });

// ---------- Vinduer ----------

/** Åpner et dialogvindu. Trykk utenfor lukker det. */
export function apne(dialog) {
  if (typeof dialog.showModal === "function" && !dialog.open) { dialog.showModal(); spill("apne"); }
}
for (const d of document.querySelectorAll("dialog.spill-vindu")) {
  d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
}
