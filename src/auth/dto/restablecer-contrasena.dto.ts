import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RestablecerContrasenaDto {
  @ApiProperty({ description: 'Token recibido en el correo de recuperación' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  contrasenaNueva: string;
}
