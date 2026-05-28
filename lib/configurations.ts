// ─── Types ────────────────────────────────────────────────────────────────────

export type AspectType =
  | 'conjunction'
  | 'opposition'
  | 'square'
  | 'trine'
  | 'sextile'
  | 'quincunx'

export type ConfigurationType =
  | 'stellium'
  | 'tSquare'
  | 'grandCross'
  | 'grandTrine'
  | 'kite'
  | 'yod'
  | 'mysticRectangle'

export interface ChartConfiguration {
  type:         ConfigurationType
  planets:      string[]      // planet names involved
  focalPlanet?: string        // for T-square and yod — the apex planet
  label:        string        // human-readable label e.g. "T-Square", "Grand Trine"
}

export interface PlanetPoint {
  name:   string
  degree: number              // ecliptic degree 0–360
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export const CONFIG_LABELS: Record<ConfigurationType, string> = {
  stellium:        'Stellium',
  tSquare:         'T-Square',
  grandCross:      'Grand Cross',
  grandTrine:      'Grand Trine',
  kite:            'Kite',
  yod:             'Yod',
  mysticRectangle: 'Mystic Rectangle',
}

// ─── Angle helper ─────────────────────────────────────────────────────────────

function angleBetween(a: number, b: number): number {
  let diff = Math.abs(a - b)
  if (diff > 180) diff = 360 - diff
  return diff
}

// ─── Aspect detection ─────────────────────────────────────────────────────────

const ORBS: Record<AspectType, number> = {
  conjunction: 6,
  opposition:  5,
  square:      5,
  trine:       4,
  sextile:     3,
  quincunx:    2,
}

const ASPECT_TARGETS: Record<AspectType, number> = {
  conjunction: 0,
  opposition:  180,
  square:      90,
  trine:       120,
  sextile:     60,
  quincunx:    150,
}

function isAspect(a: number, b: number, type: AspectType): boolean {
  const angle = angleBetween(a, b)
  return Math.abs(angle - ASPECT_TARGETS[type]) <= ORBS[type]
}

// ─── Deduplication key ────────────────────────────────────────────────────────

function canonicalKey(names: string[]): string {
  return [...names].sort().join(',')
}

// ─── Stellium ─────────────────────────────────────────────────────────────────
// 3+ planets in the same zodiac sign (30° band) OR the same house.
// Sign-based and house-based stelliums with identical planet sets are deduplicated.

function detectStelliums(
  planets:      PlanetPoint[],
  planetHouses?: Record<string, number>,
): ChartConfiguration[] {
  const results: ChartConfiguration[] = []
  const seen = new Set<string>()

  // Sign-based: group by 30° band
  const bySign: Record<number, PlanetPoint[]> = {}
  for (const p of planets) {
    const sign = Math.floor(p.degree / 30)
    if (!bySign[sign]) bySign[sign] = []
    bySign[sign].push(p)
  }
  for (const group of Object.values(bySign)) {
    if (group.length >= 3) {
      const names = group.map((p) => p.name)
      const ck    = canonicalKey(names)
      if (!seen.has(ck)) {
        seen.add(ck)
        results.push({ type: 'stellium', planets: names, label: CONFIG_LABELS.stellium })
      }
    }
  }

  // House-based: group by house number (only when house data is provided)
  if (planetHouses) {
    const byHouse: Record<number, PlanetPoint[]> = {}
    for (const p of planets) {
      const house = planetHouses[p.name]
      if (house === undefined) continue
      if (!byHouse[house]) byHouse[house] = []
      byHouse[house].push(p)
    }
    for (const group of Object.values(byHouse)) {
      if (group.length >= 3) {
        const names = group.map((p) => p.name)
        const ck    = canonicalKey(names)
        if (!seen.has(ck)) {
          seen.add(ck)
          results.push({ type: 'stellium', planets: names, label: CONFIG_LABELS.stellium })
        }
      }
    }
  }

  return results
}

// ─── T-Square ─────────────────────────────────────────────────────────────────
// Two planets in opposition + a third planet squaring both.
// The third planet is the focal / apex.

function detectTSquares(planets: PlanetPoint[]): ChartConfiguration[] {
  const results: ChartConfiguration[] = []
  const seen    = new Set<string>()
  const n       = planets.length

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (!isAspect(planets[i].degree, planets[j].degree, 'opposition')) continue
      for (let k = 0; k < n; k++) {
        if (k === i || k === j) continue
        if (
          isAspect(planets[k].degree, planets[i].degree, 'square') &&
          isAspect(planets[k].degree, planets[j].degree, 'square')
        ) {
          const ck = canonicalKey([planets[i].name, planets[j].name, planets[k].name])
          if (seen.has(ck)) continue
          seen.add(ck)
          results.push({
            type:        'tSquare',
            planets:     [planets[i].name, planets[j].name, planets[k].name],
            focalPlanet: planets[k].name,
            label:       CONFIG_LABELS.tSquare,
          })
        }
      }
    }
  }
  return results
}

// ─── Grand Cross ──────────────────────────────────────────────────────────────
// Two T-squares that share the same opposition axis, whose focal planets
// are also in opposition to each other.

function detectGrandCrosses(
  planets:  PlanetPoint[],
  tSquares: ChartConfiguration[],
): ChartConfiguration[] {
  const results: ChartConfiguration[] = []
  const seen    = new Set<string>()
  const nt      = tSquares.length

  for (let i = 0; i < nt; i++) {
    for (let j = i + 1; j < nt; j++) {
      const tsA = tSquares[i]
      const tsB = tSquares[j]

      // Opposition pair = the two non-focal planets of each T-square
      const oppA = tsA.planets.filter((p) => p !== tsA.focalPlanet).sort().join(',')
      const oppB = tsB.planets.filter((p) => p !== tsB.focalPlanet).sort().join(',')
      if (oppA !== oppB) continue

      // Focal planets must be in opposition
      const fA = planets.find((p) => p.name === tsA.focalPlanet)
      const fB = planets.find((p) => p.name === tsB.focalPlanet)
      if (!fA || !fB) continue
      if (!isAspect(fA.degree, fB.degree, 'opposition')) continue

      const allNames = Array.from(new Set([...tsA.planets, ...tsB.planets]))
      const ck = canonicalKey(allNames)
      if (seen.has(ck)) continue
      seen.add(ck)

      results.push({
        type:    'grandCross',
        planets: allNames,
        label:   CONFIG_LABELS.grandCross,
      })
    }
  }
  return results
}

// ─── Grand Trine ──────────────────────────────────────────────────────────────
// Three planets each in trine to the other two.

function detectGrandTrines(planets: PlanetPoint[]): ChartConfiguration[] {
  const results: ChartConfiguration[] = []
  const seen    = new Set<string>()
  const n       = planets.length

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (!isAspect(planets[i].degree, planets[j].degree, 'trine')) continue
      for (let k = j + 1; k < n; k++) {
        if (
          isAspect(planets[k].degree, planets[i].degree, 'trine') &&
          isAspect(planets[k].degree, planets[j].degree, 'trine')
        ) {
          const ck = canonicalKey([planets[i].name, planets[j].name, planets[k].name])
          if (seen.has(ck)) continue
          seen.add(ck)
          results.push({
            type:    'grandTrine',
            planets: [planets[i].name, planets[j].name, planets[k].name],
            label:   CONFIG_LABELS.grandTrine,
          })
        }
      }
    }
  }
  return results
}

// ─── Kite ─────────────────────────────────────────────────────────────────────
// A grand trine + a fourth planet opposing one of the three trine planets.
// The fourth (opposing) planet is appended last.

function detectKites(
  planets:     PlanetPoint[],
  grandTrines: ChartConfiguration[],
): ChartConfiguration[] {
  const results: ChartConfiguration[] = []
  const seen    = new Set<string>()

  for (const gt of grandTrines) {
    for (const outer of planets) {
      if (gt.planets.includes(outer.name)) continue
      for (const triName of gt.planets) {
        const triPlanet = planets.find((p) => p.name === triName)
        if (!triPlanet) continue
        if (!isAspect(outer.degree, triPlanet.degree, 'opposition')) continue

        const allNames = [...gt.planets, outer.name]
        const ck = canonicalKey(allNames)
        if (seen.has(ck)) continue
        seen.add(ck)
        results.push({
          type:    'kite',
          planets: allNames,
          label:   CONFIG_LABELS.kite,
        })
        break // one kite per outer planet per grand trine
      }
    }
  }
  return results
}

// ─── Yod ──────────────────────────────────────────────────────────────────────
// Two planets in sextile + a third planet forming a quincunx (150°) to both.
// The quincunx apex is the focal planet.

function detectYods(planets: PlanetPoint[]): ChartConfiguration[] {
  const results: ChartConfiguration[] = []
  const seen    = new Set<string>()
  const n       = planets.length

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (!isAspect(planets[i].degree, planets[j].degree, 'sextile')) continue
      for (let k = 0; k < n; k++) {
        if (k === i || k === j) continue
        if (
          isAspect(planets[k].degree, planets[i].degree, 'quincunx') &&
          isAspect(planets[k].degree, planets[j].degree, 'quincunx')
        ) {
          const ck = canonicalKey([planets[i].name, planets[j].name, planets[k].name])
          if (seen.has(ck)) continue
          seen.add(ck)
          results.push({
            type:        'yod',
            planets:     [planets[i].name, planets[j].name, planets[k].name],
            focalPlanet: planets[k].name,
            label:       CONFIG_LABELS.yod,
          })
        }
      }
    }
  }
  return results
}

// ─── Mystic Rectangle ─────────────────────────────────────────────────────────
// Four planets forming exactly 2 oppositions, 2 trines, and 2 sextiles
// among all six pairings.

function detectMysticRectangles(planets: PlanetPoint[]): ChartConfiguration[] {
  const results: ChartConfiguration[] = []
  const seen    = new Set<string>()
  const n       = planets.length

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        for (let l = k + 1; l < n; l++) {
          const ps = [planets[i], planets[j], planets[k], planets[l]]
          let oppositions = 0, trines = 0, sextiles = 0
          for (let a = 0; a < 4; a++) {
            for (let b = a + 1; b < 4; b++) {
              if      (isAspect(ps[a].degree, ps[b].degree, 'opposition')) oppositions++
              else if (isAspect(ps[a].degree, ps[b].degree, 'trine'))      trines++
              else if (isAspect(ps[a].degree, ps[b].degree, 'sextile'))    sextiles++
            }
          }
          if (oppositions === 2 && trines === 2 && sextiles === 2) {
            const names = ps.map((p) => p.name)
            const ck    = canonicalKey(names)
            if (seen.has(ck)) continue
            seen.add(ck)
            results.push({
              type:    'mysticRectangle',
              planets: names,
              label:   CONFIG_LABELS.mysticRectangle,
            })
          }
        }
      }
    }
  }
  return results
}

// ─── Significance sort order ──────────────────────────────────────────────────

const SIGNIFICANCE_ORDER: ConfigurationType[] = [
  'grandCross', 'tSquare', 'yod', 'kite', 'grandTrine', 'stellium', 'mysticRectangle',
]

// ─── Main export ──────────────────────────────────────────────────────────────

const EXCLUDED_FROM_CONFIGURATIONS = ['Chiron', 'Lilith', 'Ascendant', 'Midheaven']

export function detectConfigurations(
  planets:      PlanetPoint[],
  planetHouses?: Record<string, number>,  // planet name → house number
): ChartConfiguration[] {
  const filtered     = planets.filter(p => !EXCLUDED_FROM_CONFIGURATIONS.includes(p.name))
  const stelliums    = detectStelliums(filtered, planetHouses)
  const tSquares     = detectTSquares(filtered)
  const grandCrosses = detectGrandCrosses(filtered, tSquares)
  const grandTrines  = detectGrandTrines(filtered)
  const kites        = detectKites(filtered, grandTrines)
  const yods         = detectYods(filtered)
  const mysticRects  = detectMysticRectangles(filtered)

  const all = [
    ...stelliums,
    ...tSquares,
    ...grandCrosses,
    ...grandTrines,
    ...kites,
    ...yods,
    ...mysticRects,
  ]

  // Deduplicate — same type + same planet set
  const seen    = new Set<string>()
  const deduped = all.filter((c) => {
    const ck = `${c.type}:${canonicalKey(c.planets)}`
    if (seen.has(ck)) return false
    seen.add(ck)
    return true
  })

  // Sort by significance
  return deduped.sort(
    (a, b) => SIGNIFICANCE_ORDER.indexOf(a.type) - SIGNIFICANCE_ORDER.indexOf(b.type),
  )
}
