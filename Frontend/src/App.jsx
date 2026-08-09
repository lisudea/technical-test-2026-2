import { useEffect, useState, useCallback } from "react";
import { I18nProvider, useI18n } from "./i18n/I18nContext";
import { api, BASE_URL } from "./api";
import EquipmentCard from "./components/EquipmentCard";
import Filters from "./components/Filters";
import ReservationModal from "./components/ReservationModal";
import Toast from "./components/Toast";

function Dashboard() {
  const { t } = useI18n();
  const [equipos, setEquipos] = useState([]);
  const [total, setTotal] = useState(0);
  const [categoria, setCategoria] = useState("");
  const [estado, setEstado] = useState("");
  const [loading, setLoading] = useState(true);
  const [connError, setConnError] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setConnError(false);
    api
      .listarEquipos({ categoria, estado })
      .then((data) => {
        setEquipos(data.resultados);
        setTotal(data.total);
      })
      .catch(() => setConnError(true))
      .finally(() => setLoading(false));
  }, [categoria, estado]);

  useEffect(() => { load(); }, [load]);

  const handleReserveSuccess = () => {
    setSelected(null);
    setToast({ kind: "success", message: t("reservationSuccess") });
    load();
  };

  return (
    <div className="min-h-screen bg-bg text-text px-4 py-6 md:px-8 md:py-10">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 border border-border rounded-2xl bg-gradient-to-br from-panel2 to-panel p-5 md:p-6 relative overflow-hidden">
          <div className="absolute top-3 right-4 font-mono text-[11px] text-teal-dim tracking-wide hidden sm:block">
            $ GET /equipos
          </div>
          <h1 className="font-mono text-xl md:text-2xl font-semibold text-teal tracking-tight">
            {t("appTitle")}
          </h1>
          <p className="text-sm text-textdim mt-1">{t("appSubtitle")}</p>
          <div className="flex items-center gap-4 mt-4">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-okgreen">
              <span className="w-1.5 h-1.5 rounded-full bg-okgreen led-live" /> {t("live")}
            </span>
            <span className="text-[11px] font-mono text-textdim">
              {total} {t("totalEquipment")}
            </span>
          </div>
        </header>

        <div className="mb-6">
          <Filters categoria={categoria} estado={estado} onCategoria={setCategoria} onEstado={setEstado} />
        </div>

        {connError ? (
          <div className="text-center py-16 border border-rose/30 bg-rose/5 rounded-xl">
            <p className="font-mono text-sm text-rose mb-1">{t("connectionError")}</p>
            <p className="font-mono text-xs text-textdim mb-4">{t("connectionErrorHint")} {BASE_URL}</p>
            <button
              onClick={load}
              className="px-4 py-2 rounded-lg text-xs font-mono text-teal border border-teal/40 hover:bg-teal/10"
            >
              {t("retry")}
            </button>
          </div>
        ) : loading ? (
          <div className="text-center py-16 font-mono text-sm text-textdim">{t("loading")}</div>
        ) : equipos.length === 0 ? (
          <div className="text-center py-16 font-mono text-sm text-textdim border border-border rounded-xl">
            {t("noEquipment")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {equipos.map((eq) => (
              <EquipmentCard key={eq.id} equipo={eq} onReserve={setSelected} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <ReservationModal
          equipo={selected}
          onClose={() => setSelected(null)}
          onSuccess={handleReserveSuccess}
          onError={(err) =>
            setToast({ kind: "error", message: err.status === 409 ? t("reservationConflict") : t("genericError") })
          }
        />
      )}

      <Toast message={toast?.message} kind={toast?.kind} onClose={() => setToast(null)} />
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <Dashboard />
    </I18nProvider>
  );
}
