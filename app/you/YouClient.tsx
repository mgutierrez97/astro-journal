"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import GlassPanel from "@/components/ui/GlassPanel";
import BirthDataCard from "@/components/ui/BirthDataCard";
import { BIRTH_DATA_KEY, type StoredBirthData } from "@/components/ui/BirthDataCard";
import BottomNav from "@/components/ui/BottomNav";
import NatalPlanetDetail from "@/components/cards/NatalPlanetDetail";
import {
  calculateNatalChart,
  birthDataToDate,
  SIGN_KEYWORDS,
  type NatalChart,
  type NatalPlanet,
} from "@/lib/natal";
import { APP_NAME } from "@/lib/config";

// SolarSystem is canvas-only — no SSR
const SolarSystem = dynamic(() => import("@/components/cosmic/SolarSystem"), {
  ssr: false,
  loading: () => <div style={{ width: "100%", height: "100%", background: "#0D1117" }} />,
});

// ─── Big 3 ───────────────────────────────────────────────────────────────────

const BIG_3_META = [
  { key: "Sun",     label: "Sun",     symbol: "☉" },
  { key: "Moon",    label: "Moon",    symbol: "☽" },
  { key: "Rising",  label: "Rising",  symbol: "↑" },
] as const;

interface Big3CardProps {
  symbol: string;
  label: string;
  sign: string;
  keyword: string;
}

function Big3Card({ symbol, label, sign, keyword }: Big3CardProps) {
  return (
    <GlassPanel style={{ padding: "12px 10px", flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span
            style={{
              fontFamily: "EB Garamond, Georgia, serif",
              fontSize: 16,
              color: "#C8A96E",
              lineHeight: 1,
            }}
          >
            {symbol}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#4A5060",
            }}
          >
            {label}
          </span>
        </div>
        <span
          style={{
            fontFamily: "EB Garamond, Georgia, serif",
            fontSize: 16,
            fontWeight: 400,
            color: "#E2E4EA",
            lineHeight: 1.2,
          }}
        >
          {sign}
        </span>
        <span
          style={{
            fontSize: 9,
            color: "#4A5060",
            fontStyle: "italic",
            lineHeight: 1.4,
          }}
        >
          {keyword.split(" · ")[0]}
        </span>
      </div>
    </GlassPanel>
  );
}

// ─── Planet card ──────────────────────────────────────────────────────────────

interface PlanetCardProps {
  planet: NatalPlanet;
  active: boolean;
  onClick: () => void;
}

function PlanetCard({ planet, active, onClick }: PlanetCardProps) {
  return (
    <GlassPanel
      active={active}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      style={{
        padding: "11px 12px",
        cursor: "pointer",
        transition: "border-top-color 380ms ease-out",
        userSelect: "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
            <span
              style={{
                fontFamily: "EB Garamond, Georgia, serif",
                fontSize: 14,
                color: active ? "#C8A96E" : "#8B909C",
                lineHeight: 1,
                transition: "color 380ms ease-out",
              }}
            >
              {planet.symbol}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: active ? "#C8A96E" : "#4A5060",
                transition: "color 380ms ease-out",
              }}
            >
              {planet.name}
            </span>
          </div>
          <span
            style={{
              fontFamily: "EB Garamond, Georgia, serif",
              fontSize: 14,
              color: "#E2E4EA",
              display: "block",
            }}
          >
            {planet.sign}
            {planet.retrograde && (
              <span style={{ fontSize: 10, color: "#8B909C", marginLeft: 3 }}>℞</span>
            )}
          </span>
        </div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#4A5060",
            marginTop: 2,
          }}
        >
          H{planet.house}
        </span>
      </div>
    </GlassPanel>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function YouClient() {
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [activePlanetName, setActivePlanetName] = useState<string | null>(null);

  useEffect(() => {
    function calcFromStorage() {
      try {
        const raw = localStorage.getItem(BIRTH_DATA_KEY);
        if (raw) {
          const s = JSON.parse(raw) as StoredBirthData;
          const date = birthDataToDate(s.birthDate, s.birthTime, s.timezone);
          setChart(calculateNatalChart(date, s.latitude, s.longitude));
        } else {
          setChart(calculateNatalChart()); // hardcoded dev defaults
        }
      } catch (e) {
        console.error("Failed to calculate natal chart:", e);
        setChart(calculateNatalChart());
      }
    }
    calcFromStorage();
    window.addEventListener("birth-data-updated", calcFromStorage);
    return () => window.removeEventListener("birth-data-updated", calcFromStorage);
  }, []);

  const activePlanet = chart?.planets.find((p) => p.name === activePlanetName) ?? null;

  const handleCardClick = (name: string) => {
    setActivePlanetName((prev) => (prev === name ? null : name));
  };

  const sunPlanet  = chart?.planets.find((p) => p.name === "Sun");
  const moonPlanet = chart?.planets.find((p) => p.name === "Moon");

  // Panel content (shared between desktop + mobile)
  const ChartListContent = chart ? (
    <>
      {/* Birth data card */}
      <div style={{ padding: "16px 4px 12px" }}>
        <BirthDataCard />
      </div>

      {/* Big 3 */}
      <div style={{ marginBottom: 8 }}>
        <span
          style={{
            display: "block",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#4A5060",
            marginBottom: 8,
          }}
        >
          Big 3
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <Big3Card
            symbol="☉"
            label="Sun"
            sign={sunPlanet?.sign ?? "—"}
            keyword={SIGN_KEYWORDS[sunPlanet?.sign ?? ""] ?? ""}
          />
          <Big3Card
            symbol="☽"
            label="Moon"
            sign={moonPlanet?.sign ?? "—"}
            keyword={SIGN_KEYWORDS[moonPlanet?.sign ?? ""] ?? ""}
          />
          <Big3Card
            symbol="↑"
            label="Rising"
            sign={chart.ascSign}
            keyword={SIGN_KEYWORDS[chart.ascSign] ?? ""}
          />
        </div>
      </div>

      {/* Planet grid */}
      <div style={{ marginBottom: 8, marginTop: 16 }}>
        <span
          style={{
            display: "block",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#4A5060",
            marginBottom: 8,
          }}
        >
          Natal Placements
        </span>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
          }}
        >
          {chart.planets.map((planet) => (
            <PlanetCard
              key={planet.name}
              planet={planet}
              active={activePlanetName === planet.name}
              onClick={() => handleCardClick(planet.name)}
            />
          ))}
        </div>
      </div>
    </>
  ) : (
    <div style={{ padding: "32px 20px", textAlign: "center" }}>
      <span
        style={{
          fontFamily: "EB Garamond, serif",
          fontStyle: "italic",
          fontSize: 14,
          color: "#4A5060",
        }}
      >
        Calculating chart…
      </span>
    </div>
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100dvh",
        overflow: "hidden",
        background: "#0D1117",
      }}
    >
      {/* Full-bleed cosmic background */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <SolarSystem focusedPlanet={activePlanetName} />
      </div>

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(13,17,23,0.55) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Desktop top nav */}
      <header
        className="hidden md:flex"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: "0 24px",
          height: 52,
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "0.5px solid rgba(255,255,255,0.06)",
          background: "rgba(13,17,23,0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <span
          style={{
            fontFamily: "EB Garamond, Georgia, serif",
            fontSize: 16,
            fontWeight: 500,
            color: "#E2E4EA",
            letterSpacing: "0.02em",
          }}
        >
          {APP_NAME}
        </span>
        <nav className="flex items-center gap-6">
          {["Feed", "You", "Journal", "Settings"].map((tab) => (
            <Link
              key={tab}
              href={tab === "Feed" ? "/" : `/${tab.toLowerCase()}`}
              style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: tab === "You" ? "#C8A96E" : "#4A5060",
                textDecoration: "none",
                transition: "color 380ms ease-out",
              }}
            >
              {tab}
            </Link>
          ))}
        </nav>
      </header>

      {/* Desktop left panel — card list ↔ detail crossfade */}
      <div
        className="hidden md:block"
        style={{
          position: "absolute",
          top: 52,
          left: 0,
          bottom: 0,
          width: 320,
          zIndex: 9,
          borderRight: "0.5px solid rgba(255,255,255,0.06)",
          background: "rgba(6,8,14,0.45)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          overflow: "hidden",
        }}
      >
        {/* Chart list */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflowY: "auto",
            padding: "0 16px 24px",
            opacity: activePlanet ? 0 : 1,
            transform: activePlanet ? "translateX(-16px)" : "translateX(0)",
            transition: "opacity 480ms ease-in-out, transform 480ms ease-in-out",
            pointerEvents: activePlanet ? "none" : "auto",
          }}
        >
          {ChartListContent}
        </div>

        {/* Planet detail */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: activePlanet ? 1 : 0,
            transform: activePlanet ? "translateX(0)" : "translateX(16px)",
            transition: "opacity 480ms ease-in-out, transform 480ms ease-in-out",
            pointerEvents: activePlanet ? "auto" : "none",
          }}
        >
          {activePlanet && (
            <NatalPlanetDetail
              planet={activePlanet}
              onBack={() => setActivePlanetName(null)}
            />
          )}
        </div>
      </div>

      {/* Mobile header — app name */}
      <div
        className="md:hidden"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: "14px 16px 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontFamily: "EB Garamond, Georgia, serif",
              fontSize: 22,
              fontWeight: 400,
              color: "#E2E4EA",
            }}
          >
            {APP_NAME}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#4A5060",
            }}
          >
            You
          </span>
        </div>
      </div>

      {/* Mobile aside — chart list ↔ detail */}
      <aside
        className="md:hidden"
        style={{
          position: "absolute",
          zIndex: 10,
          bottom: 72,
          left: 0,
          right: 0,
          maxHeight: activePlanet ? "78vh" : "60vh",
          overflow: "hidden",
          transition: "max-height 480ms ease-in-out",
        }}
      >
        {/* Chart list */}
        <div
          style={{
            position: activePlanet ? "absolute" : "relative",
            inset: 0,
            overflowY: "auto",
            padding: "0 16px 16px",
            opacity: activePlanet ? 0 : 1,
            transform: activePlanet ? "translateX(-16px)" : "translateX(0)",
            transition: "opacity 480ms ease-in-out, transform 480ms ease-in-out",
            pointerEvents: activePlanet ? "none" : "auto",
          }}
        >
          {ChartListContent}
        </div>

        {/* Planet detail */}
        {activePlanet && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 1,
              background: "rgba(6,8,14,0.72)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderTop: "0.5px solid rgba(255,255,255,0.08)",
              borderRadius: "7px 7px 0 0",
            }}
          >
            <NatalPlanetDetail
              planet={activePlanet}
              onBack={() => setActivePlanetName(null)}
            />
          </div>
        )}
      </aside>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
