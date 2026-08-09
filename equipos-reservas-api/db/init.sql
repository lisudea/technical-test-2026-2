-- Crea la base de datos local si aún no existe.
-- Las tablas se crean automáticamente al arrancar la aplicación (spring.jpa.hibernate.ddl-auto=update).
--
-- Ejecución desde la raíz del proyecto:
--   mysql -u root -p < db/init.sql
-- (o pega esta línea en MySQL Workbench y ejecútala)
CREATE DATABASE IF NOT EXISTS equipos_lis
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
