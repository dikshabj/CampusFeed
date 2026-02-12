import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';
import passport from 'passport';
@Module({
  imports : [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({}),

  ],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
