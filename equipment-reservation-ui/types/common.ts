/**
 * Generic Spring Data-style page wrapper returned by the backend
 * for any paginated `GET` collection endpoint.
 */
export interface Page<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

/**
 * Shape of the error body returned by the Spring Boot backend
 * for any 4xx/5xx response.
 */
export interface ApiErrorBody {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
}
