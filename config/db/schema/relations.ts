import { relations } from 'drizzle-orm'
import { users } from './user.schema'

export const useRelations = relations(users, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [users.createdById],
    references: [users.id],
    relationName: 'created_users'
  }),

  updatedBy: one(users, {
    fields: [users.updatedById],
    references: [users.id],
    relationName: 'updated_users'
  }),

  createdUsers: many(users, {
    relationName: 'created_users'
  }),

  updatedUsers: many(users, {
    relationName: 'updated_users'
  })
}))
