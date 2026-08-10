import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EquiposModule } from './equipos/equipos.module';
import { ReservasModule } from './reservas/reservas.module';
import { EstadisticasModule } from './estadisticas/estadisticas.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuditoriaModule } from './auditoria/auditoria.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    EquiposModule,
    ReservasModule,
    EstadisticasModule,
    UsuariosModule,
    AuditoriaModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
