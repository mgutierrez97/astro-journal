// ─── House detail content ─────────────────────────────────────────────────────
//
// Placeholder implementations for all three content tiers of a house detail view.
// Each function accepts the exact arguments that will be forwarded to the AI when
// the interpretation layer is built. To wire in real content, replace each function
// body with an API call — no component changes required.

/**
 * House-level reading shown in the READING section.
 *
 * Future: AI call with houseNumber + full natal chart + journal context.
 */
export function getHouseReading(houseNumber: number): string {
  // houseNumber will parameterise the AI prompt
  void houseNumber;
  return (
    "This house carries more than its placements suggest at first look. " +
    "What is active here has been active for some time, shaping this domain " +
    "in ways that run beneath the surface. The planets present are worth " +
    "sitting with before moving on."
  );
}

/**
 * Per-planet note shown beneath each [Planet] in [Sign] heading in BODIES.
 *
 * Future: AI call with planetName + sign + houseNumber + natal chart context.
 */
export function getPlanetNote(
  planetName:  string,
  sign:        string,
  houseNumber: number,
): string {
  // All three args will parameterise the AI prompt
  void planetName;
  void sign;
  void houseNumber;
  return (
    "This placement locates the planet in a particular field of life. " +
    "Its sign describes the manner of expression. Its house describes the territory. " +
    "Together, they point toward where this energy tends to surface and how."
  );
}

/**
 * Per-aspect note shown beneath each aspect bullet in BODIES.
 *
 * Future: AI call with planetName + aspectType + targetPlanet + natal chart context.
 */
export function getAspectNote(
  planetName:   string,
  aspectType:   "conjunction" | "opposition" | "square",
  targetPlanet: string,
): string {
  // All three args will parameterise the AI prompt
  void planetName;
  void aspectType;
  void targetPlanet;
  return (
    "This aspect adds shape to the placement above. " +
    "The two bodies involved are in a relationship that neither fully controls. " +
    "What that asks of this placement is worth considering slowly."
  );
}
