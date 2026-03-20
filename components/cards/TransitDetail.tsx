"use client";

import { type TransitEvent } from "@/components/cards/TransitCard";
import { timingIndicator }    from "@/lib/timingIndicator";
import { getTransitDescription } from "@/lib/transitCopy";
import {
  getBodyBlurb,
  getAspectBlurb,
  getCycleBlurb,
} from "@/lib/transitDetail";

// ─── Interpretation copy (meaning layer — EB Garamond italic gold) ────────────
// Placeholder text written in the correct register.
// A full voice pass is planned when the AI interpretation layer is built.
// Do not treat as canonical voice examples — see CLAUDE.md.

const INTERPRETATIONS: Record<TransitEvent["transitType"], string> = {
  conjunction:    "Two planets occupy the same degree — their energies compress into a single point. Whatever themes each body rules become inseparable for this period. What seeds are you willing to plant here, knowing they carry unusual weight?",
  trine:          "An easy current flows between these two planetary bodies. Their natures are compatible, and what you build under this configuration tends to hold. The work is not to force it — the work is to show up.",
  square:         "Friction as teacher. The square asks you to hold two sets of needs that resist each other simultaneously. The tension is not an obstacle to the work — the tension is the work. Something is being forged.",
  opposition:     "A mirror appears between two parts of your chart. Something that has been operating quietly in the background insists on being seen. Both sides carry truth. The task is integration, not choosing.",
  sextile:        "A quiet opening. Compatible energies extend an invitation they will not press. The opportunity is real but requires your participation to activate. What would you do if the path were actually clear?",
  ingress:        "A planet crossing a sign boundary marks a distinct shift in the quality of its expression. The themes of the incoming sign become the new medium. This is less an event than a change in atmosphere.",
  "station-retrograde":    "A planet slows to a halt before reversing direction — one of the most potent moments in any planetary cycle. The forward motion that has been accumulating pauses. What has been building now turns inward for review.",
  "station-direct":        "After weeks of retrograde motion, a planet resumes forward momentum. The period of review is complete. What was reconsidered can now be integrated and carried forward with greater clarity.",
  "eclipse-solar":         "A solar eclipse supercharges the energy of a new moon — the lights align at the nodal axis, marking a threshold. What is seeded here carries extraordinary weight. Eclipses often coincide with irreversible turns.",
  "eclipse-lunar":         "A lunar eclipse brings a full moon to the nodal axis, illuminating what must be released. The emotional reckoning is sharper and more final than an ordinary full moon. Something closes.",
  "new-moon":              "The lunation cycle begins again. The conjunction of Sun and Moon is an invitation to set intention before the light returns. What you initiate in the three days following tends to carry through the full cycle.",
  "full-moon":             "The Sun and Moon stand opposite one another, illuminating what the new moon seeded. Culmination, revelation, release. Whatever has been building in the intervening two weeks reaches its peak of visibility.",
  "blood-moon":            "A total lunar eclipse. The Moon moves through Earth's shadow and emerges changed. Something completing now carries real weight. What you've been carrying may be ready to set down.",
  "super-moon":            "A Full Moon closer to Earth than usual. What it illuminates feels nearer too. The emotional pull is amplified. Hard to look away.",
  "blue-moon":             "A second Full Moon within the same month. Something that doesn't usually get a second look. An invitation to finish what the first one started.",
  "harvest-moon":          "The Full Moon that rises nearest the autumn equinox. Light that lingers past dark. What has been cultivated through the year is ready to be gathered.",
  "super-blue-blood-moon": "Three cycles converging at once. Rare, and not accidental. Whatever this moment is asking of you, it has been patient.",
};

// ─── Cycle event type set ─────────────────────────────────────────────────────
// Determines whether CYCLE or ASPECT section renders.
// ASPECT and CYCLE are mutually exclusive — never both.

const CYCLE_TYPES = new Set<TransitEvent["transitType"]>([
  "new-moon", "full-moon", "blood-moon", "super-moon",
  "blue-moon", "harvest-moon", "eclipse-lunar", "eclipse-solar",
  "super-blue-blood-moon",
]);

// ─── Stable peak date formatter ───────────────────────────────────────────────
// Produces: "Peaks Friday, March 20, 2026"
// Uses explicit arrays to guarantee consistent [Day], [Month] [Date], [Year]
// format regardless of locale.

const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatPeakPassage(date: Date): string {
  return `Peaks ${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface TransitDetailProps {
  event:  TransitEvent;
  onBack: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TransitDetail({ event, onBack }: TransitDetailProps) {
  const timing      = timingIndicator(event.peakDate);
  const interp      = INTERPRETATIONS[event.transitType];
  const isCycle     = CYCLE_TYPES.has(event.transitType);
  const description = getTransitDescription(event, event.house);

  // Bodies to show — primary planet always; target planet when present
  const bodies: string[] = [event.planet];
  if (event.targetPlanet) bodies.push(event.targetPlanet);

  // Single blurb lookup — cycle or aspect, never both
  const sectionBlurb = isCycle
    ? getCycleBlurb(event.transitType)
    : getAspectBlurb(event.transitType);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Ghost back button — no border, tertiary text per CTA hierarchy */}
      <div style={{ padding: "14px 20px 0", flexShrink: 0 }}>
        <button
          onClick={onBack}
          style={{
            background:    "none",
            border:        "none",
            cursor:        "pointer",
            display:       "flex",
            alignItems:    "center",
            gap:           5,
            color:         "#4A5060",
            fontSize:      10,
            fontWeight:    500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding:       "4px 0",
            transition:    "color 280ms ease-out",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#8B909C"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#4A5060"; }}
        >
          ← Back to feed
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 28px" }}>

        {/* ── Header ─────────────────────────────────────────────────────────── */}

        {/* Timing indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          {timing.dot && (
            <div
              style={{
                width:        5,
                height:       5,
                borderRadius: "50%",
                background:   timing.dot,
                boxShadow:    `0 0 7px ${timing.dot}`,
                flexShrink:   0,
              }}
            />
          )}
          <span
            style={{
              fontSize:      10,
              fontWeight:    500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color:         timing.color,
            }}
          >
            {timing.text}
          </span>
        </div>

        {/* Title — EB Garamond display */}
        <h2
          style={{
            fontFamily:    "EB Garamond, Georgia, serif",
            fontSize:      26,
            fontWeight:    400,
            color:         "#E2E4EA",
            lineHeight:    1.2,
            margin:        "0 0 4px",
            letterSpacing: "0.01em",
          }}
        >
          {event.title}
        </h2>

        {/* House — secondary text below title, only when birth data present */}
        {event.house != null && (
          <div
            style={{
              fontSize:      11,
              fontWeight:    400,
              color:         "#8B909C",
              letterSpacing: "0.02em",
              marginBottom:  6,
            }}
          >
            House {event.house}
          </div>
        )}

        {/* Hook line — card description in data layer register */}
        {description ? (
          <p
            style={{
              fontSize:   12,
              color:      "#8B909C",
              margin:     "0 0 28px",
              lineHeight: 1.55,
            }}
          >
            {description}
          </p>
        ) : (
          <div style={{ marginBottom: 28 }} />
        )}

        {/* ── BODIES ─────────────────────────────────────────────────────────── */}

        <SectionLabel>Bodies</SectionLabel>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
          {bodies.map((bodyName) => (
            <BodyRow
              key={bodyName}
              name={bodyName}
              blurb={getBodyBlurb(bodyName)}
            />
          ))}
        </div>

        {/* ── ASPECT or CYCLE (mutually exclusive) ───────────────────────────── */}

        <SectionLabel>{isCycle ? "Cycle" : "Aspect"}</SectionLabel>

        <div style={{ marginBottom: 28 }}>
          {/* Event type name + icon */}
          <div
            style={{
              display:    "flex",
              alignItems: "center",
              gap:        8,
              marginBottom: sectionBlurb ? 8 : 0,
            }}
          >
            <EventIcon isCycle={isCycle} />
            <span
              style={{
                fontSize:      12,
                fontWeight:    600,
                color:         "#E2E4EA",
                letterSpacing: "0.02em",
              }}
            >
              {event.aspect}
            </span>
          </div>

          {/* Blurb — null means omit; section header + name still render */}
          {sectionBlurb && (
            <p
              style={{
                fontSize:   12,
                color:      "#8B909C",
                margin:     "0 0 0 22px",
                lineHeight: 1.6,
              }}
            >
              {sectionBlurb}
            </p>
          )}
        </div>

        {/* ── PASSAGE ────────────────────────────────────────────────────────── */}

        <SectionLabel>Passage</SectionLabel>

        <div style={{ marginBottom: 28 }}>
          <CalendarStrip peakDate={event.peakDate} />
          <p
            style={{
              fontSize:      11,
              color:         "#8B909C",
              margin:        0,
              letterSpacing: "0.01em",
            }}
          >
            {formatPeakPassage(event.peakDate)}
          </p>
        </div>

        {/* ── INTERPRETATION ─────────────────────────────────────────────────── */}

        <SectionLabel>Interpretation</SectionLabel>

        <div style={{ marginBottom: 28 }}>
          <p
            style={{
              fontFamily: "EB Garamond, Georgia, serif",
              fontStyle:  "italic",
              fontSize:   16,
              color:      "#C8A96E",
              lineHeight: 1.7,
              margin:     0,
            }}
          >
            {interp}
          </p>
        </div>

        {/* ── REFLECT CTA — primary gold, unchanged ──────────────────────────── */}

        <button
          style={{
            width:         "100%",
            padding:       "13px 20px",
            background:    "rgba(200,169,110,0.10)",
            border:        "0.5px solid #C8A96E",
            borderTop:     "0.5px solid rgba(255,220,160,0.55)",
            borderRadius:  7,
            color:         "#E8D8A8",
            fontSize:      12,
            fontWeight:    500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor:        "pointer",
            transition:    "background 280ms ease-out",
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

// ─── Helper components ────────────────────────────────────────────────────────

/** Section label — uppercase, tracked, text/3. Locked section names per spec. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize:      9,
        fontWeight:    600,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color:         "#4A5060",
        marginBottom:  10,
        paddingBottom: 7,
        borderBottom:  "0.5px solid rgba(255,255,255,0.05)",
      }}
    >
      {children}
    </div>
  );
}

/** Body row — icon placeholder + bold name + optional blurb. */
function BodyRow({ name, blurb }: { name: string; blurb: string | null }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>

      {/* Icon placeholder — 20px circle, to be replaced with glyph icons */}
      <div
        style={{
          width:        20,
          height:       20,
          borderRadius: "50%",
          border:       "0.5px solid rgba(255,255,255,0.10)",
          background:   "rgba(255,255,255,0.03)",
          flexShrink:   0,
          marginTop:    1,
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width:        4,
            height:       4,
            borderRadius: "50%",
            background:   "#4A5060",
          }}
        />
      </div>

      <div>
        <div
          style={{
            fontSize:      12,
            fontWeight:    600,
            color:         "#E2E4EA",
            marginBottom:  blurb ? 3 : 0,
            letterSpacing: "0.01em",
          }}
        >
          {name}
        </div>
        {blurb && (
          <div
            style={{
              fontSize:   12,
              color:      "#8B909C",
              lineHeight: 1.55,
            }}
          >
            {blurb}
          </div>
        )}
      </div>

    </div>
  );
}

/**
 * Aspect/cycle icon placeholder — geometric stub.
 * Cycles: circle (lunar resonance). Aspects: rotated square.
 * To be replaced with proper glyph icons in a later pass.
 */
function EventIcon({ isCycle }: { isCycle: boolean }) {
  return (
    <div
      style={{
        width:          14,
        height:         14,
        flexShrink:     0,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width:        10,
          height:       10,
          borderRadius: isCycle ? "50%" : 2,
          border:       "0.5px solid #4A5060",
          transform:    isCycle ? "none" : "rotate(45deg)",
        }}
      />
    </div>
  );
}

/**
 * Calendar strip — 14-cell window centered on the peak date.
 * Peak cell: gold highlight. Orb window (±3 days): medium brightness. Beyond: dimmed.
 */
function CalendarStrip({ peakDate }: { peakDate: Date }) {
  // Use UTC to avoid DST / timezone edge cases when computing day offsets
  const peakMs = Date.UTC(
    peakDate.getFullYear(),
    peakDate.getMonth(),
    peakDate.getDate(),
  );
  const DAY_MS  = 86_400_000;
  const ORB_DAYS = 3;

  // 14 cells: offset -6 through +7 (peak at position 7, slightly left of center)
  const cells = Array.from({ length: 14 }, (_, i) => {
    const offset = i - 6;
    const d      = new Date(peakMs + offset * DAY_MS);
    return {
      offset,
      dayNum:  d.getUTCDate(),
      isPeak:  offset === 0,
      inOrb:   offset !== 0 && Math.abs(offset) <= ORB_DAYS,
    };
  });

  return (
    <div
      style={{
        display:       "flex",
        gap:           2,
        marginBottom:  10,
      }}
    >
      {cells.map(({ offset, dayNum, isPeak, inOrb }) => (
        <div
          key={offset}
          style={{
            flex:           1,
            height:         30,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            borderRadius:   3,
            background:     isPeak ? "rgba(200,169,110,0.16)"
                          : inOrb  ? "rgba(255,255,255,0.05)"
                          :          "transparent",
            border:         isPeak ? "0.5px solid rgba(200,169,110,0.45)"
                          :          "0.5px solid transparent",
          }}
        >
          <span
            style={{
              fontSize:   9,
              fontWeight: isPeak ? 600 : 400,
              color:      isPeak ? "#C8A96E"
                        : inOrb ? "#8B909C"
                        :         "#4A5060",
              lineHeight: 1,
            }}
          >
            {dayNum}
          </span>
        </div>
      ))}
    </div>
  );
}
