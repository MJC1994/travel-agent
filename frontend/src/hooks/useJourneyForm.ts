import { useCallback, useRef, useState } from 'react'
import { extractJourneyForm } from '../api/journeyExtract'
import type { ClarificationGroup, StationOption } from '../types/message'
import {
  emptyJourneyFormState,
  type JourneyFormState,
} from '../types/journeyForm'

function appendTranscript(current: string, next: string): string {
  const trimmed = next.trim()
  if (!trimmed) return current
  if (!current.trim()) return trimmed
  return `${current.trim()} ${trimmed}`
}

export function useJourneyForm() {
  const [form, setForm] = useState<JourneyFormState>(emptyJourneyFormState())
  const [clarificationGroups, setClarificationGroups] = useState<
    ClarificationGroup[]
  >([])
  const [sessionTranscript, setSessionTranscript] = useState('')
  const [liveTranscript, setLiveTranscript] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const formRef = useRef(form)
  const sessionTranscriptRef = useRef('')
  const debounceRef = useRef<number | null>(null)
  const requestIdRef = useRef(0)

  formRef.current = form
  sessionTranscriptRef.current = sessionTranscript

  const runExtract = useCallback(async (transcript: string) => {
    const trimmed = transcript.trim()
    if (!trimmed) return

    const requestId = ++requestIdRef.current
    setIsExtracting(true)
    setExtractError(null)

    try {
      const result = await extractJourneyForm(trimmed, formRef.current)
      if (requestId !== requestIdRef.current) return
      setForm(result.form)
      setClarificationGroups(result.clarificationGroups)
    } catch (error) {
      if (requestId !== requestIdRef.current) return
      setExtractError(
        error instanceof Error ? error.message : 'Could not update the form.',
      )
    } finally {
      if (requestId === requestIdRef.current) {
        setIsExtracting(false)
      }
    }
  }, [])

  const scheduleExtract = useCallback(
    (transcript: string, immediate = false) => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
      }

      if (immediate) {
        void runExtract(transcript)
        return
      }

      debounceRef.current = window.setTimeout(() => {
        void runExtract(transcript)
      }, 450)
    },
    [runExtract],
  )

  const handleInterimSpeech = useCallback(
    (chunk: string) => {
      const prefix = sessionTranscriptRef.current.trim()
      const live = prefix ? `${prefix} ${chunk}` : chunk
      setLiveTranscript(live)
      scheduleExtract(live)
    },
    [scheduleExtract],
  )

  const handleFinalSpeech = useCallback(
    (chunk: string) => {
      setLiveTranscript('')
      const combined = appendTranscript(sessionTranscriptRef.current, chunk)
      setSessionTranscript(combined)
      scheduleExtract(combined, true)
    },
    [scheduleExtract],
  )

  const ingestText = useCallback(
    (text: string, immediate = true) => {
      const combined = appendTranscript(sessionTranscriptRef.current, text)
      setSessionTranscript(combined)
      setLiveTranscript('')
      scheduleExtract(combined, immediate)
    },
    [scheduleExtract],
  )

  const selectStation = useCallback(
    (group: ClarificationGroup, option: StationOption) => {
      setForm((prev) => {
        const field = group.label.toLowerCase()
        if (field === 'origin') {
          return {
            ...prev,
            origin: option.value,
            originCrs: option.crs ?? undefined,
            originStatus: 'filled',
          }
        }
        if (field === 'destination') {
          return {
            ...prev,
            destination: option.value,
            destinationCrs: option.crs ?? undefined,
            destinationStatus: 'filled',
          }
        }
        return prev
      })
      setClarificationGroups((prev) =>
        prev.filter((item) => item.id !== group.id),
      )
    },
    [],
  )

  return {
    form,
    clarificationGroups,
    sessionTranscript,
    liveTranscript,
    isExtracting,
    extractError,
    handleInterimSpeech,
    handleFinalSpeech,
    ingestText,
    selectStation,
  }
}
