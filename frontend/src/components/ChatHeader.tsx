import { Volume2, VolumeX } from 'lucide-react'
import styles from './ChatHeader.module.css'

interface ChatHeaderProps {
  isMuted: boolean
  onToggleMute: () => void
}

export function ChatHeader({ isMuted, onToggleMute }: ChatHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.titleGroup}>
        <span className={styles.badge} aria-hidden="true" />
        <h1 className={styles.title}>Travel Agent</h1>
      </div>

      <button
        type="button"
        className={`${styles.muteButton} ${isMuted ? styles.muted : ''}`}
        onClick={onToggleMute}
        aria-label={isMuted ? 'Unmute agent voice' : 'Mute agent voice'}
        aria-pressed={isMuted}
      >
        {isMuted ? (
          <VolumeX size={20} strokeWidth={2} />
        ) : (
          <Volume2 size={20} strokeWidth={2} />
        )}
      </button>
    </header>
  )
}
