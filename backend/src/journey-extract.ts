import { GoogleGenAI } from '@google/genai'
import { MODEL } from './gemini.js'
import {
  emptyJourneyFormState,
  enrichJourneyFormState,
  mergeFormExtract,
  type JourneyFormExtractPayload,
  type JourneyFormState,
} from './journey-form.js'
import { buildSystemInstruction } from './prompts.js'

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.')
  }
  return new GoogleGenAI({ apiKey })
}

const EXTRACT_INSTRUCTION = `You extract UK rail journey search parameters from spoken or typed user input.

Return JSON only. Use null for fields not mentioned in the latest transcript.
When the user amends one field (e.g. "change to Friday"), update only that field and return null for unchanged fields.

Rules:
- Resolve relative dates using the current UK date in the system context.
- outboundDateTime / inboundDateTime must be ISO YYYY-MM-DDTHH:mm when date and time are known.
- Also provide readable outboundDate, outboundTime (and inbound if return).
- journeyType: "return" if they mention returning, "single" otherwise; null if unknown.
- adults/children as integers; null if not mentioned.
- railcards as array of names mentioned; null if not mentioned.
- Do not invent stations.`

function parseExtractPayload(raw: unknown): JourneyFormExtractPayload {
  if (!raw || typeof raw !== 'object') return {}
  const data = raw as Record<string, unknown>
  return {
    origin: typeof data.origin === 'string' ? data.origin : null,
    destination: typeof data.destination === 'string' ? data.destination : null,
    journeyType:
      data.journeyType === 'return' || data.journeyType === 'single'
        ? data.journeyType
        : null,
    outboundDate: typeof data.outboundDate === 'string' ? data.outboundDate : null,
    outboundTime: typeof data.outboundTime === 'string' ? data.outboundTime : null,
    outboundDateTime:
      typeof data.outboundDateTime === 'string' ? data.outboundDateTime : null,
    inboundDate: typeof data.inboundDate === 'string' ? data.inboundDate : null,
    inboundTime: typeof data.inboundTime === 'string' ? data.inboundTime : null,
    inboundDateTime:
      typeof data.inboundDateTime === 'string' ? data.inboundDateTime : null,
    adults: typeof data.adults === 'number' ? data.adults : null,
    children: typeof data.children === 'number' ? data.children : null,
    railcards: Array.isArray(data.railcards)
      ? data.railcards.filter((item): item is string => typeof item === 'string')
      : null,
    via: typeof data.via === 'string' ? data.via : null,
  }
}

export async function extractJourneyForm(
  transcript: string,
  currentForm: JourneyFormState = emptyJourneyFormState(),
): Promise<{
  form: JourneyFormState
  clarificationGroups: import('./clarifications.js').ClarificationGroup[]
}> {
  const trimmed = transcript.trim()
  if (!trimmed) {
    return enrichJourneyFormState(currentForm)
  }

  const client = getClient()
  const response = await client.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Current form state:\n${JSON.stringify(currentForm, null, 2)}\n\nUser transcript:\n${trimmed}`,
          },
        ],
      },
    ],
    config: {
      systemInstruction: `${buildSystemInstruction()}\n\n${EXTRACT_INSTRUCTION}`,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          origin: { type: 'string', nullable: true },
          destination: { type: 'string', nullable: true },
          journeyType: {
            type: 'string',
            enum: ['single', 'return'],
            nullable: true,
          },
          outboundDate: { type: 'string', nullable: true },
          outboundTime: { type: 'string', nullable: true },
          outboundDateTime: { type: 'string', nullable: true },
          inboundDate: { type: 'string', nullable: true },
          inboundTime: { type: 'string', nullable: true },
          inboundDateTime: { type: 'string', nullable: true },
          adults: { type: 'integer', nullable: true },
          children: { type: 'integer', nullable: true },
          railcards: {
            type: 'array',
            items: { type: 'string' },
            nullable: true,
          },
          via: { type: 'string', nullable: true },
        },
      },
    },
  })

  let payload: JourneyFormExtractPayload = {}
  try {
    const text = response.text?.trim()
    if (text) {
      payload = parseExtractPayload(JSON.parse(text))
    }
  } catch {
    payload = {}
  }

  const merged = mergeFormExtract(currentForm, payload)
  return enrichJourneyFormState(merged)
}
