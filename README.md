# Reto 4 — Migración de servicios entre redes del LIS

Informe de investigación: migración de una aplicación web del direccionamiento antiguo `192.168.x.x` al institucional `10.18.30.x`.

📄 **El informe completo está en [`reto4/informe-migracion.md`](reto4/informe-migracion.md)** — diagnóstico del entorno, propuesta de migración, plan de ejecución con rollback, checklist de validación, riesgos y referencias, con diagramas de red antes/después.

🔧 Acompañado de [`reto4/validar-migracion.sh`](reto4/validar-migracion.sh): script que automatiza los chequeos post-migración (conectividad, DNS, puertos, servicio web) y termina en éxito solo si todos pasan.
