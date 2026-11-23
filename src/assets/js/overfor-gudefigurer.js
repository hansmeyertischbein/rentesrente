// Gudene i «Overfør»: portretter i anime-stil av gudene slik mytene beskriver dem, med griseører, tryne og sparesprekk.
// Hvert portrett settes sammen i lag: aura, bakhår, kropp, hode, øyne, forhår, hodepryd og det guden holder. Feltet er 200 × 200.

const K = "#241a2b";
const PRE = `g${Math.random().toString(36).slice(2, 7)}`;
let teller = 0;   // gradientene får egne id-er i hver tegning, ellers mister de fargen når en lik tegning er skjult

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mot = (h, m, x) => `#${hex(h).map((v, i) => Math.round(v + (hex(m)[i] - v) * x).toString(16).padStart(2, "0")).join("")}`;
const lys = (h, x = 0.35) => mot(h, "#ffffff", x);
const mork = (h, x = 0.35) => mot(h, "#1a1030", x);

// ---------- Hår ----------
// Hver frisyre har et lag bak hodet, et foran og strøk med glans.
const HAAR = {
  pigg: {
    bak: "M46 100Q30 62 52 40L44 22L66 34L74 10L92 28L104 6L116 28L136 12L136 34L160 26L148 46Q170 66 154 104Z",
    foran: "M56 84Q52 48 100 42Q148 48 144 84L136 66L130 86L120 62L110 84L98 58L88 84L78 62L70 88L64 68Z",
    glans: "M66 56Q84 44 104 46L98 52Q82 50 70 62ZM114 48Q130 52 138 64L130 60Q122 54 112 54Z",
  },
  langt: {
    bak: "M44 190Q26 120 46 66Q60 28 100 26Q140 28 154 66Q174 120 156 190L136 196Q144 150 134 116H66Q56 150 64 196Z",
    foran: "M54 100Q46 54 78 42Q100 34 122 42Q154 54 146 100Q144 78 128 64Q118 82 92 80Q104 72 106 60Q80 66 66 84Q58 90 54 100Z",
    glans: "M62 64Q78 44 104 44L100 50Q80 52 68 70ZM50 132Q46 160 56 184L50 186Q40 156 46 130ZM150 132Q154 160 144 184L150 186Q160 156 154 130Z",
  },
  bolger: {
    bak: "M40 178Q52 160 40 142Q26 122 42 104Q30 78 50 52Q68 26 100 26Q132 26 150 52Q170 78 158 104Q174 122 160 142Q148 160 160 178Q146 192 134 180Q142 150 132 118H68Q58 150 66 180Q54 192 40 178Z",
    foran: "M54 98Q44 62 66 48Q80 34 102 38Q132 34 142 54Q156 70 146 98Q146 80 134 70Q124 74 116 62Q106 76 92 66Q84 78 72 72Q60 80 54 98Z",
    glans: "M62 62Q74 46 94 46L88 54Q76 54 68 68ZM118 46Q134 50 140 66L132 60Q126 54 116 52ZM46 118Q38 134 50 150L44 152Q34 134 42 116Z",
  },
  krøll: {
    bak: "M50 108Q34 96 44 80Q34 64 50 54Q50 36 70 38Q80 22 100 30Q120 22 130 38Q150 36 150 54Q166 64 156 80Q166 96 150 108Z",
    foran: "M54 88Q46 74 58 66Q58 52 72 54Q80 42 94 50Q104 40 116 50Q130 44 136 56Q150 58 144 72Q154 80 146 90Q140 78 130 80Q126 68 114 74Q106 64 96 74Q86 66 78 76Q66 72 64 84Z",
    glans: "M66 58Q76 48 86 52L82 58Q74 56 70 64ZM102 48Q112 46 118 54L110 54ZM128 56Q138 58 140 68L132 62Z",
  },
  bob: {
    bak: "M42 138Q34 60 70 36Q100 20 130 36Q166 60 158 138L136 142V92H64V142Z",
    foran: "M54 108Q48 56 74 44Q100 34 126 44Q152 56 146 108L138 112V80H62V112Z",
    glans: "M62 62Q80 44 110 44L106 50Q82 52 68 72ZM48 92Q44 112 48 132L54 132V92Z",
  },
  hale: {
    bak: "M48 104Q34 66 58 44Q76 26 100 28Q124 26 142 44Q166 66 152 104L146 150L160 188L138 176L130 112H70L62 176L40 188L54 150Z",
    foran: "M56 92Q50 56 78 44Q98 36 102 62Q106 36 124 44Q150 58 144 92Q138 72 120 66L102 74L82 66Q62 72 56 92Z",
    glans: "M64 62Q74 48 92 46L86 54Q74 56 68 68ZM112 46Q130 50 138 66L130 60Q120 54 110 54ZM54 138L62 176L56 178L48 152ZM146 138L138 176L144 178L152 152Z",
  },
};
const SKJEGG = {
  fullt: "M58 108Q62 166 100 178Q138 166 142 108Q136 128 122 130Q112 124 100 128Q88 124 78 130Q64 128 58 108Z",
  langt: "M58 106Q54 160 78 180Q90 200 100 192Q110 200 122 180Q146 160 142 106Q138 128 122 130Q112 124 100 128Q88 124 78 130Q62 128 58 106Z",
  kort: "M62 116Q68 150 100 156Q132 150 138 116Q130 132 118 134Q108 128 100 131Q92 128 82 134Q70 132 62 116Z",
  fletter: "M60 108Q62 152 84 162L80 184L90 178L92 196L100 180L108 196L110 178L120 184L116 162Q138 152 140 108Q134 128 120 130Q110 124 100 128Q90 124 80 130Q66 128 60 108Z",
  faraos: "M92 146H108L106 186Q100 194 94 186Z",
};

// ---------- Ansiktet ----------
const UTTRYKK = {   // hvor mye øyet er lukket, hvor skrått det står, og hvordan brynene og munnen går
  sint: { lokk: 4, skra: 11, bryn: 17, ned: 4, munn: "M87 140Q100 134 113 140", tenner: true },
  rolig: { lokk: 3, skra: 1, bryn: 2, ned: 0, munn: "M91 139Q100 142 109 139" },
  lur: { lokk: 6, skra: 7, bryn: 9, ned: 2, munn: "M86 136Q100 146 117 133" },
  mild: { lokk: 0, skra: -3, bryn: -8, ned: -2, munn: "M90 137Q100 145 110 137" },
  stolt: { lokk: 5, skra: 8, bryn: 13, ned: 3, munn: "M89 140Q101 142 113 138" },
};
// Et anime-øye: stor iris som fyller øyet, tung øvre vippe og to lysglimt. s er 1 for venstre og -1 for høyre.
const oye = (x, s, u, id) => {
  const t = 88 + u.lokk;
  return `<g transform="rotate(${u.skra * s} ${x} 103)"><path d="M${x - 14 * s} ${t + 9}Q${x - 7 * s} ${t - 1} ${x + 2 * s} ${t - 1}Q${x + 12 * s} ${t} ${x + 14 * s} ${t + 6}Q${x + 12 * s} 119 ${x - 1 * s} 119Q${x - 12 * s} 118 ${x - 14 * s} ${t + 9}Z" fill="#fff" stroke="none"/>` +
    `<path d="M${x - 14 * s} ${t + 9}Q${x - 7 * s} ${t - 1} ${x + 2 * s} ${t - 1}Q${x + 12 * s} ${t} ${x + 14 * s} ${t + 6}L${x + 13 * s} ${t + 11}Q${x} ${t + 5} ${x - 13 * s} ${t + 14}Z" fill="#2a1f45" opacity=".3" stroke="none"/>` +
    `<path d="M${x - 9.5} ${t + 3}Q${x} ${t - 1} ${x + 9.5} ${t + 3}Q${x + 11} 112 ${x} 119Q${x - 11} 112 ${x - 9.5} ${t + 3}Z" fill="url(#${id}IRIS)" stroke="#150d22" stroke-width="1.6"/><ellipse cx="${x}" cy="${107 + u.lokk * 0.2}" rx="4.4" ry="${7.6 - u.lokk * 0.3}" fill="#120b1c" stroke="none"/>` +
    `<path d="M${x - 7} 112Q${x} 119 ${x + 7} 112Q${x} 115 ${x - 7} 112Z" fill="#fff" opacity=".55" stroke="none"/><ellipse cx="${x - 3.6}" cy="${100.5 + u.lokk * 0.4}" rx="3.4" ry="4.2" fill="#fff" stroke="none"/><circle cx="${x + 4}" cy="112" r="1.9" fill="#fff" opacity=".9" stroke="none"/>` +
    `<path d="M${x - 19 * s} ${t + 8}Q${x - 10 * s} ${t - 6} ${x + 3 * s} ${t - 5}Q${x + 14 * s} ${t - 3} ${x + 17 * s} ${t + 5}Q${x + 11 * s} ${t + 1} ${x + 2 * s} ${t + 1}Q${x - 8 * s} ${t + 1} ${x - 14 * s} ${t + 10}L${x - 21 * s} ${t + 13}Z" fill="${K}" stroke="none"/>` +
    `<path d="M${x - 10 * s} 120Q${x} 122.5 ${x + 8 * s} 119" stroke="${K}" stroke-width="1.6" fill="none" opacity=".7"/></g>`;
};
// Brynene tegnes oppå håret, slik det gjøres i anime.
const bryn = (x, s, u, farge) => `<path transform="rotate(${u.bryn * s} ${x} 82)" d="M${x - 17 * s} ${81 + u.ned}Q${x - 4 * s} ${74 + u.ned} ${x + 14 * s} ${78 + u.ned}L${x + 13 * s} ${82.5 + u.ned}Q${x - 3 * s} ${79 + u.ned} ${x - 17 * s} ${81 + u.ned}Z" fill="${farge}" stroke="${K}" stroke-width="1.2"/>`;
const TRYNE = (hud) => `<path d="M85 128Q86 117 100 117Q114 117 115 128Q114 136 100 136Q86 136 85 128Z" fill="${mot(hud, "#f2849e", 0.6)}"/><path d="M88 130Q100 138 112 130Q111 135 100 135Q89 135 88 130Z" fill="${mork(mot(hud, "#f2849e", 0.6), 0.18)}" stroke="none"/><ellipse cx="95" cy="127" rx="2.3" ry="3.5" fill="${mork(mot(hud, "#c0456a", 0.6), 0.35)}" stroke="none"/><ellipse cx="105" cy="127" rx="2.3" ry="3.5" fill="${mork(mot(hud, "#c0456a", 0.6), 0.35)}" stroke="none"/><path d="M90 121Q95 118.6 102 119" stroke="#fff" stroke-width="2" opacity=".8" fill="none"/>`;

function hode(g, id) {
  const u = UTTRYKK[g.uttrykk], hud = g.hud ?? "#f9c9ba", skygge = mork(hud, 0.24), ansikt = "M57 80Q55 116 71 137Q86 154 100 156Q114 154 129 137Q145 116 143 80Q137 46 100 46Q63 46 57 80Z";
  return `<path d="M86 142V162H114V142Z" fill="${skygge}"/><path d="M86 148Q100 160 114 148V154Q100 166 86 154Z" fill="${mork(hud, 0.4)}" opacity=".5" stroke="none"/>` +
    // Griseører
    `<g class="gud-ore"><path d="M64 60Q36 56 28 26Q58 20 80 46Z" fill="url(#${id}HUD)"/><path d="M62 54Q44 50 38 32Q58 32 71 46Z" fill="${mot(hud, "#e8668a", 0.5)}" stroke="none"/><path d="M34 30Q50 28 64 36" stroke="#fff" stroke-width="2" opacity=".5" fill="none"/></g>` +
    `<g class="gud-ore"><path d="M136 60Q164 56 172 26Q142 20 120 46Z" fill="url(#${id}HUD)"/><path d="M138 54Q156 50 162 32Q142 32 129 46Z" fill="${mot(hud, "#e8668a", 0.5)}" stroke="none"/></g>` +
    `<path d="${ansikt}" fill="url(#${id}HUD)"/>` + (g.delt ? `<path d="M100 46Q137 46 143 80Q145 116 129 137Q114 154 100 156Z" fill="${g.delt}" opacity=".55" stroke="none"/>` : "") +
    // Skygge under panneluggen og langs kinnet, og kantlys på den andre siden
    `<path d="M57 82Q100 106 143 82Q139 48 100 46Q61 48 57 82Z" fill="${skygge}" opacity=".55" stroke="none"/><path d="M129 137Q145 116 143 80Q140 108 122 128Q110 144 92 152Q97 156 100 156Q114 154 129 137Z" fill="${skygge}" opacity=".6" stroke="none"/><path d="M60 92Q60 116 74 134" stroke="#fff" stroke-width="3" opacity=".45" fill="none"/>` +
    `<g opacity=".6" stroke="none" fill="#ff7d92"><ellipse cx="69" cy="126" rx="8.5" ry="4.4"/><ellipse cx="131" cy="126" rx="8.5" ry="4.4"/></g><path d="M64 127l3-4M68 128l3-4M72 128l3-4M126 128l3-4M130 128l3-4M134 127l3-4" stroke="#e8557a" stroke-width="1.1" opacity=".75"/>` +
    (g.arr ? '<path d="M122 84L134 124M120 96l10-3M124 108l10-3" stroke="#b3402f" stroke-width="2" fill="none"/>' : "") +
    oye(80, 1, u, id) + (g.lapp ? "" : oye(120, -1, u, id)) + TRYNE(hud) +
    `<path d="${u.munn}" fill="none" stroke-width="2.3"/>` + (u.tenner ? '<path d="M90 139l3 5 3-6M104 138l3 6 3-5" fill="#fff" stroke-width="1.2"/>' : "");
}

// ---------- Kropp og aura ----------
function kropp(g, id) {
  const d = g.drakt, l = g.linje;
  const felles = `<path d="M22 204Q26 162 66 154Q82 150 86 148L100 164L114 148Q118 150 134 154Q174 162 178 204Z" fill="url(#${id}DRAKT)"/>`;
  const sprekk = `<rect x="86" y="178" width="28" height="6" rx="3" fill="${K}" stroke="${l}" stroke-width="2"/>`;   // sparesprekken
  const snitt = {
    toga: `<path d="M60 156Q86 176 118 204H86Q58 186 46 162Z" fill="${lys(d, 0.4)}"/><path d="M60 156Q86 176 118 204M46 162Q62 184 88 204" fill="none" stroke="${l}" stroke-width="3"/><circle cx="60" cy="160" r="8" fill="${l}"/><circle cx="58" cy="158" r="2.6" fill="#fff" opacity=".8" stroke="none"/>`,
    rustning: `<path d="M64 158Q100 150 136 158L128 204H72Z" fill="${lys(d, 0.18)}"/><path d="M100 154V204M72 176Q100 188 128 176" fill="none" stroke="${mork(d, 0.4)}" stroke-width="2"/><path d="M20 190Q18 160 52 152Q70 158 66 176Q40 172 34 196Z" fill="url(#${id}MET)"/><path d="M180 190Q182 160 148 152Q130 158 134 176Q160 172 166 196Z" fill="url(#${id}MET)"/><path d="M26 182Q32 162 54 158M174 182Q168 162 146 158" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/>`,
    krage: `<path d="M44 168Q70 148 100 166Q130 148 156 168Q140 196 100 198Q60 196 44 168Z" fill="${l}"/><path d="M54 168Q76 156 100 172Q124 156 146 168M62 178Q82 170 100 184Q118 170 138 178" fill="none" stroke="${g.linje2 ?? "#2f5aa8"}" stroke-width="5"/>`,
    pels: `<path d="M18 190Q20 158 56 148Q66 158 78 152Q88 166 100 160Q112 166 122 152Q134 158 144 148Q180 158 182 190Q164 176 150 186Q138 170 126 182Q112 170 100 182Q88 170 74 182Q62 170 50 186Q36 176 18 190Z" fill="${l}"/><path d="M40 164l5 10M60 158l4 11M140 158l-4 11M160 164l-5 10" stroke="${mork(l, 0.35)}" stroke-width="1.8"/>`,
  }[g.snitt];
  return felles + snitt + sprekk;
}
const STRALER = (farge, n = 16, o = 0.5) => `<g fill="${farge}" opacity="${o}" stroke="none">${Array.from({ length: n }, (_, i) => { const v = (i * 2 * Math.PI) / n, p = (r, a) => `${(100 + r * Math.cos(a)).toFixed(1)} ${(92 + r * Math.sin(a)).toFixed(1)}`; return `<path d="M${p(40, v - 0.02)}L${p(100, v - 0.09)}L${p(100, v + 0.09)}L${p(40, v + 0.02)}Z"/>`; }).join("")}</g>`;
const LYN = (x, y, s, r = 0) => `<path transform="translate(${x} ${y}) rotate(${r}) scale(${s})" d="M8-22L-10 4H0L-6 24L14-6H3L12-22Z" fill="#fff27a" stroke="#f0a800" stroke-width="2.4"/>`;
const FLAMME = (x, y, s, a = "#ff7a1c", b = "#ffd84a") => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 20Q-18 12-12-8Q-8 0-4 0Q-8-14 4-28Q4-14 12-8Q20 8 0 20Z" fill="${a}"/><path d="M0 18Q-8 12-5 2Q0 6 1-6Q10 6 0 18Z" fill="${b}" stroke="none"/></g>`;
const BOLGE = (y, farge, o) => `<path d="M-6 ${y}q12-14 25 0t25 0 25 0 25 0 25 0 25 0 25 0 25 0V210H-6Z" fill="${farge}" opacity="${o}" stroke="none"/>`;
const VINGE = (x, y, s, farge = "#fff") => `<g transform="translate(${x} ${y}) scale(${s} ${Math.abs(s)})"><path d="M0 0Q-22-28-52-24Q-40-16-38-10Q-52-8-56 0Q-42 0-36 4Q-44 8-44 14Q-18 18 0 0Z" fill="${farge}"/><path d="M-6-2Q-22-12-38-10M-8 2Q-24-2-36 4" fill="none" stroke="${mork(farge, 0.25)}" stroke-width="1.8"/></g>`;
const RAVN = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-20 8Q-16-14 4-14Q12-22 22-16L34-12L22-6Q22 10 4 16L-18 22Z" fill="#231d33"/><circle cx="16" cy="-11" r="2.4" fill="#fff27a" stroke="none"/><path d="M-10 8Q0 10 10 0" fill="none" stroke="#5b5175" stroke-width="2"/></g>`;

const AURA = {
  ring: (f) => `<circle cx="100" cy="88" r="84" fill="none" stroke="${f}" stroke-width="5" opacity=".75"/><circle cx="100" cy="88" r="74" fill="none" stroke="${lys(f, 0.5)}" stroke-width="1.6" stroke-dasharray="3 9" opacity=".9"/>`,
  stral: (f) => STRALER(f, 18, 0.5),
  lyn: (f) => STRALER(f, 12, 0.3) + LYN(22, 60, 1, -14) + LYN(178, 58, 1, 14) + LYN(40, 24, 0.6, 20) + LYN(162, 22, 0.6, -20),
  ild: () => FLAMME(22, 120, 1.5) + FLAMME(178, 120, 1.5) + FLAMME(40, 66, 1) + FLAMME(160, 66, 1) + FLAMME(14, 168, 1.2) + FLAMME(186, 168, 1.2),
  vann: (f) => BOLGE(70, f, 0.3) + BOLGE(100, f, 0.4) + '<g fill="#fff" opacity=".75" stroke="none"><circle cx="24" cy="56" r="5"/><circle cx="176" cy="44" r="6"/><circle cx="40" cy="34" r="3"/><circle cx="164" cy="76" r="3.4"/></g>',
  bro: () => ["#e8553d", "#f2a93b", "#ffe25a", "#62c48a", "#4a9be0", "#8a5fd0"].map((c, i) => `<path d="M${2 + i * 6} 196A${98 - i * 6} ${108 - i * 6} 0 0 1 ${198 - i * 6} 196" fill="none" stroke="${c}" stroke-width="6.4" opacity=".8"/>`).join(""),
  blad: (f) => `<g fill="${f}" opacity=".8" stroke="none">${Array.from({ length: 12 }, (_, i) => { const v = (i * Math.PI) / 6; return `<ellipse cx="${(100 + 86 * Math.cos(v)).toFixed(1)}" cy="${(90 + 80 * Math.sin(v)).toFixed(1)}" rx="9" ry="4" transform="rotate(${i * 30 + 60} ${(100 + 86 * Math.cos(v)).toFixed(1)} ${(90 + 80 * Math.sin(v)).toFixed(1)})"/>`; }).join("")}</g>`,
  ur: (f) => `<circle cx="100" cy="88" r="84" fill="${mork(f, 0.5)}" opacity=".55" stroke="none"/><circle cx="100" cy="88" r="82" fill="none" stroke="${f}" stroke-width="5"/><g stroke="${lys(f, 0.5)}" stroke-width="4">${Array.from({ length: 12 }, (_, i) => { const v = (i * Math.PI) / 6; return `<path d="M${(100 + 70 * Math.cos(v)).toFixed(1)} ${(88 + 70 * Math.sin(v)).toFixed(1)}L${(100 + 78 * Math.cos(v)).toFixed(1)} ${(88 + 78 * Math.sin(v)).toFixed(1)}"/>`; }).join("")}</g>`,
  fonix: (f) => `<path d="M100 120Q60 60 4 40Q22 64 12 76Q30 84 22 100Q40 104 36 122Q60 130 100 150Q140 130 164 122Q160 104 178 100Q170 84 188 76Q178 64 196 40Q140 60 100 120Z" fill="${f}"/><path d="M100 130Q64 84 26 64M100 136Q66 104 34 98M100 130Q136 84 174 64M100 136Q134 104 166 98" fill="none" stroke="#fff1a8" stroke-width="3"/>` + STRALER("#ffd84a", 20, 0.35),
};

// ---------- Hodepryd ----------
const LAUR = (f) => `<g fill="${f}">${[[54, 70, -70], [57, 58, -55], [64, 48, -40], [74, 40, -24], [86, 35, -10], [146, 70, 70], [143, 58, 55], [136, 48, 40], [126, 40, 24], [114, 35, 10]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="10" ry="4.6" transform="rotate(${r} ${x} ${y})" stroke-width="1.8"/>`).join("")}</g><circle cx="100" cy="33" r="5" fill="${lys(f, 0.4)}"/>`;
const PRYD = {
  horn: () => '<path d="M58 58Q100 34 142 58L138 70Q100 52 62 70Z" fill="url(#MET)"/><path d="M66 54Q34 44 40 2Q50 34 80 44Z" fill="url(#MET)"/><path d="M134 54Q166 44 160 2Q150 34 120 44Z" fill="url(#MET)"/><path d="M100 46l7 12-7 12-7-12z" fill="#4fe07a"/><path d="M44 14Q48 34 70 46M156 14Q152 34 130 46" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/>',
  vokter: () => '<path d="M52 72Q52 28 100 24Q148 28 148 72L138 64Q100 50 62 64Z" fill="url(#MET)"/><path d="M100 22V58" stroke="#fff" stroke-width="3" opacity=".7"/><path d="M94 26Q100 2 106 26Z" fill="#fff"/><path d="M56 66L44 88L58 84ZM144 66L156 88L142 84Z" fill="url(#MET)"/>' + VINGE(56, 48, 0.62, "#fff7df") + VINGE(144, 48, -0.62, "#fff7df"),
  diadem: () => '<path d="M60 58Q100 40 140 58L138 66Q100 50 62 66Z" fill="url(#MET)"/><path d="M100 38l6 9-6 11-6-11z" fill="#ff8f3d"/><circle cx="78" cy="53" r="3.4" fill="#ff8f3d"/><circle cx="122" cy="53" r="3.4" fill="#ff8f3d"/>',
  jern: () => '<path d="M54 70Q54 30 100 28Q146 30 146 70Q100 52 54 70Z" fill="url(#MET)"/><path d="M54 70Q100 52 146 70L144 78Q100 62 56 78Z" fill="#8b5a2b"/><path d="M100 28V58M72 34Q64 46 64 64M128 34Q136 46 136 64" fill="none" stroke="#3a4652" stroke-width="2.4"/><path d="M76 36Q88 30 98 31" stroke="#fff" stroke-width="3" opacity=".7" fill="none"/>' + LYN(100, 48, 0.5),
  allfar: () => '<path d="M26 66Q60 46 100 46Q140 46 174 66Q140 60 100 62Q60 60 26 66Z" fill="#3a3560"/><path d="M60 58Q64 12 108 8Q128 22 140 58Q100 42 60 58Z" fill="#4a4478"/><path d="M60 58Q100 42 140 58L138 64Q100 50 62 64Z" fill="url(#MET)"/><path d="M72 46Q80 22 102 14" stroke="#8d86c9" stroke-width="3" fill="none"/>',
  laurGronn: () => LAUR("#6fc25a"), laurGull: () => LAUR("#ffd24a"),
  slor: () => '<path d="M40 150Q28 60 66 34Q100 12 134 34Q172 60 160 150L144 148Q154 84 132 58Q100 36 68 58Q46 84 56 148Z" fill="#fff6e6"/><path d="M48 140Q42 76 70 46M152 140Q158 76 130 46" fill="none" stroke="#f0c9a0" stroke-width="2.4"/><path d="M64 60Q100 40 136 60" fill="none" stroke="#f29b38" stroke-width="5"/>' + FLAMME(100, 34, 0.7),
  galea: () => '<path d="M60 40Q64-6 100-2Q150-2 152 46Q134 26 100 28Q76 28 60 40Z" fill="#d8352a"/><path d="M70 26Q84 6 104 8M86 24Q100 10 122 14M112 24Q126 18 138 28" fill="none" stroke="#8f1d17" stroke-width="2.4"/><path d="M50 74Q50 34 100 32Q150 34 150 74L140 68Q100 50 60 68Z" fill="url(#MET)"/><path d="M50 72L48 120L64 132L62 74ZM150 72L152 120L136 132L138 74Z" fill="url(#MET)"/><path d="M66 44Q82 36 98 36" stroke="#fff" stroke-width="3" opacity=".75" fill="none"/>',
  vinghatt: () => '<path d="M36 70Q60 58 100 58Q140 58 164 70Q140 66 100 66Q60 66 36 70Z" fill="url(#MET)"/><path d="M58 62Q58 28 100 26Q142 28 142 62Q100 52 58 62Z" fill="url(#MET)"/><path d="M72 40Q82 32 98 32" stroke="#fff" stroke-width="3" opacity=".7" fill="none"/>' + VINGE(58, 50, 0.85) + VINGE(142, 50, -0.85),
  kattepryd: () => '<path d="M58 64Q100 46 142 64L140 72Q100 56 60 72Z" fill="url(#MET)"/><circle cx="100" cy="44" r="12" fill="url(#MET)"/><path d="M92 36l-3-11 9 6M108 36l3-11-9 6" fill="url(#MET)"/><circle cx="96" cy="44" r="1.8" fill="#2fbf6a" stroke="none"/><circle cx="104" cy="44" r="1.8" fill="#2fbf6a" stroke="none"/><path d="M48 92h14M48 104h14M138 92h14M138 104h14" stroke="#ffd24a" stroke-width="5"/>',
  sjakal: () => '<path d="M42 150Q36 68 70 46Q100 34 130 46Q164 68 158 150L140 148L138 84Q100 56 62 84L60 148Z" fill="#26203a"/><path d="M44 104h16M44 120h16M46 136h14M140 104h16M140 120h16M140 136h14" stroke="#ffd24a" stroke-width="5"/><path d="M66 56Q50 30 56-6Q78 18 86 46Z" fill="#26203a"/><path d="M134 56Q150 30 144-6Q122 18 114 46Z" fill="#26203a"/><path d="M68 46Q60 26 62 12Q74 26 78 42ZM132 46Q140 26 138 12Q126 26 122 42Z" fill="#ffd24a" stroke="none"/><path d="M62 80Q100 54 138 80L136 88Q100 64 64 88Z" fill="#ffd24a"/><path d="M100 56q-7 10 0 18 7-8 0-18z" fill="#4fd8ff"/>',
  ibis: () => '<path d="M44 148Q38 70 70 48Q100 36 130 48Q162 70 156 148L140 146L138 84Q100 58 62 84L60 146Z" fill="#2f5aa8"/><path d="M46 100l14 2M46 116l14 2M47 132l13 2M140 102l14-2M140 118l14-2M140 134l13-2" stroke="#ffd24a" stroke-width="4"/><path d="M62 82Q100 56 138 82L136 89Q100 65 64 89Z" fill="#ffd24a"/><circle cx="100" cy="26" r="20" fill="#eaf3ff"/><path d="M82 22A20 20 0 1 0 118 22A24 20 0 0 1 82 22Z" fill="#ffd24a"/><path d="M92 44Q88 60 100 66Q112 60 108 44Z" fill="#fff"/><path d="M100 60Q104 78 92 92Q90 74 96 62Z" fill="#3a3560"/>',
  atef: () => '<path d="M62 72Q100 52 138 72L136 80Q100 62 64 80Z" fill="url(#MET)"/><path d="M72 66Q70 10 100-8Q130 10 128 66Q100 50 72 66Z" fill="#fffaf0"/><path d="M82 50Q82 18 98 2" stroke="#d8cdb4" stroke-width="3" fill="none"/><path d="M68 68Q40 46 56 8Q66 18 66 34Q74 46 76 62ZM132 68Q160 46 144 8Q134 18 134 34Q126 46 124 62Z" fill="#3fa36a"/><path d="M60 20Q58 44 70 60M140 20Q142 44 130 60" stroke="#ffd24a" stroke-width="2.4" fill="none"/><circle cx="100" cy="-4" r="7" fill="url(#MET)"/>',
  sol: () => '<circle cx="100" cy="14" r="28" fill="#ffb020" opacity=".45" stroke="none"/><circle cx="100" cy="14" r="21" fill="url(#MET)"/><circle cx="93" cy="7" r="6" fill="#fff" opacity=".65" stroke="none"/><path d="M44 148Q38 70 70 48Q100 36 130 48Q162 70 156 148L140 146L138 84Q100 58 62 84L60 146Z" fill="#d8402a"/><path d="M46 100h14M46 116h14M47 132h13M140 100h14M140 116h14M140 132h13" stroke="#ffd24a" stroke-width="5"/><path d="M62 82Q100 54 138 82L136 90Q100 64 64 90Z" fill="#ffd24a"/><path d="M96 70Q88 54 100 44Q112 54 104 70Q106 78 100 82Q94 78 96 70Z" fill="#3fa36a"/><circle cx="97" cy="54" r="1.5" fill="#fff" stroke="none"/><circle cx="103" cy="54" r="1.5" fill="#fff" stroke="none"/>',
  korint: () => '<path d="M54 44Q44-14 100-10Q156-14 146 44Q130 20 100 20Q70 20 54 44Z" fill="#c9201a"/><path d="M66 24Q74 0 98-2M134 24Q126 0 102-2" fill="none" stroke="#7d0f0f" stroke-width="3"/><path d="M48 84Q46 30 100 24Q154 30 152 84L150 134L134 144L132 92L112 80L100 88L88 80L68 92L66 144L50 134Z" fill="url(#MET)"/><path d="M62 62Q64 42 88 34" stroke="#fff" stroke-width="3.4" opacity=".7" fill="none"/><path d="M100 24V84" stroke="#3a2410" stroke-width="2.4"/>',
  korall: () => '<path d="M58 62Q100 44 142 62L140 72Q100 54 60 72Z" fill="url(#MET)"/><path d="M66 58Q58 40 48 34M62 44Q52 46 44 54M84 50Q80 30 84 14M82 32Q72 28 70 18M116 50Q120 30 116 14M118 32Q128 28 130 18M134 58Q142 40 152 34M138 44Q148 46 156 54" fill="none" stroke="#ff7f6a" stroke-width="7"/><path d="M100 18Q112 30 100 46Q88 30 100 18Z" fill="#8ff0ff"/><circle cx="76" cy="55" r="4" fill="#fff"/><circle cx="124" cy="55" r="4" fill="#fff"/>',
  timeglass: () => '<path d="M58 62Q100 42 142 62L140 72Q100 54 60 72Z" fill="url(#MET)"/><path d="M62 58L50 20L76 46L86 6L100 40L114 6L124 46L150 20L138 58Q100 42 62 58Z" fill="url(#MET)"/><path d="M90 28h20l-8 13 8 13H90l8-13z" fill="#ffe9a8"/><path d="M94 50h12l-5-6h-2z" fill="#f0a800" stroke="none"/><circle cx="50" cy="20" r="4" fill="#c58bff"/><circle cx="150" cy="20" r="4" fill="#c58bff"/>',
  keiser: () => '<path d="M54 68L46 14L74 40L86 2L100 34L114 2L126 40L154 14L146 68Q100 48 54 68Z" fill="url(#MET)"/><path d="M54 68Q100 48 146 68L144 78Q100 58 56 78Z" fill="#c9201a"/><circle cx="100" cy="46" r="7" fill="#ff5a6e"/><circle cx="74" cy="54" r="5" fill="#4fd8ff"/><circle cx="126" cy="54" r="5" fill="#4fd8ff"/><circle cx="86" cy="2" r="4.4" fill="#fff6d0"/><circle cx="114" cy="2" r="4.4" fill="#fff6d0"/>',
};

// ---------- Det guden holder ----------
const TING = {
  dolk: '<g transform="rotate(24 168 150)"><path d="M162 196V166H174V196Z" fill="#2a4a36"/><path d="M152 168H184V161H152Z" fill="#e9c24a"/><path d="M160 160L168 96L176 160Z" fill="#dff3e6"/><path d="M168 100V158" stroke="#7fb89a" stroke-width="2"/></g>',
  gjallar: '<path d="M132 190Q176 190 180 138L192 128Q196 196 138 204Z" fill="#f4e3b0"/><path d="M178 140Q170 128 180 116Q194 118 196 132Q188 134 178 140Z" fill="#e9c24a"/><path d="M146 196L148 187M162 190L158 181M174 176L166 170" stroke="#b98a22" stroke-width="3"/>',
  hjerte: '<circle cx="100" cy="171" r="6" fill="#ff8f3d"/><path d="M64 160Q100 190 136 160" fill="none" stroke="#ffd24a" stroke-width="5"/><circle cx="76" cy="168" r="4" fill="#ffb25a"/><circle cx="124" cy="168" r="4" fill="#ffb25a"/><path d="M72 112q-3 8 0 12 4-4 0-12zM128 112q-3 8 0 12 4-4 0-12z" fill="#ffd24a" stroke-width="1.2"/>',
  hammer: '<g transform="translate(14 52) rotate(-16 164 140) translate(16 14) scale(.9)"><path d="M158 204V120H170V204Z" fill="#7a4a22"/><path d="M158 140h12M158 156h12M158 172h12" stroke="#4a2b12" stroke-width="2.4"/><path d="M134 88H194L198 98V118L194 126H134L130 118V98Z" fill="url(#MET)"/><path d="M140 96H188" stroke="#fff" stroke-width="3" opacity=".75"/><path d="M156 100l8 6-8 8 14-2" fill="none" stroke="#4fb8ff" stroke-width="2.6"/></g>' + LYN(184, 80, 0.8, 18),
  spyd: '<path d="M172 204L178 60" stroke="#6b4a2a" stroke-width="7"/><path d="M178 10L192 50L179 70L164 50Z" fill="url(#MET)"/><path d="M178 16V64" stroke="#fff" stroke-width="2" opacity=".7"/>' + RAVN(26, 138, 0.95) + RAVN(34, 66, 0.6),
  nokkel: '<circle cx="168" cy="132" r="16" fill="none" stroke="#e9c24a" stroke-width="8"/><path d="M168 148V204M168 186H182M168 198H180" stroke="#e9c24a" stroke-width="8"/><circle cx="168" cy="132" r="20" fill="none" stroke-width="1.8"/>',
  skal: '<path d="M140 172Q164 190 190 172Q188 200 165 202Q144 200 140 172Z" fill="url(#MET)"/>' + FLAMME(165, 158, 1.35),
  gladius: '<g transform="rotate(14 170 150)"><path d="M164 204V174H176V204Z" fill="#5a2b12"/><path d="M152 176H188V168H152Z" fill="#e9c24a"/><path d="M160 168V104L170 86L180 104V168Z" fill="#eef2f7"/><path d="M170 92V166" stroke="#9aa5b1" stroke-width="2.4"/></g>',
  stav: '<path d="M170 204V92" stroke="#b98a22" stroke-width="6"/><path d="M152 186Q190 172 170 156Q150 142 170 128Q186 118 170 106" fill="none" stroke="#3fa36a" stroke-width="5"/><path d="M188 186Q150 172 170 156Q190 142 170 128Q154 118 170 106" fill="none" stroke="#2f7fa8" stroke-width="5"/><circle cx="170" cy="90" r="8" fill="#ffd24a"/>' + VINGE(168, 104, 0.6) + VINGE(172, 104, -0.6),
  lyn: LYN(170, 140, 2.3, 10),
  sistrum: '<path d="M168 204V150" stroke="#b98a22" stroke-width="7"/><path d="M148 150Q142 100 168 92Q194 100 188 150Z" fill="none" stroke="#e9c24a" stroke-width="6"/><path d="M146 114H190M145 126H191M146 138H190" stroke="#c9d1da" stroke-width="3.4"/>',
  ankh: '<path d="M170 204V150M146 162H194" stroke="#ffd24a" stroke-width="10"/><ellipse cx="170" cy="126" rx="15" ry="22" fill="none" stroke="#ffd24a" stroke-width="9"/>',
  rull: '<path d="M134 160H188V200H134Z" fill="#f6e7c1"/><path d="M130 154H192V166H130ZM130 196H192V206H130Z" fill="#d9b87a"/><path d="M144 174H178M144 182H170M144 190H176" stroke="#8a6a3a" stroke-width="2.4"/><path d="M176 176L198 110L190 150Z" fill="#fff"/>',
  krum: '<path d="M162 204L176 108Q180 84 160 88Q150 92 156 104" fill="none" stroke="#e9c24a" stroke-width="8"/><path d="M36 204L26 120" stroke="#2f5aa8" stroke-width="7"/><path d="M26 122L8 150M28 124L22 158M30 122L40 154" stroke="#e9c24a" stroke-width="4"/>',
  septer: '<path d="M170 204V96" stroke="#e9c24a" stroke-width="7"/><circle cx="170" cy="84" r="16" fill="#ff8f1c"/><circle cx="165" cy="79" r="5" fill="#fff" opacity=".7" stroke="none"/>',
  krigsspyd: '<path d="M176 204L170 70" stroke="#4a2b12" stroke-width="7"/><path d="M170 14L184 56L170 76L156 56Z" fill="#eef2f7"/><path d="M170 20V70" stroke="#b3261e" stroke-width="3"/><path d="M160 80Q150 92 156 108Q166 98 172 82Z" fill="#d8352a"/><circle cx="24" cy="176" r="30" fill="url(#MET)"/><circle cx="24" cy="176" r="12" fill="#c9201a"/>',
  trefork: '<path d="M174 204V66" stroke="#e9c24a" stroke-width="7"/><path d="M148 76V46M174 70V24M200 76V46M148 74Q150 92 174 92Q198 92 200 74" fill="none" stroke="#e9c24a" stroke-width="7"/><path d="M140 50L148 28L156 50ZM166 30L174 4L182 30ZM192 50L200 28L208 50Z" fill="#ffe9a8"/>',
  ljaa: '<path d="M176 204L164 30" stroke="#3a2436" stroke-width="7"/><path d="M164 34Q120-4 70 14Q122 14 150 50Z" fill="#dfe3f2"/><path d="M164 34Q124 8 90 12" stroke="#fff" stroke-width="2.4" fill="none"/><path d="M160 36L172 34" stroke="#c58bff" stroke-width="8"/>',
  eple: '<path d="M170 204V150" stroke="#e9c24a" stroke-width="7"/><circle cx="170" cy="134" r="20" fill="url(#MET)"/><path d="M150 134H190M170 114V154" stroke="#c9201a" stroke-width="3.6"/><path d="M170 114V98M162 104H178" stroke="#e9c24a" stroke-width="6"/>',
};

export const GUDER = {
  loke: { haar: "#2c2440", frisyre: "langt", oye: "#3fe07a", uttrykk: "lur", drakt: "#2f7a45", linje: "#e9c24a", snitt: "rustning", metall: "#e9c24a", pryd: "horn", ting: "dolk", aura: ["ring", "#4fd07a"], bak: ["#d9ffe4", "#1f6b3c"] },
  heimdall: { haar: "#f4ead0", frisyre: "hale", hud: "#a8714f", oye: "#ffc93a", uttrykk: "rolig", drakt: "#f1e4b8", linje: "#c9922a", snitt: "rustning", metall: "#ffd86a", pryd: "vokter", ting: "gjallar", aura: ["bro"], bak: ["#fffbe8", "#a7d8c0"] },
  froya: { haar: "#ffd76a", frisyre: "bolger", oye: "#4ac0e8", uttrykk: "mild", drakt: "#f3a7bd", linje: "#8a5a3a", snitt: "pels", metall: "#ffd24a", pryd: "diadem", ting: "hjerte", aura: ["blad", "#ffd24a"], bak: ["#fff0f4", "#e88aa8"] },
  tor: { haar: "#e0562a", frisyre: "pigg", skjegg: "fletter", oye: "#39b6ff", uttrykk: "sint", drakt: "#3c5a78", linje: "#c9922a", snitt: "rustning", metall: "#a9b7c6", pryd: "jern", ting: "hammer", aura: ["lyn", "#8fd4ff"], bak: ["#eaf6ff", "#2f6f9a"] },
  odin: { haar: "#cfd3e4", frisyre: "langt", skjegg: "langt", lapp: true, oye: "#6fd8ff", uttrykk: "stolt", drakt: "#35305c", linje: "#8f7a5a", snitt: "pels", metall: "#e9c24a", pryd: "allfar", ting: "spyd", aura: ["ring", "#7f8cff"], bak: ["#e6e8ff", "#3a3a78"] },
  janus: { haar: "#f0f0f0", haar2: "#33283f", frisyre: "krøll", delt: "#8d6bb8", oye: "#b06fff", uttrykk: "rolig", drakt: "#7a4fa8", linje: "#ffd24a", snitt: "toga", metall: "#e9c24a", pryd: "laurGull", ting: "nokkel", aura: ["ring", "#c9a0ff"], bak: ["#fff4ea", "#7a4fa8"] },
  vesta: { haar: "#a8512a", frisyre: "bolger", oye: "#ff8f2a", uttrykk: "mild", drakt: "#fff1dc", linje: "#f29b38", snitt: "toga", metall: "#f2a93b", pryd: "slor", ting: "skal", aura: ["stral", "#ffc07a"], bak: ["#fff6e2", "#f08a4a"] },
  mars: { haar: "#4a1f1a", frisyre: "pigg", skjegg: "kort", oye: "#ff3b2a", uttrykk: "sint", drakt: "#9c2a22", linje: "#e9c24a", snitt: "rustning", metall: "#e0a83a", pryd: "galea", ting: "gladius", aura: ["stral", "#ff7a5a"], bak: ["#ffe2d6", "#a8281e"] },
  merkur: { haar: "#8a5a34", frisyre: "krøll", oye: "#2fb0e0", uttrykk: "lur", drakt: "#3f7fc0", linje: "#ffd24a", snitt: "toga", metall: "#f0d070", pryd: "vinghatt", ting: "stav", aura: ["ring", "#9fd8ff"], bak: ["#eefaff", "#5a9ad0"] },
  jupiter: { haar: "#b07a3a", frisyre: "krøll", skjegg: "fullt", oye: "#ffc93a", uttrykk: "stolt", drakt: "#fff8ea", linje: "#c9922a", snitt: "toga", metall: "#ffd24a", pryd: "laurGull", ting: "lyn", aura: ["lyn", "#ffe08a"], bak: ["#fffbe0", "#d89a2a"] },
  bastet: { haar: "#241c33", frisyre: "bob", hud: "#c98d62", oye: "#3fe08a", uttrykk: "lur", drakt: "#1f7a6a", linje: "#ffd24a", linje2: "#1f9a8a", snitt: "krage", metall: "#ffd24a", pryd: "kattepryd", ting: "sistrum", aura: ["ring", "#4fe0c0"], bak: ["#fff6d8", "#c99a3a"] },
  anubis: { haar: "#1c1730", frisyre: "bob", hud: "#5b4f6e", oye: "#ffcf3a", uttrykk: "rolig", drakt: "#2a2340", linje: "#ffd24a", linje2: "#26203a", snitt: "krage", metall: "#ffd24a", pryd: "sjakal", ting: "ankh", aura: ["ring", "#ffcf5a"], bak: ["#ffe9b0", "#4a3560"] },
  thot: { haar: "#20304f", frisyre: "bob", hud: "#b98560", oye: "#4fb8ff", uttrykk: "rolig", drakt: "#e8eef8", linje: "#ffd24a", linje2: "#2f5aa8", snitt: "krage", metall: "#ffd24a", pryd: "ibis", ting: "rull", aura: ["ring", "#a9c8ff"], bak: ["#eef4ff", "#3f6ab8"] },
  osiris: { haar: "#1f2f2a", frisyre: "bob", hud: "#79b98a", skjegg: "faraos", oye: "#e9f27a", uttrykk: "stolt", drakt: "#f6f2e4", linje: "#ffd24a", linje2: "#3fa36a", snitt: "krage", metall: "#ffd24a", pryd: "atef", ting: "krum", aura: ["blad", "#5fc27a"], bak: ["#f2ffe8", "#3f8a5a"] },
  ra: { haar: "#3a1f14", frisyre: "bob", hud: "#e0a05a", oye: "#ff7a1c", uttrykk: "sint", drakt: "#d8402a", linje: "#ffd24a", linje2: "#d8402a", snitt: "krage", metall: "#ffc02a", pryd: "sol", ting: "septer", aura: ["stral", "#ffd24a"], bak: ["#fff6c0", "#f08a1c"] },
  hermes: { haar: "#f2c65a", frisyre: "pigg", oye: "#3fc0a0", uttrykk: "lur", drakt: "#f4f7ff", linje: "#5b9bd5", snitt: "toga", metall: "#cdd8e6", pryd: "vinghatt", ting: "stav", aura: ["ring", "#bcd0ff"], bak: ["#f6f9ff", "#8aa2e0"] },
  ares: { haar: "#1f1414", frisyre: "pigg", oye: "#ff2a2a", uttrykk: "sint", arr: true, drakt: "#5a1a1a", linje: "#c98a3a", snitt: "rustning", metall: "#b07a3a", pryd: "korint", ting: "krigsspyd", aura: ["ild"], bak: ["#ffd8b8", "#7a1a14"] },
  poseidon: { haar: "#2f9fb0", frisyre: "bolger", skjegg: "fullt", oye: "#4fe8ff", uttrykk: "stolt", drakt: "#1f6a8a", linje: "#8ff0e0", snitt: "rustning", metall: "#7fd8d0", pryd: "korall", ting: "trefork", aura: ["vann", "#4ab8e0"], bak: ["#e0fbff", "#1f6f9a"] },
  zevs: { haar: "#f4f4fa", frisyre: "pigg", skjegg: "langt", oye: "#ffd21a", uttrykk: "sint", drakt: "#fdfbf2", linje: "#e0a92a", snitt: "toga", metall: "#ffd24a", pryd: "laurGull", ting: "lyn", aura: ["lyn", "#fff2a0"], bak: ["#fffde0", "#6a7ad8"] },
  kronos: { haar: "#3a2460", frisyre: "langt", skjegg: "langt", hud: "#cdb8e8", oye: "#ffd21a", uttrykk: "stolt", drakt: "#2a1a44", linje: "#c58bff", snitt: "rustning", metall: "#c9a04a", pryd: "timeglass", ting: "ljaa", aura: ["ur", "#b07aff"], bak: ["#f0e0ff", "#3a1f6a"] },
  prestisje: { haar: "#ffcf3a", frisyre: "pigg", oye: "#ff5a3d", uttrykk: "stolt", drakt: "#c9201a", linje: "#ffd24a", snitt: "pels", metall: "#ffd24a", pryd: "keiser", ting: "eple", aura: ["fonix", "#ff8f2a"], bak: ["#fff6c8", "#e0621c"] },
};

/** Portrettet av en gud som SVG. Med bakgrunn blir det et kort, uten blir det en fri figur. */
export function lagGud(id, klasse, bakgrunn = false) {
  const g = GUDER[id], n = `${PRE}${++teller}x`, h = HAAR[g.frisyre], met = g.metall;
  const grad = (navn, stopp, retning = 'x1="0" y1="0" x2="0" y2="1"') => `<linearGradient id="${n}${navn}" ${retning}>${stopp.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`;
  const hud = g.hud ?? "#f9c9ba";
  const defs = "<defs>" + grad("HUD", [[0, lys(hud, 0.3)], [0.6, hud], [1, mork(hud, 0.14)]]) + grad("HAAR", [[0, lys(g.haar, 0.28)], [0.55, g.haar], [1, mork(g.haar, 0.35)]]) +
    grad("HAAR2", [[0, g.haar], [0.49, g.haar], [0.51, g.haar2 ?? g.haar], [1, g.haar2 ?? g.haar]], 'x1="0" y1="0" x2="1" y2="0"') +
    grad("DRAKT", [[0, lys(g.drakt, 0.2)], [1, mork(g.drakt, 0.35)]]) + grad("MET", [[0, lys(met, 0.65)], [0.45, met], [0.6, mork(met, 0.22)], [1, lys(met, 0.2)]], 'x1="0" y1="0" x2="1" y2="1"') +
    grad("IRIS", [[0, mork(g.oye, 0.6)], [0.5, g.oye], [1, lys(g.oye, 0.6)]]) +
    `<radialGradient id="${n}BAK" cx="50%" cy="42%" r="68%"><stop offset="0" stop-color="${g.bak[0]}"/><stop offset="1" stop-color="${g.bak[1]}"/></radialGradient><radialGradient id="${n}GLOD" cx="50%" cy="46%" r="50%"><stop offset="0" stop-color="${g.bak[0]}" stop-opacity=".95"/><stop offset=".7" stop-color="${g.bak[0]}" stop-opacity=".35"/><stop offset="1" stop-color="${g.bak[0]}" stop-opacity="0"/></radialGradient></defs>`;
  const haarfyll = g.haar2 ? `url(#${n}HAAR2)` : `url(#${n}HAAR)`;
  const metall = (s) => s.replaceAll("url(#MET)", `url(#${n}MET)`);
  const skjegg = g.skjegg ? `<path d="${SKJEGG[g.skjegg]}" fill="${g.skjegg === "faraos" ? "#ffd24a" : `url(#${n}HAAR)`}"/>` + (g.skjegg === "faraos" ? '<path d="M93 156h14M93 166h14M94 176h12" stroke="#2f5aa8" stroke-width="3"/>' : `<path d="M82 136Q84 158 92 172M100 134V176M118 136Q116 158 108 172" fill="none" stroke="${mork(g.haar, 0.35)}" stroke-width="1.6" opacity=".7"/>`) : "";
  const [aura, farge] = g.aura;
  const hjelm = ["korint", "galea", "sjakal", "ibis", "sol", "atef", "slor"].includes(g.pryd);   // dekker håret foran
  return `<svg class="${klasse}" viewBox="${bakgrunn ? "0 0 200 200" : "-10 -14 222 220"}" aria-hidden="true" focusable="false">${defs}` +
    (bakgrunn ? `<rect x="-10" y="-20" width="230" height="240" fill="url(#${n}BAK)"/>` : `<circle cx="100" cy="92" r="104" fill="url(#${n}GLOD)"/>`) +
    `<g stroke="${K}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><g class="gud-aura">${AURA[aura](farge)}</g>` +
    // Krøllen på halen titter frem
    `<path d="M22 168q-16-4-12-16 4-10 13-5 6 5 0 11-6 4-11-2" fill="none" stroke="${mot(hud, "#e8668a", 0.4)}" stroke-width="5"/>` +
    `<path d="${h.bak}" fill="${haarfyll}"/>${kropp(g, n).replaceAll("url(#MET)", `url(#${n}MET)`)}<g class="gud-hode">${hode(g, n)}${skjegg ? skjegg + (g.skjegg === "faraos" ? "" : `<path d="${UTTRYKK[g.uttrykk].munn}" fill="none" stroke="${mork(hud, 0.6)}" stroke-width="2.6"/>${TRYNE(hud)}`) : ""}` +
    (hjelm ? "" : `<path d="${h.foran}" fill="${haarfyll}"/><path d="M82 48Q68 58 63 78M92 46Q84 56 80 70M108 46Q114 56 120 70M118 48Q132 58 137 78" fill="none" stroke="${mork(g.haar, 0.45)}" stroke-width="1.5" opacity=".55"/><path d="${h.glans}" fill="#fff" opacity=".42" stroke="none"/>`) +
    `${metall(PRYD[g.pryd]())}${bryn(80, 1, UTTRYKK[g.uttrykk], mork(g.haar, 0.3))}${g.lapp ? "" : bryn(120, -1, UTTRYKK[g.uttrykk], mork(g.haar2 ?? g.haar, 0.3))}` +
    `${g.lapp ? '<path d="M56 66L108 92M140 94L150 78" stroke="#1c1526" stroke-width="5"/><path d="M104 90Q124 82 143 94Q146 120 124 124Q106 120 104 90Z" fill="#241c30"/><path d="M111 96Q124 91 136 98" stroke="#6a5a78" stroke-width="2" fill="none"/>' : ""}</g><g class="gud-ting">${metall(TING[g.ting])}</g>` +
    // Glitter
    `<g fill="#fff" stroke="none" class="gud-glitter">${[[26, 30, 6], [176, 26, 5], [14, 96, 4], [186, 110, 5]].map(([x, y, m]) => `<path d="M${x} ${y - m}L${x + m * 0.28} ${y - m * 0.28}L${x + m} ${y}L${x + m * 0.28} ${y + m * 0.28}L${x} ${y + m}L${x - m * 0.28} ${y + m * 0.28}L${x - m} ${y}L${x - m * 0.28} ${y - m * 0.28}Z" opacity=".85"/>`).join("")}</g></g></svg>`;
}
