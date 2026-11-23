// Skjermene til Limonadeboden, Meglerhuset og Grisevakta. Reglene ligger i /lib/mini-bod.js, mini-megler.js og mini-vakt.js.
import * as L from "/lib/mini-bod.js";
import * as M from "/lib/mini-megler.js";
import * as V from "/lib/mini-vakt.js";
import { formaterTall } from "/lib/format.js";
import { FIGURER, lagGris } from "./klikker-figurer.js";
import { lag, settTekst, settAttr, prosent } from "./overfor-felles.js";
import { spill } from "./lyd.js";
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
const svgBilde = (kode) => { const i = new Image(); i.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(kode.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ')); return i; };

// ---------- Limonadeboden ----------

const SMAK = { sitron: ["Sitron", "#ffe25a", "#e0b800"], jordbaer: ["Jordbær", "#ff8fa8", "#d63a5e"], blaabaer: ["Blåbær", "#9a8cf0", "#5a48c8"], mynte: ["Mynte", "#9be3b4", "#2f9a5a"] };
const KUNDER = ["geitan", "lilledalen", "fredriksjo", "lokke", "blitzoe", "mittelfart"];
const GLASS = ([, a, b]) => `<svg viewBox="0 0 40 48" aria-hidden="true"><g stroke="#2b2118" stroke-width="2" stroke-linejoin="round"><path d="M8 8h24l-3 36H11z" fill="#fff" fill-opacity=".75"/><path d="M9.3 16h21.4l-2.3 27H11.6z" fill="${a}"/><path d="M26 2l-4 22" stroke="#e8553d" stroke-width="3"/><circle cx="16" cy="24" r="3.4" fill="#fff" fill-opacity=".7"/><circle cx="22" cy="32" r="3" fill="#fff" fill-opacity=".6"/><path d="M29 9a7 7 0 0 1 8 6l-8 1z" fill="${b}"/></g></svg>`;

export function limonadeboden(rot, niva, { ferdig, lyd, api }) {
  const mal = L.BOD.mal[niva - 1];
  let d = L.lagDag(niva, api.hent().bod), slutt = false;
  rot.append(lag('<p class="mini-linje"><b></b><span></span></p>'), lag('<div class="mini-mal"><i></i></div>'),
    lag('<div class="bod"><div class="bod-tak"></div><ol class="bod-ko"></ol><div class="bod-disk"><span class="bod-heller"><i></i></span></div></div>'), lag('<div class="bod-kanner"></div>'));
  const [salg, tid] = rot.querySelector(".mini-linje").children, strek = rot.querySelector(".mini-mal i"), ko = rot.querySelector(".bod-ko"), heller = rot.querySelector(".bod-heller i"), kanner = rot.querySelector(".bod-kanner");
  const noder = new Map();
  L.BOD.smaker.slice(0, L.BOD.antallSmaker[niva - 1]).forEach((id, nr) => {
    const b = lag(`<button type="button" class="bod-kanne" style="--k:${SMAK[id][1]}">${GLASS(SMAK[id])}<b>${SMAK[id][0]}</b><kbd>${nr + 1}</kbd></button>`);
    b.addEventListener("pointerdown", (e) => { if (e.isTrusted) gi(id); });
    b.addEventListener("click", (e) => { if (e.detail === 0 && e.isTrusted) gi(id); });   // tastatur
    kanner.append(b);
  });
  function gi(id) {
    if (slutt) return;
    const forst = d.ko[0], r = L.server(d, id);
    if (!r.resultat) return;
    d = r.tilstand;
    lyd(r.resultat.riktig ? "hell" : "feil", d.rekke);
    const node = noder.get(forst.id);
    if (node && r.resultat.riktig) {
      const p = lag(`<span class="bod-penger">+${r.resultat.belop}</span>`);
      rot.querySelector(".bod").append(p);
      p.animate([{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(-46px)", opacity: 0 }], { duration: 900, easing: "ease-out" }).finished.then(() => p.remove(), () => p.remove());
    } else node?.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 240 });
    tegn();
  }
  function tegn() {
    settTekst(salg, `${formaterTall(d.salg)} av ${formaterTall(mal)} kr${d.rekke > 2 ? ` · ${d.rekke} på rad` : ""}`);
    settTekst(tid, `${Math.ceil(d.tid)} sek`);
    strek.style.transform = `scaleX(${Math.min(1, d.salg / mal).toFixed(3)})`;
    heller.style.transform = `scaleX(${Math.min(1, d.heller / d.helletid).toFixed(3)})`;
    for (const [id, n] of noder) if (!d.ko.some((k) => k.id === id)) { n.remove(); noder.delete(id); }
    d.ko.forEach((k, i) => {
      let n = noder.get(k.id);
      if (!n) { n = lag(`<li class="bod-kunde"><span class="bod-onske">${GLASS(SMAK[k.smak])}</span><span class="bod-ansikt">${FIGURER[KUNDER[k.person]].svg}</span><span class="bod-taalmod"><i></i></span></li>`); n.setAttribute("aria-label", SMAK[k.smak][0]); noder.set(k.id, n); ko.append(n); }
      n.classList.toggle("forst", i === 0);
      const a = Math.max(0, k.igjen / d.taalmod);
      n.querySelector(".bod-taalmod i").style.transform = `scaleX(${a.toFixed(3)})`;
      n.classList.toggle("sur", a < 0.35);
    });
  }
  const av = lokke((dt) => {
    if (slutt) return;
    const r = L.dagSteg(d, dt);
    d = r.tilstand;
    for (const h of r.hendelser) lyd(h === "kom" ? "kunde" : "kundeGikk");
    tegn();
    if (d.tid <= 0) {
      slutt = true;
      const t = api.hent();   // drikkepengene beholdes uansett, så boden kan bli bedre
      api.sett({ ...t, bod: { ...t.bod, penger: t.bod.penger + d.salg } });
      ferdig(L.dagKlart(d), L.dagKlart(d) ? `Du solgte for ${formaterTall(d.salg)} kr. Bodene dine gir mer utbytte for godt.` : `Du solgte for ${formaterTall(d.salg)} av ${formaterTall(mal)} kr. Bruk pengene på boden og prøv igjen.`);
    }
  });
  const tast = (e) => { const id = L.BOD.smaker[Number(e.key) - 1]; if (id && Number(e.key) <= L.BOD.antallSmaker[niva - 1] && !e.repeat) gi(id); };
  document.addEventListener("keydown", tast);
  tegn();
  return () => { slutt = true; av(); document.removeEventListener("keydown", tast); };
}

/** Oppgraderingene av boden, vist sammen med nivåene. */
export function bodButikk(api) {
  const boks = lag('<div class="bod-butikk"><h3></h3><ul></ul></div>');
  const tegn = () => {
    const bod = api.hent().bod;
    settTekst(boks.querySelector("h3"), `Boden din: ${formaterTall(bod.penger)} kr å bruke`);
    boks.querySelector("ul").replaceChildren(...Object.entries(L.BODKJOP).map(([id, k]) => {
      const pris = L.prisBod(bod, id), full = !Number.isFinite(pris);
      const li = lag(`<li><button type="button" class="bod-kjop"><b></b><span></span><em class="mini-prikker">${Array.from({ length: L.BOD_MAKS }, (_, i) => `<i class="${i < bod.opp[id] ? "pa" : ""}"></i>`).join("")}</em><span class="pris"></span></button></li>`);
      li.querySelector("b").textContent = k.navn;
      li.querySelector("span").textContent = k.tekst;
      li.querySelector(".pris").textContent = full ? "Ferdig" : `${formaterTall(pris)} kr`;
      settAttr(li.firstChild, "aria-disabled", !full && pris <= bod.penger ? "false" : "true");
      li.firstChild.addEventListener("click", () => {
        const t = api.hent(), ny = L.kjopBod(t.bod, id);
        spill(ny === t.bod ? "feil" : "bodKjop");
        if (ny !== t.bod) { api.sett({ ...t, bod: ny }); tegn(); }
      });
      return li;
    }));
  };
  tegn();
  return boks;
}

// ---------- Meglerhuset ----------

const MFARGE = ["#e8553d", "#8a4fc7", "#2f7de1"];
export function meglerhuset(rot, niva, { ferdig, lyd }) {
  const mal = M.MEGLER.start * (1 + M.MEGLER.mal[niva - 1]);
  let m = M.lagMegler(niva), slutt = false, rest = 0, sistVerdi = M.MEGLER.start;
  rot.append(lag('<p class="mini-linje"><b></b><span></span></p>'), lag('<div class="mini-mal"><i></i></div>'), lag('<div class="megler"></div>'), lag('<button type="button" class="megler-selg">Selg alt</button>'));
  const [penger, tid] = rot.querySelector(".mini-linje").children, strek = rot.querySelector(".mini-mal i"), bord = rot.querySelector(".megler"), selg = rot.querySelector(".megler-selg");
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
    settTekst(tid, `Stenger om ${Math.ceil((M.MEGLER.steg - m.i) / M.MEGLER.perSek)} sek`);
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
      if (m.i === M.MEGLER.steg - 20) lyd("meglerKlokke");
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

// ---------- Grisevakta ----------

const TFARGE = { mynt: ["#ffd84a", "#b87a10"], frys: ["#9fdcf5", "#2f7fa8"], rente: ["#8fd18a", "#2f8a46"] };
export function grisevakta(rot, niva, { ferdig, lyd }) {
  rot.append(lag('<p class="mini-linje"><b></b><span></span></p>'), lag('<canvas class="mini-lerret vakt-lerret" aria-label="Grisevakta"></canvas>'), lag('<div class="vakt-panel"><div class="vakt-tarn"></div><button type="button" class="oppgrader vakt-bolge"><span class="oppgrader-navn">Neste bølge</span></button></div>'));
  const [venstre, hoyre] = rot.querySelector(".mini-linje").children, lerret = rot.querySelector("canvas"), g = skarpt(lerret, 600, 400), panel = rot.querySelector(".vakt-tarn"), bolgeKnapp = rot.querySelector(".vakt-bolge");
  let s = V.lagVakt(niva), slutt = false, valgt = -1, panelNokkel = "", skuddLyd = 0;
  const brett = V.brett(niva), gris = svgBilde(lagGris(null, "v")), poff = [];
  const [gx, gy] = brett.sti.at(-1);
  lerret.addEventListener("pointerdown", (e) => {
    const b = lerret.getBoundingClientRect(), x = ((e.clientX - b.left) / b.width) * 600, y = ((e.clientY - b.top) / b.height) * 400;
    const i = brett.plasser.findIndex(([px, py]) => Math.hypot(px - x, py - y) < 30);
    valgt = i === valgt ? -1 : i;
    lyd("klikk");
  });
  bolgeKnapp.addEventListener("click", () => { const ny = V.nesteBolge(s); if (ny !== s) { s = ny; lyd("bolge"); } });
  function tegnPanel() {
    const t = s.tarn.find((x) => x.plass === valgt);
    const nokkel = `${valgt}:${t?.type}:${t?.niva}:${s.penger}:${t ? Math.round(V.tarnSkade(t)) : ""}`;
    if (nokkel === panelNokkel) return;
    panelNokkel = nokkel;
    const knapp = (farge, navn, tekst, pris, gjor) => {
      const b = lag(`<button type="button" class="vakt-kjop" style="--t:${farge}"><i></i><b>${navn}</b><span>${tekst}</span><span class="pris">${Number.isFinite(pris) ? `${pris} kr` : "Ferdig"}</span></button>`);
      settAttr(b, "aria-disabled", pris <= s.penger ? "false" : "true");
      b.addEventListener("click", () => { const ny = gjor(); lyd(ny === s ? "feil" : "bygg"); s = ny; panelNokkel = ""; });
      return b;
    };
    if (valgt < 0) panel.replaceChildren(lag("<p>Trykk på en av de runde plassene for å bygge.</p>"));
    else if (t) panel.replaceChildren(knapp(TFARGE[t.type][0], `${V.TARN[t.type].navn} ${"★".repeat(t.niva)}`, "Oppgrader", V.prisOpp(t), () => V.oppgraderTarn(s, valgt)));
    else panel.replaceChildren(...Object.entries(V.TARN).map(([id, x]) => knapp(TFARGE[id][0], x.navn, { mynt: "Kaster raskt", frys: "Bremser alle", rente: "Vokser for hver bølge" }[id], x.pris, () => V.byggTarn(s, id, valgt))));
  }
  function tegn(naa) {
    g.fillStyle = "#b6d994"; g.fillRect(0, 0, 600, 400);
    for (let i = 0; i < 90; i++) { g.fillStyle = i % 2 ? "#a9cf86" : "#c2e2a2"; g.fillRect((i * 137) % 600, (i * 71) % 400, 5, 3); }
    for (const [b, f] of [[46, "#a88a5c"], [38, "#e3cfa0"]]) { g.strokeStyle = f; g.lineWidth = b; g.lineJoin = g.lineCap = "round"; g.beginPath(); brett.sti.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); }
    brett.plasser.forEach(([x, y], i) => {
      const t = s.tarn.find((k) => k.plass === i);
      if (i === valgt) { g.fillStyle = "rgb(255 255 255 / 0.25)"; g.strokeStyle = "#2b2118"; g.lineWidth = 1.5; g.setLineDash([5, 5]); g.beginPath(); g.arc(x, y, t ? V.tarnRekke(t) : 98, 0, 7); g.fill(); g.stroke(); g.setLineDash([]); }
      g.strokeStyle = "#2b2118"; g.lineWidth = 2.4;
      g.fillStyle = t ? "#cbb48a" : "rgb(255 250 240 / 0.75)"; g.beginPath(); g.ellipse(x, y + 6, 23, 15, 0, 0, 7); g.fill(); g.stroke();
      if (!t) { g.fillStyle = "#2b2118"; g.font = "900 22px Archivo, system-ui"; g.textAlign = "center"; g.fillText("+", x, y + 13); return; }
      const [a, b] = TFARGE[t.type], h = 20 + 5 * t.niva;
      g.fillStyle = b; g.beginPath(); g.roundRect(x - 14, y - h + 6, 28, h, 6); g.fill(); g.stroke();
      g.fillStyle = a; g.beginPath(); g.arc(x, y - h + 3, 15, 0, 7); g.fill(); g.stroke();
      g.fillStyle = "#2b2118"; g.font = "900 13px Archivo, system-ui"; g.textAlign = "center"; g.fillText({ mynt: "kr", frys: "❄", rente: "%" }[t.type], x, y - h + 8);
      for (let k = 0; k < t.niva; k++) { g.fillStyle = "#ffd84a"; g.beginPath(); g.arc(x - 9 + k * 6, y + 11, 2.4, 0, 7); g.fill(); }
    });
    if (gris.complete) g.drawImage(gris, gx - 38, gy - 44, 76, 76);
    for (const f of [...s.fiender].sort((a, b) => a.d - b.d)) {
      const [x, y] = V.paaSti(niva, f.d), stor = { regning: 11, gebyr: 9, laan: 15, inkasso: 22 }[f.type], hopp = Math.abs(Math.sin(naa / 110 + f.id)) * 3;
      g.strokeStyle = "#2b2118"; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x - stor * 0.4, y + stor * 0.8); g.lineTo(x - stor * 0.4, y + stor * 1.3 - hopp); g.moveTo(x + stor * 0.4, y + stor * 0.8); g.lineTo(x + stor * 0.4, y + stor * 1.3 - (3 - hopp)); g.stroke();
      g.fillStyle = { regning: "#fffaf0", gebyr: "#ffd0b0", laan: "#d8c7f0", inkasso: "#5b4a52" }[f.type];
      g.beginPath(); g.roundRect(x - stor * 0.8, y - stor - hopp, stor * 1.6, stor * 2, 3); g.fill(); g.stroke();
      if (f.bremset > 0) { g.fillStyle = "rgb(120 205 245 / 0.5)"; g.fill(); }
      g.fillStyle = f.type === "inkasso" ? "#ff6b6b" : "#2b2118";
      for (const o of [-0.32, 0.32]) { g.beginPath(); g.arc(x + o * stor, y - stor * 0.3 - hopp, stor * 0.14, 0, 7); g.fill(); }
      g.strokeStyle = g.fillStyle; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x - stor * 0.6, y - stor * 0.62 - hopp); g.lineTo(x - stor * 0.15, y - stor * 0.45 - hopp); g.moveTo(x + stor * 0.6, y - stor * 0.62 - hopp); g.lineTo(x + stor * 0.15, y - stor * 0.45 - hopp); g.moveTo(x - stor * 0.35, y + stor * 0.35 - hopp); g.quadraticCurveTo(x, y + stor * 0.1 - hopp, x + stor * 0.35, y + stor * 0.35 - hopp); g.stroke();
      g.fillStyle = "#2b2118"; g.fillRect(x - 13, y - stor - 9 - hopp, 26, 4); g.fillStyle = "#e8553d"; g.fillRect(x - 12, y - stor - 8 - hopp, 24 * Math.max(0, f.liv / f.maks), 2);
    }
    for (const k of s.skudd) { g.strokeStyle = TFARGE[k.type][0]; g.lineWidth = k.type === "frys" ? 5 : 3; g.globalAlpha = Math.min(1, k.igjen / 0.1); g.beginPath(); g.moveTo(k.fra[0], k.fra[1] - 20); g.lineTo(...k.til); g.stroke(); g.globalAlpha = 1; }
    for (const p of poff) { p.t += 0.03; g.globalAlpha = Math.max(0, 1 - p.t); g.fillStyle = "#ffd84a"; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(p.x + Math.cos(k) * p.t * 26, p.y + Math.sin(k) * p.t * 26, 3.4, 0, 7); g.fill(); } g.globalAlpha = 1; }
    while (poff.length && poff[0].t >= 1) poff.shift();
  }
  const av = lokke((dt, naa) => {
    if (!slutt) {
      const r = V.vaktSteg(s, dt);
      s = r.tilstand;
      for (const h of r.hendelser) {
        if (h.type === "skudd" && naa - skuddLyd > 70) { skuddLyd = naa; lyd("tarnSkudd", h.tarn); }
        if (h.type === "dod") { poff.push({ x: h.p[0], y: h.p[1], t: 0 }); lyd("fiendeDod"); }
        if (h.type === "slapp") lyd("slapp");
      }
    }
    settTekst(venstre, `${s.penger} kr · ♥ ${s.liv}`);
    const { bolger } = V.VAKT_NIVA[niva - 1];
    settTekst(hoyre, `Bølge ${s.bolge} av ${bolger}`);
    bolgeKnapp.disabled = Boolean(s.ferdig) || s.ko.length > 0 || s.fiender.length > 0 || s.bolge >= bolger;
    tegnPanel();
    tegn(naa);
    if (s.ferdig && !slutt) { slutt = true; ferdig(s.ferdig === "vunnet", s.ferdig === "vunnet" ? `Grisen er trygg med ${s.liv} liv igjen.` : `Regningene tok grisen i bølge ${s.bolge}.`); }
  });
  return () => { slutt = true; av(); };
}
