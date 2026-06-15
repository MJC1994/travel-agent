export type MessageRole = 'user' | 'agent'

export interface ChatMessage {
  role: MessageRole
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
}
