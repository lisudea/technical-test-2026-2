import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './es.json'
import en from './en.json'
import pt from './pt.json'
import fr from './fr.json'

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
    pt: { translation: pt },
    fr: { translation: fr },
  },
  lng: localStorage.getItem('lis-idioma') ?? 'es',
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (idioma) => localStorage.setItem('lis-idioma', idioma))

export default i18n
