import { verify } from 'hono/jwt'
import { Context, Next } from 'hono'
import { JWTPayload } from 'hono/utils/jwt/types'
import { HTTPException } from 'hono/http-exception'
//
import { db, JWT_SECRET } from '~/config'
import { logger } from '~/utils'

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

export interface AppJwtPayload extends JWTPayload {
  id: string
}

// Protect Route for Authenticated Users
export const protect = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Not authorized! No token provided!' })
  }

  const token = authHeader.replace(/^Bearer\s+/i, '')

  let payload: AppJwtPayload
  try {
    payload = (await verify(token, JWT_SECRET!, 'HS256')) as AppJwtPayload
  } catch (err: unknown) {
    logger.warn(`JWT verification failed: ${err instanceof Error ? err.message : String(err)}`)
    throw new HTTPException(401, { message: 'Invalid or expired token' })
  }

  if (!payload.id) {
    throw new HTTPException(401, { message: 'Invalid token payload' })
  }

  let user
  try {
    user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, payload.id!),
      columns: { password: false }
    })
  } catch (err: unknown) {
    logger.error(`Database error during auth: ${err instanceof Error ? err.message : String(err)}`)
    throw new HTTPException(500, { message: 'Something went wrong, please try again' })
  }

  if (!user) {
    throw new HTTPException(401, { message: 'User not found' })
  }

  c.set('user', user)
  await next()
}

// Check if user is admin
export const isAdmin = async (c: Context, next: Next) => {
  const user = c.get('user')

  if (!user) {
    throw new HTTPException(401, {
      message: 'Not authorized! No user context!'
    })
  }

  if (user.isAdmin) {
    await next()
  } else {
    throw new HTTPException(403, { message: 'Not authorized as an admin!' }) // 403 for permission denied
  }
}
