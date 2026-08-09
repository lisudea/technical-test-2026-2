import type {
  CategoryDto,
  EquipmentDto,
  LocationDto,
  OperationalStatusCode,
  ReservationDto,
  TopEquipmentDto,
  UserDto,
  VisualStatus,
} from "@/types";

export const categories: CategoryDto[] = [
  { id: 1, code: "MICROCONTROLADORES", name: "Microcontroladores" },
  { id: 2, code: "REALIDAD_VIRTUAL", name: "Realidad Virtual" },
  { id: 3, code: "REDES", name: "Redes" },
  { id: 4, code: "COMPUTO", name: "Cómputo" },
  { id: 5, code: "IOT", name: "IoT" },
];

export const locations: LocationDto[] = [
  { id: 1, code: "SALA_4", name: "Sala 4" },
  { id: 2, code: "SALA_5", name: "Sala 5" },
  { id: 3, code: "LAB_REDES", name: "Laboratorio de Redes" },
  { id: 4, code: "BODEGA_LIS", name: "Bodega LIS" },
];

export const operationalStatusNames: Record<OperationalStatusCode, string> = {
  OPERATIVO: "Operativo",
  MANTENIMIENTO: "Mantenimiento",
  FUERA_SERVICIO: "Fuera de servicio",
  RETIRADO: "Retirado",
};

const category = (code: string) => categories.find((c) => c.code === code)!;
const location = (code: string) => locations.find((l) => l.code === code) ?? null;

interface Seed {
  id: number;
  inventoryCode: string;
  name: string;
  description: string;
  serialNumber: string | null;
  macAddress: string | null;
  categoryCode: string;
  locationCode: string;
  operational: OperationalStatusCode;
  visualStatus: VisualStatus;
}

const seeds: Seed[] = [
  {
    id: 1,
    inventoryCode: "DEMO-MCU-001",
    name: "Arduino UNO R4 WiFi",
    description:
      "Placa de desarrollo con conectividad WiFi para prácticas de electrónica y sistemas embebidos.",
    serialNumber: "SN-ARD-001",
    macAddress: null,
    categoryCode: "MICROCONTROLADORES",
    locationCode: "SALA_4",
    operational: "OPERATIVO",
    visualStatus: "AVAILABLE",
  },
  {
    id: 2,
    inventoryCode: "DEMO-MCU-002",
    name: "ESP32 DevKit V1",
    description:
      "Microcontrolador con WiFi y Bluetooth utilizado en proyectos de sensórica y automatización.",
    serialNumber: "SN-ESP-014",
    macAddress: "A4:CF:12:8B:44:01",
    categoryCode: "MICROCONTROLADORES",
    locationCode: "SALA_4",
    operational: "OPERATIVO",
    visualStatus: "RESERVED",
  },
  {
    id: 3,
    inventoryCode: "DEMO-MCU-003",
    name: "Raspberry Pi Pico W",
    description:
      "Placa RP2040 con WiFi para prácticas introductorias de programación de bajo nivel.",
    serialNumber: "SN-PICO-032",
    macAddress: null,
    categoryCode: "MICROCONTROLADORES",
    locationCode: "SALA_5",
    operational: "OPERATIVO",
    visualStatus: "AVAILABLE",
  },
  {
    id: 4,
    inventoryCode: "DEMO-VR-001",
    name: "Meta Quest 3",
    description: "Visor de realidad mixta empleado en prácticas de interacción humano-computador.",
    serialNumber: "SN-MQ3-002",
    macAddress: "5C:F3:70:22:19:AA",
    categoryCode: "REALIDAD_VIRTUAL",
    locationCode: "SALA_5",
    operational: "OPERATIVO",
    visualStatus: "AVAILABLE",
  },
  {
    id: 5,
    inventoryCode: "DEMO-VR-002",
    name: "Meta Quest 2",
    description: "Visor de realidad virtual autónomo para laboratorios de simulación.",
    serialNumber: "SN-MQ2-007",
    macAddress: null,
    categoryCode: "REALIDAD_VIRTUAL",
    locationCode: "SALA_5",
    operational: "MANTENIMIENTO",
    visualStatus: "MAINTENANCE",
  },
  {
    id: 6,
    inventoryCode: "DEMO-NET-001",
    name: "Cisco Catalyst 2960",
    description:
      "Switch administrable de 24 puertos utilizado en prácticas de VLAN y enrutamiento.",
    serialNumber: "SN-CIS-2960-11",
    macAddress: "00:1B:0D:63:C2:26",
    categoryCode: "REDES",
    locationCode: "LAB_REDES",
    operational: "OPERATIVO",
    visualStatus: "RESERVED",
  },
  {
    id: 7,
    inventoryCode: "DEMO-NET-002",
    name: "MikroTik hEX RB750Gr3",
    description: "Router de cinco puertos gigabit para laboratorios de RouterOS.",
    serialNumber: "SN-MKT-750-03",
    macAddress: "64:D1:54:11:2E:90",
    categoryCode: "REDES",
    locationCode: "LAB_REDES",
    operational: "OPERATIVO",
    visualStatus: "AVAILABLE",
  },
  {
    id: 8,
    inventoryCode: "DEMO-NET-003",
    name: "Ubiquiti UniFi AP AC Lite",
    description: "Punto de acceso inalámbrico para prácticas de redes WLAN y roaming.",
    serialNumber: null,
    macAddress: "78:8A:20:44:6B:12",
    categoryCode: "REDES",
    locationCode: "LAB_REDES",
    operational: "OPERATIVO",
    visualStatus: "AVAILABLE",
  },
  {
    id: 9,
    inventoryCode: "DEMO-NET-004",
    name: "TP-Link TL-SG1024DE",
    description: "Switch administrable de 24 puertos para prácticas de segmentación de red.",
    serialNumber: "SN-TPL-1024-05",
    macAddress: null,
    categoryCode: "REDES",
    locationCode: "LAB_REDES",
    operational: "FUERA_SERVICIO",
    visualStatus: "OUT_OF_SERVICE",
  },
  {
    id: 10,
    inventoryCode: "DEMO-COM-001",
    name: "Intel NUC 11 Pro",
    description: "Mini PC de escritorio destinado a estaciones de trabajo temporales.",
    serialNumber: "SN-NUC-11-08",
    macAddress: "1C:69:7A:03:5D:41",
    categoryCode: "COMPUTO",
    locationCode: "SALA_4",
    operational: "OPERATIVO",
    visualStatus: "AVAILABLE",
  },
  {
    id: 11,
    inventoryCode: "DEMO-COM-002",
    name: "Lenovo ThinkPad T14",
    description: "Portátil institucional para prácticas de desarrollo y despliegue.",
    serialNumber: "SN-LEN-T14-21",
    macAddress: null,
    categoryCode: "COMPUTO",
    locationCode: "SALA_4",
    operational: "OPERATIVO",
    visualStatus: "RESERVED",
  },
  {
    id: 12,
    inventoryCode: "DEMO-COM-003",
    name: "NVIDIA Jetson Nano",
    description: "Kit de cómputo embebido para proyectos de visión artificial e inferencia.",
    serialNumber: "SN-JET-NANO-04",
    macAddress: "48:B0:2D:77:31:5C",
    categoryCode: "COMPUTO",
    locationCode: "SALA_5",
    operational: "MANTENIMIENTO",
    visualStatus: "MAINTENANCE",
  },
  {
    id: 13,
    inventoryCode: "DEMO-IOT-001",
    name: "Kit de Sensores IoT",
    description:
      "Conjunto de sensores de temperatura, humedad, movimiento y luminosidad para prototipado.",
    serialNumber: "SN-KIT-IOT-09",
    macAddress: null,
    categoryCode: "IOT",
    locationCode: "SALA_4",
    operational: "OPERATIVO",
    visualStatus: "AVAILABLE",
  },
  {
    id: 14,
    inventoryCode: "DEMO-IOT-002",
    name: "Gateway LoRa RAK7268",
    description: "Concentrador LoRaWAN de ocho canales para redes de sensores de largo alcance.",
    serialNumber: "SN-RAK-7268-02",
    macAddress: "AC:1F:09:FF:12:33",
    categoryCode: "IOT",
    locationCode: "LAB_REDES",
    operational: "OPERATIVO",
    visualStatus: "AVAILABLE",
  },
  {
    id: 15,
    inventoryCode: "DEMO-IOT-003",
    name: "Raspberry Pi 4 Model B",
    description: "Computador de placa reducida de 8 GB utilizado como nodo IoT y servidor local.",
    serialNumber: "SN-RPI4-017",
    macAddress: "DC:A6:32:5A:88:10",
    categoryCode: "IOT",
    locationCode: "BODEGA_LIS",
    operational: "RETIRADO",
    visualStatus: "RETIRED",
  },
];

export const equipment: EquipmentDto[] = seeds.map((seed) => ({
  id: seed.id,
  inventoryCode: seed.inventoryCode,
  name: seed.name,
  description: seed.description,
  serialNumber: seed.serialNumber,
  macAddress: seed.macAddress,
  imageUrl: null,
  category: category(seed.categoryCode),
  location: location(seed.locationCode),
  operationalStatus: {
    code: seed.operational,
    name: operationalStatusNames[seed.operational],
  },
  visualStatus: seed.visualStatus,
}));

const day = 24 * 60 * 60 * 1000;
const at = (offsetDays: number, hour: number) => {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return new Date(date.getTime() + offsetDays * day).toISOString();
};

const ref = (id: number) => {
  const item = equipment.find((e) => e.id === id)!;
  return { id: item.id, name: item.name, inventoryCode: item.inventoryCode };
};

export const reservations: ReservationDto[] = [
  {
    id: 1,
    code: "RSV-2026-0142",
    equipment: [ref(2)],
    startsAt: at(2, 10),
    endsAt: at(2, 12),
    notes: "Práctica de sensórica del curso de Sistemas Embebidos.",
    status: "CONFIRMED",
  },
  {
    id: 2,
    code: "RSV-2026-0139",
    equipment: [ref(6), ref(7)],
    startsAt: at(5, 14),
    endsAt: at(5, 18),
    notes: "Montaje de topología VLAN para el laboratorio de Redes II.",
    status: "CONFIRMED",
  },
  {
    id: 3,
    code: "RSV-2026-0131",
    equipment: [ref(11)],
    startsAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    notes: "Sesión de desarrollo del semillero de investigación.",
    status: "CONFIRMED",
  },
  {
    id: 4,
    code: "RSV-2026-0108",
    equipment: [ref(4)],
    startsAt: at(-6, 8),
    endsAt: at(-6, 11),
    notes: "Prueba de usabilidad en entornos de realidad mixta.",
    status: "CONFIRMED",
  },
  {
    id: 5,
    code: "RSV-2026-0097",
    equipment: [ref(1)],
    startsAt: at(-12, 9),
    endsAt: at(-12, 12),
    notes: null,
    status: "CANCELLED",
    cancellationReason: "Cambio de fecha de la práctica.",
  },
];

/**
 * Slots already taken by other users. The mock reservation service rejects
 * overlapping requests with HTTP 409, exactly like the future REST API will.
 */
export interface OccupiedSlot {
  equipmentId: number;
  startsAt: string;
  endsAt: string;
}

export const occupiedSlots: OccupiedSlot[] = [
  { equipmentId: 1, startsAt: at(1, 10), endsAt: at(1, 12) },
  { equipmentId: 3, startsAt: at(1, 14), endsAt: at(1, 16) },
  { equipmentId: 4, startsAt: at(2, 8), endsAt: at(2, 10) },
  { equipmentId: 7, startsAt: at(1, 9), endsAt: at(1, 11) },
  { equipmentId: 8, startsAt: at(3, 10), endsAt: at(3, 13) },
  { equipmentId: 10, startsAt: at(1, 13), endsAt: at(1, 17) },
  { equipmentId: 13, startsAt: at(2, 9), endsAt: at(2, 11) },
  { equipmentId: 14, startsAt: at(4, 10), endsAt: at(4, 12) },
];

export const topEquipmentRanking: TopEquipmentDto[] = [
  { equipmentId: 1, name: "Arduino UNO R4 WiFi", reservations: 24 },
  { equipmentId: 4, name: "Meta Quest 3", reservations: 18 },
  { equipmentId: 2, name: "ESP32 DevKit V1", reservations: 15 },
  { equipmentId: 15, name: "Raspberry Pi 4 Model B", reservations: 13 },
  { equipmentId: 6, name: "Cisco Catalyst 2960", reservations: 11 },
];

export const users: Array<UserDto & { password: string }> = [
  {
    id: 1,
    firstName: "Carlos",
    lastName: "Usuario",
    email: "user.mock@example.invalid",
    role: "USER",
    roles: ["USUARIO"],
    preferredLanguage: "es",
    languageCode: "es",
    password: "local-mock-user-only",
  },
  {
    id: 2,
    firstName: "Ana",
    lastName: "Administradora",
    email: "admin.mock@example.invalid",
    role: "ADMIN",
    roles: ["USUARIO", "ADMINISTRADOR"],
    preferredLanguage: "es",
    languageCode: "es",
    password: "local-mock-admin-only",
  },
];
