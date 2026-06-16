import type { JourneyExtractResponse, JourneyFormState } from '../types/journeyForm'
import { fetchWithRetry } from './fetchWithRetry'

export class JourneyExtractError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'JourneyExtractError'
  }
}

export async function extractJourneyForm(
  transcript: string,
  currentForm: JourneyFormState,
): Promise<JourneyExtractResponse> {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? ''
  const response = await fetchWithRetry(`${apiBase}/api/journey-extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, currentForm }),
  })

  if (!response.ok) {
    let detail = `Extraction failed (${response.status})`
    try {
      const body = await response.json()
      if (body.detail) detail = body.detail
    } catch {
      // ignore
    }
    throw new JourneyExtractError(detail)
  }

  return response.json() as Promise<JourneyExtractResponse>
}
