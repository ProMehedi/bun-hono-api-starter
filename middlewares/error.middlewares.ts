import type { ErrorHandler, NotFoundHandler } from 'hono'
import { ContentfulStatusCode } from 'hono/utils/http-status'
//
import { AppError } from '~/utils'

const isProduction = process.env.NODE_ENV === 'production'

export const errorHandler: ErrorHandler = (err, c) => {
  let statusCode: ContentfulStatusCode = 500

  // 1. Check if it's custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode as ContentfulStatusCode
  }
  // 2. Check if it's a native Hono/HTTP error (which uses err.status)
  else if ('status' in err && typeof err.status === 'number') {
    statusCode = err.status as ContentfulStatusCode
  }
  // 3. Fallback to existing response status if set, otherwise 500
  else if (c.res.status !== 200) {
    statusCode = c.res.status as ContentfulStatusCode
  }

  // Log detailed error in development
  if (!isProduction) {
    console.error('💥 Error caught in middleware:', err)
  }

  return c.json(
    {
      success: false,
      message: err?.message || 'Internal Server Error',
      // Include stack trace only when not in production
      ...(isProduction ? {} : { stack: err?.stack })
    },
    statusCode
  )
}

// Not Found Handler
export const notFound: NotFoundHandler = c => {
  return c.json(
    {
      success: false,
      message: `Not Found - [${c.req.method}]:[${c.req.path}]`
    },
    404
  )
}
