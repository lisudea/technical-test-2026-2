// src/components/Toast.jsx
import { CheckCircle2, XCircle, X } from "lucide-react";

function Toast({ toasts, onClose }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] sm:w-96">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg bg-white animate-[slideIn_0.2s_ease-out]
            ${toast.tipo === "error" ? "border-red-200" : "border-green-200"}`}
        >
          {toast.tipo === "error" ? (
            <XCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 size={20} className="text-green-500 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800">{toast.titulo}</p>
            <p className="text-sm text-slate-500 mt-0.5">{toast.mensaje}</p>
          </div>
          <button onClick={() => onClose(toast.id)} className="text-slate-300 hover:text-slate-500">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default Toast;