import type { ClarificationGroup, StationOption } from '../types/message'
import styles from './StationClarificationPanel.module.css'

interface StationClarificationPanelProps {
  groups: ClarificationGroup[]
  selections: Record<string, StationOption | undefined>
  disabled?: boolean
  onSelectOption: (group: ClarificationGroup, option: StationOption) => void
  onConfirm: () => void
}

function clarificationPanelTitle(groups: ClarificationGroup[]): string {
  const labels = new Set(groups.map((group) => group.label))
  if (labels.has('Origin') && labels.has('Destination')) {
    return 'Please select your origin and destination. Or tell us again if we haven\'t found it.'
  }
  if (labels.has('Origin')) {
    return 'Please select your origin. Or tell us again if we haven\'t found it.'
  }
  return 'Please select your destination. Or tell us again if we haven\'t found it.'
}

export function StationClarificationPanel({
  groups,
  selections,
  disabled = false,
  onSelectOption,
  onConfirm,
}: StationClarificationPanelProps) {
  const allSelected = groups.every((group) => selections[group.id] !== undefined)

  return (
    <div className={styles.panel} role="group" aria-label="Station options">
      <p className={styles.panelTitle}>{clarificationPanelTitle(groups)}</p>

      {groups.map((group) => {
        const selected = selections[group.id]

        return (
          <div key={group.id} className={styles.optionGroup}>
            <p className={styles.optionGroupLabel}>{group.label}</p>
            <div
              className={styles.optionList}
              role="radiogroup"
              aria-label={`Select ${group.label.toLowerCase()}`}
            >
              {group.options.map((option) => {
                const isSelected =
                  selected?.value === option.value &&
                  selected?.crs === option.crs

                return (
                  <button
                    key={`${group.id}-${option.crs ?? option.value}`}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`${styles.optionButton} ${isSelected ? styles.optionButtonSelected : ''}`}
                    disabled={disabled}
                    onClick={() => onSelectOption(group, option)}
                  >
                    <span className={styles.optionLabel}>{option.label}</span>
                    {option.crs && (
                      <span className={styles.optionCrs}>{option.crs}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      <button
        type="button"
        className={styles.confirmButton}
        disabled={disabled || !allSelected}
        onClick={onConfirm}
      >
        Confirm
      </button>
    </div>
  )
}
