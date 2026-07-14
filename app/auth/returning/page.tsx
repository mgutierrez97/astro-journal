"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GlassPanel from "@/components/ui/GlassPanel";
import { createClient } from "@/lib/supabase";

// ─── Inner component — uses useSearchParams, must be inside Suspense ──────────

function ReturningPageContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const email        = searchParams.get("email") ?? "";

  const [password,   setPassword]   = useState("");
  const [error,      setError]      = useState("");
  const [resetSent,  setResetSent]  = useState(false);
  const [loading,    setLoading]    = useState(false);

  // ─── Sign in ────────────────────────────────────────────────────────────────

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResetSent(false);

    if (!password) return;

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        const msg = signInError.message.toLowerCase();
        // Account exists but email was never confirmed — route to confirmation screen
        if (msg.includes("email not confirmed")) {
          router.replace(`/auth/new/confirm?email=${encodeURIComponent(email)}`);
          return;
        }
        // Supabase returns "Invalid login credentials" for wrong password
        if (
          msg.includes("invalid login credentials") ||
          msg.includes("invalid credentials") ||
          msg.includes("wrong password")
        ) {
          setError("That password is incorrect.");
        } else {
          setError("Something went wrong. Try again.");
        }
        return;
      }

      // Success — navigate to the Feed
      router.push("/");

    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Forgot password ────────────────────────────────────────────────────────

  async function handleReset() {
    if (!email) return;
    setError("");
    setResetSent(false);

    const supabase = createClient();
    // Always show confirmation regardless of outcome to prevent email enumeration
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setResetSent(true);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

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
      {/* Input focus + placeholder styling */}
      <style>{`
        .vigil-password::placeholder { color: #4A5060; }
        .vigil-password:focus        { border-color: rgba(200,169,110,0.45) !important; }
      `}</style>

      <GlassPanel
        style={{
          width:     "100%",
          maxWidth:  400,
          padding:   "40px 32px 36px",
          boxSizing: "border-box",
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
        <div style={{ marginBottom: 36, textAlign: "center" }}>
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
            You&apos;ve returned.
          </h1>
          <p
            style={{
              fontFamily:    "EB Garamond, Georgia, serif",
              fontSize:      18,
              fontWeight:    400,
              color:         "#8B909C",
              margin:        0,
              letterSpacing: "0.01em",
              lineHeight:    1.3,
            }}
          >
            A password is all it takes.
          </p>
        </div>

        {/* ── Form ─────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSignIn} noValidate>

          {/* Email row */}
          <div style={{ marginBottom: 20 }}>
            <p
              style={{
                fontFamily:    "system-ui, -apple-system, sans-serif",
                fontSize:      11,
                fontWeight:    500,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color:         "#8B909C",
                margin:        "0 0 6px",
              }}
            >
              Email
            </p>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
              <span
                style={{
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  fontSize:   15,
                  color:      "#E2E4EA",
                  wordBreak:  "break-all",
                  flex:       1,
                }}
              >
                {email}
              </span>
              <button
                type="button"
                onClick={() => router.push("/auth")}
                style={{
                  background:    "none",
                  border:        "none",
                  padding:       0,
                  fontFamily:    "system-ui, -apple-system, sans-serif",
                  fontSize:      12,
                  color:         "#4A5060",
                  cursor:        "pointer",
                  letterSpacing: "0.02em",
                  flexShrink:    0,
                  transition:    "color 280ms ease-out",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#8B909C"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#4A5060"; }}
              >
                Change
              </button>
            </div>
          </div>

          {/* Password field */}
          <div style={{ marginBottom: (error || resetSent) ? 8 : 16 }}>
            <label
              htmlFor="auth-password"
              style={{
                display:       "block",
                fontFamily:    "system-ui, -apple-system, sans-serif",
                fontSize:      11,
                fontWeight:    500,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color:         "#8B909C",
                marginBottom:  8,
              }}
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              className="vigil-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="········"
              autoComplete="current-password"
              autoFocus
              disabled={loading}
              style={{
                display:      "block",
                width:        "100%",
                fontFamily:   "system-ui, -apple-system, sans-serif",
                fontSize:     15,
                color:        "#E2E4EA",
                background:   "rgba(255,255,255,0.03)",
                border:       error
                  ? "0.5px solid rgba(184,85,85,0.6)"
                  : "0.5px solid rgba(255,255,255,0.08)",
                borderBottom: error
                  ? "0.5px solid rgba(184,85,85,0.8)"
                  : "0.5px solid rgba(255,255,255,0.14)",
                borderRadius: 7,
                padding:      "12px 14px",
                outline:      "none",
                boxSizing:    "border-box",
                opacity:      loading ? 0.6 : 1,
                transition:   "border-color 280ms ease-out, opacity 280ms ease-out",
              }}
            />
          </div>

          {/* Inline error */}
          {error && (
            <p
              style={{
                fontFamily:    "system-ui, -apple-system, sans-serif",
                fontSize:      12,
                color:         "#B85555",
                margin:        "0 0 16px",
                letterSpacing: "0.01em",
                lineHeight:    1.4,
              }}
            >
              {error}
            </p>
          )}

          {/* Reset-sent confirmation */}
          {resetSent && !error && (
            <p
              style={{
                fontFamily:    "system-ui, -apple-system, sans-serif",
                fontSize:      12,
                color:         "#8B909C",
                margin:        "0 0 16px",
                letterSpacing: "0.01em",
                lineHeight:    1.4,
              }}
            >
              Check your email. A reset link is on its way.
            </p>
          )}

          {/* Forgot password link */}
          <div style={{ marginBottom: 24 }}>
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              style={{
                background:    "none",
                border:        "none",
                padding:       0,
                fontFamily:    "system-ui, -apple-system, sans-serif",
                fontSize:      12,
                color:         "#4A5060",
                cursor:        loading ? "not-allowed" : "pointer",
                letterSpacing: "0.02em",
                textDecoration: "underline",
                textDecorationColor: "rgba(74,80,96,0.4)",
                transition:    "color 280ms ease-out",
              }}
              onMouseEnter={(e) => {
                if (!loading)
                  (e.currentTarget as HTMLElement).style.color = "#8B909C";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#4A5060";
              }}
            >
              Forgot your password?
            </button>
          </div>

          {/* ENTER CTA */}
          <button
            type="submit"
            disabled={loading}
            style={{
              display:       "block",
              width:         "100%",
              padding:       "13px",
              background:    "rgba(200,169,110,0.10)",
              border:        "0.5px solid #C8A96E",
              borderTop:     "0.5px solid rgba(232,216,168,0.6)",
              borderRadius:  7,
              color:         "#E8D8A8",
              fontFamily:    "system-ui, -apple-system, sans-serif",
              fontSize:      11,
              fontWeight:    600,
              letterSpacing: "0.11em",
              textTransform: "uppercase",
              cursor:        loading ? "not-allowed" : "pointer",
              opacity:       loading ? 0.6 : 1,
              transition:    "background 280ms ease-out, opacity 280ms ease-out",
            }}
            onMouseEnter={(e) => {
              if (!loading)
                (e.currentTarget as HTMLElement).style.background = "rgba(200,169,110,0.17)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(200,169,110,0.10)";
            }}
          >
            Enter
          </button>

        </form>
      </GlassPanel>
    </div>
  );
}

// ─── Page export — Suspense wrapper required for useSearchParams ──────────────

export default function ReturningPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100dvh", background: "#0D1117" }} />
      }
    >
      <ReturningPageContent />
    </Suspense>
  );
}
