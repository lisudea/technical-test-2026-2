import { Icon } from './Icons.jsx'

const variants = {
  primary:
    'bg-primary text-white border-primary hover:bg-white hover:text-ink hover:border-primary',
  outline: 'bg-white text-primary border-primary hover:bg-primary-50',
  danger: 'bg-white text-red-600 border-red-300 hover:bg-red-50',
  ghost: 'bg-transparent text-muted border-transparent hover:bg-gray-100 hover:text-ink',
  soft: 'bg-primary-50 text-primary-dark border-primary/20 hover:bg-primary hover:text-white',
}

/**
 * Boton con las formas redondeadas y la paleta del sitio LIS.
 */
const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || loading
  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <SpinnerInline /> : icon ? <Icon name={icon} className="h-4 w-4" /> : null}
      {children}
      {iconRight && !loading ? <Icon name={iconRight} className="h-4 w-4" /> : null}
    </button>
  )
}

function SpinnerInline() {
  return (
    <svg className="h-4 w-4 animate-spinner" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}