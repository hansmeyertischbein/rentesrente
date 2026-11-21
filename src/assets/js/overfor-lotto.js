// Lotto i «Overfør»: en trekning hvert 5. til 6. minutt etter den felles klokka. Salget er åpent i ett minutt, så trekkes tallene.
import { kjopLodd, loddI, avgjorLodd } from "/lib/klikker.js";
import { LOTTO, PREMIER, runde, apen, prisRekker } from "/lib/klikker-lotto.js";
import { formaterTall } from "/lib/format.js";
import { $, ore, settTekst, settAttr, vis, si, annonser, hopp } from "./overfor-felles.js";
import { naa } from "./klokke.js";
import { spill } from "./lyd.js";

const el = {
  kort: $("lotto"), tekst: $("lotto-tekst"), kjop: $("lotto-kjop"), antall: $("lotto-antall"), knapp: $("lotto-knapp"),
  handling: $("lotto-handling"), pris: $("lotto-pris"), baller: $("lotto-baller"), resultat: $("lotto-resultat"), merke: $("lotto-merke"),
};
const VIS_RESULTAT = 12000;
let api = null;
let sist = null;   // { r, til }: siste resultat og når det skal skjules

const sek = () => naa() / 1000;
const klokkeslett = (s) => { const m = Math.floor(s / 60); return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`; };
const rekkerOrd = (n) => `${formaterTall(n)} ${n === 1 ? "rekke" : "rekker"}`;

function antall() {
  const n = Math.floor(Number(el.antall.value));
  return Number.isFinite(n) ? Math.min(LOTTO.maksRekker, Math.max(1, n)) : 1;
}

function kjop() {
  const t = api.hent();
  const s = sek();
  const r = runde(s);
  if (!apen(r, s)) { spill("feil"); si("Salget er stengt. Neste trekning kommer snart."); return; }
  const n = antall();
  const fro = crypto.getRandomValues(new Uint32Array(1))[0];
  if (!api.sett(kjopLodd(t, r.nr, n, fro))) {
    const pris = prisRekker(n);
    spill("feil");
    si(loddI(t, r.nr) + n > LOTTO.maksRekker ? `Du kan ha inntil ${rekkerOrd(LOTTO.maksRekker)} i hver trekning.` : `Du mangler ${ore(pris - t.saldo)}.`);
    return;
  }
  annonser(`Du kjøpte ${rekkerOrd(n)} for ${ore(prisRekker(n))}.`);
  spill("lottoKjop");
  const har = loddI(api.hent(), r.nr);
  api.prestasjon(["lotto-1", ...(har >= 1000 ? ["lotto-1000"] : []), ...(har >= LOTTO.maksRekker ? ["lotto-10000"] : [])]);
  hopp(el.knapp);
}

function avgjor() {
  const r = avgjorLodd(api.hent(), sek());
  if (!r.resultater.length) return;
  api.sett(r.tilstand);
  const siste = r.resultater.at(-1);
  sist = { r: siste, til: performance.now() + VIS_RESULTAT };
  tegnBaller(siste);
  const tekst = resultatTekst(siste);
  settTekst(el.resultat, tekst);
  annonser(tekst);
  if (siste.premier > 0) hopp(el.kort);
  // Kulene spretter ut én etter én, så kommer premien.
  for (let i = 0; i <= LOTTO.trekk; i++) setTimeout(() => spill("lottoKule", i), 90 * i);
  const t = siste.treff;
  setTimeout(() => spill(siste.premier > 0 ? "lottoGevinst" : "lottoTom", t["7"] > 0 || t["6+1"] > 0), 90 * (LOTTO.trekk + 1) + 150);
  const hendelser = [];
  if (siste.premier > 0) hendelser.push("lotto-premie");
  if (t["6"] > 0 || t["6+1"] > 0) hendelser.push("lotto-6");
  if (t["7"] > 0) hendelser.push("lotto-7");
  api.prestasjon(hendelser);
}

function resultatTekst(r) {
  const vinn = PREMIER.filter((p) => r.treff[p.id] > 0).map((p) => `${r.treff[p.id]} med ${p.navn}`);
  const tilbake = r.gevinst - r.premier;
  const ekstra = tilbake > 0 ? ` Du fikk ${ore(tilbake)} tilbake for rekkene uten premie.` : "";
  if (r.premier > 0) return `Du vant ${ore(r.premier)} på ${rekkerOrd(r.antall)}: ${vinn.join(", ")}.${ekstra}`;
  return `Ingen premie på ${rekkerOrd(r.antall)}. Beste rekke hadde ${r.besteRette} rette.${ekstra}`;
}

function tegnBaller(r) {
  const mine = new Set(r.beste ?? []);
  el.baller.replaceChildren(...[...r.trekning.tall, r.trekning.tillegg].map((x, i) => {
    const li = document.createElement("li");
    li.textContent = x;
    if (i === LOTTO.trekk) li.className = "tillegg";
    if (mine.has(x)) li.classList.add("treff");
    li.style.setProperty("--n", i);
    return li;
  }));
  settAttr(el.baller, "aria-label", `Vinnertallene: ${r.trekning.tall.join(", ")}, tilleggstall ${r.trekning.tillegg}.`);
}

export function tegn() {
  if (!api) return;
  const t = api.hent();
  const s = sek();
  const r = runde(s);
  const salg = apen(r, s);
  const viserResultat = sist && performance.now() < sist.til;
  vis(el.kort, salg || viserResultat);
  vis(el.kjop, salg);
  vis(el.baller, !salg && viserResultat);
  vis(el.resultat, !salg && viserResultat);
  settTekst(el.merke, salg ? `Lotto: ${Math.ceil(r.trekkes - s)} sek igjen` : `Lotto om ${klokkeslett(r.neste - s)}`);
  el.merke.classList.toggle("apen", salg);
  if (salg) {
    const har = loddI(t, r.nr);
    settTekst(el.tekst, `Trekning om ${Math.ceil(r.trekkes - s)} sek. 7 av 34 tall, ${ore(LOTTO.pris)} per rekke.` + (har ? ` Du har ${rekkerOrd(har)}.` : ""));
    const n = antall();
    const pris = prisRekker(n);
    settTekst(el.handling, `Kjøp ${rekkerOrd(n)}`);
    settTekst(el.pris, ore(pris));
    settAttr(el.knapp, "aria-disabled", pris <= t.saldo && har + n <= LOTTO.maksRekker ? "false" : "true");
    el.kort.style.setProperty("--igjen", Math.max(0, (r.trekkes - s) / LOTTO.salg).toFixed(3));
  } else if (viserResultat) {
    settTekst(el.tekst, "Vinnertallene");
    el.kort.style.setProperty("--igjen", "0");
  }
}

export function start(a) {
  api = a;
  el.knapp.addEventListener("click", kjop);
  for (const b of el.kort.querySelectorAll("[data-n]")) b.addEventListener("click", () => { el.antall.value = b.dataset.n; tegn(); });
  el.antall.addEventListener("input", tegn);
  el.antall.addEventListener("change", () => { el.antall.value = antall(); tegn(); });
  setInterval(avgjor, 1000);
  avgjor();
}
