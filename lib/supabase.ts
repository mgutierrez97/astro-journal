import { createBrowserClient } from "@supabase/ssr";

/**
 * Returns a Supabase browser client.
 *
 * Uses @supabase/ssr so auth tokens live in cookies rather than
 * localStorage — required for correct session hydration in Next.js
 * App Router. Call inside "use client" components only.
 *
 * createBrowserClient deduplicates internally so repeated calls
 * with the same URL + key return the same underlying instance.
 *
 * Future: when server components / middleware are added, pair this
 * with a createServerClient() helper using the same pattern.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
