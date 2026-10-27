// Norsk tallformatering og tolkning av tall brukeren skriver.
// Rene funksjoner uten avhengigheter: kjører både i nettleseren og i testene.

const NBSP = "\u00a0";
const MINUS = "\u2212";

const heltallFormat = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 });
const desimalFormat = (des) =>
  new Intl.NumberFormat("nb-NO", { minimumFractionDigits: des, maximumFractionDigits: des });

/** Runder til et gitt antall gjeldende siffer. 684 321 med 3 siffer blir 684 000. */
export function rundAv(x, siffer = 3) {
  if (x === 0 || !Number.isFinite(x)) return x;
  const storrelse = Math.floor(Math.log10(Math.abs(x)));
  const faktor = Math.pow(10, storrelse - siffer + 1);
  return Math.round(x / faktor) * faktor;
}

/** Heltall med mellomrom som tusenskille: 1234567 blir «1 234 567». */
export function formaterTall(x, desimaler = 0) {
  if (!Number.isFinite(x)) return "";
  return desimaler > 0 ? desimalFormat(desimaler).format(x) : heltallFormat.format(Math.round(x));
}

/** Eksakt kronebeløp, avrundet til hele kroner: «370 000 kr». */
export function formaterKr(x) {
  if (!Number.isFinite(x)) return "";
  return heltallFormat.format(Math.round(x)) + NBSP + "kr";
}

/**
 * Omtrentlig kronebeløp med tre gjeldende siffer, slik det skal stå i en setning:
 * 684 321 blir «684 000 kr», 1 234 567 blir «1,23 mill. kr», 2 345 678 901 blir «2,35 mrd. kr».
 */
export function omtrentKr(x) {
  if (!Number.isFinite(x)) return "";
  const fortegn = x < 0 ? MINUS : "";
  const r = rundAv(Math.abs(x), 3);
  if (r >= 1e9) return fortegn + treSiffer(r / 1e9) + NBSP + "mrd." + NBSP + "kr";
  if (r >= 1e6) return fortegn + treSiffer(r / 1e6) + NBSP + "mill." + NBSP + "kr";
  return fortegn + heltallFormat.format(r) + NBSP + "kr";
}

function treSiffer(x) {
  const des = x >= 100 ? 0 : x >= 10 ? 1 : 2;
  return desimalFormat(des).format(x);
}

/** Prosent med norsk desimalkomma og mellomrom før tegnet: 37.84 blir «37,84 %». */
export function formaterProsent(x, maksDesimaler = 2) {
  if (!Number.isFinite(x)) return "";
  const f = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: maksDesimaler });
  return f.format(x) + NBSP + "%";
}

/** Tall med inntil to desimaler, uten å fylle ut med nuller: 6.6 blir «6,6», 2 blir «2». */
export function formaterDesimal(x, maksDesimaler = 2) {
  if (!Number.isFinite(x)) return "";
  return new Intl.NumberFormat("nb-NO", { maximumFractionDigits: maksDesimaler }).format(x);
}

/** Kort aksetekst: 0, 250 000, 1 mill., 1,5 mill. */
export function aksetekst(x) {
  if (x === 0) return "0";
  if (Math.abs(x) >= 1e9) return new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 2 }).format(x / 1e9) + NBSP + "mrd.";
  if (Math.abs(x) >= 1e6) return new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 2 }).format(x / 1e6) + NBSP + "mill.";
  return heltallFormat.format(x);
}

/**
 * Tolker et tall slik nordmenn skriver det. Godtar mellomrom som tusenskille,
 * komma eller punktum som desimaltegn, «kr» og «%» til slutt, og typografisk minus.
 * For kronebeløp (heltall: true) tolkes punktum som tusenskille: «10.000» blir 10000.
 * Gir NaN når teksten ikke er et tall.
 */
export function parseTall(tekst, { heltall = false } = {}) {
  if (typeof tekst === "number") return tekst;
  let s = String(tekst ?? "")
    .trim()
    .replace(/^kr\.?\s*/i, "")
    .replace(/\s*(kr|%)$/i, "")
    .replace(/[\s\u00a0\u202f]/g, "")
    .replace(/\u2212/g, "-");
  if (s === "") return NaN;
  if (heltall) s = s.replace(/\.(?=\d{3}(\D|$))/g, "");
  s = s.replace(",", ".");
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
  return Number(s);
}
