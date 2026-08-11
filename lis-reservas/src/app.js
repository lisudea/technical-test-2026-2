require("dotenv").config();

const express = require("express");
const app = express();
const path = require("path");

app.use(express.static(path.join(__dirname, "../public")));
// Permite que Express entienda JSON en el body de las peticiones (POST, PUT)
app.use(express.json());
app.use(express.static("public"));

const equipoRoutes = require("./routes/equipoRoutes");
app.use("/equipos", equipoRoutes);

const reservaRoutes = require("./routes/reservaRoutes");
app.use("/reservas", reservaRoutes);

const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);
// prueba
app.get("/", (req, res) => {
  res.json({ mensaje: "API del Sistema de Gestión y Reservas de Equipos del LIS" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});