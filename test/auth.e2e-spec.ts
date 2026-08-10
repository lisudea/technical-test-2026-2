import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const correo = `auth.flujo.${Date.now()}@udea.edu.co`;
  const contrasena = 'claveInicial123';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    const usuario = await prisma.usuario.findUnique({ where: { correo } });
    if (usuario) {
      await prisma.tokenRefresh.deleteMany({ where: { usuarioId: usuario.id } });
      await prisma.tokenRecuperacion.deleteMany({ where: { usuarioId: usuario.id } });
      await prisma.usuario.delete({ where: { id: usuario.id } });
    }
    await app.close();
  });

  it('registra una cuenta y devuelve token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/registro')
      .send({ nombre: 'Flujo Auth', correo, contrasena })
      .expect(201);

    expect(res.body.token).toBeDefined();
    expect(res.body.usuario.correo).toBe(correo);
  });

  it('rechaza con 409 un registro con correo repetido', async () => {
    await request(app.getHttpServer())
      .post('/auth/registro')
      .send({ nombre: 'Otro', correo, contrasena: 'cualquierClave1' })
      .expect(409);
  });

  it('rechaza con 400 una contraseña corta', async () => {
    await request(app.getHttpServer())
      .post('/auth/registro')
      .send({ nombre: 'Corta', correo: `x.${correo}`, contrasena: 'corta' })
      .expect(400);
  });

  it('inicia sesión y consulta el perfil', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ correo, contrasena })
      .expect(200);

    await request(app.getHttpServer())
      .get('/auth/perfil')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);
  });

  it('rechaza con 401 una contraseña incorrecta', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ correo, contrasena: 'claveEquivocada1' })
      .expect(401);
  });

  it('cambia la contraseña y permite entrar con la nueva', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ correo, contrasena })
      .expect(200);

    await request(app.getHttpServer())
      .patch('/auth/cambiar-contrasena')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ contrasenaActual: contrasena, contrasenaNueva: 'claveNueva456' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ correo, contrasena })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ correo, contrasena: 'claveNueva456' })
      .expect(200);
  });

  it('rechaza con 401 el perfil sin token', async () => {
    await request(app.getHttpServer()).get('/auth/perfil').expect(401);
  });

  it('rechaza con 400 un registro con correo no institucional', async () => {
    await request(app.getHttpServer())
      .post('/auth/registro')
      .send({ nombre: 'Externo', correo: 'externo@gmail.com', contrasena: 'claveLarga123' })
      .expect(400);
  });

  it('rota el refresh token: el usado queda revocado', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ correo, contrasena: 'claveNueva456' })
      .expect(200);

    const refrescado = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(200);

    expect(refrescado.body.token).toBeDefined();
    expect(refrescado.body.refreshToken).not.toBe(login.body.refreshToken);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(401);
  });

  it('el logout revoca el refresh token', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ correo, contrasena: 'claveNueva456' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: login.body.refreshToken })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(401);
  });

  it('olvidé contraseña responde igual exista o no la cuenta', async () => {
    const res1 = await request(app.getHttpServer())
      .post('/auth/olvide-contrasena')
      .send({ correo })
      .expect(200);
    const res2 = await request(app.getHttpServer())
      .post('/auth/olvide-contrasena')
      .send({ correo: 'no.existe@udea.edu.co' })
      .expect(200);
    expect(res1.body.mensaje).toBe(res2.body.mensaje);
  });

  it('lista y revoca sesiones activas por dispositivo', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set('User-Agent', 'iPhone de prueba')
      .send({ correo, contrasena: 'claveNueva456' })
      .expect(200);

    const sesiones = await request(app.getHttpServer())
      .get('/auth/sesiones')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);

    const propia = sesiones.body.find((s: { id: string }) => s.id === login.body.sesionId);
    expect(propia).toBeDefined();
    expect(propia.dispositivo).toBe('iPhone de prueba');

    await request(app.getHttpServer())
      .delete(`/auth/sesiones/${login.body.sesionId}`)
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(401);
  });

  it('rechaza con 400 un token de recuperación inválido', async () => {
    await request(app.getHttpServer())
      .post('/auth/restablecer-contrasena')
      .send({ token: 'token-falso', contrasenaNueva: 'claveCualquiera1' })
      .expect(400);
  });
});
