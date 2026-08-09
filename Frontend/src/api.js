const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function handle(res) {
  if (!res.ok) {
    let detail = "Ocurrió un error inesperado.";
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch (_) {
      /* respuesta sin cuerpo JSON */
    }
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const api = {
  listarEquipos: ({ categoria, estado, pagina = 1, tamano_pagina = 50 } = {}) => {
    const params = new URLSearchParams();
    if (categoria) params.set("categoria", categoria);
    if (estado) params.set("estado", estado);
    params.set("pagina", pagina);
    params.set("tamano_pagina", tamano_pagina);
    return fetch(`${BASE_URL}/equipos?${params.toString()}`).then(handle);
  },

  crearEquipo: (payload) =>
    fetch(`${BASE_URL}/equipos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handle),

  listarReservas: (equipo_id) => {
    const params = new URLSearchParams();
    if (equipo_id) params.set("equipo_id", equipo_id);
    return fetch(`${BASE_URL}/reservas?${params.toString()}`).then(handle);
  },

  crearReserva: (payload) =>
    fetch(`${BASE_URL}/reservas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handle),

  cancelarReserva: (id) =>
    fetch(`${BASE_URL}/reservas/${id}`, { method: "DELETE" }).then(handle),

  topEquipos: () => fetch(`${BASE_URL}/estadisticas/top-equipos`).then(handle),
};

export { BASE_URL };
