// lib/timingIndicator.ts
//
// Shared timing indicator logic for TransitCard and TransitDetail.
// Computes a dot color + label based on days until the transit's peak date.

export const GREEN = "#3EB489";
export const AMBER = "#C9933A";
export const DIM   = "#8B909C";

export interface TimingIndicator {
  dot:   string | null; // hex color, or null for no dot
  text:  string;
  color: string;
}

export function daysUntilPeak(peakDate: Date): number {
  const now     = new Date();
  const todayMs = Date.UTC(now.getFullYear(),      now.getMonth(),      now.getDate());
  const peakMs  = Date.UTC(peakDate.getFullYear(), peakDate.getMonth(), peakDate.getDate());
  return Math.round((peakMs - todayMs) / 86_400_000);
}

export function timingIndicator(peakDate: Date): TimingIndicator {
  const days = daysUntilPeak(peakDate);

  if (days <= 0)  return { dot: GREEN, text: "Today",           color: GREEN };
  if (days === 1) return { dot: AMBER, text: "Tomorrow",        color: AMBER };
  if (days <= 14) return { dot: AMBER, text: `In ${days} days`, color: AMBER };

  const weeks = Math.max(2, Math.floor(days / 7));
  return { dot: null, text: `In ${weeks} weeks`, color: DIM };
}
