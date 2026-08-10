import { createContext, useContext } from 'react'
import { translations, type Lang } from './translations'
// Este archivo contiene la definición del contexto de idioma utilizado en la aplicación. Proporciona un contexto para manejar el idioma actual,
// una función para cambiar el idioma y una función de traducción que permite obtener las traducciones correspondientes a las claves
// de texto en el idioma seleccionado. También se define un hook personalizado useLanguage para acceder al contexto de idioma de manera
// más sencilla dentro de los componentes de React.
export const LANGUAGE_STORAGE_KEY = 'equipos-lis.lang'

// La interfaz LanguageContextValue representa el valor del contexto de idioma.  
// Contiene el idioma actual, una función para cambiar el idioma y una función de traducción que permite obtener las traducciones correspondientes a las 
// claves de texto en el idioma seleccionado.
export interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

// Se crea un contexto de idioma utilizando createContext, con un valor inicial nulo. Este contexto se utilizará para proporcionar
//  y consumir el idioma actual y las funciones relacionadas en los componentes de la aplicación.
export const LanguageContext = createContext<LanguageContextValue | null>(null)

// El hook useLanguage permite acceder al contexto de idioma de manera más sencilla dentro de los componentes de React.
// Lanza un error si se intenta usar fuera del proveedor de contexto LanguageProvider.
export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage debe usarse dentro de LanguageProvider')
  }
  return ctx
}

// La función translate se utiliza para obtener la traducción correspondiente a una clave de texto en el idioma seleccionado.
// Recibe el idioma, la clave de texto y un objeto opcional de variables para reemplazar en la traducción. Devuelve la traducción correspondiente
// o la clave original si no se encuentra la traducción.
export function translate(
  lang: Lang,
  key: string,
  vars?: Record<string, string | number>,
): string {
  let text = translations[lang][key] ?? key
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
  }
  return text
}
