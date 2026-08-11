// src/routes/reservaRoutes.js
const express = require("express");
const router = express.Router();
const reservaController = require("../controllers/reservaController");
const verificarToken = require("../middlewares/authMiddleware");

router.post("/", verificarToken, reservaController.crearReserva);
router.get("/estadisticas/top-equipos", reservaController.obtenerTopEquipos);
router.get("/equipo/:id", reservaController.obtenerReservasPorEquipo);
router.put("/:id/cancelar", reservaController.cancelarReserva);

module.exports = router;