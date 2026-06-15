import type { StationMatch, StationResolution } from './stations.js'

export type StationField = 'origin' | 'destination' | 'via'

export interface ClarificationGroup {
  id: string
  label: string
  options: Array<{
    label: string
    value: string
    crs: string | null
  }>
}

export interface ChatStreamEvent {
  text?: string
  options?: ClarificationGroup[]
  summary?: import('./journey-summary.js').JourneySummary
}

const FIELD_LABELS: Record<StationField, string> = {
  origin: 'Origin',
  destination: 'Destination',
  via: 'Via',
}

function createId(): string {
  return crypto.randomUUID()
}

function fieldLabel(field: unknown): string {
  if (typeof field === 'string' && field in FIELD_LABELS) {
    return FIELD_LABELS[field as StationField]
  }
  return 'Station'
}

function toOptions(matches: StationMatch[]) {
  return matches.slice(0, 2).map((match) => ({
    label: match.name,
    value: match.name,
    crs: match.crs,
  }))
}

export function collectClarifications(
  toolName: string,
  args: Record<string, unknown>,
  result: unknown,
): ClarificationGroup | null {
  if (toolName !== 'lookup_station') return null

  const resolution = result as StationResolution
  if (resolution.status === 'resolved') return null

  const matches =
    resolution.status === 'ambiguous' || resolution.status === 'not_found'
      ? resolution.matches
      : []

  if (matches.length === 0) return null

  return {
    id: createId(),
    label: fieldLabel(args.field),
    options: toOptions(matches),
  }
}

export function mergeClarifications(
  existing: ClarificationGroup[],
  incoming: ClarificationGroup[],
): ClarificationGroup[] {
  const merged = [...existing]

  for (const group of incoming) {
    const duplicate = merged.find(
      (item) =>
        item.label === group.label &&
        item.options.length === group.options.length &&
        item.options.every(
          (option, index) => option.value === group.options[index]?.value,
        ),
    )

    if (!duplicate) {
      merged.push(group)
    }
  }

  return merged
}
