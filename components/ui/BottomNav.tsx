"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import GlassPanel from "./GlassPanel";

const TABS = [
  { label: "Feed", href: "/", icon: "◎" },
  { label: "You", href: "/you", icon: "◐" },
  { label: "Journal", href: "/journal", icon: "◫" },
  { label: "Settings", href: "/settings", icon: "⊙" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <GlassPanel
        style={{ borderRadius: 0, borderBottom: "none", borderLeft: "none", borderRight: "none" }}
      >
        <div className="flex items-center justify-around px-2 py-3">
          {TABS.map((tab) => {
            const active = tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center gap-1"
                style={{ textDecoration: "none" }}
              >
                <span
                  style={{
                    fontSize: 18,
                    color: active ? "#C8A96E" : "#4A5060",
                    transition: "color 380ms ease-out",
                  }}
                >
                  {tab.icon}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 500,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: active ? "#C8A96E" : "#4A5060",
                    transition: "color 380ms ease-out",
                  }}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </GlassPanel>
    </nav>
  );
}
