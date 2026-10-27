import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { formaterKr, formaterProsent, formaterTall, omtrentKr } from "./src/lib/format.js";
import { beregnSparing, lagForhandsvalg, simuler, skattesatsFor } from "./src/lib/sparing.js";
import { andeler, lagTekster } from "./src/lib/tekster.js";

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

  // Hash av filinnholdet, slik at nettleseren henter ny CSS og JS når filen endres.
  eleventyConfig.addFilter("versjon", (sti) => {
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

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
