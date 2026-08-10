import { AnyPgColumn, boolean, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  isAdmin: boolean('is_admin').notNull().default(false),

  createdById: uuid('created_by_id').references((): AnyPgColumn => users.id),
  updatedById: uuid('updated_by_id').references((): AnyPgColumn => users.id),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})
