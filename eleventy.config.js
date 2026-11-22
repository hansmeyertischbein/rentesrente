import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { formaterKr, formaterProsent, formaterTall, omtrentKr } from "./src/lib/format.js";
import { beregnSparing, lagForhandsvalg, simuler, skattesatsFor } from "./src/lib/sparing.js";
import { andeler, lagTekster } from "./src/lib/tekster.js";
import { feilIAktive, reklameoversikt } from "./src/lib/partnere.js";
import { REGLER, utfallStatistikk } from "./src/lib/spill.js";
import ordjaktData from "./src/assets/js/ordjakt-data.js";
import { REGLER as KLIKKREGLER, AKSJER, BOOSTERE, formaterOre, formaterTid } from "./src/lib/klikker.js";

// Alle skriptfiler deler ett versjonsnummer, regnet av innholdet i dem alle. Når én fil endres,
// får alle nye adresser, så nettleseren aldri blander en ny side med en gammel modul fra hurtigbufferen.
const SKRIPTMAPPER = ["src/assets/js", "src/lib"];
function skriptVersjon() {
  const hash = createHash("sha1");
  for (const mappe of SKRIPTMAPPER) {
    for (const fil of readdirSync(mappe).filter((f) => f.endsWith(".js")).sort()) hash.update(fil).update(readFileSync(join(mappe, fil)));
  }
  return hash.digest("hex").slice(0, 8);
}

const datoFormat = new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Oslo" });
const satser = JSON.parse(readFileSync(new URL("./src/_data/satser.json", import.meta.url)));

// Standardutregningen vises også for lesere uten JavaScript, så den regnes ut ved bygging.
function standardKalkulator() {
  const forvalg = lagForhandsvalg(satser);
  const p = { start: 10000, mnd: 1000, ar: 30, infl: satser.inflasjonsmaal.verdi, ...forvalg.aksjefond, type: "aksjefond" };
  p.skattesats = skattesatsFor(p.skatt, satser);
  const r = beregnSparing(p);
  const sim = simuler(p);
  return { forvalg, p, r, sim, tekst: lagTekster(p, r, sim), andel: andeler(r) };
}

// Regneeksemplene i tekstene regnes ut her, så ingen tall i forklaringene er skrevet inn for hånd.
function regneeksempler() {
  const { forvalg } = standardKalkulator();
  const a = forvalg.aksjefond;
  const sparing = { start: 0, mnd: 1000, avk: a.avk, kost: a.kost, infl: satser.inflasjonsmaal.verdi, sving: 0, skatt: "ingen", skattesats: 0 };
  const lang = beregnSparing({ ...sparing, ar: 40 });
  const kort = beregnSparing({ ...sparing, ar: 30 });
  const billig = beregnSparing({ ...sparing, ar: 30, kost: satser.kostnadIndeksfond.verdi });
  const dyr = beregnSparing({ ...sparing, ar: 30, kost: satser.kostnadAktiveAksjefond.verdi });
  return {
    sparing,
    enkelRente: 10000 + 30 * 10000 * 0.05,
    rentersRente: 10000 * Math.pow(1.05, 30),
    lang,
    kort,
    billig,
    dyr,
    kostnadsforskjell: billig.verdi - dyr.verdi,
    prosentpoeng: satser.kostnadAktiveAksjefond.verdi - satser.kostnadIndeksfond.verdi,
    dobling6: Math.log(2) / Math.log(1.06),
    prisvekst30: Math.pow(1 + satser.inflasjonsmaal.verdi / 100, 30),
  };
}

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/lib": "lib" });
  eleventyConfig.addPassthroughCopy({ "design/tokens.css": "assets/css/tokens.css" });
  eleventyConfig.addPassthroughCopy({
    "node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2": "assets/fonts/archivo.woff2",
    "node_modules/@fontsource-variable/archivo/LICENSE": "assets/fonts/LICENSE-archivo.txt",
  });

  eleventyConfig.addGlobalData("kalk", standardKalkulator);
  eleventyConfig.addGlobalData("eksempler", regneeksempler);
  // Reglene i spillet «Tjue år», så teksten på siden bruker de samme tallene som motoren.
  eleventyConfig.addGlobalData("spilldata", () => ({ regler: REGLER, statistikk: utfallStatistikk() }));

  // Reglene i spillet «Overfør», så teksten på siden bruker de samme tallene som motoren.
  eleventyConfig.addGlobalData("klikkdata", () => ({ regler: KLIKKREGLER, aksjer: AKSJER, boostere: BOOSTERE }));

  // Kilden og perioden for tallene i «Ordjakt», så teksten under spillet viser det samme som dataene.
  eleventyConfig.addGlobalData("ordjakt", () => ({ kilde: ordjaktData.kilde, periode: ordjaktData.periode, hentet: ordjaktData.hentet, antall: ordjaktData.kategorier.length }));

  // Annonselenker: en partner som er slått på, men mangler merking, tillatelse eller gyldig avtale, stopper byggingen.
  eleventyConfig.addGlobalData("reklame", () => {
    const partnere = JSON.parse(readFileSync(new URL("./src/_data/partnere.json", import.meta.url)));
    const feil = feilIAktive(partnere);
    if (feil.length) throw new Error("Ugyldig annonselenke i src/_data/partnere.json:\n" + feil.join("\n"));
    return reklameoversikt(partnere);
  });

  // Hash av filinnholdet, slik at nettleseren henter ny CSS og JS når filen endres.
  // Importene inne i skriptene får samme versjonsnummer som skriptet siden laster.
  eleventyConfig.on("eleventy.after", ({ dir }) => {
    const v = skriptVersjon();
    for (const mappe of ["assets/js", "lib"]) {
      const sti = join(dir.output, mappe);
      for (const fil of readdirSync(sti).filter((f) => f.endsWith(".js"))) {
        const full = join(sti, fil);
        const tekst = readFileSync(full, "utf8");
        const ny = tekst.replace(/(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(["'])(\.{0,2}\/[^"'?]+\.js)\2/g, (_, foran, q, adr) => `${foran}${q}${adr}?v=${v}${q}`);
        if (ny !== tekst) writeFileSync(full, ny);
      }
    }
  });

  eleventyConfig.addFilter("versjon", (sti) => {
    if (sti.endsWith(".js")) return skriptVersjon();
    const fil = sti.startsWith("/assets/css/tokens.css") ? "design/tokens.css" : "src" + sti;
    return createHash("sha1").update(readFileSync(fil)).digest("hex").slice(0, 8);
  });

  // Datoer kommer både som tekst fra satser.json og som Date fra YAML i forsiden av Markdown-filer.
  eleventyConfig.addFilter("dato", (d) => datoFormat.format(d instanceof Date ? d : new Date(d + "T12:00:00Z")));
  eleventyConfig.addFilter("prosent", (tall) => formaterProsent(tall));
  eleventyConfig.addFilter("tall", (tall, desimaler = 0) => formaterTall(tall, desimaler));
  eleventyConfig.addFilter("desimal", (tall) => new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 2 }).format(tall));
  eleventyConfig.addFilter("kr", (tall) => formaterKr(tall));
  eleventyConfig.addFilter("omtrentKr", (tall) => omtrentKr(tall));
  eleventyConfig.addFilter("ore", (ore) => formaterOre(ore));
  eleventyConfig.addFilter("tid", (sekunder) => formaterTid(sekunder));

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
