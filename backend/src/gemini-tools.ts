import type { FunctionDeclaration } from '@google/genai'
import { enrichJourneySummary } from './journey-handoff.js'
import { parseJourneySummary } from './journey-summary.js'
import { resolveStation, searchStationMatches } from './stations.js'
import type { JourneySummary } from './journey-summary.js'

export const STATION_TOOLS: FunctionDeclaration[] = [
  {
    name: 'lookup_station',
    description:
      'Fuzzy search for a UK rail station by name, CRS code, or NLC code. Returns a resolved station when confidence is high, or a short list of matches when ambiguous. Always call this when the user mentions an origin, destination, or via station.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Station name or code as mentioned by the user, e.g. "Paddington", "MAN", "clapham"',
        },
        field: {
          type: 'string',
          enum: ['origin', 'destination', 'via'],
          description: 'Which part of the journey this station is for',
        },
      },
      required: ['query', 'field'],
    },
  },
  {
    name: 'search_stations',
    description:
      'Search the UK rail station database and return ranked matches. Use when you need to browse options or lookup_station returned not_found.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Partial station name or code to search for',
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of results to return (default 4, max 10)',
        },
      },
      required: ['query'],
    },
  },
]

export const JOURNEY_SUMMARY_TOOL: FunctionDeclaration = {
  name: 'present_journey_summary',
  description:
    'Present the journey summary card when all required parameters are confirmed. Call this before your final confirmation message. The app renders the summary and a Find trains button — do not list all parameters in your text reply.',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      origin: { type: 'string', description: 'Resolved origin station name' },
      destination: {
        type: 'string',
        description: 'Resolved destination station name',
      },
      journeyType: {
        type: 'string',
        enum: ['single', 'return'],
        description: 'Single or return journey',
      },
      outboundDate: {
        type: 'string',
        description: 'Outbound date in readable form, e.g. "Thursday 19 June 2026"',
      },
      outboundTime: {
        type: 'string',
        description: 'Outbound time for display, e.g. "09:00" or "Morning"',
      },
      outboundDateTime: {
        type: 'string',
        description:
          'Outbound departure datetime in ISO format YYYY-MM-DDTHH:mm (UK local time), e.g. "2026-07-21T12:35"',
      },
      inboundDate: {
        type: 'string',
        description: 'Return date for display (required for return journeys)',
      },
      inboundTime: {
        type: 'string',
        description: 'Return time for display if known',
      },
      inboundDateTime: {
        type: 'string',
        description:
          'Return departure datetime in ISO format YYYY-MM-DDTHH:mm (required for return journeys)',
      },
      adults: { type: 'integer', description: 'Number of adult passengers' },
      children: { type: 'integer', description: 'Number of child passengers' },
      railcards: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Railcards applied to the search. Use supported names or common shorthand (e.g. "Network Railcard", "16-25", "senior").',
      },
      via: { type: 'string', description: 'Via station if specified' },
    },
    required: [
      'origin',
      'destination',
      'journeyType',
      'outboundDate',
      'outboundTime',
      'outboundDateTime',
      'adults',
    ],
  },
}

export const ALL_TOOLS: FunctionDeclaration[] = [
  ...STATION_TOOLS,
  JOURNEY_SUMMARY_TOOL,
]

export interface ToolExecutionResult {
  response: Record<string, unknown>
  summary?: JourneySummary
}

export function executeTool(
  name: string,
  args: Record<string, unknown>,
): ToolExecutionResult {
  switch (name) {
    case 'lookup_station': {
      const query = typeof args.query === 'string' ? args.query : ''
      return { response: resolveStation(query) as Record<string, unknown> }
    }
    case 'search_stations': {
      const query = typeof args.query === 'string' ? args.query : ''
      const limit =
        typeof args.limit === 'number'
          ? Math.min(Math.max(1, args.limit), 10)
          : 4
      return {
        response: {
          query,
          matches: searchStationMatches(query, limit),
        },
      }
    }
    case 'present_journey_summary': {
      const summary = parseJourneySummary(args)
      if (!summary) {
        return {
          response: {
            success: false,
            error:
              'Missing required journey parameters. Include outboundDateTime (YYYY-MM-DDTHH:mm) plus readable dates/times.',
          },
        }
      }
      const enriched = enrichJourneySummary(summary)
      if (!enriched) {
        return {
          response: {
            success: false,
            error:
              'Could not resolve station CRS codes or datetimes for handoff. Verify station names and ISO datetimes.',
          },
        }
      }
      return {
        response: { success: true },
        summary: enriched,
      }
    }
    default:
      return { response: { error: `Unknown tool: ${name}` } }
  }
}
