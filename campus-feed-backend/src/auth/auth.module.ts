import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';
import passport from 'passport';
import { AtStrategy } from './strategies/at.strategy';
import { RtStrategy } from './strategies/rt.strategy';
@Module({
  imports : [
    PrismaModule,
    PassportModule,
    JwtModule.register({}),

  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AtStrategy,
    RtStrategy

  ]
})
export class AuthModule {}
