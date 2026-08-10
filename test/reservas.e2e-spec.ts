import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { Rol } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Reservas - regla de solapamiento (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let equipoId: string;
  let token: string;
  let adminToken: string;
  let correoAuth: string;
  let correoAdmin: string;

  const usuario = { nombreUsuario: 'Test E2E', correoUsuario: 'test.e2e@udea.edu.co' };
  const franja = (inicioH: number, finH: number) => ({
    inicio: `2026-09-01T${String(inicioH).padStart(2, '0')}:00:00Z`,
    fin: `2026-09-01T${String(finH).padStart(2, '0')}:00:00Z`,
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    correoAdmin = `admin.e2e.${Date.now()}@udea.edu.co`;
    await prisma.usuario.create({
      data: {
        nombre: 'Admin E2E',
        correo: correoAdmin,
        hashContrasena: await bcrypt.hash('claveAdmin123', 10),
        rol: Rol.ADMIN,
      },
    });
    const admin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ correo: correoAdmin, contrasena: 'claveAdmin123' })
      .expect(200);
    adminToken = admin.body.token;

    const res = await request(app.getHttpServer())
      .post('/equipos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Equipo Test E2E', serial: `TEST-${Date.now()}`, categoria: 'REDES' })
      .expect(201);
    equipoId = res.body.id;

    correoAuth = `test.auth.${Date.now()}@udea.edu.co`;
    const auth = await request(app.getHttpServer())
      .post('/auth/registro')
      .send({ nombre: 'Test Auth', correo: correoAuth, contrasena: 'claveDePrueba1' })
      .expect(201);
    token = auth.body.token;
    usuario.correoUsuario = correoAuth;
  });

  afterAll(async () => {
    await prisma.auditoria.deleteMany({ where: { actorCorreo: { in: [correoAuth, correoAdmin] } } });
    await prisma.reserva.deleteMany({ where: { equipoId } });
    await prisma.equipo.delete({ where: { id: equipoId } });
    for (const correo of [correoAuth, correoAdmin]) {
      const cuenta = await prisma.usuario.findUnique({ where: { correo } });
      if (cuenta) {
        await prisma.tokenRefresh.deleteMany({ where: { usuarioId: cuenta.id } });
        await prisma.usuario.delete({ where: { id: cuenta.id } });
      }
    }
    await app.close();
  });

  it('rechaza con 401 una reserva sin token', async () => {
    await request(app.getHttpServer())
      .post('/reservas')
      .send({ equipoId, ...usuario, ...franja(8, 10) })
      .expect(401);
  });

  it('crea una reserva en una franja libre', async () => {
    await request(app.getHttpServer())
      .post('/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ equipoId, ...usuario, ...franja(8, 10) })
      .expect(201);
  });

  it('rechaza con 409 una franja idéntica', async () => {
    await request(app.getHttpServer())
      .post('/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ equipoId, ...usuario, ...franja(8, 10) })
      .expect(409);
  });

  it('rechaza con 409 un solapamiento parcial', async () => {
    await request(app.getHttpServer())
      .post('/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ equipoId, ...usuario, ...franja(9, 11) })
      .expect(409);
  });

  it('rechaza con 409 una franja que contiene a la existente', async () => {
    await request(app.getHttpServer())
      .post('/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ equipoId, ...usuario, ...franja(7, 12) })
      .expect(409);
  });

  it('permite una franja contigua (los bordes exactos no chocan)', async () => {
    await request(app.getHttpServer())
      .post('/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ equipoId, ...usuario, ...franja(10, 12) })
      .expect(201);
  });

  it('una reserva cancelada libera la franja', async () => {
    const res = await request(app.getHttpServer())
      .post('/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ equipoId, ...usuario, ...franja(14, 16) })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/reservas/${res.body.id}/cancelar`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app.getHttpServer())
      .post('/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ equipoId, ...usuario, ...franja(14, 16) })
      .expect(201);
  });

  it('rechaza con 400 una franja con fin anterior al inicio', async () => {
    await request(app.getHttpServer())
      .post('/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ equipoId, ...usuario, inicio: franja(8, 10).fin, fin: franja(8, 10).inicio })
      .expect(400);
  });

  it('rechaza con 400 la reserva de un equipo en mantenimiento', async () => {
    await request(app.getHttpServer())
      .patch(`/equipos/${equipoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ estado: 'MANTENIMIENTO' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ equipoId, ...usuario, ...franja(18, 20) })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/equipos/${equipoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ estado: 'DISPONIBLE' })
      .expect(200);
  });

  it('rechaza con 403 la creación de equipos sin rol admin', async () => {
    await request(app.getHttpServer())
      .post('/equipos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'No debería crearse', serial: `NOPE-${Date.now()}`, categoria: 'REDES' })
      .expect(403);
  });

  it('un usuario normal solo ve sus propias reservas', async () => {
    const res = await request(app.getHttpServer())
      .get('/reservas')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const ajenas = res.body.datos.filter((r: { correoUsuario: string }) => r.correoUsuario !== correoAuth);
    expect(ajenas).toHaveLength(0);
  });

  it('el listado de usuarios exige rol admin', async () => {
    await request(app.getHttpServer())
      .get('/usuarios')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('un admin puede cambiar el rol de otro usuario, pero no el propio', async () => {
    const objetivo = await prisma.usuario.findUnique({ where: { correo: correoAuth } });
    await request(app.getHttpServer())
      .patch(`/usuarios/${objetivo!.id}/rol`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rol: 'ADMIN' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/usuarios/${objetivo!.id}/rol`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rol: 'USUARIO' })
      .expect(200);

    const admin = await prisma.usuario.findUnique({ where: { correo: correoAdmin } });
    await request(app.getHttpServer())
      .patch(`/usuarios/${admin!.id}/rol`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rol: 'USUARIO' })
      .expect(400);
  });

  it('las acciones administrativas quedan en el log de auditoría', async () => {
    await request(app.getHttpServer())
      .get('/auditoria')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    const res = await request(app.getHttpServer())
      .get('/auditoria?accion=EQUIPO_CREADO&limite=50')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const registro = res.body.datos.find(
      (a: { entidadId: string }) => a.entidadId === equipoId,
    );
    expect(registro).toBeDefined();
    expect(registro.actorCorreo).toBe(correoAdmin);
  });

  it('respeta el horario de uso del equipo cuando está configurado', async () => {
    const res = await request(app.getHttpServer())
      .post('/equipos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Impresora Test Horario',
        serial: `HOR-${Date.now()}`,
        categoria: 'IMPRESION_3D',
        horaApertura: 8,
        horaCierre: 18,
      })
      .expect(201);
    const impresoraId = res.body.id;

    // 20:00-21:00 Bogotá (01:00-02:00 UTC) → fuera del horario
    await request(app.getHttpServer())
      .post('/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        equipoId: impresoraId,
        ...usuario,
        inicio: '2026-09-03T01:00:00Z',
        fin: '2026-09-03T02:00:00Z',
      })
      .expect(400);

    // 09:00-11:00 Bogotá (14:00-16:00 UTC) → dentro del horario
    await request(app.getHttpServer())
      .post('/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        equipoId: impresoraId,
        ...usuario,
        inicio: '2026-09-02T14:00:00Z',
        fin: '2026-09-02T16:00:00Z',
      })
      .expect(201);

    await prisma.reserva.deleteMany({ where: { equipoId: impresoraId } });
    await prisma.equipo.delete({ where: { id: impresoraId } });
  });

  it('rechaza con 404 la reserva de un equipo inexistente', async () => {
    await request(app.getHttpServer())
      .post('/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        equipoId: '00000000-0000-4000-8000-000000000000',
        ...usuario,
        ...franja(8, 10),
      })
      .expect(404);
  });
});
