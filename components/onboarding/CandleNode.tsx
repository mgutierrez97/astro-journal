"use client";

import { useState, useEffect } from "react";

interface CandleNodeProps {
  lit: boolean;
  index: number;
  isActive?: boolean;
  onTap?: () => void;
}

export default function CandleNode({ lit, index, isActive = false, onTap }: CandleNodeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(id);
  }, []);

  return (
    <div
      role="button"
      tabIndex={isActive ? 0 : -1}
      aria-label={`Candle ${index + 1}${lit ? ", lit" : ""}`}
      onClick={onTap}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onTap?.(); }}
      style={{
        width:        32,
        height:       32,
        borderRadius: "50%",
        background:   lit ? "#C8A96E" : "transparent",
        border:       "1.5px solid",
        borderColor:  lit ? "#C8A96E" : "rgba(200,169,110,0.35)",
        cursor:       isActive ? "pointer" : "default",
        opacity:      mounted ? 1 : 0,
        transition:   "opacity 600ms ease-out, background 400ms ease-out, border-color 400ms ease-out",
        flexShrink:   0,
      }}
    />
  );
}
