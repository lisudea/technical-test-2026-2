# Documentacion del Reto 4 
# Reto 4: Investigación — Migración de servicios entre redes del LIS

## 1. Introducción

Aunque a primera vista este cambio podría parecer simplemente una modificación de dirección IP, una migración de este tipo puede afectar diferentes componentes que dependen de la red actual. Por esta razón, mi propuesta es realizar la migración de forma gradual y controlada. Antes de modificar cualquier configuración, se debe conocer cómo funciona actualmente el servicio; posteriormente se realizan los cambios necesarios y finalmente se verifica que tanto la aplicación como sus dependencias continúen funcionando.

El objetivo principal es evitar que el cambio de red provoque una interrupción innecesaria y, en caso de presentarse algún problema, contar con una forma clara de regresar temporalmente al estado anterior.

---

# 2. Diagnóstico del entorno actual

Antes de realizar cualquier cambio, considero importante tener una fotografía del estado actual del servicio. Esto permite saber qué funciona actualmente y qué elementos podrían verse afectados por la migración.

Como el caso planteado es hipotético y no se proporcionan las configuraciones reales del LIS, no asumiría una IP, gateway o DNS específico. Estos datos deberían obtenerse directamente del servidor y de la infraestructura autorizada.

## 2.1 Información de red

Lo primero sería identificar la configuración actual del servidor:

* Dirección IP.
* Máscara de red.
* Subred a la que pertenece.
* Puerta de enlace.
* Interfaces de red disponibles.
* Rutas configuradas.
* Servidores DNS utilizados.

Por ejemplo, sería importante determinar si el servidor tiene actualmente una dirección perteneciente a `192.168.x.x` y cuál es la puerta de enlace utilizada.

También revisaría la configuración DNS:

```bash
cat /etc/resolv.conf
```

o, dependiendo de la configuración del servidor:

```bash
resolvectl status
```

La idea no es solamente saber cuál es la IP del servidor, sino entender cómo se comunica con el resto de la infraestructura.

---

## 2.2 Servicios y puertos utilizados

Después revisaría qué servicios están escuchando en el servidor.

Por ejemplo:

```bash
ss -tulpn
```

Esto permitiría identificar servicios asociados a puertos como:

* `80` para HTTP.
* `443` para HTTPS.
* Otros puertos utilizados por la aplicación o sus dependencias.

También sería necesario confirmar si la aplicación utiliza servicios adicionales, por ejemplo una base de datos, una API interna, un servidor de autenticación o algún servicio externo.

La información obtenida debería organizarse en una tabla similar a la siguiente:

| Elemento      | Situación actual             | Qué revisar                       |
| ------------- | ---------------------------- | --------------------------------- |
| Servidor web  | Red anterior                 | IP y gateway                      |
| DNS           | Configuración actual         | Nombre utilizado por los usuarios |
| Aplicación    | En funcionamiento            | Variables de configuración        |
| Base de datos | Dependencia de la aplicación | IP o nombre del servidor          |
| API internas  | Dependencias                 | Direcciones y puertos             |
| Firewall      | Reglas actuales              | Origen y destino permitidos       |
| Reverse proxy | Si existe                    | IP, dominio y certificados        |

---

## 2.3 Identificación de dependencias

Uno de los puntos que considero más importantes es identificar todas las dependencias que puedan seguir utilizando direcciones `192.168.x.x`.

No sería suficiente con cambiar la IP del servidor web.

Por ejemplo, la aplicación podría tener configurada una conexión como:

```text
192.168.x.x:3306
```

para acceder a una base de datos.

También podría existir una API interna configurada directamente con una dirección IP, una variable de entorno, una configuración del servidor web o incluso algún archivo de configuración de la aplicación.

Por esto revisaría:

* Archivos de configuración.
* Variables de entorno.
* Configuración de la base de datos.
* Servicios ejecutándose en el servidor.
* Configuración de contenedores, si existen.
* Certificados y nombres de dominio.
* Configuraciones de CORS u orígenes permitidos.

También buscaría referencias a la red anterior dentro del proyecto y de sus archivos de configuración. El objetivo sería detectar cualquier dirección `192.168.x.x` que pueda generar problemas después del cambio.

---

# 3. Propuesta de migración

La migración propuesta consiste en trasladar el servicio al nuevo esquema `10.18.30.x`, pero hacerlo de manera controlada y teniendo en cuenta las dependencias de la aplicación.

## 3.1 Preparación

Antes de cambiar la dirección del servidor, realizaría un inventario de la configuración actual.

Documentaría:

* IP actual.
* Máscara.
* Gateway.
* DNS.
* Puertos utilizados.
* Servicios activos.
* Dependencias.
* Reglas de acceso.
* Dominios utilizados.
* Configuración del servidor web.
* Configuración de la aplicación.

También realizaría un respaldo de las configuraciones importantes.

Por ejemplo, guardaría una copia de:

* Configuración de red.
* Configuración del servidor web.
* Variables de entorno.
* Configuración del reverse proxy.
* Reglas de firewall.
* Configuraciones relacionadas con la aplicación.

En esta etapa también considero importante establecer una ventana de mantenimiento, especialmente si el servicio es utilizado por otras personas.

---

## 3.2 Nuevo direccionamiento

Una vez conocida la configuración actual, se asignaría al servidor una dirección disponible dentro del nuevo rango institucional `10.18.30.x`.

La dirección exacta no se debería elegir de manera arbitraria. Debe ser asignada de acuerdo con la organización de la red del LIS y evitando conflictos con otros dispositivos.

Después de realizar estos cambios, primero comprobaría que el servidor pueda comunicarse con su gateway y con los recursos necesarios.

---

## 3.3 Configuración del acceso a la aplicación

Si los usuarios acceden a la aplicación mediante un nombre de dominio, preferiría mantener ese nombre y actualizar la configuración necesaria para que apunte al nuevo servidor.

Esto tiene una ventaja importante: los usuarios no tendrían que aprender una nueva dirección.

Por ejemplo, conceptualmente:

```text
Antes:

usuarios
   |
   v
aplicacion.lis
   |
   v
192.168.x.x


Después:

usuarios
   |
   v
aplicacion.lis
   |
   v
10.18.30.x
```

Si existe un reverse proxy, también se debe revisar su configuración para confirmar que esté apuntando al nuevo destino.

---

## 3.5 Aplicación y configuraciones internas

Después de modificar la red, revisaría la configuración de la aplicación.

Especialmente buscaría direcciones IP escritas directamente en:

* Variables de entorno.
* Archivos de configuración.
* Conexiones a bases de datos.
* APIs.
* Servicios internos.
* Configuraciones de CORS.
* Integraciones externas.

Siempre que sea posible, considero preferible utilizar nombres de servicio o dominios en lugar de depender directamente de una dirección IP.

Por ejemplo, sería más fácil de mantener:

```text
https://api.lis
```

que tener:

```text
https://192.168.x.x
```

De esta manera, futuros cambios de infraestructura tendrían un menor impacto sobre el código.

---

## 3.6 Bases de datos y otros servicios

También revisaría la conexión entre la aplicación y la base de datos.

No necesariamente la base de datos debe migrarse al mismo tiempo que el servidor web. Si continúa funcionando en otra red, se debe garantizar que exista conectividad entre ambos servicios y que el firewall permita la comunicación necesaria.

La misma revisión se realizaría para:

* APIs internas.
* Servicios de autenticación.
* Almacenamiento.
* Servicios de correo.
* Sistemas externos.

---

# 4. Plan de ejecución

Para reducir riesgos, realizaría la migración siguiendo un orden definido.

## Paso 1. Levantamiento de información

Registrar la configuración actual:

```text
IP
Gateway
DNS
Rutas
Puertos
Servicios
Dependencias
Reglas de acceso
```

También realizaría pruebas básicas para confirmar que el servicio funciona correctamente antes de tocar la configuración.

---

## Paso 2. Respaldo

Antes de realizar cambios:

* Respaldar las configuraciones.
* Respaldar las variables de entorno.
* Guardar la configuración de red actual.
* Registrar las reglas de firewall.
* Confirmar que existe un respaldo funcional de la aplicación y de los datos cuando corresponda.

El propósito es poder regresar rápidamente a una configuración conocida si ocurre algún problema.

---

## Paso 3. Preparar la nueva configuración

Definir la nueva IP dentro del rango `10.18.30.x`, junto con su máscara, gateway y DNS correspondientes.

También se prepararían las modificaciones necesarias en:

* Firewall.
* Reverse proxy.
* DNS.
* Aplicación.
* Bases de datos.
* APIs.
* Contenedores, si existen.

---

## Paso 4. Realizar el cambio

En la ventana de mantenimiento se aplicaría la nueva configuración de red.

Después del cambio, se comprobaría primero la conectividad básica antes de evaluar la aplicación.

---

## Paso 5. Actualizar las dependencias

Se comprobaría que la aplicación pueda comunicarse nuevamente con:

* Base de datos.
* APIs.
* Servicios internos.
* Servicios externos necesarios.

También se verificarían los registros de la aplicación en busca de errores.

---

# 5. Criterios para considerar exitosa la migración

Consideraría que la migración fue exitosa cuando se cumplan, como mínimo, las siguientes condiciones:

* El servidor tiene correctamente configurada la nueva dirección.
* La puerta de enlace y las rutas funcionan.
* El nombre de dominio resuelve correctamente.
* Los usuarios autorizados pueden acceder a la aplicación.
* HTTPS funciona correctamente.
* La aplicación puede conectarse a su base de datos.
* Las APIs y servicios necesarios responden.
* Las reglas de firewall permiten únicamente el tráfico necesario.
* No existen errores importantes en los registros.
* Las funcionalidades principales de la aplicación funcionan normalmente.

No daría por terminada la migración solamente porque el servidor responda a un `ping`. Es necesario comprobar el funcionamiento completo de la aplicación.

---

# 6. Plan de reversión

Una migración debe tener un plan para regresar al estado anterior.

Si después del cambio se presenta una falla crítica que no puede solucionarse dentro de la ventana de mantenimiento, se restauraría la configuración anterior.

El proceso sería aproximadamente:

1. Detener o poner en mantenimiento la aplicación si es necesario.
2. Restaurar la configuración de red anterior.
3. Restaurar las reglas de acceso anteriores.
4. Revertir los cambios de DNS si fueron realizados.
5. Restaurar las configuraciones de la aplicación que hayan sido modificadas.
6. Comprobar nuevamente la conectividad.
7. Verificar que la aplicación vuelva a funcionar.
8. Registrar el problema encontrado para analizarlo antes de realizar un nuevo intento.
---

# 7. Validación posterior

Después de completar la migración realizaría diferentes niveles de pruebas.

## 7.1 Prueba de red

Primero comprobaría la configuración.

Después verificaría la comunicación con el gateway.

Si es necesario analizar el recorrido hacia otro servidor.

Estas pruebas permiten detectar problemas relacionados con la dirección, gateway o rutas.

---

## 7.2 Prueba de DNS

Comprobaría que el dominio de la aplicación resuelva correctamente.

La dirección obtenida debería corresponder al nuevo servicio.

---

## 7.3 Prueba de puertos

Para verificar que un puerto específico sea accesible
Esto ayuda a determinar si existe conectividad hasta el servicio.

---

## 7.4 Prueba de aplicación

Finalmente probaría directamente la aplicación:
Además de esta prueba técnica, realizaría una prueba desde un navegador para comprobar el comportamiento real que tendrá un usuario.

Se revisarían acciones como:

* Iniciar sesión.
* Consultar información.
* Guardar información.
* Consumir APIs.
* Cargar recursos.
* Realizar las operaciones principales de la aplicación.

---

# 8. Riesgos y puntos críticos

Durante la migración considero que los principales riesgos serían los siguientes.

### IP configurada directamente en la aplicación

Puede existir alguna dirección `192.168.x.x` dentro del código o configuración.

**Medida:** buscar referencias a la red anterior antes de realizar el cambio y reemplazarlas por la configuración correspondiente.

---

### Gateway o máscara incorrectos

Una dirección nueva correctamente asignada no garantiza que el servidor tenga conectividad.

**Medida:** verificar la máscara, gateway y rutas antes de probar la aplicación.

---

### Caché DNS

Aunque el DNS haya sido actualizado correctamente, algunos usuarios pueden continuar obteniendo temporalmente la dirección anterior.

**Medida:** tener en cuenta los tiempos de caché y realizar pruebas desde diferentes equipos o redes autorizadas.

---

### Dependencias internas

La aplicación puede depender de otros servicios que todavía estén utilizando `192.168.x.x`.

**Medida:** realizar un inventario de dependencias y probarlas individualmente.

---

### Contenedores

Si la aplicación utiliza Docker u otra tecnología de contenedores, puede existir configuración de red independiente de la del servidor.

**Medida:** revisar las variables de entorno, redes internas y configuraciones de los contenedores.

---

# 9. Diagrama de la migración

De forma simplificada, el escenario actual sería:

```text
                 USUARIOS
                     |
                     v
              +-------------+
              | Aplicación  |
              |     LIS     |
              +-------------+
                     |
                     v
                192.168.x.x
                     |
          +----------+----------+
          |                     |
          v                     v
      Base de datos        APIs / servicios
```

La situación propuesta sería:

```text
                 USUARIOS
                     |
                     v
                    DNS
                     |
                     v
              +-------------+
              | Aplicación  |
              |     LIS     |
              +-------------+
                     |
                10.18.30.x
                     |
          +----------+----------+
          |                     |
          v                     v
      Base de datos        APIs / servicios
```

El diagrama es conceptual

---

# 11. Conclusiones

La migración de una aplicación desde una red `192.168.x.x` hacia el nuevo esquema `10.18.30.x` debe verse como un cambio de infraestructura y no únicamente como un cambio de dirección IP.

El principal objetivo de mi propuesta es reducir el riesgo mediante una secuencia sencilla: **conocer, preparar, cambiar, comprobar y, si es necesario, revertir**.

Antes del cambio se debe conocer la configuración actual y localizar las dependencias que todavía utilizan la red anterior. Durante la migración se deben actualizar los elementos necesarios de red, seguridad y aplicación. Después se deben realizar pruebas tanto técnicas como funcionales para confirmar que el servicio realmente está disponible para sus usuarios.

---

# 12. Referencias

Las siguientes fuentes fueron consultadas como referencia para los conceptos y herramientas mencionados en esta propuesta:

* Documentación oficial de `ip` y herramientas de administración de red en Linux:
  https://man7.org/linux/man-pages/man8/ip.8.html

* Documentación de `ss` para consultar sockets y puertos:
  https://man7.org/linux/man-pages/man8/ss.8.html

* Documentación de `curl`:
  https://curl.se/docs/

* Manual de `dig` y herramientas DNS de BIND:
  https://bind9.readthedocs.io/

* Documentación de Docker sobre redes:
  https://docs.docker.com/engine/network/

* Documentación de MDN sobre CORS:
  https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS

* Documentación de Mozilla sobre HTTPS y certificados:
  https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview

---

## Nota importante
Toda esta redacción y supuesta propuesta surgen de toda la investigación que realicé y con la formación que he tenido de otros procesos, no obstante, esto es un caso hipotetico donde no sabemos en realidad la gravedad del problema y en donde yo en lo personal, no he puesto en práctica toda esta teoria a su profundidad; sin embargo, es un reto interesante que se puede ir evaluando en caso tal de querer realizarlo.
