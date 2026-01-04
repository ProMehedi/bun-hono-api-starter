import { sign } from 'hono/jwt'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

const genToken = async (id: string): Promise<string> => {
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    id,
    iat: now, // Issued at
    exp: now + 60 * 60 * 24 * 7 // Expires in 7 days
  }
  return await sign(payload, JWT_SECRET)
}

export default genToken
