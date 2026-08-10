export const MONGO_URI = process.env.MONGO_URI
export const DATABASE_URL = process.env.DATABASE_URL
export const isProd = process.env.NODE_ENV === 'production'
export const logLevel = process.env.LOG_LEVEL || (isProd ? 'info' : 'debug')
