export function Spinner({ className = 'h-6 w-6', label = 'Cargando...' }) {
  return (
    <span className="inline-flex items-center gap-3 text-muted" role="status" aria-live="polite">
      <svg className={`animate-spinner ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
        <path
          d="M22 12a10 10 0 00-10-10"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
      {label ? <span className="text-sm">{label}</span> : null}
    </span>
  )
}

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner />
    </div>
  )
}