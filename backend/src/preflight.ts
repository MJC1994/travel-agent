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
  /^(?:I(?:'m|\s+am)?|going|travel(?:l?ing)?|head(?:ing)?|get(?:ting)?|we(?:'re|\s+are)?|want|need|help|sorry|please|actually|can i|could i|change|update|amend|\d+)/i

const DATE_OR_TIME_PHRASE =
  /\b(?:last|first|next|this)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|weekend|month|january|february|march|april|may|june|july|august|september|october|november|december|\d)/i

const AMENDMENT_HINT =
  /\b(?:change|update|amend|switch|instead|actually|sorry|correct|wrong|meant)\b/i

interface ParsedRoute {
  from?: string
  to?: string
}

interface ConfirmedStations {
  origin?: string
  destination?: string
  via?: string
}

function cleanStationPhrase(value: string): string {
  return value
    .replace(/\b(next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|weekend|month|year)\b/gi, '')
    .replace(/\b(today|tomorrow|single|return|morning|afternoon|evening|tonight|now)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isPlausibleStationQuery(query: string): boolean {
  const trimmed = cleanStationPhrase(query)
  if (trimmed.length < 2) return false
  if (UNLIKELY_STATION_QUERY.test(trimmed)) return false
  if (DATE_OR_TIME_PHRASE.test(trimmed)) return false
  return true
}

function isConfirmationMessage(content: string): boolean {
  return /(?:^|[.\s])(Origin|Destination|Via):/i.test(content)
}

function isAmendmentMessage(content: string): boolean {
  if (isConfirmationMessage(content)) return false
  if (ROUTE_FROM_TO.test(content)) return false

  const route = extractRoute(content)
  if (
    route.from &&
    route.to &&
    isPlausibleStationQuery(route.from) &&
    isPlausibleStationQuery(route.to)
  ) {
    return false
  }

  return AMENDMENT_HINT.test(content)
}

function extractRoute(text: string): ParsedRoute {
  const fromTo = text.match(ROUTE_FROM_TO)
  if (fromTo?.groups?.from && fromTo.groups.to) {
    const from = cleanStationPhrase(fromTo.groups.from)
    const to = cleanStationPhrase(fromTo.groups.to)
    if (isPlausibleStationQuery(from) && isPlausibleStationQuery(to)) {
      return { from, to }
    }
  }

  const destinationOnly = text.match(ROUTE_DESTINATION_ONLY)
  if (destinationOnly?.groups?.to) {
    const to = cleanStationPhrase(destinationOnly.groups.to)
    if (isPlausibleStationQuery(to)) {
      return { to }
    }
  }

  const simple = text.match(ROUTE_SIMPLE)
  if (simple?.groups?.from && simple.groups.to) {
    const from = cleanStationPhrase(simple.groups.from)
    const to = cleanStationPhrase(simple.groups.to)
    if (isPlausibleStationQuery(from) && isPlausibleStationQuery(to)) {
      return { from, to }
    }
  }

  return {}
}

function extractEstablishedStations(messages: ChatMessage[]): ConfirmedStations {
  const established: ConfirmedStations = {}

  for (const message of messages) {
    if (message.role !== 'user') continue

    for (const match of message.content.matchAll(FIELD_SEGMENT)) {
      const field = match.groups?.field?.toLowerCase() as StationField | undefined
      const value = match.groups?.value?.trim()
      if (field && value) {
        established[field] = value
      }
    }

    if (isConfirmationMessage(message.content)) continue

    const route = extractRoute(message.content)
    if (route.from && isPlausibleStationQuery(route.from)) {
      const resolution = resolveStation(route.from)
      if (resolution.status === 'resolved') {
        established.origin = resolution.station.name
      }
    }
    if (route.to && isPlausibleStationQuery(route.to)) {
      const resolution = resolveStation(route.to)
      if (resolution.status === 'resolved') {
        established.destination = resolution.station.name
      }
    }
  }

  return established
}

function latestRouteMessage(messages: ChatMessage[]): ChatMessage | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message?.role !== 'user') continue
    if (isConfirmationMessage(message.content)) continue
    if (isAmendmentMessage(message.content)) continue

    const route = extractRoute(message.content)
    if (route.from || route.to) {
      return message
    }
  }
  return undefined
}

function latestUserMessage(messages: ChatMessage[]): ChatMessage | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message?.role === 'user') return message
  }
  return undefined
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

export function runPreflight(messages: ChatMessage[]): PreflightResult {
  let clarificationGroups: ClarificationGroup[] = []
  const resolvedLines: string[] = []
  let missingOrigin = false
  const established = extractEstablishedStations(messages)
  const latestUser = latestUserMessage(messages)
  const isAmendment =
    latestUser !== undefined && isAmendmentMessage(latestUser.content)

  for (const field of ['origin', 'destination', 'via'] as const) {
    const value = established[field]
    if (value) {
      resolvedLines.push(`${field}: ${value} (established in conversation)`)
    }
  }

  const needsOrigin = !established.origin
  const needsDestination = !established.destination
  const needsVia = !established.via

  if (
    isAmendment &&
    established.origin &&
    established.destination &&
    !needsVia
  ) {
    return {
      promptContext: formatPromptContext(resolvedLines, { amendment: true }),
      clarificationGroups: [],
    }
  }

  if (!needsOrigin && !needsDestination && !needsVia) {
    return {
      promptContext: formatPromptContext(resolvedLines, { amendment: isAmendment }),
      clarificationGroups: [],
    }
  }

  const journeyMessage = latestRouteMessage(messages)
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
      } else if (!established.origin) {
        missingOrigin = true
      }
    }

    if (needsDestination && route.to && isPlausibleStationQuery(route.to)) {
      clarificationGroups = addStationLookup(
        route.to,
        'destination',
        clarificationGroups,
        resolvedLines,
      )
    }
  } else if (needsOrigin) {
    missingOrigin = true
  }

  return {
    promptContext: formatPromptContext(resolvedLines, {
      missingOrigin,
      amendment: isAmendment,
    }),
    clarificationGroups,
  }
}

function formatPromptContext(
  resolvedLines: string[],
  options: { missingOrigin?: boolean; amendment?: boolean } = {},
): string {
  if (resolvedLines.length === 0 && !options.missingOrigin && !options.amendment) {
    return ''
  }

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

  if (options.amendment && hasOrigin && hasDestination) {
    context +=
      '\n\n## Journey amendment\n- The user is updating an existing journey. Keep the established origin and destination unless they explicitly change stations. Update date, time, passengers, or railcards as requested, then call present_journey_summary with the full revised journey.'
  } else if (hasOrigin && hasDestination) {
    context +=
      '\n\nOrigin and destination are confirmed. If the user has not given an outbound time yet, ask for travel time now. Reference any date they already mentioned in the conversation.'
  }

  return context
}

export function trimMessages(messages: ChatMessage[], maxMessages = 12): ChatMessage[] {
  if (messages.length <= maxMessages) return messages
  return messages.slice(-maxMessages)
}
