import type { ClarificationGroup, JourneyType } from './message'

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

export function formToJourneySummary(
  form: JourneyFormState,
): import('./message').JourneySummary | null {
  if (!form.origin || !form.destination || !form.outboundDateTime) return null
  if (!form.adults || form.adults < 1) return null
  if (form.journeyType === 'return' && !form.inboundDateTime) return null

  return {
    origin: form.origin,
    destination: form.destination,
    originCrs: form.originCrs,
    destinationCrs: form.destinationCrs,
    journeyType: form.journeyType ?? 'single',
    outboundDateTime: form.outboundDateTime,
    inboundDateTime: form.inboundDateTime,
    outboundDate: form.outboundDate ?? form.outboundDateTime.slice(0, 10),
    outboundTime: form.outboundTime ?? form.outboundDateTime.slice(11),
    inboundDate: form.inboundDate,
    inboundTime: form.inboundTime,
    adults: form.adults,
    children: form.children,
    railcards: form.railcards,
    railcardCodes: form.railcardCodes,
    via: form.via,
  }
}

export interface JourneyExtractResponse {
  form: JourneyFormState
  clarificationGroups: ClarificationGroup[]
}
