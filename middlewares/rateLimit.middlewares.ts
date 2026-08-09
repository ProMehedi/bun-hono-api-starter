import { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically.
// unref() so this timer never keeps the process alive on its own
// (important for tests / serverless / graceful shutdown).
const cleanupInterval = setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean every minute

cleanupInterval.unref?.()

/**
 * Default client-IP resolver, shared logic with the request logger.
 * IMPORTANT: only trust x-forwarded-for / x-real-ip if your deployment
 * guarantees these are set by a trusted proxy/edge (e.g. Cloudflare, your LB)
 * and that the proxy strips/overwrites any client-supplied value.
 * If you're not certain of that, treat this as spoofable and consider
 * requiring a trusted-proxy allowlist instead.
 */
const getClientIp = (c: Context): string => {
  const cfIp = c.req.header('cf-connecting-ip')
  if (cfIp) return cfIp

  const forwardedFor = c.req.header('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }

  const realIp = c.req.header('x-real-ip')
  if (realIp) return realIp

  return 'unknown'
}

interface RateLimitOptions {
  windowMs?: number // Time window in milliseconds
  max?: number // Max requests per window
  message?: string // Error message
  keyPrefix?: string // Prefix for the rate limit key to isolate different limiters
  keyGenerator?: (c: Context) => string // Custom key generator
}

/**
 * Rate limiting middleware
 * @param options - Configuration options
 */
export const rateLimit = (options: RateLimitOptions = {}) => {
  const {
    windowMs = 60 * 1000, // 1 minute default
    max = 100, // 100 requests per minute default
    message = 'Too many requests, please try again later.',
    keyPrefix = 'default', // Prefix to isolate different rate limiters
    keyGenerator = getClientIp
  } = options

  return async (c: Context, next: Next) => {
    // Prefix the key to isolate different rate limiters from each other
    const key = `${keyPrefix}:${keyGenerator(c)}`
    const now = Date.now()
    const entry = rateLimitStore.get(key)

    if (!entry || entry.resetTime < now) {
      // Create new entry / window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
    } else {
      // Increment counter
      entry.count++

      if (entry.count > max) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
        const rateLimitHeaders = {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(max),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(entry.resetTime / 1000))
        }

        // HTTPException without an explicit `res` builds a fresh Response
        // internally and drops any headers set via c.header() beforehand.
        // Attach the response explicitly so rate-limit headers actually
        // reach the client.
        throw new HTTPException(429, {
          message,
          res: new Response(JSON.stringify({ error: message }), {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              ...rateLimitHeaders
            }
          })
        })
      }
    }

    // Add rate limit headers to successful responses
    const current = rateLimitStore.get(key)!
    c.header('X-RateLimit-Limit', String(max))
    c.header('X-RateLimit-Remaining', String(Math.max(0, max - current.count)))
    c.header('X-RateLimit-Reset', String(Math.ceil(current.resetTime / 1000)))

    await next()
  }
}

/**
 * Strict rate limiter for sensitive endpoints (login, register)
 */
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: 'Too many attempts, please try again after 15 minutes.',
  keyPrefix: 'strict' // Isolate from standard rate limiter
})

/**
 * Standard rate limiter for general API endpoints
 */
export const standardRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many requests, please slow down.',
  keyPrefix: 'standard' // Isolate from strict rate limiter
})
