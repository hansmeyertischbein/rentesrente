// Setningene som viser resultatet av renters rente-kalkulatoren.
// Brukes både ved bygging (for lesere uten JavaScript) og i nettleseren, så teksten blir lik.

import { formaterKr, omtrentKr } from "./format.js";

/** Hvor stor del av sluttverdien som er innskudd og avkastning, i prosent. */
export function andeler(r) {
  if (!(r.verdi > 0) || r.avkastning <= 0) return { innskudd: 100, avkastning: 0 };
  const avkastning = (r.avkastning / r.verdi) * 100;
  return { innskudd: 100 - avkastning, avkastning };
}

export function lagTekster(p, r, sim) {
  const t = {};
  t.ar = String(p.ar);
  t.verdi = omtrentKr(r.verdi);
  t["flyt-inn"] = `Om ${p.ar} år:`;
  t["flyt-verdi"] = t.verdi;

  // Ingen penger inn: ingenting å regne på, så vi sier hva som mangler.
  if (r.innskudd <= 0) {
    return {
      ...t,
      "idag-setning": "Skriv inn et startbeløp eller en månedlig sparing for å se hva det kan bli.",
      "skatt-setning": "",
      innskudd: formaterKr(0),
      "avkastning-tekst": "Avkastningen har gitt",
      avkastning: formaterKr(0),
      kostnader: formaterKr(0),
      "skatt-tekst": p.skatt === "aar" ? "Skatten underveis har tatt" : "Skatt hvis du selger alt",
      skatt: formaterKr(0),
      usikkerhet: "",
      "graf-tittel": "Ingen sparing å vise ennå",
    };
  }
  t["idag-setning"] = `Det er omtrent ${omtrentKr(r.verdiIDag)} i dagens kroner.`;

  if (p.skatt === "salg") {
    t["skatt-setning"] =
      r.skattVedSalg > 0
        ? `Selger du alt da, går omtrent ${omtrentKr(r.skattVedSalg)} til skatt. Du sitter igjen med ${omtrentKr(r.etterSkatt)}, eller ${omtrentKr(r.etterSkattIDag)} i dagens kroner.`
        : "Du har ingen gevinst, så det blir ingen skatt når du selger.";
  } else if (p.skatt === "aar") {
    t["skatt-setning"] = "Skatten på avkastningen er trukket hvert år underveis.";
  } else {
    t["skatt-setning"] = "Skatt er ikke regnet med.";
  }

  t.innskudd = formaterKr(r.innskudd);
  t["avkastning-tekst"] = r.avkastning > -0.5 ? "Avkastningen har gitt" : "Du har tapt";
  t.avkastning = omtrentKr(Math.abs(r.avkastning));
  t.kostnader = omtrentKr(r.kostnader);
  t["skatt-tekst"] = p.skatt === "aar" ? "Skatten underveis har tatt" : "Skatt hvis du selger alt";
  t.skatt = omtrentKr(p.skatt === "aar" ? r.skattUnderveis : r.skattVedSalg);

  if (sim) {
    const slutt = sim.serie[sim.serie.length - 1];
    let risiko;
    if (sim.andelUnderInnskudd < 0.005) risiko = "Nesten ingen av forløpene ender med mindre enn du satte inn.";
    else risiko = `I omtrent ${Math.round(sim.andelUnderInnskudd * 100)} av 100 ender du med mindre enn du satte inn.`;
    t.usikkerhet = `Avkastningen svinger fra år til år. I 8 av 10 simulerte forløp ender du mellom ${omtrentKr(slutt.lav)} og ${omtrentKr(slutt.hoy)}. ${risiko}`;
  } else {
    t.usikkerhet = "Med 0 % svingning regner vi som om avkastningen er den samme hvert år.";
  }

  const a = andeler(r);
  const andel = Math.round(a.avkastning);
  if (Math.abs(r.avkastning) < 0.5) t["graf-tittel"] = `Etter ${p.ar} år er verdien lik det du har satt inn`;
  else if (r.avkastning < 0) t["graf-tittel"] = `Etter ${p.ar} år er verdien lavere enn det du har satt inn`;
  else if (andel >= 100) t["graf-tittel"] = `Etter ${p.ar} år er nesten hele beløpet avkastning`;
  else if (andel < 1) t["graf-tittel"] = `Etter ${p.ar} år er under 1 % av beløpet avkastning`;
  else t["graf-tittel"] = `Etter ${p.ar} år er ${andel} % av beløpet avkastning`;
  return t;
}
