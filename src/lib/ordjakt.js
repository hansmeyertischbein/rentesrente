// Regnelogikken i Ordjakt: finn ordet spilleren skrev, og gi poeng etter hvor lite brukt det er.
// Poeng = 100 × (1 − ordets visninger / alle ordene i kategorien). Et sjeldent ord gir nesten 100.

export const SVAR_PER_RUNDE = 10;

export function normaliser(tekst) {
  return String(tekst ?? "")
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
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

// Gir indeksen til ordet i listen, eller -1. Listen er [[ord, antall], ...].
export function finnOrd(ordliste, svar) {
  const s = normaliser(svar);
  if (!s) return -1;
  const sk = kompakt(s);
  const kandidater = ordliste.map(([o]) => kompakt(normaliser(o)));
  let i = kandidater.indexOf(sk);
  if (i >= 0) return i;
  const svarStammer = stammer(sk);
  i = kandidater.findIndex((k) => [...stammer(k)].some((x) => svarStammer.has(x)));
  if (i >= 0) return i;
  // Skrivefeil: én feil fra seks bokstaver, to fra ti, så korte ord ikke glir over i andre ord.
  const tillatt = sk.length >= 10 ? 2 : sk.length >= 6 ? 1 : 0;
  if (!tillatt) return -1;
  let best = -1, bestAvstand = tillatt + 1;
  kandidater.forEach((k, j) => {
    const d = avstand(sk, k);
    if (d < bestAvstand) { best = j; bestAvstand = d; }
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
  const i = finnOrd(ordliste, svar);
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

const BOKSTAVER = "ABCDEFGHJKLMNPRSTUVWXYZ";
export function nyKode(r = Math.random) {
  return Array.from({ length: 4 }, () => BOKSTAVER[Math.floor(r() * BOKSTAVER.length)]).join("");
}

export const gyldigKode = (k) => /^[A-Z]{4}$/.test(String(k));
