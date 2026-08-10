import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router";
import { listEquipos, createEquipo, updateEquipo, deleteEquipo } from "@/api/equipos";
import { listCategorias, createCategoria, updateCategoria, deleteCategoria } from "@/api/categorias";
import { listReservasAdmin, adminDeleteReserva } from "@/api/reservas";
import { ApiError } from "@/api/client";
import { estadoFisicoToStatusUI } from "@/hooks/useEquipos";
import { StatusBadge } from "@/components/StatusBadge";
import type { EquipoResponseDTO, CategoriaDTO, EstadoFisico, EquipoRequestBody, CategoriaRequestBody, ReservaAdminResponseDTO } from "@/api/types";
import { useTranslation } from "@/context/LanguageContext";

function isAdmin() {
  return sessionStorage.getItem("lis_admin") === "true";
}

type Tab = "equipos" | "categorias" | "reservas";

function formatDate(dt: string) {
  return new Date(dt).toLocaleString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const emptyEquipoForm: EquipoRequestBody = {
  nombre: "", identificador: "", categoriaId: 0, estadoFisico: "DISPONIBLE",
};

export default function Admin() {
  const { t } = useTranslation();

  if (!isAdmin()) return <Navigate to="/login" replace />;

  const [tab, setTab] = useState<Tab>("equipos");

  // ── Equipos state ─────────────────────────────────────────────────────────
  const [equiposList, setEquiposList] = useState<EquipoResponseDTO[]>([]);
  const [equiposLoading, setEquiposLoading] = useState(true);
  const [equiposError, setEquiposError] = useState<string | null>(null);
  const [editEquipo, setEditEquipo] = useState<EquipoResponseDTO | null>(null);
  const [newEquipo, setNewEquipo] = useState(false);
  const [equipoForm, setEquipoForm] = useState<EquipoRequestBody>(emptyEquipoForm);
  const [equipoFormError, setEquipoFormError] = useState<string | null>(null);
  const [equipoFormSaving, setEquipoFormSaving] = useState(false);

  // ── Categorias state ───────────────────────────────────────────────────────
  const [catList, setCatList] = useState<CategoriaDTO[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [editCat, setEditCat] = useState<CategoriaDTO | null>(null);
  const [newCat, setNewCat] = useState(false);
  const [catForm, setCatForm] = useState<CategoriaRequestBody>({ nombre: "", descripcion: "" });
  const [catFormError, setCatFormError] = useState<string | null>(null);
  const [catFormSaving, setCatFormSaving] = useState(false);

  // ── Reservas state (admin endpoint — includes usuarioCorreo) ──────────────
  const [reservasList, setReservasList] = useState<ReservaAdminResponseDTO[]>([]);
  const [reservasLoading, setReservasLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteTarget = reservasList.find((r) => r.id === deleteConfirmId);

  // ── Load functions ─────────────────────────────────────────────────────────
  const loadEquipos = useCallback(async () => {
    setEquiposLoading(true);
    setEquiposError(null);
    try {
      const page = await listEquipos({ size: 200 });
      setEquiposList(page.content);
    } catch {
      setEquiposError("No se pudo cargar la lista de equipos.");
    } finally {
      setEquiposLoading(false);
    }
  }, []);

  const loadCategorias = useCallback(async () => {
    setCatLoading(true);
    try {
      setCatList(await listCategorias());
    } finally {
      setCatLoading(false);
    }
  }, []);

  const loadReservasAdmin = useCallback(async () => {
    setReservasLoading(true);
    try {
      const page = await listReservasAdmin({ size: 200 });
      setReservasList(page.content);
    } finally {
      setReservasLoading(false);
    }
  }, []);

  useEffect(() => { loadEquipos(); }, [loadEquipos]);
  useEffect(() => { loadCategorias(); }, [loadCategorias]);
  useEffect(() => { loadReservasAdmin(); }, [loadReservasAdmin]);

  // ── Equipo CRUD ────────────────────────────────────────────────────────────
  function startNewEquipo() {
    setEquipoForm({ ...emptyEquipoForm, categoriaId: catList[0]?.id ?? 0 });
    setEditEquipo(null);
    setNewEquipo(true);
    setEquipoFormError(null);
  }

  function startEditEquipo(e: EquipoResponseDTO) {
    setEquipoForm({ nombre: e.nombre, identificador: e.identificador, categoriaId: e.categoria.id, estadoFisico: e.estadoFisico });
    setEditEquipo(e);
    setNewEquipo(false);
    setEquipoFormError(null);
  }

  async function saveEquipo() {
    setEquipoFormError(null);
    setEquipoFormSaving(true);
    try {
      if (newEquipo) {
        const created = await createEquipo(equipoForm);
        setEquiposList((prev) => [...prev, created]);
      } else if (editEquipo) {
        const updated = await updateEquipo(editEquipo.id, equipoForm);
        setEquiposList((prev) => prev.map((e) => e.id === editEquipo.id ? updated : e));
      }
      setNewEquipo(false);
      setEditEquipo(null);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) setEquipoFormError("Ya existe un equipo con ese identificador, o tiene reservas activas que impiden cambiar su estado.");
        else if (err.status === 404) setEquipoFormError("La categoría seleccionada no existe.");
        else setEquipoFormError(err.message);
      } else {
        setEquipoFormError("Ocurrió un error inesperado.");
      }
    } finally {
      setEquipoFormSaving(false);
    }
  }

  async function handleDeleteEquipo(id: number) {
    if (!confirm(t.admin.confirmDelete)) return;
    try {
      await deleteEquipo(id);
      setEquiposList((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        alert("No se puede eliminar: el equipo tiene reservas asociadas. Cambia su estado a 'De baja' en su lugar.");
      } else {
        alert("No se pudo eliminar el equipo.");
      }
    }
  }

  // ── Categorias CRUD ────────────────────────────────────────────────────────
  function startNewCat() {
    setCatForm({ nombre: "", descripcion: "" });
    setEditCat(null);
    setNewCat(true);
    setCatFormError(null);
  }

  function startEditCat(c: CategoriaDTO) {
    setCatForm({ nombre: c.nombre, descripcion: c.descripcion ?? "" });
    setEditCat(c);
    setNewCat(false);
    setCatFormError(null);
  }

  async function saveCat() {
    setCatFormError(null);
    setCatFormSaving(true);
    try {
      if (newCat) {
        const created = await createCategoria(catForm);
        setCatList((prev) => [...prev, created]);
      } else if (editCat) {
        const updated = await updateCategoria(editCat.id, catForm);
        setCatList((prev) => prev.map((c) => c.id === editCat.id ? updated : c));
      }
      setNewCat(false);
      setEditCat(null);
    } catch (err) {
      if (err instanceof ApiError) setCatFormError(err.message);
      else setCatFormError("Ocurrió un error inesperado.");
    } finally {
      setCatFormSaving(false);
    }
  }

  async function handleDeleteCat(id: number) {
    if (!confirm(t.admin.confirmDelete)) return;
    try {
      await deleteCategoria(id);
      setCatList((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        alert("No se puede eliminar: la categoría tiene equipos asociados. Reasígnalos o elimínalos primero.");
      } else {
        alert("No se pudo eliminar la categoría.");
      }
    }
  }

  // ── Reservas hard-delete ───────────────────────────────────────────────────
  async function handleDeleteConfirm() {
    if (deleteConfirmId === null) return;
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      await adminDeleteReserva(deleteConfirmId);
      await loadReservasAdmin();
      setDeleteConfirmId(null);
    } catch (e) {
      setDeleteError(e instanceof ApiError ? e.message : "Ocurrió un error inesperado.");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  const tabLabels: Record<Tab, string> = {
    equipos: t.admin.tabs.equipos,
    categorias: t.admin.tabs.categorias,
    reservas: t.admin.tabs.reservas,
  };

  const showEquipoForm = newEquipo || editEquipo !== null;
  const showCatForm = newCat || editCat !== null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Irreversible delete modal */}
      {deleteConfirmId !== null && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-red-200 shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-[#0E2A36] text-base" style={{ fontFamily: "Poppins, sans-serif" }}>
                {t.admin.reservasGestion.eliminarTitulo}
              </h3>
            </div>
            <p className="text-sm text-[#6B8A94] leading-relaxed mb-4">{t.admin.reservasGestion.eliminarMsg}</p>
            <div className="bg-[#F4F7F8] rounded-xl p-3 mb-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-[#6B8A94]">Equipo</span>
                <span className="font-medium text-[#0E2A36]">{deleteTarget.equipo.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B8A94]">Solicitante</span>
                <span className="font-medium text-[#0E2A36]">{deleteTarget.usuarioNombre}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#6B8A94] flex-shrink-0">Correo</span>
                <a href={`mailto:${deleteTarget.usuarioCorreo}`} className="font-medium text-[#1B7A80] hover:underline truncate text-right">
                  {deleteTarget.usuarioCorreo}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B8A94]">Inicio</span>
                <span className="font-mono text-xs text-[#0E2A36]">{formatDate(deleteTarget.fechaHoraInicio)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B8A94]">Estado</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${deleteTarget.estadoReserva === "ACTIVA" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {deleteTarget.estadoReserva === "ACTIVA" ? "Activa" : "Cancelada"}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4 text-xs text-amber-800 leading-relaxed">
              <span className="flex-shrink-0 mt-0.5">💡</span>
              <span>
                Recuerda comunicarte con{" "}
                <a href={`mailto:${deleteTarget.usuarioCorreo}`} className="font-semibold hover:underline">
                  {deleteTarget.usuarioCorreo}
                </a>{" "}
                para informarle sobre la eliminación de su reserva y el motivo. El sistema no envía notificaciones automáticamente.
              </span>
            </div>
            {deleteError && (
              <p className="text-xs text-red-600 mb-3 font-medium">⚠️ {deleteError}</p>
            )}
            <div className="flex gap-2">
              <button onClick={handleDeleteConfirm} disabled={deleteSubmitting} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60">
                {deleteSubmitting ? "Eliminando…" : t.admin.reservasGestion.eliminarConfirm}
              </button>
              <button onClick={() => { setDeleteConfirmId(null); setDeleteError(null); }} disabled={deleteSubmitting} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#F4F7F8] text-[#6B8A94] hover:bg-[#DDE5E8] transition-colors disabled:opacity-60">
                {t.admin.cancelar}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0E2A36]" style={{ fontFamily: "Poppins, sans-serif" }}>{t.admin.title}</h1>
        <p className="mt-1 text-[#6B8A94] text-sm">{t.admin.subtitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#F4F7F8] p-1 rounded-xl w-fit flex-wrap">
        {(["equipos", "categorias", "reservas"] as Tab[]).map((tabKey) => (
          <button key={tabKey} onClick={() => setTab(tabKey)} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === tabKey ? "bg-[#1B7A80] text-white shadow-sm" : "text-[#6B8A94] hover:text-[#0E2A36]"}`}>
            {tabLabels[tabKey]}
          </button>
        ))}
      </div>

      {/* ── Equipos ── */}
      {tab === "equipos" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#0E2A36]" style={{ fontFamily: "Poppins, sans-serif" }}>
              {t.admin.tabs.equipos} ({equiposList.length})
            </h2>
            <button onClick={startNewEquipo} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B7A80] text-white text-sm font-semibold hover:bg-[#0E2A36] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              {t.admin.nuevoEquipo}
            </button>
          </div>

          {equiposError && <p className="text-sm text-red-600 mb-4">⚠️ {equiposError}</p>}

          {showEquipoForm && (
            <div className="bg-white rounded-2xl border border-[#1B7A80]/30 p-5 mb-4 shadow-sm">
              <h3 className="font-semibold text-[#0E2A36] mb-4 text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>
                {editEquipo ? t.admin.editarEquipo : t.admin.nuevoEquipo}
              </h3>
              {equipoFormError && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 font-medium">⚠️ {equipoFormError}</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { key: "nombre", label: t.admin.form.nombre },
                  { key: "identificador", label: "Identificador" },
                ] as const).map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-[#0E2A36] mb-1.5">{f.label}</label>
                    <input
                      type="text"
                      value={equipoForm[f.key]}
                      onChange={(e) => setEquipoForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full text-sm px-3 py-2 rounded-xl border border-[#DDE5E8] bg-[#F4F7F8] text-[#0E2A36] focus:outline-none focus:ring-2 focus:ring-[#1B7A80]/40 focus:border-[#1B7A80] transition"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-[#0E2A36] mb-1.5">{t.admin.form.estado}</label>
                  <select
                    value={equipoForm.estadoFisico}
                    onChange={(e) => setEquipoForm((p) => ({ ...p, estadoFisico: e.target.value as EstadoFisico }))}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-[#DDE5E8] bg-[#F4F7F8] text-[#0E2A36] focus:outline-none focus:ring-2 focus:ring-[#1B7A80]/40 focus:border-[#1B7A80] transition"
                  >
                    <option value="DISPONIBLE">Disponible</option>
                    <option value="MANTENIMIENTO">Mantenimiento</option>
                    <option value="DE_BAJA">De baja</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0E2A36] mb-1.5">{t.admin.form.categoria}</label>
                  <select
                    value={equipoForm.categoriaId}
                    onChange={(e) => setEquipoForm((p) => ({ ...p, categoriaId: Number(e.target.value) }))}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-[#DDE5E8] bg-[#F4F7F8] text-[#0E2A36] focus:outline-none focus:ring-2 focus:ring-[#1B7A80]/40 focus:border-[#1B7A80] transition"
                  >
                    {catList.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={saveEquipo} disabled={equipoFormSaving} className="px-5 py-2 rounded-xl bg-[#1B7A80] text-white text-sm font-semibold hover:bg-[#0E2A36] transition-colors disabled:opacity-60">
                  {equipoFormSaving ? "Guardando…" : editEquipo ? t.admin.form.guardar : t.admin.form.crear}
                </button>
                <button onClick={() => { setNewEquipo(false); setEditEquipo(null); setEquipoFormError(null); }} className="px-5 py-2 rounded-xl bg-[#F4F7F8] text-[#6B8A94] text-sm font-semibold hover:bg-[#DDE5E8] transition-colors">
                  {t.admin.cancelar}
                </button>
              </div>
            </div>
          )}

          {equiposLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-[#F4F7F8] rounded-xl animate-pulse" />)}</div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#DDE5E8] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F4F7F8] border-b border-[#DDE5E8]">
                    {["Identificador", "Nombre", "Categoría", "Ubicación", "Estado", "Acciones"].map((col) => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-[#6B8A94] uppercase tracking-wide">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {equiposList.map((e, i) => (
                    <tr key={e.id} className={`border-b border-[#F4F7F8] ${i % 2 === 1 ? "bg-[#FAFCFD]" : ""}`}>
                      <td className="px-4 py-3 font-mono text-xs text-[#6B8A94]">{e.identificador}</td>
                      <td className="px-4 py-3 font-medium text-[#0E2A36]">{e.nombre}</td>
                      <td className="px-4 py-3 text-[#6B8A94] text-xs">{e.categoria.nombre}</td>
                      <td className="px-4 py-3 text-[#6B8A94] text-xs">Bloque 18, Salón 210</td>
                      <td className="px-4 py-3"><StatusBadge status={estadoFisicoToStatusUI(e.estadoFisico)} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEditEquipo(e)} className="text-xs text-[#1B7A80] font-semibold hover:underline">Editar</button>
                          <button onClick={() => handleDeleteEquipo(e.id)} className="text-xs text-red-500 font-semibold hover:underline">{t.admin.eliminar}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Categorías ── */}
      {tab === "categorias" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#0E2A36]" style={{ fontFamily: "Poppins, sans-serif" }}>
              {t.admin.tabs.categorias} ({catList.length})
            </h2>
            <button onClick={startNewCat} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B7A80] text-white text-sm font-semibold hover:bg-[#0E2A36] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              {t.admin.nuevaCategoria}
            </button>
          </div>

          {showCatForm && (
            <div className="bg-white rounded-2xl border border-[#1B7A80]/30 p-5 mb-4 shadow-sm">
              <h3 className="font-semibold text-[#0E2A36] mb-4 text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>
                {editCat ? t.admin.editarCategoria : t.admin.nuevaCategoria}
              </h3>
              {catFormError && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 font-medium">⚠️ {catFormError}</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0E2A36] mb-1.5">{t.admin.form.nombre}</label>
                  <input type="text" value={catForm.nombre} onChange={(e) => setCatForm((f) => ({ ...f, nombre: e.target.value }))} className="w-full text-sm px-3 py-2 rounded-xl border border-[#DDE5E8] bg-[#F4F7F8] text-[#0E2A36] focus:outline-none focus:ring-2 focus:ring-[#1B7A80]/40 focus:border-[#1B7A80] transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0E2A36] mb-1.5">{t.admin.form.descripcion}</label>
                  <input type="text" value={catForm.descripcion ?? ""} onChange={(e) => setCatForm((f) => ({ ...f, descripcion: e.target.value }))} className="w-full text-sm px-3 py-2 rounded-xl border border-[#DDE5E8] bg-[#F4F7F8] text-[#0E2A36] focus:outline-none focus:ring-2 focus:ring-[#1B7A80]/40 focus:border-[#1B7A80] transition" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={saveCat} disabled={catFormSaving} className="px-5 py-2 rounded-xl bg-[#1B7A80] text-white text-sm font-semibold hover:bg-[#0E2A36] transition-colors disabled:opacity-60">
                  {catFormSaving ? "Guardando…" : editCat ? t.admin.form.guardar : t.admin.form.crear}
                </button>
                <button onClick={() => { setNewCat(false); setEditCat(null); setCatFormError(null); }} className="px-5 py-2 rounded-xl bg-[#F4F7F8] text-[#6B8A94] text-sm font-semibold hover:bg-[#DDE5E8] transition-colors">
                  {t.admin.cancelar}
                </button>
              </div>
            </div>
          )}

          {catLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 bg-[#F4F7F8] rounded-2xl animate-pulse" />)}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {catList.map((c) => {
                const count = equiposList.filter((e) => e.categoria.id === c.id).length;
                return (
                  <div key={c.id} className="bg-white rounded-2xl border border-[#DDE5E8] p-5 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-[#0E2A36] text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>{c.nombre}</h3>
                      <span className="text-xs font-mono font-bold text-[#1B7A80] bg-[#6FBFBA]/10 px-2 py-0.5 rounded-full">{count}</span>
                    </div>
                    {c.descripcion && <p className="text-xs text-[#6B8A94] leading-relaxed flex-1">{c.descripcion}</p>}
                    <div className="flex gap-2 pt-2 border-t border-[#F4F7F8]">
                      <button onClick={() => startEditCat(c)} className="text-xs text-[#1B7A80] font-semibold hover:underline">Editar</button>
                      <button onClick={() => handleDeleteCat(c.id)} className="text-xs text-red-500 font-semibold hover:underline">{t.admin.eliminar}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Reservas ── */}
      {tab === "reservas" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#0E2A36]" style={{ fontFamily: "Poppins, sans-serif" }}>
              {t.admin.reservasGestion.title} ({reservasList.length})
            </h2>
            <button onClick={loadReservasAdmin} disabled={reservasLoading} className="flex items-center gap-1.5 text-sm font-medium text-[#1B7A80] hover:text-[#0E2A36] disabled:opacity-50 transition-colors">
              <svg className={`w-4 h-4 ${reservasLoading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Actualizar
            </button>
          </div>

          {reservasLoading && reservasList.length === 0 ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-[#F4F7F8] rounded-xl animate-pulse" />)}</div>
          ) : reservasList.length === 0 ? (
            <div className="text-center py-16 text-[#6B8A94]"><div className="text-3xl mb-2">📋</div><p className="text-sm font-medium">{t.admin.reservasGestion.noReservas}</p></div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#DDE5E8] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F4F7F8] border-b border-[#DDE5E8]">
                    {[t.admin.reservasGestion.columnas.equipo, t.admin.reservasGestion.columnas.solicitante, t.admin.reservasGestion.columnas.inicio, t.admin.reservasGestion.columnas.fin, t.admin.reservasGestion.columnas.estado, t.admin.reservasGestion.columnas.acciones].map((col) => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-[#6B8A94] uppercase tracking-wide">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reservasList.map((r, i) => (
                    <tr key={r.id} className={`border-b border-[#F4F7F8] ${i % 2 === 1 ? "bg-[#FAFCFD]" : ""}`}>
                      <td className="px-4 py-3 font-medium text-[#0E2A36]">{r.equipo.nombre}</td>
                      <td className="px-4 py-3 text-[#0E2A36]">{r.usuarioNombre}</td>
                      <td className="px-4 py-3 text-[#6B8A94] text-xs font-mono">{formatDate(r.fechaHoraInicio)}</td>
                      <td className="px-4 py-3 text-[#6B8A94] text-xs font-mono">{formatDate(r.fechaHoraFin)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${r.estadoReserva === "ACTIVA" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {r.estadoReserva === "ACTIVA" ? "Activa" : "Cancelada"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setDeleteConfirmId(r.id); setDeleteError(null); }} className="text-xs font-semibold text-red-600 hover:text-red-800 hover:underline">
                          {t.admin.eliminar}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
