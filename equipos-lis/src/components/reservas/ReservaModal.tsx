import { useEffect, useRef, useState, type FormEvent } from 'react'
import { getErrorMessage, isApiError } from '../../api/client'
import { listarEquipos } from '../../api/equipos'
import { crearReserva } from '../../api/reservas'
import type { Equipo, ReservaRequest } from '../../api/types'
import { useLanguage } from '../../i18n/LanguageContext'
import { aISO } from '../../utils/fechas'

// Este componente muestra el formulario para crear una nueva reserva.
// Carga los equipos disponibles y reservados para llenar el selector, valida los campos del formulario
// y envía la solicitud de creación al backend, informando al padre cuando la operación finaliza.

export interface ReservaModalProps {
  onClose: () => void
  onSaved: () => void
}

interface FormReserva {
  nombreUsuario: string
  correoUsuario: string
  equipoId: string
  fechaReserva: string
  fechaDevolucion: string
}

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function fechaMinima(): string {
  const ahora = new Date()
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export default function ReservaModal({ onClose, onSaved }: ReservaModalProps) {
  const { t } = useLanguage()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState<FormReserva>({
    nombreUsuario: '',
    correoUsuario: '',
    equipoId: '',
    fechaReserva: '',
    fechaDevolucion: '',
  })
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [cargandoEquipos, setCargandoEquipos] = useState(true)
  const [errorEquipos, setErrorEquipos] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      listarEquipos({ estado: 'DISPONIBLE', page: 0, size: 100 }),
      listarEquipos({ estado: 'RESERVADO', page: 0, size: 100 }),
    ])
      .then(([disponibles, reservados]) => {
        if (!cancelled) {
          setEquipos([...disponibles.contenido, ...reservados.contenido])
        }
      })
      .catch(() => {
        if (!cancelled) setErrorEquipos(true)
      })
      .finally(() => {
        if (!cancelled) setCargandoEquipos(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function cambiarCampo(campo: keyof FormReserva, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErrores((prev) => {
      if (!(campo in prev)) return prev
      const next = { ...prev }
      delete next[campo]
      return next
    })
  }

  async function guardar(event: FormEvent) {
    event.preventDefault()
    setErrorGeneral(null)

    const locales: Record<string, string> = {}
    if (!form.nombreUsuario.trim()) {
      locales.nombreUsuario = t('campo.obligatorio')
    }
    if (!form.correoUsuario.trim()) {
      locales.correoUsuario = t('campo.obligatorio')
    } else if (!CORREO_RE.test(form.correoUsuario)) {
      locales.correoUsuario = t('reserva.correoInvalido')
    }
    if (!form.equipoId) {
      locales.equipoId = t('campo.obligatorio')
    }
    if (!form.fechaReserva) {
      locales.fechaReserva = t('campo.obligatorio')
    }
    if (!form.fechaDevolucion) {
      locales.fechaDevolucion = t('campo.obligatorio')
    } else if (
      form.fechaReserva &&
      form.fechaDevolucion <= form.fechaReserva
    ) {
      locales.fechaDevolucion = t('reserva.devolucionPosterior')
    }
    if (Object.keys(locales).length > 0) {
      setErrores(locales)
      return
    }

    setEnviando(true)
    try {
      const data: ReservaRequest = {
        nombreUsuario: form.nombreUsuario.trim(),
        correoUsuario: form.correoUsuario.trim(),
        equipoId: Number(form.equipoId),
        fechaReserva: aISO(form.fechaReserva),
        fechaDevolucion: aISO(form.fechaDevolucion),
      }
      await crearReserva(data)
      onSaved()
    } catch (e) {
      if (isApiError(e)) {
        const campos = e.errors ?? []
        if (campos.length > 0) {
          const porCampo: Record<string, string> = {}
          for (const f of campos) {
            porCampo[f.campo] = f.mensaje
          }
          setErrores(porCampo)
        } else {
          setErrorGeneral(e.message || getErrorMessage(e, t('reserva.error.general')))
        }
      } else {
        setErrorGeneral(t('reserva.error.general'))
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby="modal-reserva-titulo"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <form className="modal__inner" onSubmit={guardar} noValidate>
        <div className="modal__head">
          <h2 className="modal__titulo" id="modal-reserva-titulo">
            {t('reserva.titulo')}
          </h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label={t('modal.cerrar')}
            disabled={enviando}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M2 2l12 12M14 2L2 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {errorGeneral && (
          <div className="alerta" role="alert">
            <p>{errorGeneral}</p>
          </div>
        )}

        <div className="modal__campos">
          <label className="campo">
            <span className="campo__label">{t('reserva.nombreUsuario')}</span>
            <input
              className={`campo__input${errores.nombreUsuario ? ' campo__input--error' : ''}`}
              name="nombreUsuario"
              type="text"
              required
              disabled={enviando}
              autoFocus
              value={form.nombreUsuario}
              onChange={(event) => cambiarCampo('nombreUsuario', event.target.value)}
              aria-invalid={Boolean(errores.nombreUsuario)}
              aria-describedby={errores.nombreUsuario ? 'error-nombreUsuario' : undefined}
            />
            {errores.nombreUsuario && (
              <span className="campo__error" id="error-nombreUsuario" role="alert">
                {errores.nombreUsuario}
              </span>
            )}
          </label>

          <label className="campo">
            <span className="campo__label">{t('reserva.correoUsuario')}</span>
            <input
              className={`campo__input${errores.correoUsuario ? ' campo__input--error' : ''}`}
              name="correoUsuario"
              type="email"
              required
              disabled={enviando}
              value={form.correoUsuario}
              onChange={(event) => cambiarCampo('correoUsuario', event.target.value)}
              aria-invalid={Boolean(errores.correoUsuario)}
              aria-describedby={errores.correoUsuario ? 'error-correoUsuario' : undefined}
            />
            {errores.correoUsuario && (
              <span className="campo__error" id="error-correoUsuario" role="alert">
                {errores.correoUsuario}
              </span>
            )}
          </label>

          <label className="campo">
            <span className="campo__label">{t('reserva.equipo')}</span>
            <span className="campo__select-wrap">
              <select
                className={`campo__select${errores.equipoId ? ' campo__input--error' : ''}`}
                value={form.equipoId}
                disabled={enviando || cargandoEquipos}
                onChange={(event) => cambiarCampo('equipoId', event.target.value)}
                aria-invalid={Boolean(errores.equipoId)}
                aria-describedby={errores.equipoId ? 'error-equipoId' : undefined}
              >
                <option value="">{t('reserva.seleccionarEquipo')}</option>
                {equipos.map((equipo) => (
                  <option key={equipo.id} value={equipo.id}>
                    {equipo.nombre} · {equipo.numeroSerie}
                  </option>
                ))}
              </select>
            </span>
            {errores.equipoId ? (
              <span className="campo__error" id="error-equipoId" role="alert">
                {errores.equipoId}
              </span>
            ) : errorEquipos ? (
              <span className="campo__error" role="alert">
                {t('reserva.errorEquipos')}
              </span>
            ) : !cargandoEquipos && equipos.length === 0 ? (
              <span className="campo__ayuda">{t('reserva.sinEquipos')}</span>
            ) : (
              <span className="campo__ayuda" aria-hidden="true" />
            )}
          </label>

          <div className="modal__dos-columnas">
            <label className="campo">
              <span className="campo__label">{t('reserva.fechaReserva')}</span>
              <input
                className={`campo__input${errores.fechaReserva ? ' campo__input--error' : ''}`}
                name="fechaReserva"
                type="datetime-local"
                min={fechaMinima()}
                required
                disabled={enviando}
                value={form.fechaReserva}
                onChange={(event) => cambiarCampo('fechaReserva', event.target.value)}
                aria-invalid={Boolean(errores.fechaReserva)}
                aria-describedby={errores.fechaReserva ? 'error-fechaReserva' : undefined}
              />
              {errores.fechaReserva && (
                <span className="campo__error" id="error-fechaReserva" role="alert">
                  {errores.fechaReserva}
                </span>
              )}
            </label>

            <label className="campo">
              <span className="campo__label">{t('reserva.fechaDevolucion')}</span>
              <input
                className={`campo__input${errores.fechaDevolucion ? ' campo__input--error' : ''}`}
                name="fechaDevolucion"
                type="datetime-local"
                required
                disabled={enviando}
                value={form.fechaDevolucion}
                onChange={(event) => cambiarCampo('fechaDevolucion', event.target.value)}
                aria-invalid={Boolean(errores.fechaDevolucion)}
                aria-describedby={
                  errores.fechaDevolucion ? 'error-fechaDevolucion' : undefined
                }
              />
              {errores.fechaDevolucion && (
                <span className="campo__error" id="error-fechaDevolucion" role="alert">
                  {errores.fechaDevolucion}
                </span>
              )}
            </label>
          </div>
        </div>

        <div className="modal__acciones">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            disabled={enviando}
          >
            {t('modal.equipo.cancelar')}
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={enviando || (cargandoEquipos && equipos.length === 0)}
          >
            {enviando && <span className="btn__spinner" aria-hidden="true" />}
            {t('reserva.crear')}
          </button>
        </div>
      </form>
    </dialog>
  )
}
