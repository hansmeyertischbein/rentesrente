// Figurene i «Overfør»: fargerike byster og ting i SVG, 64 × 64.
// Navnene er oppdiktet, og tegningene er karikaturer. Gruppene fig-kropp, fig-oyne og fig-ting
// beveger seg hver for seg når du eier selskapet. tile er fargen på flisen bak figuren.

const K = "#2b2118";
const HUD = "#f6c7a1";
const HUD_MORK = "#e7a97f";
const KINN = '<circle cx="21" cy="36" r="2.6" fill="#f08a7e" stroke="none" opacity=".7"/><circle cx="43" cy="36" r="2.6" fill="#f08a7e" stroke="none" opacity=".7"/>';
const OYNE = (y = 29, avstand = 6.5) =>
  `<g class="fig-oyne"><circle cx="${32 - avstand}" cy="${y}" r="1.9" fill="${K}" stroke="none"/><circle cx="${32 + avstand}" cy="${y}" r="1.9" fill="${K}" stroke="none"/>` +
  `<circle cx="${32.7 - avstand}" cy="${y - 0.7}" r=".6" fill="#fff" stroke="none"/><circle cx="${32.7 + avstand}" cy="${y - 0.7}" r=".6" fill="#fff" stroke="none"/></g>`;
const ANSIKT = (fyll = HUD, rx = 14, ry = 15) => `<ellipse cx="32" cy="29" rx="${rx}" ry="${ry}" fill="${fyll}"/>`;
const ORER = (fyll = HUD) => `<circle cx="17.5" cy="31" r="3.4" fill="${fyll}"/><circle cx="46.5" cy="31" r="3.4" fill="${fyll}"/>`;
const SMIL = '<path d="M25 37.5q7 6.5 14 0z" fill="#fff"/>';
const SMIL_LITE = '<path d="M27 38q5 3.5 10 0" fill="none"/>';
const BRILLER = (farge = K) => `<g fill="#fff" fill-opacity=".35" stroke="${farge}" stroke-width="2.2"><circle cx="25.5" cy="29" r="5.2"/><circle cx="38.5" cy="29" r="5.2"/></g><path d="M30.7 28.6h2.6" stroke="${farge}" stroke-width="2.2"/>`;
const NESE = '<path d="M32 31q-2.2 3.5.8 4.3" fill="none"/>';

const PERSON_ENKEL = () => ANSIKT() + ORER();
const svg = (innhold) =>
  `<svg class="fig" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><g stroke="${K}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${innhold}</g></svg>`;
const figur = (kropp, ting = "") => svg(`<g class="fig-kropp">${kropp}</g><g class="fig-ting">${ting}</g>`);

export const FIGURER = {
  // Limonadebod: markise med striper, disk i tre og en glad sitron.
  limonade: { tile: "#cfe8f7", svg: figur(
    '<path d="M14 30v28M50 30v28" fill="none"/><rect x="10" y="40" width="44" height="18" rx="3" fill="#d9a066"/><path d="M10 47h44" fill="none"/>' +
    '<path d="M7 18h50l-3 12H10z" fill="#fff"/><path d="M13 18l-1 12h7l1-12zM27 18v12h7V18zM41 18l1 12h7l-1-12z" fill="#e8553d"/><path d="M7 18h50" fill="none"/>',
    '<ellipse cx="32" cy="35" rx="9" ry="7" fill="#f6d53f"/><path d="M41 35l3-1" fill="none"/><circle cx="29" cy="34" r="1" fill="' + K + '" stroke="none"/><circle cx="35" cy="34" r="1" fill="' + K + '" stroke="none"/><path d="M30 37q2 1.6 4 0" fill="none"/>'
  ) },
  // Blomsterbutikk: krukke med smil og tre tulipaner.
  blomst: { tile: "#fde0e6", svg: figur(
    '<path d="M18 38h28l-4 22H22z" fill="#d9774a"/><path d="M16 34h32v6H16z" fill="#e68a5c"/><circle cx="28" cy="48" r="1" fill="' + K + '" stroke="none"/><circle cx="36" cy="48" r="1" fill="' + K + '" stroke="none"/><path d="M29 52q3 2.5 6 0" fill="none"/>',
    '<path d="M32 34V18M24 34l-3-12M40 34l3-12" fill="none" stroke="#3f8f4a"/><path d="M32 26q-7-1-8 5 6 1 8-5z" fill="#7cc36a"/>' +
    '<path d="M27 12q5-4 10 0v6q-5 4-10 0z" fill="#e8553d"/><path d="M16 16q4-4 9-1l-1 6q-5 2-8-1z" fill="#f19bb0"/><path d="M48 16q-4-4-9-1l1 6q5 2 8-1z" fill="#f6c945"/>'
  ) },
  // Jordbærstand: et stort jordbær med ansikt i en kurv.
  jordbaer: { tile: "#e3f3d6", svg: figur(
    '<path d="M10 44h44l-5 16H15z" fill="#d9a066"/><path d="M12 50h40M14 55h36" fill="none"/>' +
    '<path d="M32 50c-12 0-18-10-16-20 2-7 9-10 16-10s14 3 16 10c2 10-4 20-16 20z" fill="#e8453d"/>' +
    '<g fill="#fde68a" stroke="none"><circle cx="22" cy="30" r="1"/><circle cx="42" cy="30" r="1"/><circle cx="25" cy="42" r="1"/><circle cx="39" cy="42" r="1"/><circle cx="32" cy="45" r="1"/></g>' +
    OYNE(33, 5) + '<path d="M29 38q3 2.5 6 0" fill="none"/>',
    '<path d="M22 21l5-7 5 5 5-5 5 7q-10 4-20 0z" fill="#5fae4f"/><path d="M32 14V9" fill="none" stroke="#3f8f4a"/>'
  ) },
  // Onkels ølbryggeri: et krus med skum og bart.
  onkel: { tile: "#f6e2c4", svg: figur(
    '<path d="M44 28h6q7 0 7 9t-7 9h-6" fill="none" stroke-width="3"/><rect x="14" y="22" width="32" height="38" rx="5" fill="#f2b33d"/>' +
    '<path d="M22 30v24M30 30v24M38 30v24" fill="none" stroke="#fff" stroke-opacity=".55"/>' +
    '<path d="M11 24q0-8 8-8 2-6 9-5 4-5 10-1 8-2 10 5 6 1 5 9-2 5-6 4H17q-6 1-6-4z" fill="#fffaf0"/>' +
    OYNE(33, 6) + '<path d="M19 42q6-5 13-1 7-4 13 1-5 4-13 1-8 3-13-1z" fill="#7a4a2a"/>'
  ) },
  // O. Geitan: blank isse, hvite totter, små geitehorn, runde briller, bukkeskjegg og handlekurv.
  geitan: { tile: "#d8ecd0", svg: figur(
    '<path d="M12 64c0-9 9-14 20-14s20 5 20 14z" fill="#5aa469"/><path d="M27 50l5 5 5-5" fill="none"/>' +
    '<path d="M21 17c-5-5-4-11 0-13 0 4 2 7 5 9z" fill="#ead6ad"/><path d="M43 17c5-5 4-11 0-13 0 4-2 7-5 9z" fill="#ead6ad"/>' +
    ORER() + ANSIKT() +
    '<path d="M17 22q-3 7 1 13l3-2q-2-5 0-10z" fill="#f4f1ea"/><path d="M47 22q3 7-1 13l-3-2q2-5 0-10z" fill="#f4f1ea"/>' +
    BRILLER() + OYNE() + KINN + NESE + SMIL + '<path d="M29 43q3 9 6 0z" fill="#f4f1ea"/>',
    '<path d="M44 52h15l-2 11H46z" fill="#f29b38"/><path d="M46 52q6-9 11 0" fill="none"/><path d="M49 52l2-7M54 52l1-6" fill="none" stroke="#e8553d" stroke-width="2.6"/>'
  ) },
  // P. Lilledalen: liten kropp, stor bølge av sølvhår, solbrun, bredt glis, rosa dress og hotellklokke.
  lilledalen: { tile: "#fde2ef", svg: figur(
    '<path d="M20 64c0-8 5-12 12-12s12 4 12 12z" fill="#e86fa6"/><path d="M29 52l3 6 3-6z" fill="#fff"/><circle cx="38" cy="57" r="1.8" fill="#f6c945"/>' +
    ORER(HUD_MORK) + ANSIKT(HUD_MORK) +
    '<path d="M15 30c-6-14 2-27 18-28 14-1 22 8 18 22-2-5-6-7-10-6 1 4-2 7-6 6-3-5-9-5-13 0-3 2-5 4-7 6z" fill="#cfd3dc"/><path d="M22 12q9-6 20-1M24 18q8-4 15 0" fill="none"/>' +
    '<path d="M22 24l6-2M36 22l6 2" fill="none"/>' + OYNE() + KINN + NESE +
    '<path d="M22 36.5q10 11 20 0z" fill="#fff"/><path d="M23 37.5h18" fill="none"/>',
    '<path d="M46 60h14M48 60q0-8 5-8t5 8z" fill="#f2c14e"/><circle cx="53" cy="50.5" r="1.5" fill="#f2c14e"/>'
  ) },
  // G. Blitzøe: gul sydvest med lyn, røde kinn, gul regnjakke og en laks.
  blitzoe: { tile: "#d6ecf6", svg: figur(
    '<path d="M10 64c0-9 9-14 22-14s22 5 22 14z" fill="#f6c945"/><path d="M32 50v14" fill="none"/>' +
    ORER() + ANSIKT() + '<path d="M19 33q-1 9 6 12M45 33q1 9-6 12" fill="none" stroke="#b9b4ac" stroke-dasharray="1 3"/>' +
    '<path d="M16 22q2-14 16-14t16 14z" fill="#f6c945"/><path d="M9 24q23-8 46 0l2 4q-25-7-50 0z" fill="#f6c945"/>' +
    '<path d="M34 9l-5 7h4l-3 6 7-8h-4l2-5z" fill="#3d7cc9" stroke-width="1.4"/>' +
    OYNE(31) + KINN.replaceAll('opacity=".7"', 'opacity="1"') + NESE + SMIL_LITE,
    '<path d="M34 54q12-8 22 0-10 8-22 0z" fill="#f2907a"/><path d="M56 54l6-5v10z" fill="#f2907a"/><circle cx="38.5" cy="53" r="1" fill="' + K + '" stroke="none"/><path d="M44 51q2 3 0 6" fill="none"/>'
  ) },
  // K. Løkke: bred kjeve, snauklipt, skjeggstubb, marineblå jakke og et tau i løkke.
  lokke: { tile: "#dfe3f3", svg: figur(
    '<path d="M4 64c0-10 11-15 28-15s28 5 28 15z" fill="#2f4f7f"/><path d="M26 49l6 7 6-7" fill="#fff"/>' +
    ORER() + '<rect x="16" y="11" width="32" height="36" rx="13" fill="' + HUD + '"/>' +
    '<path d="M16 25v-3q0-11 12-11h8q12 0 12 11v3q-8-6-16-6t-16 6z" fill="#5a4a3f"/>' +
    '<g fill="#8a7a6c" stroke="none"><circle cx="22" cy="41" r=".8"/><circle cx="26" cy="43" r=".8"/><circle cx="38" cy="43" r=".8"/><circle cx="42" cy="41" r=".8"/><circle cx="32" cy="44" r=".8"/><circle cx="29" cy="45" r=".8"/><circle cx="35" cy="45" r=".8"/></g>' +
    '<path d="M22 26l7 1M35 27l7-1" fill="none" stroke-width="2.6"/>' + OYNE(30) + NESE + '<path d="M27 38.5q6 2 11-2" fill="none"/>',
    '<circle cx="53" cy="50" r="7" fill="none" stroke="#b07a4a" stroke-width="3.5"/><path d="M53 57q2 4 0 7" fill="none" stroke="#b07a4a" stroke-width="3.5"/>'
  ) },
  // J. Fredriksjø: kapteinslue, hvitt hår, store hvite bryn, i en liten tanker på bølger.
  fredriksjo: { tile: "#cfe4f5", svg: figur(
    ORER() + ANSIKT(HUD, 13, 14) +
    '<path d="M18 27q-3 6 0 11l3-1q-2-5 0-9zM46 27q3 6 0 11l-3-1q2-5 0-9z" fill="#f4f1ea"/>' +
    '<path d="M18 17q14-12 28 0v5H18z" fill="#fff"/><path d="M16 21h32l-2 5H18z" fill="#2f4f7f"/><circle cx="32" cy="17" r="2.6" fill="#f2c14e"/>' +
    '<path d="M21 28q4-4 8-1M35 27q4-3 8 1" fill="#f4f1ea" stroke-width="3"/>' + OYNE(31, 6) + NESE + SMIL_LITE,
    '<path d="M4 44h56l-7 13H11z" fill="#d6453d"/><path d="M6 49h52" fill="none"/><rect x="42" y="37" width="9" height="7" fill="#fff"/><path d="M45 37v-4h3v4" fill="#2b2118"/>' +
    '<path d="M0 60q4-4 8 0t8 0 8 0 8 0 8 0 8 0 8 0 8 0v4H0z" fill="#6aa9e0"/>'
  ) },
  // K. Sandresen: langt lyst hår, solbriller på hodet, turkis topp, sandbøtte og spade.
  sandresen: { tile: "#d4efe9", svg: figur(
    '<path d="M13 32q-2-22 19-22t19 22v17q-4 4-8 2V33H21v18q-4 2-8-2z" fill="#f2cf7a"/>' +
    '<path d="M14 64c0-9 8-13 18-13s18 4 18 13z" fill="#5bb5a2"/>' + ANSIKT(HUD, 13, 14.5) +
    '<path d="M19 24q6-11 26-3-7-3-13 1-6 3-13 2z" fill="#f2cf7a"/><path d="M20 15h10v4H20zM34 15h10v4H34z" fill="#e86fa6"/><path d="M30 17h4" fill="none"/>' +
    '<circle cx="18.5" cy="38" r="1.6" fill="#f6c945"/><circle cx="45.5" cy="38" r="1.6" fill="#f6c945"/>' +
    OYNE() + KINN + NESE + SMIL,
    '<path d="M42 51h13l-2 12h-9z" fill="#e8553d"/><path d="M42 51q6.5-7 13 0" fill="none"/><path d="M60 40v18" fill="none" stroke="#3d7cc9" stroke-width="2.6"/><path d="M56 34h8l-4 7z" fill="#3d7cc9"/>'
  ) },
  // C. Mittelfart: mørkt hår med pannelugg, røde lepper, store øreringer, lilla jakke, fartsstriper og en pil opp.
  mittelfart: { tile: "#ece0f5", svg: figur(
    '<path d="M2 22h9M0 30h10M2 38h8" fill="none" stroke="#6aa9e0" stroke-width="3"/>' +
    '<path d="M14 34q-2-24 18-24t18 24v14q-4 4-8 1V34H22v15q-4 3-8-1z" fill="#3a2b2b"/>' +
    '<path d="M14 64c0-9 8-13 18-13s18 4 18 13z" fill="#8a5a9e"/><path d="M28 51l4 7 4-7" fill="#fff"/>' + ANSIKT(HUD, 13, 14.5) +
    '<path d="M18 27q4-14 22-12 5 1 6 6-9-4-15 0-6 4-13 6z" fill="#3a2b2b"/>' +
    '<circle cx="18" cy="39" r="3" fill="none" stroke="#f2c14e" stroke-width="2"/><circle cx="46" cy="39" r="3" fill="none" stroke="#f2c14e" stroke-width="2"/>' +
    OYNE() + KINN + NESE + '<path d="M27 37q5 4 10 0-5 2-10 0z" fill="#d6453d"/>',
    '<path d="M42 62l5-7 4 3 8-11" fill="none" stroke="#3f9d5a" stroke-width="3.2"/><path d="M54 46l6-1-1 6z" fill="#3f9d5a" stroke="#3f9d5a"/>'
  ) },
  // Koka-Kolla: rød boks med hvit bølge og sugerør.
  kolla: { tile: "#fde0d9", svg: figur(
    '<rect x="19" y="14" width="26" height="44" rx="5" fill="#d6453d"/><path d="M19 20h26M19 52h26" fill="none"/>' +
    '<path d="M19 38q8-8 14-2t12-2v6q-6 4-12 1t-14 3z" fill="#fff"/>' + '<circle cx="28" cy="29" r="1.1" fill="#fff" stroke="none"/><circle cx="36" cy="29" r="1.1" fill="#fff" stroke="none"/>',
    '<path d="M36 14l6-12" fill="none" stroke="#5bb5a2" stroke-width="3"/>'
  ) },
  // Valmart: blå handlevogn med en stjerne.
  valmart: { tile: "#dbe8f9", svg: figur(
    '<path d="M6 16h8l6 28h28l5-20H17" fill="none" stroke-width="3"/><path d="M17 24h36l-5 20H20z" fill="#3d7cc9"/>' +
    '<path d="M27 24v20M37 24v20M18 34h33" fill="none" stroke="#fff" stroke-opacity=".7"/><circle cx="24" cy="54" r="4" fill="#fff"/><circle cx="44" cy="54" r="4" fill="#fff"/>',
    '<path d="M50 6l2 5 5 .5-4 3.5 1 5-4-3-4 3 1-5-4-3.5 5-.5z" fill="#f6c945"/>'
  ) },
  // Amasån: en pappeske med teip og et lurt smil.
  amasan: { tile: "#f6e6cf", svg: figur(
    '<path d="M10 24l22-10 22 10v26L32 60 10 50z" fill="#d9a066"/><path d="M10 24l22 10 22-10M32 34v26" fill="none"/>' +
    '<path d="M21 19l22 10v8" fill="none" stroke="#f2e2c4" stroke-width="3"/>' +
    '<circle cx="18" cy="38" r="1.1" fill="' + K + '" stroke="none"/><circle cx="25" cy="41" r="1.1" fill="' + K + '" stroke="none"/><path d="M16 45q5 5 11 3" fill="none"/><path d="M25 46l2 2-3 1" fill="none"/>'
  ) },
  // Mikromyk: en myk pute med fire fargede ruter.
  mikromyk: { tile: "#e6e9f3", svg: figur(
    '<path d="M10 14q22-6 44 0 6 18 0 36-22 6-44 0-6-18 0-36z" fill="#fffaf0"/>' +
    '<rect x="19" y="20" width="12" height="12" rx="2" fill="#e8553d"/><rect x="33" y="20" width="12" height="12" rx="2" fill="#5fae4f"/>' +
    '<rect x="19" y="34" width="12" height="12" rx="2" fill="#3d7cc9"/><rect x="33" y="34" width="12" height="12" rx="2" fill="#f6c945"/>'
  ) },
  // Eple: rødt eple med bitt og blad.
  eple: { tile: "#e5f2d8", svg: figur(
    '<path d="M32 20c-6-5-20-4-20 12 0 14 9 24 15 24 3 0 3-2 5-2s2 2 5 2c5 0 10-6 13-14-4-2-6-6-5-10 1-3 2-4 4-5-3-6-10-9-17-7z" fill="#e8453d"/>' +
    '<circle cx="26" cy="36" r="1.2" fill="' + K + '" stroke="none"/><circle cx="34" cy="36" r="1.2" fill="' + K + '" stroke="none"/><path d="M27 41q3 2.5 6 0" fill="none"/>',
    '<path d="M32 20q0-7 4-10" fill="none"/><path d="M35 14q6-8 13-4-5 7-13 4z" fill="#5fae4f"/>'
  ) },
  // N-Vidde: en grønn databrikke med fjell og snø.
  nvidde: { tile: "#dcf0d5", svg: figur(
    '<path d="M20 8v6M28 8v6M36 8v6M44 8v6M20 50v6M28 50v6M36 50v6M44 50v6M8 20h6M8 28h6M8 36h6M8 44h6M50 20h6M50 28h6M50 36h6M50 44h6" fill="none"/>' +
    '<rect x="14" y="14" width="36" height="36" rx="5" fill="#76b852"/><path d="M18 44l9-14 6 8 5-6 8 12z" fill="#fffaf0"/><path d="M24 35l3-5 3 4" fill="#fff" stroke-width="1.6"/>'
  ) },
  // N. Tangent (booster): skill i håret, runde briller, slips og en jordklode med en tangent.
  tangent: { tile: "#d9eaf7", svg: figur(
    '<path d="M12 64c0-9 9-14 20-14s20 5 20 14z" fill="#5d7088"/><path d="M28 50l4 4 4-4" fill="#fff"/><path d="M32 54l-2.5 4 2.5 6 2.5-6z" fill="#d6453d"/>' +
    ORER() + ANSIKT() + '<path d="M17 25q-1-14 15-14t15 14q-8-8-18-6-6 1-12 6z" fill="#3a2f2a"/>' +
    BRILLER() + OYNE() + KINN + NESE + SMIL,
    '<circle cx="52" cy="50" r="9" fill="#6aa9e0"/><path d="M47 45q4 1 3 5t4 4M55 43q3 3 1 6" fill="none" stroke="#3f8f4a" stroke-width="2.4"/><path d="M44 39.5l19-3.4" fill="none" stroke="#e8553d" stroke-width="2.4"/>'
  ) },
  // Investeringsrådgiveren Finn Fondsen: skallet med grå tjafser, bart, briller og pekestokk.
  radgiver: { tile: "#efe3fb", svg: figur(
    '<path d="M12 64c0-9 9-14 20-14s20 5 20 14z" fill="#3d4a5c"/><path d="M28 50l4 4 4-4" fill="#fff"/><path d="M32 54l-2.5 4 2.5 6 2.5-6z" fill="#f6c945"/>' +
    ORER() + ANSIKT() + '<path d="M18.5 27q-2-7 3-10M45.5 27q2-7-3-10" fill="none" stroke="#a39a92" stroke-width="3.4"/>' +
    BRILLER() + OYNE() + KINN + NESE + '<path d="M25.5 37q3.5-2.6 6.5-.4 3-2.2 6.5.4-3 3.4-6.5 1.4-3.5 2-6.5-1.4z" fill="#a39a92"/>',
    '<path d="M44 62l15-26" fill="none" stroke="#8a5a2b" stroke-width="2.8"/><circle cx="59" cy="35" r="2.6" fill="#e8553d"/>'
  ) },
  // Trykkboostere: en liten gris med mynt.
  trykk: { tile: "#fde2ea", svg: figur(
    '<path d="M18 50v8M28 52v7M40 52v7M48 50v8" fill="none" stroke-width="4"/><ellipse cx="32" cy="40" rx="22" ry="16" fill="#f7b3c2"/>' +
    '<path d="M44 28l4-8 4 9z" fill="#ec8ea5"/><ellipse cx="54" cy="42" rx="5" ry="6" fill="#f39ab0"/><circle cx="46" cy="36" r="1.6" fill="' + K + '" stroke="none"/><rect x="24" y="24" width="12" height="3" rx="1.5" fill="' + K + '"/>',
    '<circle cx="30" cy="12" r="7" fill="#f6c945"/><path d="M30 8v8" fill="none"/>'
  ) },
  // Ukjent selskap: et spørsmålstegn.
  skygge: { tile: "#d9d2c8", svg: svg('<circle cx="32" cy="32" r="20" fill="#5a5048"/><path d="M26 27q0-7 6-7t6 6q0 4-6 6v4" fill="none" stroke="#fffaf0" stroke-width="3.2"/><circle cx="32" cy="43" r="1.6" fill="#fffaf0" stroke="#fffaf0"/>') },
  // Uro i markedet: en jordklode.
  klode: { tile: "#d6ecf6", svg: svg('<circle cx="32" cy="32" r="22" fill="#6aa9e0"/><path d="M16 22q8 2 10 9t-4 12M38 12q-4 8 3 12t13 2M36 54q0-8 6-10t8 4" fill="#7cc36a" stroke-width="2"/>') },
};

// Den store sparegrisen. Ser mot høyre, med myntspor på ryggen.
// ---------- Grisen ----------

// Grisen kan være en gudegris: annen farge på kroppen og pynt som viser guden. Pynten tegnes i grisens koordinater (132 × 104),
// med hodet til høyre: øret rundt (93, 18), øyet i (92, 44) og trynet i (111, 58).
const HJELM = (farge, horn = "#fffaf0") => `<path d="M82 24q-11-5-10-19 6 9 14 12z" fill="${horn}"/><path d="M114 24q11-5 10-19-6 9-14 12z" fill="${horn}"/>` +
  `<path d="M80 31q1-20 18-20t18 20z" fill="${farge}"/><path d="M80 31h36" fill="none"/><circle cx="98" cy="15" r="2" fill="${K}" stroke="none"/>`;
const KRANS = (farge) => `<path d="M80 28q18-18 36 0" fill="none" stroke="${farge}" stroke-width="3.5"/>` +
  [[82, 25, -40], [87, 19, -25], [94, 15, -8], [102, 15, 10], [109, 19, 28], [114, 25, 42]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="4.5" ry="2.4" transform="rotate(${r} ${x} ${y})" fill="${farge}" stroke-width="1.4"/>`).join("");
const NEMES = (a, b) => `<path d="M79 22h38l7 34-9-5-5-21h-24l-5 21-9 5z" fill="${a}"/><path d="M83 30l-2 10M113 30l2 10M88 22v8M98 22v8M108 22v8" fill="none" stroke="${b}" stroke-width="2.6"/>`;
const LYN = (x, y, s = 1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M6 0L0 13h6l-3 11 11-15H8l4-9z" fill="#ffd84a"/>`;
const VINGER = '<path d="M80 22q-12-8-14 2 6 0 8 3-6 1-6 5 8 0 12-4z" fill="#fff"/><path d="M116 22q12-8 14 2-6 0-8 3 6 1 6 5-8 0-12-4z" fill="#fff"/>';
const KRONE = (farge = "#ffd84a") => `<path d="M84 26l-2-16 8 8 8-12 8 12 8-8-2 16z" fill="${farge}"/><circle cx="98" cy="20" r="2.2" fill="#e8553d"/>`;

// hode tegnes 1,3 ganger større rundt hodet, så pynten synes også når grisen er liten. ting tegnes som den er.
export const GUDEGRIS = {
  loke: { kropp: "#b9e3a8", hode: HJELM("#5fae5d"), ting: '<path d="M86 71q5 4 10 1" fill="none"/>' },
  heimdall: { kropp: "#f7dcae", hode: HJELM("#f1f5f9", "#ffd84a"), ting: '<path d="M116 84q12-2 14-14l-4-1q-3 8-10 10z" fill="#ffd84a"/>' },
  froya: { kropp: "#f7b3c2", hode: HJELM("#f19bb0", "#ffd84a"), ting: '<path d="M95 49q-2.5 4 0 7 2.5-3 0-7z" fill="#ffd84a"/>' },
  tor: { kropp: "#f4b08a", hode: HJELM("#aab4bf") + LYN(120, 8, 0.7), ting: '<rect x="119" y="72" width="7" height="24" rx="2" fill="#8b5a2b"/><rect x="109" y="61" width="27" height="14" rx="3" fill="#9aa5b1"/>' },
  odin: { kropp: "#c9cbe9", hode: HJELM("#5b6170", "#ffd84a"),
    ting: `<path d="M84 37l22 3" fill="none"/><ellipse cx="92" cy="45" rx="6" ry="5" fill="${K}"/><path d="M18 34q-7-12 5-14 7 0 9 7l7 2-7 4q-5 7-14 1z" fill="${K}"/><circle cx="26" cy="26" r="1.2" fill="#fff" stroke="none"/>` },
  janus: { kropp: "#f7c6b3", hode: KRANS("#7cc36a"), ting: `<circle cx="22" cy="44" r="2.8" fill="${K}" stroke="none"/><path d="M18 52q4 3 8 0" fill="none"/>` },
  vesta: { kropp: "#f8b99a", hode: KRANS("#7cc36a"), ting: '<path d="M26 32q-8-10 0-21 8 11 0 21z" fill="#f29b38"/><path d="M26 32q-3.5-5 0-10 3.5 5 0 10z" fill="#ffd84a" stroke="none"/>' },
  mars: { kropp: "#f09a8e", hode: '<path d="M80 31q2-20 18-20t18 20z" fill="#c9a227"/><path d="M84 12q14-14 30 4-14-6-30-4z" fill="#c0392b"/><path d="M80 31h36" fill="none"/>', ting: '<path d="M116 98V60" fill="none" stroke="#8b5a2b" stroke-width="3"/><path d="M111 62l5-12 5 12z" fill="#aab4bf"/>' },
  merkur: { kropp: "#cfe7f5", hode: '<path d="M82 28q0-14 16-14t16 14z" fill="#c9a227"/><path d="M82 28h32" fill="none"/>' + VINGER, ting: "" },
  jupiter: { kropp: "#ffe39a", hode: KRANS("#ffd84a"), ting: LYN(118, 64, 1.2) },
  bastet: { kropp: "#f3dcaa", hode: NEMES("#3b6fd8", "#ffd84a") + '<path d="M84 22l-2-14 9 8zM112 22l2-14-9 8z" fill="#c9a227"/>', ting: "" },
  anubis: { kropp: "#7d7d8f", hode: NEMES("#2b2118", "#ffd84a") + `<path d="M84 22l-1-20 9 14zM112 22l1-20-9 14z" fill="${K}"/>`, ting: "" },
  thot: { kropp: "#bcdcf2", hode: NEMES("#3b6fd8", "#ffd84a"), ting: '<rect x="110" y="70" width="20" height="14" rx="3" fill="#f6e7c1"/><path d="M114 75h12M114 79h8" fill="none" stroke-width="1.6"/>' },
  osiris: { kropp: "#a6dcae", hode: '<path d="M88 26q10-34 20 0z" fill="#f5f2e8"/><path d="M84 26q-4-10 4-12M112 26q4-10-4-12" fill="none" stroke="#c9a227" stroke-width="3"/><path d="M84 26h28" fill="none"/>', ting: "" },
  ra: { kropp: "#ffd36b", hode: '<circle cx="98" cy="6" r="11" fill="#ff9d1c"/>' + NEMES("#e8553d", "#ffd84a") + '<path d="M98 17q-4-6 0-9 4 3 0 9z" fill="#3f8f4a"/>', ting: "" },
  hermes: { kropp: "#d8e9fb", hode: '<path d="M82 28q0-14 16-14t16 14z" fill="#9aa5b1"/><path d="M82 28h32" fill="none"/>' + VINGER, ting: '<path d="M120 98V58" fill="none" stroke="#c9a227" stroke-width="3"/><path d="M114 64q6-6 12 0M114 70q6 6 12 0" fill="none" stroke="#3f8f4a" stroke-width="2.4"/>' },
  ares: { kropp: "#f2a092", hode: '<path d="M80 34q-2-24 18-24t18 24l-6-2-2-10h-20l-2 10z" fill="#b08d2a"/><path d="M78 14q20-18 40 0-20-6-40 0z" fill="#c0392b"/>', ting: '<circle cx="24" cy="62" r="12" fill="#b08d2a"/><circle cx="24" cy="62" r="5" fill="#c0392b"/>' },
  poseidon: { kropp: "#95d6ea", hode: KRONE("#7fd3e0"), ting: '<path d="M124 98V40M116 46q0-8 8-8t8 8M124 38v-8" fill="none" stroke="#c9a227" stroke-width="3"/><path d="M114 46l2-6 2 6zM130 46l2-6 2 6zM122 32l2-6 2 6z" fill="#c9a227"/>' },
  zevs: { kropp: "#fff1b0", hode: KRANS("#ffd84a") + LYN(116, -4, 1.1), ting: '<path d="M100 74q8 16 22 6-4-9-13-13z" fill="#f5f5f0"/>' },
  kronos: { kropp: "#bba7ea", hode: KRONE("#6a4fd0") + '<path d="M118 -2h12l-6 8 6 8h-12l6-8z" fill="#ffd84a"/>', ting: '<path d="M120 98V44" fill="none" stroke="#5b4636" stroke-width="3"/><path d="M120 44q16-2 14 18-4-12-14-10z" fill="#d8dde3"/>' },
  prestisje: { kropp: "#ffd84a", hode: KRONE(), ting: '<path d="M30 40q8-14 26-17" fill="none" stroke="#fff" stroke-width="4"/>' },
};

function morkere(hex, x) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.round(v * (1 - x)).toString(16).padStart(2, "0");
  return `#${f(n >> 16)}${f((n >> 8) & 255)}${f(n & 255)}`;
}

/** Grisen, vanlig rosa eller som en gudegris. id er guden, «prestisje» eller null. */
export function lagGris(id = null, klasse = "gris-fig") {
  const g = GUDEGRIS[id];
  const kropp = g?.kropp ?? "#f7b3c2";
  const mork = g ? morkere(kropp, 0.12) : "#ec8ea5";
  const snute = g ? morkere(kropp, 0.06) : "#f39ab0";
  const kinn = g ? morkere(kropp, 0.2) : "#ef7f97";
  // Som ikon får grisen plass til hjelmer, kroner og spyd over og ved siden av, så ingenting kuttes.
  const boks = klasse === "gris-fig" ? "0 0 132 104" : "-4 -32 150 140";
  return `<svg class="${klasse}" viewBox="${boks}" aria-hidden="true" focusable="false"><g stroke="${K}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">` +
    '<path d="M17 52q-12-4-11 5 1 7 9 3 4-3 0-6" fill="none"/>' +
    `<rect x="30" y="76" width="13" height="20" rx="5.5" fill="${mork}"/><rect x="48" y="78" width="13" height="18" rx="5.5" fill="${mork}"/>` +
    `<rect x="74" y="78" width="13" height="18" rx="5.5" fill="${mork}"/><rect x="91" y="76" width="13" height="20" rx="5.5" fill="${mork}"/>` +
    `<ellipse cx="64" cy="54" rx="50" ry="36" fill="${kropp}"/>` +
    `<path d="M84 26l9-18 9 21z" fill="${mork}"/><path d="M90 19l3-6 3 8" fill="${kropp}" stroke="none"/>` +
    `<rect x="48" y="20" width="28" height="6" rx="3" fill="${K}"/>` +
    `<ellipse cx="111" cy="58" rx="11" ry="13" fill="${snute}"/><ellipse cx="108" cy="55" rx="1.8" ry="3" fill="${K}" stroke="none"/><ellipse cx="115" cy="55" rx="1.8" ry="3" fill="${K}" stroke="none"/>` +
    `<g class="gris-oye"><circle cx="92" cy="44" r="4" fill="${K}" stroke="none"/><circle cx="93.4" cy="42.6" r="1.3" fill="#fff" stroke="none"/></g>` +
    `<ellipse cx="91" cy="62" rx="7" ry="4.5" fill="${kinn}" stroke="none"/><path d="M84 70q6 4 12 0" fill="none"/>` +
    '<path d="M30 40q8-14 26-17" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3.4"/>' +
    (g ? `<g class="gris-pynt">${g.ting}<g transform="translate(98 31) scale(1.3) translate(-98 -31)">${g.hode}</g></g>` : "") +
    "</g></svg>";
}

export const GRIS = lagGris();

// ---------- Ikoner: hvem du er ----------

// Hvert ikon har egen bakgrunn med gradient, som portrettkort i samlespill. Id-ene i gradientene er unike per ikon.
const bak = (id, a, b) => `<defs><radialGradient id="b-${id}" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>` +
  `<rect x="-2" y="-2" width="68" height="68" fill="url(#b-${id})" stroke="none"/>`;
const STRALER = (farge, opasitet = 0.35) => `<g stroke="none" fill="${farge}" opacity="${opasitet}">` +
  Array.from({ length: 12 }, (_, i) => `<path d="M32 30L${32 + 40 * Math.cos((i * Math.PI) / 6 - 0.13)} ${30 + 40 * Math.sin((i * Math.PI) / 6 - 0.13)}L${32 + 40 * Math.cos((i * Math.PI) / 6 + 0.13)} ${30 + 40 * Math.sin((i * Math.PI) / 6 + 0.13)}z"/>`).join("") + "</g>";
const DRESS = (farge = "#2f3b52", slips = "#c0392b") => `<path d="M8 66q2-17 24-19 22 2 24 19z" fill="${farge}"/><path d="M25 47l7 9 7-9" fill="#fff"/><path d="M30.5 51h3l1.5 3-3 11-3-11z" fill="${slips}"/>`;

export const AVATARER = {
  deg: { tile: "#d9d2c8", svg: svg(bak("deg", "#f4efe8", "#c9bfb2") +
    '<circle cx="32" cy="25" r="11" fill="#a99c8e"/><path d="M11 66q1-21 21-21t21 21z" fill="#a99c8e"/><circle cx="28" cy="21" r="3" fill="#fff" opacity=".35" stroke="none"/>') },
  // Kontorrotta: grå rotte i dress med for stramt slips og runde briller.
  kontor: { tile: "#c9ced6", svg: svg(bak("kontor", "#eef1f5", "#9aa3b0") + DRESS("#4b5563", "#6b7280") +
    '<circle cx="15" cy="17" r="8" fill="#9ca3af"/><circle cx="49" cy="17" r="8" fill="#9ca3af"/><circle cx="15" cy="17" r="4.5" fill="#f4a7b9" stroke="none"/><circle cx="49" cy="17" r="4.5" fill="#f4a7b9" stroke="none"/>' +
    '<path d="M16 32q0-16 16-16t16 16q0 13-16 15-16-2-16-15z" fill="#b8bec7"/><ellipse cx="32" cy="38" rx="6" ry="4.5" fill="#d7dbe1"/><circle cx="32" cy="35.5" r="2.4" fill="#f08a9e"/>' +
    '<path d="M22 38l-9-2M22 41l-9 1M42 38l9-2M42 41l9 1" fill="none" stroke-width="1.2"/>' + BRILLER() + `<circle cx="25.5" cy="29" r="1.8" fill="${K}" stroke="none"/><circle cx="38.5" cy="29" r="1.8" fill="${K}" stroke="none"/>`) },
  // Gründeren: lue, hettegenser og et stort smil over en kaffekopp.
  grunder: { tile: "#bfe6c8", svg: svg(bak("grunder", "#e8f8ec", "#7fcf93") +
    '<path d="M6 66q2-19 26-21 24 2 26 21z" fill="#3f8f4a"/><path d="M26 47v8M38 47v8" fill="none" stroke="#fff" stroke-width="1.6"/>' +
    PERSON_ENKEL() + KINN + OYNE(31) + SMIL + '<path d="M17 22q0-14 15-14t15 14q-15-4-30 0z" fill="#e8553d"/><path d="M17 22q15-5 30 0v3q-15-4-30 0z" fill="#c0392b"/><circle cx="32" cy="7" r="3.2" fill="#fff"/>' +
    '<path d="M44 52h9v10h-9z" fill="#fff"/><path d="M53 54q4 0 4 3t-4 3" fill="none"/><path d="M46 50q1-2 0-4M50 50q1-2 0-4" fill="none" stroke-width="1.2" opacity=".6"/>') },
  // Børsmegleren: blankt hår, headset, seler og en grønn pil som går rett opp bak ham.
  megler: { tile: "#b9d7f5", svg: svg(bak("megler", "#e6f2ff", "#5b9bd5") +
    '<path d="M4 50l14-10 10 6 14-16 10 6 10-14" fill="none" stroke="#62c48a" stroke-width="3.4"/><path d="M58 12l4 0-1 5z" fill="#62c48a" stroke="#62c48a"/>' +
    '<path d="M8 66q2-17 24-19 22 2 24 19z" fill="#fff"/><path d="M22 48l-3 18M42 48l3 18" fill="none" stroke="#c0392b" stroke-width="3"/>' +
    PERSON_ENKEL() + KINN + OYNE(31) + '<path d="M27 38q5 3 10 0" fill="none"/><path d="M17 26q2-14 16-14 12 0 14 10-10-6-30 4z" fill="#2b2118"/>' +
    '<path d="M17 30q-2-12 15-14 17 2 15 14" fill="none" stroke-width="2.4"/><rect x="13" y="27" width="6" height="9" rx="2.5" fill="#2b3f70"/><path d="M16 36q2 8 10 6" fill="none" stroke-width="1.8"/><circle cx="27" cy="42" r="1.6" fill="#2b3f70"/>') },
  // Kryptokongen: caps bak frem, laserøyne og en tykk gullkjede.
  krypto: { tile: "#f6d6a8", svg: svg(bak("krypto", "#fff1d6", "#f29b38") +
    '<path d="M8 66q2-17 24-19 22 2 24 19z" fill="#2b2118"/><path d="M20 50q12 10 24 0" fill="none" stroke="#ffd84a" stroke-width="3"/><circle cx="32" cy="57" r="5" fill="#ffd84a"/><path d="M30.5 54.5v5M30.5 54.5h2.5q1.6 0 1.6 1.2t-1.6 1.3h-2.5M30.5 57h2.8q1.8 0 1.8 1.25t-1.8 1.25h-2.8" fill="none" stroke-width="1"/>' +
    PERSON_ENKEL() + KINN + '<path d="M25 38q7 4 14 0" fill="none"/><path d="M16 24q0-12 16-12t16 12z" fill="#3b6fd8"/><path d="M14 23h12l-2 4H12z" fill="#2b4fa0"/>' +
    `<path d="M19 28h26l-2 5q-4 3-9 0h-4q-5 3-9 0z" fill="${K}"/>` +
    '<path d="M25 30L-4 22M39 30L68 22" stroke="#ff2d2d" stroke-width="2.6" opacity=".9"/><circle cx="25" cy="30" r="2.2" fill="#ff6b6b" stroke="none"/><circle cx="39" cy="30" r="2.2" fill="#ff6b6b" stroke="none"/>') },
  // Børsulven: ulv i dress med selvgodt glis.
  ulv: { tile: "#d7c3f2", svg: svg(bak("ulv", "#f1e8ff", "#8e5bd6") + STRALER("#fff", 0.15) + DRESS("#1f2937", "#ffd84a") +
    '<path d="M16 22l-2-16 12 9zM48 22l2-16-12 9z" fill="#6b7280"/><path d="M18 18l-1-8 6 5zM46 18l1-8-6 5z" fill="#f4a7b9" stroke="none"/>' +
    '<path d="M14 30q0-16 18-16t18 16q0 8-6 12l-12 8-12-8q-6-4-6-12z" fill="#9ca3af"/><path d="M24 36q8 3 16 0l-8 14z" fill="#e5e7eb"/><path d="M29 41h6l-3 3z" fill="' + K + '"/>' +
    '<path d="M22 28l6 2M42 28l-6 2" fill="none" stroke-width="2.4"/><circle cx="26" cy="31" r="1.8" fill="#ffd84a" stroke="none"/><circle cx="38" cy="31" r="1.8" fill="#ffd84a" stroke="none"/><path d="M28 46q4 2 8-1" fill="none"/>') },
  // Til månen: astronaut med visir som speiler en kurs som stiger mot månen.
  astronaut: { tile: "#26305a", svg: svg(bak("astronaut", "#3d4a85", "#0f1530") +
    '<g stroke="none" fill="#fff"><circle cx="8" cy="10" r="1"/><circle cx="56" cy="8" r="1.2"/><circle cx="50" cy="54" r=".9"/><circle cx="10" cy="50" r=".8"/></g><circle cx="54" cy="16" r="6" fill="#f6e7c1"/><circle cx="52" cy="14" r="1.4" fill="#e3cfa0" stroke="none"/>' +
    '<path d="M10 66q2-15 22-17 20 2 22 17z" fill="#e5e7eb"/><rect x="26" y="54" width="12" height="7" rx="2" fill="#e8553d"/>' +
    '<circle cx="32" cy="31" r="19" fill="#f1f5f9"/><rect x="17" y="21" width="30" height="20" rx="10" fill="#1e2a4a"/><path d="M21 37l6-4 4 2 5-6 4 2 4-7" fill="none" stroke="#62c48a" stroke-width="2.2"/><path d="M22 25q5-3 11-2" fill="none" stroke="#9fd3ff" stroke-width="2" opacity=".8"/>') },
  // Algoritmen: robot med visir som viser kursen og en gnist i antennen.
  robot: { tile: "#ffe7a3", svg: svg(bak("robot", "#fff7d6", "#e9a91c") + STRALER("#fff", 0.3) +
    '<path d="M32 12V5" fill="none"/><circle cx="32" cy="4" r="3" fill="#7fffd4"/><path d="M8 66l4-14h40l4 14z" fill="#8b96a3"/>' +
    '<rect x="12" y="12" width="40" height="38" rx="9" fill="#c9d1da"/><rect x="12" y="12" width="40" height="10" rx="5" fill="#e3e8ee" stroke="none" opacity=".7"/>' +
    '<rect x="17" y="22" width="30" height="15" rx="5" fill="#0f2238"/><path d="M20 33l5-3 4 2 5-6 4 3 5-5" fill="none" stroke="#7fffd4" stroke-width="2"/>' +
    '<rect x="22" y="41" width="20" height="4" rx="2" fill="#5b6672"/><circle cx="9" cy="31" r="3" fill="#8b96a3"/><circle cx="55" cy="31" r="3" fill="#8b96a3"/>') },
  // Gulldragen: drage med krone som ligger på en haug med gull.
  drage: { tile: "#ffcf87", svg: svg(bak("drage", "#fff0c2", "#e8553d") + STRALER("#ffd84a", 0.4) +
    '<g fill="#ffd84a"><ellipse cx="14" cy="60" rx="8" ry="3"/><ellipse cx="50" cy="60" rx="8" ry="3"/><ellipse cx="32" cy="62" rx="12" ry="3.5"/></g>' +
    '<path d="M16 18l2-14 8 10M48 18l-2-14-8 10" fill="#f6e7c1"/><path d="M10 34q0-20 22-20t22 20q0 9-7 13H17q-7-4-7-13z" fill="#3f9a5c"/>' +
    '<path d="M18 46q14 9 28 0v6q-14 9-28 0z" fill="#2f7a45"/><path d="M22 47l2 4 2-4M38 47l2 4 2-4" fill="#fff" stroke-width="1"/>' +
    `<path d="M20 31q4-5 8-1" fill="#ffd84a"/><path d="M36 30q4-4 8 1" fill="#ffd84a"/><path d="M24 29v3M40 29v3" stroke="${K}"/>` +
    '<path d="M22 16l-1-8 6 5 5-7 5 7 6-5-1 8z" fill="#ffd84a"/><circle cx="32" cy="12" r="1.8" fill="#e8553d"/><path d="M50 40q8-3 12 2-6 0-8 4z" fill="#ff9d1c"/>') },
  // Fønix: får du bare ved prestisje.
  fonix: { tile: "#3a1f4d", svg: svg(bak("fonix", "#6b2f8a", "#1d0f2a") + STRALER("#ffb020", 0.45) +
    '<path d="M32 60q-24-6-26-32 10 8 16 8-8-12-4-30 8 14 14 22 2-8 0-20 6 8 6 20 6-12 14-22 4 18-4 30 6 0 16-8-2 26-26 32z" fill="#ff7a1c"/>' +
    '<path d="M32 54q-12-4-14-18 7 5 14 5t14-5q-2 14-14 18z" fill="#ffd84a"/><path d="M32 48q-5-2-6-8 3 2 6 2t6-2q-1 6-6 8z" fill="#fff6d0" stroke="none"/>' +
    `<circle cx="28" cy="34" r="1.8" fill="${K}" stroke="none"/><circle cx="36" cy="34" r="1.8" fill="${K}" stroke="none"/><path d="M30 39l2 3 2-3z" fill="#e8553d"/>`) },
};

// Strategiene vises som et lite merke ved siden av ikonet ditt.
export const STRATEGIMERKER = {
  avers: { tile: "#d8ecff", svg: svg('<path d="M32 8l20 7v14q0 18-20 27Q12 47 12 29V15z" fill="#3b6fd8"/><path d="M24 31l6 6 11-13" fill="none" stroke="#fff" stroke-width="3.4"/>') },
  noytral: { tile: "#f1ead8", svg: svg('<path d="M32 10v40M20 52h24M12 20h40" fill="none" stroke-width="3"/><path d="M12 20l-6 14h12zM52 20l-6 14h12z" fill="#ffd84a"/><path d="M4 34q8 6 16 0M44 34q8 6 16 0" fill="#ffd84a"/>') },
  glad: { tile: "#ffe1d6", svg: svg('<path d="M32 6q12 10 10 30H22Q20 16 32 6z" fill="#f1f5f9"/><circle cx="32" cy="22" r="4" fill="#3b6fd8"/><path d="M22 30l-8 10 8-2zM42 30l8 10-8-2z" fill="#e8553d"/><path d="M26 38q6 18 12 0z" fill="#ff9d1c"/><path d="M29 40q3 10 6 0z" fill="#ffd84a" stroke="none"/>') },
};

// Ikonene for menyene øverst til venstre.
export const MENYIKONER = {
  pokal: { tile: "#fff0c2", svg: svg('<path d="M20 10h24v12q0 14-12 16-12-2-12-16z" fill="#ffd84a"/><path d="M20 14h-7q0 12 10 13M44 14h7q0 12-10 13" fill="none"/><path d="M28 40h8l2 8h-12z" fill="#e9a91c"/><rect x="20" y="48" width="24" height="7" rx="2" fill="#8b5a2b"/><path d="M27 16l2 5 5 .5-4 3 1.5 5-4.5-3-4.5 3 1.5-5-4-3 5-.5z" fill="#fff6d0" stroke-width="1.4" transform="translate(5 -1)"/>') },
  tannhjul: { tile: "#dbe8f1", svg: svg('<path d="M29 8h6l1 6 5 2 5-4 4 4-4 5 2 5 6 1v6l-6 1-2 5 4 5-4 4-5-4-5 2-1 6h-6l-1-6-5-2-5 4-4-4 4-5-2-5-6-1v-6l6-1 2-5-4-5 4-4 5 4 5-2z" fill="#8fa3b5"/><circle cx="32" cy="32" r="8" fill="#dbe8f1"/>') },
  spill: { tile: "#e6dcf8", svg: svg('<path d="M18 20h28q12 0 14 16t-6 18q-6 1-12-9H22q-6 10-12 9-8-2-6-18t14-16z" fill="#8a6fd0"/><path d="M20 28v12M14 34h12" fill="none" stroke="#fff" stroke-width="3.6"/><circle cx="43" cy="30" r="3" fill="#ffd84a"/><circle cx="50" cy="37" r="3" fill="#f08a9e"/><path d="M32 20v-8" fill="none"/>') },
};

export const MINIIKONER = {
  limonadeboden: { tile: "#fff3b0", svg: svg('<path d="M6 20h52l-4 11H10z" fill="#e8553d"/><path d="M17 20l-2 11M29 20v11M41 20l1 11" stroke="#fff" stroke-width="5"/><path d="M12 31v26M52 31v26" fill="none"/><rect x="8" y="46" width="48" height="13" rx="3" fill="#d9a066"/><path d="M24 33h15l-2 13H26z" fill="#ffe25a"/><path d="M39 36q6 0 5 5t-6 4" fill="none"/><circle cx="31" cy="39" r="3" fill="#fff" stroke="none"/><circle cx="32" cy="10" r="7" fill="#ffe25a"/>') },
  meglerhuset: { tile: "#d7e7fb", svg: svg('<rect x="5" y="9" width="54" height="38" rx="5" fill="#1e2a4a"/><path d="M10 38l9-12 8 7 9-18 8 10 9-14" fill="none" stroke="#62e09a" stroke-width="3"/><path d="M12 41h40" stroke="#4a5a86" stroke-width="1.4"/><path d="M26 47h12l3 9H23z" fill="#8fa3b5"/><circle cx="53" cy="11" r="3.4" fill="#62e09a"/>') },
  grisevakta: { tile: "#d9efc7", svg: svg('<path d="M14 58V28h36v30z" fill="#c9ced6"/><path d="M10 28V16h9v6h8v-6h10v6h8v-6h9v12z" fill="#aab4bf"/><path d="M26 58V46q0-6 6-6t6 6v12z" fill="#8b5a2b"/><circle cx="32" cy="34" r="0" /><path d="M32 16V4l14 5-14 5" fill="#f08a9e"/><path d="M19 36h6M39 36h6" stroke-width="3"/>') },
  grisetoget: { tile: "#cfe3b8", svg: svg('<rect x="4" y="30" width="18" height="16" rx="4" fill="#e8553d"/><circle cx="10" cy="29" r="4" fill="#ffd84a"/><circle cx="16" cy="28" r="4" fill="#ffd84a"/><path d="M22 40h6" /><ellipse cx="43" cy="34" rx="16" ry="13" fill="#f7b3c2"/><path d="M44 23l4-9 6 9z" fill="#ec8ea5"/><ellipse cx="57" cy="36" rx="4.5" ry="5.5" fill="#f39ab0"/><circle cx="49" cy="30" r="1.8" fill="#2b2118" stroke="none"/><circle cx="10" cy="50" r="5" fill="#5b6672"/><circle cx="34" cy="50" r="5" fill="#5b6672"/><circle cx="50" cy="50" r="5" fill="#5b6672"/>') },
  vekslebanken: { tile: "#fbe3c0", svg: svg('<circle cx="18" cy="22" r="13" fill="#c9ced6"/><circle cx="18" cy="22" r="7" fill="#e9edf1"/><circle cx="46" cy="22" r="13" fill="#c9ced6"/><circle cx="46" cy="22" r="7" fill="#e9edf1"/><path d="M32 33v7M28 37l4 5 4-5" fill="none" stroke-width="3"/><rect x="14" y="44" width="36" height="16" rx="3" fill="#8fd18a"/><circle cx="32" cy="52" r="5" fill="#eaffea"/>') },
  krakkfeltet: { tile: "#e8d5c4", svg: svg('<circle cx="16" cy="15" r="8" fill="#8b5a2b"/><circle cx="48" cy="15" r="8" fill="#8b5a2b"/><circle cx="32" cy="33" r="22" fill="#a0693a"/><ellipse cx="32" cy="42" rx="11" ry="9" fill="#e7c49b"/><path d="M27.5 37h9L32 42z" fill="#2b2118"/><path d="M18 24l8 4M46 24l-8 4" fill="none" stroke-width="3"/><circle cx="24" cy="31" r="2.4" fill="#2b2118"/><circle cx="40" cy="31" r="2.4" fill="#2b2118"/><path d="M27 47q5-4 10 0" fill="none"/>') },
  regnskapet: { tile: "#dbe8f1", svg: svg('<path d="M10 6h44v52H10z" fill="#fffaf0"/><path d="M10 6h8v52h-8z" fill="#3b6fd8"/><path d="M24 18h26M24 30h26M24 42h26M33 10v44M42 10v44" fill="none" stroke-width="1.6"/><text x="26" y="28" font-size="10" font-weight="900" fill="#2b2118" stroke="none">4</text><text x="44" y="28" font-size="10" font-weight="900" fill="#e8553d" stroke="none">7</text><text x="35" y="40" font-size="10" font-weight="900" fill="#2b2118" stroke="none">2</text><text x="26" y="52" font-size="10" font-weight="900" fill="#2f8a46" stroke="none">9</text>') },
};

// ---------- Pokaler ----------

// Hver prestasjon får sin egen pokal: en form (pokal, stjerne, medalje, skjold, krystall eller laurbærkrans),
// et metall etter nivået (bronse, sølv, gull, diamant) og et symbol etter temaet.
const METALL = {
  1: ["#8a4f1d", "#cd7f32", "#f6c99a"],
  2: ["#5d6b78", "#aebbc7", "#f4f8fb"],
  3: ["#9c6408", "#e9a91c", "#fff3a8"],
  4: ["#1f7a99", "#5fd3e8", "#effdff"],
};
const SYMBOL = {
  trykk: '<path d="M-2 6v-11q0-2.5 2.2-2.5t2.2 2.5v6l4 .8q2.5.6 2.2 3.2l-.8 6h-9.6l-3.6-4.4q-1.2-1.8.6-2.8 1.6-.8 2.8.6z"/>',
  fart: '<path d="M2-10l-8 11h5l-2 9 9-12h-5l3-8z"/>',
  aksje: '<path d="M-9 7l5-6 4 3 7-9" fill="none" stroke-width="2.6"/><path d="M4-7l4-1-1 4z"/>',
  kr: '<circle r="8.5"/><text y="3.2" text-anchor="middle" font-size="8.5" font-weight="900" font-family="Archivo, system-ui, sans-serif" stroke="none" fill="currentColor" class="pokal-tekst">kr</text>',
  booster: '<path d="M0-10q5 5 4 13h-8q-1-8 4-13z"/><path d="M-4 1l-4 5 4-1zM4 1l4 5-4-1z"/><path d="M-2 4q2 7 4 0z"/>',
  radgiver: '<circle cx="-4.5" r="4"/><circle cx="4.5" r="4"/><path d="M-.5 0h1M-8.5-1l-2-3M8.5-1l2-3" fill="none"/>',
  ekstra: '<path d="M-8 6L6-8M6-8H-1M6-8v7" fill="none" stroke-width="2.8"/>',
  obl: '<path d="M-6-9h9l4 4v14h-13z"/><path d="M-3-3h7M-3 1h7M-3 5h5" fill="none" stroke-width="1.4"/>',
  verden: '<circle r="8.5"/><path d="M-8.5 0h17M0-8.5q-5 8.5 0 17M0-8.5q5 8.5 0 17" fill="none" stroke-width="1.3"/>',
  strategi: '<circle r="8.5" fill="none" stroke-width="1.8"/><path d="M3-5l-6 2 3 3z"/><path d="M-3 5l6-2-3-3z" opacity=".55"/>',
  lotto: '<circle r="8.5"/><text y="3.6" text-anchor="middle" font-size="10" font-weight="900" font-family="Archivo, system-ui, sans-serif" stroke="none" fill="currentColor" class="pokal-tekst">7</text>',
  ikon: '<path d="M0-9l2.6 5.6 6 .6-4.6 4 1.4 6L0 4.2l-5.4 3 1.4-6-4.6-4 6-.6z"/>',
  gud: '<path d="M-9-4l9-6 9 6z"/><path d="M-7-3v9M-2.4-3v9M2.4-3v9M7-3v9M-9 7h18" fill="none" stroke-width="1.8"/>',
  spill: '<path d="M-6-4h12q4 0 5 6t-2 6q-2 0-4-4h-10q-2 4-4 4-3 0-2-6t5-6z"/>',
  borte: '<path d="M3-8a8.5 8.5 0 1 0 5 13 7 7 0 0 1-5-13z"/>',
  konto: '<path d="M-7 5h14a4 4 0 0 0 0-8 6 6 0 0 0-11-2 4.5 4.5 0 0 0-3 10z"/>',
  prestisje: '<path d="M0 9q-8-2-7-9 2 2 4 2-2-5 1-10 1 4 3 5 1-3 0-6 6 5 5 12-1 5-6 6z"/>',
};
const FORMER = [
  // Pokal med hanker og sokkel
  (m) => `<path d="M17 8h30v12q0 16-15 18-15-2-15-18z" fill="url(#m)"/><path d="M17 12H9q0 13 11 15M47 12h8q0 13-11 15" fill="none" stroke="${m[0]}" stroke-width="3"/><path d="M27 38h10l2 8H25z" fill="${m[1]}"/><rect x="18" y="46" width="28" height="9" rx="2" fill="${m[0]}"/><rect x="21" y="48.5" width="22" height="3.5" rx="1" fill="${m[2]}" stroke="none" opacity=".6"/>`,
  // Stjerne
  (m) => `<path d="M32 4l7.6 15.6 17.2 2.5-12.4 12.1 2.9 17.1L32 43.2l-15.3 8.1 2.9-17.1L7.2 22.1l17.2-2.5z" fill="url(#m)"/>`,
  // Medalje med bånd
  (m) => `<path d="M20 2h9l5 16h-9zM44 2h-9l-5 16h9z" fill="#e8553d"/><path d="M26 2h3l5 16h-3zM38 2h-3l-5 16h3z" fill="#3b6fd8" stroke="none"/><circle cx="32" cy="36" r="19" fill="url(#m)"/><circle cx="32" cy="36" r="14.5" fill="none" stroke="${m[0]}" stroke-width="1.6" stroke-dasharray="2 2.4"/>`,
  // Skjold
  (m) => `<path d="M32 4l22 7v15q0 20-22 32Q10 46 10 26V11z" fill="url(#m)"/><path d="M32 9l17 5.5v12q0 15-17 25" fill="${m[2]}" stroke="none" opacity=".35"/>`,
  // Krystall
  (m) => `<path d="M18 8h28l10 14-24 34L8 22z" fill="url(#m)"/><path d="M8 22h48M18 8l6 14 8 34 8-34 6-14M24 22l8-14 8 14" fill="none" stroke="${m[0]}" stroke-width="1.4"/>`,
  // Laurbærkrans
  (m) => `<circle cx="32" cy="30" r="17" fill="url(#m)"/>` + Array.from({ length: 7 }, (_, i) => {
    const v = (Math.PI * (0.62 + i * 0.13));
    return `<ellipse cx="${(32 + 23 * Math.cos(v)).toFixed(1)}" cy="${(30 + 23 * Math.sin(v)).toFixed(1)}" rx="5" ry="2.4" transform="rotate(${((v * 180) / Math.PI + 90).toFixed(0)} ${(32 + 23 * Math.cos(v)).toFixed(1)} ${(30 + 23 * Math.sin(v)).toFixed(1)})" fill="#4caf6a"/>` +
      `<ellipse cx="${(32 - 23 * Math.cos(v)).toFixed(1)}" cy="${(30 + 23 * Math.sin(v)).toFixed(1)}" rx="5" ry="2.4" transform="rotate(${(-(v * 180) / Math.PI - 90).toFixed(0)} ${(32 - 23 * Math.cos(v)).toFixed(1)} ${(30 + 23 * Math.sin(v)).toFixed(1)})" fill="#4caf6a"/>`;
  }).join("") + `<path d="M24 56l8-6 8 6" fill="none" stroke="#e8553d" stroke-width="3"/>`,
];
// Hvor symbolet står i hver form.
const MIDT = [[32, 22], [32, 30], [32, 36], [32, 28], [32, 26], [32, 30]];

/**
 * Velger en form til hver prestasjon, så ingen to pokaler blir like: samme metall og symbol får aldri samme form.
 * Gir et kart fra id til formnummer.
 */
export function pokalformer(liste) {
  const brukt = new Set();
  const ut = new Map();
  liste.forEach((p, i) => {
    let form = i % FORMER.length;
    for (let k = 0; k < FORMER.length && brukt.has(`${form}:${p.niva}:${p.tema}`); k++) form = (form + 1) % FORMER.length;
    brukt.add(`${form}:${p.niva}:${p.tema}`);
    ut.set(p.id, form);
  });
  return ut;
}

/** En pokal som SVG med formen fra pokalformer. */
export function pokal(p, form) {
  const m = METALL[p.niva] ?? METALL[1];
  const [x, y] = MIDT[form];
  const id = `m-${p.id}`;
  const kropp = FORMER[form](m).replaceAll("url(#m)", `url(#${id})`);
  const morkt = p.niva === 4 ? "#0f4a5e" : m[0];
  return `<svg class="pokal-fig" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${m[2]}"/><stop offset=".45" stop-color="${m[1]}"/><stop offset="1" stop-color="${m[0]}"/></linearGradient></defs>` +
    `<g stroke="${K}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${kropp}</g>` +
    `<g class="pokal-symbol" transform="translate(${x} ${y})" fill="${morkt}" stroke="${morkt}" stroke-width="1" stroke-linejoin="round" style="color:${m[2]}">${SYMBOL[p.tema] ?? SYMBOL.ikon}</g>` +
    `<path class="pokal-glimt" d="M20 14q4-3 9-3" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/></svg>`;
}
