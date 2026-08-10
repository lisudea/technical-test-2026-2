import { Role } from './enums.js'

/**
 * Equivalente al DTO del backend: com.udea.labreservas.dto.UserDTO
 */
export class UserDTO {
  constructor({ userId, name, lastName, email, role }) {
    this.userId = userId ?? null
    this.name = name ?? ''
    this.lastName = lastName ?? ''
    this.email = email ?? ''
    this.role = role ?? Role.USUARIO
  }

  static fromJson(json) {
    return new UserDTO({
      userId: json?.userId,
      name: json?.name,
      lastName: json?.lastName,
      email: json?.email,
      role: json?.role,
    })
  }

  get fullName() {
    return `${this.name} ${this.lastName}`.trim()
  }

  get isAdmin() {
    return this.role === Role.ADMINISTRADOR
  }
}

/**
 * Equivalente al DTO del backend: com.udea.labreservas.dto.RegisterUserRequest
 */
export class RegisterUserRequest {
  constructor({ name, lastName, email, password }) {
    this.name = name
    this.lastName = lastName
    this.email = email
    this.password = password
  }

  toJson() {
    return {
      name: this.name,
      lastName: this.lastName,
      email: this.email,
      password: this.password,
    }
  }
}

/**
 * Equivalente al DTO del backend: com.udea.labreservas.dto.LoginRequest
 */
export class LoginRequest {
  constructor({ email, password }) {
    this.email = email
    this.password = password
  }

  toJson() {
    return { email: this.email, password: this.password }
  }
}