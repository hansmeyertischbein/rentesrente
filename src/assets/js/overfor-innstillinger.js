// Innstillinger i «Overfør»: lyd, konto og om spillet. Tannhjulet øverst til venstre.
import { MENYIKONER } from "./klikker-figurer.js";
import { $, apne } from "./overfor-felles.js";
import * as lyd from "./lyd.js";
import * as konto from "./overfor-konto.js";

const el = {
  knapp: $("innstillinger-knapp"), vindu: $("innstillinger-vindu"),
  effekter: $("lyd-effekter"), effektVolum: $("lyd-effekt-volum"), musikk: $("lyd-musikk"), musikkVolum: $("lyd-musikk-volum"),
  konto: $("innst-konto"), kontoTekst: $("innst-konto-tekst"), om: $("innst-om"), intro: $("intro"), loggInn: $("logg-inn-topp"),
};

function vis() {
  const v = lyd.innstillinger();
  el.effekter.checked = v.effekter;
  el.musikk.checked = v.musikk;
  el.effektVolum.value = Math.round(v.effektVolum * 100);
  el.musikkVolum.value = Math.round(v.musikkVolum * 100);
  el.effektVolum.disabled = !v.effekter;
  el.musikkVolum.disabled = !v.musikk;
  if (el.kontoTekst) el.kontoTekst.textContent = konto.epost() ? `Logget inn som ${konto.epost()}. Spillet lagres på kontoen.` : "Lag en konto for å spille på telefonen og andre enheter.";
}

export function tegn() {
  if (el.loggInn) el.loggInn.hidden = !konto.paa() || Boolean(konto.epost());
}

export function start() {
  el.knapp.insertAdjacentHTML("afterbegin", `<span class="ikon-flis" style="--tile:${MENYIKONER.tannhjul.tile}">${MENYIKONER.tannhjul.svg}</span>`);
  el.knapp.addEventListener("click", () => { vis(); apne(el.vindu); });
  el.effekter.addEventListener("change", () => { lyd.endre({ effekter: el.effekter.checked }); vis(); lyd.spill("klikk"); });
  el.musikk.addEventListener("change", () => { lyd.endre({ musikk: el.musikk.checked }); vis(); });
  el.effektVolum.addEventListener("input", () => lyd.endre({ effektVolum: el.effektVolum.value / 100 }));
  el.effektVolum.addEventListener("change", () => lyd.spill("mynt"));
  el.musikkVolum.addEventListener("input", () => lyd.endre({ musikkVolum: el.musikkVolum.value / 100 }));
  el.konto?.addEventListener("click", () => { el.vindu.close(); konto.apneKonto(); });
  el.loggInn?.addEventListener("click", () => konto.apneKonto());
  el.om.addEventListener("click", () => { el.vindu.close(); apne(el.intro); });
  tegn();
}
