import { Icon } from './Icons.jsx'

const controlClasses =
  'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-ink placeholder-gray-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:bg-gray-50 disabled:text-gray-400'

export function Field({ label, hint, error, required, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label ? (
        <span className="mb-1.5 block text-sm font-semibold text-muted">
          {label}
          {required ? <span className="ml-0.5 text-red-500">*</span> : null}
        </span>
      ) : null}
      {children}
      {hint && !error ? <span className="mt-1 block text-xs text-gray-400">{hint}</span> : null}
      {error ? (
        <span className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
          <Icon name="exclamation" className="h-3.5 w-3.5" />
          {error}
        </span>
      ) : null}
    </label>
  )
}

export function Input({ invalid, className = '', ...props }) {
  return (
    <input
      className={`${controlClasses} ${invalid ? 'border-red-400 focus:border-red-500 focus:ring-red-300' : ''} ${className}`}
      {...props}
    />
  )
}

export function Select({ invalid, children, className = '', ...props }) {
  return (
    <select
      className={`${controlClasses} appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%23686868%22 stroke-width=%222%22%3E%3Cpath stroke-linecap=%22round%22 stroke-linejoin=%22round%22 d=%22M19.5 8.25l-7.5 7.5-7.5-7.5%22/%3E%3C/svg%3E')] bg-[right_0.75rem_center] bg-no-repeat pr-10 ${
        invalid ? 'border-red-400 focus:border-red-500 focus:ring-red-300' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export function Textarea({ invalid, className = '', ...props }) {
  return (
    <textarea
      className={`${controlClasses} ${invalid ? 'border-red-400 focus:border-red-500 focus:ring-red-300' : ''} ${className}`}
      {...props}
    />
  )
}

export function Checkbox({ label, className = '', ...props }) {
  return (
    <label className={`flex items-center gap-2 text-sm text-muted ${className}`}>
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300 accent-primary"
        {...props}
      />
      {label}
    </label>
  )
}