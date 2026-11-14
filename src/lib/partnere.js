// Regler for annonselenker. Alt som vises som reklame på siden går gjennom disse funksjonene,
// slik at en lenke uten merking, tillatelse eller gyldig avtale aldri kan bli publisert.

// Kategoriene vi tar betalt for, med overskriften leseren ser over listen.
export const KATEGORIER = {
  aksjesparekonto: "Her kan du åpne aksjesparekonto",
  sparekonto: "Her kan du åpne sparekonto",
  bsu: "Her kan du åpne BSU",
  pensjon: "Her kan du spare til pensjon",
};

// Kategorier vi aldri tar betalt for, uansett tilbud.
export const FORBUDT = ["forbrukslan", "kredittkort", "krypto", "cfd", "pengespill", "forsikring"];

export const MAKS_DAGER_SIDEN_KONTROLL = 400;

const DATO = /^\d{4}-\d{2}-\d{2}$/;
const dag = (d) => Date.parse(d + "T00:00:00Z");

/** Gir en liste med feil. Tom liste betyr at partneren kan vises. */
export function validerPartner(p, idag = new Date()) {
  const feil = [];
  const naa = idag.getTime();
  if (!p || typeof p !== "object") return ["partneren mangler"];
  if (!/^[a-z0-9-]+$/.test(p.id ?? "")) feil.push("id må være små bokstaver, tall og bindestrek");
  if (!p.navn) feil.push("navn mangler");
  if (FORBUDT.includes(p.kategori)) feil.push(`kategorien ${p.kategori} tar vi ikke betalt for`);
  else if (!(p.kategori in KATEGORIER)) feil.push(`ukjent kategori: ${p.kategori}`);
  if (!/^https:\/\//.test(p.url ?? "")) feil.push("url må begynne med https://");
  if (!p.beskrivelse) feil.push("beskrivelse mangler");
  if (!p.nettverk) feil.push("nettverk mangler (skriv «direkte» hvis avtalen er med selskapet selv)");
  if (!p.godtgjorelse) feil.push("godtgjorelse mangler: hva får Rentesrente betalt for?");
  if (!/^https:\/\/(www\.)?finanstilsynet\.no\//.test(p.tillatelse ?? "")) feil.push("tillatelse må lenke til selskapet i Finanstilsynets virksomhetsregister");
  if (!DATO.test(p.avtaleFra ?? "")) feil.push("avtaleFra må være en dato (åååå-mm-dd)");
  else if (dag(p.avtaleFra) > naa) feil.push("avtalen har ikke begynt");
  if (p.avtaleTil != null) {
    if (!DATO.test(p.avtaleTil)) feil.push("avtaleTil må være en dato eller null");
    else if (dag(p.avtaleTil) + 86_400_000 <= naa) feil.push("avtalen er utløpt");
  }
  if (!DATO.test(p.kontrollert ?? "")) feil.push("kontrollert må være en dato (åååå-mm-dd)");
  else if ((naa - dag(p.kontrollert)) / 86_400_000 > MAKS_DAGER_SIDEN_KONTROLL) feil.push(`lenke og vilkår er ikke kontrollert på over ${MAKS_DAGER_SIDEN_KONTROLL} dager`);
  return feil;
}

const sorter = new Intl.Collator("nb", { sensitivity: "base" });

/** Partnerne som skal vises: slått på og uten feil, alltid alfabetisk. Betaling gir aldri bedre plass. */
export function aktivePartnere(liste, kategori, idag = new Date()) {
  return (liste ?? [])
    .filter((p) => p.aktiv === true && (kategori == null || p.kategori === kategori) && validerPartner(p, idag).length === 0)
    .sort((a, b) => sorter.compare(a.navn, b.navn));
}

/** Feil hos partnere som er slått på. Brukes til å stoppe byggingen før en ugyldig annonselenke kommer ut. */
export function feilIAktive(liste, idag = new Date()) {
  const ider = new Set();
  const ut = [];
  for (const p of liste ?? []) {
    if (p.aktiv !== true) continue;
    for (const f of validerPartner(p, idag)) ut.push(`${p.id ?? p.navn ?? "ukjent"}: ${f}`);
    if (ider.has(p.id)) ut.push(`${p.id}: samme id er brukt to ganger`);
    ider.add(p.id);
  }
  return ut;
}

/** Samler det malene trenger. */
export function reklameoversikt(liste, idag = new Date()) {
  const aktive = aktivePartnere(liste, null, idag);
  const perKategori = {};
  for (const k of Object.keys(KATEGORIER)) perKategori[k] = aktive.filter((p) => p.kategori === k);
  return { aktive, perKategori, harReklame: aktive.length > 0, kategorier: KATEGORIER };
}
