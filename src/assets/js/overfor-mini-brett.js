// Skjermene til Grisetoget, Vekslebanken, Krakkfeltet og Regnskapet. Reglene ligger i /lib/mini-brett.js.
import * as B from "/lib/mini-brett.js";
import { lagGris } from "./klikker-figurer.js";
import { lag, settTekst, rolig } from "./overfor-felles.js";

const PILER = { ArrowUp: "opp", ArrowDown: "ned", ArrowLeft: "venstre", ArrowRight: "hoyre", w: "opp", s: "ned", a: "venstre", d: "hoyre" };
/** Piltaster og sveip. Gir en funksjon som kobler fra. */
function styring(flate, gjor) {
  const tast = (e) => { const r = PILER[e.key] ?? PILER[e.key.toLowerCase?.()]; if (r && !e.ctrlKey && !e.metaKey) { e.preventDefault(); gjor(r); } };
  let fra = null;
  const ned = (e) => { fra = [e.clientX, e.clientY]; };
  const flytt = (e) => {
    if (!fra) return;
    const dx = e.clientX - fra[0], dy = e.clientY - fra[1];
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 26) return;
    gjor(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "hoyre" : "venstre") : dy > 0 ? "ned" : "opp");
    fra = [e.clientX, e.clientY];
  };
  const opp = () => { fra = null; };
  document.addEventListener("keydown", tast);
  flate.addEventListener("pointerdown", ned); flate.addEventListener("pointermove", flytt); flate.addEventListener("pointerup", opp); flate.addEventListener("pointercancel", opp);
  return () => document.removeEventListener("keydown", tast);
}
const svgBilde = (kode) => { const i = new Image(); i.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(kode.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ')); return i; };
export function skarpt(lerret, b, h) {
  const d = Math.min(2, devicePixelRatio || 1);
  lerret.width = b * d; lerret.height = h * d;
  const g = lerret.getContext("2d");
  g.setTransform(d, 0, 0, d, 0, 0);
  return g;
}

// ---------- Grisetoget ----------

export function grisetoget(rot, niva, { ferdig, lyd }) {
  const mal = B.TOG.mal[niva - 1], R = 28, S = R * B.TOG.n;
  rot.append(lag('<p class="mini-linje"><b></b><span>Piltaster eller sveip</span></p>'), lag('<canvas class="mini-lerret" tabindex="0" aria-label="Grisetoget"></canvas>'));
  const teller = rot.querySelector("b"), lerret = rot.querySelector("canvas"), g = skarpt(lerret, S, S);
  const gris = svgBilde(lagGris(null, "togris"));
  let s = B.lagTog(), forrige = s.tog, sist = performance.now(), i_gang = false, ramme = 0, slutt = false;
  const tegn = (naa) => {
    const u = i_gang && !rolig.matches ? Math.min(1, (naa - sist) / B.TOG.ms[niva - 1]) : 1;
    for (let x = 0; x < B.TOG.n; x++) for (let y = 0; y < B.TOG.n; y++) { g.fillStyle = (x + y) % 2 ? "#a9cf86" : "#b6d994"; g.fillRect(x * R, y * R, R, R); }
    if (s.mynt) {
      const [x, y] = s.mynt, k = 1 + 0.07 * Math.sin(naa / 180), cx = (x + 0.5) * R, cy = (y + 0.5) * R;
      const gr = g.createRadialGradient(cx - 3, cy - 4, 1, cx, cy, R * 0.45);
      gr.addColorStop(0, "#fff3b0"); gr.addColorStop(0.5, "#ffd84a"); gr.addColorStop(1, "#b87a10");
      g.fillStyle = gr; g.strokeStyle = "#7a4a06"; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R * 0.38 * k, 0, 7); g.fill(); g.stroke();
      g.fillStyle = "#6b3f00"; g.font = "900 11px Archivo, system-ui"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("kr", cx, cy + 1);
    }
    s.tog.map((p, i) => { const f = forrige[i] ?? forrige.at(-1); return [(f[0] + (p[0] - f[0]) * u + 0.5) * R, (f[1] + (p[1] - f[1]) * u + 0.5) * R, i]; }).reverse().forEach(([x, y, i]) => {
      if (i) {
        g.fillStyle = ["#e8553d", "#3b6fd8", "#f2a93b", "#8a4fc7"][i % 4]; g.strokeStyle = "#2b2118"; g.lineWidth = 2;
        g.beginPath(); g.roundRect(x - R * 0.38, y - R * 0.32, R * 0.76, R * 0.6, 6); g.fill(); g.stroke();
        g.fillStyle = "#ffd84a"; for (const o of [-6, 1, 7]) { g.beginPath(); g.arc(x + o, y - R * 0.28, 4, 0, 7); g.fill(); }
      } else {
        g.save(); g.translate(x, y); if (s.retning === "venstre") g.scale(-1, 1); if (s.retning === "opp") g.rotate(-0.5); if (s.retning === "ned") g.rotate(0.5);
        if (gris.complete) g.drawImage(gris, -R * 0.78, -R * 0.72, R * 1.56, R * 1.45);
        g.restore();
      }
    });
    if (!i_gang && !slutt) { g.fillStyle = "rgb(43 33 24 / 0.55)"; g.fillRect(0, 0, S, S); g.fillStyle = "#fffaf0"; g.font = "800 24px Archivo, system-ui"; g.textAlign = "center"; g.fillText("Velg retning for å starte", S / 2, S / 2); }
  };
  const bilde = (naa) => {
    if (i_gang && naa - sist >= B.TOG.ms[niva - 1]) {
      const for_ = s;
      forrige = s.tog; s = B.kjorTog(s); sist = naa;
      if (s.tatt > for_.tatt) lyd("togMynt", s.tatt);
      settTekst(teller, `${s.tatt} av ${mal} mynter`);
      if (s.krasj || s.tatt >= mal) { i_gang = false; slutt = true; ferdig(!s.krasj, s.krasj ? `Toget krasjet etter ${s.tatt} mynter.` : `Toget kom frem med ${s.tatt} mynter.`); }
    }
    tegn(naa);
    if (!slutt) ramme = requestAnimationFrame(bilde);
  };
  settTekst(teller, `0 av ${mal} mynter`);
  const fra = styring(lerret, (r) => {
    if (slutt) return;
    if (!i_gang) { i_gang = true; sist = performance.now(); }
    const ny = B.svingTog(s, r);
    if (ny !== s) { s = ny; lyd("togSving"); }
  });
  ramme = requestAnimationFrame(bilde);
  lerret.focus({ preventScroll: true });
  return () => { slutt = true; cancelAnimationFrame(ramme); fra(); };
}

// ---------- Vekslebanken ----------

const PENGEFARGE = ["#d9a36b", "#e3bd76", "#c9ced6", "#ffd84a", "#8fd18a", "#e88b7a", "#7fb2ea", "#f0c25a", "#c9a4ee", "#f6a6c8"];
export function vekslebanken(rot, niva, { ferdig, lyd }) {
  const mal = B.VEKSLE.mal[niva - 1], verdi = B.VEKSLE.stige[mal];
  rot.append(lag('<p class="mini-linje"><b></b><span>Piltaster eller sveip</span></p>'), lag('<div class="veksle" tabindex="0" role="application" aria-label="Vekslebanken"></div>'));
  const bord = rot.querySelector(".veksle"), linje = rot.querySelector("b");
  let s = B.lagVeksle(), slutt = false;
  const tegn = () => {
    settTekst(linje, `Lag ${verdi} kr`);
    bord.replaceChildren(...s.brett.map((v, i) => {
      const d = lag('<div class="veksle-rute"></div>');
      if (v !== null) {
        const seddel = B.VEKSLE.stige[v] >= 50;
        d.append(lag(`<span class="penge ${seddel ? "seddel" : "mynt"} ${s.sammen.includes(i) ? "sammen" : ""} ${s.ny === i ? "ny" : ""}" style="--p:${PENGEFARGE[v]}">${B.VEKSLE.stige[v]}</span>`));
      }
      return d;
    }));
  };
  const fra = styring(bord, (r) => {
    if (slutt) return;
    const ny = B.skyv(s, r);
    if (ny === s) return;
    s = ny;
    lyd(s.sammen.length ? "veksle" : "skyv", Math.max(0, ...s.sammen.map((i) => s.brett[i] ?? 0)));
    tegn();
    if (B.storstePenge(s) >= mal) { slutt = true; ferdig(true, `Du vekslet deg opp til ${verdi} kr.`); }
    else if (!B.kanSkyve(s)) { slutt = true; ferdig(false, `Brettet er fullt. Du kom til ${B.VEKSLE.stige[B.storstePenge(s)]} kr.`); }
  });
  tegn();
  bord.focus({ preventScroll: true });
  return () => { slutt = true; fra(); };
}

// ---------- Krakkfeltet ----------

const BJORN = '<svg viewBox="0 0 32 32" aria-hidden="true"><g stroke="#2b2118" stroke-width="1.8" stroke-linejoin="round"><circle cx="7.5" cy="8" r="4.5" fill="#8b5a2b"/><circle cx="24.5" cy="8" r="4.5" fill="#8b5a2b"/><circle cx="16" cy="17" r="11" fill="#a0693a"/><ellipse cx="16" cy="21" rx="5.5" ry="4.5" fill="#e7c49b"/><path d="M13.8 18.6h4.4L16 21z" fill="#2b2118"/><path d="M8.5 11.5l4 2M23.5 11.5l-4 2" fill="none"/><circle cx="11.5" cy="15.5" r="1.2" fill="#2b2118"/><circle cx="20.5" cy="15.5" r="1.2" fill="#2b2118"/></g></svg>';
export function krakkfeltet(rot, niva, { ferdig, lyd }) {
  const [n, antall] = B.KRAKK[niva - 1];
  rot.append(lag('<p class="mini-linje"><b></b><button type="button" class="mini-bryter" aria-pressed="false">🚩 Flagg</button></p>'), lag(`<div class="felt" style="--n:${n}"></div>`));
  const linje = rot.querySelector("b"), bryter = rot.querySelector(".mini-bryter"), bord = rot.querySelector(".felt");
  let f = null, slutt = false, flaggmodus = false, hold = 0, holdt = false;
  const ruter = Array.from({ length: n * n }, (_, i) => {
    const b = lag(`<button type="button" class="felt-rute" aria-label="Rute ${i + 1}"></button>`);
    const flagg = () => { if (slutt || !f) return; f = B.flagg(f, i); lyd("flagg"); tegn(); };
    b.addEventListener("pointerdown", () => { holdt = false; hold = setTimeout(() => { holdt = true; flagg(); }, 420); });
    for (const h of ["pointerup", "pointerleave", "pointercancel"]) b.addEventListener(h, () => clearTimeout(hold));
    b.addEventListener("contextmenu", (e) => { e.preventDefault(); clearTimeout(hold); if (!holdt) flagg(); holdt = true; });
    b.addEventListener("click", () => {
      if (slutt || holdt) { holdt = false; return; }
      if (flaggmodus && f) { flagg(); return; }
      f ??= B.lagFelt(niva, i);
      const for_ = f;
      f = B.avdekk(f, i);
      if (f === for_) return;
      tegn();
      if (f.tapt >= 0) { slutt = true; lyd("krakk"); ferdig(false, "Du traff et krakk."); }
      else if (B.feltKlart(f)) { slutt = true; ferdig(true, "Alle de trygge rutene er funnet."); }
      else lyd("avdekk");
    });
    return b;
  });
  bryter.addEventListener("click", () => { flaggmodus = !flaggmodus; bryter.setAttribute("aria-pressed", String(flaggmodus)); lyd("klikk"); });
  bord.append(...ruter);
  function tegn() {
    settTekst(linje, `${antall - (f?.flagg.filter(Boolean).length ?? 0)} krakk igjen`);
    if (!f) return;
    ruter.forEach((b, i) => {
      const vist = f.vist[i], bjorn = f.tapt >= 0 && f.krakk[i];
      b.className = `felt-rute ${vist ? `vist t${f.tall[i]}` : ""} ${bjorn ? "bjorn" : ""} ${f.tapt === i ? "traff" : ""}`;
      b.innerHTML = bjorn ? BJORN : vist ? (f.tall[i] || "") : f.flagg[i] ? "🚩" : "";
    });
  }
  tegn();
  return () => { slutt = true; clearTimeout(hold); };
}

// ---------- Regnskapet ----------

export function regnskapet(rot, niva, { ferdig, lyd }) {
  let r = B.lagRegnskap(niva), valgt = r.start.indexOf(0), slutt = false, feil = 0;
  const maksFeil = 3;
  rot.append(lag('<p class="mini-linje"><b></b><span></span></p>'), lag(`<div class="regnskap" style="--n:${r.n}"></div>`), lag(`<div class="regn-taster" style="--n:${r.n}"></div>`));
  const [linje, feilTekst] = rot.querySelector(".mini-linje").children, bord = rot.querySelector(".regnskap"), taster = rot.querySelector(".regn-taster");
  const ruter = r.start.map((_, i) => {
    const x = i % r.n, y = Math.floor(i / r.n);
    const b = lag(`<button type="button" class="regn-rute ${x % r.boks[0] === 0 && x ? "v" : ""} ${y % r.boks[1] === 0 && y ? "o" : ""}"></button>`);
    b.addEventListener("click", () => { valgt = i; tegn(); });
    return b;
  });
  bord.append(...ruter);
  const skriv = (v) => {
    if (slutt || valgt < 0 || r.start[valgt] || r.ruter[valgt] === v) return;
    if (v !== r.fasit[valgt]) {
      feil++;
      lyd("feil");
      ruter[valgt].animate([{ transform: "translateX(0)" }, { transform: "translateX(-5px)" }, { transform: "translateX(5px)" }, { transform: "translateX(0)" }], { duration: 220 });
      tegn();
      if (feil >= maksFeil) { slutt = true; ferdig(false, "Revisor fant tre feil."); }
      return;
    }
    r = { ...r, ruter: r.ruter.map((x, i) => (i === valgt ? v : x)) };
    lyd("skriv");
    if (B.regnskapKlart(r)) { slutt = true; tegn(); ferdig(true, "Regnskapet stemmer."); return; }
    tegn();
  };
  for (let v = 1; v <= r.n; v++) { const b = lag(`<button type="button">${v}</button>`); b.addEventListener("click", () => skriv(v)); taster.append(b); }
  function tegn() {
    const tomme = r.ruter.filter((v) => !v).length;
    settTekst(linje, `${tomme} ruter igjen`);
    settTekst(feilTekst, `Feil: ${feil} av ${maksFeil}`);
    const samme = r.ruter[valgt];
    ruter.forEach((b, i) => {
      b.textContent = r.ruter[i] || "";
      b.classList.toggle("gitt", Boolean(r.start[i]));
      b.classList.toggle("valgt", i === valgt);
      b.classList.toggle("nabo", valgt >= 0 && i !== valgt && B.venner(r.n, valgt).includes(i));
      b.classList.toggle("lik", Boolean(samme) && r.ruter[i] === samme && i !== valgt);
      b.setAttribute("aria-label", `Rad ${Math.floor(i / r.n) + 1}, kolonne ${(i % r.n) + 1}: ${r.ruter[i] || "tom"}`);
    });
  }
  const tast = (e) => {
    if (/^[1-9]$/.test(e.key) && Number(e.key) <= r.n) skriv(Number(e.key));
    const flytt = { ArrowUp: -r.n, ArrowDown: r.n, ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (flytt) { e.preventDefault(); valgt = (valgt + flytt + r.n * r.n) % (r.n * r.n); tegn(); }
  };
  document.addEventListener("keydown", tast);
  tegn();
  return () => { slutt = true; document.removeEventListener("keydown", tast); };
}
