import {
  searchStations,
  stationSearch,
  type SearchResult,
} from 'fuzzy-stations'

const RAIL_TYPES = ['rail'] as const

const AUTO_RESOLVE_MIN_SCORE = 0.9
const AUTO_RESOLVE_SCORE_GAP = 0.05
const AMBIGUOUS_MATCH_LIMIT = 2

export interface StationMatch {
  name: string
  crs: string | null
  nlc: string | null
  score: number
  matchField: SearchResult['matchField']
}

export type StationResolution =
  | { status: 'resolved'; query: string; station: StationMatch }
  | { status: 'ambiguous'; query: string; matches: StationMatch[] }
  | { status: 'not_found'; query: string; matches: StationMatch[] }

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ')
}

function toMatch(result: SearchResult): StationMatch {
  return {
    name: result.station.name,
    crs: result.station.crs,
    nlc: result.station.nlc,
    score: result.score,
    matchField: result.matchField,
  }
}

function uniqueByCrs(matches: StationMatch[]): StationMatch[] {
  const seen = new Set<string>()
  return matches.filter((match) => {
    const key = match.crs ?? match.name.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function isExactNameMatch(query: string, stationName: string): boolean {
  return normalizeQuery(query) === stationName.toLowerCase()
}

function resolveByCrs(query: string): StationMatch | null {
  const crs = query.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(crs)) return null

  const station = stationSearch.findByCrs(crs)
  if (!station) return null

  return {
    name: station.name,
    crs: station.crs,
    nlc: station.nlc,
    score: 1,
    matchField: 'crs',
  }
}

function findExactNameMatches(
  query: string,
  matches: StationMatch[],
): StationMatch[] {
  return matches.filter((match) => isExactNameMatch(query, match.name))
}

function isConfidentMatch(top: StationMatch, second: StationMatch | undefined): boolean {
  if (top.score < AUTO_RESOLVE_MIN_SCORE) return false
  if (!second) return true
  return top.score - second.score >= AUTO_RESOLVE_SCORE_GAP
}

export function searchStationMatches(
  query: string,
  limit = 10,
  minScore = 0.35,
): StationMatch[] {
  const trimmed = query.trim()
  if (!trimmed) return []

  return uniqueByCrs(
    searchStations(trimmed, {
      limit,
      minScore,
      types: [...RAIL_TYPES],
      includeNonStations: false,
    }).map(toMatch),
  )
}

export function resolveStation(query: string): StationResolution {
  const trimmed = query.trim()
  if (!trimmed) {
    return { status: 'not_found', query: trimmed, matches: [] }
  }

  const crsMatch = resolveByCrs(trimmed)
  if (crsMatch) {
    return { status: 'resolved', query: trimmed, station: crsMatch }
  }

  const matches = searchStationMatches(trimmed, 5)
  if (matches.length === 0) {
    return { status: 'not_found', query: trimmed, matches: [] }
  }

  const exactNameMatches = findExactNameMatches(trimmed, matches)
  if (exactNameMatches.length === 1) {
    return {
      status: 'resolved',
      query: trimmed,
      station: exactNameMatches[0]!,
    }
  }

  if (exactNameMatches.length > 1) {
    return {
      status: 'ambiguous',
      query: trimmed,
      matches: exactNameMatches.slice(0, AMBIGUOUS_MATCH_LIMIT),
    }
  }

  const top = matches[0]!
  const second = matches[1]

  if (top.matchField === 'crs' && top.score >= AUTO_RESOLVE_MIN_SCORE) {
    return { status: 'resolved', query: trimmed, station: top }
  }

  if (isConfidentMatch(top, second)) {
    return { status: 'resolved', query: trimmed, station: top }
  }

  return {
    status: 'ambiguous',
    query: trimmed,
    matches: matches.slice(0, AMBIGUOUS_MATCH_LIMIT),
  }
}

export function getStationCount(): number {
  return stationSearch.size
}
