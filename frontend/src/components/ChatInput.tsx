import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react'
import { Mic, MicOff, ArrowUp } from 'lucide-react'
import styles from './ChatInput.module.css'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [text, setText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
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
    setIsRecording((prev) => !prev)
    // STT integration placeholder — Phase 2 per PRD
  }

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputRow}>
          <button
            type="button"
            className={`${styles.micButton} ${isRecording ? styles.recording : ''}`}
            onClick={toggleRecording}
            disabled={disabled}
            aria-label={isRecording ? 'Stop recording' : 'Tap to speak'}
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
            placeholder="Where are you going?"
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
            Listening… tap the mic again to stop
          </p>
        )}
      </form>
    </div>
  )
}
