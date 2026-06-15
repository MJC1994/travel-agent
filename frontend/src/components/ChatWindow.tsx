import { useEffect, useRef } from 'react'
import type { ClarificationGroup, JourneySummary, Message, StationOption } from '../types/message'
import { ChatMessage } from './ChatMessage'
import styles from './ChatWindow.module.css'

interface ChatWindowProps {
  messages: Message[]
  activeClarificationMessageId: string | null
  activeSummaryMessageId: string | null
  isLoading: boolean
  clarificationSelections: Record<string, Record<string, StationOption | undefined>>
  onSelectClarificationOption: (
    messageId: string,
    group: ClarificationGroup,
    option: StationOption,
  ) => void
  onConfirmClarifications: (messageId: string, groups: ClarificationGroup[]) => void
  onFindTrains: (messageId: string, summary: JourneySummary) => void
}

export function ChatWindow({
  messages,
  activeClarificationMessageId,
  activeSummaryMessageId,
  isLoading,
  clarificationSelections,
  onSelectClarificationOption,
  onConfirmClarifications,
  onFindTrains,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, clarificationSelections])

  return (
    <div
      className={styles.window}
      role="log"
      aria-live="polite"
      aria-label="Conversation"
    >
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          isClarificationActive={message.id === activeClarificationMessageId}
          isSummaryActive={message.id === activeSummaryMessageId}
          isLoading={isLoading}
          clarificationSelections={
            clarificationSelections[message.id] ?? {}
          }
          onSelectClarificationOption={onSelectClarificationOption}
          onConfirmClarifications={onConfirmClarifications}
          onFindTrains={onFindTrains}
        />
      ))}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  )
}
