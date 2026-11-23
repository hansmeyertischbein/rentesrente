// Minispillene i «Overfør»: menyen, nivåene og premiene. Spillskjermene ligger i overfor-mini-brett.js og overfor-mini-nye.js.
import { MINISPILL, minispillPremie, apentNiva, klarteNiva, bodFaktor } from "/lib/klikker.js";
import { MENYIKONER, MINIIKONER } from "./klikker-figurer.js";
import { $, ore, ganger, settTekst, vis, lag, si, hopp, apne } from "./overfor-felles.js";
import { spill as lyd } from "./lyd.js";
import * as brett from "./overfor-mini-brett.js";
import * as nye from "./overfor-mini-nye.js";

const SPILL = {
  limonadeboden: { navn: "Limonadeboden", tekst: "Server riktig limonade. Hvert nivå dobler utbyttet fra alle bodene dine, for godt.", start: nye.limonadeboden },
  meglerhuset: { navn: "Meglerhuset", tekst: "Kjøp på bunn og selg på topp før børsen stenger.", start: nye.meglerhuset },
  grisevakta: { navn: "Grisevakta", tekst: "Bygg tårn og stopp regningene før de når grisen.", start: nye.grisevakta },
  grisetoget: { navn: "Grisetoget", tekst: "Plukk mynter, og ikke kjør i vognene.", start: brett.grisetoget },
  vekslebanken: { navn: "Vekslebanken", tekst: "Skyv like penger sammen, så veksles de opp.", start: brett.vekslebanken },
  krakkfeltet: { navn: "Krakkfeltet", tekst: "Finn de trygge rutene uten å treffe et krakk.", start: brett.krakkfeltet },
  regnskapet: { navn: "Regnskapet", tekst: "Hvert tall én gang i hver rad, kolonne og boks.", start: brett.regnskapet },
};
const el = { knapp: $("minispill-knapp"), vindu: $("minispill-vindu"), tittel: $("minispill-tittel"), tilbake: $("minispill-tilbake"), rot: $("minispill-rot") };
let api = null, stopp = null, naa = null;

const flis = (f) => `<span class="ikon-flis" style="--tile:${f.tile}">${f.svg}</span>`;
function avslutt() { stopp?.(); stopp = null; }

function visMeny() {
  avslutt();
  naa = null;
  settTekst(el.tittel, "Minispill");
  vis(el.tilbake, false);
  const t = api.hent();
  const ul = lag('<ul class="mini-liste"></ul>');
  ul.append(...MINISPILL.spill.map((id) => {
    const klart = t.minispill[id] ?? 0;
    const li = lag(`<li><button type="button" class="mini-kort"><span class="mini-bilde">${flis(MINIIKONER[id])}</span><b></b><span class="mini-tekst"></span><span class="mini-prikker" aria-label="${klart} av ${MINISPILL.nivaer} nivåer klart">${Array.from({ length: MINISPILL.nivaer }, (_, i) => `<i class="${i < klart ? "pa" : ""}"></i>`).join("")}</span></button></li>`);
    li.querySelector("b").textContent = SPILL[id].navn;
    li.querySelector(".mini-tekst").textContent = SPILL[id].tekst;
    li.firstChild.addEventListener("click", () => { lyd("klikk"); visNivaer(id); });
    return li;
  }));
  el.rot.replaceChildren(ul);
}

function visNivaer(id) {
  avslutt();
  naa = id;
  settTekst(el.tittel, SPILL[id].navn);
  vis(el.tilbake, true);
  const t = api.hent(), apent = apentNiva(t, id);
  const boks = lag(`<div class="mini-nivaer"><span class="mini-stor">${flis(MINIIKONER[id])}</span><p></p><ol></ol></div>`);
  boks.querySelector("p").textContent = SPILL[id].tekst + (id === "limonadeboden" && (t.bodNiva ?? 0) > 0 ? ` Bodene gir nå ${ganger(bodFaktor(t))}.` : "");
  boks.querySelector("ol").append(...Array.from({ length: MINISPILL.nivaer }, (_, i) => {
    const niva = i + 1, klart = niva <= (t.minispill[id] ?? 0), last = niva > apent;
    const li = lag(`<li><button type="button" class="mini-niva ${klart ? "klart" : ""}" ${last ? "disabled" : ""}><b>${last ? "🔒" : `Nivå ${niva}`}</b><span class="pris"></span></button></li>`);
    li.querySelector(".pris").textContent = `+${ore(minispillPremie(t, id, niva))}`;
    li.firstChild.addEventListener("click", () => spillNiva(id, niva));
    return li;
  }));
  if (id === "limonadeboden") boks.append(nye.bodButikk(api));
  el.rot.replaceChildren(boks);
}

function spillNiva(id, niva) {
  avslutt();
  lyd("apne");
  settTekst(el.tittel, `${SPILL[id].navn}, nivå ${niva}`);
  const rot = lag(`<div class="mini-spill mini-${id}"></div>`);
  el.rot.replaceChildren(rot);
  let over = false;
  stopp = SPILL[id].start(rot, niva, {
    api, lyd,
    /** Spillet er slutt. klart betyr at nivået ble klart, og tekst sier hvordan det gikk. */
    ferdig(klart, tekst) {
      if (over) return;
      over = true;
      const for_ = api.hent();
      if (klart) api.sett(klarteNiva(for_, id, niva));
      const premie = api.hent().totalt - for_.totalt;
      lyd(klart ? "nivaKlart" : "nivaTapt");
      const neste = klart && niva < MINISPILL.nivaer;
      const slutt = lag('<div class="mini-slutt" role="status"><strong></strong><p></p><p class="mini-valg"><button type="button" class="oppgrader"><span class="oppgrader-navn"></span></button> <button type="button" class="lenkeknapp">Alle nivåene</button></p></div>');
      slutt.querySelector("strong").textContent = klart ? `Klart! +${ore(premie)}` : "Ikke denne gangen";
      slutt.querySelector("p").textContent = tekst;
      const [igjen, meny] = slutt.querySelectorAll("button");
      igjen.querySelector("span").textContent = neste ? `Nivå ${niva + 1}` : "Spill igjen";
      igjen.addEventListener("click", () => spillNiva(id, neste ? niva + 1 : niva));
      meny.addEventListener("click", () => visNivaer(id));
      rot.append(slutt);
      igjen.focus({ preventScroll: true });
      if (klart) { si(`${SPILL[id].navn}, nivå ${niva}: du fikk ${ore(premie)}.`); hopp(slutt.querySelector("strong")); }
    },
  });
}

export function start(a) {
  api = a;
  el.knapp.insertAdjacentHTML("afterbegin", flis(MENYIKONER.spill));
  el.knapp.addEventListener("click", () => { visMeny(); apne(el.vindu); });
  el.tilbake.addEventListener("click", () => { lyd("klikk"); if (stopp) visNivaer(naa); else visMeny(); });
  // Escape går ett steg tilbake midt i et spill, og lukker ellers.
  el.vindu.addEventListener("cancel", (e) => { if (stopp) { e.preventDefault(); visNivaer(naa); } });
  el.vindu.addEventListener("close", avslutt);
}
