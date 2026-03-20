// lib/transitDetail.ts
// Static lookup tables for the transit detail panel.
// Pure data — no API calls, no side effects.
//
// Three exported functions:
//   getBodyBlurb(bodyName)    → BODIES section, one clause per planet/node
//   getAspectBlurb(aspectType) → ASPECT section, one clause per aspect type
//   getCycleBlurb(cycleType)  → CYCLE section, one clause per lunar/solar event
//
// All lookups are case-insensitive.
// Returns null for any unrecognised key — never throws, never returns a fallback.

// ─── Key normalisation ────────────────────────────────────────────────────────
//
// Strips hyphens, underscores, and spaces, then lowercases.
// Allows callers to pass any of:
//   "North Node" | "north-node" | "NORTH NODE" | "northnode"
//   "eclipse-lunar" | "lunar eclipse" | "LUNAR ECLIPSE"
//   "station-retrograde" | "retrograde" | "RETROGRADE"

function normalize(key: string): string {
  return key.toLowerCase().replace(/[\s\-_]+/g, "");
}

// ─── Body blurbs ──────────────────────────────────────────────────────────────
// Locked copy — do not alter. Source: CLAUDE.md § Body blurbs.

const BODY_BLURB_MAP: Record<string, string> = {
  sun:       "Where your sense of self takes form. The light you move toward and the one you cast.",
  moon:      "Where the body keeps its memory. Instinct, pattern, the self that surfaces before thought.",
  mercury:   "Where perception finds its voice. The particular way you receive the world and give it back.",
  venus:     "Where desire knows its shape. What you are drawn toward, and what draws itself to you.",
  mars:      "Where drive lives in the body. The shape of your assertion, and how you meet resistance.",
  jupiter:   "Where expansion finds its invitation. The direction life keeps asking you to grow toward.",
  saturn:    "Where structure makes its demands. The slow, exacting work of becoming who you are.",
  uranus:    "Where the expected loses its hold. The fault line where something truer breaks through.",
  neptune:   "Where edges soften and dissolve. Longing, imagination, and what the visible world conceals.",
  pluto:     "Where transformation applies its pressure. What must be released for what is essential to remain.",
  chiron:    "Where the wound becomes the teacher. The place of greatest tenderness and deepest capacity.",
  northnode: "Where this life is asking you to arrive. The direction that feels unfamiliar and necessary.",
  southnode: "Where you already know the way. What comes without effort — and what may be ready to loosen.",
};

// ─── Aspect blurbs ────────────────────────────────────────────────────────────
// Locked copy — do not alter. Source: CLAUDE.md § Aspect blurbs.
//
// "station-retrograde" and "station-direct" are aliases of "retrograde"/"direct"
// so that callers passing a TransitEvent["transitType"] value hit the same blurb.

const _RETROGRADE_BLURB =
  "A planet turning its gaze inward. What it governs slows, reconsiders, asks to be revisited. Less a reversal than a deepening.";

const _DIRECT_BLURB =
  "A planet resuming its forward motion. What was held in review begins to move again. What surfaced is ready to be integrated.";

const ASPECT_BLURB_MAP: Record<string, string> = {
  conjunction:       "Two forces occupying the same point. Their themes become inseparable. Amplified, fused. You cannot address one without meeting the other.",
  opposition:        "Two forces across an axis, each made visible by the other. What one holds, the other challenges. The tension asks for integration. Not resolution.",
  square:            "Two forces at friction. Neither yields easily. The pressure is generative. Something is being forged here, if you're willing to work it.",
  trine:             "Two forces in natural harmony. What flows between them moves without resistance. An invitation that asks only to be received.",
  // "RETROGRADE" (display) and "station-retrograde" (transitType) — same blurb
  retrograde:        _RETROGRADE_BLURB,
  stationretrograde: _RETROGRADE_BLURB,
  // "DIRECT" (display) and "station-direct" (transitType) — same blurb
  direct:            _DIRECT_BLURB,
  stationdirect:     _DIRECT_BLURB,
  ingress:           "A planet crossing a threshold. The tone of what it governs shifts. Subtly at first. Then undeniably.",
};

// ─── Cycle blurbs ─────────────────────────────────────────────────────────────
// Locked copy — do not alter. Source: CLAUDE.md § Cycle blurbs.
//
// CLAUDE.md uses display names ("LUNAR ECLIPSE", "SOLAR ECLIPSE").
// TransitEvent["transitType"] uses inverted forms ("eclipse-lunar", "eclipse-solar").
// Both orderings are stored so any caller convention resolves correctly.

const _LUNAR_ECLIPSE_BLURB =
  "A Full Moon held under pressure. The shadow reveals what ordinary light conceals. What is ending now has been ending for some time.";

const _SOLAR_ECLIPSE_BLURB =
  "A New Moon with force behind it. The reset arriving now is not subtle. Something is clearing so that something truer can take root.";

const CYCLE_BLURB_MAP: Record<string, string> = {
  newmoon:           "The cycle returns to darkness. What wants to begin here has not yet taken form. The quietest moment carries the most potential.",
  fullmoon:          "What was seeded has reached its fullness. Something becomes visible now that could not be seen before. A peak. A release. Often both.",
  supermoon:         "A Full Moon closer to Earth than usual. What it illuminates feels nearer too. The emotional pull is amplified. Hard to look away.",
  bluemoon:          "A second Full Moon within the same month. Something that doesn't usually get a second look. An invitation to finish what the first one started.",
  harvestmoon:       "The Full Moon that rises nearest the autumn equinox. Light that lingers past dark. What has been cultivated through the year is ready to be gathered.",
  bloodmoon:         "A total lunar eclipse. The Moon moves through Earth's shadow and emerges changed. Something completing now carries real weight. What you've been carrying may be ready to set down.",
  // "LUNAR ECLIPSE" (display) and "eclipse-lunar" (transitType) — same blurb
  lunareclipse:      _LUNAR_ECLIPSE_BLURB,
  eclipselunar:      _LUNAR_ECLIPSE_BLURB,
  // "SOLAR ECLIPSE" (display) and "eclipse-solar" (transitType) — same blurb
  solareclipse:      _SOLAR_ECLIPSE_BLURB,
  eclipsesolar:      _SOLAR_ECLIPSE_BLURB,
  superbluebloodmoon: "Three cycles converging at once. Rare, and not accidental. Whatever this moment is asking of you, it has been patient.",
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the one-clause body blurb for a given planet or node name,
 * or null if the body is not in the table.
 *
 * Case-insensitive. Handles "North Node", "north-node", "NORTH NODE", etc.
 */
export function getBodyBlurb(bodyName: string): string | null {
  return BODY_BLURB_MAP[normalize(bodyName)] ?? null;
}

/**
 * Returns the one-clause aspect blurb for a given aspect type,
 * or null if the type is not in the table.
 *
 * Accepts both transitType values ("station-retrograde") and display names
 * ("RETROGRADE"). Case-insensitive.
 *
 * Note: "sextile" is not in the aspect blurb table — returns null by design.
 */
export function getAspectBlurb(aspectType: string): string | null {
  return ASPECT_BLURB_MAP[normalize(aspectType)] ?? null;
}

/**
 * Returns the one-clause cycle blurb for a given lunar/solar event type,
 * or null if the type is not in the table.
 *
 * Accepts both transitType values ("eclipse-lunar", "eclipse-solar") and
 * display names ("LUNAR ECLIPSE", "SOLAR ECLIPSE"). Case-insensitive.
 */
export function getCycleBlurb(cycleType: string): string | null {
  return CYCLE_BLURB_MAP[normalize(cycleType)] ?? null;
}
