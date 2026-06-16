import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react'
import { Mic, MicOff, ArrowUp } from 'lucide-react'
import styles from './ChatInput.module.css'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled?: boolean
  micDisabled?: boolean
  isRecording?: boolean
  speechSupported?: boolean
  speechError?: string | null
  onToggleRecording?: () => void
}

export function ChatInput({
  onSend,
  disabled = false,
  micDisabled = false,
  isRecording = false,
  speechSupported = false,
  speechError = null,
  onToggleRecording,
}: ChatInputProps) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const canSend = text.trim().length > 0 && !disabled

  function handleSubmit(e?: FormEvent) {
    e?.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function toggleRecording() {
    if (!speechSupported || !onToggleRecording) return
    onToggleRecording()
  }

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputRow}>
          <button
            type="button"
            className={`${styles.micButton} ${isRecording ? styles.recording : ''}`}
            onClick={toggleRecording}
            disabled={micDisabled || !speechSupported}
            aria-label={
              !speechSupported
                ? 'Speech not supported in this browser'
                : isRecording
                  ? 'Stop recording'
                  : 'Tap to speak'
            }
            aria-pressed={isRecording}
          >
            {isRecording ? (
              <MicOff size={22} strokeWidth={2} />
            ) : (
              <Mic size={22} strokeWidth={2} />
            )}
          </button>

          <textarea
            ref={inputRef}
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your journey…"
            rows={1}
            disabled={disabled}
            aria-label="Message input"
          />

          <button
            type="submit"
            className={styles.sendButton}
            disabled={!canSend}
            aria-label="Send message"
          >
            <ArrowUp size={20} strokeWidth={2.5} />
          </button>
        </div>

        {isRecording && (
          <p className={styles.recordingHint} role="status">
            Listening… fields update as you speak. Tap the mic to stop.
          </p>
        )}

        {!isRecording && speechError && (
          <p className={styles.speechError} role="alert">
            {speechError}
          </p>
        )}

        {!speechSupported && (
          <p className={styles.speechUnsupported}>
            Voice input needs Chrome, Edge, or Safari. You can still type your journey.
          </p>
        )}
      </form>
    </div>
  )
}
