const prisma = require("../config/prismaClient");

// Validación correo
function esCorreoValido(correo) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(correo);
}

// Crear una nueva reserva
async function crearReserva(req, res) {
  try {
    const { nombreUsuario, correo, equipoId, fechaInicio, fechaFin } = req.body;

    if (!nombreUsuario || !correo || !equipoId || !fechaInicio || !fechaFin) {
      return res.status(400).json({
        mensaje:
          "Los campos nombreUsuario, correo, equipoId, fechaInicio y fechaFin son obligatorios",
      });
    }

    //Validar formato de correo
    if (!esCorreoValido(correo)) {
      return res.status(400).json({ mensaje: "El correo no tiene un formato válido" });
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    //Validar fechas sean válidas y que inicio sea menor que fin
    if (isNaN(inicio) || isNaN(fin)) {
      return res.status(400).json({ mensaje: "Las fechas enviadas no son válidas" });
    }
    if (inicio >= fin) {
      return res.status(400).json({
        mensaje: "La fecha de inicio debe ser menor que la fecha de fin",
      });
    }

    // Validar equipo exista
    const equipo = await prisma.equipo.findUnique({
      where: { id: parseInt(equipoId) },
    });
    if (!equipo) {
      return res.status(404).json({ mensaje: "El equipo indicado no existe" });
    }

    // verificar que no haya cruce de horarios
    // Dos rangos de fechas se cruzan si: inicioA < finB Y finA > inicioB
    const reservaCruzada = await prisma.reserva.findFirst({
      where: {
        equipoId: parseInt(equipoId),
        estado: "activa", // solo nos importan las reservas activas, no las canceladas
        fechaInicio: { lt: fin },
        fechaFin: { gt: inicio },
      },
    });

    if (reservaCruzada) {
      return res.status(409).json({
        mensaje: "El equipo ya está reservado en ese horario",
      });
    }

    // Si todo está bien, creamos la reserva
    const nuevaReserva = await prisma.reserva.create({
      data: {
        nombreUsuario,
        correo,
        equipoId: parseInt(equipoId),
        fechaInicio: inicio,
        fechaFin: fin,
      },
    });

    return res.status(201).json(nuevaReserva);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

// GET /reservas/equipo/:id - Listar reservas de un equipo específico
async function obtenerReservasPorEquipo(req, res) {
  try {
    const { id } = req.params;

    const equipo = await prisma.equipo.findUnique({
      where: { id: parseInt(id) },
    });
    if (!equipo) {
      return res.status(404).json({ mensaje: "El equipo indicado no existe" });
    }

    const reservas = await prisma.reserva.findMany({
      where: { equipoId: parseInt(id) },
      orderBy: { fechaInicio: "asc" },
    });

    return res.status(200).json(reservas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

// PUT /reservas/:id/cancelar - Cancelar una reserva (sin borrarla)
async function cancelarReserva(req, res) {
  try {
    const { id } = req.params;

    const reserva = await prisma.reserva.findUnique({
      where: { id: parseInt(id) },
    });
    if (!reserva) {
      return res.status(404).json({ mensaje: "La reserva indicada no existe" });
    }

    if (reserva.estado === "cancelada") {
      return res.status(400).json({ mensaje: "Esta reserva ya estaba cancelada" });
    }

    const reservaCancelada = await prisma.reserva.update({
      where: { id: parseInt(id) },
      data: { estado: "cancelada" },
    });

    return res.status(200).json(reservaCancelada);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

// GET /estadisticas/top-equipos - Top 5 equipos más reservados históricamente
async function obtenerTopEquipos(req, res) {
  try {
    // Agrupamos las reservas por equipoId y contamos cuántas tiene cada uno
    const conteo = await prisma.reserva.groupBy({
      by: ["equipoId"],
      _count: { equipoId: true },
      orderBy: {
        _count: { equipoId: "desc" },
      },
      take: 5,
    });

    // El groupBy solo nos da el equipoId y el conteo, no el nombre del equipo.
    // Por eso buscamos los datos completos de cada equipo por separado.
    const topEquipos = await Promise.all(
      conteo.map(async (item) => {
        const equipo = await prisma.equipo.findUnique({
          where: { id: item.equipoId },
        });
        return {
          equipo,
          totalReservas: item._count.equipoId,
        };
      })
    );

    return res.status(200).json(topEquipos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

module.exports = {
  crearReserva,
  obtenerReservasPorEquipo,
  cancelarReserva,
  obtenerTopEquipos,
};