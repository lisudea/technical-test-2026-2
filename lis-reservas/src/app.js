// src/app.js
require("dotenv").config();

const express = require("express");
const app = express();

// Permite que Express entienda JSON en el body de las peticiones (POST, PUT)
app.use(express.json());

const equipoRoutes = require("./routes/equipoRoutes");
app.use("/equipos", equipoRoutes);

const reservaRoutes = require("./routes/reservaRoutes");
app.use("/reservas", reservaRoutes);

// prueba
app.get("/", (req, res) => {
  res.json({ mensaje: "API del Sistema de Gestión y Reservas de Equipos del LIS" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});