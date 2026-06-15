import { Router } from 'express'
import { resolveStation, searchStationMatches, getStationCount } from '../stations.js'

export const stationsRouter = Router()

stationsRouter.get('/stations/search', (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  const limit = parseLimit(req.query.limit, 10)
  const minScore = parseMinScore(req.query.minScore)

  if (!query) {
    res.status(400).json({ detail: 'Query parameter "q" is required.' })
    return
  }

  res.json({
    query,
    matches: searchStationMatches(query, limit, minScore),
  })
})

stationsRouter.get('/stations/resolve', (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : ''

  if (!query) {
    res.status(400).json({ detail: 'Query parameter "q" is required.' })
    return
  }

  res.json(resolveStation(query))
})

stationsRouter.get('/stations/meta', (_req, res) => {
  res.json({ count: getStationCount() })
})

function parseLimit(value: unknown, max: number): number {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : NaN
  if (Number.isNaN(parsed)) return Math.min(4, max)
  return Math.min(Math.max(1, parsed), max)
}

function parseMinScore(value: unknown): number {
  const parsed = typeof value === 'string' ? Number.parseFloat(value) : NaN
  if (Number.isNaN(parsed)) return 0.35
  return Math.min(Math.max(0, parsed), 1)
}
