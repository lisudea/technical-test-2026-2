INSERT INTO category (id, name)
SELECT 1, 'MICROCONTROLLERS' WHERE NOT EXISTS (SELECT 1 FROM category WHERE id = 1);
INSERT INTO category (id, name)
SELECT 2, 'VR' WHERE NOT EXISTS (SELECT 1 FROM category WHERE id = 2);
INSERT INTO category (id, name)
SELECT 3, 'NETWORKING' WHERE NOT EXISTS (SELECT 1 FROM category WHERE id = 3);
INSERT INTO category (id, name)
SELECT 4, 'AUDIOVISUAL' WHERE NOT EXISTS (SELECT 1 FROM category WHERE id = 4);
INSERT INTO category (id, name)
SELECT 5, 'COMPUTING' WHERE NOT EXISTS (SELECT 1 FROM category WHERE id = 5);

INSERT INTO operational_status (id, name)
SELECT 1, 'OPERATIONAL' WHERE NOT EXISTS (SELECT 1 FROM operational_status WHERE id = 1);
INSERT INTO operational_status (id, name)
SELECT 2, 'MAINTENANCE' WHERE NOT EXISTS (SELECT 1 FROM operational_status WHERE id = 2);

INSERT INTO reservation_status (id, name)
SELECT 1, 'ACTIVE' WHERE NOT EXISTS (SELECT 1 FROM reservation_status WHERE id = 1);
INSERT INTO reservation_status (id, name)
SELECT 2, 'CANCELLED' WHERE NOT EXISTS (SELECT 1 FROM reservation_status WHERE id = 2);
