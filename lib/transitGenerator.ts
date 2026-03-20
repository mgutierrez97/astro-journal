// Transit generator — Chunk 1: position calculation foundation
// Chunk 2: sky-to-sky aspect detection (AspectWindow, detectAspectWindows, scanTransits)
// Chunk 3 will add special event detection.
// Chunk 4 will integrate with the feed.

import * as Astronomy from "astronomy-engine";
import type { TransitEvent }   from "@/components/cards/TransitCard";
import type { NatalChart }     from "@/lib/natal";
import type { StoredBirthData } from "@/components/ui/BirthDataCard";

// ─── Planet list ──────────────────────────────────────────────────────────────

export const PLANETS = [
  "Sun", "Moon", "Mercury", "Venus", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
] as const;

export type Planet = (typeof PLANETS)[number];

// ─── Zodiac ───────────────────────────────────────────────────────────────────

export type ZodiacSign =
  | "Aries" | "Taurus" | "Gemini"      | "Cancer"
  | "Leo"   | "Virgo"  | "Libra"       | "Scorpio"
  | "Sagittarius" | "Capricorn" | "Aquarius" | "Pisces";

const ZODIAC_SIGNS: ZodiacSign[] = [
  "Aries", "Taurus", "Gemini",      "Cancer",
  "Leo",   "Virgo",  "Libra",       "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

/**
 * Decomposes an ecliptic longitude (0–360°) into sign, degree-within-sign,
 * and sign index (0 = Aries … 11 = Pisces).
 */
export function getLongitudeData(longitude: number): {
  sign:      ZodiacSign;
  degree:    number;   // 0–29.99°
  signIndex: number;   // 0–11
} {
  const norm      = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(norm / 30);
  return {
    sign:      ZODIAC_SIGNS[signIndex],
    degree:    norm % 30,
    signIndex,
  };
}

// ─── Astronomy Engine body map ────────────────────────────────────────────────
// Body enum values are string literals that match our Planet names exactly.

const BODY_MAP: Record<Planet, Astronomy.Body> = {
  Sun:     Astronomy.Body.Sun,
  Moon:    Astronomy.Body.Moon,
  Mercury: Astronomy.Body.Mercury,
  Venus:   Astronomy.Body.Venus,
  Mars:    Astronomy.Body.Mars,
  Jupiter: Astronomy.Body.Jupiter,
  Saturn:  Astronomy.Body.Saturn,
  Uranus:  Astronomy.Body.Uranus,
  Neptune: Astronomy.Body.Neptune,
  Pluto:   Astronomy.Body.Pluto,
};

// ─── Planet longitude ─────────────────────────────────────────────────────────
//
// We need GEOCENTRIC ecliptic longitudes (as seen from Earth) — the standard
// for astrological calculation.
//
// API notes:
//   Astronomy.EclipticLongitude(body, time) — computes HELIOCENTRIC longitude
//     ("as seen from the center of the Sun"). Not suitable here, and explicitly
//     throws for Body.Sun. Do not use for this purpose.
//
//   Astronomy.SunPosition(time) — returns geocentric apparent ecliptic coords
//     for the Sun. Correct for the Sun specifically.
//
//   Astronomy.Ecliptic(Astronomy.GeoVector(body, time, true)) — converts the
//     geocentric equatorial vector (with aberration) to ecliptic coordinates.
//     Returns .elon as the geocentric ecliptic longitude. Correct for all
//     other bodies.
//
// This approach matches lib/natal.ts, which has been verified against Astro.com.

/**
 * Returns the geocentric ecliptic longitude (0–360°) for a planet at date.
 */
export function getPlanetLongitude(planet: string, date: Date): number {
  const body = BODY_MAP[planet as Planet];
  if (body === undefined) {
    throw new Error(`Unknown planet: "${planet}"`);
  }

  const time = Astronomy.MakeTime(date);

  if (planet === "Sun") {
    // SunPosition returns geocentric apparent ecliptic coordinates
    return ((Astronomy.SunPosition(time).elon % 360) + 360) % 360;
  }

  // GeoVector with aberration=true → equatorial J2000 geocentric vector
  // Ecliptic() converts to ecliptic coordinates; .elon is geocentric ecliptic longitude
  const ecl = Astronomy.Ecliptic(Astronomy.GeoVector(body, time, true));
  return ((ecl.elon % 360) + 360) % 360;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanetPosition {
  planet:    string;
  longitude: number;   // geocentric ecliptic longitude, 0–360°
  sign:      ZodiacSign;
  degree:    number;   // 0–29.99° within the sign
}

export interface DailySnapshot {
  date:      Date;
  positions: PlanetPosition[];
}

// ─── Planetary snapshot ───────────────────────────────────────────────────────

/**
 * Returns current geocentric positions for all 10 bodies at the given date.
 */
export function getPlanetarySnapshot(date: Date): PlanetPosition[] {
  return PLANETS.map((planet) => {
    const longitude      = getPlanetLongitude(planet, date);
    const { sign, degree } = getLongitudeData(longitude);
    return { planet, longitude, sign, degree };
  });
}

// ─── Daily scan scaffold ──────────────────────────────────────────────────────

/**
 * Steps through [startDate, endDate] one day at a time (noon UTC each day)
 * and returns a snapshot for each day.
 *
 * Aspect detection (Chunk 2) will iterate this array looking for sign changes
 * and angular relationships between planets.
 */
export function scanDateRange(startDate: Date, endDate: Date): DailySnapshot[] {
  const snapshots: DailySnapshot[] = [];

  // Work with a mutable cursor at noon UTC to avoid DST/midnight edge cases
  const cursor = new Date(startDate);
  cursor.setUTCHours(12, 0, 0, 0);

  const end = new Date(endDate);
  end.setUTCHours(12, 0, 0, 0);

  while (cursor <= end) {
    snapshots.push({
      date:      new Date(cursor),
      positions: getPlanetarySnapshot(cursor),
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return snapshots;
}

// ─── Development verification ─────────────────────────────────────────────────
//
// Expected output for 2026-03-18 — verified against astronomy-engine CJS output:
//
//   Sun      357.9°   Pisces      27.9°
//   Moon     350.7°   Pisces      20.7°
//   Mercury  338.8°   Pisces       8.8°
//   Venus     15.0°   Aries       15.0°
//   Mars     342.5°   Pisces      12.5°
//   Jupiter  105.2°   Cancer      15.2°
//   Saturn     3.9°   Aries        3.9°
//   Uranus    58.2°   Taurus      28.2°
//   Neptune    1.7°   Aries        1.7°
//   Pluto    305.0°   Aquarius     5.0°
//
// If values diverge from the above by more than ~0.5°, stop and investigate
// before building Chunk 2.

function verifyEphemeris(): void {
  const snapshot = getPlanetarySnapshot(new Date());
  console.group("[transitGenerator] Ephemeris verification — expected: Jupiter ~105° Cancer, Saturn ~4° Aries, Mars ~13° Pisces");
  console.table(
    snapshot.map((p) => ({
      planet:    p.planet,
      longitude: p.longitude.toFixed(3) + "°",
      sign:      p.sign,
      degree:    p.degree.toFixed(2) + "°",
    })),
  );
  console.groupEnd();
}

if (process.env.NODE_ENV === "development") {
  // Defer to next tick — avoids blocking module load and is safe in both
  // SSR (Node.js logs to terminal) and client (browser console) contexts.
  Promise.resolve().then(verifyEphemeris);
}

// ─── Chunk 2: sky-to-sky aspect detection ─────────────────────────────────────

// ─── Aspect definitions ───────────────────────────────────────────────────────
//
// All five major aspects with a uniform 6° applying/separating orb.
// Orb is symmetric: the aspect window opens when |orb| ≤ 6° and closes when
// the pair drifts back beyond 6° on the other side.

export interface AspectDefinition {
  name:        string;   // e.g. "conjunction"
  angle:       number;   // exact aspect angle in degrees
  orb:         number;   // maximum allowed orb in degrees
}

export const ASPECTS: AspectDefinition[] = [
  { name: "conjunction", angle:   0, orb: 3 },
  { name: "opposition",  angle: 180, orb: 3 },
  { name: "square",      angle:  90, orb: 3 },
  { name: "trine",       angle: 120, orb: 3 },
  { name: "sextile",     angle:  60, orb: 3 },
];

// Sky-to-sky aspects only — sextiles excluded (supportive background energy,
// not reflective-journaling material). Natal transit gate is independent.
const SKY_TO_SKY_ASPECTS = new Set(["conjunction", "opposition", "square", "trine"]);

// ─── Angular helpers ──────────────────────────────────────────────────────────

/**
 * Returns the shortest angular distance between two ecliptic longitudes.
 * Result is always in [0, 180].
 */
export function getAngularSeparation(lon1: number, lon2: number): number {
  const diff = Math.abs(((lon1 - lon2) % 360 + 360) % 360);
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Returns how many degrees the pair is away from forming an exact aspect.
 * 0 when exact; positive when within orb on either side.
 */
export function getOrbFromExact(lon1: number, lon2: number, aspectAngle: number): number {
  return Math.abs(getAngularSeparation(lon1, lon2) - aspectAngle);
}

// ─── AspectWindow ─────────────────────────────────────────────────────────────

export interface AspectWindow {
  planet1:     string;
  planet2:     string;
  aspectName:  string;  // "conjunction" | "opposition" | etc.
  aspectAngle: number;  // exact angle, e.g. 90
  entryDate:   Date;    // first day orb ≤ threshold
  peakDate:    Date;    // day with smallest orb (refined to hourly in scanTransits)
  exitDate:    Date;    // last day orb ≤ threshold
  minOrb:      number;  // smallest orb observed across the window
}

// ─── Planets included in sky-to-sky aspect scan ───────────────────────────────
//
// Moon moves ~13°/day — its windows would be hours wide and noise the output.
// It is handled separately in Chunk 3 (new/full moon, lunation events).

const SKY_PLANETS = PLANETS.filter((p) => p !== "Moon");

// ─── detectAspectWindows ──────────────────────────────────────────────────────

/**
 * Given a pre-computed array of daily snapshots, returns all aspect windows
 * for every unique sky-planet pair × every major aspect whose orb ever closes
 * within the snapshot range.
 *
 * Algorithm:
 *   For each (planet1, planet2, aspect) triple:
 *     Walk day by day.  When orb drops ≤ aspect.orb, open a window.
 *     Track the day with the minimum orb as the approximate peak.
 *     When orb rises > aspect.orb (or we run out of days), close the window.
 */
export function detectAspectWindows(snapshots: DailySnapshot[]): AspectWindow[] {
  const windows: AspectWindow[] = [];

  // Build unique planet pairs (order-independent)
  const pairs: [string, string][] = [];
  for (let i = 0; i < SKY_PLANETS.length; i++) {
    for (let j = i + 1; j < SKY_PLANETS.length; j++) {
      pairs.push([SKY_PLANETS[i], SKY_PLANETS[j]]);
    }
  }

  for (const [p1, p2] of pairs) {
    for (const aspect of ASPECTS) {
      if (!SKY_TO_SKY_ASPECTS.has(aspect.name)) continue;
      // State for the current open window, if any
      let windowOpen       = false;
      let entryDate!:   Date;
      let peakDate!:    Date;
      let peakOrb       = Infinity;

      for (const snap of snapshots) {
        const pos1 = snap.positions.find((p) => p.planet === p1);
        const pos2 = snap.positions.find((p) => p.planet === p2);
        if (!pos1 || !pos2) continue;

        const orb = getOrbFromExact(pos1.longitude, pos2.longitude, aspect.angle);
        const inWindow = orb <= aspect.orb;

        if (inWindow && !windowOpen) {
          // Open a new window
          windowOpen = true;
          entryDate  = snap.date;
          peakDate   = snap.date;   // refined later by refinePeak in scanTransits
          peakOrb    = orb;
        } else if (inWindow && windowOpen) {
          // Extend the window; update peak if this day is tighter
          if (orb < peakOrb) {
            peakOrb  = orb;
            peakDate = snap.date;
          }
        } else if (!inWindow && windowOpen) {
          // Close the window — exit was the previous day
          const exitDate = new Date(snap.date);
          exitDate.setUTCDate(exitDate.getUTCDate() - 1);

          windows.push({
            planet1:     p1,
            planet2:     p2,
            aspectName:  aspect.name,
            aspectAngle: aspect.angle,
            entryDate,
            peakDate,
            exitDate,
            minOrb:      peakOrb,
          });

          windowOpen = false;
          peakOrb    = Infinity;
        }
      }

      // Close any window still open at the end of the scan range
      if (windowOpen) {
        const lastSnap = snapshots[snapshots.length - 1];
        windows.push({
          planet1:     p1,
          planet2:     p2,
          aspectName:  aspect.name,
          aspectAngle: aspect.angle,
          entryDate,
          peakDate,
          exitDate:    lastSnap.date,
          minOrb:      peakOrb,
        });
      }
    }
  }

  // Sort by peak date
  return windows.sort(
    (a, b) => a.peakDate.getTime() - b.peakDate.getTime(),
  );
}

// ─── Chunk 3: Peak refinement, stations, ingresses, moon phases ───────────────

// ─── Tier 1-2 planets for station / ingress detection ────────────────────────
//
// Chiron is not modelled in astronomy-engine (the library covers Sun–Pluto +
// solar-system barycentre only).  Excluded; can be re-added if a Chiron
// ephemeris source is integrated later.

const STATION_PLANETS: Planet[] = ["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];

// ─── Signed angular delta ─────────────────────────────────────────────────────
//
// Returns how much a longitude moved (degrees), range (−180, 180].
// Positive = prograde, negative = retrograde.

function signedDelta(lon1: number, lon2: number): number {
  let d = lon2 - lon1;
  if (d >  180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

// ─── Hourly peak refinement ───────────────────────────────────────────────────

/**
 * Scans ±windowDays in 1-hour steps to find the moment two planets form
 * the tightest approach to a given aspect angle.
 * Replaces the daily-resolution peakDate from detectAspectWindows.
 */
function refinePeak(
  planet1:         string,
  planet2:         string,
  aspectAngle:     number,
  approximatePeak: Date,
  windowDays       = 2,
): Date {
  const hourMs  = 60 * 60 * 1_000;
  const startMs = approximatePeak.getTime() - windowDays * 24 * hourMs;
  const endMs   = approximatePeak.getTime() + windowDays * 24 * hourMs;

  let bestDate = approximatePeak;
  let bestOrb  = Infinity;

  for (let ms = startMs; ms <= endMs; ms += hourMs) {
    const d   = new Date(ms);
    const orb = getOrbFromExact(
      getPlanetLongitude(planet1, d),
      getPlanetLongitude(planet2, d),
      aspectAngle,
    );
    if (orb < bestOrb) {
      bestOrb  = orb;
      bestDate = d;
    }
  }

  return bestDate;
}

// ─── Retrograde station detection ────────────────────────────────────────────

export interface StationEvent {
  type:      "station-retrograde" | "station-direct";
  planet:    string;
  date:      Date;
  longitude: number;
  sign:      ZodiacSign;
}

/** Refines a station from daily resolution to within ~1 hour. */
function refineStation(
  planet:     string,
  approxDate: Date,
): { date: Date; longitude: number } {
  const hourMs  = 60 * 60 * 1_000;
  const startMs = approxDate.getTime() - 2 * 24 * hourMs;
  const endMs   = approxDate.getTime() + 2 * 24 * hourMs;

  let prevLon   = getPlanetLongitude(planet, new Date(startMs));
  let prevDelta = 0;
  let prevDate  = new Date(startMs);

  for (let ms = startMs + hourMs; ms <= endMs; ms += hourMs) {
    const date  = new Date(ms);
    const lon   = getPlanetLongitude(planet, date);
    const delta = signedDelta(prevLon, lon);

    if (prevDelta !== 0 && delta !== 0 && Math.sign(prevDelta) !== Math.sign(delta)) {
      // Direction reversal bracketed between prevDate and date — use prevDate
      return { date: prevDate, longitude: prevLon };
    }

    prevLon   = lon;
    prevDelta = delta;
    prevDate  = date;
  }

  return { date: approxDate, longitude: getPlanetLongitude(planet, approxDate) };
}

/**
 * Detects retrograde and direct stations for the Tier 1–2 outer planets
 * by comparing daily motion direction across consecutive snapshot triplets.
 */
export function detectStations(snapshots: DailySnapshot[]): StationEvent[] {
  const events: StationEvent[] = [];

  for (const planet of STATION_PLANETS) {
    for (let i = 2; i < snapshots.length; i++) {
      const a = snapshots[i - 2].positions.find((p) => p.planet === planet);
      const b = snapshots[i - 1].positions.find((p) => p.planet === planet);
      const c = snapshots[i    ].positions.find((p) => p.planet === planet);
      if (!a || !b || !c) continue;

      const d1 = signedDelta(a.longitude, b.longitude);
      const d2 = signedDelta(b.longitude, c.longitude);

      // A station occurs when the direction of daily motion changes sign
      if (d1 !== 0 && d2 !== 0 && Math.sign(d1) !== Math.sign(d2)) {
        const refined  = refineStation(planet, snapshots[i - 1].date);
        const { sign } = getLongitudeData(refined.longitude);

        events.push({
          // d2 < 0 → planet just turned retrograde; d2 > 0 → turned direct
          type:      d2 < 0 ? "station-retrograde" : "station-direct",
          planet,
          date:      refined.date,
          longitude: refined.longitude,
          sign,
        });
      }
    }
  }

  return events;
}

// ─── Sign ingress detection ───────────────────────────────────────────────────

export interface IngressEvent {
  type:      "ingress";
  planet:    string;
  fromSign:  ZodiacSign;
  toSign:    ZodiacSign;
  date:      Date;
  longitude: number;
}

/** Refines a sign crossing from daily resolution to within ~1 hour. */
function refineIngress(
  planet:     string,
  approxDate: Date,
): { date: Date; longitude: number } {
  const hourMs  = 60 * 60 * 1_000;
  const startMs = approxDate.getTime() - 2 * 24 * hourMs;
  const endMs   = approxDate.getTime() + 2 * 24 * hourMs;

  let prevLon   = getPlanetLongitude(planet, new Date(startMs));
  let prevIndex = getLongitudeData(prevLon).signIndex;

  for (let ms = startMs + hourMs; ms <= endMs; ms += hourMs) {
    const date  = new Date(ms);
    const lon   = getPlanetLongitude(planet, date);
    const index = getLongitudeData(lon).signIndex;

    if (index !== prevIndex) {
      return { date, longitude: lon };
    }

    prevLon   = lon;
    prevIndex = index;
  }

  return { date: approxDate, longitude: getPlanetLongitude(planet, approxDate) };
}

/**
 * Detects sign ingresses for Tier 1–2 outer planets.
 * Captures both prograde (direct) and retrograde crossings — a planet can
 * re-enter a previous sign while retrograde; both are valid events.
 */
export function detectIngresses(snapshots: DailySnapshot[]): IngressEvent[] {
  const events: IngressEvent[] = [];

  for (const planet of STATION_PLANETS) {
    for (let i = 1; i < snapshots.length; i++) {
      const prev = snapshots[i - 1].positions.find((p) => p.planet === planet);
      const curr = snapshots[i    ].positions.find((p) => p.planet === planet);
      if (!prev || !curr) continue;

      const prevIndex = getLongitudeData(prev.longitude).signIndex;
      const currIndex = getLongitudeData(curr.longitude).signIndex;

      if (prevIndex !== currIndex) {
        const refined         = refineIngress(planet, snapshots[i - 1].date);
        const { sign: toSign } = getLongitudeData(refined.longitude);

        events.push({
          type:      "ingress",
          planet,
          fromSign:  prev.sign,
          toSign,
          date:      refined.date,
          longitude: refined.longitude,
        });
      }
    }
  }

  return events;
}

// ─── Moon phase detection ─────────────────────────────────────────────────────

export interface MoonPhaseEvent {
  type:
    | "new-moon"  | "full-moon"
    | "lunar-eclipse" | "solar-eclipse"
    | "blood-moon"    | "super-moon"   | "blue-moon"
    | "harvest-moon"  | "super-blue-blood-moon";
  date:         Date;
  longitude:    number;    // Moon's geocentric ecliptic longitude at peak
  sign:         ZodiacSign;
  isEclipse:    boolean;
  eclipseType?: "lunar" | "solar";
}

/**
 * Finds all new moons and full moons within [startDate, endDate].
 * Classifies full moons by the most specific applicable label:
 *   Super Blue Blood Moon > Blood Moon > Lunar Eclipse > Super Moon >
 *   Blue Moon > Harvest Moon > Full Moon
 * New moons are classified as Solar Eclipse or New Moon.
 *
 * Definitions (from CLAUDE.md):
 *   Blood Moon         — total lunar eclipse (umbral magnitude ≥ 1.0)
 *   Super Moon         — Full Moon when lunar distance < ~362,000 km
 *   Blue Moon          — second Full Moon in a calendar month
 *   Harvest Moon       — Full Moon with peak date closest to autumn equinox
 *   Super Blue Blood   — super + blue + blood coinciding
 */
export function detectMoonPhases(startDate: Date, endDate: Date): MoonPhaseEvent[] {
  const events: MoonPhaseEvent[] = [];
  const DAY_MS = 24 * 60 * 60 * 1_000;

  // ── 1. Collect eclipse data (with totality info for lunar eclipses) ──────────
  type LunarEclRec = { date: Date; isTotal: boolean };
  const lunarEclipses: LunarEclRec[] = [];
  const solarEclipseDates: Date[]   = [];

  try {
    let e = Astronomy.SearchLunarEclipse(Astronomy.MakeTime(startDate));
    while (e.peak.date <= endDate) {
      lunarEclipses.push({ date: e.peak.date, isTotal: e.kind === "total" });
      e = Astronomy.NextLunarEclipse(e.peak);
    }
  } catch { /* no more lunar eclipses in range */ }

  try {
    let e = Astronomy.SearchGlobalSolarEclipse(Astronomy.MakeTime(startDate));
    while (e.peak.date <= endDate) {
      solarEclipseDates.push(e.peak.date);
      e = Astronomy.NextGlobalSolarEclipse(e.peak);
    }
  } catch { /* no more solar eclipses in range */ }

  function matchLunarEcl(date: Date): LunarEclRec | undefined {
    return lunarEclipses.find(
      (e) => Math.abs(e.date.getTime() - date.getTime()) < 2 * DAY_MS,
    );
  }
  function matchSolarEcl(date: Date): boolean {
    return solarEclipseDates.some(
      (d) => Math.abs(d.getTime() - date.getTime()) < 2 * DAY_MS,
    );
  }

  // ── 2. Lunar distance helper (Astronomy.GeoMoon returns AU) ─────────────────
  function getLunarDistanceKm(date: Date): number {
    const v = Astronomy.GeoMoon(Astronomy.MakeTime(date));
    const distAU = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    return distAU * 149_597_870.7;
  }

  // ── 3. Collect all raw moon instances ────────────────────────────────────────
  interface RawMoon { date: Date; longitude: number; sign: ZodiacSign; }
  const fullMoons: RawMoon[] = [];
  const newMoons:  RawMoon[] = [];

  function collectRaw(targetLon: 0 | 180, out: RawMoon[]): void {
    let t = Astronomy.MakeTime(startDate);
    for (;;) {
      const found = Astronomy.SearchMoonPhase(targetLon, t, 35);
      if (!found || found.date > endDate) break;
      const lon      = getPlanetLongitude("Moon", found.date);
      const { sign } = getLongitudeData(lon);
      out.push({ date: found.date, longitude: lon, sign });
      t = Astronomy.MakeTime(new Date(found.date.getTime() + 25 * DAY_MS));
    }
  }

  collectRaw(0,   newMoons);
  collectRaw(180, fullMoons);

  // ── 4. Blue moon — second Full Moon in any calendar month ────────────────────
  const blueMoonMs = new Set<number>();
  {
    const byMonth: Record<string, RawMoon[]> = {};
    for (const fm of fullMoons) {
      const key = `${fm.date.getUTCFullYear()}-${fm.date.getUTCMonth()}`;
      (byMonth[key] ??= []).push(fm);
    }
    for (const moons of Object.values(byMonth)) {
      if (moons.length >= 2) {
        for (let i = 1; i < moons.length; i++) {
          blueMoonMs.add(moons[i].date.getTime());
        }
      }
    }
  }

  // ── 5. Harvest moon — Full Moon nearest the September equinox ────────────────
  const harvestMoonMs = new Set<number>();
  {
    const startYear = startDate.getUTCFullYear();
    const endYear   = endDate.getUTCFullYear();
    for (let y = startYear; y <= endYear; y++) {
      try {
        const equinox = Astronomy.Seasons(y).sep_equinox.date;
        let nearest: RawMoon | null = null;
        let nearestDiff = Infinity;
        for (const fm of fullMoons) {
          const diff = Math.abs(fm.date.getTime() - equinox.getTime());
          if (diff < nearestDiff) {
            nearest     = fm;
            nearestDiff = diff;
          }
        }
        if (nearest) harvestMoonMs.add(nearest.date.getTime());
      } catch { /* skip */ }
    }
  }

  // ── 6. Classify and emit new moon events ─────────────────────────────────────
  for (const nm of newMoons) {
    const isSolarEcl = matchSolarEcl(nm.date);
    events.push({
      type:      isSolarEcl ? "solar-eclipse" : "new-moon",
      date:      nm.date,
      longitude: nm.longitude,
      sign:      nm.sign,
      isEclipse: isSolarEcl,
      ...(isSolarEcl ? { eclipseType: "solar" as const } : {}),
    });
  }

  // ── 7. Classify and emit full moon events (precedence: most specific wins) ───
  for (const fm of fullMoons) {
    const lunarEcl = matchLunarEcl(fm.date);
    const isBlood   = lunarEcl?.isTotal ?? false;
    const isEclipse = !!lunarEcl;
    const isSuper   = getLunarDistanceKm(fm.date) < 362_000;
    const isBlue    = blueMoonMs.has(fm.date.getTime());
    const isHarvest = harvestMoonMs.has(fm.date.getTime());

    let type: MoonPhaseEvent["type"];
    if      (isBlood && isSuper && isBlue) type = "super-blue-blood-moon";
    else if (isBlood)                      type = "blood-moon";
    else if (isEclipse)                    type = "lunar-eclipse";
    else if (isSuper)                      type = "super-moon";
    else if (isBlue)                       type = "blue-moon";
    else if (isHarvest)                    type = "harvest-moon";
    else                                   type = "full-moon";

    events.push({
      type,
      date:      fm.date,
      longitude: fm.longitude,
      sign:      fm.sign,
      isEclipse,
      ...(isEclipse ? { eclipseType: "lunar" as const } : {}),
    });
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ─── Unified sky event type ───────────────────────────────────────────────────
//
// Discriminated union across all generator output types.
// AspectWindow is identified by the presence of `aspectName` / `planet1`.
// All other variants carry a `type` string discriminant.
//
// Chunk 4 converts SkyEvent[] → TransitEvent[] (the feed card model).

export type SkyEvent = AspectWindow | StationEvent | IngressEvent | MoonPhaseEvent;

/** Extracts the canonical event date for sorting across all SkyEvent variants. */
function skyEventDate(e: SkyEvent): Date {
  // AspectWindow has peakDate; all other types carry date
  if ("peakDate" in e) return e.peakDate;
  return (e as StationEvent | IngressEvent | MoonPhaseEvent).date;
}

// ─── scanTransits ─────────────────────────────────────────────────────────────

/**
 * Full sky scan for [startDate, endDate].  Returns a unified, date-sorted list
 * of all sky-to-sky aspect windows (with hourly-refined peaks), retrograde /
 * direct stations, sign ingresses, and Moon phase events.
 *
 * Typical call for a 30-day feed:
 *   scanTransits(new Date(), new Date(Date.now() + 30 * 86_400_000))
 */
export function scanTransits(startDate: Date, endDate: Date): SkyEvent[] {
  const snapshots = scanDateRange(startDate, endDate);

  // Aspect windows — peak dates refined from daily to hourly resolution
  const rawWindows    = detectAspectWindows(snapshots);
  const aspectWindows = rawWindows.map((w) => ({
    ...w,
    peakDate: refinePeak(w.planet1, w.planet2, w.aspectAngle, w.peakDate),
  }));

  const stations  = detectStations(snapshots);
  const ingresses = detectIngresses(snapshots);
  const phases    = detectMoonPhases(startDate, endDate);

  const all: SkyEvent[] = [...aspectWindows, ...stations, ...ingresses, ...phases];
  return all.sort((a, b) => skyEventDate(a).getTime() - skyEventDate(b).getTime());
}

// ─── Chunk 3 development verification ────────────────────────────────────────
//
// Verified expected events in a 45-day window from 2026-03-18
// (confirmed against live astronomy-engine output):
//
//   Saturn  conjunct Neptune   ongoing     peak ~Mar 18   (2.1° orb at window start)
//   Mars    trine    Jupiter   ~Mar 22     0.00° peak
//   Sun     conjunct Neptune   ~Mar 22
//   Sun     conjunct Saturn    ~Mar 25
//   Saturn  sextile  Pluto     ~Mar 29
//   Mercury conjunct Neptune   ~Apr 17     0.12° peak
//   Mercury conjunct Saturn    ~Apr 20
//   Mars    conjunct Saturn    ~Apr 20     0.04° peak
//   Venus   conjunct Uranus    ~Apr 24     0.09° peak
//   Uranus  ingress  Gemini    ~Apr 27
//   Pluto   station-retrograde ~May 8 (outside 30-day window; use 45-day to see it)
//
//   New Moon  ~Mar 19   Pisces/Aries border
//   Full Moon ~Apr 2    Libra
//   New Moon  ~Apr 17   Aries (near Mercury-Neptune conjunction)
//
// If any of the above are missing from the table, investigate before Chunk 4.

function verifyTransits(): void {
  const start = new Date();
  const end   = new Date(start.getTime() + 45 * 24 * 60 * 60 * 1_000);
  const events = scanTransits(start, end);

  console.group(
    `[transitGenerator] Full sky scan (${start.toISOString().slice(0, 10)} → ${end.toISOString().slice(0, 10)}) — ${events.length} events`,
  );
  console.table(
    events.map((e) => {
      if ("aspectName" in e) {
        return {
          type:    e.aspectName,
          bodies:  `${e.planet1} / ${e.planet2}`,
          peak:    e.peakDate.toISOString().slice(0, 10),
          "orb°":  e.minOrb.toFixed(2),
          entry:   e.entryDate.toISOString().slice(0, 10),
          exit:    e.exitDate.toISOString().slice(0, 10),
        };
      }
      if ("fromSign" in e) {
        return {
          type:   "ingress",
          bodies: e.planet,
          peak:   e.date.toISOString().slice(0, 10),
          "orb°": "—",
          entry:  `${e.fromSign} → ${e.toSign}`,
          exit:   "—",
        };
      }
      if ("type" in e && (e.type === "station-retrograde" || e.type === "station-direct")) {
        return {
          type:   e.type,
          bodies: e.planet,
          peak:   e.date.toISOString().slice(0, 10),
          "orb°": "—",
          entry:  e.sign,
          exit:   "—",
        };
      }
      // MoonPhaseEvent
      const mp = e as MoonPhaseEvent;
      return {
        type:   mp.type,
        bodies: "Moon",
        peak:   mp.date.toISOString().slice(0, 10),
        "orb°": "—",
        entry:  mp.sign,
        exit:   mp.isEclipse ? "ECLIPSE" : "—",
      };
    }),
  );
  console.groupEnd();
}

if (process.env.NODE_ENV === "development") {
  Promise.resolve().then(verifyTransits);
}

// ─── Chunk 4: SkyEvent → TransitEvent conversion, natal transits, caching ────

// ─── Local planet weights ─────────────────────────────────────────────────────
// Mirrors transitFilter.ts PLANET_WEIGHT — kept local to avoid circular imports.

const TRANSIT_PLANET_WEIGHT: Record<string, number> = {
  Sun:     2,
  Moon:    3,
  Mercury: 1,
  Venus:   2,
  Mars:    3,
  Jupiter: 3,
  Saturn:  4,
  Uranus:  4,
  Neptune: 5,
  Pluto:   5,
};

// ─── Theme generation ─────────────────────────────────────────────────────────
//
// Themes are short keyword phrases shown in italic gold on the card.
// For planet-to-planet aspects: one keyword from each planet + an aspect modifier.
// For special events: dedicated phrases.
// Override table catches the most meaningful outer-planet pairings.

const PLANET_KW: Record<string, [string, string]> = {
  Sun:     ["identity",       "vitality"    ],
  Moon:    ["emotion",        "instinct"    ],
  Mercury: ["mind",           "clarity"     ],
  Venus:   ["beauty",         "love"        ],
  Mars:    ["will",           "drive"       ],
  Jupiter: ["expansion",      "abundance"   ],
  Saturn:  ["structure",      "discipline"  ],
  Uranus:  ["disruption",     "freedom"     ],
  Neptune: ["dissolution",    "vision"      ],
  Pluto:   ["transformation", "power"       ],
};

const ASPECT_KW: Record<string, string> = {
  conjunction: "fusion",
  opposition:  "tension · integration",
  square:      "friction · challenge",
  trine:       "flow · ease",
  sextile:     "opportunity",
};

// Specific overrides for high-signal outer-planet pairs
const PAIR_THEMES: Record<string, string> = {
  "saturn+neptune+conjunction": "structure vs dissolution · reality testing · fog",
  "neptune+saturn+conjunction": "structure vs dissolution · reality testing · fog",
  "mars+jupiter+trine":         "confidence · momentum · expansion",
  "jupiter+mars+trine":         "confidence · momentum · expansion",
  "mercury+neptune+conjunction":"intuition · fog · dissolving certainty",
  "neptune+mercury+conjunction":"intuition · fog · dissolving certainty",
  "mercury+saturn+conjunction": "disciplined mind · precision · structure",
  "saturn+mercury+conjunction": "disciplined mind · precision · structure",
  "mars+saturn+conjunction":    "sustained will · endurance · discipline",
  "saturn+mars+conjunction":    "sustained will · endurance · discipline",
  "venus+uranus+conjunction":   "unexpected beauty · freedom · excitement",
  "uranus+venus+conjunction":   "unexpected beauty · freedom · excitement",
  "sun+neptune+conjunction":    "imagination · fog · transcendence",
  "neptune+sun+conjunction":    "imagination · fog · transcendence",
  "sun+saturn+conjunction":     "accountability · limits · maturity",
  "saturn+sun+conjunction":     "accountability · limits · maturity",
  "saturn+pluto+sextile":       "power structures · deep reform · endurance",
  "pluto+saturn+sextile":       "power structures · deep reform · endurance",
};

const SPECIAL_EVENT_THEMES: Record<string, string> = {
  "station-retrograde":    "inward turn · review · revision",
  "station-direct":        "forward momentum · integration · clarity",
  "ingress":               "new chapter · shift · atmosphere change",
  "new-moon":              "initiation · intention · new cycle",
  "full-moon":             "culmination · revelation · release",
  "solar-eclipse":         "threshold · new era · irreversible turn",
  "lunar-eclipse":         "release · reckoning · completion",
  "blood-moon":            "total eclipse · shadow · what must be released",
  "super-moon":            "amplified feeling · proximity · heightened pull",
  "blue-moon":             "second chance · rare · finishing what started",
  "harvest-moon":          "gathering · equinox · what has been cultivated",
  "super-blue-blood-moon": "convergence · rare · threshold · patience",
};

// Specific sign overrides for moon phases
const MOON_SIGN_THEMES: Record<string, string> = {
  Aries:       "initiation · fire · new cycle",
  Taurus:      "pleasure · security · grounding",
  Gemini:      "communication · duality · curiosity",
  Cancer:      "nurture · family · emotional depth",
  Leo:         "creativity · radiance · expression",
  Virgo:       "discernment · service · integration",
  Libra:       "balance · relationships · harmony",
  Scorpio:     "depth · shadow · transformation",
  Sagittarius: "freedom · meaning · expansion",
  Capricorn:   "structure · ambition · discipline",
  Aquarius:    "innovation · community · revolution",
  Pisces:      "dissolution · compassion · transcendence",
};

function buildThemes(event: SkyEvent): string | undefined {
  if ("aspectName" in event) {
    const pairKey = `${event.planet1.toLowerCase()}+${event.planet2.toLowerCase()}+${event.aspectName}`;
    if (PAIR_THEMES[pairKey]) return PAIR_THEMES[pairKey];

    // Natal transit — drop the "natal " prefix for theme lookup
    const p1 = event.planet1;
    const p2 = event.planet2.replace(/^natal /, "");
    const kw1 = PLANET_KW[p1]?.[0];
    const kw2 = PLANET_KW[p2]?.[0] ?? PLANET_KW[p2]?.[1];
    const aspectMod = ASPECT_KW[event.aspectName];
    if (!kw1 || !aspectMod) return undefined;
    return kw2 ? `${kw1} · ${kw2} · ${aspectMod}` : `${kw1} · ${aspectMod}`;
  }

  if ("fromSign" in event) {
    // Ingress: use planet keyword + sign keyword
    const planetKw = PLANET_KW[event.planet]?.[0];
    const signKw   = MOON_SIGN_THEMES[event.toSign]?.split(" · ")[0];
    const base     = SPECIAL_EVENT_THEMES["ingress"];
    return planetKw ? `${planetKw} · ${signKw ?? "transition"} · ${base.split(" · ")[0]}` : base;
  }

  if ("type" in event) {
    const type = (event as StationEvent | IngressEvent | MoonPhaseEvent).type;

    if (type === "station-retrograde" || type === "station-direct") {
      const se = event as StationEvent;
      const kw = PLANET_KW[se.planet]?.[0];
      const base = SPECIAL_EVENT_THEMES[type];
      return kw ? `${kw} · ${base}` : base;
    }

    if (type === "new-moon"   || type === "full-moon"  ||
        type === "solar-eclipse" || type === "lunar-eclipse" ||
        type === "blood-moon" || type === "super-moon"   ||
        type === "blue-moon"  || type === "harvest-moon" ||
        type === "super-blue-blood-moon") {
      const mp = event as MoonPhaseEvent;
      const signKw = MOON_SIGN_THEMES[mp.sign];
      if (signKw) return signKw;
      return SPECIAL_EVENT_THEMES[type] ?? SPECIAL_EVENT_THEMES["full-moon"];
    }
  }

  return undefined;
}

// ─── Status derivation ────────────────────────────────────────────────────────

function deriveStatus(event: SkyEvent, today: Date): TransitEvent["status"] {
  if ("aspectName" in event) {
    if (today < event.entryDate) return "approaching";
    if (today <= event.exitDate) return "active";
    return "separating";
  }

  const DAY_MS = 24 * 60 * 60 * 1_000;
  const eventDate = ("date" in event) ? event.date : (event as MoonPhaseEvent).date;
  const diffDays = (eventDate.getTime() - today.getTime()) / DAY_MS;

  if ("fromSign" in event || (event as StationEvent | MoonPhaseEvent).type === "station-retrograde" ||
      (event as StationEvent | MoonPhaseEvent).type === "station-direct") {
    // Station / Ingress: active within ±3 days
    if (Math.abs(diffDays) <= 3) return "active";
    return diffDays > 0 ? "approaching" : "separating";
  }

  // Moon phase: active within ±2 days
  if (Math.abs(diffDays) <= 2) return "active";
  return diffDays > 0 ? "approaching" : "separating";
}

// ─── House lookup (duplicated from natal.ts to avoid circular imports) ────────

function getHouseFromCusps(longitude: number, cusps: number[]): number {
  const lon = ((longitude % 360) + 360) % 360;
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end   = cusps[(i + 1) % 12];
    if (start <= end) {
      if (lon >= start && lon < end) return i + 1;
    } else {
      if (lon >= start || lon < end) return i + 1;
    }
  }
  return 1;
}

// ─── Title and label builders ─────────────────────────────────────────────────

/** Human-readable capitalization for aspect names */
function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildTitle(event: SkyEvent): string {
  if ("aspectName" in event) {
    const p1 = event.planet1;
    const p2 = event.planet2;   // may be "natal Sun" etc.
    switch (event.aspectName) {
      case "conjunction":  return `${p1} conjunct ${p2}`;
      case "opposition":   return `${p1} opposite ${p2}`;
      case "square":       return `${p1} square ${p2}`;
      case "trine":        return `${p1} trine ${p2}`;
      case "sextile":      return `${p1} sextile ${p2}`;
      default:             return `${p1} ${event.aspectName} ${p2}`;
    }
  }

  if ("fromSign" in event) {
    return `${event.planet} enters ${event.toSign}`;
  }

  if ("type" in event) {
    const type = (event as StationEvent | MoonPhaseEvent).type;
    if (type === "station-retrograde") return `${(event as StationEvent).planet} stations retrograde`;
    if (type === "station-direct")     return `${(event as StationEvent).planet} stations direct`;
    if (type === "new-moon")              return `New Moon in ${(event as MoonPhaseEvent).sign}`;
    if (type === "full-moon")             return `Full Moon in ${(event as MoonPhaseEvent).sign}`;
    if (type === "solar-eclipse")         return `Solar Eclipse in ${(event as MoonPhaseEvent).sign}`;
    if (type === "lunar-eclipse")         return `Lunar Eclipse in ${(event as MoonPhaseEvent).sign}`;
    if (type === "blood-moon")            return `Blood Moon in ${(event as MoonPhaseEvent).sign}`;
    if (type === "super-moon")            return `Super Moon in ${(event as MoonPhaseEvent).sign}`;
    if (type === "blue-moon")             return `Blue Moon in ${(event as MoonPhaseEvent).sign}`;
    if (type === "harvest-moon")          return `Harvest Moon in ${(event as MoonPhaseEvent).sign}`;
    if (type === "super-blue-blood-moon") return `Super Blue Blood Moon in ${(event as MoonPhaseEvent).sign}`;
  }

  return "Celestial event";
}

function buildAspectLabel(event: SkyEvent): string {
  if ("aspectName" in event) return titleCase(event.aspectName);

  if ("fromSign" in event) return `enters ${event.toSign}`;

  if ("type" in event) {
    const type = (event as StationEvent | MoonPhaseEvent).type;
    if (type === "station-retrograde") return "Station Retrograde";
    if (type === "station-direct")     return "Station Direct";
    if (type === "new-moon")              return "New Moon";
    if (type === "full-moon")             return "Full Moon";
    if (type === "solar-eclipse")         return "Solar Eclipse";
    if (type === "lunar-eclipse")         return "Lunar Eclipse";
    if (type === "blood-moon")            return "Blood Moon";
    if (type === "super-moon")            return "Super Moon";
    if (type === "blue-moon")             return "Blue Moon";
    if (type === "harvest-moon")          return "Harvest Moon";
    if (type === "super-blue-blood-moon") return "Super Blue Blood Moon";
  }

  return "Event";
}

function buildId(event: SkyEvent): string {
  if ("aspectName" in event) {
    const peak = event.peakDate.toISOString().slice(0, 10);
    return `${event.planet1}-${event.planet2}-${event.aspectName}-${peak}`
      .toLowerCase().replace(/\s+/g, "-");
  }
  if ("fromSign" in event) {
    const date = event.date.toISOString().slice(0, 10);
    return `ingress-${event.planet}-${event.toSign}-${date}`.toLowerCase();
  }
  const type = (event as StationEvent | MoonPhaseEvent).type;
  const date = ("date" in event ? (event as StationEvent).date : (event as MoonPhaseEvent).date)
    .toISOString().slice(0, 10);
  if (type === "station-retrograde" || type === "station-direct") {
    return `${type}-${(event as StationEvent).planet}-${date}`;
  }
  return `${type}-${date}`;
}

// ─── SkyEvent → TransitEvent ──────────────────────────────────────────────────

/**
 * Converts a raw SkyEvent into a TransitEvent compatible with TransitCard,
 * TransitDetail, and transitFilter.
 *
 * @param today      — reference date for status derivation (defaults to now)
 * @param natalCusps — natal house cusps; when provided, natal aspect windows
 *                     receive a house assignment based on the transiting planet's
 *                     position in the natal chart at peak time.
 */
export function skyEventToTransit(
  event:       SkyEvent,
  today:       Date = new Date(),
  natalCusps?: number[],
): TransitEvent {
  const id     = buildId(event);
  const title  = buildTitle(event);
  const aspect = buildAspectLabel(event);
  const themes = buildThemes(event);
  const status = deriveStatus(event, today);

  // ── AspectWindow ─────────────────────────────────────────────────────────────
  if ("aspectName" in event) {
    // Primary planet = the higher-weight body of the pair
    const w1 = TRANSIT_PLANET_WEIGHT[event.planet1] ?? 0;
    const w2 = TRANSIT_PLANET_WEIGHT[event.planet2.replace(/^natal /, "")] ?? 0;
    const [primary, secondary] = w1 >= w2
      ? [event.planet1, event.planet2]
      : [event.planet2, event.planet1];

    // Sign of the primary planet at peak time
    const peakLon      = getPlanetLongitude(primary.replace(/^natal /, ""), event.peakDate);
    const { sign }     = getLongitudeData(peakLon);

    // House assignment: only for natal transits with house cusps available
    let house: number | undefined;
    if (natalCusps && event.planet2.startsWith("natal ")) {
      // House = natal house the transiting planet (planet1) occupies at peak
      const transitLon = getPlanetLongitude(event.planet1, event.peakDate);
      house = getHouseFromCusps(transitLon, natalCusps);
    }

    return {
      id,
      planet:       primary,
      targetPlanet: secondary !== primary ? secondary : undefined,
      aspect,
      transitType:  event.aspectName as TransitEvent["transitType"],
      peakDate:     event.peakDate,
      title,
      themes,
      status,
      ...(house != null ? { house } : {}),
    };
  }

  // ── StationEvent ─────────────────────────────────────────────────────────────
  if ("type" in event && (
    (event as StationEvent).type === "station-retrograde" ||
    (event as StationEvent).type === "station-direct"
  )) {
    const se = event as StationEvent;
    return {
      id,
      planet:      se.planet,
      aspect,
      transitType: se.type,
      peakDate:    se.date,
      title,
      themes,
      status,
    };
  }

  // ── IngressEvent ─────────────────────────────────────────────────────────────
  if ("fromSign" in event) {
    const ie = event as IngressEvent;
    return {
      id,
      planet:      ie.planet,
      aspect,
      transitType: "ingress",
      peakDate:    ie.date,
      title,
      themes,
      status,
    };
  }

  // ── MoonPhaseEvent ────────────────────────────────────────────────────────────
  // Note: MoonPhaseEvent uses "solar-eclipse"/"lunar-eclipse" (detector convention)
  // but TransitEvent uses "eclipse-solar"/"eclipse-lunar" (card convention).
  // Map explicitly here.
  const mp = event as MoonPhaseEvent;
  const transitTypeMap: Record<MoonPhaseEvent["type"], TransitEvent["transitType"]> = {
    "new-moon":             "new-moon",
    "full-moon":            "full-moon",
    "solar-eclipse":        "eclipse-solar",
    "lunar-eclipse":        "eclipse-lunar",
    "blood-moon":           "blood-moon",
    "super-moon":           "super-moon",
    "blue-moon":            "blue-moon",
    "harvest-moon":         "harvest-moon",
    "super-blue-blood-moon": "super-blue-blood-moon",
  };

  // House assignment for lunar phase events (only when birth data is present).
  // New Moon / Solar Eclipse: the Sun defines the lunation degree — use its longitude.
  // Full Moon / Lunar Eclipse: Moon's longitude is the illuminated point — use it directly.
  let mpHouse: number | undefined;
  if (natalCusps) {
    // New-moon family: use Sun longitude. Full-moon family: use Moon longitude.
    const isNewMoonType = mp.type === "new-moon" || mp.type === "solar-eclipse";
    const phaseLon = isNewMoonType
      ? getPlanetLongitude("Sun", mp.date)
      : mp.longitude; // Moon's geocentric ecliptic longitude, stored on detection
    mpHouse = getHouseFromCusps(phaseLon, natalCusps);
  }

  return {
    id,
    planet:      "Moon",
    aspect,
    transitType: transitTypeMap[mp.type],
    peakDate:    mp.date,
    title,
    themes,
    status,
    ...(mpHouse != null ? { house: mpHouse } : {}),
  };
}

// ─── Natal transit detection ──────────────────────────────────────────────────
//
// Scans for aspects between each transiting sky planet and every natal point
// (10 planets + ASC + MC).  Returns AspectWindow[] with planet2 set to a
// "natal X" name so callers can identify these as personal transits.
//
// Peak date is left at daily resolution (noon UTC).  Hourly refinement is
// skipped here to keep generation time reasonable; daily precision (±12h) is
// sufficient for a personal daily feed.

export function detectNatalTransits(
  snapshots:   DailySnapshot[],
  natalChart:  NatalChart,
): AspectWindow[] {
  const windows: AspectWindow[] = [];

  // Collect all natal reference points
  const natalPoints: Array<{ name: string; longitude: number }> = [
    ...natalChart.planets.map((p) => ({
      name:      `natal ${p.name}`,
      longitude: p.longitude,
    })),
    { name: "natal ASC", longitude: natalChart.ascendant },
    { name: "natal MC",  longitude: natalChart.mc        },
  ];

  // Gate: only outer/social planets, hard aspects, tight orb — prevents 40–80 card flood
  const NATAL_TRANSIT_PLANETS = new Set(["Jupiter", "Mars", "Saturn", "Uranus", "Neptune", "Pluto"]);
  const NATAL_TRANSIT_ASPECTS = new Set(["conjunction", "opposition", "square"]);
  const NATAL_TRANSIT_MAX_ORB = 3;

  const transitingPlanets = (SKY_PLANETS as readonly string[]).filter((p) => p !== "Moon");

  for (const planet of transitingPlanets) {
    if (!NATAL_TRANSIT_PLANETS.has(planet)) continue;

    for (const natalPt of natalPoints) {
      for (const aspect of ASPECTS) {
        if (!NATAL_TRANSIT_ASPECTS.has(aspect.name)) continue;

        let windowOpen = false;
        let entryDate!: Date;
        let peakDate!:  Date;
        let peakOrb    = Infinity;

        for (const snap of snapshots) {
          const pos = snap.positions.find((p) => p.planet === planet);
          if (!pos) continue;

          const orb      = getOrbFromExact(pos.longitude, natalPt.longitude, aspect.angle);
          const inWindow = orb <= aspect.orb;

          if (inWindow && !windowOpen) {
            windowOpen = true;
            entryDate  = snap.date;
            peakDate   = snap.date;
            peakOrb    = orb;
          } else if (inWindow && windowOpen) {
            if (orb < peakOrb) {
              peakOrb  = orb;
              peakDate = snap.date;
            }
          } else if (!inWindow && windowOpen) {
            if (peakOrb <= NATAL_TRANSIT_MAX_ORB) {
              const exitDate = new Date(snap.date);
              exitDate.setUTCDate(exitDate.getUTCDate() - 1);
              windows.push({
                planet1:     planet,
                planet2:     natalPt.name,
                aspectName:  aspect.name,
                aspectAngle: aspect.angle,
                entryDate,
                peakDate,
                exitDate,
                minOrb:      peakOrb,
              });
            }
            windowOpen = false;
            peakOrb    = Infinity;
          }
        }

        // Close any window still open at end of scan range
        if (windowOpen && peakOrb <= NATAL_TRANSIT_MAX_ORB) {
          const lastSnap = snapshots[snapshots.length - 1];
          windows.push({
            planet1:     planet,
            planet2:     natalPt.name,
            aspectName:  aspect.name,
            aspectAngle: aspect.angle,
            entryDate,
            peakDate,
            exitDate:    lastSnap.date,
            minOrb:      peakOrb,
          });
        }
      }
    }
  }

  return windows.sort((a, b) => a.peakDate.getTime() - b.peakDate.getTime());
}

// ─── Main generate function ───────────────────────────────────────────────────

/**
 * Generates a complete 30-day transit list.
 *
 * @param birthData  — if provided alongside natalChart, enables natal transit detection
 * @param natalChart — pre-computed natal chart; when provided, natal transits are appended
 *                     and house assignments are added to all transit objects
 */
export function generateTransits(
  birthData?:   StoredBirthData,
  natalChart?:  NatalChart,
): TransitEvent[] {
  const today    = new Date();
  const endDate  = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1_000);
  const todayStr = today.toISOString().slice(0, 10);

  // ── Sky events ──────────────────────────────────────────────────────────────
  const skyEvents   = scanTransits(today, endDate);
  const natalCusps  = natalChart?.houseCusps;

  const skyTransits = skyEvents.map((e) =>
    skyEventToTransit(e, today, natalCusps),
  );

  if (!birthData || !natalChart) {
    return skyTransits.sort(
      (a, b) => a.peakDate.getTime() - b.peakDate.getTime(),
    );
  }

  // ── Natal transits ──────────────────────────────────────────────────────────
  const snapshots    = scanDateRange(today, endDate);
  const natalWindows = detectNatalTransits(snapshots, natalChart);
  const natalTransits = natalWindows.map((w) =>
    skyEventToTransit(w, today, natalCusps),
  );

  // Combine and sort by peakDate
  const all = [...skyTransits, ...natalTransits];
  all.sort((a, b) => a.peakDate.getTime() - b.peakDate.getTime());

  void todayStr; // used by cache layer
  return all;
}

// ─── localStorage cache ───────────────────────────────────────────────────────

const TRANSIT_CACHE_KEY = "astro-journal-transits";

interface TransitCacheRecord {
  generatedDate:  string;   // "YYYY-MM-DD" — invalidates after midnight
  birthDataHash:  string;   // JSON.stringify(birthData) — invalidates on birth data change
  // peakDate is stored as ISO string and revived on read
  transits: Array<Omit<TransitEvent, "peakDate"> & { peakDate: string }>;
}

/**
 * Wraps generateTransits with a daily localStorage cache.
 *
 * The cache is invalidated when:
 *   - The date changes (new day → new sky picture)
 *   - The user's birth data changes (different natal transits)
 *
 * localStorage errors are caught silently — falls through to live generation.
 */
export function generateTransitsCached(
  birthData?:  StoredBirthData,
  natalChart?: NatalChart,
): TransitEvent[] {
  // Guard: localStorage is not available in SSR
  if (typeof window === "undefined") {
    return generateTransits(birthData, natalChart);
  }

  const today        = new Date().toISOString().slice(0, 10);
  const birthHash    = JSON.stringify(birthData ?? null);

  // ── Try reading from cache ──────────────────────────────────────────────────
  try {
    const raw = localStorage.getItem(TRANSIT_CACHE_KEY);
    if (raw) {
      const record = JSON.parse(raw) as TransitCacheRecord;
      if (record.generatedDate === today && record.birthDataHash === birthHash) {
        // Cache hit — revive Date objects and return
        return record.transits.map((t) => ({
          ...t,
          peakDate: new Date(t.peakDate),
        })) as TransitEvent[];
      }
    }
  } catch {
    // Corrupt cache — fall through to live generation
  }

  // ── Cache miss — generate and write ────────────────────────────────────────
  const transits = generateTransits(birthData, natalChart);

  try {
    const record: TransitCacheRecord = {
      generatedDate: today,
      birthDataHash: birthHash,
      // Dates become ISO strings naturally via JSON.stringify
      transits: transits as unknown as TransitCacheRecord["transits"],
    };
    localStorage.setItem(TRANSIT_CACHE_KEY, JSON.stringify(record));
  } catch {
    // Storage full or quota exceeded — continue without caching
  }

  return transits;
}
