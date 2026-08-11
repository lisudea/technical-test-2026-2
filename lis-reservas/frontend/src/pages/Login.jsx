// src/pages/Login.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cpu } from "lucide-react";
import { loginConGoogle } from "../services/api";

function Login() {
  const navigate = useNavigate();
  const botonGoogleRef = useRef(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!window.google) return;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: manejarRespuestaGoogle,
    });

    window.google.accounts.id.renderButton(botonGoogleRef.current, {
      theme: "outline",
      size: "large",
      shape: "rectangular",
      width: 280,
    });
  }, []);

  async function manejarRespuestaGoogle(respuesta) {
    setCargando(true);
    setError("");

    try {
      const { data } = await loginConGoogle(respuesta.credential);
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      navigate("/dashboard");
    } catch (err) {
      const mensaje = err.response?.data?.mensaje || "No pudimos iniciar sesión. Intenta de nuevo.";
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 w-full max-w-sm text-center">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
          <Cpu size={22} className="text-white" />
        </div>
        <h1 className="text-xl font-semibold text-slate-800 mb-1">LIS Reservas</h1>
        <p className="text-sm text-slate-500 mb-6">
          Inicia sesión con tu correo institucional <span className="font-medium">@udea.edu.co</span>
        </p>

        <div ref={botonGoogleRef} className="flex justify-center" />

        {cargando && <p className="text-sm text-slate-400 mt-4">Verificando...</p>}

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-4">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;