import { Navigate } from 'react-router-dom'
import { getAuthToken } from '../utils/authStorage'

function PublicOnlyRoute({ children }) {
  return getAuthToken() ? <Navigate to="/dashboard" replace /> : children
}

export default PublicOnlyRoute
