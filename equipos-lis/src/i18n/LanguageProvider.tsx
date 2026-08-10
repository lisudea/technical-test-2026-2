import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { LanguageContext, LANGUAGE_STORAGE_KEY, translate } from './LanguageContext'
import type { Lang } from './translations'

// Este archivo define el proveedor de idioma de la aplicación. Su función es inicializar el idioma actual,
// persistirlo en el almacenamiento local y exponer el contexto de traducción a todos los componentes hijos.

// La función getInitialLang obtiene el idioma guardado en el almacenamiento local del navegador.
// Si no existe un valor válido, se utiliza el idioma español por defecto.
function getInitialLang(): Lang {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return stored === 'en' || stored === 'es' ? stored : 'es'
}

// El componente LanguageProvider encapsula la lógica de estado del idioma y aporta el valor del contexto a la app.
// También sincroniza el atributo lang del documento HTML con el idioma seleccionado.
export default function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, next)
  }, [])

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
    }),
    [lang, setLang],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
