import { canBuildJourneyResultsUrl } from '../lib/buildJourneyResultsUrl'
import type { JourneySummary } from '../types/message'
import { formatPassengers } from '../types/message'
import styles from './JourneySummaryCard.module.css'

interface JourneySummaryCardProps {
  summary: JourneySummary
  disabled?: boolean
  onFindTrains: () => void
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.row}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{value}</dd>
    </div>
  )
}

export function JourneySummaryCard({
  summary,
  disabled = false,
  onFindTrains,
}: JourneySummaryCardProps) {
  const journeyLabel =
    summary.journeyType === 'return' ? 'Return' : 'Single'
  const handoffReady = canBuildJourneyResultsUrl(summary)

  return (
    <div className={styles.card} aria-label="Journey summary">
      <div className={styles.route}>
        <span className={styles.station}>{summary.origin}</span>
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
        <span className={styles.station}>{summary.destination}</span>
      </div>

      <dl className={styles.details}>
        <SummaryRow label="Journey" value={journeyLabel} />
        <SummaryRow
          label="Outbound"
          value={`${summary.outboundDate}, ${summary.outboundTime}`}
        />
        {summary.journeyType === 'return' && summary.inboundDate && (
          <SummaryRow
            label="Return"
            value={
              summary.inboundTime
                ? `${summary.inboundDate}, ${summary.inboundTime}`
                : summary.inboundDate
            }
          />
        )}
        <SummaryRow label="Passengers" value={formatPassengers(summary)} />
        {summary.railcards && summary.railcards.length > 0 && (
          <SummaryRow label="Railcard" value={summary.railcards.join(', ')} />
        )}
        {summary.via && <SummaryRow label="Via" value={summary.via} />}
      </dl>

      <button
        type="button"
        className={styles.cta}
        disabled={disabled || !handoffReady}
        onClick={onFindTrains}
      >
        Find trains
      </button>
    </div>
  )
}
