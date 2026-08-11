/**
 * Diccionario en espanol. Es la FUENTE DE VERDAD de las claves: el resto de
 * idiomas se tipan contra el (`Record<TranslationKey, string>`), asi que si se
 * olvida una traduccion el proyecto no compila.
 *
 * Ningun texto visible debe escribirse directamente en un componente.
 */
export const es = {
  // Aplicacion
  'app.title': 'Panel de Recursos del LIS',
  'app.subtitle': 'Laboratorio Integrado de Sistemas · Universidad de Antioquia',
  'app.shortTitle': 'Recursos LIS',

  // Navegacion
  'nav.dashboard': 'Tablero',
  'nav.reservations': 'Reservas',
  'nav.equipment': 'Equipos',
  'nav.statistics': 'Estadísticas',
  'nav.menu': 'Menú principal',

  // Idioma
  'language.label': 'Idioma',
  'language.es': 'Español',
  'language.en': 'Inglés',
  'language.switchTo': 'Cambiar a {language}',

  // Sesion
  'auth.login': 'Iniciar sesión con Google',
  'auth.loginShort': 'Iniciar sesión',
  'auth.logout': 'Cerrar sesión',
  'auth.institutionalOnly': 'Solo cuentas @udea.edu.co',
  'auth.loggingIn': 'Validando tu sesión…',
  'auth.callbackError': 'No se recibió ningún token. Vuelve a iniciar sesión.',
  'auth.welcome': 'Sesión iniciada como {name}',
  'auth.sessionExpired': 'Tu sesión expiró. Vuelve a iniciar sesión.',

  // Estados de equipo
  'status.AVAILABLE': 'Disponible',
  'status.RESERVED': 'Reservado',
  'status.MAINTENANCE': 'En mantenimiento',

  // Categorias
  'category.MICROCONTROLLERS': 'Microcontroladores',
  'category.VR': 'Realidad virtual',
  'category.NETWORKS': 'Redes',

  // Estados de reserva
  'reservationStatus.ACTIVE': 'Activa',
  'reservationStatus.CANCELLED': 'Cancelada',

  // Indicadores
  'stats.total': 'Equipos registrados',
  'stats.available': 'Disponibles',
  'stats.reserved': 'Reservados',
  'stats.maintenance': 'En mantenimiento',

  // Filtros
  'filters.title': 'Filtros',
  'filters.search': 'Buscar',
  'filters.searchPlaceholder': 'Nombre o número de serie…',
  'filters.category': 'Categoría',
  'filters.status': 'Estado',
  'filters.all': 'Todas',
  'filters.allStatuses': 'Todos',
  'filters.clear': 'Limpiar filtros',
  'filters.results': '{shown} de {total} equipos',
  'filters.searchHint': 'La búsqueda por texto se aplica sobre la página actual.',

  // Tablero
  'dashboard.title': 'Equipos del laboratorio',
  'dashboard.empty.title': 'No hay equipos que coincidan',
  'dashboard.empty.body': 'Prueba a cambiar o limpiar los filtros.',
  'dashboard.loading': 'Cargando equipos…',

  // Tarjeta de equipo
  'equipment.serial': 'Serie',
  'equipment.reserve': 'Reservar',
  'equipment.cannotReserve': 'Este equipo está en mantenimiento y no se puede reservar',
  'equipment.edit': 'Editar',
  'equipment.createdAt': 'Registrado el {date}',

  // Paginacion
  'pagination.previous': 'Anterior',
  'pagination.next': 'Siguiente',
  'pagination.info': 'Página {current} de {total}',
  'pagination.pageSize': 'Por página',

  // Modal de reserva
  'reserve.title': 'Reservar {equipment}',
  'reserve.occupied': 'Franjas ya ocupadas',
  'reserve.noOccupied': 'Este equipo no tiene reservas activas.',
  'reserve.start': 'Inicio',
  'reserve.end': 'Fin',
  'reserve.name': 'Tu nombre',
  'reserve.email': 'Tu correo',
  'reserve.namePlaceholder': 'Nombre y apellido',
  'reserve.emailPlaceholder': 'usuario@udea.edu.co',
  'reserve.identityHint':
    'Como no has iniciado sesión, identifícate con tu nombre y correo para reservar.',
  'reserve.identityFromSession': 'Reservarás como {name} ({email}).',
  'reserve.submit': 'Confirmar reserva',
  'reserve.submitting': 'Reservando…',
  'reserve.cancel': 'Cancelar',
  'reserve.success': 'Reserva creada correctamente',
  'reserve.invalidRange': 'La hora de inicio debe ser anterior a la de fin.',
  'reserve.pastDate': 'La reserva debe empezar en el futuro.',
  'reserve.missingIdentity': 'Indica tu nombre y tu correo.',
  'reserve.tip':
    'Truco: dos reservas que se tocan (10:00–11:00 y 11:00–12:00) no chocan; para provocar un conflicto tienen que cruzarse.',

  // Reservas
  'reservations.title': 'Reservas',
  'reservations.subtitle': 'Todas las reservas registradas en el laboratorio',
  'reservations.equipment': 'Equipo',
  'reservations.user': 'Usuario',
  'reservations.slot': 'Franja horaria',
  'reservations.status': 'Estado',
  'reservations.actions': 'Acciones',
  'reservations.cancel': 'Cancelar',
  'reservations.cancelling': 'Cancelando…',
  'reservations.cancelled': 'Reserva cancelada',
  'reservations.confirmCancel': '¿Seguro que quieres cancelar esta reserva?',
  'reservations.empty.title': 'Todavía no hay reservas',
  'reservations.empty.body': 'Reserva un equipo desde el tablero para verlo aquí.',
  'reservations.loading': 'Cargando reservas…',
  'reservations.onlyOwn': 'Solo puedes cancelar las reservas creadas con tu propio correo.',

  // Gestion de equipos
  'admin.title': 'Gestión de equipos',
  'admin.subtitle': 'Registra equipos nuevos o actualiza los existentes',
  'admin.new': 'Registrar equipo',
  'admin.editing': 'Editando: {name}',
  'admin.name': 'Nombre',
  'admin.namePlaceholder': 'Arduino Uno R3',
  'admin.serial': 'Número de serie o MAC',
  'admin.serialPlaceholder': 'MCU-ARD-0001',
  'admin.category': 'Categoría',
  'admin.status': 'Estado',
  'admin.save': 'Guardar',
  'admin.saving': 'Guardando…',
  'admin.cancelEdit': 'Cancelar edición',
  'admin.created': 'Equipo registrado correctamente',
  'admin.updated': 'Equipo actualizado correctamente',
  'admin.requiredName': 'El nombre es obligatorio.',
  'admin.requiredSerial': 'El número de serie es obligatorio.',
  'admin.listTitle': 'Equipos registrados',
  'admin.loginRequired.title': 'Inicia sesión para gestionar el inventario',
  'admin.loginRequired.body':
    'Consultar los equipos es libre y reservarlos también, pero dar de alta o editar el catálogo requiere una cuenta institucional @udea.edu.co.',

  // Estadisticas
  'statistics.title': 'Equipos más solicitados',
  'statistics.subtitle': 'Top 5 histórico, incluyendo las reservas canceladas',
  'statistics.reservations': '{count} reservas',
  'statistics.reservation': '{count} reserva',
  'statistics.empty.title': 'Todavía no hay datos',
  'statistics.empty.body': 'Cuando existan reservas aparecerán aquí.',
  'statistics.loading': 'Cargando estadísticas…',

  // Errores (requisito 6)
  'errors.CONFLICT.title': 'Franja horaria ocupada',
  'errors.CONFLICT.body':
    'Ese equipo ya tiene una reserva que se cruza con el horario elegido. Prueba con otra franja.',
  'errors.EQUIPMENT_IN_MAINTENANCE.title': 'Equipo en mantenimiento',
  'errors.EQUIPMENT_IN_MAINTENANCE.body':
    'Este equipo está fuera de servicio y no admite reservas hasta que vuelva a estar disponible.',
  'errors.DUPLICATE_RESOURCE.title': 'Número de serie repetido',
  'errors.DUPLICATE_RESOURCE.body':
    'Ya existe un equipo registrado con ese número de serie. Cada equipo debe tener uno distinto.',
  'errors.INVALID_TIME_RANGE.title': 'Horario incoherente',
  'errors.INVALID_TIME_RANGE.body': 'La hora de inicio debe ser anterior a la de fin.',
  'errors.RESERVATION_TOO_LONG.title': 'Reserva demasiado larga',
  'errors.RESERVATION_TOO_LONG.body':
    'La reserva supera la duración máxima permitida. Acorta la franja o divídela en varias.',
  'errors.IDENTITY_REQUIRED.title': 'Falta identificarte',
  'errors.IDENTITY_REQUIRED.body':
    'Indica tu nombre y tu correo, o inicia sesión para que se tomen de tu cuenta.',
  'errors.VALIDATION.title': 'Revisa los datos',
  'errors.VALIDATION.body':
    'Algún campo no es válido. Comprueba las fechas y los campos obligatorios.',
  'errors.UNAUTHORIZED.title': 'Sesión expirada',
  'errors.UNAUTHORIZED.body': 'Vuelve a iniciar sesión para continuar.',
  'errors.FORBIDDEN.title': 'Sin permiso',
  'errors.FORBIDDEN.body': 'No puedes realizar esta acción con la cuenta actual.',
  'errors.NOT_FOUND.title': 'No encontrado',
  'errors.NOT_FOUND.body': 'El recurso solicitado ya no existe.',
  'errors.NETWORK.title': 'Sin conexión con la API',
  'errors.NETWORK.body': 'No se pudo contactar con el servidor en el puerto 8080.',
  'errors.SERVER.title': 'Error del servidor',
  'errors.SERVER.body': 'Algo falló en el servidor. Inténtalo de nuevo en unos instantes.',
  'errors.UNKNOWN.title': 'Se produjo un error',
  'errors.UNKNOWN.body': 'No se pudo completar la operación.',
  'errors.retry': 'Reintentar',
  'errors.dismiss': 'Cerrar aviso',

  // Modo demostracion
  'demo.badge': 'Modo demostración',
  'demo.title': 'Mostrando datos de demostración',
  'demo.body':
    'No se pudo conectar con la API en el puerto 8080, así que la interfaz funciona con datos de ejemplo en memoria. Arranca el backend y pulsa Reintentar.',
  'demo.retry': 'Reintentar conexión',

  // Genericos
  'common.close': 'Cerrar',
  'common.loading': 'Cargando…',
  'common.of': 'de',
  'common.to': 'a',
} as const