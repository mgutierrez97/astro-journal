"use client";

import { useEffect, useState } from "react";
import { type User } from "@supabase/supabase-js";
import { createClient } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthState = {
  /** The signed-in Supabase User, or null when unauthenticated. */
  user:    User | null;
  /** True until the initial session check has resolved. */
  loading: boolean;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useAuth — subscribe to Supabase auth state.
 *
 * Hydrates from the existing session on mount, then keeps in sync with
 * any sign-in / sign-out events via onAuthStateChange.
 *
 * Returns { user, loading }. Consumed by TopNav, BottomNav, and any
 * component that needs to gate UI on authentication status.
 *
 * Future: when auth gates Reflect CTAs and journal sync, import
 * this hook at those call sites — no other plumbing needed.
 */
export function useAuth(): AuthState {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Hydrate from the persisted session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Stay in sync with sign-in, sign-out, token refresh
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
