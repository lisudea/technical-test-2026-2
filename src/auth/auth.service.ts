import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';
import { CambiarContrasenaDto } from './dto/cambiar-contrasena.dto';

const DOMINIO_INSTITUCIONAL = '@udea.edu.co';
const DIAS_REFRESH = 7;
const MINUTOS_RECUPERACION = 60;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private googleClient?: OAuth2Client;
  private resend?: Resend;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (clientId) this.googleClient = new OAuth2Client(clientId);

    const resendKey = this.config.get<string>('RESEND_API_KEY');
    if (resendKey) this.resend = new Resend(resendKey);
  }

  async registro(dto: RegistroDto, dispositivo?: string) {
    const existente = await this.prisma.usuario.findUnique({ where: { correo: dto.correo } });
    if (existente) throw new ConflictException('Ya existe una cuenta con ese correo');

    const usuario = await this.prisma.usuario.create({
      data: {
        nombre: dto.nombre,
        correo: dto.correo,
        hashContrasena: await bcrypt.hash(dto.contrasena, 10),
      },
    });

    return this.emitirTokens(usuario, dispositivo);
  }

  async login(dto: LoginDto, dispositivo?: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { correo: dto.correo } });
    const valida =
      usuario?.hashContrasena && (await bcrypt.compare(dto.contrasena, usuario.hashContrasena));
    if (!valida) throw new UnauthorizedException('Correo o contraseña incorrectos');

    return this.emitirTokens(usuario, dispositivo);
  }

  async loginGoogle(idToken: string, dispositivo?: string) {
    if (!this.googleClient) {
      throw new ServiceUnavailableException(
        'El inicio de sesión con Google no está configurado (falta GOOGLE_CLIENT_ID)',
      );
    }

    let correo: string | undefined;
    let nombre: string | undefined;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.config.get<string>('GOOGLE_CLIENT_ID'),
      });
      const payload = ticket.getPayload();
      correo = payload?.email;
      nombre = payload?.name;
    } catch {
      throw new UnauthorizedException('Token de Google inválido');
    }

    if (!correo) throw new UnauthorizedException('Token de Google inválido');
    if (!correo.endsWith(DOMINIO_INSTITUCIONAL)) {
      throw new UnauthorizedException(
        `Se requiere un correo institucional ${DOMINIO_INSTITUCIONAL}`,
      );
    }

    const usuario = await this.prisma.usuario.upsert({
      where: { correo },
      update: { nombre: nombre ?? correo },
      create: { correo, nombre: nombre ?? correo },
    });

    return this.emitirTokens(usuario, dispositivo);
  }

  async refrescar(refreshToken: string, dispositivo?: string) {
    const registro = await this.prisma.tokenRefresh.findUnique({
      where: { hashToken: this.hash(refreshToken) },
      include: { usuario: true },
    });

    if (!registro || registro.revocadoEn || registro.expiraEn < new Date()) {
      throw new UnauthorizedException('La sesión expiró, inicia sesión de nuevo');
    }

    await this.prisma.tokenRefresh.update({
      where: { id: registro.id },
      data: { revocadoEn: new Date() },
    });

    return this.emitirTokens(registro.usuario, dispositivo ?? registro.dispositivo ?? undefined);
  }

  async logout(refreshToken: string) {
    await this.prisma.tokenRefresh.updateMany({
      where: { hashToken: this.hash(refreshToken), revocadoEn: null },
      data: { revocadoEn: new Date() },
    });
    return { mensaje: 'Sesión cerrada' };
  }

  async olvideContrasena(correo: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { correo } });

    if (usuario) {
      const token = randomBytes(32).toString('hex');
      await this.prisma.tokenRecuperacion.create({
        data: {
          usuarioId: usuario.id,
          hashToken: this.hash(token),
          expiraEn: new Date(Date.now() + MINUTOS_RECUPERACION * 60 * 1000),
        },
      });

      const base = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
      const enlace = `${base}/restablecer-contrasena?token=${token}`;

      if (this.resend) {
        await this.resend.emails.send({
          from: 'LIS <onboarding@resend.dev>',
          to: correo,
          subject: 'Recuperación de contraseña - LIS',
          html: `<p>Hola ${usuario.nombre},</p>
            <p>Recibimos una solicitud para restablecer tu contraseña. El enlace vence en ${MINUTOS_RECUPERACION} minutos:</p>
            <p><a href="${enlace}">Restablecer contraseña</a></p>
            <p>Si no fuiste tú, ignora este correo.</p>`,
        });
      } else {
        this.logger.warn(`RESEND_API_KEY no configurada. Enlace de recuperación: ${enlace}`);
      }
    }

    return { mensaje: 'Si el correo está registrado, enviamos un enlace de recuperación' };
  }

  async restablecerContrasena(token: string, contrasenaNueva: string) {
    const registro = await this.prisma.tokenRecuperacion.findUnique({
      where: { hashToken: this.hash(token) },
    });

    if (!registro || registro.usadoEn || registro.expiraEn < new Date()) {
      throw new BadRequestException('El enlace de recuperación es inválido o ya venció');
    }

    await this.prisma.$transaction([
      this.prisma.usuario.update({
        where: { id: registro.usuarioId },
        data: { hashContrasena: await bcrypt.hash(contrasenaNueva, 10) },
      }),
      this.prisma.tokenRecuperacion.update({
        where: { id: registro.id },
        data: { usadoEn: new Date() },
      }),
      this.prisma.tokenRefresh.updateMany({
        where: { usuarioId: registro.usuarioId, revocadoEn: null },
        data: { revocadoEn: new Date() },
      }),
    ]);

    return { mensaje: 'Contraseña restablecida, ya puedes iniciar sesión' };
  }

  async cambiarContrasena(usuarioId: string, dto: CambiarContrasenaDto) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) throw new UnauthorizedException();
    if (!usuario.hashContrasena) {
      throw new BadRequestException(
        'Esta cuenta ingresa con Google y no tiene contraseña propia',
      );
    }

    const valida = await bcrypt.compare(dto.contrasenaActual, usuario.hashContrasena);
    if (!valida) throw new UnauthorizedException('La contraseña actual no coincide');

    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { hashContrasena: await bcrypt.hash(dto.contrasenaNueva, 10) },
    });

    return { mensaje: 'Contraseña actualizada' };
  }

  async perfil(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, nombre: true, correo: true, creadoEn: true },
    });
    if (!usuario) throw new UnauthorizedException();
    return usuario;
  }

  private hash(valor: string) {
    return createHash('sha256').update(valor).digest('hex');
  }

  private async emitirTokens(usuario: Usuario, dispositivo?: string) {
    const refreshToken = randomBytes(48).toString('hex');
    const sesion = await this.prisma.tokenRefresh.create({
      data: {
        usuarioId: usuario.id,
        hashToken: this.hash(refreshToken),
        dispositivo: dispositivo?.slice(0, 300),
        expiraEn: new Date(Date.now() + DIAS_REFRESH * 24 * 60 * 60 * 1000),
      },
    });

    return {
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
      token: this.jwt.sign({
        sub: usuario.id,
        correo: usuario.correo,
        nombre: usuario.nombre,
        rol: usuario.rol,
      }),
      refreshToken,
      sesionId: sesion.id,
    };
  }

  async listarSesiones(usuarioId: string) {
    return this.prisma.tokenRefresh.findMany({
      where: { usuarioId, revocadoEn: null, expiraEn: { gt: new Date() } },
      select: { id: true, dispositivo: true, creadoEn: true, expiraEn: true },
      orderBy: { creadoEn: 'desc' },
    });
  }

  async revocarSesion(usuarioId: string, sesionId: string) {
    const resultado = await this.prisma.tokenRefresh.updateMany({
      where: { id: sesionId, usuarioId, revocadoEn: null },
      data: { revocadoEn: new Date() },
    });
    if (resultado.count === 0) throw new NotFoundException('Sesión no encontrada');
    return { mensaje: 'Sesión revocada' };
  }
}
