"use client";

import GlassPanel from "@/components/ui/GlassPanel";
import StatusDot from "@/components/ui/StatusDot";

export interface TransitEvent {
  id: string;
  planet: string;
  aspect: string;
  targetPlanet?: string; // e.g. "Neptune" for planet-to-planet transits
  transitType: "conjunction" | "trine" | "square" | "opposition" | "sextile" | "ingress";
  peakDate: Date;
  house?: number; // present if birth data available
  /** Short descriptor, e.g. "Mercury enters Aries" */
  title: string;
  /** Theme words, e.g. "clarity · boundaries · revision" */
  themes?: string;
  status: "active" | "approaching" | "separating";
}

interface TransitCardProps {
  event: TransitEvent;
  active?: boolean;
  onClick?: () => void;
}

const STATUS_LABELS: Record<TransitEvent["status"], string> = {
  active: "active",
  approaching: "approaching",
  separating: "separating",
};

const STATUS_COLORS: Record<TransitEvent["status"], "green" | "amber" | "red"> = {
  active: "green",
  approaching: "amber",
  separating: "red",
};

function formatPeakDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function TransitCard({ event, active = false, onClick }: TransitCardProps) {
  return (
    <GlassPanel
      active={active}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      style={{
        cursor: "pointer",
        padding: "14px 16px",
        animation: "cardEnter 380ms ease-out",
        transition: "border-top-color 380ms ease-out",
        userSelect: "none",
      }}
    >
      {/* Header row: planet + status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <StatusDot color={STATUS_COLORS[event.status]} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#4A5060",
            }}
          >
            {STATUS_LABELS[event.status]}
          </span>
        </div>
        {event.house && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#C8A96E",
            }}
          >
            House {event.house}
          </span>
        )}
      </div>

      {/* Title */}
      <h3
        style={{
          fontFamily: "EB Garamond, Georgia, serif",
          fontSize: 17,
          fontWeight: 400,
          color: "#E2E4EA",
          lineHeight: 1.3,
          marginBottom: 4,
        }}
      >
        {event.title}
      </h3>

      {/* Themes */}
      {event.themes && (
        <p
          style={{
            fontFamily: "EB Garamond, Georgia, serif",
            fontSize: 13,
            fontStyle: "italic",
            color: "#C8A96E",
            marginBottom: 8,
            lineHeight: 1.4,
          }}
        >
          {event.themes}
        </p>
      )}

      {/* Footer: peak date + aspect */}
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 11, color: "#8B909C" }}>
          Peak {formatPeakDate(event.peakDate)}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#4A5060",
          }}
        >
          {event.aspect}
        </span>
      </div>
    </GlassPanel>
  );
}
