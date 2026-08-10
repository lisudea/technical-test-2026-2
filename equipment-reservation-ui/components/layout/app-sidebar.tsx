'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FlaskConical, LayoutGrid, CalendarClock, BarChart3, Languages, Settings } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useI18n } from '@/lib/use-i18n'

export function AppSidebar() {
  const pathname = usePathname()
  const { dictionary: t, locale, setLocale } = useI18n()
  const navItems = [
    { href: '/', label: t.nav.dashboard, icon: LayoutGrid },
    { href: '/reservations', label: t.nav.reservations, icon: CalendarClock },
    { href: '/statistics', label: t.nav.statistics, icon: BarChart3 },
    { href: '/management', label: t.nav.management, icon: Settings },
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <FlaskConical data-icon="inline-start" className="!size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">{t.app.name}</span>
                <span className="text-xs text-muted-foreground">{t.app.tagline}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t.app.name}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton isActive={isActive} tooltip={item.label} render={<Link href={item.href} />}>
                      <item.icon data-icon="inline-start" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <button
          type="button"
          onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
          className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={t.common.language}
        >
          <Languages className="size-3.5" />
          {locale === 'es' ? 'English' : 'Español'}
        </button>
        <div className="px-2 py-1 text-xs text-muted-foreground">LIS · Laboratorio Integrado de Sistemas</div>
      </SidebarFooter>
    </Sidebar>
  )
}
