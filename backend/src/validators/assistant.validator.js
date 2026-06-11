export const validateChatMessage = (req, _res, next) => {
  const errors = []

  if (!req.body.message) {
    errors.push('Message is required')
  } else if (typeof req.body.message !== 'string') {
    errors.push('Message must be a string')
  } else if (req.body.message.trim().length === 0) {
    errors.push('Message cannot be empty')
  } else if (req.body.message.length > 1000) {
    errors.push('Message exceeds maximum length of 1000 characters')
  }

  if (
    req.body.conversationHistory &&
    !Array.isArray(req.body.conversationHistory)
  ) {
    errors.push('Conversation history must be an array')
  }

  if (errors.length > 0) {
    return next({
      statusCode: 400,
      message: 'Validation failed',
      errors,
    })
  }

  next()
}

export const validateActivitiesData = (req, _res, next) => {
  const errors = []

  if (!req.body.activities) {
    errors.push('Activities data is required')
  } else if (typeof req.body.activities !== 'object') {
    errors.push('Activities must be an object')
  }

  if (errors.length > 0) {
    return next({
      statusCode: 400,
      message: 'Validation failed',
      errors,
    })
  }

  next()
}

export const validatePollutionData = (req, _res, next) => {
  const errors = []

  if (!req.body.pollutionData) {
    errors.push('Pollution data is required')
  } else if (typeof req.body.pollutionData !== 'object') {
    errors.push('Pollution data must be an object')
  }

  if (errors.length > 0) {
    return next({
      statusCode: 400,
      message: 'Validation failed',
      errors,
    })
  }

  next()
}
