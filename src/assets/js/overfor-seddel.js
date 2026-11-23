// Pengesedlene som faller fra himmelen: klarer du å trykke på en, får du en kort fordel. Vinden ligger i /lib/seddel.js.
import { REGLER, AKSJER, fangSeddel } from "/lib/klikker.js";
import { SEDDEL, nesteOm, nySeddel, steg } from "/lib/seddel.js";
import { $, si, lag, prosent } from "./overfor-felles.js";
import { spill } from "./lyd.js";

const himmel = $("himmel");
const beroring = matchMedia("(hover: none)");
let api = null, seddel = null, node = null, igjen = nesteOm(true), forrige = performance.now();
let peker = null, pekerTid = 0, sisteVind = 0;

addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse") return;
  const dt = Math.max(0.008, (e.timeStamp - pekerTid) / 1000);
  const f = peker ? { vx: (e.clientX - peker.x) / dt, vy: (e.clientY - peker.y) / dt } : { vx: 0, vy: 0 };
  peker = { x: e.clientX, y: e.clientY, vx: 0.5 * (peker?.vx ?? 0) + 0.5 * f.vx, vy: 0.5 * (peker?.vy ?? 0) + 0.5 * f.vy };
  pekerTid = e.timeStamp;
}, { passive: true });

const TEGNING = (tall) => '<svg viewBox="0 0 78 42" aria-hidden="true"><rect x="1" y="1" width="76" height="40" rx="5" class="lapp-papir"/><rect x="5" y="5" width="68" height="32" rx="3" class="lapp-ramme"/>' +
  `<circle cx="39" cy="21" r="11" class="lapp-sol"/><text x="39" y="25.2" text-anchor="middle" class="lapp-tall">${tall}</text><path d="M10 31q6-9 12 0t12 0M44 31q6-9 12 0t12 0" class="lapp-bolge"/></svg>`;

function slipp() {
  seddel = nySeddel({ b: innerWidth, h: innerHeight });
  const lilla = seddel.farge === "lilla";
  node = lag(`<button type="button" class="lapp ${seddel.farge}" tabindex="-1" aria-label="${lilla ? "Lilla" : "Grønn"} pengeseddel">${TEGNING(lilla ? "2x" : "½")}</button>`);
  node.addEventListener("pointerdown", (e) => { if (e.isTrusted) fang(); });
  himmel.append(node);
  spill("seddel");
}

function fang() {
  if (!seddel) return;
  const for_ = seddel;
  fjern();
  const t = fangSeddel(api.hent(), for_.farge);
  api.sett(t);
  spill("seddelFanget");
  api.prestasjon(["seddel-1"]);
  si(for_.farge === "lilla" ? `Lilla lapp! All inntekt er doblet i ${REGLER.lappDobbelSek} sekunder.`
    : `Grønn lapp! ${AKSJER.find((a) => a.id === t.lapp.halv.mal).navn} koster ${prosent(REGLER.lappHalv)} mindre i ${REGLER.lappHalvSek} sekunder.`);
}

function fjern() {
  node?.remove();
  node = null; seddel = null;
  igjen = nesteOm(false);
}

function bilde(naa) {
  const dt = Math.min(0.05, (naa - forrige) / 1000);
  forrige = naa;
  const pause = document.hidden || document.querySelector("dialog[open]");
  if (!pause) {
    if (!seddel) { igjen -= dt; if (igjen <= 0) slipp(); }
    else {
      // Står musen stille, dør farten ut, så seddelen bare skyves rett bort.
      if (peker && naa - pekerTid > 80) peker = { ...peker, vx: 0, vy: 0 };
      const ny = steg(seddel, beroring.matches ? null : peker, { b: innerWidth, h: innerHeight }, dt, Math.random, beroring.matches);
      if (!ny) fjern();
      else {
        const f = Math.hypot(ny.vx, ny.vy);
        if (f > 330 && naa - sisteVind > 900) { sisteVind = naa; spill("vind"); }
        seddel = ny;
        const vugg = Math.sin(ny.tid * 2.6) * 16 + ny.vx * 0.05;
        node.style.transform = `translate3d(${(ny.x - SEDDEL.bredde / 2).toFixed(1)}px, ${(ny.y - SEDDEL.hoyde / 2).toFixed(1)}px, 0) rotate(${vugg.toFixed(1)}deg)`;
        node.firstChild.style.transform = `rotateX(${(Math.sin(ny.tid * 3.3) * 38).toFixed(1)}deg)`;
      }
    }
  }
  requestAnimationFrame(bilde);
}

export function start(a) {
  api = a;
  requestAnimationFrame(bilde);
}
