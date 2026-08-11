# Reto 4 — Migración de servicios entre redes del LIS

**Isaac Mesa Gómez** — C.C. 1007239188
Rama: `1007239188-reto4`

Propuesta técnica de migración de una aplicación web del Laboratorio Integrado de Sistemas
desde el direccionamiento legado `192.168.30.0/24` (Red Telemática) hacia el esquema
institucional `10.18.30.0/24`.

📄 **[Informe completo →](informe-migracion-red-lis.md)**

---

## Contenido

| Archivo | Descripción |
|---|---|
| [`informe-migracion-red-lis.md`](informe-migracion-red-lis.md) | Informe completo: diagnóstico, propuesta, plan de ejecución, validación, riesgos y referencias |
| [`img/`](img/) | Diagramas de red exportados |
| [`scripts/diagnostico-red.sh`](scripts/diagnostico-red.sh) | Script de snapshot del estado de red (antes/después del corte) |

---

## Resumen

La migración **ya está en curso** y el informe la documenta con tres fuentes de evidencia
independientes:

1. **Documental** — guía oficial de acceso VPN del LIS, con la tabla de direccionamiento
   legado y señales de deriva por renumeraciones anteriores.
2. **Forense** — historial de comandos del servidor, que registra el servicio web operando
   sucesivamente en `192.168.30.38` y `192.168.30.125`, siempre accedido por IP y nunca por
   nombre.
3. **Operativa** — el mismo servidor diagnosticado en vivo, hoy en `10.18.29.37/24`.

**Riesgos de mayor impacto:**

| Riesgo | Por qué importa |
|---|---|
| Rutas de la VPN sin actualizar | Los usuarios remotos pierden el servicio aunque el servidor funcione. **No se detecta desde el servidor** |
| Acceso por IP literal | Todo enlace previo apunta a `192.168.30.125`; se rompe al renumerar |
| Dependencia hacia `172.19.0.4` | Ruta inyectada por DHCP, no documentada; puede desaparecer en silencio |
| Concesiones de BD por host | `'app'@'192.168.30.%'` deja de aplicar: *access denied* con la red sana |

---

## Topología de red

### Antes — Red Telemática `192.168.30.0/24`

<p align="center">
  <img src="img/red-antes.png" alt="Topología de red antes de la migración" width="820">
</p>

### Después — `10.18.30.0/24`

<p align="center">
  <img src="img/red-despues.png" alt="Topología de red después de la migración" width="820">
</p>

Los diagramas también están en formato Mermaid dentro del
[informe](informe-migracion-red-lis.md#anexo-a--diagrama-de-red-antes--después), donde
GitHub los renderiza de forma nativa.

---

## Uso del script de diagnóstico

```bash
chmod +x scripts/diagnostico-red.sh
sudo ./scripts/diagnostico-red.sh > snapshot-antes-$(date +%F-%H%M).txt

# ... ejecutar la migración ...

sudo ./scripts/diagnostico-red.sh > snapshot-despues-$(date +%F-%H%M).txt
diff snapshot-antes-*.txt snapshot-despues-*.txt
```

---

## Nota sobre datos personales

Durante el diagnóstico se hallaron nombres completos y números de documento de terceros en
el historial de comandos y en las rutas del servidor web. **Este repositorio no los
reproduce**: aparecen redactados en el informe (§0.5), donde además se documentan como
hallazgo de seguridad independiente de la migración.
