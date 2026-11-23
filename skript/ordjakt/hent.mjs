// Henter hvor mye hvert ord i Ordjakt ble lest om siste tolv måneder, målt i sidevisninger
// på norsk Wikipedia (Wikimedia Pageviews API), og skriver src/assets/js/ordjakt-data.js.
// Kjør: node skript/ordjakt/hent.mjs   (tar noen minutter, mellomlagrer i skript/ordjakt/.buffer.json)
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const UA = "rentesrente-ordjakt/1.0 (https://rentesrente.no)";
const BUFFER = new URL("./.buffer.json", import.meta.url);
const UT = new URL("../../src/assets/js/ordjakt-data.js", import.meta.url);

// Siste tolv hele måneder før i dag.
const naa = new Date();
const slutt = new Date(Date.UTC(naa.getUTCFullYear(), naa.getUTCMonth(), 0));
const start = new Date(Date.UTC(slutt.getUTCFullYear() - 1, slutt.getUTCMonth() + 1, 1));
const d = (x) => x.toISOString().slice(0, 10).replaceAll("-", "");
const PERIODE = { fra: start.toISOString().slice(0, 10), til: slutt.toISOString().slice(0, 10) };

const buffer = existsSync(BUFFER) ? JSON.parse(readFileSync(BUFFER, "utf8")) : { titler: {}, visninger: {} };
const lagre = () => writeFileSync(BUFFER, JSON.stringify(buffer));

const fjernet = {}; // ord som er tatt bort for hånd, og som heller ikke skal komme inn fra Wikipedia
function lesKategorier() {
  const alle = new Map();
  for (const l of readFileSync(new URL("./kategorier.txt", import.meta.url), "utf8").split("\n")) {
    if (!l.trim() || l.startsWith("#")) continue;
    const i = l.indexOf(":");
    const navn = l.slice(0, i).trim();
    if (!alle.has(navn)) alle.set(navn, new Map());
    const sett = alle.get(navn);
    for (const del of l.slice(i + 1).split(",")) {
      const [ord, artikkel] = del.split("=").map((s) => s.trim());
      if (!ord) continue;
      const nokkel = ord.toLowerCase();
      if (nokkel.startsWith("-")) { sett.delete(nokkel.slice(1)); (fjernet[navn] ??= new Set()).add(nokkel.slice(1)); continue; }
      if (sett.has(nokkel) && !artikkel) continue;
      sett.set(nokkel, { ord: nokkel, artikler: artikkel ? [artikkel] : kandidater(ord) });
    }
  }
  return [...alle].map(([navn, sett]) => ({ navn, ord: [...sett.values()] }));
}

const storForbokstav = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const hvertOrd = (s) => s.split(" ").map((w) => (/^(og|i|de|den|det|von|van|der|av|på)$/.test(w) ? w : storForbokstav(w))).join(" ");
function kandidater(ord) {
  const a = storForbokstav(ord), b = hvertOrd(ord);
  return a === b ? [a] : [a, b];
}

const vent = (ms) => new Promise((r) => setTimeout(r, ms));
let sist = 0;
async function hent(url) {
  for (let forsok = 0; forsok < 7; forsok++) {
    let svar;
    try { svar = await fetch(url, { headers: { "User-Agent": UA } }); } catch (e) { sist = e.cause?.code || e.message; await vent(3000); continue; }
    sist = svar.status;
    if (svar.status === 404) return null;
    if (svar.ok) return svar.json();
    await vent(2000 * (forsok + 1) ** 2);
  }
  throw new Error("Klarte ikke å hente " + url + " (siste status " + sist + ")");
}

// Slår opp titler i bolker på 50: følger omdirigeringer og merker artikler som er pekersider.
async function slaOppTitler(titler) {
  const mangler = [...new Set(titler)].filter((t) => !(t in buffer.titler));
  for (let i = 0; i < mangler.length; i += 50) {
    const bolk = mangler.slice(i, i + 50);
    const url = "https://no.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&redirects=1&prop=pageprops&ppprop=disambiguation&titles=" + encodeURIComponent(bolk.join("|"));
    const j = await hent(url);
    const norm = new Map((j.query.normalized || []).map((n) => [n.from, n.to]));
    const omdir = new Map((j.query.redirects || []).map((n) => [n.from, n.to]));
    const sider = new Map(j.query.pages.map((p) => [p.title, p]));
    for (const t of bolk) {
      let m = norm.get(t) || t;
      m = omdir.get(m) || m;
      const p = sider.get(m);
      buffer.titler[t] = !p || p.missing ? { finnes: false } : { finnes: true, tittel: p.title, peker: !!(p.pageprops && "disambiguation" in p.pageprops) };
    }
    process.stdout.write(`\rTitler ${Math.min(i + 50, mangler.length)}/${mangler.length}   `);
    lagre();
  }
  console.log();
}

async function hentVisninger(artikler) {
  const mangler = [...new Set(artikler)].filter((a) => !(a in buffer.visninger));
  let ferdig = 0;
  const arbeider = async () => {
    while (mangler.length) {
      const a = mangler.shift();
      const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/no.wikipedia/all-access/user/${encodeURIComponent(a.replaceAll(" ", "_"))}/monthly/${d(start)}00/${d(slutt)}00`;
      const j = await hent(url);
      buffer.visninger[a] = j ? j.items.reduce((s, x) => s + x.views, 0) : 0;
      if (++ferdig % 100 === 0) { process.stdout.write(`\rVisninger ${ferdig}   `); lagre(); }
    }
  };
  await Promise.all(Array.from({ length: 4 }, arbeider));
  lagre();
  console.log(`\rVisninger ${ferdig} nye`);
}

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };

const kategorier = lesKategorier();
await slaOppTitler(kategorier.flatMap((k) => k.ord.flatMap((o) => o.artikler)));
const finnTittel = (o) => { for (const a of o.artikler) { const t = buffer.titler[a]; if (t?.finnes) return t; } return null; };

// Utvider listene med artikler fra kategorier på Wikipedia. De lengste artiklene tas først, opptil TAK per liste,
// fordi lange artikler oftere handler om noe folk kjenner.
// Artikler om emnet, biologiske grupper og lover er ikke svar noen ville skrevet.
const IKKE_ORD = /(familien|slekt[ae]n?|idae|inae|optera|oidea|avstemning|forbudet|klassifi|utvinning|varsling|ordning|forening|forbund|landslag|bygging|tidslinje|teori|evne til|syn på|måner$|ringer$|systemet|enheter$|rasen?r?$|loven$|produksjon|i danmark|i norge|i japan|minnedag|oppdagelser|fossile|insektpop|kulturen$|ivil)/;
const TAK = 110;
async function medlemmer(kat, dybde) {
  const ut = [], under = [];
  let mer = "";
  do {
    const j = await hent("https://no.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&generator=categorymembers&gcmtype=page|subcat&gcmlimit=500&prop=info&gcmtitle=" + encodeURIComponent("Kategori:" + kat) + mer);
    for (const p of j.query?.pages ?? []) {
      if (p.ns === 0) ut.push({ tittel: p.title, lengde: p.length });
      else if (p.ns === 14) under.push(p.title.replace(/^Kategori:/, ""));
    }
    mer = j.continue ? "&gcmcontinue=" + encodeURIComponent(j.continue.gcmcontinue) : "";
  } while (mer);
  if (dybde > 0) for (const u of under) ut.push(...(await medlemmer(u, dybde - 1)));
  return ut;
}
buffer.kategorier ??= {};
for (const l of readFileSync(new URL("./wiki-kategorier.txt", import.meta.url), "utf8").split("\n")) {
  if (!l.trim() || l.startsWith("#")) continue;
  const i = l.indexOf(":");
  const k = kategorier.find((x) => x.navn === l.slice(0, i).trim());
  if (!k) throw new Error("Ukjent kategori: " + l.slice(0, i));
  const funn = new Map();
  for (const del of l.slice(i + 1).split(",").map((x) => x.trim())) {
    const [navn, dybde] = del.split(">");
    buffer.kategorier[del] ??= await medlemmer(navn, Number(dybde) || 0);
    for (const m of buffer.kategorier[del]) funn.set(m.tittel, m.lengde);
  }
  const harOrd = new Set(k.ord.map((o) => o.ord));
  const harArtikkel = new Set(k.ord.map((o) => finnTittel(o)?.tittel).filter(Boolean));
  let antall = 0;
  for (const [tittel] of [...funn].sort((a, b) => b[1] - a[1])) {
    if (antall >= TAK) break;
    const ord = tittel.replace(/ \([^)]*\)$/, "").replaceAll("«", "").replaceAll("»", "").toLowerCase();
    if (harOrd.has(ord) || harArtikkel.has(tittel)) continue;
    if (ord.length < 2 || ord.length > 34 || /^(liste|oversikt|norges|verdens|historien? )/.test(ord) || /[,:/]|\d{3}| i (norge|usa|europa)$/.test(ord)) continue;
    if (IKKE_ORD.test(ord) || fjernet[k.navn]?.has(ord)) continue;
    harOrd.add(ord);
    k.ord.push({ ord, artikler: [tittel] });
    buffer.titler[tittel] ??= { finnes: true, tittel, peker: false };
    antall++;
  }
}
lagre();
await hentVisninger(kategorier.flatMap((k) => k.ord.map(finnTittel).filter((t) => t && !t.peker).map((t) => t.tittel)));

// Ord uten egen artikkel får kategoriens laveste tall (de er sjeldne), pekersider får medianen (vi vet ikke hvilken betydning folk leste).
let utenTall = 0;
const resultat = kategorier.map((k) => {
  const rader = k.ord.map((o) => {
    const t = finnTittel(o);
    if (!t) return { ord: o.ord, n: null, merk: "mangler" };
    if (t.peker) return { ord: o.ord, n: null, merk: "peker" };
    return { ord: o.ord, n: buffer.visninger[t.tittel], artikkel: t.tittel };
  });
  const kjente = rader.filter((r) => r.n > 0).map((r) => r.n);
  const lav = kjente.length ? Math.min(...kjente) : 1, mid = median(kjente) || 1;
  for (const r of rader) {
    if (r.n === null || r.n === 0) { utenTall++; r.n = r.merk === "peker" ? mid : lav; r.anslatt = true; }
  }
  // Ord som deler artikkel, er andre navn på det samme og teller én gang. Det gjelder også tall og poeng.
  const samlet = [], perArtikkel = new Map();
  for (const r of rader) {
    const forste = r.artikkel && perArtikkel.get(r.artikkel);
    if (forste) { forste.andre.push(r.ord); continue; }
    r.andre = [];
    if (r.artikkel) perArtikkel.set(r.artikkel, r);
    samlet.push(r);
  }
  return { navn: k.navn, ord: samlet.map((r) => (r.andre.length ? [r.ord, r.n, r.anslatt ? 1 : 0, r.andre] : r.anslatt ? [r.ord, r.n, 1] : [r.ord, r.n])) };
});

const data = { kilde: "Sidevisninger på norsk Wikipedia (Wikimedia Pageviews API, bare mennesker)", periode: PERIODE, hentet: new Date().toISOString().slice(0, 10), kategorier: resultat };
writeFileSync(UT, "// Laget av skript/ordjakt/hent.mjs. Ikke rediger for hånd.\n// Hvert ord: [ord, sidevisninger siste tolv måneder, 1 hvis tallet er anslått]\nexport default " + JSON.stringify(data) + ";\n");
const ordTotalt = resultat.reduce((s, k) => s + k.ord.length, 0);
console.log(`${resultat.length} kategorier, ${ordTotalt} ord, ${utenTall} med anslått tall. Periode ${PERIODE.fra} til ${PERIODE.til}.`);
