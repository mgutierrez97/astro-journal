"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PenLine } from "lucide-react";
import GlassPanel from "@/components/ui/GlassPanel";
import BottomNav from "@/components/ui/BottomNav";
import { useJournalEntries } from "@/lib/journal";

import TopNav from "@/components/ui/TopNav";

// ─── Date / time helpers ──────────────────────────────────────────────────────

const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDateTime(date: Date): string {
  const weekday  = WEEKDAYS[date.getDay()];
  const month    = MONTHS[date.getMonth()];
  const day      = date.getDate();
  const raw      = date.getHours();
  const minutes  = String(date.getMinutes()).padStart(2, "0");
  const amPm     = raw >= 12 ? "PM" : "AM";
  const hours    = raw % 12 || 12;
  return `${weekday}, ${month} ${day} · ${hours}:${minutes} ${amPm}`;
}

/** Formats updated_at ISO string as "Jun 2 · 9:41 AM" */
function formatUpdatedAt(iso: string): string {
  const d       = new Date(iso);
  const month   = MONTHS_SHORT[d.getMonth()];
  const day     = d.getDate();
  const raw     = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const amPm    = raw >= 12 ? "PM" : "AM";
  const hours   = raw % 12 || 12;
  return `${month} ${day} · ${hours}:${minutes} ${amPm}`;
}

/**
 * Returns a short label derived from context_data:
 *   transit       → inner TransitEvent title
 *   house         → "H3: Mind"
 *   configuration → "T-Square · Moon" (label · focalPlanet if present)
 */
function getCardAttachmentLabel(
  contextData: Record<string, unknown> | undefined
): string | null {
  if (!contextData) return null;

  if ("transit" in contextData) {
    const scored = contextData.transit as { transit?: { title?: string } };
    return scored?.transit?.title ?? null;
  }
  if ("house" in contextData) {
    const house = contextData.house as { number?: number; domainWord?: string };
    if (house?.number == null || !house.domainWord) return null;
    return `H${house.number}: ${house.domainWord}`;
  }
  if ("configuration" in contextData) {
    const config = contextData.configuration as { label?: string; focalPlanet?: string | null };
    if (!config?.label) return null;
    return config.focalPlanet ? `${config.label} · ${config.focalPlanet}` : config.label;
  }
  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JournalPage() {
  const router          = useRouter();
  const { entries }     = useJournalEntries();
  const [now, setNow]       = useState<Date | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Hydrate client-side and tick every minute
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const reversed = Array.from(entries).reverse();

  return (
    <div
      style={{
        position:        "relative",
        minHeight:       "100dvh",
        background:      "#0D1117",
        display:         "flex",
        flexDirection:   "column",
      }}
    >

      
      <TopNav />


      {/* ── Content — grows to fill viewport ────────────────────────────────── */}
      <div
        className="md:pt-[52px]"
        style={{
          display:       "flex",
          flexDirection: "column",
          flex:          1,
          // Bottom padding: clears FAB + BottomNav on mobile (160px),
          // and FAB on desktop (96px).
          paddingBottom: 96,
        }}
      >

        {/* ── Journal header ───────────────────────────────────────────────── */}
        <div
          style={{
            padding:        "28px 24px 20px",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
          }}
        >
          {/* Title + subtitle */}
          <div>
            <h1
              style={{
                fontFamily:    "EB Garamond, Georgia, serif",
                fontSize:      28,
                fontWeight:    400,
                color:         "#E2E4EA",
                margin:        "0 0 4px",
                letterSpacing: "0.01em",
                lineHeight:    1.1,
              }}
            >
              Journal
            </h1>
            <p
              style={{
                fontFamily:    "system-ui, -apple-system, sans-serif",
                fontSize:      12,
                color:         "#8B909C",
                margin:        0,
                letterSpacing: "0.01em",
              }}
            >
              {now ? formatDateTime(now) : " "}
            </p>
          </div>

          {/* New entry button — glass circle, inline with title */}
          <button
            onClick={() => router.push("/journal/new")}
            aria-label="New entry"
            style={{
              width:                56,
              height:               56,
              borderRadius:         "50%",
              flexShrink:           0,
              background:           "rgba(6, 8, 14, 0.58)",
              backdropFilter:       "blur(20px) saturate(1.3)",
              WebkitBackdropFilter: "blur(20px) saturate(1.3)",
              border:               "0.5px solid rgba(255,255,255,0.07)",
              borderTop:            "0.5px solid rgba(255,255,255,0.16)",
              cursor:               "pointer",
              display:              "flex",
              alignItems:           "center",
              justifyContent:       "center",
              transition:           "border-top 280ms ease-out",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderTop =
                "0.5px solid rgba(200,169,110,0.25)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderTop =
                "0.5px solid rgba(255,255,255,0.16)";
            }}
          >
            <PenLine size={18} color="#E2E4EA" />
          </button>
        </div>

        {/* ── Entry list or empty state ─────────────────────────────────────── */}
        {reversed.length === 0 ? (

          /* Empty state — centered vertically in remaining viewport */
          <div
            style={{
              flex:           1,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              // Extra bottom clearance on mobile so the empty-state text
              // doesn't sit behind the BottomNav
              paddingBottom:  72,
            }}
          >
            <p
              style={{
                fontFamily:  "EB Garamond, Georgia, serif",
                fontStyle:   "italic",
                fontSize:    18,
                color:       "#8B909C",
                margin:      0,
                textAlign:   "center",
              }}
            >
              Nothing written yet, traveler.
            </p>
          </div>

        ) : (

          /* Entry list — reverse chronological */
          <div
            style={{
              padding:       "0 24px",
              display:       "flex",
              flexDirection: "column",
              gap:           8,
              // Extra bottom clearance on mobile: BottomNav (72px) + FAB area (96px)
              paddingBottom: 64,
            }}
          >
            {reversed.map((entry) => {
              const attachLabel = getCardAttachmentLabel(entry.context_data);
              return (
                <GlassPanel
                  key={entry.id}
                  role="button"
                  tabIndex={0}
                  active={hoveredId === entry.id}
                  onClick={() => router.push(`/journal/${entry.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") router.push(`/journal/${entry.id}`);
                  }}
                  onMouseEnter={() => setHoveredId(entry.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    padding:   "12px 16px",
                    cursor:    "pointer",
                    outline:   "none",
                    userSelect: "none",
                  }}
                >
                  {/* Title */}
                  <p
                    style={{
                      fontFamily:    "EB Garamond, Georgia, serif",
                      fontSize:      17,
                      fontWeight:    400,
                      color:         "#E2E4EA",
                      margin:        "0 0 5px",
                      letterSpacing: "0.01em",
                      lineHeight:    1.2,
                    }}
                  >
                    {entry.title || "Untitled entry"}
                  </p>

                  {/* Metadata row */}
                  <div
                    style={{
                      display:    "flex",
                      flexWrap:   "wrap",
                      gap:        "0 12px",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontFamily:    "system-ui, -apple-system, sans-serif",
                        fontSize:      11,
                        color:         "#8B909C",
                        letterSpacing: "0.01em",
                      }}
                    >
                      {formatUpdatedAt(entry.updated_at)}
                    </span>
                    {attachLabel && (
                      <span
                        style={{
                          fontFamily:    "system-ui, -apple-system, sans-serif",
                          fontSize:      11,
                          color:         "#8B909C",
                          letterSpacing: "0.01em",
                        }}
                      >
                        · {attachLabel}
                      </span>
                    )}
                  </div>
                </GlassPanel>
              );
            })}
          </div>

        )}
      </div>


      {/* ── Mobile bottom nav ────────────────────────────────────────────────── */}
      <BottomNav />

    </div>
  );
}
