# Reto 4: Investigación (Bonus)
## Migración de servicios entre redes del LIS

**Miguel Andrés Mejía Cuadrado**

Agosto de 2026

---

### 0. Alcance y punto de partida

Antes de entrar en la propuesta, quiero ser claro sobre el enfoque de este documento: es una investigación teórica y metodológica, no la documentación de una migración que haya ejecutado. No tengo acceso a la infraestructura real del LIS ni credenciales de administración, así que no voy a inventar valores de IP, gateway o reglas de firewall como si los hubiera verificado — eso sería peor que admitir que no los tengo. En su lugar, planteo una metodología reproducible: qué comandos correría, qué buscaría en cada capa y cómo tomaría decisiones si estuviera frente al caso real.

Dicho esto, tampoco parto de cero. Este semestre estoy cursando Comunicaciones y Laboratorio, una materia que está justo en la intersección de este reto: entender los conceptos de red a nivel teórico y, en paralelo, llevarlos a la práctica en laboratorio. Es la primera vez que estoy construyendo esa base de forma estructurada, y este informe es en buena parte un ejercicio de aplicar lo que voy aprendiendo ahí a un caso concreto y con implicaciones reales de arquitectura de software (que es donde sí me muevo con más soltura). Por eso el documento combina dos cosas: fundamentos de red que estoy consolidando ahora, y decisiones de arquitectura de aplicaciones (Spring Boot, Docker, variables de entorno, bases de datos) donde ya tengo experiencia directa por proyectos anteriores del programa.

Para no partir de un ejemplo inventado, uso dos fuentes reales como referencia:

**1. Datos verificados en el Reto 1 de esta misma prueba.** Me conecté por SSH a la máquina `10.18.29.37` desde la VPN del laboratorio, y un ping hacia `10.18.30.254` confirmó que ese rango ya está operativo y es alcanzable.

**2. La guía de instalación y configuración de OpenVPN + Stunnel**, que incluye una tabla de direccionamiento de red:

| Descripción | Dirección de red |
|---|---|
| Red VPN | `10.0.8.0/24` |
| Red Telemática | `192.168.30.0/24` |
| Red LIS Sala 1 | `192.168.192.0/24` |
| Red LIS Sala 2 y 3 | `192.168.193.0/24` |
| Red LIS Sala 4 | `192.168.194.0/24` |
| Red Ingeniería | `172.21.0.0/16` |

Esta tabla es útil, pero hay que leerla con cuidado. Primero, confirma que el `192.168.x.x` mencionado en el enunciado no es una suposición mía: las salas del LIS efectivamente están (o estaban documentadas) en ese rango. Segundo, noto algo que me parece relevante para el propio reto: la VPN documentada aquí es `10.0.8.0/24`, distinta de `10.18.30.x` (el nuevo direccionamiento institucional) y también distinta del rango `10.18.29.x` desde el que me conecté en el Reto 1. Esto sugiere que este documento probablemente no está actualizado con el esquema de direccionamiento más reciente de la universidad. Lejos de ser un problema, esto es en sí mismo un argumento a favor del reto: es exactamente el tipo de "desfase" que ocurre cuando una migración de red es paulatina, que podría agravarse si es que dicho proceso no se acompaña de una actualización de la documentación, y por eso lo incluyo también como punto de atención en la sección de riesgos.

El resto de datos que no puedo confirmar con estas dos fuentes (máscara exacta del servidor real a migrar, gateway real, reglas vigentes de firewall, nombres DNS internos del LIS) los trataré como desconocidos y sujetos a verificación en el entorno autorizado, como pide el enunciado.

Para darle un caso concreto a la propuesta, asumiré una aplicación web típica de gestión de inventario/reservas de equipos (backend REST en Spring Boot, base de datos PostgreSQL, un reverse proxy delante del backend), operando sobre la **Red LIS Sala 1 (`192.168.192.0/24`)** como origen — una arquitectura que sí conozco bien por trabajo previo, y un rango real y documentado del laboratorio, evitando algo completamente genérico.

## 1. Diagnóstico del entorno actual

Antes de tocar cualquier configuración, lo primero es construir un inventario completo de todo lo que depende de la red `192.168.192.0/24` (Sala 1) actual. La idea no es solo confirmar la IP del servidor, sino entender qué otras piezas (DNS, firewall, otros servicios) asumen esa dirección como algo fijo. Si no se hace este paso con calma, es muy fácil migrar el servidor y dejar dos o tres dependencias "invisibles" apuntando a la red vieja.

Dividamos el diagnóstico en cuatro frentes: red del servidor, resolución de nombres, puertos/servicios activos, y dependencias de la aplicación.

### 1.1 Direccionamiento, máscara, gateway y rutas

| Qué se revisa | Comando | Qué se busca |
|---|---|---|
| IP actual y máscara/prefijo de la interfaz | `ip addr` | Confirmar la IP en uso (ej. `192.168.192.50/24`, dentro del rango documentado de la Sala 1) y que la interfaz esté `UP`. La notación `/24` indica cuántos bits pertenecen a la red. |
| Ruta por defecto y rutas específicas | `ip route` | Ver por dónde sale el tráfico que no es local (`default via <gateway> dev <interfaz>`) y si hay rutas estáticas que asuman `192.168.192.0/24`. |
| Alcance del gateway | `ping -c 4 <gateway>` | Confirmar que el gateway responde y que efectivamente pertenece a la misma subred que el servidor (no puede ser una IP de `192.168.193.0/24` ni de ningún otro rango de la tabla). |
| Conectividad hacia la red nueva (para comparar) | `ping -c 4 10.18.30.254` | Esto ya lo verifiqué en el Reto 1 desde `10.18.29.37`: el rango `10.18.30.x` responde desde la VPN del laboratorio, lo cual es un buen punto de partida para saber que la red destino está activa. |

### 1.2 Resolución de nombres (DNS)

Si la aplicación se accede por un nombre (por ejemplo `reservalis.udea.edu.co`) en lugar de la IP directa, hay que saber a dónde apunta ese nombre *antes* de mover nada.

| Qué se revisa | Comando | Qué se busca |
|---|---|---|
| Registro DNS actual del servicio | `dig reservalis.udea.edu.co` o `nslookup reservalis.udea.edu.co` | Confirmar la IP que devuelve hoy (debería caer dentro de `192.168.192.0/24` si el servicio depende de la Sala 1). |
| TTL del registro | Se ve en la misma salida de `dig` (campo TTL) | Un TTL alto significa que, al cambiar el registro, los clientes tardarán más en enterarse del cambio. Es información clave para planear la ventana de migración. |
| DNS interno vs. DNS público | Consultar con el equipo del LIS o revisar configuración del servidor DNS institucional | Saber si la resolución depende de un servidor DNS interno de la universidad o de un proveedor externo. |

### 1.3 Puertos y servicios en escucha

| Qué se revisa | Comando | Qué se busca |
|---|---|---|
| Servicios activos y en qué interfaz escuchan | `ss -tulpn` | Diferenciar servicios en `0.0.0.0:<puerto>` (aceptan conexiones externas, sujeto a firewall) de los que están solo en `127.0.0.1:<puerto>` (únicamente locales). |
| Accesibilidad real del puerto desde otra máquina | `nc -vz <ip> <puerto>` o `curl -I http://<ip>:<puerto>` | Confirmar que el puerto no solo está "abierto" en el servidor, sino que realmente se puede alcanzar desde afuera (descarta bloqueos de firewall). |
| Trayecto de red hacia el servidor | `traceroute <ip>` | Útil si hay sospecha de que el tráfico se está enrutando por un camino inesperado, sobre todo al comparar antes/después de la migración. |

### 1.4 Dependencias que aún referencian `192.168.192.x`

Esta parte es más de revisión manual que de comandos de red, pero es donde suelen esconderse los problemas reales. Para el tipo de arquitectura que estoy asumiendo (backend Spring Boot + PostgreSQL + Nginx + Docker), los lugares típicos donde una IP antigua puede quedar "hardcodeada" son:

- **Variables de entorno / `application.properties` o `application.yml`**: campos como `DB_HOST`, `spring.datasource.url`, o URLs de servicios externos (ej. integración con otra API del LIS).
- **`docker-compose.yml`**: IPs fijas en lugar de nombres de servicio, o redes de Docker configuradas con rangos que colisionen con el nuevo esquema (o incluso con otras redes de la propia tabla, como `192.168.193.0/24` o `192.168.194.0/24`).
- **Configuración de Nginx** (`/etc/nginx/sites-available/*` o el `.conf` montado en el contenedor): directivas `proxy_pass` apuntando a una IP en vez de un hostname.
- **CORS / orígenes permitidos** en el backend: si el `allowedOrigins` incluye una IP literal del frontend antiguo.
- **Certificados TLS**: si el certificado está emitido para una IP en vez de un nombre de dominio (poco común, pero, al parecer, posible en entornos internos como es el caso).
- **Scripts de despliegue o `.sh` de arranque**: cualquier script que use `curl`, `scp` o `ssh` contra una IP fija.

> Para hacer esta búsqueda de forma sistemática en el entorno autorizado, un grep simple ayudaría bastante: `grep -r "192.168" /ruta/del/proyecto --include="*.yml" --include="*.properties" --include="*.env" --include="*.conf"`.

### Matriz resumen de diagnóstico

| Componente | ¿Depende de `192.168.192.x`? | Cómo se verifica |
|---|---|---|
| Interfaz de red del servidor | Sí (IP/máscara/gateway) | `ip addr`, `ip route` |
| DNS del servicio | Posiblemente (según el tipo de entrada) | `dig` / `nslookup` |
| Firewall / reglas de acceso | Posiblemente (origen permitido) | Revisión de reglas (`ufw status` o equivalente) |
| Reverse proxy (Nginx) | Posiblemente (`proxy_pass`) | Revisión de archivo de configuración |
| Backend (Spring Boot) | Posiblemente (`.env`, `application.yml`) | Revisión de configuración + variables de entorno |
| Base de datos (PostgreSQL) | Posiblemente (host de conexión) | Revisión de cadena de conexión |
| Contenedores Docker | Posiblemente (`docker-compose.yml`) | Revisión de definición de red y variables |
| Frontend | Posiblemente (URL de API, CORS) | Revisión de configuración de build/entorno |
