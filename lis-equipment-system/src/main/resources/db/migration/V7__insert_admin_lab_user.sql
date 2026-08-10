INSERT INTO users (name, email, role, registration_date)
VALUES ('Laboratorio LIS', 'laboratorio.lis@udea.edu.co', 'ADMIN', now())
ON CONFLICT (email) DO NOTHING;