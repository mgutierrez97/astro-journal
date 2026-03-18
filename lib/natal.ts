// Natal chart calculation — Placidus house system
// Birth data is hardcoded for development; will be replaced by user input.

import * as Astronomy from "astronomy-engine";
import { longitudeToSign } from "./astronomy";

// ─── Hardcoded dev birth data ────────────────────────────────────────────────
// June 28, 1997  ·  7:00 PM PDT (UTC-7)  ·  Bellflower, California
// PDT = UTC-7, so 19:00 PDT = 02:00 UTC June 29, 1997

export const BIRTH_DATA = {
  date: new Date("1997-06-28T19:00:00-07:00"),
  lat: 33.8817,
  lng: -118.127,
  city: "Bellflower, California",
  timezone: "America/Los_Angeles",
} as const;

/**
 * Converts a stored birth date + time + IANA timezone to a UTC Date.
 * Uses Intl.DateTimeFormat to measure the true UTC offset at that moment,
 * so DST is handled correctly and the result is browser-timezone-agnostic.
 *
 * Example: ("1997-06-28", "19:00", "America/Los_Angeles") → 1997-06-29T02:00:00Z
 */
export function birthDataToDate(
  dateStr: string,   // "YYYY-MM-DD"
  timeStr: string,   // "HH:MM"
  timezone: string,  // IANA e.g. "America/Los_Angeles"
): Date {
  // Step 1 — treat the given date/time as UTC to make a reference point
  const fakeUTC = new Date(`${dateStr}T${timeStr}:00Z`);

  // Step 2 — ask Intl what the local clock in `timezone` reads at that moment
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(fakeUTC);
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)!.value, 10);

  // Step 3 — reconstruct that local time as a plain UTC value (no tz shift)
  const localAsUTC = Date.UTC(
    get("year"), get("month") - 1, get("day"),
    get("hour") % 24, get("minute"), get("second"),
  );

  // Step 4 — the difference is the tz offset; apply it to find true UTC
  return new Date(fakeUTC.getTime() + (fakeUTC.getTime() - localAsUTC));
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NatalPlanet {
  name: string;
  symbol: string;
  longitude: number;   // geocentric ecliptic longitude 0–360
  sign: string;
  signDegree: number;  // 0–29, degree within the sign
  house: number;       // 1–12 Placidus
  retrograde: boolean;
}

export interface NatalChart {
  planets: NatalPlanet[];
  /** 12 house cusps — index 0 = cusp of H1 (ASC), index 9 = cusp of H10 (MC) */
  houseCusps: number[];
  ascendant: number;   // ecliptic longitude of Ascendant
  mc: number;          // ecliptic longitude of Midheaven
  ascSign: string;
  mcSign: string;
}

// ─── Astronomical helpers ────────────────────────────────────────────────────

// Mean obliquity at J2000.0 — close enough for 1997 (true value ≈ 23.4396°)
const OBL = 23.4392911; // degrees

const DEG = Math.PI / 180;
const RAD = 1 / DEG;

function toRad(d: number) { return d * DEG; }
function toDeg(r: number) { return r * RAD; }
function mod360(x: number) { return ((x % 360) + 360) % 360; }

/** Right ascension (degrees) of the ecliptic point at longitude λ */
function eclToRA(lambda: number): number {
  const l = toRad(lambda);
  const e = toRad(OBL);
  return mod360(toDeg(Math.atan2(Math.cos(e) * Math.sin(l), Math.cos(l))));
}

/** Declination (degrees) of the ecliptic point at longitude λ */
function eclToDec(lambda: number): number {
  return toDeg(Math.asin(Math.sin(toRad(OBL)) * Math.sin(toRad(lambda))));
}

/** Diurnal semi-arc (degrees) of a point with declination dec at geographic latitude lat */
function diurnalSemiArc(dec: number, lat: number): number {
  const x = -Math.tan(toRad(lat)) * Math.tan(toRad(dec));
  if (x <= -1) return 180; // circumpolar — never sets
  if (x >= 1) return 0;   // never rises
  return toDeg(Math.acos(x));
}

// ─── Angles ──────────────────────────────────────────────────────────────────

/** RAMC (Right Ascension of Midheaven) in degrees from GMST and longitude */
function calcRAMC(time: Astronomy.AstroTime, lng: number): number {
  // SiderealTime returns GMST in sidereal hours
  const gmst = Astronomy.SiderealTime(time);
  return mod360(gmst * 15 + lng); // lng is negative for west
}

/** MC ecliptic longitude from RAMC */
function calcMC(ramc: number): number {
  return mod360(toDeg(Math.atan2(
    Math.sin(toRad(ramc)),
    Math.cos(toRad(ramc)) * Math.cos(toRad(OBL))
  )));
}

/** Ascendant ecliptic longitude from RAMC and geographic latitude
 *
 * Correct formula from Meeus "Astronomical Algorithms" ch.24:
 *   atan2(cos(RAMC), -(sin(RAMC)·cos(ε) + tan(φ)·sin(ε)))
 *
 * The commonly-seen inverted form  atan2(-cos(RAMC), sin(ε)·tan(φ) + cos(ε)·sin(RAMC))
 * gives the DESCENDANT (DSC), not the ASC — it is 180° wrong.
 */
function calcASC(ramc: number, lat: number): number {
  const r = toRad(ramc);
  const e = toRad(OBL);
  const phi = toRad(lat);
  return mod360(toDeg(Math.atan2(
    Math.cos(r),
    -(Math.sin(r) * Math.cos(e) + Math.tan(phi) * Math.sin(e))
  )));
}

// ─── Placidus house cusps ─────────────────────────────────────────────────────
//
// Upper houses H11, H12 — between MC and ASC (above horizon, diurnal side):
//   (RA_cusp − RAMC) mod 360 = n/3 × DSA_cusp   n=1 → H11, n=2 → H12
//
// Lower houses H2, H3 — between IC and ASC (below horizon, nocturnal side):
//   (RAIC − RA_cusp) mod 360 = n/3 × NSA_cusp   n=1 → H3, n=2 → H2
//   (H3 is closer to IC; H2 is closer to ASC — frac order is intentionally reversed)
//
// Opposite cusps: H5=H11+180, H6=H12+180, H8=H2+180, H9=H3+180.

function placidusUpper(ramc: number, lat: number, frac: number): number {
  let lambda = mod360(calcMC(ramc) + frac * 60); // start past MC
  for (let i = 0; i < 60; i++) {
    const ra  = eclToRA(lambda);
    const dsa = diurnalSemiArc(eclToDec(lambda), lat);
    const err = frac * dsa - mod360(ra - ramc);
    if (Math.abs(err) < 0.0001) break;
    lambda = mod360(lambda + err * 0.4); // increase lambda → increase RA
  }
  return lambda;
}

function placidusLower(ramc: number, lat: number, frac: number): number {
  const raic = mod360(ramc + 180);
  let lambda = mod360(calcMC(ramc) + 180 - frac * 100); // start before IC
  for (let i = 0; i < 60; i++) {
    const ra  = eclToRA(lambda);
    const nsa = 180 - diurnalSemiArc(eclToDec(lambda), lat);
    const err = frac * nsa - mod360(raic - ra);
    if (Math.abs(err) < 0.0001) break;
    lambda = mod360(lambda - err * 0.4); // decrease lambda → decrease RA
  }
  return lambda;
}

/**
 * Returns 12 Placidus house cusps as ecliptic longitudes (0–360°).
 * Index 0 = H1 (ASC), index 9 = H10 (MC).
 */
function calcPlacidusHouses(ramc: number, lat: number): number[] {
  const asc = calcASC(ramc, lat);
  const mc  = calcMC(ramc);
  const h11 = placidusUpper(ramc, lat, 1 / 3);
  const h12 = placidusUpper(ramc, lat, 2 / 3);
  const h3  = placidusLower(ramc, lat, 1 / 3); // frac=1/3 → H3 (near IC)
  const h2  = placidusLower(ramc, lat, 2 / 3); // frac=2/3 → H2 (near ASC)
  return [
    asc,               // H1  (ASC)
    h2,                // H2
    h3,                // H3
    mod360(mc + 180),  // H4  (IC)
    mod360(h11 + 180), // H5
    mod360(h12 + 180), // H6
    mod360(asc + 180), // H7  (DSC)
    mod360(h2 + 180),  // H8
    mod360(h3 + 180),  // H9
    mc,                // H10 (MC)
    h11,               // H11
    h12,               // H12
  ];
}

/** Returns which house (1–12) a given ecliptic longitude belongs to */
function getHouse(longitude: number, cusps: number[]): number {
  const lon = mod360(longitude);
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end   = cusps[(i + 1) % 12];
    if (start <= end) {
      if (lon >= start && lon < end) return i + 1;
    } else {
      // sector wraps around 0°
      if (lon >= start || lon < end) return i + 1;
    }
  }
  return 1; // fallback — should never be reached
}

// ─── Planet list ──────────────────────────────────────────────────────────────

const PLANET_BODIES: Array<{ name: string; symbol: string; body: Astronomy.Body }> = [
  { name: "Sun",     symbol: "☉", body: Astronomy.Body.Sun },
  { name: "Moon",    symbol: "☽", body: Astronomy.Body.Moon },
  { name: "Mercury", symbol: "☿", body: Astronomy.Body.Mercury },
  { name: "Venus",   symbol: "♀", body: Astronomy.Body.Venus },
  { name: "Mars",    symbol: "♂", body: Astronomy.Body.Mars },
  { name: "Jupiter", symbol: "♃", body: Astronomy.Body.Jupiter },
  { name: "Saturn",  symbol: "♄", body: Astronomy.Body.Saturn },
  { name: "Uranus",  symbol: "♅", body: Astronomy.Body.Uranus },
  { name: "Neptune", symbol: "♆", body: Astronomy.Body.Neptune },
  { name: "Pluto",   symbol: "♇", body: Astronomy.Body.Pluto },
];

// ─── Main calculation ─────────────────────────────────────────────────────────

export function calculateNatalChart(
  date: Date = BIRTH_DATA.date,
  lat: number  = BIRTH_DATA.lat,
  lng: number  = BIRTH_DATA.lng,
): NatalChart {
  const time = Astronomy.MakeTime(date);
  const ramc = calcRAMC(time, lng);
  const cusps = calcPlacidusHouses(ramc, lat);

  const ascendant = cusps[0];
  const mc        = cusps[9];

  const planets: NatalPlanet[] = [];

  for (const { name, symbol, body } of PLANET_BODIES) {
    try {
      let longitude: number;
      if (name === "Sun") {
        longitude = Astronomy.SunPosition(time).elon;
      } else {
        longitude = Astronomy.Ecliptic(Astronomy.GeoVector(body, time, true)).elon;
      }
      const sign      = longitudeToSign(longitude);
      const signDeg   = Math.floor(mod360(longitude) % 30);
      const house     = getHouse(longitude, cusps);

      // Retrograde: compare longitude to +1 day; if it decreased, it's retrograde
      let retrograde = false;
      try {
        const timePlus = Astronomy.MakeTime(new Date(date.getTime() + 86_400_000));
        const lonPlus = name === "Sun"
          ? Astronomy.SunPosition(timePlus).elon
          : Astronomy.Ecliptic(Astronomy.GeoVector(body, timePlus, true)).elon;
        // Moving backwards if the forward difference mod 360 > 180
        retrograde = mod360(lonPlus - longitude) > 180;
      } catch { /* ignore retrograde detection failure */ }

      planets.push({ name, symbol, longitude, sign, signDegree: signDeg, house, retrograde });
    } catch (e) {
      console.warn(`Natal chart: failed to compute ${name}:`, e);
    }
  }

  return {
    planets,
    houseCusps: cusps,
    ascendant,
    mc,
    ascSign: longitudeToSign(ascendant),
    mcSign:  longitudeToSign(mc),
  };
}

// ─── Sign keywords (for Big 3 cards) ─────────────────────────────────────────

export const SIGN_KEYWORDS: Record<string, string> = {
  Aries:       "Initiative · Courage · Drive",
  Taurus:      "Stability · Sensuality · Persistence",
  Gemini:      "Curiosity · Communication · Duality",
  Cancer:      "Nurture · Intuition · Protection",
  Leo:         "Expression · Creativity · Radiance",
  Virgo:       "Precision · Service · Discernment",
  Libra:       "Balance · Harmony · Relationship",
  Scorpio:     "Depth · Transformation · Power",
  Sagittarius: "Freedom · Expansion · Wisdom",
  Capricorn:   "Discipline · Ambition · Structure",
  Aquarius:    "Innovation · Idealism · Community",
  Pisces:      "Empathy · Transcendence · Dissolution",
};

// ─── Planet interpretations (placeholder — will be replaced by AI) ────────────

export const PLANET_INTERPRETATIONS: Record<string, string> = {
  Sun:     "Your Sun placement describes the conscious identity you're building over a lifetime — the arc of becoming, the central story. It is where you seek recognition, where you shine most fully, and what the life is ultimately about.",
  Moon:    "The Moon describes your emotional body — the feeling world that operates below the threshold of will. It is how you need to feel safe, how you receive and give care, and what instincts arise before the mind can intervene.",
  Mercury: "Mercury shapes the architecture of your mind — how you gather, process, and transmit information. It is your relationship with language, learning, and the entire nervous system of perception and communication.",
  Venus:   "Venus describes what you value and what draws you close — aesthetically, romantically, in relationship and in pleasure. It is the principle of attraction, of beauty, and of what feels worth having.",
  Mars:    "Mars is the will in action. It describes desire, drive, ambition, and the capacity for anger. Mars shows what you fight for, how you initiate, and what compels you to move through the world without hesitation.",
  Jupiter: "Jupiter describes the principle of expansion in your chart — where luck, abundance, wisdom, and generosity tend to flow. It shows where you seek meaning and where the universe tends, on balance, to say yes.",
  Saturn:  "Saturn marks the area where you encounter limitation, structure, and the slow discipline of mastery. What Saturn demands takes time and seriousness — and eventually delivers lasting authority and earned respect.",
  Uranus:  "Uranus marks the fault line in your chart where the unexpected breaks through. It carries the energy of your generation's disruption, and shows where you may feel drawn toward freedom, originality, and unconventional paths.",
  Neptune: "Neptune dissolves whatever it touches — bringing transcendence, imagination, and sometimes confusion to the area it occupies. It is where the boundaries between self and world become permeable, where the mystical enters.",
  Pluto:   "Pluto operates at the level of deep transformation. It marks where power, compulsion, and the cycle of death and rebirth operate in your life — often below conscious awareness until a crisis makes it impossible to ignore.",
};
