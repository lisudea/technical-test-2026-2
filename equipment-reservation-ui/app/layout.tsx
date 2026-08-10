import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const _inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const _jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'Laboratorio Integrado de Sistemas | Gestión y Reserva de Equipos',
  description:
    'Dashboard de monitoreo y reserva de equipos del Laboratorio Integrado de Sistemas. Consulta disponibilidad, agenda reservas y revisa estadísticas de uso en tiempo real.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/images/equipment-placeholder.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/images/equipment-placeholder.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/images/equipment-placeholder.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#008885' },
    { media: '(prefers-color-scheme: dark)', color: '#0a1414' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${_inter.variable} ${_jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="bg-background font-sans antialiased" suppressHydrationWarning>
        <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
        <Toaster position="top-right" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
