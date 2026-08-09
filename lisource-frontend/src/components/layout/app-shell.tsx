import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, Menu, User as UserIcon, RefreshCw } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { BrandLockup } from "@/components/common/brand";
import { LanguageSelector } from "@/components/layout/language-selector";
import { navItemsForRole } from "@/components/layout/nav-items";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils";

type NavProps = { onNavigate?: (() => void) | undefined };

function NavLinks({ onNavigate }: NavProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (!user) return null;

  return (
    <nav aria-label={t("navigation.main")} className="flex flex-col gap-1">
      {navItemsForRole(user.role).map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({ onNavigate }: NavProps) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col bg-sidebar px-4 py-5">
      <BrandLockup tone="dark" subtitle={t("app.lab")} />
      <div className="mt-8 flex-1">
        <NavLinks onNavigate={onNavigate} />
      </div>
      <SidebarFooter onNavigate={onNavigate} />
    </div>
  );
}

function SidebarFooter({ onNavigate }: NavProps) {
  const { t } = useTranslation();
  const { logout } = useAuth();

  return (
    <div className="flex flex-col gap-1 border-t border-sidebar-border pt-3">
      <Link
        to="/perfil"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <UserIcon className="h-4.5 w-4.5" aria-hidden="true" />
        {t("navigation.profile")}
      </Link>
      <button
        type="button"
        onClick={() => {
          void logout();
          onNavigate?.();
        }}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <LogOut className="h-4.5 w-4.5" aria-hidden="true" />
        {t("navigation.logout")}
      </button>
    </div>
  );
}

function UserMenu() {
  const { t } = useTranslation();
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-dark transition-colors hover:bg-brand hover:text-brand-foreground"
          aria-label={`${user.firstName} ${user.lastName}`}
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <span className="block text-sm font-semibold">
            {user.firstName} {user.lastName}
          </span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.roles.length > 1 ? (
          <>
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              {t("auth.activeRole")}: {t(`profile.roles.${user.role}`)}
            </DropdownMenuLabel>
            {user.roles.map((role) => {
              const frontendRole = role === "ADMINISTRADOR" ? "ADMIN" : "USER";
              if (frontendRole === user.role) return null;
              return (
                <DropdownMenuItem key={role} onSelect={() => void switchRole(role)}>
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  {t("auth.switchRole", { role: t(`profile.roles.${frontendRole}`) })}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem onSelect={() => void navigate({ to: "/perfil" })}>
          <UserIcon className="h-4 w-4" aria-hidden="true" />
          {t("navigation.profile")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            void logout();
          }}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t("navigation.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useTranslation();
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) void navigate({ to: "/ingreso", replace: true });
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen flex-col gap-4 p-8">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-68 shrink-0 lg:block">
        <SidebarBody />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label={t("navigation.menu")}
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-0 bg-sidebar p-0">
              <SheetTitle className="sr-only">{t("navigation.main")}</SheetTitle>
              <SidebarBody onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <h1 className="min-w-0 flex-1 truncate text-base font-semibold sm:text-lg">{title}</h1>
          <LanguageSelector />
          <UserMenu />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        {subtitle ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}
