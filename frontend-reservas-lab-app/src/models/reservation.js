import { ReservationStatus } from './enums.js'

/**
 * Equivalente al DTO del backend: com.udea.labreservas.dto.ReservationDTO
 */
export class ReservationDTO {
  constructor({
    reservationId,
    userId,
    userName,
    userEmail,
    equipmentId,
    equipmentName,
    macNumber,
    startTime,
    endTime,
    status,
  }) {
    this.reservationId = reservationId ?? null
    this.userId = userId ?? null
    this.userName = userName ?? ''
    this.userEmail = userEmail ?? ''
    this.equipmentId = equipmentId ?? null
    this.equipmentName = equipmentName ?? ''
    this.macNumber = macNumber ?? ''
    this.startTime = startTime ?? null
    this.endTime = endTime ?? null
    this.status = status ?? ReservationStatus.CREADA
  }

  static fromJson(json) {
    return new ReservationDTO({
      reservationId: json?.reservationId,
      userId: json?.userId,
      userName: json?.userName,
      userEmail: json?.userEmail,
      equipmentId: json?.equipmentId,
      equipmentName: json?.equipmentName,
      macNumber: json?.macNumber,
      startTime: json?.startTime,
      endTime: json?.endTime,
      status: json?.status,
    })
  }

  get isActive() {
    return this.status === ReservationStatus.CREADA
  }

  get isCancellable() {
    return this.status === ReservationStatus.CREADA
  }
}

/**
 * Equivalente al DTO del backend: com.udea.labreservas.dto.CreateReservationDTO
 */
export class CreateReservationDTO {
  constructor({ equipmentId, startTime, endTime }) {
    this.equipmentId = equipmentId ?? null
    this.startTime = startTime ?? null
    this.endTime = endTime ?? null
  }

  toJson() {
    return {
      equipmentId: this.equipmentId,
      startTime: this.startTime,
      endTime: this.endTime,
    }
  }

  get isValidPeriod() {
    return this.startTime && this.endTime && this.startTime < this.endTime
  }
}