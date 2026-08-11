import { useI18n } from '../../i18n/useI18n'
import type { Language } from '../../i18n/types'

const LABELS: Record<Language, string> = { es: 'ES', en: 'EN' }
const NAME_KEYS = { es: 'language.es', en: 'language.en' } as const

/**
 * Conmutador de idioma (requisito 7 del Reto 3).
 *
 * El cambio es instantaneo y SIN recargar la pagina: solo actualiza el estado
 * de React, que vuelve a renderizar toda la interfaz con el otro diccionario.
 * La eleccion queda guardada en localStorage.
 *
 * `aria-pressed` indica a los lectores de pantalla cual esta activo.
 */
export function LanguageSwitcher() {
  const { lang, setLang, availableLanguages, t } = useI18n()

  return (
    <div className="lang-switch" role="group" aria-label={t('language.label')}>
      {availableLanguages.map((code) => (
        <button
          key={code}
          type="button"
          className="lang-switch__btn"
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
          title={t('language.switchTo', { language: t(NAME_KEYS[code]) })}
        >
          {LABELS[code]}
        </button>
      ))}
    </div>
  )
}