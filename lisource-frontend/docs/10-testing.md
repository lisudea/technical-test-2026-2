# Testing frontend

[Inicio](../../README.md) · [Responsive](03-responsive-y-accesibilidad.md) · [DevSecOps](11-devsecops.md)

```bash
npm ci
npm test
npm run lint
npm run build
```

Vitest/Testing Library cubre branding, idiomas/paridad de claves, selector, parsing de errores, login/perfil/logout/sesiones y reglas de seguridad. ESLint/Prettier verifican calidad/formato; TypeScript y Vite validan producción durante build.

La auditoría responsive complementó la suite con 110 combinaciones de rutas/viewport más interacciones críticas y revisión de PNG. No es una suite E2E versionada ni una certificación WCAG. Tampoco se declara porcentaje de coverage porque no hay reporte público verificado. Integración real Google, correo, cold start y backend desplegado requieren pruebas manuales/smoke.

No se cambiaron tests para ocultar defectos. La opción `endOfLine: auto` hace que Prettier sea portable entre CRLF de Windows y LF de CI sin alterar reglas semánticas.
