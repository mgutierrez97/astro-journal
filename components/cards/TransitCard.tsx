"use client";

import GlassPanel from "@/components/ui/GlassPanel";
import { getTransitDescription } from "@/lib/transitCopy";

export interface TransitEvent {
  id: string;
  planet: string;
  aspect: string;
  targetPlanet?: string; // e.g. "Neptune" for planet-to-planet transits
  transitType:
    | "conjunction" | "trine" | "square" | "opposition" | "sextile"
    | "ingress"
    | "station-retrograde" | "station-direct"
    | "eclipse-solar" | "eclipse-lunar"
    | "new-moon" | "full-moon";
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
  /** When true, renders a faint gold border-top even in resting state. */
  isSpecialEvent?: boolean;
  active?: boolean;
  onClick?: () => void;
}

// ─── Timing indicator ─────────────────────────────────────────────────────────
//
//  0 days  → green dot  + "Today"
//  1 day   → amber dot  + "Tomorrow"
//  2–14    → amber dot  + "In X days"
//  15+     → no dot     + "In X weeks"  (floor, min 2)

const GREEN = "#3EB489";
const AMBER = "#C9933A";
const DIM   = "#8B909C";

interface TimingIndicator {
  dot:   string | null; // hex color, or null for no dot
  text:  string;
  color: string;
}

function daysUntilPeak(peakDate: Date): number {
  const now     = new Date();
  const todayMs = Date.UTC(now.getFullYear(),      now.getMonth(),      now.getDate());
  const peakMs  = Date.UTC(peakDate.getFullYear(), peakDate.getMonth(), peakDate.getDate());
  return Math.round((peakMs - todayMs) / 86_400_000);
}

function timingIndicator(peakDate: Date): TimingIndicator {
  const days = daysUntilPeak(peakDate);

  if (days <= 0)  return { dot: GREEN, text: "Today",           color: GREEN };
  if (days === 1) return { dot: AMBER, text: "Tomorrow",        color: AMBER };
  if (days <= 14) return { dot: AMBER, text: `In ${days} days`, color: AMBER };

  const weeks = Math.max(2, Math.floor(days / 7));
  return { dot: null, text: `In ${weeks} weeks`, color: DIM };
}

function formatPeakDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function TransitCard({
  event,
  isSpecialEvent = false,
  active = false,
  onClick,
}: TransitCardProps) {
  const timing      = timingIndicator(event.peakDate);
  const description = getTransitDescription(event, event.house);

  // Special event cards show a faint gold border-top even when not selected.
  // Selected cards get the full gold border-top via GlassPanel's active prop.
  const specialEventStyle: React.CSSProperties =
    isSpecialEvent && !active
      ? { borderTop: "0.5px solid rgba(200,169,110,0.28)" }
      : {};

  return (
    <GlassPanel
      active={active}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      style={{
        cursor:     "pointer",
        padding:    "14px 16px",
        animation:  "cardEnter 380ms ease-out",
        transition: "border-top-color 380ms ease-out",
        userSelect: "none",
        ...specialEventStyle,
      }}
    >
      {/* Row 1 — timing indicator (left) · peak date (right) */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {timing.dot && (
            <span
              style={{
                display:         "inline-block",
                width:           6,
                height:          6,
                borderRadius:    "50%",
                backgroundColor: timing.dot,
                flexShrink:      0,
              }}
            />
          )}
          <span
            style={{
              fontSize:      10,
              fontWeight:    500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color:         timing.color,
            }}
          >
            {timing.text}
          </span>
        </div>
        <span style={{ fontSize: 12, color: "#8B909C" }}>
          Peak {formatPeakDate(event.peakDate)}
        </span>
      </div>

      {/* Row 2 — title */}
      <h3
        style={{
          fontFamily:   "EB Garamond, Georgia, serif",
          fontSize:     17,
          fontWeight:   400,
          color:        "#E2E4EA",
          lineHeight:   1.3,
          marginBottom: 6,
        }}
      >
        {event.title}
      </h3>

      {/* Row 3 — house (conditional, only when birth data present) */}
      {event.house != null && (
        <p
          style={{
            fontSize:     12,
            color:        "#8B909C",
            marginBottom: 6,
          }}
        >
          House {event.house}
        </p>
      )}

      {/* Row 4 — description (conditional) */}
      {description && (
        <p
          style={{
            fontSize:   12,
            color:      "#8B909C",
            lineHeight: 1.55,
            margin:     0,
          }}
        >
          {description}
        </p>
      )}
    </GlassPanel>
  );
}
