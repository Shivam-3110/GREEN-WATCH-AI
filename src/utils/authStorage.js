const TOKEN_KEY = 'ecosphere_token'
const USER_KEY = 'ecosphere_user'

export const saveAuthSession = ({ token, user }) => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY)

export const getStoredUser = () => {
  const storedUser = localStorage.getItem(USER_KEY)
  return storedUser ? JSON.parse(storedUser) : null
}

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
