import { Icon } from './Icons.jsx'

export function PageHeader({ icon = 'sparkles', eyebrow, title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white sm:flex">
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <div>
          {eyebrow ? (
            <p className="mb-0.5 text-xs font-bold uppercase tracking-widest text-primary">{eyebrow}</p>
          ) : null}
          <h1 className="text-2xl font-bold text-primary-dark sm:text-3xl">{title}</h1>
          {description ? <p className="mt-1 max-w-2xl text-sm text-muted sm:text-base">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}