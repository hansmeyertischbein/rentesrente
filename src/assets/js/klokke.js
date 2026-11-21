// En felles klokke for spillet. Tiden hentes fra Date-feltet i svaret fra vår egen server, ikke fra enheten,
// så alle har samme tid, og det hjelper ikke å stille klokka på telefonen. Etter første svar teller vi videre
// med performance.now(), som ikke hopper når enhetens klokke endres. Uten nett brukes enhetens klokke.

let basis = null;        // { server, lokal }: servertiden i ms og performance.now() da den ble målt
let presisjon = Infinity;
let sistSpurt = -Infinity;

/** Tiden nå i millisekunder etter 1970, etter den felles klokka. */
export function naa() {
  return basis ? basis.server + (performance.now() - basis.lokal) : Date.now();
}

/** Om klokka er hentet fra serveren. */
export function synkronisert() {
  return basis !== null;
}

async function maal() {
  const for_ = performance.now();
  const svar = await fetch(`/?klokke=${Math.random().toString(36).slice(2)}`, { method: "HEAD", cache: "no-store" });
  const etter = performance.now();
  const dato = Date.parse(svar.headers.get("date") ?? "");
  if (!Number.isFinite(dato)) return;
  // Date-feltet er rundet ned til hele sekunder, så vi legger til et halvt sekund og halve tiden svaret brukte.
  const usikker = (etter - for_) / 2 + 500;
  if (usikker > presisjon + 250 && basis) return;
  presisjon = usikker;
  basis = { server: dato + 500 + (etter - for_) / 2, lokal: etter };
}

/** Henter tiden fra serveren. Gir alltid svar, med enhetens klokke som reserve, og venter aldri mer enn ventMs. */
export function synk(ventMs = 3000) {
  if (performance.now() - sistSpurt < 60000) return Promise.resolve();   // aldri oftere enn hvert minutt
  sistSpurt = performance.now();
  const forsok = maal().catch(() => {});
  return Promise.race([forsok, new Promise((ok) => setTimeout(ok, ventMs))]);
}

// Klokka hentes på nytt hvert tiende minutt og når siden kommer tilbake i synsfeltet.
setInterval(() => synk(), 10 * 60 * 1000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) synk(); });
