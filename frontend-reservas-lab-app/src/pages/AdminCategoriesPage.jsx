import { useState } from 'react'
import { Container } from '../components/ui/Container.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Field, Input } from '../components/ui/Form.jsx'
import { PageLoader } from '../components/ui/Spinner.jsx'
import { Alert } from '../components/ui/Alert.jsx'
import { Icon } from '../components/ui/Icons.jsx'
import { useToast, messageFromError } from '../components/ui/Toast.jsx'
import { useCategories } from '../hooks/useCategory.js'

export default function AdminCategoriesPage() {
  const categories = useCategories()
  const toast = useToast()

  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [formError, setFormError] = useState(null)

  const handleCreate = async (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('El nombre de la categoria es obligatorio')
      return
    }
    setError('')
    setFormError(null)
    try {
      await categories.create(trimmed)
      toast.success(`Categoria "${trimmed}" creada.`)
      setName('')
    } catch (err) {
      setFormError(messageFromError(err))
    }
  }

  return (
    <Container>
      <PageHeader
        icon="tag"
        eyebrow="Administracion"
        title="Categorias de equipos"
        description="Crea categorias nuevas para clasificar los equipos del laboratorio."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="self-start p-5">
          <h2 className="text-lg font-bold text-primary-dark">Nueva categoria</h2>
          <p className="mt-1 text-sm text-muted">
            Las categorias se usan para filtrar el inventario de equipos.
          </p>

          {formError ? (
            <Alert tone="error" className="mt-4" title="No fue posible crear la categoria">
              {formError}
            </Alert>
          ) : null}

          <form onSubmit={handleCreate} noValidate className="mt-4 space-y-4">
            <Field label="Nombre de la categoria" required error={error}>
              <Input
                placeholder="Ej. Robotica"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError('')
                  setFormError(null)
                }}
                invalid={Boolean(error)}
              />
            </Field>

            <Button type="submit" loading={categories.creating} icon="plus">
              Crear categoria
            </Button>
          </form>
        </Card>

        <Card className="self-start p-5">
          <h2 className="text-lg font-bold text-primary-dark">Categorias existentes</h2>
          <p className="mt-1 text-sm text-muted">
            {categories.data?.length ?? 0} categorias disponibles en el sistema.
          </p>

          {categories.loading ? (
            <div className="flex justify-center py-10">
              <PageLoader />
            </div>
          ) : categories.error ? (
            <Alert tone="error" className="mt-4">
              {categories.error.message}
            </Alert>
          ) : (
            <ul className="mt-4 space-y-2">
              {categories.data?.length ? (
                categories.data.map((category) => (
                  <li
                    key={category.categoryId}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-soft px-4 py-3"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary">
                        <Icon name="tag" className="h-4 w-4" />
                      </span>
                      <span className="font-semibold text-ink">{category.categoryName}</span>
                    </span>
                  </li>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted">
                  Aun no hay categorias registradas.
                </p>
              )}
            </ul>
          )}
        </Card>
      </div>
    </Container>
  )
}