// Pengene og butikken i Ordjakt. Lekepenger: ett poeng blir én mynt når runden er ferdig.
// Utseende virker alltid. Hjelpemidler virker bare alene, så en runde mot en venn er lik for begge.
export const EKSTRA_SEKUNDER = 10;
export const VARER = [
  { id: "seil-rod", type: "seil", navn: "Røde seil", pris: 500, tekst: "Skipet får røde seil.", farge: [190, 52, 44] },
  { id: "seil-svart", type: "seil", navn: "Svarte seil", pris: 1500, tekst: "Skipet får svarte seil.", farge: [52, 50, 58] },
  { id: "seil-gull", type: "seil", navn: "Gullseil", pris: 6000, tekst: "Skipet får seil av gull.", farge: [240, 196, 70] },
  { id: "kule-ild", type: "kule", navn: "Ildkule", pris: 800, tekst: "Kula brenner på vei mot borgen.", farge: "#ff8a3d" },
  { id: "kule-is", type: "kule", navn: "Iskule", pris: 2500, tekst: "Kula etterlater et spor av is.", farge: "#9fe8ff" },
  { id: "storkanon", type: "kanon", navn: "Storkanon", pris: 2000, tekst: "Hvert treff knuser mer av borgen. Gir ikke flere poeng." },
  { id: "timeglass", type: "hjelp", navn: "Timeglass", pris: 700, tekst: `Gir ${EKSTRA_SEKUNDER} sekunder ekstra, én gang. Bare alene.` },
  { id: "kikkert", type: "hjelp", navn: "Kikkert", pris: 500, tekst: "Viser starten på et sjeldent ord, én gang. Bare alene." },
];
const finn = (id) => VARER.find((v) => v.id === id);
export const FLERE = (v) => v.type === "hjelp";

export const nyKasse = () => ({ mynter: 0, eier: [], valgt: { seil: null, kule: null, kanon: null }, antall: { timeglass: 0, kikkert: 0 } });

export const mynterFor = (poeng) => (Number.isFinite(poeng) && poeng > 0 ? Math.floor(poeng) : 0);
export const tjen = (kasse, poeng) => ({ ...kasse, mynter: kasse.mynter + mynterFor(poeng) });

export function kjop(kasse, id) {
  const v = finn(id);
  if (!v || kasse.mynter < v.pris || (!FLERE(v) && kasse.eier.includes(id))) return kasse;
  const ny = { ...kasse, mynter: kasse.mynter - v.pris };
  if (FLERE(v)) return { ...ny, antall: { ...ny.antall, [id]: ny.antall[id] + 1 } };
  return { ...ny, eier: [...ny.eier, id], valgt: { ...ny.valgt, [v.type]: id } };
}

// Velger noe du eier, eller legger det bort hvis det allerede er valgt.
export function velg(kasse, id) {
  const v = finn(id);
  if (!v || FLERE(v) || !kasse.eier.includes(id)) return kasse;
  return { ...kasse, valgt: { ...kasse.valgt, [v.type]: kasse.valgt[v.type] === id ? null : id } };
}

export function bruk(kasse, id) {
  if (!(kasse.antall[id] > 0)) return kasse;
  return { ...kasse, antall: { ...kasse.antall, [id]: kasse.antall[id] - 1 } };
}

// Leser en lagret kasse. Alt som ikke stemmer, blir standardverdier.
export function lesKasse(tekst) {
  const ut = nyKasse();
  let d;
  try { d = JSON.parse(tekst); } catch { return ut; }
  if (!d || typeof d !== "object") return ut;
  const tall = (x) => (Number.isSafeInteger(x) && x >= 0 ? x : 0);
  ut.mynter = tall(d.mynter);
  if (Array.isArray(d.eier)) ut.eier = [...new Set(d.eier)].filter((id) => finn(id) && !FLERE(finn(id)));
  for (const type of Object.keys(ut.valgt)) if (ut.eier.includes(d.valgt?.[type]) && finn(d.valgt[type]).type === type) ut.valgt[type] = d.valgt[type];
  for (const id of Object.keys(ut.antall)) ut.antall[id] = tall(d.antall?.[id]);
  return ut;
}
