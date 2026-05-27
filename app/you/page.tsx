"use client";

import { useEffect, useRef, useState } from "react";
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

// ─── ChevronDown ─────────────────────────────────────────────────────────────

function ChevronDown() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M3 5L7 9L11 5"
        stroke="#4A5060"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── HouseCard ────────────────────────────────────────────────────────────────

interface HouseCardProps {
  n:        number;
  sign:     string;
  planets:  NatalPlanet[];
  isActive: boolean;
  onTap:    () => void;
  setRef:   (el: HTMLDivElement | null) => void;
}

function HouseCard({
  n, sign, planets, isActive, onTap, setRef,
}: HouseCardProps) {
  return (
    // Wrapper fills full grid-cell height so cards in the same row stay equal height
    <div ref={setRef} style={{ display: "flex", flexDirection: "column" }}>
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
          <ChevronDown />
        </div>

        {/* Row 2 — planet names */}
        {planets.length > 0 ? (
          <span
            style={{
              fontSize:   12,
              color:      "#8B909C",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            {planets.map((p) => p.name).join(", ")}
          </span>
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

// ─── WheelPanel ───────────────────────────────────────────────────────────────
// Left-column content: wheel + Big 3 + placeholder button.

interface WheelPanelProps {
  wheelSize:   number;
  wheelHouses: Parameters<typeof NatalWheel>[0]["houses"];
  wheelPlanets: Parameters<typeof NatalWheel>[0]["planets"];
  activeHouse: number | undefined;
  sunSign:     string;
  moonSign:    string;
  risingSign:  string;
}

function WheelPanel({
  wheelSize, wheelHouses, wheelPlanets, activeHouse,
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
        aspects={[]}
        activeHouse={activeHouse}
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
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

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
    // Mobile: after re-render, scroll the previously-expanded card back into view
    setTimeout(() => {
      if (prev !== undefined && cardRefs.current[prev]) {
        cardRefs.current[prev]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 50);
  }

  // ── Shared JSX blocks ────────────────────────────────────────────────────

  const wheelPanelProps: WheelPanelProps = {
    wheelHouses,
    wheelPlanets,
    activeHouse,
    sunSign,
    moonSign,
    risingSign,
    wheelSize: 320, // overridden per context
  };

  const houseCards = (
    <div
      style={{
        display:             "grid",
        gridTemplateColumns: "1fr 1fr",
        gap:                 "1px",    // hairline separator between columns
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
          onTap={() => handleCardTap(n)}
          setRef={(el) => { cardRefs.current[n] = el; }}
        />
      ))}
    </div>
  );

  const placeholderState = (
    <div
      style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "48px 24px",
        gap:            24,
        minHeight:      300,
      }}
    >
      <p
        style={{
          fontFamily: "EB Garamond, Georgia, serif",
          fontStyle:  "italic",
          fontSize:   16,
          color:      "#8B909C",
          textAlign:  "center",
          margin:     0,
          lineHeight: 1.6,
          maxWidth:   280,
        }}
      >
        Your chart awaits. A birth moment is all it needs.
      </p>
      <div style={{ width: "100%", maxWidth: 320 }}>
        <BirthDataCard />
      </div>
    </div>
  );

  const rightPanelContent = hasData ? houseCards : placeholderState;

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

      {/* Desktop top nav */}
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

      {/* ── Desktop (≥768px) ──────────────────────────────────────────────── */}
      <div
        className="hidden md:flex"
        style={{ height: "100vh", paddingTop: 52 }}
      >
        {/* Left column — fixed, centered vertically */}
        <div
          style={{
            width:               "42%",
            height:              "100vh",
            position:            "sticky",
            top:                 0,
            flexShrink:          0,
            display:             "flex",
            flexDirection:       "column",
            alignItems:          "center",
            justifyContent:      "center",
            padding:             "32px",
            overflowY:           "auto",
            borderRight:         "0.5px solid rgba(255,255,255,0.06)",
            background:          "rgba(6,8,14,0.45)",
            backdropFilter:      "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <WheelPanel {...wheelPanelProps} wheelSize={320} />
        </div>

        {/* Right column — independent scroll, crossfade between views */}
        <div
          style={{
            flex:     1,
            height:   "100vh",
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
              paddingBottom: 72, // breathing room below last row (≈ nav height)
              opacity:       expandedHouse ? 0 : 1,
              transform:     expandedHouse ? "translateX(-12px)" : "translateX(0)",
              transition:    "opacity 480ms ease-in-out, transform 480ms ease-in-out",
              pointerEvents: expandedHouse ? "none" : "auto",
            }}
          >
            {rightPanelContent}
          </div>

          {/* Expanded detail */}
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
        </div>
      </div>

      {/* ── Mobile (<768px) ───────────────────────────────────────────────── */}
      <div
        className="md:hidden"
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 72, zIndex: 10, overflowY: "auto" }}
      >
        {expandedHouse && expanded ? (
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
            {rightPanelContent}
          </div>
        )}
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
