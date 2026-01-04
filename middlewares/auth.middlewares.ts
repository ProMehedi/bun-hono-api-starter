import { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { verify } from 'hono/jwt'
import { User, IUser } from '~/models'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

// Protect Route for Authenticated Users
export const protect = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, {
      message: 'Not authorized! No token provided!'
    })
  }

  const token = authHeader.replace(/^Bearer\s+/i, '')

  try {
    const payload = await verify(token, JWT_SECRET)

    if (!payload.id) {
      throw new HTTPException(401, { message: 'Invalid token payload!' })
    }

    // Check token expiration (handled by verify, but double-check)
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new HTTPException(401, { message: 'Token has expired!' })
    }

    const user = await User.findById(payload.id).select('-password')
    if (!user) {
      throw new HTTPException(401, { message: 'User not found!' })
    }

    // Type-safe user assignment
    c.set('user', user as IUser)
    await next()
  } catch (err) {
    if (err instanceof HTTPException) {
      throw err
    }
    throw new HTTPException(401, { message: 'Invalid token! Not authorized!' })
  }
}

// Check if user is admin
export const isAdmin = async (c: Context, next: Next) => {
  const user = c.get('user') as IUser | undefined

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
