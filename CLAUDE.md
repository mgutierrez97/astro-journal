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
  pattern across transit detail and house/configuration detail pages. Reverts on entry delete.
- **"Reflect" is the settled label for the primary CTA — not a placeholder.**
- **"Journal" is the settled name for the journal tab — not a placeholder.**
- Birth data: date + time + city. Unknown time defaults to noon. Placidus house system.
- General transit interpretations: cached per event (zero marginal AI cost per user).
- Personal transit analysis: per-user, AI-generated on page load.
- Delete journal entries: MVP scope.
- You page is house-first. No natal planet detail pages — replaced by house cards.
- Configuration cards (Defining Aspects) are first-class on the You page, not post-MVP.
- Aspects and Bodies as dedicated lenses on the You page are post-MVP pending user feedback.
- Post-MVP only: push notifications, depth signal, natal interp updates, journal filtering.

---

## Information architecture

### Ungated (no account required)
- Feed — transit cards, birth data input bar
- Transit detail page — general interpretation, personalized analysis if birth data present
- You page — natal chart, house cards, configuration cards (generic interp if no account)

### Gated (account required, triggered by Reflect CTA)
- Full journal (create, view, manage entries)
- Personalized AI analysis with journal history injected
- You page — full AI house and configuration interpretations

Note: account creation is required to journal. Birth data is not strictly required
to create an account, but is required for personalized interpretation. A user without
birth data will see the empty state prompting birth data entry. The postcard captures
whichever interpretation was rendered at the moment Reflect was tapped.

---

## Core screens

### 1. Feed (built)
- Full-bleed SolarSystem cosmic background, real planet positions from Astronomy Engine
- Left panel (desktop) / bottom scroll (mobile): scrollable transit cards
- Each card: timing indicator, peak date, title, house (if birth data), description
- Tapping a card: expands to transit detail panel (morph animation, not page nav)
- BirthDataCard at top for unauthenticated users

### 2. Transit detail (built)
- Morphs from feed card in place (480ms ease-in-out)
- BODIES, ASPECT/CYCLE, PASSAGE, INTERPRETATION sections
- REFLECT CTA → account gate if unauthed, journal entry if authed

### 3. You page (built — see full spec below)
- House-first organization. 12 house cards, not planet cards.
- No natal planet detail pages in MVP — replaced entirely by house card detail views.
- Configuration cards (Defining Aspects) are first-class alongside the house grid.
- AI interpretation deferred — INTERPRETATION sections show placeholder copy until
  auth and schema are stable.

### 4. Journal (next)
- Reverse chronological list of entries
- FAB for freeform entry
- Context entries spawned from transit/house/configuration detail carry a postcard
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
2. **Secondary (View your reflection):** Neutral outline only.
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
- Consult the voice skill's metaphor system table when naming any new feature or CTA.

### Card description copy (current status)
All copy in `lib/transitCopy.ts` is functional placeholder — written in the correct
register but not yet through a full voice pass. A rewrite pass is planned when the
AI interpretation layer is built. Do not treat current copy as canonical voice examples.

---

## Journal — entry types and postcard concept

### Entry types (MVP)

| Type | Label | Notes |
|---|---|---|
| Plain / blank | **Freeform** | FAB-initiated, blank editor, date set to today |
| Transit-linked | **Transit** | Spawned from transit detail via Reflect CTA |
| House-linked | **Natal** | Spawned from house detail via Reflect CTA |
| Configuration-linked | **Natal** | Spawned from configuration detail via Reflect CTA |
| Tarot spread | **Spread** | Post-MVP. Do not build for MVP. |

### Postcard concept (Transit, House, and Configuration entries)
When a user taps Reflect on a transit, house, or configuration detail, a postcard is
created and attached to the new journal entry. The postcard is:

- A frozen snapshot of the context at the exact moment Reflect was tapped
- Read-only — it does not update after creation
- Displayed inline at the top of the entry, above the writing area
- Not a tap target — it is context, not navigation back to the detail panel

**Postcard contents:**
- For transit entries: planet(s), transit type, peak date, interpretation text shown
- For house entries: house number, domain word, sign ruler, planets present, interpretation text
- For configuration entries: configuration type, planets involved, interpretation text

**Postcard in the data layer:**
The `context_data` (jsonb) field in `journal_entries` must store enough to
reconstruct the postcard in full — do not store only a reference ID.
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
| House interpretation | House card expanded | Full natal chart + house data | Per user per house, cache permanently |
| Configuration interpretation | Configuration card expanded | Full natal chart + configuration planets | Per user per configuration, cache permanently |
| Journal AI chat | Each message in journal entry | Entry text + postcard context + summarized journal history | No |

### Cost notes
Single user: ~$1–3/month at typical usage. At 100 users, recoverable at $5–10/month
subscription. Caching general transit interpretations is the primary cost lever.
House interpretations never change — cache permanently per user (12 total per user).
Configuration interpretations are also permanent — cache per user per configuration key.

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
  user_id, birth_date, birth_time, birth_city, latitude, longitude, time_known

natal_chart (cached calculations)
  user_id, planet, sign, house, degree, aspects (jsonb), generated_at

journal_entries
  id, user_id, created_at, updated_at, body_text,
  entry_type (freeform|transit|natal|spread),
  context_id (nullable), context_data (jsonb)
  -- context_data stores full postcard reconstruction data, not just a reference ID

transit_interpretations (cache)
  transit_id, general_interpretation, generated_at

user_transit_analyses (per-user cache)
  user_id, transit_id, personalized_analysis, generated_at

user_house_interpretations (permanent cache)
  user_id, house_number, interpretation, generated_at

user_configuration_interpretations (permanent cache)
  user_id, configuration_key, interpretation, generated_at
  -- configuration_key: type + sorted planet names e.g. "tSquare:Moon,Neptune,Venus"
```

---

## File structure (Next.js App Router)

```
app/
  page.tsx                    ← Feed (home)
  you/
    page.tsx                  ← Natal chart profile (built)
  journal/
    page.tsx                  ← Journal list (to build)
    new/page.tsx              ← New freeform entry (to build)
    [id]/page.tsx             ← Entry view/edit (to build)
  settings/
    page.tsx

components/
  cosmic/
    SolarSystem.tsx           ← Canvas, real planet positions, built and working
    NatalWheel.tsx            ← SVG natal chart wheel, built and working
    Planet.tsx
  cards/
    TransitCard.tsx           ← Built and working
    TransitDetail.tsx         ← Built and working
  journal/
    EntryEditor.tsx           ← To build
    AIChat.tsx                ← To build
    Postcard.tsx              ← To build
  ui/
    GlassPanel.tsx            ← Built and working — base card component
    CTAButton.tsx             ← Built and working
    StatusDot.tsx             ← Built and working
    BottomNav.tsx             ← Built and working
    BirthDataCard.tsx         ← Built and working — shared across Feed + You

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
[Sign] rules this house          ← system sans 12px Text/2

──────────────────────────────

SIGN                             ← section label (10px uppercase tracked Text/3)
[Sign name]                      ← system sans 13px Text/1

PLANETS                          ← section label
[symbol + name for each]         ← gold symbol, Text/2 name

INTERPRETATION                   ← section label
The interpretation for this      ← EB Garamond italic 15px #C8A96E
house will appear here.          ← placeholder — AI layer deferred

[REFLECT]                        ← primary gold CTA (CTAButton component)
```

Back button ("← Houses"): ghost style, clears BOTH expandedHouse AND activeHouse.

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

Expanded detail:
```
← Patterns                       ← ghost back button

[Configuration label]            ← EB Garamond 22px Text/1
[Planet list]                    ← system sans 12px Text/2

──────────────────────────────

PLANETS                          ← section label
[symbol + name for each]

PATTERN                          ← section label
[Structural description]         ← e.g. "Two planets in opposition, both squared
                                    by a focal planet." System sans 13px Text/1

INTERPRETATION                   ← section label
The interpretation for this      ← EB Garamond italic 15px #C8A96E
pattern will appear here.        ← placeholder — AI layer deferred

[REFLECT]                        ← primary gold CTA
```

Back button ("← Patterns"): ghost style, clears expandedConfiguration AND
activeConfiguration AND activeHouse.

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
[House] (if birth data)
[Card description / hook]        ← data layer register

BODIES                           ← section label
[Body icon] Body name            ← one-clause domain blurb per body

ASPECT  (or)  CYCLE              ← mutually exclusive
[Icon] Type                      ← one-clause blurb

PASSAGE
[Calendar strip]

INTERPRETATION
[1–2 paragraphs]                 ← EB Garamond italic gold — placeholder for now

[REFLECT]
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
- **Transit detail panel** — complete, voice audit passed
- **BirthDataCard.tsx** — shared, Nominatim geocoding, localStorage persistence
- **Transit generator** (`lib/transitGenerator.ts`) — all event types, stable
- **lib/transitFilter.ts** — calibrated scoring, stable
- **TransitCard.tsx** — correct anatomy
- **lib/transitCopy.ts** — card description lookup
- **lib/transitDetail.ts** — body/aspect/cycle blurb lookups
- **lib/timingIndicator.ts** — shared utility
- **lib/natal.ts** — Placidus house cusps (verified vs Astro-Seek), Sun–Pluto +
  Ascendant, Midheaven, Lilith (mean apogee), Chiron (mean longitude)
- **lib/configurations.ts** — chart configuration detection, verified against
  birth data, all seven configuration types
- **NatalWheel.tsx** — SVG natal chart wheel, three rings, Placidus geometry,
  aspect lines, active/hover states, symbol-only planet rendering
- **You page** (`/app/you/page.tsx`) — complete:
  - Desktop split panel (42% left fixed / 58% right scroll)
  - LIFE'S ARCHITECTURE: 2×6 house card grid, expanded detail with
    SIGN/PLANETS/INTERPRETATION/REFLECT
  - DEFINING ASPECTS: 2-column configuration card grid, expanded detail
  - NatalWheel responds to house/configuration selection and hover
  - Empty state for no birth data
  - Desktop top nav + mobile BottomNav
  - ResizeObserver-driven wheel sizing

### Not yet built
- **House and configuration detail — AI interpretation** — INTERPRETATION sections
  currently show placeholder copy. Deferred until auth and schema are stable.
  Do not replace with static copy — AI generation is the correct approach.
- **Journal** — next in build order (see below)
- **Account creation gate / auth**
- **Supabase integration** — currently using localStorage throughout
- **Settings page**
- **Birth data migration** from localStorage to Supabase on account creation
- **Notable conjunction detection** in Defining Aspects — Moon-Saturn, Sun-Moon,
  Sun-Mars etc. Currently only multi-planet configurations are surfaced. Post-MVP
  consideration, may be pulled into MVP based on product feel.

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

---

## Where to continue

**Next: Journal.**

Build in this order:
1. Journal list page — reverse chronological entries, FAB for freeform entry
2. Freeform entry — blank editor, date set to today, AI chat within entry
3. Transit/House/Configuration entry — postcard at top, writing area below, AI chat
4. Delete with confirmation — reverts Reflect CTA on originating page

Do not build auth yet. Use localStorage for journal entries for now,
same pattern as birth data. Supabase migration comes with auth.

**Post-journal:** Auth + Supabase migration → AI interpretation layer for house
and configuration detail views.

**Design system consolidation pass** — after POC is complete, before design polish.
Claude Code can audit all atoms/components and extract a token map. All raw color,
spacing, and blur values should be pulled into a single tokens file.

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
- Synastry or multi-user chart comparisons
- Social features
- Native mobile app
- House system preference (Placidus only for MVP)
- Detach transit context from journal entry
- Tarot spread entry type (spec the enum, do not build UI)
- Natural language question interface on You page (post-MVP premium)
- Aspects and Bodies lenses on You page (post-MVP, pending user feedback)
- Transit calculator for non-feed transits (post-MVP)
