"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GlassPanel from "@/components/ui/GlassPanel";
import { createClient } from "@/lib/supabase";

// ─── Email format check ───────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── SSO brand icons ──────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.27.07 2.16.65 2.89.69.84-.17 1.64-.76 3.04-.83 1.38-.07 2.56.52 3.38 1.54-3.29 1.85-2.6 5.9.72 7.17-.45 1.1-.97 2.18-2.03 3.29zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const router = useRouter();

  const [email,   setEmail]   = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  async function initiateOAuth(provider: "google" | "apple") {
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (oauthError) setError("Something went wrong. Try again.");
    // On success the browser navigates to the OAuth provider — no further action.
  }

  // ─── NEXT handler ─────────────────────────────────────────────────────────────

  async function handleNext(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmed = email.trim();

    // 1. Format validation — submit-only, no real-time
    if (!EMAIL_RE.test(trimmed)) {
      setError("That doesn't look like a valid email.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/check-email", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: trimmed }),
      });

      // Parse body from any response status; non-JSON throws to the outer catch.
      const data = (await res.json()) as {
        status:    "new" | "password" | "sso" | "error";
        provider?: "google" | "apple";
      };

      if (data.status === "error") {
        setError("Something went wrong. Try again.");
        return;
      }

      if (data.status === "password") {
        router.push(`/auth/returning?email=${encodeURIComponent(trimmed)}`);
        return;
      }

      if (data.status === "sso" && data.provider) {
        await initiateOAuth(data.provider);
        return;
      }

      // "new" — unrecognised email, route to new-user flow
      router.push(`/auth/new?email=${encodeURIComponent(trimmed)}`);

    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // ─── SSO direct buttons ──────────────────────────────────────────────────────

  async function handleSSO(provider: "google" | "apple") {
    setError("");
    setLoading(true);
    try {
      await initiateOAuth(provider);
    } finally {
      setLoading(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

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
        .vigil-email::placeholder { color: #4A5060; }
        .vigil-email:focus        { border-color: rgba(200,169,110,0.45) !important; }
      `}</style>

      <GlassPanel
        style={{
          width:     "100%",
          maxWidth:  400,
          padding:   "40px 32px 36px",
          boxSizing: "border-box",
        }}
      >

        {/* ── Heading ────────────────────────────────────────────────────────── */}
        <h1
          style={{
            fontFamily:    "EB Garamond, Georgia, serif",
            fontSize:      36,
            fontWeight:    400,
            color:         "#E2E4EA",
            margin:        "0 0 36px",
            letterSpacing: "0.01em",
            lineHeight:    1.15,
            textAlign:     "center",
          }}
        >
          Have we met?
        </h1>

        {/* ── Form ───────────────────────────────────────────────────────────── */}
        <form onSubmit={handleNext} noValidate>

          {/* Email field */}
          <div style={{ marginBottom: error ? 8 : 16 }}>
            <label
              htmlFor="auth-email"
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
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              className="vigil-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your address"
              autoComplete="email"
              autoCapitalize="none"
              autoFocus
              spellCheck={false}
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

          {/* NEXT CTA */}
          <button
            type="submit"
            disabled={loading}
            style={{
              display:       "block",
              width:         "100%",
              padding:       "13px",
              marginBottom:  28,
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
            Next
          </button>

        </form>

        {/* ── Divider ────────────────────────────────────────────────────────── */}
        <div
          style={{
            display:      "flex",
            alignItems:   "center",
            gap:          12,
            marginBottom: 20,
          }}
        >
          <div style={{ flex: 1, height: "0.5px", background: "rgba(255,255,255,0.08)" }} />
          <span
            style={{
              fontFamily:    "system-ui, -apple-system, sans-serif",
              fontSize:      11,
              color:         "#4A5060",
              letterSpacing: "0.06em",
            }}
          >
            or
          </span>
          <div style={{ flex: 1, height: "0.5px", background: "rgba(255,255,255,0.08)" }} />
        </div>

        {/* ── SSO buttons ────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Google */}
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSSO("google")}
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              gap:            10,
              width:          "100%",
              padding:        "12px",
              background:     "transparent",
              border:         "0.5px solid rgba(255,255,255,0.12)",
              borderRadius:   7,
              color:          "#8B909C",
              fontFamily:     "system-ui, -apple-system, sans-serif",
              fontSize:       13,
              fontWeight:     400,
              cursor:         loading ? "not-allowed" : "pointer",
              opacity:        loading ? 0.6 : 1,
              transition:     "border-color 280ms ease-out, color 280ms ease-out, opacity 280ms ease-out",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(255,255,255,0.22)";
                el.style.color       = "#E2E4EA";
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = "rgba(255,255,255,0.12)";
              el.style.color       = "#8B909C";
            }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Apple */}
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSSO("apple")}
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              gap:            10,
              width:          "100%",
              padding:        "12px",
              background:     "transparent",
              border:         "0.5px solid rgba(255,255,255,0.12)",
              borderRadius:   7,
              color:          "#8B909C",
              fontFamily:     "system-ui, -apple-system, sans-serif",
              fontSize:       13,
              fontWeight:     400,
              cursor:         loading ? "not-allowed" : "pointer",
              opacity:        loading ? 0.6 : 1,
              transition:     "border-color 280ms ease-out, color 280ms ease-out, opacity 280ms ease-out",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(255,255,255,0.22)";
                el.style.color       = "#E2E4EA";
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = "rgba(255,255,255,0.12)";
              el.style.color       = "#8B909C";
            }}
          >
            <AppleIcon />
            Continue with Apple
          </button>

        </div>
      </GlassPanel>
    </div>
  );
}
