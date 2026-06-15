import {
  GoogleGenAI,
  type Content,
  type FunctionCall,
  type GenerateContentConfig,
  type Part,
} from '@google/genai'
import {
  collectClarifications,
  mergeClarifications,
  type ChatStreamEvent,
  type ClarificationGroup,
} from './clarifications.js'
import { ALL_TOOLS, executeTool } from './gemini-tools.js'
import type { JourneySummary } from './journey-summary.js'
import { runPreflight, trimMessages } from './preflight.js'
import { buildSystemInstruction } from './prompts.js'
import type { ChatMessage } from './types.js'

export const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'

const MAX_TOOL_ROUNDS = 2

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.')
  }
  return new GoogleGenAI({ apiKey })
}

function toGeminiContents(messages: ChatMessage[]): Content[] {
  return messages.map((message) => ({
    role: message.role === 'user' ? 'user' : 'model',
    parts: [{ text: message.content }],
  }))
}

function getModelParts(response: { candidates?: Array<{ content?: Content }> }): Part[] {
  return response.candidates?.[0]?.content?.parts ?? []
}

function getFunctionCalls(response: {
  functionCalls?: FunctionCall[]
  candidates?: Array<{ content?: Content }>
}): FunctionCall[] {
  if (response.functionCalls?.length) {
    return response.functionCalls
  }

  const calls: FunctionCall[] = []
  for (const part of getModelParts(response)) {
    if (part.functionCall?.name) {
      calls.push(part.functionCall)
    }
  }
  return calls
}

function getResponseText(response: {
  text?: string
  candidates?: Array<{ content?: Content }>
}): string {
  if (response.text) return response.text

  return getModelParts(response)
    .map((part) => part.text ?? '')
    .join('')
}

function buildConfig(preflightContext: string): GenerateContentConfig {
  return {
    systemInstruction: buildSystemInstruction() + preflightContext,
    tools: [{ functionDeclarations: ALL_TOOLS }],
  }
}

function processToolCalls(
  functionCalls: FunctionCall[],
  clarificationGroups: ClarificationGroup[],
  journeySummary: JourneySummary | undefined,
): {
  functionResponseParts: Part[]
  clarificationGroups: ClarificationGroup[]
  journeySummary: JourneySummary | undefined
} {
  const functionResponseParts: Part[] = []
  let groups = clarificationGroups
  let summary = journeySummary

  for (const call of functionCalls) {
    const args = (call.args ?? {}) as Record<string, unknown>
    const { response: toolResult, summary: toolSummary } = executeTool(
      call.name ?? '',
      args,
    )

    if (toolSummary) {
      summary = toolSummary
      groups = []
    }

    const clarification = collectClarifications(
      call.name ?? '',
      args,
      toolResult,
    )
    if (clarification && !summary) {
      groups = mergeClarifications(groups, [clarification])
    }

    functionResponseParts.push({
      functionResponse: {
        name: call.name ?? 'unknown',
        response: toolResult,
      },
    })
  }

  return {
    functionResponseParts,
    clarificationGroups: groups,
    journeySummary: summary,
  }
}

function yieldMetadata(
  journeySummary: JourneySummary | undefined,
  clarificationGroups: ClarificationGroup[],
): ChatStreamEvent[] {
  const events: ChatStreamEvent[] = []
  if (journeySummary) events.push({ summary: journeySummary })
  if (clarificationGroups.length > 0 && !journeySummary) {
    events.push({ options: clarificationGroups })
  }
  return events
}

export async function* streamChatResponse(
  messages: ChatMessage[],
): AsyncGenerator<ChatStreamEvent, void, unknown> {
  const client = getClient()
  const trimmedMessages = trimMessages(messages)
  const preflight = runPreflight(trimmedMessages)
  const contents: Content[] = toGeminiContents(trimmedMessages)
  let clarificationGroups = preflight.clarificationGroups
  let journeySummary: JourneySummary | undefined
  const config = buildConfig(preflight.promptContext)

  if (clarificationGroups.length > 0 && !journeySummary) {
    yield { options: clarificationGroups }
    return
  }

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await client.models.generateContent({
      model: MODEL,
      contents,
      config,
    })

    const functionCalls = getFunctionCalls(response)
    if (functionCalls.length === 0) {
      const awaitingStations =
        clarificationGroups.length > 0 && !journeySummary
      const text = getResponseText(response)
      if (text && !awaitingStations) yield { text }
      for (const event of yieldMetadata(journeySummary, clarificationGroups)) {
        yield event
      }
      return
    }

    contents.push({
      role: 'model',
      parts: getModelParts(response),
    })

    const processed = processToolCalls(
      functionCalls,
      clarificationGroups,
      journeySummary,
    )
    clarificationGroups = processed.clarificationGroups
    journeySummary = processed.journeySummary

    contents.push({
      role: 'user',
      parts: processed.functionResponseParts,
    })

    if (clarificationGroups.length > 0 && !journeySummary) {
      for (const event of yieldMetadata(journeySummary, clarificationGroups)) {
        yield event
      }
      return
    }
  }

  const stream = await client.models.generateContentStream({
    model: MODEL,
    contents,
    config,
  })

  for await (const chunk of stream) {
    if (chunk.text) {
      yield { text: chunk.text }
    }
  }

  for (const event of yieldMetadata(journeySummary, clarificationGroups)) {
    yield event
  }
}
