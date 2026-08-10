const express = require("express");
const router = express.Router();
const equipoController = require("../controllers/equipoController");

router.post("/", equipoController.crearEquipo);
router.get("/", equipoController.obtenerEquipos);
router.get("/:id", equipoController.obtenerEquipoPorId);
router.put("/:id", equipoController.actualizarEquipo);

module.exports = router;