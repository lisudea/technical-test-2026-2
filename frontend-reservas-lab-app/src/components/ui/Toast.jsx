import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { Icon } from '../ui/Icons.jsx'

const ToastContext = createContext(null)

let toastId = 0

const tones = {
  success: {
    icon: 'check',
    box: 'bg-emerald-600 text-white',
    iconColor: 'text-white',
  },
  error: {
    icon: 'xcircle',
    box: 'bg-red-600 text-white',
    iconColor: 'text-white',
  },
  info: {
    icon: 'info',
    box: 'bg-primary text-white',
    iconColor: 'text-white',
  },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message, tone = 'info', duration = 4500) => {
      const id = ++toastId
      setToasts((list) => [...list, { id, message, tone }])
      if (duration) {
        setTimeout(() => dismiss(id), duration)
      }
      return id
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      success: (message) => push(message, 'success'),
      error: (message) => push(message, 'error'),
      info: (message) => push(message, 'info'),
      dismiss,
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg animate-fade-in ${tones[t.tone].box}`}
            role="status"
          >
            <Icon name={tones[t.tone].icon} className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="ml-1 rounded-full p-0.5 opacity-80 transition hover:opacity-100"
              aria-label="Descartar"
            >
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>')
  }
  return ctx
}

/** Convierte un error (ApiErrorDTO o generico) en mensaje presentable. */
export function messageFromError(error, fallback = 'No fue posible completar la operacion.') {
  return error?.message ?? fallback
}