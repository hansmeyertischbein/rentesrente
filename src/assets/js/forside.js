// Forsiden: en myntstabel som bygger renters rente år for år, en tittel som blir bredere,
// knapper som trekkes mot pekeren og en fortelling som spilles av når du scroller.
// Fjordblått er det du har satt inn, multegult er det pengene har tjent. Ingen tall.

const rolig = matchMedia("(prefers-reduced-motion: reduce)");
const finPeker = matchMedia("(hover: hover) and (pointer: fine)");

// ---------- Felles ----------

function lesFarger() {
  const s = getComputedStyle(document.documentElement);
  const v = (n, reserve) => s.getPropertyValue(n).trim() || reserve;
  return { fjord: v("--fjord", "#2A6FA8"), multe: v("--multe", "#B07600"), opp: v("--opp", "#16A05A"), ned: v("--ned", "#DC4A3D"), rute: v("--rule", "#D7DDD5"), papir: v("--paper", "#F6F7F3") };
}
let farger = lesFarger();

function frø(n) { let a = n >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const normal = (r) => Math.sqrt(-2 * Math.log(Math.max(1e-9, r()))) * Math.cos(2 * Math.PI * r());
const klem = (x, a, b) => Math.min(b, Math.max(a, x));
const lett = (t) => 1 - Math.pow(1 - t, 3);

// En mynt sett fra siden: avlang, med lys kant øverst og mørkere kant nederst. Tegnes én gang og gjenbrukes.
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

// ---------- Myntstabelen ----------

function lagStabel(lerret) {
  const ctx = lerret.getContext("2d");
  const hint = document.querySelector(".stabel-hint");
  const AAR = 30, FALL_MS = 430;
  let bredde = 0, hoyde = 0, dpr = 1, kolBredde = 0, myntH = 0, enhet = 1;
  let sprites = {};
  let scenario, aar = -1, aarStart = 0, ferdigTid = 0, fase = "bygger"; // fase: "bygger" | "ferdig" | "eksploderer"
  let kolonner = [], fallende = [], partikler = [];
  let peker = { x: -1e4, y: -1e4, styrke: 0, inne: false };
  let synlig = true, ramme = 0, forrigeTid = 0, runde = 0;

  // Et tilfeldig forløp med noen røde år, men der det pengene har tjent ender på minst halvparten,
  // så bildet viser renters rente og ikke bare uflaks.
  function nyttScenario() {
    for (let forsok = 0; ; forsok++) {
      const r = frø(20261104 + runde * 7919 + forsok * 104729);
      const avk = Array.from({ length: AAR }, () => klem(0.065 + 0.14 * normal(r), -0.28, 0.4));
      let v = 0;
      avk.forEach((a) => (v = (v + 1) * (1 + a)));
      const tjent = (v - AAR) / v, roede = avk.filter((a) => a < 0).length;
      if ((tjent >= 0.5 && tjent <= 0.68 && roede >= 4 && roede <= 8) || forsok > 400) return { avk, innskudd: Array(AAR).fill(1) };
    }
  }
  // Verdi og innskudd for hvert år: sett inn i starten av året, så kommer avkastningen.
  function beregn() {
    let v = 0, inn = 0;
    return scenario.avk.map((r, t) => { inn += scenario.innskudd[t]; v = (v + scenario.innskudd[t]) * (1 + r); return { verdi: v, inn }; });
  }
  function maalstokk(rader) {
    // En mynt er så mye at den høyeste søylen får plass med god luft over.
    const maks = Math.max(...rader.map((x) => x.verdi), 1);
    const plass = hoyde * 0.8;
    const antall = klem(Math.round(plass / 7), 26, 70);
    enhet = maks / antall;
    myntH = plass / antall;
    kolBredde = bredde / (AAR + 1.5);
    const b = kolBredde * 0.78;
    sprites = { fjord: lagMynt(farger.fjord, b, myntH * 0.86, dpr), multe: lagMynt(farger.multe, b, myntH * 0.86, dpr) };
  }
  const kolX = (t) => bredde - (AAR - t + 0.6) * kolBredde;
  const slotY = (i) => hoyde - 6 - (i + 1) * myntH;
  const jitter = (t, i) => ((Math.sin(t * 12.9898 + i * 78.233) * 43758.5453) % 1) * 1.4;

  function start() {
    runde++;
    scenario = nyttScenario();
    kolonner = []; fallende = []; partikler = [];
    aar = -1; aarStart = 0; ferdigTid = 0; fase = "bygger";
    maalstokk(beregn());
    if (rolig.matches) { // vis sluttbildet uten bevegelse
      const rader = beregn();
      rader.forEach((r, t) => kolonner.push(kolonne(r, t, true)));
      aar = AAR - 1; fase = "ferdig";
    }
  }
  function kolonne(r, t, ferdig) {
    const blaa = Math.round(Math.min(r.inn, r.verdi) / enhet);
    const gul = Math.max(0, Math.round(r.verdi / enhet) - blaa);
    return { t, blaa, gul, landet: ferdig ? blaa + gul : 0, linje: ferdig ? 1 : 0 };
  }
  function nesteAar(naa) {
    aar++;
    aarStart = naa;
    const rader = beregn();
    if (Math.max(...rader.map((x) => x.verdi)) / enhet > (hoyde * 0.86) / myntH) { // spart så mye at stabelen må skaleres ned
      maalstokk(rader);
      kolonner = kolonner.map((k) => ({ ...kolonne(rader[k.t], k.t, true), linje: k.linje }));
      fallende.forEach((f) => (f.dod = true));
    }
    const k = kolonne(rader[aar], aar, false);
    kolonner.push(k);
    const n = k.blaa + k.gul;
    for (let i = 0; i < n; i++) {
      fallende.push({ k, i, farge: i < k.blaa ? "fjord" : "multe", y: -20 - Math.random() * 60 - i * 2.2, vy: 0, vent: (i / n) * FALL_MS * 0.75, x: kolX(aar) + jitter(aar, i) });
    }
  }
  function sparMer(px, py) {
    if (fase !== "bygger") return;
    const fra = Math.max(0, aar);
    for (let t = fra; t < AAR; t++) scenario.innskudd[t] = Math.min(4, scenario.innskudd[t] + 0.6);
    navigator.vibrate?.(8);
    // Noen blå mynter flyr i en bue fra fingeren og inn på toppen av årets stabel
    const k = kolonner.at(-1);
    const mx = k ? kolX(k.t) : bredde - kolBredde, my = k ? slotY(k.blaa + k.gul) : hoyde * 0.5;
    for (let i = 0; i < 10; i++) partikler.push({ fra: [px, py], mal: [mx, my], bue: 80 + Math.random() * 120, sprik: (Math.random() - 0.5) * 70, t: -i * 0.035, x: px, y: py, rot: 0, vr: (Math.random() - 0.5) * 10, farge: "fjord", liv: 1 });
    hint?.classList.add("brukt");
  }
  function eksploder() {
    fase = "eksploderer";
    const midtX = peker.inne ? peker.x : bredde * 0.65;
    for (const k of kolonner) {
      for (let i = 0; i < k.landet; i += 1) {
        const x = kolX(k.t), y = slotY(i);
        const dx = x - midtX, avst = Math.hypot(dx, y - hoyde) + 40;
        partikler.push({ x, y, vx: (dx / avst) * (300 + Math.random() * 500), vy: -300 - Math.random() * 700 * (1 - y / hoyde), rot: 0, vr: (Math.random() - 0.5) * 16, farge: i < k.blaa ? "fjord" : "multe", liv: 1.8 + Math.random() * 0.6 });
      }
    }
    kolonner = []; fallende = [];
    ferdigTid = performance.now();
  }

  function oppdater(dt, naa) {
    if (fase === "bygger") {
      if (aar < 0 || naa - aarStart > FALL_MS) {
        if (aar < AAR - 1) nesteAar(naa);
        else if (!fallende.length) { fase = "ferdig"; ferdigTid = naa; }
      }
      const g = 2600;
      for (const f of fallende) {
        if (f.vent > 0) { f.vent -= dt * 1000; continue; }
        f.vy += g * dt;
        f.y += f.vy * dt;
        const maal = slotY(f.i);
        if (f.y >= maal) {
          if (f.vy > 260) { f.y = maal; f.vy *= -0.22; } // et lite sprett
          else { f.y = maal; f.landet = true; f.k.landet = Math.max(f.k.landet, f.i + 1); }
        }
      }
      fallende = fallende.filter((f) => !f.landet && !f.dod);
    } else if (fase === "ferdig" && !rolig.matches && naa - ferdigTid > 6500) eksploder();
    else if (fase === "eksploderer" && naa - ferdigTid > 1900) start();
    for (const k of kolonner) if (k.landet >= k.blaa + k.gul && k.linje < 1) k.linje = Math.min(1, k.linje + dt * 6);
    for (const p of partikler) {
      if (p.mal) { // bue fra fingeren til stabelen, så forsvinner mynten inn i den
        p.t += dt * 1.8;
        const t = klem(p.t, 0, 1), e = lett(t);
        p.x = p.fra[0] + (p.mal[0] - p.fra[0]) * e + p.sprik * Math.sin(Math.PI * t);
        p.y = p.fra[1] + (p.mal[1] - p.fra[1]) * e - p.bue * Math.sin(Math.PI * t);
        p.rot += p.vr * dt;
        if (p.t >= 1) p.liv = 0;
        continue;
      }
      p.vy += 1500 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.liv -= dt;
    }
    partikler = partikler.filter((p) => p.liv > 0 && p.y < hoyde + 60);
    peker.styrke += ((peker.inne ? 1 : 0) - peker.styrke) * Math.min(1, dt * 8);
  }

  // Pekeren skyver myntene litt til side, som fingre gjennom en bunke.
  function skyv(x, y) {
    if (peker.styrke < 0.01) return [x, y];
    const dx = x - peker.x, dy = y - peker.y, d = Math.hypot(dx, dy), R = 110;
    if (d > R) return [x, y];
    const f = Math.pow(1 - d / R, 2) * 16 * peker.styrke;
    return [x + (dx / (d || 1)) * f, y - f * 0.45];
  }

  function tegn(naa) {
    ctx.clearRect(0, 0, bredde, hoyde);
    const b = kolBredde * 0.78, h = myntH * 0.86;
    // Diskré rutenett
    ctx.save(); ctx.strokeStyle = farger.rute; ctx.lineWidth = 1; ctx.setLineDash([2, 6]);
    for (let i = 1; i <= 3; i++) { const y = Math.round(hoyde - 6 - (hoyde * 0.8 * i) / 3) + 0.5; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(bredde, y); ctx.stroke(); }
    ctx.restore();
    // Landede mynter
    for (const k of kolonner) {
      for (let i = 0; i < k.landet; i++) {
        const [x, y] = skyv(kolX(k.t) + jitter(k.t, i), slotY(i));
        ctx.drawImage(sprites[i < k.blaa ? "fjord" : "multe"], x - b / 2, y, b, h);
      }
    }
    // Fallende mynter
    for (const f of fallende) if (f.vent <= 0) ctx.drawImage(sprites[f.farge], f.x - b / 2, f.y, b, h);
    // Verdilinjen over toppen av stabelen: grønn når verdien stiger, rød når den faller.
    const topp = (k) => [kolX(k.t), slotY(k.blaa + k.gul - 1) - 3];
    ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (let j = 1; j < kolonner.length; j++) {
      const a = kolonner[j - 1], k = kolonner[j];
      if (k.linje <= 0) continue;
      const [x0, y0] = topp(a), [x1, y1] = topp(k);
      const farge = k.blaa + k.gul >= a.blaa + a.gul ? farger.opp : farger.ned;
      ctx.strokeStyle = farge; ctx.shadowColor = farge; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + (x1 - x0) * k.linje, y0 + (y1 - y0) * k.linje); ctx.stroke();
    }
    ctx.shadowBlur = 0;
    const siste = kolonner.at(-1);
    if (siste && siste.linje > 0 && kolonner.length > 1) {
      const [x, y] = topp(siste);
      const forrige = kolonner.at(-2);
      const farge = siste.blaa + siste.gul >= forrige.blaa + forrige.gul ? farger.opp : farger.ned;
      const puls = ((naa || 0) % 1600) / 1600;
      ctx.fillStyle = farge;
      ctx.globalAlpha = 0.35 * (1 - puls); ctx.beginPath(); ctx.arc(x, y, 5 + puls * 15, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
    }
    // Mynter i luften
    for (const p of partikler) {
      ctx.save(); ctx.globalAlpha = klem(p.liv, 0, 1); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.drawImage(sprites[p.farge], -b / 2, -h / 2, b, h); ctx.restore();
    }
  }

  function steg(tid) {
    const dt = Math.min(0.05, (tid - (forrigeTid || tid)) / 1000);
    forrigeTid = tid;
    oppdater(dt, tid);
    tegn(tid);
    ramme = synlig && !rolig.matches ? requestAnimationFrame(steg) : 0;
  }
  function kjor() { if (!ramme && synlig && !rolig.matches) { forrigeTid = 0; ramme = requestAnimationFrame(steg); } }

  function tilpass() {
    dpr = Math.min(2, devicePixelRatio || 1);
    bredde = lerret.clientWidth; hoyde = lerret.clientHeight;
    lerret.width = Math.round(bredde * dpr); lerret.height = Math.round(hoyde * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (scenario) { const rader = beregn(); maalstokk(rader); kolonner = kolonner.map((k) => ({ ...kolonne(rader[k.t], k.t, true), linje: k.linje })); fallende = []; }
    tegn(performance.now());
  }

  // Pekeren følges på hele helten, så fingre over teksten også påvirker stabelen.
  const flate = lerret.closest(".helt") ?? lerret;
  flate.addEventListener("pointermove", (e) => { const r = lerret.getBoundingClientRect(); peker.x = e.clientX - r.left; peker.y = e.clientY - r.top; peker.inne = peker.y > -40; });
  flate.addEventListener("pointerleave", () => (peker.inne = false));
  flate.addEventListener("pointerdown", (e) => {
    if (e.target.closest("a, button")) return;
    const r = lerret.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (fase === "bygger") sparMer(x, y);
    else if (fase === "ferdig" && !rolig.matches) { peker.x = x; peker.inne = true; eksploder(); kjor(); }
  });

  tilpass();
  start();
  tegn(0);
  kjor();
  new ResizeObserver(tilpass).observe(lerret);
  new IntersectionObserver(([e]) => { synlig = e.isIntersecting; if (synlig) kjor(); }).observe(lerret);
  document.addEventListener("visibilitychange", () => { synlig = !document.hidden; if (synlig) kjor(); });
  rolig.addEventListener("change", () => { start(); tegn(0); kjor(); });
  return { nyeFarger() { if (!scenario) return; maalstokk(beregn()); tegn(performance.now()); } };
}

// ---------- Tittelen som blir bredere ----------

function lagTittel(h1) {
  const tekst = h1.textContent.trim();
  h1.setAttribute("aria-label", tekst);
  // Ord holdes samlet, så ingen bokstav brytes alene ned på neste linje.
  h1.innerHTML = tekst.split(" ").map((ord) => `<span class="ord" aria-hidden="true">${[...ord].map((b) => `<span class="bokstav">${b}</span>`).join("")}</span>`).join(" ");
  const bokstaver = [...h1.querySelectorAll(".bokstav")];
  if (rolig.matches) return;
  bokstaver.forEach((b, i) => { b.style.animationDelay = `${120 + i * 28}ms`; });
  h1.classList.add("vokser");
  if (!finPeker.matches) return;

  // Låser linjeskiftene etter innvekst, så bredere bokstaver ikke flytter ord mellom linjer.
  let sentre = [];
  const maal = () => { sentre = bokstaver.map((b) => { const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2 + scrollY]; }); };
  setTimeout(() => { h1.classList.add("klar"); maal(); }, 120 + bokstaver.length * 28 + 700);
  addEventListener("resize", maal);
  let px = -1e4, py = -1e4, ventende = false;
  const oppdater = () => {
    ventende = false;
    bokstaver.forEach((b, i) => {
      const [x, y] = sentre[i] ?? [0, 0];
      const f = Math.max(0, 1 - Math.hypot(x - px, y - py) / 240);
      const e = f * f * (3 - 2 * f);
      b.style.fontVariationSettings = e > 0.01 ? `"wdth" ${100 + 22 * e}, "wght" ${750 + 150 * e}` : "";
    });
  };
  addEventListener("pointermove", (e) => { if (!h1.classList.contains("klar")) return; px = e.clientX; py = e.clientY + scrollY; if (!ventende) { ventende = true; requestAnimationFrame(oppdater); } }, { passive: true });
  document.addEventListener("pointerleave", () => { px = py = -1e4; requestAnimationFrame(oppdater); });
}

// ---------- Knapper som trekkes mot pekeren ----------

function lagMagneter(knapper) {
  if (rolig.matches || !finPeker.matches) return;
  addEventListener("pointermove", (e) => {
    for (const k of knapper) {
      const r = k.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const naer = Math.hypot(dx, dy) < Math.max(r.width, r.height) * 0.9;
      k.style.translate = naer ? `${klem(dx * 0.22, -9, 9)}px ${klem(dy * 0.3, -7, 7)}px` : "";
    }
  }, { passive: true });
}

// ---------- Fortellingen: renters rente i tre steg, styrt av scroll ----------

function lagFortelling(seksjon) {
  const lerret = seksjon.querySelector("canvas");
  const ctx = lerret.getContext("2d");
  const steg = [...seksjon.querySelectorAll("[data-steg]")];
  const AAR = 14, R = 0.08;
  let bredde = 0, hoyde = 0, dpr = 1, sprites = {}, myntH = 0, kolB = 0, framdrift = 0, vist = 0, ramme = 0;
  // Innskudd, gul del med vanlig rente og gul del med renters rente, per år
  const rader = Array.from({ length: AAR }, (_, t) => {
    const inn = t + 1;
    let v = 0; for (let k = 0; k <= t; k++) v = (v + 1) * (1 + R);
    let enkel = 0; for (let k = 0; k <= t; k++) enkel += R * (t + 1 - k);
    return { inn, enkel, sammensatt: v - inn };
  });
  const maksTotal = rader.at(-1).inn + rader.at(-1).sammensatt;

  function tilpass() {
    dpr = Math.min(2, devicePixelRatio || 1);
    bredde = lerret.clientWidth; hoyde = lerret.clientHeight;
    lerret.width = Math.round(bredde * dpr); lerret.height = Math.round(hoyde * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    kolB = bredde / (AAR + 1);
    myntH = (hoyde * 0.82) / (maksTotal / 0.5);
    sprites = { fjord: lagMynt(farger.fjord, kolB * 0.74, myntH * 0.86, dpr), multe: lagMynt(farger.multe, kolB * 0.74, myntH * 0.86, dpr) };
    tegn(performance.now());
  }
  // Én mynt er en halv krone av innskuddet per år, så stablene blir høye nok til å se forskjell.
  function stabel(x, blaa, gul, glimt, tid) {
    const b = kolB * 0.74, h = myntH * 0.86;
    const nb = blaa / 0.5, ng = gul / 0.5;
    for (let i = 0; i < Math.ceil(nb + ng); i++) {
      const farge = i < Math.floor(nb) ? "fjord" : "multe";
      const del = i < nb + ng - 1 ? 1 : (nb + ng) - i;
      ctx.globalAlpha = klem(del, 0, 1);
      ctx.drawImage(sprites[farge], x - b / 2, hoyde - 4 - (i + 1) * myntH, b, h);
      // Gnister på de gule myntene i siste steg: det pengene har tjent, tjener også.
      if (glimt > 0 && farge === "multe" && i >= nb + 1) {
        const fase = (tid / 900 + i * 0.37 + x * 0.013) % 1;
        if (fase < 0.18) { ctx.globalAlpha = glimt * (1 - fase / 0.18); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x + b * 0.32, hoyde - 4 - (i + 0.6) * myntH, 1.6, 0, Math.PI * 2); ctx.fill(); }
      }
    }
    ctx.globalAlpha = 1;
  }
  function tegn(tid) {
    ctx.clearRect(0, 0, bredde, hoyde);
    const p = vist; // 0–3
    rader.forEach((r, t) => {
      const x = (t + 1) * kolB;
      const synligAar = klem(p * AAR - t, 0, 1); // steg 1: stablene vokser fram år for år
      const blaa = r.inn * lett(synligAar);
      // Hvert steg holder bildet en stund før det neste begynner, så teksten og bildet følges.
      const g1 = klem((p - 1.35) / 0.6, 0, 1), g2 = klem((p - 2.35) / 0.6, 0, 1);
      const gul = r.enkel * lett(g1) + (r.sammensatt - r.enkel) * lett(g2);
      stabel(x, blaa, gul * lett(synligAar), g2, tid);
    });
  }
  // Framdriften følger stegene: 0–1 mens steg 1 kommer inn mot midten av skjermen, 1–2 fram til steg 2 står midt på, 2–3 fram til steg 3.
  function maalFramdrift() {
    const midt = innerHeight * 0.5;
    const c = steg.map((s) => { const r = s.getBoundingClientRect(); return r.top + r.height / 2; });
    const forrige = (i) => (i === 0 ? c[0] + innerHeight * 0.6 : c[i - 1]);
    framdrift = 0;
    for (let i = 0; i < c.length; i++) {
      const fra = forrige(i), til = c[i];
      framdrift = i + klem((fra - midt) / (fra - til), 0, 1);
      if (til > midt) break;
    }
    const aktiv = framdrift < 1.35 ? 0 : framdrift < 2.35 ? 1 : 2;
    steg.forEach((s, i) => s.classList.toggle("aktiv", i === aktiv));
  }
  function loop(tid) {
    vist += (framdrift - vist) * 0.12;
    tegn(tid);
    ramme = Math.abs(framdrift - vist) > 0.002 || vist > 2 ? requestAnimationFrame(loop) : 0;
  }
  const paScroll = () => { maalFramdrift(); if (rolig.matches) { vist = framdrift; tegn(0); } else if (!ramme) ramme = requestAnimationFrame(loop); };
  addEventListener("scroll", paScroll, { passive: true });
  addEventListener("resize", paScroll);
  new ResizeObserver(tilpass).observe(lerret);
  tilpass();
  paScroll();
  return { nyeFarger: tilpass };
}

// ---------- Oppstart ----------

const stabel = document.getElementById("stabel") && lagStabel(document.getElementById("stabel"));
const tittel = document.getElementById("helt-tittel");
if (tittel) lagTittel(tittel);
lagMagneter([...document.querySelectorAll(".helt-knapper .knapp")]);
const fortelling = document.querySelector(".fortelling") && lagFortelling(document.querySelector(".fortelling"));

matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { farger = lesFarger(); stabel?.nyeFarger(); fortelling?.nyeFarger(); });
