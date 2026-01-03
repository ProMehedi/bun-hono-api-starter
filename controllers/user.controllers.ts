import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
//
import { genToken } from '~/utils'
import { IUser, User } from '~/models'

/**
 * @api {get} /users Get All Users
 * @apiGroup Users
 * @access Private
 */
export const getUsers = async (c: Context) => {
  const users = await User.find()

  return c.json({ users })
}

/**
 * @api {post} /users Create User
 * @apiGroup Users
 * @access Public
 */
export const createUser = async (c: Context) => {
  const { name, email, password } = await c.req.json()

  // Validate required fields
  if (!name || !email || !password) {
    throw new HTTPException(400, {
      message: 'Please provide name, email, and password',
    })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new HTTPException(400, { message: 'Please provide a valid email' })
  }

  // Validate password length
  if (password.length < 6) {
    throw new HTTPException(400, {
      message: 'Password must be at least 6 characters',
    })
  }

  // Check for existing user
  const userExists = await User.findOne({ email: email.toLowerCase().trim() })
  if (userExists) {
    throw new HTTPException(400, { message: 'User already exists' })
  }

  // SECURITY: Never allow isAdmin to be set from request body
  const user: IUser = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    isAdmin: false, // Always false for public registration
  })

  if (!user) {
    throw new HTTPException(400, { message: 'Invalid user data' })
  }

  const token = await genToken(user._id.toString())

  return c.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token,
    },
    message: 'User created successfully',
  })
}

/**
 * @api {post} /users/login Login User
 * @apiGroup Users
 * @access Public
 */
export const loginUser = async (c: Context) => {
  const { email, password } = await c.req.json()

  // Check for missing email or password
  if (!email || !password) {
    throw new HTTPException(400, {
      message: 'Please provide an email and password',
    })
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() })
  if (!user) {
    throw new HTTPException(401, { message: 'No user found with this email' })
  }

  // Fixed typo: 'mathPassword' -> 'matchPassword'
  if (!(await user.matchPassword(password))) {
    throw new HTTPException(401, { message: 'Invalid credentials' })
  }

  const token = await genToken(user._id.toString())

  return c.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token,
    },
    message: 'User logged in successfully',
  })
}

/**
 * @api {get} /users/:id Get Single User
 * @apiGroup Users
 * @access Private
 */
export const getUserById = async (c: Context) => {
  const user = await User.findById(c.req.param('id')).select('-password')

  if (!user) {
    throw new HTTPException(404, { message: 'User not found' })
  }

  return c.json({ user })
}

/**
 * @api {get} /users/profile Get User Profile
 * @apiGroup Users
 * @access Private
 */
export const getProfile = async (c: Context) => {
  const user = c.get('user') as IUser

  return c.json({ user })
}

/**
 * @api {put} /users/profile Edit User Profile
 * @apiGroup Users
 * @access Private
 */
export const editProfile = async (c: Context) => {
  const user = c.get('user') as IUser
  const { name, email, password } = await c.req.json()

  // Validate email format if provided
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new HTTPException(400, { message: 'Please provide a valid email' })
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
      _id: { $ne: user._id },
    })
    if (existingUser) {
      throw new HTTPException(400, { message: 'Email already in use' })
    }
    user.email = email.toLowerCase().trim()
  }

  // Validate password if provided
  if (password) {
    if (password.length < 6) {
      throw new HTTPException(400, {
        message: 'Password must be at least 6 characters',
      })
    }
    user.password = password
  }

  if (name) user.name = name.trim()

  await user.save()

  // Return user without password
  return c.json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    },
  })
}
