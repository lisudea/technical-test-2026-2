import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import MascotaLis from './MascotaLis'
import { claseBoton } from './TarjetaAuth'

interface Props {
  alResolver: () => void
}

export default function SheetIntruso({ alResolver }: Props) {
  const { t } = useTranslation()
  const lineas = [t('intruso.linea1'), t('intruso.linea2'), t('intruso.linea3')]
  const [escrito, setEscrito] = useState('')
  const [terminado, setTerminado] = useState(false)

  useEffect(() => {
    const completo = lineas.join('\n')
    let i = 0
    const intervalo = setInterval(() => {
      i += 2
      setEscrito(completo.slice(0, i))
      if (i >= completo.length) {
        clearInterval(intervalo)
        setTimeout(() => setTerminado(true), 500)
      }
    }, 28)
    return () => clearInterval(intervalo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="velo-entrada fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4">
      <div className="sheet-entrada w-full rounded-t-(--radius-sheet) bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-sm sm:rounded-(--radius-sheet)">
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-tlabel sm:hidden" aria-hidden />

        <pre className="min-h-20 whitespace-pre-wrap rounded-(--radius-control) bg-black/80 p-3.5 font-mono text-[12px] leading-relaxed text-green-400">
          {escrito}
          {!terminado && <span className="animate-pulse">▋</span>}
        </pre>

        {terminado && (
          <div className="velo-entrada mt-5 space-y-4 text-center">
            <div className="flex justify-center">
              <MascotaLis nivel={1} tamano={88} />
            </div>
            <p className="text-[19px] font-bold text-label">{t('intruso.titulo')}</p>
            <p className="text-[14px] leading-relaxed text-slabel">{t('intruso.saludo')}</p>
            <button onClick={alResolver} className={claseBoton}>
              {t('intruso.boton')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
