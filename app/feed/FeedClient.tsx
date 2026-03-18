"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import TransitCard from "@/components/cards/TransitCard";
import TransitDetail from "@/components/cards/TransitDetail";
import GlassPanel from "@/components/ui/GlassPanel";
import BirthDataCard, { BIRTH_DATA_KEY, type StoredBirthData } from "@/components/ui/BirthDataCard";
import BottomNav from "@/components/ui/BottomNav";
import { APP_NAME } from "@/lib/config";
import { filterTransitsForFeed } from "@/lib/transitFilter";
import { generateTransitsCached } from "@/lib/transitGenerator";
import { calculateNatalChart, birthDataToDate } from "@/lib/natal";

// SolarSystem uses Canvas + requestAnimationFrame — client only, no SSR
const SolarSystem = dynamic(() => import("@/components/cosmic/SolarSystem"), {
  ssr: false,
  loading: () => <div style={{ width: "100%", height: "100%", background: "#0D1117" }} />,
});

// PLACEHOLDER_TRANSITS removed — feed now uses real ephemeris data via generateTransitsCached.

export default function FeedClient() {
  const [activeTransitId, setActiveTransitId] = useState<string | null>(null);
  const [birthData, setBirthData] = useState<StoredBirthData | null>(null);

  // ── Sync birth data from localStorage ───────────────────────────────────────
  useEffect(() => {
    function readBirthData() {
      const raw = localStorage.getItem(BIRTH_DATA_KEY);
      setBirthData(raw ? (JSON.parse(raw) as StoredBirthData) : null);
    }
    readBirthData();
    window.addEventListener("birth-data-updated", readBirthData);
    return () => window.removeEventListener("birth-data-updated", readBirthData);
  }, []);

  // ── Natal chart — derived from birth data when available ────────────────────
  const natalChart = useMemo(() => {
    if (!birthData) return null;
    try {
      const birthDate = birthDataToDate(
        birthData.birthDate,
        birthData.birthTime,
        birthData.timezone,
      );
      return calculateNatalChart(birthDate, birthData.latitude, birthData.longitude);
    } catch {
      return null;
    }
  }, [birthData]);

  // ── Transit generation — cached daily, keyed on birth data changes ───────────
  // generateTransitsCached handles the localStorage cache internally.
  // useMemo ensures we don't recalculate on every React render.
  const rawTransits = useMemo(
    () => generateTransitsCached(
      birthData   ?? undefined,
      natalChart  ?? undefined,
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [birthData, natalChart],
  );

  // ── Scoring + filtering ──────────────────────────────────────────────────────
  const filteredTransits = useMemo(
    () => filterTransitsForFeed(rawTransits, birthData ?? undefined),
    [rawTransits, birthData],
  );

  // ── Verification log (development only) ──────────────────────────────────────
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (rawTransits.length === 0) return;

    console.group(
      `[Feed] Generation complete — ${rawTransits.length} total, ${filteredTransits.length} shown`,
    );
    console.table(
      filteredTransits.map((st) => ({
        title:   st.transit.title,
        score:   st.score,
        tier:    st.tier,
        special: st.isSpecialEvent,
        peak:    st.transit.peakDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        house:   st.transit.house ?? "—",
      })),
    );

    // Verification checks
    const hasJupiterIngress = rawTransits.some(
      (t) => t.transitType === "ingress" && t.planet === "Jupiter",
    );
    const moonPhases = rawTransits.filter(
      (t) => t.transitType === "new-moon" || t.transitType === "full-moon" ||
             t.transitType === "eclipse-solar" || t.transitType === "eclipse-lunar",
    );
    const uranusIngress = rawTransits.find(
      (t) => t.transitType === "ingress" && t.planet === "Uranus",
    );

    if (hasJupiterIngress) {
      console.warn("[Feed] ⚠ Jupiter ingress appeared — verify ephemeris (Jupiter is ~15° Cancer)");
    } else {
      console.log("[Feed] ✓ No Jupiter ingress (correct — Jupiter is in Cancer)");
    }

    if (moonPhases.length > 0) {
      console.log("[Feed] ✓ Moon phases:", moonPhases.map(
        (t) => `${t.title} (${t.peakDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`,
      ).join(", "));
    } else {
      console.warn("[Feed] ⚠ No moon phases found in 30-day window");
    }

    if (uranusIngress) {
      console.log(`[Feed] ✓ Uranus ingress found: ${uranusIngress.title} (${uranusIngress.peakDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`);
    } else {
      console.log("[Feed] — Uranus ingress not in 30-day window (appears ~Apr 27, use 45-day scan to see it)");
    }

    console.groupEnd();
  }, [rawTransits, filteredTransits]);

  const activeTransit = filteredTransits.find((st) => st.transit.id === activeTransitId);

  const activeEvent = activeTransit?.transit ?? null;

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
        <SolarSystem focusedPlanet={activeEvent?.planet ?? null} />
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

      {/* Birth data bar — mobile */}
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
        <BirthDataCard />
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
          maxHeight: activeEvent ? "78vh" : "55vh",
          overflow: "hidden",
          transition: "max-height 480ms ease-in-out",
        }}
      >
        {/* Card list view */}
        <div
          style={{
            position: activeEvent ? "absolute" : "relative",
            inset: 0,
            overflowY: "auto",
            padding: "0 16px 16px",
            opacity: activeEvent ? 0 : 1,
            transform: activeEvent ? "translateX(-16px)" : "translateX(0)",
            transition: "opacity 480ms ease-in-out, transform 480ms ease-in-out",
            pointerEvents: activeEvent ? "none" : "auto",
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
            {filteredTransits.map((st) => (
              <TransitCard
                key={st.transit.id}
                event={st.transit}
                tier={st.tier === "suppressed" ? undefined : st.tier}
                isSpecialEvent={st.isSpecialEvent}
                active={activeTransitId === st.transit.id}
                onClick={() => handleCardClick(st.transit.id)}
              />
            ))}
          </div>
        </div>

        {/* Mobile detail view */}
        {activeEvent && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: activeEvent ? 1 : 0,
              transform: activeEvent ? "translateX(0)" : "translateX(16px)",
              transition: "opacity 480ms ease-in-out, transform 480ms ease-in-out",
              background: "rgba(6,8,14,0.72)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderTop: "0.5px solid rgba(255,255,255,0.08)",
              borderRadius: "7px 7px 0 0",
            }}
          >
            <TransitDetail
              event={activeEvent}
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
            opacity: activeEvent ? 0 : 1,
            transform: activeEvent ? "translateX(-16px)" : "translateX(0)",
            transition: "opacity 480ms ease-in-out, transform 480ms ease-in-out",
            pointerEvents: activeEvent ? "none" : "auto",
          }}
        >
          {/* Birth data bar */}
          <div style={{ padding: "16px 4px 12px" }}>
            <BirthDataCard />
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
            {filteredTransits.map((st) => (
              <TransitCard
                key={st.transit.id}
                event={st.transit}
                tier={st.tier === "suppressed" ? undefined : st.tier}
                isSpecialEvent={st.isSpecialEvent}
                active={activeTransitId === st.transit.id}
                onClick={() => handleCardClick(st.transit.id)}
              />
            ))}
          </div>
        </div>

        {/* Detail view — slides in from right on open */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: activeEvent ? 1 : 0,
            transform: activeEvent ? "translateX(0)" : "translateX(16px)",
            transition: "opacity 480ms ease-in-out, transform 480ms ease-in-out",
            pointerEvents: activeEvent ? "auto" : "none",
          }}
        >
          {activeEvent && (
            <TransitDetail
              event={activeEvent}
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
