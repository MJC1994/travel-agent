import type { ClarificationGroup, JourneySummary } from '../types/message'
import { fetchWithRetry } from './fetchWithRetry'

export interface StreamChunk {
  text?: string
  options?: ClarificationGroup[]
  summary?: JourneySummary
  error?: string
}

export class ChatApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ChatApiError'
  }
}

export async function* streamChat(
  messages: Pick<import('../types/message').Message, 'role' | 'content'>[],
): AsyncGenerator<StreamChunk, void, unknown> {
  const payload = {
    messages: messages.map(({ role, content }) => ({ role, content })),
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL ?? ''
  const response = await fetchWithRetry(`${apiBase}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let detail = `Request failed (${response.status})`
    try {
      const body = await response.json()
      if (body.detail) detail = body.detail
    } catch {
      // ignore parse errors
    }
    throw new ChatApiError(detail)
  }

  if (!response.body) {
    throw new ChatApiError('No response body received from server.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue

      const data = line.slice(6).trim()
      if (data === '[DONE]') return

      let parsed: StreamChunk
      try {
        parsed = JSON.parse(data) as StreamChunk
      } catch {
        continue
      }

      if (parsed.error) {
        throw new ChatApiError(parsed.error)
      }

      if (parsed.text !== undefined) {
        yield { text: parsed.text }
      }

      if (parsed.options?.length) {
        yield { options: parsed.options }
      }

      if (parsed.summary) {
        yield { summary: parsed.summary }
      }
    }
  }
}
