import { UserDTO } from './user.js'

/**
 * Equivalente al DTO del backend: com.udea.labreservas.dto.ApiError
 */
export class ApiErrorDTO extends Error {
  constructor({ status, message, path, timestamp, error, data }) {
    super(message || 'Error desconocido')
    this.name = 'ApiErrorDTO'
    this.status = status ?? 0
    this.error = error ?? ''
    this.path = path ?? ''
    this.timestamp = timestamp ?? null
    this.data = data ?? null
  }

  static fromJson(json) {
    return new ApiErrorDTO({
      status: json?.status,
      error: json?.error,
      message: json?.message,
      path: json?.path,
      timestamp: json?.timestamp,
    })
  }

  get isUnauthorized() {
    return this.status === 401
  }

  get isForbidden() {
    return this.status === 403
  }

  get isConflict() {
    return this.status === 409
  }
}

/**
 * Equivalente al DTO del backend: com.udea.labreservas.dto.AuthResponse
 */
export class AuthResponseDTO {
  constructor({ token, tokenType, user }) {
    this.token = token ?? ''
    this.tokenType = tokenType ?? 'Bearer'
    this.user = user ?? null
  }

  static fromJson(json) {
    return new AuthResponseDTO({
      token: json?.token,
      tokenType: json?.tokenType,
      user: json?.user ? UserDTO.fromJson(json.user) : null,
    })
  }
}