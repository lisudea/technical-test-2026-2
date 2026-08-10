export type Rareza = 'comun' | 'raro' | 'especial'
export type Ranura = 'cabeza' | 'cara' | 'cuello' | 'insignia'

export interface Objeto {
  clave: string
  ranura: Ranura
  rareza: Rareza
}

// Catálogo: la clave coincide con la que otorga el backend. El nombre se traduce
// por i18n con la clave `objetos.<clave>`. El dibujo vive en MascotaLis.
export const CATALOGO: Objeto[] = [
  { clave: 'gorro-lana', ranura: 'cabeza', rareza: 'comun' },
  { clave: 'gorro-grad', ranura: 'cabeza', rareza: 'raro' },
  { clave: 'gafas-vr', ranura: 'cara', rareza: 'raro' },
  { clave: 'audifonos', ranura: 'cabeza', rareza: 'raro' },
  { clave: 'bufanda-teal', ranura: 'cuello', rareza: 'comun' },
  { clave: 'corbatin', ranura: 'cuello', rareza: 'raro' },
  { clave: 'insignia-novato', ranura: 'insignia', rareza: 'comun' },
  { clave: 'insignia-jugador', ranura: 'insignia', rareza: 'raro' },
  { clave: 'medalla-autor', ranura: 'insignia', rareza: 'especial' },
]

export const porClave = (clave: string) => CATALOGO.find((o) => o.clave === clave)

// una sola ranura activa por categoría a la vez
export function alternarEquipado(equipados: string[], clave: string): string[] {
  const obj = porClave(clave)
  if (!obj) return equipados
  if (equipados.includes(clave)) return equipados.filter((c) => c !== clave)
  const sinMismaRanura = equipados.filter((c) => porClave(c)?.ranura !== obj.ranura)
  return [...sinMismaRanura, clave]
}
