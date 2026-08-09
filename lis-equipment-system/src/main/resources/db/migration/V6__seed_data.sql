-- V4__seed_data.sql

INSERT INTO "equipment" (name, mac_serial_number, category, status) VALUES
('Arduino Uno R3', '00:1A:2B:3C:4D:01', 'MICROCONTROLADORES', 'DISPONIBLE'),
('ESP32 DevKit', '00:1A:2B:3C:4D:02', 'MICROCONTROLADORES', 'DISPONIBLE'),
('Meta Quest 3', 'SN-VR-1001', 'VR', 'DISPONIBLE'),
('HTC Vive Pro', 'SN-VR-1002', 'VR', 'EN_MANTENIMIENTO'),
('Router Cisco 2911', 'SN-NET-2001', 'REDES', 'DISPONIBLE'),
('Switch TP-Link 24p', 'SN-NET-2002', 'REDES', 'DISPONIBLE');

INSERT INTO "users" (name, email, role) VALUES
('María Gómez', 'maria.gomez@udea.edu.co', 'USER');

INSERT INTO "reservation" (id_equipment, id_user, date_start_time, date_end_time, status)
SELECT e.id, u.id, now() + interval '1 day', now() + interval '1 day 2 hours', 'ACTIVE'
FROM "equipment" e, "users" u
WHERE e.mac_serial_number = '00:1A:2B:3C:4D:01' AND u.email = 'maria.gomez@udea.edu.co';