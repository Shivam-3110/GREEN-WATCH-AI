import ApiError from '../utils/ApiError.js'

export const validate = (validator) => (req, _res, next) => {
  const result = validator(req.body)

  if (!result.isValid) {
    return next(new ApiError(400, result.message))
  }

  req.body = result.value
  next()
}