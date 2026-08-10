export type Tema = 'auto' | 'claro' | 'oscuro'

const CLAVE = 'lis-tema'

export function obtenerTema(): Tema {
  const guardado = localStorage.getItem(CLAVE)
  return guardado === 'claro' || guardado === 'oscuro' ? guardado : 'auto'
}

export function aplicarTema(tema: Tema) {
  localStorage.setItem(CLAVE, tema)
  const raiz = document.documentElement
  if (tema === 'auto') delete raiz.dataset.theme
  else raiz.dataset.theme = tema === 'claro' ? 'light' : 'dark'
}

export function siguienteTema(actual: Tema): Tema {
  return actual === 'auto' ? 'claro' : actual === 'claro' ? 'oscuro' : 'auto'
}
