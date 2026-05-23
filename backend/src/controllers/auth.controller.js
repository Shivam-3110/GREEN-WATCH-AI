import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.model.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'

const signToken = (userId, email) => {
  return jwt.sign({ userId, email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email, and password are required')
  }

  const existingUser = await User.findOne({ email })
  if (existingUser) {
    throw new ApiError(409, 'User already exists')
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  })

  const token = signToken(user._id, user.email)

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    },
  })
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required')
  }

  const user = await User.findOne({ email }).select('+password')
  if (!user) {
    throw new ApiError(401, 'Invalid credentials')
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials')
  }

  const token = signToken(user._id, user.email)

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    },
  })
})

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId)

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  })
})