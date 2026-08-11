import type { Dictionary } from './types'

/**
 * English dictionary.
 *
 * Typed as `Dictionary`, i.e. `Record<TranslationKey, string>`: TypeScript
 * refuses to compile if a single key from the Spanish dictionary is missing.
 * Adding a new language is just copying this file and registering it in
 * I18nProvider.
 */
export const en: Dictionary = {
  // Application
  'app.title': 'LIS Resources Dashboard',
  'app.subtitle': 'Integrated Systems Laboratory · University of Antioquia',
  'app.shortTitle': 'LIS Resources',

  // Navigation
  'nav.dashboard': 'Dashboard',
  'nav.reservations': 'Reservations',
  'nav.equipment': 'Equipment',
  'nav.statistics': 'Statistics',
  'nav.menu': 'Main menu',

  // Language
  'language.label': 'Language',
  'language.es': 'Spanish',
  'language.en': 'English',
  'language.switchTo': 'Switch to {language}',

  // Session
  'auth.login': 'Sign in with Google',
  'auth.loginShort': 'Sign in',
  'auth.logout': 'Sign out',
  'auth.institutionalOnly': '@udea.edu.co accounts only',
  'auth.loggingIn': 'Validating your session…',
  'auth.callbackError': 'No token was received. Please sign in again.',
  'auth.welcome': 'Signed in as {name}',
  'auth.sessionExpired': 'Your session expired. Please sign in again.',

  // Equipment status
  'status.AVAILABLE': 'Available',
  'status.RESERVED': 'Reserved',
  'status.MAINTENANCE': 'Under maintenance',

  // Categories
  'category.MICROCONTROLLERS': 'Microcontrollers',
  'category.VR': 'Virtual reality',
  'category.NETWORKS': 'Networking',

  // Reservation status
  'reservationStatus.ACTIVE': 'Active',
  'reservationStatus.CANCELLED': 'Cancelled',

  // Indicators
  'stats.total': 'Registered equipment',
  'stats.available': 'Available',
  'stats.reserved': 'Reserved',
  'stats.maintenance': 'Under maintenance',

  // Filters
  'filters.title': 'Filters',
  'filters.search': 'Search',
  'filters.searchPlaceholder': 'Name or serial number…',
  'filters.category': 'Category',
  'filters.status': 'Status',
  'filters.all': 'All',
  'filters.allStatuses': 'All',
  'filters.clear': 'Clear filters',
  'filters.results': '{shown} of {total} items',
  'filters.searchHint': 'Text search applies to the current page.',

  // Dashboard
  'dashboard.title': 'Laboratory equipment',
  'dashboard.empty.title': 'No equipment matches',
  'dashboard.empty.body': 'Try changing or clearing the filters.',
  'dashboard.loading': 'Loading equipment…',

  // Equipment card
  'equipment.serial': 'Serial',
  'equipment.reserve': 'Reserve',
  'equipment.cannotReserve': 'This item is under maintenance and cannot be reserved',
  'equipment.edit': 'Edit',
  'equipment.createdAt': 'Registered on {date}',

  // Pagination
  'pagination.previous': 'Previous',
  'pagination.next': 'Next',
  'pagination.info': 'Page {current} of {total}',
  'pagination.pageSize': 'Per page',

  // Reservation modal
  'reserve.title': 'Reserve {equipment}',
  'reserve.occupied': 'Time slots already taken',
  'reserve.noOccupied': 'This item has no active reservations.',
  'reserve.start': 'Start',
  'reserve.end': 'End',
  'reserve.name': 'Your name',
  'reserve.email': 'Your email',
  'reserve.namePlaceholder': 'First and last name',
  'reserve.emailPlaceholder': 'user@udea.edu.co',
  'reserve.identityHint':
    "You're not signed in, so please identify yourself with your name and email to reserve.",
  'reserve.identityFromSession': 'You will reserve as {name} ({email}).',
  'reserve.submit': 'Confirm reservation',
  'reserve.submitting': 'Reserving…',
  'reserve.cancel': 'Cancel',
  'reserve.success': 'Reservation created successfully',
  'reserve.invalidRange': 'The start time must be before the end time.',
  'reserve.pastDate': 'The reservation must start in the future.',
  'reserve.missingIdentity': 'Please enter your name and email.',
  'reserve.tip':
    'Tip: two reservations that merely touch (10:00–11:00 and 11:00–12:00) do not clash; to trigger a conflict they must overlap.',

  // Reservations
  'reservations.title': 'Reservations',
  'reservations.subtitle': 'Every reservation recorded in the laboratory',
  'reservations.equipment': 'Equipment',
  'reservations.user': 'User',
  'reservations.slot': 'Time slot',
  'reservations.status': 'Status',
  'reservations.actions': 'Actions',
  'reservations.cancel': 'Cancel',
  'reservations.cancelling': 'Cancelling…',
  'reservations.cancelled': 'Reservation cancelled',
  'reservations.confirmCancel': 'Are you sure you want to cancel this reservation?',
  'reservations.empty.title': 'No reservations yet',
  'reservations.empty.body': 'Reserve an item from the dashboard to see it here.',
  'reservations.loading': 'Loading reservations…',
  'reservations.onlyOwn': 'You can only cancel reservations created with your own email.',

  // Equipment management
  'admin.title': 'Equipment management',
  'admin.subtitle': 'Register new equipment or update existing items',
  'admin.new': 'Register equipment',
  'admin.editing': 'Editing: {name}',
  'admin.name': 'Name',
  'admin.namePlaceholder': 'Arduino Uno R3',
  'admin.serial': 'Serial number or MAC',
  'admin.serialPlaceholder': 'MCU-ARD-0001',
  'admin.category': 'Category',
  'admin.status': 'Status',
  'admin.save': 'Save',
  'admin.saving': 'Saving…',
  'admin.cancelEdit': 'Cancel editing',
  'admin.created': 'Equipment registered successfully',
  'admin.updated': 'Equipment updated successfully',
  'admin.requiredName': 'Name is required.',
  'admin.requiredSerial': 'Serial number is required.',
  'admin.listTitle': 'Registered equipment',
  'admin.loginRequired.title': 'Sign in to manage the inventory',
  'admin.loginRequired.body':
    'Browsing and reserving equipment is open to everyone, but adding or editing the catalogue requires an @udea.edu.co institutional account.',

  // Statistics
  'statistics.title': 'Most requested equipment',
  'statistics.subtitle': 'All-time top 5, including cancelled reservations',
  'statistics.reservations': '{count} reservations',
  'statistics.reservation': '{count} reservation',
  'statistics.empty.title': 'No data yet',
  'statistics.empty.body': 'Once there are reservations they will show up here.',
  'statistics.loading': 'Loading statistics…',

  // Errors (requirement 6)
  'errors.CONFLICT.title': 'Time slot already booked',
  'errors.CONFLICT.body':
    'That item already has a reservation overlapping the chosen time. Please pick another slot.',
  'errors.EQUIPMENT_IN_MAINTENANCE.title': 'Item under maintenance',
  'errors.EQUIPMENT_IN_MAINTENANCE.body':
    'This item is out of service and cannot be reserved until it becomes available again.',
  'errors.DUPLICATE_RESOURCE.title': 'Duplicate serial number',
  'errors.DUPLICATE_RESOURCE.body':
    'An item with that serial number already exists. Each item must have a unique one.',
  'errors.INVALID_TIME_RANGE.title': 'Inconsistent time range',
  'errors.INVALID_TIME_RANGE.body': 'The start time must be before the end time.',
  'errors.RESERVATION_TOO_LONG.title': 'Reservation too long',
  'errors.RESERVATION_TOO_LONG.body':
    'The reservation exceeds the maximum allowed duration. Shorten it or split it into several.',
  'errors.IDENTITY_REQUIRED.title': 'Identification required',
  'errors.IDENTITY_REQUIRED.body':
    'Enter your name and email, or sign in so they are taken from your account.',
  'errors.VALIDATION.title': 'Check your input',
  'errors.VALIDATION.body': 'Some field is invalid. Check the dates and the required fields.',
  'errors.UNAUTHORIZED.title': 'Session expired',
  'errors.UNAUTHORIZED.body': 'Please sign in again to continue.',
  'errors.FORBIDDEN.title': 'Not allowed',
  'errors.FORBIDDEN.body': 'You cannot perform this action with the current account.',
  'errors.NOT_FOUND.title': 'Not found',
  'errors.NOT_FOUND.body': 'The requested resource no longer exists.',
  'errors.NETWORK.title': 'No connection to the API',
  'errors.NETWORK.body': 'Could not reach the server on port 8080.',
  'errors.SERVER.title': 'Server error',
  'errors.SERVER.body': 'Something went wrong on the server. Please try again shortly.',
  'errors.UNKNOWN.title': 'Something went wrong',
  'errors.UNKNOWN.body': 'The operation could not be completed.',
  'errors.retry': 'Retry',
  'errors.dismiss': 'Dismiss',

  // Demo mode
  'demo.badge': 'Demo mode',
  'demo.title': 'Showing demo data',
  'demo.body':
    'The API on port 8080 could not be reached, so the interface is running on in-memory sample data. Start the backend and press Retry.',
  'demo.retry': 'Retry connection',

  // Generic
  'common.close': 'Close',
  'common.loading': 'Loading…',
  'common.of': 'of',
  'common.to': 'to',
}