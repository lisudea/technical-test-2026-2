import { es, type Dictionary } from '@/locales/es'

/**
 * Static dictionary accessor. The system currently ships with a single
 * locale (`es`, matching the backend's error messages) but is structured
 * so a locale switcher can be added later without touching call sites —
 * just resolve `dictionary` from a language/context value instead.
 */
export const dictionary: Dictionary = es
