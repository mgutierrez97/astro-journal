"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import TransitCard, { type TransitEvent } from "@/components/cards/TransitCard";
import TransitDetail from "@/components/cards/TransitDetail";
import GlassPanel from "@/components/ui/GlassPanel";
import BottomNav from "@/components/ui/BottomNav";
import { APP_NAME } from "@/lib/config";

// SolarSystem uses Canvas + requestAnimationFrame — client only, no SSR
const SolarSystem = dynamic(() => import("@/components/cosmic/SolarSystem"), {
  ssr: false,
  loading: () => <div style={{ width: "100%", height: "100%", background: "#0D1117" }} />,
});

// --- Placeholder transit data ---
const PLACEHOLDER_TRANSITS: TransitEvent[] = [
  {
    id: "t1",
    planet: "Mercury",
    aspect: "Conjunction",
    targetPlanet: "Neptune",
    transitType: "conjunction",
    peakDate: new Date("2026-03-19"),
    title: "Mercury conjunct Neptune",
    themes: "fog · intuition · dissolution",
    status: "approaching",
  },
  {
    id: "t2",
    planet: "Venus",
    aspect: "Trine",
    targetPlanet: "Saturn",
    transitType: "trine",
    peakDate: new Date("2026-03-21"),
    title: "Venus trine Saturn",
    themes: "structure · devotion · longevity",
    status: "approaching",
  },
  {
    id: "t3",
    planet: "Mars",
    aspect: "Square",
    targetPlanet: "Pluto",
    transitType: "square",
    peakDate: new Date("2026-03-16"),
    title: "Mars square Pluto",
    themes: "power · transformation · friction",
    status: "active",
  },
  {
    id: "t4",
    planet: "Jupiter",
    aspect: "Ingress",
    transitType: "ingress",
    peakDate: new Date("2026-03-28"),
    title: "Jupiter enters Gemini",
    themes: "expansion · curiosity · multiplicity",
    status: "approaching",
  },
  {
    id: "t5",
    planet: "Sun",
    aspect: "Opposition",
    targetPlanet: "Saturn",
    transitType: "opposition",
    peakDate: new Date("2026-03-12"),
    title: "Sun opposite Saturn",
    themes: "accountability · limits · maturity",
    status: "separating",
  },
  {
    id: "t6",
    planet: "Saturn",
    aspect: "Sextile",
    targetPlanet: "Uranus",
    transitType: "sextile",
    peakDate: new Date("2026-04-02"),
    title: "Saturn sextile Uranus",
    themes: "reform · stability · innovation",
    status: "approaching",
  },
];

export default function FeedClient() {
  const [activeTransitId, setActiveTransitId] = useState<string | null>(null);

  const activeTransit = PLACEHOLDER_TRANSITS.find((t) => t.id === activeTransitId);

  const handleCardClick = (id: string) => {
    setActiveTransitId((prev) => (prev === id ? null : id));
  };

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
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
        }}
      >
        <SolarSystem focusedPlanet={activeTransit?.planet ?? null} />
      </div>

      {/* Subtle vignette overlay to ground the cards */}
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
            <a
              key={tab}
              href={tab === "Feed" ? "/" : `/${tab.toLowerCase()}`}
              style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: tab === "Feed" ? "#C8A96E" : "#4A5060",
                textDecoration: "none",
                transition: "color 380ms ease-out",
              }}
            >
              {tab}
            </a>
          ))}
        </nav>
      </header>

      {/* Birth data input bar — shown when no birth data */}
      <div
        className="md:hidden"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: "12px 16px",
        }}
      >
        <GlassPanel
          style={{
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 12, color: "#8B909C" }}>
            Add your birth data to personalize transits
          </span>
          <button
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#C8A96E",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Set up →
          </button>
        </GlassPanel>
      </div>

      {/* Transit card list — mobile bottom strip, morphs to detail */}
      <aside
        className="md:hidden"
        style={{
          position: "absolute",
          zIndex: 10,
          bottom: 72,
          left: 0,
          right: 0,
          maxHeight: activeTransit ? "78vh" : "55vh",
          overflow: "hidden",
          transition: "max-height 480ms ease-in-out",
        }}
      >
        {/* Card list view */}
        <div
          style={{
            position: activeTransit ? "absolute" : "relative",
            inset: 0,
            overflowY: "auto",
            padding: "0 16px 16px",
            opacity: activeTransit ? 0 : 1,
            transform: activeTransit ? "translateX(-16px)" : "translateX(0)",
            transition: "opacity 480ms ease-in-out, transform 480ms ease-in-out",
            pointerEvents: activeTransit ? "none" : "auto",
          }}
        >
          <div
            style={{
              padding: "14px 0 10px",
              display: "flex",
              alignItems: "baseline",
              gap: 8,
            }}
          >
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
              Transits
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {PLACEHOLDER_TRANSITS.map((event) => (
              <TransitCard
                key={event.id}
                event={event}
                active={activeTransitId === event.id}
                onClick={() => handleCardClick(event.id)}
              />
            ))}
          </div>
        </div>

        {/* Mobile detail view */}
        {activeTransit && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: activeTransit ? 1 : 0,
              transform: activeTransit ? "translateX(0)" : "translateX(16px)",
              transition: "opacity 480ms ease-in-out, transform 480ms ease-in-out",
              background: "rgba(6,8,14,0.72)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderTop: "0.5px solid rgba(255,255,255,0.08)",
              borderRadius: "7px 7px 0 0",
            }}
          >
            <TransitDetail
              event={activeTransit}
              onBack={() => setActiveTransitId(null)}
            />
          </div>
        )}
      </aside>

      {/* Desktop left panel — two views crossfade in the same container */}
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
        {/* Card list view — slides out left on open */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflowY: "auto",
            padding: "0 16px 24px",
            opacity: activeTransit ? 0 : 1,
            transform: activeTransit ? "translateX(-16px)" : "translateX(0)",
            transition: "opacity 480ms ease-in-out, transform 480ms ease-in-out",
            pointerEvents: activeTransit ? "none" : "auto",
          }}
        >
          {/* Birth data bar */}
          <div style={{ padding: "16px 4px" }}>
            <GlassPanel
              style={{
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 11, color: "#8B909C" }}>
                Add birth data to personalize
              </span>
              <button
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#C8A96E",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Set up →
              </button>
            </GlassPanel>
          </div>

          <div style={{ marginBottom: 12 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#4A5060",
              }}
            >
              Upcoming Transits
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {PLACEHOLDER_TRANSITS.map((event) => (
              <TransitCard
                key={event.id}
                event={event}
                active={activeTransitId === event.id}
                onClick={() => handleCardClick(event.id)}
              />
            ))}
          </div>
        </div>

        {/* Detail view — slides in from right on open */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: activeTransit ? 1 : 0,
            transform: activeTransit ? "translateX(0)" : "translateX(16px)",
            transition: "opacity 480ms ease-in-out, transform 480ms ease-in-out",
            pointerEvents: activeTransit ? "auto" : "none",
          }}
        >
          {activeTransit && (
            <TransitDetail
              event={activeTransit}
              onBack={() => setActiveTransitId(null)}
            />
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
