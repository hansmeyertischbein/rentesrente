// Vakten på grisen: trykk fra skript og styrte nettlesere gir ingen penger, og ser trykkene automatiske ut,
// må du fange en mynt som flytter seg, eller vente litt. Reglene ligger i /lib/trykkvakt.js.
import { VAKT, nyVakt, avvist, registrer, slippInn } from "/lib/trykkvakt.js";
import { $, rolig, settTekst, si, apne } from "./overfor-felles.js";
import { spill } from "./lyd.js";

const NOKKEL = "rr-overfor-vakt";   // bare i denne fanen, så sperren ikke forsvinner når siden lastes på nytt
const el = { vindu: $("vakt-vindu"), bane: $("vakt-bane"), mynt: $("vakt-mynt"), status: $("vakt-status"), vent: $("vakt-vent") };
const lest = () => { try { return sessionStorage.getItem(NOKKEL) === "1"; } catch { return false; } };
const husk = (paa) => { try { paa ? sessionStorage.setItem(NOKKEL, "1") : sessionStorage.removeItem(NOKKEL); } catch { /* valgfritt */ } };

let vakt = nyVakt(lest());
let ned = null;         // når pekeren gikk ned på grisen
let fanget = 0, ventTid = 0, ramme = 0, hoppTid = 0;

/** Pekeren går ned på grisen. Tiden til klikket sier hvor lenge trykket varte. */
export function pekerNed(e) { if (e.isTrusted) ned = e.timeStamp; }

/** Om trykket skal gi penger. Viser sjekken når det trengs. */
export function slipperGjennom(e) {
  if (avvist({ ekte: e.isTrusted, styrt: navigator.webdriver === true })) {
    si("Automatiske trykk gir ingen penger. Trykk på grisen selv.");
    return false;
  }
  // Tastatur og skjermleser har ingen peker, og da måles ikke varigheten.
  const varighet = e.detail > 0 && ned !== null ? e.timeStamp - ned : null;
  ned = null;
  vakt = registrer(vakt, { tid: e.timeStamp, varighet, x: e.clientX, y: e.clientY });
  if (!vakt.sperret) return true;
  husk(true);
  visSjekk();
  return false;
}

// ---------- Sjekken ----------

function stans() {
  cancelAnimationFrame(ramme);
  clearInterval(hoppTid);
  clearInterval(ventTid);
}

function visSjekk() {
  if (el.vindu.open) return;
  stans();
  fanget = 0;
  settTekst(el.status, `Fang mynten ${VAKT.mynter} ganger.`);
  settTekst(el.vent, `Vent ${VAKT.ventSek} sekunder i stedet`);
  el.vent.disabled = false;
  apne(el.vindu);
  if (rolig.matches) { flytt(); hoppTid = setInterval(flytt, 1400); }   // med redusert bevegelse hopper den i stedet for å gli
  else gli(performance.now(), Math.random() * 1000);
}

function plasser(x, y) {
  const b = el.bane.clientWidth - el.mynt.offsetWidth, h = el.bane.clientHeight - el.mynt.offsetHeight;
  el.mynt.style.transform = `translate(${(x * b).toFixed(1)}px, ${(y * h).toFixed(1)}px)`;
}
function flytt() { plasser(Math.random(), Math.random()); }
function gli(start, fase) {
  const steg = (naa) => {
    const s = (naa - start) / 1000 + fase;
    plasser(0.5 + 0.5 * Math.sin(s * 1.1) * Math.cos(s * 0.37), 0.5 + 0.5 * Math.sin(s * 1.7 + fase));
    ramme = requestAnimationFrame(steg);
  };
  ramme = requestAnimationFrame(steg);
}

function bestatt() {
  stans();
  vakt = slippInn();
  husk(false);
  el.vindu.close();
  spill("gevinst");
  si("Takk! Du kan trykke igjen.");
}

export function start() {
  const robot = (e) => avvist({ ekte: e.isTrusted, styrt: navigator.webdriver === true });
  el.mynt.addEventListener("pointerdown", (e) => {
    if (robot(e)) return;
    fanget++;
    spill("mynt");
    if (fanget >= VAKT.mynter) { bestatt(); return; }
    settTekst(el.status, `${VAKT.mynter - fanget} igjen.`);
    cancelAnimationFrame(ramme);
    if (rolig.matches) flytt(); else gli(performance.now(), Math.random() * 1000);
  });
  el.vent.addEventListener("click", (e) => {
    if (robot(e)) return;
    let igjen = VAKT.ventSek;
    el.vent.disabled = true;
    const vis = () => settTekst(el.vent, `${igjen} sekunder igjen`);
    vis();
    clearInterval(ventTid);
    ventTid = setInterval(() => { igjen--; if (igjen <= 0) bestatt(); else vis(); }, 1000);
  });
  // Escape lukker ikke sjekken. Trykker du på grisen uten å ha bestått, kommer den tilbake.
  el.vindu.addEventListener("cancel", (e) => e.preventDefault());
}
