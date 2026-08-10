const express = require("express");
const router = express.Router();
const reservaController = require("../controllers/reservaController");

router.post("/", reservaController.crearReserva);
router.get("/estadisticas/top-equipos", reservaController.obtenerTopEquipos);
router.get("/equipo/:id", reservaController.obtenerReservasPorEquipo);
router.put("/:id/cancelar", reservaController.cancelarReserva);

module.exports = router;