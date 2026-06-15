import type { JourneySummary } from '../types/message'

const DEFAULT_BASE =
  import.meta.env.VITE_JOURNEYS_BASE_URL ?? 'https://southeastern.stage.otrl.io'

function formatPathDateTime(iso: string): string {
  return iso.trim().slice(0, 16)
}

function formatRailcardSegment(railcards?: string[]): string {
  if (!railcards?.length) return ''
  return railcards.map((code) => `${code}x1`).join(',')
}

export function canBuildJourneyResultsUrl(summary: JourneySummary): boolean {
  if (!summary.originCrs || !summary.destinationCrs || !summary.outboundDateTime) {
    return false
  }
  if (summary.journeyType === 'return' && !summary.inboundDateTime) {
    return false
  }
  return true
}

/** Builds the Southeastern journeys-grid URL from a confirmed journey summary. */
export function buildJourneyResultsUrl(summary: JourneySummary): string | null {
  if (!canBuildJourneyResultsUrl(summary)) {
    return null
  }

  const outbound = formatPathDateTime(summary.outboundDateTime!)
  const inbound =
    summary.journeyType === 'return' && summary.inboundDateTime
      ? formatPathDateTime(summary.inboundDateTime)
      : ''

  const adults = String(summary.adults)
  const children =
    summary.children && summary.children > 0 ? String(summary.children) : ''
  const railcards = formatRailcardSegment(summary.railcardCodes ?? summary.railcards)

  const pathSegments = [
    'journeys-grid',
    summary.originCrs,
    summary.destinationCrs,
    outbound,
    inbound,
    adults,
    children,
    railcards,
  ].join('/')

  const params = new URLSearchParams({
    departNow: 'no',
    realTime: 'no',
    showAdditionalRoutes: 'no',
    showCheapest: 'no',
    tocSpecific: 'no',
  })

  params.set(
    'searchPreferences',
    summary.journeyType === 'return' ? ',,,,true' : '',
  )

  const base = DEFAULT_BASE.replace(/\/$/, '')
  return `${base}/${pathSegments}?${params.toString()}`
}
