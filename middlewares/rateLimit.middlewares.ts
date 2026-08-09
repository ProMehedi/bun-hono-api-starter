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
  windowMs?: number
  max?: number
  message?: string
  keyPrefix?: string
  keyGenerator?: (c: Context) => string
  skip?: (c: Context) => boolean // don't rate-limit this request at all
  shouldCount?: (c: Context) => boolean // after response: does this attempt count toward the limit?
}

/**
 * Rate limiting middleware
 * @param options - Configuration options
 */
export const rateLimit = (options: RateLimitOptions = {}) => {
  const {
    windowMs = 60 * 1000,
    max = 100,
    message = 'Too many requests, please try again later.',
    keyPrefix = 'default',
    keyGenerator = getClientIp,
    skip,
    shouldCount = () => true // default: count everything, same as before
  } = options

  return async (c: Context, next: Next) => {
    if (skip?.(c)) {
      return next()
    }

    const key = `${keyPrefix}:${keyGenerator(c)}`
    const now = Date.now()
    let entry = rateLimitStore.get(key)

    if (!entry || entry.resetTime < now) {
      entry = { count: 0, resetTime: now + windowMs }
      rateLimitStore.set(key, entry)
    }

    if (entry.count >= max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      throw new HTTPException(429, {
        message,
        res: new Response(JSON.stringify({ error: message }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(max),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(entry.resetTime / 1000))
          }
        })
      })
    }

    c.header('X-RateLimit-Limit', String(max))
    c.header('X-RateLimit-Remaining', String(Math.max(0, max - entry.count - 1)))
    c.header('X-RateLimit-Reset', String(Math.ceil(entry.resetTime / 1000)))

    await next()

    // Only count this attempt if it should count toward the limit
    if (shouldCount(c)) {
      entry.count++
    }
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

/**
 * Rate limiter specifically for signup attempts, ignoring certain error responses
 */
export const signupRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many signup attempts, please try again after 15 minutes.',
  keyPrefix: 'signup',
  shouldCount: c => c.res.status !== 400 && c.res.status !== 422
})
