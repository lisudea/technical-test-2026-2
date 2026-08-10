import { Icon } from './Icons.jsx'

const tones = {
  error: {
    box: 'border-red-200 bg-red-50 text-red-800',
    icon: 'xcircle',
    iconColor: 'text-red-500',
  },
  success: {
    box: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: 'check',
    iconColor: 'text-emerald-500',
  },
  info: {
    box: 'border-primary/25 bg-primary-50 text-primary-dark',
    icon: 'info',
    iconColor: 'text-primary',
  },
  warning: {
    box: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: 'exclamation',
    iconColor: 'text-amber-500',
  },
}

export function Alert({ tone = 'info', title, children, className = '' }) {
  const t = tones[tone] ?? tones.info
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${t.box} ${className}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon name={t.icon} className={`mt-0.5 h-5 w-5 shrink-0 ${t.iconColor}`} />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={`mt-0.5 leading-relaxed ${title ? 'opacity-90' : ''}`}>{children}</div> : null}
      </div>
    </div>
  )
}

export function EmptyState({ icon = 'info', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary">
        <Icon name={icon} className="h-7 w-7" />
      </span>
      <div>
        <p className="font-semibold text-ink">{title}</p>
        {description ? <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{description}</p> : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}