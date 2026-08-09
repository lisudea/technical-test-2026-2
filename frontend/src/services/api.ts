import axios from 'axios'
import type { ApiError } from '../types/api'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data) {
      const apiError = error.response.data as ApiError
      return Promise.reject(apiError)
    }
    if (error.code === 'ERR_NETWORK') {
      return Promise.reject({
        status: 0,
        error: 'Network Error',
        message: 'Unable to connect to the server. Please check your connection.',
      } as ApiError)
    }
    return Promise.reject({
      status: 500,
      error: 'Error',
      message: 'An unexpected error occurred.',
    } as ApiError)
  },
)

export default api
