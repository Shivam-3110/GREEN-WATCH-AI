export const errorHandler = (err, _req, res, _next) => {
  const isMongoDuplicateError = err?.code === 11000
  const statusCode = isMongoDuplicateError ? 409 : err.statusCode || 500
  const message = isMongoDuplicateError ? 'Duplicate resource already exists' : err.message || 'Internal server error'

  if (process.env.NODE_ENV !== 'production') {
    console.error(err)
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  })
}
