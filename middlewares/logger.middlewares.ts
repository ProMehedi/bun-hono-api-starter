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

  // Log request details
  logger.info('HTTP Request', {
    method,
    path,
    url,
    status,
    duration: `${duration}ms`,
    userAgent: c.req.header('user-agent'),
    ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  })
}
