import type { es } from './es'

export const LANGUAGES = ['es', 'en'] as const
export type Language = (typeof LANGUAGES)[number]

/**
 * Todas las claves de traduccion, derivadas del diccionario espanol.
 * Escribir t('clave.que.no.existe') es un error de compilacion.
 */
export type TranslationKey = keyof typeof es

/**
 * Un idioma completo. Al declarar `const en: Dictionary = {...}`, TypeScript
 * exige que estén TODAS las claves: es imposible publicar una traduccion a
 * medias sin que falle `npm run build`.
 */
export type Dictionary = Record<TranslationKey, string>

/** Valores que se pueden interpolar en un texto con {marcadores}. */
export type TranslationParams = Record<string, string | number>