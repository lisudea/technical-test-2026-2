-- ===========================================================================
-- Catalogo de 15 equipos del Laboratorio Integrado de Sistemas
--
-- Alternativa al DataSeeder de la aplicacion, para aplicar el catalogo
-- directamente sobre una base de datos que ya esta en marcha, sin reiniciar
-- el backend.
--
-- ES IDEMPOTENTE: se puede ejecutar tantas veces como haga falta. El
-- ON CONFLICT sobre serial_number evita duplicados, de modo que solo se
-- insertan los equipos que faltan.
--
-- USO
--   psql "$DB_URL" -f docs/seed-equipos.sql
--
--   o, con parametros sueltos:
--   psql -h HOST -U USUARIO -d BASE -f docs/seed-equipos.sql
--
-- REQUISITO: la tabla `equipment` debe existir. La crea Hibernate al arrancar
-- la aplicacion por primera vez (spring.jpa.hibernate.ddl-auto=update).
-- ===========================================================================

BEGIN;

-- El indice unico sobre serial_number lo crea Hibernate. Esta comprobacion
-- evita un error confuso si se ejecuta el script contra un esquema a medias.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'equipment'
    ) THEN
        RAISE EXCEPTION 'La tabla "equipment" no existe. Arranca la aplicacion una vez para que Hibernate cree el esquema.';
    END IF;
END $$;

INSERT INTO equipment (name, serial_number, category, status, created_at, updated_at)
VALUES
    -- Microcontroladores (6)
    ('Arduino Uno R3',                'MCU-ARD-0001', 'MICROCONTROLLERS', 'AVAILABLE',   NOW(), NOW()),
    ('Arduino Mega 2560',             'MCU-ARD-0002', 'MICROCONTROLLERS', 'AVAILABLE',   NOW(), NOW()),
    ('ESP32 DevKit v1',               'MCU-ESP-0003', 'MICROCONTROLLERS', 'RESERVED',    NOW(), NOW()),
    ('Raspberry Pi 4 Model B',        'MCU-RPI-0004', 'MICROCONTROLLERS', 'MAINTENANCE', NOW(), NOW()),
    ('STM32 Nucleo F401RE',           'MCU-STM-0005', 'MICROCONTROLLERS', 'AVAILABLE',   NOW(), NOW()),
    ('Raspberry Pi Pico W',           'MCU-RPP-0013', 'MICROCONTROLLERS', 'AVAILABLE',   NOW(), NOW()),

    -- Realidad virtual (5)
    ('Meta Quest 3',                  'VR-MQ3-0006',  'VR',               'AVAILABLE',   NOW(), NOW()),
    ('HTC Vive Pro 2',                'VR-HTC-0007',  'VR',               'RESERVED',    NOW(), NOW()),
    ('Valve Index',                   'VR-VAL-0008',  'VR',               'AVAILABLE',   NOW(), NOW()),
    ('Leap Motion Controller',        'VR-LMC-0009',  'VR',               'MAINTENANCE', NOW(), NOW()),
    ('HP Reverb G2',                  'VR-HPR-0014',  'VR',               'AVAILABLE',   NOW(), NOW()),

    -- Redes (4)
    ('Cisco Catalyst 2960',           'NET-CIS-0010', 'NETWORKS',         'AVAILABLE',   NOW(), NOW()),
    ('Router Mikrotik hEX S',         'NET-MKT-0011', 'NETWORKS',         'AVAILABLE',   NOW(), NOW()),
    ('Analizador de espectro WiFi',   'NET-WIF-0012', 'NETWORKS',         'RESERVED',    NOW(), NOW()),
    ('Access Point Ubiquiti UniFi 6', 'NET-UBI-0015', 'NETWORKS',         'AVAILABLE',   NOW(), NOW())

ON CONFLICT (serial_number) DO NOTHING;

COMMIT;

-- ---------------------------------------------------------------------------
-- Comprobacion del resultado
-- ---------------------------------------------------------------------------

SELECT category,
       COUNT(*)                                        AS total,
       COUNT(*) FILTER (WHERE status = 'AVAILABLE')    AS disponibles,
       COUNT(*) FILTER (WHERE status = 'RESERVED')     AS reservados,
       COUNT(*) FILTER (WHERE status = 'MAINTENANCE')  AS mantenimiento
FROM equipment
GROUP BY category
ORDER BY category;

SELECT COUNT(*) AS total_equipos FROM equipment;