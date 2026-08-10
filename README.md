# Reto 4 — Migración de servicios entre redes del LIS

Informe de investigación sobre la migración de una aplicación web del Laboratorio Integrado de Sistemas desde el direccionamiento privado antiguo (`192.168.x.x`) al nuevo esquema institucional (`10.18.30.x`).

📄 **Informe completo:** [`reto4/informe-migracion.pdf`](reto4/informe-migracion.pdf)

El escenario es hipotético (como pide el enunciado), pero se apoya en el entorno real del laboratorio observado a través de la VPN institucional. El informe cubre las seis secciones exigidas: diagnóstico del entorno actual, propuesta de migración (direccionamiento, rutas, DNS, firewall, NAT, reverse proxy, certificados, CORS, variables de entorno, bases de datos y contenedores), plan de ejecución y reversión, validación posterior, riesgos y puntos críticos, y referencias. Incluye además un diagrama de red antes/después.

🔧 **Script de validación:** [`reto4/validar-migracion.sh`](reto4/validar-migracion.sh) — automatiza los chequeos posteriores a la migración (conectividad, DNS, puertos y acceso al servicio) y termina con éxito solo si todos pasan.
