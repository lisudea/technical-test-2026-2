import { useEffect, useState } from 'react'

/**
 * Devuelve el valor con retardo: solo se actualiza cuando deja de cambiar
 * durante `delay` milisegundos.
 *
 * Se usa en el buscador para no filtrar en cada pulsacion de tecla.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}