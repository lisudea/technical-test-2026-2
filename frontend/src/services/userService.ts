import api from './api'
import type { User, CreateUserRequest } from '../types/user'

export function createUser(data: CreateUserRequest) {
  return api.post<User>('/users', data)
}

export function getUserById(id: number) {
  return api.get<User>(`/users/${id}`)
}

export function getUserByEmail(email: string) {
  return api.get<User>('/users/by-email', { params: { email } })
}
