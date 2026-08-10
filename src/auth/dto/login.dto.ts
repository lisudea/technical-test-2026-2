import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'eduardo.delahoz@udea.edu.co' })
  @IsEmail()
  correo: string;

  @ApiProperty()
  @IsString()
  contrasena: string;
}
