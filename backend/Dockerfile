# Receta para construir la "caja" (imagen) donde se ejecuta la API.
#
# Una imagen de Docker es una plantilla con todo lo necesario para correr el
# programa: el sistema operativo mínimo, Python, las librerías y el código.
# Quien la use no necesita instalar Python ni nada más en su computador.

# Punto de partida: una imagen oficial con Python 3.12 ya instalado.
# La variante "slim" trae lo mínimo indispensable, así la imagen pesa mucho
# menos que la completa.
FROM python:3.12-slim

# Carpeta dentro del contenedor donde vivirá el proyecto. Todas las
# instrucciones siguientes se ejecutan desde aquí.
WORKDIR /app

# PYTHONDONTWRITEBYTECODE: evita que Python genere archivos .pyc, que dentro
#   de un contenedor solo ocupan espacio y no se reutilizan.
# PYTHONUNBUFFERED: hace que los mensajes salgan al instante en los logs, en
#   vez de quedarse retenidos en memoria. Sin esto, al depurar parecería que
#   la aplicación no está imprimiendo nada.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Se copia PRIMERO solo la lista de dependencias y se instalan, ANTES de
# copiar el código. Esto es intencional: Docker guarda en caché cada paso, así
# que mientras requirements.txt no cambie, no vuelve a descargar las librerías
# cada vez que se modifica una línea de código. Reconstruir pasa de minutos a
# segundos.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Ahora sí, el código del proyecto.
COPY . .

# Puerto en el que escucha la API dentro del contenedor.
EXPOSE 8000

# Comando por defecto si no se indica otro. docker-compose.yml lo sobreescribe
# para ejecutar antes las migraciones de la base de datos.
#   --host 0.0.0.0 es imprescindible: sin él, la API solo escucharía peticiones
#   de dentro del contenedor y no se podría acceder desde el navegador.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
