import { ChatHeader } from './components/ChatHeader'
import { ChatWindow } from './components/ChatWindow'
import { ChatInput } from './components/ChatInput'
import { JourneyFormPanel } from './components/JourneyFormPanel'
import { useChat } from './hooks/useChat'
import { useJourneyForm } from './hooks/useJourneyForm'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { buildJourneyResultsUrl } from './lib/buildJourneyResultsUrl'
import { formToJourneySummary } from './types/journeyForm'
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

  const journeyForm = useJourneyForm()

  const speech = useSpeechRecognition({
    onInterimTranscript: journeyForm.handleInterimSpeech,
    onFinalTranscript: journeyForm.handleFinalSpeech,
  })

  function handleSend(text: string) {
    journeyForm.ingestText(text)
    sendMessage(text)
  }

  function handleFindTrainsFromForm() {
    const summary = formToJourneySummary(journeyForm.form)
    if (!summary) return
    const url = buildJourneyResultsUrl(summary)
    if (url) {
      window.location.assign(url)
    }
  }

  return (
    <div className={styles.app}>
      <div className={styles.container}>
        <ChatHeader isMuted={isMuted} onToggleMute={toggleMute} />
        <JourneyFormPanel
          form={journeyForm.form}
          clarificationGroups={journeyForm.clarificationGroups}
          liveTranscript={journeyForm.liveTranscript}
          isExtracting={journeyForm.isExtracting}
          extractError={journeyForm.extractError}
          onSelectStation={journeyForm.selectStation}
          onFindTrains={handleFindTrainsFromForm}
        />
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
        <ChatInput
          onSend={handleSend}
          disabled={isLoading || journeyForm.isExtracting}
          micDisabled={isLoading}
          isRecording={speech.isListening}
          speechSupported={speech.isSupported}
          speechError={speech.speechError}
          voiceTranscript={
            journeyForm.liveTranscript || journeyForm.sessionTranscript
          }
          onToggleRecording={speech.toggleListening}
        />
      </div>
    </div>
  )
}

export default App
