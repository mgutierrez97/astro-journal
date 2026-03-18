"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import GlassPanel from "@/components/ui/GlassPanel";

export const BIRTH_DATA_KEY = "astro-journal-birth-data";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StoredBirthData {
  birthDate:      string;   // "YYYY-MM-DD"
  birthTime:      string;   // "HH:MM"  (noon when unknown)
  birthTimeKnown: boolean;
  birthCity:      string;
  latitude:       number;
  longitude:      number;
  timezone:       string;   // IANA e.g. "America/Los_Angeles"
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface SelectedCity {
  display: string;
  lat: number;
  lng: number;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

function getTimezoneFromCoords(lat: number, lng: number): string {
  // US
  if (lat > 24 && lat < 50 && lng > -125 && lng < -66) {
    if (lng < -115) return "America/Los_Angeles";
    if (lng < -100) return "America/Denver";
    if (lng < -85)  return "America/Chicago";
    return "America/New_York";
  }
  // Canada
  if (lat > 49 && lng > -140 && lng < -52) {
    if (lng < -115) return "America/Vancouver";
    if (lng < -85)  return "America/Winnipeg";
    return "America/Toronto";
  }
  // UK
  if (lat > 49 && lat < 61 && lng > -8 && lng < 2) return "Europe/London";
  // Western Europe
  if (lng > 0 && lng < 20) return "Europe/Paris";
  // Australia
  if (lat < -10 && lng > 110 && lng < 155) return "Australia/Sydney";
  // Fallback to browser timezone
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// ─── Date mask helper ─────────────────────────────────────────────────────────
// Formats raw digits into MM/DD/YYYY as the user types.

function maskDate(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// Formats raw digits into HH:MM as the user types (12-hour display).
function maskTime(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

// ─── Shared token values ──────────────────────────────────────────────────────

const LABEL: React.CSSProperties = {
  display: "block",
  fontSize: 9,
  fontWeight: 500,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  color: "#4A5060",
  marginBottom: 5,
};

const INPUT: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "0.5px solid rgba(255,255,255,0.10)",
  borderRadius: 5,
  padding: "7px 10px",
  fontSize: 12,
  color: "#E2E4EA",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  colorScheme: "dark",
};

const INPUT_DISABLED: React.CSSProperties = {
  ...INPUT,
  color: "#3A3F4A",
  borderColor: "rgba(255,255,255,0.05)",
  cursor: "not-allowed",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function BirthDataCard() {
  const [mounted, setMounted]         = useState(false);
  const [storedData, setStoredData]   = useState<StoredBirthData | null>(null);
  const [editing, setEditing]         = useState(false);

  // Date field — display value is "MM/DD/YYYY"; stored as "YYYY-MM-DD"
  const [dateText, setDateText]       = useState("");

  const [time, setTime]               = useState("");
  const [amPm, setAmPm]               = useState<"AM" | "PM">("AM");
  const [unknownTime, setUnknownTime] = useState(false);

  // City autocomplete
  const [cityQuery, setCityQuery]         = useState("");
  const [cityResults, setCityResults]     = useState<NominatimResult[]>([]);
  const [cityLoading, setCityLoading]     = useState(false);
  const [citySearched, setCitySearched]   = useState(false); // true after first search
  const [selectedCity, setSelectedCity]   = useState<SelectedCity | null>(null);

  const [error, setError]             = useState<string | null>(null);

  const expandRef      = useRef<HTMLDivElement>(null);
  const cityInputRef   = useRef<HTMLInputElement>(null);
  const cityDebounce   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Storage sync ──────────────────────────────────────────────────────────
  useEffect(() => {
    function readStorage() {
      const raw = localStorage.getItem(BIRTH_DATA_KEY);
      setStoredData(raw ? (JSON.parse(raw) as StoredBirthData) : null);
    }
    readStorage();
    setMounted(true);
    window.addEventListener("birth-data-updated", readStorage);
    return () => window.removeEventListener("birth-data-updated", readStorage);
  }, []);

  if (!mounted) return null;

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleOpen = () => {
    if (storedData) {
      const [y, m, d] = storedData.birthDate.split("-");
      setDateText(`${m}/${d}/${y}`);
      if (storedData.birthTimeKnown) {
        const [hStr, mStr] = storedData.birthTime.split(":");
        const h24 = parseInt(hStr, 10);
        if (h24 === 0) {
          setTime(`12:${mStr}`); setAmPm("AM");
        } else if (h24 < 12) {
          setTime(`${String(h24).padStart(2, "0")}:${mStr}`); setAmPm("AM");
        } else if (h24 === 12) {
          setTime(`12:${mStr}`); setAmPm("PM");
        } else {
          setTime(`${String(h24 - 12).padStart(2, "0")}:${mStr}`); setAmPm("PM");
        }
      } else {
        setTime(""); setAmPm("AM");
      }
      setUnknownTime(!storedData.birthTimeKnown);
      setCityQuery(storedData.birthCity);
      setSelectedCity({
        display: storedData.birthCity,
        lat:     storedData.latitude,
        lng:     storedData.longitude,
      });
    }
    setEditing(true);
  };

  const handleClose = () => {
    setEditing(false);
    setDateText("");
    setTime("");
    setAmPm("AM");
    setUnknownTime(false);
    setCityQuery("");
    setCityResults([]);
    setCityLoading(false);
    setCitySearched(false);
    setSelectedCity(null);
    setError(null);
  };

  // Date input — enforce MM/DD/YYYY mask, numeric keyboard on mobile
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateText(maskDate(e.target.value));
  };

  // City input — debounced Nominatim lookup, clears selection while typing
  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setCityQuery(q);
    setSelectedCity(null);
    setCitySearched(false);

    if (cityDebounce.current) clearTimeout(cityDebounce.current);

    if (q.length >= 3) {
      cityDebounce.current = setTimeout(async () => {
        setCityLoading(true);
        try {
          const url =
            `https://nominatim.openstreetmap.org/search` +
            `?q=${encodeURIComponent(q.toLowerCase())}&format=json&limit=5&addressdetails=1&accept-language=en`;
          const res  = await fetch(url);
          const data = await res.json() as NominatimResult[];
          setCityResults(data);
        } catch {
          setCityResults([]);
        } finally {
          setCityLoading(false);
          setCitySearched(true);
        }
      }, 400);
    } else {
      setCityResults([]);
    }
  };

  const handleCitySelect = (r: NominatimResult) => {
    // Show only the first two comma-parts as the display label
    const parts   = r.display_name.split(", ");
    const display = parts.slice(0, 2).join(", ");
    setCityQuery(display);
    setSelectedCity({ display, lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
    setCityResults([]);
    setCitySearched(false);
  };

  // Hides dropdown if user tabs/clicks away (allow onMouseDown on items first)
  const handleCityBlur = () => {
    setTimeout(() => {
      setCityResults([]);
      setCitySearched(false);
    }, 150);
  };

  const handleApply = () => {
    // Validate city selection
    if (!selectedCity) {
      setError("Please select a city from the suggestions");
      return;
    }
    // Validate date (expect 10 chars: MM/DD/YYYY)
    const dateParts = dateText.split("/");
    if (dateText.length !== 10 || dateParts.length !== 3) {
      setError("Enter birth date as MM/DD/YYYY");
      return;
    }
    const [mm, dd, yyyy] = dateParts;
    const birthDate = `${yyyy}-${mm}-${dd}`;

    // Validate and convert time to 24-hour format
    let birthTime = "12:00";
    if (!unknownTime) {
      if (time.length !== 5) {
        setError("Enter birth time as HH:MM");
        return;
      }
      const [hStr, mStr] = time.split(":");
      const h12 = parseInt(hStr, 10);
      const mins = parseInt(mStr, 10);
      if (h12 < 1 || h12 > 12 || mins < 0 || mins > 59) {
        setError("Time must be HH:MM — hours 01–12, minutes 00–59");
        return;
      }
      const h24 = amPm === "AM" ? (h12 === 12 ? 0 : h12) : (h12 === 12 ? 12 : h12 + 12);
      birthTime = `${String(h24).padStart(2, "0")}:${mStr}`;
    }

    setError(null);
    const timezone = getTimezoneFromCoords(selectedCity.lat, selectedCity.lng);
    const payload: StoredBirthData = {
      birthDate,
      birthTime,
      birthTimeKnown: !unknownTime,
      birthCity:      selectedCity.display,
      latitude:       selectedCity.lat,
      longitude:      selectedCity.lng,
      timezone,
    };
    localStorage.setItem(BIRTH_DATA_KEY, JSON.stringify(payload));
    window.dispatchEvent(new Event("birth-data-updated"));
    handleClose();
  };

  // ─── City dropdown (portal — escapes overflow:hidden parent) ───────────────
  const showDropdown =
    (cityResults.length > 0 || cityLoading || citySearched) &&
    !selectedCity &&
    cityQuery.length >= 3;

  const cityDropdown =
    showDropdown && cityInputRef.current
      ? createPortal(
          <div
            style={{
              position: "fixed",
              top:   cityInputRef.current.getBoundingClientRect().bottom + 4,
              left:  cityInputRef.current.getBoundingClientRect().left,
              width: cityInputRef.current.getBoundingClientRect().width,
              zIndex: 9999,
              background: "rgba(10,12,18,0.97)",
              backdropFilter: "blur(20px) saturate(1.3)",
              WebkitBackdropFilter: "blur(20px) saturate(1.3)",
              border: "0.5px solid rgba(255,255,255,0.10)",
              borderRadius: 5,
              overflow: "hidden",
            }}
          >
            {cityLoading ? (
              <div style={{ padding: "10px 12px", fontSize: 11, color: "#4A5060" }}>
                Searching…
              </div>
            ) : cityResults.length === 0 ? (
              <div style={{ padding: "10px 12px", fontSize: 11, color: "#4A5060" }}>
                No results found
              </div>
            ) : (
              cityResults.map((r, i) => {
                const parts   = r.display_name.split(", ");
                const primary = parts.slice(0, 2).join(", ");
                const country = parts[parts.length - 1];
                return (
                  <button
                    key={r.place_id}
                    onMouseDown={(e) => { e.preventDefault(); handleCitySelect(r); }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "9px 12px",
                      background: "none",
                      border: "none",
                      borderBottom:
                        i < cityResults.length - 1
                          ? "0.5px solid rgba(255,255,255,0.05)"
                          : "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <span style={{ display: "block", fontSize: 11, color: "#E2E4EA", lineHeight: 1.3 }}>
                      {primary}
                    </span>
                    <span style={{ display: "block", fontSize: 10, color: "#4A5060", marginTop: 2 }}>
                      {country}
                    </span>
                  </button>
                );
              })
            )}
          </div>,
          document.body,
        )
      : null;

  // ─── Filled state (State 3) ─────────────────────────────────────────────────
  const filledState = storedData
    ? (() => {
        const [y, m, d] = storedData.birthDate.split("-").map(Number);
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const dateDisplay = `${months[m - 1]} ${d}, ${y}`;
        const timeDisplay = storedData.birthTimeKnown ? storedData.birthTime : "time unknown";
        return (
          <div
            style={{
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span
                style={{
                  fontSize: 11,
                  color: "#E2E4EA",
                  fontFamily: "EB Garamond, Georgia, serif",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {storedData.birthCity}
              </span>
              <span style={{ fontSize: 10, color: "#4A5060" }}>
                {dateDisplay} · {timeDisplay}
              </span>
            </div>
            <button
              onClick={handleOpen}
              aria-label="Edit birth data"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 20,
                height: 20,
                background: "none",
                border: "0.5px solid rgba(200,169,110,0.25)",
                borderRadius: 4,
                cursor: "pointer",
                color: "#4A5060",
                fontSize: 11,
                lineHeight: 1,
                padding: 0,
                flexShrink: 0,
              }}
            >
              ✎
            </button>
          </div>
        );
      })()
    : null;

  // ─── Empty state ────────────────────────────────────────────────────────────
  const emptyState = (
    <div
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
        onClick={handleOpen}
        aria-label="Add birth data"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          height: 20,
          background: "none",
          border: "0.5px solid rgba(200,169,110,0.35)",
          borderRadius: 4,
          cursor: "pointer",
          color: "#C8A96E",
          fontSize: 14,
          lineHeight: 1,
          padding: 0,
          flexShrink: 0,
        }}
      >
        +
      </button>
    </div>
  );

  // ─── Edit state ─────────────────────────────────────────────────────────────
  const editState = (
    <div style={{ padding: "14px 14px 12px" }}>
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.04em", color: "#8B909C" }}>
          Birth data
        </span>
        <button
          onClick={handleClose}
          aria-label="Close"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#4A5060",
            fontSize: 16,
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* Birth date — plain text with MM/DD/YYYY mask, numeric keyboard on mobile */}
      <div style={{ marginBottom: 10 }}>
        <label style={LABEL}>Birth date</label>
        <input
          type="text"
          inputMode="numeric"
          value={dateText}
          placeholder="MM/DD/YYYY"
          onChange={handleDateChange}
          style={INPUT}
        />
      </div>

      {/* Birth time — plain text HH:MM with AM/PM toggle */}
      <div style={{ marginBottom: 6 }}>
        <label style={LABEL}>Birth time</label>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type="text"
            inputMode="numeric"
            value={time}
            placeholder="HH:MM"
            disabled={unknownTime}
            onChange={(e) => setTime(maskTime(e.target.value))}
            style={{ ...(unknownTime ? INPUT_DISABLED : INPUT), flex: 1 }}
          />
          {(["AM", "PM"] as const).map((period) => (
            <button
              key={period}
              type="button"
              disabled={unknownTime}
              onClick={() => setAmPm(period)}
              style={{
                padding: "0 10px",
                borderRadius: 5,
                border: amPm === period && !unknownTime
                  ? "0.5px solid rgba(200,169,110,0.55)"
                  : "0.5px solid rgba(255,255,255,0.10)",
                background: amPm === period && !unknownTime
                  ? "rgba(200,169,110,0.12)"
                  : "rgba(255,255,255,0.04)",
                color: amPm === period && !unknownTime ? "#C8A96E" : "#4A5060",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.04em",
                cursor: unknownTime ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                transition: "color 200ms, border-color 200ms, background 200ms",
                flexShrink: 0,
              }}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Unknown time checkbox */}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginBottom: 12,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={unknownTime}
          onChange={(e) => setUnknownTime(e.target.checked)}
          style={{ accentColor: "#C8A96E", width: 12, height: 12, cursor: "pointer" }}
        />
        <span style={{ fontSize: 11, color: "#4A5060" }}>
          I don&apos;t know my birth time
        </span>
      </label>

      {/* Birth city — autocomplete, must select from dropdown */}
      <div style={{ marginBottom: 16 }}>
        <label style={LABEL}>Birth city</label>
        <input
          ref={cityInputRef}
          type="text"
          value={cityQuery}
          placeholder="Search for a city…"
          onChange={handleCityChange}
          onBlur={handleCityBlur}
          style={{
            ...INPUT,
            borderColor: selectedCity
              ? "rgba(200,169,110,0.40)"
              : "rgba(255,255,255,0.10)",
          }}
        />
        {cityDropdown}
      </div>

      {/* Error message */}
      {error && (
        <p style={{ fontSize: 10, color: "rgba(220,100,80,0.85)", marginBottom: 10, lineHeight: 1.4 }}>
          {error}
        </p>
      )}

      {/* Apply button */}
      <button
        onClick={handleApply}
        style={{
          width: "100%",
          padding: "9px 0",
          borderRadius: 5,
          border: "0.5px solid #C8A96E",
          borderTop: "0.5px solid rgba(255,220,160,0.55)",
          background: "rgba(200,169,110,0.10)",
          color: "#E8D8A8",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "color 200ms, border-color 200ms",
        }}
      >
        Apply
      </button>
    </div>
  );

  const collapsedHeight = storedData ? 52 : 44;

  return (
    <GlassPanel
      ref={expandRef}
      style={{
        overflow: "hidden",
        maxHeight: editing ? 500 : collapsedHeight,
        transition: "max-height 380ms cubic-bezier(0.0, 0.0, 0.2, 1)",
      }}
    >
      {editing ? editState : storedData ? filledState : emptyState}
    </GlassPanel>
  );
}
