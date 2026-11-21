// Konto i «Overfør»: logg inn med e-post og passord, så lagres spillet hos Supabase og kan spilles på flere enheter.
// Vises bare når src/_data/konto.json har adressen og den offentlige nøkkelen til prosjektet.
import { sjekkEpost, sjekkPassord, foresporsel, lesOkt, maFornyes, feilmelding, velgSpill } from "/lib/konto.js";
import { $, settTekst, vis, si, apne } from "./overfor-felles.js";
import { naa } from "./klokke.js";

const OKT = "rr-overfor-konto";
const LAGRE_HVER = 30000;
const el = {
  knapp: $("konto-knapp"), vindu: $("konto-vindu"), skjema: $("konto-skjema"), epost: $("konto-epost"), passord: $("konto-passord"),
  inn: $("konto-inn"), ny: $("konto-ny"), status: $("konto-status"), innlogget: $("konto-innlogget"), hvem: $("konto-hvem"),
  ut: $("konto-ut"), slett: $("konto-slett"),
};
const oppsett = { url: el.vindu?.dataset.url ?? "", nokkel: el.vindu?.dataset.nokkel ?? "" };
let api = null, okt = null, sistLagret = "", opptatt = false;

const lesLagret = () => { try { return JSON.parse(localStorage.getItem(OKT)); } catch { return null; } };
const huskOkt = () => { try { okt ? localStorage.setItem(OKT, JSON.stringify(okt)) : localStorage.removeItem(OKT); } catch { /* valgfritt */ } };

async function send(type, verdier = {}) {
  const { url, init } = foresporsel(oppsett, type, { okt, ...verdier });
  let svar;
  try { svar = await fetch(url, init); } catch { throw new Error(feilmelding(0, null)); }
  const tekst = await svar.text();
  const data = tekst ? JSON.parse(tekst) : null;
  if (!svar.ok) throw Object.assign(new Error(feilmelding(svar.status, data)), { status: svar.status });
  return data;
}

async function gyldigOkt() {
  if (!okt) return null;
  if (!maFornyes(okt, naa())) return okt;
  try {
    okt = lesOkt(await send("forny"), naa());
  } catch (e) {
    if (e.status === 400 || e.status === 401) okt = null;   // utløpt eller logget ut et annet sted
    else return null;
  }
  huskOkt();
  tegn();
  return okt;
}

/** Lagrer spillet på kontoen når noe er endret. */
export async function lagre(tvungen = false) {
  if (!okt || opptatt) return;
  const data = api.lagring();
  const nokkel = JSON.stringify({ ...data, tid: 0 });
  if (!tvungen && nokkel === sistLagret) return;
  if (!(await gyldigOkt())) return;
  try { await send("lagre", { data }); sistLagret = nokkel; } catch { /* prøver igjen neste gang */ }
}

// Etter innlogging: bruk spillet som har kommet lengst, enten det på enheten eller det på kontoen.
async function hentSpill() {
  if (!(await gyldigOkt())) return;
  opptatt = true;
  try {
    const rader = await send("hent");
    const sky = rader?.[0]?.data ?? null;
    const lokal = api.lagring();
    const harLokalt = lokal.totalt > 0 || lokal.trykk > 0;
    if (sky && velgSpill(harLokalt ? lokal : null, sky) === "sky") {
      if (api.lastInn(sky, "Spillet fra kontoen din er hentet.")) sistLagret = JSON.stringify({ ...sky, tid: 0 });
    }
  } catch { /* spillet på enheten brukes */ }
  opptatt = false;
  await lagre(true);
}

async function loggInn(lag) {
  const epost = el.epost.value, passord = el.passord.value;
  const feil = sjekkEpost(epost) ?? sjekkPassord(passord);
  if (feil) { settTekst(el.status, feil); return; }
  settTekst(el.status, lag ? "Lager kontoen …" : "Logger inn …");
  try {
    const svar = await send(lag ? "lagKonto" : "loggInn", { epost, passord });
    const ny = lesOkt(svar, naa());
    if (!ny) { settTekst(el.status, "Kontoen er laget. Sjekk e-posten din og trykk på lenken, og logg så inn her."); return; }
    okt = ny;
    huskOkt();
    el.passord.value = "";
    settTekst(el.status, "");
    tegn();
    await hentSpill();
    si(`Du er logget inn som ${okt.epost}. Spillet lagres på kontoen din.`);
  } catch (e) {
    settTekst(el.status, e.message);
  }
}

async function loggUt() {
  await lagre(true);
  const gammel = okt;
  okt = null;
  huskOkt();
  tegn();
  if (gammel) {
    const { url, init } = foresporsel(oppsett, "loggUt", { okt: gammel });
    fetch(url, init).catch(() => {});
  }
  settTekst(el.status, "Du er logget ut. Spillet ligger trygt på kontoen.");
}

async function slettKonto() {
  if (!el.slett.dataset.klar) {
    el.slett.dataset.klar = "1";
    settTekst(el.slett, "Trykk en gang til for å slette kontoen og spillet på den");
    setTimeout(() => { delete el.slett.dataset.klar; settTekst(el.slett, "Slett kontoen"); }, 5000);
    return;
  }
  if (!(await gyldigOkt())) return;
  try {
    await send("slett");
    okt = null;
    huskOkt();
    tegn();
    settTekst(el.status, "Kontoen og spillet på den er slettet. Spillet på denne enheten er som før.");
  } catch (e) {
    settTekst(el.status, e.message);
  }
}

function tegn() {
  if (!el.knapp) return;
  settTekst(el.knapp, okt ? "Konto" : "Logg inn");
  vis(el.skjema, !okt);
  vis(el.innlogget, Boolean(okt));
  if (okt) settTekst(el.hvem, `Logget inn som ${okt.epost}. Spillet lagres på kontoen hvert halve minutt.`);
}

export function start(a) {
  api = a;
  if (!el.knapp || !oppsett.url || !oppsett.nokkel) return;
  el.knapp.hidden = false;
  el.knapp.addEventListener("click", () => { settTekst(el.status, ""); apne(el.vindu); });
  el.inn.addEventListener("click", () => loggInn(false));
  el.ny.addEventListener("click", () => loggInn(true));
  el.skjema.addEventListener("submit", (e) => { e.preventDefault(); loggInn(false); });
  el.ut.addEventListener("click", loggUt);
  el.slett.addEventListener("click", slettKonto);
  okt = lesLagret();
  tegn();
  if (okt) hentSpill();
  setInterval(() => lagre(), LAGRE_HVER);
  addEventListener("pagehide", () => lagre());
  document.addEventListener("visibilitychange", () => { if (document.hidden) lagre(); });
}
