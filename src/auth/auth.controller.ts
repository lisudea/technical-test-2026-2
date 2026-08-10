import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleDto } from './dto/google.dto';
import { CambiarContrasenaDto } from './dto/cambiar-contrasena.dto';
import { RefreshDto } from './dto/refresh.dto';
import { OlvideContrasenaDto } from './dto/olvide-contrasena.dto';
import { RestablecerContrasenaDto } from './dto/restablecer-contrasena.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsuarioActual } from './usuario-actual.decorator';
import type { UsuarioAutenticado } from './usuario-actual.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  @ApiOperation({ summary: 'Crear una cuenta con correo y contraseña' })
  @ApiResponse({ status: 409, description: 'Ya existe una cuenta con ese correo' })
  registro(@Body() dto: RegistroDto) {
    return this.authService.registro(dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Iniciar sesión con correo y contraseña' })
  @ApiResponse({ status: 401, description: 'Credenciales incorrectas' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('google')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Iniciar sesión con Google',
    description:
      'Recibe el ID token del botón de Google, valida que el correo sea institucional (@udea.edu.co) y emite el JWT de la API.',
  })
  @ApiResponse({ status: 401, description: 'Token inválido o correo no institucional' })
  google(@Body() dto: GoogleDto) {
    return this.authService.loginGoogle(dto.idToken);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Renovar la sesión',
    description:
      'Cambia el refresh token por un par nuevo (rotación): el anterior queda revocado y no se puede reutilizar.',
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido, revocado o vencido' })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refrescar(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cerrar sesión (revoca el refresh token)' })
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Post('olvide-contrasena')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Solicitar recuperación de contraseña',
    description:
      'Envía un enlace de recuperación al correo (vence en 1 hora). La respuesta es la misma exista o no la cuenta.',
  })
  olvideContrasena(@Body() dto: OlvideContrasenaDto) {
    return this.authService.olvideContrasena(dto.correo);
  }

  @Post('restablecer-contrasena')
  @HttpCode(200)
  @ApiOperation({ summary: 'Restablecer la contraseña con el token del correo' })
  @ApiResponse({ status: 400, description: 'Token inválido, usado o vencido' })
  restablecerContrasena(@Body() dto: RestablecerContrasenaDto) {
    return this.authService.restablecerContrasena(dto.token, dto.contrasenaNueva);
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Datos del usuario autenticado' })
  perfil(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.authService.perfil(usuario.id);
  }

  @Patch('cambiar-contrasena')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar la contraseña de la cuenta' })
  cambiarContrasena(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body() dto: CambiarContrasenaDto,
  ) {
    return this.authService.cambiarContrasena(usuario.id, dto);
  }
}
