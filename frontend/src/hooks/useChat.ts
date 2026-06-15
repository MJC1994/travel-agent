import { useCallback, useMemo, useState } from 'react'
import { streamChat, ChatApiError } from '../api/chat'
import { buildJourneyResultsUrl } from '../lib/buildJourneyResultsUrl'
import type { ClarificationGroup, JourneySummary, Message, StationOption } from '../types/message'

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  role: 'agent',
  content: 'Where are you going?',
  timestamp: new Date(),
}

function createId() {
  return crypto.randomUUID()
}

function clearInteractiveState(message: Message): Message {
  let next = message
  if (message.clarificationGroups) {
    next = { ...next, clarificationGroups: undefined }
  }
  if (message.journeySummary) {
    next = { ...next, journeySummary: undefined }
  }
  return next
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [submittedSummaryIds, setSubmittedSummaryIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [clarificationSelections, setClarificationSelections] = useState<
    Record<string, Record<string, StationOption | undefined>>
  >({})

  const activeClarificationMessageId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index]
      if (
        message?.role === 'agent' &&
        message.clarificationGroups?.length &&
        !message.journeySummary
      ) {
        return message.id
      }
    }
    return null
  }, [messages])

  const activeSummaryMessageId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index]
      if (
        message?.role === 'agent' &&
        message.journeySummary &&
        !submittedSummaryIds.has(message.id)
      ) {
        return message.id
      }
    }
    return null
  }, [messages, submittedSummaryIds])

  const sendMessage = useCallback(async (text: string) => {
    const userMessage: Message = {
      id: createId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    const agentId = createId()
    const agentPlaceholder: Message = {
      id: agentId,
      role: 'agent',
      content: '',
      timestamp: new Date(),
    }

    const historyForApi = [...messages, userMessage]

    setClarificationSelections({})
    setMessages((prev) => [
      ...prev.map(clearInteractiveState),
      userMessage,
      agentPlaceholder,
    ])
    setIsLoading(true)

    try {
      for await (const chunk of streamChat(historyForApi)) {
        setMessages((prev) =>
          prev.map((message) => {
            if (message.id !== agentId) return message

            if (chunk.text !== undefined) {
              return { ...message, content: message.content + chunk.text }
            }

            if (chunk.options?.length) {
              return {
                ...message,
                clarificationGroups: message.journeySummary
                  ? undefined
                  : chunk.options,
              }
            }

            if (chunk.summary) {
              return {
                ...message,
                journeySummary: chunk.summary,
                clarificationGroups: undefined,
              }
            }

            return message
          }),
        )
      }
    } catch (error) {
      const fallback =
        error instanceof ChatApiError
          ? error.message
          : "Sorry, I couldn't reach the server. Make sure the backend is running and your API key is set."

      setMessages((prev) =>
        prev.map((message) =>
          message.id === agentId
            ? { ...message, content: message.content || fallback }
            : message,
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }, [messages])

  const selectClarificationOption = useCallback(
    (messageId: string, group: ClarificationGroup, option: StationOption) => {
      if (isLoading) return

      setClarificationSelections((prev) => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          [group.id]: option,
        },
      }))
    },
    [isLoading],
  )

  const confirmClarifications = useCallback(
    (messageId: string, groups: ClarificationGroup[]) => {
      if (isLoading) return

      const selections = clarificationSelections[messageId]
      if (!selections) return

      const allSelected = groups.every((group) => selections[group.id])
      if (!allSelected) return

      const confirmation = groups
        .map((group) => `${group.label}: ${selections[group.id]!.value}`)
        .join('. ')

      sendMessage(confirmation)
    },
    [clarificationSelections, isLoading, sendMessage],
  )

  const findTrains = useCallback(
    (messageId: string, summary: JourneySummary) => {
      if (isLoading) return

      const url = buildJourneyResultsUrl(summary)
      if (!url) {
        console.error('Could not build journey results URL', summary)
        return
      }

      setSubmittedSummaryIds((prev) => new Set(prev).add(messageId))
      window.location.assign(url)
    },
    [isLoading],
  )

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev)
  }, [])

  return {
    messages,
    isMuted,
    isLoading,
    activeClarificationMessageId,
    activeSummaryMessageId,
    clarificationSelections,
    sendMessage,
    selectClarificationOption,
    confirmClarifications,
    findTrains,
    toggleMute,
  }
}
