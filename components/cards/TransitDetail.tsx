"use client";

import GlassPanel from "@/components/ui/GlassPanel";
import { type TransitEvent } from "@/components/cards/TransitCard";

// Placeholder interpretation copy, keyed by transit type.
// EB Garamond italic + gold — the "meaning layer" per design spec.
const INTERPRETATIONS: Record<TransitEvent["transitType"], string> = {
  conjunction: "Two planets occupy the same degree — their energies compress into a single point. Whatever themes each body rules become inseparable for this period. What seeds are you willing to plant here, knowing they carry unusual weight?",
  trine: "An easy current flows between these two planetary bodies. Their natures are compatible, and what you build under this configuration tends to hold. The work is not to force it — the work is to show up.",
  square: "Friction as teacher. The square asks you to hold two sets of needs that resist each other simultaneously. The tension is not an obstacle to the work — the tension is the work. Something is being forged.",
  opposition: "A mirror appears between two parts of your chart. Something that has been operating quietly in the background insists on being seen. Both sides carry truth. The task is integration, not choosing.",
  sextile: "A quiet opening. Compatible energies extend an invitation they will not press. The opportunity is real but requires your participation to activate. What would you do if the path were actually clear?",
  ingress: "A planet crossing a sign boundary marks a distinct shift in the quality of its expression. The themes of the incoming sign become the new medium. This is less an event than a change in atmosphere.",
};

const STATUS_STYLE: Record<TransitEvent["status"], { color: string; label: string }> = {
  active:      { color: "#3EB489", label: "Active now" },
  approaching: { color: "#C9933A", label: "Approaching" },
  separating:  { color: "#8B909C", label: "Separating" },
};

function formatPeakDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZoneName: "short",
  });
}

interface TransitDetailProps {
  event: TransitEvent;
  onBack: () => void;
}

export default function TransitDetail({ event, onBack }: TransitDetailProps) {
  const status = STATUS_STYLE[event.status];
  const interp = INTERPRETATIONS[event.transitType];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Ghost back button — no border, tertiary text per CTA hierarchy */}
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
          ← Back to feed
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 28px" }}>

        {/* Status badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: status.color,
              boxShadow: `0 0 7px ${status.color}`,
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: status.color,
            }}
          >
            {status.label}
          </span>
        </div>

        {/* Heading — EB Garamond, the event title */}
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
          {event.title}
        </h2>

        {/* Aspect type label */}
        <span
          style={{
            display: "block",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#C8A96E",
            marginBottom: event.themes ? 10 : 20,
          }}
        >
          {event.aspect}
        </span>

        {/* Themes — EB Garamond italic, gold */}
        {event.themes && (
          <p
            style={{
              fontFamily: "EB Garamond, Georgia, serif",
              fontStyle: "italic",
              fontSize: 14,
              color: "#C8A96E",
              marginBottom: 20,
              lineHeight: 1.5,
            }}
          >
            {event.themes}
          </p>
        )}

        {/* Data grid */}
        <GlassPanel style={{ padding: "12px 14px", marginBottom: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <DataRow label="Peak" value={formatPeakDate(event.peakDate)} />
            <DataRow label="Orb window" value="±3° · ~5 days" />
            <DataRow label="Duration" value="~10 days total" />
            {event.targetPlanet && (
              <DataRow label="Planets" value={`${event.planet} · ${event.targetPlanet}`} />
            )}
          </div>
        </GlassPanel>

        {/* General Interpretation — the meaning layer */}
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
            General Interpretation
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

        {/* Primary CTA — gold tint bg + gold border + top highlight */}
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
          Reflect on this transit
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
