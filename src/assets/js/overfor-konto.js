// Konto i «Overfør»: logg inn med e-post og passord, så lagres spillet hos Supabase og kan spilles på flere enheter.
// Vises bare når src/_data/konto.json har adressen og den offentlige nøkkelen til prosjektet.
import { sjekkEpost, sjekkPassord, foresporsel, lesOkt, lesOktFraLenke, lenkefeil, maFornyes, feilmelding, velgSpill } from "/lib/konto.js";
import { $, settTekst, vis, si, apne } from "./overfor-felles.js";
import { naa } from "./klokke.js";

const OKT = "rr-overfor-konto";
const LAGRE_HVER = 30000;
const el = {
  knapp: $("konto-knapp"), vindu: $("konto-vindu"), valg: $("konto-valg"), velgInn: $("konto-velg-inn"), velgNy: $("konto-velg-ny"),
  skjema: $("konto-skjema"), epost: $("konto-epost"), passord: $("konto-passord"), send: $("konto-send"), sendTekst: $("konto-send-tekst"),
  tilbake: $("konto-tilbake"), venter: $("konto-venter"), venterTekst: $("konto-venter-tekst"), sendIgjen: $("konto-send-igjen"), avbryt: $("konto-avbryt"),
  status: $("konto-status"), innlogget: $("konto-innlogget"), hvem: $("konto-hvem"), ut: $("konto-ut"), slett: $("konto-slett"),
};
const SJEKK_HVER = 12000;          // så ofte vi ser om e-posten er bekreftet
const SJEKK_LENGE = 20 * 60000;    // og så lenge
let steg = "valg";                 // «valg», «inn», «ny», «venter»
let venter = null;                 // { epost, passord, til, tid }: passordet holdes bare i minnet mens vi venter
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

async function fullfor(ny) {
  okt = ny;
  huskOkt();
  stoppVenting();
  el.passord.value = "";
  settTekst(el.status, "");
  tegn();
  await hentSpill();
  si(`Du er logget inn som ${okt.epost}. Spillet lagres på kontoen din.`);
  api.prestasjon?.(["konto"]);
}

async function sendSkjema() {
  const lag = steg === "ny";
  const epost = el.epost.value.trim(), passord = el.passord.value;
  const feil = sjekkEpost(epost) ?? sjekkPassord(passord);
  if (feil) { settTekst(el.status, feil); return; }
  settTekst(el.status, lag ? "Lager kontoen …" : "Logger inn …");
  try {
    const ny = lesOkt(await send(lag ? "lagKonto" : "loggInn", { epost, passord }), naa());
    if (ny) { await fullfor(ny); return; }
    startVenting(epost, passord);
  } catch (e) {
    // Har du laget kontoen, men ikke bekreftet e-posten, venter vi på bekreftelsen her også.
    if (!lag && /Bekreft e-posten/.test(e.message)) { startVenting(epost, passord); return; }
    settTekst(el.status, e.message);
  }
}

// Etter at kontoen er laget, prøver vi å logge inn av og til. Når du har trykket på lenken i e-posten,
// uansett på hvilken enhet, blir du logget inn her av deg selv.
function startVenting(epost, passord) {
  venter = { epost, passord, til: Date.now() + SJEKK_LENGE, tid: setInterval(sjekkBekreftet, SJEKK_HVER) };
  steg = "venter";
  settTekst(el.venterTekst, `Vi har sendt en e-post til ${epost}. Trykk på lenken i den, så logges du inn her av deg selv. Se også i søppelposten.`);
  settTekst(el.status, "");
  tegn();
}

function stoppVenting() {
  if (venter) clearInterval(venter.tid);
  venter = null;
  if (steg === "venter") steg = "valg";
}

async function sjekkBekreftet() {
  if (!venter || okt) return;
  if (Date.now() > venter.til) { const e = venter.epost; stoppVenting(); steg = "inn"; el.epost.value = e; tegn(); settTekst(el.status, "Har du bekreftet e-posten, kan du logge inn nå."); return; }
  try {
    const ny = lesOkt(await send("loggInn", { epost: venter.epost, passord: venter.passord }), naa());
    if (ny) await fullfor(ny);
  } catch { /* ikke bekreftet ennå */ }
}

async function sendIgjen() {
  if (!venter) return;
  try { await send("sendIgjen", { epost: venter.epost }); settTekst(el.status, "En ny e-post er på vei."); }
  catch (e) { settTekst(el.status, e.message); }
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

/** Om kontoer er slått på, og e-posten til den som er logget inn. */
export const paa = () => Boolean(el.knapp && oppsett.url && oppsett.nokkel);
export const epost = () => okt?.epost ?? null;
export function apneKonto() {
  if (!paa()) return;
  if (!okt && steg !== "venter") steg = "valg";
  settTekst(el.status, "");
  tegn();
  apne(el.vindu);
}

function tegn() {
  if (!el.knapp) return;
  settTekst(el.knapp, okt ? "Konto" : "Logg inn");
  vis(el.valg, !okt && steg === "valg");
  vis(el.skjema, !okt && (steg === "inn" || steg === "ny"));
  vis(el.venter, !okt && steg === "venter");
  vis(el.innlogget, Boolean(okt));
  settTekst(el.sendTekst, steg === "ny" ? "Lag konto" : "Logg inn");
  el.passord.autocomplete = steg === "ny" ? "new-password" : "current-password";
  if (okt) settTekst(el.hvem, `Logget inn som ${okt.epost}. Spillet lagres på kontoen hvert halve minutt.`);
}

export function start(a) {
  api = a;
  if (!el.knapp || !oppsett.url || !oppsett.nokkel) return;
  el.knapp.hidden = false;
  el.knapp.addEventListener("click", apneKonto);
  const velg = (s) => { steg = s; settTekst(el.status, ""); tegn(); el.epost.focus(); };
  el.velgInn.addEventListener("click", () => velg("inn"));
  el.velgNy.addEventListener("click", () => velg("ny"));
  el.tilbake.addEventListener("click", () => { steg = "valg"; settTekst(el.status, ""); tegn(); });
  el.skjema.addEventListener("submit", (e) => { e.preventDefault(); sendSkjema(); });
  el.sendIgjen.addEventListener("click", sendIgjen);
  el.avbryt.addEventListener("click", () => { stoppVenting(); tegn(); });
  // Kommer du tilbake fra e-postappen, ser vi etter bekreftelsen med en gang.
  addEventListener("focus", () => sjekkBekreftet());
  document.addEventListener("visibilitychange", () => { if (!document.hidden) sjekkBekreftet(); });
  el.ut.addEventListener("click", loggUt);
  el.slett.addEventListener("click", slettKonto);
  okt = lesLagret();
  // Kom du fra lenken i bekreftelsesposten, er du logget inn. Økten fjernes fra adressefeltet med en gang.
  const fraLenke = lesOktFraLenke(location.hash, naa());
  if (fraLenke) {
    okt = fraLenke;
    huskOkt();
    si(`E-posten er bekreftet, og du er logget inn som ${okt.epost}.`);
  }
  const feil = lenkefeil(location.hash);
  if (feil) { steg = "inn"; settTekst(el.status, feil); queueMicrotask(() => apne(el.vindu)); }
  if (/access_token|error/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
  tegn();
  if (okt) hentSpill();
  setInterval(() => lagre(), LAGRE_HVER);
  addEventListener("pagehide", () => lagre());
  document.addEventListener("visibilitychange", () => { if (document.hidden) lagre(); });
}
