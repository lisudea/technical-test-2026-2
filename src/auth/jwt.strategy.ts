import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface PayloadJwt {
  sub: string;
  correo: string;
  nombre: string;
  rol: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'cambia-este-secreto',
    });
  }

  validate(payload: PayloadJwt) {
    return { id: payload.sub, correo: payload.correo, nombre: payload.nombre, rol: payload.rol };
  }
}
