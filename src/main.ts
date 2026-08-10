import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
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
