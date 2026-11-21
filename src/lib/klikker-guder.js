// Gudegriser, ikoner, strategier og obligasjoner i «Overfør». Bare data og små oppslag, regningen ligger i klikker.js.
// Alle beløp er i øre.

// Fire greiner med fem guder hver. Du velger én grein og kjøper gudene i rekkefølge. Virkningene ganges sammen.
// hint er den kryptiske teksten du ser før du velger. virkning har nøklene:
// trykk og utbytte (ganger), risiko, verdenFall og vent (ganger, lavere er bedre), ekstraAvk, oblRente og krakk (ganger), borteSek (tid).
// Grunnprisen for hvert nivå. Hver gud har en egen faktor etter hvor sterk den er, så ingen to koster det samme.
export const GUDEPRISER = Object.freeze([1e10, 1e12, 1e14, 1e16, 1e18]);
const pent = (x) => { const steg = Math.pow(10, Math.floor(Math.log10(x)) - 2); return Math.round(x / steg) * steg; };

export const GRENER = Object.freeze([
  { id: "norron", navn: "Norrøne", tema: "Trykket", guder: [
    { id: "loke", styrke: 0.92, navn: "Loke", hint: "Lurer en ekstra mynt ut av hvert trykk, og ingen ser hvordan.", virkning: { trykk: 2 } },
    { id: "heimdall", styrke: 0.97, navn: "Heimdall", hint: "Hører hver mynt som faller, selv i full fart.", virkning: { trykk: 2 } },
    { id: "froya", styrke: 1.08, navn: "Frøya", hint: "Gråter gull, og gullet havner i grisen.", virkning: { trykk: 3 } },
    { id: "tor", styrke: 1.12, navn: "Tor", hint: "Hammeren treffer grisen som torden.", virkning: { trykk: 4 } },
    { id: "odin", styrke: 1.18, navn: "Odin", hint: "Ga et øye for å se alle trykk på én gang.", virkning: { trykk: 10 } },
  ] },
  { id: "romersk", navn: "Romerske", tema: "Utbyttet", guder: [
    { id: "janus", styrke: 1.27, navn: "Janus", hint: "Ser både fram og tilbake i regnskapet.", virkning: { utbytte: 1.5 } },
    { id: "vesta", styrke: 1.22, navn: "Vesta", hint: "Ilden i ildstedet slokner aldri.", virkning: { utbytte: 1.5 } },
    { id: "mars", styrke: 1.31, navn: "Mars", hint: "Marsjerer inn i hvert marked og tar med seg byttet.", virkning: { utbytte: 2 } },
    { id: "merkur", styrke: 1.24, navn: "Merkur", hint: "Vingede sandaler bringer utbyttet raskere hjem.", virkning: { utbytte: 2 } },
    { id: "jupiter", styrke: 1.29, navn: "Jupiter", hint: "Hersker over himmelen og hver eneste aksje.", virkning: { utbytte: 5 } },
  ] },
  { id: "egyptisk", navn: "Egyptiske", tema: "Tiden", guder: [
    { id: "bastet", styrke: 0.83, navn: "Bastet", hint: "Vokter huset mens du sover.", virkning: { borteSek: 4 * 3600 } },
    { id: "anubis", styrke: 0.96, navn: "Anubis", hint: "Veier hjertet til hver investering før den slippes inn.", virkning: { risiko: 0.5 } },
    { id: "thot", styrke: 1.04, navn: "Thot", hint: "Skrev ned tiden og strøk ut halvparten.", virkning: { vent: 0.5, borteSek: 12 * 3600 } },
    { id: "osiris", styrke: 1.07, navn: "Osiris", hint: "Det som dør, kommer tilbake større.", virkning: { ekstraAvk: 2 } },
    { id: "ra", styrke: 1.37, navn: "Ra", hint: "Solen går aldri ned over porteføljen.", virkning: { utbytte: 5, borteSek: 24 * 3600 } },
  ] },
  { id: "gresk", navn: "Greske", tema: "Markedet", guder: [
    { id: "hermes", styrke: 0.88, navn: "Hermes", hint: "Bud mellom guder og långivere. Tar alltid litt ekstra for turen.", virkning: { oblRente: 1.5 } },
    { id: "ares", styrke: 0.91, navn: "Ares", hint: "Krigen rammer bare de andre.", virkning: { verdenFall: 0.5 } },
    { id: "poseidon", styrke: 0.94, navn: "Poseidon", hint: "Når havet trekker seg tilbake, plukker han opp skjellene.", virkning: { krakk: 2 } },
    { id: "zevs", styrke: 1.43, navn: "Zevs", hint: "Lynet slår ned i hver konto, men bare én vei.", virkning: { utbytte: 3, trykk: 3 } },
    { id: "kronos", styrke: 1.85, navn: "Kronos", hint: "Spiste tiden selv. Nå arbeider den bare for ham.", virkning: { utbytte: 10, trykk: 10 } },
  ] },
].map((g) => Object.freeze({ ...g, guder: Object.freeze(g.guder.map((x, i) => Object.freeze({ ...x, niva: i + 1, pris: pent(GUDEPRISER[i] * x.styrke), virkning: Object.freeze(x.virkning) }))) })));

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

// Prestasjoner: noen kommer av seg selv når du når et mål, andre gis når noe spesielt skjer (hendelse).
// hemmelig betyr at navnet vises først når du har den.
export const PRESTASJONER = Object.freeze([
  { id: "trykk-1", navn: "Første krone", tekst: "Trykk på grisen for første gang." },
  { id: "trykk-100", navn: "Ivrig", tekst: "Trykk 100 ganger." },
  { id: "trykk-1000", navn: "Flittig", tekst: "Trykk 1 000 ganger." },
  { id: "trykk-10000", navn: "Senebetennelse", tekst: "Trykk 10 000 ganger." },
  { id: "trykk-100000", navn: "Trykkemaskin", tekst: "Trykk 100 000 ganger." },
  { id: "trykk-1000000", navn: "Legenden om fingeren", tekst: "Trykk 1 000 000 ganger." },
  { id: "fart-5", navn: "Rask finger", tekst: "Nå 5x fart.", hendelse: true },
  { id: "fart-12", navn: "Lysets hastighet", tekst: "Nå full fart, 12x.", hendelse: true, hemmelig: true },
  { id: "aksje-1", navn: "Aksjonær", tekst: "Kjøp din første aksje." },
  { id: "gf-1", navn: "Generalforsamling", tekst: "Eie 50 i samme selskap." },
  { id: "alle-selskaper", navn: "Hele børsen", tekst: "Eie minst én i hvert selskap." },
  { id: "booster-1", navn: "Litt ekstra", tekst: "Kjøp din første booster." },
  { id: "booster-alle", navn: "Fullt trimmet", tekst: "Kjøp alle boosterne." },
  { id: "kr-1000", navn: "Lommepenger", tekst: "Ha 1 000 kr innom grisen." },
  { id: "kr-mill", navn: "Millionær", tekst: "Ha 1 mill. kr innom grisen." },
  { id: "kr-mrd", navn: "Milliardær", tekst: "Ha 1 mrd. kr innom grisen." },
  { id: "kr-billion", navn: "Billionær", tekst: "Ha 1 billion kr innom grisen." },
  { id: "kr-billiard", navn: "Grisen sprenger", tekst: "Ha 1 billiard kr innom grisen.", hemmelig: true },
  { id: "radgiver", navn: "Rådgiveren er ansatt", tekst: "Ansett Finn Fondsen." },
  { id: "radgiver-maks", navn: "Treffsikker", tekst: "Gi rådgiveren full treffsikkerhet." },
  { id: "ekstra-1", navn: "Investor", tekst: "Invester i en mulighet som dukker opp.", hendelse: true },
  { id: "ekstra-darlig", navn: "Lærepenger", tekst: "Opplev at en investering går dårlig.", hendelse: true },
  { id: "obl-1", navn: "Långiver", tekst: "Kjøp en obligasjon.", hendelse: true },
  { id: "obl-konkurs", navn: "Konkursbo", tekst: "Opplev at et selskap du har lånt penger til, går konkurs.", hendelse: true, hemmelig: true },
  { id: "verden", navn: "Urolige tider", tekst: "Opplev en verdenshendelse.", hendelse: true },
  { id: "krakk-kjop", navn: "Kjøp når andre selger", tekst: "Kjøp aksjer under et børskrakk.", hendelse: true },
  { id: "strategi", navn: "Veivalg", tekst: "Velg en strategi." },
  { id: "giring-10", navn: "Alt på rødt", tekst: "Sett giringen til 10x.", hemmelig: true },
  { id: "tvangssalg", navn: "Margin call", tekst: "Få aksjene tvangssolgt.", hendelse: true, hemmelig: true },
  { id: "lotto-1", navn: "Drømmer om millionen", tekst: "Kjøp en lottorekke.", hendelse: true },
  { id: "lotto-1000", navn: "Storspiller", tekst: "Ha 1 000 rekker i samme trekning.", hendelse: true },
  { id: "lotto-premie", navn: "Litt flaks", tekst: "Vinn en premie i Lotto.", hendelse: true },
  { id: "lotto-6", navn: "Nesten", tekst: "Få 6 rette i Lotto.", hendelse: true, hemmelig: true },
  { id: "lotto-7", navn: "Jackpot", tekst: "Få 7 rette i Lotto.", hendelse: true, hemmelig: true },
  { id: "ikon-1", navn: "Ny stil", tekst: "Kjøp et nytt ikon." },
  { id: "ikon-alle", navn: "Samler", tekst: "Kjøp alle ikonene." },
  { id: "gud-1", navn: "Troende", tekst: "Kjøp din første gudegris." },
  { id: "gud-5", navn: "Gud blant griser", tekst: "Kjøp den høyeste guden i en grein." },
  { id: "kronos", navn: "Tidens herre", tekst: "Kjøp Kronos.", hemmelig: true },
  { id: "borte", navn: "Mens du sov", tekst: "Kom tilbake og få utbytte fra tiden du var borte.", hendelse: true },
  { id: "prestisje-1", navn: "Fønix", tekst: "Ta prestisje." },
  { id: "prestisje-3", navn: "Evig fønix", tekst: "Ta prestisje tre ganger.", hemmelig: true },
].map(Object.freeze));

export const PRESTISJE = Object.freeze({
  faktor: 2,               // hver prestisje dobler utbytte, trykk og avkastningen på investeringer, både opp og ned
});
