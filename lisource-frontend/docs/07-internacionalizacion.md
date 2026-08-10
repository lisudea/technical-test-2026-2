# Internacionalización

[Inicio](../../README.md) · [Arquitectura](02-arquitectura-frontend.md)

LISource usa `i18next`/`react-i18next` y catálogos JSON reales para español (`es`), inglés (`en`), francés (`fr`), portugués (`pt`), alemán (`de`) e italiano (`it`). `i18n/index.ts` inicializa recursos; `i18n/languages.ts` define opciones; `LanguageSelector` cambia la preferencia desde header/login.

`languages.test.ts` valida el catálogo de idiomas y `i18n-keys.test.ts` evita deriva de claves entre locales. Nuevos textos visibles deben agregarse primero con clave semántica y luego en los seis JSON; no se deben duplicar strings dentro de rutas. Fechas/números usan helpers de formato y locale cuando aplica.

La traducción puede expandir texto significativamente; por eso headers, botones, dropdowns, tablas/cards y email admiten wrap/min-width cero. Esta decisión fue parte de la auditoría responsive, no un parche exclusivo del español.
