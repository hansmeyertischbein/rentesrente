// Skjermen til Meglerhuset. Reglene ligger i /lib/mini-megler.js.
import * as M from "/lib/mini-megler.js";
import { formaterTall } from "/lib/format.js";
import { lag, settTekst, prosent } from "./overfor-felles.js";
import { skarpt } from "./overfor-mini-brett.js";

/** Kjører et steg for hvert bilde, aldri mer enn et tidels sekund om gangen. */
function lokke(steg) {
  let sist = performance.now(), ramme = requestAnimationFrame(function f(naa) {
    const dt = Math.min(0.1, (naa - sist) / 1000);
    sist = naa;
    ramme = requestAnimationFrame(f);
    if (!document.hidden) steg(dt, naa);
  });
  return () => cancelAnimationFrame(ramme);
}

const MFARGE = ["#e8553d", "#8a4fc7", "#2f7de1"];
export function meglerhuset(rot, niva, { ferdig, lyd }) {
  const mal = M.MEGLER.start * (1 + M.MEGLER.mal[niva - 1]);
  let m = M.lagMegler(niva), slutt = false, rest = 0, sistVerdi = M.MEGLER.start;
  rot.append(lag('<p class="mini-linje"><b></b><span></span></p>'), lag('<div class="mini-mal"><i></i></div>'), lag('<p class="megler-nyhet" role="status"></p>'), lag('<div class="megler"></div>'), lag(`<div class="megler-bunn"><button type="button" class="megler-selg">Selg alt</button><small>Kurtasje ${(M.MEGLER.kurtasje[niva - 1] * 100).toLocaleString("nb-NO")} % per handel</small></div>`));
  const [penger, tid] = rot.querySelector(".mini-linje").children, strek = rot.querySelector(".mini-mal i"), bord = rot.querySelector(".megler"), selg = rot.querySelector(".megler-selg"), nyhet = rot.querySelector(".megler-nyhet");
  const kort = M.MEGLER.aktiva.map((a, i) => {
    const n = lag(`<button type="button" class="megler-kort" style="--f:${MFARGE[i]}"><b>${a.navn}</b><span class="megler-kurs"></span><canvas></canvas><em></em></button>`);
    n.addEventListener("click", () => {
      if (slutt) return;
      const ny = m.eier === i ? M.selgAktiva(m) : M.kjopAktiva(m, i);
      if (ny === m) return;
      if (m.eier >= 0) avslutt();
      m = ny;
      if (m.eier >= 0) { sistVerdi = M.verdi(m); lyd("meglerKjop"); }
      tegn();
    });
    bord.append(n);
    return { n, kurs: n.querySelector(".megler-kurs"), em: n.querySelector("em"), g: skarpt(n.querySelector("canvas"), 220, 92) };
  });
  function avslutt() { lyd(M.verdi(m) >= sistVerdi ? "meglerGevinst" : "meglerTap"); }
  selg.addEventListener("click", () => { if (slutt || m.eier < 0) return; avslutt(); m = M.selgAktiva(m); tegn(); });
  function tegn() {
    const v = M.verdi(m);
    settTekst(penger, `${formaterTall(Math.round(v))} av ${formaterTall(Math.round(mal))} kr`);
    settTekst(tid, `Stenger om ${M.sekIgjen(m)} sek`);
    strek.style.transform = `scaleX(${Math.max(0, Math.min(1, (v - M.MEGLER.start) / (mal - M.MEGLER.start))).toFixed(3)})`;
    selg.disabled = m.eier < 0;
    kort.forEach((k, a) => {
      const serie = m.kurser[a].slice(Math.max(0, m.i - 70), m.i + 1), naa = serie.at(-1), for_ = serie.at(-2) ?? naa, g = k.g;
      settTekst(k.kurs, formaterTall(naa, 1));
      k.kurs.classList.toggle("opp", naa >= for_); k.kurs.classList.toggle("ned", naa < for_);
      k.n.classList.toggle("eier", m.eier === a);
      settTekst(k.em, m.eier === a ? `Selg ${naa >= m.kjopt ? "+" : "−"}${prosent(Math.abs(naa / m.kjopt - 1))}` : "Kjøp");
      const lav = Math.min(...serie), hoy = Math.max(...serie), y = (p) => 84 - ((p - lav) / Math.max(1e-9, hoy - lav)) * 76, x = (i) => 4 + ((i + 71 - serie.length) / 70) * 208;
      g.clearRect(0, 0, 220, 92);
      const gr = g.createLinearGradient(0, 0, 0, 92);
      gr.addColorStop(0, MFARGE[a] + "66"); gr.addColorStop(1, MFARGE[a] + "00");
      g.beginPath(); serie.forEach((p, i) => (i ? g.lineTo(x(i), y(p)) : g.moveTo(x(i), y(p))));
      g.strokeStyle = MFARGE[a]; g.lineWidth = 2.4; g.lineJoin = "round"; g.stroke();
      g.lineTo(x(serie.length - 1), 92); g.lineTo(x(0), 92); g.closePath(); g.fillStyle = gr; g.fill();
      if (m.eier === a && m.kjopt >= lav && m.kjopt <= hoy) { g.setLineDash([4, 4]); g.strokeStyle = "#2b2118"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, y(m.kjopt)); g.lineTo(220, y(m.kjopt)); g.stroke(); g.setLineDash([]); }
      g.fillStyle = MFARGE[a]; g.beginPath(); g.arc(x(serie.length - 1), y(naa), 4, 0, 7); g.fill();
    });
  }
  const av = lokke((dt) => {
    if (slutt) return;
    rest += dt;
    while (rest >= 1 / M.MEGLER.perSek) {
      rest -= 1 / M.MEGLER.perSek;
      m = M.meglerSteg(m);
      const n = m.nyheter.find((x) => x.i === m.i);
      if (n) { lyd("nyhet"); nyhet.textContent = M.nyhetTekst(n); nyhet.animate([{ opacity: 0, transform: "translateY(-6px)" }, { opacity: 1, transform: "none" }], { duration: 220 }); }
      else if (m.nyheter.every((x) => m.i < x.i || m.i > x.i + 26)) nyhet.textContent = "";
      if (m.i === M.MEGLER.for + M.MEGLER.steg - 20) lyd("meglerKlokke");
    }
    tegn();
    if (M.meglerFerdig(m)) {
      slutt = true;
      m = M.selgAktiva(m);
      tegn();
      lyd("meglerKlokke");
      ferdig(M.meglerKlart(m), `Du gjorde ${formaterTall(M.MEGLER.start)} kr om til ${formaterTall(Math.round(M.verdi(m)))} kr. Målet var ${formaterTall(Math.round(mal))} kr.`);
    }
  });
  lyd("meglerKlokke");
  tegn();
  return () => { slutt = true; av(); };
}
