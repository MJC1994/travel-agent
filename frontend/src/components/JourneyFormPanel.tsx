import { canBuildJourneyResultsUrl } from '../lib/buildJourneyResultsUrl'
import type { ClarificationGroup, StationOption } from '../types/message'
import {
  formToJourneySummary,
  type FieldStatus,
  type JourneyFormState,
} from '../types/journeyForm'
import styles from './JourneyFormPanel.module.css'

interface JourneyFormPanelProps {
  form: JourneyFormState
  clarificationGroups: ClarificationGroup[]
  liveTranscript: string
  isExtracting: boolean
  extractError: string | null
  onSelectStation: (group: ClarificationGroup, option: StationOption) => void
  onFindTrains: () => void
}

function displayValue(value: string | number | undefined, status: FieldStatus): string {
  if (status === 'empty' || value === undefined || value === '') {
    return '—'
  }
  return String(value)
}

function FormField({
  label,
  value,
  status,
}: {
  label: string
  value: string
  status: FieldStatus
}) {
  return (
    <div
      className={`${styles.field} ${status === 'filled' ? styles.fieldFilled : ''} ${status === 'pending' ? styles.fieldPending : ''}`}
    >
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value}</span>
    </div>
  )
}

function InlineStationPick({
  group,
  onSelect,
}: {
  group: ClarificationGroup
  onSelect: (group: ClarificationGroup, option: StationOption) => void
}) {
  return (
    <div className={styles.inlinePick}>
      <p className={styles.inlinePickLabel}>Pick {group.label.toLowerCase()}</p>
      <div className={styles.inlinePickOptions}>
        {group.options.map((option) => (
          <button
            key={`${group.id}-${option.crs ?? option.value}`}
            type="button"
            className={styles.inlinePickButton}
            onClick={() => onSelect(group, option)}
          >
            <span>{option.label}</span>
            {option.crs && <span className={styles.inlinePickCrs}>{option.crs}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

export function JourneyFormPanel({
  form,
  clarificationGroups,
  liveTranscript,
  isExtracting,
  extractError,
  onSelectStation,
  onFindTrains,
}: JourneyFormPanelProps) {
  const summary = formToJourneySummary(form)
  const canSearch = summary !== null && canBuildJourneyResultsUrl(summary)
  const journeyLabel =
    form.journeyType === 'return'
      ? 'Return'
      : form.journeyType === 'single'
        ? 'Single'
        : '—'

  const outboundDisplay =
    form.outboundDate && form.outboundTime
      ? `${form.outboundDate}, ${form.outboundTime}`
      : form.outboundDateTime ?? undefined

  const inboundDisplay =
    form.inboundDate && form.inboundTime
      ? `${form.inboundDate}, ${form.inboundTime}`
      : form.inboundDateTime ?? undefined

  const passengersDisplay =
    form.adultsStatus === 'filled'
      ? [
          `${form.adults} adult${form.adults === 1 ? '' : 's'}`,
          form.children && form.children > 0
            ? `${form.children} child${form.children === 1 ? '' : 'ren'}`
            : null,
        ]
          .filter(Boolean)
          .join(', ')
      : undefined

  const hasJourneyContext =
    form.originStatus === 'filled' ||
    form.destinationStatus === 'filled' ||
    form.adultsStatus === 'filled'

  const railcardsDisplay =
    form.railcards && form.railcards.length > 0
      ? form.railcards.join(', ')
      : hasJourneyContext
        ? 'None'
        : '—'

  const railcardsStatus: FieldStatus =
    form.railcards && form.railcards.length > 0
      ? 'filled'
      : hasJourneyContext
        ? 'filled'
        : 'empty'

  return (
    <section className={styles.panel} aria-label="Journey form">
      <div className={styles.header}>
        <h2 className={styles.title}>Your journey</h2>
        {isExtracting && (
          <span className={styles.updating} role="status">
            Updating…
          </span>
        )}
      </div>

      {liveTranscript && (
        <p className={styles.liveTranscript} role="status">
          {liveTranscript}
        </p>
      )}

      <div className={styles.fields}>
        <FormField
          label="From"
          value={displayValue(form.origin, form.originStatus)}
          status={form.originStatus}
        />
        <FormField
          label="To"
          value={displayValue(form.destination, form.destinationStatus)}
          status={form.destinationStatus}
        />
        <FormField
          label="Journey"
          value={journeyLabel}
          status={form.journeyTypeStatus}
        />
        <FormField
          label="Outbound"
          value={displayValue(outboundDisplay, form.outboundStatus)}
          status={form.outboundStatus}
        />
        {(form.journeyType === 'return' || form.inboundStatus !== 'empty') && (
          <FormField
            label="Return"
            value={displayValue(inboundDisplay, form.inboundStatus)}
            status={form.inboundStatus}
          />
        )}
        <FormField
          label="Passengers"
          value={displayValue(passengersDisplay, form.adultsStatus)}
          status={form.adultsStatus}
        />
        <FormField
          label="Railcard"
          value={railcardsDisplay}
          status={railcardsStatus}
        />
        {form.viaStatus !== 'empty' && (
          <FormField
            label="Via"
            value={displayValue(form.via, form.viaStatus)}
            status={form.viaStatus}
          />
        )}
      </div>

      {clarificationGroups.map((group) => (
        <InlineStationPick
          key={group.id}
          group={group}
          onSelect={onSelectStation}
        />
      ))}

      {extractError && <p className={styles.error}>{extractError}</p>}

      {canSearch && (
        <>
          <button type="button" className={styles.cta} onClick={onFindTrains}>
            Find trains
          </button>
          <p className={styles.amendHint}>
            Just tell me if you need to amend anything here.
          </p>
        </>
      )}
    </section>
  )
}
