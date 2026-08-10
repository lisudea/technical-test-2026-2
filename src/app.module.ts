import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EquiposModule } from './equipos/equipos.module';
import { ReservasModule } from './reservas/reservas.module';
import { EstadisticasModule } from './estadisticas/estadisticas.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { MascotaModule } from './mascota/mascota.module';
import { ForoModule } from './foro/foro.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    EquiposModule,
    ReservasModule,
    EstadisticasModule,
    UsuariosModule,
    AuditoriaModule,
    MascotaModule,
    ForoModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_FILTER, useClass: SentryGlobalFilter }],
})
export class AppModule {}
