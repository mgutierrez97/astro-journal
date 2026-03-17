// Astronomy Engine wrappers
// All planet position calculations go through this module.

import * as Astronomy from "astronomy-engine";

export type PlanetName =
  | "Mercury"
  | "Venus"
  | "Mars"
  | "Jupiter"
  | "Saturn"
  | "Uranus"
  | "Neptune"
  | "Pluto";

export const PLANETS: PlanetName[] = [
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
];

// Approximate mean orbital radii in AU (for visualization scaling)
export const ORBITAL_RADII: Record<string, number> = {
  Mercury: 0.387,
  Venus: 0.723,
  Earth: 1.0,
  Mars: 1.524,
  Jupiter: 5.203,
  Saturn: 9.537,
  Uranus: 19.19,
  Neptune: 30.07,
  Pluto: 39.48,
};

export interface PlanetPosition {
  name: string;
  /** Heliocentric ecliptic longitude in degrees (0–360) */
  longitude: number;
  /** Heliocentric ecliptic latitude in degrees */
  latitude: number;
  /** Distance from Sun in AU */
  distanceAU: number;
  /** Orbital radius used for visualization */
  orbitalRadius: number;
  /** x coordinate in normalized AU space */
  x: number;
  /** y coordinate in normalized AU space */
  y: number;
}

/**
 * Get real-time heliocentric ecliptic positions for all planets.
 * Returns x/y in AU centered on the Sun (top-down ecliptic view).
 */
export function getPlanetPositions(date: Date = new Date()): PlanetPosition[] {
  const time = Astronomy.MakeTime(date);
  const positions: PlanetPosition[] = [];

  for (const planet of PLANETS) {
    try {
      // Get heliocentric vector
      const vec = Astronomy.HelioVector(planet as Astronomy.Body, time);
      // Ecliptic longitude from heliocentric coords
      const ecl = Astronomy.GeoVector(planet as Astronomy.Body, time, true);
      const eclLon = Astronomy.EclipticLongitude(planet as Astronomy.Body, time);

      // Convert heliocentric ecliptic coords to top-down x/y
      // vec.x points to vernal equinox (0° ecliptic longitude)
      // vec.y points to 90° ecliptic longitude
      const distanceAU = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
      const x = vec.x;
      const y = vec.y; // top-down view: y is "up" on screen

      positions.push({
        name: planet,
        longitude: eclLon,
        latitude: 0,
        distanceAU,
        orbitalRadius: ORBITAL_RADII[planet] ?? distanceAU,
        x,
        y,
      });
    } catch {
      // Fallback to orbital-radius-based position using known longitude
      const orbRadius = ORBITAL_RADII[planet] ?? 1;
      const lon = (Date.now() / 1000 / (orbRadius * orbRadius * orbRadius * 365.25 * 24 * 3600)) % (2 * Math.PI);
      positions.push({
        name: planet,
        longitude: (lon * 180) / Math.PI,
        latitude: 0,
        distanceAU: orbRadius,
        orbitalRadius: orbRadius,
        x: orbRadius * Math.cos(lon),
        y: orbRadius * Math.sin(lon),
      });
    }
  }

  return positions;
}

export const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

/** Convert ecliptic longitude (degrees) to zodiac sign */
export function longitudeToSign(longitude: number): string {
  const index = Math.floor(((longitude % 360) + 360) % 360 / 30);
  return ZODIAC_SIGNS[index];
}

/** Convert ecliptic longitude to degree within sign (0–29) */
export function longitudeToDegree(longitude: number): number {
  return ((longitude % 360) + 360) % 360 % 30;
}
