# Astro Journal — Project Context

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
AI-generated interpretation grounded in the user's own journal history — in one
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

## Navigation

Four tabs, mobile bottom nav (desktop top nav):
**Feed · You · Journal · Settings**

---

## Key product decisions — locked, do not revisit

- Responsive web app, mobile-first. No native app for MVP.
- AI layer: Anthropic API only. Interpretive quality is the core value prop.
- Account gate triggers on first "Reflect" CTA tap, framed as "Save your reflection"
- Reflect CTA swaps to "View your reflection" once a journal entry exists — universal
  pattern across transit detail and natal planet detail pages. Reverts on entry delete.
- Birth data: date + time + city. Unknown time defaults to noon. Placidus house system.
- General transit interpretations: cached per event (zero marginal AI cost per user).
- Personal transit analysis: per-user, AI-generated on page load.
- Delete journal entries: MVP scope.
- Post-MVP only: push notifications, depth signal, natal interp updates, journal filtering.

---

## Information architecture

### Ungated (no account required)
- Feed — transit cards, birth data input bar
- Transit detail page — general interpretation, personalized analysis if birth data present
- You page — natal chart, generic interpretations if birth data present

### Gated (account required, triggered by Reflect CTA)
- Full journal (create, view, manage entries)
- Personalized AI analysis with journal history injected
- You page — full natal chart interpretations

---

## Core screens — build in this order

### 1. Feed (start here)
- Full-bleed cosmic background: top-down solar system view rendered with real planet
  positions from Astronomy Engine. Slow parallax drift animation. This is the hero
  experience — not decoration.
- Left panel (desktop) / overlay cards (mobile): scrollable list of upcoming transit cards
- Each card: planet name, transit type, peak date, house (if birth data present)
- Tapping a card: background camera "moves" to focus on that planet, card expands to
  transit detail panel
- Birth data input bar at top for unauthenticated users

### 2. Transit detail
- Morphs from feed card (same surface, expanding — not a page navigation)
- Shows: event name, planet(s), transit type, peak date/time local timezone,
  duration + orb window
- General interpretation section (cached)
- Personalized analysis section (AI, requires birth data)
- Reflect CTA → account gate if unauthed, journal entry if authed

### 3. You page
- Big 3 summary (Sun, Moon, Rising) + key aspects
- Planet cards Sun through Pluto — tap to open natal planet detail
- Natal planet detail: sign, house, aspects, AI interpretation, Reflect CTA

### 4. Journal
- Reverse chronological list of entries
- FAB for freeform entry
- Context entries spawned from transit/natal pages carry context header
- AI chat within each entry, has access to entry text + full journal history
- Delete with confirmation

### 5. Settings
- Birth data management
- Account details

---

## Visual design direction (locked)

**Reference:** CyberDefend dashboard UI (space/satellite management aesthetic)
**Direction:** "Sacred Instrument" — the CyberDefend spatial model with esoteric warmth

### Spatial concept
Three depth layers:
1. Living cosmic background (solar system visualization, real planet positions)
2. Structural chrome (nav, panel frames)
3. Glass information cards floating over the scene

### Color system (extracted from CyberDefend + esoteric layer)
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
```

### Typography
- **Headings/display:** EB Garamond (Google Font) — 400 and 500 weights
- **Interpretive text:** EB Garamond italic, gold color — this is where the magic lives
- **UI labels/meta:** System sans (Inter/-apple-system), uppercase, tracked
- **Body/data:** System sans, 12px, text/2 color
- The contrast between sans (data layer) and serif italic (meaning layer) is intentional

### CTA hierarchy
1. **Primary (Reflect):** Gold tint bg + gold border + top highlight. Exists nowhere else.
2. **Secondary (View your reflection):** Neutral outline only.
3. **Ghost (Back to feed):** No border, tertiary text.

### Motion principles
- Card enter: 380ms ease-out
- Detail expand: 480ms ease-in-out
- Planet focus pan: 900ms ease-out
- Background cosmic drift: 90s linear loop
- Status dot pulse: 2.5s ease-in-out infinite
- Nothing snaps. Everything settles.

---

## AI architecture

### Model
Anthropic API, claude-sonnet-4-5 (or latest Sonnet). Called directly from the app.

### Query types
| Type | Triggered by | Context injected | Cached? |
|---|---|---|---|
| General transit interp | First load of transit detail | Transit event data only | Yes — once per transit |
| Personalized transit analysis | Transit detail load (birth data present) | Natal chart: sign, house, aspects | No — per user |
| Natal chart summary | You page load | Full natal chart | Per user, cacheable |
| Natal planet interpretation | Natal planet detail load | Full natal chart (all planets + aspects) | Per user per planet |
| Journal AI chat | Each message in journal entry | Entry text + context header + summarized journal history | No |

### Cost notes
Single user: ~$1–3/month at typical usage. At 100 users, recoverable at $5–10/month
subscription. Caching general transit interpretations is the primary cost lever.

---

## Ephemeris / astronomical data

Use **Astronomy Engine** (JS) for all planet position calculations:
```
npm install astronomy-engine
```

Key functions needed:
- `Astronomy.GeoVector()` — planet positions relative to Earth
- `Astronomy.EclipticLongitude()` — zodiac sign calculation
- `Astronomy.Seasons()` — equinox/solstice data
- House calculation: Placidus implemented manually in lib/natal.ts using corrected
  Meeus formulae. Do not replace — it has been verified accurate against Astro-Seek.
  Upper houses (H11/H12): (RA − RAMC) = frac × DSA
  Lower houses (H2/H3): (RAIC − RA) = frac × NSA, frac=1/3 → H3, frac=2/3 → H2

For the solar system visualization: calculate real-time planet positions and render
as a top-down ecliptic view. Planets should reflect actual current positions, not
decorative placement.

---

## Supabase schema (to build)

```
users
  id, email, created_at

birth_data
  user_id, birth_date, birth_time, birth_city, latitude, longitude, time_known

natal_chart (cached calculations)
  user_id, planet, sign, house, degree, aspects (jsonb), generated_at

journal_entries
  id, user_id, created_at, updated_at, body_text, context_type (transit|natal|freeform),
  context_id (nullable), context_data (jsonb)

transit_interpretations (cache)
  transit_id, general_interpretation, generated_at

user_transit_analyses (per-user cache)
  user_id, transit_id, personalized_analysis, generated_at
```

---

## File structure (Next.js App Router)

```
app/
  page.tsx                    ← Feed (home)
  feed/
    page.tsx
  transit/
    [id]/page.tsx             ← Transit detail
  you/
    page.tsx                  ← Natal chart profile
    [planet]/page.tsx         ← Natal planet detail
  journal/
    page.tsx                  ← Journal list
    new/page.tsx              ← New freeform entry
    [id]/page.tsx             ← Entry view/edit
  settings/
    page.tsx

components/
  cosmic/
    SolarSystem.tsx           ← Canvas, real planet positions, built and working
    Planet.tsx
  cards/
    TransitCard.tsx           ← Built and working
    TransitDetail.tsx         ← Built and working
    NatalCard.tsx             ← Built and working
  journal/
    EntryEditor.tsx           ← To build
    AIChat.tsx                ← To build
    ContextHeader.tsx         ← To build
  ui/
    GlassPanel.tsx            ← Built and working — base card component
    CTAButton.tsx             ← Built and working
    StatusDot.tsx             ← Built and working
    BottomNav.tsx             ← Built and working
    BirthDataCard.tsx         ← Built and working — shared across Feed + You

lib/
  astronomy.ts                ← Astronomy Engine wrappers
  anthropic.ts                ← AI query functions
  supabase.ts                 ← DB client + queries
```

---

## Current build status

### Completed
- **Project scaffold** — Next.js 14, Tailwind, Astronomy Engine, Supabase client
  installed. Full folder structure per spec.
- **GlassPanel.tsx** — base card component with exact card anatomy values.
- **SolarSystem.tsx** — Canvas-based, real planet positions from Astronomy Engine,
  top-down ecliptic view, power-law orbital scaling (r^0.45), Sun glow, Saturn rings,
  orbital rings, star field, 90s drift animation, `focusedPlanet` prop highlights
  active planet with gold ring.
- **Feed page** — full-bleed SolarSystem background, glass transit cards overlaid on
  left panel (desktop) / bottom scroll (mobile), status dots, serif italic themes,
  real transit data.
- **Transit detail** — morphs from feed card in place (480ms ease-in-out), shows
  event info + general interpretation + Reflect CTA. Planet focus animation on
  background. "Back to feed" ghost button. No page navigation — same surface expands.
- **You page** — Big 3 summary (Sun/Moon/Rising), planet cards grid Sun–Pluto,
  natal planet detail with Reflect CTA, same layout pattern as Feed.
- **Natal chart calculations** (`lib/natal.ts`) — accurate Placidus house cusps
  derived from corrected Meeus formulae (verified against Astro-Seek). Geocentric
  ecliptic longitudes for all planets. Retrograde detection. Dynamic — works for
  any birth data, not hardcoded.
- **BirthDataCard.tsx** — shared component used on both Feed and You pages.
  Four states: empty → edit → filled → edit with existing data. Nominatim geocoding
  with autocomplete dropdown (debounced 400ms). Masked text inputs for date (MM/DD/YYYY)
  and time (HH:MM + AM/PM toggle). Timezone derived from coordinates by longitude.
  Stores to localStorage under `astro-journal-birth-data`. Emits `birth-data-updated`
  event on save. Both pages re-render chart dynamically on that event.

### localStorage schema (live)
```json
{
  "birthDate": "1997-06-28",
  "birthTime": "19:00",
  "birthTimeKnown": true,
  "birthCity": "Bellflower, Los Angeles County",
  "latitude": 33.8817,
  "longitude": -118.1270,
  "timezone": "America/Los_Angeles"
}
```

### Not yet built
- Journal (next)
- Account creation gate / auth
- Supabase integration (currently using localStorage)
- AI interpretation layer (Anthropic API calls)
- Settings page
- Birth data migration from localStorage to Supabase on account creation

---

## Where to continue

Journal is next. Build in this order:
1. Journal list page — reverse chronological entries, FAB for freeform entry
2. Freeform entry — blank editor, date set to today, AI chat within entry
3. Context entry — spawned from transit/natal detail, carries context header
4. Delete with confirmation — reverts Reflect CTA on originating page

Do not build auth yet. Use localStorage for journal entries for now,
same pattern as birth data. Supabase migration comes with auth.

---

## Naming

App is currently named "Astro Journal" as a placeholder. Final name not decided.
Do not hardcode "Astro Journal" anywhere — use a config variable:
```
// lib/config.ts
export const APP_NAME = "Astro Journal" // update when name is decided
```

---

## Transit feed — scoring and filter logic

All feature names below are working titles pending a branding/marketing pass.

### Feed window
30 days forward from today. No historical transits in the feed.

### Scoring model (`lib/transitFilter.ts`)

Every transit gets a numeric score. Score determines visibility tier.

```
importance =
  + planet weight
  + aspect weight
  + orb weight
  + natal relevance bonus    // requires birth data
  + angular house bonus      // requires birth data
  + special event override   // bypasses score threshold entirely
```

**Planet weights:**
```
Saturn, Uranus, Neptune, Pluto  → 5
Jupiter, Chiron                 → 4
Mars, Venus                     → 3
Mercury, Sun                    → 2
Moon                            → 1  (phase events handled separately — see below)
```

**Aspect weights:**
```
Conjunction, Opposition, Square → 4
Trine, Sextile                  → 2
```

**Orb weights:**
```
0–1°  → 3
1–3°  → 2
3–6°  → 1
>6°   → 0
```

**Natal relevance bonus (requires birth data):**
```
Aspect to natal Sun, Moon, ASC, MC          → +5
Aspect to natal Saturn, Venus, Mars         → +3
Aspect to natal Mercury, Jupiter            → +2
Aspect to natal Uranus, Neptune, Pluto      → +1
```

**Angular house bonus (transit falls in 1st, 4th, 7th, 10th):**
```
→ +2
```

**Display thresholds:**
```
Score ≥ 14  → "Major" tier   (prominent card, gold status dot)
Score 8–13  → "Active" tier  (standard card, amber status dot)
Score < 8   → suppress       (unless special event override)
```

**Special event override — always surface regardless of score:**
```
Retrograde station (any Tier 1–2 planet — start and end)
Solar eclipse
Lunar eclipse
New Moon
Full Moon (all — Harvest, Super, Blood Moon are metadata labels, not separate types)
Planet ingress into new sign (Tier 1–2 planets)
```

Moon phase events (New Moon, Full Moon, eclipses) are surface-level cultural moments
with strong reflective resonance. They are not the same as noisy Moon transits —
treat them as first-class feed events. A lunar eclipse conjunct a natal point boosts
to Major tier regardless of base score.

### Scoring example
```
Saturn square natal Sun (orb 1°):
  Saturn = 5, Square = 4, Orb tight = 3, Natal Sun = 5, no angular house
  Total = 17 → Major tier — SHOW

Moon conjunct Mercury (orb 5°):
  Moon = 1, Conjunction = 4, Orb wide = 0, Natal Mercury = 2
  Total = 7 → below threshold — SUPPRESS

Full Moon (special event override):
  → Always surface regardless of score
```

---

## Aetheric Wisdom (working title — post-MVP feature)

A synthesis card that appears at the top of the feed when specific sky conditions
are met. Not a daily horoscope. A moment of coherence — when the sky is saying
something unified and personal to this user.

### Trigger logic
Aetheric Wisdom generates only when ALL of the following are true:
- 3 or more active transits scoring Major or Active tier are simultaneously in window
- At least one of those transits has personal natal activation (natal relevance bonus > 0)
- No Aetheric Wisdom has been generated in the last 7 days for this user

The AI reads across all active qualifying transits and natal context, detects thematic
coherence, and generates a synthesis. If the transits don't form a coherent theme,
do not generate — better to show nothing than a forced reading.

### Expiry logic
The card's lifespan is tied to the transit that triggered it:
- Expires when the highest-scoring triggering transit exits its orb window
- New Wisdom replaces the old when a new trigger condition is met
- If the user has not reflected before expiry, the card is gone — "lost to the aether"
- Edge case: if trigger conditions shift before the user sees a generated card,
  regenerate against the new conditions rather than showing stale content

### Card anatomy
```
AETHERIC WISDOM                         ← label: small caps, gold (#C8A96E)
[Subheading — thematic title]           ← EB Garamond, larger, primary text
Returns to the aether in Xd Xh         ← expiry: secondary text, literal countdown

[Body — the synthesis, written as a
 "love letter from the universe."
 EB Garamond italic, gold — same
 treatment as interpretive text
 elsewhere in the system.]

[Triggering transits metadata]          ← e.g. "Saturn stations direct · Moon conjunct natal Sun · eclipse season"
                                           small caps, tertiary text — gives astrological grounding,
                                           shows this is earned by real conditions not generated arbitrarily

[Reflect CTA]                           ← same gold primary CTA pattern; consider alternate label
                                           e.g. "Receive it" or "Begin" — mechanics identical,
                                           tone distinct from standard "Reflect"
```

### Journal integration
Tapping the Reflect CTA on Aetheric Wisdom follows the universal pattern:
- Account gate if unauthenticated ("Save your reflection")
- Opens a new journal entry if authenticated
- The full Aetheric Wisdom card (body + triggering transits metadata) is saved as
  the context header at the top of the entry — same pattern as transit and natal
  context headers
- Reflect CTA swaps to "View your reflection" once entry exists
- If entry is deleted, Reflect CTA reverts — but the Aetheric Wisdom card itself
  may have expired by then; handle gracefully

### Feed behavior
- Only one Aetheric Wisdom card is pinned to the feed at a time
- It sits at the top of the feed, above transit cards
- New Wisdom replaces old when trigger conditions are met
- If no Wisdom is active, feed starts directly with transit cards — no empty state needed

### AI query for generation
```
Context injected: full natal chart, all active qualifying transits with scores,
                  summarized journal history (same as journal AI chat)
Cached: No — per user, generated on trigger
Prompt tone: synthesis across simultaneous themes, written with warmth and precision.
             Not predictive. Not prescriptive. Reflective.
```

### What not to build yet (Aetheric Wisdom — post-MVP)
- Do not build Aetheric Wisdom for MVP
- Add to post-MVP backlog alongside push notifications and depth signal
- The data architecture (journal history, natal chart, transit scoring) will be
  in place by the time this is built — no structural changes needed

---

## What not to build (MVP scope — do not include)

- Push notifications
- Aetheric Wisdom (feed synthesis card — spec written above, build post-MVP)
- Progressive depth signal on You page
- Natal interpretation updates over time
- Journal filtering
- Synastry or multi-user chart comparisons
- Social features
- Native mobile app
- House system preference (Placidus default, settings option post-MVP)
- Detach transit context from journal entry
