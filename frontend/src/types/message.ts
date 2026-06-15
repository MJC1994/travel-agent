export type MessageRole = 'agent' | 'user'

export type JourneyType = 'single' | 'return'

export interface JourneySummary {
  origin: string
  destination: string
  originCrs?: string
  destinationCrs?: string
  journeyType: JourneyType
  /** ISO local datetime for results handoff, e.g. 2026-07-21T12:35 */
  outboundDateTime?: string
  inboundDateTime?: string
  outboundDate: string
  outboundTime: string
  inboundDate?: string
  inboundTime?: string
  adults: number
  children?: number
  railcards?: string[]
  railcardCodes?: string[]
  via?: string
}

export interface StationOption {
  label: string
  value: string
  crs: string | null
}

export interface ClarificationGroup {
  id: string
  label: string
  options: StationOption[]
}

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  clarificationGroups?: ClarificationGroup[]
  journeySummary?: JourneySummary
}

export function formatPassengers(summary: JourneySummary): string {
  const parts: string[] = []
  parts.push(`${summary.adults} adult${summary.adults === 1 ? '' : 's'}`)
  if (summary.children && summary.children > 0) {
    parts.push(`${summary.children} child${summary.children === 1 ? '' : 'ren'}`)
  }
  return parts.join(', ')
}
