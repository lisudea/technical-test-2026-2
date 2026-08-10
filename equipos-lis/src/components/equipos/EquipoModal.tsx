import { useEffect, useRef, useState, type FormEvent } from 'react'
import { getErrorMessage, isApiError } from '../../api/client'
import { crearEquipo, actualizarEquipo } from '../../api/equipos'
import { CATEGORIAS, ESTADOS_EQUIPO } from '../../api/types'
import type { CategoriaEquipo, Equipo, EstadoEquipo } from '../../api/types'
import { useLanguage } from '../../i18n/LanguageContext'

// Este componente muestra un modal de formulario para crear o editar un equipo.
// Centraliza la validación de campos, el manejo de errores del servidor y el envío de la petición
// de creación o actualización a la API, devolviendo el control al componente padre al guardar.

export interface EquipoModalProps {
  equipo: Equipo | null
  onClose: () => void
  onSaved: () => void
}

interface FormEquipo {
  id: string
  nombre: string
  numeroSerie: string
  categoria: CategoriaEquipo | ''
  estado: EstadoEquipo | ''
}

function formInicial(equipo: Equipo | null): FormEquipo {
  return {
    id: equipo ? String(equipo.id) : '',
    nombre: equipo?.nombre ?? '',
    numeroSerie: equipo?.numeroSerie ?? '',
    categoria: equipo?.categoria ?? '',
    estado: equipo?.estado ?? '',
  }
}

export default function EquipoModal({ equipo, onClose, onSaved }: EquipoModalProps) {
  const { t } = useLanguage()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState<FormEquipo>(() => formInicial(equipo))
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const editando = equipo !== null

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
    }
  }, [])

  function cambiarCampo(campo: keyof FormEquipo, valor: string) {
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
    if (!form.id.trim() || Number.isNaN(Number(form.id))) {
      locales.id = t('campo.obligatorio')
    }
    if (!form.nombre.trim()) locales.nombre = t('campo.obligatorio')
    if (!form.numeroSerie.trim()) locales.numeroSerie = t('campo.obligatorio')
    if (!form.categoria) locales.categoria = t('campo.obligatorio')
    if (!form.estado) locales.estado = t('campo.obligatorio')
    if (Object.keys(locales).length > 0) {
      setErrores(locales)
      return
    }

    setEnviando(true)
    try {
      const data: Equipo = {
        id: Number(form.id),
        nombre: form.nombre.trim(),
        numeroSerie: form.numeroSerie.trim(),
        categoria: form.categoria as CategoriaEquipo,
        estado: form.estado as EstadoEquipo,
      }
      if (editando) {
        await actualizarEquipo(data)
      } else {
        await crearEquipo(data)
      }
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
          setErrorGeneral(e.message || getErrorMessage(e, t('modal.error.general')))
        }
      } else {
        setErrorGeneral(t('modal.error.general'))
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby="modal-equipo-titulo"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <form className="modal__inner" onSubmit={guardar} noValidate>
        <div className="modal__head">
          <h2 className="modal__titulo" id="modal-equipo-titulo">
            {editando ? t('modal.equipo.titulo.editar') : t('modal.equipo.titulo.crear')}
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
            <span className="campo__label">{t('modal.equipo.id')}</span>
            <input
              className={`campo__input${errores.id ? ' campo__input--error' : ''}`}
              name="id"
              type="number"
              min={1}
              step={1}
              required
              disabled={editando || enviando}
              autoFocus={!editando}
              value={form.id}
              onChange={(event) => cambiarCampo('id', event.target.value)}
              aria-invalid={Boolean(errores.id)}
              aria-describedby={errores.id ? 'error-id' : 'ayuda-id'}
            />
            {errores.id ? (
              <span className="campo__error" id="error-id" role="alert">
                {errores.id}
              </span>
            ) : (
              <span className="campo__ayuda" id="ayuda-id">
                {t('modal.equipo.idAyuda')}
              </span>
            )}
          </label>

          <label className="campo">
            <span className="campo__label">{t('modal.equipo.nombre')}</span>
            <input
              className={`campo__input${errores.nombre ? ' campo__input--error' : ''}`}
              name="nombre"
              type="text"
              required
              disabled={enviando}
              autoFocus={editando}
              value={form.nombre}
              onChange={(event) => cambiarCampo('nombre', event.target.value)}
              aria-invalid={Boolean(errores.nombre)}
              aria-describedby={errores.nombre ? 'error-nombre' : undefined}
            />
            {errores.nombre && (
              <span className="campo__error" id="error-nombre" role="alert">
                {errores.nombre}
              </span>
            )}
          </label>

          <label className="campo">
            <span className="campo__label">{t('modal.equipo.numeroSerie')}</span>
            <input
              className={`campo__input${errores.numeroSerie ? ' campo__input--error' : ''}`}
              name="numeroSerie"
              type="text"
              required
              disabled={enviando}
              value={form.numeroSerie}
              onChange={(event) => cambiarCampo('numeroSerie', event.target.value)}
              aria-invalid={Boolean(errores.numeroSerie)}
              aria-describedby={errores.numeroSerie ? 'error-numeroSerie' : undefined}
            />
            {errores.numeroSerie && (
              <span className="campo__error" id="error-numeroSerie" role="alert">
                {errores.numeroSerie}
              </span>
            )}
          </label>

          <label className="campo">
            <span className="campo__label">{t('modal.equipo.categoria')}</span>
            <span className="campo__select-wrap">
              <select
                className={`campo__select${errores.categoria ? ' campo__input--error' : ''}`}
                value={form.categoria}
                disabled={enviando}
                onChange={(event) => cambiarCampo('categoria', event.target.value)}
                aria-invalid={Boolean(errores.categoria)}
                aria-describedby={errores.categoria ? 'error-categoria' : undefined}
              >
                <option value="">{t('filtros.todasCategorias')}</option>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {t(`categoria.${c}`)}
                  </option>
                ))}
              </select>
            </span>
            {errores.categoria && (
              <span className="campo__error" id="error-categoria" role="alert">
                {errores.categoria}
              </span>
            )}
          </label>

          <label className="campo">
            <span className="campo__label">{t('modal.equipo.estado')}</span>
            <span className="campo__select-wrap">
              <select
                className={`campo__select${errores.estado ? ' campo__input--error' : ''}`}
                value={form.estado}
                disabled={enviando}
                onChange={(event) => cambiarCampo('estado', event.target.value)}
                aria-invalid={Boolean(errores.estado)}
                aria-describedby={errores.estado ? 'error-estado' : undefined}
              >
                <option value="">{t('filtros.todosEstados')}</option>
                {ESTADOS_EQUIPO.map((e) => (
                  <option key={e} value={e}>
                    {t(`estado.${e}`)}
                  </option>
                ))}
              </select>
            </span>
            {errores.estado && (
              <span className="campo__error" id="error-estado" role="alert">
                {errores.estado}
              </span>
            )}
          </label>
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
          <button type="submit" className="btn btn--primary" disabled={enviando}>
            {enviando && <span className="btn__spinner" aria-hidden="true" />}
            {editando ? t('modal.equipo.guardar') : t('modal.equipo.registrar')}
          </button>
        </div>
      </form>
    </dialog>
  )
}
