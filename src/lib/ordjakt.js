// Regnelogikken i Ordjakt: finn ordet spilleren skrev, og gi poeng etter hvor lite brukt det er.
// Poeng = 100 × (1 − ordets visninger / alle ordene i kategorien). Et sjeldent ord gir nesten 100.

export const SVAR_PER_RUNDE = 10;
export const SEKUNDER_PER_RUNDE = 60;
export const ANTALL_SIMULERTE = 2000;

export function normaliser(tekst) {
  return String(tekst ?? "")
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^æøå\s]/g, (c) => c.normalize("NFD").replace(/\p{M}/gu, "")) // «bogota» for «bogotá», men å forblir å
    .replace(/[^\p{L}\p{N}\s+#-]/gu, "") // + og # skiller C++ og C# fra C
    .replace(/[\s-]+/g, " ")
    .trim();
}

const kompakt = (s) => s.replace(/ /g, "");

export function avstand(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  // Ombytting av to naboer («sjirraf» for «sjiraff») teller som én feil.
  let toFør = null, forrige = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const rad = [i];
    for (let j = 1; j <= n; j++) {
      rad[j] = Math.min(forrige[j] + 1, rad[j - 1] + 1, forrige[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (toFør && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) rad[j] = Math.min(rad[j], toFør[j - 2] + 1);
    }
    toFør = forrige;
    forrige = rad;
  }
  return forrige[n];
}

// Vanlige bøyningsendelser på norsk, så «løver» og «løvene» godtas som «løve».
const ENDELSER = ["ene", "er", "en", "et", "a", "r", "e"];
function stammer(s) {
  const ut = new Set([s]);
  for (const e of ENDELSER) if (s.length > e.length + 2 && s.endsWith(e)) ut.add(s.slice(0, -e.length));
  return ut;
}

// Slutten av navn på flere ord: «vincent van gogh» kan skrives «van gogh» eller «gogh».
// Deler bare på mellomrom, så «spider-man» ikke blir «man». Keisere og konger kan skrives uten tillegg.
function kortformer(ord) {
  const deler = ord.split(" ").filter(Boolean);
  if (deler.length < 2) return [];
  const ut = deler.map((_, i) => deler.slice(i).join(" ")).slice(1);
  const utenTillegg = ord.replace(/ (i{1,3}|iv|vi{0,3}|den .+)$/i, "");
  if (utenTillegg !== ord) ut.push(utenTillegg);
  return ut.map((x) => kompakt(normaliser(x))).filter((x) => x.length >= 3);
}

// Gir indeksen til ordet i listen, eller -1. Listen er [[ord, antall], ...].
// Passer en kortform på flere («bush»), velges den mest leste som ikke er brukt.
export function finnOrd(ordliste, svar, brukt = new Set()) {
  const s = normaliser(svar);
  if (!s) return -1;
  const sk = kompakt(s);
  const kandidater = ordliste.map(([o]) => kompakt(normaliser(o)));
  let i = kandidater.indexOf(sk);
  if (i >= 0) return i;
  const svarStammer = stammer(sk);
  i = kandidater.findIndex((k) => [...stammer(k)].some((x) => svarStammer.has(x)));
  if (i >= 0) return i;
  const korte = ordliste.map(([o]) => kortformer(o));
  const treff = korte.map((k, j) => (k.includes(sk) ? j : -1)).filter((j) => j >= 0);
  if (treff.length) return treff.sort((a, b) => brukt.has(a) - brukt.has(b) || ordliste[b][1] - ordliste[a][1])[0];
  // Skrivefeil: én fra fire bokstaver, to fra sju, tre fra elleve. I korte ord må første bokstav
  // stemme, så «løver» ikke blir «kløver». Måles mot det korteste av de to ordene.
  const tillatt = (k) => {
    const n = Math.min(sk.length, k.length);
    if (n < 4 || (n < 7 && sk[0] !== k[0])) return 0;
    return n >= 11 ? 3 : n >= 7 ? 2 : 1;
  };
  let best = -1, bestAvstand = Infinity;
  kandidater.forEach((k, j) => {
    for (const form of [k, ...korte[j]]) {
      const d = avstand(sk, form);
      if (d <= tillatt(form) && (d < bestAvstand || (d === bestAvstand && brukt.has(best) && !brukt.has(j)))) { best = j; bestAvstand = d; }
    }
  });
  return best;
}

export const totalt = (ordliste) => ordliste.reduce((s, [, n]) => s + n, 0);

export function poengFor(antall, sum) {
  if (!(sum > 0) || !(antall >= 0)) return 0;
  return Math.max(0, Math.round(1000 * (1 - antall / sum)) / 10);
}

// Vurderer ett svar. brukt er et Set med indekser som allerede er svart i runden.
export function vurder(ordliste, svar, brukt = new Set()) {
  const i = finnOrd(ordliste, svar, brukt);
  if (i < 0) return { status: "ukjent", poeng: 0 };
  if (brukt.has(i)) return { status: "brukt", poeng: 0, indeks: i, ord: ordliste[i][0] };
  const [ord, antall] = ordliste[i];
  return { status: "treff", poeng: poengFor(antall, totalt(ordliste)), indeks: i, ord, antall, andel: antall / totalt(ordliste) };
}

// Samme romkode gir samme rekkefølge av kategorier på begge maskinene.
export function frø(kode) {
  let h = 2166136261;
  for (const c of String(kode).toUpperCase()) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function tilfeldig(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rekkefolge(antall, kode) {
  const r = tilfeldig(frø(kode));
  const ut = Array.from({ length: antall }, (_, i) => i);
  for (let i = ut.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [ut[i], ut[j]] = [ut[j], ut[i]];
  }
  return ut;
}

// Boost: treff rett etter hverandre. Hvert treff innen seks sekunder etter forrige gir 10 % mer,
// opptil 50 %. En bom eller en lengre pause nullstiller.
export const BOOST_SEKUNDER = 6;
export const BOOST_TAK = 5;
export const boostFaktor = (rekke) => 1 + Math.min(BOOST_TAK, Math.max(0, rekke)) / 10;
export function nesteRekke(rekke, sekunderSiden) {
  return sekunderSiden <= BOOST_SEKUNDER ? Math.min(BOOST_TAK, rekke + 1) : 0;
}
export const medBoost = (poeng, rekke) => Math.round(poeng * boostFaktor(rekke) * 10) / 10;

// Rangeringen måles mot simulerte spillere, ikke ekte: spillet lagrer ingen resultater.
// Forutsetninger: en spiller rekker 1 til 10 svar på ett minutt (i snitt rundt seks), treffer lista
// på 55 til 95 % av dem, velger oftest kjente ord og får boost etter samme regler. Alt trekkes med frø, så samme kategori gir samme felt.
export function simulerSpillere(ordliste, frøtekst, antall = ANTALL_SIMULERTE) {
  const r = tilfeldig(frø(frøtekst));
  const sum = totalt(ordliste);
  const poeng = ordliste.map(([, n]) => poengFor(n, sum));
  const resultater = [];
  for (let s = 0; s < antall; s++) {
    const dyktighet = (r() + r()) / 2; // flest midt på
    const svar = Math.max(1, Math.min(SVAR_PER_RUNDE, Math.round(2 + dyktighet * 8 + (r() - 0.5) * 3)));
    const treff = 0.55 + 0.4 * dyktighet;
    const kjent = 1.1 - 0.7 * dyktighet; // dyktige velger sjeldnere ord
    const vekter = ordliste.map(([, n]) => Math.pow(Math.max(1, n), kjent));
    let igjen = vekter.reduce((a, b) => a + b, 0), total = 0, rekke = 0, pause = Infinity;
    for (let k = 0; k < svar; k++) {
      pause += (SEKUNDER_PER_RUNDE / svar) * (0.4 + 1.2 * r()); // tiden fordeles ujevnt på svarene
      if (r() > treff) { rekke = 0; pause = Infinity; continue; }
      rekke = nesteRekke(rekke, pause);
      pause = 0;
      let mål = r() * igjen, i = 0;
      while (i < vekter.length - 1 && (mål -= vekter[i]) > 0) i++;
      total += medBoost(poeng[i], rekke);
      igjen -= vekter[i];
      vekter[i] = 0;
    }
    resultater.push(Math.round(total * 10) / 10);
  }
  return resultater.sort((a, b) => a - b);
}

// Andelen i prosent som fikk like mye eller mer, rundet opp: «blant de 12 % beste». Alltid 1 til 100.
export function toppProsent(resultater, poeng) {
  if (!resultater.length) return 100;
  const likeEllerBedre = resultater.filter((x) => x >= poeng).length;
  return Math.min(100, Math.max(1, Math.ceil((100 * likeEllerBedre) / resultater.length)));
}

const BOKSTAVER = "ABCDEFGHJKLMNPRSTUVWXYZ";
export function nyKode(r = Math.random) {
  return Array.from({ length: 4 }, () => BOKSTAVER[Math.floor(r() * BOKSTAVER.length)]).join("");
}

export const gyldigKode = (k) => /^[A-Z]{4}$/.test(String(k));
