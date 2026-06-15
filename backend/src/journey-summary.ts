export type JourneyType = 'single' | 'return'

export interface JourneySummary {
  origin: string
  destination: string
  originCrs?: string
  destinationCrs?: string
  journeyType: JourneyType
  /** ISO 8601 local datetime for results handoff, e.g. 2026-07-21T12:35 */
  outboundDateTime?: string
  /** ISO 8601 local datetime for return leg */
  inboundDateTime?: string
  /** Human-readable labels for the summary card */
  outboundDate: string
  outboundTime: string
  inboundDate?: string
  inboundTime?: string
  adults: number
  children?: number
  /** Display labels from the agent (e.g. "Network Railcard") */
  railcards?: string[]
  /** Official codes for journeys-grid handoff (e.g. "NEW") */
  railcardCodes?: string[]
  via?: string
}

function parseIsoDateTime(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const trimmed = value.trim()
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) return undefined
  return trimmed.slice(0, 16)
}

export function parseJourneySummary(
  args: Record<string, unknown>,
): JourneySummary | null {
  const origin = typeof args.origin === 'string' ? args.origin.trim() : ''
  const destination =
    typeof args.destination === 'string' ? args.destination.trim() : ''
  const journeyType = args.journeyType === 'return' ? 'return' : 'single'
  const outboundDate =
    typeof args.outboundDate === 'string' ? args.outboundDate.trim() : ''
  const outboundTime =
    typeof args.outboundTime === 'string' ? args.outboundTime.trim() : ''
  const outboundDateTime = parseIsoDateTime(args.outboundDateTime)
  const inboundDateTime = parseIsoDateTime(args.inboundDateTime)
  const adults = typeof args.adults === 'number' ? args.adults : 1

  if (!origin || !destination || !outboundDate || !outboundTime) {
    return null
  }

  if (!outboundDateTime) {
    return null
  }

  if (journeyType === 'return') {
    const inboundDate =
      typeof args.inboundDate === 'string' ? args.inboundDate.trim() : ''
    if (!inboundDate || !inboundDateTime) return null
  }

  const summary: JourneySummary = {
    origin,
    destination,
    journeyType,
    outboundDate,
    outboundTime,
    outboundDateTime,
    adults,
  }

  if (inboundDateTime) {
    summary.inboundDateTime = inboundDateTime
  }

  if (typeof args.inboundDate === 'string' && args.inboundDate.trim()) {
    summary.inboundDate = args.inboundDate.trim()
  }

  if (typeof args.inboundTime === 'string' && args.inboundTime.trim()) {
    summary.inboundTime = args.inboundTime.trim()
  }

  if (typeof args.children === 'number' && args.children > 0) {
    summary.children = args.children
  }

  if (Array.isArray(args.railcards)) {
    const railcards = args.railcards.filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0,
    )
    if (railcards.length > 0) summary.railcards = railcards
  }

  if (typeof args.via === 'string' && args.via.trim()) {
    summary.via = args.via.trim()
  }

  return summary
}

export function formatPassengers(summary: JourneySummary): string {
  const parts: string[] = []
  parts.push(`${summary.adults} adult${summary.adults === 1 ? '' : 's'}`)
  if (summary.children && summary.children > 0) {
    parts.push(`${summary.children} child${summary.children === 1 ? '' : 'ren'}`)
  }
  return parts.join(', ')
}
