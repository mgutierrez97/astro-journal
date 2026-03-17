"use client";

import GlassPanel from "@/components/ui/GlassPanel";
import { type NatalPlanet, PLANET_INTERPRETATIONS, SIGN_KEYWORDS } from "@/lib/natal";

const ORDINAL = ["", "1st", "2nd", "3rd", "4th", "5th", "6th",
                 "7th", "8th", "9th", "10th", "11th", "12th"];

interface NatalPlanetDetailProps {
  planet: NatalPlanet;
  onBack: () => void;
}

export default function NatalPlanetDetail({ planet, onBack }: NatalPlanetDetailProps) {
  const interp = PLANET_INTERPRETATIONS[planet.name] ?? "Interpretation coming soon.";
  const keyword = SIGN_KEYWORDS[planet.sign] ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Ghost back button */}
      <div style={{ padding: "14px 20px 0", flexShrink: 0 }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            color: "#4A5060",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "4px 0",
            transition: "color 280ms ease-out",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#8B909C"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#4A5060"; }}
        >
          ← Back to chart
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 28px" }}>

        {/* Planet symbol — large, decorative */}
        <div
          style={{
            fontFamily: "EB Garamond, Georgia, serif",
            fontSize: 32,
            color: "#C8A96E",
            marginBottom: 8,
            lineHeight: 1,
          }}
        >
          {planet.symbol}
        </div>

        {/* Heading: Planet in Sign */}
        <h2
          style={{
            fontFamily: "EB Garamond, Georgia, serif",
            fontSize: 26,
            fontWeight: 400,
            color: "#E2E4EA",
            lineHeight: 1.2,
            margin: "0 0 4px",
            letterSpacing: "0.01em",
          }}
        >
          {planet.name} in {planet.sign}
        </h2>

        {/* House + retrograde */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#C8A96E",
            }}
          >
            {ORDINAL[planet.house]} House
          </span>
          {planet.retrograde && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#8B909C",
              }}
            >
              Retrograde ℞
            </span>
          )}
        </div>

        {/* Sign keyword */}
        {keyword && (
          <p
            style={{
              fontFamily: "EB Garamond, Georgia, serif",
              fontStyle: "italic",
              fontSize: 13,
              color: "#C8A96E",
              marginBottom: 20,
              lineHeight: 1.5,
            }}
          >
            {keyword}
          </p>
        )}

        {/* Data grid */}
        <GlassPanel style={{ padding: "12px 14px", marginBottom: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <DataRow label="Planet"  value={planet.name} />
            <DataRow label="Sign"    value={`${planet.sign} ${planet.signDegree}°`} />
            <DataRow label="House"   value={`${ORDINAL[planet.house]} (Placidus)`} />
            <DataRow label="Motion"  value={planet.retrograde ? "Retrograde ℞" : "Direct"} />
          </div>
        </GlassPanel>

        {/* Natal interpretation */}
        <div style={{ marginBottom: 28 }}>
          <span
            style={{
              display: "block",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#4A5060",
              marginBottom: 12,
            }}
          >
            Natal Placement
          </span>
          <p
            style={{
              fontFamily: "EB Garamond, Georgia, serif",
              fontStyle: "italic",
              fontSize: 16,
              color: "#C8A96E",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {interp}
          </p>
        </div>

        {/* Reflect CTA — gold primary per CLAUDE.md */}
        <button
          style={{
            width: "100%",
            padding: "13px 20px",
            background: "rgba(200,169,110,0.10)",
            border: "0.5px solid #C8A96E",
            borderTop: "0.5px solid rgba(255,220,160,0.55)",
            borderRadius: 7,
            color: "#E8D8A8",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "background 280ms ease-out",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(200,169,110,0.18)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(200,169,110,0.10)";
          }}
        >
          Reflect on this placement
        </button>
      </div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#4A5060",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 12, color: "#8B909C", textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}
