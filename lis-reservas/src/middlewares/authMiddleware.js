
// Revisa que la petición traiga un JWT válido antes de dejarla pasar al controlador.
const jwt = require("jsonwebtoken");

function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  // El header debe venir como: "Bearer eyJhbGciOi..."
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      mensaje: "No autorizado. Debes iniciar sesión para crear una reserva",
    });
  }

  const token = authHeader.split(" ")[1]; // nos quedamos solo con el token, sin "Bearer "

  try {
    const datosUsuario = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = datosUsuario; // guardamos los datos del usuario por si el controlador los necesita
    next(); // todo bien, dejamos pasar la petición al controlador
  } catch (error) {
    return res.status(401).json({ mensaje: "Token inválido o expirado" });
  }
}

module.exports = verificarToken;