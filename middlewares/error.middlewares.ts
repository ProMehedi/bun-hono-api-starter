import { ErrorHandler, NotFoundHandler } from 'hono'
import { ContentfulStatusCode, StatusCode } from 'hono/utils/http-status'

const isProduction = process.env.NODE_ENV === 'production'

// Error Handler
export const errorHandler: ErrorHandler = (err, c) => {
  const currentStatus =
    'status' in err ? err.status : c.newResponse(null).status

  const statusCode = currentStatus !== 200 ? (currentStatus as StatusCode) : 500

  // Log error in development
  if (!isProduction) {
    console.error('Error:', err)
  }

  return c.json(
    {
      success: false,
      message: err?.message || 'Internal Server Error',
      // Only show stack trace in development
      ...(isProduction ? {} : { stack: err?.stack }),
    },
    statusCode as ContentfulStatusCode
  )
}

// Not Found Handler
export const notFound: NotFoundHandler = (c) => {
  return c.json(
    {
      success: false,
      message: `Not Found - [${c.req.method}]:[${c.req.path}]`,
    },
    404
  )
}
