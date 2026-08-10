import { Cpu, Glasses, Network, Laptop, Printer, Radar, Box } from "lucide-react";

export const CATEGORY_ICONS = {
  MICROCONTROLADORES: Cpu,
  REALIDAD_VIRTUAL: Glasses,
  REDES: Network,
  COMPUTADORES: Laptop,
  IMPRESORAS_3D: Printer,
  SENSORES: Radar,
};

export function getCategoryIcon(categoria) {
  return CATEGORY_ICONS[categoria] || Box;
}

// estadoVisual que calcula el backend: DISPONIBLE | RESERVADO | EN_MANTENIMIENTO
export function getEquipoStatusClass(estadoVisual) {
  switch (estadoVisual) {
    case "DISPONIBLE":
      return "available";
    case "RESERVADO":
      return "reserved";
    case "EN_MANTENIMIENTO":
      return "maintenance";
    default:
      return "available";
  }
}
