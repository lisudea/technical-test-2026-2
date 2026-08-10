import { Icon } from '../ui/Icons.jsx'

/**
 * Esqueleto de las paginas de autenticacion: tarjeta centrada con la marca,
 * similar al bloque .form-container del sitio LIS.
 */
export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen flex-col bg-soft">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/logo.svg" alt="Logo LIS" className="h-16 w-16 sm:h-20 sm:w-20" />
          <p className="mt-3 text-2xl font-bold text-primary-dark">Reservas de equipos</p>
         <p className="mt-3 text-2xl font-bold text-primary-dark">Laboratorio Integrado de Sistemas</p>
          <p className="mt-1 text-sm text-muted">Universidad de Antioquia</p>
        </div>

        <div className="w-full max-w-md rounded-2xl border border-line bg-white px-6 py-7 shadow-sm animate-fade-in sm:px-8">
          <h1 className="text-xl font-bold text-primary-dark">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
          <div className="mt-5">{children}</div>
        </div>

        {footer ? <div className="mt-5 text-center text-sm">{footer}</div> : null}
      </div>

      <footer className="flex items-center justify-center gap-2 py-6 text-xs text-gray-400">
        <Icon name="shield" className="h-4 w-4" />
        Acceso exclusivo para la comunidad institucional @udea.edu.co
      </footer>
    </div>
  )
}