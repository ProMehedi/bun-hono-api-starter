import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'

const logsDir = path.join(process.cwd(), 'logs')
const auditDir = path.join(logsDir, '.audit') // Store audit files in a subdirectory
const isDev = process.env.NODE_ENV !== 'production'
const logLevel = process.env.LOG_LEVEL || (isDev ? 'debug' : 'info')

// Control logging destination: 'console' | 'file' | 'both' | 'auto' (default)
// 'auto' = console in dev, file in production
// 'console' = console only (regardless of environment)
// 'file' = file only (regardless of environment)
// 'both' = console + file (regardless of environment)
const logDestination = (process.env.LOG_TO_FILE || 'both').toLowerCase() as 'console' | 'file' | 'both' | 'auto'
const useConsole = logDestination === 'console' || logDestination === 'both' || (logDestination === 'auto' && isDev)
const useFile = logDestination === 'file' || logDestination === 'both' || (logDestination === 'auto' && !isDev)

// Custom format with structured JSON for production
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// Human-readable format for development
const prettyFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : ''
    return `${timestamp} ${level}: ${stack || message}${metaStr}`
  })
)

// Create transports based on environment and LOG_TO_FILE setting
const getTransports = (): winston.transport[] => {
  const transports: winston.transport[] = []

  // Console transport (pretty format for readability)
  if (useConsole) {
    transports.push(
      new winston.transports.Console({
        format: prettyFormat
      })
    )
  }

  // File transports (JSON format for structured logging)
  if (useFile) {
    // App logs (info, warn, error) - main operational logs
    transports.push(
      new DailyRotateFile({
        filename: path.join(logsDir, 'app-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '50m',
        maxFiles: '14d',
        format: jsonFormat,
        level: 'info', // Only info and above (info, warn, error)
        auditFile: path.join(auditDir, 'app-audit.json') // Store audit file in subdirectory
      })
    )

    // Error logs only - critical issues
    transports.push(
      new DailyRotateFile({
        filename: path.join(logsDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
        format: jsonFormat,
        level: 'error', // Only errors
        auditFile: path.join(auditDir, 'error-audit.json') // Store audit file in subdirectory
      })
    )

    // Optional: Debug logs for troubleshooting (if LOG_LEVEL=debug)
    if (logLevel === 'debug') {
      transports.push(
        new DailyRotateFile({
          filename: path.join(logsDir, 'debug-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '100m',
          maxFiles: '3d', // Short retention for verbose logs
          format: jsonFormat,
          level: 'debug',
          auditFile: path.join(auditDir, 'debug-audit.json') // Store audit file in subdirectory
        })
      )
    }
  }

  return transports
}

// Create the logger
export const logger = winston.createLogger({
  level: logLevel,
  transports: getTransports(),

  // Handle uncaught exceptions and unhandled rejections (only when using file logging)
  exceptionHandlers: useFile
    ? [
        new DailyRotateFile({
          filename: path.join(logsDir, 'exceptions-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
          format: jsonFormat,
          auditFile: path.join(auditDir, 'exceptions-audit.json') // Store audit file in subdirectory
        })
      ]
    : [],

  rejectionHandlers: useFile
    ? [
        new DailyRotateFile({
          filename: path.join(logsDir, 'rejections-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
          format: jsonFormat,
          auditFile: path.join(auditDir, 'rejections-audit.json') // Store audit file in subdirectory
        })
      ]
    : [],

  // Exit on handled exceptions in production
  exitOnError: !isDev
})

// Add request ID and other context helpers
export const createContextLogger = (context: Record<string, any>) => {
  return {
    error: (message: string, meta?: any) => logger.error(message, { ...context, ...meta }),
    warn: (message: string, meta?: any) => logger.warn(message, { ...context, ...meta }),
    info: (message: string, meta?: any) => logger.info(message, { ...context, ...meta }),
    debug: (message: string, meta?: any) => logger.debug(message, { ...context, ...meta })
  }
}

// Log startup info
logger.info('Logger initialized', {
  environment: process.env.NODE_ENV,
  logLevel,
  logDestination,
  console: useConsole,
  file: useFile,
  logsDir: useFile ? logsDir : 'console only'
})
