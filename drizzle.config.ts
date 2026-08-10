import { defineConfig } from 'drizzle-kit'

import { DATABASE_URL } from './config'

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set — drizzle-kit cannot run without it.')
}

export default defineConfig({
  schema: './config/db/schema/*.ts',
  out: './config/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: DATABASE_URL },
  casing: 'snake_case',
  verbose: true,
  strict: true
})
