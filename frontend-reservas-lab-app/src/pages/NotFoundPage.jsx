import { Link } from 'react-router-dom'
import { Container } from '../components/ui/Container.jsx'
import { Button } from '../components/ui/Button.jsx'

export default function NotFoundPage() {
  return (
    <Container className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-7xl font-bold text-primary/30">404</p>
      <h1 className="mt-3 text-2xl font-bold text-primary-dark">Pagina no encontrada</h1>
      <p className="mt-2 max-w-md text-muted">
        La ruta que intentas consultar no existe o no tienes acceso a ella.
      </p>
      <Link to="/" className="mt-6">
        <Button icon="arrowLeft">Volver al inicio</Button>
      </Link>
    </Container>
  )
}