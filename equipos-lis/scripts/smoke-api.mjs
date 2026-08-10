import { createServer } from 'vite'
// Este script realiza pruebas de humo sobre la API del backend, verificando que los endpoints principales
// respondan correctamente y que las operaciones básicas de CRUD y validación funcionen como se espera.
// No es un test exhaustivo, sino una verificación rápida de que la API está operativa.
const server = await createServer({
  server: { middlewareMode: true },
  logLevel: 'error',
})

const results = []
const expect = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
  if (!ok) {
    console.log('      esperado:', JSON.stringify(expected))
    console.log('      actual  :', JSON.stringify(actual))
  }
}

try {
  const equipos = await server.ssrLoadModule('/src/api/equipos.ts')
  const reservas = await server.ssrLoadModule('/src/api/reservas.ts')
  const estadisticas = await server.ssrLoadModule('/src/api/estadisticas.ts')
  const client = await server.ssrLoadModule('/src/api/client.ts')

  const page = await equipos.listarEquipos({ page: 0, size: 5 })
  expect('GET /equipos pagina', page.pagina, 0)
  expect('GET /equipos tamano', page.tamano, 5)
  expect('GET /equipos totalElementos > 0', page.totalElementos > 0, true)
  expect('GET /equipos contenido es array', Array.isArray(page.contenido), true)
  const keysEquipo = page.contenido[0] ? Object.keys(page.contenido[0]).sort() : []
  expect('Equipo fields', keysEquipo, ['categoria', 'estado', 'id', 'nombre', 'numeroSerie'])

  const soloVr = await equipos.listarEquipos({ categoria: 'VR' })
  expect('Filtro categoria=VR', soloVr.contenido.every((e) => e.categoria === 'VR'), true)
  expect('Filtro categoria=VR total', soloVr.totalElementos, soloVr.contenido.length)

  const soloMantenimiento = await equipos.listarEquipos({ estado: 'MANTENIMIENTO' })
  expect(
    'Filtro estado=MANTENIMIENTO',
    soloMantenimiento.contenido.every((e) => e.estado === 'MANTENIMIENTO'),
    true,
  )

  const uno = await equipos.getEquipo(1)
  expect('GET /equipos/1 id', uno.id, 1)

  const top = await estadisticas.top5Equipos()
  expect('GET /estadisticas/top-5 array', Array.isArray(top), true)
  if (top.length > 0) {
    const keysTop = Object.keys(top[0]).sort()
    expect('TopEquipo fields', keysTop, ['cantidadReservas', 'equipoId', 'equipoNombre'])
  }

  let conflict = null
  try {
    await reservas.crearReserva({
      nombreUsuario: 'Ana Pérez',
      correoUsuario: 'ana.perez@udea.edu.co',
      equipoId: 2,
      fechaReserva: '2026-08-10T08:00:00',
      fechaDevolucion: '2026-08-10T12:00:00',
    })
  } catch (e) {
    conflict = e
  }
  if (client.isApiError(conflict)) {
    results.push('PASS  POST /reservas reserva base (o 409 si ya existia)')
  } else if (conflict) {
    results.push('FAIL  POST /reservas base: ' + conflict.message)
  } else {
    results.push('PASS  POST /reservas reserva base creada (201)')
  }

  let conflictoHorario = null
  try {
    await reservas.crearReserva({
      nombreUsuario: 'Luis Gómez',
      correoUsuario: 'luis.gomez@udea.edu.co',
      equipoId: 2,
      fechaReserva: '2026-08-10T09:00:00',
      fechaDevolucion: '2026-08-10T10:00:00',
    })
  } catch (e) {
    conflictoHorario = e
  }
  expect('409 horario ocupado', client.isApiError(conflictoHorario), true)
  if (client.isApiError(conflictoHorario)) {
    expect('409 status', conflictoHorario.status, 409)
    expect(
      '409 message',
      typeof conflictoHorario.message === 'string' && conflictoHorario.message.length > 0,
      true,
    )
  }

  // Un equipo ya reservado (id=2 tiene la reserva base ACTIVA) se puede volver a reservar
  // en una franja que no se solape: deben coexistir dos reservas ACTIVA del mismo equipo.
  let segundaReserva = null
  let segundaError = null
  try {
    segundaReserva = await reservas.crearReserva({
      nombreUsuario: 'Marta Ríos',
      correoUsuario: 'marta.rios@udea.edu.co',
      equipoId: 2,
      fechaReserva: '2026-08-10T13:00:00',
      fechaDevolucion: '2026-08-10T15:00:00',
    })
  } catch (e) {
    segundaError = e
  }
  expect(
    '201 reserva no solapada en equipo ya reservado',
    segundaReserva !== null && segundaReserva.estado === 'ACTIVA',
    true,
  )
  if (segundaError && !client.isApiError(segundaError)) {
    results.push('FAIL  reserva no solapada: ' + segundaError.message)
  }
  if (segundaReserva) {
    const activasEquipo2 = await reservas.listarReservas({
      equipoId: 2,
      estado: 'ACTIVA',
      page: 0,
      size: 20,
    })
    expect(
      '2 reservas ACTIVA simultaneas del equipo 2',
      activasEquipo2.contenido.length >= 2,
      true,
    )
    await reservas.cancelarReserva(segundaReserva.id)
  }

  let noDisponible = null
  try {
    await reservas.crearReserva({
      nombreUsuario: 'Marta Ríos',
      correoUsuario: 'marta.rios@udea.edu.co',
      equipoId: 4,
      fechaReserva: '2026-08-11T08:00:00',
      fechaDevolucion: '2026-08-11T12:00:00',
    })
  } catch (e) {
    noDisponible = e
  }
  expect('409 equipo en mantenimiento no reservable', client.isApiError(noDisponible), true)

  let fechaPasada = null
  try {
    await reservas.crearReserva({
      nombreUsuario: 'Marta Ríos',
      correoUsuario: 'marta.rios@udea.edu.co',
      equipoId: 2,
      fechaReserva: '2020-01-01T08:00:00',
      fechaDevolucion: '2020-01-01T12:00:00',
    })
  } catch (e) {
    fechaPasada = e
  }
  expect('409 fecha de inicio en el pasado', client.isApiError(fechaPasada), true)
  if (client.isApiError(fechaPasada)) {
    expect('409 fecha pasada status', fechaPasada.status, 409)
  }

  let validacion = null
  try {
    await reservas.crearReserva({
      nombreUsuario: '',
      correoUsuario: 'correo-invalido',
      equipoId: 2,
      fechaReserva: '2026-08-10T08:00:00',
      fechaDevolucion: '2026-08-10T12:00:00',
    })
  } catch (e) {
    validacion = e
  }
  expect('400 validacion', client.isApiError(validacion), true)
  if (client.isApiError(validacion)) {
    expect('400 status', validacion.status, 400)
    const campos = client.getFieldErrors(validacion).map((f) => f.campo).sort()
    expect('400 errors[] campos', campos, ['correoUsuario', 'nombreUsuario'])
  }

  let noEncontrada = null
  try {
    await reservas.cancelarReserva(999999)
  } catch (e) {
    noEncontrada = e
  }
  expect('404 reserva inexistente', client.isApiError(noEncontrada), true)
  if (client.isApiError(noEncontrada)) {
    expect('404 status', noEncontrada.status, 404)
  }

  const activas = await reservas.listarReservas({ estado: 'ACTIVA', page: 0, size: 20 })
  expect('GET /reservas?estado=ACTIVA', activas.contenido.every((r) => r.estado === 'ACTIVA'), true)
  if (activas.contenido.length > 0) {
    const keysReserva = Object.keys(activas.contenido[0]).sort()
    expect('Reserva fields', keysReserva, [
      'equipo',
      'estado',
      'fechaDevolucion',
      'fechaReserva',
      'id',
      'usuario',
    ])
    expect('Reserva.equipo fields', Object.keys(activas.contenido[0].equipo).sort(), ['id', 'nombre'])
    expect('Reserva.usuario fields', Object.keys(activas.contenido[0].usuario).sort(), [
      'correo',
      'nombre',
    ])
  }

  const mias = await reservas.listarReservas({ equipoId: 2, estado: 'ACTIVA', page: 0, size: 20 })
  const conCancelar = mias.contenido[0]
  if (conCancelar) {
    const cancelada = await reservas.cancelarReserva(conCancelar.id)
    expect('POST /reservas/{id}/cancelar estado', cancelada.estado, 'CANCELADA')
    let dobleCancelacion = null
    try {
      await reservas.cancelarReserva(conCancelar.id)
    } catch (e) {
      dobleCancelacion = e
    }
    expect('409 reserva ya cancelada', client.isApiError(dobleCancelacion), true)
    if (client.isApiError(dobleCancelacion)) {
      expect('409 ya cancelada status', dobleCancelacion.status, 409)
    }
  } else {
    results.push('SKIP  cancelar (no habia reservas ACTIVAS del equipo 2)')
  }

  const getErrorMessage = client.getErrorMessage
  const red = getErrorMessage(new Error('x'), 'fallback-red')
  expect('getErrorMessage error generico', red, 'fallback-red')
  const api = getErrorMessage(noEncontrada, 'fallback-404')
  expect('getErrorMessage ApiError usa message', api, noEncontrada.message)

  const ID_PRUEBA = 999001
  let dupId = null
  try {
    await equipos.crearEquipo({
      id: 10,
      nombre: 'Duplicado',
      numeroSerie: 'SN-999-X',
      categoria: 'VR',
      estado: 'DISPONIBLE',
    })
  } catch (e) {
    dupId = e
  }
  expect('409 id duplicado', client.isApiError(dupId), true)
  if (client.isApiError(dupId)) {
    expect('409 id duplicado status', dupId.status, 409)
    expect('409 id duplicado message', /id 10/.test(dupId.message), true)
  }

  const ID_FRESCO = 700000 + Math.floor(Math.random() * 99999)
  let dupSerie = null
  try {
    await equipos.crearEquipo({
      id: ID_FRESCO,
      nombre: 'Duplicado',
      numeroSerie: 'SN-001',
      categoria: 'VR',
      estado: 'DISPONIBLE',
    })
  } catch (e) {
    dupSerie = e
  }
  expect('409 serie duplicada', client.isApiError(dupSerie), true)
  if (client.isApiError(dupSerie)) {
    expect('409 serie duplicada status', dupSerie.status, 409)
    expect('409 serie duplicada message', /SN-001/.test(dupSerie.message), true)
  }

  let validacionEquipo = null
  try {
    await equipos.crearEquipo({
      id: ID_PRUEBA,
      nombre: '',
      numeroSerie: '',
      categoria: 'VR',
      estado: 'DISPONIBLE',
    })
  } catch (e) {
    validacionEquipo = e
  }
  expect('400 validacion equipo', client.isApiError(validacionEquipo), true)
  if (client.isApiError(validacionEquipo)) {
    expect('400 validacion equipo status', validacionEquipo.status, 400)
    const campos = client.getFieldErrors(validacionEquipo).map((f) => f.campo).sort()
    expect('400 validacion equipo campos', campos, ['nombre', 'numeroSerie'])
  }

  let creado
  try {
    creado = await equipos.crearEquipo({
      id: ID_PRUEBA,
      nombre: 'Equipo Prueba LIS',
      numeroSerie: 'SN-PRUEBA-1',
      categoria: 'MICROCONTROLADORES',
      estado: 'DISPONIBLE',
    })
    expect('POST /equipos creado id', creado.id, ID_PRUEBA)
    expect('POST /equipos creado estado', creado.estado, 'DISPONIBLE')
  } catch (e) {
    creado = await equipos.getEquipo(ID_PRUEBA)
    expect('Equipo 999001 ya existia (idempotente)', creado.id, ID_PRUEBA)
  }

  const actualizado = await equipos.actualizarEquipo({
    id: ID_PRUEBA,
    nombre: 'Equipo Prueba LIS',
    numeroSerie: 'SN-PRUEBA-1',
    categoria: 'MICROCONTROLADORES',
    estado: 'MANTENIMIENTO',
  })
  expect('PUT /equipos actualiza estado', actualizado.estado, 'MANTENIMIENTO')

  await equipos.actualizarEquipo({
    id: ID_PRUEBA,
    nombre: 'Equipo Prueba LIS',
    numeroSerie: 'SN-PRUEBA-1',
    categoria: 'MICROCONTROLADORES',
    estado: 'DISPONIBLE',
  })

  const porId = await equipos.getEquipo(ID_PRUEBA)
  expect('GET /equipos/{id} tras CRUD', porId.nombre, 'Equipo Prueba LIS')

  let dupSerieUpdate = null
  try {
    await equipos.actualizarEquipo({
      id: ID_PRUEBA,
      nombre: 'Equipo Prueba LIS',
      numeroSerie: 'SN-001',
      categoria: 'MICROCONTROLADORES',
      estado: 'DISPONIBLE',
    })
  } catch (e) {
    dupSerieUpdate = e
  }
  expect('PUT 409 serie en uso', client.isApiError(dupSerieUpdate), true)
  if (client.isApiError(dupSerieUpdate)) {
    expect('PUT 409 serie en uso status', dupSerieUpdate.status, 409)
  }

  const disponibles = await equipos.listarEquipos({ estado: 'DISPONIBLE', page: 0, size: 100 })
  expect(
    'Modal: lista solo DISPONIBLES',
    disponibles.contenido.every((e) => e.estado === 'DISPONIBLE'),
    true,
  )

  // Las pruebas de reservas ISO y de conteo del top 5 usan el equipo líder del ranking y verifican la suma
  // total contada, para que los asertos no dependan del estado previo de la base de datos.
  const topAntes = await estadisticas.top5Equipos()
  const totalAntes = topAntes.reduce((suma, x) => suma + x.cantidadReservas, 0)
  const equipoReservableId = topAntes[0].equipoId

  const aISO = (dt) => (dt ? `${dt}:00` : '')
  let sinSegundos = null
  let creadaSinSegundos = null
  try {
    creadaSinSegundos = await reservas.crearReserva({
      nombreUsuario: 'Prueba ISO',
      correoUsuario: 'prueba.iso@udea.edu.co',
      equipoId: equipoReservableId,
      fechaReserva: '2026-08-11T09:30',
      fechaDevolucion: '2026-08-11T11:30',
    })
  } catch (e) {
    sinSegundos = e
  }
  const isoSinSegundosAceptado =
    !client.isApiError(sinSegundos) || (client.isApiError(sinSegundos) && sinSegundos.status === 409)
  results.push(
    `${isoSinSegundosAceptado ? 'PASS' : 'FAIL'}  ISO sin segundos aceptado o 409 por horario (no 400)`,
  )
  if (creadaSinSegundos) {
    await reservas.cancelarReserva(creadaSinSegundos.id)
  }

  // Se intenta en varias fechas por si la primera franja ya está ocupada.
  let creada = null
  for (const dia of ['2026-08-12T09:30', '2026-08-13T09:30', '2026-08-14T09:30']) {
    try {
      creada = await reservas.crearReserva({
        nombreUsuario: 'Prueba ISO',
        correoUsuario: 'prueba.iso@udea.edu.co',
        equipoId: equipoReservableId,
        fechaReserva: aISO(dia),
        fechaDevolucion: aISO(dia.slice(0, 10) + 'T11:30'),
      })
      break
    } catch (e) {
      if (!client.isApiError(e) || e.status !== 409) throw e
    }
  }
  expect('aISO -> 2026-08-12T09:30:00 aceptado', creada !== null && creada.estado === 'ACTIVA', true)

  // Una reserva ACTIVA nueva debe sumar 1 al total contado por el top 5 (el equipo líder siempre está en el ranking).
  const topDespuesCrear = await estadisticas.top5Equipos()
  const totalDespues = topDespuesCrear.reduce((suma, x) => suma + x.cantidadReservas, 0)
  expect('Top 5 cuenta la reserva ACTIVA', totalDespues === totalAntes + 1, true)

  const porEquipo = await reservas.listarReservas({ equipoId: equipoReservableId, page: 0, size: 20 })
  expect(
    'Filtro equipoId en reservas',
    porEquipo.contenido.every((r) => r.equipo.id === equipoReservableId),
    true,
  )

  await reservas.cancelarReserva(creada.id)
  // Al cancelar, la reserva deja de contarse y el total vuelve al valor original.
  const topDespuesCancelar = await estadisticas.top5Equipos()
  const totalFinal = topDespuesCancelar.reduce((suma, x) => suma + x.cantidadReservas, 0)
  expect('Top 5 deja de contar la reserva CANCELADA', totalFinal === totalAntes, true)

  const canceladas = await reservas.listarReservas({ estado: 'CANCELADA', page: 0, size: 5 })
  expect(
    'Filtro estado=CANCELADA',
    canceladas.contenido.every((r) => r.estado === 'CANCELADA'),
    true,
  )
} catch (e) {
  console.log('SMOKE CRASH:', e)
} finally {
  await server.close()
}

const fails = results.filter((r) => r.startsWith('FAIL')).length
console.log(results.join('\n'))
console.log(`\n${results.length - fails}/${results.length} OK`)
