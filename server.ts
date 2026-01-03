import '~/config/compress.config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { compress } from 'hono/compress'
import { secureHeaders } from 'hono/secure-headers'
import { csrf } from 'hono/csrf'
//
import { DB } from './config'
import { Users } from '~/routes'
import { errorHandler, notFound, standardRateLimit } from '~/middlewares'
import { ApiDoc } from '~/components/ApiDoc'

// Environment configuration
const isProduction = process.env.NODE_ENV === 'production'
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:8000',
]

// Initialize the Hono app with base path
const app = new Hono({ strict: false }).basePath('/api/v1')

// Config MongoDB - Only connect if not in Cloudflare Workers environment
if (typeof process !== 'undefined') {
  DB()
}

// Logger middleware (disable in production for performance if needed)
if (!isProduction) {
  app.use(logger())
}

// Secure Headers middleware - protects against XSS, clickjacking, etc.
app.use(
  secureHeaders({
    xFrameOptions: 'DENY',
    xXssProtection: '1; mode=block',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    contentSecurityPolicy: isProduction
      ? {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        }
      : undefined,
  })
)

// CSRF Protection for state-changing requests (only in production)
if (isProduction) {
  app.use(
    csrf({
      origin: allowedOrigins,
    })
  )
}

// Rate limiting - apply globally
app.use(standardRateLimit)

// Compress middleware
app.use(
  compress({
    encoding: 'gzip',
    threshold: 1024, // Minimum size to compress (1KB)
  })
)

// CORS configuration
app.use(
  '*',
  cors({
    origin: isProduction ? allowedOrigins : '*', // Restrict in production
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // Cache preflight for 1 day
  })
)

// Home Route with API Documentation [FOR DEMO PURPOSES]
app.get('/', (c) => {
  const apiRoutes = [
    {
      method: 'GET',
      path: '/api/v1',
      description: 'API Documentation',
      auth: false,
      admin: false,
    },
    {
      method: 'POST',
      path: '/api/v1/users',
      description: 'Create a new user',
      auth: false,
      admin: false,
    },
    {
      method: 'POST',
      path: '/api/v1/users/login',
      description: 'User login',
      auth: false,
      admin: false,
    },
    {
      method: 'GET',
      path: '/api/v1/users/profile',
      description: 'Get user profile',
      auth: true,
      admin: false,
    },
    {
      method: 'PUT',
      path: '/api/v1/users/profile',
      description: 'Update user profile',
      auth: true,
      admin: false,
    },
    {
      method: 'GET',
      path: '/api/v1/users',
      description: 'Get all users',
      auth: true,
      admin: true,
    },
    {
      method: 'GET',
      path: '/api/v1/users/:id',
      description: 'Get user by ID',
      auth: true,
      admin: true,
    },
  ]

  return c.html(
    ApiDoc({
      title: 'Bun + Hono API Starter',
      version: '1.0.2',
      routes: apiRoutes,
    })
  )
})

// User Routes
app.route('/users', Users)

// Error Handler (improved to use err)
app.onError(errorHandler)

// Not Found Handler (standardized response)
app.notFound(notFound)

// Determine the environment
const port = process.env?.PORT || 8000

// Export for both Bun and Cloudflare Workers
export default {
  port,
  fetch: app.fetch,
}
