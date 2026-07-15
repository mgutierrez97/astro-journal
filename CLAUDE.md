# Vigil — Project Context

This file is loaded automatically by Claude Code at the start of every session.
Read it fully before doing anything else.

---

## What this product is

A mobile-first responsive web app that combines a planetary transit feed, a natal
chart profile page, and a reflective journal — connected through an AI interpretation
layer powered by the Anthropic API (Claude).

The core insight: the interpretive value of an astrological transit is proportional
to how much personal context surrounds it. Generic horoscopes are everywhere. A tool
that combines real-time ephemeris data, personal natal chart calculation, and
AI-generated interpretation grounded in the user's own natal chart — in one
place — does not exist.

This is not a fortune-telling app. The positioning is the universe as mirror, not
wish-fulfillment machine. Rooted in Jungian individuation and shadow work. Serious
about the practice.

---

## Tech stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Database + Auth:** Supabase
- **Deployment:** Vercel
- **AI:** Anthropic API (Claude) — called directly, no self-hosted model
- **Ephemeris:** Astronomy Engine (JS library for planet position calculations)

---

## Developer commands

```bash
npm run dev      # start dev server (Next.js, localhost:3000)
npm run build    # production build
npm run lint     # ESLint via next lint
npx tsc --noEmit # type-check without emitting (run before committing)
```

No test suite currently exists.

### Git / GitHub auth note

GitHub no longer accepts account passwords for git operations over HTTPS. Push
authentication requires either a personal access token (used as the password
when prompted) or SSH. Personal access tokens are generated under your GitHub
account settings → Developer settings → Personal access tokens (not under repo
settings). If a token push still fails and the repo sits under an org enforcing
SAML SSO, the token itself may need to be separately authorized for SSO from the
same tokens page.

---

## Runtime patterns

**"use client" is universal** — every interactive file in `app/` and `components/`
starts with `"use client"`. There are no server components in use yet.

**localStorage replaces Supabase everywhere** — all persistence (birth data, journal
entries) goes through localStorage. The `useJournalEntries` hook and
`upsertEntry`/`deleteEntry` helpers in `lib/journal.ts` dispatch a
`"journal-entries-updated"` custom window event after every write so sibling
components re-render. Same pattern for birth data: `"birth-data-updated"` event.
Same pattern also now used for the auth confirmation-resend cooldown timestamp
(see Authentication section) — flagged to move server-side later.

**Inline styles are primary; Tailwind is supplemental** — most styling is inline
style objects. Tailwind is used only for responsive breakpoints (`hidden md:flex`,
`md:pt-[52px]`, etc.) and the occasional layout utility. Do not refactor inline
styles to Tailwind.

**Ref mirrors for stale-closure avoidance** — when a callback (like auto-save) needs
to read current state synchronously without being in the dependency array, a ref
mirror pattern is used: `const fooRef = useRef(foo); useEffect(() => { fooRef.current
= foo; }, [foo])`. See `savedEntryRef` and `attachmentRef` in
`app/journal/new/page.tsx`.

**useMemo for all expensive derivations** — natal chart calculation, transit
generation, filtering, and aspect computation are all wrapped in `useMemo`. Don't
call `generateTransitsCached` or `calculateNatalChart` outside a memo.

---

## Navigation

Four tabs, mobile bottom nav (desktop top nav):
**Feed · You · Journal · Settings**

---

## Key product decisions — locked, do not revisit

- Responsive web app, mobile-first. No native app for MVP.
- AI layer: Anthropic API only. Interpretive quality is the core value prop.
- Account gate triggers on first "Reflect" CTA tap, framed as "Save your reflection"
- Reflect CTA swaps to "View your reflection" once a journal entry exists — universal
  pattern across transit detail and house/configuration detail pages. Reverts on entry delete.
- **"Reflect" is the settled label for the primary CTA — not a placeholder.**
- **"Journal" is the settled name for the journal tab — not a placeholder.**
- Birth data: date + time + city. Unknown time defaults to noon. Placidus house system.
- General transit interpretations: cached per event (zero marginal AI cost per user).
- Personal transit analysis: per-user, AI-generated, cached per (transit_id, user_id).
  Never generated without birth data present. Never touches journal history.
- Delete journal entries: MVP scope. Surfaced only from within the entry page (burn
  mechanic). Not available from the journal list page — intentional friction.
- You page is house-first. No natal planet detail pages — replaced by house cards.
- Configuration cards (Defining Aspects) are first-class on the You page, not post-MVP.
- Aspects and Bodies as dedicated lenses on the You page are post-MVP pending user feedback.
- Post-MVP only: push notifications, depth signal, natal interp updates, journal filtering.
- No-birth-data state on transit detail: READING section is hidden entirely.
  REFLECT CTA is replaced by:
  Body copy (EB Garamond italic, gold — meaning layer register):
  "This transit has more to say. It needs your origin to say it."
  CTA label: ENTER YOUR ORIGIN
  This CTA dispatches the "vigil-open-birth-input" window event, which opens BirthDataCard.
  Note: when Supabase auth is built, the `event.house != null` birth-data presence check
  must be replaced with an explicit `hasBirthData` boolean from user context, not inferred
  from house presence.
- **"Origin" is the user-facing term for birth data throughout the UI.**
  Use "origin" wherever the user sees it: "Enter your origin," "Your origin," "Origin not set."
  "Birth data" remains the correct term in code, schema, and this document.
- **No confirm-password field on any auth screen.** Single password field + show/hide
  eye toggle instead. Removes a field and an error state for the same typo protection.
- **Password minimum: 8 characters, no complexity requirements.** Set in Supabase
  dashboard (Auth → Policies). Length matters more than forced complexity; complexity
  rules frustrate users without meaningfully improving security.
- **Auth confirmation is link-based, not code/OTP-based.** Chosen to stay on Supabase's
  native, simplest pattern (single `signUp()` call). Switching to code-based confirmation
  later is possible without disrupting already-confirmed users — the confirmation method
  only affects new signups going forward.
- **Back button pattern (all auth screens):** ghost `←` + "Back", matching the existing
  feed/you-page detail-view back button styling. Positioned inside the centered content
  column, directly above the screen title — not in the outer page header. On Screens 2
  and 3 (password steps), this is superseded by the Email/Change pattern (see below);
  the confirm screen keeps a plain "← Back."
- **Email/Change pattern (Screens 2 and 3 password steps only):** field label "Email"
  (same styling as the "Password" label) with the email value as body text and an inline
  ghost "Change" link on the same line, positioned directly above the Password field —
  not at the top of the card. "Change" navigates to `/auth`. This replaces the plain back
  button on these two screens (both accomplish the same "return to start" action; Email/
  Change does it with more context).

### AI scope — locked, do not revisit

- **Journal data is never passed to the AI layer.** Deliberate product decision, not
  a deferred feature. Journal entries contain personal reflection that must not be
  accessible to the AI, the product, or any third party.
- **No AI chat within journal entries. Ever.** Do not build an AI chat component
  for journal entries under any circumstances.
- **No AI response to journal entries.** The AI interprets the sky and the chart.
  The user bridges the gap to their own reflection. That gap is the product.
- **AI interpretation is chart-aware but never journal-aware.** Transit readings,
  house readings, and configuration readings are generated from natal chart and
  ephemeris data only. Never from journal history.
- **Reason:** Privacy, product integrity, and liability. Vigil is an observatory,
  not a therapist. An AI responding to deep personal disclosures carries real risk.
  Do not build toward this under any framing unless this section is explicitly
  updated with documented reasoning.

---

## Information architecture

### Ungated (no account required)
- Feed — transit cards, birth data input bar
- Transit detail page — chart-aware AI reading if birth data present; origin prompt if not
- You page — natal chart, house cards, configuration cards (generic interp if no account)
- Collective Unconscious — weekly AI forecast article (read only)

### Account required (free)
- Journal — cross-device sync rationale. This is the only MVP gated feature.
- Natal portrait — deep AI-generated birth chart reading, generated at account creation
- Year in Review — annual, generated on demand each December, shareable
- Collective Unconscious comments — deferred post-MVP

### Premium subscription (post-MVP, not yet designed)
- Year Ahead forecast — forward-looking complement to Year in Review, ~$7 one-time
  annual purchase. Distinct product from Year in Review. Users won't experience
  separation as a removal — they are conceived and launched as separate things.
- Transit calculator
- Synastry readings
- Guided journal pages — prompted, scaffolded reflection tied to specific transits
  or chart placements. May include creator collaborations (see below).

Note: everything that exists at launch remains free forever. No retroactive gating.

---

## Core screens

### 1. Feed (built)
- Full-bleed SolarSystem cosmic background, real planet positions from Astronomy Engine
- Left panel (desktop) / bottom scroll (mobile): scrollable transit cards
- Each card: timing indicator, peak date, title, house (if birth data), description
- Tapping a card: expands to transit detail panel (morph animation, not page nav)
- BirthDataCard at top for unauthenticated users

### 2. Transit detail (built — refinement pass complete)
- Morphs from feed card in place (480ms ease-in-out)
- Section order: READING → BODIES → ASPECT/CYCLE → PASSAGE → REFLECT
- READING: chart-aware AI interpretation, renders only when birth data present
- If no birth data: READING hidden, REFLECT replaced by origin prompt + ENTER YOUR ORIGIN CTA
- BODIES, ASPECT/CYCLE, PASSAGE sections always render

### 3. You page (built — see full spec below)
- House-first organization. 12 house cards, not planet cards.
- No natal planet detail pages in MVP — replaced entirely by house card detail views.
- Configuration cards (Defining Aspects) are first-class alongside the house grid.
- AI interpretation deferred — READING sections show placeholder copy until
  auth and schema are stable.

### 4. Journal (built — see full spec below)

### 5. Collective Unconscious (not yet built)
- Weekly AI-generated astrological forecast article
- Lives on the Feed, above transit cards — a card that links to the full article
- Readable by anyone, no account required
- Generated once per week, cached, shared across all users (near-zero marginal cost)
- Comment section deferred post-MVP
- Content pipeline: weekly generation on a fixed schedule, reviewed before publish

### 6. Settings
- Birth data management (labeled "Your Origin" in UI)
- Account details

---

## Account creation — natal portrait flow

Account creation is a character-creation flow, not a form. Entering your origin
generates a deep AI natal portrait — the concierge the user receives just for
registering. This is the primary value exchange at the account creation moment.

### What the portrait covers
- Defining aspects and chart configurations
- Chart ruler
- Saturn return context
- Architectural tensions of the lifetime
- Meaningfully deeper than pop astrology ("you're a Leo") but more personal and
  digestible than the overwhelm of a site like Astro-Seek

### Portrait caching and display
- Generated once at account creation. Cached permanently per user.
- Lives on the You page as a dated artifact — the reading generated at the moment
  you entered your origin. Permanent, replayable, always accessible.
- Natal charts do not change — this content never needs regeneration unless
  birth data is corrected.

### Birth data correction policy
- **One free correction** after account creation. Correcting origin data and
  regenerating the portrait is free exactly once.
- After the free correction is used: regeneration is a paid action, $4–9.
- Rationale: handles the honest edge case (uncertain birth time found later,
  hospital records discovered years later) without unlimited free regeneration.
- UX: Settings → Origin shows edit affordance with "You have one free origin
  correction" note until used. After that, regeneration triggers a purchase flow.
- This is Vigil's first paid transaction surface, live at launch.

---

## Year in Review (post-MVP, free for registered users)

Annual feature. Generated on demand each December.

### Backward-looking layer (Year in Review)
- Which major transits shaped the year
- Which houses were most activated
- Defining astrological moments of the past 12 months
- Shareable artifact — primary organic acquisition mechanic
- A user can create an account just to receive their Year in Review even if
  they never journaled

### Forward-looking layer (Year Ahead) — separate product, premium
- Upcoming forecast for the next 12 months
- Personalized reflection prompts to prepare
- One-time annual purchase, ~$7
- Launched alongside Year in Review in December
- Users will not perceive this as a removal — Year in Review is clearly
  backward-looking (like Spotify Wrapped), Year Ahead is a distinct offering

---

## Business & Monetization Strategy

### Positioning
Premium ritual lifestyle platform. Not a pop astrology app. Comparable ethos
to Equinox or Erewhon. The product is complete and valuable as a free instrument.
Monetization extends the product without diminishing it.

### What is free, forever, no exceptions
Feed, transit detail, You page, natal portrait, journal, Collective Unconscious,
Year in Review. Everything that exists at launch stays free. No retroactive gating.

### Revenue surfaces (in order of build priority)

**1. Portrait regeneration — launches with MVP**
$4–9 one-time. Triggered when user exhausts their free correction and wants to
update birth data and regenerate portrait. Low volume, honest value exchange.

**2. Year Ahead forecast — post-MVP, annual**
~$7 one-time purchase each December. Forward-looking companion to the free
Year in Review. Not a subscription, not a removal — a distinct product.

**3. Digital cosmetics — post-MVP**
App skins (full design system reskins), tarot deck art (when tarot feature
launches). One-time purchases. Requires design token system to be built first
as a prerequisite — reskinning must be a configuration change, not a rebuild.
Identity investment in the product; stronger retention than subscriptions.

**4. Premium subscription — post-MVP, intentional**
Not a broad paywall. Gates features that are genuinely additive:
transit calculator, synastry readings, guided journal pages, potentially
creator-produced content. Price TBD — must be justified by ongoing delivered
value, not convenience alone. Do not design this tier until you have enough
users to validate what they will actually pay for.

**5. Physical bazaar — post-traction only**
Curated artisan goods: bespoke homeware, fragrance, jewelry, tarot decks,
physical journals, esoteric objects. Only pursue after proven digital success
and only when a vendor approaches Vigil, not the other way around. Operational
weight (curation, logistics, returns) is significant for a solo founder.

### Creator marketplace (post-MVP, strategic direction)
Astrologers as content partners. Their guided journal pages and worksheets become
personalized through Vigil's natal data engine — a static worksheet becomes
chart-aware. Revenue share model. Brings creator audiences to Vigil; makes
creator content better than anything they could sell independently.

Key open question before building: IP ownership of personalized output must be
resolved in partner agreements before any creator content goes live.

### What not to build for monetization
- Donations / patronage — conflicts with premium positioning
- Data licensing — ethically incompatible with privacy positioning
- Advertising — never

### On subscriptions and subscription fatigue
The target user is accustomed to a free swivel chair of tools (Co-Star, ChatGPT,
Astro-Seek). Convenience alone does not justify recurring payment. A subscription
tier must gate features with genuinely ongoing value — not features that exist
at launch as free. Design the subscription tier after you know what users
obsessively use, then price toward that behavior.

---

## Legal To-Dos (pre-launch required)

These items must be completed before a single user creates an account.
They are not optional and are not post-launch tasks.

### Privacy policy
Must accurately cover:
- What is collected: birth date, birth time, birth city (latitude/longitude)
- What is derived and stored: natal portrait as a generated personal artifact
- Retention policy: how long data is held, what happens on account deletion
- User right to deletion: including the generated portrait and all cached
  AI interpretations — these are personal data in their own right
- CCPA compliance: birth date + time + location is quasi-identifying personal
  data under California law. Vigil is built by a California resident for
  California users. CCPA applies.
- GDPR consideration: if European users are anticipated, additional obligations apply

### Terms of service
Must cover:
- Account creation and termination
- Payment terms for portrait regeneration and future paid features
- California auto-renewal law: subscription products must comply with specific
  disclosure requirements. Non-compliance carries penalty exposure.
- Refund policy
- User-generated content (when Collective Unconscious comments launch)

### Payment processing
- Stripe or equivalent required for portrait regeneration at launch
- PCI compliance obligations apply
- Refund policy must be defined before first transaction

### Shareable artifacts (Year in Review)
- Define exactly what data is included in the shared artifact
- Confirm user controls what is shared and what remains private
- No chart data should be shared without explicit user action

### Creator marketplace (before any partner content goes live)
- IP ownership agreement: who owns the personalized output when a creator's
  template is rendered with Vigil's natal data engine — the creator, Vigil,
  or the user. Must be resolved in writing before launch.
- Revenue share terms
- Content standards and moderation obligations

### Entity and liability
- LLC formation deferred until revenue or liability event. Revisit before
  first paid transaction goes live — portrait regeneration at launch may
  be that trigger.
- Consult a real lawyer before launch. The council identifies exposure;
  a lawyer resolves it.

---

## Visual design direction (locked)

**Reference:** CyberDefend dashboard UI (space/satellite management aesthetic)
**Direction:** "Sacred Instrument" — the CyberDefend spatial model with esoteric warmth

### Spatial concept
Three depth layers:
1. Living cosmic background (solar system visualization, real planet positions)
2. Structural chrome (nav, panel frames)
3. Glass information cards floating over the scene

### Color system
```
Ground:       #0D1117  (deep blue-black — not warm, not pure black)
Surface/card: rgba(255,255,255,0.03–0.05)
Border sides: rgba(255,255,255,0.06–0.08)
Border top:   rgba(255,255,255,0.16–0.18)  ← the "floating panel" illusion
Gold accent:  #C8A96E  ← ONLY warm color in the system
Text/1:       #E2E4EA  (primary — passes WCAG AA)
Text/2:       #8B909C  (secondary — passes WCAG AA)
Text/3:       #4A5060  (labels/decorative only)
CTA primary:  rgba(200,169,110,0.10) bg + #C8A96E border + #E8D8A8 text
Status green: #3EB489
Status amber: #C9933A
Status red:   #B85555
```

### Card anatomy — exact values
```
background:       rgba(6, 8, 14, 0.58)
backdrop-filter:  blur(20px) saturate(1.3)
border:           0.5px solid rgba(255,255,255,0.07)
border-top:       0.5px solid rgba(255,255,255,0.16)  ← do not skip this
border-radius:    7px
Active state:     border-top becomes rgba(200,169,110,0.55)
Hover state:      background rgba(255,255,255,0.02), border-top rgba(200,169,110,0.25)
```

### Typography
- **Headings/display:** EB Garamond (Google Font) — 400 and 500 weights
- **Interpretive text:** EB Garamond italic, gold color — this is where the magic lives
- **UI labels/meta:** System sans (Inter/-apple-system), uppercase, tracked
- **Body/data:** System sans, 12px, text/2 color
- The contrast between sans (data layer) and serif italic (meaning layer) is intentional

### CTA hierarchy
1. **Primary (Reflect):** Gold tint bg + gold border + top highlight. Exists nowhere else.
2. **Secondary (View your reflection / Enter your origin):** Neutral outline only.
3. **Ghost (Back to feed / ← Houses / ← Patterns):** No border, tertiary text.

### Motion principles
- Card enter: 380ms ease-out
- Detail expand: 480ms ease-in-out
- Planet focus pan: 900ms ease-out
- Background cosmic drift: 90s linear loop
- Status dot pulse: 2.5s ease-in-out infinite
- Nothing snaps. Everything settles.

---

## Product voice

The `astro-journal-voice` skill is installed and must be consulted for all product
copy — including transit interpretations, planet and aspect blurbs, section headers,
CTAs, journal prompts, empty states, and any other user-facing text. Do not write
product copy without loading this skill first.

### Voice in brief
A wise companion who has walked this path before you — warm, precise, unhurried.
Hands the user a lens, not an answer.

### Tone reference
The Doll (Bloodborne) — calibrated toward wise companion, not devotional attendant.
The devotional register ("I will look after you") does not appear in this product.
The companion register does.

### Address
Users are addressed as **"traveler"** — sparingly, at threshold moments only
(first visit, account creation, first reflection, empty states that matter).
Not on every screen.

### Key rules
- Never predict. The sky is a mirror, not an oracle.
- Never affirm flatly. Show weight through specificity, not assertion.
- Earn every adjective. If it can be cut without losing meaning, cut it.
- Jungian individuation is the subtext, never the text.
- No em dashes — ever. Use periods, ellipses, or commas. The ellipsis is the
  correct pause mark in this voice. Em dashes are an AI writing pattern and
  break the register.
- Consult the voice skill's metaphor system table when naming any new feature or CTA.

### Locked copy — origin prompt (transit detail, no birth data)
```
Body:  "This transit has more to say. It needs your origin to say it."
CTA:   ENTER YOUR ORIGIN
```
Rendered in interpretive register: EB Garamond italic, gold #C8A96E.
CTA uses secondary style (neutral outline).

### Locked copy — journal empty state
```
"Nothing written yet, traveler."
```
EB Garamond italic, 18px, #8B909C. Centered vertically in the viewport below the header.
No secondary line, no CTA in the empty state — the FAB handles the action.

### Locked copy — auth screens
```
Screen 1 (email entry):        "Have we met?"
Screen 2 (returning password): "You've returned." / "A password is all it takes."
Screen 3 (new user password):  "Let's begin." / "Choose a password. It's how you'll return."
Screen 3 confirm (email link): "Almost there." / "Check your inbox. The link there brings you back."
```
Password field hint (Screen 3): "8+ characters" — neutral by default, status green
with checkmark once fulfilled, status red with "Not quite enough yet." beneath if
submitted unfulfilled.

Password reset flow copy not yet drafted — see "Not yet built" below.

### Card description copy (current status)
All copy in `lib/transitCopy.ts` is functional placeholder — written in the correct
register but not yet through a full voice pass. A rewrite pass is planned when the
AI interpretation layer is built. Do not treat current copy as canonical voice examples.

---

## Journal — full spec (built)

### Entry types (MVP)

| Type | Label | Notes |
|---|---|---|
| Plain / blank | **Freeform** | FAB-initiated, blank editor, no attachment |
| Transit-linked | **Transit** | Attachment set to a transit event |
| House-linked | **Natal** | Attachment set to a house |
| Configuration-linked | **Natal** | Attachment set to a configuration |
| Tarot spread | **Spread** | Post-MVP. Enum value exists, do not build UI. |

Entry type is derived from attachment — not chosen by the user. No attachment =
freeform. Transit attached = transit. House or configuration attached = natal.

### Postcard / attachment concept

The attachment component sits at the top of every journal entry, above the writing
area. It serves two roles:
1. On a new entry (FAB-initiated): an optional attach region where the user can
   connect an active transit, house, or defining aspect from their chart.
2. On a context entry (spawned from Reflect CTA on a detail page): pre-populated
   with the detail that triggered the entry.

The attachment is a frozen snapshot — read-only after creation, stored in full in
`context_data` so the postcard can be reconstructed without a live data lookup.

**Postcard mental model:** The sky sent you something. You're writing back.
The postcard is what arrived.

### `lib/journal.ts` — data layer

localStorage key: `vigil-journal-entries`. Array of `JournalEntry` objects.

```typescript
export type JournalEntry = {
  id: string
  created_at: string
  updated_at: string
  entry_type: 'freeform' | 'transit' | 'natal' | 'spread'
  title: string
  body_text: string
  context_id?: string
  context_data?: Record<string, unknown>
}
```

Exports:
- `useJournalEntries()` — returns `{ entries }`, listens for `"journal-entries-updated"`
- `upsertEntry(entry: JournalEntry)` — insert or update by id, dispatches event
- `deleteEntry(id: string)` — removes by id, dispatches event

### Journal list page — `app/journal/page.tsx` (built)

- Background: `#0D1117`. No SolarSystem animation.
- Header: "Journal" title (EB Garamond 28px, Text/1, left) + quill FAB (PenLine icon,
  Lucide, 18px) in the same header row, right-aligned.
- FAB: circular 56px, GlassPanel anatomy with elevated surface
  `rgba(255,255,255,0.08)` bg. Navigates to `/journal/new` on tap.
- Subtitle: current date + local time, e.g. `Monday, June 2 · 9:41 AM`.
  System sans 12px, Text/2. Updates on 1-minute interval.
- Entry list: reverse chronological GlassPanel cards. Each card is tappable,
  navigates to `/journal/[id]`.
- Card content:
  - Title: entry `title` if present, else `Untitled entry` — EB Garamond 17px, Text/1
  - Metadata row: system sans 11px, Text/2
    - Last edited: `updated_at` formatted as `Jun 2 · 9:41 AM`
    - Attachment label (if present): transit title, `H[n]: [Domain]`, or configuration
      label — preceded by `·` separator. No timing or planet metadata.
- Empty state: `"Nothing written yet, traveler."` — EB Garamond italic 18px, #8B909C.
  Centered vertically below header.

### New entry page — `app/journal/new/page.tsx` (built)

Doc-style layout. Content centered, max-width constrained:
- Background: `#0D1117`
- Content column: `max-width: 680px`, `margin: 0 auto`
- Mobile: full width, `24px` horizontal padding
- Desktop: centered column at max-width

**Sticky header** — full viewport width, `background: rgba(13,17,23,0.85)`,
`backdrop-filter: blur(12px)`, `padding: 12px 24px`:
- Left: `← Journal` ghost button, navigates to `/journal`
- Right (mobile): pencil icon (view mode) / checkmark icon (edit mode) + flame icon
- Right (desktop): flame icon only
- Flame icon behavior: if `hasContent` (title or body non-empty) → open burn dialogue.
  If no content → navigate silently to `/journal`.
- `hasContent` = `title.trim().length > 0 || body.trim().length > 0`

**Global header** — same header component as Feed and You page, rendered above sticky
entry header.

**Entry state:**
```typescript
const [title, setTitle] = useState('')
const [body, setBody] = useState('')
const [savedEntry, setSavedEntry] = useState<JournalEntry | null>(null)
const [isEditMode, setIsEditMode] = useState(true) // new entries open in edit mode
const [attachment, setAttachment] = useState<Attachment | null>(null>
```
Entry ID: `crypto.randomUUID()` on mount, stored in ref.

**Auto-save:** saves to localStorage on every `onChange` keystroke. First save sets
both `created_at` and `updated_at`. Subsequent saves update `updated_at` only.
Uses ref mirrors (`savedEntryRef`, `attachmentRef`) to avoid stale closures.

**Attach component** — `components/journal/AttachComponent.tsx`. Rendered below the
sticky header, above the timestamp. See attach component spec below.

**Last changed timestamp** — below attach component, left-justified. Hidden until
first save. Format: `Monday, June 2 · 9:41 AM` — system sans 11px, Text/3.

**Title field** — EB Garamond 28px, Text/1. No border, no bg. Ghost text:
`Untitled entry` (same style, Text/3). Mobile: editable in edit mode only.
Desktop: always editable.

**Body field** — textarea, auto-expands. System sans 15px, Text/2. No border, no bg.
Ghost text: `The page beckons.` — EB Garamond italic 16px, Text/3. Mobile: editable
in edit mode only. Desktop: always editable.

**Burn confirmation dialogue** — GlassPanel modal, centered, both mobile and desktop.
Backdrop: `rgba(0,0,0,0.6)`. Click outside = cancel.
- Title: `Burn this page?` — EB Garamond 20px, Text/1
- Body: `This entry will be released. It cannot be recalled.` — system sans 13px, Text/2
- CTAs: `CANCEL` (secondary) left, `BURN` (primary gold) right
- On burn: `deleteEntry(id)` then navigate to `/journal`

### Entry view/edit page — `app/journal/[id]/page.tsx` (built)

Same layout and components as `/journal/new/page.tsx`, populated from localStorage
by `id`. If entry not found, navigate to `/journal`. All editing, auto-save, burn,
and attach behavior identical to new entry page. Existing entries open in view mode
(not edit mode) on mobile.

### Attach component — `components/journal/AttachComponent.tsx` (built)

```typescript
export type Attachment =
  | { type: 'transit'; data: ScoredTransit }
  | { type: 'house'; data: HouseData }
  | { type: 'configuration'; data: ChartConfiguration }

export type HouseData = {
  number: number
  sign: string
  domainWord: string
  planets: { name: string; symbol: string }[]
}
```

**Empty state** — tappable full-width dashed region:
- `background: rgba(255,255,255,0.03)`, `border: 0.5px dashed rgba(255,255,255,0.12)`
- Paperclip icon (Lucide), title `Attach a moment.` (system sans 12px uppercase, Text/3)
- Description: `Connect an active transit or natal chart placement to this entry.`
- Hover: border brightens to `rgba(255,255,255,0.20)`
- Tap: opens attach modal

**Attach modal:**
- Desktop: centered modal, `max-width: 520px`, backdrop, click outside to close
- Mobile: bottom sheet, `border-radius: 12px 12px 0 0`, closes on swipe or tap outside
- Title: `What calls to you?` — EB Garamond 18px, Text/1
- X close button top-right
- Tabs: `TRANSITS` (default) and `NATAL CHART`
  - Selected: Text/1, `border-bottom: 1px solid #C8A96E`
  - Unselected: Text/3
- Transits list: same pipeline as Feed (transitGenerator + transitFilter + birth data
  from localStorage). Each row: title (EB Garamond 15px Text/1), peak date + house
  (system sans 11px Text/2). No description blurb. Tap sets attachment, closes modal.
- Natal chart list: two sections — `LIFE'S ARCHITECTURE` (12 house rows) and
  `DEFINING ASPECTS` (configuration rows, hidden if none detected). Same row treatment.
  Tap sets attachment, closes modal.
- No birth data: origin prompt shown in list area for both tabs.

**Attached state (postcard):**
- GlassPanel anatomy, `border-top: 0.5px solid rgba(200,169,110,0.25)`
- Type badge (`TRANSIT` or `NATAL`), gold, system sans 10px uppercase
- X button top-right
- Title: EB Garamond 17px, Text/1
- Metadata: system sans 11px, Text/2
  - Transit: `[peak date] · H[n]: [Domain]` (no timing indicator)
  - House: domain word + planets present
  - Configuration: planet list
- `VIEW DETAILS` ghost button bottom-right — opens detail modal

**Removal behavior:**
- House or configuration: silent removal, revert to empty state
- Transit: show removal warning dialogue first
  - Title: `Remove this transit?`
  - Body: `If this transit passes before you attach it again, it will be gone from the feed.`
  - CTAs: `CANCEL` left, `REMOVE` (primary gold) right

**Detail view modal:**
- GlassPanel panel, `max-width: 600px`, `max-height: 85vh`, centered
- X close button top-right
- Transit: renders `TransitDetail` component with attachment data
- House: renders house expanded detail (SIGN, READING, BODIES sections) — no REFLECT CTA
- Configuration: renders configuration expanded detail (READING, BODIES) — no REFLECT CTA
- Click outside closes modal

---

## AI architecture

### Model
Anthropic API, claude-sonnet-4-5 (or latest Sonnet). Called directly from the app.

### Query types
| Type | Triggered by | Context injected | Cached? |
|---|---|---|---|
| General transit interp | First load of transit detail | Transit event data only | Yes — once per transit |
| Personalized transit reading | Transit detail load (birth data present) | Full natal chart: planets, signs, houses, aspects, configurations. Natal intersections flagged explicitly. | Yes — per (transit_id, user_id) |
| House interpretation | House card expanded | Full natal chart + house data | Per user per house, cache permanently |
| Configuration interpretation | Configuration card expanded | Full natal chart + configuration planets | Per user per configuration, cache permanently |
| Natal portrait | Account creation | Full natal chart: all planets, signs, houses, aspects, configurations, chart ruler, Saturn return context | Per user, cache permanently. Regenerate only on paid origin correction. |
| Collective Unconscious article | Weekly schedule | Current week's major transits and sky conditions | Once per week, cached, shared across all users |
| Year in Review | User-triggered, December | Full year's transit history for user, activated houses, defining moments | Once per year per user |
| Year Ahead forecast | User purchase, December | Upcoming 12 months of transits against natal chart | Once per year per user, triggered by purchase |

### Transit READING generation notes
- Generate only when birth data is present. No sky-only fallback reading.
- Never inject journal history into transit interpretations. Never inject journal
  history into any AI query anywhere in this product.
- Up to two paragraphs as a guideline, not a hard limit. If the transit has
  significant natal intersection (e.g. transit occurring in same house as user's
  stellium, transit aspecting a natal planet directly), go deeper.
- Explicitly flag natal intersections in the prompt context so the model can
  weight them appropriately.
- Cache key: (transit_id, user_id). Regenerate only if birth data changes.

### Cost notes
Single user: ~$1–3/month at typical usage. Caching is the primary cost lever.
Transit readings: cached per (transit_id, user_id) — generated once, never again
unless birth data changes. ~5–8 active transits per user at any time.
House interpretations never change — cache permanently per user (12 total per user).
Configuration interpretations are also permanent — cache per user per configuration key.
Natal portrait: one generation per user at account creation. Permanent cache.
Collective Unconscious: one generation per week, shared across entire user base.
Near-zero marginal cost per user regardless of scale.

---

## Ephemeris / astronomical data

Use **Astronomy Engine** (JS) for all planet position calculations.

House calculation: Placidus implemented manually in lib/natal.ts using corrected
Meeus formulae. Do not replace — it has been verified accurate against Astro-Seek.
Upper houses (H11/H12): (RA − RAMC) = frac × DSA
Lower houses (H2/H3): (RAIC − RA) = frac × NSA, frac=1/3 → H3, frac=2/3 → H2

### Calculated points in natal.ts
In addition to Sun–Pluto, natal.ts calculates:
- **Ascendant** — 1st house cusp, already part of Placidus calculation
- **Midheaven (MC)** — 10th house cusp, already part of Placidus calculation
- **Black Moon Lilith** — mean apogee: `83.3532 + 40.9 × T` degrees (T = Julian
  centuries from J2000.0). Normalized to 0–360°. Always isRetrograde: false.
- **Chiron** — mean longitude: `209.67 + 50.077 × T` degrees. Accuracy ±5–15°
  due to orbital eccentricity. Acceptable for display, not aspect calculation.

Chiron, Lilith, Ascendant, and Midheaven are excluded from configuration detection.

---

## Supabase schema (to build)

```
users
  id, email, created_at

birth_data
  user_id, birth_date, birth_time, birth_city, latitude, longitude, time_known,
  correction_used (boolean) -- tracks whether free origin correction has been used

natal_chart (cached calculations)
  user_id, planet, sign, house, degree, aspects (jsonb), generated_at

natal_portrait (permanent cache)
  user_id, portrait_text, generated_at
  -- generated once at account creation, cached permanently
  -- regenerated only on paid origin correction (or free correction if unused)
  -- journal body_text is never passed to any AI query

journal_entries
  id, user_id, created_at, updated_at, title, body_text,
  entry_type (freeform|transit|natal|spread),
  context_id (nullable), context_data (jsonb)
  -- context_data stores full postcard reconstruction data, not just a reference ID
  -- journal body_text is never passed to any AI query

transit_interpretations (cache)
  transit_id, general_interpretation, generated_at

user_transit_analyses (per-user cache)
  user_id, transit_id, personalized_analysis, generated_at
  -- cache key: (transit_id, user_id). Regenerate only if birth data changes.

user_house_interpretations (permanent cache)
  user_id, house_number, interpretation, generated_at

user_configuration_interpretations (permanent cache)
  user_id, configuration_key, interpretation, generated_at
  -- configuration_key: type + sorted planet names e.g. "tSquare:Moon,Neptune,Venus"

collective_unconscious_articles (weekly cache)
  id, week_start_date, article_text, generated_at
  -- one row per week, shared across all users

user_year_reviews (annual cache)
  user_id, year, review_text, generated_at
  -- generated on demand in December, cached permanently per user per year

user_year_ahead (annual cache, paid)
  user_id, year, forecast_text, generated_at, purchase_id
  -- generated on purchase, cached permanently per user per year

payments
  id, user_id, type (portrait_regen|year_ahead|cosmetic|other),
  amount, created_at, stripe_payment_id
```

Not yet built: a table or column for the auth confirmation-resend cooldown
timestamp, currently in localStorage. Add when Supabase migration happens
(see Authentication section).

---

## File structure (Next.js App Router)

```
app/
  page.tsx                    ← Feed (home)
  you/
    page.tsx                  ← Natal chart profile (built)
  journal/
    page.tsx                  ← Journal list (built)
    new/page.tsx              ← New entry page (built)
    [id]/page.tsx             ← Entry view/edit (built)
  collective/
    page.tsx                  ← Collective Unconscious article view (not built)
  settings/
    page.tsx
  auth/
    page.tsx                  ← Screen 1, email entry (built)
    returning/page.tsx        ← Screen 2, returning user password (built)
    new/
      page.tsx                ← Screen 3, new user password creation (built)
      confirm/page.tsx        ← Screen 3 confirm, email confirmation (built)
      vigil/page.tsx          ← Vigil ceremony (built) — replays on every visit, no completion tracking
      origin/page.tsx         ← Screen 5, birth data entry (NOT YET BUILT)
    callback/
      route.ts                ← Auth code exchange → /auth/new/vigil (built)

components/
  cosmic/
    SolarSystem.tsx           ← Canvas, real planet positions, built and working
    NatalWheel.tsx             ← SVG natal chart wheel, built and working
    Planet.tsx
  cards/
    TransitCard.tsx           ← Built and working
    TransitDetail.tsx         ← Built and working — refinement pass complete
  journal/
    AttachComponent.tsx       ← Built and working — attach/postcard/detail modal
  onboarding/
    CandleNode.tsx            ← Candle dot for vigil ceremony (built)
  ui/
    GlassPanel.tsx            ← Built and working — base card component
    CTAButton.tsx              ← Built and working
    StatusDot.tsx              ← Built and working
    BottomNav.tsx               ← Built and working
    TopNav.tsx                 ← Built and working — shows Sign In / Settings per useAuth state
    BirthDataCard.tsx          ← Built and working — shared across Feed + You
                                 Listens for "vigil-open-birth-input" window event

hooks/
  useTypewriter.ts            ← Typewriter animation hook; instant param for fast-forward (built)

lib/
  astronomy.ts                ← Astronomy Engine wrappers
  anthropic.ts                ← AI query functions
  natal.ts                    ← Placidus house calculations (verified, do not replace)
  configurations.ts           ← Chart configuration detection (built)
  transitGenerator.ts         ← Real ephemeris transit detection (built, stable)
  transitFilter.ts            ← Scoring and visibility logic (built, stable)
  transitCopy.ts              ← Card description lookup (built)
  transitDetail.ts            ← Static lookup tables for transit detail panel (built)
  timingIndicator.ts          ← Shared timing indicator utility (built)
  houseReadings.ts            ← placeholder AI swap points for house detail
  configurationReadings.ts    ← placeholder AI swap points for configuration detail
  signBlurbs.ts               ← 12 sign blurbs + element/modality lookup
  journal.ts                  ← useJournalEntries hook, upsertEntry, deleteEntry
  auth.ts                     ← useAuth hook, { user, loading } via onAuthStateChange
  vigilCopy.ts                ← VIGIL_CLAUSES array for ceremony (built)
  supabase.ts                 ← DB client + queries
  config.ts                   ← APP_NAME and other constants
```

---

## Planet symbols (locked)

Used in NatalWheel.tsx and you/page.tsx. Must be consistent across both files.

```typescript
const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
  Chiron: '⚷', Lilith: '⚸', Midheaven: 'MC', NorthNode: '☊',
  SouthNode: '☋', Ascendant: '↑',
}
```

Ascendant symbol is `↑` (up arrow) — not 'AC'. Applied consistently in both
NatalWheel.tsx and house cards in you/page.tsx.

---

## You page — full spec (built)

### Layout — desktop (≥768px)
Two-column split panel, full viewport height, no page scroll:

**Left column (42% width, sticky):**
- Header row (full width, flex): "You" title (EB Garamond 28px, flex: 1, left) +
  BirthDataCard (flex: 1, right) — 50/50 split
- NatalWheel component — size driven by ResizeObserver on left column
  (clientWidth − 64px). ResizeObserver effect depends on [hasData].
- Big 3 summary: `SUN Cancer · MOON Aries · RISING Sagittarius`
  System sans 11px uppercase tracked, Text/2 labels, Text/1 values.
- `[PLACEHOLDER — View Interpretation]` button — secondary CTA style,
  console.log only for now.

**Right column (58% width, independent scroll, overflow-y: auto):**
Two sections separated by 32px padding.

### Empty state (no birth data)
Full-screen centered overlay, no wheel, no cards:
- "Your chart awaits." — EB Garamond italic 20px, #8B909C
- "A birth moment is all it needs." — EB Garamond italic 15px, #4A5060
- BirthDataCard centered, max-width 360px
- Nav still renders

### Section 1 — LIFE'S ARCHITECTURE

Section header:
- Label: `LIFE'S ARCHITECTURE` — system sans 10px uppercase tracked, Text/3
- Blurb: `The sky divided into life. Each house holds a domain in the shape of the sign that rules it.`
  — system sans 12px, Text/3, margin-top 4px

**House cards — 2×6 grid (grid-template-columns: 1fr 1fr, gap: 1px)**

Collapsed state:
```
H[n]  [Domain Word]              [chevron-right icon]
[↑ Ascendant  ♄ Saturn]
```
- First line: `H[n]` + domain word, EB Garamond 15px Text/1. Chevron right-aligned.
- Second line: planets as `[symbol] Name` pairs, flex row wrap, gap 8px.
  Symbol: gold #C8A96E. Name: system sans 11px Text/2.
- Empty house: "No placements" italic Text/3
- Padding: 16px horizontal, 14px vertical
- Active (tapped): border-top rgba(200,169,110,0.55)
- Hover: background rgba(255,255,255,0.02), wheel segment subtle gold tint

**House domain words:**
```
1=Self, 2=Worth, 3=Mind, 4=Home, 5=Creativity, 6=Routines,
7=Relationships, 8=Transformation, 9=Expansion, 10=Vocation,
11=Community, 12=Solitude
```

Expanded detail (replaces right column content, left stays fixed, 480ms transition):
```
← Houses                         ← ghost back button

H[n] · [Domain Word]             ← EB Garamond 22px Text/1
[symbol] [Planet] · [symbol] [Planet]  ← planet chips as subtitle (gold glyph + name)
                                    omitted for empty houses

──────────────────────────────

SIGN                             ← section label
[Sign name]                      ← EB Garamond 18px Text/1
[Element · Modality]             ← system sans 11px Text/3 tracked
[Sign blurb]                     ← system sans 12px Text/2, from lib/signBlurbs.ts

READING                          ← section label
[1–2 paragraphs]                 ← EB Garamond italic 15px #C8A96E, line-height 1.8
                                    from lib/houseReadings.getHouseReading()
                                    placeholder until AI layer built

BODIES                           ← section label (omitted for empty houses)
  [Planet] in [Sign]             ← subsection: EB Garamond 16px Text/1
  [2–4 sentences]                ← 12px Text/2, from getPlanetNote()
  [line swatch] [glyph] [ASPECT TYPE] with [Planet]  ← aspect bullet
  [2–4 sentences]                ← 12px Text/2, from getAspectNote()

Empty house: "This house is unoccupied. Its sign still shapes the domain."
             12px italic Text/3, BODIES section omitted entirely

[REFLECT]                        ← sticky bottom, gold CTA
                                    96px spacer above, gradient fade bg
```

Aspect bullet anatomy:
- Inline SVG swatch (28×12px) with correct line style for aspect type
- Gold glyph of the aspected planet
- "[ASPECT TYPE] with [Planet name]" — 11px uppercase letter-spacing 0.06em Text/2
- Only rendered for aspects currently drawn on the wheel for this house
- Uses filtered houseAspects prop — not recomputed in component

### Section 2 — DEFINING ASPECTS (conditional)

Hidden entirely if `configurations.length === 0`. No empty state shown.

Section header:
- Label: `DEFINING ASPECTS` — same label style as above
- Blurb: `Some arrangements of planets carry unusual weight. These are yours.`

**Configuration cards — 2-column grid (same as house grid)**

Collapsed state:
```
[Configuration type] · [Focal planet if applicable]    [chevron-right]
[♀ Venus  ♆ Neptune  ☽ Moon]
```
- First line: configuration label (e.g. "T-Square · Moon") EB Garamond 15px Text/1
- Second line: planet symbols + names, same treatment as house cards
- Active: border-top rgba(200,169,110,0.55)

**Configuration card subtitle logic (locked):**
```
T-Square    → "Focal planet: [planet name]"
Yod         → "Focal planet: [planet name]"
Kite        → "Focal planet: [planet name]"
Stellium    → "[H# Domain]" if house stellium, "[Sign]" if sign stellium
Grand Trine → "[Element] Trine"
Grand Cross → "[Modality] Cross"
```

Expanded detail:
```
← Patterns                       ← ghost back button

[Configuration label]            ← EB Garamond 22px Text/1
[Subtitle per logic above]       ← system sans 12px Text/2, focal in gold

──────────────────────────────

READING                          ← section label
[1–2 paragraphs]                 ← EB Garamond italic 15px #C8A96E, line-height 1.8
                                    from getConfigurationReading() — placeholder

BODIES                           ← section label
  [Subsection title]             ← EB Garamond 16px Text/1
  [3–6 sentences]                ← 12px Text/2, from getParticipantNote()

[REFLECT]                        ← sticky bottom, gold CTA, 96px spacer above
```

BODIES subsection grouping:
- Paired bilateral: "[Planet] and [Planet] in [aspect type]"
- Solo apex/focal: "[Planet] as [role]"
- T-Square: one paired (opposition) + one solo (apex)
- Yod: one paired (sextile) + one solo (focal)
- Grand Cross: two paired (two oppositions)
- Grand Trine: three solo (no hierarchy)
- Stellium: one solo per planet (no pairing)
- Kite: three solo (trine members) + one paired (opposition/focal)

No FIGURE or PATTERN section — READING carries full contextual weight.

### State model
```typescript
const [activeHouse, setActiveHouse] = useState<number | undefined>(undefined)
const [expandedHouse, setExpandedHouse] = useState<number | undefined>(undefined)
const [hoveredHouse, setHoveredHouse] = useState<number | undefined>(undefined)
const [activeConfiguration, setActiveConfiguration] = useState<ChartConfiguration | null>(null)
const [expandedConfiguration, setExpandedConfiguration] = useState<ChartConfiguration | null>(null)
const [hoveredConfiguration, setHoveredConfiguration] = useState<ChartConfiguration | null>(null)
```

Rendering priority in NatalWheel:
activeConfiguration > activeHouse > hoveredConfiguration > hoveredHouse > default

### NatalWheel behavior
- Default: shows aspect lines for all detected configurations (flatMap configToAspects)
- House selected: corresponding segment highlighted gold (rgba(200,169,110,0.15) fill,
  rgba(200,169,110,0.55) border-top)
- House hovered: subtle gold tint on segment (rgba(200,169,110,0.08) fill,
  rgba(200,169,110,0.25) border-top)
- Configuration selected: those planet symbols turn gold (#C8A96E)
- Configuration hovered: those planet symbols turn partial gold (rgba(200,169,110,0.6))
- Back from detail: clears all active and expanded state

### Layout — mobile (<768px)
Single column, normal page scroll:
- Header (You title + BirthDataCard, 50/50)
- NatalWheel size=280, centered
- Big 3 summary
- Placeholder button
- LIFE'S ARCHITECTURE section header + 2-column house card grid
- DEFINING ASPECTS section header + 2-column configuration card grid
- Tapping a card: full-screen expanded view (useState, no router nav)
  Back button returns to card list and scrolls to tapped card position

---

## lib/configurations.ts — chart configuration detection (built)

Main export:
```typescript
export function detectConfigurations(
  planets: PlanetPoint[],
  planetHouses?: Record<string, number>
): ChartConfiguration[]
```

**Excluded from detection:** Chiron, Lilith, Ascendant, Midheaven

**Orbs:**
```
conjunction: 6°, opposition: 5°, square: 5°, trine: 4°, sextile: 3°, quincunx: 2°
```

**Configurations detected (sort order):**
Grand Cross → T-Square → Yod → Kite → Grand Trine → Stellium → Mystic Rectangle

- **Stellium** — 3+ planets same sign OR same house (house pass requires planetHouses)
- **T-Square** — opposition pair + third planet squaring both; focalPlanet = squaring planet
- **Grand Cross** — two T-squares sharing opposition axis with mutually-opposing focal planets
- **Grand Trine** — three planets each trine to the other two
- **Kite** — grand trine + fourth planet opposing one of the three
- **Yod** — sextile pair both quincunx a third; focalPlanet = quincunx apex
- **Mystic Rectangle** — two opposition pairs connected by trines and sextiles

**Verified against birth data (Jun 28 1997, 7pm, Bellflower CA):**
- T-Square: Venus (120°) opp Neptune (299°), Moon (27°) squares both ✓
- Stellium: Jupiter (321°), Uranus (308°), Neptune (299°) all in H2 ✓
- Note: Moon (27° Aries) conjunct Saturn (19° Aries) in H4 — significant conjunction,
  not yet surfaced. Post-MVP consideration: surface notable two-planet conjunctions
  (Moon-Saturn, Sun-Moon, etc.) as named cards in Defining Aspects.

---

## NatalWheel.tsx — component spec (built)

SVG-based natal chart wheel at `/components/cosmic/NatalWheel.tsx`.

**Props:**
```typescript
interface NatalWheelProps {
  houses: { number, cuspDegree, sign, domainWord }[]
  planets?: { name, degree, isRetrograde }[]
  aspects?: { bodyA, bodyB, type }[]
  activeHouse?: number
  hoveredHouse?: number
  activeConfigurationPlanets?: string[]
  hoveredConfigurationPlanets?: string[]
  size?: number  // default 360
}
```

**Ring structure (outermost to innermost):**
1. House ring — 12 Placidus segments, labeled H1–H12
2. Sign ring — 12 equal 30° segments, full sign names
3. Planet field — symbols at `signInnerR * 0.92`, angular collision spreading
4. Center circle — aspect lines

**Orientation:** Ascendant fixed at 9 o'clock. Houses run counterclockwise.

**Planet rendering:** Symbol only (no dots, no name labels).
- Default: #E2E4EA (white)
- In activeConfigurationPlanets: #C8A96E (gold)
- In hoveredConfigurationPlanets: rgba(200,169,110,0.6)
- No legend rendered

**Aspect line styles:**
```
conjunction: solid 1px rgba(200,169,110,0.5)   — gold
opposition:  solid 1.5px rgba(184,85,85,0.5)   — red
square:      solid 1px rgba(201,147,58,0.5)    — amber
trine:       dashed 4 4, 1px rgba(62,180,137,0.4) — green
sextile:     dotted 2 4, 1px rgba(139,144,156,0.35) — muted
```

---

## Transit card anatomy (current, locked)

```
Row 1:  [timing indicator]          [Peak Mar 18]
Row 2:  Saturn opposite natal Mars
Row 3:  House 3                     ← only if birth data present
Row 4:  Drive meets resistance. Frustration that demands disciplined effort.
```

### Timing indicator logic (shared — lib/timingIndicator.ts)
- 0 days: green dot (#3EB489) + "Today"
- 1 day: amber dot (#C9933A) + "Tomorrow"
- 2–14 days: amber dot + "In X days"
- 15+ days: no dot + "In X weeks"

---

## Transit detail panel anatomy (complete, locked)

```
[Timing indicator]
[Transit title]                  ← EB Garamond display
H[x]: [Domain] (if birth data)   ← e.g. "H3: Mind"

READING                          ← section label
[1–2 paragraphs]                 ← EB Garamond italic gold
                                    chart-aware AI: natal chart context injected
                                    hidden entirely if no birth data present

BODIES                           ← section label
[Body icon] Body name            ← one-clause domain blurb per body

ASPECT  (or)  CYCLE              ← mutually exclusive
[Icon] Type                      ← one-clause blurb

PASSAGE
[Calendar strip]

[REFLECT]                        ← gold primary CTA if birth data present
                                    or:
"This transit has more to say. It needs your origin to say it."
                                    ← EB Garamond italic gold, if no birth data
[ENTER YOUR ORIGIN]              ← secondary CTA, dispatches "vigil-open-birth-input"
```

### Body blurbs (locked — do not alter)
```
SUN       → "Where your sense of self takes form. The light you move toward and the one you cast."
MOON      → "Where the body keeps its memory. Instinct, pattern, the self that surfaces before thought."
MERCURY   → "Where perception finds its voice. The particular way you receive the world and give it back."
VENUS     → "Where desire knows its shape. What you are drawn toward, and what draws itself to you."
MARS      → "Where drive lives in the body. The shape of your assertion, and how you meet resistance."
JUPITER   → "Where expansion finds its invitation. The direction life keeps asking you to grow toward."
SATURN    → "Where structure makes its demands. The slow, exacting work of becoming who you are."
URANUS    → "Where the expected loses its hold. The fault line where something truer breaks through."
NEPTUNE   → "Where edges soften and dissolve. Longing, imagination, and what the visible world conceals."
PLUTO     → "Where transformation applies its pressure. What must be released for what is essential to remain."
CHIRON    → "Where the wound becomes the teacher. The place of greatest tenderness and deepest capacity."
NORTH NODE → "Where this life is asking you to arrive. The direction that feels unfamiliar and necessary."
SOUTH NODE → "Where you already know the way. What comes without effort — and what may be ready to loosen."
ASCENDANT → "Where you meet the world and the world meets you. The rising sign. The face of the self that forms at the threshold between inner and outer."
MIDHEAVEN → "Where your path becomes visible to others. The point where private becoming meets public life."
DESCENDANT → "Where you encounter the other. What you seek in relationship, and what relationship asks of you in return."
IC        → "Where the roots run deepest. The private self, the ancestral ground, what lies beneath everything visible."
```

### Aspect blurbs (locked — do not alter)
```
CONJUNCTION → "Two forces occupying the same point. Their themes become inseparable. Amplified, fused."
OPPOSITION  → "Two forces across an axis, each made visible by the other. The tension asks for integration. Not resolution."
SQUARE      → "Two forces at friction. Neither yields easily. The pressure is generative. Something is being forged here."
TRINE       → "Two forces in natural harmony. What flows between them moves without resistance."
RETROGRADE  → "A planet turning its gaze inward. What it governs slows, reconsiders, asks to be revisited."
DIRECT      → "A planet resuming its forward motion. What was held in review begins to move again."
INGRESS     → "A planet crossing a threshold. The tone of what it governs shifts. Subtly at first. Then undeniably."
```

### Cycle blurbs (locked — do not alter)
```
NEW MOON          → "The cycle returns to darkness. What wants to begin here has not yet taken form."
FULL MOON         → "What was seeded has reached its fullness. A peak. A release. Often both."
SUPER MOON        → "A Full Moon closer to Earth than usual. The emotional pull is amplified. Hard to look away."
BLUE MOON         → "A second Full Moon within the same month. An invitation to finish what the first one started."
HARVEST MOON      → "The Full Moon nearest the autumn equinox. What has been cultivated is ready to be gathered."
BLOOD MOON        → "A total lunar eclipse. Something completing now carries real weight."
LUNAR ECLIPSE     → "A Full Moon held under pressure. The shadow reveals what ordinary light conceals."
SOLAR ECLIPSE     → "A New Moon with force behind it. Something is clearing so that something truer can take root."
SUPER BLUE BLOOD MOON → "Three cycles converging at once. Rare, and not accidental."
```

---

## Current build status

### Completed
- **Project scaffold** — Next.js 14, Tailwind, Astronomy Engine, Supabase client
- **GlassPanel.tsx** — base card component
- **SolarSystem.tsx** — Canvas solar system, real planet positions, 90s drift
- **Feed page** — full-bleed background, transit cards, real data
- **Transit detail panel** — complete, voice audit passed, refinement pass complete
- **BirthDataCard.tsx** — shared, Nominatim geocoding, localStorage persistence
- **Transit generator** (`lib/transitGenerator.ts`) — all event types, stable
- **lib/transitFilter.ts** — calibrated scoring, stable
- **TransitCard.tsx** — correct anatomy
- **lib/transitCopy.ts** — card description lookup
- **lib/transitDetail.ts** — body/aspect/cycle blurb lookups
- **lib/timingIndicator.ts** — shared utility
- **lib/natal.ts** — Placidus house cusps (verified vs Astro-Seek)
- **lib/configurations.ts** — chart configuration detection, verified
- **NatalWheel.tsx** — SVG natal chart wheel, complete
- **You page** (`/app/you/page.tsx`) — complete
- **House detail panels** — content architecture complete
- **Configuration detail panels** — content architecture complete
- **lib/signBlurbs.ts** — 12 sign blurbs + element/modality lookup
- **lib/journal.ts** — useJournalEntries, upsertEntry, deleteEntry
- **Journal list page** (`app/journal/page.tsx`) — complete
- **New entry page** (`app/journal/new/page.tsx`) — complete
- **Entry view/edit page** (`app/journal/[id]/page.tsx`) — complete
- **AttachComponent.tsx** — complete: empty state, attach modal, postcard,
  removal warnings, detail view modal
- **Screen 1 — Email entry** (`app/auth/page.tsx`) — complete
- **Screen 2 — Returning user password** (`app/auth/returning/page.tsx`) — complete.
  Includes top-of-column Email/Change block (replaces plain back button), unchanged
  error states, plus a routing rule (not an error state): valid password on an
  unconfirmed account redirects to the Screen 3 confirm screen rather than showing
  an error.
- **Screen 3 — New user password creation** (`app/auth/new/page.tsx`) — complete.
  Single password field (no confirm field), show/hide toggle, live green/checkmark
  fulfillment hint, red "Not quite enough yet." on unfulfilled submit, Email/Change
  block, silent redirect to Screen 2 on "already registered," generic network error
  reused from Screen 2.
- **Screen 3 confirm — Email confirmation** (`app/auth/new/confirm/page.tsx`) — complete.
  Link-based (not OTP), auto-sends on first arrival, localStorage-backed cooldown
  timer anchored to a timestamp (survives reload/navigation), top-of-column back button.
- **Vigil ceremony** (`app/auth/new/vigil/page.tsx`) — complete. Five-candle ceremony
  screen between email confirmation and birth data entry. Single text slot replaces
  opening → clauses → bridge in place. No completion tracking — replays fully on every
  visit. Both Skip and OFFER YOUR ORIGIN navigate to `/auth/new/origin`.
- **Auth callback route** (`app/auth/callback/route.ts`) — complete. Exchanges Supabase
  auth code for session, redirects to `/auth/new/vigil`.

### Not yet built
- **Screen 5 — Character-building / origin entry** — next up. Birth date, time, city.
  Intentionally scoped to be more deliberate and exhaustive than a typical
  speed-optimized onboarding form — framed as world-building, not a data-entry
  step to rush through. Ends with natal portrait generation trigger.
- **Password reset flow — flagged for rework.** Current "Forgot your password?"
  link on Screen 2 triggers Supabase's default reset flow, which surfaces as
  inline feedback reading like an error state. To be redesigned as its own
  deliberate flow. Not started, deprioritized behind Screen 5.
- **Natal portrait generation** — AI deep reading at account creation. This is
  the centerpiece of the account creation flow and must be high quality on day one.
  Build immediately after Screen 5. Do not defer.
- **House and configuration detail — AI interpretation** — placeholder copy in place.
  Deferred until auth and schema are stable. Swap points are clean.
- **Transit detail — AI READING** — placeholder copy in place. Deferred until auth
  and schema are stable.
- **Supabase integration for app data** — currently using localStorage throughout
  for birth data and journal entries. Auth itself is already on Supabase Auth.
- **Settings page** — includes Origin management with correction policy UX
- **Birth data migration** from localStorage to Supabase on account creation
- **Confirmation-resend cooldown moved server-side** — currently localStorage,
  flagged to migrate to a Supabase column when SSO/Supabase migration happens.
- **Reflect CTA wiring to journal** — REFLECT on transit/house/configuration detail
  pages should create a new journal entry pre-populated with that context and navigate
  to `/journal/new` (or `/journal/[id]` if entry already exists for that context).
  Currently console.log only. Build after Screen 5 and portrait are stable.
- **Portrait regeneration purchase flow** — $4–9, triggered after free correction used
- **Collective Unconscious** — weekly article, Feed card, article page. Comments deferred.
- **Year in Review** — post-MVP, free, annual, December
- **Year Ahead forecast** — post-MVP, paid (~$7), annual, December
- **Digital cosmetics** — post-MVP. Requires design token system built first.
- **Notable conjunction detection** in Defining Aspects — post-MVP consideration.
- **SSO configuration** — Google and Apple OAuth credentials not yet configured in
  Supabase dashboard. Buttons present in UI but not wired.

---

## Authentication flow — screen specs

Auth uses Supabase Auth with email/password and SSO (Google, Apple).
Email confirmation required for email/password accounts, link-based (not OTP/code).
Validation is on-submit only — no real-time field validation, with the one exception
noted below (live password-length fulfillment indicator, which doesn't block or
error, just indicates).
Rate limiting on signup endpoint via Vercel middleware (5 attempts per IP per hour).
No CAPTCHA.

### Infrastructure (built)

- `lib/supabase.ts` — `createBrowserClient` factory from `@supabase/ssr`. Cookie-based
  auth tokens, ready for SSR hydration when server components arrive.
- `app/api/auth/check-email/route.ts` — server-only route handler. Calls GoTrue admin
  REST endpoint, does exact JS-side email comparison, returns
  `{ status: "new" | "password" | "sso" | "error", provider? }`. Service role key
  never leaves the server. Returns explicit 500 `{ status: "error" }` on any network
  or server failure — does not fail open.
- `lib/auth.ts` — `useAuth` hook returning `{ user, loading }` via
  `onAuthStateChange`. Shared across all components that need auth state.
- Bottom nav and desktop top nav: show "Sign In" tab (navigates to `/auth`) when
  unauthenticated, "Settings" tab when authenticated. Driven by `useAuth`.
- `.env.local` — created, gitignored. Requires three values from Supabase dashboard:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`.
- SSO (Google, Apple) — buttons present in UI but OAuth credentials not yet
  configured in Supabase dashboard. Deferred — does not block email/password flow.

### Design patterns shared across auth screens (locked)

- **Back button:** ghost `←` + "Back", matching feed/you-page detail back-button
  styling. Positioned inside the centered content column, directly above the
  screen title. Used as-is on the confirm screen; superseded by Email/Change on
  Screens 2 and 3's password step.
- **Email/Change block (Screens 2 and 3 password step):** "Email" label (matches
  "Password" field label styling) + email value as body text + inline ghost
  "Change" link on the same line, positioned directly above the Password field.
  "Change" navigates to `/auth`.
- **No confirm-password field anywhere.** Single field + show/hide eye toggle.
- **Password minimum: 8 characters, no complexity rules.**

### Routing logic

All auth screens live under `app/auth/`.

SSO provider detection happens at the email lookup step. If a submitted email belongs
to an account created via Google or Apple SSO, the user is routed to the appropriate
SSO flow immediately — they never see the password screen.

New vs. returning detection: submit email → call `/api/auth/check-email` → returning
user gets password screen, unrecognized email gets new user flow.

On submit routing from Screen 1:
- `password` → `app/auth/returning/`
- `sso` → Supabase OAuth flow with `redirectTo: /auth/callback`
- `new` → `app/auth/new/`
- `error` → show inline error, do not route

### Screen 1 — Email entry (`app/auth/page.tsx`) — BUILT

Entry point for all auth. Handles both returning and new users from a single field.

```
"Have we met?"                   ← EB Garamond display, no subtitle

Email                            ← field label, system sans small, Text/2
[your address]                   ← placeholder, disappears on type

[NEXT]                           ← primary gold CTA

— or —                           ← divider

[G] Continue with Google         ← secondary SSO options (not yet wired)
[⌘] Continue with Apple
```

Error states (on submit, inline below field):
- `"That doesn't look like a valid email."` — malformed format
- `"Something went wrong. Try again."` — network/Supabase error

### Screen 2 — Returning user password (`app/auth/returning/page.tsx`) — BUILT

Shown when submitted email matches an existing email/password account.

```
← Back                           ← ghost, top of content column, above title
                                     — actually rendered as the Email/Change block below

Email                            ← field label
your@email.com         Change    ← body text + inline ghost link, navigates to /auth

You've returned.                 ← EB Garamond display
A password is all it takes.      ← EB Garamond subtitle, Text/2

Password                         ← field label
[........]                       ← password input, masked

Forgot your password?            ← ghost link, flagged for rework (see below),
                                     currently triggers Supabase password reset
                                     redirectTo: /auth/reset

[ENTER]                          ← primary gold CTA
```

Error states (on submit, inline below field):
- `"That password is incorrect."` — maps from Supabase "Invalid login credentials"
- `"Something went wrong. Try again."` — all other errors

**Not an error state — a routing rule:** if the password is valid but the account
is unconfirmed (Supabase returns "email not confirmed"), redirect to
`/auth/new/confirm?email=[email]` instead of showing any inline message here.
This triggers a resend confirmation email, subject to the cooldown described below.

On success (confirmed account): navigate to `/` (Feed).

SSO edge case handled upstream: accounts created via Google or Apple are detected
at Screen 1 and routed to SSO directly. This screen is only ever shown for
email/password accounts.

Email passed via URL param from Screen 1.

### Screen 3 — New user password creation (`app/auth/new/page.tsx`) — BUILT

Entry point for new users routed from Screen 1.

```
Email                            ← field label
your@email.com         Change    ← body text + inline ghost link, navigates to /auth

Let's begin.                     ← EB Garamond display
Choose a password. It's how you'll return.  ← EB Garamond subtitle, Text/2

Password                         ← field label
[........]              [eye]    ← password input, show/hide toggle right-aligned
8+ characters                    ← hint, Text/3 default

[NEXT]                           ← primary gold CTA
```

No confirm-password field — single field with show/hide toggle instead. Removes
a field and an error state for the same typo protection.

**Password hint states (live, updates on keystroke — the one exception to
on-submit-only validation, since it's a fulfillment indicator, not a blocking error):**
- Default (untouched or <8 characters): neutral Text/3, "8+ characters"
- Fulfilled (≥8 characters): status green #3EB489, checkmark icon appears left of text
- On submit, if still unfulfilled: hint turns status red #B85555, error line appears
  beneath: **"Not quite enough yet."**

Password rules: 8 character minimum, no complexity requirements. Set in Supabase
dashboard (Auth → Policies).

On submit (`signUp()`):
- Success → navigate to `/auth/new/confirm?email=[email]`
- "Already registered" error (race condition — user completed signup elsewhere
  between Screen 1's check and this submission) → **silent redirect** to
  `/auth/returning?email=[email]`, no error UI shown at all
- Network/server error → inline **"Something went wrong. Try again."** below CTA
  (reused from Screen 1/2), does not navigate

Email passed via URL param from Screen 1. If missing, redirect to `/auth`.

### Screen 3 confirm — Email confirmation (`app/auth/new/confirm/page.tsx`) — BUILT

Passive holding screen. No field, no form-submit CTA — progression happens
externally when the user clicks the confirmation link in their email, which
routes to `/auth/callback`. The callback route exchanges the auth code for a
session and redirects to the vigil ceremony at `/auth/new/vigil` — not directly
to birth data entry.

Link-based rather than OTP/code-based, to stay on Supabase's simplest native
pattern (single `signUp()` call, no second verification mechanism). Switching to
code-based confirmation later is possible without disrupting already-confirmed
users — the confirmation method only affects new signups going forward, not
existing accounts.

```
← Back                           ← ghost, top of content column, above title
                                     navigates to /auth

Almost there.                    ← EB Garamond display
Check your inbox. The link there brings you back.  ← EB Garamond subtitle, Text/2

your@email.com                   ← plain text, confirms target inbox

Resend confirmation              ← ghost link
                                     cooldown state: "Resend in [n]s", ticking live
```

**Cooldown logic:**
- Anchored to a timestamp (last confirmation sent), not to page-mount time — a
  user landing mid-cooldown sees the correct remaining time, not a fresh 45s
- Currently stored in **localStorage**, keyed per email
  (`vigil-confirmation-sent:[email]`) — matches the app's existing
  localStorage-first pattern. **Flagged to move server-side** (e.g. a
  `last_confirmation_sent_at` column) when Supabase migration / SSO
  configuration happens, since this is auth/rate-limiting state and should
  survive device switches
- On first arrival (fresh signup, no timestamp yet for this email): auto-triggers
  the resend call and starts the cooldown — this is what sends the actual first
  confirmation email
- On arrival via the Screen 2 unconfirmed-account redirect: if a timestamp
  already exists and the cooldown hasn't elapsed, no new email is sent — user
  just sees the remaining countdown, no duplicate send

### Vigil ceremony (`app/auth/new/vigil/page.tsx`) — BUILT

Interstitial ceremony screen between email confirmation and birth data entry.
The user's first moment inside the product after confirming their account.

**Route:** `/auth/new/vigil`
**Enters from:** `/auth/callback` (email confirmation link click)
**Exits to:** `/auth/new/origin` — via OFFER YOUR ORIGIN CTA or Skip

**Ceremony sequence:**
1. Opening line types into a single centered text slot (EB Garamond italic, gold):
   "Something has been waiting. Before the sky, before the chart. Here."
2. Opening complete → candle 1 fades in below, "LIGHT THE VIGIL ↓" label appears,
   Skip fades in top-right.
3. Tapping candle 1 ignites it and REPLACES the opening line with clause 1 in the
   same slot. Only one line of dialogue is ever visible at any point.
4. Each subsequent candle tap replaces the current text with the next clause.
   Tapping a mid-typing candle fast-forwards the current clause to completion.
5. Candle 5 tap ignites it and replaces clause 4 with the bridge line:
   "A vigil marks a place. Yours has a moment too. Tell the sky when, and where,
   you arrived."
6. Bridge complete → OFFER YOUR ORIGIN (primary gold CTA) fades in at viewport bottom.

**Clauses** (`lib/vigilCopy.ts` — `VIGIL_CLAUSES[0–3]`):
```
0: "You have looked at the stars before. Everyone has. Few have asked the stars to look back."
1: "What you find here will not always be gentle. Some of it you already know and have not said aloud."
2: "This is not fortune. Nothing here will tell you what happens next. It will tell you what is already true."
3: "The sky remembers the moment you arrived. Light the last flame, traveler, and give it back its memory."
```

**Key decisions (locked):**
- **No completion tracking. Replays in full on every visit.** All state is `useState`
  with zero localStorage or session persistence. Loading `/auth/new/vigil` always
  starts from the opening line — including via the Screen 2 unconfirmed-account
  redirect edge case. Do not add "has seen ceremony" persistence under any framing.
- Background is pure black (`#000000`), not the ground color (`#0D1117`) used elsewhere.
- Skip available after opening completes. Both Skip and OFFER YOUR ORIGIN navigate
  to `/auth/new/origin`.
- `app/auth/callback/route.ts` — server route handler. Exchanges Supabase auth code
  for session, then redirects to `/auth/new/vigil`.

### Screen 5 — Character-building / birth data entry — NOT YET BUILT

Route: `/auth/new/origin`. Deliberately scoped to feel more exhaustive and
world-building than a typical speed-optimized onboarding form — this is the
character-creation moment, not a form to rush through. Will cover birth date,
time, city, and end by triggering natal portrait generation.

### Password reset flow — FLAGGED FOR REWORK

Current "Forgot your password?" link (Screen 2) triggers Supabase's default
password reset flow, which surfaces as inline feedback that reads like an error
state — not yet redesigned as its own deliberate flow. Not started. Deprioritized
behind Screen 5; pick up after character-building/origin entry and portrait
generation are built.

---

## Where to continue

**Auth flow as built:** Screen 1 → Screen 2 (returning) or Screen 3 (new) →
Screen 3 confirm → vigil ceremony (`/auth/new/vigil`) → Screen 5 (not yet built)

**Next: Screen 5 — Character-building / origin entry** (`/auth/new/origin`).

Build in this order:
1. Screen 5 — Character-building / origin entry (birth date, time, city) —
   intentionally more deliberate/exhaustive than a typical onboarding form
2. Natal portrait generation — AI deep reading, triggered at end of Screen 5
3. Account gate on Reflect CTA — "Save your reflection" framing
4. Reflect CTA wiring — creates journal entry, navigates to `/journal/new` or `/journal/[id]`
5. Supabase migration — move localStorage app data (birth data, journal entries) to
   Supabase on sign-up; move confirmation-resend cooldown server-side
6. SSO configuration — Google and Apple OAuth credentials in Supabase dashboard
7. Password reset flow — rework away from the current error-adjacent inline treatment
8. Settings page — origin management, correction policy, account details
9. Portrait regeneration purchase flow

**After auth and portrait:** Collective Unconscious article pipeline.

**After Collective Unconscious:** AI interpretation layer for all detail views
(house, configuration, transit).

**Design system consolidation pass** — after POC is complete, before design polish.
Audit all atoms/components and extract a token map. All raw color, spacing, and blur
values should be pulled into a single tokens file. This is also a prerequisite for
digital cosmetics (skins).

**Legal to-dos** — privacy policy and terms of service must exist before first user
creates an account. See Legal To-Dos section. Do not launch without these.

---

## Naming

The app is named **Vigil**. Final and locked.
```typescript
// lib/config.ts
export const APP_NAME = "Vigil"
```
Do not hardcode "Vigil" anywhere — always reference APP_NAME from lib/config.ts.

---

## Brand & Identity

- **App name:** Vigil (final, locked)
- **Tagline:** "The sky is a mirror. Write back."
- **Domain:** vigil.observer
- **Email:** hello@vigil.observer
- **Social:** @vigilcodex on TikTok and Instagram
- **Positioning:** Premium ritual lifestyle platform. Not a pop astrology app.
  Comparable ethos to Equinox or Erewhon. The universe as mirror, not oracle.
- **Target user:** "TikTok transit chaser" — seriously engaged with astrology as
  self-discovery, currently bouncing between multiple tools to approximate what
  Vigil does natively.
- **Birth data (user-facing label):** Origin.
  Use "origin" wherever the user sees it. "Birth data" remains correct in code and schema.

---

## Transit feed — scoring and filter logic

### Feed window
30 days forward from today. No historical transits.

### Scoring model
```
importance = planet weight + aspect weight + orb weight + natal relevance bonus + special event override
```

**Planet weights:** Saturn/Uranus/Neptune/Pluto=5, Jupiter/Chiron=4, Mars/Venus=3,
Mercury/Sun=2, Moon=1

**Aspect weights:** Conjunction/Opposition/Square=4, Trine=2, Sextile=suppressed

**Orb weights:** 0–1°=3, 1–3°=2, 3–6°=1, >6°=0

**Natal relevance bonus (outer/social planets only):**
Sun/Moon/ASC/MC=+5, Saturn/Venus/Mars=+3, Mercury/Jupiter=+2, Uranus/Neptune/Pluto=+1

**Display thresholds:** ≥14=Major, 12–13=Active, <12=suppressed (unless override)

**Special event override (always surface):**
Retrograde stations, eclipses, New/Full Moons (all variants), sign ingresses (Tier 1–2)

---

## Aetheric Wisdom (post-MVP)

Synthesis card at top of feed. Triggers when 3+ active Major/Active transits with
at least one natal activation, no generation in past 7 days. EB Garamond italic gold.
Ephemeral — expires with triggering transit's orb window. Do not build for MVP.

---

## What not to build (MVP scope)

- Push notifications
- Aetheric Wisdom
- Progressive depth signal on You page
- Natal interpretation updates over time
- Journal filtering
- AI chat within journal entries (deliberate product decision — permanent)
- Injection of journal data into any AI query (deliberate product decision — permanent)
- Synastry or multi-user chart comparisons
- Social features
- Native mobile app
- House system preference (Placidus only for MVP)
- Detach transit context from journal entry
- Tarot spread entry type (spec the enum, do not build UI)
- Natural language question interface on You page (post-MVP premium)
- Aspects and Bodies lenses on You page (post-MVP, pending user feedback)
- Transit calculator for non-feed transits (post-MVP)
- Burn animation (post-MVP — asset to be designed separately)
- Collective Unconscious comments (post-MVP)
- Year in Review (post-MVP)
- Year Ahead forecast (post-MVP, paid)
- Digital cosmetics / app skins (post-MVP)
- Physical bazaar (post-traction)
- Creator marketplace (post-MVP, phase three)
