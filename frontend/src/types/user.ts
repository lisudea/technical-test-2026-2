export interface User {
  id: number
  name: string
  email: string
  createdAt: string
}

export interface CreateUserRequest {
  name: string
  email: string
}
