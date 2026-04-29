import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/user.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    UsersModule,      // so we can use UsersService
    PassportModule,
    ConfigModule,
    JwtModule.register({}),  // empty config — we pass secrets per-sign in the service
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
