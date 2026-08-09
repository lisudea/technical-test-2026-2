export type EquipoStatus = "disponible" | "reservado" | "mantenimiento" | "baja";

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface Equipo {
  id: number;
  nombre: string;
  descripcion: string;
  categoriaId: number;
  status: EquipoStatus;
  imagen?: string;
  codigo: string;
}

export interface Reserva {
  id: number;
  equipoId: number;
  equipoNombre: string;
  solicitante: string;
  correo: string;
  fechaInicio: string;
  fechaFin: string;
  estado: "activa" | "cancelada";
}

export const categorias: Categoria[] = [
  { id: 1, nombre: "Microcontroladores", descripcion: "Placas Arduino, ESP32, Raspberry Pi y similares" },
  { id: 2, nombre: "Realidad Virtual", descripcion: "Visores y accesorios VR/AR" },
  { id: 3, nombre: "Redes", descripcion: "Switches, routers, access points, cables" },
  { id: 4, nombre: "Cómputo", descripcion: "Laptops, PCs, monitores" },
  { id: 5, nombre: "Electrónica", descripcion: "Osciloscopios, multímetros, fuentes de poder" },
];

export const equipos: Equipo[] = [
  {
    id: 1,
    nombre: "Arduino Mega 2560",
    descripcion: "Microcontrolador AVR ATmega2560 con 54 pines digitales I/O. Ideal para proyectos de robótica y automatización.",
    categoriaId: 1,
    status: "disponible",
    codigo: "MCU-001",
  },
  {
    id: 2,
    nombre: "ESP32 DevKit v1",
    descripcion: "Módulo Wi-Fi + Bluetooth dual-core 240 MHz. Perfecto para proyectos IoT y comunicaciones inalámbricas.",
    categoriaId: 1,
    status: "reservado",
    codigo: "MCU-002",
  },
  {
    id: 3,
    nombre: "Raspberry Pi 4 Model B (8 GB)",
    descripcion: "SBC con procesador ARM Cortex-A72 quad-core 1.8 GHz, 8 GB RAM, USB 3.0, Gigabit Ethernet.",
    categoriaId: 1,
    status: "disponible",
    codigo: "MCU-003",
  },
  {
    id: 4,
    nombre: "Meta Quest 3",
    descripcion: "Visor de realidad mixta standalone con resolución pancake y 128 GB de almacenamiento interno.",
    categoriaId: 2,
    status: "reservado",
    codigo: "VR-001",
  },
  {
    id: 5,
    nombre: "HTC Vive Pro 2",
    descripcion: "Visor PC-VR con resolución 4K, campo visual de 120°, seguimiento de habitación full-room.",
    categoriaId: 2,
    status: "mantenimiento",
    codigo: "VR-002",
  },
  {
    id: 6,
    nombre: "Switch Cisco Catalyst 2960-X",
    descripcion: "Switch gestionable 24 puertos PoE+, 4 uplinks SFP+. Ideal para prácticas de CCNA.",
    categoriaId: 3,
    status: "disponible",
    codigo: "RED-001",
  },
  {
    id: 7,
    nombre: "Router Cisco ISR 4321",
    descripcion: "Router empresarial dual WAN, módulos EHWIC, soporte OSPF, EIGRP, BGP.",
    categoriaId: 3,
    status: "disponible",
    codigo: "RED-002",
  },
  {
    id: 8,
    nombre: "Laptop Lenovo ThinkPad E14 Gen 5",
    descripcion: "Intel Core i7-1355U, 16 GB RAM, 512 GB SSD, pantalla 14\" IPS. Para proyectos de desarrollo.",
    categoriaId: 4,
    status: "disponible",
    codigo: "LAP-001",
  },
  {
    id: 9,
    nombre: "Laptop Dell XPS 15 9530",
    descripcion: "Intel Core i9-13900H, NVIDIA GeForce RTX 4060, 32 GB RAM, pantalla OLED 3.5K.",
    categoriaId: 4,
    status: "baja",
    codigo: "LAP-002",
  },
  {
    id: 10,
    nombre: "Osciloscopio Rigol DS1054Z",
    descripcion: "Osciloscopio digital 4 canales, 50 MHz, tasa de muestreo 1 GSa/s, pantalla 7\" TFT.",
    categoriaId: 5,
    status: "disponible",
    codigo: "ELE-001",
  },
  {
    id: 11,
    nombre: "Fuente de poder regulable 30V/5A",
    descripcion: "Fuente DC de banco con display digital, doble salida regulable 0-30 V / 0-5 A.",
    categoriaId: 5,
    status: "mantenimiento",
    codigo: "ELE-002",
  },
  {
    id: 12,
    nombre: "Access Point Ubiquiti UniFi 6 Pro",
    descripcion: "Wi-Fi 6 tri-band, cobertura hasta 300 m², PoE+, controlable desde UniFi Network.",
    categoriaId: 3,
    status: "disponible",
    codigo: "RED-003",
  },
];

export const reservas: Reserva[] = [
  {
    id: 1,
    equipoId: 2,
    equipoNombre: "ESP32 DevKit v1",
    solicitante: "Laura Martínez García",
    correo: "laura.martinez@udea.edu.co",
    fechaInicio: "2026-08-09T08:00",
    fechaFin: "2026-08-09T12:00",
    estado: "activa",
  },
  {
    id: 2,
    equipoId: 4,
    equipoNombre: "Meta Quest 3",
    solicitante: "Carlos Ríos Herrera",
    correo: "carlos.rios@udea.edu.co",
    fechaInicio: "2026-08-09T10:00",
    fechaFin: "2026-08-09T14:00",
    estado: "activa",
  },
  {
    id: 3,
    equipoId: 1,
    equipoNombre: "Arduino Mega 2560",
    solicitante: "Valentina Torres",
    correo: "valentina.torres@udea.edu.co",
    fechaInicio: "2026-08-08T14:00",
    fechaFin: "2026-08-08T17:00",
    estado: "cancelada",
  },
  {
    id: 4,
    equipoId: 6,
    equipoNombre: "Switch Cisco Catalyst 2960-X",
    solicitante: "Andrés Felipe Cárdenas",
    correo: "andres.cardenas@udea.edu.co",
    fechaInicio: "2026-08-10T09:00",
    fechaFin: "2026-08-10T13:00",
    estado: "activa",
  },
  {
    id: 5,
    equipoId: 3,
    equipoNombre: "Raspberry Pi 4 Model B (8 GB)",
    solicitante: "María Camila Zapata",
    correo: "maria.zapata@udea.edu.co",
    fechaInicio: "2026-08-07T09:00",
    fechaFin: "2026-08-07T12:00",
    estado: "cancelada",
  },
];

export const topEquipos = [
  { equipoId: 2, nombre: "ESP32 DevKit v1", totalReservas: 18, categoria: "Microcontroladores" },
  { equipoId: 4, nombre: "Meta Quest 3", totalReservas: 14, categoria: "Realidad Virtual" },
  { equipoId: 6, nombre: "Switch Cisco Catalyst 2960-X", totalReservas: 11, categoria: "Redes" },
  { equipoId: 1, nombre: "Arduino Mega 2560", totalReservas: 9, categoria: "Microcontroladores" },
  { equipoId: 8, nombre: "Laptop Lenovo ThinkPad E14 Gen 5", totalReservas: 7, categoria: "Cómputo" },
];
