# Reto 4 (Bonus): Migración de servicios entre redes del LIS
## Propuesta técnica para migrar una aplicación web de `192.168.x.x` a `10.18.30.x`

---
## Resumen 

Este documento propone una metodología para migrar una aplicación web del LIS que actualmente opera sobre el direccionamiento antiguo `192.168.x.x` hacia el nuevo esquema institucional `10.18.30.x`. Es importante tener en cuenta que una migración de IP no es tan simple como suena, toca aspectos como el direccionamiento, rutas, DNS, Firewalls, variables de entorno, conexiones a bases de datos, red de contenedores, etc. Por esta razón, para tratar de abarcar de forma completa lo que este proceso conlleva, la prpuesta se organizara en cuatro fases: diagnostico, cambio, validación y rerversión. Este flujo nos permite documentar el estado base, el criterio de éxito y el plan de reversión antes de tocar producción.

---

## 1. Diagnóstico del entorno actual

Antes de cambiar nada hay que tener un inventario completo y verificado del estado actual. Este inventario es también la base del rollback: si no se sabe con certeza cómo estaba configurado el servidor, no se puede volver a ese estado.

### 1.1 Parámetros a levantar

| Categoría | Qué se debe registrar |
|---|---|
| Direccionamiento | IP actual, máscara/CIDR, tipo de asignación (estática o DHCP) |
| Gateway | Puerta de enlace predeterminada y su alcance |
| Rutas | Tabla de rutas completa, rutas estáticas adicionales |
| DNS | Servidores DNS configurados, registros A/CNAME que apuntan al servicio, TTL vigente |
| Puertos | Puertos en escucha, proceso/contenedor que los usa |
| Firewall/ACL | Reglas que permiten o restringen tráfico hacia/desde `192.168.x.x` |
| Dependencias | Otros servicios (BD, APIs internas, colas, servicios de autenticación) referenciados por IP fija |
| Certificados | Dominio/IP al que está emitido el certificado TLS vigente |
| Contenedores | Redes Docker/Compose, IPs internas, variables de entorno con IPs embebidas |
| Código fuente | Cadenas `192.168.` hardcodeadas en configuración o código |


### 1.2 Ejemplo de inventario (escenario ilustrativo)

| Parámetro | Valor actual (192.168.x.x) | Valor propuesto (10.18.30.x) |
|---|---|---|
| IP del servidor | `192.168.10.50/24` | `10.18.30.50/24` (a confirmar con el administrador de red) |
| Gateway | `192.168.10.1` | `10.18.30.1` |
| DNS internos | `192.168.10.5`, `192.168.10.6` | DNS institucionales UdeA  |
| Nombre del servicio | `servicio-lis.udea.edu.co` → A record apunta a `192.168.10.50` | Mismo nombre, A record actualizado a `10.18.30.50` |
| Puertos expuestos | `80/tcp`, `443/tcp` (Nginx), `5432/tcp` (Postgres, solo interno) | Mismos puertos, revisando ACL del nuevo segmento |
| Dependencias | API interna en `192.168.10.20:8080`, BD en `192.168.10.20:5432` | Deben migrar o quedar alcanzables por ruta/VLAN |

### 1.3 Dependencias que aún referencian la red anterior

Se debe hacer una búsqueda explícita de la cadena `192.168.` en todo el árbol del proyecto y en la configuración del sistema, esto suele revelar los puntos de falla más comunes: IPs quemadas en `.env`, en cadenas de conexión de base de datos, en `docker-compose.yml`, en listas blancas de CORS, o en `/etc/hosts`.

---

## 2. Propuesta de migración

### 2.1 Direccionamiento y subred

Tanto `192.168.x.x` como `10.18.30.x` son direcciones "privadas" (de uso interno), así que este cambio no es pasar de "privado a público" ni nada por el estilo, lo que se requiere es simplemente mudar el servidor de un rango interno a otro, ambos administrados por la universidad. Aun así, mover un servidor de una red a otra implica cambiarle la IP, actualizar el DNS y avisar a cualquier otro sistema que lo esté buscando por su IP anterior. Ese es justamente el riesgo principal de esta migración.

¿Cuales serían las acciones a tomar?:
- Pedirle al administrador de la red del LIS que asigne formalmente una IP dentro de `10.18.30.x` (fija o reservada por DHCP), junto con la máscara de subred, la puerta de enlace (gateway) y la VLAN correspondiente.
- Anotar bien la máscara exacta (por ejemplo /24 o /27). Una máscara mal puesta es una de las causas más comunes de que "el servidor esté encendido pero nadie pueda conectarse a él".

### 2.2 Rutas

- Revisar si el servidor necesita una ruta adicional para poder seguir comunicándose temporalmente con servicios que se queden en `192.168.x.x` mientras dura la transición.
- Confirmar cuál es la nueva puerta de enlace y dejar esa configuración guardada de forma permanente, para que no se pierda si el servidor se reinicia.

### 2.3 DNS

- Antes de hacer el cambio, bajar el "tiempo de vida" (TTL) del registro DNS del servicio. Esto le dice a los demás computadores que no guarden la IP en memoria por mucho tiempo. Si se baja el TTL justo en el momento del cambio, no sirve de nada ya que la IP vieja ya quedó guardada por horas o días con el TTL anterior, así que hay que hacerlo con anticipación.
- Actualizar el registro DNS para que apunte a la nueva IP 10.18.30.50.
- Si algún servicio interno busca el nombre del servidor a través de un archivo local (/etc/hosts) en lugar de usar el DNS normal, hay que corregir eso a mano, porque es una causa muy común de fallas difíciles de detectar.
- Una vez que todo esté funcionando bien, volver a subir el TTL a un valor normal (por ejemplo, 1 hora).

### 2.4 Firewall / ACL

- No dar por hecho que las reglas de seguridad que permitían el tráfico hacia el servidor se van a "heredar" automáticamente en la red nueva. Hay que volver a crearlas para 10.18.30.x. Esto incluye qué puertos se permiten (por ejemplo 80, 443, 22, y el puerto de la base de datos solo desde la red de la aplicación), bloquear todo lo demás por defecto, y permitir que las respuestas a conexiones ya establecidas puedan volver.
- Revisar tanto el firewall del propio servidor como cualquier otro filtro de seguridad (switch, VLAN, firewall de borde) que pueda estar limitando el nuevo segmento de red.

### 2.5 NAT

- Si el servicio viejo se exponía al público a través de una regla de NAT desde 192.168.x.x, esa regla hay que volverla a crear apuntando a la nueva IP 10.18.30.50. Cambiar la IP del servidor no es suficiente puesto que la regla de redirección en el borde de la red sigue apuntando a la IP vieja hasta que se actualice a mano.

### 2.6 Reverse proxy

- Si hay un Nginx o Apache delante de la aplicación, hay que actualizar la configuración para que apunte a la nueva IP, o mejor aún, al nombre de dominio del servicio (así se evita depender de una IP fija).
- Antes de aplicar los cambios, probar que la configuración esté bien escrita, y preferir "recargar" el servicio en lugar de "reiniciarlo" para cortar el servicio el menor tiempo posible.

### 2.7 Certificados TLS

- Si el certificado fue emitido para un nombre de dominio y no para una IP, cambiar la IP no invalida el certificado. Solo hay que asegurarse de que el proceso de renovación automática siga pudiendo verificar el dominio una vez el servidor esté en su nueva ubicación.
- Si el certificado se hubiera emitido directamente sobre la IP vieja, habría que volver a emitirlo para la nueva IP, o mejor, migrar a un nombre de dominio interno.

### 2.8 CORS / orígenes permitidos

- Revisar la lista de "orígenes permitidos" en el backend. Si otros sistemas acceden a la aplicación usando la IP vieja (por ejemplo http://192.168.10.50:3000), después del cambio el navegador va a bloquear esas peticiones, aunque el servidor sí esté disponible, porque ya no reconoce ese origen como válido.
- Por eso es mejor usar siempre nombres de dominio (no IPs) en la lista de orígenes permitidos, y actualizar esa lista en el mismo momento del cambio, no después.

### 2.9 Variables de entorno

- Buscar y actualizar cualquier archivo de configuración (.env, docker-compose.yml, configuraciones de despliegue, etc.) que tenga escrita la IP vieja: cadenas de conexión a la base de datos, URLs internas, lista de hosts permitidos, orígenes CORS, etc.
- De ahora en adelante, conviene reemplazar las IPs "quemadas" en el código por nombres de dominio internos, así la próxima migración no obliga a tocar la configuración de la aplicación.

### 2.10 Bases de datos

- Si la base de datos está en otro servidor, se debe decidir si se migra al mismo tiempo o si, mientras tanto, el servidor de la aplicación mantiene una conexión temporal hacia esa red vieja.
- Actualizar la cadena de conexión a la base de datos y también sus reglas de acceso, para que acepte conexiones desde la nueva IP `10.18.30.50`.

### 2.11 Contenedores

- Si la aplicación corre en Docker, revisar la configuración de red: la red interna de los contenedores normalmente usa otro rango de direcciones distinto al del servidor, pero puede haber configuraciones que sí referencien directamente la IP vieja del host (por ejemplo, cuando un contenedor se publica "atado" a una IP específica). Esas configuraciones hay que actualizarlas.
- Revisar también si hay entradas manuales con la IP vieja dentro de los archivos de configuración del contenedor.

### 2.12 Servicios internos y otras dependencias

- Colas de mensajería, sistemas de autenticación (LDAP/SSO), monitoreo, copias de seguridad automáticas: cualquier sistema que tenga la IP del servidor en una "lista blanca" debe actualizarse.
- Seria una buena idea armar una lista simple con cada dependencia y su estado ("ya migrado", "pendiente", "no aplica"), para no perder de vista nada durante el proceso.

---

## 3. Plan de ejecución y reversión

### 3.1 Preparación previa
1. Evitar hacer otros cambios en el servicio que no tengan que ver con la migración, durante el tiempo que dure el proceso.
2. Hacer un respaldo completo antes de tocar nada: una copia del servidor (o al menos de su configuración: Nginx, firewall, .env, docker-compose.yml) y un respaldo de la base de datos si aplica.
3. Guardar los resultados de todos los comandos de diagnóstico, para poder comparar "cómo estaba todo antes" con "cómo quedó después".
4. Bajar el TTL del DNS con suficiente anticipación, no el mismo día del cambio.
5. Avisar a los usuarios del servicio cuándo va a haber una posible interrupción.
6. Definir por escrito, antes de empezar, cómo se sabrá que la migración funcionó y en qué momento se decide devolver todo atrás. Decidir esto en caliente, cuando algo ya falló, casi siempre es tarde.

### 3.2 Orden recomendado de los pasos
1. Confirmar con el administrador de red cuál será la IP definitiva, la subred, el gateway, y que las reglas de firewall para `10.18.30.x` ya estén creadas.
2. Configurar la nueva conexión de red en el servidor, sin quitar todavía la anterior (si es posible tener las dos activas al mismo tiempo mientras dura la transición).
3. Probar que el servidor sí tenga conexión básica en la red nueva (por ejemplo, hacer ping) antes de mover tráfico real hacia allá.
4. Actualizar de una sola vez todo lo relacionado con la aplicación: el reverse proxy, las variables de configuración, la conexión a la base de datos, la lista de orígenes permitidos (CORS) y las reglas de firewall propias de la aplicación.
5. Aplicar esos cambios de forma suave (recargar los servicios en lugar de reiniciarlos de golpe), para cortar el servicio el menor tiempo posible.
6. Actualizar el DNS para que el nombre del servicio apunte ya a la nueva IP `10.18.30.50`.
7. Hacer todas las pruebas para confirmar que todo funciona bien.
8. Si todo salió bien, ahí sí quitar la IP vieja del servidor y de cualquier configuración que aún la mencione, y volver a subir el TTL del DNS a su valor normal.

### 3.3 ¿Cómo saber que la migración funcionó?

Se considera que la migración fue exitosa cuando, al mismo tiempo:

- El servicio responde correctamente (código 200) desde la nueva dirección, con el certificado de seguridad funcionando.
- Al consultar el nombre del servicio desde distintos lugares, ya devuelve la IP nueva.
- La aplicación logra comunicarse sin problemas con la base de datos y con los demás servicios de los que depende.
- No aparecen errores de CORS al usar la aplicación desde el navegador.
- No hay errores en los registros (logs) de la aplicación relacionados con la red anterior.

### 3.4 ¿Qué hacer si algo sale mal? (Plan de reversión)

Se debe volver atrás si ocurre cualquiera de estas situaciones (definidas de antemano, no improvisadas):

- El servicio no responde después de un tiempo razonable ya acordado (por ejemplo, entre 15 y 30 minutos).
- Aparecen errores del servidor de forma repetida, o la aplicación no logra conectarse a la base de datos.
- El nombre del servicio no logra resolverse hacia la nueva IP dentro del tiempo esperado.

Pasos para devolver todo al estado anterior:

- Volver a apuntar el DNS hacia la IP vieja `192.168.x.x` (por eso es tan importante no haber subido todavía el TTL en este punto: si se sube antes de tiempo, el "regreso" tarda mucho más en propagarse).
- Restaurar, desde el respaldo, la configuración anterior del reverse proxy, las variables de entorno y las reglas de firewall.
- Si se había apagado la conexión de red vieja, volver a activarla.
- Repetir las mismas pruebas para confirmar que todo volvió a funcionar como antes.
- Antes de intentar la migración de nuevo, investigar y dejar por escrito qué fue lo que falló.

Mantener las dos conexiones de red (la vieja y la nueva) activas al mismo tiempo durante la transición, en lugar de cortar una de un solo golpe, hace que "devolverse" sea mucho más rápido, porque no toca reconfigurar la red del servidor bajo presión y con el servicio caído.

---

## 4. Validación posterior

| Qué se revisa | Comandos | Qué debería pasar |
|---|---|---|
| Que la IP quedó bien puesta | `ip addr show` | El servidor muestra activa la dirección `10.18.30.50/24` |
| Que hay ruta hacia la salida de internet o destinos clave | `ip route show`, `ip route get 8.8.8.8` | Se usa el gateway correcto (`10.18.30.1`) |
| Que hay conexión básica | `ping -c 4 10.18.30.1` | No se pierden paquetes |
| Que el camino de red esté completo | `traceroute <dominio-del-servicio>` | La conexión llega sin cortes ni esperas raras en el camino |
| Que los puertos necesarios estén abiertos | `ss -tulpn` | Los puertos `80`, `443` (y el de la base de datos si aplica) están escuchando en la IP correcta |
| Que el nombre del servicio ya resuelve a la IP nueva | `dig servicio-lis.udea.edu.co +short`, `nslookup servicio-lis.udea.edu.co` | Devuelve `10.18.30.50`, probado desde varios lugares |
| Que la aplicación web responde bien | `curl -Iv https://servicio-lis.udea.edu.co` | Responde `HTTP/1.1 200`, el certificado es válido y las cabeceras de CORS están correctas |
| Que se puede conectar con sus dependencias (ej. base de datos) | `nc -zv <ip-bd> 5432` | La conexión es aceptada desde la nueva red |
| Que solo estén abiertos los puertos que deberían | `nmap -sV -p 22,80,443,5432 10.18.30.50` | Solo aparecen abiertos los puertos esperados, ningún otro |
| Que la aplicación funcione de principio a fin | Probar el login o una acción clave desde el navegador real | Todo funciona sin errores de red ni de CORS en la consola del navegador |

Se recomienda correr esta misma lista de pruebas **antes** del cambio (para tener un "antes" con qué comparar) y **después** del cambio, y comparar los resultados uno por uno — no basta con la impresión de que "ya parece que funciona".

---

## 5. Riesgos y puntos críticos

| Riesgo | Por qué suele pasar | Cómo evitarlo |
|---|---|---|
| El servidor queda inaccesible después del cambio | La máscara de red o el gateway quedaron mal configurados en `10.18.30.x` | Verificar la ruta con `ip route get` antes de apagar la conexión vieja; mantener las dos conexiones (vieja y nueva) activas mientras dure la transición |
| Los usuarios siguen sin poder llegar al nuevo dominio | No se bajó el TTL del DNS con tiempo, o los computadores de los usuarios tienen la IP vieja guardada en caché | Bajar el TTL entre 24 y 48 horas antes del cambio; avisar a los usuarios que si es urgente, limpien la caché DNS de su equipo |
| Las reglas de seguridad (firewall) no se migraron | Se asume, sin verificar, que las reglas "se mueven solas" con el servidor | Crear explícitamente las reglas necesarias en la red nueva antes de hacer el corte |
| Hay direcciones IP "quemadas" directamente en el código o en archivos de configuración | Prácticas antiguas donde se escribía la IP directamente en vez de usar un nombre de dominio | Buscar en todo el proyecto y la configuración cualquier mención a `192.168.` antes de migrar |
| El navegador bloquea la aplicación por CORS, aunque el servidor sí esté funcionando | La lista de orígenes permitidos todavía apunta a la IP o el dominio viejo | Actualizar esa lista de orígenes permitidos al mismo tiempo que se cambia la IP, no después |
| El certificado de seguridad (HTTPS) deja de funcionar | El certificado se emitió sobre la IP en vez del dominio, o el proceso de renovación no logra verificar el dominio en la nueva red | Usar siempre certificados asociados a un nombre de dominio; confirmar que los puertos 80/443 estén accesibles en la red nueva antes del cambio |
| Los contenedores (Docker) no logran conectarse con servicios externos | La red interna de Docker quedó mal configurada o con conflictos después del cambio de servidor | Revisar la configuración de red de Docker y cualquier IP fija escrita ahí |
| Servicios internos (base de datos, colas, sistema de login, etc.) rechazan la IP nueva | Esos servicios tienen su propia lista de "quién puede conectarse" y no fue actualizada | Incluir esas listas de acceso dentro del inventario de dependencias desde el principio |
| El "plan B" (rollback) llega tarde o queda incompleto | No se definió de antemano en qué momento devolverse, ni se guardó un respaldo del estado anterior | Definir con anticipación cuándo se hace rollback y guardar respaldo de configuración y de los resultados del diagnóstico inicial |
---

## 6. Referencias

- MDN Web Docs — Same-origin policy: define el trío esquema/host/puerto que determina si dos direcciones son el "mismo origen". https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy
- MDN Web Docs — **Cross-Origin Resource Sharing (CORS)**: mecanismo por el cual el servidor declara qué orígenes puede consumir su API. https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
- Docker Docs — **Bridge network driver** y **Define networks in Docker Compose**: comportamiento de las redes de contenedores y cómo se fija una subred o un *binding* a una IP del host. https://docs.docker.com/engine/network/drivers/bridge/ y https://docs.docker.com/reference/compose-file/networks/
- CISA — **Cyber Resilience Review (CRR) Resource Guide, Volume 3: Configuration and Change Management**: marco de referencia para documentar línea base, criterios de éxito y reversión antes de ejecutar un cambio en producción. https://www.cisa.gov/sites/default/files/c3vp/crr_resources_guides/CRR_Resource_Guide-CCM.pdf
- The Linux Foundation — iproute2 wiki (proyecto oficial de ip/ss, mantenido en kernel.org): referencia de las herramientas de diagnóstico de red usadas en este informe. https://wiki.linuxfoundation.org/networking/iproute2

---

