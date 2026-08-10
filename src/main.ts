import './instrument';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Detrás del proxy de Render: usar la IP real del cliente (X-Forwarded-For)
  // para que el rate limit cuente por usuario y no agrupe todo bajo la IP del proxy.
  app.set('trust proxy', 1);

  // Cabeceras de seguridad. CSP desactivada para no romper la UI de /docs (Scalar).
  app.use(helmet({ contentSecurityPolicy: false }));

  // CORS restringido a los orígenes del frontend (coma-separados en CORS_ORIGINS,
  // o FRONTEND_URL como respaldo). Sin config, enableCors() permitía cualquier origen.
  const origenes = (process.env.CORS_ORIGINS ?? process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origenes });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('API LIS - Gestión y Reservas de Equipos')
    .setDescription(
      'Servicios para gestionar el inventario y las reservas de recursos de hardware del Laboratorio Integrado de Sistemas de la Universidad de Antioquia.\n\n' +
        'Los listados soportan paginación (`pagina`, `limite`) y filtros. ' +
        'La creación de reservas valida el solapamiento de franjas horarias y responde `409 Conflict` cuando el equipo ya está reservado.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documento = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('swagger', app, documento);
  app.use('/docs', apiReference({ content: documento, theme: 'purple' }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
