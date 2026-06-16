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

function speechErrorMessage(error: string): string {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was blocked. Allow the mic in your browser settings and try again.'
    case 'no-speech':
      return "I didn't hear anything — try speaking again."
    case 'network':
      return 'Speech recognition needs an internet connection (Chrome sends audio to Google).'
    case 'audio-capture':
      return 'No microphone was found. Check your device settings.'
    case 'aborted':
      return ''
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
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [speechError, setSpeechError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const callbacksRef = useRef({ onInterimTranscript, onFinalTranscript })
  const wantsListenRef = useRef(false)
  const isListeningRef = useRef(false)
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
      isListeningRef.current = true
      setIsListening(true)
      setSpeechError(null)
    }

    recognition.onresult = (event) => {
      let interim = ''
      let finalChunk = ''

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const transcript = result[0]?.transcript ?? ''
        if (result.isFinal) {
          finalChunk += transcript
        } else {
          interim += transcript
        }
      }

      if (interim.trim()) {
        callbacksRef.current.onInterimTranscript?.(interim.trim())
      }
      if (finalChunk.trim()) {
        callbacksRef.current.onFinalTranscript?.(finalChunk.trim())
      }
    }

    recognition.onerror = (event) => {
      const message = speechErrorMessage(event.error)
      if (message) {
        setSpeechError(message)
      }
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        wantsListenRef.current = false
      }
    }

    recognition.onend = () => {
      isListeningRef.current = false
      setIsListening(false)

      if (wantsListenRef.current) {
        restartTimerRef.current = window.setTimeout(() => {
          if (!wantsListenRef.current || !recognitionRef.current) return
          try {
            recognitionRef.current.start()
          } catch {
            wantsListenRef.current = false
          }
        }, 250)
      }
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

    try {
      recognitionRef.current.start()
    } catch {
      wantsListenRef.current = false
      setSpeechError('Could not start the microphone. Try again in a moment.')
    }
  }, [])

  const stopListening = useCallback(() => {
    wantsListenRef.current = false
    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
    recognitionRef.current?.stop()
    isListeningRef.current = false
    setIsListening(false)
  }, [])

  const toggleListening = useCallback(() => {
    if (wantsListenRef.current || isListeningRef.current) {
      stopListening()
    } else {
      void startListening()
    }
  }, [startListening, stopListening])

  return {
    isListening,
    isSupported,
    speechError,
    startListening,
    stopListening,
    toggleListening,
  }
}
