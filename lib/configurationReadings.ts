// ─── Configuration detail content ────────────────────────────────────────────
//
// getFigureBlurb returns final static copy (not placeholder).
// getConfigurationReading and getParticipantNote return placeholders —
// each function accepts the exact args that will forward to the AI.
// To wire in real content, replace each function body; components unchanged.

/**
 * Overall reading for a configuration pattern shown in the READING section.
 * Future: AI call with patternType + planets + focalPlanet + natal chart context.
 */
export function getConfigurationReading(
  patternType:  string,
  planets:      string[],
  focalPlanet?: string,
): string {
  void patternType;
  void planets;
  void focalPlanet;
  return (
    "This configuration describes a relationship between planets that cannot " +
    "be understood by looking at any one of them in isolation. The pattern " +
    "itself is the meaning. What it produces as a lived experience compounds " +
    "over time and tends to clarify slowly, through encounter rather than analysis."
  );
}

/**
 * Note for a participant group (one or two planets) within the BODIES section.
 * Future: AI call with planets + role + patternType + natal chart context.
 */
export function getParticipantNote(
  planets:     string[],
  role:        string,
  patternType: string,
): string {
  void planets;
  void role;
  void patternType;
  return (
    "The role these bodies play within this configuration is specific to " +
    "this geometry. What they contribute here is shaped by the pattern as " +
    "much as by their own nature. The meaning compounds when held in context " +
    "of the whole."
  );
}

// ─── Figure blurbs (final copy — not placeholder) ────────────────────────────

const FIGURE_BLURBS: Record<string, string> = {
  tSquare: (
    "Two planets in opposition, both squared by a third at the apex. " +
    "The opposing pair pulls in two directions simultaneously; the apex " +
    "planet is where that pressure collects and demands expression."
  ),
  stellium: (
    "Three or more planets gathered in the same sign or house. Their themes " +
    "compress into a single domain — inseparable, amplified, impossible to " +
    "address one at a time."
  ),
  grandTrine: (
    "Three planets in triangular harmony, each in trine to the others. " +
    "What flows between them moves without resistance. A current that wants " +
    "to be directed rather than simply received."
  ),
  grandCross: (
    "Four planets in two oppositions at right angles. The tension pulls in " +
    "all directions simultaneously. What integrates here is hard-won — and " +
    "tends to be durable."
  ),
  yod: (
    "Two planets in sextile, both in quincunx to a third at the apex. " +
    "The apex planet carries a persistent, redirected charge — repeatedly " +
    "called toward something it cannot fully reconcile."
  ),
  kite: (
    "A Grand Trine with an opposition introduced at one vertex. The harmony " +
    "now has a focal point. What flows easily in the trine is aimed outward " +
    "through the planet in opposition."
  ),
  mysticRectangle: (
    "Two oppositions connected by trines and sextiles. The tension of the " +
    "oppositions is held within a framework of harmony — difficult to ignore, " +
    "difficult to collapse. Resolution here is structural, not sudden."
  ),
};

/**
 * Static structural description for a configuration type shown in the FIGURE section.
 * This is final copy, not placeholder — it describes geometry, not meaning.
 */
export function getFigureBlurb(patternType: string): string {
  return (
    FIGURE_BLURBS[patternType] ??
    "A notable geometric relationship between planets in this chart. " +
    "The configuration creates a specific dynamic that operates across " +
    "the domains these planets occupy."
  );
}
