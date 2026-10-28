// Myke kurver for grafene. Monoton kubisk interpolasjon (Fritsch–Carlson),
// så kurven aldri lager topper eller daler som ikke finnes i tallene.

/** SVG-sti gjennom punktene [[x, y], ...]. */
export function glattSti(pts) {
  const n = pts.length;
  if (n === 0) return "";
  if (n < 3) return pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");

  const dx = [], m = [];
  for (let k = 0; k < n - 1; k++) {
    dx[k] = pts[k + 1][0] - pts[k][0];
    m[k] = dx[k] === 0 ? 0 : (pts[k + 1][1] - pts[k][1]) / dx[k];
  }
  const t = [m[0]];
  for (let k = 1; k < n - 1; k++) t[k] = m[k - 1] * m[k] <= 0 ? 0 : (m[k - 1] + m[k]) / 2;
  t[n - 1] = m[n - 2];
  for (let k = 0; k < n - 1; k++) {
    if (m[k] === 0) { t[k] = 0; t[k + 1] = 0; continue; }
    const a = t[k] / m[k], b = t[k + 1] / m[k], s = a * a + b * b;
    if (s > 9) { const tau = 3 / Math.sqrt(s); t[k] = tau * a * m[k]; t[k + 1] = tau * b * m[k]; }
  }

  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let k = 0; k < n - 1; k++) {
    const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], h = dx[k] / 3;
    d += `C${(x0 + h).toFixed(1)},${(y0 + t[k] * h).toFixed(1)} ${(x1 - h).toFixed(1)},${(y1 - t[k + 1] * h).toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  return d;
}

/** Lukket flate mellom en øvre og en nedre kurve med samme x-verdier. */
export function flateSti(ovre, nedre) {
  const tilbake = glattSti([...nedre].reverse()).replace(/^M/, "L");
  return glattSti(ovre) + tilbake + "Z";
}

/** Legger en lineær gradient i <defs> med stopp som får farge fra CSS-klasser. */
export function gradient(defs, id, stopp, ns = "http://www.w3.org/2000/svg") {
  const g = document.createElementNS(ns, "linearGradient");
  g.setAttribute("id", id);
  g.setAttribute("x1", "0"); g.setAttribute("x2", "0"); g.setAttribute("y1", "0"); g.setAttribute("y2", "1");
  for (const [offset, klasse] of stopp) {
    const s = document.createElementNS(ns, "stop");
    s.setAttribute("offset", offset);
    s.setAttribute("class", klasse);
    g.appendChild(s);
  }
  defs.appendChild(g);
  return g;
}

export const reduserBevegelse = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
