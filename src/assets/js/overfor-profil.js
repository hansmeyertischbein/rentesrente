// Ikonet ditt, strategien, obligasjonene, gudegrisene, prestisje og flytting av spillet i «Overfør».
import {
  kanVelgeStrategi, velgStrategi, settGiring, giring, oblSynlig, oblInnsats, oblRente, oblRisiko, antallObl, kjopObligasjon,
  kjopIkon, velgIkon, guderSynlig, nesteGud, kjopGud, prestisjeMangler, kanPrestisje, prestisje, prestisjeFaktor, fraLagring, formaterTid,
} from "/lib/klikker.js";
import { GRENER, grein, IKONER, STRATEGIER, STRATEGI, OBLIGASJONER, OBL, PRESTISJE } from "/lib/klikker-guder.js";
import { formaterTall } from "/lib/format.js";
import { AVATARER, STRATEGIMERKER, lagGris } from "./klikker-figurer.js";
import { $, ore, prosent, ganger, settTekst, settAttr, vis, si, annonser, hopp, lag, registrerTips, medTips, apne } from "./overfor-felles.js";

const el = {
  ikonKnapp: $("ikon-knapp"), strategiMerke: $("strategi-merke"),
  ikonVindu: $("ikon-vindu"), ikonListe: $("ikon-liste"), ikonStatus: $("ikon-status"),
  strategiValg: $("strategi-valg"), strategiKnapper: $("strategi-knapper"),
  giring: $("giring"), giringTall: $("giring-tall"), giringSkyv: $("giring-skyv"),
  obl: $("obl"), oblTekst: $("obl-tekst"), oblValg: $("obl-valg"),
  guder: $("guder"), gudFigur: $("gud-figur"), gudNavn: $("gud-navn"), gudInfo: $("gud-info"), gudKnapp: $("gud-knapp"),
  gudHandling: $("gud-handling"), gudPris: $("gud-pris"), gudVindu: $("gud-vindu"), gudGrener: $("gud-grener"),
  gudValgt: $("gud-valgt"), gudVinduKnapp: $("gud-vindu-knapp"), gudVinduHandling: $("gud-vindu-handling"), gudVinduPris: $("gud-vindu-pris"),
  prestisje: $("prestisje"), prestisjeTekst: $("prestisje-tekst"), prestisjeKnapp: $("prestisje-knapp"),
  flyttLag: $("flytt-lag"), flyttKode: $("flytt-kode"), flyttInn: $("flytt-inn"), flyttHent: $("flytt-hent"), flyttStatus: $("flytt-status"),
};
let api = null;
const t = () => api.hent();
const gud = (id) => GRENER.flatMap((g) => g.guder).find((x) => x.id === id);
const grenFor = (id) => GRENER.find((g) => g.guder.some((x) => x.id === id));

/** Hvilken gris som vises: guden du har nådd, prestisjegrisen eller den vanlige. */
export function grisId(x) {
  if (x.gud > 0) return grein(x.gren).guder[x.gud - 1].id;
  return x.prestisje > 0 ? "prestisje" : null;
}

const flis = (f) => `<span class="ikon-flis" style="--tile:${f.tile}">${f.svg}</span>`;

// ---------- Ikonet ditt ----------

let ikonNokkel = "";
function tegnIkon() {
  const x = t();
  const nokkel = x.ikon;
  if (nokkel !== ikonNokkel) {
    ikonNokkel = nokkel;
    el.ikonKnapp.innerHTML = flis(AVATARER[x.ikon] ?? AVATARER.deg);
    settAttr(el.ikonKnapp, "aria-label", `Ikonet ditt: ${IKONER.find((i) => i.id === x.ikon)?.navn}. Trykk for å bytte eller kjøpe nye.`);
  }
  if (el.ikonVindu.open) tegnIkonListe();
}

let listeNokkel = "";
function tegnIkonListe() {
  const x = t();
  const synlige = IKONER.filter((i) => !i.prestisje || x.ikoner.includes(i.id));
  const nokkel = synlige.map((i) => `${i.id}:${x.ikoner.includes(i.id)}:${x.ikon === i.id}`).join("|");
  if (nokkel !== listeNokkel) {
    listeNokkel = nokkel;
    el.ikonListe.replaceChildren(...synlige.map((i) => {
      const har = x.ikoner.includes(i.id);
      const li = lag(`<li><button type="button" class="ikon-valg" data-id="${i.id}"><span class="ikon-valg-bilde">${flis(AVATARER[i.id])}</span><span class="ikon-valg-navn"></span><span class="ikon-valg-pris"></span></button></li>`);
      li.querySelector(".ikon-valg-navn").textContent = i.navn;
      const knapp = li.firstElementChild;
      knapp.classList.toggle("valgt", x.ikon === i.id);
      knapp.addEventListener("click", () => velgEllerKjop(i));
      return li;
    }));
  }
  for (const knapp of el.ikonListe.querySelectorAll(".ikon-valg")) {
    const i = IKONER.find((y) => y.id === knapp.dataset.id);
    const har = x.ikoner.includes(i.id);
    const pris = knapp.querySelector(".ikon-valg-pris");
    settTekst(pris, x.ikon === i.id ? "Valgt" : har ? "Bruk" : ore(i.pris));
    pris.className = `ikon-valg-pris ${har ? "" : "pris"}`;
    settAttr(knapp, "aria-disabled", har || i.pris <= x.saldo ? "false" : "true");
    settAttr(knapp, "aria-label", `${i.navn}. ${x.ikon === i.id ? "Valgt." : har ? "Trykk for å bruke." : `Koster ${ore(i.pris)}.`}`);
  }
}

function velgEllerKjop(i) {
  const x = t();
  if (x.ikoner.includes(i.id)) { api.sett(velgIkon(x, i.id)); settTekst(el.ikonStatus, `Du er nå ${i.navn.toLowerCase()}.`); return; }
  if (!api.sett(kjopIkon(x, i.id))) { settTekst(el.ikonStatus, `Du mangler ${ore(i.pris - x.saldo)} for ${i.navn.toLowerCase()}.`); return; }
  settTekst(el.ikonStatus, `Du kjøpte ${i.navn.toLowerCase()}.`);
  hopp(el.ikonKnapp);
}

// ---------- Strategi og giring ----------

// Skyveren går fra 0,1 til 10 ganger, raskere jo lenger til høyre: posisjonen 0 til 1000 er en eksponent.
const tilGiring = (pos) => STRATEGI.giringMin * Math.pow(STRATEGI.giringMaks / STRATEGI.giringMin, pos / 1000);
const tilPos = (g) => Math.round((1000 * Math.log(g / STRATEGI.giringMin)) / Math.log(STRATEGI.giringMaks / STRATEGI.giringMin));

function tegnStrategi() {
  const x = t();
  vis(el.strategiValg, kanVelgeStrategi(x));
  vis(el.strategiMerke, Boolean(x.strategi));
  if (x.strategi && el.strategiMerke.dataset.id !== x.strategi) {
    el.strategiMerke.dataset.id = x.strategi;
    el.strategiMerke.innerHTML = flis(STRATEGIMERKER[x.strategi]);
    settAttr(el.strategiMerke, "aria-label", `Strategi: ${STRATEGIER.find((s) => s.id === x.strategi).navn}.`);
  }
  vis(el.giring, x.strategi === "glad");
  if (x.strategi === "glad") {
    settTekst(el.giringTall, ganger(giring(x)));
    if (document.activeElement !== el.giringSkyv) el.giringSkyv.value = tilPos(giring(x));
    settAttr(el.giringSkyv, "aria-valuetext", `${formaterTall(giring(x), 1)} ganger`);
  }
}

registrerTips("strategi", () => {
  const s = STRATEGIER.find((y) => y.id === t().strategi);
  return s ? { tittel: s.navn, linjer: [s.tekst, "Strategien står til du tar prestisje."] } : null;
});

// ---------- Obligasjoner ----------

function lagOblValg() {
  el.oblValg.replaceChildren(...OBLIGASJONER.map((o, nr) => {
    const knapp = lag(`<button type="button" class="ekstra-knapp niva-${nr}" data-id="${o.id}"><span class="ekstra-aktiv"></span><span class="ekstra-niva"></span><span class="ekstra-avk"></span><span class="pris"></span></button>`);
    knapp.querySelector(".ekstra-aktiv").textContent = o.navn;
    knapp.querySelector(".ekstra-niva").textContent = o.sikker === 1 ? "Helt sikker" : `${prosent(o.sikker)} sikker`;
    knapp.addEventListener("click", () => {
      const x = t();
      if (antallObl(x) >= OBL.maksSamtidig) { si(`Du kan ha ${OBL.maksSamtidig} obligasjoner om gangen.`); return; }
      if (!api.sett(kjopObligasjon(x, o.id))) { si("Du har ikke råd nå."); return; }
      annonser(`Du kjøpte ${o.navn.toLowerCase()} for ${ore(oblInnsats(x))}. Pengene kommer om ${formaterTid(OBL.lopetid)}.`);
      hopp(knapp);
    });
    return knapp;
  }));
}

function tegnObl() {
  const x = t();
  vis(el.obl, oblSynlig(x));
  if (!oblSynlig(x)) return;
  const innsats = oblInnsats(x);
  const fulle = antallObl(x) >= OBL.maksSamtidig;
  settTekst(el.oblTekst, fulle ? `Du har ${OBL.maksSamtidig} obligasjoner. Vent til en forfaller.`
    : `Lån bort ${ore(innsats)} i ${formaterTid(OBL.lopetid)}. Du har ${antallObl(x)} av ${OBL.maksSamtidig}.` + (giring(x) !== 1 ? ` Giring ${ganger(giring(x))}.` : ""));
  OBLIGASJONER.forEach((o, nr) => {
    const knapp = el.oblValg.children[nr];
    const rente = oblRente(x, o);
    settTekst(knapp.querySelector(".ekstra-avk"), `${formaterTall(Math.round(rente * 1000) / 10, rente * 100 % 1 ? 1 : 0)} % rente`);
    settTekst(knapp.querySelector(".pris"), `Få ${ore(Math.floor(innsats * (1 + rente * giring(x)) + 1e-6))}`);
    settTekst(knapp.querySelector(".ekstra-niva"), oblRisiko(x, o) === 0 ? "Helt sikker" : `${prosent(1 - oblRisiko(x, o))} sikker`);
    settAttr(knapp, "aria-disabled", innsats > 0 && !fulle ? "false" : "true");
  });
}

// ---------- Gudegriser ----------

function virkningTekst(v) {
  const linjer = [];
  if (v.trykk) linjer.push(`Hvert trykk gir ${ganger(v.trykk)}.`);
  if (v.utbytte) linjer.push(`${ganger(v.utbytte)} utbytte fra alle selskapene.`);
  if (v.borteSek) linjer.push(`Aksjene gir utbytte i inntil ${formaterTid(v.borteSek)} mens du er borte.`);
  if (v.risiko) linjer.push("Investeringer går halvt så ofte dårlig.");
  if (v.vent) linjer.push("Investeringer og obligasjoner kommer på halve tiden.");
  if (v.ekstraAvk) linjer.push("Dobbel avkastning på investeringer.");
  if (v.oblRente) linjer.push(`${ganger(v.oblRente)} rente på obligasjoner.`);
  if (v.verdenFall) linjer.push("Verdenshendelser biter halvt så mye.");
  if (v.krakk) linjer.push("Dobbel rabatt under børskrakk.");
  return linjer.join(" ");
}

// Status for en gud: «eid», «neste» (kan kjøpes), «senere» eller «stengt» (en annen grein er valgt).
function gudStatus(x, g) {
  const gren = grenFor(g.id);
  if (x.gren && x.gren !== gren.id) return "stengt";
  if (x.gren === gren.id && g.niva <= x.gud) return "eid";
  return nesteGud(x, gren.id)?.id === g.id ? "neste" : "senere";
}

let valgtGud = null;
function visGud(id) {
  valgtGud = id;
  tegnGudInfo();
}

function tegnGudInfo() {
  const x = t();
  const g = gud(valgtGud) ?? nesteGud(x) ?? GRENER[0].guder[0];
  const gren = grenFor(g.id);
  const status = gudStatus(x, g);
  const tittel = el.gudValgt.querySelector("strong");
  settTekst(tittel, `${g.navn}, ${gren.navn.toLowerCase()} nivå ${g.niva}`);
  const tekst = el.gudValgt.querySelector("p");
  settTekst(tekst, status === "eid" ? `«${g.hint}» ${virkningTekst(g.virkning)}` : `«${g.hint}»`);
  const merk = el.gudValgt.querySelector("small");
  settTekst(merk, status === "eid" ? "Du har denne." : status === "stengt" ? `Du har valgt ${grein(x.gren).navn.toLowerCase()} guder.`
    : status === "senere" ? `Kjøp gudene foran først. Velger du ${gren.navn.toLowerCase()} guder, er de andre greinene stengt til du tar prestisje.`
    : x.gren ? "Neste i greinen din." : `Velger du ${gren.navn.toLowerCase()} guder, er de andre greinene stengt til du tar prestisje.`);
  vis(el.gudVinduKnapp, status === "neste");
  if (status === "neste") {
    settTekst(el.gudVinduHandling, `Kjøp ${g.navn}`);
    settTekst(el.gudVinduPris, ore(g.pris));
    settAttr(el.gudVinduKnapp, "aria-disabled", g.pris <= x.saldo ? "false" : "true");
    el.gudVinduKnapp.dataset.gren = gren.id;
  }
}

function byggGudVindu() {
  el.gudGrener.replaceChildren(...GRENER.map((gren) => {
    const kol = lag(`<li class="gud-gren"><p class="gud-gren-navn"><b></b> <span></span></p><ol class="gud-rekke"></ol></li>`);
    kol.querySelector("b").textContent = gren.navn;
    kol.querySelector("span").textContent = gren.tema;
    kol.querySelector("ol").replaceChildren(...gren.guder.map((g) => {
      const li = lag(`<li><button type="button" class="gud-ikon" data-id="${g.id}"><span class="gud-portrett">${lagGris(g.id, "gud-fig")}</span><span class="gud-ikon-navn"></span></button></li>`);
      li.querySelector(".gud-ikon-navn").textContent = g.navn;
      const knapp = li.firstElementChild;
      knapp.setAttribute("aria-label", `${g.navn}, nivå ${g.niva}. ${g.hint}`);
      knapp.addEventListener("pointerenter", () => visGud(g.id));
      knapp.addEventListener("focus", () => visGud(g.id));
      knapp.addEventListener("click", () => visGud(g.id));
      return li;
    }));
    return kol;
  }));
}

function tegnGudVindu() {
  const x = t();
  for (const knapp of el.gudGrener.querySelectorAll(".gud-ikon")) {
    const status = gudStatus(x, gud(knapp.dataset.id));
    if (knapp.dataset.status !== status) { knapp.dataset.status = status; knapp.classList.toggle("valgt", knapp.dataset.id === valgtGud); }
  }
  tegnGudInfo();
}

function kjopNesteGud(gren) {
  const x = t();
  const g = nesteGud(x, gren);
  if (!g) return;
  if (!api.sett(kjopGud(x, gren))) { si(`Du mangler ${ore(g.pris - x.saldo)} for ${g.navn}.`); return; }
  si(`${g.navn} er grisen din nå. ${virkningTekst(g.virkning)}`);
  valgtGud = nesteGud(t())?.id ?? g.id;
  hopp(el.gudFigur);
}

let gudKortNokkel = "";
function tegnGuder() {
  const x = t();
  vis(el.guder, guderSynlig(x));
  if (!guderSynlig(x)) return;
  const naa = x.gud > 0 ? grein(x.gren).guder[x.gud - 1] : null;
  const neste = nesteGud(x);
  const nokkel = `${naa?.id}`;
  if (nokkel !== gudKortNokkel) {
    gudKortNokkel = nokkel;
    el.gudFigur.innerHTML = lagGris(naa?.id ?? null, "gud-fig");
    settTekst(el.gudNavn, naa ? `${naa.navn}, nivå ${naa.niva} av 5` : "Vanlig gris");
  }
  settTekst(el.gudInfo, naa ? virkningTekst(mineVirkninger(x)) : "Velg en av fire greiner med fem guder hver. Hold over gudene for å lese hva de gjør.");
  vis(el.gudKnapp, !x.gren || Boolean(neste));
  vis(el.gudPris, Boolean(x.gren && neste));
  if (!x.gren) {
    settTekst(el.gudHandling, "Velg gudegris");
    settAttr(el.gudKnapp, "aria-disabled", "false");
  } else if (neste) {
    settTekst(el.gudHandling, `Kjøp ${neste.navn}`);
    settTekst(el.gudPris, ore(neste.pris));
    settAttr(el.gudKnapp, "aria-disabled", neste.pris <= x.saldo ? "false" : "true");
  }
  if (el.gudVindu.open) tegnGudVindu();
}

// Alle virkningene du har, ganget sammen, så teksten viser det du faktisk får.
function mineVirkninger(x) {
  const sum = {};
  for (const g of grein(x.gren).guder.slice(0, x.gud)) {
    for (const [k, v] of Object.entries(g.virkning)) sum[k] = k === "borteSek" ? Math.max(sum[k] ?? 0, v) : (sum[k] ?? 1) * v;
  }
  return sum;
}

// ---------- Prestisje ----------

function tegnPrestisje() {
  const x = t();
  const synlig = x.gud > 0 || x.prestisje > 0;
  vis(el.prestisje, synlig);
  if (!synlig) return;
  const mangler = prestisjeMangler(x);
  const neste = PRESTISJE.faktor * prestisjeFaktor(x);
  settTekst(el.prestisjeTekst, mangler.length
    ? `Når du eier alt som kan kjøpes, kan du starte på nytt med ${ganger(neste)} utbytte, trykk og avkastning, og få et nytt ikon og en ny gris. Du mangler ${mangler.join(", ")}.`
    : `Du eier alt. Start på nytt med ${ganger(neste)} utbytte, trykk og avkastning, både opp og ned, og få fønixen og gullgrisen.`);
  vis(el.prestisjeKnapp, mangler.length === 0);
}

// ---------- Flytt spillet ----------

const tilKode = (obj) => {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};
const fraKode = (kode) => {
  const s = atob(kode.replace(/\s+/g, ""));
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(s, (c) => c.charCodeAt(0))));
};

function flytt() {
  el.flyttLag.addEventListener("click", async () => {
    el.flyttKode.value = tilKode(api.lagring());
    el.flyttKode.hidden = false;
    el.flyttKode.select();
    try { await navigator.clipboard.writeText(el.flyttKode.value); settTekst(el.flyttStatus, "Koden er kopiert. Lim den inn på den andre enheten."); }
    catch { settTekst(el.flyttStatus, "Kopier koden og lim den inn på den andre enheten."); }
  });
  el.flyttHent.addEventListener("click", () => {
    let lest = null;
    try { lest = fraLagring(fraKode(el.flyttInn.value)); } catch { lest = null; }
    if (!lest) { settTekst(el.flyttStatus, "Koden virker ikke. Sjekk at du fikk med hele."); return; }
    if (!el.flyttHent.dataset.klar && (t().totalt > 0)) {
      el.flyttHent.dataset.klar = "1";
      settTekst(el.flyttStatus, "Spillet på denne enheten blir erstattet. Trykk en gang til for å hente.");
      return;
    }
    delete el.flyttHent.dataset.klar;
    api.byttSpill(lest.tilstand, "Spillet er hentet fra den andre enheten.");
    settTekst(el.flyttStatus, "Spillet er hentet.");
    el.flyttInn.value = "";
  });
}

// ---------- I gang ----------

export function tegn() {
  if (!api) return;
  tegnIkon();
  tegnStrategi();
  tegnObl();
  tegnGuder();
  tegnPrestisje();
}

export function start(a) {
  api = a;
  el.ikonKnapp.addEventListener("click", () => { listeNokkel = ""; settTekst(el.ikonStatus, ""); tegnIkonListe(); apne(el.ikonVindu); });
  el.strategiMerke.dataset.tips = "strategi";
  medTips(el.strategiMerke);

  el.strategiKnapper.replaceChildren(...STRATEGIER.map((s) => {
    const knapp = lag(`<button type="button" class="strategi-knapp"><span class="strategi-bilde">${flis(STRATEGIMERKER[s.id])}</span><b></b><span class="strategi-tekst"></span></button>`);
    knapp.querySelector("b").textContent = s.navn;
    knapp.querySelector(".strategi-tekst").textContent = s.tekst;
    knapp.addEventListener("click", () => {
      if (!api.sett(velgStrategi(t(), s.id))) return;
      si(`Du er ${s.navn.toLowerCase()}. ${s.tekst}`);
      hopp(el.strategiMerke);
    });
    return knapp;
  }));
  el.giringSkyv.addEventListener("input", () => api.sett(settGiring(t(), tilGiring(Number(el.giringSkyv.value)))));

  lagOblValg();
  byggGudVindu();
  const apneGuder = () => { valgtGud = nesteGud(t())?.id ?? valgtGud; tegnGudVindu(); apne(el.gudVindu); };
  el.gudKnapp.addEventListener("click", () => (t().gren ? kjopNesteGud(t().gren) : apneGuder()));
  $("gud-se").addEventListener("click", apneGuder);
  el.gudVinduKnapp.addEventListener("click", () => kjopNesteGud(el.gudVinduKnapp.dataset.gren));
  el.prestisjeKnapp.addEventListener("click", () => {
    const x = t();
    if (!kanPrestisje(x)) return;
    if (!el.prestisjeKnapp.dataset.klar) {
      el.prestisjeKnapp.dataset.klar = "1";
      settTekst(el.prestisjeKnapp.querySelector(".oppgrader-navn"), "Trykk en gang til: alt starter på nytt");
      setTimeout(() => { delete el.prestisjeKnapp.dataset.klar; settTekst(el.prestisjeKnapp.querySelector(".oppgrader-navn"), "Ta prestisje"); }, 4000);
      return;
    }
    api.byttSpill(prestisje(x), `Prestisje ${x.prestisje + 1}! Alt gir ${ganger(prestisjeFaktor(prestisje(x)))} fra nå av.`);
  });
  flytt();
}
