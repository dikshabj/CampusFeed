import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';

import { ForgotPasswordDto, LoginDto, ResetPasswordDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AtGuard } from 'src/common/guards/at.guard';
import { RtGuard } from 'src/common/guards/rt.guard';
import  type {Request} from 'express';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}
//public route
    @Post('signup')
    signup(@Body() dto: RegisterDto){
        return this.authService.signup(dto);
    }
//public route
    @HttpCode(HttpStatus.OK)
    @Post('Login')
    login(@Body() dto: LoginDto){
        return this.authService.login(dto);
    }
//protected route
 
    @UseGuards(AtGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
  logout(@Req() req: Request) {
    const user = req.user as any;
    return this.authService.logout(user['sub']);
  }
    @UseGuards(RtGuard)
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    refresh(@Req() req: Request) {
        const user = req.user as any;
        return this.authService.refreshTokens(user['sub'], user['refreshToken']);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    forgotPassword(@Body() dto:ForgotPasswordDto){
        return this.authService.forgotPassword(dto);
    }

    @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

}
