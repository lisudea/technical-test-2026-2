import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CrearReservaDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  equipoId: string;

  @ApiProperty({ example: 'Eduardo De la Hoz' })
  @IsString()
  @IsNotEmpty()
  nombreUsuario: string;

  @ApiProperty({ example: 'eduardo.delahoz@udea.edu.co' })
  @IsEmail()
  correoUsuario: string;

  @ApiProperty({ example: '2026-08-10T08:00:00.000Z' })
  @IsDateString()
  inicio: string;

  @ApiProperty({ example: '2026-08-10T10:00:00.000Z' })
  @IsDateString()
  fin: string;
}
