// Den lille kalkulatoren øverst på forsiden: månedlig sparing og antall år.

import { GRENSER, beregnSparing, lagForhandsvalg } from "/lib/sparing.js";
import { formaterKr, formaterTall, omtrentKr, parseTall } from "/lib/format.js";
import { andeler } from "/lib/tekster.js";
import { tilpassBredde } from "./felt.js";
import { skrivTilstand } from "/lib/tilstand.js";

const satser = JSON.parse(document.getElementById("satser").textContent);
const aksje = lagForhandsvalg(satser).aksjefond;
const infl = satser.inflasjonsmaal.verdi;

const mndFelt = document.getElementById("h-mnd");
const arFelt = document.getElementById("h-ar");
const feil = document.getElementById("h-feil");
const lenke = document.getElementById("h-lenke");
const verdiUt = document.querySelector('#helt [data-ut="verdi"]');
const idagUt = document.querySelector('#helt [data-ut="idag"]');
const innskuddUt = document.querySelector('#helt [data-ut="innskudd"]');
const avkastningUt = document.querySelector('#helt [data-ut="avkastning"]');
const andelInnskudd = document.querySelector('#helt [data-andel="innskudd"]');
const andelAvkastning = document.querySelector('#helt [data-andel="avkastning"]');

function les() {
  const mnd = parseTall(mndFelt.value, { heltall: true });
  const ar = parseTall(arFelt.value, { heltall: true });
  if (!(mnd >= GRENSER.mnd.min && mnd <= GRENSER.mnd.max)) return { felt: mndFelt, feil: `Den månedlige sparingen må være mellom 0 og ${formaterTall(GRENSER.mnd.max)} kr.` };
  if (!(Number.isInteger(ar) && ar >= GRENSER.ar.min && ar <= GRENSER.ar.max)) return { felt: arFelt, feil: `Antall år må være et helt tall mellom ${GRENSER.ar.min} og ${GRENSER.ar.max}.` };
  return { mnd: Math.round(mnd), ar };
}

function oppdater() {
  const v = les();
  feil.hidden = !v.feil;
  feil.textContent = v.feil ?? "";
  for (const f of [mndFelt, arFelt]) f.setAttribute("aria-invalid", v.felt === f ? "true" : "false");
  if (v.feil) return;
  const p = { start: 0, mnd: v.mnd, ar: v.ar, avk: aksje.avk, kost: aksje.kost, infl, sving: aksje.sving, skatt: "ingen", skattesats: 0 };
  const r = beregnSparing(p);
  verdiUt.textContent = omtrentKr(r.verdi);
  idagUt.textContent = `Det er omtrent ${omtrentKr(r.verdiIDag)} i dagens kroner.`;
  innskuddUt.textContent = formaterKr(r.innskudd);
  avkastningUt.textContent = omtrentKr(Math.max(0, r.avkastning));
  const a = andeler(r);
  andelInnskudd.style.flexGrow = a.innskudd;
  andelAvkastning.style.flexGrow = a.avkastning;
  lenke.href = "/kalkulatorer/renters-rente/" + skrivTilstand({ start: 0, mnd: v.mnd, ar: v.ar, avk: aksje.avk, kost: aksje.kost, infl, sving: aksje.sving, skatt: aksje.skatt, type: "aksjefond" });
}

const tilpass = () => {
  tilpassBredde(mndFelt, 4);
  tilpassBredde(arFelt, 2);
};
tilpass();

for (const f of [mndFelt, arFelt]) {
  f.addEventListener("input", () => {
    tilpass();
    oppdater();
  });
  f.addEventListener("blur", () => {
    const v = les();
    if (!v.feil) {
      mndFelt.value = formaterTall(v.mnd);
      arFelt.value = String(v.ar);
    }
    tilpass();
  });
  f.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      f.blur();
    }
  });
}
document.getElementById("helt").addEventListener("submit", (e) => e.preventDefault());
