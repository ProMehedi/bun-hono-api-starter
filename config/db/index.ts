import { Pool } from '@neondatabase/serverless'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-serverless'

import * as schema from '~/config/db/schema'
// import { relations } from '~/config/db/schema/relations'
import { DATABASE_URL, isProd } from '~/config'
import { logger } from '~/utils'

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set — cannot initialize the database connection.')
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: isProd ? 10 : 5, // cap connections; tune per deployment target (serverless vs long-running)
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000
})

// Idle-client errors are emitted asynchronously and will crash the process if unhandled.
pool.on('error', (err: Error) => {
  logger.error(`❌ Unexpected database pool error: ${getErrorMessage(err)}`)
})

export const db = drizzle({
  client: pool,
  schema,
  // relations,
  logger: !isProd
})

export type Database = typeof db

/**
 * Verifies connectivity and (optionally) required extensions.
 * Extension provisioning should ideally live in migrations, not app boot —
 * this is kept here as a defensive check for environments without a migration step.
 */
export async function initDB(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`)
    logger.info('✅ Database connection established')
  } catch (error: unknown) {
    const message = getErrorMessage(error)
    logger.error(`❌ Failed to connect to database: ${message}`)
    logger.error(`   DATABASE_URL: ${DATABASE_URL ? 'present' : 'missing'}`)
    throw new Error(`Database initialization failed: ${message}`, { cause: error })
  }

  await ensureUuidExtension()

  logger.info('✅ Database initialized successfully')
  return true
}

async function ensureUuidExtension(): Promise<void> {
  try {
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
    logger.info('✅ uuid-ossp extension verified')
  } catch (err: unknown) {
    const message = getErrorMessage(err)

    if (/already exists/i.test(message)) {
      logger.info('ℹ️  uuid-ossp extension already present')
      return
    }

    if (/permission denied/i.test(message)) {
      logger.warn(
        '⚠️  Insufficient permissions to create uuid-ossp extension. ' +
          'Verify it is already installed by your DB admin/migration — do not assume this is fine.'
      )
      return
    }

    // Unknown failure — don't swallow it silently.
    logger.error(`❌ Could not verify uuid-ossp extension: ${message}`)
    throw new Error(`uuid-ossp extension check failed: ${message}`, { cause: err })
  }
}

/** Call on process shutdown (SIGTERM/SIGINT) or in test teardown. */
export async function closeDB(): Promise<void> {
  try {
    await pool.end()
    logger.info('✅ Database pool closed')
  } catch (error: unknown) {
    logger.error(`❌ Error closing database pool: ${getErrorMessage(error)}`)
  }
}
