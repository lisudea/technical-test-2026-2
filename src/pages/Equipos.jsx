import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import ResumenStats from "../components/ResumenStats";
import EquipmentGrid from "../components/EquipmentGrid";
import EquipmentFormModal from "../components/EquipmentFormModal";
import ReservationFormModal from "../components/ReservationFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { eliminarEquipo } from "../api/equipos";
import { useToast } from "../components/ToastContext";

export default function Equipos() {
  const { t } = useLanguage();
  const toast = useToast();
  const [refreshKey, setRefreshKey] = useState(0);

  const [editingEquipo, setEditingEquipo] = useState(undefined);
  const [reservingEquipo, setReservingEquipo] = useState(null);
  const [deletingEquipo, setDeletingEquipo] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await eliminarEquipo(deletingEquipo.id);
      toast.success(t("equipment.deletedOk"));
      setDeletingEquipo(null);
      refresh();
    } catch (err) {
      toast.error(err.friendlyMessage || t("equipment.deleteBlocked"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">{t("equipment.title")}</h1>

      <ResumenStats refreshKey={refreshKey} />

      <EquipmentGrid
        refreshKey={refreshKey}
        onAdd={() => setEditingEquipo(null)}
        onEdit={(equipo) => setEditingEquipo(equipo)}
        onReserve={(equipo) => setReservingEquipo(equipo)}
        onDelete={(equipo) => setDeletingEquipo(equipo)}
      />

      {editingEquipo !== undefined && (
        <EquipmentFormModal
          equipo={editingEquipo}
          onClose={() => setEditingEquipo(undefined)}
          onSaved={() => {
            setEditingEquipo(undefined);
            refresh();
          }}
        />
      )}

      {reservingEquipo && (
        <ReservationFormModal
          equipo={reservingEquipo}
          onClose={() => setReservingEquipo(null)}
          onSaved={() => {
            setReservingEquipo(null);
            refresh();
          }}
        />
      )}

      {deletingEquipo && (
        <ConfirmDialog
          title={t("equipment.deleteTitle")}
          message={t("equipment.deleteMessage")}
          confirmLabel={t("common.delete")}
          loading={deleting}
          onConfirm={confirmDelete}
          onClose={() => setDeletingEquipo(null)}
        />
      )}
    </div>
  );
}
