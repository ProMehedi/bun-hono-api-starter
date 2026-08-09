import pino from 'pino'
import pretty from 'pino-pretty'
import { join } from 'path'

const isDev = process.env.NODE_ENV !== 'production'
const logLevel = process.env.LOG_LEVEL || (isDev ? 'debug' : 'info')

function getLogFileName(): string {
  const date = new Date()
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
  const year = date.getUTCFullYear()
  return `app-${day}-${month}-${year}.log` // app-03-Sep-2025.log
}

const destination = isDev
  ? pretty({
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: "UTC:hh:MM:ss TT 'UTC'",
      messageFormat: '{msg} - {status} ({duration}ms)'
    })
  : pino.destination({ dest: join('logs', getLogFileName()), mkdir: true })

export const logger = pino(
  {
    level: logLevel,
    base: { env: process.env.NODE_ENV },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: label => ({ level: label })
    },
    redact: {
      paths: ['req.headers.authorization', 'password', '*.password', 'token', '*.token'],
      censor: '[REDACTED]'
    }
  },
  destination
)

export type Logger = typeof logger

export const createContextLogger = (context: Record<string, unknown>) => {
  return logger.child(context)
}
