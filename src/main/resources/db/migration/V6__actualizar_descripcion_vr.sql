-- =====================================================================
-- V6__actualizar_descripcion_vr.sql
-- Corrige la descripcion de la categoria VR: "Equipos de realidad virtual"
-- en lugar de "Cascos de realidad virtual, controladores, sensores".
-- Migración independiente para no alterar el checksum de V5.
-- =====================================================================
UPDATE categorias
SET descripcion = 'Equipos de realidad virtual'
WHERE nombre = 'VR'
  AND descripcion = 'Cascos de realidad virtual, controladores, sensores';
