"use client";

import { usePathname } from "next/navigation";
import { APP_NAME } from "@/lib/config";
import { useAuth } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopNavProps {
  /**
   * Controls CSS position of the header element.
   *
   * "absolute" (default) — overlays the page content; used on full-bleed
   *   pages where the background fills the entire viewport (Feed, You,
   *   Journal list). The content below must add paddingTop / md:pt-[52px]
   *   to avoid being obscured.
   *
   * "sticky" — participates in normal flow and pushes content down as the
   *   user scrolls; used on journal entry pages that have a second per-page
   *   sticky header (back button + flame) nested below this one.
   */
  position?: "absolute" | "sticky";
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

type Tab = { label: string; href: string };

const BASE_TABS: Tab[] = [
  { label: "Feed",    href: "/" },
  { label: "You",     href: "/you" },
  { label: "Journal", href: "/journal" },
];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * TopNav — shared desktop global navigation bar.
 *
 * Hidden on mobile (md:hidden handled by the BottomNav equivalent).
 * Renders only on md+ via className="hidden md:flex".
 *
 * Auth-aware: replaces "Settings" with "Sign In" when the user is
 * unauthenticated. During the initial session load, shows "Settings"
 * to prevent a flash-of-unauthenticated state for returning users.
 */
export default function TopNav({ position = "absolute" }: TopNavProps) {
  const pathname        = usePathname();
  const { user, loading } = useAuth();

  // Show "Settings" while loading (optimistic) so authenticated users
  // never see a flicker. Unauthenticated users see a brief transition
  // from Settings → Sign In, which is acceptable.
  const lastTab: Tab = !loading && !user
    ? { label: "Sign In", href: "/auth" }
    : { label: "Settings", href: "/settings" };

  const tabs: Tab[] = [...BASE_TABS, lastTab];

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header
      className="hidden md:flex"
      style={{
        position,
        top:                  0,
        left:                 0,
        right:                0,
        zIndex:               20,
        width:                "100%",
        padding:              "0 24px",
        height:               52,
        alignItems:           "center",
        justifyContent:       "space-between",
        borderBottom:         "0.5px solid rgba(255,255,255,0.06)",
        background:           "rgba(13,17,23,0.6)",
        backdropFilter:       "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxSizing:            "border-box",
      }}
    >
      {/* Wordmark */}
      <span
        style={{
          fontFamily:    "EB Garamond, Georgia, serif",
          fontSize:      16,
          fontWeight:    500,
          color:         "#E2E4EA",
          letterSpacing: "0.02em",
        }}
      >
        {APP_NAME}
      </span>

      {/* Tab links */}
      <nav className="flex items-center gap-6">
        {tabs.map((tab) => (
          <a
            key={tab.href}
            href={tab.href}
            style={{
              fontSize:       10,
              fontWeight:     500,
              letterSpacing:  "0.08em",
              textTransform:  "uppercase",
              color:          isActive(tab.href) ? "#C8A96E" : "#4A5060",
              textDecoration: "none",
              transition:     "color 380ms ease-out",
            }}
          >
            {tab.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
