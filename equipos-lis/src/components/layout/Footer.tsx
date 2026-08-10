import { useLanguage } from '../../i18n/LanguageContext'
// El componente Footer representa el pie de página de la aplicación. Utiliza el hook 
// useLanguage para acceder al contexto de idioma y obtener las traducciones 
// correspondientes a las claves de texto en el idioma seleccionado. Renderiza el
//  nombre de la marca y un mensaje adicional en el pie de página, ambos traducidos 
// según el idioma actual.
export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="footer">
      <div className="footer__inner">
        <span>{t('nav.brand')}</span>
        <span>{t('footer.tag')}</span>
      </div>
    </footer>
  )
}
