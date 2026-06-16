import { Router } from 'express'
import { emptyJourneyFormState, type JourneyFormState } from '../journey-form.js'
import { extractJourneyForm } from '../journey-extract.js'

export const journeyExtractRouter = Router()

function isValidForm(value: unknown): value is JourneyFormState {
  return Boolean(value && typeof value === 'object')
}

journeyExtractRouter.post('/journey-extract', async (req, res) => {
  const transcript =
    typeof req.body?.transcript === 'string' ? req.body.transcript.trim() : ''
  const currentForm = isValidForm(req.body?.currentForm)
    ? req.body.currentForm
    : emptyJourneyFormState()

  if (!transcript) {
    res.status(400).json({ detail: 'transcript is required.' })
    return
  }

  try {
    const result = await extractJourneyForm(transcript, currentForm)
    res.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Extraction failed.'
    res.status(500).json({ detail: message })
  }
})
