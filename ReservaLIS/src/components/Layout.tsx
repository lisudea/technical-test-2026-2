import { NavLink, Outlet, useNavigate } from "react-router";
import { useState } from "react";
import logoImg from "@/imports/LOGO.png";
import { useTranslation } from "@/context/LanguageContext";
import type { Locale } from "@/i18n";

function useAdmin() {
  return typeof window !== "undefined" && sessionStorage.getItem("lis_admin") === "true";
}

function LangToggle({ lang, setLang }: { lang: Locale; setLang: (l: Locale) => void }) {
  return (
    <div className="flex items-center gap-0.5 bg-[#F4F7F8] rounded-lg p-0.5 border border-[#DDE5E8]">
      {(["es", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-1 rounded-md text-xs font-bold tracking-wide transition-colors ${
            lang === l
              ? "bg-[#1B7A80] text-white"
              : "text-[#6B8A94] hover:text-[#0E2A36]"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default function Layout() {
  const isAdmin = useAdmin();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, lang, setLang } = useTranslation();

  function logout() {
    sessionStorage.removeItem("lis_admin");
    navigate("/login");
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors px-3 py-1.5 rounded-lg ${
      isActive
        ? "bg-[#1B7A80] text-white"
        : "text-[#0E2A36] hover:bg-[#6FBFBA]/20 hover:text-[#1B7A80]"
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7F8]">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#DDE5E8] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <NavLink to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <img src={logoImg} alt="LIS logo" className="w-9 h-9 object-contain rounded-full" />
            <span
              className="font-semibold text-base hidden sm:block"
              style={{ fontFamily: "Poppins, sans-serif", color: "#0E2A36" }}
            >
              {t.nav.siteName}
            </span>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={linkClass}>{t.nav.dashboard}</NavLink>
            <NavLink to="/reservas" className={linkClass}>{t.nav.reservas}</NavLink>
            <NavLink to="/estadisticas" className={linkClass}>{t.nav.estadisticas}</NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={linkClass}>{t.nav.admin}</NavLink>
            )}
          </nav>

          {/* Auth + lang toggle */}
          <div className="hidden md:flex items-center gap-2">
            <LangToggle lang={lang} setLang={setLang} />
            {isAdmin ? (
              <>
                <span className="text-xs text-[#6B8A94] font-medium px-2">admin@lis</span>
                <button
                  onClick={logout}
                  className="text-sm font-medium px-3 py-1.5 rounded-lg text-[#0E2A36] hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  {t.nav.logout}
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-[#1B7A80] text-white hover:bg-[#0E2A36] transition-colors"
              >
                {t.nav.login}
              </NavLink>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-[#0E2A36] hover:bg-[#6FBFBA]/20"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#DDE5E8] bg-white px-4 py-3 flex flex-col gap-1">
            <NavLink to="/" end className={linkClass} onClick={() => setMobileOpen(false)}>{t.nav.dashboard}</NavLink>
            <NavLink to="/reservas" className={linkClass} onClick={() => setMobileOpen(false)}>{t.nav.reservas}</NavLink>
            <NavLink to="/estadisticas" className={linkClass} onClick={() => setMobileOpen(false)}>{t.nav.estadisticas}</NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={linkClass} onClick={() => setMobileOpen(false)}>{t.nav.admin}</NavLink>
            )}
            <div className="pt-2 border-t border-[#DDE5E8] mt-1 flex items-center justify-between">
              <LangToggle lang={lang} setLang={setLang} />
              {isAdmin ? (
                <button onClick={logout} className="text-sm font-medium text-red-600 px-3 py-1.5">
                  {t.nav.logout}
                </button>
              ) : (
                <NavLink
                  to="/login"
                  className="inline-block text-sm font-semibold px-4 py-1.5 rounded-lg bg-[#1B7A80] text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  {t.nav.login}
                </NavLink>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#DDE5E8] bg-white py-5 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6B8A94]">
          <span>© 2026 LIS — Laboratorio Integrado de Sistemas · Universidad de Antioquia</span>
          <span>Ingeniería de Sistemas · Facultad de Ingeniería</span>
        </div>
      </footer>
    </div>
  );
}
