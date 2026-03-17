"use client";

import { forwardRef } from "react";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** When true, border-top becomes gold — indicates selected/active state */
  active?: boolean;
  /** Allow composing with other elements */
  as?: React.ElementType;
}

/**
 * GlassPanel — the base card surface for all floating UI.
 *
 * Anatomy (exact values from design spec):
 *   background:      rgba(6, 8, 14, 0.58)
 *   backdrop-filter: blur(20px) saturate(1.3)
 *   border:          0.5px solid rgba(255,255,255,0.07)
 *   border-top:      0.5px solid rgba(255,255,255,0.16)  ← floating panel illusion
 *   border-radius:   7px
 *   Active state:    border-top becomes rgba(200,169,110,0.55)
 */
const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ active = false, as: Tag = "div", className = "", children, style, ...rest }, ref) => {
    return (
      <Tag
        ref={ref}
        className={className}
        style={{
          background: "rgba(6, 8, 14, 0.58)",
          backdropFilter: "blur(20px) saturate(1.3)",
          WebkitBackdropFilter: "blur(20px) saturate(1.3)",
          borderRadius: "7px",
          border: "0.5px solid rgba(255,255,255,0.07)",
          borderTop: active
            ? "0.5px solid rgba(200,169,110,0.55)"
            : "0.5px solid rgba(255,255,255,0.16)",
          ...style,
        }}
        {...rest}
      >
        {children}
      </Tag>
    );
  }
);

GlassPanel.displayName = "GlassPanel";

export default GlassPanel;
