import jwt from 'jsonwebtoken'
import ApiError from '../utils/ApiError.js'

export const authGuard = (req, _res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Unauthorized: missing token'))
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (_error) {
    next(new ApiError(401, 'Unauthorized: invalid token'))
  }
}