// Gudegriser, ikoner, strategier og obligasjoner i «Overfør». Bare data og små oppslag, regningen ligger i klikker.js.
// Alle beløp er i øre.

// Fire greiner med fem guder hver. Du velger én grein og kjøper gudene i rekkefølge. Virkningene ganges sammen.
// hint er den kryptiske teksten du ser før du velger. virkning har nøklene:
// trykk og utbytte (ganger), risiko, verdenFall og vent (ganger, lavere er bedre), ekstraAvk, oblRente og krakk (ganger), borteSek (tid).
export const GUDEPRISER = Object.freeze([1e9, 1e11, 1e13, 1e15, 1e17]);

export const GRENER = Object.freeze([
  { id: "norron", navn: "Norrøne", tema: "Trykket", guder: [
    { id: "loke", navn: "Loke", hint: "Lurer en ekstra mynt ut av hvert trykk, og ingen ser hvordan.", virkning: { trykk: 2 } },
    { id: "heimdall", navn: "Heimdall", hint: "Hører hver mynt som faller, selv i full fart.", virkning: { trykk: 2 } },
    { id: "froya", navn: "Frøya", hint: "Gråter gull, og gullet havner i grisen.", virkning: { trykk: 3 } },
    { id: "tor", navn: "Tor", hint: "Hammeren treffer grisen som torden.", virkning: { trykk: 4 } },
    { id: "odin", navn: "Odin", hint: "Ga et øye for å se alle trykk på én gang.", virkning: { trykk: 10 } },
  ] },
  { id: "romersk", navn: "Romerske", tema: "Utbyttet", guder: [
    { id: "janus", navn: "Janus", hint: "Ser både fram og tilbake i regnskapet.", virkning: { utbytte: 1.5 } },
    { id: "vesta", navn: "Vesta", hint: "Ilden i ildstedet slokner aldri.", virkning: { utbytte: 1.5 } },
    { id: "mars", navn: "Mars", hint: "Marsjerer inn i hvert marked og tar med seg byttet.", virkning: { utbytte: 2 } },
    { id: "merkur", navn: "Merkur", hint: "Vingede sandaler bringer utbyttet raskere hjem.", virkning: { utbytte: 2 } },
    { id: "jupiter", navn: "Jupiter", hint: "Hersker over himmelen og hver eneste aksje.", virkning: { utbytte: 5 } },
  ] },
  { id: "egyptisk", navn: "Egyptiske", tema: "Tiden", guder: [
    { id: "bastet", navn: "Bastet", hint: "Vokter huset mens du sover.", virkning: { borteSek: 4 * 3600 } },
    { id: "anubis", navn: "Anubis", hint: "Veier hjertet til hver investering før den slippes inn.", virkning: { risiko: 0.5 } },
    { id: "thot", navn: "Thot", hint: "Skrev ned tiden og strøk ut halvparten.", virkning: { vent: 0.5, borteSek: 12 * 3600 } },
    { id: "osiris", navn: "Osiris", hint: "Det som dør, kommer tilbake større.", virkning: { ekstraAvk: 2 } },
    { id: "ra", navn: "Ra", hint: "Solen går aldri ned over porteføljen.", virkning: { utbytte: 5, borteSek: 24 * 3600 } },
  ] },
  { id: "gresk", navn: "Greske", tema: "Markedet", guder: [
    { id: "hermes", navn: "Hermes", hint: "Bud mellom guder og långivere. Tar alltid litt ekstra for turen.", virkning: { oblRente: 1.5 } },
    { id: "ares", navn: "Ares", hint: "Krigen rammer bare de andre.", virkning: { verdenFall: 0.5 } },
    { id: "poseidon", navn: "Poseidon", hint: "Når havet trekker seg tilbake, plukker han opp skjellene.", virkning: { krakk: 2 } },
    { id: "zevs", navn: "Zevs", hint: "Lynet slår ned i hver konto, men bare én vei.", virkning: { utbytte: 3, trykk: 3 } },
    { id: "kronos", navn: "Kronos", hint: "Spiste tiden selv. Nå arbeider den bare for ham.", virkning: { utbytte: 10, trykk: 10 } },
  ] },
].map((g) => Object.freeze({ ...g, guder: Object.freeze(g.guder.map((x, i) => Object.freeze({ ...x, niva: i + 1, pris: GUDEPRISER[i], virkning: Object.freeze(x.virkning) }))) })));

export const grein = (id) => GRENER.find((g) => g.id === id) ?? null;

/** Gudene du har i greinen din. */
export function mineGuder(t) {
  const g = grein(t.gren);
  return g ? g.guder.slice(0, t.gud ?? 0) : [];
}

/** Ganger sammen en virkning fra gudene dine, eller 1. borteSek gir den lengste tiden, eller null. */
export function gudVirkning(t, nokkel) {
  if (nokkel === "borteSek") return mineGuder(t).reduce((m, g) => Math.max(m, g.virkning.borteSek ?? 0), 0) || null;
  return mineGuder(t).reduce((x, g) => x * (g.virkning[nokkel] ?? 1), 1);
}

// Ikoner: hvem du er, øverst til venstre. Det første er gratis, resten blir dyrere og kulere.
export const IKONER = Object.freeze([
  { id: "deg", navn: "Deg", pris: 0 },
  { id: "gra", navn: "Grå", pris: 5e7 },
  { id: "smil", navn: "Smilefjes", pris: 2.5e8 },
  { id: "kul", navn: "Solbriller", pris: 1.25e9 },
  { id: "cowboy", navn: "Cowboy", pris: 6e9 },
  { id: "astronaut", navn: "Astronaut", pris: 3e10 },
  { id: "robot", navn: "Robot", pris: 1.5e11 },
  { id: "konge", navn: "Konge", pris: 8e11 },
  { id: "drage", navn: "Drage", pris: 4e12 },
  { id: "fonix", navn: "Fønix", pris: Infinity, prestisje: true },   // bare ved prestisje
].map(Object.freeze));

export const ikon = (id) => IKONER.find((i) => i.id === id) ?? null;

// Strategier du kan velge etter 1 mill. kr. avers gir lavere risiko, noytral gir mer på obligasjoner, glad gir giring.
export const STRATEGIER = Object.freeze([
  { id: "avers", navn: "Risikoavers", tekst: "Litt lavere risiko overalt: investeringer går sjeldnere dårlig, verdenshendelser biter mindre, og i Lotto får du litt tilbake for rekker uten premie." },
  { id: "noytral", navn: "Risikonøytral", tekst: "Alt er som før, men obligasjonene gir 1,5 ganger så høy rente." },
  { id: "glad", navn: "Risikoglad", tekst: "Du kan låne til investeringene med giring fra 0,1 til 10 ganger. Taper du mer enn du har, selges aksjene dine." },
].map(Object.freeze));

export const STRATEGI = Object.freeze({
  grense: 1e8,             // 1 mill. kr innom grisen før du kan velge
  aversRisiko: 0.75,       // risikoavers: risikoen og verdensfallet er 75 % av det vanlige
  noytralObl: 1.5,         // risikonøytral: obligasjonsrenten ganges med 1,5
  giringMin: 0.1,
  giringMaks: 10,
});

// Obligasjoner: lav rente, fast løpetid. Staten betaler alltid. Går et selskap konkurs, får du halvparten tilbake.
export const OBLIGASJONER = Object.freeze([
  { id: "stat", navn: "Statsobligasjon", utsteder: "Staten", rente: 0.05, sikker: 1 },
  { id: "kraft", navn: "Obligasjon i Fossefall Kraftverk", utsteder: "Kapitalkrevende selskap", rente: 0.1, sikker: 0.95 },
  { id: "vekst", navn: "Obligasjon i Rakettfrø AS", utsteder: "Vekstselskap", rente: 0.15, sikker: 0.9 },
].map(Object.freeze));

export const OBL = Object.freeze({
  lopetid: 180,            // sekunder til obligasjonen forfaller
  gjenvinning: 0.5,        // så mye du får tilbake når utstederen går konkurs
  maksSek: 60,             // hver obligasjon koster et minutt utbytte, men aldri mer enn du har
  maksSamtidig: 3,         // flest obligasjoner samtidig
  grense: 1e5,             // vises når du har hatt 1 000 kr innom grisen
});

export const PRESTISJE = Object.freeze({
  faktor: 2,               // hver prestisje dobler utbytte, trykk og avkastningen på investeringer, både opp og ned
});
