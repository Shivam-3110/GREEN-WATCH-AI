import apiClient from './apiClient'
import { saveAuthSession } from '../utils/authStorage'

const normalizeAuthResponse = (response) => {
  const authData = response.data?.data

  if (authData?.token && authData?.user) {
    saveAuthSession(authData)
  }

  return authData
}

export const registerUser = async (payload) => {
  const response = await apiClient.post('/auth/register', payload)
  return normalizeAuthResponse(response)
}

export const loginUser = async (payload) => {
  const response = await apiClient.post('/auth/login', payload)
  return normalizeAuthResponse(response)
}

export const getUserProfile = async () => {
  const response = await apiClient.get('/auth/profile')
  return response.data?.data
}
