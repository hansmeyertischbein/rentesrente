// Grensesnittet for spillet «Tjue år».
// Reglene ligger i /lib/spill.js og er testet der. Denne filen leser valgene, tegner myntene og forteller hva som skjedde.
// Fjordblått er det du har satt inn, multegult er det pengene har tjent. Én mynt er 10 000 kr.

import { REGLER, ROBOTER, dagensFro, fordel, grenser, lagSpill, nyTilstand, sluttverdi, spillAar, spillRobot, utsyn } from "/lib/spill.js";
import { formaterKr, formaterProsent, formaterTall } from "/lib/format.js";

const satser = JSON.parse(document.getElementById("satser").textContent);
const rolig = matchMedia("(prefers-reduced-motion: reduce)");
const $ = (id) => document.getElementById(id);
const MINUS = "−", NBSP = " ";
const kr = formaterKr;
const medFortegn = (x) => (x > 0 ? "+" : "") + formaterKr(x);
const prosentTekst = (p) => (p > 0 ? "+" : p < 0 ? MINUS : "") + Math.abs(p) + NBSP + "%";
const klem = (x, a, b) => Math.min(b, Math.max(a, x));
const lett = (t) => 1 - Math.pow(1 - t, 3);

// ---------- Brettet: myntene på konto og i fond ----------

function lesFarger() {
  const s = getComputedStyle(document.documentElement);
  const v = (n, reserve) => s.getPropertyValue(n).trim() || reserve;
  return { fjord: v("--fjord", "#2A6FA8"), multe: v("--multe", "#B07600"), rute: v("--rule", "#D7DDD5"), feil: v("--error", "#A8321F") };
}

// En mynt sett fra siden, med lys kant øverst og mørkere kant nederst. Samme tegning som på forsiden.
function lagMynt(farge, b, h, dpr) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(b * dpr)); c.height = Math.max(1, Math.round(h * dpr));
  const x = c.getContext("2d");
  x.scale(dpr, dpr);
  const r = Math.min(h / 2, 3);
  x.fillStyle = farge;
  x.beginPath(); x.roundRect(0, 0, b, h, r); x.fill();
  x.fillStyle = "rgb(255 255 255 / 0.32)"; x.fillRect(r, 0.5, b - 2 * r, Math.max(1, h * 0.22));
  x.fillStyle = "rgb(0 0 0 / 0.18)"; x.fillRect(r, h - Math.max(1, h * 0.18), b - 2 * r, Math.max(1, h * 0.18));
  return c;
}

function lagBrett(lerret) {
  const ctx = lerret.getContext("2d");
  const DELING = 0.34, LUFT = 2, BMAKS = 26, BUNN = 6;
  let W = 0, H = 0, dpr = 1, b = BMAKS, hh = 7, rader = 10;
  let farger = lesFarger(), sprites = {};
  let mynter = [], ute = [], gjeld = 0, ramme = 0, synlig = true, teller = 0;

  const start = (sone) => (sone === "konto" ? 0 : Math.round(W * DELING));
  const bredde = (sone) => (sone === "konto" ? Math.round(W * DELING) - 16 : W - Math.round(W * DELING));
  const plass = (sone, i) => ({ x: start(sone) + Math.floor(i / rader) * (b + LUFT), y: H - BUNN - ((i % rader) + 1) * (hh + 1) });
  const fargeTil = (m) => m.nyFarge || m.farge;
  const sprite = (farge) => (sprites[farge] ||= lagMynt(farge === "gul" ? farger.multe : farger.fjord, b, hh, dpr));
  const be = () => { if (!ramme && synlig) ramme = requestAnimationFrame(tegn); };

  // Størst mulig mynt som får plass i begge soner. Stablene er ti mynter høye så lenge det går, så høyere.
  function velgStorrelse() {
    const nK = Math.max(gjeld, mynter.filter((m) => m.sone === "konto").length);
    const nF = mynter.filter((m) => m.sone === "fond").length;
    const hoyde = H - BUNN - 8;
    let best = null;
    for (const R of [10, 20, 30, 40, 60]) {
      const kK = Math.max(1, Math.ceil(nK / R)), kF = Math.max(1, Math.ceil(nF / R));
      const bb = Math.floor(Math.min(BMAKS, bredde("konto") / kK - LUFT, bredde("fond") / kF - LUFT, (hoyde / R - 1) / 0.3));
      if (!best || bb > best.b) best = { b: bb, R };
    }
    const nyB = Math.max(4, best.b);
    if (nyB !== b || best.R !== rader) { b = nyB; hh = Math.max(2, Math.floor(b * 0.3)); rader = best.R; sprites = {}; }
  }

  // Hvor mynten er akkurat nå: på vei fra (x0, y0) til plassen sin.
  function tegnet(m, naa) {
    const p = plass(m.sone, m.i);
    const varighet = rolig.matches ? Math.min(150, m.varighet) : m.varighet;
    const t = varighet > 0 ? klem((naa - m.start) / varighet, 0, 1) : 1;
    if (m.nyFarge && t >= 0.5) { m.farge = m.nyFarge; m.nyFarge = null; }
    if (t >= 1) return { x: p.x, y: p.y, a: 1, s: 1, ro: true };
    const a = m.a0 + (1 - m.a0) * klem(t * 2.5, 0, 1);
    if (rolig.matches) return { x: p.x, y: p.y, a, s: 1, ro: false };
    const e = lett(t);
    return { x: m.x0 + (p.x - m.x0) * e, y: m.y0 + (p.y - m.y0) * e - m.bue * Math.sin(Math.PI * t), a, s: m.s0 + (1 - m.s0) * e, ro: false };
  }

  function tegnMynt(bilde, x, y, a, s, rot) {
    ctx.globalAlpha = a;
    if (s === 1 && !rot) { ctx.drawImage(bilde, x, y, b, hh); return; }
    ctx.save();
    ctx.translate(x + b / 2, y + hh / 2);
    if (rot) ctx.rotate(rot);
    ctx.scale(s, s);
    ctx.drawImage(bilde, -b / 2, -hh / 2, b, hh);
    ctx.restore();
  }

  function tegn(naa) {
    ramme = 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.fillStyle = farger.rute;
    for (const sone of ["konto", "fond"]) ctx.fillRect(start(sone), H - BUNN + 1, bredde(sone), 1);
    let aktiv = false;

    // Minus på konto: tomme omriss der myntene mangler.
    if (gjeld > 0) {
      ctx.strokeStyle = farger.feil; ctx.lineWidth = 1.25; ctx.setLineDash([3, 2]);
      for (let i = 0; i < gjeld; i++) {
        const p = plass("konto", i);
        ctx.beginPath(); ctx.roundRect(p.x + 0.5, p.y + 0.5, b - 1, hh - 1, Math.min(hh / 2, 3)); ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    for (const m of mynter) {
      const d = tegnet(m, naa);
      if (!d.ro) aktiv = true;
      if (d.a <= 0) continue;
      tegnMynt(sprite(m.farge), d.ro ? Math.round(d.x) : d.x, d.ro ? Math.round(d.y) : d.y, d.a, d.s, 0);
    }

    // Mynter på vei ut: skatt stiger opp, regninger trekkes ut til siden, tap faller av stabelen.
    for (const u of ute) {
      const p = klem((naa - u.start) / u.varighet, 0, 1);
      if (p >= 1) continue;
      aktiv = true;
      let x = u.x, y = u.y, rot = 0, s = 1;
      if (!rolig.matches) {
        if (u.stil === "skatt") y -= 46 * lett(p);
        else if (u.stil === "regning") x -= 34 * lett(p);
        else if (u.stil === "tap") { x += u.drift * p; y += 52 * p * p; rot = (u.drift / 28) * p; }
        else s = 1 - 0.1 * p;
      }
      tegnMynt(sprite(u.farge), x, y, 1 - p * p, s, rot);
    }
    ute = ute.filter((u) => naa < u.start + u.varighet);
    ctx.globalAlpha = 1;
    if (aktiv) be();
  }

  // Flytter brettet til et nytt mål. Mynter som forsvinner ett sted og dukker opp et annet, flyr mellom stablene.
  // maal: { konto: { blaa, gul }, fond: { blaa, gul }, gjeld }. stil: { inn: { blaa, gul }, ut: { konto, fond } }.
  function synk(maal, stil = {}) {
    const naa = performance.now(), stille = rolig.matches;
    const naaPos = new Map(mynter.map((m) => [m, tegnet(m, naa)]));
    const bort = [], inn = [];
    for (const sone of ["konto", "fond"]) for (const farge of ["blaa", "gul"]) {
      const gruppe = mynter.filter((m) => m.sone === sone && fargeTil(m) === farge).sort((x, y) => x.i - y.i);
      const diff = maal[sone][farge] - gruppe.length;
      if (diff < 0) bort.push(...gruppe.slice(diff));
      for (let k = 0; k < diff; k++) inn.push({ sone, farge });
    }

    // Først mynter som bare bytter farge der de ligger, så mynter som bytter stabel.
    const flyttet = new Set();
    for (const sammeSone of [true, false]) {
      for (let k = inn.length - 1; k >= 0; k--) {
        const onske = inn[k];
        const j = bort.findIndex((m) => (m.sone === onske.sone) === sammeSone);
        if (j < 0) continue;
        const m = bort.splice(j, 1)[0];
        if (sammeSone) { m.farge = onske.farge; m.nyFarge = null; }
        else { m.sone = onske.sone; m.nyFarge = onske.farge === m.farge ? null : onske.farge; m.i = 1e6 + teller++; flyttet.add(m); }
        inn.splice(k, 1);
      }
    }

    const utSteg = stille ? 0 : Math.min(30, 240 / Math.max(1, bort.length));
    bort.forEach((m, k) => {
      const d = naaPos.get(m);
      ute.push({ x: d.x, y: d.y, farge: m.farge, stil: (stil.ut && stil.ut[m.sone]) || "stille", start: naa + utSteg * k, varighet: stille ? 150 : 420, drift: 10 + Math.random() * 26 });
    });
    const borte = new Set(bort);
    mynter = mynter.filter((m) => !borte.has(m));
    for (const o of inn) mynter.push({ sone: o.sone, farge: o.farge, nyFarge: null, i: 1e6 + teller++, ny: true, varighet: 0, start: 0 });

    gjeld = maal.gjeld || 0;
    velgStorrelse();
    for (const sone of ["konto", "fond"]) {
      mynter.filter((m) => m.sone === sone)
        .sort((x, y) => (fargeTil(x) === fargeTil(y) ? x.i - y.i : fargeTil(x) === "blaa" ? -1 : 1))
        .forEach((m, i) => { m.i = i; });
    }

    const iFart = mynter.filter((m) => m.ny || flyttet.has(m)).length;
    const steg = stille ? 0 : Math.min(35, 280 / Math.max(1, iFart));
    let k = 0;
    for (const m of mynter) {
      const p = plass(m.sone, m.i);
      if (m.ny) {
        const slag = (stil.inn && stil.inn[m.farge]) || "pop";
        Object.assign(m, { x0: p.x, y0: slag === "slipp" ? p.y - 64 : p.y, a0: 0, s0: slag === "pop" ? 0.9 : 1, bue: 0, start: naa + steg * k++, varighet: slag === "slipp" ? 420 : 260, ny: false });
      } else if (flyttet.has(m)) {
        const d = naaPos.get(m);
        Object.assign(m, { x0: d.x, y0: d.y, a0: d.a, s0: d.s, bue: 24, start: naa + steg * k++, varighet: 460 });
      } else if (p.x !== m.mx || p.y !== m.my) {
        const d = naaPos.get(m);
        Object.assign(m, { x0: d.x, y0: d.y, a0: d.a, s0: d.s, bue: 0, start: naa, varighet: 320 });
      }
      m.mx = p.x; m.my = p.y;
    }
    be();
  }

  function maalOpp() {
    const r = lerret.getBoundingClientRect();
    const nyW = Math.round(r.width), nyH = Math.round(r.height), nyDpr = Math.min(2, window.devicePixelRatio || 1);
    if (nyW === W && nyH === H && nyDpr === dpr) return;
    W = nyW; H = nyH; dpr = nyDpr;
    lerret.width = Math.max(1, Math.round(W * dpr)); lerret.height = Math.max(1, Math.round(H * dpr));
    sprites = {};
    velgStorrelse();
    for (const m of mynter) { const p = plass(m.sone, m.i); m.mx = p.x; m.my = p.y; m.varighet = 0; }
    be();
  }

  maalOpp();
  new ResizeObserver(maalOpp).observe(lerret);
  new IntersectionObserver((treff) => { synlig = treff[0].isIntersecting; be(); }).observe(lerret);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { farger = lesFarger(); sprites = {}; be(); });

  return {
    synk,
    tom() { mynter = []; ute = []; gjeld = 0; be(); },
    hoppFram() { for (const m of mynter) m.varighet = 0; ute = []; be(); },
  };
}

// Hvor mange mynter av hver farge som skal ligge hvor.
function myntmaal(konto, kontoTjent, fond, kostpris) {
  const M = REGLER.mynt;
  const nK = Math.max(0, Math.round(konto / M));
  const kG = Math.min(nK, Math.max(0, Math.round(kontoTjent / M)));
  const nF = Math.max(0, Math.round(fond / M));
  const fB = Math.min(nF, Math.max(0, Math.round(kostpris / M)));
  return { konto: { blaa: nK - kG, gul: kG }, fond: { blaa: fB, gul: nF - fB }, gjeld: konto < 0 ? Math.max(1, Math.round(-konto / M)) : 0 };
}

// ---------- Spillet ----------

const el = {
  aarNaa: $("aar-naa"), froTekst: $("fro-tekst"), tidslinje: $("tidslinje"),
  tallKonto: $("tall-konto"), underKonto: $("under-konto"), tallFond: $("tall-fond"), underFond: $("under-fond"),
  utfall: $("utfall"), utfallTekst: $("utfall-tekst"),
  panel: $("panel"), aarstekst: $("aarstekst"), utsyn: $("utsyn"), valg: $("valg"),
  kursBoks: $("kurs-boks"), kurs: $("kurs"), kursTekst: $("kurs-tekst"), kursRegn: $("kurs-regn"),
  flytt: $("flytt"), flyttTekst: $("flytt-tekst"), flyttVarsel: $("flytt-varsel"),
  minusTi: $("minus-ti"), plussTi: $("pluss-ti"), altFond: $("alt-fond"), nullFlytt: $("null-flytt"), kjor: $("kjor"),
  slutt: $("slutt"), sluttSum: $("slutt-sum"), sluttSetning: $("slutt-setning"), stjerner: $("stjerner"), sluttDom: $("slutt-dom"),
  sammenlign: $("sammenlign"), sluttLaering: $("slutt-laering"), kopiert: $("kopiert"),
  loggBoks: $("logg-boks"), logg: $("logg"),
};
const UTFALLTEKST = el.utfallTekst.textContent;
const brett = lagBrett($("brett"));

let spill, t, valg, steg = 1000;
let opptatt = false, hopp = false, runde = 0, ventere = [];

function vent(ms) {
  if (hopp || rolig.matches || ms <= 0) return Promise.resolve();
  return new Promise((ferdig) => {
    const id = setTimeout(ferdig, ms);
    ventere.push(() => { clearTimeout(id); ferdig(); });
  });
}

function hoppFram() {
  hopp = true;
  const v = ventere; ventere = [];
  v.forEach((f) => f());
  brett.hoppFram();
}

function lesFro() {
  const m = /marked=(\d{1,10})/.exec(location.hash);
  const n = m ? Number(m[1]) : 0;
  return n > 0 && n <= 0xffffffff ? n : dagensFro();
}

function visTall(konto, fond, kostpris, underKonto, underFond) {
  el.tallKonto.textContent = kr(konto);
  el.tallKonto.classList.toggle("minus", konto < 0);
  el.underKonto.textContent = underKonto ?? (konto < 0 ? `I minus, ${formaterProsent(REGLER.minusrente)} rente` : `${formaterProsent(spill.kontorente * 100)} rente`);
  el.tallFond.textContent = kr(fond);
  const gevinst = fond - kostpris;
  el.underFond.textContent = underFond ?? (fond <= 0 ? "Svinger med markedet" : gevinst >= 0 ? `Satt inn ${kr(kostpris)}, tjent ${kr(gevinst)}` : `Satt inn ${kr(kostpris)}, tapt ${kr(-gevinst)}`);
}

function start(fro) {
  runde++;
  hoppFram();
  hopp = false; opptatt = false;
  spill = lagSpill(fro, satser);
  t = nyTilstand(spill);
  valg = { flytt: 0, kurs: false };
  el.froTekst.textContent = spill.fro === dagensFro() ? "Dagens marked" : `Marked nr. ${spill.fro}`;
  el.slutt.hidden = true; el.panel.hidden = false;
  el.logg.replaceChildren(); el.loggBoks.hidden = true; el.loggBoks.open = false;
  el.aarstekst.textContent = ""; el.kopiert.textContent = "";
  el.utfallTekst.textContent = UTFALLTEKST;
  for (const li of el.utfall.children) li.classList.remove("aktiv", "valgt");
  brett.tom();
  laasValg(false);
  visAar({ inn: { blaa: "slipp", gul: "pop" } });
}

function laasValg(laast) {
  for (const k of [el.flytt, el.kurs, el.minusTi, el.plussTi, el.altFond, el.nullFlytt]) k.disabled = laast;
}

function utsynRad(syn, naar) {
  const li = document.createElement("li");
  const a = document.createElement("span"); a.className = "utsyn-naar"; a.textContent = naar;
  const b = document.createElement("span"); b.className = "utsyn-hva";
  const regning = document.createElement("span");
  regning.textContent = syn.regning ? `${syn.regning.navn}, ${formaterTall(syn.regning.fra)} til ${kr(syn.regning.til)}` : "Ingen regning";
  if (!syn.regning) regning.className = "utsyn-ingen";
  b.append(regning);
  if (syn.tilbud) {
    const tilbud = document.createElement("span"); tilbud.className = "utsyn-tilbud";
    tilbud.textContent = `Tilbud: ${syn.tilbud.navn} for ${kr(syn.tilbud.pris)}`;
    b.append(tilbud);
  }
  li.append(a, b);
  return li;
}

function visAar(stil) {
  el.aarNaa.textContent = `År ${t.aar + 1}`;
  [...el.tidslinje.children].forEach((li, i) => { li.className = i < t.aar ? "ferdig" : i === t.aar ? "naa" : ""; });
  const syn = utsyn(spill, t);
  const naar = ["I år", "Neste år", "Om to år"];
  el.utsyn.replaceChildren(...syn.map((s, i) => utsynRad(s, naar[i])));
  const tilbud = syn[0].tilbud;
  el.kursBoks.hidden = !tilbud;
  el.kurs.checked = false;
  if (tilbud) {
    el.kursTekst.textContent = `Ta ${tilbud.navn.toLowerCase()} for ${kr(tilbud.pris)}`;
    el.kursRegn.textContent = `Gir ${kr(tilbud.tillegg)} mer til overs hvert år i ${tilbud.aarIgjen} år, ${kr(tilbud.tillegg * tilbud.aarIgjen)} til sammen.`;
  }
  el.kjor.textContent = `Kjør år ${t.aar + 1}`;
  oppdaterValg(stil);
}

function flyttTekst(f) {
  if (f.kjop > 0) return `Du kjøper fond for ${kr(f.kjop)}. ${kr(f.konto)} blir stående på konto.`;
  if (f.salg > 0) {
    return f.skatt > 0
      ? `Du selger fond for ${kr(f.salg)}. Skatten tar ${kr(f.skatt)}, og ${kr(f.salg - f.skatt)} kommer inn på konto.`
      : `Du selger fond for ${kr(f.salg)}. Det er ingen gevinst å skatte av, så hele beløpet kommer inn på konto.`;
  }
  return f.konto < 0 ? `Du flytter ingenting. Kontoen står ${kr(-f.konto)} i minus.` : `Du flytter ingenting. ${kr(f.konto)} står på konto.`;
}

// Viser valgene slik de står nå: skyveren, teksten, tallene og myntene.
function oppdaterValg(stil) {
  const g = grenser(spill, t, valg.kurs);
  steg = g.maksKjop + g.maksSalg > 400000 ? 5000 : 1000;
  const f = fordel(spill, t, valg);
  valg.flytt = f.flytt || 0;
  const min = -Math.ceil(g.maksSalg / steg), maks = Math.ceil(g.maksKjop / steg);
  el.flytt.min = String(min); el.flytt.max = String(maks); el.flytt.step = "1";
  el.flytt.value = String(f.flytt >= g.maksKjop && maks > 0 ? maks : f.flytt <= -g.maksSalg && min < 0 ? min : Math.round(f.flytt / steg));
  el.flytt.disabled = opptatt || min === maks;
  const tekst = flyttTekst(f);
  el.flyttTekst.textContent = tekst;
  el.flytt.setAttribute("aria-valuetext", tekst.split(". ")[0]);

  const regning = spill.regninger[t.aar] ? utsyn(spill, t)[0].regning : null;
  let varsel = "";
  if (f.konto < 0) varsel = `Kontoen går i minus. Minus koster ${formaterProsent(REGLER.minusrente)} i året.${f.fond > 0 ? " Du kan selge fra fondet for å dekke det." : ""}`;
  else if (regning && f.konto < regning.til) varsel = `Regningen i år kan bli opptil ${kr(regning.til)}. Det som mangler på konto, går i minus til ${formaterProsent(REGLER.minusrente)} rente.`;
  el.flyttVarsel.textContent = varsel;
  el.flyttVarsel.hidden = !varsel;

  visTall(f.konto, f.fond, f.kostpris);
  brett.synk(myntmaal(f.konto, f.kontoTjent, f.fond, f.kostpris), stil || { inn: { blaa: "pop", gul: "pop" }, ut: { konto: "regning", fond: "skatt" } });
}

// Markedet trekker: lyset løper over de tjue utfallene, bremser og stopper på årets utfall.
async function trekk(prosent, aar) {
  const brikker = [...el.utfall.children];
  for (const b of brikker) b.classList.remove("aktiv", "valgt");
  const like = brikker.map((b, i) => (Number(b.dataset.prosent) === prosent ? i : -1)).filter((i) => i >= 0);
  const maal = like[aar % like.length];
  const min = runde, n = 26;
  for (let k = 0; k < n - 1 && !hopp && !rolig.matches; k++) {
    const b = brikker[(((maal - (n - 1) + k) % brikker.length) + brikker.length) % brikker.length];
    b.classList.add("aktiv");
    await vent(16 + 150 * Math.pow(k / (n - 1), 4));
    b.classList.remove("aktiv");
    if (min !== runde) return;
  }
  brikker[maal].classList.add("valgt");
}

function fondsetning(h) {
  if (h.fondFor <= 0) return `Markedet ga ${prosentTekst(h.prosent)}, men du hadde ingenting i fondet.`;
  if (h.prosent === 0) return "Fondet sto stille.";
  return h.prosent > 0
    ? `Fondet steg ${formaterProsent(h.prosent)}, og du tjente ${kr(h.fondEndring)}.`
    : `Fondet falt ${formaterProsent(-h.prosent)}, og du tapte ${kr(-h.fondEndring)}.`;
}

function aarstekst(h) {
  const d = [];
  if (h.kurs) d.push(`Du tok ${h.kursnavn.toLowerCase()} for ${kr(h.kurspris)}.`);
  if (h.kjop > 0) d.push(`Du kjøpte fond for ${kr(h.kjop)}.`);
  if (h.salg > 0) d.push(h.skatt > 0 ? `Du solgte fond for ${kr(h.salg)} og betalte ${kr(h.skatt)} i skatt.` : `Du solgte fond for ${kr(h.salg)}.`);
  d.push(fondsetning(h));
  if (h.regning > 0) d.push(`Regning: ${h.regningnavn}, ${kr(h.regning)}.`);
  if (h.rente < 0) d.push(`Kontoen sto i minus, og det kostet ${kr(-h.rente)} i rente.`);
  else if (h.rente > 0) d.push(`Kontoen ga ${kr(h.rente)} i rente.`);
  if (h.inn > 0) d.push(`${kr(h.inn)} til overs kom inn på konto.`);
  return `År ${h.aar + 1}: ${d.join(" ")}`;
}

function leggTilLogg(h) {
  const tr = document.createElement("tr");
  const celler = [
    String(h.aar + 1),
    h.kjop > 0 ? medFortegn(h.kjop) : h.salg > 0 ? medFortegn(-h.salg) : kr(0),
    `${prosentTekst(h.prosent)} (${medFortegn(h.fondEndring)})`,
    [h.regning > 0 ? `${h.regningnavn} ${kr(h.regning)}` : "", h.kurs ? `${h.kursnavn} ${kr(h.kurspris)}` : ""].filter(Boolean).join(", ") || "Ingen",
    kr(h.kontoEtter),
    kr(h.fondEtter),
  ];
  celler.forEach((tekst, i) => {
    const c = document.createElement(i === 0 ? "th" : "td");
    if (i === 0) c.scope = "row";
    c.textContent = tekst;
    tr.append(c);
  });
  el.logg.append(tr);
  el.loggBoks.hidden = false;
}

// Ett år: markedet trekker, regningen kommer, renten legges til, og neste års penger kommer inn.
async function kjorAar() {
  opptatt = true; hopp = false; ventere = [];
  const min = runde;
  el.kjor.focus();
  laasValg(true);
  el.kjor.textContent = "Hopp fram";
  const f = fordel(spill, t, valg);
  const { tilstand: ny, hendelse: h } = spillAar(spill, t, valg);

  await trekk(h.prosent, h.aar);
  if (min !== runde) return;
  el.utfallTekst.textContent = `År ${h.aar + 1}: ${fondsetning(h)}`;
  visTall(f.konto, h.fondEtter, f.kostpris);
  brett.synk(myntmaal(f.konto, f.kontoTjent, h.fondEtter, f.kostpris), { inn: { blaa: "pop", gul: "pop" }, ut: { konto: "stille", fond: "tap" } });
  await vent(650);
  if (min !== runde) return;

  if (h.regning > 0) {
    visTall(h.kontoForRente, h.fondEtter, f.kostpris, `${h.regningnavn}: ${MINUS}${kr(h.regning)}`);
    brett.synk(myntmaal(h.kontoForRente, Math.min(Math.max(0, h.kontoForRente), f.kontoTjent), h.fondEtter, f.kostpris), { ut: { konto: "regning", fond: "tap" } });
    await vent(650);
    if (min !== runde) return;
  }

  t = ny;
  el.aarstekst.textContent = aarstekst(h);
  leggTilLogg(h);
  visTall(t.konto, t.fond, t.kostpris);
  brett.synk(myntmaal(t.konto, t.kontoTjent, t.fond, t.kostpris), { inn: { blaa: "slipp", gul: "pop" }, ut: { konto: "regning", fond: "tap" } });
  await vent(t.ferdig ? 700 : 450);
  if (min !== runde) return;

  opptatt = false; hopp = false;
  if (t.ferdig) { visSlutt(); return; }
  valg = { flytt: 0, kurs: false };
  laasValg(false);
  visAar({ inn: { blaa: "slipp", gul: "pop" }, ut: { konto: "regning", fond: "tap" } });
}

// ---------- Slutten ----------

function tellOpp(node, til) {
  if (rolig.matches) { node.textContent = kr(til); return; }
  const t0 = performance.now(), min = runde;
  const bilde = (naa) => {
    if (min !== runde) return;
    const p = klem((naa - t0) / 900, 0, 1);
    node.textContent = p < 1 ? kr(Math.round((til * lett(p)) / 1000) * 1000) : kr(til);
    if (p < 1) requestAnimationFrame(bilde);
  };
  requestAnimationFrame(bilde);
}

function merke(klasse) {
  const s = document.createElement("span");
  s.className = `hint-mynt ${klasse}`; s.setAttribute("aria-hidden", "true");
  return s;
}

function visSlutt() {
  const meg = sluttverdi(spill, t);
  const roboter = ROBOTER.map((r) => ({ navn: r.navn, regel: r.regel, sum: spillRobot(spill, r).slutt.sum }));
  const slaatt = roboter.filter((r) => meg.sum > r.sum);
  const foran = roboter.filter((r) => meg.sum <= r.sum).sort((a, b) => a.sum - b.sum)[0];

  [...el.tidslinje.children].forEach((li) => { li.className = "ferdig"; });
  el.aarNaa.textContent = "Ferdig";
  el.panel.hidden = true; el.slutt.hidden = false;
  el.kjor.textContent = "Ferdig";

  // Skatten på gevinsten som står i fondet, trekkes til slutt.
  visTall(t.konto, t.fond - meg.skatt, t.kostpris, undefined, meg.skatt > 0 ? `Etter ${kr(meg.skatt)} i skatt på gevinsten` : undefined);
  brett.synk(myntmaal(t.konto, t.kontoTjent, t.fond - meg.skatt, t.kostpris), { ut: { konto: "stille", fond: "skatt" } });

  tellOpp(el.sluttSum, meg.sum);
  el.sluttSetning.replaceChildren(
    "Du fikk ", merke("hint-blaa"), `${kr(meg.innsatt)} til overs gjennom tjue år og betalte ${kr(meg.betalt)} i regninger og kurs. Pengene ${meg.tjent >= 0 ? "tjente" : "tapte"} `,
    merke("hint-gul"), `${kr(Math.abs(meg.tjent))} etter skatt.`,
  );

  el.stjerner.classList.remove("inne");
  el.stjerner.setAttribute("aria-label", `${slaatt.length} av 3 stjerner`);
  el.stjerner.replaceChildren(...[0, 1, 2].map((i) => {
    const s = document.createElement("span");
    s.textContent = i < slaatt.length ? "★" : "☆";
    if (i >= slaatt.length) s.className = "av";
    s.style.transitionDelay = `${300 + i * 80}ms`;
    return s;
  }));

  const navn = slaatt.map((r) => r.navn);
  const dom = slaatt.length === 3 ? "Du slo alle tre robotene."
    : slaatt.length === 2 ? `Du slo ${navn[0]} og ${navn[1]}.`
    : slaatt.length === 1 ? `Du slo ${navn[0]}.`
    : "Robotene endte foran denne gangen.";
  el.sluttDom.textContent = foran ? `${dom} ${foran.navn} endte ${kr(foran.sum - meg.sum)} foran deg.` : dom;

  const kurs = t.logg.filter((h) => h.kurs).length;
  const rader = [{ navn: "Du", regel: `Dine valg. Du tok ${kurs} av 3 kurs.`, sum: meg.sum, du: true }, ...roboter].sort((a, b) => b.sum - a.sum);
  const storst = Math.max(1, ...rader.map((r) => r.sum));
  el.sammenlign.classList.remove("inne");
  el.sammenlign.replaceChildren(...rader.map((r, i) => {
    const li = document.createElement("li");
    if (r.du) li.className = "du";
    const n = document.createElement("span"); n.className = "sammenlign-navn"; n.textContent = r.navn;
    const v = document.createElement("span"); v.className = "sammenlign-verdi"; v.textContent = kr(r.sum);
    const strek = document.createElement("span"); strek.className = "sammenlign-strek"; strek.setAttribute("aria-hidden", "true");
    const fyll = document.createElement("i");
    fyll.style.setProperty("--andel", String(klem(r.sum / storst, 0, 1)));
    fyll.style.transitionDelay = `${200 + i * 70}ms`;
    strek.append(fyll);
    const regel = document.createElement("span"); regel.className = "sammenlign-regel"; regel.textContent = r.regel;
    li.append(n, v, strek, regel);
    return li;
  }));

  const minus = t.logg.reduce((s, h) => s + (h.rente < 0 ? -h.rente : 0), 0);
  const skatt = t.logg.reduce((s, h) => s + h.skatt, 0);
  const best = spill.marked.indexOf(Math.max(...spill.marked)), verst = spill.marked.indexOf(Math.min(...spill.marked));
  const laering = [minus > 0 ? `Minusrenten kostet deg ${kr(minus)}.` : "Kontoen gikk aldri i minus."];
  if (skatt > 0) laering.push(`Du betalte ${kr(skatt)} i skatt på salg underveis.`);
  if (meg.skatt > 0) laering.push(`Skatten på gevinsten som sto i fondet til slutt, ble ${kr(meg.skatt)}.`);
  laering.push(`Markedets beste år var år ${best + 1} med ${prosentTekst(spill.marked[best])}, og det dårligste var år ${verst + 1} med ${prosentTekst(spill.marked[verst])}.`);
  el.sluttLaering.textContent = laering.join(" ");

  requestAnimationFrame(() => requestAnimationFrame(() => { el.stjerner.classList.add("inne"); el.sammenlign.classList.add("inne"); }));
  el.slutt.focus({ preventScroll: true });
  el.slutt.scrollIntoView({ block: "nearest", behavior: rolig.matches ? "auto" : "smooth" });
}

// ---------- Hendelser ----------

el.valg.addEventListener("submit", (e) => {
  e.preventDefault();
  if (opptatt) hoppFram(); else if (!t.ferdig) kjorAar();
});

el.flytt.addEventListener("input", () => {
  const g = grenser(spill, t, valg.kurs);
  const v = Number(el.flytt.value), min = Number(el.flytt.min), maks = Number(el.flytt.max);
  valg.flytt = v >= maks ? g.maksKjop : v <= min ? -g.maksSalg : v * steg;
  oppdaterValg();
});
el.kurs.addEventListener("change", () => { valg.kurs = el.kurs.checked; oppdaterValg(); });
el.minusTi.addEventListener("click", () => { valg.flytt -= 10000; oppdaterValg(); });
el.plussTi.addEventListener("click", () => { valg.flytt += 10000; oppdaterValg(); });
el.altFond.addEventListener("click", () => { valg.flytt = grenser(spill, t, valg.kurs).maksKjop; oppdaterValg(); });
el.nullFlytt.addEventListener("click", () => { valg.flytt = 0; oppdaterValg(); });

function settFro(fro) {
  history.replaceState(null, "", `#marked=${fro}`);
  start(fro);
}
const nyttFro = () => 1 + Math.floor(Math.random() * 99999998);

// Midt i et spill må knappen trykkes to ganger, så ett feiltrykk ikke sletter tjue år.
function medBekreftelse(knapp, handling) {
  const tekst = knapp.textContent;
  let tid = 0;
  const nullstill = () => { clearTimeout(tid); delete knapp.dataset.klar; knapp.textContent = tekst; };
  knapp.addEventListener("click", () => {
    const midt = t.aar > 0 && !t.ferdig;
    if (!midt || knapp.dataset.klar) { nullstill(); handling(); return; }
    knapp.dataset.klar = "1";
    knapp.textContent = "Trykk en gang til for å bekrefte";
    tid = setTimeout(nullstill, 4000);
  });
}
medBekreftelse($("omstart"), () => start(spill.fro));
medBekreftelse($("nytt"), () => settFro(nyttFro()));
$("igjen").addEventListener("click", () => { start(spill.fro); el.kjor.focus(); });
$("nytt-slutt").addEventListener("click", () => { settFro(nyttFro()); el.kjor.focus(); });
$("kopier").addEventListener("click", async () => {
  const url = `${location.origin}${location.pathname}#marked=${spill.fro}`;
  try { await navigator.clipboard.writeText(url); el.kopiert.textContent = "Lenken er kopiert."; }
  catch { el.kopiert.textContent = url; }
});
addEventListener("hashchange", () => start(lesFro()));

start(lesFro());
