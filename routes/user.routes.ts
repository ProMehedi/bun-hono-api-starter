import { Hono } from 'hono'
//
import { getUsers, createUser, loginUser, getUserById, getProfile, editProfile } from '~/controllers'
import { isAdmin, protect, strictRateLimit } from '~/middlewares'

const users = new Hono()

// Get All Users (Admin only)
users.get('/', protect, isAdmin, getUsers)

// Create User - Apply strict rate limiting to prevent abuse
users.post('/', strictRateLimit, createUser)

// Login User - Apply strict rate limiting to prevent brute force
users.post('/login', strictRateLimit, loginUser)

// Get User Profile
users.get('/profile', protect, getProfile)

// Edit User Profile
users.put('/profile', protect, editProfile)

// Get Single User (Admin only)
users.get('/:id', protect, isAdmin, getUserById)

export default users
