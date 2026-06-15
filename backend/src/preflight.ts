import { collectClarifications, mergeClarifications, type ClarificationGroup } from './clarifications.js'
import { resolveStation } from './stations.js'
import type { ChatMessage } from './types.js'

export interface PreflightResult {
  promptContext: string
  clarificationGroups: ClarificationGroup[]
}

type StationField = 'origin' | 'destination' | 'via'

const FIELD_SEGMENT =
  /(?:^|[.\s]+)(?<field>Origin|Destination|Via):\s*(?<value>[^.;]+)/gi

const ROUTE_FROM_TO =
  /\bfrom\s+(?<from>.+?)\s+to\s+(?<to>.+?)(?:\s+(?:on|at|next|this|today|tomorrow|single|return|with|for|using|depart|leaving|in the)|[,.]|$)/i

const ROUTE_DESTINATION_ONLY =
  /\b(?:going|travel(?:l?ing)?|head(?:ing)?|get(?:ting)?)\s+to\s+(?<to>.+?)(?:\s+(?:on|at|next|this|today|tomorrow|single|return|with|for|using|depart|leaving|in the)|[,.]|$)/i

const ROUTE_SIMPLE =
  /^(?<from>.+?)\s+to\s+(?<to>.+?)(?:\s+(?:on|at|next|this|today|tomorrow|single|return|with|for|using|depart|leaving|in the)|[,.]|$)/i

const UNLIKELY_STATION_QUERY =
  /^(?:I(?:'m|\s+am)?|going|travel(?:l?ing)?|head(?:ing)?|get(?:ting)?|we(?:'re|\s+are)?|want|need|help|\d+)/i

interface ParsedRoute {
  from?: string
  to?: string
}

function isPlausibleStationQuery(query: string): boolean {
  const trimmed = cleanStationPhrase(query)
  if (trimmed.length < 2) return false
  if (UNLIKELY_STATION_QUERY.test(trimmed)) return false
  return true
}

function cleanStationPhrase(value: string): string {
  return value
    .replace(/\b(next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|weekend|month|year)\b/gi, '')
    .replace(/\b(today|tomorrow|single|return|morning|afternoon|evening|tonight|now)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractConfirmedStations(messages: ChatMessage[]): ConfirmedStations {
  const confirmed: ConfirmedStations = {}

  for (const message of messages) {
    if (message.role !== 'user') continue

    for (const match of message.content.matchAll(FIELD_SEGMENT)) {
      const field = match.groups?.field?.toLowerCase() as StationField | undefined
      const value = match.groups?.value?.trim()
      if (field && value) {
        confirmed[field] = value
      }
    }
  }

  return confirmed
}

function isConfirmationMessage(content: string): boolean {
  return /(?:^|[.\s])(Origin|Destination|Via):/i.test(content)
}

function extractRoute(text: string): ParsedRoute {
  const fromTo = text.match(ROUTE_FROM_TO)
  if (fromTo?.groups?.from && fromTo.groups.to) {
    return {
      from: cleanStationPhrase(fromTo.groups.from),
      to: cleanStationPhrase(fromTo.groups.to),
    }
  }

  const destinationOnly = text.match(ROUTE_DESTINATION_ONLY)
  if (destinationOnly?.groups?.to) {
    return {
      to: cleanStationPhrase(destinationOnly.groups.to),
    }
  }

  const simple = text.match(ROUTE_SIMPLE)
  if (simple?.groups?.from && simple.groups.to) {
    const from = cleanStationPhrase(simple.groups.from)
    if (isPlausibleStationQuery(from)) {
      return {
        from,
        to: cleanStationPhrase(simple.groups.to),
      }
    }
  }

  return {}
}

interface ConfirmedStations {
  origin?: string
  destination?: string
  via?: string
}

function addStationLookup(
  query: string,
  field: StationField,
  groups: ClarificationGroup[],
  resolvedLines: string[],
): ClarificationGroup[] {
  const trimmed = cleanStationPhrase(query)
  if (!trimmed || !isPlausibleStationQuery(trimmed)) return groups

  const resolution = resolveStation(trimmed)
  if (resolution.status === 'resolved') {
    resolvedLines.push(
      `${field}: ${resolution.station.name} (pre-resolved from "${trimmed}")`,
    )
    return groups
  }

  const clarification = collectClarifications(
    'lookup_station',
    { query: trimmed, field },
    resolution,
  )

  if (clarification) {
    return mergeClarifications(groups, [clarification])
  }

  return groups
}

function latestJourneyMessage(messages: ChatMessage[]): ChatMessage | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message?.role !== 'user') continue
    if (isConfirmationMessage(message.content)) continue
    if (extractRoute(message.content).from || extractRoute(message.content).to) {
      return message
    }
  }
  return undefined
}

export function runPreflight(messages: ChatMessage[]): PreflightResult {
  let clarificationGroups: ClarificationGroup[] = []
  const resolvedLines: string[] = []
  let missingOrigin = false
  const confirmed = extractConfirmedStations(messages)

  for (const field of ['origin', 'destination', 'via'] as const) {
    const value = confirmed[field]
    if (value) {
      resolvedLines.push(`${field}: ${value} (confirmed by user)`)
    }
  }

  const needsOrigin = !confirmed.origin
  const needsDestination = !confirmed.destination
  const needsVia = !confirmed.via

  if (!needsOrigin && !needsDestination && !needsVia) {
    return {
      promptContext: formatPromptContext(resolvedLines),
      clarificationGroups: [],
    }
  }

  const journeyMessage = latestJourneyMessage(messages)
  if (journeyMessage) {
    const route = extractRoute(journeyMessage.content)

    if (needsOrigin) {
      if (route.from && isPlausibleStationQuery(route.from)) {
        clarificationGroups = addStationLookup(
          route.from,
          'origin',
          clarificationGroups,
          resolvedLines,
        )
      } else if (!confirmed.origin) {
        missingOrigin = true
      }
    }

    if (needsDestination && route.to) {
      clarificationGroups = addStationLookup(
        route.to,
        'destination',
        clarificationGroups,
        resolvedLines,
      )
    }
  }

  return {
    promptContext: formatPromptContext(resolvedLines, { missingOrigin }),
    clarificationGroups,
  }
}

function formatPromptContext(
  resolvedLines: string[],
  options: { missingOrigin?: boolean } = {},
): string {
  if (resolvedLines.length === 0 && !options.missingOrigin) return ''

  let context = ''

  if (resolvedLines.length > 0) {
    context = `\n\n## Pre-resolved stations (trust these — do not call lookup_station for them)\n${resolvedLines.map((line) => `- ${line}`).join('\n')}`
  }

  if (options.missingOrigin) {
    context +=
      '\n\n## Missing information\n- The user has not provided an origin station. Ask where they are travelling from. Do not guess an origin or show origin station options.'
  }

  const hasOrigin = resolvedLines.some((line) => line.startsWith('origin:'))
  const hasDestination = resolvedLines.some((line) =>
    line.startsWith('destination:'),
  )

  if (hasOrigin && hasDestination) {
    context +=
      '\n\nOrigin and destination are confirmed. If the user has not given an outbound time yet, ask for travel time now. Reference any date they already mentioned in the conversation.'
  }

  return context
}

export function trimMessages(messages: ChatMessage[], maxMessages = 12): ChatMessage[] {
  if (messages.length <= maxMessages) return messages
  return messages.slice(-maxMessages)
}
