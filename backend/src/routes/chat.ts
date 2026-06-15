import { Router } from 'express'
import { streamChatResponse } from '../gemini.js'
import type { ChatMessage, ChatRequest } from '../types.js'

export const chatRouter = Router()

function isValidMessage(message: unknown): message is ChatMessage {
  if (!message || typeof message !== 'object') return false
  const { role, content } = message as ChatMessage
  return (
    (role === 'user' || role === 'agent') &&
    typeof content === 'string' &&
    content.trim().length > 0
  )
}

function isValidRequest(body: unknown): body is ChatRequest {
  if (!body || typeof body !== 'object') return false
  const { messages } = body as ChatRequest
  return Array.isArray(messages) && messages.length > 0 && messages.every(isValidMessage)
}

chatRouter.post('/chat', async (req, res) => {
  if (!isValidRequest(req.body)) {
    res.status(400).json({ detail: 'Invalid request body.' })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    for await (const event of streamChatResponse(req.body.messages)) {
      res.write(`data: ${JSON.stringify(event)}\n\n`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
  }

  res.write('data: [DONE]\n\n')
  res.end()
})
