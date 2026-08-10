import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class RegistroDto {
  @ApiProperty({ example: 'Eduardo De la Hoz' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'eduardo.delahoz@udea.edu.co', description: 'Debe ser institucional' })
  @IsEmail()
  @Matches(/@udea\.edu\.co$/, { message: 'Se requiere un correo institucional @udea.edu.co' })
  correo: string;

  @ApiProperty({ minLength: 8, example: 'miClaveSegura123' })
  @IsString()
  @MinLength(8)
  contrasena: string;
}
