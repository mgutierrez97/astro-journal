// Transit feed — scoring and filter logic
// All rendering concerns stay in TransitCard; this file is pure data logic.

import { type TransitEvent } from "@/components/cards/TransitCard";
import { type StoredBirthData } from "@/components/ui/BirthDataCard";

// ─── Public types ─────────────────────────────────────────────────────────────

export type TransitTier = "major" | "active" | "suppressed";

export interface ScoredTransit {
  transit:        TransitEvent;
  score:          number;
  tier:           TransitTier;
  isSpecialEvent: boolean;
}

// ─── Weight tables ────────────────────────────────────────────────────────────
//
// Planet weights (source: CLAUDE.md scoring model):
//   Tier 1 (generational outers): Pluto 5, Neptune 5, Uranus 5, Saturn 5
//   Tier 2 (social):               Jupiter 4, Mars 3
//   Tier 3 (personal):             Sun 2, Venus 2, Mercury 1, Moon 1
//
// For sky-to-sky transits we use max(planet, targetPlanet) so that e.g.
// Mercury conjunct Neptune scores as Neptune (5), not Mercury (1).

const PLANET_WEIGHT: Record<string, number> = {
  Sun:     2,
  Moon:    1,
  Mercury: 1,
  Venus:   2,
  Mars:    3,
  Jupiter: 4,
  Saturn:  5,
  Uranus:  5,
  Neptune: 5,
  Pluto:   5,
};

const ASPECT_WEIGHT: Partial<Record<TransitEvent["transitType"], number>> = {
  conjunction:        4,
  opposition:         4,
  square:             4,
  trine:              2,
  sextile:            1,
  ingress:            2,
  // Special event types carry no base aspect weight — they surface via override
  "station-retrograde":    0,
  "station-direct":        0,
  "eclipse-solar":         0,
  "eclipse-lunar":         0,
  "new-moon":              0,
  "full-moon":             0,
  "blood-moon":            0,
  "super-moon":            0,
  "blue-moon":             0,
  "harvest-moon":          0,
  "super-blue-blood-moon": 0,
};

const STATUS_WEIGHT: Record<TransitEvent["status"], number> = {
  active:      3,
  approaching: 2,
  separating:  0,
};

// ─── Tier 1 + 2 planets — used for ingress-as-special-event detection ─────────

const TIER_1_2 = new Set(["Saturn", "Uranus", "Neptune", "Pluto", "Jupiter", "Mars"]);

// ─── Special event detection ──────────────────────────────────────────────────
//
// Special events bypass the score threshold and always surface in the feed.
// Recognised types:
//   - Retrograde stations (start and end)
//   - Solar and lunar eclipses (including all named variants)
//   - New Moons and Full Moons (all named variants — Blood, Super, Blue, Harvest)
//   - Sign ingresses for Tier 1 or 2 planets

function detectSpecialEvent(transit: TransitEvent): boolean {
  const { transitType: tt, planet } = transit;

  if (tt === "station-retrograde" || tt === "station-direct")   return true;
  if (tt === "eclipse-solar"      || tt === "eclipse-lunar")    return true;
  if (tt === "new-moon"           || tt === "full-moon")        return true;
  if (tt === "blood-moon"         || tt === "super-moon")       return true;
  if (tt === "blue-moon"          || tt === "harvest-moon")     return true;
  if (tt === "super-blue-blood-moon")                           return true;

  // Sign ingress for Tier 1 or 2 planet
  if (tt === "ingress" && TIER_1_2.has(planet))                 return true;

  return false;
}

// ─── Core scoring function ────────────────────────────────────────────────────

export function scoreTransit(
  transit:   TransitEvent,
  birthData?: StoredBirthData,
): ScoredTransit {
  const isSpecialEvent = detectSpecialEvent(transit);

  // Planet score — max of both planets involved so outer-planet transits score
  // correctly regardless of which body is listed as primary
  const planetScore = Math.max(
    PLANET_WEIGHT[transit.planet]           ?? 1,
    PLANET_WEIGHT[transit.targetPlanet ?? ""] ?? 0,
  );

  const aspectScore = ASPECT_WEIGHT[transit.transitType] ?? 0;
  const statusScore = STATUS_WEIGHT[transit.status];

  let score = planetScore + aspectScore + statusScore;

  // Natal relevance bonus — keyed on the natal body being aspected (transit.targetPlanet)
  // Gate to outer/social transiting planets only — prevents personal planets flooding the feed
  // Bonus tiers per CLAUDE.md:
  //   natal Sun / Moon / ASC / MC   → +5
  //   natal Saturn / Venus / Mars   → +3
  //   natal Mercury / Jupiter       → +2
  //   natal Uranus / Neptune / Pluto → +1
  const NATAL_BONUS_PLANETS = new Set(["Jupiter", "Mars", "Saturn", "Uranus", "Neptune", "Pluto"]);
  const NATAL_TARGET_BONUS: Record<string, number> = {
    "natal Sun":     5,
    "natal Moon":    5,
    "natal ASC":     5,
    "natal MC":      5,
    "natal Saturn":  3,
    "natal Venus":   3,
    "natal Mars":    3,
    "natal Mercury": 2,
    "natal Jupiter": 2,
    "natal Uranus":  1,
    "natal Neptune": 1,
    "natal Pluto":   1,
  };
  if (birthData && NATAL_BONUS_PLANETS.has(transit.planet) && transit.targetPlanet) {
    const bonus = NATAL_TARGET_BONUS[transit.targetPlanet] ?? 0;
    score += bonus;
  }

  // Tier assignment
  // Major  ≥ 14 — green dot
  // Active 12–13 — amber dot
  // <12    — suppressed (unless special event override)
  let tier: TransitTier =
    score >= 14 ? "major" :
    score >= 12 ? "active" :
                  "suppressed";

  // Special event override — always surfaces, minimum Active tier
  if (isSpecialEvent && tier === "suppressed") {
    tier = "active";
  }

  return { transit, score, tier, isSpecialEvent };
}

// ─── Feed window filter ───────────────────────────────────────────────────────

const FEED_WINDOW_DAYS = 30;

/**
 * Given a raw transit list and optional birth data, returns only the transits
 * that should appear in the feed:
 *   - Peak date is today or within the next 30 days (no past events)
 *   - Tier is not "suppressed" (unless overridden by special event)
 * Results are sorted ascending by peak date.
 */
export function filterTransitsForFeed(
  transits:  TransitEvent[],
  birthData?: StoredBirthData,
): ScoredTransit[] {
  const now    = new Date();
  const cutoff = new Date(now.getTime() + FEED_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  return transits
    .filter((t) => t.peakDate >= now && t.peakDate <= cutoff)
    .map((t)    => scoreTransit(t, birthData))
    .filter((st) => st.tier !== "suppressed")
    .sort((a, b) => a.transit.peakDate.getTime() - b.transit.peakDate.getTime());
}
