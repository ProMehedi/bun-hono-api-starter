export const MONGO_URI = process.env.MONGO_URI
export const isProd = process.env.NODE_ENV === 'production'
export const logLevel = process.env.LOG_LEVEL || (isProd ? 'info' : 'debug')
