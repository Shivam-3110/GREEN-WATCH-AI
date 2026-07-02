import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getAuthToken, clearAuthSession } from '../utils/authStorage'
import apiClient from '../services/apiClient'

function ProtectedRoute({ children }) {
  const token = getAuthToken()
  const [valid, setValid] = useState(null) // null = checking

  useEffect(() => {
    if (!token) return setValid(false)

    apiClient.get('/protected/ping')
      .then(() => setValid(true))
      .catch(() => {
        clearAuthSession()
        setValid(false)
      })
  }, [token])

  if (!token) return <Navigate to="/login" replace />
  if (valid === null) return null // loading
  if (!valid) return <Navigate to="/login" replace />

  return children
}

export default ProtectedRoute
