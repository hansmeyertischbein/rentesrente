// Skjermen til Limonadeboden. Reglene ligger i /lib/mini-bod.js.
import * as L from "/lib/mini-bod.js";
import { formaterTall } from "/lib/format.js";
import { FIGURER } from "./klikker-figurer.js";
import { lag, settTekst, settAttr, rolig } from "./overfor-felles.js";
import { spill } from "./lyd.js";

const K = "#2b2118", KUNDER = ["geitan", "lilledalen", "fredriksjo", "lokke", "blitzoe", "mittelfart"];
const s = (inn, boks = "0 0 32 32") => `<svg viewBox="${boks}" aria-hidden="true"><g stroke="${K}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">${inn}</g></svg>`;
const TING = {
  sitron: ["Sitron", "#ffe25a", s('<circle cx="16" cy="16" r="12" fill="#ffe25a"/><circle cx="16" cy="16" r="9" fill="#fff6b8" stroke-width="1.2"/><path d="M16 7v18M7 16h18M9.6 9.6l12.8 12.8M22.4 9.6L9.6 22.4" stroke="#e0b800" stroke-width="1.3"/>')],
  jordbaer: ["Jordbær", "#ff7f9a", s('<path d="M16 29C7 25 4 16 8 11q8-4 16 0c4 5 1 14-8 18z" fill="#f0486c"/><path d="M8 11q4-5 8-4 4-1 8 4-4 2-8 0-4 2-8 0z" fill="#5fae4a"/><path d="M12 16v1M19 15v1M15 20v1M20 20v1M16 25v1" stroke="#ffe0a0"/>')],
  blaabaer: ["Blåbær", "#8c7bf0", s('<circle cx="11" cy="18" r="8" fill="#5a48c8"/><circle cx="21" cy="19" r="8" fill="#6f5ce0"/><circle cx="16" cy="11" r="7" fill="#7d6bf0"/><path d="M14 9l2 2 2-2M9 16l2 2 2-2M19 17l2 2 2-2" fill="none" stroke="#2c2170"/>')],
  mynte: ["Mynte", "#86dca6", s('<path d="M16 29V15" fill="none"/><path d="M16 17C5 17 4 8 5 4c8 0 12 5 11 13z" fill="#5cc487"/><path d="M16 17c11 0 12-9 11-13-8 0-12 5-11 13z" fill="#3fa66b"/><path d="M8 7l8 10M24 7l-8 10" fill="none" stroke-width="1.1"/>')],
  is: ["Is", "#d6f1ff", s('<path d="M5 12l10-6 12 4-1 12-10 6-11-4z" fill="#d6f1ff"/><path d="M5 12l11 4 11-6M16 16v12" fill="none" stroke-width="1.3"/><path d="M9 15l4 1.5" stroke="#fff" stroke-width="2"/>')],
  sugeror: ["Sugerør", "#ffd1cb", s('<path d="M20 4l-4-1-5 25" fill="none" stroke-width="6"/><path d="M20 4l-4-1-5 25" fill="none" stroke="#f0554a" stroke-width="3"/><path d="M14.5 9l3 .7M13.4 14.500l3 .7M12.4 20l3 .7" stroke="#fff" stroke-width="1.6"/>')],
  paraply: ["Paraply", "#e6d0ff", s('<path d="M16 14v15" fill="none"/><path d="M3 15C5 5 27 5 29 15q-4-3-6.5 0-3-3-6.5 0-3.5-3-6.5 0-3-3-6.5 0z" fill="#a86fe0"/><path d="M9.5 15C10 9 13 6 16 6s6 3 6.5 9" fill="none" stroke-width="1.2"/>')],
  sukker: ["Sukker", "#fff", s('<path d="M6 10h20l-2 18H8z" fill="#fff"/><path d="M6 10q10-8 20 0" fill="#f3f3f3"/><circle cx="12" cy="17" r="1" fill="#cbb" stroke="none"/><circle cx="18" cy="20" r="1" fill="#cbb" stroke="none"/><circle cx="14" cy="24" r="1" fill="#cbb" stroke="none"/><path d="M4 10h24" />')],
};
const VAERIKON = {
  sol: s('<circle cx="16" cy="16" r="7" fill="#ffd84a"/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M7 7l3 3M22 22l3 3M25 7l-3 3M10 22l-3 3" stroke-width="2.4"/>'),
  sky: s('<circle cx="22" cy="10" r="6" fill="#ffd84a"/><path d="M6 25a6 6 0 0 1 1-12 8 8 0 0 1 15 1 5.5 5.5 0 0 1 2 11z" fill="#fff"/>'),
  regn: s('<path d="M6 20a6 6 0 0 1 1-12 8 8 0 0 1 15 1 5.5 5.5 0 0 1 2 11z" fill="#b9c9d8"/><path d="M10 23l-1 5M16 23l-1 5M22 23l-1 5" stroke="#3b7fd0" stroke-width="2.4"/>'),
};
const MAAKE = s('<path d="M4 20q8-14 16-4 8-9 20-1-10 0-15 8-9 3-21-3z" fill="#fff"/><path d="M20 16q8-9 20-1-8-1-13 4z" fill="#b9c3cf"/><path d="M4 20l-4 2 5 2z" fill="#f2a93b"/><circle cx="8" cy="19" r="1.2" fill="#2b2118"/>', "-2 4 46 24");
const VEPS = s('<ellipse cx="12" cy="10" rx="6" ry="4" fill="#fff" fill-opacity=".8"/><ellipse cx="20" cy="9" rx="6" ry="4" fill="#fff" fill-opacity=".8"/><ellipse cx="16" cy="18" rx="10" ry="7" fill="#ffd84a"/><path d="M12 12v12M17 11v14M22 13v10" stroke-width="2.6"/><circle cx="8" cy="17" r="1.2" fill="#2b2118"/><path d="M26 18l4 1" />');
const blandet = (frukt) => {
  const rgb = { sitron: [255, 226, 90], jordbaer: [245, 110, 140], blaabaer: [126, 108, 236], mynte: [110, 214, 150] };
  let n = 0, c = [0, 0, 0];
  for (const [f, k] of Object.entries(frukt)) { n += k; c = c.map((v, i) => v + rgb[f][i] * k); }
  return n ? `rgb(${c.map((v) => Math.round(v / n)).join(" ")})` : "#dff1f7";
};

/** Bestillingen i snakkeboblen: frukt, is, hvor høyt det skal fylles, og pynt. */
function ordreKode(o) {
  const del = (id, n) => `<span class="b-del">${TING[id][2]}${n > 1 ? `<b>${n}</b>` : ""}</span>`;
  const strek = `<span class="b-del"><svg viewBox="0 0 24 32" aria-hidden="true"><path d="M3 3h18l-2.5 26h-13z" fill="#fff" stroke="${K}" stroke-width="2"/><path d="M${4.8 + (1 - o.strek) * -1.6} ${29 - 26 * o.strek}h${14.4}l-2 ${26 * o.strek - 2}h-10.500z" fill="#8fd0f2"/><path d="M1 ${29 - 26 * o.strek}h22" stroke="#e8352e" stroke-width="2.6"/></svg></span>`;
  return Object.entries(o.frukt).map(([f, n]) => del(f, n)).join("") + (o.is ? del("is", o.is) : "") + strek + (o.pynt ? del(o.pynt, 1) : "");
}
const ordreTekst = (o) => [...Object.entries(o.frukt).map(([f, n]) => `${n} ${TING[f][0].toLowerCase()}`), o.is ? `${o.is} is` : "uten is", `fyll ${["lavt", "middels", "høyt"][L.BOD.streker.indexOf(o.strek)]}`, o.pynt ? TING[o.pynt][0].toLowerCase() : "uten pynt"].join(", ");

export function limonadeboden(rot, niva, { ferdig, lyd, api }) {
  let rydd = () => {};
  const bod = api.hent().bod, vaer = L.lagVaer(), grei = L.greiPris(vaer, bod), mal = L.malFor(niva, vaer);
  // Før boden åpner: se på været og sett prisen.
  const plan = lag(`<div class="bod-plan"><div class="bod-vaer v-${vaer.id}"><span>${VAERIKON[vaer.id]}</span><b>${vaer.navn}, ${vaer.grader}°</b></div><label class="bod-pris"><span>Pris per glass</span><b></b><input type="range" min="${L.BOD.prisFra}" max="${L.BOD.prisTil}" step="1" value="20"></label><div class="bod-strom" role="status"><i></i><i></i><i></i><i></i><i></i><span></span></div><p class="kort-info">Press frukten kunden vil ha, legg i is, hell til den røde streken, og pynt. Trykk på kunden eller dra glasset dit.</p><p class="kort-info">Målet i dag: <b>${formaterTall(mal)} kr</b></p><button type="button" class="oppgrader"><span class="oppgrader-navn">Åpne boden</span></button></div>`);
  const skyv = plan.querySelector("input"), pl = plan.querySelector(".bod-pris b"), strom = plan.querySelector(".bod-strom");
  const visPris = () => {
    const pris = Number(skyv.value), k = L.kundestrom(pris, vaer, bod), n = k > 1.2 ? 5 : k > 0.95 ? 4 : k > 0.7 ? 3 : k > 0.45 ? 2 : 1;
    settTekst(pl, `${pris} kr`);
    strom.querySelectorAll("i").forEach((x, i) => x.classList.toggle("pa", i < n));
    settTekst(strom.querySelector("span"), ["Nesten ingen kunder", "Få kunder", "Noen kunder", "Mange kunder", "Lang kø"][n - 1]);
  };
  skyv.value = String(Math.max(L.BOD.prisFra, grei - 4));
  skyv.addEventListener("input", visPris);
  plan.querySelector("button").addEventListener("click", () => { lyd("bodApner"); plan.remove(); rydd = aapne(Number(skyv.value)); });
  rot.append(plan);
  visPris();

  function aapne(pris) {
    const fruktslag = L.BOD.frukt.slice(0, L.BOD.antallFrukt[niva - 1]), pyntslag = L.BOD.pynt.slice(0, L.BOD.antallPynt[niva - 1]);
    let d = L.lagDag(niva, bod, pris, vaer), slutt = false, kranUr = 0;
    rot.append(lag('<p class="mini-linje"><b></b><span></span></p>'), lag('<div class="mini-mal"><i></i></div>'),
      lag(`<div class="b-scene v-${vaer.id}"><div class="b-himmel"><span class="b-sol">${VAERIKON[vaer.id]}</span></div><div class="b-tak"></div>${bod.opp.parasoll ? '<span class="b-parasoll"></span>' : ""}${bod.opp.skilt ? '<span class="b-skilt">LIMONADE</span>' : ""}<ol class="b-ko"></ol><div class="b-disk"><span class="b-krukke"><b>0</b> kr</span><span class="b-glass" tabindex="-1"><svg viewBox="0 0 80 104" aria-hidden="true"></svg></span>${bod.opp.katt ? `<span class="b-katt">${s('<path d="M6 30V17L4 6l7 5h10l7-5-2 11v13z" fill="#f0a35a"/><path d="M11 17v1M21 17v1" stroke-width="3"/><path d="M14 22l2 2 2-2M4 20l6 1M28 20l-6 1" fill="none" stroke-width="1.3"/>')}</span>` : ""}<span class="b-rekke" hidden></span></div></div>`),
      lag('<div class="b-benk"><div class="b-rad b-frukt"></div><div class="b-rad b-pynt"></div><div class="b-rad b-hell"><button type="button" class="b-tom">Tøm glasset</button><button type="button" class="b-kran"><b>Hold for å helle</b></button></div></div>'));
    const q = (k) => rot.querySelector(k), [salg, tid] = q(".mini-linje").children, strek = q(".mini-mal i"), ko = q(".b-ko"), glass = q(".b-glass"), gl = glass.firstChild, scene = q(".b-scene"), krukke = q(".b-krukke b"), rekke = q(".b-rekke"), kran = q(".b-kran");
    const noder = new Map();
    let maake = null, glassNokkel = "";
    const trykk = (b, gjor) => { b.addEventListener("pointerdown", (e) => { if (e.isTrusted) gjor(); }); b.addEventListener("click", (e) => { if (e.detail === 0 && e.isTrusted) gjor(); }); };
    const knapp = (id, kl, tast) => { const [navn, farge, ikon] = TING[id], b = lag(`<button type="button" class="b-knapp" style="--k:${farge}">${ikon}<span></span><kbd>${tast}</kbd></button>`); b.querySelector("span").textContent = navn; trykk(b, kl); return b; };
    const gjorPress = (f) => { const ny = L.press(d, f); if (ny === d) return; d = ny; lyd("press"); drypp(f); };
    const gjorIs = () => { const ny = L.leggIs(d); if (ny === d) return; d = ny; lyd("isbit"); hopp(); };
    const gjorPynt = (id) => { const ny = L.pynt(d, id); if (ny === d) return; d = ny; lyd("pynt"); hopp(); };
    const gjorTom = () => { d = L.tomGlass(d); lyd("tomGlass"); };
    const settHell = (paa) => { const ny = L.hell(d, paa); if (ny === d) return; d = ny; kran.classList.toggle("paa", paa); if (!paa) lyd("pynt"); };
    q(".b-frukt").append(...fruktslag.map((f, i) => knapp(f, () => gjorPress(f), i + 1)), knapp("is", gjorIs, "i"));
    q(".b-pynt").append(...pyntslag.map((p, i) => knapp(p, () => gjorPynt(p), "qwe"[i])));
    q(".b-tom").addEventListener("click", gjorTom);
    kran.addEventListener("pointerdown", (e) => { if (!e.isTrusted) return; e.preventDefault(); kran.setPointerCapture(e.pointerId); settHell(true); });
    for (const h of ["pointerup", "pointercancel", "lostpointercapture"]) kran.addEventListener(h, () => settHell(false));
    kran.addEventListener("contextmenu", (e) => e.preventDefault());

    function hopp() { if (!rolig.matches) gl.animate([{ transform: "translateY(0) scale(1)" }, { transform: "translateY(2px) scale(1.05, 0.95)" }, { transform: "translateY(0) scale(1)" }], { duration: 190, easing: "ease-out" }); }
    function drypp(f) {
      hopp();
      if (rolig.matches) return;
      for (let i = 0; i < 5; i++) { const p = lag(`<i class="b-drape" style="background:${TING[f][1]}"></i>`); glass.append(p); p.animate([{ transform: `translate(${(Math.random() - 0.5) * 30}px, -34px) scale(1)`, opacity: 1 }, { transform: `translate(${(Math.random() - 0.5) * 12}px, 22px) scale(0.6)`, opacity: 0.4 }], { duration: 260 + i * 40, easing: "ease-in" }).finished.then(() => p.remove(), () => p.remove()); }
    }
    function svev(tekst, klasse, x) { const p = lag(`<span class="b-svev ${klasse}"></span>`); p.textContent = tekst; p.style.left = x; scene.append(p); p.animate([{ transform: "translate(-50%, 0)", opacity: 1 }, { transform: "translate(-50%, -60px)", opacity: 0 }], { duration: 1100, easing: "ease-out" }).finished.then(() => p.remove(), () => p.remove()); }
    function gi(id) {
      const k = d.ko.find((x) => x.id === id);
      if (!k || slutt) return;
      if (k.veps) { d = L.jagVeps(d, id); lyd("jag"); return; }
      const r = L.server(d, id);
      if (!r.resultat) { lyd("feil"); svev("Fyll glasset først", "dempet", `${[22, 50, 78][k.plass]}%`); return; }
      d = r.tilstand;
      const x = `${[22, 50, 78][k.plass]}%`;
      if (!r.resultat.riktig) { lyd("feil"); svev("Feil bestilling!", "feil", x); noder.get(id)?.animate([{ translate: "0" }, { translate: "-7px" }, { translate: "7px" }, { translate: "0" }], { duration: 260 }); return; }
      lyd(r.resultat.perfekt ? "perfekt" : "kasse", d.rekke);
      svev(`+${r.resultat.belop} kr${r.resultat.perfekt ? " Perfekt!" : r.resultat.q > 0.75 ? " Godt" : " Tja"}`, r.resultat.perfekt ? "perfekt" : "", x);
      if (!rolig.matches) krukke.parentNode.animate([{ transform: "scale(1)" }, { transform: "scale(1.15)" }, { transform: "scale(1)" }], { duration: 260 });
    }
    // Glasset kan også dras til kunden.
    let drag = null;
    glass.addEventListener("pointerdown", (e) => { if (!e.isTrusted) return; e.preventDefault(); drag = [e.clientX, e.clientY]; glass.setPointerCapture(e.pointerId); glass.classList.add("dras"); });
    glass.addEventListener("pointermove", (e) => { if (drag) glass.style.transform = `translate(${e.clientX - drag[0]}px, ${e.clientY - drag[1]}px)`; });
    const slipp = (e) => {
      if (!drag) return;
      const flyttet = Math.hypot(e.clientX - drag[0], e.clientY - drag[1]);
      drag = null; glass.style.transform = ""; glass.classList.remove("dras");
      if (flyttet < 12 || e.type !== "pointerup") return;
      let best = null, bd = 95;
      for (const [id, n] of noder) { const b = n.getBoundingClientRect(), a = Math.hypot(e.clientX - b.left - b.width / 2, e.clientY - b.top - b.height / 2); if (a < bd) { bd = a; best = id; } }
      if (best !== null) gi(best);
    };
    glass.addEventListener("pointerup", slipp); glass.addEventListener("pointercancel", slipp);

    function tegnGlass() {
      const g = d.glass, nokkel = `${JSON.stringify(g.frukt)}:${g.is}:${g.fyll.toFixed(3)}:${g.pynt}:${d.heller}:${g.solt}`;
      if (nokkel === glassNokkel) return;
      glassNokkel = nokkel;
      const yt = (u) => 98 - 88 * u, br = (u) => 22 + 9 * u, f = Math.max(g.fyll, g.press ? 0.07 + 0.015 * g.press : 0), c = blandet(g.frukt), yy = yt(f);
      let ut = `<defs><linearGradient id="bg" x1="0" x2="1"><stop stop-color="#fff" stop-opacity=".55"/><stop offset=".3" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#fff" stop-opacity=".3"/></linearGradient></defs>`;
      if (d.heller) ut += `<path d="M40 -8V${yy}" stroke="#bfe6f7" stroke-width="7" stroke-linecap="round"/><path d="M40 -8V${yy}" stroke="#fff" stroke-width="2" stroke-dasharray="6 7"/>`;
      ut += `<path d="M8 8h64l-9 92H17z" fill="#fff" fill-opacity=".45" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>`;
      if (f > 0) ut += `<path d="M${40 - br(f)} ${yy}h${2 * br(f)}L${40 + 21.5} 98H${40 - 21.5}z" fill="${c}" fill-opacity="${g.fyll > 0 ? 0.88 : 1}"/><ellipse cx="40" cy="${yy}" rx="${br(f)}" ry="3.6" fill="${c}" stroke="#fff" stroke-opacity=".7" stroke-width="1.4"/>`;
      for (let i = 0; i < g.is; i++) { const iy = f > 0.25 ? yy + 3 + (i % 2) * 11 : 84 - Math.floor(i / 2) * 15, ix = 26 + (i * 15) % 34; ut += `<rect x="${ix - 7}" y="${iy - 6}" width="14" height="13" rx="3" transform="rotate(${i * 23 - 20} ${ix} ${iy})" fill="#eafaff" fill-opacity=".9" stroke="#8fc7de" stroke-width="1.5"/>`; }
      for (const u of L.BOD.streker) ut += `<path d="M${40 - br(u) - 3} ${yt(u)}h9M${40 + br(u) - 6} ${yt(u)}h9" stroke="#e8352e" stroke-width="2.4" stroke-linecap="round"/>`;
      if (g.pynt === "sugeror") ut += `<path d="M50 88L62 -2l10-3" fill="none" stroke="${K}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/><path d="M50 88L62 -2l10-3" fill="none" stroke="#f0554a" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/>`;
      if (g.pynt === "paraply") ut += `<path d="M22 46L18 -2" stroke="${K}" stroke-width="2.4"/><path d="M-4 8C-2 -10 34 -14 40 2q-7-3-10 2-6-5-11 0-6-5-11 1-6-3-12 3z" fill="#a86fe0" stroke="${K}" stroke-width="2"/>`;
      if (g.pynt === "sukker") ut += `<path d="M7 8h66" stroke="#fff" stroke-width="7" stroke-linecap="round"/><path d="M9 7h62" stroke="#d9d4ea" stroke-width="3" stroke-dasharray="1 5" stroke-linecap="round"/>`;
      if (g.solt) ut += `<path d="M4 102q36 8 72 0" stroke="${c}" stroke-width="6" stroke-linecap="round" fill="none"/>`;
      gl.innerHTML = ut + '<path d="M8 8h64l-9 92H17z" fill="url(#bg)"/>';
    }
    function tegn() {
      settTekst(salg, `${formaterTall(d.salg)} av ${formaterTall(mal)} kr`);
      settTekst(tid, d.tid > 0 ? `Stenger om ${Math.ceil(d.tid)} sek` : "Stengt");
      settTekst(krukke, formaterTall(d.salg));
      strek.style.transform = `scaleX(${Math.min(1, d.salg / mal).toFixed(3)})`;
      rekke.hidden = d.rekke < 2; settTekst(rekke, `${d.rekke} perfekte på rad`);
      for (const [id, n] of noder) if (!d.ko.some((k) => k.id === id)) { noder.delete(id); n.classList.add("gar"); setTimeout(() => n.remove(), 320); }
      for (const k of d.ko) {
        let n = noder.get(k.id);
        if (!n) {
          n = lag(`<li class="b-kunde p${k.plass}"><button type="button"><span class="b-boble">${ordreKode(k.ordre)}</span><span class="b-ansikt">${FIGURER[KUNDER[k.person]].svg}</span><span class="b-taalmod"><i></i></span><span class="b-veps" hidden>${VEPS}</span></button></li>`);
          settAttr(n.firstChild, "aria-label", `Server: ${ordreTekst(k.ordre)}`);
          trykk(n.firstChild, () => gi(k.id));
          noder.set(k.id, n); ko.append(n);
        }
        const a = Math.max(0, k.igjen / k.tid);
        n.querySelector(".b-taalmod i").style.transform = `scaleX(${a.toFixed(3)})`;
        n.classList.toggle("sur", a < 0.35); n.classList.toggle("midt", a >= 0.35 && a < 0.65);
        n.querySelector(".b-veps").hidden = !k.veps;
      }
      if (d.maake && !maake) {
        maake = lag(`<button type="button" class="b-maake" aria-label="Jag måka">${MAAKE}</button>`);
        const snu = d.maake.side < 0;
        trykk(maake, () => { d = L.jagMaake(d); lyd("jag"); svev("Husj!", "dempet", "50%"); });
        scene.append(maake);
        maake.animate([{ transform: `translate(${snu ? "-60px" : "calc(100cqw + 10px)"}, 20px) scaleX(${snu ? -1 : 1})` }, { transform: `translate(${snu ? "calc(50cqw - 70px)" : "calc(50cqw - 10px)"}, 150px) scaleX(${snu ? -1 : 1})` }], { duration: d.maake.igjen * 1000, easing: "ease-in-out", fill: "forwards" });
      } else if (!d.maake && maake) { const m = maake; maake = null; m.animate([{ opacity: 1 }, { opacity: 0, translate: "0 -90px" }], { duration: 300, fill: "forwards" }).finished.then(() => m.remove(), () => m.remove()); }
      tegnGlass();
    }
    let sist = performance.now(), ramme = requestAnimationFrame(function bilde(naa) {
      ramme = requestAnimationFrame(bilde);
      const dt = Math.min(0.1, (naa - sist) / 1000);
      sist = naa;
      if (document.hidden || slutt) return;
      const r = L.dagSteg(d, dt);
      d = r.tilstand;
      if (d.heller && (kranUr -= dt) <= 0) { kranUr = 0.09; lyd("kran", d.glass.fyll); }
      for (const h of r.hendelser) {
        if (h === "kom") lyd("kunde"); if (h === "gikk") lyd("kundeGikk"); if (h === "maake") lyd("maake"); if (h === "veps") lyd("veps");
        if (h === "sol") { lyd("sol"); kran.classList.remove("paa"); svev("Oi, det rant over", "feil", "50%"); }
        if (h.type === "stjal") { lyd("feil"); svev(`Måka tok ${h.tap} kr`, "feil", "50%"); }
      }
      tegn();
      if (d.tid <= 0) {
        slutt = true;
        const t = api.hent();   // pengene beholdes uansett, så boden kan bli bedre
        api.sett({ ...t, bod: { ...t.bod, penger: t.bod.penger + d.salg } });
        const klart = L.dagKlart(d);
        ferdig(klart, `${d.servert} glass solgt, ${d.gikk} gikk. Du solgte for ${formaterTall(d.salg)} av ${formaterTall(mal)} kr.${klart ? " Bodene dine gir mer utbytte for godt." : " Bruk pengene på boden, og prøv igjen."}`);
      }
    });
    const tastNed = (e) => {
      if (slutt || e.ctrlKey || e.metaKey) return;
      const t = e.key.toLowerCase();
      if (t === " ") { e.preventDefault(); if (!e.repeat) settHell(true); return; }
      if (e.repeat) return;
      if (fruktslag[Number(t) - 1]) gjorPress(fruktslag[Number(t) - 1]);
      else if (t === "i") gjorIs();
      else if ("qwe".includes(t) && pyntslag["qwe".indexOf(t)]) gjorPynt(pyntslag["qwe".indexOf(t)]);
      else if (t === "x") gjorTom();
      else if ("asd".includes(t)) { const k = d.ko.find((x) => x.plass === "asd".indexOf(t)); if (k) gi(k.id); }
    };
    const tastOpp = (e) => { if (e.key === " ") settHell(false); };
    document.addEventListener("keydown", tastNed); document.addEventListener("keyup", tastOpp);
    tegn();
    return () => { slutt = true; cancelAnimationFrame(ramme); document.removeEventListener("keydown", tastNed); document.removeEventListener("keyup", tastOpp); };
  }
  return () => rydd();
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
