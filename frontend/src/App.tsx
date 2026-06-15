import { ChatHeader } from './components/ChatHeader'
import { ChatWindow } from './components/ChatWindow'
import { ChatInput } from './components/ChatInput'
import { useChat } from './hooks/useChat'
import styles from './App.module.css'

function App() {
  const {
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
  } = useChat()

  return (
    <div className={styles.app}>
      <div className={styles.container}>
        <ChatHeader isMuted={isMuted} onToggleMute={toggleMute} />
        <ChatWindow
          messages={messages}
          activeClarificationMessageId={activeClarificationMessageId}
          activeSummaryMessageId={activeSummaryMessageId}
          isLoading={isLoading}
          clarificationSelections={clarificationSelections}
          onSelectClarificationOption={selectClarificationOption}
          onConfirmClarifications={confirmClarifications}
          onFindTrains={findTrains}
        />
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>
    </div>
  )
}

export default App
