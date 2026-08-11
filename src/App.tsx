import { useCallback, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { DemoBanner } from './components/common/DemoBanner'
import { Header } from './components/layout/Header'
import { Toaster } from './feedback/Toaster'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { DashboardPage } from './pages/DashboardPage'
import { EquipmentAdminPage } from './pages/EquipmentAdminPage'
import { ReservationsPage } from './pages/ReservationsPage'
import { StatisticsPage } from './pages/StatisticsPage'

export default function App() {
  // Al reintentar la conexion desde el aviso de modo demostracion, se cambia
  // la clave del arbol de rutas para forzar que las paginas vuelvan a pedir
  // sus datos, esta vez contra la API real.
  const [remountKey, setRemountKey] = useState(0)

  const handleRetry = useCallback(() => setRemountKey((key) => key + 1), [])

  return (
    <div className="app-shell">
      <Header />

      <DemoBanner onRetry={handleRetry} />

      <main className="app-main">
        <div className="container" key={remountKey}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/reservas" element={<ReservationsPage />} />
            <Route path="/equipos" element={<EquipmentAdminPage />} />
            <Route path="/estadisticas" element={<StatisticsPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      <Toaster />
    </div>
  )
}