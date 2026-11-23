// Kommentaren på sluttskjermen: frekk ved lav plassering, skryt ved høy. Grensene er «blant de X % beste».
export const KOMMENTARER = [
  { til: 10, tekster: ["Er du en ordbok i forkledning?", "Norsklæreren din gråter av glede.", "Kapteinen vil ha autografen din.", "Borgen hadde ikke en sjanse. Det hadde ikke ordene heller.", "Du har åpenbart lest bøkene de andre bare har i hylla."] },
  { til: 35, tekster: ["Sterkt! Mannskapet nikker anerkjennende.", "Her har noen fulgt med i timen.", "Du skyter bedre enn de fleste sjørøvere.", "Imponerende. Leser du for moro skyld?"] },
  { til: 65, tekster: ["Helt greit. Papegøya sier det samme.", "Midt på treet, men treet flyter.", "Ikke verst. Ikke best heller.", "Du holder deg flytende."] },
  { til: 90, tekster: ["Har du lest mange bøker i det siste?", "Papegøya kan flere ord enn deg.", "Leste du bare baksiden av boka?", "Borgen sender takkekort.", "Biblioteket er gratis, bare så du vet det."] },
  { til: 100, tekster: ["Har du lest en bok noen gang?", "Var tastaturet skrudd på?", "Selv kanonen rødmer.", "Melkekartongen teller også som lesestoff. Begynn der.", "Fiskene ler, og de kan ikke lese."] },
];
export function kommentar(topp, r = Math.random) {
  const { tekster } = KOMMENTARER.find((k) => topp <= k.til) ?? KOMMENTARER.at(-1);
  return tekster[Math.floor(r() * tekster.length)];
}
