// Pengesedlene som faller fra himmelen i «Overfør»: når de kommer, og hvordan vinden skyver dem unna pekeren.
// Rene funksjoner. Lengder er i piksler og tid i sekunder.

export const SEDDEL = Object.freeze({
  forst: Object.freeze([50, 110]),    // sekunder til den første
  mellom: Object.freeze([90, 240]),   // og til de neste
  bredde: 78,
  hoyde: 42,
  fall: 62,          // så fort faller den i stille vær
  radius: 155,       // vinden merkes når pekeren er så nær
  skyv: 3000,        // hvor hardt vinden skyver helt inntil
  maks: 660,         // raskere enn dette flyr den aldri, så et raskt sveip kan ta den igjen
  brems: 2.3,
  kast: Object.freeze([0.35, 0.8]),   // på berøringsskjerm kommer vindkastene av seg selv
  kastFart: 430,
});

const mellom = ([a, b], x) => a + (b - a) * x;

/** Sekunder til neste seddel. */
export function nesteOm(forste, rng = Math.random) {
  return mellom(forste ? SEDDEL.forst : SEDDEL.mellom, rng());
}

/** En ny seddel over skjermen. Lilla og grønn er like vanlige. */
export function nySeddel(rom, rng = Math.random) {
  return { farge: rng() < 0.5 ? "lilla" : "gronn", x: (0.15 + 0.7 * rng()) * rom.b, y: -SEDDEL.hoyde, vx: (rng() - 0.5) * 120, vy: SEDDEL.fall, tid: rng() * 6, kast: mellom(SEDDEL.kast, rng()) };
}

/**
 * Seddelen ett lite steg videre. peker er { x, y, vx, vy } for musen, eller null. Kommer musen nær, skyves seddelen bort
 * og i samme retning som musen beveger seg. På berøringsskjerm finnes ingen peker, og da kommer det vindkast i stedet.
 * Gir null når seddelen har falt ut av skjermen.
 */
export function steg(s, peker, rom, dt, rng = Math.random, beroring = false) {
  let { x, y, vx, vy, kast } = s;
  const tid = s.tid + dt;
  vx += Math.sin(tid * 1.9) * 170 * dt;
  vy += (SEDDEL.fall * (1 + 0.35 * Math.sin(tid * 2.6)) - vy) * 1.3 * dt;
  if (peker) {
    const dx = x - peker.x, dy = y - peker.y, d = Math.hypot(dx, dy) || 1;
    if (d < SEDDEL.radius) {
      const fart = Math.hypot(peker.vx, peker.vy);
      let rx = dx / d, ry = dy / d;
      if (fart > 40) { rx += 0.8 * (peker.vx / fart); ry += 0.8 * (peker.vy / fart); }
      const l = Math.hypot(rx, ry) || 1, kraft = SEDDEL.skyv * (1 - d / SEDDEL.radius) * dt;
      vx += (rx / l) * kraft;
      vy += (ry / l) * kraft * 0.75;
    }
  }
  if (beroring) {
    kast -= dt;
    if (kast <= 0) {
      const v = rng() * 2 * Math.PI;
      vx += Math.cos(v) * SEDDEL.kastFart;
      vy += Math.sin(v) * SEDDEL.kastFart * 0.6;
      kast = mellom(SEDDEL.kast, rng());
    }
  }
  const b = Math.exp(-SEDDEL.brems * dt);
  vx *= b; vy *= b;
  const f = Math.hypot(vx, vy);
  if (f > SEDDEL.maks) { vx *= SEDDEL.maks / f; vy *= SEDDEL.maks / f; }
  x += vx * dt; y += vy * dt;
  const kx = SEDDEL.bredde / 2, ky = SEDDEL.hoyde / 2;
  // Presses den mot kanten, glir den langs den, så du ikke bare kan holde den fast i hjørnet.
  if (x < kx || x > rom.b - kx) {
    const mot = Math.abs(vx);
    x = x < kx ? kx : rom.b - kx;
    vx = (x === kx ? 1 : -1) * mot * 0.4;
    const vei = peker ? Math.sign(y - peker.y) || 1 : 0;
    vy += vei * mot * 0.8;
  }
  if (y < ky && s.y >= ky) { y = ky; vy = Math.abs(vy) * 0.4; }
  if (y > rom.h + SEDDEL.hoyde) return null;
  return { ...s, x, y, vx, vy, tid, kast };
}

/** Om et punkt er på seddelen. */
export function treffer(s, x, y) {
  return Math.abs(x - s.x) <= SEDDEL.bredde / 2 && Math.abs(y - s.y) <= SEDDEL.hoyde / 2;
}
