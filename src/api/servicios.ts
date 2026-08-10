import { api } from './cliente'
import type {
  Equipo,
  Mascota,
  Publicacion,
  CategoriaForo,
  RegistroAuditoria,
  SesionActiva,
  Paginado,
  Reserva,
  ResumenEstadisticas,
  Sesion,
  TopEquipo,
  Usuario,
} from './tipos'

function conParams(ruta: string, filtros: Record<string, string | number | undefined>) {
  const params = new URLSearchParams()
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== '') params.set(clave, String(valor))
  })
  const cadena = params.toString()
  return cadena ? `${ruta}?${cadena}` : ruta
}

export const equipos = {
  listar: (filtros: Record<string, string | number | undefined>) =>
    api<Paginado<Equipo>>(conParams('/equipos', filtros)),
  crear: (datos: Partial<Equipo>) => api<Equipo>('/equipos', { metodo: 'POST', cuerpo: datos }),
  actualizar: (id: string, datos: Partial<Equipo>) =>
    api<Equipo>(`/equipos/${id}`, { metodo: 'PATCH', cuerpo: datos }),
  disponibilidad: (id: string, desde: string, hasta: string) =>
    api<{ inicio: string; fin: string }[]>(
      `/equipos/${id}/disponibilidad?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`,
    ),
}

export const reservas = {
  listar: (filtros: Record<string, string | number | undefined>) =>
    api<Paginado<Reserva>>(conParams('/reservas', filtros)),
  crear: (datos: {
    equipoId: string
    nombreUsuario: string
    correoUsuario: string
    inicio: string
    fin: string
  }) => api<Reserva>('/reservas', { metodo: 'POST', cuerpo: datos }),
  cancelar: (id: string) => api<Reserva>(`/reservas/${id}/cancelar`, { metodo: 'PATCH' }),
}

export const estadisticas = {
  resumen: () => api<ResumenEstadisticas>('/estadisticas/resumen'),
  topEquipos: (limite = 5) => api<TopEquipo[]>(`/estadisticas/top-equipos?limite=${limite}`),
}

export const usuarios = {
  listar: (filtros: Record<string, string | number | undefined>) =>
    api<Paginado<Usuario & { creadoEn: string }>>(conParams('/usuarios', filtros)),
  cambiarRol: (id: string, rol: 'USUARIO' | 'ADMIN') =>
    api<Usuario>(`/usuarios/${id}/rol`, { metodo: 'PATCH', cuerpo: { rol } }),
}

export const auditoria = {
  listar: (filtros: Record<string, string | number | undefined>) =>
    api<Paginado<RegistroAuditoria>>(conParams('/auditoria', filtros)),
}

export const mascota = {
  obtener: () => api<Mascota>('/mascota'),
  actualizar: (datos: { nombre?: string; equipados?: string[] }) =>
    api<Mascota>('/mascota', { metodo: 'PATCH', cuerpo: datos }),
  sumarXp: (puntos: number) =>
    api<{ xp: number; ganados: number; objetoGanado: string | null }>('/mascota/xp', {
      metodo: 'POST',
      cuerpo: { puntos },
    }),
  abrirRegalo: () => api<{ objetoGanado: string | null }>('/mascota/regalo', { metodo: 'POST' }),
}

export const foro = {
  listar: (filtros: Record<string, string | number | undefined>) =>
    api<Paginado<Publicacion>>(conParams('/foro', filtros)),
  obtener: (id: string) => api<Publicacion>(`/foro/${id}`),
  crear: (datos: { titulo: string; contenido: string; categoria: CategoriaForo }) =>
    api<{ publicacion: Publicacion; objetoGanado: string | null }>('/foro', {
      metodo: 'POST',
      cuerpo: datos,
    }),
  eliminar: (id: string) => api<{ mensaje: string }>(`/foro/${id}`, { metodo: 'DELETE' }),
}

export const auth = {
  registro: (datos: { nombre: string; correo: string; contrasena: string }) =>
    api<Sesion>('/auth/registro', { metodo: 'POST', cuerpo: datos }),
  login: (datos: { correo: string; contrasena: string }) =>
    api<Sesion>('/auth/login', { metodo: 'POST', cuerpo: datos }),
  google: (idToken: string) => api<Sesion>('/auth/google', { metodo: 'POST', cuerpo: { idToken } }),
  logout: (refreshToken: string) =>
    api<{ mensaje: string }>('/auth/logout', { metodo: 'POST', cuerpo: { refreshToken } }),
  olvideContrasena: (correo: string) =>
    api<{ mensaje: string }>('/auth/olvide-contrasena', { metodo: 'POST', cuerpo: { correo } }),
  restablecerContrasena: (token: string, contrasenaNueva: string) =>
    api<{ mensaje: string }>('/auth/restablecer-contrasena', {
      metodo: 'POST',
      cuerpo: { token, contrasenaNueva },
    }),
  perfil: () => api<Usuario & { creadoEn: string }>('/auth/perfil'),
  sesiones: () => api<SesionActiva[]>('/auth/sesiones'),
  revocarSesion: (id: string) =>
    api<{ mensaje: string }>(`/auth/sesiones/${id}`, { metodo: 'DELETE' }),
  cambiarContrasena: (datos: { contrasenaActual: string; contrasenaNueva: string }) =>
    api<{ mensaje: string }>('/auth/cambiar-contrasena', { metodo: 'PATCH', cuerpo: datos }),
}
