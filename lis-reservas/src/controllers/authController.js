const jwt = require("jsonwebtoken");
const googleClient = require("../config/googleClient");

const DOMINIO_PERMITIDO = "@udea.edu.co";

// POST /auth/google - Recibe el token de Google, valida el correo y devuelve un JWT
async function loginConGoogle(req, res) {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ mensaje: "Falta el token de Google (credential)" });
    }

    //Verificar con Google que el token es real y no fue alterado
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const correo = payload.email;
    const nombre = payload.name;

    //Validar que el correo sea institucional
    if (!correo.endsWith(DOMINIO_PERMITIDO)) {
      return res.status(403).json({
        mensaje: `Acceso denegado. Debes iniciar sesión con un correo institucional (${DOMINIO_PERMITIDO})`,
      });
    }

    //Generar nuestro propio JWT
    const token = jwt.sign(
      { correo, nombre },
      process.env.JWT_SECRET,
      { expiresIn: "2h" } // el token expira en 2 horas
    );

    return res.status(200).json({
      mensaje: "Inicio de sesión exitoso",
      token,
      usuario: { correo, nombre },
    });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ mensaje: "Token de Google inválido" });
  }
}

module.exports = { loginConGoogle };