const prisma = require("../config/prismaClient");

// Estados válidos para un equipo 
const ESTADOS_VALIDOS = ["disponible", "reservado", "mantenimiento"];

// POST /equipos - Registrar un nuevo equipo
async function crearEquipo(req, res) {
  try {
    const { nombre, numeroSerie, categoria, estado } = req.body;

    if (!nombre || !numeroSerie || !categoria) {
      return res.status(400).json({
        mensaje: "Los campos nombre, numeroSerie y categoria son obligatorios",
      });
    }

    // Si mandan estado, debe ser de los válidos
    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({
        mensaje: `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}`,
      });
    }

    const nuevoEquipo = await prisma.equipo.create({
      data: {
        nombre,
        numeroSerie,
        categoria,
        estado: estado || "disponible", // si no mandan estado, nace disponible
      },
    });

    return res.status(201).json(nuevoEquipo);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        mensaje: "Ya existe un equipo registrado con ese número de serie/MAC",
      });
    }
    console.error(error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

// GET /equipos - Consultar equipos con paginación y filtros
async function obtenerEquipos(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { categoria, estado } = req.query;

    // Armamos el filtro según la URL
    const filtro = {};
    if (categoria) filtro.categoria = categoria;
    if (estado) filtro.estado = estado;

    const equipos = await prisma.equipo.findMany({
      where: filtro,
      skip: (page - 1) * limit, // cuántos registros nos saltamos
      take: limit,              // cuántos traemos
      orderBy: { id: "asc" },
    });

    const total = await prisma.equipo.count({ where: filtro });

    return res.status(200).json({
      pagina: page,
      totalPaginas: Math.ceil(total / limit),
      totalEquipos: total,
      equipos,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

// GET /equipos/:id - Consultar un equipo específico
async function obtenerEquipoPorId(req, res) {
  try {
    const { id } = req.params;

    const equipo = await prisma.equipo.findUnique({
      where: { id: parseInt(id) },
    });

    if (!equipo) {
      return res.status(404).json({ mensaje: "Equipo no encontrado" });
    }

    return res.status(200).json(equipo);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

// PUT /equipos/:id - Actualizar un equipo
async function actualizarEquipo(req, res) {
  try {
    const { id } = req.params;
    const { nombre, numeroSerie, categoria, estado } = req.body;

    const equipoExistente = await prisma.equipo.findUnique({
      where: { id: parseInt(id) },
    });

    if (!equipoExistente) {
      return res.status(404).json({ mensaje: "Equipo no encontrado" });
    }

    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({
        mensaje: `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}`,
      });
    }

    const equipoActualizado = await prisma.equipo.update({
      where: { id: parseInt(id) },
      data: {
        // Si no mandan un campo, dejamos el valor que ya tenía
        nombre: nombre || equipoExistente.nombre,
        numeroSerie: numeroSerie || equipoExistente.numeroSerie,
        categoria: categoria || equipoExistente.categoria,
        estado: estado || equipoExistente.estado,
      },
    });

    return res.status(200).json(equipoActualizado);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        mensaje: "Ya existe un equipo registrado con ese número de serie/MAC",
      });
    }
    console.error(error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

module.exports = {
  crearEquipo,
  obtenerEquipos,
  obtenerEquipoPorId,
  actualizarEquipo,
};