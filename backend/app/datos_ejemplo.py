"""Carga datos de ejemplo con el inventario real del laboratorio.

Sin datos, el listado paginado, los filtros y el ranking no se pueden
*demostrar* funcionando: hay que registrar equipos a mano uno por uno antes de
poder probar nada. Este script los carga todos de una vez.

Se ejecuta con::

    docker compose exec api python -m app.datos_ejemplo

Es **idempotente**: se puede lanzar varias veces sin duplicar nada, porque
comprueba los números de serie ya existentes antes de insertar.

Los equipos y categorías corresponden al inventario descrito en
``docs/spec.md`` §3.5. Las reservas de ejemplo están repartidas para que el
ranking del endpoint de estadísticas tenga algo que mostrar.
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.database import SessionLocal
from app.models import Equipo, EstadoEquipo, EstadoReserva, Reserva

# Inventario de referencia: (nombre, código, categoría, estado).
#
# Los códigos son internos del laboratorio, porque buena parte de estos
# artículos no trae número de serie de fábrica (decisión D-6 de la
# especificación): un cortafríos o una bolsa de jumpers se rotulan a mano.
#
# Los kits (jumpers, LEDs) se registran como UN equipo cada uno, no por
# unidad suelta (decisión D-7).
EQUIPOS = [
    # Microcontroladores
    ("Arduino Uno R3", "ARD-UNO-001", "Microcontroladores", EstadoEquipo.DISPONIBLE),
    ("Arduino Uno R3", "ARD-UNO-002", "Microcontroladores", EstadoEquipo.DISPONIBLE),
    ("Arduino Nano", "ARD-NANO-001", "Microcontroladores", EstadoEquipo.DISPONIBLE),
    ("ESP32 DevKit V1", "ESP32-001", "Microcontroladores", EstadoEquipo.DISPONIBLE),
    ("ESP32 DevKit V1", "ESP32-002", "Microcontroladores", EstadoEquipo.MANTENIMIENTO),
    # Computadores
    ("Raspberry Pi 4 Model B 4GB", "RPI4-001", "Computadores", EstadoEquipo.DISPONIBLE),
    ("Raspberry Pi 4 Model B 8GB", "RPI4-002", "Computadores", EstadoEquipo.DISPONIBLE),
    # Prototipado
    ("Protoboard 830 puntos", "PROTO-001", "Prototipado", EstadoEquipo.DISPONIBLE),
    ("Protoboard 830 puntos", "PROTO-002", "Prototipado", EstadoEquipo.DISPONIBLE),
    ("Kit jumpers macho-macho (40 u.)", "JUMP-MM-01", "Prototipado", EstadoEquipo.DISPONIBLE),
    ("Kit jumpers macho-hembra (40 u.)", "JUMP-MH-01", "Prototipado", EstadoEquipo.DISPONIBLE),
    ("Kit LEDs surtidos (50 u.)", "LED-KIT-01", "Prototipado", EstadoEquipo.DISPONIBLE),
    ("Caja de resistencias surtidas", "RES-KIT-01", "Prototipado", EstadoEquipo.DISPONIBLE),
    # Cables
    ("Cable HDMI 1.5 m", "CAB-HDMI-001", "Cables", EstadoEquipo.DISPONIBLE),
    ("Cable HDMI 3 m", "CAB-HDMI-002", "Cables", EstadoEquipo.DISPONIBLE),
    ("Cable de red Cat6 2 m", "CAB-RED-001", "Cables", EstadoEquipo.DISPONIBLE),
    ("Cable de red Cat6 5 m", "CAB-RED-002", "Cables", EstadoEquipo.DISPONIBLE),
    ("Cable USB-C 1 m", "CAB-USBC-001", "Cables", EstadoEquipo.DISPONIBLE),
    # Herramientas
    ("Crimpadora RJ45", "HERR-CRIMP-001", "Herramientas", EstadoEquipo.DISPONIBLE),
    ("Cortafríos", "HERR-CORTA-001", "Herramientas", EstadoEquipo.DISPONIBLE),
    ("Kit destornilladores de precisión", "HERR-DEST-001", "Herramientas", EstadoEquipo.DISPONIBLE),
    ("Tester / multímetro digital", "HERR-TEST-001", "Herramientas", EstadoEquipo.DISPONIBLE),
    ("Tester / multímetro digital", "HERR-TEST-002", "Herramientas", EstadoEquipo.DAÑADO),
]

# Reservas de ejemplo: (código del equipo, nombre, correo, día, hora inicio,
# duración en horas, estado).
#
# Los días se cuentan desde mañana, para que los datos sigan teniendo sentido
# sin importar cuándo se ejecute el script.
#
# El Arduino ARD-UNO-001 acumula varias a propósito, para que el ranking del
# endpoint de estadísticas muestre un ganador claro. Las franjas del mismo
# equipo son consecutivas o de días distintos, así que ninguna se solapa.
RESERVAS = [
    ("ARD-UNO-001", "Daniel Holder", "daniel@udea.edu.co", 1, 9, 2, EstadoReserva.ACTIVA),
    ("ARD-UNO-001", "Ana Restrepo", "ana@udea.edu.co", 1, 11, 2, EstadoReserva.ACTIVA),
    ("ARD-UNO-001", "Carlos Mesa", "carlos@udea.edu.co", 2, 14, 3, EstadoReserva.ACTIVA),
    ("ARD-UNO-001", "Laura Gómez", "laura@udea.edu.co", 3, 8, 2, EstadoReserva.CANCELADA),
    ("ESP32-001", "Daniel Holder", "daniel@udea.edu.co", 1, 10, 4, EstadoReserva.ACTIVA),
    ("ESP32-001", "Ana Restrepo", "ana@udea.edu.co", 2, 9, 2, EstadoReserva.ACTIVA),
    ("ESP32-001", "Carlos Mesa", "carlos@udea.edu.co", 4, 15, 2, EstadoReserva.ACTIVA),
    ("RPI4-001", "Laura Gómez", "laura@udea.edu.co", 1, 8, 6, EstadoReserva.ACTIVA),
    ("RPI4-001", "Daniel Holder", "daniel@udea.edu.co", 3, 9, 3, EstadoReserva.ACTIVA),
    ("PROTO-001", "Ana Restrepo", "ana@udea.edu.co", 2, 10, 2, EstadoReserva.ACTIVA),
    ("HERR-CRIMP-001", "Carlos Mesa", "carlos@udea.edu.co", 1, 13, 1, EstadoReserva.ACTIVA),
    ("HERR-CRIMP-001", "Laura Gómez", "laura@udea.edu.co", 5, 9, 2, EstadoReserva.ACTIVA),
    ("CAB-RED-001", "Daniel Holder", "daniel@udea.edu.co", 2, 16, 1, EstadoReserva.ACTIVA),
]


def cargar_datos() -> None:
    """Inserta los equipos y reservas de ejemplo que aún no existan.

    Antes de insertar, consulta qué números de serie hay ya en la base, de modo
    que ejecutar el script dos veces no duplique el inventario ni falle por
    violar la restricción de unicidad.

    Las reservas solo se cargan si la tabla está vacía: al depender de fechas
    relativas al día actual, volver a insertarlas en otra ejecución crearía
    solapamientos con las anteriores.
    """
    db = SessionLocal()

    try:
        # --- Equipos -------------------------------------------------------
        codigos_existentes = set(db.scalars(select(Equipo.numero_serie)).all())

        nuevos = [
            Equipo(nombre=nombre, numero_serie=codigo, categoria=categoria, estado=estado)
            for nombre, codigo, categoria, estado in EQUIPOS
            if codigo not in codigos_existentes
        ]

        if nuevos:
            db.add_all(nuevos)
            db.commit()
            print(f"✓ {len(nuevos)} equipos insertados")
        else:
            print("• Los equipos ya estaban cargados, no se insertó ninguno")

        # --- Reservas ------------------------------------------------------
        if db.scalar(select(Reserva.id)) is not None:
            print("• Ya había reservas registradas, no se insertó ninguna")
            return

        # Diccionario código -> id, para traducir los códigos de la lista de
        # arriba a los identificadores que asignó la base de datos.
        ids_por_codigo = {
            codigo: id_equipo
            for id_equipo, codigo in db.execute(
                select(Equipo.id, Equipo.numero_serie)
            ).all()
        }

        # Mañana a las 00:00 UTC, como punto de partida de las fechas.
        manana = (datetime.now(timezone.utc) + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        reservas = []
        for codigo, nombre, correo, dia, hora, duracion, estado in RESERVAS:
            inicio = manana + timedelta(days=dia - 1, hours=hora)
            reservas.append(
                Reserva(
                    equipo_id=ids_por_codigo[codigo],
                    solicitante_nombre=nombre,
                    solicitante_correo=correo,
                    fecha_hora_inicio=inicio,
                    fecha_hora_fin=inicio + timedelta(hours=duracion),
                    estado=estado,
                )
            )

        db.add_all(reservas)
        db.commit()
        print(f"✓ {len(reservas)} reservas insertadas")

    finally:
        db.close()


if __name__ == "__main__":
    # Este bloque solo se ejecuta al lanzar el archivo como script
    # (python -m app.datos_ejemplo), no al importarlo desde otro módulo.
    print("Cargando datos de ejemplo del inventario del LIS…")
    cargar_datos()
    print("Listo. Prueba la API en http://localhost:8000/docs")
