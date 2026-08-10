import { EquipmentStatus } from './enums.js'
import { CategoryDTO } from './category.js'

/**
 * Equivalente al DTO del backend: com.udea.labreservas.dto.EquipmentDTO
 */
export class EquipmentDTO {
  constructor({ equipmentId, equipmentName, macNumber, status, categoryId, categoryName }) {
    this.equipmentId = equipmentId ?? null
    this.equipmentName = equipmentName ?? ''
    this.macNumber = macNumber ?? ''
    this.status = status ?? EquipmentStatus.DISPONIBLE
    this.categoryId = categoryId ?? null
    this.categoryName = categoryName ?? ''
  }

  static fromJson(json) {
    return new EquipmentDTO({
      equipmentId: json?.equipmentId,
      equipmentName: json?.equipmentName,
      macNumber: json?.macNumber,
      status: json?.status,
      categoryId: json?.categoryId,
      categoryName: json?.categoryName,
    })
  }

  get isReservable() {
    return this.status !== EquipmentStatus.EN_MANTENIMIENTO
  }
}

/**
 * Equivalente al DTO del backend: com.udea.labreservas.dto.CreateEquipmentDTO
 */
export class CreateEquipmentDTO {
  constructor({ equipmentName, macNumber, status, categoryId }) {
    this.equipmentName = equipmentName ?? ''
    this.macNumber = macNumber ?? ''
    this.status = status ?? EquipmentStatus.DISPONIBLE
    this.categoryId = categoryId ?? null
  }

  toJson() {
    return {
      equipmentName: this.equipmentName,
      macNumber: this.macNumber,
      status: this.status,
      categoryId: this.categoryId,
    }
  }
}

/**
 * Equivalente al DTO del backend: com.udea.labreservas.dto.UpdateEquipmentDTO
 */
export class UpdateEquipmentDTO {
  constructor({ equipmentName, macNumber, status, categoryId }) {
    this.equipmentName = equipmentName ?? null
    this.macNumber = macNumber ?? null
    this.status = status ?? null
    this.categoryId = categoryId ?? null
  }

  toJson() {
    return {
      equipmentName: this.equipmentName,
      macNumber: this.macNumber,
      status: this.status,
      categoryId: this.categoryId,
    }
  }
}

export { CategoryDTO }