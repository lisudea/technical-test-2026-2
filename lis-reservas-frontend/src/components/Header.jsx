import { Menu, LogOut, User } from "lucide-react";

function Header({ onMenuClick, usuario, onLogout }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-slate-500 hover:text-slate-800"
        >
          <Menu size={22} />
        </button>
        <h1 className="text-lg font-semibold text-slate-800">
          Dashboard de Recursos
        </h1>
      </div>

      {usuario ? (
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User size={16} className="text-blue-600" />
            </div>
            <span className="font-medium">{usuario.nombre}</span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors px-2 py-1.5"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      ) : (
        <span className="text-sm text-slate-400">Invitado</span>
      )}
    </header>
  );
}

export default Header;