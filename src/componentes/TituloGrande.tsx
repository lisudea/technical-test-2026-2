import { useEffect, useRef } from 'react'
import { useTituloBarra } from './TituloContext'

interface Props {
  titulo: string
  subtitulo?: string
  accion?: React.ReactNode
}

export default function TituloGrande({ titulo, subtitulo, accion }: Props) {
  const ref = useRef<HTMLHeadingElement>(null)
  const { setTitulo } = useTituloBarra()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observador = new IntersectionObserver(
      ([entrada]) => setTitulo(entrada.isIntersecting ? '' : titulo),
      { rootMargin: '-60px 0px 0px 0px' },
    )
    observador.observe(el)
    return () => {
      observador.disconnect()
      setTitulo('')
    }
  }, [titulo, setTitulo])

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 ref={ref} className="text-[28px] font-bold tracking-tight text-label sm:text-[32px]">
          {titulo}
        </h1>
        {subtitulo && <p className="mt-0.5 text-[15px] text-slabel">{subtitulo}</p>}
      </div>
      {accion}
    </div>
  )
}
