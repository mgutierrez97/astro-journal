"use client";

import { useEffect, useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

export const JOURNAL_KEY = "vigil-journal-entries";

// ─── Types ────────────────────────────────────────────────────────────────────

export type JournalEntry = {
  id:            string;
  title?:        string;
  created_at:    string;
  updated_at:    string;
  entry_type:    "freeform" | "transit" | "natal" | "spread";
  body_text:     string;
  context_id?:   string;
  context_data?: Record<string, unknown>;
};

// ─── Read helpers ─────────────────────────────────────────────────────────────

function readAll(): JournalEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(JOURNAL_KEY);
  return raw ? (JSON.parse(raw) as JournalEntry[]) : [];
}

// ─── Write helpers ────────────────────────────────────────────────────────────

/**
 * upsertEntry — inserts or updates a journal entry by id.
 * Dispatches "journal-entries-updated" after every write so hooks re-render.
 * Future: replace with Supabase upsert when auth is built.
 */
export function upsertEntry(entry: JournalEntry): void {
  const entries = readAll();
  const idx     = entries.findIndex((e) => e.id === entry.id);
  if (idx >= 0) {
    entries[idx] = entry;
  } else {
    entries.push(entry);
  }
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event("journal-entries-updated"));
}

/**
 * removeEntry / deleteEntry — removes a journal entry by id.
 * Dispatches "journal-entries-updated" so hooks re-render.
 * Used by the burn action.
 */
export function removeEntry(id: string): void {
  const entries  = readAll();
  const filtered = entries.filter((e) => e.id !== id);
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new Event("journal-entries-updated"));
}

/** Alias for removeEntry — preferred name at call sites. */
export const deleteEntry = removeEntry;

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useJournalEntries
 *
 * Reads journal entries from localStorage. Returns an empty array when no
 * entries are stored. Listens for "journal-entries-updated" events so write
 * operations elsewhere can trigger a re-render without prop drilling.
 *
 * Future: replace localStorage read with Supabase query when auth is built.
 */
export function useJournalEntries(): { entries: JournalEntry[] } {
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    function read() {
      setEntries(readAll());
    }

    read();
    window.addEventListener("journal-entries-updated", read);
    return () => window.removeEventListener("journal-entries-updated", read);
  }, []);

  return { entries };
}
