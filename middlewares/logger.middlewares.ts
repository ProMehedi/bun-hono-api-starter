import type { Context, MiddlewareHandler } from 'hono'
import { logger } from '~/utils'

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

export const loggerMiddleware: MiddlewareHandler = async (c, next) => {
  const start = Date.now()
  const { method } = c.req
  const path = c.req.path
  const url = c.req.url

  let status = 500 // fallback if next() throws before c.res is set

  try {
    await next()
    status = c.res.status
  } finally {
    const duration = Date.now() - start

    const logData = {
      method,
      path,
      url,
      status,
      duration, // numeric, ms
      userAgent: c.req.header('user-agent'),
      ip: getClientIp(c),
      requestId: c.req.header('x-request-id')
    }

    if (status >= 500) {
      logger.error(logData, 'HTTP Request')
    } else if (status >= 400) {
      logger.warn(logData, 'HTTP Request')
    } else {
      logger.info(logData, 'HTTP Request')
    }
  }
}
