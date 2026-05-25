const emailRegex = /^\S+@\S+\.\S+$/

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '')

export const validateRegisterInput = (payload) => {
  const name = normalizeString(payload?.name)
  const email = normalizeString(payload?.email).toLowerCase()
  const password = normalizeString(payload?.password)

  if (!name || !email || !password) {
    return { isValid: false, message: 'Name, email, and password are required' }
  }

  if (name.length < 2 || name.length > 100) {
    return { isValid: false, message: 'Name must be between 2 and 100 characters' }
  }

  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Invalid email format' }
  }

  if (password.length < 6 || password.length > 72) {
    return { isValid: false, message: 'Password must be between 6 and 72 characters' }
  }

  return {
    isValid: true,
    value: { name, email, password },
  }
}

export const validateLoginInput = (payload) => {
  const email = normalizeString(payload?.email).toLowerCase()
  const password = normalizeString(payload?.password)

  if (!email || !password) {
    return { isValid: false, message: 'Email and password are required' }
  }

  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Invalid email format' }
  }

  if (password.length < 6 || password.length > 72) {
    return { isValid: false, message: 'Password must be between 6 and 72 characters' }
  }

  return {
    isValid: true,
    value: { email, password },
  }
}