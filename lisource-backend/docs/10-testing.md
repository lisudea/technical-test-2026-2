# Testing

[Inicio](../../README.md) · [Reservas](06-reservas-y-concurrencia.md) · [DevSecOps](11-devsecops.md)

```powershell
.\mvnw.cmd -B clean verify
```

En Linux: `./mvnw -B clean verify`. La suite incluye unitarias de servicios/políticas/JWT, integración PostgreSQL con Testcontainers, concurrencia real de reservas, contratos HTTP/RBAC, ArchUnit y reporte JaCoCo. Entre los casos críticos están: intervalos adyacentes aceptados, overlap rechazado, dos solicitudes concurrentes con exactamente un éxito, rollback multi-equipo, canceladas que no bloquean y Top 5 sin canceladas.

El pipeline publica `lisource-backend-test-reports` y la imagen como `lisource-backend-image`. JaCoCo produce métricas durante la ejecución, pero esta documentación no inventa un porcentaje: consulte el reporte generado en `target/site/jacoco/index.html` o el artefacto del run concreto.

No cubre por sí solo UX del navegador, entrega real de correo, disponibilidad de proveedores externos ni carga prolongada. Google se prueba con dobles/control de verificación; una validación E2E interactiva necesita client ID y cuenta institucional autorizada.
