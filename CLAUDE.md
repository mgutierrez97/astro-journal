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
- **"Reflect" is the settled label for the primary CTA — not a placeholder.**
- **"Journal" is the settled name for the journal tab — not a placeholder.**
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

Note: account creation is required to journal. Birth data is not strictly required
to create an account, but is required for personalized interpretation. A user without
birth data will see the general (cached) interpretation. The postcard captures
whichever interpretation was rendered at the moment Reflect was tapped.

---

## Core screens — build in this order

### 1. Feed (start here)
- Full-bleed cosmic background: top-down solar system view rendered with real planet
  positions from Astronomy Engine. Slow parallax drift animation. This is the hero
  experience — not decoration.
- Left panel (desktop) / overlay cards (mobile): scrollable list of upcoming transit cards
- Each card: timing indicator, peak date, title, house (if birth data present), description
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
- Context entries spawned from transit/natal pages carry a postcard (see below)
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
- Consult the voice skill's metaphor system table when naming any new feature or CTA.

### Card description copy (current status)
All copy in `lib/transitCopy.ts` is functional placeholder — written in the correct
register but not yet through a full voice pass. A rewrite pass is planned when the
AI interpretation layer is built. Do not treat current copy as canonical voice examples.

---

## Journal — entry types and postcard concept

### Entry types (MVP)
The journal supports four entry types. Each type has a short blurb shown in the
creation flow — the name alone does not need to carry full meaning for newer users.

| Type | Label | Notes |
|---|---|---|
| Plain / blank | **Freeform** | FAB-initiated, blank editor, date set to today |
| Transit-linked | **Transit** | Spawned from transit detail via Reflect CTA |
| Natal-linked | **Natal** | Spawned from natal planet detail via Reflect CTA |
| Tarot spread | **Spread** | Post-MVP. Do not build for MVP. |

### Postcard concept (Transit and Natal entries)
When a user taps Reflect on a transit or natal detail, a postcard is created and
attached to the new journal entry. The postcard is:

- A frozen snapshot of the context at the exact moment Reflect was tapped
- Read-only — it does not update after creation
- Displayed inline at the top of the entry, above the writing area
- Not a tap target — it is context, not navigation back to the detail panel

**Postcard contents:**
- Planet(s) involved
- Transit or natal planet name
- Peak date (transit) or birth placement data (natal)
- The interpretation text the user saw — general or personalized, whichever
  was rendered at the moment of capture. Frozen. Not regenerated.

**Postcard in the data layer:**
The `context_data` (jsonb) field in `journal_entries` must store enough to
reconstruct the postcard in full — do not store only a transit ID reference.
The postcard's interpretation text is also available as context for the
journal AI chat within that entry.

**The postcard mental model:**
The sky sent you something. You're writing back. The postcard is what arrived.

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
| Journal AI chat | Each message in journal entry | Entry text + postcard context + summarized journal history | No |

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
  id, user_id, created_at, updated_at, body_text,
  entry_type (freeform|transit|natal|spread),
  context_id (nullable), context_data (jsonb)
  -- context_data must store full postcard reconstruction data, not just a reference ID

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
    TransitCard.tsx           ← Built and working — see transit card spec below
    TransitDetail.tsx         ← Built and working
    NatalCard.tsx             ← Built and working
  journal/
    EntryEditor.tsx           ← To build
    AIChat.tsx                ← To build
    Postcard.tsx              ← To build — renders frozen context header on transit/natal entries
  ui/
    GlassPanel.tsx            ← Built and working — base card component
    CTAButton.tsx             ← Built and working
    StatusDot.tsx             ← Built and working (used in TransitCard timing indicator)
    BottomNav.tsx             ← Built and working
    BirthDataCard.tsx         ← Built and working — shared across Feed + You

lib/
  astronomy.ts                ← Astronomy Engine wrappers
  anthropic.ts                ← AI query functions
  natal.ts                    ← Placidus house calculations (verified, do not replace)
  transitGenerator.ts         ← Real ephemeris transit detection (built, stable)
  transitFilter.ts            ← Scoring and visibility logic (built, stable)
  transitCopy.ts              ← Card description lookup (built — see spec below)
  timingIndicator.ts          ← Shared timing indicator utility (built — extracted from TransitCard)
  supabase.ts                 ← DB client + queries
  config.ts                   ← APP_NAME and other constants
```

---

## Transit card anatomy (current, locked)

Cards display in this order top to bottom:

```
Row 1:  [timing indicator]          [Peak Mar 18]
Row 2:  Saturn opposite natal Mars
Row 3:  House 3                     ← only if birth data present
Row 4:  Drive meets resistance. Frustration that demands disciplined effort.
```

### Timing indicator logic (shared — lib/timingIndicator.ts)
- 0 days (today):  green dot (#3EB489) + "Today"
- 1 day:           amber dot (#C9933A) + "Tomorrow"
- 2–14 days:       amber dot (#C9933A) + "In X days"
- 15+ days:        no dot + "In X weeks" (floor division, minimum "In 2 weeks")

This logic is used in both TransitCard.tsx and TransitDetail.tsx, imported from
the shared utility. Do not reimplement locally.

### What is NOT on the card
- Tier/status label (ACTIVE, MAJOR, APPROACHING) — scoring is feed infrastructure,
  never surfaced in UI
- Three-word keyword tags — removed
- Event type badge (NEW MOON, OPPOSITION, etc.) — self-evident from title

### Scoring system (feed infrastructure only — not displayed)
The scoring model in `lib/transitFilter.ts` determines what makes the feed.
Tiers exist in code but are not shown to users:
- Score ≥ 14 → Major (green dot era — now just affects feed inclusion)
- Score 12–13 → Active
- Score < 12 → suppressed unless special event override

Special event override (always surfaced regardless of score):
Retrograde stations, solar/lunar eclipses, New Moons, Full Moons, sign ingresses
(Tier 1–2 planets)

---

## lib/transitCopy.ts — card description spec

Pure lookup, no API calls. Exported function:
```
getTransitDescription(event: TransitEventLike, houseNumber?: number): string | null
```
Returns null if event type unrecognized or sign unknown — card omits row gracefully.

### House domain labels (single word)
```
1=self, 2=worth, 3=communication, 4=home, 5=creativity, 6=routines,
7=relationships, 8=transformation, 9=expansion, 10=vocation, 11=community, 12=solitude
```

### Sign themes (single word)
```
Aries=initiation, Taurus=stability, Gemini=curiosity, Cancer=nurturing,
Leo=visibility, Virgo=discernment, Libra=balance, Scorpio=depth,
Sagittarius=vision, Capricorn=discipline, Aquarius=detachment, Pisces=dissolution
```

### Planetary pair descriptions (natal hits)
Pre-written prose keyed by "planet_aspect_natalplanet". Both orderings stored for
sky-to-sky pairs. Natal pairs use PAIR_DESCRIPTIONS table; sky-to-sky use
SKY_PAIR_DESCRIPTIONS table. Key natal pairs:

```
saturn_opposition_mars → "Drive meets resistance. Frustration that demands disciplined effort."
saturn_square_mars     → "Blocked momentum. Effort without immediate reward — patience as practice."
saturn_conjunction_sun → "Identity meets structure. A reckoning with who you're becoming under pressure."
pluto_conjunction_sun  → "Identity in transformation. Something old about who you are is ending."
neptune_opposition_mars → "Motivation under fog. Direction may feel elusive or spiritually redirected."
pluto_conjunction_uranus → "Disruption meets transformation. The structures you rebelled against are dissolving."
sun_conjunction_neptune → "Clarity dissolves. Intuition rises where certainty once stood."
... (full table in lib/transitCopy.ts)
```

Fallback for natal pairs not in table:
"[Planet] [aspect] your natal [NatalPlanet] — [sign theme] activates this placement."

Sky-to-sky pairs not in table → return null (no description shown).

### Template-driven events
```
New Moon (with house):    "A threshold for new intentions in [domain]. [Theme] shapes what wants to begin."
New Moon (no house):      "A threshold for new intentions. [Theme] shapes what wants to begin."
Full Moon (with house):   "Culmination or release in [domain]. What [theme] has been building reaches its peak."
Full Moon (no house):     "Culmination or release. What [theme] has been building reaches its peak."
Solar Eclipse (with):     "Accelerated reset in [domain]. Eclipse pressure amplifies what [theme] is asking of you."
Lunar Eclipse (with):     "Deep completion in [domain]. What you've outgrown in [theme] is ready to release."
Retrograde begins (with): "[Planet] turns inward in [domain]. Review what [theme] has been trying to tell you."
Retrograde direct (with): "[Planet] moves forward again in [domain]. Integrate what surfaced around [theme]."
Ingress (with house):     "[Planet] enters [sign] in [domain]. [Theme] becomes the tone of this domain."
Ingress (no house):       "[Planet] enters [sign]. [Theme] becomes the tone ahead."
Sky-to-sky aspect:        Use SKY_PAIR_DESCRIPTIONS lookup. Null if not found.
```

### Description style
System sans, 12px, Text/2 (#8B909C). Not italic, not gold.
This is functional placeholder copy — written in the right register but not yet
through a full voice pass. Rewrite planned when the AI interpretation layer is built.

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
  left panel (desktop) / bottom scroll (mobile), timing indicators, descriptions,
  real transit data.
- **Transit detail panel** — fully rebuilt. Morphs from feed card in place (480ms
  ease-in-out). Anatomy: timing indicator, title, house (if birth data), hook line,
  BODIES section with body blurbs, ASPECT or CYCLE section (mutually exclusive),
  PASSAGE calendar strip, INTERPRETATION section (placeholder copy), REFLECT CTA.
  All static lookup tables implemented in `lib/transitDetail.ts`. Voice audit passed.
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
- **Transit generator** (`lib/transitGenerator.ts`) — fully built and wired into feed.
  Real ephemeris data via Astronomy Engine. Two-pass detection: daily scan finds
  candidate windows, hourly refinement finds exact peak. Detects: sky-to-sky aspects,
  retrograde stations, sign ingresses, Moon phases + eclipses. Natal transit detection:
  outer/social planets only, hard aspects only, orb ≤ 3°. Lunar event types expanded:
  Blood Moon, Super Moon, Blue Moon, Harvest Moon (September/October only, nearest
  delta logic), Super Blue Blood Moon. Precedence: most specific wins.
- **Transit filter** (`lib/transitFilter.ts`) — calibrated and stable. Explicit
  transitType checks for all event types — no title-string heuristics. See scoring
  model section above.
- **TransitCard.tsx** — rebuilt with new anatomy: timing indicator, peak date top-right,
  title, house below title, description row. Tier/status labels removed entirely.
  Lunar phase events now calculate and display house from Moon/Sun ecliptic longitude
  at peak time using lib/natal.ts.
- **lib/transitCopy.ts** — card description lookup. Pre-written planetary pair copy,
  template-driven lunar/station/ingress copy, sky-to-sky pair lookup. No API calls.
  Returns null gracefully for unknown event types.
- **lib/transitDetail.ts** — static lookup tables for transit detail panel. Three
  exported functions: `getBodyBlurb()`, `getAspectBlurb()`, `getCycleBlurb()`. All
  keyed case-insensitively. Alias pattern used for transitType variants (e.g.
  `stationretrograde` → retrograde blurb). Returns null gracefully for unknown keys.
- **lib/timingIndicator.ts** — shared utility. Exports `timingIndicator()`,
  `daysUntilPeak()`, constants and interface. Used by TransitCard.tsx and
  TransitDetail.tsx. Logic: today=green/Today, 1 day=amber/Tomorrow,
  2-14=amber/In X days, 15+=no dot/In X weeks.

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
- You page — refinement pass (next)
- Journal
- Account creation gate / auth
- Supabase integration (currently using localStorage)
- AI interpretation layer (Anthropic API calls) — intentionally last; do not build
  until auth and schema are stable. The INTERPRETATION section in TransitDetail.tsx
  currently renders placeholder copy. Do not replace with static hand-written copy —
  the combination space (bodies × aspect × sign × house) is too large. AI generation
  is the only correct approach.
- Settings page
- Birth data migration from localStorage to Supabase on account creation
- Planet icon glyphs in BODIES section — currently placeholder circles
- Hook line visual differentiation from body blurbs — minor, design pass later

---

## Where to continue

**Next: You page refinement pass.**

Transit detail panel is complete. Begin a new chat session for the You page.

### Transit detail panel anatomy (complete, locked)
Working top to bottom:

```
[Timing indicator]               ← shared lib/timingIndicator.ts — done
[Transit title]                  ← EB Garamond display
[House] (if birth data)          ← secondary text below title
[Card description / hook]        ← one line, data layer register

BODIES                           ← section label (locked)
[Body icon] Body name            ← one-clause domain blurb per body
[Body icon] Body name

ASPECT                           ← section label (locked) — aspect events only
[Icon] Aspect type               ← one-clause blurb (what this aspect does)
                                    Hidden for lunar/solar cycle events — replaced by CYCLE

CYCLE                            ← section label (locked) — lunar/solar events only
[Icon] Cycle type                ← one-clause blurb (what this cycle moment means)
                                    Hidden for aspect events — replaced by ASPECT

PASSAGE                          ← section label (locked)
[Calendar strip]                 ← visual, peak date highlighted, orb window shown
Peak date · energy field note    ← replaces raw orb/duration data rows

INTERPRETATION                   ← section label (locked)
[1–2 paragraphs, meaning layer]  ← EB Garamond italic gold
                                    mirror register — the reading the user reflects on
                                    MVP: cached general interp
                                    Post-MVP: personalized AI reading with natal + journal context

[REFLECT]                        ← primary gold CTA
```

Sign and house are NOT separate sections — sign is implicit in interpretation,
house appears in subtitle only.

ASPECT and CYCLE are mutually exclusive — the panel shows one or the other
depending on event type, never both. All blurbs and lookup tables are static,
no AI calls required.

### Body blurbs (locked copy — do not alter)

One clause per body. Rendered in the BODIES section of the transit detail panel.
Data layer register — system sans, not italic, not gold.

```
SUN          → "Where your sense of self takes form. The light you move toward and the one you cast."
MOON         → "Where the body keeps its memory. Instinct, pattern, the self that surfaces before thought."
MERCURY      → "Where perception finds its voice. The particular way you receive the world and give it back."
VENUS        → "Where desire knows its shape. What you are drawn toward, and what draws itself to you."
MARS         → "Where drive lives in the body. The shape of your assertion, and how you meet resistance."
JUPITER      → "Where expansion finds its invitation. The direction life keeps asking you to grow toward."
SATURN       → "Where structure makes its demands. The slow, exacting work of becoming who you are."
URANUS       → "Where the expected loses its hold. The fault line where something truer breaks through."
NEPTUNE      → "Where edges soften and dissolve. Longing, imagination, and what the visible world conceals."
PLUTO        → "Where transformation applies its pressure. What must be released for what is essential to remain."
CHIRON       → "Where the wound becomes the teacher. The place of greatest tenderness and deepest capacity."
NORTH NODE   → "Where this life is asking you to arrive. The direction that feels unfamiliar and necessary."
SOUTH NODE   → "Where you already know the way. What comes without effort — and what may be ready to loosen."
```

Implement as a static lookup keyed by body name. Return null gracefully for any
body not in the table — panel omits the blurb row rather than showing a fallback.

### Aspect blurbs (locked copy — do not alter)

One entry per aspect type. Rendered in the ASPECT section for non-lunar/solar events.
Data layer register — system sans, not italic, not gold.

```
CONJUNCTION  → "Two forces occupying the same point. Their themes become inseparable. Amplified, fused. You cannot address one without meeting the other."
OPPOSITION   → "Two forces across an axis, each made visible by the other. What one holds, the other challenges. The tension asks for integration. Not resolution."
SQUARE       → "Two forces at friction. Neither yields easily. The pressure is generative. Something is being forged here, if you're willing to work it."
TRINE        → "Two forces in natural harmony. What flows between them moves without resistance. An invitation that asks only to be received."
RETROGRADE   → "A planet turning its gaze inward. What it governs slows, reconsiders, asks to be revisited. Less a reversal than a deepening."
DIRECT       → "A planet resuming its forward motion. What was held in review begins to move again. What surfaced is ready to be integrated."
INGRESS      → "A planet crossing a threshold. The tone of what it governs shifts. Subtly at first. Then undeniably."
```

### Cycle blurbs (locked copy — do not alter)

One entry per lunar/solar event type. Rendered in the CYCLE section.
Data layer register — system sans, not italic, not gold.

These are distinct event types — do not collapse Blood Moon into Lunar Eclipse
or Super Moon into Full Moon. Each surfaces with its own title and blurb.

```
NEW MOON          → "The cycle returns to darkness. What wants to begin here has not yet taken form. The quietest moment carries the most potential."
FULL MOON         → "What was seeded has reached its fullness. Something becomes visible now that could not be seen before. A peak. A release. Often both."
SUPER MOON        → "A Full Moon closer to Earth than usual. What it illuminates feels nearer too. The emotional pull is amplified. Hard to look away."
BLUE MOON         → "A second Full Moon within the same month. Something that doesn't usually get a second look. An invitation to finish what the first one started."
HARVEST MOON      → "The Full Moon that rises nearest the autumn equinox. Light that lingers past dark. What has been cultivated through the year is ready to be gathered."
BLOOD MOON        → "A total lunar eclipse. The Moon moves through Earth's shadow and emerges changed. Something completing now carries real weight. What you've been carrying may be ready to set down."
LUNAR ECLIPSE     → "A Full Moon held under pressure. The shadow reveals what ordinary light conceals. What is ending now has been ending for some time."
SOLAR ECLIPSE     → "A New Moon with force behind it. The reset arriving now is not subtle. Something is clearing so that something truer can take root."
SUPER BLUE BLOOD MOON → "Three cycles converging at once. Rare, and not accidental. Whatever this moment is asking of you, it has been patient."
```

Detection logic for cycle event types (update transitGenerator.ts):
- Blood Moon = total lunar eclipse (umbral magnitude ≥ 1.0)
- Super Moon = Full or New Moon when lunar distance < ~362,000 km
- Blue Moon = second Full Moon in a calendar month
- Harvest Moon = Full Moon with peak date closest to autumn equinox
  (use Astronomy.Seasons() for equinox date)
- Super Blue Blood Moon = all three conditions coinciding
- Precedence when multiple labels apply: most specific wins
  (Blood Moon > Lunar Eclipse; Super Blue Blood Moon > all)

### After transit detail
Build journal in this order:
1. Journal list page — reverse chronological entries, FAB for freeform entry
2. Freeform entry — blank editor, date set to today, AI chat within entry
3. Transit/Natal entry — postcard at top, writing area below, AI chat
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

Every transit gets a numeric score. Score determines feed inclusion.
Scores are never shown to the user — they are feed infrastructure only.

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
Trine                           → 2
Sextile                         → suppressed (not detected for sky-to-sky)
```

**Sky-to-sky orb:** 3° (tighter than natal — reduces noise from fast-moving planets)

**Natal transit orb:** 3° (hard aspects only — conjunction, opposition, square)

**Orb weights (scoring):**
```
0–1°  → 3
1–3°  → 2
3–6°  → 1
>6°   → 0
```

**Natal relevance bonus — outer/social planets only:**
```
Applies only when transiting planet is: Jupiter, Mars, Saturn, Uranus, Neptune, Pluto
Sun, Moon, Mercury, Venus transiting natal points → no bonus (suppressed)

Aspect to natal Sun, Moon, ASC, MC          → +5
Aspect to natal Saturn, Venus, Mars         → +3
Aspect to natal Mercury, Jupiter            → +2
Aspect to natal Uranus, Neptune, Pluto      → +1
```

**Display thresholds:**
```
Score ≥ 14  → "Major" tier   (feed infrastructure label only — not shown in UI)
Score 12–13 → "Active" tier  (feed infrastructure label only — not shown in UI)
Score < 12  → suppress       (unless special event override)
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

Moon phase events are first-class feed events with strong reflective resonance.
A lunar eclipse conjunct a natal point boosts to Major tier regardless of base score.

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
                                           small caps, tertiary text

[Reflect CTA]                           ← gold primary CTA; consider alternate label
                                           e.g. "Receive it" or "Begin"
```

### What not to build yet (Aetheric Wisdom — post-MVP)
- Do not build Aetheric Wisdom for MVP
- Add to post-MVP backlog alongside push notifications and depth signal
- The data architecture will be in place by the time this is built

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
- Tarot spread entry type (spec the entry_type enum to include it, but do not build UI)
