// Tegner landskapet i bakgrunnen, så spillet aldri stopper opp mens utsikten lages.
import { tegnHimmel, tegnSkyer, tegnLand } from "./landskap.js";

addEventListener("message", ({ data: k }) => {
  const himmel = tegnHimmel(k), skyer = tegnSkyer(k), { rgba, dybde } = tegnLand(k);
  postMessage({ nr: k.nr, himmel, skyer, land: rgba, dybde }, [himmel.buffer, skyer.buffer, rgba.buffer, dybde.buffer]);
});
