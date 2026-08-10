import { Module } from '@nestjs/common';
import { MascotaController } from './mascota.controller';
import { MascotaService } from './mascota.service';

@Module({
  controllers: [MascotaController],
  providers: [MascotaService],
  exports: [MascotaService],
})
export class MascotaModule {}
