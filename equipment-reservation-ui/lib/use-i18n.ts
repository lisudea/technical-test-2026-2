'use client'

import { useEffect, useMemo, useState } from 'react'
import { en } from '@/locales/en'
import { es, type Dictionary } from '@/locales/es'

export type LocaleCode = 'es' | 'en'

const STORAGE_KEY = 'lis-ui-locale'

function resolveLocale(value: string | null | undefined): LocaleCode {
  if (!value) {
    return 'es'
  }

  return value.toLowerCase().startsWith('en') ? 'en' : 'es'
}

function getStoredLocale() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(STORAGE_KEY)
}

function getBrowserLocale() {
  if (typeof navigator === 'undefined') {
    return null
  }

  return navigator.language
}

export function getDictionary(locale: LocaleCode): Dictionary {
  return locale === 'en' ? en : es
}

export function useI18n() {
  const [locale, setLocaleState] = useState<LocaleCode>('es')

  useEffect(() => {
    const nextLocale = resolveLocale(getStoredLocale() ?? getBrowserLocale())
    setLocaleState(nextLocale)
  }, [])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, locale)
    }
  }, [locale])

  useEffect(() => {
    const syncLocale = () => setLocaleState(resolveLocale(getStoredLocale()))
    window.addEventListener('lis-locale-change', syncLocale)
    return () => window.removeEventListener('lis-locale-change', syncLocale)
  }, [])

  const dictionary = useMemo(() => getDictionary(locale), [locale])

  function setLocale(nextLocale: LocaleCode) {
    setLocaleState(nextLocale)
    window.localStorage.setItem(STORAGE_KEY, nextLocale)
    window.dispatchEvent(new Event('lis-locale-change'))
  }

  return { locale, setLocale, dictionary }
}
