"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Eye, EyeOff } from "lucide-react";
import GlassPanel from "@/components/ui/GlassPanel";
import { createClient } from "@/lib/supabase";

// ─── Inner component — uses useSearchParams, must be inside Suspense ──────────

function NewUserPageContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const email        = searchParams.get("email") ?? "";

  const [password,      setPassword]      = useState("");
  const [showPassword,  setShowPassword]  = useState(false);
  const [submitted,     setSubmitted]     = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [networkError,  setNetworkError]  = useState("");

  const meetsLength = password.length >= 8;

  // Guard: missing email means the user landed here directly — send them back
  useEffect(() => {
    if (!email) router.replace("/auth");
  }, [email, router]);

  // ─── Submit handler ──────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!meetsLength) return;

    setNetworkError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });

      if (signUpError) {
        const msg = signUpError.message.toLowerCase();
        if (msg.includes("already registered") || msg.includes("user already exists")) {
          // Email belongs to an existing account — silently redirect to sign-in
          router.replace(`/auth/returning?email=${encodeURIComponent(email)}`);
          return;
        }
        setNetworkError("Something went wrong. Try again.");
        return;
      }

      // Success — proceed to email confirmation screen
      router.push(`/auth/new/confirm?email=${encodeURIComponent(email)}`);
    } catch {
      setNetworkError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!email) {
    return <div style={{ minHeight: "100dvh", background: "#0D1117" }} />;
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
        .vigil-new-pw::placeholder { color: #4A5060; }
        .vigil-new-pw:focus        { border-color: rgba(200,169,110,0.45) !important; }
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
            Let&apos;s begin.
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
            Choose a password. It&apos;s how you&apos;ll return.
          </p>
        </div>

        {/* ── Form ─────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate>

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
          <div style={{ marginBottom: 6 }}>
            <label
              htmlFor="auth-new-password"
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

            {/* Wrapper for input + eye toggle */}
            <div style={{ position: "relative" }}>
              <input
                id="auth-new-password"
                type={showPassword ? "text" : "password"}
                className="vigil-new-pw"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="········"
                autoComplete="new-password"
                autoFocus
                disabled={loading}
                style={{
                  display:      "block",
                  width:        "100%",
                  fontFamily:   "system-ui, -apple-system, sans-serif",
                  fontSize:     15,
                  color:        "#E2E4EA",
                  background:   "rgba(255,255,255,0.03)",
                  border:       "0.5px solid rgba(255,255,255,0.08)",
                  borderBottom: "0.5px solid rgba(255,255,255,0.14)",
                  borderRadius: 7,
                  padding:      "12px 42px 12px 14px",
                  outline:      "none",
                  boxSizing:    "border-box",
                  transition:   "border-color 280ms ease-out",
                }}
              />

              {/* Eye toggle */}
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position:        "absolute",
                  right:           12,
                  top:             "50%",
                  transform:       "translateY(-50%)",
                  background:      "none",
                  border:          "none",
                  padding:         0,
                  cursor:          "pointer",
                  color:           "#4A5060",
                  display:         "flex",
                  alignItems:      "center",
                  transition:      "color 280ms ease-out",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#8B909C"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#4A5060"; }}
              >
                {showPassword
                  ? <EyeOff size={15} strokeWidth={1.5} />
                  : <Eye    size={15} strokeWidth={1.5} />
                }
              </button>
            </div>
          </div>

          {/* Hint + submit error */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {meetsLength && (
                <Check size={11} strokeWidth={2.5} color="#3EB489" style={{ flexShrink: 0 }} />
              )}
              <span
                style={{
                  fontFamily:    "system-ui, -apple-system, sans-serif",
                  fontSize:      11,
                  color:         meetsLength
                    ? "#3EB489"
                    : submitted && !meetsLength
                      ? "#B85555"
                      : "#4A5060",
                  letterSpacing: "0.02em",
                  lineHeight:    1.4,
                  transition:    "color 280ms ease-out",
                }}
              >
                8+ characters
              </span>
            </div>

            {submitted && !meetsLength && (
              <p
                style={{
                  fontFamily:    "system-ui, -apple-system, sans-serif",
                  fontSize:      12,
                  color:         "#B85555",
                  margin:        "4px 0 0",
                  letterSpacing: "0.01em",
                  lineHeight:    1.4,
                }}
              >
                Not quite enough yet.
              </p>
            )}
          </div>

          {/* NEXT CTA */}
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
            Next
          </button>

          {/* Network / server error */}
          {networkError && (
            <p
              style={{
                fontFamily:    "system-ui, -apple-system, sans-serif",
                fontSize:      12,
                color:         "#B85555",
                margin:        "12px 0 0",
                letterSpacing: "0.01em",
                lineHeight:    1.4,
                textAlign:     "center",
              }}
            >
              {networkError}
            </p>
          )}

        </form>
      </GlassPanel>
    </div>
  );
}

// ─── Page export — Suspense wrapper required for useSearchParams ──────────────

export default function AuthNewPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100dvh", background: "#0D1117" }} />
      }
    >
      <NewUserPageContent />
    </Suspense>
  );
}
