import type { JourneySummary } from './journey-summary.js'
import { normalizeRailcardCode } from './railcards.js'
import { resolveStation } from './stations.js'

export function enrichJourneySummary(
  summary: JourneySummary,
): JourneySummary | null {
  const origin = resolveStation(summary.origin)
  const destination = resolveStation(summary.destination)

  if (origin.status !== 'resolved' || destination.status !== 'resolved') {
    return null
  }

  if (!origin.station.crs || !destination.station.crs) {
    return null
  }

  if (!summary.outboundDateTime) {
    return null
  }

  if (summary.journeyType === 'return' && !summary.inboundDateTime) {
    return null
  }

  return {
    ...summary,
    originCrs: origin.station.crs,
    destinationCrs: destination.station.crs,
    railcardCodes: summary.railcards?.map(normalizeRailcardCode),
  }
}
