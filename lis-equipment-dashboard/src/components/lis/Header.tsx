import { Link } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { LanguageSwitch } from "./LanguageSwitch";
import { UserMenu } from "./UserMenu";
import { MousePointerClick } from "lucide-react";
import { PenguinIcon } from "./PenguinIcon";

export function Header() {
  const { t } = useI18n();

  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
    <div className="flex min-w-0 items-center gap-3">
      <span className="group relative grid h-12 w-12 shrink-0 cursor-default place-items-center rounded-2xl bg-primary/15 text-primary animate-[logo-pop_0.6s_cubic-bezier(0.34,1.56,0.64,1)_both] transition-transform duration-300 hover:scale-105">
        <span className="group relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/15 animate-[logo-pop_0.6s_cubic-bezier(0.34,1.56,0.64,1)_both] transition-transform duration-300 hover:scale-105">
          <PenguinIcon className="h-9 w-9" />
          <MousePointerClick className="absolute -bottom-1.5 -right-1.5 h-4 w-4 text-accent opacity-0 group-hover:animate-[logo-tap_0.8s_ease-out]" />
        </span>
        <MousePointerClick className="absolute -bottom-1.5 -right-1.5 h-4 w-4 text-accent opacity-0 group-hover:animate-[logo-tap_0.8s_ease-out]" />
      </span>
      <div className="min-w-0 animate-[logo-text-in_0.6s_ease-out_0.15s_both]">
        <h1 className="truncate text-2xl font-bold sm:text-3xl">{t("app.title")}</h1>
        <p className="truncate text-sm text-muted-foreground">{t("app.subtitle")}</p>
      </div>
    </div>

      <div className="flex items-center gap-3">
        <UserMenu />
        <LanguageSwitch />
      </div>
    </header>
  );
}

export function NavTabs() {
  const { t } = useI18n();
  return (
    <nav className="glass mt-6 inline-flex items-center gap-1 rounded-full p-1">
      <NavItem to="/" label={t("nav.dashboard")} />
      <NavItem to="/reservas" label={t("nav.reservations")} />
      <NavItem to="/estadisticas" label={t("nav.stats")} />
    </nav>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-300 hover:text-foreground"
      activeProps={{ className: "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]" }}
      activeOptions={{ exact: to === "/" }}
    >
      {label}
    </Link>
  );
}