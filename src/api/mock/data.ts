import type { Equipment, Reservation } from '../../types/api'

/**
 * Catalogo de demostracion.
 *
 * Es una copia EXACTA de lo que siembra el DataSeeder del backend: los mismos
 * 15 equipos, con los mismos numeros de serie, categorias y estados, y las
 * mismas 6 reservas. Asi la interfaz se ve igual con API o sin ella, y una
 * captura tomada en modo demostracion no contradice a la aplicacion real.
 *
 * Si se cambia el catalogo en DataSeeder.java, hay que reflejarlo aqui.
 */

function isoAt(daysFromNow: number, hour: number, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hour, minute, 0, 0)

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

const now = new Date().toISOString().slice(0, 19)

function equipment(
  id: number,
  name: string,
  serialNumber: string,
  category: Equipment['category'],
  status: Equipment['status'],
): Equipment {
  return { id, name, serialNumber, category, status, createdAt: now, updatedAt: now }
}

export const DEMO_EQUIPMENT: Equipment[] = [
  // Microcontroladores (6)
  equipment(1, 'Arduino Uno R3', 'MCU-ARD-0001', 'MICROCONTROLLERS', 'AVAILABLE'),
  equipment(2, 'Arduino Mega 2560', 'MCU-ARD-0002', 'MICROCONTROLLERS', 'AVAILABLE'),
  equipment(3, 'ESP32 DevKit v1', 'MCU-ESP-0003', 'MICROCONTROLLERS', 'RESERVED'),
  equipment(4, 'Raspberry Pi 4 Model B', 'MCU-RPI-0004', 'MICROCONTROLLERS', 'MAINTENANCE'),
  equipment(5, 'STM32 Nucleo F401RE', 'MCU-STM-0005', 'MICROCONTROLLERS', 'AVAILABLE'),
  equipment(13, 'Raspberry Pi Pico W', 'MCU-RPP-0013', 'MICROCONTROLLERS', 'AVAILABLE'),

  // Realidad virtual (5)
  equipment(6, 'Meta Quest 3', 'VR-MQ3-0006', 'VR', 'AVAILABLE'),
  equipment(7, 'HTC Vive Pro 2', 'VR-HTC-0007', 'VR', 'RESERVED'),
  equipment(8, 'Valve Index', 'VR-VAL-0008', 'VR', 'AVAILABLE'),
  equipment(9, 'Leap Motion Controller', 'VR-LMC-0009', 'VR', 'MAINTENANCE'),
  equipment(14, 'HP Reverb G2', 'VR-HPR-0014', 'VR', 'AVAILABLE'),

  // Redes (4)
  equipment(10, 'Cisco Catalyst 2960', 'NET-CIS-0010', 'NETWORKS', 'AVAILABLE'),
  equipment(11, 'Router Mikrotik hEX S', 'NET-MKT-0011', 'NETWORKS', 'AVAILABLE'),
  equipment(12, 'Analizador de espectro WiFi', 'NET-WIF-0012', 'NETWORKS', 'RESERVED'),
  equipment(15, 'Access Point Ubiquiti UniFi 6', 'NET-UBI-0015', 'NETWORKS', 'AVAILABLE'),
]

const DEMO_USER = { id: 1, name: 'Usuario Demo LIS', email: 'demo.lis@udea.edu.co' }

function reservation(
  id: number,
  equipmentId: number,
  startTime: string,
  endTime: string,
): Reservation {
  const target = DEMO_EQUIPMENT.find((e) => e.id === equipmentId)!

  return {
    id,
    equipmentId,
    equipmentName: target.name,
    userId: DEMO_USER.id,
    userName: DEMO_USER.name,
    userEmail: DEMO_USER.email,
    startTime,
    endTime,
    status: 'ACTIVE',
    createdAt: now,
  }
}

export const DEMO_RESERVATIONS: Reservation[] = [
  reservation(1, 1, isoAt(1, 8), isoAt(1, 10)),
  reservation(2, 1, isoAt(1, 14), isoAt(1, 16)),
  reservation(3, 3, isoAt(1, 9), isoAt(1, 11)),
  reservation(4, 6, isoAt(1, 10), isoAt(1, 12)),
  reservation(5, 7, isoAt(2, 8), isoAt(2, 9, 30)),
  reservation(6, 12, isoAt(2, 11), isoAt(2, 13)),
]