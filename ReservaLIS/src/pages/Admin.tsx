import { useState } from "react";
import { Navigate } from "react-router";
import {
  equipos as initialEquipos,
  categorias as initialCategorias,
  type Equipo,
  type Categoria,
  type EquipoStatus,
} from "@/data/mock";
import { useReservas } from "@/hooks/useReservas";
import { StatusBadge } from "@/components/StatusBadge";
import { t } from "@/i18n/es";

function isAdmin() {
  return sessionStorage.getItem("lis_admin") === "true";
}

type Tab = "equipos" | "categorias" | "reservas";

const emptyEquipo: Omit<Equipo, "id"> = {
  nombre: "",
  descripcion: "",
  categoriaId: 1,
  status: "disponible",
  codigo: "",
};

function formatDate(dt: string) {
  return new Date(dt).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Admin() {
  if (!isAdmin()) return <Navigate to="/login" replace />;

  const [tab, setTab] = useState<Tab>("equipos");
  const [equiposList, setEquiposList] = useState<Equipo[]>(initialEquipos);
  const [catList, setCatList] = useState<Categoria[]>(initialCategorias);

  // Reservas (shared hook — no polling needed in admin, manual refetch suffices)
  const { items: reservasList, loading: reservasLoading, refetch: refetchReservas, eliminar: eliminarReserva } = useReservas(false);

  // Delete confirmation modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const deleteTarget = reservasList.find((r) => r.id === deleteConfirmId);

  async function handleDeleteConfirm() {
    if (deleteConfirmId === null) return;
    setDeleteSubmitting(true);
    await eliminarReserva(deleteConfirmId);
    setDeleteConfirmId(null);
    setDeleteSubmitting(false);
  }

  // Equipo form
  const [editEquipo, setEditEquipo] = useState<Equipo | null>(null);
  const [newEquipo, setNewEquipo] = useState(false);
  const [equipoForm, setEquipoForm] = useState<Omit<Equipo, "id">>(emptyEquipo);

  // Categoria form
  const [editCat, setEditCat] = useState<Categoria | null>(null);
  const [newCat, setNewCat] = useState(false);
  const [catForm, setCatForm] = useState({ nombre: "", descripcion: "" });

  // --- Equipos CRUD ---
  function startNewEquipo() {
    setEquipoForm(emptyEquipo);
    setEditEquipo(null);
    setNewEquipo(true);
  }

  function startEditEquipo(e: Equipo) {
    setEquipoForm({ nombre: e.nombre, descripcion: e.descripcion, categoriaId: e.categoriaId, status: e.status, codigo: e.codigo });
    setEditEquipo(e);
    setNewEquipo(false);
  }

  function saveEquipo() {
    if (newEquipo) {
      setEquiposList((prev) => [...prev, { ...equipoForm, id: Date.now() }]);
    } else if (editEquipo) {
      setEquiposList((prev) => prev.map((e) => e.id === editEquipo.id ? { ...e, ...equipoForm } : e));
    }
    setNewEquipo(false);
    setEditEquipo(null);
  }

  function deleteEquipo(id: number) {
    if (confirm(t.admin.confirmDelete)) {
      setEquiposList((prev) => prev.filter((e) => e.id !== id));
    }
  }

  // --- Categorías CRUD ---
  function startNewCat() {
    setCatForm({ nombre: "", descripcion: "" });
    setEditCat(null);
    setNewCat(true);
  }

  function startEditCat(c: Categoria) {
    setCatForm({ nombre: c.nombre, descripcion: c.descripcion });
    setEditCat(c);
    setNewCat(false);
  }

  function saveCat() {
    if (newCat) {
      setCatList((prev) => [...prev, { ...catForm, id: Date.now() }]);
    } else if (editCat) {
      setCatList((prev) => prev.map((c) => c.id === editCat.id ? { ...c, ...catForm } : c));
    }
    setNewCat(false);
    setEditCat(null);
  }

  function deleteCat(id: number) {
    if (confirm(t.admin.confirmDelete)) {
      setCatList((prev) => prev.filter((c) => c.id !== id));
    }
  }

  const showEquipoForm = newEquipo || editEquipo !== null;
  const showCatForm = newCat || editCat !== null;

  const tabLabels: Record<Tab, string> = {
    equipos: t.admin.tabs.equipos,
    categorias: t.admin.tabs.categorias,
    reservas: t.admin.tabs.reservas,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Irreversible delete modal */}
      {deleteConfirmId !== null && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-red-200 shadow-xl w-full max-w-md p-6">
            {/* Warning header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-[#0E2A36] text-base" style={{ fontFamily: "Poppins, sans-serif" }}>
                  {t.admin.reservasGestion.eliminarTitulo}
                </h3>
              </div>
            </div>

            <p className="text-sm text-[#6B8A94] leading-relaxed mb-4">
              {t.admin.reservasGestion.eliminarMsg}
            </p>

            {/* Reservation summary */}
            <div className="bg-[#F4F7F8] rounded-xl p-3 mb-5 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-[#6B8A94]">Equipo</span>
                <span className="font-medium text-[#0E2A36]">{deleteTarget.equipoNombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B8A94]">Solicitante</span>
                <span className="font-medium text-[#0E2A36]">{deleteTarget.solicitante}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B8A94]">Inicio</span>
                <span className="font-mono text-xs text-[#0E2A36]">{formatDate(deleteTarget.fechaInicio)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B8A94]">Estado</span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    deleteTarget.estado === "activa" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {deleteTarget.estado === "activa" ? "Activa" : "Cancelada"}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteSubmitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {deleteSubmitting ? "Eliminando…" : t.admin.reservasGestion.eliminarConfirm}
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleteSubmitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#F4F7F8] text-[#6B8A94] hover:bg-[#DDE5E8] transition-colors disabled:opacity-60"
              >
                {t.admin.cancelar}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0E2A36]" style={{ fontFamily: "Poppins, sans-serif" }}>
          {t.admin.title}
        </h1>
        <p className="mt-1 text-[#6B8A94] text-sm">{t.admin.subtitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#F4F7F8] p-1 rounded-xl w-fit flex-wrap">
        {(["equipos", "categorias", "reservas"] as Tab[]).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === tabKey ? "bg-[#1B7A80] text-white shadow-sm" : "text-[#6B8A94] hover:text-[#0E2A36]"
            }`}
          >
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
            <button
              onClick={startNewEquipo}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B7A80] text-white text-sm font-semibold hover:bg-[#0E2A36] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              {t.admin.nuevoEquipo}
            </button>
          </div>

          {showEquipoForm && (
            <div className="bg-white rounded-2xl border border-[#1B7A80]/30 p-5 mb-4 shadow-sm">
              <h3 className="font-semibold text-[#0E2A36] mb-4 text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>
                {editEquipo ? t.admin.editarEquipo : t.admin.nuevoEquipo}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "nombre", label: t.admin.form.nombre, type: "text" },
                  { key: "codigo", label: t.admin.form.codigo, type: "text" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-[#0E2A36] mb-1.5">{f.label}</label>
                    <input
                      type={f.type}
                      value={equipoForm[f.key as keyof typeof equipoForm] as string}
                      onChange={(e) => setEquipoForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full text-sm px-3 py-2 rounded-xl border border-[#DDE5E8] bg-[#F4F7F8] text-[#0E2A36] focus:outline-none focus:ring-2 focus:ring-[#1B7A80]/40 focus:border-[#1B7A80] transition"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-semibold text-[#0E2A36] mb-1.5">{t.admin.form.estado}</label>
                  <select
                    value={equipoForm.status}
                    onChange={(e) => setEquipoForm((prev) => ({ ...prev, status: e.target.value as EquipoStatus }))}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-[#DDE5E8] bg-[#F4F7F8] text-[#0E2A36] focus:outline-none focus:ring-2 focus:ring-[#1B7A80]/40 focus:border-[#1B7A80] transition"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="reservado">Reservado</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="baja">De baja</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0E2A36] mb-1.5">{t.admin.form.categoria}</label>
                  <select
                    value={equipoForm.categoriaId}
                    onChange={(e) => setEquipoForm((prev) => ({ ...prev, categoriaId: Number(e.target.value) }))}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-[#DDE5E8] bg-[#F4F7F8] text-[#0E2A36] focus:outline-none focus:ring-2 focus:ring-[#1B7A80]/40 focus:border-[#1B7A80] transition"
                  >
                    {catList.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#0E2A36] mb-1.5">{t.admin.form.descripcion}</label>
                  <textarea
                    value={equipoForm.descripcion}
                    onChange={(e) => setEquipoForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                    rows={2}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-[#DDE5E8] bg-[#F4F7F8] text-[#0E2A36] focus:outline-none focus:ring-2 focus:ring-[#1B7A80]/40 focus:border-[#1B7A80] transition resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button onClick={saveEquipo} className="px-5 py-2 rounded-xl bg-[#1B7A80] text-white text-sm font-semibold hover:bg-[#0E2A36] transition-colors">
                  {editEquipo ? t.admin.form.guardar : t.admin.form.crear}
                </button>
                <button
                  onClick={() => { setNewEquipo(false); setEditEquipo(null); }}
                  className="px-5 py-2 rounded-xl bg-[#F4F7F8] text-[#6B8A94] text-sm font-semibold hover:bg-[#DDE5E8] transition-colors"
                >
                  {t.admin.cancelar}
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#DDE5E8] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F4F7F8] border-b border-[#DDE5E8]">
                  {["Código", "Nombre", "Categoría", "Ubicación", "Estado", "Acciones"].map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-[#6B8A94] uppercase tracking-wide">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {equiposList.map((e, i) => {
                  const cat = catList.find((c) => c.id === e.categoriaId);
                  return (
                    <tr key={e.id} className={`border-b border-[#F4F7F8] ${i % 2 === 1 ? "bg-[#FAFCFD]" : ""}`}>
                      <td className="px-4 py-3 font-mono text-xs text-[#6B8A94]">{e.codigo}</td>
                      <td className="px-4 py-3 font-medium text-[#0E2A36]">{e.nombre}</td>
                      <td className="px-4 py-3 text-[#6B8A94] text-xs">{cat?.nombre}</td>
                      <td className="px-4 py-3 text-[#6B8A94] text-xs">Bloque 18, Salón 210</td>
                      <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEditEquipo(e)} className="text-xs text-[#1B7A80] font-semibold hover:underline">Editar</button>
                          <button onClick={() => deleteEquipo(e.id)} className="text-xs text-red-500 font-semibold hover:underline">{t.admin.eliminar}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Categorías ── */}
      {tab === "categorias" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#0E2A36]" style={{ fontFamily: "Poppins, sans-serif" }}>
              {t.admin.tabs.categorias} ({catList.length})
            </h2>
            <button
              onClick={startNewCat}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B7A80] text-white text-sm font-semibold hover:bg-[#0E2A36] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              {t.admin.nuevaCategoria}
            </button>
          </div>

          {showCatForm && (
            <div className="bg-white rounded-2xl border border-[#1B7A80]/30 p-5 mb-4 shadow-sm">
              <h3 className="font-semibold text-[#0E2A36] mb-4 text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>
                {editCat ? t.admin.editarCategoria : t.admin.nuevaCategoria}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0E2A36] mb-1.5">{t.admin.form.nombre}</label>
                  <input
                    type="text"
                    value={catForm.nombre}
                    onChange={(e) => setCatForm((f) => ({ ...f, nombre: e.target.value }))}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-[#DDE5E8] bg-[#F4F7F8] text-[#0E2A36] focus:outline-none focus:ring-2 focus:ring-[#1B7A80]/40 focus:border-[#1B7A80] transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0E2A36] mb-1.5">{t.admin.form.descripcion}</label>
                  <input
                    type="text"
                    value={catForm.descripcion}
                    onChange={(e) => setCatForm((f) => ({ ...f, descripcion: e.target.value }))}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-[#DDE5E8] bg-[#F4F7F8] text-[#0E2A36] focus:outline-none focus:ring-2 focus:ring-[#1B7A80]/40 focus:border-[#1B7A80] transition"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={saveCat} className="px-5 py-2 rounded-xl bg-[#1B7A80] text-white text-sm font-semibold hover:bg-[#0E2A36] transition-colors">
                  {editCat ? t.admin.form.guardar : t.admin.form.crear}
                </button>
                <button onClick={() => { setNewCat(false); setEditCat(null); }} className="px-5 py-2 rounded-xl bg-[#F4F7F8] text-[#6B8A94] text-sm font-semibold hover:bg-[#DDE5E8] transition-colors">
                  {t.admin.cancelar}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {catList.map((c) => {
              const count = equiposList.filter((e) => e.categoriaId === c.id).length;
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-[#DDE5E8] p-5 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-[#0E2A36] text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>{c.nombre}</h3>
                    <span className="text-xs font-mono font-bold text-[#1B7A80] bg-[#6FBFBA]/10 px-2 py-0.5 rounded-full">{count}</span>
                  </div>
                  <p className="text-xs text-[#6B8A94] leading-relaxed flex-1">{c.descripcion}</p>
                  <div className="flex gap-2 pt-2 border-t border-[#F4F7F8]">
                    <button onClick={() => startEditCat(c)} className="text-xs text-[#1B7A80] font-semibold hover:underline">Editar</button>
                    <button onClick={() => deleteCat(c.id)} className="text-xs text-red-500 font-semibold hover:underline">{t.admin.eliminar}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Reservas ── */}
      {tab === "reservas" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#0E2A36]" style={{ fontFamily: "Poppins, sans-serif" }}>
              {t.admin.reservasGestion.title} ({reservasList.length})
            </h2>
            <button
              onClick={refetchReservas}
              disabled={reservasLoading}
              className="flex items-center gap-1.5 text-sm font-medium text-[#1B7A80] hover:text-[#0E2A36] disabled:opacity-50 transition-colors"
            >
              <svg
                className={`w-4 h-4 ${reservasLoading ? "animate-spin" : ""}`}
                fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Actualizar
            </button>
          </div>

          {reservasLoading && reservasList.length === 0 ? (
            <div className="text-center py-16 text-[#6B8A94]">
              <svg className="w-5 h-5 animate-spin mx-auto mb-2 text-[#6FBFBA]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              <p className="text-sm">Cargando reservas…</p>
            </div>
          ) : reservasList.length === 0 ? (
            <div className="text-center py-16 text-[#6B8A94]">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm font-medium">{t.admin.reservasGestion.noReservas}</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#DDE5E8] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F4F7F8] border-b border-[#DDE5E8]">
                    {[
                      t.admin.reservasGestion.columnas.equipo,
                      t.admin.reservasGestion.columnas.solicitante,
                      t.admin.reservasGestion.columnas.inicio,
                      t.admin.reservasGestion.columnas.fin,
                      t.admin.reservasGestion.columnas.estado,
                      t.admin.reservasGestion.columnas.acciones,
                    ].map((col) => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-[#6B8A94] uppercase tracking-wide">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reservasList.map((r, i) => (
                    <tr key={r.id} className={`border-b border-[#F4F7F8] ${i % 2 === 1 ? "bg-[#FAFCFD]" : ""}`}>
                      <td className="px-4 py-3 font-medium text-[#0E2A36]">{r.equipoNombre}</td>
                      <td className="px-4 py-3 text-[#0E2A36]">{r.solicitante}</td>
                      <td className="px-4 py-3 text-[#6B8A94] text-xs font-mono">{formatDate(r.fechaInicio)}</td>
                      <td className="px-4 py-3 text-[#6B8A94] text-xs font-mono">{formatDate(r.fechaFin)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            r.estado === "activa"
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {r.estado === "activa" ? "Activa" : "Cancelada"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDeleteConfirmId(r.id)}
                          className="text-xs font-semibold text-red-600 hover:text-red-800 hover:underline"
                        >
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
