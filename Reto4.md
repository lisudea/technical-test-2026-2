# Reto 4 - Investigación: Migración de servicios entre redes del LIS

**Cristian Álvarez Cuartas**

## Introducción

El LIS se encuentra realizando una migración de servicios que antes funcionaban sobre direcciones `192.168.x.x` hacia el nuevo direccionamiento institucional, donde se encuentra el rango `10.18.30.x`.

Aunque inicialmente podría parecer que el cambio consiste únicamente en modificar la dirección IP del servidor, una aplicación web puede depender de otros elementos de la red. Por ejemplo, puede depender de un servidor de base de datos, reglas de firewall, DNS, variables de entorno o de otro servicio que todavía tenga configurada directamente una dirección `192.168.x.x`.

En este documento planteo una propuesta básica para realizar la migración de una aplicación web hacia la nueva red de forma ordenada.
---

## 1. Diagnóstico del entorno actual

Antes de realizar cualquier cambio, lo primero sería conocer cómo está funcionando actualmente el servidor y qué servicios dependen de la dirección antigua.

### Dirección IP y configuración de red

En un servidor Linux comenzaría consultando las interfaces de red:

```bash
ip addr
```

Este comando permitiría identificar la interfaz utilizada por el servidor y la dirección `192.168.x.x` que tenga actualmente.

Luego revisaría las rutas:

```bash
ip route
```

Aquí se puede observar la red a la que está conectado el servidor, el gateway predeterminado y otras rutas que tenga configuradas.

También revisaría la configuración DNS disponible en el servidor:

```bash
cat /etc/resolv.conf
```

No cambiaría directamente la IP sin conocer primero la nueva dirección, máscara o prefijo, gateway y servidores DNS correspondientes a la red `10.18.30.x`.

### Puertos utilizados

También es necesario saber qué puertos está utilizando la aplicación:

```bash
ss -tulpn
```

Por ejemplo, una aplicación web podría estar escuchando directamente en los puertos `80` o `443`, o podría funcionar internamente en un puerto como `8080` y tener Nginx como reverse proxy.

Los puertos encontrados serían importantes más adelante para configurar correctamente las reglas de firewall o ACL.

### Dependencias de la aplicación

Revisaría si la aplicación se comunica con:

- Base de datos.
- APIs internas.
- Servidores de archivos.
- Sistemas de autenticación.
- Reverse proxy.
- Otros servidores del LIS.
- Contenedores Docker.

También buscaría si todavía existen direcciones de la red anterior escritas directamente en archivos de configuración. Por ejemplo:

```bash
grep -R "192\.168\." /ruta/
```

La búsqueda debe hacerse únicamente sobre directorios autorizados. El objetivo sería encontrar casos como:

```text
DB_HOST=192.168.1.20
API_URL=http://192.168.1.30:8080
```

Si existen referencias de este tipo, también deben ser consideradas durante la migración.


## 2. Propuesta de migración

Después de conocer el estado actual, realizaría los cambios necesarios para que la aplicación trabaje en la red `10.18.30.x`.

### Cambio de direccionamiento

Al servidor se le asignaría una dirección disponible dentro de `10.18.30.x`, junto con la máscara o prefijo y gateway definidos por el administrador de la red del LIS.

Después del cambio verificaría nuevamente:

```bash
ip addr
ip route
```

La nueva IP debe aparecer en la interfaz correcta y debe existir una ruta adecuada hacia el gateway y las demás redes necesarias.

### DNS

Si los usuarios normalmente acceden a la aplicación mediante un nombre, por ejemplo:

```text
aplicacion.lis.udea.edu.co
```

lo ideal es que los usuarios sigan usando ese nombre y no una IP directamente.

En ese caso, el registro DNS tendría que actualizarse para que el nombre de la aplicación apunte hacia la nueva dirección `10.18.30.x`.

Posteriormente se podría comprobar con:

```bash
dig aplicacion.lis.udea.edu.co
```

o:

```bash
nslookup aplicacion.lis.udea.edu.co
```

### Firewall y ACL

Las reglas de seguridad también deben revisarse. Puede ocurrir que un firewall actualmente permita conexiones desde o hacia `192.168.x.x`, pero bloquee la nueva red.

Se deben permitir únicamente los puertos realmente necesarios. Por ejemplo:

- `80` si existe acceso HTTP.
- `443` para HTTPS.
- Puerto interno de la aplicación, solo si realmente necesita ser accesible.
- Puerto de base de datos únicamente desde los servidores que lo requieran.

No sería conveniente simplemente abrir todos los puertos de la nueva red.

### NAT y rutas

Si algunos sistemas todavía permanecen temporalmente en la red `192.168.x.x`, se debe comprobar que exista una ruta entre ambas redes.

Si las redes no pueden comunicarse directamente, el administrador podría necesitar configurar una ruta o, en casos donde sea necesario, una regla de NAT.

Mi primera opción sería utilizar un enrutamiento correcto entre las redes. NAT lo consideraría solamente si existe alguna dependencia que lo haga necesario.

### Reverse proxy

Si la aplicación utiliza Nginx u otro reverse proxy, revisaría su configuración.

Por ejemplo, podría existir:

```nginx
proxy_pass http://192.168.1.50:8080;
```

Si el servidor de aplicación cambia de dirección, este valor debería actualizarse.

Luego se probaría la configuración antes de recargar Nginx.

### Certificados HTTPS

Si la aplicación utiliza HTTPS y conserva el mismo nombre DNS, revisaría que el certificado continúe siendo válido para ese nombre.

Los certificados normalmente se relacionan con el nombre del dominio. Por esta razón, un cambio únicamente de IP no necesariamente obliga a cambiar el certificado. Sin embargo, si también cambia el nombre con el que se publica la aplicación, sí debe comprobarse el certificado.

### CORS y orígenes permitidos

En una aplicación con frontend y API separados, también revisaría CORS.

Por ejemplo, si el backend solamente permite:

```text
http://192.168.1.50
```

y el frontend comienza a utilizar otro dominio u origen después de la migración, las peticiones del navegador podrían ser rechazadas.

En ese caso se debe actualizar el origen permitido por la aplicación.

### Variables de entorno y base de datos

Revisaría variables como:

```text
DB_HOST
DB_URL
API_URL
BACKEND_URL
FRONTEND_URL
ALLOWED_ORIGINS
```

Si alguna utiliza directamente una dirección `192.168.x.x`, debe cambiarse.

También comprobaría que desde la nueva red el servidor pueda conectarse a la base de datos. Si la base de datos tiene reglas que autorizan únicamente a la IP anterior, sería necesario agregar la nueva dirección antes de realizar el cambio.

### Contenedores

Si la aplicación está en Docker, revisaría:

```bash
docker ps
docker network ls
```

También revisaría los archivos `docker-compose.yml`, `.env` u otras configuraciones para comprobar que no tengan direcciones `192.168.x.x`.

Los puertos publicados por Docker también deben coincidir con los que realmente deben estar disponibles en el servidor.



## 3. Plan de ejecución y reversión

Para reducir la posibilidad de dejar el servicio fuera de funcionamiento, realizaría la migración en un orden definido.

### Antes del cambio

Primero realizaría una copia de seguridad de las configuraciones importantes de la aplicación y de la red.

También guardaría los datos actuales:

```text
IP anterior
Máscara o prefijo
Gateway
DNS
Rutas
Puertos
Reglas de firewall
Configuración del reverse proxy
Variables de entorno
Dependencias de la aplicación
```

Si es posible, también realizaría respaldo de la aplicación y de su base de datos antes de iniciar.

### Durante la migración

El orden propuesto sería:

1. Confirmar la nueva IP, máscara, gateway y DNS.
2. Confirmar que las reglas de firewall y rutas permiten el tráfico necesario.
3. Preparar los cambios en variables de entorno, reverse proxy y dependencias.
4. Configurar la nueva dirección `10.18.30.x`.
5. Comprobar conectividad desde el servidor.
6. Actualizar DNS si la aplicación utiliza un nombre.
7. Reiniciar o recargar únicamente los servicios que lo necesiten.
8. Realizar las pruebas de funcionamiento.

### Criterio de éxito

Consideraría exitosa la migración si:

- El servidor aparece con la nueva dirección.
- El gateway es alcanzable.
- La resolución DNS entrega la dirección esperada.
- Los puertos necesarios están disponibles.
- La aplicación web abre correctamente.
- La API responde.
- La aplicación puede comunicarse con la base de datos y sus demás dependencias.
- No aparecen errores nuevos importantes en los logs.

### Rollback

Si después del cambio la aplicación deja de funcionar y el problema no puede resolverse rápidamente, volvería a la configuración anterior.

El rollback consistiría en:

1. Restaurar la dirección, máscara y gateway anteriores.
2. Restaurar las rutas anteriores.
3. Volver el DNS hacia la IP anterior, si ya había sido cambiado.
4. Restaurar las reglas anteriores de firewall o ACL.
5. Restaurar la configuración anterior del reverse proxy.
6. Restaurar las variables de entorno anteriores.
7. Reiniciar los servicios necesarios.
8. Comprobar que la aplicación vuelve a responder desde la red anterior.

Por esta razón es importante no eliminar la configuración anterior antes de comprobar completamente la nueva.


## 4. Validación posterior

Después de realizar la migración haría pruebas desde el servidor y desde un equipo cliente autorizado.

### Verificar la nueva IP

```bash
ip addr
```

Debe aparecer la dirección correspondiente a `10.18.30.x`.

### Verificar rutas y gateway

```bash
ip route
```

Después probaría conectividad con el gateway:

```bash
ping -c 3 IP_DEL_GATEWAY
```

### Verificar el recorrido de red

Si existe un problema para llegar a otro servicio:

```bash
traceroute IP_DESTINO
```

Esto puede ayudar a identificar en qué parte de la ruta se interrumpe la comunicación.

### Verificar DNS

```bash
dig NOMBRE_DEL_SERVICIO
```

El nombre debería resolver hacia la nueva IP.

### Verificar los puertos locales

```bash
ss -tulpn
```

Esto permite comprobar que la aplicación continúa escuchando en el puerto correcto.

### Verificar comunicación con otro puerto

Por ejemplo:

```bash
nc -vz IP_DESTINO 5432
```

Este ejemplo permitiría comprobar si se puede establecer conexión TCP hacia un puerto de PostgreSQL. Se usaría el puerto real de la dependencia que se esté evaluando.

### Verificar la aplicación web

```bash
curl -I https://NOMBRE_DEL_SERVICIO
```

También se podría consultar directamente algún endpoint de la API:

```bash
curl https://NOMBRE_DEL_SERVICIO/api/endpoint
```

Se debe obtener una respuesta HTTP válida y no un error de conexión.

### Verificación con Nmap

En un equipo autorizado se podría comprobar que los puertos esperados se encuentran disponibles:

```bash
nmap -p 80,443 10.18.30.X
```

Esta prueba solamente se realizaría sobre sistemas y direcciones autorizadas por el LIS.

Además de los comandos anteriores, probaría la aplicación desde un navegador, iniciaría sesión si aplica, realizaría una operación normal del sistema y comprobaría que las operaciones relacionadas con la base de datos continúen funcionando.



## 5. Riesgos y puntos críticos

Durante la migración pueden aparecer diferentes problemas.

### Gateway o máscara incorrectos

Si se configura una máscara o un gateway equivocado, el servidor podría quedar aislado o solamente comunicarse con algunos equipos de la red.

Por esta razón esos datos deben confirmarse antes de realizar la migración.

### Rutas faltantes

Aunque el servidor tenga correctamente la nueva IP, podría no existir una ruta hacia una base de datos o hacia otro servicio que permanezca en una red diferente.

### Reglas de firewall o ACL

Una regla puede estar permitiendo únicamente la IP anterior. Al cambiar hacia `10.18.30.x`, el tráfico podría comenzar a ser bloqueado.

### Caché DNS

Después de cambiar un registro DNS, algunos clientes podrían seguir utilizando temporalmente la dirección anterior debido a información que todavía se encuentre almacenada en caché.

Por esta razón conviene comprobar directamente qué dirección está resolviendo cada cliente cuando aparezcan problemas de acceso.

### Direcciones escritas directamente en el código

Este sería uno de los puntos que más revisaría. Una aplicación puede funcionar correctamente hasta que intenta comunicarse con una dependencia configurada como:

```text
http://192.168.x.x
```

Por eso deben revisarse el código, los archivos de configuración y las variables de entorno.

### Dependencias internas

La aplicación puede depender de servicios que no se hayan migrado todavía. En ese caso debe existir comunicación entre la nueva red y la red donde permanezca la dependencia.

### Docker

Los contenedores pueden tener puertos, redes o variables de entorno propias. Aunque la red del servidor se cambie correctamente, una configuración antigua dentro de Docker podría impedir la comunicación.

### DNS, certificados y CORS

El servicio puede responder correctamente por IP, pero fallar cuando se accede mediante el navegador. En ese caso revisaría DNS, HTTPS/certificados, reverse proxy y CORS.

---

## Referencias


1. **Red Hat - Configuring and managing networking**  
   https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html-single/configuring_and_managing_networking/index  

2. **ISC BIND 9 - Manual de dig**  
   https://bind9.readthedocs.io/en/v9.20.23/manpages.html  

3. **Nginx - ngx_http_proxy_module**  
   https://nginx.org/en/docs/http/ngx_http_proxy_module.html  

4. **Spring - Enabling Cross Origin Requests for a RESTful Web Service**  
   https://spring.io/guides/gs/rest-service-cors/  

5. **Docker - Networking overview**  
   https://docs.docker.com/engine/network/  

6. **Docker - Port publishing and mapping**  
   https://docs.docker.com/engine/network/port-publishing/  

7. **Nmap - Reference Guide**  
   https://nmap.org/book/man.html  
