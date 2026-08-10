import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class OlvideContrasenaDto {
  @ApiProperty({ example: 'eduardo.delahoz@udea.edu.co' })
  @IsEmail()
  correo: string;
}
