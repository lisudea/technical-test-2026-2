/**
 * App — el componente principal de la aplicación.
 *
 * QUÉ MUESTRA: por ahora, solo un texto de prueba para comprobar que el
 * proyecto arranca y que Tailwind está funcionando.
 *
 * QUÉ NECESITA (props): nada. Es el componente de más arriba de todos, así que
 * nadie le pasa información.
 *
 * CÓMO SE USA: lo usa `main.jsx`, escribiendo `<App />`.
 *
 * En las siguientes tareas este archivo pasará a montar el tablero completo.
 */

export default function App() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-blue-600">
        LIS · Monitoreo de Equipos
      </h1>
      <p className="mt-2 text-slate-600">
        Si este título se ve grande y azul, Tailwind está funcionando.
      </p>
    </div>
  )
}
