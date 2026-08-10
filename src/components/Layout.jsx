import { NavLink, Outlet } from "react-router-dom";
import { LayoutGrid, MonitorSmartphone, CalendarRange, LineChart } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

export default function Layout() {
  const { t, lang, setLang } = useLanguage();

  const navItems = [
    { to: "/", label: t("nav.dashboard"), icon: LayoutGrid, end: true },
    { to: "/equipos", label: t("nav.equipment"), icon: MonitorSmartphone },
    { to: "/reservas", label: t("nav.reservations"), icon: CalendarRange },
    { to: "/estadisticas", label: t("nav.statistics"), icon: LineChart },
  ];

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-logo" aria-hidden="true">
            🐧
          </span>
          <div className="brand-text">
            <span className="brand-name">{t("brand.name")}</span>
            <span className="brand-tagline">{t("brand.tagline")}</span>
          </div>
        </div>

        <nav className="header-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `header-nav-link${isActive ? " active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="lang-switch" role="group" aria-label="Language selector">
          <button
            type="button"
            className={lang === "es" ? "lang-btn active" : "lang-btn"}
            onClick={() => setLang("es")}
          >
            ES
          </button>
          <button
            type="button"
            className={lang === "en" ? "lang-btn active" : "lang-btn"}
            onClick={() => setLang("en")}
          >
            EN
          </button>
        </div>
      </header>

      <div className="app-body">
        <aside className="app-sidebar">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </aside>

        <main className="app-main">
          <Outlet />
        </main>
      </div>

      <footer className="app-footer">{t("brand.name")} © 2026</footer>

      {/* Barra de navegación inferior, visible solo en móvil (ver media query) */}
      <nav className="bottom-nav" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `bottom-nav-link${isActive ? " active" : ""}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

