"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GlassPanel from "@/components/ui/GlassPanel";
import { upsertEntry, deleteEntry, type JournalEntry } from "@/lib/journal";
import AttachComponent, { type Attachment } from "@/components/journal/AttachComponent";

import TopNav from "@/components/ui/TopNav";

// ─── Date / time helper ───────────────────────────────────────────────────────

const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDateTime(date: Date): string {
  const weekday = WEEKDAYS[date.getDay()];
  const month   = MONTHS[date.getMonth()];
  const day     = date.getDate();
  const raw     = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const amPm    = raw >= 12 ? "PM" : "AM";
  const hours   = raw % 12 || 12;
  return `${weekday}, ${month} ${day} · ${hours}:${minutes} ${amPm}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewEntryPage() {
  const router = useRouter();

  const [title, setTitle]           = useState("");
  const [body, setBody]             = useState("");
  const [savedEntry, setSavedEntry] = useState<JournalEntry | null>(null);
  const [isEditMode, setIsEditMode] = useState(true);
  const [showBurnModal, setShowBurnModal] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);

  // Stable entry ID — generated once on mount, never changes during session
  const entryIdRef    = useRef("");
  // Ref mirror of savedEntry for reads inside saveEntry without closure issues
  const savedEntryRef = useRef<JournalEntry | null>(null);
  // Ref mirror of attachment for synchronous reads inside saveEntry
  const attachmentRef = useRef<Attachment | null>(null);
  const titleRef      = useRef<HTMLInputElement>(null);
  const bodyRef       = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    entryIdRef.current = crypto.randomUUID();
  }, []);

  // ─── Textarea auto-resize ───────────────────────────────────────────────────

  function autoResize() {
    const el = bodyRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  useEffect(() => {
    autoResize();
  }, [body]);

  // ─── Auto-save ──────────────────────────────────────────────────────────────

  function saveEntry(newTitle: string, newBody: string) {
    if (!entryIdRef.current) return;
    const now  = new Date().toISOString();
    const prev = savedEntryRef.current;
    const att  = attachmentRef.current;

    // Derive entry_type, context_id, context_data from attachment
    let entry_type: JournalEntry["entry_type"] = "freeform";
    let context_id: string | undefined;
    let context_data: Record<string, unknown> | undefined;

    if (att) {
      if (att.type === "transit") {
        entry_type   = "transit";
        context_id   = att.data.transit.id;
        context_data = { transit: att.data };
      } else {
        entry_type = "natal";
        if (att.type === "house") {
          context_id   = String(att.data.number);
          context_data = { house: att.data };
        } else {
          // configuration — key: "type:Planet1,Planet2,..."
          context_id   = `${att.data.type}:${Array.from(att.data.planets).sort().join(",")}`;
          context_data = { configuration: att.data };
        }
      }
    }

    const entry: JournalEntry = {
      id:         entryIdRef.current,
      title:      newTitle,
      body_text:  newBody,
      entry_type,
      created_at: prev?.created_at ?? now,
      updated_at: now,
      ...(context_id   ? { context_id }   : {}),
      ...(context_data ? { context_data } : {}),
    };
    upsertEntry(entry);
    savedEntryRef.current = entry;
    setSavedEntry(entry);
  }

  // ─── Burn ───────────────────────────────────────────────────────────────────

  const hasContent = title.trim().length > 0 || body.trim().length > 0;

  function handleFlameClick() {
    if (!hasContent) {
      router.push("/journal");
    } else {
      setShowBurnModal(true);
    }
  }

  function handleBurn() {
    if (savedEntry) deleteEntry(savedEntry.id);
    router.push("/journal");
  }

  // ─── Edit-mode toggle (mobile only) ────────────────────────────────────────

  function enterEditMode() {
    setIsEditMode(true);
    // Focus title after readOnly is removed — wait one tick for the re-render
    setTimeout(() => titleRef.current?.focus(), 0);
  }

  function exitEditMode() {
    setIsEditMode(false);
    titleRef.current?.blur();
    bodyRef.current?.blur();
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100dvh", background: "#0D1117" }}>

      {/* Placeholder CSS for styled placeholders — no CSS module needed */}
      <style>{`
        .vigil-title::placeholder {
          font-family: EB Garamond, Georgia, serif;
          font-size:   28px;
          font-weight: 400;
          color:       #4A5060;
        }
        .vigil-body::placeholder {
          font-family: EB Garamond, Georgia, serif;
          font-style:  italic;
          font-size:   16px;
          color:       #4A5060;
        }
      `}</style>

      
      <TopNav position="sticky" />


      {/* ── Sticky header — full viewport width ─────────────────────────────── */}
      <header
        className="top-0 md:top-[52px]"
        style={{
          position:             "sticky",
          zIndex:               10,
          width:                "100%",
          display:              "flex",
          alignItems:           "center",
          justifyContent:       "space-between",
          padding:              "12px 24px",
          background:           "rgba(13,17,23,0.85)",
          backdropFilter:       "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxSizing:            "border-box",
        }}
      >
        {/* Left — ghost back link */}
        <button
          onClick={() => router.push("/journal")}
          style={{
            background:    "none",
            border:        "none",
            cursor:        "pointer",
            display:       "flex",
            alignItems:    "center",
            gap:           5,
            color:         "#8B909C",
            fontSize:      12,
            fontFamily:    "system-ui, -apple-system, sans-serif",
            fontWeight:    400,
            letterSpacing: "0.02em",
            padding:       "4px 0",
            transition:    "color 280ms ease-out",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#E2E4EA"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#8B909C"; }}
        >
          ← Journal
        </button>

        {/* Right — icon group */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

          {/* Edit / check toggle — mobile only */}
          <button
            className="md:hidden"
            onClick={isEditMode ? exitEditMode : enterEditMode}
            aria-label={isEditMode ? "Exit edit mode" : "Edit entry"}
            style={{
              background:    "none",
              border:        "none",
              cursor:        "pointer",
              color:         "#8B909C",
              fontSize:      16,
              lineHeight:    1,
              padding:       "4px 6px",
              transition:    "color 280ms ease-out",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#E2E4EA"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#8B909C"; }}
          >
            {isEditMode ? "✓" : "✏"}
          </button>

          {/* Flame — always present */}
          <button
            onClick={handleFlameClick}
            aria-label="Burn entry"
            style={{
              background: "none",
              border:     "none",
              cursor:     "pointer",
              fontSize:   16,
              lineHeight: 1,
              padding:    "4px 6px",
              opacity:    hasContent ? 1 : 0.4,
              transition: "opacity 280ms ease-out",
            }}
          >
            🔥
          </button>
        </div>
      </header>

      {/* ── Content column — max 680px centered ─────────────────────────────── */}
      <div
        style={{
          maxWidth:    680,
          margin:      "0 auto",
          padding:     "32px 24px 160px",
          boxSizing:   "border-box",
        }}
      >

        {/* Attach region */}
        <AttachComponent
          attachment={attachment}
          onAttach={(a) => {
            attachmentRef.current = a;
            setAttachment(a);
            saveEntry(title, body);
          }}
          onRemove={() => {
            attachmentRef.current = null;
            setAttachment(null);
            saveEntry(title, body);
          }}
        />

        {/* Last-changed timestamp — appears after first auto-save */}
        {savedEntry && (
          <p
            style={{
              fontFamily:    "system-ui, -apple-system, sans-serif",
              fontSize:      11,
              color:         "#4A5060",
              margin:        "0 0 20px",
              letterSpacing: "0.01em",
            }}
          >
            {formatDateTime(new Date(savedEntry.updated_at))}
          </p>
        )}

        {/* Title field */}
        <input
          ref={titleRef}
          type="text"
          className="vigil-title"
          value={title}
          placeholder="Untitled entry"
          readOnly={!isEditMode}
          onChange={(e) => {
            const v = e.target.value;
            setTitle(v);
            saveEntry(v, body);
          }}
          style={{
            display:        "block",
            width:          "100%",
            fontFamily:     "EB Garamond, Georgia, serif",
            fontSize:       28,
            fontWeight:     400,
            color:          "#E2E4EA",
            background:     "none",
            border:         "none",
            outline:        "none",
            padding:        0,
            margin:         "0 0 20px",
            letterSpacing:  "0.01em",
            lineHeight:     1.2,
            boxSizing:      "border-box",
            cursor:         isEditMode ? "text" : "default",
          }}
        />

        {/* Body textarea — auto-expands, no scroll */}
        <textarea
          ref={bodyRef}
          className="vigil-body"
          value={body}
          placeholder="The page beckons."
          readOnly={!isEditMode}
          rows={1}
          onChange={(e) => {
            const v = e.target.value;
            setBody(v);
            saveEntry(title, v);
          }}
          style={{
            display:    "block",
            width:      "100%",
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize:   15,
            color:      "#8B909C",
            background: "none",
            border:     "none",
            outline:    "none",
            resize:     "none",
            overflow:   "hidden",
            padding:    0,
            margin:     0,
            minHeight:  160,
            lineHeight: 1.7,
            boxSizing:  "border-box",
            cursor:     isEditMode ? "text" : "default",
          }}
        />
      </div>

      {/* ── Burn confirmation modal ──────────────────────────────────────────── */}
      {showBurnModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Burn confirmation"
          onClick={() => setShowBurnModal(false)}
          style={{
            position:       "fixed",
            inset:          0,
            zIndex:         50,
            background:     "rgba(0,0,0,0.6)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            padding:        "0 24px",
          }}
        >
          <GlassPanel
            onClick={(e) => e.stopPropagation()}
            style={{
              width:      "90%",
              maxWidth:   360,
              padding:    "28px 24px",
              boxSizing:  "border-box",
            }}
          >
            {/* Title */}
            <h2
              style={{
                fontFamily:    "EB Garamond, Georgia, serif",
                fontSize:      20,
                fontWeight:    400,
                color:         "#E2E4EA",
                margin:        "0 0 10px",
                letterSpacing: "0.01em",
                lineHeight:    1.2,
              }}
            >
              Burn this page?
            </h2>

            {/* Body */}
            <p
              style={{
                fontFamily:    "system-ui, -apple-system, sans-serif",
                fontSize:      13,
                color:         "#8B909C",
                margin:        "0 0 24px",
                lineHeight:    1.6,
              }}
            >
              This entry will be released. It cannot be recalled.
            </p>

            {/* CTAs — confirm right */}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>

              {/* Cancel — secondary ghost */}
              <button
                onClick={() => setShowBurnModal(false)}
                style={{
                  padding:       "10px 20px",
                  background:    "none",
                  border:        "0.5px solid rgba(255,255,255,0.12)",
                  borderRadius:  5,
                  color:         "#8B909C",
                  fontSize:      12,
                  fontWeight:    500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor:        "pointer",
                  fontFamily:    "inherit",
                  transition:    "border-color 280ms ease-out, color 280ms ease-out",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.30)";
                  (e.currentTarget as HTMLElement).style.color       = "#E2E4EA";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)";
                  (e.currentTarget as HTMLElement).style.color       = "#8B909C";
                }}
              >
                Cancel
              </button>

              {/* Burn — primary gold */}
              <button
                onClick={handleBurn}
                style={{
                  padding:       "10px 20px",
                  background:    "rgba(200,169,110,0.10)",
                  border:        "0.5px solid #C8A96E",
                  borderTop:     "0.5px solid rgba(200,169,110,0.55)",
                  borderRadius:  5,
                  color:         "#E8D8A8",
                  fontSize:      12,
                  fontWeight:    500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor:        "pointer",
                  fontFamily:    "inherit",
                  transition:    "background 280ms ease-out",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(200,169,110,0.18)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(200,169,110,0.10)";
                }}
              >
                Burn
              </button>
            </div>
          </GlassPanel>
        </div>
      )}

    </div>
  );
}
