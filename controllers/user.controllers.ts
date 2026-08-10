import { and, count, desc, eq, ne } from 'drizzle-orm'
import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
//
import { db } from '~/config'
import { users } from '~/config/db/schema'
import { genToken, hashPassword, validateEmail, validatePassword, verifyPassword } from '~/utils'

/**
 * @api {get} /users Get All Users
 * @apiGroup Users
 * @access Private
 */
export const getUsers = async (c: Context) => {
  const [usersData, countRes] = await Promise.all([
    db.query.users.findMany({
      columns: { password: false },
      orderBy: [desc(users.createdAt)],
      limit: 100
    }),
    db.select({ total: count() }).from(users)
  ])

  return c.json({
    success: true,
    status: 200,
    data: usersData,
    count: countRes[0]?.total ?? 0,
    message: 'Users fetched successfully'
  })
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
      message: 'Please provide name, email, and password'
    })
  }

  // Validate email format
  if (!validateEmail(email)) {
    throw new HTTPException(400, { message: 'Please provide a valid email' })
  }

  // Validate password strength
  if (!validatePassword(password)) {
    throw new HTTPException(400, {
      message:
        'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character'
    })
  }

  // Check for existing user
  const userExists = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email.toLowerCase().trim())
  })
  if (userExists) {
    throw new HTTPException(400, { message: 'User already exists' })
  }

  // Create new user
  const [user] = await db
    .insert(users)
    .values({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: await hashPassword(password), // Hash the password before storing
      isAdmin: false // Always false for public registration
    })
    .returning()

  if (!user) {
    throw new HTTPException(400, { message: 'Invalid user data' })
  }

  const token = await genToken(user.id.toString())

  return c.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token
    },
    message: 'User created successfully'
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
      message: 'Please provide an email and password'
    })
  }

  // const user = await User.findOne({ email: email.toLowerCase().trim() })
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email.toLowerCase().trim())
  })
  if (!user) {
    throw new HTTPException(401, { message: 'No user found with this email' })
  }

  if (!(await verifyPassword(password, user.password))) {
    throw new HTTPException(401, { message: 'Invalid credentials' })
  }

  const token = await genToken(user.id.toString())

  return c.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token
    },
    message: 'User logged in successfully'
  })
}

/**
 * @api {get} /users/:id Get Single User
 * @apiGroup Users
 * @access Private
 */
export const getUserById = async (c: Context) => {
  const userId = c.req.param('id')

  if (!userId) throw new HTTPException(400, { message: 'User ID is required' })

  const user = await db.query.users.findFirst({
    columns: { password: false },
    where: (users, { eq }) => eq(users.id, userId)
  })

  if (!user) throw new HTTPException(404, { message: 'User not found' })

  return c.json({
    success: true,
    status: 200,
    data: user,
    message: 'User fetched successfully'
  })
}

/**
 * @api {get} /users/profile Get User Profile
 * @apiGroup Users
 * @access Private
 */
export const getProfile = async (c: Context) => {
  const user = c.get('user')

  return c.json({ user })
}

/**
 * @api {put} /users/profile Edit User Profile
 * @apiGroup Users
 * @access Private
 */
export const editProfile = async (c: Context) => {
  const user = c.get('user')
  const { name, email, password } = await c.req.json()

  // Validate email format if provided
  if (email) {
    if (!validateEmail(email)) {
      throw new HTTPException(400, { message: 'Please provide a valid email' })
    }

    // Check if email is already taken by another user
    const existingUser = await db.query.users.findFirst({
      where: and(eq(users.email, email), ne(users.id, user.id)),
      columns: { id: true }
    })
    if (existingUser) throw new HTTPException(400, { message: 'Email already in use' })
  }

  // Validate password if provided
  if (password) {
    if (!validatePassword(password)) {
      throw new HTTPException(400, {
        message:
          'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character'
      })
    }
  }

  const updateValues = {
    ...(name ? { name } : {}),
    ...(email ? { email } : {}),
    ...(password ? { password: await hashPassword(password) } : {}),
    updatedAt: new Date()
  }

  if (Object.keys(updateValues).length === 1) {
    throw new HTTPException(400, { message: 'No valid fields provided for update' })
  }

  let updated
  try {
    ;[updated] = await db.update(users).set(updateValues).where(eq(users.id, user.id)).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      isAdmin: users.isAdmin
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (/unique/i.test(message)) {
      throw new HTTPException(409, { message: 'Email already in use' })
    }
    throw err
  }

  if (!updated) {
    throw new HTTPException(404, { message: 'User not found' })
  }

  // Return user without password
  return c.json({
    success: true,
    data: updated,
    status: 200,
    message: 'Profile updated successfully'
  })
}
