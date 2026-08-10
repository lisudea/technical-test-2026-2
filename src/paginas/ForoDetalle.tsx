import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { foro } from '../api/servicios'
import { useAuth } from '../auth/AuthContext'
import Alerta from '../componentes/Alerta'

export default function ForoDetalle() {
  const { id = '' } = useParams()
  const { t, i18n } = useTranslation()
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const consulta = useQuery({ queryKey: ['foro', id], queryFn: () => foro.obtener(id) })

  const eliminar = useMutation({
    mutationFn: () => foro.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foro'] })
      navigate('/foro')
    },
  })

  if (consulta.isLoading) return <div className="mx-auto max-w-2xl skeleton h-64 rounded-(--radius-card)" />
  if (consulta.isError || !consulta.data)
    return <div className="mx-auto max-w-2xl"><Alerta tipo="error">{t('comun.errorRed')}</Alerta></div>

  const p = consulta.data
  const puedeBorrar = usuario && (usuario.rol === 'ADMIN' || usuario.id === p.autorId)
  const fecha = new Date(p.creadaEn).toLocaleString(i18n.language, { dateStyle: 'long', timeStyle: 'short' })

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link to="/foro" className="text-[14px] font-medium text-accent">‹ {t('foro.volver')}</Link>
      <div className="rounded-(--radius-card) bg-surface p-6">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-accent/12 px-2.5 py-0.5 text-[11px] font-semibold text-accent">{t(`foro.cat.${p.categoria}`)}</span>
          <span className="text-[12px] text-tlabel">{fecha}</span>
        </div>
        <h1 className="mt-2 text-[24px] font-bold tracking-tight text-label">{p.titulo}</h1>
        <p className="mt-1 text-[13px] text-slabel">— {p.autorNombre}</p>
        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-label">{p.contenido}</p>
        {puedeBorrar && (
          <button onClick={() => eliminar.mutate()} disabled={eliminar.isPending}
            className="mt-6 text-[14px] font-medium text-bad disabled:opacity-40">
            {t('foro.eliminar')}
          </button>
        )}
      </div>
    </div>
  )
}
