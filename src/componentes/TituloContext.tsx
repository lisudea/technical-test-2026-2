import { createContext, useContext, useState, type ReactNode } from 'react'

const Contexto = createContext<{ titulo: string; setTitulo: (t: string) => void }>({
  titulo: '',
  setTitulo: () => {},
})

export function TituloProvider({ children }: { children: ReactNode }) {
  const [titulo, setTitulo] = useState('')
  return <Contexto.Provider value={{ titulo, setTitulo }}>{children}</Contexto.Provider>
}

export const useTituloBarra = () => useContext(Contexto)
