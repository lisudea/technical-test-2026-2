interface Props {
  titulo: string
  children: React.ReactNode
}

export default function TarjetaAuth({ titulo, children }: Props) {
  return (
    <div className="mx-auto mt-6 w-full max-w-sm">
      <h1 className="mb-4 px-1 text-[28px] font-bold tracking-tight text-label">{titulo}</h1>
      <div className="rounded-(--radius-card) bg-surface p-5">{children}</div>
    </div>
  )
}

export const claseCampo =
  'w-full rounded-(--radius-control) bg-fillc px-3.5 py-2.5 text-[16px] text-label placeholder:text-tlabel focus:outline-none focus:ring-2 focus:ring-accent/60 border-none'

export const claseBoton =
  'w-full rounded-(--radius-control) bg-accent px-4 py-2.5 text-[16px] font-semibold text-white transicion-spring hover:opacity-90 active:scale-[0.98] disabled:opacity-40'

export const claseEtiqueta = 'block text-[13px] font-medium text-slabel'
