'use client'

import { useState } from 'react'
import { CalendarCheck, CalendarPlus, Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useEquipmentCatalogs } from '@/hooks/use-equipment-catalogs'
import { useEquipmentList } from '@/hooks/use-equipment-list'
import { useEquipmentReservations } from '@/hooks/use-equipment-reservations'
import { EquipmentReservationsList } from '@/components/equipment/equipment-reservations-list'
import { PaginationControl } from '@/components/shared/pagination-control'
import { createEquipment, getEquipmentAvailability, updateEquipment } from '@/lib/api/equipment'
import { createReservation } from '@/lib/api/reservations'
import { formatDateTime, localInputToIso } from '@/lib/date'
import type { AvailabilityResponse, Equipment, EquipmentInput } from '@/types/equipment'

export default function ManagementPage() {
  const { equipmentPage, isLoading, refresh } = useEquipmentList({ page: 0, size: 200 })
  const { categories, statuses } = useEquipmentCatalogs()
  const equipment = equipmentPage?.content ?? []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight">Administración</h1><p className="text-sm text-muted-foreground">Crea y actualiza equipos, o registra una nueva reserva.</p></div>
        <div className="flex gap-2"><ReservationForm equipment={equipment} onSaved={refresh} /><EquipmentForm categories={categories} statuses={statuses} onSaved={refresh} /></div>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Cargando equipos…</p> : null}
      {!isLoading && equipment.length === 0 ? <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">No hay equipos creados.</p> : <div className="overflow-hidden rounded-lg border">{equipment.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 border-b p-3 last:border-b-0"><div><p className="font-medium">{item.name}</p><p className="text-sm text-muted-foreground">{item.category.name} · {item.operationalStatus.name}</p></div><EquipmentForm equipment={item} categories={categories} statuses={statuses} onSaved={refresh} /></div>)}</div>}
      <EquipmentAgenda equipment={equipment} />
    </div>
  )
}

function EquipmentAgenda({ equipment }: { equipment: Equipment[] }) {
  const [equipmentId, setEquipmentId] = useState('')
  const [page, setPage] = useState(0)
  const { reservations, totalPages, isLoading, error, refresh } = useEquipmentReservations(equipmentId || undefined, page)

  return <section className="flex flex-col gap-4 rounded-lg border p-4"><div><h2 className="font-semibold">Reservas del equipo</h2><p className="text-sm text-muted-foreground">Consulta su historial y cancela reservas activas.</p></div><CatalogSelect label="Equipo" value={equipmentId} onChange={(value) => { setEquipmentId(value); setPage(0) }} items={equipment.map((item) => ({ id: item.id, name: item.name }))} />{!equipmentId ? <p className="text-sm text-muted-foreground">Selecciona un equipo para ver sus reservas.</p> : error ? <p className="text-sm text-destructive">No se pudieron cargar las reservas.</p> : <><EquipmentReservationsList reservations={reservations} isLoading={isLoading} onCancelled={() => refresh()} /><PaginationControl page={page} totalPages={totalPages} onPageChange={setPage} /></>}</section>
}

function EquipmentForm({ equipment, categories, statuses, onSaved }: { equipment?: Equipment; categories: Equipment['category'][]; statuses: Equipment['operationalStatus'][]; onSaved: () => void }) {
  const [open, setOpen] = useState(false), [saving, setSaving] = useState(false)
  const [name, setName] = useState(equipment?.name ?? ''), [serialNumber, setSerialNumber] = useState(equipment?.serialNumber ?? ''), [macAddress, setMacAddress] = useState(equipment?.macAddress ?? ''), [categoryId, setCategoryId] = useState(equipment?.category.id ?? ''), [operationalStatusId, setOperationalStatusId] = useState(equipment?.operationalStatus.id ?? '')
  const editing = Boolean(equipment)
  async function save() {
    if (!name.trim() || !categoryId || !operationalStatusId || (!serialNumber.trim() && !macAddress.trim())) { toast.error('Completa los campos obligatorios e ingresa un serial o una MAC.'); return }
    setSaving(true)
    const input: EquipmentInput = { name: name.trim(), serialNumber: serialNumber.trim() || undefined, macAddress: macAddress.trim() || undefined, categoryId, operationalStatusId }
    try { if (equipment) await updateEquipment(equipment.id, input); else await createEquipment(input); toast.success(editing ? 'Equipo actualizado.' : 'Equipo creado.'); setOpen(false); onSaved() } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo guardar el equipo.') } finally { setSaving(false) }
  }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button variant={editing ? 'outline' : 'default'} size={editing ? 'sm' : 'default'}>{editing ? <Pencil data-icon="inline-start" /> : <Plus data-icon="inline-start" />}{editing ? 'Editar' : 'Nuevo equipo'}</Button>} /><DialogContent><DialogHeader><DialogTitle>{editing ? 'Actualizar equipo' : 'Crear equipo'}</DialogTitle><DialogDescription>Nombre, serial/MAC, categoría y estado operacional.</DialogDescription></DialogHeader><FieldGroup><Field><FieldLabel>Nombre</FieldLabel><Input value={name} onChange={(e) => setName(e.target.value)} /></Field><Field><FieldLabel>Número de serie</FieldLabel><Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} /></Field><Field><FieldLabel>Dirección MAC</FieldLabel><Input value={macAddress} onChange={(e) => setMacAddress(e.target.value)} /></Field><CatalogSelect label="Categoría" value={categoryId} onChange={setCategoryId} items={categories} /><CatalogSelect label="Estado operacional" value={operationalStatusId} onChange={setOperationalStatusId} items={statuses} /></FieldGroup><DialogFooter><Button onClick={save} disabled={saving}>{saving && <Spinner data-icon="inline-start" />}{editing ? 'Guardar cambios' : 'Crear equipo'}</Button></DialogFooter></DialogContent></Dialog>
}

function CatalogSelect({ label, value, onChange, items }: { label: string; value: string; onChange: (value: string) => void; items: { id: string; name: string }[] }) { return <Field><FieldLabel>{label}</FieldLabel><Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue>{items.find((item) => item.id === value)?.name ?? `Selecciona ${label.toLowerCase()}`}</SelectValue></SelectTrigger><SelectContent><SelectGroup>{items.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field> }

function ReservationForm({ equipment, onSaved }: { equipment: Equipment[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false), [saving, setSaving] = useState(false), [checking, setChecking] = useState(false)
  const [equipmentId, setEquipmentId] = useState(''), [name, setName] = useState(''), [email, setEmail] = useState(''), [startAt, setStartAt] = useState(''), [endAt, setEndAt] = useState('')
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null)
  const clearAvailability = () => setAvailability(null)
  async function checkAvailability() {
    if (!equipmentId || !startAt || !endAt) { toast.error('Selecciona equipo, inicio y fin antes de consultar.'); return }
    setChecking(true)
    try { setAvailability(await getEquipmentAvailability(equipmentId, localInputToIso(startAt), localInputToIso(endAt))) } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo consultar la disponibilidad.') } finally { setChecking(false) }
  }
  async function save() {
    if (!equipmentId || !name.trim() || !email.trim() || !startAt || !endAt) { toast.error('Completa todos los campos de la reserva.'); return }
    if (availability?.availability !== 'AVAILABLE') { toast.error('Consulta y confirma la disponibilidad antes de crear la reserva.'); return }
    setSaving(true)
    try { await createReservation({ equipmentId, requesterName: name.trim(), requesterEmail: email.trim(), startAt: localInputToIso(startAt), endAt: localInputToIso(endAt) }); toast.success('Reserva creada.'); setOpen(false); onSaved() } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo crear la reserva.') } finally { setSaving(false) }
  }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button variant="outline"><CalendarPlus data-icon="inline-start" />Nueva reserva</Button>} /><DialogContent><DialogHeader><DialogTitle>Nueva reserva</DialogTitle><DialogDescription>Primero consulta disponibilidad; después podrás confirmar la reserva.</DialogDescription></DialogHeader><FieldGroup><CatalogSelect label="Equipo" value={equipmentId} onChange={(value) => { setEquipmentId(value); clearAvailability() }} items={equipment.map((item) => ({ id: item.id, name: item.name }))} /><Field><FieldLabel>Solicitante</FieldLabel><Input value={name} onChange={(e) => setName(e.target.value)} /></Field><Field><FieldLabel>Correo electrónico</FieldLabel><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field><Field><FieldLabel>Inicio</FieldLabel><Input type="datetime-local" value={startAt} onChange={(e) => { setStartAt(e.target.value); clearAvailability() }} /></Field><Field><FieldLabel>Fin</FieldLabel><Input type="datetime-local" value={endAt} onChange={(e) => { setEndAt(e.target.value); clearAvailability() }} /></Field><Button type="button" variant="outline" onClick={checkAvailability} disabled={checking}>{checking ? <Spinner data-icon="inline-start" /> : <CalendarCheck data-icon="inline-start" />}{checking ? 'Consultando…' : 'Consultar disponibilidad'}</Button>{availability ? <p className={availability.availability === 'AVAILABLE' ? 'text-sm text-green-700' : 'text-sm text-destructive'}>{availability.availability === 'AVAILABLE' ? 'El equipo está disponible para este rango.' : availability.availability === 'MAINTENANCE' ? 'El equipo está en mantenimiento.' : 'El equipo está reservado en este rango.'}{availability.nextAvailableStartAt ? ` Próximo horario disponible: ${formatDateTime(availability.nextAvailableStartAt)}.` : ''}</p> : null}</FieldGroup><DialogFooter><Button onClick={save} disabled={saving || availability?.availability !== 'AVAILABLE'}>{saving && <Spinner data-icon="inline-start" />}Crear reserva</Button></DialogFooter></DialogContent></Dialog>
}
