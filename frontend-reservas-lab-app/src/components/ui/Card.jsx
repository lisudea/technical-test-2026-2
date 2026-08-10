export function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-line bg-white shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, actions, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 ${className}`}>
      <div>
        <h2 className="text-lg font-bold text-primary-dark">{title}</h2>
        {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}