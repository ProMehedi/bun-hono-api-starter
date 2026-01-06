import type { MiddlewareHandler } from 'hono'
import { logger } from '~/utils'

export const loggerMiddleware: MiddlewareHandler = async (c, next) => {
  const start = Date.now()
  const method = c.req.method
  const path = c.req.path
  const url = c.req.url

  await next()

  const end = Date.now()
  const duration = end - start
  const status = c.res.status

  // Extract client IP (consistent with rate limiter logic)
  // x-forwarded-for can contain multiple IPs (comma-separated), extract the first one
  const getClientIp = (): string => {
    const cfIp = c.req.header('cf-connecting-ip')
    if (cfIp) return cfIp

    const forwardedFor = c.req.header('x-forwarded-for')
    if (forwardedFor) {
      // Extract first IP from comma-separated list and trim whitespace
      return forwardedFor.split(',')[0]?.trim() || 'unknown'
    }

    const realIp = c.req.header('x-real-ip')
    if (realIp) return realIp

    return 'unknown'
  }

  // Log request details
  logger.info('HTTP Request', {
    method,
    path,
    url,
    status,
    duration: `${duration}ms`,
    userAgent: c.req.header('user-agent'),
    ip: getClientIp()
  })
}
