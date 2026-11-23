// Borgen i Ordjakt: et rutenett av steiner. Et treff knuser steinene rundt nedslaget,
// og alt som mister støtten under seg, raser med.
export const TEGNING = [
  "....#.#.#....",
  "....#####....",
  "....##V##....",
  "#.#.#####.#.#",
  "###.#####.###",
  "#V#.##V##.#V#",
  "#############",
  "#####DDD#####",
  "#####DDD#####",
];
export const BREDDE = TEGNING[0].length;
export const HOYDE = TEGNING.length;

export function nyBorg() {
  const steiner = [];
  TEGNING.forEach((rad, y) => [...rad].forEach((type, x) => { if (type !== ".") steiner.push({ x, y, type, hel: true }); }));
  return steiner;
}
export const igjen = (borg) => borg.filter((s) => s.hel).length;

// Sikter øverst først, så borgen brytes ned ovenfra og hvert treff har noe å treffe.
export function sikt(borg, r = Math.random) {
  const hele = borg.filter((s) => s.hel);
  if (!hele.length) return null;
  const topp = Math.min(...hele.map((s) => s.y));
  const valg = hele.filter((s) => s.y <= topp + 1);
  return valg[Math.floor(r() * valg.length)];
}

// Knuser de nærmeste steinene og returnerer alt som falt. Endrer borgen.
export function knus(borg, mål, antall) {
  const falt = borg.filter((s) => s.hel)
    .sort((a, b) => Math.hypot(a.x - mål.x, a.y - mål.y) - Math.hypot(b.x - mål.x, b.y - mål.y))
    .slice(0, antall);
  for (const s of falt) s.hel = false;
  const på = new Map(borg.filter((s) => s.hel).map((s) => [s.x + "," + s.y, s]));
  const støttet = new Set(), kø = [...på.values()].filter((s) => s.y === HOYDE - 1);
  while (kø.length) {
    const s = kø.pop();
    if (støttet.has(s)) continue;
    støttet.add(s);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = på.get((s.x + dx) + "," + (s.y + dy)); if (n) kø.push(n); }
  }
  for (const s of på.values()) if (!støttet.has(s)) { s.hel = false; falt.push(s); }
  return falt;
}
