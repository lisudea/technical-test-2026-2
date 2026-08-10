import { useEffect, useMemo, useState } from "react";
import { Plus, ArrowRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { listarReservas, cancelarReserva } from "../api/reservas";
import { formatDateTime } from "../utils/formatDate";
import StatusBadge from "../components/StatusBadge";
import ReservationFormModal from "../components/ReservationFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/ToastContext";

const TABS = [
  { key: "", labelPath: "reservaEstado.all" },
  { key: "ACTIVA", labelPath: "reservaEstado.ACTIVA" },
  { key: "CANCELADA", labelPath: "reservaEstado.CANCELADA" },
];

export default function Reservas() {
  const { t, lang } = useLanguage();
  const toast = useToast();

  const [tab, setTab] = useState("");
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    listarReservas({ estado: tab || undefined, size: 100 })
      .then((page) => {
        if (active) setReservas(page.content || []);
      })
      .catch((err) => {
        if (active) setError(err.friendlyMessage || t("common.error"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tab, refreshKey, t]);

  const activeCount = useMemo(
    () => reservas.filter((r) => r.estado === "ACTIVA").length,
    [reservas]
  );

  async function confirmCancel() {
    setCancelLoading(true);
    try {
      await cancelarReserva(cancelling.id);
      toast.success(t("reservations.cancelledOk"));
      setCancelling(null);
      refresh();
    } catch (err) {
      toast.error(err.friendlyMessage || t("common.error"));
    } finally {
      setCancelLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header-row">
        <h1 className="page-title">{t("reservations.title")}</h1>
      </div>

      <div className="section-header-row">
        <div>
          <h2 className="section-title">{t("reservations.subtitle")}</h2>
          <p className="section-subtitle">
            {activeCount} {t("reservations.activeCount")}
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          {t("reservations.newReservation")}
        </button>
      </div>

      <div className="tabs">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.key}
            type="button"
            className={tab === tabItem.key ? "tab active" : "tab"}
            onClick={() => setTab(tabItem.key)}
          >
            {t(tabItem.labelPath)}
          </button>
        ))}
      </div>

      {loading && <div className="state-message">{t("common.loading")}</div>}
      {!loading && error && <div className="state-message state-error">{error}</div>}
      {!loading && !error && reservas.length === 0 && (
        <div className="state-message">{t("reservations.noReservations")}</div>
      )}

      {!loading && !error && reservas.length > 0 && (
        <div className="reservation-list">
          {reservas.map((r) => (
            <div key={r.id} className="reservation-card">
              <div className="reservation-col">
                <span className="reservation-label">{t("reservations.equipoCol")}</span>
                <span className="reservation-primary">{r.equipoNombre}</span>
              </div>

              <div className="reservation-col">
                <span className="reservation-label">{t("reservations.userCol")}</span>
                <span className="reservation-primary">{r.nombreUsuario}</span>
                <span className="reservation-secondary">{r.correoUsuario}</span>
              </div>

              <div className="reservation-col reservation-col-period">
                <span className="reservation-label">{t("reservations.periodCol")}</span>
                <span className="reservation-period">
                  {formatDateTime(r.fechaInicio, lang)}
                  <ArrowRight size={13} className="period-arrow" />
                  {formatDateTime(r.fechaFin, lang)}
                </span>
              </div>

              <div className="reservation-col">
                <span className="reservation-label">{t("reservations.statusCol")}</span>
                <StatusBadge
                  label={t(`reservaEstado.${r.estado}`)}
                  tone={r.estado === "ACTIVA" ? "active" : "cancelled"}
                />
              </div>

              <div className="reservation-col reservation-col-action">
                {r.estado === "ACTIVA" && (
                  <button type="button" className="btn btn-outline-danger" onClick={() => setCancelling(r)}>
                    {t("reservations.cancelReservation")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ReservationFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}

      {cancelling && (
        <ConfirmDialog
          title={t("reservations.cancelTitle")}
          message={t("reservations.cancelMessage")}
          confirmLabel={t("reservations.confirmCancel")}
          cancelLabel={t("reservations.keepReservation")}
          loading={cancelLoading}
          onConfirm={confirmCancel}
          onClose={() => setCancelling(null)}
        />
      )}
    </div>
  );
}
