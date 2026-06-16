const RETRYABLE_STATUS = new Set([502, 503, 504])
const DEFAULT_RETRIES = 3
const BASE_DELAY_MS = 600

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Fetch that retries transient gateway failures (502/503/504) and network
 * errors with backoff. Railway spins the backend down when idle, so the first
 * request after a wake-up often fails until the container is ready.
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  retries = DEFAULT_RETRIES,
): Promise<Response> {
  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(input, init)
      if (RETRYABLE_STATUS.has(response.status) && attempt < retries) {
        await delay(BASE_DELAY_MS * (attempt + 1))
        continue
      }
      return response
    } catch (error) {
      lastError = error
      if (attempt < retries) {
        await delay(BASE_DELAY_MS * (attempt + 1))
        continue
      }
    }
  }

  throw lastError ?? new Error('Request failed after retries.')
}
