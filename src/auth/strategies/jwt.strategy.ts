import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      // Look for the token in the Bearer header (CLI) OR in the cookie (Web)
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // 1. Check cookies first (Web Portal)
          if (request?.cookies?.access_token) {
            return request.cookies.access_token;
          }
          // 2. Fallback to Bearer token (CLI Tool)
          const authHeader = request?.headers?.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, role: payload.role };
  }
}
