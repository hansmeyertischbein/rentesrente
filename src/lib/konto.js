// Kontoer i «Overfør»: logg inn med e-post og passord, og spillet lagres hos Supabase så du kan spille på flere enheter.
// Bare regler og forespørsler her, uten nettleser. Grensesnittet sender forespørslene med fetch.
// oppsett er { url, nokkel }: adressen til prosjektet og den offentlige nøkkelen, som er laget for å ligge i nettleseren.

export const PASSORD_MIN = 8;
// Lenken i bekreftelsesposten sender deg hit, så du kommer rett tilbake til spillet.
export const TILBAKE = "https://rentesrente.no/spill/overfor/";

export function sjekkEpost(e) {
  const s = String(e ?? "").trim();
  if (!s) return "Skriv inn e-postadressen din.";
  if (s.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return "Det ser ikke ut som en e-postadresse. Sjekk at den har @ og et domene.";
  return null;
}

export function sjekkPassord(p) {
  const s = String(p ?? "");
  if (s.length < PASSORD_MIN) return `Passordet må ha minst ${PASSORD_MIN} tegn.`;
  if (s.length > 72) return "Passordet kan ha høyst 72 tegn.";
  return null;
}

const json = (oppsett, ekstra = {}) => ({ "Content-Type": "application/json", apikey: oppsett.nokkel, ...ekstra });
const bearer = (okt) => ({ Authorization: `Bearer ${okt.tilgang}` });

/**
 * En forespørsel til Supabase som { url, init } for fetch. type er
 * «lagKonto», «loggInn», «forny», «loggUt», «hent», «lagre» eller «slett».
 */
export function foresporsel(oppsett, type, { epost, passord, okt, data } = {}) {
  const u = oppsett.url.replace(/\/+$/, "");
  switch (type) {
    case "lagKonto": return { url: `${u}/auth/v1/signup?redirect_to=${encodeURIComponent(TILBAKE)}`, init: { method: "POST", headers: json(oppsett), body: JSON.stringify({ email: epost.trim(), password: passord }) } };
    case "loggInn": return { url: `${u}/auth/v1/token?grant_type=password`, init: { method: "POST", headers: json(oppsett), body: JSON.stringify({ email: epost.trim(), password: passord }) } };
    case "forny": return { url: `${u}/auth/v1/token?grant_type=refresh_token`, init: { method: "POST", headers: json(oppsett), body: JSON.stringify({ refresh_token: okt.fornyelse }) } };
    case "loggUt": return { url: `${u}/auth/v1/logout`, init: { method: "POST", headers: json(oppsett, bearer(okt)) } };
    case "hent": return { url: `${u}/rest/v1/spill?select=data,oppdatert&bruker=eq.${encodeURIComponent(okt.bruker)}`, init: { method: "GET", headers: json(oppsett, bearer(okt)) } };
    case "lagre": return {
      url: `${u}/rest/v1/spill?on_conflict=bruker`,
      init: { method: "POST", keepalive: true, headers: json(oppsett, { ...bearer(okt), Prefer: "resolution=merge-duplicates,return=minimal" }), body: JSON.stringify({ bruker: okt.bruker, data }) },
    };
    case "sendIgjen": return {
      url: `${u}/auth/v1/resend?redirect_to=${encodeURIComponent(TILBAKE)}`,
      init: { method: "POST", headers: json(oppsett), body: JSON.stringify({ type: "signup", email: epost.trim() }) },
    };
    case "slett": return { url: `${u}/rest/v1/rpc/slett_meg`, init: { method: "POST", headers: json(oppsett, bearer(okt)), body: "{}" } };
    default: throw new Error(`Ukjent forespørsel: ${type}`);
  }
}

/** Gjør svaret fra innlogging om til en økt: { bruker, epost, tilgang, fornyelse, utloper } der utloper er ms etter 1970. */
export function lesOkt(svar, naa) {
  if (!svar?.access_token || !svar?.refresh_token || !svar?.user?.id) return null;
  return {
    bruker: svar.user.id, epost: svar.user.email ?? "", tilgang: svar.access_token, fornyelse: svar.refresh_token,
    utloper: naa + Math.max(0, Number(svar.expires_in) || 3600) * 1000,
  };
}

/**
 * Lenken i bekreftelsesposten sender deg tilbake med økten etter #-tegnet. Gir økten, eller null.
 * Brukeren leses fra innholdet i tilgangsnøkkelen, som er en JWT.
 */
export function lesOktFraLenke(hash, naa) {
  const p = new URLSearchParams(String(hash ?? "").replace(/^#/, ""));
  const tilgang = p.get("access_token");
  if (!tilgang || !p.get("refresh_token")) return null;
  try {
    const del = tilgang.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const innhold = JSON.parse(decodeURIComponent(escape(atob(del + "=".repeat((4 - (del.length % 4)) % 4)))));
    return lesOkt({ access_token: tilgang, refresh_token: p.get("refresh_token"), expires_in: p.get("expires_in"), user: { id: innhold.sub, email: innhold.email } }, naa);
  } catch {
    return null;
  }
}

/** Feilen i lenken fra e-posten, som tekst på norsk, eller null når lenken ikke har feil. */
export function lenkefeil(hash) {
  const p = new URLSearchParams(String(hash ?? "").replace(/^#/, ""));
  const kode = p.get("error_code") ?? p.get("error");
  if (!kode) return null;
  if (kode === "otp_expired") return "Lenken i e-posten er brukt eller gått ut. Logg inn med e-post og passord, eller be om en ny e-post.";
  return "Lenken i e-posten virket ikke. Logg inn med e-post og passord, eller be om en ny e-post.";
}

/** Om økten må fornyes: ett minutt før den går ut. */
export function maFornyes(okt, naa) {
  return !okt || naa > okt.utloper - 60000;
}

/** Feil fra Supabase som tekst på norsk. */
export function feilmelding(status, svar) {
  const kode = String(svar?.error_code ?? svar?.code ?? "");
  const tekst = String(svar?.msg ?? svar?.message ?? svar?.error_description ?? svar?.error ?? "").toLowerCase();
  if (status === 429 || kode.includes("rate_limit")) return "For mange forsøk. Vent litt og prøv igjen.";
  if (kode === "invalid_credentials" || tekst.includes("invalid login")) return "Feil e-post eller passord.";
  if (kode === "user_already_exists" || tekst.includes("already registered")) return "Det finnes allerede en konto med denne e-posten. Logg inn i stedet.";
  if (kode === "email_not_confirmed" || tekst.includes("not confirmed")) return "Bekreft e-posten først. Se etter en e-post fra oss, også i søppelpost.";
  if (kode === "weak_password" || tekst.includes("password")) return `Passordet er for svakt. Bruk minst ${PASSORD_MIN} tegn og gjerne flere ord.`;
  if (status === 0) return "Fikk ikke kontakt. Sjekk nettet og prøv igjen.";
  return "Noe gikk galt. Prøv igjen om litt.";
}

/**
 * Hvilket spill som skal brukes når du logger inn og både enheten og kontoen har et spill: det som har kommet lengst.
 * Flest prestisjer først, så mest penger innom grisen, så det nyeste. Gir «lokal» eller «sky».
 */
export function velgSpill(lokal, sky) {
  if (!sky) return "lokal";
  if (!lokal) return "sky";
  const p = (x) => x.prestisje ?? 0;
  if (p(lokal) !== p(sky)) return p(lokal) > p(sky) ? "lokal" : "sky";
  if (lokal.totalt !== sky.totalt) return lokal.totalt > sky.totalt ? "lokal" : "sky";
  return (lokal.tid ?? 0) >= (sky.tid ?? 0) ? "lokal" : "sky";
}
