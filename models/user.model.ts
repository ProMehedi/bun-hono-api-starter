import { Document, Schema, model, Types } from 'mongoose'

export interface IUser extends Document {
  _id: Types.ObjectId
  name: string
  email: string
  password: string
  isAdmin: boolean
  matchPassword: (pass: string) => Promise<boolean>
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, match: /.+\@.+\..+/ },
    password: { type: String, required: true, minlength: 6 },
    isAdmin: { type: Boolean, required: true, default: false }
  },
  { timestamps: true }
)

// Optimizes searches looking for specific names filtered by role
userSchema.index({ name: 1, isAdmin: 1 })

// enforces strict global uniqueness, but skips rows where the email is completely missing
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $exists: true, $type: 'string' } }, name: 'idx_unique_emails' }
)

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await Bun.password.verify(enteredPassword, this.password)
}

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return
  }
  this.password = await Bun.password.hash(this.password, {
    algorithm: 'bcrypt',
    cost: 10 // number between 4-31 [Higher is secure but slower]
  })
})

const User = model<IUser>('User', userSchema)
export default User
