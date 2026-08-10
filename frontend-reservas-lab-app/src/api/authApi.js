import { httpRequest } from './client.js'
import { AuthResponseDTO } from '../models/api-error.js'
import { UserDTO, LoginRequest, RegisterUserRequest } from '../models/user.js'

const BASE = '/auth'

/**
 * POST /api/auth/register
 */
export async function registerUser(payload) {
  const body = payload instanceof RegisterUserRequest ? payload.toJson() : payload
  const json = await httpRequest(`${BASE}/register`, {
    method: 'POST',
    body,
    skipAuth: true,
  })
  return AuthResponseDTO.fromJson(json)
}

/**
 * POST /api/auth/login
 */
export async function login({ email, password }) {
  const body = new LoginRequest({ email, password }).toJson()
  const json = await httpRequest(`${BASE}/login`, {
    method: 'POST',
    body,
    skipAuth: true,
  })
  return AuthResponseDTO.fromJson(json)
}

/**
 * POST /api/auth/google
 * El backend espera unicamente el idToken de Google como cuerpo en texto plano.
 */
export async function loginWithGoogle(googleIdToken) {
  const json = await httpRequest(`${BASE}/google`, {
    method: 'POST',
    rawBody: googleIdToken,
    skipAuth: true,
  })
  return AuthResponseDTO.fromJson(json)
}

/**
 * GET /api/auth/me
 */
export async function fetchProfile() {
  const json = await httpRequest(`${BASE}/me`)
  return UserDTO.fromJson(json)
}