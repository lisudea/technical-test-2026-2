import { useEffect, useState } from 'react'

import { client } from '../../api/client'
import { useToast } from '../../feedback/useToast'
import { useI18n } from '../../i18n/useI18n'
import { toDisplayableError } from '../../utils/errors'
import { Spinner } from '../common/Feedback'
import { EQUIPMENT_CATEGORIES, EQUIPMENT_STATUSES } from '../../types/api'
import type { DisplayableError } from '../../utils/errors'
import type {
  Equipment,
  EquipmentCategory,
  EquipmentPayload,
  EquipmentStatus,
} from '../../types/api'
import type { TranslationKey } from '../../i18n/types'

interface EquipmentFormProps {
  /** Equipo a editar, o null para registrar uno nuevo. */
  editing: Equipment | null
  onSaved: () => void
  onCancelEdit: () => void
}

const EMPTY: EquipmentPayload = {
  name: '',
  serialNumber: '',
  category: 'MICROCONTROLLERS',
  status: 'AVAILABLE',
}

/**
 * Alta y edicion de equipos (POST y PUT /api/equipment).
 *
 * Muestra los errores de validacion del backend campo a campo, y el 409 de
 * numero de serie duplicado como aviso destacado.
 */
export function EquipmentForm({ editing, onSaved, onCancelEdit }: EquipmentFormProps) {
  const { t } = useI18n()
  const toast = useToast()

  const [form, setForm] = useState<EquipmentPayload>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<DisplayableError | null>(null)
  const [localErrorKey, setLocalErrorKey] = useState<TranslationKey | null>(null)

  // Al elegir un equipo para editar, se vuelcan sus datos en el formulario.
  useEffect(() => {
    setError(null)
    setLocalErrorKey(null)

    setForm(
      editing
        ? {
            name: editing.name,
            serialNumber: editing.serialNumber,
            category: editing.category,
            status: editing.status,
          }
        : EMPTY,
    )
  }, [editing])

  function update<K extends keyof EquipmentPayload>(key: K, value: EquipmentPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  /** Mensaje que el backend asocia a un campo concreto, si lo hay. */
  function fieldError(field: string): string | null {
    return error?.fieldErrors.find((item) => item.field === field)?.message ?? null
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    setError(null)
    setLocalErrorKey(null)

    if (!form.name.trim()) {
      setLocalErrorKey('admin.requiredName')
      return
    }

    if (!form.serialNumber.trim()) {
      setLocalErrorKey('admin.requiredSerial')
      return
    }

    setSaving(true)

    const payload: EquipmentPayload = {
      ...form,
      name: form.name.trim(),
      serialNumber: form.serialNumber.trim(),
    }

    try {
      if (editing) {
        await client.updateEquipment(editing.id, payload)
        toast.showSuccess('admin.updated')
      } else {
        await client.createEquipment(payload)
        toast.showSuccess('admin.created')
        setForm(EMPTY)
      }

      onSaved()
    } catch (caught) {
      setError(toDisplayableError(caught))
      toast.showError(caught)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h3 className="panel__title">
        {editing ? t('admin.editing', { name: editing.name }) : t('admin.new')}
      </h3>

      <div className="stack" style={{ gap: 'var(--space-3)' }}>
        <div className="field">
          <label className="field__label" htmlFor="equipment-name">
            {t('admin.name')}
          </label>
          <input
            id="equipment-name"
            type="text"
            className={`field__control${fieldError('name') ? ' field__control--invalid' : ''}`}
            placeholder={t('admin.namePlaceholder')}
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            maxLength={120}
            required
          />
          {fieldError('name') && <span className="field__error">{fieldError('name')}</span>}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="equipment-serial">
            {t('admin.serial')}
          </label>
          <input
            id="equipment-serial"
            type="text"
            className={`field__control${fieldError('serialNumber') ? ' field__control--invalid' : ''}`}
            placeholder={t('admin.serialPlaceholder')}
            value={form.serialNumber}
            onChange={(event) => update('serialNumber', event.target.value)}
            maxLength={80}
            required
          />
          {fieldError('serialNumber') && (
            <span className="field__error">{fieldError('serialNumber')}</span>
          )}
        </div>

        <div className="grid-2">
          <div className="field">
            <label className="field__label" htmlFor="equipment-category">
              {t('admin.category')}
            </label>
            <select
              id="equipment-category"
              className="field__control"
              value={form.category}
              onChange={(event) => update('category', event.target.value as EquipmentCategory)}
            >
              {EQUIPMENT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {t(`category.${category}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="equipment-status">
              {t('admin.status')}
            </label>
            <select
              id="equipment-status"
              className="field__control"
              value={form.status}
              onChange={(event) => update('status', event.target.value as EquipmentStatus)}
            >
              {EQUIPMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`status.${status}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {localErrorKey && (
          <div className="alert alert--error" role="alert">
            <div>{t(localErrorKey)}</div>
          </div>
        )}

        {error && (
          <div className="alert alert--error" role="alert">
            <div>
              <span className="alert__title">{t(error.titleKey)}</span>
              <div>{t(error.bodyKey)}</div>
              {error.detail && <div className="alert__detail">{error.detail}</div>}
            </div>
          </div>
        )}

        <div className="header__actions">
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? <Spinner /> : null}
            {saving ? t('admin.saving') : t('admin.save')}
          </button>

          {editing && (
            <button type="button" className="btn btn--secondary" onClick={onCancelEdit}>
              {t('admin.cancelEdit')}
            </button>
          )}
        </div>
      </div>
    </form>
  )
}