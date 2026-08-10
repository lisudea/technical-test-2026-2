import { PartialType } from '@nestjs/swagger';
import { CrearEquipoDto } from './crear-equipo.dto';

export class ActualizarEquipoDto extends PartialType(CrearEquipoDto) {}
