import * as mongoose from 'mongoose'
import { MONGO_URI } from './constants'

export const connectDB = async (retries = 5, delay = 5000): Promise<void> => {
  if (!MONGO_URI) {
    console.error('❌ Missing MONGO_URI in environment variables')
    process.exit(1) // Keep this exit because a missing URI can never be fixed by retrying
  }

  try {
    const conn = await mongoose.connect(MONGO_URI, {
      autoIndex: process.env.NODE_ENV !== 'production',
      maxPoolSize: 10,
      minPoolSize: 2
    })
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'

    if (retries > 0) {
      console.warn(`⚠️ Connection failed: ${message}. Retrying in ${delay / 1000}s... (${retries} attempts left)`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return connectDB(retries - 1, delay) // Recursively retry
    }

    console.error(`❌ MongoDB Connection Error after multiple attempts: ${message}`)
    process.exit(1) // Only exit if all 5 retry attempts completely fail
  }
}
