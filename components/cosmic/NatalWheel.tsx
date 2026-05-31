"use client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NatalWheelProps {
  houses?: {
    number: number;     // 1–12
    cuspDegree: number; // ecliptic degree 0–360
    sign: string;       // e.g. "Sagittarius"
    domainWord: string; // e.g. "Self"
  }[];
  planets?: {
    name: string;
    degree: number;        // ecliptic degree 0–360
    isRetrograde: boolean;
  }[];
  aspects?: {
    bodyA: string;
    bodyB: string;
    type: 'conjunction' | 'opposition' | 'square' | 'trine' | 'sextile';
  }[];
  activeHouse?: number;                   // 1–12 — full gold highlight
  hoveredHouse?: number;                  // 1–12 — subtle gold hover
  activeConfigurationPlanets?: string[];  // planet names — full gold
  hoveredConfigurationPlanets?: string[]; // planet names — dim gold on hover
  size?: number;                          // SVG width/height px, default 360
}

// ─── Planet symbol lookup ─────────────────────────────────────────────────────

const PLANET_SYMBOLS: Record<string, string> = {
  Sun:       "☉",
  Moon:      "☽",
  Mercury:   "☿",
  Venus:     "♀",
  Mars:      "♂",
  Jupiter:   "♃",
  Saturn:    "♄",
  Uranus:    "♅",
  Neptune:   "♆",
  Pluto:     "♇",
  Chiron:    "⚷",
  Lilith:    "⚸",
  Midheaven: "MC",
  NorthNode: "☊",
  SouthNode: "☋",
  Ascendant: "↑",
};

// ─── Mock data ────────────────────────────────────────────────────────────────
// Hardcoded for isolated visual testing. Replaced by real Placidus output later.

const mockHouses = [
  { number: 1,  cuspDegree: 240, sign: "Sagittarius", domainWord: "Self"           },
  { number: 2,  cuspDegree: 270, sign: "Capricorn",   domainWord: "Worth"          },
  { number: 3,  cuspDegree: 300, sign: "Aquarius",    domainWord: "Mind"           },
  { number: 4,  cuspDegree: 330, sign: "Pisces",      domainWord: "Home"           },
  { number: 5,  cuspDegree: 15,  sign: "Aries",       domainWord: "Creativity"     },
  { number: 6,  cuspDegree: 50,  sign: "Taurus",      domainWord: "Routines"       },
  { number: 7,  cuspDegree: 60,  sign: "Gemini",      domainWord: "Relationships"  },
  { number: 8,  cuspDegree: 90,  sign: "Cancer",      domainWord: "Transformation" },
  { number: 9,  cuspDegree: 120, sign: "Leo",         domainWord: "Expansion"      },
  { number: 10, cuspDegree: 150, sign: "Virgo",       domainWord: "Vocation"       },
  { number: 11, cuspDegree: 180, sign: "Libra",       domainWord: "Community"      },
  { number: 12, cuspDegree: 210, sign: "Scorpio",     domainWord: "Solitude"       },
];

const mockPlanets = [
  { name: "Sun",     degree: 97,  isRetrograde: false },
  { name: "Moon",    degree: 9,   isRetrograde: false },
  { name: "Mercury", degree: 90,  isRetrograde: false },
  { name: "Venus",   degree: 124, isRetrograde: false },
  { name: "Mars",    degree: 186, isRetrograde: false },
  { name: "Jupiter", degree: 317, isRetrograde: false },
  { name: "Saturn",  degree: 11,  isRetrograde: false },
  { name: "Uranus",  degree: 309, isRetrograde: true  },
  { name: "Neptune", degree: 299, isRetrograde: true  },
  { name: "Pluto",   degree: 244, isRetrograde: true  },
];

const mockAspects = [
  { bodyA: "Sun",     bodyB: "Saturn",  type: "conjunction" as const },
  { bodyA: "Moon",    bodyB: "Saturn",  type: "conjunction" as const },
  { bodyA: "Mars",    bodyB: "Neptune", type: "trine"       as const },
  { bodyA: "Venus",   bodyB: "Pluto",   type: "opposition"  as const },
  { bodyA: "Mercury", bodyB: "Mars",    type: "square"      as const },
  { bodyA: "Jupiter", bodyB: "Uranus",  type: "sextile"     as const },
];

// ─── Zodiac constants ─────────────────────────────────────────────────────────
// Signs in ecliptic order, Aries = 0°, each spanning 30°.

const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

// ─── Geometry helpers ─────────────────────────────────────────────────────────

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Convert an ecliptic longitude to an SVG screen angle (degrees).
 *
 * Convention:
 *   - ASC (ascDeg) lands at screen angle 180° = 9 o'clock.
 *   - Ecliptic degrees increase counterclockwise on the celestial sphere,
 *     which maps to clockwise on screen when ASC is pinned at 9 o'clock.
 *   - Formula: screenAngle = 180 − (ecliptic − asc)
 */
function eclToScreen(ecliptic: number, asc: number): number {
  return 180 - (ecliptic - asc);
}

/** Cartesian (x, y) on a circle of radius r at a given SVG screen angle. */
function pt(screenDeg: number, r: number, cx: number, cy: number) {
  const rad = toRad(screenDeg);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/**
 * SVG path for an annular sector spanning startEcl → endEcl (ecliptic degrees).
 *
 * Outer arc uses sweep=0 (counterclockwise in SVG, which is clockwise visually
 * on screen because SVG y-axis is inverted). Inner arc uses sweep=1 to close
 * the shape back to the start.
 *
 * large-arc-flag is 1 only if the ecliptic span exceeds 180° (rare in Placidus).
 */
function sectorPath(
  startEcl: number,
  endEcl:   number,
  asc:      number,
  outerR:   number,
  innerR:   number,
  cx:       number,
  cy:       number,
): string {
  // Ecliptic span — always positive
  let span = endEcl - startEcl;
  if (span <= 0) span += 360;
  const largeArc = span > 180 ? 1 : 0;

  const sa = eclToScreen(startEcl, asc); // screen angle at start cusp
  const ea = eclToScreen(endEcl,   asc); // screen angle at end cusp

  const oA = pt(sa, outerR, cx, cy); // outer arc start
  const oB = pt(ea, outerR, cx, cy); // outer arc end
  const iA = pt(sa, innerR, cx, cy); // inner arc start
  const iB = pt(ea, innerR, cx, cy); // inner arc end

  const f = (n: number) => n.toFixed(3);

  return [
    `M ${f(oA.x)} ${f(oA.y)}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${f(oB.x)} ${f(oB.y)}`, // outer arc, sweep=0
    `L ${f(iB.x)} ${f(iB.y)}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${f(iA.x)} ${f(iA.y)}`, // inner arc, sweep=1
    "Z",
  ].join(" ");
}


// ─── Aspect style map ─────────────────────────────────────────────────────────

const ASPECT_STYLES = {
  conjunction: { stroke: "rgba(255,255,255,0.70)", strokeWidth: 1,   strokeDasharray: "4 4"     },
  opposition:  { stroke: "#CC4444",                strokeWidth: 1,   strokeDasharray: undefined },
  square:      { stroke: "rgba(255,255,255,0.55)", strokeWidth: 1,   strokeDasharray: undefined },
  trine:       { stroke: "rgba(62,180,137,0.4)",   strokeWidth: 1,   strokeDasharray: "4 4"     },
  sextile:     { stroke: "rgba(139,144,156,0.35)", strokeWidth: 1,   strokeDasharray: "2 4"     },
} as const;


// ─── Component ────────────────────────────────────────────────────────────────

export default function NatalWheel({
  houses = mockHouses,
  planets = mockPlanets,
  aspects = mockAspects,
  activeHouse,
  hoveredHouse,
  activeConfigurationPlanets,
  hoveredConfigurationPlanets,
  size = 360,
}: NatalWheelProps) {
  const cx = size / 2;
  const cy = size / 2;

  // Radii — proportional to size
  const outerR      = cx * 0.95; // outer edge of house ring
  const houseInnerR = cx * 0.72; // inner edge of house ring / outer edge of sign ring
  const signInnerR  = cx * 0.55; // inner edge of sign ring
  const centerR     = cx * 0.54; // center circle (slight gap from signInnerR is intentional)

  // Sort by house number to guarantee H1 → H12 ordering
  const sorted = [...houses].sort((a, b) => a.number - b.number);
  const asc    = sorted[0]?.cuspDegree ?? 0; // H1 cusp = Ascendant

  // Planet ring — inside the center circle, clear of sign labels
  const planetRingR = signInnerR * 0.92;

  // Sort planets by ecliptic degree for deterministic angular spreading
  const activePlanets = [...(planets ?? [])].sort((a, b) => a.degree - b.degree);

  // Planets that fall within the active house's ecliptic range (for gold highlight)
  const planetsInActiveHouse = new Set<string>();
  if (activeHouse !== undefined && sorted.length === 12) {
    const hi = sorted.findIndex((h) => h.number === activeHouse);
    if (hi >= 0) {
      const startEcl = sorted[hi].cuspDegree;
      const endEcl   = sorted[(hi + 1) % 12].cuspDegree;
      for (const p of activePlanets) {
        const deg     = ((p.degree % 360) + 360) % 360;
        const inRange = endEcl > startEcl
          ? deg >= startEcl && deg < endEcl
          : deg >= startEcl || deg < endEcl; // wraps through 0°
        if (inRange) planetsInActiveHouse.add(p.name);
      }
    }
  }

  // Place each planet on planetRingR with minimum 8° angular spacing.
  // If a planet falls within 8° (screen angle) of the previous placed planet,
  // it is nudged to prevAngle + 8° instead of its true position.
  const placedPlanets: { name: string; pos: { x: number; y: number }; sym: string }[] = [];
  let prevScreenAngle: number | null = null;
  for (const planet of activePlanets) {
    const sym = PLANET_SYMBOLS[planet.name] ?? planet.name.slice(0, 2);
    let screenAngle = eclToScreen(planet.degree, asc);
    if (prevScreenAngle !== null) {
      // Compute signed angular difference (screen angles increase clockwise)
      let diff = screenAngle - prevScreenAngle;
      // Normalise to (-360, 360) then collapse to nearest equivalent
      diff = ((diff % 360) + 360) % 360;
      if (diff > 180) diff -= 360; // now in (-180, 180]
      if (Math.abs(diff) < 8) {
        screenAngle = prevScreenAngle + (diff >= 0 ? 8 : -8);
      }
    }
    prevScreenAngle = screenAngle;
    placedPlanets.push({ name: planet.name, pos: pt(screenAngle, planetRingR, cx, cy), sym });
  }

  // Index by name so aspect lines can look up both endpoints by planet name
  const planetDotMap = new Map<string, { x: number; y: number }>();
  placedPlanets.forEach((p) => planetDotMap.set(p.name, p.pos));

  const activeAspects = aspects ?? [];

  // Collect planet names that are endpoints of a displayed aspect line
  const planetsInDisplayedAspects = new Set<string>();
  for (const aspect of activeAspects) {
    planetsInDisplayedAspects.add(aspect.bodyA);
    planetsInDisplayedAspects.add(aspect.bodyB);
  }

  /** Ecliptic degree where the next house starts (wraps H12 → H1). */
  const nextCusp = (i: number) => sorted[(i + 1) % 12].cuspDegree;

  /** Ecliptic angular span of house i (always positive). */
  const eclSpan = (i: number) => {
    let span = nextCusp(i) - sorted[i].cuspDegree;
    if (span <= 0) span += 360;
    return span;
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block", overflow: "visible" }}
    >
      {/* ── Ring 1: Houses ─────────────────────────────────────────────────────
          12 Placidus segments — unequal spans follow real cusp degrees.
          ASC (H1) sits at exactly 9 o'clock. Houses run clockwise on screen.
      ─────────────────────────────────────────────────────────────────────── */}
      {sorted.map((house, i) => {
        const startEcl = house.cuspDegree;
        const endEcl   = nextCusp(i);
        const span     = eclSpan(i);

        const isActive  = activeHouse === house.number;
        const isHovered = !isActive && hoveredHouse === house.number;
        const fill   = isActive  ? "rgba(200,169,110,0.08)"
                     : isHovered ? "rgba(200,169,110,0.08)"
                     : "rgba(255,255,255,0.04)";
        const stroke = isActive  ? "rgba(200,169,110,0.40)"
                     : isHovered ? "rgba(200,169,110,0.25)"
                     : "rgba(255,255,255,0.08)";

        // Midpoint ecliptic angle for label — normalise to [0, 360)
        const midEcl           = ((startEcl + span / 2) % 360 + 360) % 360;
        const midScreen        = eclToScreen(midEcl, asc);
        const labelR           = (outerR + houseInnerR) / 2;
        const { x: lx, y: ly } = pt(midScreen, labelR, cx, cy);

        return (
          <g key={`house-${house.number}`}>
            <path
              d={sectorPath(startEcl, endEcl, asc, outerR, houseInnerR, cx, cy)}
              fill={fill}
              stroke={stroke}
              strokeWidth={isActive ? 0.8 : 0.5}
            />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={9}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight={isActive ? "bold" : undefined}
              fill={isActive ? "#C8A96E" : "#8B909C"}
            >
              {`H${house.number}`}
            </text>
          </g>
        );
      })}

      {/* ── Ring 2: Signs ──────────────────────────────────────────────────────
          12 equal 30° segments anchored to the same ecliptic origin as the
          house ring. Sagittarius (240°) aligns with 9 o'clock for this chart.
      ─────────────────────────────────────────────────────────────────────── */}
      {SIGN_NAMES.map((sign, i) => {
        const startEcl         = i * 30;
        const midEcl           = startEcl + 15;
        const midScreen        = eclToScreen(midEcl, asc);
        const labelR           = (houseInnerR + signInnerR) / 2;
        const { x: lx, y: ly } = pt(midScreen, labelR, cx, cy);

        return (
          <g key={`sign-${sign}`}>
            <path
              d={sectorPath(startEcl, startEcl + 30, asc, houseInnerR, signInnerR, cx, cy)}
              fill="rgba(255,255,255,0.02)"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={0.5}
            />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={8}
              fontFamily="system-ui, -apple-system, sans-serif"
              fill="#4A5060"
            >
              {sign}
            </text>
          </g>
        );
      })}

      {/* ── Center circle ────────────────────────────────────────────────────── */}
      <circle
        cx={cx}
        cy={cy}
        r={centerR}
        fill="rgba(255,255,255,0.02)"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={0.5}
      />

      {/* ── Aspect lines ───────────────────────────────────────────────────────
          Rendered before planet dots so lines sit behind the glyphs.
          Each line connects the two planet dot positions looked up by name.
      ─────────────────────────────────────────────────────────────────────── */}
      {activeAspects.map((aspect, i) => {
        const posA = planetDotMap.get(aspect.bodyA);
        const posB = planetDotMap.get(aspect.bodyB);
        if (!posA || !posB) return null;
        const s = ASPECT_STYLES[aspect.type];
        return (
          <line
            key={`aspect-${i}`}
            x1={posA.x}
            y1={posA.y}
            x2={posB.x}
            y2={posB.y}
            stroke={s.stroke}
            strokeWidth={s.strokeWidth}
            strokeDasharray={s.strokeDasharray}
          />
        );
      })}

      {/* ── Planets ────────────────────────────────────────────────────────────
          Symbol glyphs sit just inside the sign ring.
          Planets within 12° of an earlier planet are offset 16px toward center.
      ─────────────────────────────────────────────────────────────────────── */}
      {placedPlanets.map((planet) => {
        const inHouse   = planetsInActiveHouse.has(planet.name);
        const inAspect  = planetsInDisplayedAspects.has(planet.name);
        const dimmed    = activeHouse !== undefined && !inHouse && !inAspect;
        return (
          <text
            key={`planet-${planet.name}`}
            x={planet.pos.x}
            y={planet.pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fontFamily="system-ui, -apple-system, sans-serif"
            opacity={dimmed ? 0.15 : 1}
            fill={
              activeConfigurationPlanets?.includes(planet.name)  ? "#C8A96E" :
              inHouse                                             ? "#C8A96E" :
              hoveredConfigurationPlanets?.includes(planet.name) ? "rgba(200,169,110,0.6)" :
              "#E2E4EA"
            }
          >
            {planet.sym}
          </text>
        );
      })}

      {/* ── Outer border — clean cap on outermost radius ────────────────────── */}
      <circle
        cx={cx}
        cy={cy}
        r={outerR}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={0.5}
      />
    </svg>
  );
}
