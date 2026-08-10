# LIS UdeA — Frontend

Frontend en React (Vite) para el backend Spring Boot del Laboratorio Integrado de Sistemas (Reto2-backend). Replica el mockup que realicé antes de empezar el desarrollo: Tablero, Equipos, Reservas y Estadísticas, con cambio de idioma ES/EN instantáneo (sin recargar la página).

![alt text](<Captura de pantalla 2026-08-09 112636.png>)

![alt text](<Captura de pantalla 2026-08-09 112727.png>)

![alt text](<Captura de pantalla 2026-08-09 112742.png>)

![alt text](<Captura de pantalla 2026-08-09 112805.png>)

![alt text](<Captura de pantalla 2026-08-09 173938.png>)

Estos mockups se reralizaron con el objetivo de tener una visión más amplia de lo que queria realizar; llevar una guía de colores que tuvieran armonia con el sistema en general y así, lograr un desarrollo más completo.


## Tecnologías

* **Librería Principal:** React 18
* **Herramienta de Construcción:** Vite
* **Estilos:** CSS Modules / CSS
* **Cliente HTTP:** Axios
* **Internacionalización:** React Context (i18n local)


## Requisitos previos

- Node.js v18 o superior
- El backend de Spring Boot corriendo.


El backend ya trae configurado CORS para `http://localhost:5173` y `http://localhost:3000` (ver `app.cors.allowed-origins` en `application.properties`), que son los puertos por defecto de Vite y de otras herramientas comunes. Si vas a correr el frontend desde otro origen, agrega esa URL a esa propiedad (o a la variable de entorno `CORS_ALLOWED_ORIGINS`) separada por comas.

## 2. Configurar el frontend

Copia el archivo de ejemplo de variables de entorno (ya viene copiado como `.env`, pero puedes ajustarlo si tu backend corre en otro puerto/host):

```bash
cp .env.example .env
```

`.env`:
```
VITE_API_URL=http://localhost:8080/api
```

## 3. Instalar y correr

```bash
npm install
npm run dev
```

Accede a la aplicación en el navegador ingresando a `http://localhost:5173`.

## 4. Compilar para producción

```bash
npm run build
```

## Estructura del proyecto

```
src/
  api/            Llamadas a los endpoints del backend (equipos, reservas, estadísticas)
  components/     Layout, tarjetas, modales, badges, toasts, etc.
  i18n/           Diccionario ES/EN y contexto de idioma (sin recarga de página)
  pages/          Tablero, Equipos, Reservas, Estadísticas
  utils/          Helpers de formato de fecha e íconos por categoría
```

## Notas sobre el backend

- El estado **RESERVADO** de un equipo nunca se guarda manualmente: el backend lo calcula en tiempo real (`estadoVisual`) según si existe una reserva activa en el momento de la consulta. Al crear/editar un equipo solo puedes elegir **Disponible** o **En Mantenimiento**; el frontend ya respeta esta regla en el formulario.

- El filtro de estado en la pantalla de Equipos se aplica en el cliente sobre `estadoVisual`, porque el parámetro `estado` que recibe `GET /api/equipos` filtra por el campo administrativo persistido (que nunca es `RESERVADO`).

- Un equipo con historial de reservas no se puede eliminar (el backend responde 409); en ese caso el frontend muestra el mensaje sugiriendo cambiar el equipo a "En Mantenimiento".

- Las reservas se crean validando fecha de inicio anterior a la de fin y ausencia de choques de horario con otras reservas activas del mismo equipo — ambas cosas las valida el backend; el frontend valida lo mismo del lado del cliente para dar feedback inmediato, pero el backend es la fuente de verdad.

## Idioma

El selector ES/EN en la cabecera cambia el idioma de toda la interfaz al instante (sin recargar), usando React Context y guardando la preferencia en `localStorage` para que se mantenga entre sesiones.
