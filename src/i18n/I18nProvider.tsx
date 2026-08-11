import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { STORAGE_KEYS } from '../config/env'
import { es } from './es'
import { en } from './en'
import { LANGUAGES } from './types'
import type { Dictionary, Language, TranslationKey, TranslationParams } from './types'

/**
 * Registro de idiomas disponibles.
 * Anadir uno nuevo = crear su diccionario y sumarlo aqui. Nada mas.
 */
const DICTIONARIES: Record<Language, Dictionary> = {
  es: es as unknown as Dictionary,
  en,
}

/** Locales para Intl, para que fechas y numeros tambien se traduzcan. */
const LOCALES: Record<Language, string> = {
  es: 'es-CO',
  en: 'en-US',
}

export interface I18nContextValue {
  lang: Language
  setLang: (lang: Language) => void
  /** Traduce una clave, interpolando {marcadores} opcionales. */
  t: (key: TranslationKey, params?: TranslationParams) => string
  /** Formatea una fecha ISO segun el idioma activo. */
  formatDateTime: (iso: string | null | undefined) => string
  formatDate: (iso: string | null | undefined) => string
  formatTime: (iso: string | null | undefined) => string
  availableLanguages: readonly Language[]
}

// eslint-disable-next-line react-refresh/only-export-components
export const I18nContext = createContext<I18nContextValue | null>(null)

function detectInitialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEYS.language)

  if (stored && LANGUAGES.includes(stored as Language)) {
    return stored as Language
  }

  return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en'
}

/** Sustituye {clave} por su valor. Los marcadores sin valor se dejan intactos. */
function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template

  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  )
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(detectInitialLanguage)

  const setLang = useCallback((next: Language) => {
    setLangState(next)
    localStorage.setItem(STORAGE_KEYS.language, next)
  }, [])

  // Mantiene sincronizados el atributo lang del documento y el titulo de la
  // pestana. Sin esto, los lectores de pantalla seguirian anunciando el idioma
  // anterior aunque la interfaz ya hubiese cambiado.
  useEffect(() => {
    document.documentElement.lang = lang
    document.title = DICTIONARIES[lang]['app.title']
  }, [lang])

  const value = useMemo<I18nContextValue>(() => {
    const dictionary = DICTIONARIES[lang]
    const locale = LOCALES[lang]

    const t = (key: TranslationKey, params?: TranslationParams): string => {
      const template = dictionary[key]

      if (template === undefined) {
        // No deberia ocurrir: TypeScript valida las claves en compilacion.
        // Se avisa en desarrollo y se devuelve la clave para localizarla rapido.
        if (import.meta.env.DEV) console.warn(`[i18n] Falta la traduccion "${key}" en "${lang}"`)
        return key
      }

      return interpolate(template, params)
    }

    const parse = (iso: string | null | undefined): Date | null => {
      if (!iso) return null
      const date = new Date(iso)
      return Number.isNaN(date.getTime()) ? null : date
    }

    const formatDateTime = (iso: string | null | undefined): string => {
      const date = parse(iso)
      if (!date) return '—'
      return new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
    }

    const formatDate = (iso: string | null | undefined): string => {
      const date = parse(iso)
      if (!date) return '—'
      return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
    }

    const formatTime = (iso: string | null | undefined): string => {
      const date = parse(iso)
      if (!date) return '—'
      return new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(date)
    }

    return { lang, setLang, t, formatDateTime, formatDate, formatTime, availableLanguages: LANGUAGES }
  }, [lang, setLang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}