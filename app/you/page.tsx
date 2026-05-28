"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import NatalWheel from "@/components/cosmic/NatalWheel";
import GlassPanel from "@/components/ui/GlassPanel";
import CTAButton from "@/components/ui/CTAButton";
import BottomNav from "@/components/ui/BottomNav";
import BirthDataCard, {
  BIRTH_DATA_KEY,
  type StoredBirthData,
} from "@/components/ui/BirthDataCard";
import {
  calculateNatalChart,
  birthDataToDate,
  type NatalChart,
  type NatalPlanet,
} from "@/lib/natal";
import { longitudeToSign } from "@/lib/astronomy";
import { APP_NAME } from "@/lib/config";
import { detectConfigurations, type ChartConfiguration } from "@/lib/configurations";

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUSE_DOMAINS: Record<number, string> = {
  1:  "Self",            2:  "Worth",
  3:  "Mind",            4:  "Home",
  5:  "Creativity",      6:  "Routines",
  7:  "Relationships",   8:  "Transformation",
  9:  "Expansion",       10: "Vocation",
  11: "Community",       12: "Solitude",
};

const SECTION_LABEL: React.CSSProperties = {
  display:        "block",
  fontSize:       10,
  fontWeight:     500,
  letterSpacing:  "0.1em",
  textTransform:  "uppercase",
  color:          "#4A5060",
  marginBottom:   6,
};

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

// ─── Aspect calculation ───────────────────────────────────────────────────────

const ASPECT_ORBS: Record<string, number> = {
  conjunction: 8,
  opposition:  8,
  trine:       7,
  square:      7,
  sextile:     5,
};

function calculateNatalAspects(planets: { name: string; degree: number }[]): {
  bodyA: string;
  bodyB: string;
  type: "conjunction" | "opposition" | "square" | "trine" | "sextile";
}[] {
  const aspects = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i].degree;
      const b = planets[j].degree;
      let diff = Math.abs(a - b);
      if (diff > 180) diff = 360 - diff;

      if (Math.abs(diff - 0) <= ASPECT_ORBS.conjunction)
        aspects.push({ bodyA: planets[i].name, bodyB: planets[j].name, type: "conjunction" as const });
      else if (Math.abs(diff - 180) <= ASPECT_ORBS.opposition)
        aspects.push({ bodyA: planets[i].name, bodyB: planets[j].name, type: "opposition" as const });
      else if (Math.abs(diff - 120) <= ASPECT_ORBS.trine)
        aspects.push({ bodyA: planets[i].name, bodyB: planets[j].name, type: "trine" as const });
      else if (Math.abs(diff - 90) <= ASPECT_ORBS.square)
        aspects.push({ bodyA: planets[i].name, bodyB: planets[j].name, type: "square" as const });
      else if (Math.abs(diff - 60) <= ASPECT_ORBS.sextile)
        aspects.push({ bodyA: planets[i].name, bodyB: planets[j].name, type: "sextile" as const });
    }
  }
  return aspects;
}

// ─── Configuration aspect helper ─────────────────────────────────────────────

type WheelAspect = {
  bodyA: string;
  bodyB: string;
  type: "conjunction" | "opposition" | "square" | "trine" | "sextile";
};

function configToAspects(
  config: ChartConfiguration,
  planetDegreeMap: Map<string, number>,
): WheelAspect[] {
  const pts = config.planets
    .map((name) => ({ name, degree: planetDegreeMap.get(name) ?? -1 }))
    .filter((p) => p.degree >= 0);
  return calculateNatalAspects(pts);
}

// ─── ChevronRight ────────────────────────────────────────────────────────────

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M5 3L9 7L5 11" stroke="#4A5060" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── HouseCard ────────────────────────────────────────────────────────────────

interface HouseCardProps {
  n:            number;
  sign:         string;
  planets:      NatalPlanet[];
  isActive:     boolean;
  isHovered:    boolean;
  onTap:        () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  setRef:       (el: HTMLDivElement | null) => void;
}

function HouseCard({
  n, sign, planets, isActive, isHovered, onTap, onMouseEnter, onMouseLeave, setRef,
}: HouseCardProps) {
  return (
    // Wrapper fills full grid-cell height so cards in the same row stay equal height
    <div
      ref={setRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        display:       "flex",
        flexDirection: "column",
        background:    isHovered ? "rgba(255,255,255,0.02)" : "transparent",
        transition:    "background 200ms ease-out",
      }}
    >
      <GlassPanel
        active={isActive}
        onClick={onTap}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onTap()}
        style={{
          padding:      "14px 16px",
          cursor:       "pointer",
          borderRadius: 0,
          userSelect:   "none",
          flex:         1,   // stretch to fill wrapper height
        }}
      >
        {/* Row 1 — house number + domain + chevron */}
        <div
          style={{
            display:        "flex",
            justifyContent: "space-between",
            alignItems:     "center",
            marginBottom:   4,
          }}
        >
          <span
            style={{
              fontFamily: "EB Garamond, Georgia, serif",
              fontSize:   15,
              color:      "#E2E4EA",
            }}
          >
            <span style={{ color: "#8B909C" }}>H{n}</span>
            {"  "}
            {HOUSE_DOMAINS[n]}
          </span>
          <ChevronRight />
        </div>

        {/* Row 2 — planet symbols + names */}
        {planets.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {planets.map((p) => {
              const sym = PLANET_SYMBOLS[p.name] ?? p.name.slice(0, 2);
              return (
                <span
                  key={p.name}
                  style={{
                    fontSize:   11,
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    color:      "#8B909C",
                  }}
                >
                  <span style={{ color: "#C8A96E" }}>{sym}</span>
                  {" "}{p.name}
                </span>
              );
            })}
          </div>
        ) : (
          <span
            style={{
              fontSize:   12,
              color:      "#4A5060",
              fontFamily: "EB Garamond, Georgia, serif",
              fontStyle:  "italic",
            }}
          >
            No placements
          </span>
        )}
      </GlassPanel>
    </div>
  );
}

// ─── ExpandedDetail ───────────────────────────────────────────────────────────

interface ExpandedDetailProps {
  houseNum: number;
  sign:     string;
  planets:  NatalPlanet[];
  onBack:   () => void;
}

function ExpandedDetail({ houseNum, sign, planets, onBack }: ExpandedDetailProps) {
  return (
    <div style={{ padding: "20px 24px" }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          background:  "none",
          border:      "none",
          color:       "#8B909C",
          fontSize:    12,
          fontFamily:  "system-ui, -apple-system, sans-serif",
          cursor:      "pointer",
          padding:     0,
          marginBottom: 20,
          display:     "block",
        }}
      >
        ← Houses
      </button>

      {/* Title */}
      <div
        style={{
          fontFamily:   "EB Garamond, Georgia, serif",
          fontSize:     22,
          color:        "#E2E4EA",
          marginBottom: 4,
        }}
      >
        H{houseNum} · {HOUSE_DOMAINS[houseNum]}
      </div>
      <div
        style={{
          fontSize:     12,
          color:        "#8B909C",
          fontFamily:   "system-ui, -apple-system, sans-serif",
          marginBottom: 20,
        }}
      >
        {sign} rules this house
      </div>

      {/* Divider */}
      <div
        style={{
          borderBottom: "0.5px solid rgba(255,255,255,0.06)",
          marginBottom: 20,
        }}
      />

      {/* SIGN */}
      <div style={{ marginBottom: 20 }}>
        <span style={SECTION_LABEL}>Sign</span>
        <span
          style={{
            fontSize:   13,
            color:      "#E2E4EA",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {sign}
        </span>
      </div>

      {/* PLANETS */}
      <div style={{ marginBottom: 20 }}>
        <span style={SECTION_LABEL}>Planets</span>
        {planets.length > 0 ? (
          <span
            style={{
              fontSize:   13,
              color:      "#E2E4EA",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            {planets.map((p) => p.name).join(" · ")}
          </span>
        ) : (
          <span
            style={{
              fontSize:   13,
              color:      "#4A5060",
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontStyle:  "italic",
            }}
          >
            No placements
          </span>
        )}
      </div>

      {/* INTERPRETATION */}
      <div style={{ marginBottom: 28 }}>
        <span style={SECTION_LABEL}>Interpretation</span>
        <p
          style={{
            fontFamily: "EB Garamond, Georgia, serif",
            fontStyle:  "italic",
            fontSize:   15,
            color:      "#C8A96E",
            margin:     0,
            lineHeight: 1.6,
          }}
        >
          The interpretation for this house will appear here.
        </p>
      </div>

      {/* REFLECT */}
      <CTAButton
        variant="primary"
        style={{ width: "100%" }}
        onClick={() => console.log("reflect house", houseNum)}
      >
        Reflect
      </CTAButton>
    </div>
  );
}

// ─── Configuration components ────────────────────────────────────────────────

const CONFIG_PATTERN_DESC: Record<string, string> = {
  stellium:        "Three or more planets clustered in a single sign, intensifying its themes.",
  tSquare:         "Two planets in opposition, both squared by a third — a focal point of tension.",
  grandCross:      "Four planets in two opposing pairs, each squaring the others — a crucible of pressure.",
  grandTrine:      "Three planets in trine, forming a flowing triangle of ease and natural talent.",
  kite:            "A grand trine with a fourth planet opposing one vertex, adding direction and drive.",
  yod:             "Two planets in sextile, each quincunx a third — a fated adjustment point.",
  mysticRectangle: "Two oppositions linked by trines and sextiles — harmonious tension seeking resolution.",
};

interface ConfigurationCardProps {
  config:       ChartConfiguration;
  isActive:     boolean;
  onTap:        () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function ConfigurationCard({ config, isActive, onTap, onMouseEnter, onMouseLeave }: ConfigurationCardProps) {
  return (
    <div style={{ padding: "0 0 1px" }} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <GlassPanel
        active={isActive}
        onClick={onTap}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onTap()}
        style={{ padding: "14px 16px", cursor: "pointer", borderRadius: 0, userSelect: "none" }}
      >
        {/* Row 1 — label + chevron */}
        <div
          style={{
            display:        "flex",
            justifyContent: "space-between",
            alignItems:     "center",
            marginBottom:   6,
          }}
        >
          <span style={{ fontFamily: "EB Garamond, Georgia, serif", fontSize: 15, color: "#E2E4EA" }}>
            {config.label}
            {config.focalPlanet && (
              <span style={{ fontSize: 12, color: "#8B909C" }}> · {config.focalPlanet}</span>
            )}
          </span>
          <ChevronRight />
        </div>
        {/* Row 2 — involved planets */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {config.planets.map((name) => {
            const sym = PLANET_SYMBOLS[name] ?? name.slice(0, 2);
            return (
              <span
                key={name}
                style={{
                  fontSize:   11,
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  color:      "#8B909C",
                }}
              >
                <span style={{ color: "#C8A96E" }}>{sym}</span>{" "}{name}
              </span>
            );
          })}
        </div>
      </GlassPanel>
    </div>
  );
}

interface ConfigurationDetailProps {
  config: ChartConfiguration;
  onBack: () => void;
}

function ConfigurationDetail({ config, onBack }: ConfigurationDetailProps) {
  return (
    <div style={{ padding: "20px 24px" }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          background:   "none",
          border:       "none",
          color:        "#8B909C",
          fontSize:     12,
          fontFamily:   "system-ui, -apple-system, sans-serif",
          cursor:       "pointer",
          padding:      0,
          marginBottom: 20,
          display:      "block",
        }}
      >
        ← Patterns
      </button>

      {/* Title */}
      <div
        style={{
          fontFamily:   "EB Garamond, Georgia, serif",
          fontSize:     22,
          color:        "#E2E4EA",
          marginBottom: 4,
        }}
      >
        {config.label}
      </div>
      {config.focalPlanet && (
        <div
          style={{
            fontSize:     12,
            color:        "#8B909C",
            fontFamily:   "system-ui, -apple-system, sans-serif",
            marginBottom: 4,
          }}
        >
          Focal planet: {config.focalPlanet}
        </div>
      )}

      {/* Divider */}
      <div style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)", margin: "16px 0" }} />

      {/* PLANETS */}
      <div style={{ marginBottom: 20 }}>
        <span style={SECTION_LABEL}>Planets</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
          {config.planets.map((name) => {
            const sym = PLANET_SYMBOLS[name] ?? name.slice(0, 2);
            return (
              <span
                key={name}
                style={{
                  fontSize:   13,
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  color:      "#E2E4EA",
                }}
              >
                <span style={{ color: "#C8A96E" }}>{sym}</span>{" "}{name}
              </span>
            );
          })}
        </div>
      </div>

      {/* PATTERN */}
      <div style={{ marginBottom: 20 }}>
        <span style={SECTION_LABEL}>Pattern</span>
        <p
          style={{
            fontSize:   13,
            fontFamily: "system-ui, -apple-system, sans-serif",
            color:      "#8B909C",
            margin:     0,
            marginTop:  4,
          }}
        >
          {CONFIG_PATTERN_DESC[config.type] ?? "A notable planetary configuration."}
        </p>
      </div>

      {/* INTERPRETATION */}
      <div style={{ marginBottom: 28 }}>
        <span style={SECTION_LABEL}>Interpretation</span>
        <p
          style={{
            fontFamily: "EB Garamond, Georgia, serif",
            fontStyle:  "italic",
            fontSize:   15,
            color:      "#C8A96E",
            margin:     0,
            marginTop:  4,
            lineHeight: 1.6,
          }}
        >
          The interpretation for this pattern will appear here.
        </p>
      </div>

      {/* REFLECT */}
      <CTAButton
        variant="primary"
        style={{ width: "100%" }}
        onClick={() => console.log("reflect config", config.type)}
      >
        Reflect
      </CTAButton>
    </div>
  );
}

// ─── WheelPanel ───────────────────────────────────────────────────────────────
// Left-column content: wheel + Big 3 + placeholder button.

interface WheelPanelProps {
  wheelSize:                    number;
  wheelHouses:                  Parameters<typeof NatalWheel>[0]["houses"];
  wheelPlanets:                 Parameters<typeof NatalWheel>[0]["planets"];
  configurationAspects:         WheelAspect[];
  activeConfigurationPlanets?:  string[];
  hoveredConfigurationPlanets?: string[];
  activeHouse:                  number | undefined;
  hoveredHouse:                 number | undefined;
  sunSign:                      string;
  moonSign:                     string;
  risingSign:                   string;
}

function WheelPanel({
  wheelSize, wheelHouses, wheelPlanets, configurationAspects,
  activeConfigurationPlanets, hoveredConfigurationPlanets,
  activeHouse, hoveredHouse,
  sunSign, moonSign, risingSign,
}: WheelPanelProps) {
  return (
    <div
      style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        gap:            16,
        width:          "100%",
      }}
    >
      {/* Natal wheel */}
      <NatalWheel
        size={wheelSize}
        houses={wheelHouses}
        planets={wheelPlanets}
        aspects={configurationAspects}
        activeConfigurationPlanets={activeConfigurationPlanets}
        hoveredConfigurationPlanets={hoveredConfigurationPlanets}
        activeHouse={activeHouse}
        hoveredHouse={hoveredHouse}
      />

      {/* Big 3 */}
      <div
        style={{
          fontSize:    11,
          fontFamily:  "system-ui, -apple-system, sans-serif",
          letterSpacing: "0.08em",
          textAlign:   "center",
          lineHeight:  1.8,
        }}
      >
        <span style={{ color: "#8B909C", textTransform: "uppercase" }}>Sun </span>
        <span style={{ color: "#E2E4EA" }}>{sunSign}</span>
        <span style={{ color: "#4A5060" }}> · </span>
        <span style={{ color: "#8B909C", textTransform: "uppercase" }}>Moon </span>
        <span style={{ color: "#E2E4EA" }}>{moonSign}</span>
        <span style={{ color: "#4A5060" }}> · </span>
        <span style={{ color: "#8B909C", textTransform: "uppercase" }}>Rising </span>
        <span style={{ color: "#E2E4EA" }}>{risingSign}</span>
      </div>

      {/* Placeholder interpretation button */}
      <button
        onClick={() => console.log("view interpretation")}
        style={{
          width:               "100%",
          padding:             "10px 16px",
          background:          "rgba(6,8,14,0.58)",
          backdropFilter:      "blur(20px) saturate(1.3)",
          WebkitBackdropFilter: "blur(20px) saturate(1.3)",
          border:              "0.5px solid rgba(255,255,255,0.08)",
          borderRadius:        7,
          color:               "#8B909C",
          fontSize:            12,
          fontFamily:          "system-ui, -apple-system, sans-serif",
          cursor:              "pointer",
          letterSpacing:       "0.02em",
          textAlign:           "center",
        }}
      >
        [PLACEHOLDER — View Interpretation]
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function YouPage() {
  const [chart, setChart]               = useState<NatalChart | null>(null);
  const [hasData, setHasData]           = useState(false);
  const [activeHouse, setActiveHouse]   = useState<number | undefined>(undefined);
  const [expandedHouse, setExpandedHouse] = useState<number | undefined>(undefined);
  const [wheelSize, setWheelSize]       = useState(320);
  const [activeConfiguration, setActiveConfiguration]     = useState<ChartConfiguration | null>(null);
  const [expandedConfiguration, setExpandedConfiguration] = useState<ChartConfiguration | null>(null);
  const [hoveredHouse, setHoveredHouse]                   = useState<number | undefined>(undefined);
  const [hoveredConfiguration, setHoveredConfiguration]   = useState<ChartConfiguration | null>(null);
  const cardRefs  = useRef<Record<number, HTMLDivElement | null>>({});
  const leftColRef = useRef<HTMLDivElement>(null);

  // ── Left column ResizeObserver ───────────────────────────────────────────
  useEffect(() => {
    const el = leftColRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setWheelSize(el.clientWidth - 64);
    });
    ro.observe(el);
    // Set initial size immediately
    setWheelSize(el.clientWidth - 64);
    return () => ro.disconnect();
  }, [hasData]);

  // ── Chart calculation ────────────────────────────────────────────────────
  useEffect(() => {
    function calcFromStorage() {
      try {
        const raw = localStorage.getItem(BIRTH_DATA_KEY);
        if (raw) {
          const s    = JSON.parse(raw) as StoredBirthData;
          const date = birthDataToDate(s.birthDate, s.birthTime, s.timezone);
          setChart(calculateNatalChart(date, s.latitude, s.longitude));
          setHasData(true);
        } else {
          setChart(null);
          setHasData(false);
        }
      } catch (e) {
        console.error("Failed to calculate natal chart:", e);
        setChart(null);
        setHasData(false);
      }
    }
    calcFromStorage();
    window.addEventListener("birth-data-updated", calcFromStorage);
    return () => window.removeEventListener("birth-data-updated", calcFromStorage);
  }, []);

  // ── Derived data ─────────────────────────────────────────────────────────

  const wheelHouses = chart?.houseCusps.map((cuspDegree, i) => ({
    number:     i + 1,
    cuspDegree,
    sign:       longitudeToSign(cuspDegree),
    domainWord: HOUSE_DOMAINS[i + 1],
  }));

  const wheelPlanets = chart?.planets.map((p) => ({
    name:         p.name,
    degree:       p.longitude,
    isRetrograde: p.retrograde,
  }));

  const sunSign    = chart?.planets.find((p) => p.name === "Sun")?.sign   ?? "—";
  const moonSign   = chart?.planets.find((p) => p.name === "Moon")?.sign  ?? "—";
  const risingSign = chart?.ascSign ?? "—";

  // Build the 12-house data array
  const houseData = Array.from({ length: 12 }, (_, i) => {
    const n          = i + 1;
    const cuspDegree = chart?.houseCusps[i] ?? 0;
    const sign       = chart ? longitudeToSign(cuspDegree) : "—";
    const planets    = chart?.planets.filter((p) => p.house === n) ?? [];
    return { n, sign, planets };
  });

  const expanded = expandedHouse !== undefined ? houseData[expandedHouse - 1] : null;

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleCardTap(houseNum: number) {
    setActiveHouse(houseNum);
    setExpandedHouse(houseNum);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    const prev = expandedHouse;
    setExpandedHouse(undefined);
    setActiveHouse(undefined);
    // Mobile: after re-render, scroll the previously-expanded card back into view
    setTimeout(() => {
      if (prev !== undefined && cardRefs.current[prev]) {
        cardRefs.current[prev]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 50);
  }

  // ── Configurations ───────────────────────────────────────────────────────

  const configurations = useMemo(() => {
    if (!chart) return []
    const planetHouses: Record<string, number> = {}
    chart.planets.forEach(p => {
      if (p.house) planetHouses[p.name] = p.house
    })
    return detectConfigurations(
      chart.planets.map(p => ({ name: p.name, degree: p.longitude })),
      planetHouses,
    )
  }, [chart]);

  const planetDegreeMap = useMemo(
    () => new Map(chart?.planets.map((p) => [p.name, p.longitude]) ?? []),
    [chart],
  );

  const configurationAspects = useMemo(() => {
    if (activeConfiguration) {
      return configToAspects(activeConfiguration, planetDegreeMap)
    }
    // Show all configuration aspects by default
    return configurations.flatMap(config =>
      configToAspects(config, planetDegreeMap)
    )
  }, [activeConfiguration, configurations, planetDegreeMap]);

  // ── Shared JSX blocks ────────────────────────────────────────────────────

  const wheelPanelProps: WheelPanelProps = {
    wheelHouses,
    wheelPlanets,
    configurationAspects,
    activeConfigurationPlanets:  activeConfiguration?.planets,
    hoveredConfigurationPlanets: hoveredConfiguration?.planets,
    activeHouse,
    hoveredHouse,
    sunSign,
    moonSign,
    risingSign,
    wheelSize: 320, // overridden per context
  };

  // Shared label style for section headings
  const sectionHeading: React.CSSProperties = {
    fontSize:      10,
    fontWeight:    500,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color:         "#4A5060",
    fontFamily:    "system-ui, -apple-system, sans-serif",
  };
  const sectionBlurb: React.CSSProperties = {
    fontSize:   12,
    color:      "#4A5060",
    fontFamily: "system-ui, -apple-system, sans-serif",
    marginTop:  4,
  };

  const houseCards = (
    <div>

      {/* ── Life's Architecture header ───────────────────────────────────────── */}
      <div style={{ padding: "20px 24px 0" }}>
        <div style={sectionHeading}>Life&#39;s Architecture</div>
        <div style={{ ...sectionBlurb, marginBottom: 16 }}>
          The sky divided into life. Each house holds a domain in the shape of the sign that rules it.
        </div>
      </div>

      {/* ── House grid ───────────────────────────────────────────────────────── */}
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "1fr 1fr",
          gap:                 "1px",     // hairline separator between columns
          alignItems:          "stretch", // cards in the same row match height
        }}
      >
        {houseData.map(({ n, sign, planets }) => (
          <HouseCard
            key={n}
            n={n}
            sign={sign}
            planets={planets}
            isActive={activeHouse === n}
            isHovered={hoveredHouse === n}
            onTap={() => handleCardTap(n)}
            onMouseEnter={() => setHoveredHouse(n)}
            onMouseLeave={() => setHoveredHouse(undefined)}
            setRef={(el) => { cardRefs.current[n] = el; }}
          />
        ))}
      </div>

      {/* ── Chart Patterns ────────────────────────────────────────────────────── */}
      {configurations.length > 0 && (
        <div style={{ padding: "32px 0 0" }}>
          <div style={{ padding: "0 24px", marginBottom: 16 }}>
            <div style={sectionHeading}>Defining Aspects</div>
            <div style={sectionBlurb}>
              Some arrangements of planets carry unusual weight. These are yours.
            </div>
          </div>
          <div
            style={{
              display:             "grid",
              gridTemplateColumns: "1fr 1fr",
              gap:                 "1px",
              alignItems:          "stretch",
            }}
          >
            {configurations.map((config) => (
              <ConfigurationCard
                key={`${config.type}-${config.planets.join(",")}`}
                config={config}
                isActive={activeConfiguration?.planets.join(",") === config.planets.join(",")}
                onTap={() => {
                  setActiveConfiguration(config);
                  setExpandedConfiguration(config);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onMouseEnter={() => setHoveredConfiguration(config)}
                onMouseLeave={() => setHoveredConfiguration(null)}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position:   "relative",
        width:      "100vw",
        height:     "100dvh",
        overflow:   "hidden",
        background: "#0D1117",
      }}
    >

      {/* Desktop top nav — always rendered */}
      <header
        className="hidden md:flex"
        style={{
          position:            "absolute",
          top:                 0,
          left:                0,
          right:               0,
          zIndex:              10,
          padding:             "0 24px",
          height:              52,
          alignItems:          "center",
          justifyContent:      "space-between",
          borderBottom:        "0.5px solid rgba(255,255,255,0.06)",
          background:          "rgba(13,17,23,0.6)",
          backdropFilter:      "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <span
          style={{
            fontFamily:    "EB Garamond, Georgia, serif",
            fontSize:      16,
            fontWeight:    500,
            color:         "#E2E4EA",
            letterSpacing: "0.02em",
          }}
        >
          {APP_NAME}
        </span>
        <nav className="flex items-center gap-6">
          {["Feed", "You", "Journal", "Settings"].map((tab) => (
            <a
              key={tab}
              href={tab === "Feed" ? "/" : `/${tab.toLowerCase()}`}
              style={{
                fontSize:      10,
                fontWeight:    500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color:         tab === "You" ? "#C8A96E" : "#4A5060",
                textDecoration: "none",
                transition:    "color 380ms ease-out",
              }}
            >
              {tab}
            </a>
          ))}
        </nav>
      </header>

      {!hasData ? (

        /* ── Empty state — no birth data ─────────────────────────────────── */
        <div
          style={{
            position:       "absolute",
            inset:          0,
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            justifyContent: "center",
            gap:            8,
            padding:        "52px 24px 72px",
          }}
        >
          <p
            style={{
              fontFamily: "EB Garamond, Georgia, serif",
              fontStyle:  "italic",
              fontSize:   20,
              color:      "#8B909C",
              margin:     0,
              textAlign:  "center",
            }}
          >
            Your chart awaits.
          </p>
          <p
            style={{
              fontFamily:   "EB Garamond, Georgia, serif",
              fontStyle:    "italic",
              fontSize:     15,
              color:        "#4A5060",
              margin:       0,
              textAlign:    "center",
              marginBottom: 16,
            }}
          >
            A birth moment is all it needs.
          </p>
          <div style={{ width: "100%", maxWidth: 360 }}>
            <BirthDataCard />
          </div>
        </div>

      ) : (
        <>
          {/* ── Desktop (≥768px) ────────────────────────────────────────────── */}
          <div
            className="hidden md:flex"
            style={{ height: "100vh", paddingTop: 52 }}
          >
            {/* Left column */}
            <div
              ref={leftColRef}
              style={{
                width:               "42%",
                height:              "100%",
                flexShrink:          0,
                display:             "flex",
                flexDirection:       "column",
                alignItems:          "center",
                justifyContent:      "flex-start",
                overflowY:           "auto",
                borderRight:         "0.5px solid rgba(255,255,255,0.06)",
                background:          "rgba(6,8,14,0.45)",
                backdropFilter:      "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                padding:             "0 0 32px",
              }}
            >
              {/* Page header — "You" title + BirthDataCard */}
              <div
                style={{
                  display:       "flex",
                  flexDirection: "row",
                  alignItems:    "center",
                  width:         "100%",
                  padding:       "16px 16px 8px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      fontFamily: "EB Garamond, Georgia, serif",
                      fontSize:   28,
                      color:      "#E2E4EA",
                    }}
                  >
                    You
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <BirthDataCard />
                </div>
              </div>
              <WheelPanel {...wheelPanelProps} wheelSize={wheelSize} />
            </div>

            {/* Right column — independent scroll, crossfade between views */}
            <div
              style={{
                flex:     1,
                height:   "100%",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Card list */}
              <div
                style={{
                  position:      "absolute",
                  inset:         0,
                  overflowY:     "auto",
                  paddingBottom: 72,
                  opacity:       (expandedHouse || expandedConfiguration) ? 0 : 1,
                  transform:     (expandedHouse || expandedConfiguration) ? "translateX(-12px)" : "translateX(0)",
                  transition:    "opacity 480ms ease-in-out, transform 480ms ease-in-out",
                  pointerEvents: (expandedHouse || expandedConfiguration) ? "none" : "auto",
                }}
              >
                {houseCards}
              </div>

              {/* House expanded detail */}
              <div
                style={{
                  position:    "absolute",
                  inset:       0,
                  overflowY:   "auto",
                  opacity:     expandedHouse ? 1 : 0,
                  transform:   expandedHouse ? "translateX(0)" : "translateX(12px)",
                  transition:  "opacity 480ms ease-in-out, transform 480ms ease-in-out",
                  pointerEvents: expandedHouse ? "auto" : "none",
                }}
              >
                {expanded && (
                  <ExpandedDetail
                    houseNum={expanded.n}
                    sign={expanded.sign}
                    planets={expanded.planets}
                    onBack={handleBack}
                  />
                )}
              </div>

              {/* Configuration expanded detail */}
              <div
                style={{
                  position:    "absolute",
                  inset:       0,
                  overflowY:   "auto",
                  opacity:     expandedConfiguration ? 1 : 0,
                  transform:   expandedConfiguration ? "translateX(0)" : "translateX(12px)",
                  transition:  "opacity 480ms ease-in-out, transform 480ms ease-in-out",
                  pointerEvents: expandedConfiguration ? "auto" : "none",
                }}
              >
                {expandedConfiguration && (
                  <ConfigurationDetail
                    config={expandedConfiguration}
                    onBack={() => {
                      setExpandedConfiguration(null);
                      setActiveConfiguration(null);
                      setActiveHouse(undefined);
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* ── Mobile (<768px) ─────────────────────────────────────────────── */}
          <div
            className="md:hidden"
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 72, zIndex: 10, overflowY: "auto" }}
          >
            {expandedConfiguration ? (
              <div style={{ paddingBottom: 88 }}>
                <ConfigurationDetail
                  config={expandedConfiguration}
                  onBack={() => {
                    setExpandedConfiguration(null);
                    setActiveConfiguration(null);
                    setActiveHouse(undefined);
                  }}
                />
              </div>
            ) : expandedHouse && expanded ? (
              /* Full-screen expanded view — extra bottom padding clears BottomNav */
              <div style={{ paddingBottom: 88 }}>
                <ExpandedDetail
                  houseNum={expanded.n}
                  sign={expanded.sign}
                  planets={expanded.planets}
                  onBack={handleBack}
                />
              </div>
            ) : (
              /* Card list view */
              <div style={{ padding: "24px 16px 88px" }}>
                {/* BirthDataCard at top — matches Feed page mobile pattern */}
                <div style={{ marginBottom: 16 }}>
                  <BirthDataCard />
                </div>

                {/* Wheel + Big 3 + button, centered */}
                <div
                  style={{
                    display:       "flex",
                    flexDirection: "column",
                    alignItems:    "center",
                    marginBottom:  24,
                  }}
                >
                  <WheelPanel {...wheelPanelProps} wheelSize={280} />
                </div>

                {/* House cards */}
                {houseCards}
              </div>
            )}
          </div>
        </>
      )}

      {/* Mobile bottom nav — always rendered */}
      <BottomNav />
    </div>
  );
}
