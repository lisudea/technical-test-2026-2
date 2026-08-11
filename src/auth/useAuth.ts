import { useContext } from 'react'

import { AuthContext } from './AuthProvider'
import type { AuthContextValue } from './AuthProvider'

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }

  return context
}