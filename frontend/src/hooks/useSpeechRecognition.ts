import { useCallback, useEffect, useRef, useState } from 'react'

interface SpeechRecognitionAlternative {
  transcript: string
}

interface SpeechRecognitionResult {
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternative
  length: number
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult
  length: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message?: string
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export interface UseSpeechRecognitionOptions {
  onInterimTranscript?: (transcript: string) => void
  onFinalTranscript?: (transcript: string) => void
}

const TRANSIENT_ERRORS = new Set(['no-speech', 'aborted', 'network'])

function speechErrorMessage(error: string): string {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was blocked. Allow the mic in your browser settings and try again.'
    case 'audio-capture':
      return 'No microphone was found. Check your device settings.'
    default:
      return `Speech recognition error: ${error}`
  }
}

async function ensureMicrophonePermission(): Promise<string | null> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return null
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    for (const track of stream.getTracks()) {
      track.stop()
    }
    return null
  } catch {
    return 'Microphone access was denied. Allow the mic in your browser settings and try again.'
  }
}

export function useSpeechRecognition({
  onInterimTranscript,
  onFinalTranscript,
}: UseSpeechRecognitionOptions) {
  /** True while the user has the mic session open — stable UI, not tied to each browser restart. */
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [speechError, setSpeechError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const callbacksRef = useRef({ onInterimTranscript, onFinalTranscript })
  const wantsListenRef = useRef(false)
  const restartTimerRef = useRef<number | null>(null)

  useEffect(() => {
    callbacksRef.current = { onInterimTranscript, onFinalTranscript }
  }, [onInterimTranscript, onFinalTranscript])

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition
    setIsSupported(Boolean(SpeechRecognition))
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-GB'

    recognition.onstart = () => {
      setSpeechError(null)
    }

    recognition.onresult = (event) => {
      // Interim must be rebuilt from all non-final results — Chrome only sends
      // new segments from resultIndex, which would otherwise be fragments like " Brighton".
      let interimTranscript = ''
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index]
        if (!result.isFinal) {
          interimTranscript += result[0]?.transcript ?? ''
        }
      }

      let finalChunk = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        if (result.isFinal) {
          finalChunk += result[0]?.transcript ?? ''
        }
      }

      if (interimTranscript.trim()) {
        callbacksRef.current.onInterimTranscript?.(interimTranscript.trim())
      }
      if (finalChunk.trim()) {
        callbacksRef.current.onFinalTranscript?.(finalChunk.trim())
      }
    }

    recognition.onerror = (event) => {
      if (TRANSIENT_ERRORS.has(event.error)) {
        return
      }

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        wantsListenRef.current = false
        setIsRecording(false)
      }

      const message = speechErrorMessage(event.error)
      if (message) {
        setSpeechError(message)
      }
    }

    recognition.onend = () => {
      if (!wantsListenRef.current) return

      restartTimerRef.current = window.setTimeout(() => {
        if (!wantsListenRef.current || !recognitionRef.current) return
        try {
          recognitionRef.current.start()
        } catch {
          // Already running — ignore.
        }
      }, 300)
    }

    recognitionRef.current = recognition

    return () => {
      wantsListenRef.current = false
      if (restartTimerRef.current) {
        window.clearTimeout(restartTimerRef.current)
      }
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      recognition.onstart = null
      recognition.abort()
      recognitionRef.current = null
    }
  }, [])

  const startListening = useCallback(async () => {
    if (!recognitionRef.current || wantsListenRef.current) return

    setSpeechError(null)
    const permissionError = await ensureMicrophonePermission()
    if (permissionError) {
      setSpeechError(permissionError)
      return
    }

    wantsListenRef.current = true
    setIsRecording(true)

    try {
      recognitionRef.current.start()
    } catch {
      wantsListenRef.current = false
      setIsRecording(false)
      setSpeechError('Could not start the microphone. Try again in a moment.')
    }
  }, [])

  const stopListening = useCallback(() => {
    wantsListenRef.current = false
    setIsRecording(false)
    setSpeechError(null)

    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }

    recognitionRef.current?.stop()
  }, [])

  const toggleListening = useCallback(() => {
    if (wantsListenRef.current) {
      stopListening()
    } else {
      void startListening()
    }
  }, [startListening, stopListening])

  return {
    isListening: isRecording,
    isSupported,
    speechError,
    startListening,
    stopListening,
    toggleListening,
  }
}
