// Leser og skriver kalkulatorens verdier i lenken etter #-tegnet.
// Delen etter # sendes ikke til serveren, så tallene leseren skriver blir i nettleseren.

/**
 * Leser verdier fra en hash som «#start=10000&mnd=1000». Ukjente nøkler ignoreres.
 * Tall utenfor grensene og ugyldige valg erstattes med standardverdien.
 */
export function lesTilstand(hash, standard, { grenser = {}, valg = {} } = {}) {
  const params = new URLSearchParams(String(hash || "").replace(/^#/, ""));
  const ut = { ...standard };
  for (const [nokkel, standardverdi] of Object.entries(standard)) {
    if (!params.has(nokkel)) continue;
    const ra = params.get(nokkel);
    if (typeof standardverdi === "number") {
      const tall = Number(ra);
      const g = grenser[nokkel];
      if (ra.trim() !== "" && Number.isFinite(tall) && (!g || (tall >= g.min && tall <= g.max))) ut[nokkel] = tall;
    } else if (!valg[nokkel] || valg[nokkel].includes(ra)) {
      ut[nokkel] = ra;
    }
  }
  return ut;
}

/** Skriver verdiene som en hash i fast rekkefølge, så like valg gir like lenker. */
export function skrivTilstand(verdier, rekkefolge = Object.keys(verdier)) {
  const params = new URLSearchParams();
  for (const nokkel of rekkefolge) {
    const v = verdier[nokkel];
    if (v === undefined || v === null || (typeof v === "number" && !Number.isFinite(v))) continue;
    params.set(nokkel, String(v));
  }
  return "#" + params.toString();
}
