# Reto 4 - Investigación: Migración de Servicios Web del LIS

*Nota: El contenido de este documento surge del análisis, la investigación y la base teórica adquirida en mi proceso academico y complementario. Es importante señalar que responde a un caso hipotético y que aún no he tenido la oportunidad de aplicar toda esta teoría a este nivel de profundidad en un contexto real. A pesar de esto, abordo esta propuesta como un desafío altamente motivador que me gustaría enfrentar para poner a prueba lo investigado, validar las metodologías y continuar mi desarrollo técnico.*

---

## 1. Introducción y Contexto

El LIS se encuentra en proceso de trasladar sus servicios que actualmente funcionan bajo el segmento de red privado local **`192.168.x.x`** hacia el direccionamiento institucional unificado en el rango **`10.18.30.x`**.

Migrar una aplicación web entre subredes no es simplemente modificar una dirección IP en la tarjeta de red del servidor. Este cambio impacta directamente el enrutamiento (*routing*), la resolución de nombres por dominio (*DNS*), las políticas de seguridad y filtrado (*firewall/ACLs*), los orígenes de las peticiones (*CORS*), la configuración del servidor web (*reverse proxy/SSL*) y la comunicación con dependencias clave como bases de datos o APIs internas.

El objetivo de esta investigación es estructurar una metodología **ordenada, segura y verificable** para llevar a cabo dicha migración. A lo largo del informe se expone un diagnóstico del entorno, los cambios técnicos necesarios, un plan de ejecución con estrategia de reversión (*rollback*), herramientas de validación por comandos y un análisis de riesgos críticos.

---

## 2. Diagnóstico del Entorno Actual

Antes de realizar cualquier modificación, es fundamental y recomendable construir un **inventario y mapa de dependencias** del estado actual del sistema. Esto garantiza que ningún componente quede desconfigurado tras el cambio de red.

### 2.1 Identificación de Parámetros de Red
Se debe diagnosticar la configuración de red en el servidor host donde opera la aplicación web mediante herramientas estándar de consola de Linux:

```bash
# 1. Verificar la IP actual, interfaz asociada y máscara de red
ip addr show

# 2. Consultar la tabla de enrutamiento y la puerta de enlace (Gateway) actual
ip route show

# 3. Consultar los servidores DNS configurados en el sistema
cat /etc/resolv.conf
# o en sistemas con systemd-resolved:
resolvectl status
```

### 2.2 Diagnóstico de Servicios y Sockets
Para conocer qué puertos están activos en el servidor (por ejemplo puerto 80 para HTTP, 443 para HTTPS, 3306/5432 para bases de datos):

```bash
# Listar puertos TCP y UDP en escucha con sus respectivos procesos
sudo ss -tulpn
```

### 2.3 Matriz Pre-Migración
A modo de resumen, el diagnóstico inicial se puede consolidar en la siguiente tabla:

| Elemento de Infraestructura | Estado / Red Actual | Parámetro a Diagnosticar |
| :--- | :--- | :--- |
| **Servidor de Aplicación Web** | Subred `192.168.x.x` | Interfaz principal, IP estática, Gateway por defecto |
| **Servidor DNS** | DNS local / Institucional | Registros de tipo A apuntando a la IP antigua |
| **Proxy Inverso / Servidor Web** | Nginx / Apache | Directivas `listen` vinculadas a la IP o `0.0.0.0` |
| **Base de Datos** | Servidor MySQL / PostgreSQL | Parámetro `bind-address` y permisos de usuario por IP |
| **Firewall del Host** | `ufw` / `firewalld` | Reglas de subredes permitidas (`192.168.x.x/24`) |
| **Aplicación / Backend** | Node.js, Python, PHP, etc. | Archivos `.env` y variables con IPs *hardcoded* |

### 2.4 Rastreo de Referencias a la Red Antigua (`192.168.x.x`)
Un paso importante es buscar dentro de la configuración del sistema y del código fuente cualquier IP del rango viejo que esté escrita directamente.

---

## 3. Propuesta de Migración

La reconfiguración del servicio requiere intervenir tanto la capa de infraestructura como la capa de aplicación.

```
       [ ANTES DE LA MIGRACIÓN ]                      [ DESPUÉS DE LA MIGRACIÓN ]

  Usuarios (Navegador / Cliente)                Usuarios (Navegador / Cliente)
               │                                             │
               ▼                                             ▼
      DNS: lis.udea.edu.co                          DNS: lis.udea.edu.co
   (Apuntaba a: 192.168.x.x)                     (Actualizado a: 10.18.30.x)
               │                                             │
               ▼                                             ▼
  ┌──────────────────────────┐                  ┌──────────────────────────┐
  │ Servidor Web LIS         │                  │ Servidor Web LIS         │
  │ IP: 192.168.X.X          │                  │ IP: 10.18.30.X           │
  └────────────┬─────────────┘                  └────────────┬─────────────┘
               │                                             │
               ▼                                             ▼
  ┌──────────────────────────┐                  ┌──────────────────────────┐
  │ Base de Datos / APIs     │                  │ Base de Datos / APIs     │
  │ Red anterior 192.168.x.x │                  │ Red institucional 10.18.x│
  └──────────────────────────┘                  └──────────────────────────┘
```

### 3.1 Reconfiguración de Red del Host
Se encuentra que en distribuciones modernas como Ubuntu Server, la red se gestiona mediante **Netplan**. Se actualiza el archivo en `/etc/netplan/` sustituyendo la subred `192.168.x.x` por la asignación en `10.18.30.x`


### 3.2 Estrategia DNS y Reducción del TTL (Time to Live)
Para evitar que los usuarios sigan intentando conectarse a la IP antigua debido a la memoria caché de DNS:
1. **24 a 48 horas antes de la migración:** Se reduce el TTL del registro DNS  (por ejemplo `lis.udea.edu.co`) a **300 segundos (5 minutos)**.
2. **Durante la ventana de cambio:** Se actualiza el registro para apuntar a la nueva IP `10.18.30.50`.
3. **Post-migración:** Tras confirmar la estabilidad del servicio, se restablece el TTL habitual (por ejemplo a 3600 o 86400 segundos).

### 3.3 Reglas de Seguridad y Firewall
Se deben actualizar los accesos para permitir tráfico hacia la nueva subred y desde clientes institucionales.

### 3.4 Proxy Inverso (Nginx/Apache) y Certificados SSL/TLS
* **Escucha de Sockets:** Verificar que Nginx o Apache no estén enlazados únicamente a la IP previa (`listen 192.168.x.x:80;`). Es recomendable usar `listen 80;` o `listen 10.18.30.50:80;`.
* **Certificados TLS:** Si los certificados están expedidos a nombre del dominio (por ejemplo `lis.udea.edu.co` mediante Let's Encrypt o la CA Institucional), **no requieren cambios**. Si el certificado estaba expedido explícitamente para la IP `192.168.x.x`, se debe regenerar para la nueva IP o migrarse formalmente a dominio.

### 3.5 Ajuste de CORS, Base de Datos y Variables de Entorno
* **CORS (*Cross-Origin Resource Sharing*):** Si la API restringía orígenes mediante cabeceras HTTP `Access-Control-Allow-Origin: http://192.168.x.x`, debe reconfigurarse para el nuevo origen.
* **Base de Datos (MySQL / PostgreSQL):**
  * Cambiar la directiva de escucha.
  * Actualizar la tabla de usuarios autorizados. En MySQL, un usuario configurado como `'usuario'@'192.168.1.%'` rechazará conexiones provenientes de `10.18.30.50`. Se debe actualizar a `'usuario'@'10.18.30.%'` o a la IP específica.
* **Variables de Entorno (`.env`):** Reemplazar cualquier referencia del tipo `DB_HOST=192.168.x.x` o `API_BASE_URL=http://192.168.x.x` por la nueva IP `10.18.30.x`.

### 3.6 Entorno de Contenedores (Docker)
Si la aplicación corre sobre Docker o Docker Compose, las redes virtuales tipo `bridge` por defecto usan segmentos `172.17.0.0/16` o `192.168.0.0/20`. Si existe conflicto con la red física, se configura el archivo `/etc/docker/daemon.json`

---

## 4. Plan de Ejecución y Procedimiento de Reversión (Rollback)

Para minimizar la interrupción del servicio, el proceso debe ejecutarse secuencialmente durante una ventana de mantenimiento programada.

### 4.1 Fases del Plan de Ejecución

1. **Fase 1: Preparación y Respaldos (Pre-Migración)**
   * Notificación a los usuarios y disminución del TTL del DNS a 300s.
   * Respaldo completo de la base de datos.
   * Copia de seguridad de los archivos de configuración (`/etc/netplan/`, `/etc/nginx/`, `/etc/hosts`, `.env`).
2. **Fase 2: Aplicación del Cambio de Red**
   * Ejecución de cambios de IP mediante Netplan.
   * Verificación inmediata de conectividad con la nueva puerta de enlace.
3. **Fase 3: Actualización de Configuraciones y Servicios**
   * Edición de archivos `.env`, reglas de firewall y accesos a bases de datos.
   * Reinicio de servicios web y proxy inverso.
4. **Fase 4: Actualización de DNS**
   * Modificación del registro en el servidor DNS institucional.

### 4.2 Criterio de Éxito
La migración se podría considerar exitosa únicamente si se cumplen los siguientes puntos:
* Conectividad IP bidireccional entre el servidor y el Gateway `10.18.30.1`.
* Resolución correcta del dominio `lis.udea.edu.co` hacia la nueva IP `10.18.30.50`.
* Respuesta de HTTP Status `200 OK` en el portal web y endpoints de la API.
* Conexión exitosa a la base de datos sin errores de autenticación o rechazo por origen IP.

### 4.3 Procedimiento de Reversión (*Rollback*)
Si ocurre un fallo crítico insuperable durante la ventana de mantenimiento:

1. **Reversión Automática con Netplan:**  
   Al aplicar cambios de red, se utiliza siempre el comando `sudo netplan try`. Este comando aplica la configuración y da **120 segundos** para confirmarla. Si se pierde la conexión SSH y no se presiona Enter, el sistema revierte automáticamente a la red `192.168.x.x`.
2. **Restauración Manual de Copias de Seguridad:**  
   Si el cambio ya fue aplicado permanentemente, hay que restaurar la configuración de la red previa por tanto hay que restaurar la configuración de Nginx
3. **Reversión en DNS:** Restaurar la IP `192.168.x.x` en el registro del servidor DNS.

---

## 5. Pruebas de Validación Posterior y Comandos de Diagnóstico

Una vez concluidos los cambios, se efectúa un protocolo de validación sistemático por capas utilizando la consola de comandos de Linux.

### 5.1 Capa de Red y Enrutamiento (Capa 3)
```bash
# Confirmar la nueva dirección asignada
ip addr show ens33

# Probar comunicación directa con la puerta de enlace
ping -c 4 10.18.30.1

# Rastrear la ruta hacia un servicio institucional para validar el enrutamiento
traceroute 10.18.1.10
```

### 5.2 Capa de Resolución de Nombres / DNS
```bash
# Consultar si el registro ya apunta a la nueva IP
dig lis.udea.edu.co +short

# Búsqueda alternativa con nslookup
nslookup lis.udea.edu.co
```

### 5.3 Capa de Transporte y Disponibilidad de Puertos (Capa 4)
```bash
# Verificar que el servidor web escucha localmente en la nueva IP
sudo ss -tulpn | grep ':80\|:443'

# Validar desde un cliente remoto que el puerto web está abierto y alcanzable
nc -zv 10.18.30.50 80
nc -zv 10.18.30.50 443

# Escaneo rápido de validación con nmap
nmap -p 80,443,3306 10.18.30.50
```

### 5.4 Capa de Aplicación y HTTP (Capa 7)
```bash
# Probar la respuesta del encabezado HTTP de la aplicación web
curl -I http://10.18.30.50

# Consumir un endpoint de la API y verificar
curl -v https://lis.udea.edu.co/api/
```

---

## 6. Riesgos y Puntos Críticos

Durante la migración de servicios entre subredes pueden presentarse diversos problemas técnicos. A continuación se analizan los principales riesgos y sus soluciones:

1. **Retención en Caché DNS (*DNS Caching*):**  
   * *Riesgo:* Los usuarios o servidores intermediarios siguen intentando acceder a `192.168.x.x` porque no ha expirado el TTL.  
   * *Mitigación:* Bajar el TTL previamente a 300 segundos y purgar las cachés locales.

2. **Direcciones IP "Cableadas" (*Hardcoded IPs*):**  
   * *Riesgo:* Existencia de scripts, configuraciones de frontend o llamadas a API que apuntan explícitamente a `192.168.x.x`.  
   * *Mitigación:* Realizar la búsqueda previa con `grep` y migrar todas las referencias (`lis.udea.edu.co`).

3. **Rechazo de Conexiones por la Base de Datos:**  
   * *Riesgo:* La base de datos rechaza las peticiones de la aplicación web porque sus tablas de permisos permiten acceso solo a la subred `192.168.x.x`.  
   * *Mitigación:* Actualizar las bases de datos antes de habilitar el tráfico de producción.

4. **Translapes de Red en Contenedores Docker:**  
   * *Riesgo:* Que la red por defecto de Docker entre en conflicto de ruteo con el nuevo bloque `10.18.30.x`.  
   * *Mitigación:* Reconfigurar las subredes por defecto de Docker mediante el archivo `daemon.json`.

---

## 7. Referencias

1. **Canonical Netplan:** [https://netplan.readthedocs.io/](https://netplan.readthedocs.io/)
2. **Debian Network Configuration Guide:** [https://wiki.debian.org/NetworkConfiguration](https://wiki.debian.org/NetworkConfiguration)
3. **Linux Kernel Organization:** *ip(8) - Linux manual page for IPv4/IPv6 routing and device management* [https://man7.org/linux/man-pages/man8/ip.8.html](https://man7.org/linux/man-pages/man8/ip.8.html)
4. **Nginx Documentation:** [https://docs.nginx.com/](https://docs.nginx.com/)
5. **PostgreSQL Global Development Group:** *The pg_hba.conf file and Client Authentication* [https://www.postgresql.org/docs/current/auth-pg-hba-conf.html](https://www.postgresql.org/docs/current/auth-pg-hba-conf.html)
6. **Docker Documentation:** [https://docs.docker.com/network/drivers/bridge/](https://docs.docker.com/network/drivers/bridge/)
7. **MDN Web Docs:** *Cross-Origin Resource Sharing (CORS)* [https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
8. **IP Addressing (IPv4):** [IPCisco — IP Addressing (IPv4)](https://ipcisco.com/lesson/ip-addressing-ipv4/)
9. **IPv4 Network Administration:** [Oracle Documentation — IPv4 Network Administration](https://docs.oracle.com/cd/E19957-01/820-2981/ewpop/index.html)
10. **¿Qué es CIDR?:** [AWS — ¿Qué es CIDR?](https://aws.amazon.com/es/what-is/cidr/)
11. **Tabla cidrInfo:** [IBM Documentation — Tabla cidrInfo](https://www.ibm.com/docs/es/networkmanager/4.2.0?topic=tables-cidrinfo)
12. **What is CIDR?:** [IPXO Blog — What is CIDR?](https://www.ipxo.com/blog/what-is-cidr/)
13. **Introducción a las interfaces de Linux para redes virtuales:** [Red Hat Developer — Introducción a las interfaces de Linux para redes virtuales](https://developers-redhat-com.translate.goog/articles/2026/04/03/introduction-to-linux-interfaces-for-virtual-networking?_x_tr_sl=en&_x_tr_tl=es&_x_tr_hl=es&_x_tr_pto=tc#bridge)
14. **Configuración de interfaces de red en Linux:** [freeCodeCamp — Configuración de interfaces de red en Linux](https://www-freecodecamp-org.translate.goog/news/configure-network-interfaces-in-linux/?_x_tr_sl=en&_x_tr_tl=es&_x_tr_hl=es&_x_tr_pto=tc)
---

