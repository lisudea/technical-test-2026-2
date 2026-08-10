import { Module } from '@nestjs/common';
import { ForoController } from './foro.controller';
import { ForoService } from './foro.service';
import { ModeracionService } from './moderacion.service';
import { MascotaModule } from '../mascota/mascota.module';

@Module({
  imports: [MascotaModule],
  controllers: [ForoController],
  providers: [ForoService, ModeracionService],
})
export class ForoModule {}
