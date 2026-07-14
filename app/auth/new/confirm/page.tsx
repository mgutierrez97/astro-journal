"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GlassPanel from "@/components/ui/GlassPanel";
import { createClient } from "@/lib/supabase";

// ─── Cooldown helpers ─────────────────────────────────────────────────────────

const COOLDOWN_S  = 45;
const storageKey  = (email: string) => `vigil-confirmation-sent:${email}`;

function getRemaining(email: string): number {
  try {
    const raw = localStorage.getItem(storageKey(email));
    if (!raw) return 0;
    const elapsedMs = Date.now() - Number(raw);
    return Math.max(0, Math.ceil((COOLDOWN_S * 1000 - elapsedMs) / 1000));
  } catch {
    return 0;
  }
}

function stampNow(email: string) {
  try {
    localStorage.setItem(storageKey(email), String(Date.now()));
  } catch { /* storage unavailable */ }
}

function hasStamp(email: string): boolean {
  try {
    return localStorage.getItem(storageKey(email)) !== null;
  } catch {
    return false;
  }
}

// ─── Inner component — uses useSearchParams, must be inside Suspense ──────────

function ConfirmPageContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const email        = searchParams.get("email") ?? "";

  const [countdown, setCountdown] = useState(0);
  const [loading,   setLoading]   = useState(false);

  // Guard: missing email → back to start
  useEffect(() => {
    if (!email) router.replace("/auth");
  }, [email, router]);

  // Initialise cooldown on mount; auto-send on first arrival
  useEffect(() => {
    if (!email) return;
    const remaining = getRemaining(email);
    if (remaining > 0) {
      setCountdown(remaining);
      return;
    }
    // No prior send for this email — first arrival from signup, trigger automatically
    if (!hasStamp(email)) {
      const supabase = createClient();
      supabase.auth.resend({ type: "signup", email }).finally(() => {
        stampNow(email);
        setCountdown(COOLDOWN_S);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tick — setTimeout re-schedules itself each render while countdown > 0
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  if (!email) {
    return <div style={{ minHeight: "100dvh", background: "#0D1117" }} />;
  }

  // ─── Resend handler ──────────────────────────────────────────────────────────

  async function handleResend() {
    if (loading || countdown > 0) return;
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.resend({ type: "signup", email });
    } finally {
      stampNow(email);
      setCountdown(COOLDOWN_S);
      setLoading(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const resendActive = !loading && countdown === 0;

  return (
    <div
      style={{
        minHeight:      "100dvh",
        background:     "#0D1117",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "24px",
        boxSizing:      "border-box",
      }}
    >
      <GlassPanel
        style={{
          width:     "100%",
          maxWidth:  400,
          padding:   "40px 32px 36px",
          boxSizing: "border-box",
          textAlign: "center",
        }}
      >

        {/* ── Back button ──────────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => router.push("/auth")}
          style={{
            display:       "block",
            background:    "none",
            border:        "none",
            padding:       "0 0 20px",
            fontFamily:    "system-ui, -apple-system, sans-serif",
            fontSize:      13,
            color:         "#4A5060",
            cursor:        "pointer",
            letterSpacing: "0.02em",
            transition:    "color 280ms ease-out",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#8B909C"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#4A5060"; }}
        >
          ← Back
        </button>

        {/* ── Heading ──────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 36 }}>
          <h1
            style={{
              fontFamily:    "EB Garamond, Georgia, serif",
              fontSize:      36,
              fontWeight:    400,
              color:         "#E2E4EA",
              margin:        "0 0 10px",
              letterSpacing: "0.01em",
              lineHeight:    1.15,
            }}
          >
            Almost there.
          </h1>
          <p
            style={{
              fontFamily:    "EB Garamond, Georgia, serif",
              fontSize:      18,
              fontWeight:    400,
              color:         "#8B909C",
              margin:        0,
              letterSpacing: "0.01em",
              lineHeight:    1.4,
            }}
          >
            Check your inbox. The link there brings you back.
          </p>
        </div>

        {/* ── Email display ─────────────────────────────────────────────────── */}
        <p
          style={{
            fontFamily:    "system-ui, -apple-system, sans-serif",
            fontSize:      15,
            color:         "#E2E4EA",
            margin:        "0 0 20px",
            letterSpacing: "0.01em",
            wordBreak:     "break-all",
          }}
        >
          {email}
        </p>

        {/* ── Resend / cooldown ─────────────────────────────────────────────── */}
        <div style={{ marginBottom: 0 }}>
          {resendActive ? (
            <button
              type="button"
              onClick={handleResend}
              style={{
                background:    "none",
                border:        "none",
                padding:       0,
                fontFamily:    "system-ui, -apple-system, sans-serif",
                fontSize:      13,
                color:         "#4A5060",
                cursor:        "pointer",
                letterSpacing: "0.02em",
                textDecoration: "underline",
                textDecorationColor: "rgba(74,80,96,0.4)",
                transition:    "color 280ms ease-out",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#8B909C"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#4A5060"; }}
            >
              Resend confirmation
            </button>
          ) : (
            <span
              style={{
                fontFamily:    "system-ui, -apple-system, sans-serif",
                fontSize:      13,
                color:         "#4A5060",
                letterSpacing: "0.02em",
              }}
            >
              {loading ? "Sending…" : `Resend in ${countdown}s`}
            </span>
          )}
        </div>

      </GlassPanel>
    </div>
  );
}

// ─── Page export — Suspense wrapper required for useSearchParams ──────────────

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100dvh", background: "#0D1117" }} />
      }
    >
      <ConfirmPageContent />
    </Suspense>
  );
}
