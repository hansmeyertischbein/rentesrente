import { test } from "node:test";
import assert from "node:assert/strict";
import { sjekkEpost, sjekkPassord, foresporsel, lesOkt, maFornyes, feilmelding, velgSpill } from "../src/lib/konto.js";

const oppsett = { url: "https://abc.supabase.co/", nokkel: "offentlig" };
const okt = { bruker: "u-1", epost: "a@b.no", tilgang: "T", fornyelse: "F", utloper: 100000 };

test("e-post og passord sjekkes før de sendes", () => {
  assert.equal(sjekkEpost("hans@example.no"), null);
  assert.ok(sjekkEpost(""));
  assert.ok(sjekkEpost("hans"));
  assert.ok(sjekkEpost("hans@example"));
  assert.equal(sjekkPassord("12345678"), null);
  assert.ok(sjekkPassord("1234567"));
  assert.ok(sjekkPassord("x".repeat(73)));
});

test("forespørslene går til riktig sted med den offentlige nøkkelen", () => {
  const inn = foresporsel(oppsett, "loggInn", { epost: " a@b.no ", passord: "hemmelig1" });
  assert.equal(inn.url, "https://abc.supabase.co/auth/v1/token?grant_type=password");
  assert.equal(inn.init.headers.apikey, "offentlig");
  assert.deepEqual(JSON.parse(inn.init.body), { email: "a@b.no", password: "hemmelig1" });
  assert.equal(foresporsel(oppsett, "lagKonto", { epost: "a@b.no", passord: "x" }).url, "https://abc.supabase.co/auth/v1/signup");
  const hent = foresporsel(oppsett, "hent", { okt });
  assert.equal(hent.url, "https://abc.supabase.co/rest/v1/spill?select=data,oppdatert&bruker=eq.u-1");
  assert.equal(hent.init.headers.Authorization, "Bearer T");
  const lagre = foresporsel(oppsett, "lagre", { okt, data: { v: 2 } });
  assert.match(lagre.init.headers.Prefer, /merge-duplicates/);
  assert.deepEqual(JSON.parse(lagre.init.body), { bruker: "u-1", data: { v: 2 } });
  assert.equal(JSON.parse(foresporsel(oppsett, "forny", { okt }).init.body).refresh_token, "F");
  assert.equal(foresporsel(oppsett, "slett", { okt }).url, "https://abc.supabase.co/rest/v1/rpc/slett_meg");
  assert.throws(() => foresporsel(oppsett, "ukjent"));
});

test("økten leses fra svaret og fornyes før den går ut", () => {
  const o = lesOkt({ access_token: "A", refresh_token: "R", expires_in: 3600, user: { id: "u", email: "a@b.no" } }, 1000);
  assert.deepEqual(o, { bruker: "u", epost: "a@b.no", tilgang: "A", fornyelse: "R", utloper: 1000 + 3600000 });
  assert.equal(lesOkt({ user: { id: "u" } }, 0), null, "uten nøkler, ingen økt (for eksempel når e-posten må bekreftes)");
  assert.equal(maFornyes(o, 1000), false);
  assert.equal(maFornyes(o, o.utloper - 59000), true);
  assert.equal(maFornyes(null, 0), true);
});

test("feil fra Supabase blir forståelig norsk", () => {
  assert.equal(feilmelding(400, { error_code: "invalid_credentials" }), "Feil e-post eller passord.");
  assert.match(feilmelding(422, { msg: "User already registered" }), /finnes allerede/);
  assert.match(feilmelding(400, { error_code: "email_not_confirmed" }), /Bekreft/);
  assert.match(feilmelding(429, {}), /For mange/);
  assert.match(feilmelding(0, null), /kontakt/);
});

test("ved innlogging brukes spillet som har kommet lengst", () => {
  assert.equal(velgSpill({ totalt: 5 }, null), "lokal");
  assert.equal(velgSpill(null, { totalt: 5 }), "sky");
  assert.equal(velgSpill({ totalt: 9e9, prestisje: 0 }, { totalt: 1, prestisje: 1 }), "sky", "prestisje teller mest");
  assert.equal(velgSpill({ totalt: 10 }, { totalt: 5 }), "lokal");
  assert.equal(velgSpill({ totalt: 5, tid: 1 }, { totalt: 5, tid: 2 }), "sky");
});
