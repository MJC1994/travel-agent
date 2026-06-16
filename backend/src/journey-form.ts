import type { ClarificationGroup } from './clarifications.js'
import { collectClarifications } from './clarifications.js'
import { normalizeRailcardCode } from './railcards.js'
import { resolveStation } from './stations.js'
import type { JourneyType } from './journey-summary.js'

export type FieldStatus = 'empty' | 'filled' | 'pending'

export interface JourneyFormState {
  origin?: string
  originCrs?: string
  originStatus: FieldStatus
  destination?: string
  destinationCrs?: string
  destinationStatus: FieldStatus
  journeyType?: JourneyType
  journeyTypeStatus: FieldStatus
  outboundDate?: string
  outboundTime?: string
  outboundDateTime?: string
  outboundStatus: FieldStatus
  inboundDate?: string
  inboundTime?: string
  inboundDateTime?: string
  inboundStatus: FieldStatus
  adults?: number
  adultsStatus: FieldStatus
  children?: number
  childrenStatus: FieldStatus
  railcards?: string[]
  railcardCodes?: string[]
  railcardsStatus: FieldStatus
  via?: string
  viaStatus: FieldStatus
}

export interface JourneyFormExtractPayload {
  origin?: string | null
  destination?: string | null
  journeyType?: JourneyType | null
  outboundDate?: string | null
  outboundTime?: string | null
  outboundDateTime?: string | null
  inboundDate?: string | null
  inboundTime?: string | null
  inboundDateTime?: string | null
  adults?: number | null
  children?: number | null
  railcards?: string[] | null
  via?: string | null
}

export function emptyJourneyFormState(): JourneyFormState {
  return {
    originStatus: 'empty',
    destinationStatus: 'empty',
    journeyTypeStatus: 'empty',
    outboundStatus: 'empty',
    inboundStatus: 'empty',
    adultsStatus: 'empty',
    childrenStatus: 'empty',
    railcardsStatus: 'empty',
    viaStatus: 'empty',
  }
}

function fieldStatus(value: unknown): FieldStatus {
  if (value === null || value === undefined) return 'empty'
  if (typeof value === 'string' && !value.trim()) return 'empty'
  if (typeof value === 'number' && Number.isNaN(value)) return 'empty'
  return 'filled'
}

function parseIsoDateTime(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const trimmed = value.trim()
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) return undefined
  return trimmed.slice(0, 16)
}

function mergeString(
  current: string | undefined,
  incoming: string | null | undefined,
): string | undefined {
  if (incoming === null || incoming === undefined) return current
  const trimmed = incoming.trim()
  return trimmed || current
}

function mergeNumber(
  current: number | undefined,
  incoming: number | null | undefined,
): number | undefined {
  if (incoming === null || incoming === undefined || Number.isNaN(incoming)) {
    return current
  }
  return incoming
}

export function mergeFormExtract(
  current: JourneyFormState,
  extract: JourneyFormExtractPayload,
): JourneyFormState {
  const next: JourneyFormState = { ...current }

  next.origin = mergeString(current.origin, extract.origin)
  next.destination = mergeString(current.destination, extract.destination)
  next.journeyType =
    extract.journeyType === 'return' || extract.journeyType === 'single'
      ? extract.journeyType
      : current.journeyType
  next.outboundDate = mergeString(current.outboundDate, extract.outboundDate)
  next.outboundTime = mergeString(current.outboundTime, extract.outboundTime)
  next.outboundDateTime =
    parseIsoDateTime(extract.outboundDateTime) ?? current.outboundDateTime
  next.inboundDate = mergeString(current.inboundDate, extract.inboundDate)
  next.inboundTime = mergeString(current.inboundTime, extract.inboundTime)
  next.inboundDateTime =
    parseIsoDateTime(extract.inboundDateTime) ?? current.inboundDateTime
  next.adults = mergeNumber(current.adults, extract.adults)
  next.children = mergeNumber(current.children, extract.children)
  next.via = mergeString(current.via, extract.via)

  if (extract.railcards !== null && extract.railcards !== undefined) {
    const railcards = extract.railcards.filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0,
    )
    next.railcards = railcards.length > 0 ? railcards : current.railcards
  }

  next.originStatus = fieldStatus(next.origin)
  next.destinationStatus = fieldStatus(next.destination)
  next.journeyTypeStatus = fieldStatus(next.journeyType)
  next.outboundStatus =
    fieldStatus(next.outboundDateTime) === 'filled' ||
    (fieldStatus(next.outboundDate) === 'filled' &&
      fieldStatus(next.outboundTime) === 'filled')
      ? 'filled'
      : fieldStatus(next.outboundDate) === 'filled' ||
          fieldStatus(next.outboundTime) === 'filled'
        ? 'filled'
        : 'empty'
  next.inboundStatus =
    next.journeyType === 'return'
      ? fieldStatus(next.inboundDateTime) === 'filled' ||
        (fieldStatus(next.inboundDate) === 'filled' &&
          fieldStatus(next.inboundTime) === 'filled')
        ? 'filled'
        : fieldStatus(next.inboundDate) === 'filled' ||
            fieldStatus(next.inboundTime) === 'filled'
          ? 'filled'
          : 'empty'
      : 'empty'
  next.adultsStatus = fieldStatus(next.adults)
  next.childrenStatus = fieldStatus(next.children)
  next.railcardsStatus =
    next.railcards && next.railcards.length > 0 ? 'filled' : 'empty'
  next.viaStatus = fieldStatus(next.via)

  return next
}

function resolveFormStation(
  value: string | undefined,
  field: 'origin' | 'destination',
): Partial<
  Pick<
    JourneyFormState,
    | 'origin'
    | 'originCrs'
    | 'originStatus'
    | 'destination'
    | 'destinationCrs'
    | 'destinationStatus'
  >
> {
  if (!value?.trim()) {
    return field === 'origin'
      ? { originStatus: 'empty' }
      : { destinationStatus: 'empty' }
  }

  const resolution = resolveStation(value)
  if (resolution.status === 'resolved') {
    if (field === 'origin') {
      return {
        origin: resolution.station.name,
        originCrs: resolution.station.crs ?? undefined,
        originStatus: 'filled',
      }
    }
    return {
      destination: resolution.station.name,
      destinationCrs: resolution.station.crs ?? undefined,
      destinationStatus: 'filled',
    }
  }

  if (field === 'origin') {
    return { origin: value, originStatus: 'pending' }
  }
  return { destination: value, destinationStatus: 'pending' }
}

export function enrichJourneyFormState(
  form: JourneyFormState,
): {
  form: JourneyFormState
  clarificationGroups: ClarificationGroup[]
} {
  let next = { ...form }
  const clarificationGroups: ClarificationGroup[] = []

  if (next.origin) {
    const origin = resolveFormStation(next.origin, 'origin')
    next = { ...next, ...origin }
    if (origin.originStatus === 'pending' && next.origin) {
      const clarification = collectClarifications(
        'lookup_station',
        { query: next.origin, field: 'origin' },
        resolveStation(next.origin),
      )
      if (clarification) clarificationGroups.push(clarification)
    }
  }

  if (next.destination) {
    const destination = resolveFormStation(next.destination, 'destination')
    next = { ...next, ...destination }
    if (destination.destinationStatus === 'pending' && next.destination) {
      const clarification = collectClarifications(
        'lookup_station',
        { query: next.destination, field: 'destination' },
        resolveStation(next.destination),
      )
      if (clarification) clarificationGroups.push(clarification)
    }
  }

  if (next.railcards?.length) {
    next.railcardCodes = next.railcards.map(normalizeRailcardCode)
    next.railcardsStatus = 'filled'
  } else {
    next.railcardsStatus = 'empty'
  }

  if (!next.adults && next.adultsStatus === 'empty') {
    // no default until extract says so
  }

  return { form: next, clarificationGroups }
}

export function applyStationSelection(
  form: JourneyFormState,
  field: 'origin' | 'destination',
  stationName: string,
  crs?: string | null,
): JourneyFormState {
  if (field === 'origin') {
    return {
      ...form,
      origin: stationName,
      originCrs: crs ?? undefined,
      originStatus: 'filled',
    }
  }
  return {
    ...form,
    destination: stationName,
    destinationCrs: crs ?? undefined,
    destinationStatus: 'filled',
  }
}

export function isFormReadyForSearch(form: JourneyFormState): boolean {
  if (form.originStatus !== 'filled' || form.destinationStatus !== 'filled') {
    return false
  }
  if (!form.outboundDateTime && form.outboundStatus !== 'filled') return false
  if (!form.adults || form.adults < 1) return false
  if (form.journeyType === 'return') {
    if (!form.inboundDateTime && form.inboundStatus !== 'filled') return false
  }
  return Boolean(form.originCrs && form.destinationCrs && form.outboundDateTime)
}
