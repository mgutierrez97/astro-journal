"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import GlassPanel from "@/components/ui/GlassPanel";
import { BIRTH_DATA_KEY, type StoredBirthData } from "@/components/ui/BirthDataCard";
import { generateTransitsCached } from "@/lib/transitGenerator";
import { filterTransitsForFeed, type ScoredTransit } from "@/lib/transitFilter";
import { calculateNatalChart, birthDataToDate, type NatalPlanet } from "@/lib/natal";
import { longitudeToSign } from "@/lib/astronomy";
import { detectConfigurations, type ChartConfiguration } from "@/lib/configurations";
import { timingIndicator } from "@/lib/timingIndicator";
import TransitDetail from "@/components/cards/TransitDetail";
import { getHouseReading, getPlanetNote, getAspectNote } from "@/lib/houseReadings";
import { getConfigurationReading, getParticipantNote } from "@/lib/configurationReadings";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HouseData {
  number:    number;
  sign:      string;
  domainWord: string;
  planets:   Array<{ name: string; symbol: string }>;
}

export type Attachment =
  | { type: "transit";       data: ScoredTransit }
  | { type: "house";         data: HouseData }
  | { type: "configuration"; data: ChartConfiguration };

interface AttachComponentProps {
  attachment: Attachment | null;
  onAttach:   (attachment: Attachment) => void;
  onRemove:   () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUSE_DOMAINS: Record<number, string> = {
  1:  "Self",           2:  "Worth",
  3:  "Mind",           4:  "Home",
  5:  "Creativity",     6:  "Routines",
  7:  "Relationships",  8:  "Transformation",
  9:  "Expansion",      10: "Vocation",
  11: "Community",      12: "Solitude",
};

const PLANET_SYMBOLS: Record<string, string> = {
  Sun:       "☉", Moon:      "☽", Mercury:   "☿", Venus:     "♀", Mars:      "♂",
  Jupiter:   "♃", Saturn:    "♄", Uranus:    "♅", Neptune:   "♆", Pluto:     "♇",
  Chiron:    "⚷", Lilith:    "⚸", Midheaven: "MC", Ascendant: "↑",
};

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPeakDate(date: Date): string {
  return `Peak ${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`;
}

function configKey(config: ChartConfiguration): string {
  return `${config.type}:${Array.from(config.planets).sort().join(",")}`;
}

interface PostcardContent {
  badge: string;
  title: string;
  meta:  string;
}

function getPostcardContent(att: Attachment): PostcardContent {
  if (att.type === "transit") {
    const { transit } = att.data;
    const peakStr   = `${MONTHS_SHORT[transit.peakDate.getMonth()]} ${transit.peakDate.getDate()}`;
    const housePart = transit.house != null
      ? ` · H${transit.house}: ${HOUSE_DOMAINS[transit.house] ?? ""}`
      : "";
    return {
      badge: "TRANSIT",
      title: transit.title,
      meta:  `${peakStr}${housePart}`,
    };
  }
  if (att.type === "house") {
    const { number, sign, domainWord, planets } = att.data;
    const planetPart = planets.length > 0
      ? ` · ${planets.map((p) => p.name).join(", ")}`
      : "";
    return {
      badge: "NATAL",
      title: `H${number} · ${domainWord}`,
      meta:  `${sign}${planetPart}`,
    };
  }
  // configuration
  const { label, focalPlanet, planets } = att.data;
  const title = focalPlanet ? `${label} · ${focalPlanet}` : label;
  return {
    badge: "NATAL",
    title,
    meta:  planets.join(" · "),
  };
}

// ─── Detail-modal constants ───────────────────────────────────────────────────

const SIGN_ELEMENT: Record<string, string> = {
  Aries: "Fire",  Leo: "Fire",  Sagittarius: "Fire",
  Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
  Gemini: "Air",  Libra: "Air", Aquarius: "Air",
  Cancer: "Water", Scorpio: "Water", Pisces: "Water",
};

const SIGN_MODALITY: Record<string, string> = {
  Aries: "Cardinal", Cancer: "Cardinal", Libra: "Cardinal",  Capricorn: "Cardinal",
  Taurus: "Fixed",   Leo: "Fixed",      Scorpio: "Fixed",    Aquarius: "Fixed",
  Gemini: "Mutable", Virgo: "Mutable",  Sagittarius: "Mutable", Pisces: "Mutable",
};

const SECTION_LABEL: React.CSSProperties = {
  display:       "block",
  fontSize:      10,
  fontWeight:    500,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color:         "#4A5060",
  marginBottom:  6,
};

const DEPTH_BODIES = new Set([
  "Sun", "Moon", "Mars", "Saturn", "Pluto", "Chiron", "Ascendant", "Midheaven",
]);
const HARD_ASPECTS_SET = new Set(["conjunction", "opposition", "square"]);
const LUMINARIES       = new Set(["Sun", "Moon"]);

const ASPECT_ANGLE: Record<string, number> = {
  conjunction: 0,
  opposition:  180,
  square:      90,
};

const ASPECT_ORBS: Record<string, number> = {
  conjunction: 8,
  opposition:  8,
  trine:       7,
  square:      7,
  sextile:     5,
};

// ─── Detail-modal types ───────────────────────────────────────────────────────

type WheelAspect = {
  bodyA: string;
  bodyB: string;
  type: "conjunction" | "opposition" | "square" | "trine" | "sextile";
};

type Grouping = {
  planets:   string[];
  role:      string;
  isPaired:  boolean;
  titleText: string;
};

// ─── Detail-modal helpers ─────────────────────────────────────────────────────

function calculateNatalAspects(
  planets: { name: string; degree: number }[],
): WheelAspect[] {
  const aspects: WheelAspect[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i].degree;
      const b = planets[j].degree;
      let diff = Math.abs(a - b);
      if (diff > 180) diff = 360 - diff;

      if (Math.abs(diff - 0)   <= ASPECT_ORBS.conjunction)
        aspects.push({ bodyA: planets[i].name, bodyB: planets[j].name, type: "conjunction" });
      else if (Math.abs(diff - 180) <= ASPECT_ORBS.opposition)
        aspects.push({ bodyA: planets[i].name, bodyB: planets[j].name, type: "opposition" });
      else if (Math.abs(diff - 120) <= ASPECT_ORBS.trine)
        aspects.push({ bodyA: planets[i].name, bodyB: planets[j].name, type: "trine" });
      else if (Math.abs(diff - 90)  <= ASPECT_ORBS.square)
        aspects.push({ bodyA: planets[i].name, bodyB: planets[j].name, type: "square" });
      else if (Math.abs(diff - 60)  <= ASPECT_ORBS.sextile)
        aspects.push({ bodyA: planets[i].name, bodyB: planets[j].name, type: "sextile" });
    }
  }
  return aspects;
}

function configSubtitle(
  config:         ChartConfiguration,
  planetSignMap:  Record<string, string>,
  planetHouseMap: Record<string, number>,
): string {
  const { type, planets, focalPlanet } = config;
  switch (type) {
    case "tSquare":
    case "yod":
      return focalPlanet ? `Focal planet: ${focalPlanet}` : "";
    case "kite":
      return `Focal planet: ${planets[planets.length - 1]}`;
    case "stellium": {
      const houses = planets
        .map((p) => planetHouseMap[p])
        .filter((h): h is number => h !== undefined);
      const uniqueHouses = new Set(houses);
      if (uniqueHouses.size === 1) {
        const h = Array.from(uniqueHouses)[0];
        return `H${h} ${HOUSE_DOMAINS[h] ?? ""}`;
      }
      return planetSignMap[planets[0]] ?? "";
    }
    case "grandTrine": {
      const sign = planetSignMap[planets[0]] ?? "";
      return `${SIGN_ELEMENT[sign] ?? ""} Trine`;
    }
    case "grandCross": {
      const sign = planetSignMap[planets[0]] ?? "";
      return `${SIGN_MODALITY[sign] ?? ""} Cross`;
    }
    default:
      return "";
  }
}

function configGroupings(
  config:          ChartConfiguration,
  planetDegreeMap: Map<string, number>,
): Grouping[] {
  const { type, planets, focalPlanet } = config;
  switch (type) {
    case "tSquare": {
      const pair = planets.filter((p) => p !== focalPlanet);
      return [
        { planets: pair, role: "opposition", isPaired: true,
          titleText: `${pair[0]} and ${pair[1]} in opposition` },
        { planets: [focalPlanet!], role: "apex", isPaired: false,
          titleText: `${focalPlanet} as apex` },
      ];
    }
    case "yod": {
      const pair = planets.filter((p) => p !== focalPlanet);
      return [
        { planets: pair, role: "sextile", isPaired: true,
          titleText: `${pair[0]} and ${pair[1]} in sextile` },
        { planets: [focalPlanet!], role: "focal", isPaired: false,
          titleText: `${focalPlanet} as focal point` },
      ];
    }
    case "grandTrine":
      return planets.map((p) => ({
        planets: [p], role: "trine", isPaired: false,
        titleText: `${p} in the trine`,
      }));
    case "kite": {
      const outer        = planets[planets.length - 1];
      const trineMembers = planets.slice(0, planets.length - 1);
      const outerDeg     = planetDegreeMap.get(outer) ?? 0;
      let opposedIdx = 0;
      let minDiff    = Infinity;
      for (let i = 0; i < trineMembers.length; i++) {
        const mDeg = planetDegreeMap.get(trineMembers[i]) ?? 0;
        let d      = Math.abs(outerDeg - mDeg);
        if (d > 180) d = 360 - d;
        const orb = Math.abs(d - 180);
        if (orb < minDiff) { minDiff = orb; opposedIdx = i; }
      }
      const opposedMember = trineMembers[opposedIdx];
      const result: Grouping[] = trineMembers.map((p) => ({
        planets: [p], role: "trine", isPaired: false,
        titleText: `${p} in the trine`,
      }));
      result.push({
        planets: [opposedMember, outer], role: "opposition", isPaired: true,
        titleText: `${opposedMember} and ${outer} in opposition`,
      });
      return result;
    }
    case "grandCross": {
      const opps: Grouping[] = [];
      const seen = new Set<string>();
      for (let i = 0; i < planets.length; i++) {
        for (let j = i + 1; j < planets.length; j++) {
          const degA = planetDegreeMap.get(planets[i]) ?? 0;
          const degB = planetDegreeMap.get(planets[j]) ?? 0;
          let diff   = Math.abs(degA - degB);
          if (diff > 180) diff = 360 - diff;
          if (Math.abs(diff - 180) <= 5) {
            const key = [planets[i], planets[j]].sort().join(",");
            if (!seen.has(key)) {
              seen.add(key);
              opps.push({
                planets: [planets[i], planets[j]], role: "opposition", isPaired: true,
                titleText: `${planets[i]} and ${planets[j]} in opposition`,
              });
            }
          }
        }
      }
      return opps;
    }
    default:
      return planets.map((p) => ({
        planets: [p], role: "conjunction", isPaired: false, titleText: p,
      }));
  }
}

function AspectLineSwatch({ type }: { type: "conjunction" | "opposition" | "square" }) {
  const styles = {
    conjunction: { stroke: "rgba(255,255,255,0.70)", strokeDasharray: "4 4" },
    opposition:  { stroke: "#CC4444",                strokeDasharray: undefined },
    square:      { stroke: "rgba(255,255,255,0.55)", strokeDasharray: undefined },
  } as const;
  const s = styles[type];
  return (
    <svg width="28" height="12" viewBox="0 0 28 12" style={{ flexShrink: 0, display: "block" }}>
      <line
        x1="2" y1="6" x2="26" y2="6"
        stroke={s.stroke}
        strokeWidth="1"
        strokeDasharray={s.strokeDasharray}
      />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AttachComponent({
  attachment,
  onAttach,
  onRemove,
}: AttachComponentProps) {

  // ── Modals ────────────────────────────────────────────────────────────────

  const [showAttachModal,   setShowAttachModal]   = useState(false);
  const [showRemoveWarning, setShowRemoveWarning] = useState(false);
  const [showDetailModal,   setShowDetailModal]   = useState(false);
  const [activeTab,         setActiveTab]         = useState<"transits" | "natal">("transits");
  const [modalVisible,      setModalVisible]      = useState(false);

  // ── Hover ─────────────────────────────────────────────────────────────────

  const [emptyHovered,     setEmptyHovered]     = useState(false);
  const [hoveredTransitId, setHoveredTransitId] = useState<string | null>(null);
  const [hoveredHouseNum,  setHoveredHouseNum]  = useState<number | null>(null);
  const [hoveredConfigKey, setHoveredConfigKey] = useState<string | null>(null);

  // ── Responsive ────────────────────────────────────────────────────────────

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Birth data ────────────────────────────────────────────────────────────

  const [birthData, setBirthData] = useState<StoredBirthData | null>(null);
  useEffect(() => {
    function read() {
      const raw = localStorage.getItem(BIRTH_DATA_KEY);
      setBirthData(raw ? (JSON.parse(raw) as StoredBirthData) : null);
    }
    read();
    window.addEventListener("birth-data-updated", read);
    return () => window.removeEventListener("birth-data-updated", read);
  }, []);

  // ── Natal chart ───────────────────────────────────────────────────────────

  const natalChart = useMemo(() => {
    if (!birthData) return null;
    try {
      const bd = birthDataToDate(
        birthData.birthDate,
        birthData.birthTime,
        birthData.timezone,
      );
      return calculateNatalChart(bd, birthData.latitude, birthData.longitude);
    } catch {
      return null;
    }
  }, [birthData]);

  // ── Transits ──────────────────────────────────────────────────────────────

  const filteredTransits = useMemo(() => {
    const raw = generateTransitsCached(
      birthData   ?? undefined,
      natalChart  ?? undefined,
    );
    return filterTransitsForFeed(raw, birthData ?? undefined);
  }, [birthData, natalChart]);

  // ── Houses ────────────────────────────────────────────────────────────────

  const houses: HouseData[] = useMemo(() => {
    if (!natalChart) return [];
    return Array.from({ length: 12 }, (_, i) => {
      const num        = i + 1;
      const cuspDegree = natalChart.houseCusps[i];
      const sign       = longitudeToSign(cuspDegree);
      const planets    = natalChart.planets
        .filter((p) => p.house === num && !["Ascendant", "Midheaven"].includes(p.name))
        .map((p) => ({ name: p.name, symbol: PLANET_SYMBOLS[p.name] ?? p.symbol }));
      return { number: num, sign, domainWord: HOUSE_DOMAINS[num], planets };
    });
  }, [natalChart]);

  // ── Configurations ────────────────────────────────────────────────────────

  const configurations: ChartConfiguration[] = useMemo(() => {
    if (!natalChart) return [];
    const planetPoints = natalChart.planets
      .filter((p) => !["Chiron", "Lilith", "Ascendant", "Midheaven"].includes(p.name))
      .map((p) => ({ name: p.name, degree: p.longitude }));
    const planetHouses: Record<string, number> = {};
    natalChart.planets.forEach((p) => { planetHouses[p.name] = p.house; });
    return detectConfigurations(planetPoints, planetHouses);
  }, [natalChart]);

  // ── Detail-modal derived maps ─────────────────────────────────────────────

  const planetDegreeMap = useMemo(
    () => new Map((natalChart?.planets ?? []).map((p) => [p.name, p.longitude])),
    [natalChart],
  );

  const planetHouseMap = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    (natalChart?.planets ?? []).forEach((p) => { if (p.house) map[p.name] = p.house; });
    return map;
  }, [natalChart]);

  const planetSignMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    (natalChart?.planets ?? []).forEach((p) => { map[p.name] = p.sign; });
    return map;
  }, [natalChart]);

  // Full NatalPlanet[] for the attached house (needed for BODIES section)
  const detailHousePlanets = useMemo<NatalPlanet[]>(() => {
    if (!attachment || attachment.type !== "house" || !natalChart) return [];
    const houseNum = attachment.data.number;
    return natalChart.planets.filter(
      (p) => p.house === houseNum && !["Ascendant", "Midheaven"].includes(p.name),
    );
  }, [attachment, natalChart]);

  // Hard-aspect cross-house aspects for the attached house
  const detailHouseAspects = useMemo<WheelAspect[]>(() => {
    if (!attachment || attachment.type !== "house" || !natalChart) return [];
    const houseNum    = attachment.data.number;
    const planetPts   = natalChart.planets.map((p) => ({ name: p.name, degree: p.longitude }));
    const degMap      = new Map(planetPts.map((p) => [p.name, p.degree]));
    const allAspects  = calculateNatalAspects(planetPts);
    return allAspects.filter((a) => {
      if (!HARD_ASPECTS_SET.has(a.type)) return false;
      if (!DEPTH_BODIES.has(a.bodyA) && !DEPTH_BODIES.has(a.bodyB)) return false;
      const hA = planetHouseMap[a.bodyA];
      const hB = planetHouseMap[a.bodyB];
      if (hA !== houseNum && hB !== houseNum) return false;
      if (hA === hB) return false;
      const maxOrb = (LUMINARIES.has(a.bodyA) || LUMINARIES.has(a.bodyB)) ? 8 : 6;
      const degA = degMap.get(a.bodyA) ?? 0;
      const degB = degMap.get(a.bodyB) ?? 0;
      let diff = Math.abs(degA - degB);
      if (diff > 180) diff = 360 - diff;
      return Math.abs(diff - ASPECT_ANGLE[a.type]) <= maxOrb;
    });
  }, [attachment, natalChart, planetHouseMap]);

  // ── Modal animation ───────────────────────────────────────────────────────

  useEffect(() => {
    if (showAttachModal) {
      requestAnimationFrame(() => setModalVisible(true));
    } else {
      setModalVisible(false);
    }
  }, [showAttachModal]);

  // ── Swipe-down to close (mobile) ──────────────────────────────────────────

  const touchStartY = useRef(0);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const diff = e.changedTouches[0].clientY - touchStartY.current;
    if (diff > 60) closeModal();
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  function closeModal() {
    if (isMobile) {
      setModalVisible(false);
      setTimeout(() => setShowAttachModal(false), 300);
    } else {
      setShowAttachModal(false);
    }
  }

  function handleSelectTransit(scored: ScoredTransit) {
    onAttach({ type: "transit", data: scored });
    closeModal();
  }

  function handleSelectHouse(house: HouseData) {
    onAttach({ type: "house", data: house });
    closeModal();
  }

  function handleSelectConfig(config: ChartConfiguration) {
    onAttach({ type: "configuration", data: config });
    closeModal();
  }

  function handleRemoveClick() {
    if (!attachment) return;
    if (attachment.type === "transit") {
      setShowRemoveWarning(true);
    } else {
      onRemove();
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const postcardContent = attachment ? getPostcardContent(attachment) : null;

  return (
    <>
      {/* ── Empty state OR Postcard ─────────────────────────────────────── */}

      {!attachment ? (
        /* Empty state */
        <button
          onClick={() => setShowAttachModal(true)}
          onMouseEnter={() => setEmptyHovered(true)}
          onMouseLeave={() => setEmptyHovered(false)}
          style={{
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            justifyContent: "center",
            gap:            8,
            width:          "100%",
            background:     "rgba(255,255,255,0.03)",
            border:         `0.5px dashed ${emptyHovered ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.12)"}`,
            borderRadius:   7,
            padding:        20,
            marginBottom:   20,
            cursor:         "pointer",
            textAlign:      "center",
            boxSizing:      "border-box",
            transition:     "border-color 280ms ease-out",
          }}
        >
          <Paperclip size={16} color="#4A5060" />
          <span
            style={{
              fontFamily:    "system-ui, -apple-system, sans-serif",
              fontSize:      12,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color:         "#4A5060",
            }}
          >
            Attach a moment.
          </span>
          <span
            style={{
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontSize:   11,
              color:      "#4A5060",
              textAlign:  "center",
            }}
          >
            Connect an active transit or natal chart placement to this entry.
          </span>
        </button>

      ) : (
        /* Postcard */
        <div
          style={{
            background:           "rgba(6, 8, 14, 0.58)",
            backdropFilter:       "blur(20px) saturate(1.3)",
            WebkitBackdropFilter: "blur(20px) saturate(1.3)",
            borderRadius:         7,
            border:               "0.5px solid rgba(255,255,255,0.07)",
            borderTop:            "0.5px solid rgba(200,169,110,0.25)",
            padding:              "14px 16px",
            marginBottom:         20,
            boxSizing:            "border-box",
          }}
        >
          {/* Top row: badge + X */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                fontFamily:    "system-ui, -apple-system, sans-serif",
                fontSize:      10,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color:         "#C8A96E",
              }}
            >
              {postcardContent!.badge}
            </span>
            <button
              onClick={handleRemoveClick}
              aria-label="Remove attachment"
              style={{
                background: "none",
                border:     "none",
                cursor:     "pointer",
                padding:    "2px 4px",
                lineHeight: 1,
                display:    "flex",
                alignItems: "center",
              }}
            >
              <X size={14} color="#8B909C" />
            </button>
          </div>

          {/* Title */}
          <p
            style={{
              fontFamily: "EB Garamond, Georgia, serif",
              fontSize:   17,
              color:      "#E2E4EA",
              margin:     "6px 0 4px",
              lineHeight: 1.2,
            }}
          >
            {postcardContent!.title}
          </p>

          {/* Metadata */}
          <p
            style={{
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontSize:   11,
              color:      "#8B909C",
              margin:     "0 0 12px",
              lineHeight: 1.4,
            }}
          >
            {postcardContent!.meta}
          </p>

          {/* Bottom row */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setShowDetailModal(true)}
              style={{
                background:    "none",
                border:        "none",
                cursor:        "pointer",
                fontFamily:    "system-ui, -apple-system, sans-serif",
                fontSize:      11,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color:         "#8B909C",
                padding:       0,
              }}
            >
              VIEW DETAILS
            </button>
          </div>
        </div>
      )}

      {/* ── Attach modal ────────────────────────────────────────────────── */}
      {showAttachModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Attach to entry"
          onClick={closeModal}
          style={{
            position:       "fixed",
            inset:          0,
            zIndex:         50,
            background:     "rgba(0,0,0,0.6)",
            display:        "flex",
            alignItems:     isMobile ? "flex-end" : "center",
            justifyContent: "center",
            padding:        isMobile ? 0 : "0 24px",
          }}
        >
          <GlassPanel
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{
              borderRadius:  isMobile ? "12px 12px 0 0" : "7px",
              width:         "100%",
              maxWidth:      isMobile ? "100%" : 520,
              maxHeight:     "80vh",
              display:       "flex",
              flexDirection: "column",
              overflow:      "hidden",
              transform:     isMobile && !modalVisible ? "translateY(100%)" : "translateY(0)",
              transition:    isMobile ? "transform 300ms cubic-bezier(0.0, 0.0, 0.2, 1)" : "none",
            }}
          >
            {/* Modal header */}
            <div
              style={{
                display:        "flex",
                alignItems:     "center",
                justifyContent: "space-between",
                padding:        "20px 20px 0",
                flexShrink:     0,
              }}
            >
              <h2
                style={{
                  fontFamily: "EB Garamond, Georgia, serif",
                  fontSize:   18,
                  fontWeight: 400,
                  color:      "#E2E4EA",
                  margin:     0,
                  lineHeight: 1.2,
                }}
              >
                What calls to you?
              </h2>
              <button
                onClick={closeModal}
                aria-label="Close"
                style={{
                  background: "none",
                  border:     "none",
                  cursor:     "pointer",
                  padding:    "4px 6px",
                  display:    "flex",
                  alignItems: "center",
                }}
              >
                <X size={16} color="#8B909C" />
              </button>
            </div>

            {/* Tabs row */}
            <div
              style={{
                display:    "flex",
                gap:        0,
                padding:    "16px 20px 0",
                flexShrink: 0,
              }}
            >
              {(["transits", "natal"] as const).map((tab) => {
                const label = tab === "transits" ? "TRANSITS" : "NATAL CHART";
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      background:    "none",
                      border:        "none",
                      borderBottom:  active ? "1px solid #C8A96E" : "1px solid transparent",
                      cursor:        "pointer",
                      padding:       "0 0 10px",
                      marginRight:   24,
                      fontFamily:    "system-ui, -apple-system, sans-serif",
                      fontSize:      11,
                      fontWeight:    500,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color:         active ? "#E2E4EA" : "#4A5060",
                      transition:    "color 200ms ease-out, border-color 200ms ease-out",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div
              style={{
                height:     "0.5px",
                background: "rgba(255,255,255,0.07)",
                flexShrink: 0,
              }}
            />

            {/* List area */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {!birthData ? (
                /* No birth data state */
                <div
                  style={{
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    padding:        "40px 24px",
                    textAlign:      "center",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "EB Garamond, Georgia, serif",
                      fontStyle:  "italic",
                      fontSize:   14,
                      color:      "#4A5060",
                      margin:     0,
                      lineHeight: 1.6,
                    }}
                  >
                    Your origin is not set. Add it in Settings to attach natal placements.
                  </p>
                </div>

              ) : activeTab === "transits" ? (
                /* Transits tab */
                <div>
                  {filteredTransits.length === 0 ? (
                    <div
                      style={{
                        display:        "flex",
                        alignItems:     "center",
                        justifyContent: "center",
                        padding:        "40px 24px",
                        textAlign:      "center",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "EB Garamond, Georgia, serif",
                          fontStyle:  "italic",
                          fontSize:   14,
                          color:      "#4A5060",
                          margin:     0,
                        }}
                      >
                        No active transits in the next 30 days.
                      </p>
                    </div>
                  ) : (
                    filteredTransits.map((scored) => {
                      const { transit } = scored;
                      const ti   = timingIndicator(transit.peakDate);
                      const peak = formatPeakDate(transit.peakDate);
                      const meta = [
                        ti.text,
                        peak,
                        transit.house != null ? `H${transit.house}` : null,
                      ].filter(Boolean).join(" · ");

                      const hovered = hoveredTransitId === transit.id;
                      return (
                        <button
                          key={transit.id}
                          onClick={() => handleSelectTransit(scored)}
                          onMouseEnter={() => setHoveredTransitId(transit.id)}
                          onMouseLeave={() => setHoveredTransitId(null)}
                          style={{
                            display:        "block",
                            width:          "100%",
                            textAlign:      "left",
                            padding:        "12px 20px",
                            background:     hovered ? "rgba(255,255,255,0.03)" : "none",
                            border:         "none",
                            borderBottom:   "0.5px solid rgba(255,255,255,0.06)",
                            cursor:         "pointer",
                            fontFamily:     "inherit",
                            transition:     "background 200ms ease-out",
                          }}
                        >
                          <span
                            style={{
                              display:    "block",
                              fontFamily: "EB Garamond, Georgia, serif",
                              fontSize:   15,
                              color:      "#E2E4EA",
                              lineHeight: 1.3,
                              marginBottom: 3,
                            }}
                          >
                            {transit.title}
                          </span>
                          <span
                            style={{
                              display:    "block",
                              fontFamily: "system-ui, -apple-system, sans-serif",
                              fontSize:   11,
                              color:      "#8B909C",
                              lineHeight: 1.4,
                            }}
                          >
                            {meta}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

              ) : (
                /* Natal chart tab */
                <div>
                  {/* LIFE'S ARCHITECTURE section */}
                  <div
                    style={{
                      fontFamily:    "system-ui, -apple-system, sans-serif",
                      fontSize:      10,
                      fontWeight:    500,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color:         "#4A5060",
                      padding:       "12px 20px 6px",
                    }}
                  >
                    Life&apos;s Architecture
                  </div>

                  {houses.map((house) => {
                    const hovered = hoveredHouseNum === house.number;
                    const planetStr = house.planets.length > 0
                      ? house.planets.map((p) => `${p.symbol} ${p.name}`).join("  ")
                      : null;
                    return (
                      <button
                        key={house.number}
                        onClick={() => handleSelectHouse(house)}
                        onMouseEnter={() => setHoveredHouseNum(house.number)}
                        onMouseLeave={() => setHoveredHouseNum(null)}
                        style={{
                          display:    "block",
                          width:      "100%",
                          textAlign:  "left",
                          padding:    "12px 20px",
                          background: hovered ? "rgba(255,255,255,0.03)" : "none",
                          border:     "none",
                          borderBottom: "0.5px solid rgba(255,255,255,0.06)",
                          cursor:     "pointer",
                          fontFamily: "inherit",
                          transition: "background 200ms ease-out",
                        }}
                      >
                        <span
                          style={{
                            display:    "block",
                            fontFamily: "EB Garamond, Georgia, serif",
                            fontSize:   15,
                            color:      "#E2E4EA",
                            lineHeight: 1.3,
                            marginBottom: planetStr ? 3 : 0,
                          }}
                        >
                          H{house.number} · {house.domainWord}
                        </span>
                        {planetStr && (
                          <span
                            style={{
                              display:    "block",
                              fontFamily: "system-ui, -apple-system, sans-serif",
                              fontSize:   11,
                              color:      "#8B909C",
                              lineHeight: 1.4,
                            }}
                          >
                            {planetStr}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* DEFINING ASPECTS section — hidden if no configurations */}
                  {configurations.length > 0 && (
                    <>
                      <div
                        style={{
                          fontFamily:    "system-ui, -apple-system, sans-serif",
                          fontSize:      10,
                          fontWeight:    500,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color:         "#4A5060",
                          padding:       "12px 20px 6px",
                        }}
                      >
                        Defining Aspects
                      </div>

                      {configurations.map((config) => {
                        const ck      = configKey(config);
                        const hovered = hoveredConfigKey === ck;
                        const title   = config.focalPlanet
                          ? `${config.label} · ${config.focalPlanet}`
                          : config.label;
                        const planets = config.planets
                          .map((name) => `${PLANET_SYMBOLS[name] ?? ""} ${name}`.trim())
                          .join("  ");
                        return (
                          <button
                            key={ck}
                            onClick={() => handleSelectConfig(config)}
                            onMouseEnter={() => setHoveredConfigKey(ck)}
                            onMouseLeave={() => setHoveredConfigKey(null)}
                            style={{
                              display:    "block",
                              width:      "100%",
                              textAlign:  "left",
                              padding:    "12px 20px",
                              background: hovered ? "rgba(255,255,255,0.03)" : "none",
                              border:     "none",
                              borderBottom: "0.5px solid rgba(255,255,255,0.06)",
                              cursor:     "pointer",
                              fontFamily: "inherit",
                              transition: "background 200ms ease-out",
                            }}
                          >
                            <span
                              style={{
                                display:    "block",
                                fontFamily: "EB Garamond, Georgia, serif",
                                fontSize:   15,
                                color:      "#E2E4EA",
                                lineHeight: 1.3,
                                marginBottom: 3,
                              }}
                            >
                              {title}
                            </span>
                            <span
                              style={{
                                display:    "block",
                                fontFamily: "system-ui, -apple-system, sans-serif",
                                fontSize:   11,
                                color:      "#8B909C",
                                lineHeight: 1.4,
                              }}
                            >
                              {planets}
                            </span>
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </div>
          </GlassPanel>
        </div>
      )}

      {/* ── Detail view modal ───────────────────────────────────────────── */}
      {showDetailModal && attachment && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Detail view"
          onClick={() => setShowDetailModal(false)}
          style={{
            position:       "fixed",
            inset:          0,
            zIndex:         60,
            background:     "rgba(0,0,0,0.6)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            padding:        "0 24px",
          }}
        >
          <GlassPanel
            onClick={(e) => e.stopPropagation()}
            style={{
              width:         "90%",
              maxWidth:      600,
              height:        "85vh",
              display:       "flex",
              flexDirection: "column",
              overflow:      "hidden",
              boxSizing:     "border-box",
            }}
          >
            {/* ── Header — X button top-right ─────────────────────────────── */}
            <div style={{ padding: "16px 20px 0", flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDetailModal(false)}
                aria-label="Close"
                style={{
                  background: "none",
                  border:     "none",
                  cursor:     "pointer",
                  padding:    "4px",
                  display:    "flex",
                  alignItems: "center",
                }}
              >
                <X size={16} color="#8B909C" />
              </button>
            </div>

            {/* ── Transit branch — TransitDetail owns scroll internally ─── */}
            {attachment.type === "transit" ? (
              <div style={{ flex: 1, minHeight: 0 }}>
                <TransitDetail
                  event={attachment.data.transit}
                  onBack={() => setShowDetailModal(false)}
                />
              </div>

            ) : attachment.type === "house" ? (
              /* ── House branch ─────────────────────────────────────────── */
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px 32px" }}>

                {/* Title */}
                <div
                  style={{
                    fontFamily:   "EB Garamond, Georgia, serif",
                    fontSize:     22,
                    color:        "#E2E4EA",
                    marginBottom: detailHousePlanets.length > 0 ? 8 : 20,
                  }}
                >
                  H{attachment.data.number} · {attachment.data.domainWord}
                </div>

                {/* Planet chips */}
                {detailHousePlanets.length > 0 && (
                  <div
                    style={{
                      display:      "flex",
                      flexWrap:     "wrap",
                      gap:          8,
                      marginBottom: 20,
                    }}
                  >
                    {detailHousePlanets.map((p) => {
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
                )}

                {/* Divider */}
                <div
                  style={{
                    borderBottom: "0.5px solid rgba(255,255,255,0.06)",
                    marginBottom: 24,
                  }}
                />

                {/* SIGN section */}
                <div style={{ marginBottom: 32 }}>
                  <span style={SECTION_LABEL}>Sign</span>
                  <div
                    style={{
                      marginTop:  8,
                      display:    "flex",
                      alignItems: "baseline",
                      gap:        8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "EB Garamond, Georgia, serif",
                        fontSize:   16,
                        color:      "#E2E4EA",
                      }}
                    >
                      {attachment.data.sign}
                    </span>
                    <span
                      style={{
                        fontFamily:    "system-ui, -apple-system, sans-serif",
                        fontSize:      10,
                        color:         "#8B909C",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {SIGN_ELEMENT[attachment.data.sign] ?? ""}
                      {SIGN_MODALITY[attachment.data.sign]
                        ? ` · ${SIGN_MODALITY[attachment.data.sign]}`
                        : ""}
                    </span>
                  </div>
                </div>

                {/* READING section */}
                <div style={{ marginBottom: 32 }}>
                  <span style={SECTION_LABEL}>Reading</span>
                  <p
                    style={{
                      fontFamily: "EB Garamond, Georgia, serif",
                      fontStyle:  "italic",
                      fontSize:   15,
                      color:      "#C8A96E",
                      margin:     "8px 0 0",
                      lineHeight: 1.8,
                    }}
                  >
                    {getHouseReading(attachment.data.number)}
                  </p>
                </div>

                {/* BODIES section */}
                {detailHousePlanets.length === 0 ? (
                  <p
                    style={{
                      fontSize:   12,
                      fontFamily: "system-ui, -apple-system, sans-serif",
                      fontStyle:  "italic",
                      color:      "#4A5060",
                      margin:     0,
                    }}
                  >
                    This house is unoccupied. Its sign still shapes the domain.
                  </p>
                ) : (
                  <div>
                    <span style={SECTION_LABEL}>Bodies</span>
                    <div
                      style={{
                        display:       "flex",
                        flexDirection: "column",
                        gap:           28,
                        marginTop:     12,
                      }}
                    >
                      {detailHousePlanets.map((planet) => {
                        const planetSign    = planet.sign ?? attachment.data.sign;
                        const note          = getPlanetNote(planet.name, planetSign, attachment.data.number);
                        const planetAspects = detailHouseAspects.filter(
                          (a) => a.bodyA === planet.name || a.bodyB === planet.name,
                        );
                        return (
                          <div key={planet.name}>

                            {/* Planet in Sign */}
                            <div
                              style={{
                                fontFamily:   "EB Garamond, Georgia, serif",
                                fontSize:     16,
                                color:        "#E2E4EA",
                                marginBottom: 8,
                              }}
                            >
                              {planet.name} in {planetSign}
                            </div>

                            {/* Planet note */}
                            <p
                              style={{
                                fontSize:   12,
                                fontFamily: "system-ui, -apple-system, sans-serif",
                                color:      "#8B909C",
                                lineHeight: 1.65,
                                margin:     0,
                              }}
                            >
                              {note}
                            </p>

                            {/* Aspect bullets */}
                            {planetAspects.map((aspect, idx) => {
                              const other      = aspect.bodyA === planet.name ? aspect.bodyB : aspect.bodyA;
                              const otherSym   = PLANET_SYMBOLS[other] ?? other.slice(0, 2);
                              const typeLabel  = aspect.type.charAt(0).toUpperCase() + aspect.type.slice(1);
                              const hardType   = aspect.type as "conjunction" | "opposition" | "square";
                              const aspectNote = getAspectNote(planet.name, hardType, other);
                              return (
                                <div key={idx} style={{ marginTop: 16 }}>
                                  <div
                                    style={{
                                      display:      "flex",
                                      alignItems:   "center",
                                      gap:          6,
                                      marginBottom: 6,
                                    }}
                                  >
                                    <AspectLineSwatch type={hardType} />
                                    <span style={{ color: "#C8A96E", fontSize: 13 }}>
                                      {otherSym}
                                    </span>
                                    <span
                                      style={{
                                        fontSize:      11,
                                        fontFamily:    "system-ui, -apple-system, sans-serif",
                                        letterSpacing: "0.06em",
                                        textTransform: "uppercase",
                                        color:         "#8B909C",
                                      }}
                                    >
                                      {typeLabel} with {other}
                                    </span>
                                  </div>
                                  <p
                                    style={{
                                      fontSize:   12,
                                      fontFamily: "system-ui, -apple-system, sans-serif",
                                      color:      "#8B909C",
                                      lineHeight: 1.65,
                                      margin:     0,
                                    }}
                                  >
                                    {aspectNote}
                                  </p>
                                </div>
                              );
                            })}

                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>

            ) : (
              /* ── Configuration branch ─────────────────────────────────── */
              (() => {
                const { data: config } = attachment;
                const subtitle  = configSubtitle(config, planetSignMap, planetHouseMap);
                const reading   = getConfigurationReading(config.type, config.planets, config.focalPlanet);
                const groupings = configGroupings(config, planetDegreeMap);
                return (
                  <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px 32px" }}>

                    {/* Title */}
                    <div
                      style={{
                        fontFamily:   "EB Garamond, Georgia, serif",
                        fontSize:     22,
                        color:        "#E2E4EA",
                        marginBottom: subtitle ? 4 : 20,
                      }}
                    >
                      {config.label}
                    </div>

                    {/* Subtitle */}
                    {subtitle && (
                      <div
                        style={{
                          fontSize:     12,
                          color:        "#8B909C",
                          fontFamily:   "system-ui, -apple-system, sans-serif",
                          marginBottom: 20,
                        }}
                      >
                        {subtitle}
                      </div>
                    )}

                    {/* Divider */}
                    <div
                      style={{
                        borderBottom: "0.5px solid rgba(255,255,255,0.06)",
                        marginBottom: 24,
                      }}
                    />

                    {/* READING section */}
                    <div style={{ marginBottom: 32 }}>
                      <span style={SECTION_LABEL}>Reading</span>
                      <p
                        style={{
                          fontFamily: "EB Garamond, Georgia, serif",
                          fontStyle:  "italic",
                          fontSize:   15,
                          color:      "#C8A96E",
                          margin:     "8px 0 0",
                          lineHeight: 1.8,
                        }}
                      >
                        {reading}
                      </p>
                    </div>

                    {/* BODIES section */}
                    <div>
                      <span style={SECTION_LABEL}>Bodies</span>
                      <div
                        style={{
                          display:       "flex",
                          flexDirection: "column",
                          gap:           28,
                          marginTop:     12,
                        }}
                      >
                        {groupings.map((group, idx) => {
                          const note = getParticipantNote(group.planets, group.role, config.type);
                          return (
                            <div key={idx}>
                              <div
                                style={{
                                  fontFamily:   "EB Garamond, Georgia, serif",
                                  fontSize:     16,
                                  color:        "#E2E4EA",
                                  marginBottom: 8,
                                }}
                              >
                                {group.titleText}
                              </div>
                              <p
                                style={{
                                  fontSize:   12,
                                  fontFamily: "system-ui, -apple-system, sans-serif",
                                  color:      "#8B909C",
                                  lineHeight: 1.65,
                                  margin:     0,
                                }}
                              >
                                {note}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                );
              })()
            )}

          </GlassPanel>
        </div>
      )}

      {/* ── Transit removal warning ──────────────────────────────────────── */}
      {showRemoveWarning && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Remove transit confirmation"
          onClick={() => setShowRemoveWarning(false)}
          style={{
            position:       "fixed",
            inset:          0,
            zIndex:         60,
            background:     "rgba(0,0,0,0.6)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            padding:        "0 24px",
          }}
        >
          <GlassPanel
            onClick={(e) => e.stopPropagation()}
            style={{
              width:     "90%",
              maxWidth:  360,
              padding:   "28px 24px",
              boxSizing: "border-box",
            }}
          >
            {/* Title */}
            <h2
              style={{
                fontFamily:    "EB Garamond, Georgia, serif",
                fontSize:      20,
                fontWeight:    400,
                color:         "#E2E4EA",
                margin:        "0 0 10px",
                letterSpacing: "0.01em",
                lineHeight:    1.2,
              }}
            >
              Remove this transit?
            </h2>

            {/* Body */}
            <p
              style={{
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontSize:   13,
                color:      "#8B909C",
                margin:     "0 0 24px",
                lineHeight: 1.6,
              }}
            >
              If this transit passes before you attach it again, it will be gone from the feed.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              {/* Cancel */}
              <button
                onClick={() => setShowRemoveWarning(false)}
                style={{
                  padding:       "10px 20px",
                  background:    "none",
                  border:        "0.5px solid rgba(255,255,255,0.12)",
                  borderRadius:  5,
                  color:         "#8B909C",
                  fontSize:      12,
                  fontWeight:    500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor:        "pointer",
                  fontFamily:    "inherit",
                  transition:    "border-color 280ms ease-out, color 280ms ease-out",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.30)";
                  (e.currentTarget as HTMLElement).style.color       = "#E2E4EA";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)";
                  (e.currentTarget as HTMLElement).style.color       = "#8B909C";
                }}
              >
                Cancel
              </button>

              {/* Remove */}
              <button
                onClick={() => {
                  setShowRemoveWarning(false);
                  onRemove();
                }}
                style={{
                  padding:       "10px 20px",
                  background:    "rgba(200,169,110,0.10)",
                  border:        "0.5px solid #C8A96E",
                  borderTop:     "0.5px solid rgba(200,169,110,0.55)",
                  borderRadius:  5,
                  color:         "#E8D8A8",
                  fontSize:      12,
                  fontWeight:    500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor:        "pointer",
                  fontFamily:    "inherit",
                  transition:    "background 280ms ease-out",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(200,169,110,0.18)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(200,169,110,0.10)";
                }}
              >
                Remove
              </button>
            </div>
          </GlassPanel>
        </div>
      )}
    </>
  );
}
