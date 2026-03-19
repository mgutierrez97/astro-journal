// lib/transitCopy.ts
//
// Pure lookup + template logic for transit card descriptions.
// Accepts a TransitEvent-compatible object — no SkyEvent dependency, no circular import.
// No external API calls. No Anthropic imports.
// Export: getTransitDescription(event, houseNumber?) → string | null

import { getPlanetLongitude } from "./transitGenerator";
import { longitudeToSign }    from "./astronomy";

// ─── Minimal event shape ──────────────────────────────────────────────────────
// Subset of TransitEvent — only what description logic requires.
// Compatible with the full TransitEvent type; import stays one-directional.

interface TransitEventLike {
  planet:        string;
  targetPlanet?: string;
  transitType:   string;
  peakDate:      Date;
}

// ─── House domains ────────────────────────────────────────────────────────────

const HOUSE_DOMAINS: Record<number, string> = {
  1:  "self",
  2:  "worth",
  3:  "communication",
  4:  "home",
  5:  "creativity",
  6:  "routines",
  7:  "relationships",
  8:  "transformation",
  9:  "expansion",
  10: "vocation",
  11: "community",
  12: "solitude",
};

// ─── Sign themes ──────────────────────────────────────────────────────────────

const SIGN_THEMES: Record<string, string> = {
  Aries:       "initiation",
  Taurus:      "stability",
  Gemini:      "curiosity",
  Cancer:      "nurturing",
  Leo:         "visibility",
  Virgo:       "discernment",
  Libra:       "balance",
  Scorpio:     "depth",
  Sagittarius: "vision",
  Capricorn:   "discipline",
  Aquarius:    "detachment",
  Pisces:      "dissolution",
};

// ─── Planetary pair descriptions for natal transits ───────────────────────────
//
// Key format: "transitingplanet_aspect_natalplanet"
// All lowercase, spaces → underscores. Aspects: conjunction, opposition, square.

const PAIR_DESCRIPTIONS: Record<string, string> = {

  // ── Conjunction ──────────────────────────────────────────────────────────────
  saturn_conjunction_sun:     "Identity meets structure. A reckoning with who you're becoming under pressure.",
  saturn_conjunction_moon:    "Emotional foundations under audit. What needs to be built rather than felt.",
  saturn_conjunction_mars:    "Drive meets discipline. Effort is required — shortcuts won't hold.",
  saturn_conjunction_venus:   "Desire meets limitation. What you value is being tested for durability.",
  saturn_conjunction_mercury: "Thought meets restraint. Precision matters more than speed right now.",
  saturn_conjunction_jupiter: "Expansion meets contraction. Growth that requires a solid plan.",

  pluto_conjunction_sun:     "Identity in transformation. Something old about who you are is ending.",
  pluto_conjunction_moon:    "The emotional underworld surfaces. Old wounds ready for permanent change.",
  pluto_conjunction_mars:    "Drive amplified to an extreme. Power, obsession, or profound will.",
  pluto_conjunction_venus:   "Deep reconstruction of love and worth. What you desire is transforming.",
  pluto_conjunction_mercury: "Thought goes underground. Mental obsession or piercing insight.",
  pluto_conjunction_uranus:  "Disruption meets transformation. The structures you rebelled against are dissolving.",

  neptune_conjunction_sun:  "Identity under dissolution. Who you are feels less fixed — that's the point.",
  neptune_conjunction_moon: "Emotional boundaries thin. Intuition rises; so does confusion.",
  neptune_conjunction_mars: "Drive meets fog. Motivation may feel elusive or spiritually redirected.",

  uranus_conjunction_sun:  "Identity cracked open. An urge toward freedom that can't be reasoned away.",
  uranus_conjunction_moon: "Emotional patterns disrupted. Instability that leads somewhere new.",

  jupiter_conjunction_sun:  "Expansion of self. Confidence, opportunity, and a wider sense of what's possible.",
  jupiter_conjunction_moon: "Emotional abundance. Generosity, warmth, and inner growth.",

  // ── Opposition ───────────────────────────────────────────────────────────────
  saturn_opposition_sun:   "External pressure on self-expression. A test of how solidly you stand in yourself.",
  saturn_opposition_moon:  "Emotional needs in tension with responsibility. Something has to give.",
  saturn_opposition_mars:  "Drive meets resistance. Frustration that demands disciplined effort.",
  saturn_opposition_venus: "Relationships or finances under strain. Durability is being tested.",

  neptune_opposition_mars: "Motivation under fog. Direction may feel elusive or spiritually redirected.",
  neptune_opposition_sun:  "Identity in flux. What you thought was solid is dissolving at the edges.",

  pluto_opposition_sun:  "Power struggle with the self. Transformation through confrontation.",
  pluto_opposition_moon: "Deep emotional pressure. What's been buried is asking to be seen.",

  uranus_opposition_sun: "Restlessness meets identity. A need for freedom that disrupts the familiar.",

  jupiter_opposition_saturn: "Expansion in tension with caution. The question of how much is enough.",

  // ── Square ───────────────────────────────────────────────────────────────────
  saturn_square_sun:  "Identity under pressure. Structural challenge that demands integrity.",
  saturn_square_moon: "Emotional restriction. What you feel and what's expected are at odds.",
  saturn_square_mars: "Blocked momentum. Effort without immediate reward — patience as practice.",

  pluto_square_sun:  "Forced transformation of identity. Resistance intensifies the pressure.",
  pluto_square_moon: "Emotional excavation. What you've avoided is surfacing.",
  pluto_square_mars: "Intensity around will and action. Power dynamics, obsession, or radical drive.",

  uranus_square_sun: "Disruption to the known self. Change that feels demanded, not chosen.",

  neptune_square_mars: "Action without clear direction. Inspiration or dissolution — often both.",
};

// ─── Sky-to-sky planetary pair descriptions ───────────────────────────────────
//
// Keyed both ways (slower_aspect_faster and faster_aspect_slower) so that
// whichever body skyEventToTransit assigns as primary, the lookup resolves.

const SKY_PAIR_DESCRIPTIONS: Record<string, string> = {
  // Saturn pairs
  saturn_conjunction_neptune: "Structure meets dissolution. Form and formlessness in tension.",
  neptune_conjunction_saturn: "Structure meets dissolution. Form and formlessness in tension.",

  saturn_conjunction_uranus:  "Discipline meets disruption. Old order and radical change collide.",
  uranus_conjunction_saturn:  "Discipline meets disruption. Old order and radical change collide.",

  saturn_conjunction_pluto:   "Contraction meets transformation. Pressure that reshapes foundations.",
  pluto_conjunction_saturn:   "Contraction meets transformation. Pressure that reshapes foundations.",

  saturn_opposition_neptune:  "Reality in tension with illusion. Grounding what dissolves.",
  neptune_opposition_saturn:  "Reality in tension with illusion. Grounding what dissolves.",

  saturn_opposition_uranus:   "Stability opposed by revolution. What must change versus what must hold.",
  uranus_opposition_saturn:   "Stability opposed by revolution. What must change versus what must hold.",

  saturn_opposition_pluto:    "Endurance under transformation. Power restructures what was solid.",
  pluto_opposition_saturn:    "Endurance under transformation. Power restructures what was solid.",

  saturn_square_neptune:      "Structure eroded by confusion. Discipline required to navigate fog.",
  neptune_square_saturn:      "Structure eroded by confusion. Discipline required to navigate fog.",

  saturn_square_uranus:       "Rules in friction with freedom. Breakthrough or breakdown.",
  uranus_square_saturn:       "Rules in friction with freedom. Breakthrough or breakdown.",

  saturn_square_pluto:        "Pressure from all sides. Transformation through constraint.",
  pluto_square_saturn:        "Pressure from all sides. Transformation through constraint.",

  // Jupiter pairs
  jupiter_conjunction_neptune: "Expansion meets boundlessness. Vision amplified — discernment needed.",
  neptune_conjunction_jupiter: "Expansion meets boundlessness. Vision amplified — discernment needed.",

  jupiter_conjunction_uranus:  "Growth meets liberation. Sudden expansion or unexpected opportunity.",
  uranus_conjunction_jupiter:  "Growth meets liberation. Sudden expansion or unexpected opportunity.",

  jupiter_conjunction_pluto:   "Ambition amplified. Power, growth, and consequence in one movement.",
  pluto_conjunction_jupiter:   "Ambition amplified. Power, growth, and consequence in one movement.",

  jupiter_opposition_saturn:   "Expansion in tension with caution. How much is enough?",
  saturn_opposition_jupiter:   "Expansion in tension with caution. How much is enough?",

  jupiter_square_saturn:       "Growth constrained by limits. Effort required to expand.",
  saturn_square_jupiter:       "Growth constrained by limits. Effort required to expand.",

  // Sun pairs
  sun_conjunction_neptune:     "Clarity dissolves. Intuition rises where certainty once stood.",
  neptune_conjunction_sun:     "Clarity dissolves. Intuition rises where certainty once stood.",

  sun_conjunction_uranus:      "The expected disrupted. A jolt toward something truer.",
  uranus_conjunction_sun:      "The expected disrupted. A jolt toward something truer.",

  sun_conjunction_pluto:       "Light enters the underworld. What's hidden becomes undeniable.",
  pluto_conjunction_sun:       "Light enters the underworld. What's hidden becomes undeniable.",

  // Mars pairs
  mars_conjunction_saturn:     "Drive meets the wall. Patience or frustration — the effort is real either way.",
  saturn_conjunction_mars:     "Drive meets the wall. Patience or frustration — the effort is real either way.",

  mars_conjunction_pluto:      "Will amplified to intensity. Power, obsession, or unstoppable drive.",
  pluto_conjunction_mars:      "Will amplified to intensity. Power, obsession, or unstoppable drive.",

  mars_conjunction_uranus:     "Impulsive force meets electric charge. Action without warning.",
  uranus_conjunction_mars:     "Impulsive force meets electric charge. Action without warning.",

  mars_opposition_saturn:      "Momentum blocked. Disciplined effort is the only way through.",
  saturn_opposition_mars:      "Momentum blocked. Disciplined effort is the only way through.",

  mars_opposition_pluto:       "Will confronts power. The stakes are higher than they appear.",
  pluto_opposition_mars:       "Will confronts power. The stakes are higher than they appear.",

  mars_square_saturn:          "Effort under constraint. The resistance is showing you where to focus.",
  saturn_square_mars:          "Effort under constraint. The resistance is showing you where to focus.",

  mars_square_pluto:           "Drive meets depth. Raw intensity that demands conscious direction.",
  pluto_square_mars:           "Drive meets depth. Raw intensity that demands conscious direction.",

  mars_square_uranus:          "Volatile energy. Act with awareness — this moves fast.",
  uranus_square_mars:          "Volatile energy. Act with awareness — this moves fast.",
};

// ─── Planet weight — identifies the slower body in a sky-to-sky pair ──────────

const PLANET_WEIGHT: Record<string, number> = {
  Pluto:   10,
  Neptune:  9,
  Uranus:   8,
  Saturn:   7,
  Jupiter:  6,
  Mars:     5,
  Sun:      4,
  Venus:    3,
  Mercury:  2,
  Moon:     1,
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Compute the zodiac sign of `planet` at `date`. Returns null on failure. */
function signAt(planet: string, date: Date): string | null {
  try {
    return longitudeToSign(getPlanetLongitude(planet, date));
  } catch {
    return null;
  }
}

/** Look up the thematic keyword for a zodiac sign. Returns null if unknown. */
function theme(sign: string | null | undefined): string | null {
  if (!sign) return null;
  return SIGN_THEMES[sign] ?? null;
}

/** Look up the house domain label. Returns null if no house or out of range. */
function domain(house: number | undefined): string | null {
  if (house == null) return null;
  return HOUSE_DOMAINS[house] ?? null;
}

/** Capitalises the first character of a string. */
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * For a natal transit, returns { transiting, natal } regardless of which pole
 * skyEventToTransit assigned as primary. Handles the edge case where the natal
 * planet's weight exceeds the transiting planet's weight (rare but possible).
 * Returns null if neither planet is a natal point.
 */
function natalPair(
  event: TransitEventLike,
): { transiting: string; natal: string } | null {
  if (event.targetPlanet?.startsWith("natal ")) {
    return { transiting: event.planet, natal: event.targetPlanet.replace("natal ", "") };
  }
  if (event.planet.startsWith("natal ") && event.targetPlanet) {
    return { transiting: event.targetPlanet, natal: event.planet.replace("natal ", "") };
  }
  return null;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Returns a one- or two-sentence transit description for display in the feed
 * card, or null if the event type is unsupported or required data is missing.
 *
 * @param event       - A TransitEvent (or compatible subset). Pass the card's
 *                      event prop directly.
 * @param houseNumber - Placidus house the event falls in (1–12). Used in
 *                      template-driven events (lunations, stations, ingresses).
 *                      Pass event.house, or omit when birth data is unavailable.
 */
export function getTransitDescription(
  event:        TransitEventLike,
  houseNumber?: number,
): string | null {
  const { planet, targetPlanet, transitType, peakDate } = event;

  // ── Natal aspect (planet or targetPlanet is a "natal X" point) ───────────────
  const pair = natalPair(event);
  if (pair && (transitType === "conjunction" || transitType === "opposition" || transitType === "square")) {
    const key = [
      pair.transiting.toLowerCase(),
      transitType.toLowerCase(),
      pair.natal.toLowerCase(),
    ].join("_");

    const found = PAIR_DESCRIPTIONS[key];
    if (found) return found;

    // Fallback: sign of the transiting planet at peak.
    const t = theme(signAt(pair.transiting, peakDate));
    if (!t) return null;
    return `${pair.transiting} ${transitType} your natal ${pair.natal} — ${t} activates this placement.`;
  }

  // ── Sky-to-sky aspect ────────────────────────────────────────────────────────
  if (
    targetPlanet &&
    !targetPlanet.startsWith("natal ") &&
    (transitType === "conjunction" || transitType === "opposition" ||
     transitType === "square"      || transitType === "trine")
  ) {
    // Try both key orderings — skyEventToTransit may put either body first.
    const key1 = `${planet.toLowerCase()}_${transitType}_${targetPlanet.toLowerCase()}`;
    const key2 = `${targetPlanet.toLowerCase()}_${transitType}_${planet.toLowerCase()}`;
    return SKY_PAIR_DESCRIPTIONS[key1] ?? SKY_PAIR_DESCRIPTIONS[key2] ?? null;
  }

  // ── Sign ingress ─────────────────────────────────────────────────────────────
  if (transitType === "ingress") {
    // At the ingress moment, getPlanetLongitude gives the entry sign (0° of toSign).
    const sign = signAt(planet, peakDate);
    const t    = theme(sign);
    if (!t || !sign) return null;

    const d = domain(houseNumber);
    if (d) return `${planet} enters ${sign} in ${d}. ${cap(t)} becomes the tone of this domain.`;
    return `${planet} enters ${sign}. ${cap(t)} becomes the tone ahead.`;
  }

  // ── Station retrograde ───────────────────────────────────────────────────────
  if (transitType === "station-retrograde") {
    const t = theme(signAt(planet, peakDate));
    if (!t) return null;

    const d = domain(houseNumber);
    if (d) return `${planet} turns inward in ${d}. Review what ${t} has been trying to tell you.`;
    return `${planet} turns inward. Review what ${t} has been trying to tell you.`;
  }

  // ── Station direct ───────────────────────────────────────────────────────────
  if (transitType === "station-direct") {
    const t = theme(signAt(planet, peakDate));
    if (!t) return null;

    const d = domain(houseNumber);
    if (d) return `${planet} moves forward again in ${d}. Integrate what surfaced around ${t}.`;
    return `${planet} moves forward again. Integrate what surfaced around ${t}.`;
  }

  // ── New moon / solar eclipse — Sun defines the lunation degree ───────────────
  if (transitType === "new-moon" || transitType === "eclipse-solar") {
    const t = theme(signAt("Sun", peakDate));
    if (!t) return null;

    const d = domain(houseNumber);
    if (transitType === "eclipse-solar") {
      if (d) return `Accelerated reset in ${d}. Eclipse pressure amplifies what ${t} is asking of you.`;
      return `Accelerated reset. Eclipse pressure amplifies what ${t} is asking of you.`;
    }
    if (d) return `A threshold for new intentions in ${d}. ${cap(t)} shapes what wants to begin.`;
    return `A threshold for new intentions. ${cap(t)} shapes what wants to begin.`;
  }

  // ── Full moon / lunar eclipse — Moon is the illuminated point ────────────────
  if (transitType === "full-moon" || transitType === "eclipse-lunar") {
    const t = theme(signAt("Moon", peakDate));
    if (!t) return null;

    const d = domain(houseNumber);
    if (transitType === "eclipse-lunar") {
      if (d) return `Deep completion in ${d}. What you've outgrown in ${t} is ready to release.`;
      return `Deep completion. What you've outgrown in ${t} is ready to release.`;
    }
    if (d) return `Culmination or release in ${d}. What ${t} has been building reaches its peak.`;
    return `Culmination or release. What ${t} has been building reaches its peak.`;
  }

  return null;
}
