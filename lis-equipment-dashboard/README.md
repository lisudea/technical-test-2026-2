# Lab Resource Navigator

Ayudame a generar una página web reactiva, estos son los requerimientos "Dashboard de Monitoreo de Recursos Deberá desarrollar un proyecto frontend que consuma e integre las funcionalidades de la REST API desarrollada en el Reto 2. Requerimientos Funcionales: 1. Tecnología: Framework o librería JS a elección (React, Angular, Vue, etc.). 2. Diseño Responsivo: La interfaz debe ser adaptable a dispositivos móviles y de escritorio (puede usar Tailwind, Bootstrap, CSS puro, etc.). 3. Tablero de Visualización: Implementar una vista principal (Dashboard) que liste los equipos del laboratorio consumiendo la API de su backend. 4. Indicadores de Estado: Utilizar colores o íconos visuales para mostrar claramente el estado de cada equipo en tiempo real (ej. Verde para Disponible, Rojo para Reservado, Gris para Mantenimiento). 5. Filtros Dinámicos: Implementar un buscador o panel de filtros que permita al usuario encontrar equipos por su categoría sin necesidad de recargar la página completa. 6. Manejo de Errores en UI: La interfaz debe ser capaz de capturar adecuadamente los posibles errores retornados por el backend (como el fallo al intentar reservar un equipo ya ocupado en esa franja horaria) y mostrarle al usuario un mensaje o alerta amigable. 7. [Bonus] Internacionalización (i18n): Implementar soporte para múltiples idiomas en la interfaz gráfica. La aplicación debe permitir cambiar dinámicamente entre español e inglés y quedar preparada para incorporar otros idiomas, sin recargar la aplicación. Los textos de la interfaz no deben estar quemados directamente en los componentes; deben organizarse de forma centralizada y escalable. La solución puede implementarse manualmente o mediante una librería especializada, priorizando una experiencia de usuario clara y consistente." este es el backend "REST API - Sistema de Gestión y Reservas de Equipos del LIS 
El aspirante deberá diseñar y desarrollar un proyecto backend que provea los servicios necesarios 
para gestionar el inventario y la reserva de recursos de hardware del laboratorio. 
Persistencia de datos: Se requiere obligatoriamente la integración con una Base de Datos 
(preferiblemente un motor en línea sea SQL o  NoSQL). No se aceptará el almacenamiento exclusivo 
en memoria (arreglos o variables estáticas). 
Requerimientos Funcionales Obligatorios: El sistema debe exponer servicios web que permitan 
realizar las siguientes acciones: 
● Gestión de Equipos: Permitir el registro, actualización y visualización de los equipos del 
laboratorio. Para el registro se debe solicitar información como: ID único, nombre, 
número de serie o MAC, categoría (ej. Microcontroladores, VR, Redes) y estado actual. 
● Listado Avanzado: Al consultar los equipos, el sistema debe ser capaz de retornar la 
información de manera paginada y permitir aplicar filtros de búsqueda (por categoría o 
estado). 
● Gestión de Reservas: Permitir que un usuario (identificado por nombre y correo) cree, 
cancele y liste reservas de un equipo específico estableciendo una fecha y hora de inicio, y 
una fecha y hora de fin. 
● Regla de Negocio Crítica: Durante la creación de una reserva, el sistema debe validar de 
forma estricta que el equipo solicitado no se encuentre ya reservado por otro usuario en 
la misma franja de tiempo. En caso de conflicto, la API debe rechazar la solicitud 
retornando un código de estado HTTP adecuado. 
Requerimientos Opcionales (Bonus - Nivel Avanzado): La implementación de estos puntos 
demostrará un dominio superior: 
● Estadísticas: Proveer un servicio que retorne datos estadísticos, como un "Top 5" de los 
equipos más solicitados históricamente. 
●    Autenticación Integrada: Diseñar un servicio de inicio de sesión que se integre con un 
proveedor externo (como Google SSO), el cual valide que el usuario posee un correo 
institucional (@udea.edu.co) y, de ser exitoso, emita un token de acceso (ej. JWT) para 
proteger la creación de reservas. 
Para el desarrollo puede usar su lenguaje y framework de preferencia (recomendados: Spring Boot, 
FastAPI, NestJS o Express). Se espera una buena documentación indicando cómo probar los servicios 
creados (Swagger, Postman collection o un README detallado)." Alguna de las coas que quiero es que sea reactiva, entonces tenga movimiento con respecto al mouse y cuando se hace scroll, me gusta  cuando se hace fock us en elemento y el resto se ve blured, que los componentes se vean suaves,

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ced7b268-4119-480d-b551-66ea45506c2b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
