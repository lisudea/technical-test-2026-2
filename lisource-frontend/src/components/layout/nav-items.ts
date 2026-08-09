import { BarChart3, LayoutDashboard, MonitorCog, CalendarCheck, Cpu } from "lucide-react";

import type { UserRole } from "@/types";

export interface NavItem {
  to: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  roles?: UserRole[];
}

export const navItems: NavItem[] = [
  { to: "/", labelKey: "navigation.dashboard", icon: LayoutDashboard },
  { to: "/equipos", labelKey: "navigation.equipment", icon: Cpu },
  { to: "/reservas", labelKey: "navigation.reservations", icon: CalendarCheck },
  { to: "/estadisticas", labelKey: "navigation.statistics", icon: BarChart3 },
  {
    to: "/administracion/equipos",
    labelKey: "navigation.admin",
    icon: MonitorCog,
    roles: ["ADMIN"],
  },
];

export function navItemsForRole(role: UserRole) {
  return navItems.filter((item) => !item.roles || item.roles.includes(role));
}
