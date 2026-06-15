import { JourneySummaryCard } from './JourneySummaryCard'
import { StationClarificationPanel } from './StationClarificationPanel'
import type { ClarificationGroup, JourneySummary, Message, StationOption } from '../types/message'
import styles from './ChatMessage.module.css'

interface ChatMessageProps {
  message: Message
  isClarificationActive: boolean
  isSummaryActive: boolean
  isLoading: boolean
  clarificationSelections: Record<string, StationOption | undefined>
  onSelectClarificationOption: (
    messageId: string,
    group: ClarificationGroup,
    option: StationOption,
  ) => void
  onConfirmClarifications: (messageId: string, groups: ClarificationGroup[]) => void
  onFindTrains: (messageId: string, summary: JourneySummary) => void
}

export function ChatMessage({
  message,
  isClarificationActive,
  isSummaryActive,
  isLoading,
  clarificationSelections,
  onSelectClarificationOption,
  onConfirmClarifications,
  onFindTrains,
}: ChatMessageProps) {
  const isAgent = message.role === 'agent'
  const isTyping = isAgent && isLoading && message.content.length === 0
  const groups = message.clarificationGroups ?? []
  const showOptions =
    isAgent &&
    isClarificationActive &&
    !isTyping &&
    !message.journeySummary &&
    groups.length > 0
  const showSummary =
    isAgent &&
    isSummaryActive &&
    !isTyping &&
    message.journeySummary !== undefined

  const selections = Object.fromEntries(
    groups.map((group) => [group.id, clarificationSelections[group.id]]),
  )

  return (
    <div
      className={`${styles.wrapper} ${isAgent ? styles.agent : styles.user}`}
    >
      <div className={styles.messageColumn}>
        {!showOptions && (
          <div
            className={`${styles.bubble} ${isAgent ? styles.agentBubble : styles.userBubble}`}
            role="article"
            aria-label={isTyping ? 'Agent is typing' : `${isAgent ? 'Agent' : 'You'} said`}
          >
            {isTyping ? (
              <span className={styles.typing} aria-hidden="true">
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </span>
            ) : (
              <p className={styles.content}>{message.content}</p>
            )}
          </div>
        )}

        {showSummary && message.journeySummary && (
          <JourneySummaryCard
            summary={message.journeySummary}
            disabled={isLoading}
            onFindTrains={() => onFindTrains(message.id, message.journeySummary!)}
          />
        )}

        {showOptions && (
          <StationClarificationPanel
            groups={groups}
            selections={selections}
            disabled={isLoading}
            onSelectOption={(group, option) =>
              onSelectClarificationOption(message.id, group, option)
            }
            onConfirm={() => onConfirmClarifications(message.id, groups)}
          />
        )}
      </div>
    </div>
  )
}
