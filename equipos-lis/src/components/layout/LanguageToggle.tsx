import { useLanguage } from '../../i18n/LanguageContext'
// El componente LanguageToggle permite a los usuarios cambiar el idioma de la aplicación 
// entre español e inglés. Utiliza el hook useLanguage para acceder al contexto de idioma, 
// obteniendo el idioma actual, la función para cambiar el idioma y las traducciones
//  correspondientes. Renderiza dos botones que permiten seleccionar el idioma deseado, 
// actualizando el estado del idioma en el contexto cuando se hace clic en ellos.
export default function LanguageToggle() {
  const { lang, setLang, t } = useLanguage()

  return (
    <div className="lang-toggle" role="group" aria-label={t('lang.label')}>
      <button
        type="button"
        className="lang-toggle__btn"
        aria-pressed={lang === 'es'}
        onClick={() => setLang('es')}
      >
        ES
      </button>
      <button
        type="button"
        className="lang-toggle__btn"
        aria-pressed={lang === 'en'}
        onClick={() => setLang('en')}
      >
        EN
      </button>
    </div>
  )
}
