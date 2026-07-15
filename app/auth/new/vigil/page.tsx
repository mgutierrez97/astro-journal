"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTypewriter } from "@/hooks/useTypewriter";
import CandleNode from "@/components/onboarding/CandleNode";
import { VIGIL_CLAUSES } from "@/lib/vigilCopy";

const OPENING = "Something has been waiting. Before the sky, before the chart. Here.";
const BRIDGE  = "A vigil marks a place. Yours has a moment too. Tell the sky when, and where, you arrived.";

const ORIGIN_ROUTE = "/auth/new/origin";

export default function VigilPage() {
  const router = useRouter();

  const [activeIndex,     setActiveIndex]     = useState(0);
  const [litStates,       setLitStates]       = useState([false, false, false, false, false]);
  const [typingIndex,     setTypingIndex]     = useState<number | null>(null);
  const [clauseInstant,   setClauseInstant]   = useState(false);
  const [openingComplete, setOpeningComplete] = useState(false);
  const [ctaVisible,      setCtaVisible]      = useState(false);

  const candleFiveLit = litStates[4];

  // Single source of truth: what should be in the one text slot right now
  const currentText = candleFiveLit
    ? BRIDGE
    : typingIndex !== null
      ? (VIGIL_CLAUSES[typingIndex] ?? "")
      : OPENING;

  // Fast-forward only applies to clauses, never to opening or bridge
  const instant = clauseInstant && typingIndex !== null && !candleFiveLit;

  const displayed = useTypewriter(currentText, 35, instant);

  // Derived done states — each only true in its own phase
  const clauseDone =
    typingIndex !== null &&
    !candleFiveLit &&
    (VIGIL_CLAUSES[typingIndex] ?? "").length > 0 &&
    displayed.length >= (VIGIL_CLAUSES[typingIndex] ?? "").length;

  const bridgeDone = candleFiveLit && displayed.length >= BRIDGE.length;

  // Latch openingComplete once — stays true even after typingIndex changes
  useEffect(() => {
    if (openingComplete) return;
    if (typingIndex === null && !candleFiveLit && displayed.length >= OPENING.length) {
      setOpeningComplete(true);
    }
  }, [displayed, typingIndex, candleFiveLit, openingComplete]);

  // Advance to next candle once the current clause finishes
  useEffect(() => {
    if (!clauseDone || typingIndex === null) return;
    const next = typingIndex + 1;
    if (next <= 4) setActiveIndex(next);
  }, [clauseDone, typingIndex]);

  // Reveal CTA once bridge finishes
  useEffect(() => {
    if (bridgeDone) setCtaVisible(true);
  }, [bridgeDone]);

  function handleCandleTap(index: number) {
    if (index !== activeIndex) return;

    if (!litStates[index]) {
      const newLit = [...litStates];
      newLit[index] = true;
      setLitStates(newLit);

      if (index < 4) {
        // Candles 1–4: switch currentText to this clause
        setClauseInstant(false);
        setTypingIndex(index);
      }
      // Candle 5: candleFiveLit becomes true → currentText switches to BRIDGE
    } else if (typingIndex === index && !clauseDone) {
      // Tap on mid-typing candle → fast-forward
      setClauseInstant(true);
    }
  }

  return (
    <div
      style={{
        minHeight:      "100dvh",
        background:     "#000000",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "24px",
        boxSizing:      "border-box",
        position:       "relative",
      }}
    >

      {/* Skip — fades in after opening completes */}
      <button
        type="button"
        onClick={() => router.push(ORIGIN_ROUTE)}
        style={{
          position:      "absolute",
          top:           20,
          right:         24,
          background:    "none",
          border:        "none",
          fontFamily:    "system-ui, -apple-system, sans-serif",
          fontSize:      12,
          color:         "#4A5060",
          letterSpacing: "0.04em",
          cursor:        "pointer",
          padding:       "4px 0",
          opacity:       openingComplete ? 1 : 0,
          transition:    "opacity 600ms ease-out",
          pointerEvents: openingComplete ? "auto" : "none",
        }}
      >
        Skip
      </button>

      {/* Single text slot — always shows exactly one line */}
      <p
        style={{
          fontFamily:    "EB Garamond, Georgia, serif",
          fontStyle:     "italic",
          fontSize:      22,
          fontWeight:    400,
          color:         "#C8A96E",
          letterSpacing: "0.01em",
          lineHeight:    1.6,
          textAlign:     "center",
          maxWidth:      480,
          margin:        0,
          minHeight:     "1.6em",
        }}
      >
        {displayed}
      </p>

      {/* Candle sequence — fades in after opening completes */}
      <div
        style={{
          marginTop:     48,
          display:       "flex",
          flexDirection: "column",
          alignItems:    "center",
          gap:           16,
          opacity:       openingComplete ? 1 : 0,
          transition:    "opacity 600ms ease-out",
          pointerEvents: openingComplete ? "auto" : "none",
        }}
      >
        {/* Label — disappears after candle 1 lights */}
        <span
          style={{
            fontFamily:    "system-ui, -apple-system, sans-serif",
            fontSize:      11,
            fontWeight:    500,
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            color:         "#4A5060",
            opacity:       litStates[0] ? 0 : 1,
            transition:    "opacity 400ms ease-out",
            pointerEvents: "none",
          }}
        >
          Light the vigil ↓
        </span>

        {/* Candle row — nodes appear one at a time as sequence progresses */}
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {Array.from({ length: 5 }, (_, i) =>
            i <= activeIndex ? (
              <CandleNode
                key={i}
                index={i}
                lit={litStates[i]}
                isActive={i === activeIndex}
                onTap={() => handleCandleTap(i)}
              />
            ) : null
          )}
        </div>
      </div>

      {/* OFFER YOUR ORIGIN — fixed bottom, fades in when bridge finishes */}
      <div
        style={{
          position:      "fixed",
          bottom:        40,
          left:          "50%",
          transform:     "translateX(-50%)",
          opacity:       ctaVisible ? 1 : 0,
          transition:    "opacity 600ms ease-out",
          pointerEvents: ctaVisible ? "auto" : "none",
        }}
      >
        <button
          type="button"
          onClick={() => router.push(ORIGIN_ROUTE)}
          style={{
            background:    "rgba(200,169,110,0.10)",
            border:        "0.5px solid #C8A96E",
            borderTop:     "0.5px solid rgba(232,216,168,0.6)",
            borderRadius:  7,
            color:         "#E8D8A8",
            fontFamily:    "system-ui, -apple-system, sans-serif",
            fontSize:      11,
            fontWeight:    600,
            letterSpacing: "0.11em",
            textTransform: "uppercase",
            padding:       "13px 32px",
            cursor:        "pointer",
            whiteSpace:    "nowrap",
            transition:    "background 280ms ease-out",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(200,169,110,0.17)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(200,169,110,0.10)";
          }}
        >
          Offer Your Origin
        </button>
      </div>

    </div>
  );
}
