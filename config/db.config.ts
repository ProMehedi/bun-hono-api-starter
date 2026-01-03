import * as mongoose from 'mongoose'

const DB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI
    if (!mongoUri) {
      throw new Error('Missing MONGO_URI in environment variables')
    }

    const conn = await mongoose.connect(mongoUri, {
      autoIndex: process.env.NODE_ENV !== 'production', // Disable auto-indexing in production
    })

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`❌ MongoDB Connection Error: ${message}`)
    process.exit(1) // Exit on failure
  }
}

export default DB
