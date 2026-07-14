import { NextRequest, NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────

type CheckEmailResponse =
  | { status: "new" }
  | { status: "password" }
  | { status: "sso"; provider: "google" | "apple" }
  | { status: "error" };

// GoTrue admin user shape — only the fields we need
type GoTrueUser = {
  id:          string;
  email?:      string;
  identities?: { provider: string }[];
};

// ─── Route handler ────────────────────────────────────────────────────────────

/**
 * POST /api/auth/check-email
 *
 * Body:    { email: string }
 * Returns: CheckEmailResponse
 *
 * Calls the Supabase / GoTrue admin REST API directly using the service role
 * key. The SDK (v2) does not expose a getUserByEmail helper, so we call the
 * admin HTTP endpoint ourselves, filter the results to an exact match, and
 * determine which auth flow to use.
 *
 * The service role key is server-only and never reaches the browser.
 * Rate limiting is handled by Vercel middleware (5 req / IP / hour).
 */
export async function POST(
  req: NextRequest
): Promise<NextResponse<CheckEmailResponse | { error: string }>> {

  // ── Parse body ─────────────────────────────────────────────────────────────
  let email: string;
  try {
    const body = (await req.json()) as { email?: unknown };
    if (typeof body.email !== "string" || !body.email.trim()) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }
    email = body.email.trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  // ── Admin REST call — GET /auth/v1/admin/users?filter=EMAIL ────────────────
  // GoTrue uses the `filter` param as a substring match against email/phone.
  // We pass the exact address and re-verify with an exact comparison in JS
  // so a partial match never produces a false positive.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  let users: GoTrueUser[] = [];
  try {
    const qs = new URLSearchParams({ filter: email, page: "1", per_page: "50" });
    const resp = await fetch(`${supabaseUrl}/auth/v1/admin/users?${qs.toString()}`, {
      headers: {
        apikey:        serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    if (resp.ok) {
      const body = (await resp.json()) as { users?: GoTrueUser[] };
      users = body.users ?? [];
    } else {
      // Non-ok response from Supabase (e.g. misconfigured project, 5xx) —
      // surface as an explicit error so the client can show feedback.
      return NextResponse.json({ status: "error" }, { status: 500 });
    }
  } catch {
    // Network failure reaching Supabase — surface as explicit error.
    return NextResponse.json({ status: "error" }, { status: 500 });
  }

  // ── Exact-match the returned users ─────────────────────────────────────────
  const user = users.find((u) => u.email?.toLowerCase() === email);

  if (!user) {
    return NextResponse.json({ status: "new" });
  }

  // ── Determine provider ─────────────────────────────────────────────────────
  const providers = (user.identities ?? []).map((id) => id.provider);

  if (providers.includes("google")) {
    return NextResponse.json({ status: "sso", provider: "google" });
  }
  if (providers.includes("apple")) {
    return NextResponse.json({ status: "sso", provider: "apple" });
  }

  return NextResponse.json({ status: "password" });
}
